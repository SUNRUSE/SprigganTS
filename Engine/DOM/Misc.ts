function InternalLoadAndPrepareImage(url: string, widthPixels: number, heightPixels: number, onSuccess: (element: HTMLImageElement) => void, onError?: () => void) {
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
        } else if (navigator.userAgent.indexOf("Nintendo 3DS") == -1) { // The 3DS actually uses nearest-neighbor anyway, and takes a long time to resize the sprite sheet.
            // Workaround for Edge as it always uses linear interpolation; scale up in a canvas to ensure that the pixels stay mostly square.
            const NearestNeighborWorkaroundScale = 4
            const inputCanvas = document.createElement("canvas")
            if (inputCanvas.getContext) {
                inputCanvas.width = widthPixels
                inputCanvas.height = heightPixels
                const inputContext = inputCanvas.getContext("2d")
                if (inputContext) {
                    inputContext.drawImage(element, 0, 0)
                    const data = inputContext.getImageData(0, 0, widthPixels, heightPixels).data
                    const outputCanvas = document.createElement("canvas")
                    outputCanvas.width = element.width * NearestNeighborWorkaroundScale
                    outputCanvas.height = element.height * NearestNeighborWorkaroundScale
                    const outputContext = outputCanvas.getContext("2d")
                    if (outputContext) {
                        // Newer versions of Edge don't support disabling image smoothing, so we have to do a manual blit.
                        for (let y = 0; y < heightPixels; y++)
                            for (let x = 0; x < widthPixels; x++) {
                                outputContext.fillStyle = `rgba(${data[x * 4 + y * widthPixels * 4]}, ${data[x * 4 + y * widthPixels * 4 + 1]}, ${data[x * 4 + y * widthPixels * 4 + 2]}, ${data[x * 4 + y * widthPixels * 4 + 3] / 255})`
                                outputContext.fillRect(x * NearestNeighborWorkaroundScale, y * NearestNeighborWorkaroundScale, NearestNeighborWorkaroundScale, NearestNeighborWorkaroundScale)
                            }
                        element.src = outputCanvas.toDataURL("image/png")
                    }
                }
            }
        }
        onSuccess(element)
    }
    if (onError) element.onerror = onError
    element.src = url
}

function ForceStyleRefresh(element: HTMLDivElement): void {
    window.getComputedStyle(element, undefined).getPropertyValue("left")
}