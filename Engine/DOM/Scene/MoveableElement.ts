class MoveableElement implements IMoveable, IDeletable, IHideable {
    private readonly PartOf: SceneGraphBase
    readonly Element: HTMLDivElement
    private Timer: Timer | undefined = undefined
    private FromX = 0
    private FromY = 0
    private ToX = 0
    private ToY = 0

    constructor(partOf: SceneGraphBase, element: HTMLDivElement, onClick?: () => void) {
        this.PartOf = partOf
        this.Element = element
        if (onClick) this.Element.onclick = () => { if (!partOf.Disabled()) InternalInvoke(onClick) }
    }

    readonly VirtualPixelsFromLeft = () => {
        if (this.Timer) return Mix(this.FromX, this.ToX, this.Timer.ElapsedUnitInterval())
        return this.ToX
    }

    readonly VirtualPixelsFromTop = () => {
        if (this.Timer) return Mix(this.FromY, this.ToY, this.Timer.ElapsedUnitInterval())
        return this.ToY
    }

    private readonly SetElementLocation = (leftPixels: number, topPixels: number) => {
        const realPixelsPerVirtualPixel = Display.RealPixelsPerVirtualPixel()
        if ("transform" in this.Element.style) {
            this.Element.style.transform = `translate(${leftPixels * realPixelsPerVirtualPixel}px, ${topPixels * realPixelsPerVirtualPixel}px)`
        } else {
            this.Element.style.left = `${leftPixels * realPixelsPerVirtualPixel}px`
            this.Element.style.top = `${topPixels * realPixelsPerVirtualPixel}px`
        }
    }

    readonly Delete = () => {
        if (this.Timer) {
            this.Timer.Cancel()
            this.Timer = undefined
        }
    }

    readonly Pause = () => {
        if (this.Timer) this.Timer.Pause()
    }

    readonly Resume = () => {
        if (this.Timer) this.Timer.Resume()
    }

    readonly Rescale = () => {
        if ("transition" in this.Element.style) {
            // IE10+, Edge, Firefox, Chrome.
            this.Element.offsetHeight // Forces a reflow; required for transitions to work.
            this.Element.style.transition = "initial"
            this.SetElementLocation(this.VirtualPixelsFromLeft(), this.VirtualPixelsFromTop())
            this.Element.offsetHeight // Forces a reflow; required for transitions to work.
            if (this.Timer && !this.Timer.Paused() && InternalFocused()) {
                const remainingSeconds = this.Timer.DurationSeconds - this.Timer.ElapsedSeconds()
                if ("transform" in this.Element.style) {
                    this.Element.style.transition = `transform ${remainingSeconds}s linear`
                } else {
                    this.Element.style.transition = `top ${remainingSeconds}s linear, left ${remainingSeconds}s linear`
                }
                this.SetElementLocation(this.ToX, this.ToY)
            }
        } else {
            this.SetElementLocation(this.VirtualPixelsFromLeft(), this.VirtualPixelsFromTop())
        }
    }

    readonly Move = (leftPixels: number, topPixels: number) => {
        if (this.PartOf.Deleted()) return

        if (this.Timer) {
            this.Timer.Cancel()
            this.Timer = undefined
        }

        this.FromX = this.ToX = Math.round(leftPixels)
        this.FromY = this.ToY = Math.round(topPixels)
        this.Rescale()
    }

    readonly MoveOver = (leftPixels: number, topPixels: number, seconds: number, onArrivingIfUninterrupted?: () => void) => {
        if (this.PartOf.Deleted()) return

        this.Move(this.VirtualPixelsFromLeft(), this.VirtualPixelsFromTop())
        this.ToX = Math.round(leftPixels)
        this.ToY = Math.round(topPixels)
        if ("transition" in this.Element.style) {
            // IE10+, Edge, Firefox, Chrome.
            this.Timer = new Timer(seconds, () => {
                this.Move(this.VirtualPixelsFromLeft(), this.VirtualPixelsFromTop())
                if (onArrivingIfUninterrupted) onArrivingIfUninterrupted()
            }, () => {
                this.Move(this.VirtualPixelsFromLeft(), this.VirtualPixelsFromTop())
            }, undefined, this.Rescale, this.Rescale)

            if (this.PartOf.Paused())
                this.Timer.Pause()
            else
                this.Rescale()
        } else {
            // IE9--.
            this.Timer = new Timer(seconds, () => {
                this.Move(this.VirtualPixelsFromLeft(), this.VirtualPixelsFromTop())
                if (onArrivingIfUninterrupted) onArrivingIfUninterrupted()
            }, () => {
                this.Move(this.VirtualPixelsFromLeft(), this.VirtualPixelsFromTop())
            }, this.Rescale, this.Rescale, this.Rescale)
            if (this.PartOf.Paused()) this.Timer.Pause()
        }
    }

    readonly MoveAt = (leftPixels: number, topPixels: number, pixelsPerSecond: number, onArrivingIfUninterrupted?: () => void) => {
        this.MoveOver(leftPixels, topPixels, Distance(leftPixels, topPixels, this.VirtualPixelsFromLeft(), this.VirtualPixelsFromTop()) / pixelsPerSecond, onArrivingIfUninterrupted)
    }

    readonly Hide = () => {
        if (this.PartOf.Deleted()) return
        this.Element.style.visibility = "hidden"
    }

    readonly Show = () => {
        if (this.PartOf.Deleted()) return
        this.Element.style.visibility = "inherit"
    }
}