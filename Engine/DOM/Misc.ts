function InternalLoadAndPrepareImage(url: string, prescaledUrl: string, widthPixels: number, heightPixels: number, onSuccess: (element: HTMLImageElement) => void, onError?: () => void) {
    const element = document.createElement("img")
    let loaded = false
    element.onload = () => {
        // Resizing the image can re-trigger the loaded event.
        if (loaded) return
        loaded = true
        SetLoadingMessage("Processing sprites...")
        if ("imageRendering" in element.style) {
            (element.style as any).imageRendering = "-moz-crisp-edges"; // Firefox.
            (element.style as any).imageRendering = "-webkit-optimize-contrast"; // Safari.
            (element.style as any).imageRendering = "pixelated" // Chrome.
        } else if ("msInterpolationMode" in element.style) {
            (element.style as any).msInterpolationMode = "nearest-neighbor" // IE.
        }
        onSuccess(element)
    }
    if (onError) element.onerror = onError
    element.src = ("imageRendering" in element.style)
        || ("msInterpolationMode" in element.style)
        || (navigator.userAgent.indexOf("Nintendo 3DS") != -1) // The 3DS actually uses nearest-neighbor anyway, and takes a long time to resize the sprite sheet.
        ? url
        : prescaledUrl // Newer versions of Edge don't support disabling image smoothing, so we have to do a manual blit.
}

function ForceStyleRefresh(element: HTMLDivElement): void {
    window.getComputedStyle(element, undefined).getPropertyValue("left")
}