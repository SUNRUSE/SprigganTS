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
    output[0].style.visibility = "inherit"
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
    output.style.visibility = "inherit"
    return output
}