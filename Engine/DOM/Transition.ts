class TransitionStepRectangleInstance {
    private readonly Timer: Timer
    private readonly From: TransitionStepRectangleKeyFrame
    private readonly To: TransitionStepRectangleKeyFrame
    private readonly Element: HTMLDivElement

    constructor(wrappingElement: HTMLDivElement, timer: Timer, from: TransitionStepRectangleKeyFrame, to: TransitionStepRectangleKeyFrame) {
        this.From = from
        this.To = to
        this.Timer = timer
        this.Element = document.createElement("div")
        this.Element.style.position = "absolute"
        this.SetStyle(0)
        wrappingElement.appendChild(this.Element)
        if ("transition" in this.Element.style) {
            ForceStyleRefresh(this.Element)
            this.SetTransition(timer.DurationSeconds)
            this.SetStyle(1)
        }
    }

    SetTransition(seconds: number): void {
        this.Element.style.transition = `left ${seconds}s linear, right ${seconds}s linear, top ${seconds}s linear, bottom ${seconds}s linear, opacity ${seconds}s linear, background ${seconds}s linear`
    }

    SetStyle(progress: number): void {
        this.Element.style.left = `${Mix(this.From.LeftSignedUnitInterval, this.To.LeftSignedUnitInterval, progress) * 50 + 50}%`
        this.Element.style.right = `${Mix(this.From.RightSignedUnitInterval, this.To.RightSignedUnitInterval, progress) * -50 + 50}%`
        this.Element.style.top = `${Mix(this.From.TopSignedUnitInterval, this.To.TopSignedUnitInterval, progress) * 50 + 50}%`
        this.Element.style.bottom = `${Mix(this.From.BottomSignedUnitInterval, this.To.BottomSignedUnitInterval, progress) * -50 + 50}%`
        function RgbChannel(from: number, to: number) {
            return Math.max(0, Math.min(255, Math.round(Mix(from, to, progress) * 255)))
        }
        this.Element.style.background = `rgb(${RgbChannel(this.From.RedUnitInterval, this.To.RedUnitInterval)}, ${RgbChannel(this.From.GreenUnitInterval, this.To.GreenUnitInterval)}, ${RgbChannel(this.From.BlueUnitInterval, this.To.BlueUnitInterval)})`
        this.Element.style.opacity = `${Mix(this.From.OpacityUnitInterval, this.To.OpacityUnitInterval, progress)}`
        this.Element.style.filter = `alpha(opacity=${Mix(this.From.OpacityUnitInterval, this.To.OpacityUnitInterval, progress) * 100})`
    }

    Pause(): void {
        this.Tick()
        if ("transition" in this.Element.style) {
            this.Element.style.transition = "initial"
            ForceStyleRefresh(this.Element)
        }
    }

    Resume(): void {
        if ("transition" in this.Element.style) {
            this.SetTransition(this.Timer.DurationSeconds - this.Timer.ElapsedSeconds())
            this.SetStyle(1)
        } else {
            this.Tick()
        }
    }

    Tick(): void {
        this.SetStyle(this.Timer.ElapsedUnitInterval())
    }
}

class TransitionStepInstance {
    private readonly WrappingElement: HTMLDivElement
    private readonly Rectangles: TransitionStepRectangleInstance[] = []

    constructor(step: TransitionStep, call: () => void) {
        this.WrappingElement = document.createElement("div")
        this.WrappingElement.style.position = "absolute"
        this.WrappingElement.style.left = "0px"
        this.WrappingElement.style.top = "0px"
        this.Resize()
        document.body.appendChild(this.WrappingElement)
        const timer = new Timer(step.DurationSeconds, () => {
            call()
            document.body.removeChild(this.WrappingElement)
        })
        for (const rectangle of step.Rectangles) this.Rectangles.push(new TransitionStepRectangleInstance(this.WrappingElement, timer, rectangle.From, rectangle.To))
    }

    Pause(): void {
        for (const rectangle of this.Rectangles) rectangle.Pause()
    }

    Resume(): void {
        for (const rectangle of this.Rectangles) rectangle.Resume()
    }

    Tick(): void {
        for (const rectangle of this.Rectangles) rectangle.Tick()
    }

    Resize(): void {
        this.WrappingElement.style.width = `${Display.RealWidthPixels()}px`
        this.WrappingElement.style.height = `${Display.RealHeightPixels()}px`
    }
}

class TransitionInstance {
    private readonly EntryInstance: TransitionStepInstance
    private readonly Exit: TransitionStep
    private ExitInstance: TransitionStepInstance | undefined

    constructor(entry: TransitionStep, exit: TransitionStep, call: () => void) {
        this.Exit = exit
        this.EntryInstance = new TransitionStepInstance(entry, () => {
            call()
            this.ExitInstance = new TransitionStepInstance(exit, () => CurrentTransition = undefined)
        })
    }

    Resize(): void {
        if (this.ExitInstance)
            this.ExitInstance.Resize()
        else
            this.EntryInstance.Resize()
    }

    Pause(): void {
        if (this.ExitInstance)
            this.ExitInstance.Pause()
        else
            this.EntryInstance.Pause()
    }

    Resume(): void {
        if (this.ExitInstance)
            this.ExitInstance.Resume()
        else
            this.EntryInstance.Resume()
    }

    Tick(): void {
        if (this.ExitInstance)
            this.ExitInstance.Tick()
        else
            this.EntryInstance.Tick()
    }
}

let CurrentTransition: TransitionInstance | undefined

function Transition(entry: TransitionStep, exit: TransitionStep, call: () => void): void {
    if (CurrentTransition) throw "Cannot enter a transition while entering or exiting a previous transition"
    CurrentTransition = new TransitionInstance(entry, exit, call)
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