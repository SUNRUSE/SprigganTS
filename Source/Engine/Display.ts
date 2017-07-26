namespace Display {
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

    onresize = () => Resized.Raise(RealWidthPixels(), RealHeightPixels(), RealPixelsPerVirtualPixel())
}