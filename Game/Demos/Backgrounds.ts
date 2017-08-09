new Demo("Backgrounds", (group) => {
    const buttons: {
        readonly Label: string,
        readonly Action: () => void
    }[] = [{
        Label: "Static",
        Action: () => Background.Set(Content.Demos.Backgrounds.Static)
    }, {
        Label: "Animated",
        Action: () => Background.Set(Content.Demos.Backgrounds.Animated)
    }, {
        Label: "Pause",
        Action: Background.Pause
    }, {
        Label: "Resume",
        Action: Background.Resume
    }, {
        Label: "Remove",
        Action: Background.Remove
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