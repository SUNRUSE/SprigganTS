new Demo("Music", (group) => {
    const buttons = [{
        Label: "Classical",
        Action: () => Music.Set(Content.Demos.Music.Classical)
    }, {
        Label: "Synth",
        Action: () => Music.Set(Content.Demos.Music.Synth)
    }, {
        Label: "Easy L.",
        Action: () => Music.Set(Content.Demos.Music.EasyListening)
    }, {
        Label: "Stop",
        Action: () => Music.Stop()
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

    return () => Music.Stop()
})