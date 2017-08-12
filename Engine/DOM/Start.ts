onload = () => {
    // Prevents most unwanted selection/dragging behaviour.
    document.body.ondragstart = function () { return false }
    document.onselectstart = function () { return false };
    (document.body.style as any).MozUserSelect = "none"

    Display.InternalInitialize()

    LoadSprites(() => {
        RemoveLoadingMessage()
        Timers.InternalInvoke(StartGame)
    })
}