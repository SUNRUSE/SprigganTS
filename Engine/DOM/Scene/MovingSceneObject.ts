abstract class MovingSceneObject extends SceneObject {
    private FromVirtualPixelsFromLeft = 0
    private FromVirtualPixelsFromTop = 0
    private ToVirtualPixelsFromLeft = 0
    private ToVirtualPixelsFromTop = 0
    private MotionTimer?: Timer
    private MotionCallback?: () => void

    VirtualPixelsFromLeft(): number {
        if (!this.MotionTimer) return this.FromVirtualPixelsFromLeft
        return Mix(this.FromVirtualPixelsFromLeft, this.ToVirtualPixelsFromLeft, this.MotionTimer.ElapsedUnitInterval())
    }

    VirtualPixelsFromTop(): number {
        if (!this.MotionTimer) return this.FromVirtualPixelsFromTop
        return Mix(this.FromVirtualPixelsFromTop, this.ToVirtualPixelsFromTop, this.MotionTimer.ElapsedUnitInterval())
    }

    Move(virtualPixelsFromLeft: number, virtualPixelsFromTop: number): this {
        if (this.Deleted()) return this
        if (this.MotionTimer) {
            this.MotionTimer.Cancel()
            this.MotionTimer = undefined
        }
        if (this.MotionCallback) {
            Remove(TickCallbacks, this.MotionCallback)
            this.MotionCallback = undefined
        }
        this.FromVirtualPixelsFromLeft = virtualPixelsFromLeft
        this.FromVirtualPixelsFromTop = virtualPixelsFromTop
        this.RefreshMotion()
        return this
    }

    MoveOver(virtualPixelsFromLeft: number, virtualPixelsFromTop: number, durationSeconds: number, onArrivingIfUninterrupted?: () => void): this {
        if (this.Deleted()) return this

        this.Move(this.VirtualPixelsFromLeft(), this.VirtualPixelsFromTop())
        this.ToVirtualPixelsFromLeft = Math.round(virtualPixelsFromLeft)
        this.ToVirtualPixelsFromTop = Math.round(virtualPixelsFromTop)

        if ("transition" in this.Element.style) {
            // IE10+, Edge, Firefox, Chrome.
            this.MotionTimer = new Timer(durationSeconds, () => {
                this.MotionTimer = undefined
                this.Move(virtualPixelsFromLeft, virtualPixelsFromTop)
                if (onArrivingIfUninterrupted) onArrivingIfUninterrupted()
            })

            if (this.Paused())
                this.MotionTimer.Pause()
            else
                this.RefreshMotion()
        } else {
            // IE9--.
            this.MotionTimer = new Timer(durationSeconds, () => {
                Remove(TickCallbacks, this.MotionCallback)
                this.MotionCallback = undefined
                this.MotionTimer = undefined
                this.Move(virtualPixelsFromLeft, virtualPixelsFromTop)
                if (onArrivingIfUninterrupted) onArrivingIfUninterrupted()
            })

            if (this.MotionCallback) Remove(TickCallbacks, this.MotionCallback)
            this.MotionCallback = () => this.RefreshMotion()
            TickCallbacks.push(this.MotionCallback)

            if (this.Paused()) this.MotionTimer.Pause()
        }
        return this
    }

    MoveAt(virtualPixelsFromLeft: number, virtualPixelsFromTop: number, pixelsPerSecond: number, onArrivingIfUninterrupted?: () => void): this {
        return this.MoveOver(virtualPixelsFromLeft, virtualPixelsFromTop, Distance(virtualPixelsFromLeft, virtualPixelsFromTop, this.VirtualPixelsFromLeft(), this.VirtualPixelsFromTop()) / pixelsPerSecond, onArrivingIfUninterrupted)
    }

    private RefreshMotion(): void {
        if ("transition" in this.Element.style) {
            // IE10+, Edge, Firefox, Chrome.
            this.Element.offsetHeight // Forces a reflow; required for transitions to work.
            this.Element.style.transition = "initial"
            this.SetElementLocation(this.VirtualPixelsFromLeft(), this.VirtualPixelsFromTop())
            this.Element.offsetHeight // Forces a reflow; required for transitions to work.
            if (this.MotionTimer && !this.Paused()) {
                const remainingSeconds = this.MotionTimer.DurationSeconds - this.MotionTimer.ElapsedSeconds()
                if ("transform" in this.Element.style) {
                    this.Element.style.transition = `transform ${remainingSeconds}s linear`
                } else {
                    this.Element.style.transition = `top ${remainingSeconds}s linear, left ${remainingSeconds}s linear`
                }
                this.SetElementLocation(this.ToVirtualPixelsFromLeft, this.ToVirtualPixelsFromTop)
            }
        } else {
            this.SetElementLocation(this.VirtualPixelsFromLeft(), this.VirtualPixelsFromTop())
        }
    }

    private SetElementLocation(virtualPixelsFromLeft: number, virtualPixelsFromTop: number) {
        virtualPixelsFromLeft *= Display.RealPixelsPerVirtualPixel()
        virtualPixelsFromTop *= Display.RealPixelsPerVirtualPixel()
        if ("transform" in this.Element.style) {
            this.Element.style.transform = `translate(${virtualPixelsFromLeft}px, ${virtualPixelsFromTop}px)`
        } else {
            this.Element.style.left = `${virtualPixelsFromLeft}px`
            this.Element.style.top = `${virtualPixelsFromTop}px`
        }
    }

    protected OnPause(): void {
        if (this.MotionTimer) {
            this.MotionTimer.Pause()
            this.RefreshMotion()
            if (this.MotionCallback) Remove(TickCallbacks, this.MotionCallback)
        }
        this.OnMovingSceneObjectPause()
    }

    protected OnMovingSceneObjectPause(): void { }

    protected OnResume(): void {
        if (this.MotionTimer) {
            this.MotionTimer.Resume()
            this.RefreshMotion()
            if (this.MotionCallback) TickCallbacks.push(this.MotionCallback)
        }
        this.OnMovingSceneObjectResume()
    }

    protected OnMovingSceneObjectResume(): void { }

    protected OnRescale(): void {
        this.RefreshMotion()
        this.OnMovingSceneObjectRescale()
    }

    protected OnMovingSceneObjectRescale(): void { }

    protected OnDelete(): void {
        if ("transform" in this.Element.style) {
            this.Element.style.transform = "translate(0px, 0px)"
        } else {
            this.Element.style.left = "0px"
            this.Element.style.top = "0px"
        }

        if (this.MotionTimer) {
            this.MotionTimer.Cancel()
            this.MotionTimer = undefined
        }

        if (this.MotionCallback) {
            Remove(TickCallbacks, this.MotionCallback)
            this.MotionCallback = undefined
        }

        this.OnMovingSceneObjectDelete()
    }

    protected OnMovingSceneObjectDelete(): void { }
}