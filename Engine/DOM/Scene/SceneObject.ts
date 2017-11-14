abstract class SceneObject {
    protected readonly Parent?: SceneObject
    protected readonly Children: SceneObject[] = []
    readonly StaticSprites: StaticSprite[] = []
    readonly Element: HTMLDivElement
    private LocallyDeletedValue = false
    private LocallyDisabledValue = false
    private LocallyPausedValue = false

    constructor(parent?: SceneObject, onClick?: () => void) {
        if (parent) this.LocallyDeletedValue = parent.LocallyDeletedValue
        if (this.LocallyDeletedValue) return
        this.Parent = parent
        if (parent) parent.Children.push(this)
        this.Element = this.CreateElement()
        if (parent)
            parent.Element.appendChild(this.Element)
        else
            document.body.appendChild(this.Element)
        if (onClick) this.Element.onclick = () => {
            if (this.LocallyDeletedValue) return
            if (this.Disabled()) return
            InternalInvoke(onClick)
        }
    }

    protected Moved(): void {
        for (const child of this.Children) child.Moved()
        this.OnMoved()
    }

    protected OnMoved(): void { }

    SecondsUntilDestinationReachedForTransitions(): number {
        return this.Parent ? this.Parent.SecondsUntilDestinationReachedForTransitions() : Infinity
    }

    CurrentAbsoluteVirtualPixelsFromLeftForTransitions(): number {
        return this.Parent ? this.Parent.CurrentAbsoluteVirtualPixelsFromLeftForTransitions() : 0
    }

    DestinationAbsoluteVirtualPixelsFromLeftForTransitions(): number {
        return this.Parent ? this.Parent.DestinationAbsoluteVirtualPixelsFromLeftForTransitions() : 0
    }

    protected abstract CreateElement(): HTMLDivElement

    protected Deleted(): boolean {
        return this.LocallyDeletedValue
    }

    protected Paused(): boolean {
        if (this.LocallyPausedValue) return true
        if (this.Parent) return this.Parent.Paused()
        return false
    }

    protected Disabled(): boolean {
        if (this.LocallyDisabledValue) return true
        if (this.Parent) return this.Parent.Disabled()
        return false
    }

    Pause(): SceneObject {
        if (this.LocallyDeletedValue) return this
        if (this.LocallyPausedValue) return this
        this.LocallyPausedValue = true
        if (this.Parent && this.Parent.Paused()) return this
        this.OnPause()
        for (const child of this.Children) child.PausedByParent()
        return this
    }

    private PausedByParent(): void {
        // Don't pause us because we're already paused.
        if (this.LocallyPausedValue) return
        this.OnPause()
        for (const child of this.Children) child.PausedByParent()
    }

    protected OnPause(): void { }

    Resume(): SceneObject {
        if (this.LocallyDeletedValue) return this
        if (!this.LocallyPausedValue) return this
        this.LocallyPausedValue = false
        if (this.Paused()) return this
        this.OnResume()
        for (const child of this.Children) child.ResumedByParent()
        return this
    }

    private ResumedByParent(): void {
        // Don't resume us because we've paused ourselves.
        if (this.LocallyPausedValue) return
        this.OnResume()
        for (const child of this.Children) child.ResumedByParent()
    }

    protected OnResume(): void { }

    Hide(): SceneObject {
        if (this.LocallyDeletedValue) return this
        this.Element.style.visibility = "hidden"
        return this
    }

    Show(): SceneObject {
        if (this.LocallyDeletedValue) return this
        this.Element.style.visibility = "inherit"
        return this
    }

    Disable(): SceneObject {
        if (this.LocallyDeletedValue) return this
        this.LocallyDisabledValue = true
        return this
    }

    Enable(): SceneObject {
        if (this.LocallyDeletedValue) return this
        this.LocallyDisabledValue = false
        return this
    }

    Rescale(): void {
        this.OnRescale()
        for (const staticSprite of this.StaticSprites) staticSprite.Rescale()
        for (const child of this.Children) child.Rescale()
    }

    protected abstract OnRescale(): void

    abstract Tick(): boolean

    Delete(): void {
        if (this.LocallyDeletedValue) return
        while (this.StaticSprites.length) this.StaticSprites[0].Delete()
        while (this.Children.length) this.Children[0].Delete()
        this.Element.style.visibility = "inherit"
        this.Element.onclick = () => { }
        if (this.Parent) this.Parent.Element.removeChild(this.Element)
        this.OnDelete()
        this.LocallyDeletedValue = true
        if (this.Parent) Remove(this.Parent.Children, this)
    }

    protected OnDelete(): void { }
}