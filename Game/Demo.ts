const Demos: Demo[] = []

class Demo {
    public readonly Name: string
    public readonly Setup: (group: Scene.Group) => () => void
    constructor(name: string, setup: (group: Scene.Group) => () => void) {
        Demos.push(this)
        this.Name = name
        this.Setup = setup
    }
}