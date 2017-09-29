namespace Display {
    export type ResizedCallback = (screenWidthPixels: number, screenHeightPixels: number, scaleFactor: number) => void

    let RealWidthPixelsValue = document.documentElement.clientWidth
    export function RealWidthPixels() {
        return RealWidthPixelsValue
    }

    let RealHeightPixelsValue = document.documentElement.clientHeight
    export function RealHeightPixels() {
        return RealHeightPixelsValue
    }

    export function RealPixelsPerVirtualPixel() {
        return Math.min(RealWidthPixels() / WidthVirtualPixels, RealHeightPixels() / HeightVirtualPixels)
    }

    onresize = () => {
        RealWidthPixelsValue = document.documentElement.clientWidth
        RealHeightPixelsValue = document.documentElement.clientHeight
        SceneRoot.Instance.Rescale()
        ResizeShade()
        ResizeTransition()
    }
}