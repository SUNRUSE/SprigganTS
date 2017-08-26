function CreateGroup(): HTMLDivElement {
    const element = document.createElement("div")
    element.style.position = "absolute"
    element.style.pointerEvents = "none"
    return element
}

const CachedGroups: HTMLDivElement[] = []

class Group extends MovingSceneObject {
    constructor(parent: Viewport | Group, onClick?: () => void) {
        super(parent, onClick)
        if (this.Deleted()) return
        this.Rescale()
    }

    protected CreateElement(): HTMLDivElement {
        return CachedGroups.pop() || CreateGroup()
    }

    protected OnMovingSceneObjectDelete(): void {
        CachedGroups.push(this.Element)
    }
}