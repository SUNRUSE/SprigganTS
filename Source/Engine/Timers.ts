namespace Timers {
    let TimeAtLastInvoke: number | undefined = undefined
    let CurrentTime = 0

    const TickCallbacks: (() => void)[] = []

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

    let Recursing = false

    // Called by the engine when an event needs to be handled, to update timers after.
    // You should not need to call this yourself.
    export function InternalInvoke(callback?: () => void) {
        if (Recursing) throw new Error("Timers.Update should not be called recursively")
        Recursing = true
        const time = (+new Date()) / 1000
        const newCurrentTime = CurrentTime + (TimeAtLastInvoke === undefined ? 0 : Math.min(0.125, time - TimeAtLastInvoke))
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
        for (const tickCallback of TickCallbacks.slice()) tickCallback()

        if (Timeout !== undefined) {
            clearTimeout(Timeout)
            Timeout = undefined
        }

        if (TickCallbacks.length) {
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
                    CallbackQueue[0].At - CurrentTime
                    - (((+new Date()) / 1000) - TimeAtLastInvoke) // If processing the above loop took significant time, skip that much of the delay.
                ) as any // todo
            }
        }

        Recursing = false
    }

    export type OnceCallback = (elapsedSeconds: number, elapsedUnitInterval: number) => void

    export class Once {
        private CompletedValue = false
        private StartedAt: number
        private CancelledElapsed: number | undefined = undefined
        private PausedElapsed: number | undefined = undefined
        private CallbackQueueItem: CallbackQueueItem
        private readonly TickCallback: (() => void) | undefined

        public readonly DurationSeconds: number

        private readonly OnCancellation?: OnceCallback
        private readonly OnPause?: OnceCallback
        private readonly OnResume?: OnceCallback

        constructor(durationSeconds: number, onCompletion?: () => void, onCancellation?: OnceCallback, onTick?: OnceCallback, onPause?: OnceCallback, onResume?: OnceCallback) {
            this.DurationSeconds = durationSeconds
            this.OnCancellation = onCancellation
            this.OnPause = onPause
            this.OnResume = onResume

            this.StartedAt = CurrentTime

            this.CallbackQueueItem = {
                At: CurrentTime + durationSeconds,
                Call: () => {
                    this.CompletedValue = true
                    if (onCompletion) onCompletion()
                    if (this.TickCallback) Remove(TickCallbacks, this.TickCallback)
                }
            }
            AddToCallbackQueue(this.CallbackQueueItem)

            if (onTick) {
                this.TickCallback = () => onTick(this.ElapsedSeconds(), this.ElapsedUnitInterval())
                TickCallbacks.push(this.TickCallback)
            }
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

        readonly Cancel = () => {
            if (this.Cancelled() || this.Completed()) return
            this.CancelledElapsed = this.ElapsedSeconds()
            if (!this.Paused()) {
                Remove(CallbackQueue, this.CallbackQueueItem)
                if (this.OnCancellation) this.OnCancellation(this.ElapsedSeconds(), this.ElapsedUnitInterval())
                if (this.TickCallback) Remove(TickCallbacks, this.TickCallback)
            }
        }

        readonly Pause = () => {
            if (this.Paused() || this.Cancelled() || this.Completed()) return
            this.PausedElapsed = this.ElapsedSeconds()
            Remove(CallbackQueue, this.CallbackQueueItem)
            if (this.TickCallback) Remove(TickCallbacks, this.TickCallback)
            if (this.OnPause) this.OnPause(this.ElapsedSeconds(), this.ElapsedUnitInterval())
        }

        readonly Resume = () => {
            if (this.Cancelled() || this.Completed()) return
            if (this.PausedElapsed === undefined) return
            this.StartedAt = CurrentTime - this.PausedElapsed
            this.CallbackQueueItem = {
                At: CurrentTime + this.DurationSeconds - this.PausedElapsed,
                Call: this.CallbackQueueItem.Call
            }
            AddToCallbackQueue(this.CallbackQueueItem)
            if (this.TickCallback) TickCallbacks.push(this.TickCallback)
            this.PausedElapsed = undefined
            if (this.OnResume) this.OnResume(this.ElapsedSeconds(), this.ElapsedUnitInterval())
        }
    }

    export type RecurringIntervalCallback = (completedLoopsInclusive: number, totalElapsedSeconds: number) => void
    export type RecurringCallback = (elapsedSecondsThisLoop: number, elapsedUnitIntervalThisLoop: number, completedLoopsInclusive: number, totalElapsedSeconds: number, totalElapsedUnitInterval: number) => void

    export class Recurring {
        readonly IntervalSeconds: number

        private CallbackQueueItem: CallbackQueueItem
        private readonly TickCallback?: () => void
        private readonly OnStop?: RecurringCallback
        private readonly OnPause?: RecurringCallback
        private readonly OnResume?: RecurringCallback

        private StoppedValue = false
        private PausedElapsed?: number
        private ThisLoopStartedAt: number
        private CompletedLoopsValue = 0

        constructor(intervalSeconds: number, onInterval?: RecurringIntervalCallback, onStop?: RecurringCallback, onTick?: RecurringCallback, onPause?: RecurringCallback, onResume?: RecurringCallback) {
            this.IntervalSeconds = intervalSeconds
            this.ThisLoopStartedAt = CurrentTime

            const onIntervalHandler = () => {
                this.ThisLoopStartedAt = CurrentTime
                this.CompletedLoopsValue++
                if (onInterval) onInterval(this.CompletedLoops(), this.TotalElapsedSeconds())
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

            if (onTick) {
                this.TickCallback = () => onTick(this.ElapsedSecondsThisLoop(), this.ElapsedUnitIntervalThisLoop(), this.CompletedLoops(), this.TotalElapsedSeconds(), this.TotalElapsedUnitInterval())
                TickCallbacks.push(this.TickCallback)
            }
            this.OnStop = onStop
            this.OnPause = onPause
            this.OnResume = onResume
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

        readonly Stop = () => {
            if (this.Stopped()) return
            this.StoppedValue = true
            if (!this.Paused()) {
                Remove(CallbackQueue, this.CallbackQueueItem)
                if (this.TickCallback) Remove(TickCallbacks, this.TickCallback)
            }
            if (this.OnStop) this.OnStop(this.ElapsedSecondsThisLoop(), this.ElapsedUnitIntervalThisLoop(), this.CompletedLoops(), this.TotalElapsedSeconds(), this.TotalElapsedUnitInterval())
        }

        readonly Pause = () => {
            if (this.Stopped() || this.Paused()) return
            this.PausedElapsed = this.ElapsedSecondsThisLoop()
            if (this.OnPause) this.OnPause(this.ElapsedSecondsThisLoop(), this.ElapsedUnitIntervalThisLoop(), this.CompletedLoops(), this.TotalElapsedSeconds(), this.TotalElapsedUnitInterval())
            Remove(CallbackQueue, this.CallbackQueueItem)
            if (this.TickCallback) Remove(TickCallbacks, this.TickCallback)
        }

        readonly Resume = () => {
            if (this.Stopped() || this.PausedElapsed === undefined) return
            this.ThisLoopStartedAt = CurrentTime - this.PausedElapsed
            this.CallbackQueueItem = {
                At: this.ThisLoopStartedAt + this.IntervalSeconds,
                Call: this.CallbackQueueItem.Call
            }
            AddToCallbackQueue(this.CallbackQueueItem)
            if (this.TickCallback) TickCallbacks.push(this.TickCallback)
            this.PausedElapsed = undefined
            if (this.OnResume) this.OnResume(this.ElapsedSecondsThisLoop(), this.ElapsedUnitIntervalThisLoop(), this.CompletedLoops(), this.TotalElapsedSeconds(), this.TotalElapsedUnitInterval())
        }
    }
}