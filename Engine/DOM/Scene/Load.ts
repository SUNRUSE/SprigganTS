let Sprites: HTMLImageElement | undefined = undefined

// Called by the engine to load the sprite sheet and perform any "massaging" required to get them to draw as pixelated sprites.
// You should not need to call this yourself.
function LoadSprites(then: () => void) {
    SetLoadingMessage("Loading sprites...")
    InternalLoadAndPrepareImage("sprites.png", "spritesprescaled.png", ContentSpritesWidth, ContentSpritesHeight, element => {
        element.style.touchAction = "manipulation" // Improves responsiveness on IE/Edge on touchscreens.
        element.style.webkitBackfaceVisibility = "hidden" // Prevents a "pop" on Chrome when all transitions have finished.
        element.style.position = "absolute"
        element.style.pointerEvents = "all"
        Sprites = element
        SetLoadingMessage("Caching viewports...")
        setTimeout(() => {
            while (CachedViewports.length < NumberOfInitiallyCachedViewports) CachedViewports.push(CreateViewport())
            SetLoadingMessage("Caching sprites...")
            setTimeout(() => {
                while (CachedSprites.length < NumberOfInitiallyCachedSprites) CachedSprites.push(CreateSprite())
                SetLoadingMessage("Caching groups...")
                setTimeout(() => {
                    while (CachedGroups.length < NumberOfInitiallyCachedGroups) CachedGroups.push(CreateGroup())
                    SetLoadingMessage("Caching static sprites...")
                    setTimeout(() => {
                        while (CachedStaticSprites.length < NumberOfInitiallyCachedSprites) CachedStaticSprites.push(new StaticSprite())
                        SetLoadingMessage("Caching backgrounds...")
                        setTimeout(() => {
                            while (CachedBackgroundWrappers.length < NumberOfInitiallyCachedBackgroundWrappers) CachedBackgroundWrappers.push(CreateBackgroundWrapper())
                            then()
                        }, 0)
                    }, 0)
                }, 0)
            }, 0)
        }, 0)
    }, () => SetLoadingMessage("Failed to load sprites.  Please try refreshing this page."))
}