namespace Events {
    export class Once<T extends Function> {
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

        readonly Listen = (listener: T) => {
            if (Contains(this.Listeners, listener)) return
            this.Listeners.push(listener)
            if (this.Raised) listener.apply(this, this.RaisedWith)
        }

        readonly Unlisten = (listener: T) => {
            if (this.Raised) return
            Remove(this.Listeners, listener)
        }

        readonly Raise: T
    }

    export class Recurring<T extends Function> {
        private readonly Listeners: T[] = []

        constructor() {
            const thisReference = this

            this.Raise = function () {
                for (const listener of thisReference.Listeners.slice()) listener.apply(thisReference, arguments)
            } as any
        }

        readonly Listen = (listener: T) => {
            if (Contains(this.Listeners, listener)) return
            this.Listeners.push(listener)
        }

        readonly Unlisten = (listener: T) => {
            Remove(this.Listeners, listener)
        }

        readonly Raise: T
    }
}