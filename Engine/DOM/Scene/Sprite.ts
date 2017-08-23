class Sprite extends SceneGraphBase implements IMoveable {
    private readonly Parent: Viewport | Group
    private readonly RemoveFromParent: () => void

    private readonly MoveableElement: MoveableElement
    readonly VirtualPixelsFromLeft: () => number
    readonly VirtualPixelsFromTop: () => number
    readonly Move: (leftPixels: number, topPixels: number) => void
    readonly MoveOver: (leftPixels: number, topPixels: number, seconds: number, onArrivingIfUninterrupted?: () => void) => void
    readonly MoveAt: (leftPixels: number, topPixels: number, pixelsPerSecond: number, onArrivingIfUninterrupted?: () => void) => void

    private readonly ImageElement: CachedSprite
    private CurrentFrame: SpriteFrame

    constructor(parent: Viewport | Group, onClick?: () => void) {
        super()

        this.Parent = parent

        this.ImageElement = UncacheSprite()
        this.MoveableElement = new MoveableElement(this, this.ImageElement[0], onClick)
        this.VirtualPixelsFromLeft = this.MoveableElement.VirtualPixelsFromLeft
        this.VirtualPixelsFromTop = this.MoveableElement.VirtualPixelsFromTop
        this.Move = this.MoveableElement.Move
        this.MoveOver = this.MoveableElement.MoveOver
        this.MoveAt = this.MoveableElement.MoveAt
        this.MoveableElement.Element.style.overflow = "hidden"

        this.SetFrame(new SpriteFrame(0, 0, 0, 0, 0, 0, 0))

        this.RemoveFromParent = parent.InternalAddChild({
            Rescale: () => {
                this.SetFrame(this.CurrentFrame)
                this.MoveableElement.Rescale()
            },
            Element: this.MoveableElement.Element,
            Reference: this
        })
        if (this.Deleted()) return
    }

    protected readonly OnDeletion = () => {
        this.RemoveFromParent()
        this.MoveableElement.Delete()
        CacheSprite(this.ImageElement)
        if (this.AnimationTimer) this.AnimationTimer.Cancel()
    }

    protected readonly OnPause = () => {
        this.MoveableElement.Pause()
        if (this.AnimationTimer) this.AnimationTimer.Pause()
    }

    protected readonly OnResume = () => {
        this.MoveableElement.Resume()
        if (this.AnimationTimer) this.AnimationTimer.Resume()
    }

    protected readonly GetParentDisabled = () => this.Parent.Disabled()
    protected readonly OnHide = () => this.MoveableElement.Hide()
    protected readonly OnShow = () => this.MoveableElement.Show()
    protected readonly GetParentHidden = () => this.Parent.Hidden()

    private AnimationTimer: Timer | undefined = undefined

    readonly Play = (animation: SpriteFrame | SpriteFrame[], onCompletionIfUninterrupted?: () => void) => {
        if (this.Deleted()) return
        if (this.AnimationTimer) {
            this.AnimationTimer.Cancel()
            this.AnimationTimer = undefined
        }
        if (animation instanceof SpriteFrame) {
            this.SetFrame(animation)
            if (onCompletionIfUninterrupted == null) return
            this.AnimationTimer = new Timer(animation.DurationSeconds, onCompletionIfUninterrupted)
            if (this.Paused()) this.AnimationTimer.Pause()
        } else {
            let frame = 0
            const showNext = () => {
                this.SetFrame(animation[frame])
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
    }

    readonly Loop = (animation: SpriteFrame | SpriteFrame[]) => {
        if (animation instanceof SpriteFrame) {
            this.Play(animation)
        } else {
            const playAgain = () => this.Play(animation, playAgain)
            playAgain()
        }
    }

    private readonly SetFrame = (frame: SpriteFrame) => {
        this.CurrentFrame = frame
        const realPixelsPerVirtualPixel = Display.RealPixelsPerVirtualPixel()
        this.MoveableElement.Element.style.width = `${frame.WidthPixels * realPixelsPerVirtualPixel}px`
        this.MoveableElement.Element.style.height = `${frame.HeightPixels * realPixelsPerVirtualPixel}px`
        this.MoveableElement.Element.style.marginLeft = `${frame.MarginLeft * realPixelsPerVirtualPixel}px`
        this.MoveableElement.Element.style.marginTop = `${frame.MarginTop * realPixelsPerVirtualPixel}px`
        this.ImageElement[1].style.left = `-${frame.LeftPixels * realPixelsPerVirtualPixel}px`
        this.ImageElement[1].style.width = `${ContentSpritesWidth * realPixelsPerVirtualPixel}px`
        this.ImageElement[1].style.top = `-${frame.TopPixels * realPixelsPerVirtualPixel}px`
        this.ImageElement[1].style.height = `${ContentSpritesHeight * realPixelsPerVirtualPixel}px`
    }
}