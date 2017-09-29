function CreateBackgroundWrapper(): HTMLDivElement {
    const element = document.createElement("div")
    element.style.position = "absolute"
    element.style.pointerEvents = "none"
    return element
}

const CachedBackgroundWrappers: HTMLDivElement[] = []

class Background extends MovingSceneObject {
    private readonly Animation: BackgroundFrame[] = []
    private readonly Images: HTMLImageElement[] = []
    private LoadedImages = 0
    private AnimationTimer?: Timer

    constructor(parent: Viewport | Group, animation: BackgroundFrame | BackgroundFrame[]) {
        super(parent, undefined)
        if (this.Deleted()) return
        this.Animation = animation instanceof BackgroundFrame ? [animation] : animation
        let animationProgress = 0
        for (const frame of this.Animation) InternalLoadAndPrepareImage(`backgrounds/${frame.FileNumber}.png`, `backgrounds/${frame.FileNumber}prescaled.png`, frame.Height, frame.Height, element => {
            if (this.Deleted()) return
            this.Images[IndexOf(this.Animation, frame)] = element
            element.style.visibility = "hidden"
            element.style.position = "absolute"
            element.style.pointerEvents = "none"
            const pixelsPerVirtualPixel = Display.RealPixelsPerVirtualPixel()
            element.style.width = `${frame.Width * pixelsPerVirtualPixel}px`
            element.style.height = `${frame.Height * pixelsPerVirtualPixel}px`
            element.style.left = `${(frame.Width - WidthVirtualPixels) * pixelsPerVirtualPixel / -2}px`
            element.style.top = `${(frame.Height - HeightVirtualPixels) * pixelsPerVirtualPixel / -2}px`
            this.Element.appendChild(element)
            this.LoadedImages++
            if (this.LoadedImages == this.Animation.length) this.Images[animationProgress].style.visibility = "inherit"
        }, () => this.Delete())

        if (this.Animation.length > 1) {
            const advanceFrame = () => {
                if (this.LoadedImages == this.Animation.length) {
                    this.Images[animationProgress].style.visibility = "inherit"
                    this.Images[(animationProgress || this.Animation.length) - 1].style.visibility = "hidden"
                }
                this.AnimationTimer = new Timer(this.Animation[animationProgress].DurationSeconds, advanceFrame)
                animationProgress++
                if (animationProgress == this.Animation.length) animationProgress = 0
            }
            advanceFrame()
            if (this.Paused() && this.AnimationTimer) this.AnimationTimer.Pause()
        }
    }

    protected CreateElement(): HTMLDivElement {
        return CachedBackgroundWrappers.pop() || CreateBackgroundWrapper()
    }

    protected OnMovingSceneObjectPause(): void {
        if (this.AnimationTimer) this.AnimationTimer.Pause()
    }

    protected OnMovingSceneObjectResume(): void {
        if (this.AnimationTimer) this.AnimationTimer.Resume()
    }

    protected OnMovingSceneObjectRescale(): void {
        const pixelsPerVirtualPixel = Display.RealPixelsPerVirtualPixel()
        for (let i = 0; i < this.Animation.length; i++) {
            const frame = this.Animation[i]
            const element = this.Images[i]
            if (!element) continue
            element.style.width = `${frame.Width * pixelsPerVirtualPixel}px`
            element.style.height = `${frame.Height * pixelsPerVirtualPixel}px`
            element.style.left = `${(frame.Width - WidthVirtualPixels) * pixelsPerVirtualPixel / -2}px`
            element.style.top = `${(frame.Height - HeightVirtualPixels) * pixelsPerVirtualPixel / -2}px`
        }
    }

    protected OnMovingSceneObjectDelete(): void {
        if (this.AnimationTimer) {
            this.AnimationTimer.Cancel()
            this.AnimationTimer = undefined
        }
        for (const image of this.Images) if (image) this.Element.removeChild(image)
        CachedBackgroundWrappers.push(this.Element)
    }
}