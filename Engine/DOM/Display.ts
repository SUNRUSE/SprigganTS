namespace Display {
    // A lot of browsers just will not accept an overflow:hidden on the body, which means we must make a div to prevent scrolling.
    export const RootElement = document.createElement("div")
    RootElement.style.position = "absolute"
    RootElement.style.left = "0"
    RootElement.style.top = "0"
    RootElement.style.overflow = "hidden"

    // Called by the engine during startup.
    // You should not need to call this yourself.
    export function InternalInitialize() {
        ResizeRootElement()
        document.body.appendChild(RootElement)
    }

    function ResizeRootElement() {
        RootElement.style.width = `${RealWidthPixels()}px`
        RootElement.style.height = `${RealHeightPixels()}px`
    }

    export type ResizedCallback = (screenWidthPixels: number, screenHeightPixels: number, scaleFactor: number) => void
    export const Resized = new Events.Recurring<ResizedCallback>()

    let RealWidthPixelsValue = document.body.clientWidth
    export function RealWidthPixels() {
        return RealWidthPixelsValue
    }

    let RealHeightPixelsValue = document.body.clientHeight
    export function RealHeightPixels() {
        return RealHeightPixelsValue
    }

    export function RealPixelsPerVirtualPixel() {
        return Math.min(RealWidthPixels() / WidthVirtualPixels, RealHeightPixels() / ResolutionY)
    }

    onresize = () => {
        RealWidthPixelsValue = document.body.clientWidth
        RealHeightPixelsValue = document.body.clientHeight
        ResizeRootElement()
        Resized.Raise(RealWidthPixels(), RealHeightPixels(), RealPixelsPerVirtualPixel())
    }
}