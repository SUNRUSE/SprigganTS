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

    export function RealWidthPixels() {
        return document.body.clientWidth
    }

    export function RealHeightPixels() {
        return document.body.clientHeight
    }

    export function RealPixelsPerVirtualPixel() {
        return Math.min(RealWidthPixels() / ResolutionX, RealHeightPixels() / ResolutionY)
    }

    onresize = () => {
        ResizeRootElement()
        Resized.Raise(RealWidthPixels(), RealHeightPixels(), RealPixelsPerVirtualPixel())
    }
}