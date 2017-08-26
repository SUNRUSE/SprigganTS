class SceneRoot extends SceneObject {
    static readonly Instance = new SceneRoot()

    constructor() {
        super()
        this.Rescale()
    }

    protected CreateElement(): HTMLDivElement {
        const element = document.createElement("div")
        element.style.position = "absolute"
        element.style.left = "0"
        element.style.top = "0"
        element.style.overflow = "hidden"
        return element
    }

    protected OnRescale(): void {
        this.Element.style.width = `${Display.RealWidthPixels()}px`
        this.Element.style.height = `${Display.RealHeightPixels()}px`
    }

    Tick(): boolean {
        // IE10+, Edge, Firefox, Chrome.
        if ("transition" in this.Element.style) {
            return false
        } else {
            // IE9-.
            let any = false
            for (const child of this.Children) if (child.Tick()) any = true
            return any
        }
    }
}