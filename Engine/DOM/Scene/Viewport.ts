function CreateViewport(): HTMLDivElement {
    const element = document.createElement("div")
    element.style.position = "absolute"
    element.style.pointerEvents = "none"
    return element
}

const CachedViewports: HTMLDivElement[] = []

class Viewport extends MovingSceneObject {
    private readonly HorizontalPositionSignedUnitInterval: number
    private readonly VerticalPositionSignedUnitInterval: number

    constructor(horizontalPositionSignedUnitInterval?: number, verticalPositionSignedUnitInterval?: number, crop?: boolean, onClick?: () => void) {
        super(SceneRoot.Instance, onClick)
        if (this.Deleted()) return
        this.HorizontalPositionSignedUnitInterval = horizontalPositionSignedUnitInterval || 0
        this.VerticalPositionSignedUnitInterval = verticalPositionSignedUnitInterval || 0
        this.Element.style.overflow = crop ? "hidden" : "visible"
        this.Rescale()
    }

    protected CreateElement(): HTMLDivElement {
        return CachedViewports.pop() || CreateViewport()
    }

    protected OnMovingSceneObjectRescale(): void {
        const realPixelsPerVirtualPixel = Display.RealPixelsPerVirtualPixel()
        this.Element.style.width = `${WidthVirtualPixels * realPixelsPerVirtualPixel}px`
        this.Element.style.height = `${HeightVirtualPixels * realPixelsPerVirtualPixel}px`
        this.Element.style.marginLeft = `${(Display.RealWidthPixels() - WidthVirtualPixels * realPixelsPerVirtualPixel) * (this.HorizontalPositionSignedUnitInterval * 0.5 + 0.5)}px`
        this.Element.style.marginTop = `${(Display.RealHeightPixels() - HeightVirtualPixels * realPixelsPerVirtualPixel) * (this.VerticalPositionSignedUnitInterval * 0.5 + 0.5)}px`
    }

    protected OnMovingSceneObjectDelete(): void {
        CachedViewports.push(this.Element)
    }
}