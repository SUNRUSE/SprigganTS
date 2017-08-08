new Demo("Fonts", (group) => {
    const text = "Text can be multi-line,\nanchored to the top,\nbottom, left, right\nor middle."

    const configurations: [HorizontalAlignment, VerticalAlignment][] = [
        ["Left", "Top"],
        ["Middle", "Top"],
        ["Right", "Top"],
        ["Right", "Middle"],
        ["Middle", "Middle"],
        ["Left", "Middle"],
        ["Left", "Bottom"],
        ["Middle", "Bottom"],
        ["Right", "Bottom"],
        ["Middle", "Middle"]
    ]

    let configurationId = 0

    const width = FontBig.CalculateWidth(text)
    const height = FontBig.CalculateHeight(text)

    const topLeft = new Sprite(group)
    topLeft.Loop(Content.Markers.Bounds.TopLeft)
    topLeft.Move(WidthVirtualPixels / 2, HeightVirtualPixels / 2)

    const topRight = new Sprite(group)
    topRight.Loop(Content.Markers.Bounds.TopRight)
    topRight.Move(WidthVirtualPixels / 2 + width, HeightVirtualPixels / 2)

    const bottomLeft = new Sprite(group)
    bottomLeft.Loop(Content.Markers.Bounds.BottomLeft)
    bottomLeft.Move(WidthVirtualPixels / 2, HeightVirtualPixels / 2 + height)

    const bottomRight = new Sprite(group)
    bottomRight.Loop(Content.Markers.Bounds.BottomRight)
    bottomRight.Move(WidthVirtualPixels / 2 + width, HeightVirtualPixels / 2 + height)

    let textGroup = new Group(group)

    ShowNextConfiguration()

    function ShowNextConfiguration() {
        textGroup.Delete()

        const configuration = configurations[configurationId++]
        configurationId = configurationId % configurations.length

        textGroup = new Group(group)
        FontBig.Write(textGroup, text, configuration[0], configuration[1], WidthVirtualPixels / 2, HeightVirtualPixels / 2)

        let left = WidthVirtualPixels / 2
        let right = left
        let top = HeightVirtualPixels / 2
        let bottom = top

        switch (configuration[0]) {
            case "Left":
                right += width
                break
            case "Middle":
                left -= width / 2
                right += width / 2
                break
            case "Right":
                left -= width
                break
        }

        switch (configuration[1]) {
            case "Top":
                bottom += height
                break
            case "Middle":
                top -= height / 2
                bottom += height / 2
                break
            case "Bottom":
                top -= height
                break
        }

        // The bounds sprites include an extra pixel.
        right--
        bottom--

        topLeft.MoveOver(left, top, 0.3)
        topRight.MoveOver(right, top, 0.3)
        bottomLeft.MoveOver(left, bottom, 0.3)
        bottomRight.MoveOver(right, bottom, 0.3)
    }

    const configurationTimer = new Timers.Recurring(0.75, ShowNextConfiguration)

    const anchorSprite = new Sprite(group)
    anchorSprite.Move(WidthVirtualPixels / 2, HeightVirtualPixels / 2)
    anchorSprite.Loop(Content.Markers.Anchor)

    return configurationTimer.Stop
})