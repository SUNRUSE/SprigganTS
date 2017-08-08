const Demos: Demo[] = []

class Demo {
    public readonly Name: string
    public readonly Setup: (group: Group) => () => void
    constructor(name: string, setup: (group: Group) => () => void) {
        Demos.push(this)
        this.Name = name
        this.Setup = setup
    }
}