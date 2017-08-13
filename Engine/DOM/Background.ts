namespace Background {
    const Cache: HTMLImageElement[] = []
    function Load(frame: BackgroundFrame, then: (requiresInvoke: boolean) => void) {
        if (Cache[frame.FileNumber]) {
            then(false)
            return false
        } else {
            InternalLoadAndPrepareImage(`Backgrounds/${frame.FileNumber}.png`, frame.Width, frame.Height, element => {
                element.style.position = "absolute"
                // It's possible someone else already loaded it as we don't stop other "threads" caching the same background.
                // Unlikely, but just throw our copy away if that's the case.
                if (!Cache[frame.FileNumber]) Cache[frame.FileNumber] = element
                then(true)
            })
            return true
        }
    }

    let PausedValue = false
    let AnimationTimer: Timer | undefined = undefined
    let ActiveFrame: BackgroundFrame | undefined = undefined
    let SetId = 0

    Display.Resized.Listen(() => {
        if (ActiveFrame) Rescale(ActiveFrame)
    })

    function Rescale(frame: BackgroundFrame) {
        const element = Cache[frame.FileNumber]
        const realPixelsPerVirtualPixel = Display.RealPixelsPerVirtualPixel()
        element.style.width = `${frame.Width * realPixelsPerVirtualPixel}px`
        element.style.height = `${frame.Height * realPixelsPerVirtualPixel}px`
        element.style.left = `${(Display.RealWidthPixels() - frame.Width * realPixelsPerVirtualPixel) / 2}px`
        element.style.top = `${(Display.RealHeightPixels() - frame.Height * realPixelsPerVirtualPixel) / 2}px`
    }

    let ActiveBackground: BackgroundFrame | BackgroundFrame[] | undefined = undefined

    export function Set(background: BackgroundFrame | BackgroundFrame[]) {
        if (background == ActiveBackground) return
        ActiveBackground = background
        SetId++
        const setIdCopy = SetId
        if (background instanceof BackgroundFrame) {
            if (Load(background, () => {
                if (SetId != setIdCopy) return
                SetActiveFrame(background)
            })) SetActiveFrame(undefined) // Only remove the previous background if we're going to need to wait for the next one.
        } else {
            // "Lock-in" the array type.
            const backgroundReference = background

            let loaded = 0
            let frame = 0
            LoadNext()
            function LoadNext() {
                if (Load(backgroundReference[loaded], requiresInvoke => {
                    if (SetId != setIdCopy) return
                    loaded++
                    if (loaded == backgroundReference.length) {
                        if (requiresInvoke)
                            InternalInvoke(ShowNext)
                        else
                            ShowNext()
                    } else {
                        LoadNext()
                    }
                })) SetActiveFrame(undefined) // Only remove the previous background if we're going to need to wait for the next one.
            }

            function ShowNext() {
                SetActiveFrame(backgroundReference[frame])
                AnimationTimer = new Timer(backgroundReference[frame].DurationSeconds, ShowNext)
                if (PausedValue) AnimationTimer.Pause()
                frame = (frame + 1) % backgroundReference.length
            }
        }
    }

    export function Paused() {
        return PausedValue
    }

    export function Pause() {
        if (AnimationTimer) AnimationTimer.Pause()
        PausedValue = true
    }

    export function Resume() {
        if (AnimationTimer) AnimationTimer.Resume()
        PausedValue = false
    }

    export function Remove() {
        ActiveBackground = undefined
        SetActiveFrame(undefined)
    }

    function SetActiveFrame(frame: BackgroundFrame | undefined) {
        if (AnimationTimer) {
            AnimationTimer.Cancel()
            AnimationTimer = undefined
        }
        if (frame) {
            if (ActiveFrame) {
                Display.RootElement.replaceChild(Cache[frame.FileNumber], Cache[ActiveFrame.FileNumber])
            } else {
                Display.RootElement.insertBefore(Cache[frame.FileNumber], Display.RootElement.firstChild)
            }
            Rescale(frame)
        } else {
            if (ActiveFrame) Display.RootElement.removeChild(Cache[ActiveFrame.FileNumber])
        }
        ActiveFrame = frame
    }
}