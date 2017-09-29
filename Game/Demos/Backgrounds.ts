new Demo("Backgrounds", (group) => {
    const backgroundGroup = new Group(group)
    let background: Background | undefined

    const buttons: {
        readonly Label: string,
        readonly Action: () => void
    }[] = [{
        Label: "Static",
        Action: () => {
            if (background) background.Delete()
            background = new Background(backgroundGroup, Content.Demos.Backgrounds.Static)
        }
    }, {
        Label: "Animated",
        Action: () => {
            if (background) background.Delete()
            background = new Background(backgroundGroup, Content.Demos.Backgrounds.Animated)
        }
    }, {
        Label: "Pause",
        Action: () => { if (background) background.Pause() }
    }, {
        Label: "Resume",
        Action: () => { if (background) background.Resume() }
    }, {
        Label: "Remove",
        Action: () => { if (background) background.Delete() }
    }]

    for (const button of buttons) {
        const buttonGroup = new Group(group, () => {
            staticSprite.Play(Content.Buttons.Narrow.Pressed)
            button.Action()
        })
        buttonGroup.Move(IndexOf(buttons, button) * (WidthVirtualPixels - ButtonNarrowWidth) / (buttons.length - 1) + ButtonNarrowWidth / 2, HeightVirtualPixels - ButtonHeight / 2)
        const staticSprite = new Sprite(buttonGroup)
        staticSprite.Loop(Content.Buttons.Narrow.Unpressed)
        FontBig.Write(buttonGroup, button.Label, HorizontalAlignment.Middle, VerticalAlignment.Middle)
    }

    return () => { }
})