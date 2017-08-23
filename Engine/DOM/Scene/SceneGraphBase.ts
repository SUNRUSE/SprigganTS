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