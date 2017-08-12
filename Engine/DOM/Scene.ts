let Sprites: HTMLImageElement | undefined = undefined

type CachedSprite = [HTMLDivElement, HTMLImageElement]
const CachedSprites: CachedSprite[] = []
const CachedGroups: HTMLDivElement[] = []

function CreateSprite(): CachedSprite {
    // This should never happen; only game code or post-loading code should call this, by which time the sprites must have been loaded.
    if (!Sprites) throw new Error("Sprites have not been loaded")
    const container = CreateGroup()
    const image = Sprites.cloneNode(true) as HTMLImageElement
    container.appendChild(image)
    return [container, image]
}

function CacheSprite(sprite: CachedSprite) {
    const parent = sprite[0].parentElement
    if (parent) parent.removeChild(sprite[0])
    if (sprite[0].onclick) sprite[0].onclick = () => { }
    CachedSprites.push(sprite)
}

function UncacheSprite(): CachedSprite {
    const output = CachedSprites.pop() || CreateSprite()
    if ("transform" in output[0].style) {
        output[0].style.transform = "translate(0px, 0px)"
    } else {
        output[0].style.left = "0px"
        output[0].style.top = "0px"
    }
    return output
}

function CreateGroup() {
    const element = document.createElement("div")
    element.style.position = "absolute"
    element.style.pointerEvents = "none"
    return element
}

function CacheGroup(group: HTMLDivElement) {
    if (group.onclick) group.onclick = () => { }
    CachedGroups.push(group)
}

function UncacheGroup(): HTMLDivElement {
    const output = CachedGroups.pop() || CreateGroup()
    if ("transform" in output.style) {
        output.style.transform = "translate(0px, 0px)"
    } else {
        output.style.top = "0px"
        output.style.left = "0px"
    }
    return output
}

// Called by the engine to load the sprite sheet and perform any "massaging" required to get them to draw as pixelated sprites.
// You should not need to call this yourself.
function LoadSprites(then: () => void) {
    SetLoadingMessage("Loading sprites...")
    InternalLoadAndPrepareImage("Sprites.png", ContentSpritesWidth, ContentSpritesHeight, element => {
        element.style.touchAction = "manipulation" // Improves responsiveness on IE/Edge on touchscreens.
        element.style.webkitBackfaceVisibility = "hidden" // Prevents a "pop" on Chrome when all transitions have finished.
        element.style.position = "absolute"
        element.style.pointerEvents = "all"
        Sprites = element
        SetLoadingMessage("Caching sprites...")
        setTimeout(() => {
            while (CachedSprites.length < NumberOfInitiallyCachedSprites) CachedSprites.push(CreateSprite())
            SetLoadingMessage("Caching groups...")
            setTimeout(() => {
                while (CachedGroups.length < NumberOfInitiallyCachedGroups) CachedGroups.push(CreateGroup())
                then()
            }, 0)
        }, 0)
    }, () => SetLoadingMessage("Failed to load sprites.  Please try refreshing this page."))
}

type Child = {
    readonly Rescale: () => void
    readonly Element: HTMLDivElement
    readonly Reference: Group | Sprite
}

interface IPausable {
    readonly Pause: () => void
    readonly Resume: () => void
}

interface IDeletable {
    readonly Delete: () => void
}

interface IDisableable {
    readonly Disable: () => void
    readonly Enable: () => void
}

interface IHideable {
    readonly Hide: () => void
    readonly Show: () => void
}

abstract class SceneGraphBase implements IPausable, IDeletable, IDisableable, IHideable {
    private DeletedValue = false
    readonly Deleted = () => this.DeletedValue
    readonly Delete = () => {
        if (this.DeletedValue) return
        this.DeletedValue = true
        this.OnDeletion()
    }
    protected abstract readonly OnDeletion: () => void

    private PausedValue = false
    readonly Paused = () => this.PausedValue
    readonly Pause = () => {
        if (this.Deleted() || this.Paused()) return
        this.PausedValue = true
        this.OnPause()
    }
    protected abstract readonly OnPause: () => void

    readonly Resume = () => {
        if (this.Deleted() || !this.Paused()) return
        this.PausedValue = false
        this.OnResume()
    }
    protected abstract readonly OnResume: () => void

    private LocallyDisabledValue = false
    readonly LocallyDisabled = () => this.LocallyDisabledValue
    readonly Disabled = () => this.LocallyDisabled() || this.GetParentDisabled()

    readonly Disable = () => {
        if (this.Deleted() || this.LocallyDisabled()) return
        this.LocallyDisabledValue = true
    }

    readonly Enable = () => {
        if (this.Deleted() || !this.LocallyDisabled()) return
        this.LocallyDisabledValue = false
    }

    protected abstract readonly GetParentDisabled: () => void

    private LocallyHiddenValue = false
    readonly LocallyHidden = () => this.LocallyHiddenValue
    readonly Hidden = () => this.LocallyHidden() || this.GetParentHidden()

    readonly Hide = () => {
        if (this.Deleted() || this.LocallyHidden()) return
        this.LocallyHiddenValue = true
        this.OnHide()
    }

    readonly Show = () => {
        if (this.Deleted() || !this.LocallyHidden()) return
        this.LocallyHiddenValue = false
        this.OnShow()
    }

    protected abstract readonly OnHide: () => void
    protected abstract readonly OnShow: () => void
    protected abstract readonly GetParentHidden: () => void
}

interface IMoveable extends IPausable {
    readonly X: () => number
    readonly Y: () => number
    readonly Move: (leftPixels: number, topPixels: number) => void
    readonly MoveOver: (leftPixels: number, topPixels: number, seconds: number, onArrivingIfUninterrupted?: () => void) => void
    readonly MoveAt: (leftPixels: number, topPixels: number, pixelsPerSecond: number, onArrivingIfUninterrupted?: () => void) => void
}

class MoveableElement implements IMoveable, IDeletable, IHideable {
    private readonly PartOf: SceneGraphBase
    readonly Element: HTMLDivElement
    private Timer: Timers.Once | undefined = undefined
    private FromX = 0
    private FromY = 0
    private ToX = 0
    private ToY = 0

    constructor(partOf: SceneGraphBase, element: HTMLDivElement, onClick?: () => void) {
        this.PartOf = partOf
        this.Element = element
        if (onClick) this.Element.onclick = () => { if (!partOf.Disabled()) Timers.InternalInvoke(onClick) }
    }

    readonly X = () => {
        if (this.Timer) return Mix(this.FromX, this.ToX, this.Timer.ElapsedUnitInterval())
        return this.ToX
    }

    readonly Y = () => {
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
            this.SetElementLocation(this.X(), this.Y())
            this.Element.offsetHeight // Forces a reflow; required for transitions to work.
            if (this.Timer && !this.Timer.Paused() && Timers.InternalFocused()) {
                const remainingSeconds = this.Timer.DurationSeconds - this.Timer.ElapsedSeconds()
                if ("transform" in this.Element.style) {
                    this.Element.style.transition = `transform ${remainingSeconds}s linear`
                } else {
                    this.Element.style.transition = `top ${remainingSeconds}s linear, left ${remainingSeconds}s linear`
                }
                this.SetElementLocation(this.ToX, this.ToY)
            }
        } else {
            this.SetElementLocation(this.X(), this.Y())
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

        this.Move(this.X(), this.Y())
        this.ToX = Math.round(leftPixels)
        this.ToY = Math.round(topPixels)
        if ("transition" in this.Element.style) {
            // IE10+, Edge, Firefox, Chrome.
            this.Timer = new Timers.Once(seconds, () => {
                this.Move(this.X(), this.Y())
                if (onArrivingIfUninterrupted) onArrivingIfUninterrupted()
            }, () => {
                this.Move(this.X(), this.Y())
            }, undefined, this.Rescale, this.Rescale)

            if (this.PartOf.Paused())
                this.Timer.Pause()
            else
                this.Rescale()
        } else {
            // IE9--.
            this.Timer = new Timers.Once(seconds, () => {
                this.Move(this.X(), this.Y())
                if (onArrivingIfUninterrupted) onArrivingIfUninterrupted()
            }, () => {
                this.Move(this.X(), this.Y())
            }, this.Rescale, this.Rescale, this.Rescale)
            if (this.PartOf.Paused()) this.Timer.Pause()
        }
    }

    readonly MoveAt = (leftPixels: number, topPixels: number, pixelsPerSecond: number, onArrivingIfUninterrupted?: () => void) => {
        this.MoveOver(leftPixels, topPixels, Distance(leftPixels, topPixels, this.X(), this.Y()) / pixelsPerSecond, onArrivingIfUninterrupted)
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

class ElementWithChildren implements IPausable {
    private readonly PartOf: SceneGraphBase
    private readonly Element: HTMLDivElement
    private readonly Children: Child[] = []

    constructor(partOf: SceneGraphBase, element: HTMLDivElement) {
        this.PartOf = partOf
        this.Element = element
    }

    readonly AddChild = (child: Child) => {
        if (this.PartOf.Deleted()) {
            child.Reference.Delete()
            return () => { }
        }

        this.Children.push(child)
        this.Element.appendChild(child.Element)

        return () => {
            Remove(this.Children, child)
            this.Element.removeChild(child.Element)
        }
    }

    readonly Delete = () => {
        while (true) {
            const child = this.Children.pop()
            if (!child) break
            child.Reference.Delete()
        }
    }

    readonly Rescale = () => {
        for (const child of this.Children) child.Rescale()
    }

    readonly Pause = () => {
        for (const child of this.Children) child.Reference.Pause()
    }

    readonly Resume = () => {
        for (const child of this.Children) child.Reference.Resume()
    }
}

class Viewport extends SceneGraphBase {
    private readonly Element: HTMLDivElement

    private readonly Children: ElementWithChildren
    readonly InternalAddChild: (child: Child) => () => void
    protected readonly OnPause: () => void
    protected readonly OnResume: () => void

    private readonly HorizontalAlignment: HorizontalAlignment
    private readonly VerticalAlignment: VerticalAlignment

    constructor(horizontalAlignment: HorizontalAlignment = "Middle", verticalAlignment: VerticalAlignment = "Middle", crop = true, onClick?: () => void) {
        super()
        this.Element = document.createElement("div")
        this.Element.style.position = "absolute"
        this.Element.style.overflow = crop ? "hidden" : "visible"
        this.Element.style.pointerEvents = "none"
        if (onClick) this.Element.onclick = () => { if (!this.Disabled()) Timers.InternalInvoke(onClick) }

        this.HorizontalAlignment = horizontalAlignment
        this.VerticalAlignment = verticalAlignment

        switch (horizontalAlignment) {
            case "Left":
                this.Element.style.left = "0"
                break
            case "Middle":
                this.Element.style.left = "50%"
                break
            case "Right":
                this.Element.style.right = "0"
                break
        }

        switch (verticalAlignment) {
            case "Top":
                this.Element.style.top = "0"
                break
            case "Middle":
                this.Element.style.top = "50%"
                break
            case "Bottom":
                this.Element.style.bottom = "0"
                break
        }

        this.Children = new ElementWithChildren(this, this.Element)
        this.InternalAddChild = this.Children.AddChild
        this.OnPause = this.Children.Pause
        this.OnResume = this.Children.Resume
        Display.RootElement.appendChild(this.Element)

        Timers.InternalFocusedChanged.Listen(this.Rescale)
        Display.Resized.Listen(this.Rescale)
        this.Rescale()
    }

    private readonly Rescale = () => {
        const realPixelsPerVirtualPixel = Display.RealPixelsPerVirtualPixel()

        this.Element.style.width = `${WidthVirtualPixels * realPixelsPerVirtualPixel}px`
        this.Element.style.height = `${HeightVirtualPixels * realPixelsPerVirtualPixel}px`

        if (this.HorizontalAlignment == "Middle") this.Element.style.marginLeft = `-${WidthVirtualPixels * realPixelsPerVirtualPixel / 2}px`
        if (this.VerticalAlignment == "Middle") this.Element.style.marginTop = `-${HeightVirtualPixels * realPixelsPerVirtualPixel / 2}px`

        this.Children.Rescale()
    }

    protected readonly OnDeletion = () => {
        Timers.InternalFocusedChanged.Unlisten(this.Rescale)
        Display.Resized.Unlisten(this.Rescale)
        Display.RootElement.removeChild(this.Element)
        this.Children.Delete()
    }

    protected readonly GetParentDisabled = () => false
    protected readonly OnHide = () => this.Element.style.visibility = "hidden"
    protected readonly OnShow = () => this.Element.style.visibility = "inherit"
    protected readonly GetParentHidden = () => false
}

class Group extends SceneGraphBase implements IMoveable {
    private readonly Parent: Viewport | Group
    private readonly RemoveFromParent: () => void

    private readonly MoveableElement: MoveableElement
    readonly X: () => number
    readonly Y: () => number
    readonly Move: (leftPixels: number, topPixels: number) => void
    readonly MoveOver: (leftPixels: number, topPixels: number, seconds: number, onArrivingIfUninterrupted?: () => void) => void
    readonly MoveAt: (leftPixels: number, topPixels: number, pixelsPerSecond: number, onArrivingIfUninterrupted?: () => void) => void

    private readonly Children: ElementWithChildren
    readonly InternalAddChild: (child: Child) => () => void

    constructor(parent: Viewport | Group, onClick?: () => void) {
        super()

        this.Parent = parent

        this.MoveableElement = new MoveableElement(this, UncacheGroup(), onClick)
        this.X = this.MoveableElement.X
        this.Y = this.MoveableElement.Y
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

class Sprite extends SceneGraphBase implements IMoveable {
    private readonly Parent: Viewport | Group
    private readonly RemoveFromParent: () => void

    private readonly MoveableElement: MoveableElement
    readonly X: () => number
    readonly Y: () => number
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
        this.X = this.MoveableElement.X
        this.Y = this.MoveableElement.Y
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

    private AnimationTimer: Timers.Once | undefined = undefined

    readonly Play = (animation: SpriteFrame | SpriteFrame[], onCompletionIfUninterrupted?: () => void) => {
        if (this.Deleted()) return
        if (this.AnimationTimer) {
            this.AnimationTimer.Cancel()
            this.AnimationTimer = undefined
        }
        if (animation instanceof SpriteFrame) {
            this.SetFrame(animation)
            if (onCompletionIfUninterrupted == null) return
            this.AnimationTimer = new Timers.Once(animation.DurationSeconds, onCompletionIfUninterrupted)
            if (this.Paused()) this.AnimationTimer.Pause()
        } else {
            let frame = 0
            const showNext = () => {
                this.SetFrame(animation[frame])
                if (frame == animation.length - 1) {
                    if (!onCompletionIfUninterrupted) return
                    this.AnimationTimer = new Timers.Once(animation[frame].DurationSeconds, onCompletionIfUninterrupted)
                } else {
                    this.AnimationTimer = new Timers.Once(animation[frame].DurationSeconds, showNext)
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