class OneTimeEvent<T extends Function> {
    private Raised: boolean
    private RaisedWith: any
    private readonly Listeners: T[] = []

    constructor() {
        const thisReference = this

        this.Raise = function () {
            if (thisReference.Raised) return
            thisReference.Raised = true
            thisReference.RaisedWith = arguments
            for (const listener of thisReference.Listeners) listener.apply(thisReference, arguments)
        } as any
    }

    Listen(listener: T): void {
        if (Contains(this.Listeners, listener)) return
        this.Listeners.push(listener)
        if (this.Raised) listener.apply(this, this.RaisedWith)
    }

    Unlisten(listener: T): void {
        if (this.Raised) return
        Remove(this.Listeners, listener)
    }

    readonly Raise: T
}

class RecurringEvent<T extends Function> {
    private readonly Listeners: T[] = []

    constructor() {
        const thisReference = this

        this.Raise = function () {
            for (const listener of thisReference.Listeners.slice()) listener.apply(thisReference, arguments)
        } as any
    }

    Listen(listener: T): void {
        if (Contains(this.Listeners, listener)) return
        this.Listeners.push(listener)
    }

    Unlisten(listener: T): void {
        Remove(this.Listeners, listener)
    }

    readonly Raise: T
}