function CreateSprite(): HTMLDivElement {
    const element = document.createElement("div")
    element.style.position = "absolute"
    element.style.pointerEvents = "none"
    element.style.overflow = "hidden"
    if (!Sprites) throw "Creating a sprite before the atlas has been loaded.  This should not be possible."
    element.appendChild(Sprites.cloneNode(true))
    return element
}

const CachedSprites: HTMLDivElement[] = []

class Sprite extends MovingSceneObject {
    private AnimationTimer?: Timer
    private CurrentFrame?: SpriteFrame
    private ImageElement: HTMLImageElement

    constructor(parent: SceneObject, onClick?: () => void) {
        super(parent, onClick)
        if (this.Deleted()) return
        this.Rescale()
        this.ImageElement = this.Element.firstElementChild as HTMLImageElement
    }

    protected CreateElement(): HTMLDivElement {
        return CachedSprites.pop() || CreateSprite()
    }

    Play(animation: SpriteFrame | SpriteFrame[], onCompletionIfUninterrupted?: () => void): Sprite {
        if (this.Deleted()) return this

        if (this.AnimationTimer) {
            this.AnimationTimer.Cancel()
            this.AnimationTimer = undefined
        }

        if (animation instanceof SpriteFrame) {
            this.CurrentFrame = animation
            this.OnMovingSceneObjectRescale()
            if (onCompletionIfUninterrupted == null) return this
            this.AnimationTimer = new Timer(animation.DurationSeconds, onCompletionIfUninterrupted)
            if (this.Paused()) this.AnimationTimer.Pause()
        } else {
            let frame = 0

            const showNext = () => {
                this.CurrentFrame = animation[frame]
                this.OnMovingSceneObjectRescale()

                if (frame == animation.length - 1) {
                    if (!onCompletionIfUninterrupted) return
                    this.AnimationTimer = new Timer(animation[frame].DurationSeconds, onCompletionIfUninterrupted)
                } else {
                    this.AnimationTimer = new Timer(animation[frame].DurationSeconds, showNext)
                    frame++
                }
                if (this.Paused()) this.AnimationTimer.Pause()
            }
            showNext()
        }
        return this
    }

    Loop(animation: SpriteFrame | SpriteFrame[]): Sprite {
        if (animation instanceof SpriteFrame) {
            this.Play(animation)
        } else {
            const playAgain = () => this.Play(animation, playAgain)
            playAgain()
        }
        return this
    }

    protected OnMovingSceneObjectPause(): void {
        if (this.AnimationTimer) this.AnimationTimer.Pause()
    }

    protected OnMovingSceneObjectResume(): void {
        if (this.AnimationTimer) this.AnimationTimer.Resume()
    }

    protected OnMovingSceneObjectRescale(): void {
        if (!this.CurrentFrame) return
        const realPixelsPerVirtualPixel = Display.RealPixelsPerVirtualPixel()
        this.Element.style.width = `${this.CurrentFrame.WidthPixels * realPixelsPerVirtualPixel}px`
        this.Element.style.height = `${this.CurrentFrame.HeightPixels * realPixelsPerVirtualPixel}px`
        this.Element.style.marginLeft = `${this.CurrentFrame.MarginLeft * realPixelsPerVirtualPixel}px`
        this.Element.style.marginTop = `${this.CurrentFrame.MarginTop * realPixelsPerVirtualPixel}px`
        this.ImageElement.style.left = `-${this.CurrentFrame.LeftPixels * realPixelsPerVirtualPixel}px`
        this.ImageElement.style.width = `${ContentSpritesWidth * realPixelsPerVirtualPixel}px`
        this.ImageElement.style.top = `-${this.CurrentFrame.TopPixels * realPixelsPerVirtualPixel}px`
        this.ImageElement.style.height = `${ContentSpritesHeight * realPixelsPerVirtualPixel}px`
    }

    protected OnMovingSceneObjectDelete(): void {
        if (this.AnimationTimer) {
            this.AnimationTimer.Cancel()
            this.AnimationTimer = undefined
        }
        this.Element.style.width = "0"
        this.Element.style.height = "0"
        CachedSprites.push(this.Element)
    }
}