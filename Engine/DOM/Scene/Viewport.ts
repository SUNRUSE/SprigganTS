class Viewport extends SceneGraphBase {
    private readonly Element: HTMLDivElement

    private readonly Children: ElementWithChildren
    readonly InternalAddChild: (child: Child) => () => void
    protected readonly OnPause: () => void
    protected readonly OnResume: () => void

    private readonly HorizontalPositionSignedUnitInterval: number
    private readonly VerticalPositionSignedUnitInterval: number

    constructor(horizontalPositionSignedUnitInterval: number = 0, verticalPositionSignedUnitInterval: number = 0, crop = true, onClick?: () => void) {
        super()
        this.Element = document.createElement("div")
        this.Element.style.position = "absolute"
        this.Element.style.overflow = crop ? "hidden" : "visible"
        this.Element.style.pointerEvents = "none"
        if (onClick) this.Element.onclick = () => { if (!this.Disabled()) InternalInvoke(onClick) }

        this.HorizontalPositionSignedUnitInterval = horizontalPositionSignedUnitInterval
        this.VerticalPositionSignedUnitInterval = verticalPositionSignedUnitInterval

        this.Children = new ElementWithChildren(this, this.Element)
        this.InternalAddChild = this.Children.AddChild
        this.OnPause = this.Children.Pause
        this.OnResume = this.Children.Resume
        Display.RootElement.appendChild(this.Element)

        InternalFocusedChanged.Listen(this.Rescale)
        Display.Resized.Listen(this.Rescale)
        this.Rescale()
    }

    private readonly Rescale = () => {
        const realPixelsPerVirtualPixel = Display.RealPixelsPerVirtualPixel()

        this.Element.style.width = `${WidthVirtualPixels * realPixelsPerVirtualPixel}px`
        this.Element.style.height = `${HeightVirtualPixels * realPixelsPerVirtualPixel}px`

        this.Element.style.left = `${(Display.RealWidthPixels() - WidthVirtualPixels * realPixelsPerVirtualPixel) * (this.HorizontalPositionSignedUnitInterval * 0.5 + 0.5)}px`
        this.Element.style.top = `${(Display.RealHeightPixels() - HeightVirtualPixels * realPixelsPerVirtualPixel) * (this.VerticalPositionSignedUnitInterval * 0.5 + 0.5)}px`

        this.Children.Rescale()
    }

    protected readonly OnDeletion = () => {
        InternalFocusedChanged.Unlisten(this.Rescale)
        Display.Resized.Unlisten(this.Rescale)
        Display.RootElement.removeChild(this.Element)
        this.Children.Delete()
    }

    protected readonly GetParentDisabled = () => false
    protected readonly OnHide = () => this.Element.style.visibility = "hidden"
    protected readonly OnShow = () => this.Element.style.visibility = "inherit"
    protected readonly GetParentHidden = () => false
}