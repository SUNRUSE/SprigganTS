const CachedStaticSprites: StaticSprite[] = []

class StaticSprite {
    private Parent?: SceneObject
    private Frame: SpriteFrame
    private VirtualPixelsFromLeft: number
    private VirtualPixelsFromTop: number
    private readonly Element: HTMLDivElement
    private readonly ImageElement: HTMLImageElement

    constructor() {
        this.Element = document.createElement("div")
        this.Element.style.position = "absolute"
        this.Element.style.pointerEvents = "none"
        this.Element.style.overflow = "hidden"
        if (!Sprites) throw "Creating a StaticSprite before the atlas has been loaded.  This should not be possible."
        this.ImageElement = Sprites.cloneNode(true) as HTMLImageElement
        this.Element.appendChild(this.ImageElement)
    }

    Set(parent: Viewport | Group, frame: SpriteFrame, virtualPixelsFromLeft: number, virtualPixelsFromTop: number): void {
        parent.Element.appendChild(this.Element)
        parent.StaticSprites.push(this)
        this.Parent = parent
        this.Frame = frame
        this.VirtualPixelsFromLeft = virtualPixelsFromLeft
        this.VirtualPixelsFromTop = virtualPixelsFromTop
        this.Rescale()
    }

    Rescale(): void {
        const realPixelsPerVirtualPixel = Display.RealPixelsPerVirtualPixel()
        this.Element.style.left = `${this.VirtualPixelsFromLeft * realPixelsPerVirtualPixel}px`
        this.Element.style.top = `${this.VirtualPixelsFromTop * realPixelsPerVirtualPixel}px`
        this.Element.style.width = `${this.Frame.WidthPixels * realPixelsPerVirtualPixel}px`
        this.Element.style.height = `${this.Frame.HeightPixels * realPixelsPerVirtualPixel}px`
        this.Element.style.marginLeft = `${this.Frame.MarginLeft * realPixelsPerVirtualPixel}px`
        this.Element.style.marginTop = `${this.Frame.MarginTop * realPixelsPerVirtualPixel}px`
        this.ImageElement.style.left = `-${this.Frame.LeftPixels * realPixelsPerVirtualPixel}px`
        this.ImageElement.style.width = `${ContentSpritesWidth * realPixelsPerVirtualPixel}px`
        this.ImageElement.style.top = `-${this.Frame.TopPixels * realPixelsPerVirtualPixel}px`
        this.ImageElement.style.height = `${ContentSpritesHeight * realPixelsPerVirtualPixel}px`
    }

    Delete(): void {
        if (!this.Parent) return
        this.Parent.Element.removeChild(this.Element)
        Remove(this.Parent.StaticSprites, this)
        this.Parent = undefined
        CachedStaticSprites.push(this)
    }
}

function AddStaticSprite(parent: Viewport | Group, frame: SpriteFrame, virtualPixelsFromLeft: number, virtualPixelsFromTop: number): void {
    (CachedStaticSprites.pop() || new StaticSprite()).Set(parent, frame, virtualPixelsFromLeft, virtualPixelsFromTop)
}