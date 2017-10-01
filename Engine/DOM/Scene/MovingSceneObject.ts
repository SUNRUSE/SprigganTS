function ConvertPositionToPanning(position: number) {
    return ((position - (WidthVirtualPixels / 2)) / WidthVirtualPixels) * 2
}

abstract class MovingSceneObject extends SceneObject {
    private FromVirtualPixelsFromLeft = 0
    private FromVirtualPixelsFromTop = 0
    private ToVirtualPixelsFromLeft = 0
    private ToVirtualPixelsFromTop = 0
    private MotionTimer?: Timer

    SecondsUntilDestinationReachedForTransitions(): number {
        return Math.max(0, Math.min(
            super.SecondsUntilDestinationReachedForTransitions(),
            this.MotionTimer ? this.MotionTimer.DurationSeconds - this.MotionTimer.ElapsedSecondsForTransitions() : Infinity
        ))
    }

    CurrentAbsoluteVirtualPixelsFromLeftForTransitions(): number {
        return super.CurrentAbsoluteVirtualPixelsFromLeftForTransitions() + this.VirtualPixelsFromLeftForTransitions()
    }

    DestinationAbsoluteVirtualPixelsFromLeftForTransitions(): number {
        let output = super.DestinationAbsoluteVirtualPixelsFromLeftForTransitions()
        if (this.MotionTimer && !this.Paused()) {
            const elapsedAtDestination = this.MotionTimer.ElapsedSecondsForTransitions() + this.SecondsUntilDestinationReachedForTransitions()
            output += Mix(this.FromVirtualPixelsFromLeft, this.ToVirtualPixelsFromLeft, elapsedAtDestination / this.MotionTimer.DurationSeconds)
        } else output += this.VirtualPixelsFromLeftForTransitions()
        return output
    }

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
        this.Moved()
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
        this.Moved()
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
        }
        this.Moved()
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
        this.OnMoved()
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
        const soundInstance = AudioDriver.PlaySound(sound, () => ConvertPositionToPanning(this.CurrentAbsoluteVirtualPixelsFromLeftForTransitions()), () => Remove(this.SoundInstances, soundInstance))
        this.SoundInstances.push(soundInstance)
        this.OnMoved()
    }

    protected OnMoved(): void {
        if (!this.SoundInstances.length) return
        if (this.Paused()) {
            for (const sound of this.SoundInstances) sound.Pause()
        } else {
            const secondsUntilDestinationReached = this.SecondsUntilDestinationReachedForTransitions()
            if (secondsUntilDestinationReached == Infinity) {
                for (const sound of this.SoundInstances) sound.ResumeAt(ConvertPositionToPanning(this.CurrentAbsoluteVirtualPixelsFromLeftForTransitions()))
            } else {
                const from = ConvertPositionToPanning(this.CurrentAbsoluteVirtualPixelsFromLeftForTransitions())
                const to = ConvertPositionToPanning(this.DestinationAbsoluteVirtualPixelsFromLeftForTransitions())
                for (const sound of this.SoundInstances) sound.ResumeMotion(from, to, secondsUntilDestinationReached)
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