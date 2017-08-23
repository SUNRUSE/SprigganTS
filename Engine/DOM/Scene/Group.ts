class Group extends SceneGraphBase implements IMoveable {
    private readonly Parent: Viewport | Group
    private readonly RemoveFromParent: () => void

    private readonly MoveableElement: MoveableElement
    readonly VirtualPixelsFromLeft: () => number
    readonly VirtualPixelsFromTop: () => number
    readonly Move: (leftPixels: number, topPixels: number) => void
    readonly MoveOver: (leftPixels: number, topPixels: number, seconds: number, onArrivingIfUninterrupted?: () => void) => void
    readonly MoveAt: (leftPixels: number, topPixels: number, pixelsPerSecond: number, onArrivingIfUninterrupted?: () => void) => void

    private readonly Children: ElementWithChildren
    readonly InternalAddChild: (child: Child) => () => void

    constructor(parent: Viewport | Group, onClick?: () => void) {
        super()

        this.Parent = parent

        this.MoveableElement = new MoveableElement(this, UncacheGroup(), onClick)
        this.VirtualPixelsFromLeft = this.MoveableElement.VirtualPixelsFromLeft
        this.VirtualPixelsFromTop = this.MoveableElement.VirtualPixelsFromTop
        this.Move = this.MoveableElement.Move
        this.MoveOver = this.MoveableElement.MoveOver
        this.MoveAt = this.MoveableElement.MoveAt

        this.Children = new ElementWithChildren(this, this.MoveableElement.Element)
        this.InternalAddChild = this.Children.AddChild

        this.RemoveFromParent = parent.InternalAddChild({
            Rescale: () => {
                this.MoveableElement.Rescale()
                this.Children.Rescale()
            },
            Element: this.MoveableElement.Element,
            Reference: this
        })
        if (this.Deleted()) return
    }

    protected readonly OnDeletion = () => {
        this.RemoveFromParent()
        this.MoveableElement.Delete()
        this.Children.Delete()
        CacheGroup(this.MoveableElement.Element)
    }

    protected readonly OnPause = () => {
        this.MoveableElement.Pause()
        this.Children.Pause()
    }

    protected readonly OnResume = () => {
        this.MoveableElement.Resume()
        this.Children.Resume()
    }

    protected readonly GetParentDisabled = () => this.Parent.Disabled()
    protected readonly OnHide = () => this.MoveableElement.Hide()
    protected readonly OnShow = () => this.MoveableElement.Show()
    protected readonly GetParentHidden = () => this.Parent.Hidden()
}