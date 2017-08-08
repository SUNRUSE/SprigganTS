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
        const buttonGroup = new Scene.Group(group, () => {
            staticSprite.Play(Content.Buttons.Narrow.Pressed)
            button.Action()
        })
        buttonGroup.Move(IndexOf(buttons, button) * (WidthVirtualPixels - Content.Buttons.Narrow.Unpressed.WidthPixels) / (buttons.length - 1) + Content.Buttons.Narrow.Unpressed.WidthPixels / 2, HeightVirtualPixels - Content.Buttons.Narrow.Unpressed.HeightPixels / 2)
        const staticSprite = new Scene.Sprite(buttonGroup)
        staticSprite.Loop(Content.Buttons.Narrow.Unpressed)
        FontBig.Write(buttonGroup, button.Label, "Middle", "Middle")
    }

    return () => { }
})