namespace Timers {
    let CurrentTime = (+new Date()) / 1000

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
    export function Invoke(callback?: () => void) {
        if (Recursing) throw new Error("Timers.Update should not be called recursively")
        Recursing = true
        const newCurrentTime = (+new Date()) / 1000

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
                        Invoke()
                    })
                }
            } else {
                if (Interval === undefined) {
                    Interval = setInterval(Invoke, 50) as any // todo
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
                    Invoke()
                }, (1000 * CallbackQueue[0].At) - (+new Date())) as any // todo
            }
        }

        Recursing = false
    }

    export type OnceCallback = (elapsedSeconds: number, elapsedUnitInterval: number) => void

    export class Once {
        private _Completed = false
        private _StartedAt: number
        private _CancelledElapsed: number | undefined = undefined
        private _PausedElapsed: number | undefined = undefined
        private _CallbackQueueItem: CallbackQueueItem
        private readonly _TickCallback: (() => void) | undefined

        public readonly DurationSeconds: number

        private readonly _OnCancellation?: OnceCallback
        private readonly _OnPause?: OnceCallback
        private readonly _OnResume?: OnceCallback

        constructor(durationSeconds: number, onCompletion?: () => void, onCancellation?: OnceCallback, onTick?: OnceCallback, onPause?: OnceCallback, onResume?: OnceCallback) {
            this.DurationSeconds = durationSeconds
            this._OnCancellation = onCancellation
            this._OnPause = onPause
            this._OnResume = onResume

            this._StartedAt = CurrentTime

            this._CallbackQueueItem = {
                At: CurrentTime + durationSeconds,
                Call: () => {
                    this._Completed = true
                    if (onCompletion) onCompletion()
                    if (this._TickCallback) Remove(TickCallbacks, this._TickCallback)
                }
            }
            AddToCallbackQueue(this._CallbackQueueItem)

            if (onTick) {
                this._TickCallback = () => onTick(this.ElapsedSeconds(), this.ElapsedUnitInterval())
                TickCallbacks.push(this._TickCallback)
            }
        }

        readonly Cancelled = () => this._CancelledElapsed !== undefined
        readonly Completed = () => this._Completed
        readonly Paused = () => this._PausedElapsed !== undefined

        readonly ElapsedSeconds = () => {
            if (this._PausedElapsed !== undefined) return this._PausedElapsed
            if (this._CancelledElapsed !== undefined) return this._CancelledElapsed
            return Math.min(this.DurationSeconds, CurrentTime - this._StartedAt)
        }

        readonly ElapsedUnitInterval = () => {
            if (this.DurationSeconds == 0) return 1
            return this.ElapsedSeconds() / this.DurationSeconds
        }

        readonly Cancel = () => {
            if (this.Cancelled() || this.Completed()) return
            this._CancelledElapsed = this.ElapsedSeconds()
            if (!this.Paused()) {
                Remove(CallbackQueue, this._CallbackQueueItem)
                if (this._OnCancellation) this._OnCancellation(this.ElapsedSeconds(), this.ElapsedUnitInterval())
                if (this._TickCallback) Remove(TickCallbacks, this._TickCallback)
            }
        }

        readonly Pause = () => {
            if (this.Paused() || this.Cancelled() || this.Completed()) return
            this._PausedElapsed = this.ElapsedSeconds()
            Remove(CallbackQueue, this._CallbackQueueItem)
            if (this._TickCallback) Remove(TickCallbacks, this._TickCallback)
            if (this._OnPause) this._OnPause(this.ElapsedSeconds(), this.ElapsedUnitInterval())
        }

        readonly Resume = () => {
            if (this.Cancelled() || this.Completed()) return
            if (this._PausedElapsed === undefined) return
            this._StartedAt = CurrentTime - this._PausedElapsed
            this._CallbackQueueItem = {
                At: CurrentTime + this.DurationSeconds - this._PausedElapsed,
                Call: this._CallbackQueueItem.Call
            }
            AddToCallbackQueue(this._CallbackQueueItem)
            if (this._TickCallback) TickCallbacks.push(this._TickCallback)
            this._PausedElapsed = undefined
            if (this._OnResume) this._OnResume(this.ElapsedSeconds(), this.ElapsedUnitInterval())
        }
    }
}