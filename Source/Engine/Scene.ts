namespace Scene {

    let ScaleFactor = 1

    const Sprites = document.createElement("img")
    Sprites.style.touchAction = "manipulation" // Improves responsiveness on IE/Edge on touchscreens.
    Sprites.style.webkitBackfaceVisibility = "hidden" // Prevents a "pop" on Chrome when all transitions have finished.
    Sprites.style.position = "absolute"
    Sprites.style.pointerEvents = "all"

    type CachedSprite = [HTMLDivElement, HTMLImageElement]
    const CachedSprites: CachedSprite[] = []
    const CachedGroups: HTMLDivElement[] = []

    function CreateSprite(): CachedSprite {
        const container = CreateGroup()
        const image = Sprites.cloneNode(true) as HTMLImageElement
        container.appendChild(image)
        return [container, image]
    }

    function CacheSprite(sprite: CachedSprite) {
        const parent = sprite[0].parentElement
        if (parent) parent.removeChild(sprite[0])
        CachedSprites.push(sprite)
    }

    function UncacheSprite(): CachedSprite {
        const output = CachedSprites.pop() || CreateSprite()
        output[0].style.left = "0px"
        output[0].style.top = "0px"
        return output
    }

    function CreateGroup() {
        const element = document.createElement("div")
        element.style.position = "absolute"
        element.style.pointerEvents = "none"
        return element
    }

    function CacheGroup(group: HTMLDivElement) {
        CachedGroups.push(group)
    }

    function UncacheGroup(): HTMLDivElement {
        const output = CachedGroups.pop() || CreateGroup()
        output.style.top = "0px"
        output.style.left = "0px"
        return output
    }

    // Called by the engine to load the sprite sheet and perform any "massaging" required to get them to draw as pixelated sprites.
    // You should not need to call this yourself.
    export function LoadSprites(then: () => void) {
        SetLoadingMessage("Loading sprites...")
        let loaded = false
        Sprites.onload = () => {
            // Resizing the image can re-trigger the loaded event.
            if (loaded) return
            loaded = true
            SetLoadingMessage("Processing sprites...")
            if ("imageRendering" in Sprites.style) {
                (Sprites.style as any).imageRendering = "pixelated"; // Chrome.
                (Sprites.style as any).imageRendering = "-moz-crisp-edges" // Firefox.
            } else if ("msInterpolationMode" in Sprites.style) {
                (Sprites.style as any).msInterpolationMode = "nearest-neighbor" // IE.
            } else if (navigator.userAgent.indexOf("Nintendo 3DS") == -1) { // The 3DS actually uses nearest-neighbor anyway, and takes a long time to resize the sprite sheet.
                // Workaround for Edge as it always uses linear interpolation; scale up in a canvas to ensure that the pixels stay mostly square.
                const NearestNeighborWorkaroundScale = 4
                const inputCanvas = document.createElement("canvas")
                if (inputCanvas.getContext) {
                    inputCanvas.width = ContentSpritesWidth
                    inputCanvas.height = ContentSpritesHeight
                    const inputContext = inputCanvas.getContext("2d")
                    if (inputContext) {
                        inputContext.drawImage(Sprites, 0, 0)
                        const data = inputContext.getImageData(0, 0, ContentSpritesWidth, ContentSpritesHeight).data
                        const outputCanvas = document.createElement("canvas")
                        outputCanvas.width = Sprites.width * NearestNeighborWorkaroundScale
                        outputCanvas.height = Sprites.height * NearestNeighborWorkaroundScale
                        const outputContext = outputCanvas.getContext("2d")
                        if (outputContext) {
                            // Newer versions of Edge don't support disabling image smoothing, so we have to do a manual blit.
                            for (let y = 0; y < ContentSpritesWidth; y++)
                                for (let x = 0; x < ContentSpritesHeight; x++) {
                                    outputContext.fillStyle = `rgba(${data[x * 4 + y * ContentSpritesWidth * 4]}, ${data[x * 4 + y * ContentSpritesWidth * 4 + 1]}, ${data[x * 4 + y * ContentSpritesWidth * 4 + 2]}, ${data[x * 4 + y * ContentSpritesWidth * 4 + 3] / 255})`
                                    outputContext.fillRect(x * NearestNeighborWorkaroundScale, y * NearestNeighborWorkaroundScale, NearestNeighborWorkaroundScale, NearestNeighborWorkaroundScale)
                                }
                            Sprites.src = outputCanvas.toDataURL("image/png")
                        }
                    }
                }
            }

            SetLoadingMessage("Caching sprites...")
            setTimeout(() => {
                while (CachedSprites.length < 500) CachedSprites.push(CreateSprite())
                SetLoadingMessage("Caching groups...")
                setTimeout(() => {
                    while (CachedGroups.length < 100) CachedGroups.push(CreateGroup())
                    then()
                }, 0)
            }, 0)
        }
        Sprites.onerror = () => SetLoadingMessage("Failed to load sprites.  Please try refreshing this page.")
        Sprites.src = "Sprites.png"
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

    abstract class SceneGraphBase implements IPausable, IDeletable {
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
    }

    interface IMoveable extends IPausable {
        readonly X: () => number
        readonly Y: () => number
        readonly Move: (leftPixels: number, topPixels: number) => void
        readonly MoveOver: (leftPixels: number, topPixels: number, seconds: number, onArrivingIfUninterrupted?: () => void) => void
        readonly MoveAt: (leftPixels: number, topPixels: number, pixelsPerSecond: number, onArrivingIfUninterrupted?: () => void) => void
    }

    class MoveableElement implements IMoveable, IDeletable {
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
            if (onClick) this.Element.onclick = () => Timers.Invoke(onClick)
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
            this.Element.style.left = `${leftPixels * ScaleFactor}px`
            this.Element.style.top = `${topPixels * ScaleFactor}px`
        }

        readonly Delete = () => {
            this.Pause()
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
                if (this.Timer && !this.Timer.Paused()) {
                    const remainingSeconds = this.Timer.DurationSeconds - this.Timer.ElapsedSeconds()
                    this.Element.style.transition = `top ${remainingSeconds}s linear, left ${remainingSeconds}s linear`
                    this.SetElementLocation(this.ToX, this.ToY)
                }
            } else {
                this.SetElementLocation(this.X(), this.Y())
            }
        }

        readonly Move = (leftPixels: number, topPixels: number) => {
            if (this.Timer) {
                this.Timer.Cancel()
                this.Timer = undefined
            }

            this.FromX = this.ToX = Math.round(leftPixels)
            this.FromY = this.ToY = Math.round(topPixels)
            this.Rescale()
        }

        readonly MoveOver = (leftPixels: number, topPixels: number, seconds: number, onArrivingIfUninterrupted?: () => void) => {
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

    const ViewportRescaleCallbacks: (() => void)[] = []

    export class Viewport extends SceneGraphBase {
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
            if (onClick) this.Element.onclick = () => Timers.Invoke(onClick)

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
            document.body.appendChild(this.Element)

            ViewportRescaleCallbacks.push(this.Rescale)
            this.Rescale()
        }

        private readonly Rescale = () => {
            this.Element.style.width = `${ResolutionX * ScaleFactor}px`
            this.Element.style.height = `${ResolutionY * ScaleFactor}px`

            if (this.HorizontalAlignment == "Middle") this.Element.style.marginLeft = `-${ResolutionX * ScaleFactor / 2}px`
            if (this.VerticalAlignment == "Middle") this.Element.style.marginTop = `-${ResolutionY * ScaleFactor / 2}px`

            this.Children.Rescale()
        }

        protected readonly OnDeletion = () => {
            Remove(ViewportRescaleCallbacks, this.Rescale)
            document.body.removeChild(this.Element)
            this.Children.Delete()
        }
    }

    export class Group extends SceneGraphBase implements IMoveable {
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
    }

    export class Sprite extends SceneGraphBase implements IMoveable {
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
                if (this.AnimationTimer) {
                    this.AnimationTimer.Cancel()
                    this.AnimationTimer = undefined
                }
                this.Play(animation)
            } else {
                const playAgain = () => this.Play(animation, playAgain)
                playAgain()
            }
        }

        private readonly SetFrame = (frame: SpriteFrame) => {
            this.CurrentFrame = frame
            this.MoveableElement.Element.style.width = `${frame.WidthPixels * ScaleFactor}px`
            this.MoveableElement.Element.style.height = `${frame.HeightPixels * ScaleFactor}px`
            this.MoveableElement.Element.style.marginLeft = `${frame.MarginLeft * ScaleFactor}px`
            this.MoveableElement.Element.style.marginTop = `${frame.MarginTop * ScaleFactor}px`
            this.ImageElement[1].style.left = `-${frame.LeftPixels * ScaleFactor}px`
            this.ImageElement[1].style.width = `${ContentSpritesWidth * ScaleFactor}px`
            this.ImageElement[1].style.top = `-${frame.TopPixels * ScaleFactor}px`
            this.ImageElement[1].style.height = `${ContentSpritesHeight * ScaleFactor}px`
        }
    }

    onresize = SetPixelDensity
    SetPixelDensity()

    function SetPixelDensity() {
        const windowWidth = document.body.clientWidth
        const windowHeight = document.body.clientHeight
        ScaleFactor = Math.min(windowWidth / ResolutionX, windowHeight / ResolutionY)
        for (const callback of ViewportRescaleCallbacks) callback()
    }
}