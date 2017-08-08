new Demo("Events.Once", (group) => {
    let subGroup: Scene.Group
    let event: Events.Once<(value: number) => void>

    let firstStart = true
    Start()

    function Start() {
        subGroup = new Scene.Group(group)
        if (firstStart) {
            firstStart = false
        } else {
            subGroup.Move(0, -ResolutionY)
            subGroup.MoveOver(0, 0, 0.25)
        }
        event = new Events.Once()

        for (let i = 1; i <= 4; i++) {
            const y = Content.Buttons.Wide.Unpressed.HeightPixels * (i + 0.5) + i * 2
            FontBig.Write(subGroup, `Callback ${i}`, "Left", "Middle", 0, y)
            let x = FontBig.CalculateWidth(`Callback ${i}`) + 2

            const listenGroup = new Scene.Group(subGroup, Listen)
            listenGroup.Move(x + Content.Buttons.Narrow.Unpressed.WidthPixels / 2, y)
            const listenSprite = new Scene.Sprite(listenGroup)
            listenSprite.Loop(Content.Buttons.Narrow.Unpressed)
            FontBig.Write(listenGroup, "Listen", "Middle", "Middle")
            function Listen() {
                listenSprite.Play(Content.Buttons.Narrow.Pressed)
                event.Listen(Callback)
            }

            x += Content.Buttons.Narrow.Unpressed.WidthPixels + 2
            const unlistenGroup = new Scene.Group(subGroup, Unlisten)
            unlistenGroup.Move(x + Content.Buttons.Narrow.Unpressed.WidthPixels / 2, y)
            const unlistenSprite = new Scene.Sprite(unlistenGroup)
            unlistenSprite.Loop(Content.Buttons.Narrow.Unpressed)
            FontBig.Write(unlistenGroup, "Unlisten", "Middle", "Middle")
            function Unlisten() {
                unlistenSprite.Play(Content.Buttons.Narrow.Pressed)
                event.Unlisten(Callback)
            }

            x += Content.Buttons.Narrow.Unpressed.WidthPixels + 2

            let calls = 0
            let calledGroup = new Scene.Group(subGroup)
            FontBig.Write(calledGroup, "Not yet called", "Middle", "Middle", x + (ResolutionX - x) / 2, y)
            function Callback(arg: number) {
                calledGroup.Delete()
                calledGroup = new Scene.Group(subGroup)
                calls++
                FontBig.Write(calledGroup, `${calls} call(s); last arg ${arg}`, "Middle", "Middle", x + (ResolutionX - x) / 2, y)
            }
        }

        const raisedX = (ResolutionX + 4 + Content.Buttons.Narrow.Unpressed.WidthPixels * 2.5) / 2
        let raisedGroup = new Scene.Group(subGroup)
        FontBig.Write(raisedGroup, "Not yet raised", "Middle", "Middle", raisedX, ResolutionY - Content.Buttons.Narrow.Unpressed.HeightPixels / 2)

        const raiseGroup = new Scene.Group(subGroup, Raise)
        raiseGroup.Move(Content.Buttons.Narrow.Unpressed.WidthPixels / 2, ResolutionY - Content.Buttons.Narrow.Unpressed.HeightPixels / 2)
        const raiseSprite = new Scene.Sprite(raiseGroup)
        raiseSprite.Loop(Content.Buttons.Narrow.Unpressed)
        FontBig.Write(raiseGroup, "Raise", "Middle", "Middle")
        let raises = 0
        function Raise() {
            raiseSprite.Play(Content.Buttons.Narrow.Pressed)
            const arg = Math.floor(Math.random() * 100)
            event.Raise(arg)
            raisedGroup.Delete()
            raisedGroup = new Scene.Group(subGroup)
            raises++
            FontBig.Write(raisedGroup, `Raised ${raises} time(s); last arg ${arg}`, "Middle", "Middle", raisedX, ResolutionY - Content.Buttons.Narrow.Unpressed.HeightPixels / 2)
        }

        const resetGroup = new Scene.Group(subGroup, Reset)
        resetGroup.Move(2 + Content.Buttons.Narrow.Unpressed.WidthPixels * 1.5, ResolutionY - Content.Buttons.Narrow.Unpressed.HeightPixels / 2)
        const resetSprite = new Scene.Sprite(resetGroup)
        resetSprite.Loop(Content.Buttons.Narrow.Unpressed)
        FontBig.Write(resetGroup, "Reset", "Middle", "Middle")
        function Reset() {
            resetSprite.Play(Content.Buttons.Narrow.Pressed)
            subGroup.MoveOver(0, ResolutionY, 0.25, subGroup.Delete)
            Start()
        }
    }

    return () => { }
})