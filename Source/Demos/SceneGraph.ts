new Demo("Scene Graph", (group) => {
    const simulationGroup = new Scene.Group(group)
    simulationGroup.Move(ResolutionX / 2, ResolutionY / 2)

    const groupSize = 48

    const destinationGroup = new Scene.Group(simulationGroup)

    const destinationTopLeft = new Scene.Sprite(destinationGroup)
    destinationTopLeft.Loop(Content.Markers.AlternativeBounds.TopLeft)
    destinationTopLeft.Move(-groupSize, -groupSize)
    const destinationTopRight = new Scene.Sprite(destinationGroup)
    destinationTopRight.Loop(Content.Markers.AlternativeBounds.TopRight)
    destinationTopRight.Move(groupSize, -groupSize)
    const destinationBottomLeft = new Scene.Sprite(destinationGroup)
    destinationBottomLeft.Loop(Content.Markers.AlternativeBounds.BottomLeft)
    destinationBottomLeft.Move(-groupSize, groupSize)
    const destinationBottomRight = new Scene.Sprite(destinationGroup)
    destinationBottomRight.Loop(Content.Markers.AlternativeBounds.BottomRight)
    destinationBottomRight.Move(groupSize, groupSize)

    const wrappingGroup = new Scene.Group(simulationGroup)

    const topLeft = new Scene.Sprite(wrappingGroup)
    topLeft.Loop(Content.Markers.Bounds.TopLeft)
    topLeft.Move(-groupSize, -groupSize)
    const topRight = new Scene.Sprite(wrappingGroup)
    topRight.Loop(Content.Markers.Bounds.TopRight)
    topRight.Move(groupSize, -groupSize)
    const bottomLeft = new Scene.Sprite(wrappingGroup)
    bottomLeft.Loop(Content.Markers.Bounds.BottomLeft)
    bottomLeft.Move(-groupSize, groupSize)
    const bottomRight = new Scene.Sprite(wrappingGroup)
    bottomRight.Loop(Content.Markers.Bounds.BottomRight)
    bottomRight.Move(groupSize, groupSize)

    const destinationSprite = new Scene.Sprite(wrappingGroup)
    destinationSprite.Loop(Content.Markers.Anchor)

    const sprite = new Scene.Sprite(wrappingGroup)
    sprite.Loop(Content.Demos.SceneGraph.Sprite.Idle)

    const groupControlsViewport = new Scene.Viewport("Left", "Bottom")
    FontBig.Write(groupControlsViewport, "Containing group", "Middle", "Middle", Content.Buttons.Wide.Unpressed.WidthPixels / 2, ResolutionY - Content.Buttons.Wide.Unpressed.HeightPixels * 5.5)

    const randomSizeX = 144
    const randomSizeY = 48

    const groupPauseGroup = new Scene.Group(groupControlsViewport, () => {
        groupPauseSprite.Play(Content.Buttons.Wide.Pressed)
        simulationGroup.Pause()
    })
    groupPauseGroup.Move(Content.Buttons.Wide.Unpressed.WidthPixels / 2, ResolutionY - Content.Buttons.Wide.Unpressed.HeightPixels * 4.5)
    const groupPauseSprite = new Scene.Sprite(groupPauseGroup)
    groupPauseSprite.Loop(Content.Buttons.Wide.Unpressed)
    FontBig.Write(groupPauseGroup, "Pause", "Middle", "Middle")

    const groupResumeGroup = new Scene.Group(groupControlsViewport, () => {
        groupResumeSprite.Play(Content.Buttons.Wide.Pressed)
        simulationGroup.Resume()
    })
    groupResumeGroup.Move(Content.Buttons.Wide.Unpressed.WidthPixels / 2, ResolutionY - Content.Buttons.Wide.Unpressed.HeightPixels * 3.5)
    const groupResumeSprite = new Scene.Sprite(groupResumeGroup)
    groupResumeSprite.Loop(Content.Buttons.Wide.Unpressed)
    FontBig.Write(groupResumeGroup, "Resume", "Middle", "Middle")

    const groupMoveGroup = new Scene.Group(groupControlsViewport, () => {
        groupMoveSprite.Play(Content.Buttons.Wide.Pressed)
        const x = Math.random() * randomSizeX - randomSizeX / 2
        const y = Math.random() * randomSizeY - randomSizeY / 2
        wrappingGroup.Move(x, y)
        destinationGroup.Move(x, y)
        topLeft.Loop(Content.Markers.Bounds.TopLeft)
        topRight.Loop(Content.Markers.Bounds.TopRight)
        bottomLeft.Loop(Content.Markers.Bounds.BottomLeft)
        bottomRight.Loop(Content.Markers.Bounds.BottomRight)
    })
    groupMoveGroup.Move(Content.Buttons.Wide.Unpressed.WidthPixels / 2, ResolutionY - Content.Buttons.Wide.Unpressed.HeightPixels * 2.5)
    const groupMoveSprite = new Scene.Sprite(groupMoveGroup)
    groupMoveSprite.Loop(Content.Buttons.Wide.Unpressed)
    FontBig.Write(groupMoveGroup, "Move", "Middle", "Middle")

    const groupMoveAtGroup = new Scene.Group(groupControlsViewport, () => {
        groupMoveAtSprite.Play(Content.Buttons.Wide.Pressed)
        const x = Math.random() * randomSizeX - randomSizeX / 2
        const y = Math.random() * randomSizeY - randomSizeY / 2
        topLeft.Loop(Content.Markers.FlashingBounds.TopLeft)
        topRight.Loop(Content.Markers.FlashingBounds.TopRight)
        bottomLeft.Loop(Content.Markers.FlashingBounds.BottomLeft)
        bottomRight.Loop(Content.Markers.FlashingBounds.BottomRight)
        wrappingGroup.MoveAt(x, y, 25, () => {
            topLeft.Play(Content.Markers.StrobeBounds.TopLeft)
            topRight.Play(Content.Markers.StrobeBounds.TopRight)
            bottomLeft.Play(Content.Markers.StrobeBounds.BottomLeft)
            bottomRight.Play(Content.Markers.StrobeBounds.BottomRight)
        })
        destinationGroup.Move(x, y)
    })
    groupMoveAtGroup.Move(Content.Buttons.Wide.Unpressed.WidthPixels / 2, ResolutionY - Content.Buttons.Wide.Unpressed.HeightPixels * 1.5)
    const groupMoveAtSprite = new Scene.Sprite(groupMoveAtGroup)
    groupMoveAtSprite.Loop(Content.Buttons.Wide.Unpressed)
    FontBig.Write(groupMoveAtGroup, "MoveAt (25px/sec.)", "Middle", "Middle")

    const groupMoveOverGroup = new Scene.Group(groupControlsViewport, () => {
        groupMoveOverSprite.Play(Content.Buttons.Wide.Pressed)
        const x = Math.random() * randomSizeX - randomSizeX / 2
        const y = Math.random() * randomSizeY - randomSizeY / 2
        topLeft.Loop(Content.Markers.FlashingBounds.TopLeft)
        topRight.Loop(Content.Markers.FlashingBounds.TopRight)
        bottomLeft.Loop(Content.Markers.FlashingBounds.BottomLeft)
        bottomRight.Loop(Content.Markers.FlashingBounds.BottomRight)
        wrappingGroup.MoveOver(x, y, 0.5, () => {
            topLeft.Play(Content.Markers.StrobeBounds.TopLeft)
            topRight.Play(Content.Markers.StrobeBounds.TopRight)
            bottomLeft.Play(Content.Markers.StrobeBounds.BottomLeft)
            bottomRight.Play(Content.Markers.StrobeBounds.BottomRight)
        })
        destinationGroup.Move(x, y)
    })
    groupMoveOverGroup.Move(Content.Buttons.Wide.Unpressed.WidthPixels / 2, ResolutionY - Content.Buttons.Wide.Unpressed.HeightPixels / 2)
    const groupMoveOverSprite = new Scene.Sprite(groupMoveOverGroup)
    groupMoveOverSprite.Loop(Content.Buttons.Wide.Unpressed)
    FontBig.Write(groupMoveOverGroup, "MoveOver (0.5 sec.)", "Middle", "Middle")


    const spriteControlsViewport = new Scene.Viewport("Right", "Bottom")
    FontBig.Write(spriteControlsViewport, "Sprite", "Middle", "Middle", ResolutionX - 1 - Content.Buttons.Wide.Unpressed.WidthPixels / 2, ResolutionY - Content.Buttons.Wide.Unpressed.HeightPixels * 5.5)

    const spritePauseGroup = new Scene.Group(spriteControlsViewport, () => {
        spritePauseSprite.Play(Content.Buttons.Wide.Pressed)
        sprite.Pause()
    })
    spritePauseGroup.Move(ResolutionX - 1 - Content.Buttons.Wide.Unpressed.WidthPixels / 2, ResolutionY - Content.Buttons.Wide.Unpressed.HeightPixels * 4.5)
    const spritePauseSprite = new Scene.Sprite(spritePauseGroup)
    spritePauseSprite.Loop(Content.Buttons.Wide.Unpressed)
    FontBig.Write(spritePauseGroup, "Pause", "Middle", "Middle")

    const spriteResumeGroup = new Scene.Group(spriteControlsViewport, () => {
        spriteResumeSprite.Play(Content.Buttons.Wide.Pressed)
        sprite.Resume()
    })
    spriteResumeGroup.Move(ResolutionX - 1 - Content.Buttons.Wide.Unpressed.WidthPixels / 2, ResolutionY - Content.Buttons.Wide.Unpressed.HeightPixels * 3.5)
    const spriteResumeSprite = new Scene.Sprite(spriteResumeGroup)
    spriteResumeSprite.Loop(Content.Buttons.Wide.Unpressed)
    FontBig.Write(spriteResumeGroup, "Resume", "Middle", "Middle")

    const spriteMoveGroup = new Scene.Group(spriteControlsViewport, () => {
        spriteMoveSprite.Play(Content.Buttons.Wide.Pressed)
        const x = Math.random() * groupSize - groupSize / 2
        const y = Math.random() * groupSize - groupSize / 2
        sprite.Move(x, y)
        destinationSprite.Move(x, y)
        sprite.Play(Content.Demos.SceneGraph.Sprite.Stopped, () => sprite.Loop(Content.Demos.SceneGraph.Sprite.Idle))
    })
    spriteMoveGroup.Move(ResolutionX - 1 - Content.Buttons.Wide.Unpressed.WidthPixels / 2, ResolutionY - Content.Buttons.Wide.Unpressed.HeightPixels * 2.5)
    const spriteMoveSprite = new Scene.Sprite(spriteMoveGroup)
    spriteMoveSprite.Loop(Content.Buttons.Wide.Unpressed)
    FontBig.Write(spriteMoveGroup, "Move", "Middle", "Middle")

    const spriteMoveAtGroup = new Scene.Group(spriteControlsViewport, () => {
        spriteMoveAtSprite.Play(Content.Buttons.Wide.Pressed)
        const x = Math.random() * groupSize - groupSize / 2
        const y = Math.random() * groupSize - groupSize / 2
        sprite.Loop(Content.Demos.SceneGraph.Sprite.Moving)
        sprite.MoveAt(x, y, 25, () => sprite.Play(Content.Demos.SceneGraph.Sprite.Stopped, () => sprite.Loop(Content.Demos.SceneGraph.Sprite.Idle)))
        destinationSprite.Move(x, y)
    })
    spriteMoveAtGroup.Move(ResolutionX - 1 - Content.Buttons.Wide.Unpressed.WidthPixels / 2, ResolutionY - Content.Buttons.Wide.Unpressed.HeightPixels * 1.5)
    const spriteMoveAtSprite = new Scene.Sprite(spriteMoveAtGroup)
    spriteMoveAtSprite.Loop(Content.Buttons.Wide.Unpressed)
    FontBig.Write(spriteMoveAtGroup, "MoveAt (25px/sec.)", "Middle", "Middle")

    const spriteMoveOverGroup = new Scene.Group(spriteControlsViewport, () => {
        spriteMoveOverSprite.Play(Content.Buttons.Wide.Pressed)
        const x = Math.random() * groupSize - groupSize / 2
        const y = Math.random() * groupSize - groupSize / 2
        sprite.Loop(Content.Demos.SceneGraph.Sprite.Moving)
        sprite.MoveOver(x, y, 0.5, () => sprite.Play(Content.Demos.SceneGraph.Sprite.Stopped, () => sprite.Loop(Content.Demos.SceneGraph.Sprite.Idle)))
        destinationSprite.Move(x, y)
    })
    spriteMoveOverGroup.Move(ResolutionX - 1 - Content.Buttons.Wide.Unpressed.WidthPixels / 2, ResolutionY - Content.Buttons.Wide.Unpressed.HeightPixels / 2)
    const spriteMoveOverSprite = new Scene.Sprite(spriteMoveOverGroup)
    spriteMoveOverSprite.Loop(Content.Buttons.Wide.Unpressed)
    FontBig.Write(spriteMoveOverGroup, "MoveOver (0.5 sec.)", "Middle", "Middle")

    return () => {
        groupControlsViewport.Delete()
        spriteControlsViewport.Delete()
    }
})