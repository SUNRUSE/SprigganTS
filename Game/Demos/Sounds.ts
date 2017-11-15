function SoundsDemo() {
    const middleViewport = new Viewport()
    const emitter = new Group(middleViewport)
    emitter.Move(WidthVirtualPixels / 2, HeightVirtualPixels / 2)
    FontBig.Write(emitter, "Emitter", HorizontalAlignment.Middle, VerticalAlignment.Middle)
    let movingRight = false
    function Move() {
        movingRight = !movingRight
        emitter.MoveAt(movingRight ? WidthVirtualPixels - 64 : 64, HeightVirtualPixels / 2, 150, Move)
    }
    Move()

    const sounds = [{
        Label: "Clap",
        Sound: Content.Demos.Sounds.Clap
    }, {
        Label: "Synth",
        Sound: Content.Demos.Sounds.Synth
    }, {
        Label: "Piano",
        Sound: Content.Demos.Sounds.Piano
    }]

    const bottomViewport = new Viewport(0, 1)
    for (const sound of sounds) {
        const buttonGroup = new Group(bottomViewport, () => {
            staticSprite.Play(Content.Buttons.Narrow.Pressed)
            emitter.PlaySound(sound.Sound)
        })
        buttonGroup.Move(IndexOf(sounds, sound) * (WidthVirtualPixels - ButtonNarrowWidth) / (sounds.length - 1) + ButtonNarrowWidth / 2, HeightVirtualPixels - ButtonHeight / 2)
        const staticSprite = new Sprite(buttonGroup)
        staticSprite.Loop(Content.Buttons.Narrow.Unpressed)
        FontBig.Write(buttonGroup, sound.Label, HorizontalAlignment.Middle, VerticalAlignment.Middle)
    }

    return () => {
        middleViewport.Delete()
        bottomViewport.Delete()
    }
}