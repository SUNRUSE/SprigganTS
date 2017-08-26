namespace Display {
    export type ResizedCallback = (screenWidthPixels: number, screenHeightPixels: number, scaleFactor: number) => void
    export const Resized = new RecurringEvent<ResizedCallback>()

    let RealWidthPixelsValue = document.body.clientWidth
    export function RealWidthPixels() {
        return RealWidthPixelsValue
    }

    let RealHeightPixelsValue = document.body.clientHeight
    export function RealHeightPixels() {
        return RealHeightPixelsValue
    }

    export function RealPixelsPerVirtualPixel() {
        return Math.min(RealWidthPixels() / WidthVirtualPixels, RealHeightPixels() / HeightVirtualPixels)
    }

    onresize = () => {
        RealWidthPixelsValue = document.body.clientWidth
        RealHeightPixelsValue = document.body.clientHeight
        SceneRoot.Instance.Rescale()
        Resized.Raise(RealWidthPixels(), RealHeightPixels(), RealPixelsPerVirtualPixel())
    }
}