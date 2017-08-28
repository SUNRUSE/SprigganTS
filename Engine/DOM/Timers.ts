let TimeAtLastInvoke: number | undefined = undefined
let CurrentTime = 0

type CallbackQueueItem = {
    readonly At: number
    readonly Call: () => void
}

const CallbackQueue: CallbackQueueItem[] = []

function AddToCallbackQueue(item: CallbackQueueItem) {
    let index = 0;
    while (index < CallbackQueue.length && CallbackQueue[index].At <= item.At) index++
    CallbackQueue.splice(index, 0, item)
}

let AnimationFrame: number | undefined = undefined
let Timeout: number | undefined = undefined
let Interval: number | undefined = undefined

if ("onfocusout" in document) {
    // IE8.
    (document as any).onfocusout = FocusLost
} else {
    onblur = FocusLost
}

if ("onfocusin" in document) {
    // IE8.
    (document as any).onfocusin = FocusRegained
} else {
    onfocus = FocusRegained
}

let shadeElement: HTMLDivElement | undefined

function InternalFocused() { return !shadeElement }
const InternalFocusedChanged = new RecurringEvent<() => void>()

function ResizeShade() {
    if (!shadeElement) return
    shadeElement.style.width = `${Display.RealWidthPixels()}px`
    shadeElement.style.height = `${Display.RealHeightPixels()}px`
}

function FocusLost(localEvent: Event) {
    // Some browsers only provide event as a global, and some only as an argument.
    localEvent = localEvent || event
    // On IE8, this is a bubbling event and can be triggered by clicking elements.
    // We need to check that no element changes have occurred, otherwise the shade appears on every click.
    if ((localEvent as any).toElement) return
    if ((localEvent as any).fromElement) return
    // IE9 uses this instead.
    if ((localEvent as any).relatedTarget) return
    if (!shadeElement) {
        shadeElement = document.createElement("div")
        shadeElement.style.position = "absolute"
        shadeElement.style.left = "0"
        shadeElement.style.top = "0"
        ResizeShade()

        shadeElement.style.background = "black"
        if ("opacity" in shadeElement.style) {
            shadeElement.style.opacity = "0.5"
        } else {
            ; (shadeElement.style as any).filter = "alpha(opacity=50)" // IE8.
        }
        document.body.appendChild(shadeElement)

        InternalInvoke(() => SceneRoot.Instance.Pause())

        if (AnimationFrame !== undefined) {
            window.cancelAnimationFrame(AnimationFrame)
            AnimationFrame = undefined
        }

        if (Timeout !== undefined) {
            clearTimeout(Timeout)
            Timeout = undefined
        }

        if (Interval !== undefined) {
            clearInterval(Interval)
            Interval = undefined
        }
    }
}

function FocusRegained() {
    if (shadeElement) {
        // Keep the shade there to block the click.
        const shadeElementReference = shadeElement
        setTimeout(() => document.body.removeChild(shadeElementReference), 150)
        shadeElement = undefined

        InternalFocusedChanged.Raise()
        TimeAtLastInvoke = undefined
        InternalInvoke(() => SceneRoot.Instance.Resume())
    }
}

let Recursing = false

// Called by the engine when an event needs to be handled, to update timers after.
// You should not need to call this yourself.
function InternalInvoke(callback?: () => void) {
    if (Recursing) throw new Error("Timers.Update should not be called recursively")
    Recursing = true
    const time = (+new Date()) / 1000
    let delta = 0
    if (TimeAtLastInvoke !== undefined) {
        delta = time - TimeAtLastInvoke
        // We want to cap this delta to a sensible range, so devices asleep for an hour do not try and simulate an hours' gameplay before responding.
        // However, if a long timer was set, then we shouldn't act like it hasn't elapsed!
        if (CallbackQueue.length && CallbackQueue[0].At - CurrentTime > 0.125) {
            delta = Math.min(CallbackQueue[0].At - CurrentTime, delta)
        } else {
            delta = Math.min(0.125, delta)
        }
    }
    const newCurrentTime = CurrentTime + delta
    TimeAtLastInvoke = time

    if (callback) {
        CurrentTime = newCurrentTime
        if (CallbackQueue.length && CallbackQueue[0].At < CurrentTime) CurrentTime = CallbackQueue[0].At
        callback()
    }

    while (true) {
        if (!CallbackQueue.length || CallbackQueue[0].At > newCurrentTime) break
        const item = CallbackQueue.shift()
        if (!item) break // Impossible, but TypeScript cannot know it.
        CurrentTime = item.At
        item.Call()
    }

    CurrentTime = newCurrentTime
    const futureTickRequired = SceneRoot.Instance.Tick()

    if (Timeout !== undefined) {
        clearTimeout(Timeout)
        Timeout = undefined
    }

    if (futureTickRequired) {
        if ("requestAnimationFrame" in window) {
            if (AnimationFrame === undefined) {
                AnimationFrame = requestAnimationFrame(() => {
                    AnimationFrame = undefined
                    InternalInvoke()
                })
            }
        } else {
            if (Interval === undefined) {
                Interval = setInterval(InternalInvoke, 50) as any // todo
            }
        }
    } else {
        if (AnimationFrame !== undefined) {
            cancelAnimationFrame(AnimationFrame)
            AnimationFrame = undefined
        }
        if (Interval !== undefined) {
            clearInterval(Interval)
            Interval = undefined
        }
        if (CallbackQueue.length) {
            Timeout = setTimeout(() => {
                Timeout = undefined
                InternalInvoke()
            },
                1000 * (
                    CallbackQueue[0].At - CurrentTime
                    - (((+new Date()) / 1000) - TimeAtLastInvoke) // If processing the above loop took significant time, skip that much of the delay.
                )
            ) as any // todo
        }
    }

    Recursing = false
}

class Timer {
    private CompletedValue = false
    private StartedAt: number
    private CancelledElapsed: number | undefined = undefined
    private PausedElapsed: number | undefined = undefined
    private CallbackQueueItem: CallbackQueueItem

    public readonly DurationSeconds: number

    constructor(durationSeconds: number, onCompletionIfUninterrupted: () => void) {
        this.DurationSeconds = durationSeconds

        this.StartedAt = CurrentTime

        this.CallbackQueueItem = {
            At: CurrentTime + durationSeconds,
            Call: () => {
                this.CompletedValue = true
                onCompletionIfUninterrupted()
            }
        }
        AddToCallbackQueue(this.CallbackQueueItem)
    }

    readonly Cancelled = () => this.CancelledElapsed !== undefined
    readonly Completed = () => this.CompletedValue
    readonly Paused = () => this.PausedElapsed !== undefined

    readonly ElapsedSeconds = () => {
        if (this.PausedElapsed !== undefined) return this.PausedElapsed
        if (this.CancelledElapsed !== undefined) return this.CancelledElapsed
        return Math.min(this.DurationSeconds, CurrentTime - this.StartedAt)
    }

    readonly ElapsedUnitInterval = () => {
        if (this.DurationSeconds == 0) return 1
        return this.ElapsedSeconds() / this.DurationSeconds
    }

    Cancel(): Timer {
        if (this.Cancelled() || this.Completed()) return this
        this.CancelledElapsed = this.ElapsedSeconds()
        if (!this.Paused()) {
            Remove(CallbackQueue, this.CallbackQueueItem)
        }
        return this
    }

    Pause(): Timer {
        if (this.Paused() || this.Cancelled() || this.Completed()) return this
        this.PausedElapsed = this.ElapsedSeconds()
        Remove(CallbackQueue, this.CallbackQueueItem)
        return this
    }

    Resume(): Timer {
        if (this.Cancelled() || this.Completed()) return this
        if (this.PausedElapsed === undefined) return this
        this.StartedAt = CurrentTime - this.PausedElapsed
        this.CallbackQueueItem = {
            At: CurrentTime + this.DurationSeconds - this.PausedElapsed,
            Call: this.CallbackQueueItem.Call
        }
        AddToCallbackQueue(this.CallbackQueueItem)
        this.PausedElapsed = undefined
        return this
    }
}

class RecurringTimer {
    readonly IntervalSeconds: number

    private CallbackQueueItem: CallbackQueueItem

    private StoppedValue = false
    private PausedElapsed?: number
    private ThisLoopStartedAt: number
    private CompletedLoopsValue = 0

    constructor(intervalSeconds: number, onInterval: () => void) {
        this.IntervalSeconds = intervalSeconds
        this.ThisLoopStartedAt = CurrentTime

        const onIntervalHandler = () => {
            this.ThisLoopStartedAt = CurrentTime
            this.CompletedLoopsValue++
            onInterval()
            this.CallbackQueueItem = {
                At: CurrentTime + intervalSeconds,
                Call: onIntervalHandler
            }
            AddToCallbackQueue(this.CallbackQueueItem)
        }

        this.CallbackQueueItem = {
            At: CurrentTime + intervalSeconds,
            Call: onIntervalHandler
        }

        AddToCallbackQueue(this.CallbackQueueItem)
    }

    readonly Stopped = () => this.StoppedValue

    readonly Paused = () => this.PausedElapsed !== undefined

    readonly ElapsedSecondsThisLoop = () => {
        if (this.PausedElapsed !== undefined) return this.PausedElapsed
        return CurrentTime - this.ThisLoopStartedAt
    }

    readonly ElapsedUnitIntervalThisLoop = () => this.ElapsedSecondsThisLoop() / this.IntervalSeconds

    readonly CompletedLoops = () => this.CompletedLoopsValue

    readonly TotalElapsedSeconds = () => this.CompletedLoops() * this.IntervalSeconds + this.ElapsedSecondsThisLoop()

    readonly TotalElapsedUnitInterval = () => this.TotalElapsedSeconds() / this.IntervalSeconds

    Stop(): RecurringTimer {
        if (this.Stopped()) return this
        this.StoppedValue = true
        if (!this.Paused()) {
            Remove(CallbackQueue, this.CallbackQueueItem)
        }
        return this
    }

    Pause(): RecurringTimer {
        if (this.Stopped() || this.Paused()) return this
        this.PausedElapsed = this.ElapsedSecondsThisLoop()
        Remove(CallbackQueue, this.CallbackQueueItem)
        return this
    }

    Resume(): RecurringTimer {
        if (this.Stopped() || this.PausedElapsed === undefined) return this
        this.ThisLoopStartedAt = CurrentTime - this.PausedElapsed
        this.CallbackQueueItem = {
            At: this.ThisLoopStartedAt + this.IntervalSeconds,
            Call: this.CallbackQueueItem.Call
        }
        AddToCallbackQueue(this.CallbackQueueItem)
        this.PausedElapsed = undefined
        return this
    }
}