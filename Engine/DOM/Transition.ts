let CurrentTransition: TransitionInstance | undefined = undefined

class TransitionInstance {
    private readonly Entry: Timer
    private readonly Exit: Timer
    private Paused = false

    private readonly WrappingElement: HTMLDivElement

    private readonly Elements: {
        readonly Element: HTMLDivElement
        readonly Animation: TransitionAnimation
    }[] = []

    constructor(animations: TransitionAnimation[], entryDurationSeconds: number, exitDurationSeconds: number, call: () => void) {
        this.WrappingElement = document.createElement("div")
        this.WrappingElement.style.position = "absolute"
        this.WrappingElement.style.left = "0"
        this.WrappingElement.style.top = "0"
        this.WrappingElement.style.width = `${Display.RealWidthPixels()}px`
        this.WrappingElement.style.height = `${Display.RealHeightPixels()}px`
        document.body.appendChild(this.WrappingElement)

        for (const animation of animations) {
            const element = document.createElement("div")
            element.style.position = "absolute"
            element.style.left = "0"
            element.style.top = "0"
            element.style.right = "0"
            element.style.bottom = "0"
            this.ApplyStaticProperties(element, animation.Initial)
            this.ApplyDynamicProperties(element, animation.Entry, 0)
            this.WrappingElement.appendChild(element)
            // IE10+, Edge, Firefox, Chrome.
            if ("transition" in document.body.style) {
                this.ForceStyleRefresh(element)
                this.SetTransition(element, animation.Entry, entryDurationSeconds)
                this.ApplyDynamicProperties(element, animation.Entry, 1)
            }
            this.Elements.push({
                Element: element,
                Animation: animation
            })
        }

        this.Entry = new Timer(entryDurationSeconds, () => {
            call()
            for (const element of this.Elements) {
                element.Element.style.transition = "initial"
                this.ApplyStaticProperties(element.Element, element.Animation.EntryToExit)
                this.ApplyDynamicProperties(element.Element, element.Animation.Exit, 0)
                // IE10+, Edge, Firefox, Chrome.
                if ("transition" in document.body.style) {
                    this.ForceStyleRefresh(element.Element)
                    this.SetTransition(element.Element, element.Animation.Exit, exitDurationSeconds)
                    this.ApplyDynamicProperties(element.Element, element.Animation.Exit, 1)
                }
            }
            this.Exit.Resume()
        })
        this.Exit = new Timer(exitDurationSeconds, () => {
            document.body.removeChild(this.WrappingElement)
            CurrentTransition = undefined
        }).Pause()
    }

    private ForceStyleRefresh(element: HTMLDivElement): void {
        window.getComputedStyle(element, undefined).getPropertyValue("left")
    }

    private ApplyStaticProperties(element: HTMLDivElement, properties: { [name: string]: string }): void {
        for (const name in properties) (element.style as any)[name] = properties[name]
    }

    private ApplyDynamicProperties(element: HTMLDivElement, properties: { [name: string]: (progress: number) => string }, progress: number): void {
        for (const name in properties) (element.style as any)[name] = properties[name](progress)
    }

    private SetTransition(element: HTMLDivElement, source: { [name: string]: any }, durationSeconds: number): void {
        let value = ""
        let first = true
        for (const name in source) {
            if (first)
                first = false
            else
                value += ", "

            value += `${name} ${durationSeconds}s linear`
        }
        element.style.transition = value
    }

    Tick(): void {
        if (!this.Entry.Completed()) {
            for (const element of this.Elements) this.ApplyDynamicProperties(element.Element, element.Animation.Entry, this.Entry.ElapsedUnitInterval())
        } else {
            for (const element of this.Elements) this.ApplyDynamicProperties(element.Element, element.Animation.Exit, this.Exit.ElapsedUnitInterval())
        }
    }

    Pause(): void {
        if (this.Paused) return
        this.Paused = true
        if ("transition" in document.body.style) {
            // IE10+, Edge, Firefox, Chrome.
            if (!this.Entry.Completed()) {
                for (const element of this.Elements) {
                    this.ApplyDynamicProperties(element.Element, element.Animation.Entry, this.Entry.ElapsedUnitInterval())
                    element.Element.style.transition = "initial"
                }
            } else {
                for (const element of this.Elements) {
                    this.ApplyDynamicProperties(element.Element, element.Animation.Exit, this.Exit.ElapsedUnitInterval())
                    element.Element.style.transition = "initial"
                }
            }
        } else {
            // IE9-.
            this.Tick()
        }
    }

    Resume(): void {
        if (!this.Paused) return
        this.Paused = false
        if ("transition" in document.body.style) {
            // IE10+, Edge, Firefox, Chrome.
            if (!this.Entry.Completed()) {
                for (const element of this.Elements) {
                    this.SetTransition(element.Element, element.Animation.Entry, this.Entry.DurationSeconds - this.Entry.ElapsedSeconds())
                    this.ApplyDynamicProperties(element.Element, element.Animation.Entry, 1)
                }
            } else {
                for (const element of this.Elements) {
                    this.SetTransition(element.Element, element.Animation.Exit, this.Exit.DurationSeconds - this.Exit.ElapsedSeconds())
                    this.ApplyDynamicProperties(element.Element, element.Animation.Exit, 1)
                }
            }
        } else {
            // IE9-.
            this.Tick()
        }
    }

    Resize(): void {
        this.WrappingElement.style.width = `${Display.RealWidthPixels()}px`
        this.WrappingElement.style.height = `${Display.RealHeightPixels()}px`
    }
}

type TransitionAnimation = {
    readonly Initial: { [name: string]: string }
    readonly Entry: { [name: string]: (progress: number) => string }
    readonly EntryToExit: { [name: string]: string }
    readonly Exit: { [name: string]: (progress: number) => string }
}

const FadeToBlackTransitionCssProperties: TransitionAnimation[] = [{
    Initial: { background: "black" },
    Entry: {
        opacity: progress => `${progress}`,
        filter: progress => `alpha(opacity=${progress * 100})`
    },
    EntryToExit: {},
    Exit: {
        opacity: progress => `${1 - progress}`,
        filter: progress => `alpha(opacity=${(1 - progress) * 100})`
    }
}]

const FadeToWhiteTransitionCssProperties: TransitionAnimation[] = [{
    Initial: { background: "white" },
    Entry: {
        opacity: progress => `${progress}`,
        filter: progress => `alpha(opacity=${progress * 100})`
    },
    EntryToExit: {},
    Exit: {
        opacity: progress => `${1 - progress}`,
        filter: progress => `alpha(opacity=${(1 - progress) * 100})`
    }
}]

function Transition(type: TransitionType, entryDurationSeconds: number, exitDurationSeconds: number, call: () => void): void {
    if (CurrentTransition) throw "Cannot enter a transition while entering or exiting a previous transition"
    let selected: TransitionAnimation[]
    switch (type) {
        case TransitionType.FadeToBlack:
            selected = FadeToBlackTransitionCssProperties
            break
        case TransitionType.FadeToWhite:
            selected = FadeToWhiteTransitionCssProperties
            break
        default: throw "Unexpected TransitionType"
    }
    CurrentTransition = new TransitionInstance(selected, entryDurationSeconds, exitDurationSeconds, call)
}

function TickTransition(): boolean {
    if (!CurrentTransition) return false
    // IE10+, Edge, Firefox, Chrome.
    if ("transition" in document.body.style) return false
    // IE9-.
    CurrentTransition.Tick()
    return true
}

function ResizeTransition(): void {
    if (!CurrentTransition) return
    CurrentTransition.Resize()
}

function PauseTransition(): void {
    if (!CurrentTransition) return
    CurrentTransition.Pause()
}

function ResumeTransition(): void {
    if (!CurrentTransition) return
    CurrentTransition.Resume()
}