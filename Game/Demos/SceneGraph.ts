function SceneGraphDemo() {
    const middleViewport = new Viewport()

    const simulationGroup = new Group(middleViewport)
    simulationGroup.Move(WidthVirtualPixels / 2, HeightVirtualPixels / 2)

    const groupSize = 48

    const destinationGroup = new Group(simulationGroup)

    const destinationTopLeft = new Sprite(destinationGroup)
    destinationTopLeft.Loop(Content.Markers.AlternativeBounds.TopLeft)
    destinationTopLeft.Move(-groupSize, -groupSize)
    const destinationTopRight = new Sprite(destinationGroup)
    destinationTopRight.Loop(Content.Markers.AlternativeBounds.TopRight)
    destinationTopRight.Move(groupSize, -groupSize)
    const destinationBottomLeft = new Sprite(destinationGroup)
    destinationBottomLeft.Loop(Content.Markers.AlternativeBounds.BottomLeft)
    destinationBottomLeft.Move(-groupSize, groupSize)
    const destinationBottomRight = new Sprite(destinationGroup)
    destinationBottomRight.Loop(Content.Markers.AlternativeBounds.BottomRight)
    destinationBottomRight.Move(groupSize, groupSize)

    const wrappingGroup = new Group(simulationGroup, () => {
        topLeft.Play(Content.Markers.AlternativeStrobeBounds.TopLeft)
        topRight.Play(Content.Markers.AlternativeStrobeBounds.TopRight)
        bottomLeft.Play(Content.Markers.AlternativeStrobeBounds.BottomLeft)
        bottomRight.Play(Content.Markers.AlternativeStrobeBounds.BottomRight)
    })

    const topLeft = new Sprite(wrappingGroup)
    topLeft.Loop(Content.Markers.Bounds.TopLeft)
    topLeft.Move(-groupSize, -groupSize)
    const topRight = new Sprite(wrappingGroup)
    topRight.Loop(Content.Markers.Bounds.TopRight)
    topRight.Move(groupSize, -groupSize)
    const bottomLeft = new Sprite(wrappingGroup)
    bottomLeft.Loop(Content.Markers.Bounds.BottomLeft)
    bottomLeft.Move(-groupSize, groupSize)
    const bottomRight = new Sprite(wrappingGroup)
    bottomRight.Loop(Content.Markers.Bounds.BottomRight)
    bottomRight.Move(groupSize, groupSize)

    const destinationSprite = new Sprite(wrappingGroup)
    destinationSprite.Loop(Content.Markers.Anchor)

    const sprite = new Sprite(wrappingGroup, () => {
        const clickSprite = new Sprite(wrappingGroup)
        clickSprite.Move(sprite.VirtualPixelsFromLeft(), sprite.VirtualPixelsFromTop())
        clickSprite.Play(Content.Demos.SceneGraph.Clicked, () => clickSprite.Delete())
    })
    sprite.Loop(Content.Demos.SceneGraph.Sprite.Idle)

    function CreateButtons(label: string, horizontalPositionSignedUnitInterval: number, x: number, buttons: {
        readonly Label: string
        readonly Action: () => void
    }[]): Viewport {
        const menuViewport = new Viewport(horizontalPositionSignedUnitInterval, 1)
        const menuGroup = new Group(menuViewport)
        menuGroup.Move(x, 0)
        FontBig.Write(menuGroup, label, HorizontalAlignment.Middle, VerticalAlignment.Middle, 0, HeightVirtualPixels - (buttons.length + 0.5) * ButtonHeight)
        for (const button of buttons) {
            const buttonGroup = new Group(menuGroup, () => {
                buttonSprite.Play(Content.Buttons.Narrow.Pressed)
                button.Action()
            })
            buttonGroup.Move(0, HeightVirtualPixels - (buttons.length - 1 - IndexOf(buttons, button) + 0.5) * ButtonHeight)
            const buttonSprite = new Sprite(buttonGroup)
            buttonSprite.Loop(Content.Buttons.Narrow.Unpressed)
            FontBig.Write(buttonGroup, button.Label, HorizontalAlignment.Middle, VerticalAlignment.Middle, 0, 0)
        }
        return menuViewport
    }

    const randomSizeX = 144
    const randomSizeY = 48

    const leftViewport = CreateButtons("Group", -1, ButtonNarrowWidth / 2, [{
        Label: "Pause",
        Action: () => wrappingGroup.Pause()
    }, {
        Label: "Resume",
        Action: () => wrappingGroup.Resume()
    }, {
        Label: "Move",
        Action: () => {
            const x = Math.random() * randomSizeX - randomSizeX / 2
            const y = Math.random() * randomSizeY - randomSizeY / 2
            wrappingGroup.Move(x, y)
            destinationGroup.Move(x, y)
            topLeft.Play(Content.Markers.StrobeBounds.TopLeft)
            topRight.Play(Content.Markers.StrobeBounds.TopRight)
            bottomLeft.Play(Content.Markers.StrobeBounds.BottomLeft)
            bottomRight.Play(Content.Markers.StrobeBounds.BottomRight)
        }
    }, {
        Label: "MoveAt",
        Action: () => {
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
        }
    }, {
        Label: "MoveOver",
        Action: () => {
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
        }
    }, {
        Label: "Disable",
        Action: () => wrappingGroup.Disable()
    }, {
        Label: "Enable",
        Action: () => wrappingGroup.Enable()
    }, {
        Label: "Hide",
        Action: () => wrappingGroup.Hide()
    }, {
        Label: "Show",
        Action: () => wrappingGroup.Show()
    }, {
        Label: "Sound",
        Action: () => wrappingGroup.PlaySound(Content.Demos.Sounds.Synth)
    }])

    const rightViewport = CreateButtons("Sprite", 1, WidthVirtualPixels - ButtonNarrowWidth / 2, [{
        Label: "Pause",
        Action: () => sprite.Pause()
    }, {
        Label: "Resume",
        Action: () => sprite.Resume()
    }, {
        Label: "Move",
        Action: () => {
            const x = Math.random() * groupSize - groupSize / 2
            const y = Math.random() * groupSize - groupSize / 2
            sprite.Move(x, y)
            destinationSprite.Move(x, y)
            sprite.Play(Content.Demos.SceneGraph.Sprite.Stopped, () => sprite.Loop(Content.Demos.SceneGraph.Sprite.Idle))
        }
    }, {
        Label: "MoveAt",
        Action: () => {
            const x = Math.random() * groupSize - groupSize / 2
            const y = Math.random() * groupSize - groupSize / 2
            sprite.Loop(Content.Demos.SceneGraph.Sprite.Moving)
            sprite.MoveAt(x, y, 25, () => sprite.Play(Content.Demos.SceneGraph.Sprite.Stopped, () => sprite.Loop(Content.Demos.SceneGraph.Sprite.Idle)))
            destinationSprite.Move(x, y)
        }
    }, {
        Label: "MoveOver",
        Action: () => {
            const x = Math.random() * groupSize - groupSize / 2
            const y = Math.random() * groupSize - groupSize / 2
            sprite.Loop(Content.Demos.SceneGraph.Sprite.Moving)
            sprite.MoveOver(x, y, 0.5, () => sprite.Play(Content.Demos.SceneGraph.Sprite.Stopped, () => sprite.Loop(Content.Demos.SceneGraph.Sprite.Idle)))
            destinationSprite.Move(x, y)
        }
    }, {
        Label: "Disable",
        Action: () => sprite.Disable()
    }, {
        Label: "Enable",
        Action: () => sprite.Enable()
    }, {
        Label: "Hide",
        Action: () => sprite.Hide()
    }, {
        Label: "Show",
        Action: () => sprite.Show()
    }, {
        Label: "Sound",
        Action: () => sprite.PlaySound(Content.Demos.Sounds.Synth)
    }])

    return () => {
        middleViewport.Delete()
        leftViewport.Delete()
        rightViewport.Delete()
    }
}