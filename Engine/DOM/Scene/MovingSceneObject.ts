function ConvertPositionToPanning(position: number) {
    return ((position - (WidthVirtualPixels / 2)) / WidthVirtualPixels) * 2
}

abstract class MovingSceneObject extends SceneObject {
    private FromVirtualPixelsFromLeft = 0
    private FromVirtualPixelsFromTop = 0
    private ToVirtualPixelsFromLeft = 0
    private ToVirtualPixelsFromTop = 0
    private MotionTimer?: Timer

    VirtualPixelsFromLeft(): number {
        if (!this.MotionTimer) return this.ToVirtualPixelsFromLeft
        return Mix(this.FromVirtualPixelsFromLeft, this.ToVirtualPixelsFromLeft, this.MotionTimer.ElapsedUnitInterval())
    }

    VirtualPixelsFromTop(): number {
        if (!this.MotionTimer) return this.ToVirtualPixelsFromTop
        return Mix(this.FromVirtualPixelsFromTop, this.ToVirtualPixelsFromTop, this.MotionTimer.ElapsedUnitInterval())
    }

    private VirtualPixelsFromLeftForTransitions(): number {
        if (!this.MotionTimer) return this.ToVirtualPixelsFromLeft
        return Mix(this.FromVirtualPixelsFromLeft, this.ToVirtualPixelsFromLeft, this.MotionTimer.ElapsedUnitIntervalForTransitions())
    }

    private VirtualPixelsFromTopForTransitions(): number {
        if (!this.MotionTimer) return this.ToVirtualPixelsFromTop
        return Mix(this.FromVirtualPixelsFromTop, this.ToVirtualPixelsFromTop, this.MotionTimer.ElapsedUnitIntervalForTransitions())
    }

    Move(virtualPixelsFromLeft: number, virtualPixelsFromTop: number): this {
        if (this.Deleted()) return this
        if (this.MotionTimer) {
            if ("transition" in this.Element.style) {
                this.SetElementLocation(this.VirtualPixelsFromLeftForTransitions(), this.VirtualPixelsFromTopForTransitions())
                this.Element.style.transition = "initial"
                ForceStyleRefresh(this.Element)
            }
            this.MotionTimer.Cancel()
            this.MotionTimer = undefined
        }
        this.ToVirtualPixelsFromLeft = virtualPixelsFromLeft
        this.ToVirtualPixelsFromTop = virtualPixelsFromTop
        this.SetElementLocation(virtualPixelsFromLeft, virtualPixelsFromTop)
        if (!this.Paused()) for (const instance of this.SoundInstances) instance.ResumeAt(ConvertPositionToPanning(this.VirtualPixelsFromLeftForTransitions()))
        if ("transition" in this.Element.style) ForceStyleRefresh(this.Element)
        return this
    }

    MoveOver(virtualPixelsFromLeft: number, virtualPixelsFromTop: number, durationSeconds: number, onArrivingIfUninterrupted?: () => void): this {
        if (this.Deleted()) return this

        if (this.MotionTimer) {
            this.FromVirtualPixelsFromLeft = this.VirtualPixelsFromLeft()
            this.FromVirtualPixelsFromTop = this.VirtualPixelsFromTop()
            this.MotionTimer.Cancel()
            this.MotionTimer = undefined
        } else {
            this.FromVirtualPixelsFromLeft = this.ToVirtualPixelsFromLeft
            this.FromVirtualPixelsFromTop = this.ToVirtualPixelsFromTop
        }
        this.ToVirtualPixelsFromLeft = virtualPixelsFromLeft
        this.ToVirtualPixelsFromTop = virtualPixelsFromTop

        if ("transition" in this.Element.style) {
            // IE10+, Edge, Firefox, Chrome.
            this.MotionTimer = new Timer(durationSeconds, () => {
                this.MotionTimer = undefined
                this.Element.style.transition = "initial"
                ForceStyleRefresh(this.Element)
                if (onArrivingIfUninterrupted) onArrivingIfUninterrupted()
            })

            this.SetElementLocation(this.VirtualPixelsFromLeftForTransitions(), this.VirtualPixelsFromTopForTransitions())
            this.Element.style.transition = "initial"
            ForceStyleRefresh(this.Element)

            if (this.Paused()) {
                this.MotionTimer.Pause()
            } else {
                this.SetTransition(durationSeconds - this.MotionTimer.ElapsedSecondsForTransitions())
                this.SetElementLocation(virtualPixelsFromLeft, virtualPixelsFromTop)
            }
        } else {
            // IE9-.
            this.MotionTimer = new Timer(durationSeconds, () => {
                this.MotionTimer = undefined
                this.Move(virtualPixelsFromLeft, virtualPixelsFromTop)
                if (onArrivingIfUninterrupted) onArrivingIfUninterrupted()
            })

            if (this.Paused()) this.MotionTimer.Pause()
            this.SetElementLocation(this.VirtualPixelsFromLeft(), this.VirtualPixelsFromTop())
        }
        if (!this.Paused()) for (const instance of this.SoundInstances) instance.ResumeMotion(ConvertPositionToPanning(this.VirtualPixelsFromLeftForTransitions()), ConvertPositionToPanning(virtualPixelsFromLeft), durationSeconds - this.MotionTimer.ElapsedSecondsForTransitions())
        return this
    }

    MoveAt(virtualPixelsFromLeft: number, virtualPixelsFromTop: number, pixelsPerSecond: number, onArrivingIfUninterrupted?: () => void): this {
        return this.MoveOver(virtualPixelsFromLeft, virtualPixelsFromTop, Distance(virtualPixelsFromLeft, virtualPixelsFromTop, this.VirtualPixelsFromLeft(), this.VirtualPixelsFromTop()) / pixelsPerSecond, onArrivingIfUninterrupted)
    }

    private SetTransition(durationSeconds: number): void {
        if (durationSeconds < 0) durationSeconds = 0
        if ("transform" in this.Element.style) {
            this.Element.style.transition = `transform ${durationSeconds}s linear`
        } else {
            this.Element.style.transition = `top ${durationSeconds}s linear, left ${durationSeconds}s linear`
        }
    }

    private SetElementLocation(virtualPixelsFromLeft: number, virtualPixelsFromTop: number): void {
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
            if ("transition" in this.Element.style) {
                this.SetElementLocation(this.VirtualPixelsFromLeft(), this.VirtualPixelsFromTop())
                this.Element.style.transition = "initial"
                ForceStyleRefresh(this.Element)
            } else {
                this.SetElementLocation(this.VirtualPixelsFromLeft(), this.VirtualPixelsFromTop())
            }
        }
        for (const instance of this.SoundInstances) instance.Pause()
        this.OnMovingSceneObjectPause()
    }

    protected OnMovingSceneObjectPause(): void { }

    protected OnResume(): void {
        if (this.MotionTimer) {
            this.MotionTimer.Resume()
            if ("transition" in this.Element.style) {
                this.SetElementLocation(this.VirtualPixelsFromLeftForTransitions(), this.VirtualPixelsFromTopForTransitions())
                ForceStyleRefresh(this.Element)
                this.SetTransition(this.MotionTimer.DurationSeconds - this.MotionTimer.ElapsedSecondsForTransitions())
                this.SetElementLocation(this.ToVirtualPixelsFromLeft, this.ToVirtualPixelsFromTop)
            }
            for (const instance of this.SoundInstances) instance.ResumeMotion(ConvertPositionToPanning(this.VirtualPixelsFromLeftForTransitions()), ConvertPositionToPanning(this.ToVirtualPixelsFromLeft), this.MotionTimer.DurationSeconds - this.MotionTimer.ElapsedSecondsForTransitions())
        } else {
            for (const instance of this.SoundInstances) instance.ResumeAt(ConvertPositionToPanning(this.VirtualPixelsFromLeftForTransitions()))
        }
        this.OnMovingSceneObjectResume()
    }

    protected OnMovingSceneObjectResume(): void { }

    protected OnRescale(): void {
        if (this.MotionTimer && !this.MotionTimer.Paused() && "transition" in this.Element.style) {
            this.SetElementLocation(this.VirtualPixelsFromLeft(), this.VirtualPixelsFromTop())
            this.Element.style.transition = "initial"
            ForceStyleRefresh(this.Element)
            this.SetTransition(this.MotionTimer.DurationSeconds - this.MotionTimer.ElapsedSecondsForTransitions())
            this.SetElementLocation(this.ToVirtualPixelsFromLeft, this.ToVirtualPixelsFromTop)
        } else {
            this.SetElementLocation(this.VirtualPixelsFromLeft(), this.VirtualPixelsFromTop())
        }
        this.OnMovingSceneObjectRescale()
    }

    protected OnMovingSceneObjectRescale(): void { }

    Tick(): boolean {
        let any = false
        if (this.MotionTimer && !this.MotionTimer.Paused() && !("transition" in this.Element.style)) {
            any = true
            this.SetElementLocation(this.VirtualPixelsFromLeft(), this.VirtualPixelsFromTop())
        }
        for (const child of this.Children) if (child.Tick()) any = true
        return any
    }

    private readonly SoundInstances: SoundInstance[] = []

    PlaySound(sound: Sound): void {
        const soundInstance = AudioDriver.PlaySound(sound, () => Remove(this.SoundInstances, soundInstance))
        this.SoundInstances.push(soundInstance)
        if (!this.Paused()) {
            if (this.MotionTimer) {
                soundInstance.ResumeMotion(ConvertPositionToPanning(this.VirtualPixelsFromLeftForTransitions()), ConvertPositionToPanning(this.ToVirtualPixelsFromLeft), this.MotionTimer.DurationSeconds - this.MotionTimer.ElapsedSecondsForTransitions())
            } else {
                soundInstance.ResumeAt(ConvertPositionToPanning(this.VirtualPixelsFromLeftForTransitions()))
            }
        }
    }

    protected OnDelete(): void {
        this.SetElementLocation(0, 0)
        while (this.SoundInstances.length) this.SoundInstances[0].Delete()

        if (this.MotionTimer) {
            if ("transition" in this.Element.style) this.Element.style.transition = "initial"
            this.MotionTimer.Cancel()
            this.MotionTimer = undefined
        }

        this.OnMovingSceneObjectDelete()
    }

    protected OnMovingSceneObjectDelete(): void { }
}