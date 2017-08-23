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