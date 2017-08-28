new Demo("Transitions", (group) => {
    Background.Set(Content.Demos.Transitions.Background)
    let transitions = 0
    let textGroup: Group | undefined
    function RefreshText() {
        if (textGroup) textGroup.Delete()
        textGroup = new Group(group)
        FontBig.Write(textGroup, `You have seen ${transitions++} transition(s).`, HorizontalAlignment.Middle, VerticalAlignment.Middle, WidthVirtualPixels / 2, HeightVirtualPixels / 2)
    }
    RefreshText()

    const transitionTypes = [{
        Value: TransitionType.FadeToBlack,
        Label: "FadeToBlack"
    }, {
        Value: TransitionType.FadeToWhite,
        Label: "FadeToWhite"
    }]
    for (const transitionType of transitionTypes) {
        const buttonGroup = new Group(group, () => {
            staticSprite.Play(Content.Buttons.Wide.Pressed)
            Transition(transitionType.Value, 2, 1, RefreshText)
        })
        buttonGroup.Move(IndexOf(transitionTypes, transitionType) * (WidthVirtualPixels - ButtonWideWidth) / (transitionTypes.length - 1) + ButtonWideWidth / 2, HeightVirtualPixels - ButtonHeight / 2)
        const staticSprite = new Sprite(buttonGroup)
        staticSprite.Loop(Content.Buttons.Wide.Unpressed)
        FontBig.Write(buttonGroup, transitionType.Label, HorizontalAlignment.Middle, VerticalAlignment.Middle)
    }

    return () => { Background.Remove() }
})