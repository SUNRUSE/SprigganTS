onload = () => {
    // Prevents most unwanted selection/dragging behaviour.
    document.body.ondragstart = function () { return false }
    document.onselectstart = function () { return false };
    (document.body.style as any).MozUserSelect = "none"

    AudioDriver.Load(() => LoadSprites(() => {
        RemoveLoadingMessage()
        InternalInvoke(StartGame)

        onmousedown = OnFirstUserInteraction
        ontouchstart = OnFirstUserInteraction
        onkeydown = OnFirstUserInteraction
        let firstUserInteraction = true
        function OnFirstUserInteraction() {
            if (!firstUserInteraction) return
            firstUserInteraction = false
            AudioDriver.FirstUserInteraction()
        }
    }))
}