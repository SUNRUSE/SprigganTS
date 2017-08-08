new Demo("Events.Once", (group) => {
    let subGroup: Group
    let event: Events.Once<(value: number) => void>

    let firstStart = true
    Start()

    function Start() {
        subGroup = new Group(group)
        if (firstStart) {
            firstStart = false
        } else {
            subGroup.Move(0, -HeightVirtualPixels)
            subGroup.MoveOver(0, 0, 0.25)
        }
        event = new Events.Once()

        for (let i = 1; i <= 4; i++) {
            const y = Content.Buttons.Wide.Unpressed.HeightPixels * (i + 0.5) + i * 2
            FontBig.Write(subGroup, `Callback ${i}`, "Left", "Middle", 0, y)
            let x = FontBig.CalculateWidth(`Callback ${i}`) + 2

            const listenGroup = new Group(subGroup, Listen)
            listenGroup.Move(x + Content.Buttons.Narrow.Unpressed.WidthPixels / 2, y)
            const listenSprite = new Sprite(listenGroup)
            listenSprite.Loop(Content.Buttons.Narrow.Unpressed)
            FontBig.Write(listenGroup, "Listen", "Middle", "Middle")
            function Listen() {
                listenSprite.Play(Content.Buttons.Narrow.Pressed)
                event.Listen(Callback)
            }

            x += Content.Buttons.Narrow.Unpressed.WidthPixels + 2
            const unlistenGroup = new Group(subGroup, Unlisten)
            unlistenGroup.Move(x + Content.Buttons.Narrow.Unpressed.WidthPixels / 2, y)
            const unlistenSprite = new Sprite(unlistenGroup)
            unlistenSprite.Loop(Content.Buttons.Narrow.Unpressed)
            FontBig.Write(unlistenGroup, "Unlisten", "Middle", "Middle")
            function Unlisten() {
                unlistenSprite.Play(Content.Buttons.Narrow.Pressed)
                event.Unlisten(Callback)
            }

            x += Content.Buttons.Narrow.Unpressed.WidthPixels + 2

            let calls = 0
            let calledGroup = new Group(subGroup)
            FontBig.Write(calledGroup, "Not yet called", "Middle", "Middle", x + (WidthVirtualPixels - x) / 2, y)
            function Callback(arg: number) {
                calledGroup.Delete()
                calledGroup = new Group(subGroup)
                calls++
                FontBig.Write(calledGroup, `${calls} call(s); last arg ${arg}`, "Middle", "Middle", x + (WidthVirtualPixels - x) / 2, y)
            }
        }

        const raisedX = (WidthVirtualPixels + 4 + Content.Buttons.Narrow.Unpressed.WidthPixels * 2.5) / 2
        let raisedGroup = new Group(subGroup)
        FontBig.Write(raisedGroup, "Not yet raised", "Middle", "Middle", raisedX, HeightVirtualPixels - Content.Buttons.Narrow.Unpressed.HeightPixels / 2)

        const raiseGroup = new Group(subGroup, Raise)
        raiseGroup.Move(Content.Buttons.Narrow.Unpressed.WidthPixels / 2, HeightVirtualPixels - Content.Buttons.Narrow.Unpressed.HeightPixels / 2)
        const raiseSprite = new Sprite(raiseGroup)
        raiseSprite.Loop(Content.Buttons.Narrow.Unpressed)
        FontBig.Write(raiseGroup, "Raise", "Middle", "Middle")
        let raises = 0
        function Raise() {
            raiseSprite.Play(Content.Buttons.Narrow.Pressed)
            const arg = Math.floor(Math.random() * 100)
            event.Raise(arg)
            raisedGroup.Delete()
            raisedGroup = new Group(subGroup)
            raises++
            FontBig.Write(raisedGroup, `Raised ${raises} time(s); last arg ${arg}`, "Middle", "Middle", raisedX, HeightVirtualPixels - Content.Buttons.Narrow.Unpressed.HeightPixels / 2)
        }

        const resetGroup = new Group(subGroup, Reset)
        resetGroup.Move(2 + Content.Buttons.Narrow.Unpressed.WidthPixels * 1.5, HeightVirtualPixels - Content.Buttons.Narrow.Unpressed.HeightPixels / 2)
        const resetSprite = new Sprite(resetGroup)
        resetSprite.Loop(Content.Buttons.Narrow.Unpressed)
        FontBig.Write(resetGroup, "Reset", "Middle", "Middle")
        function Reset() {
            resetSprite.Play(Content.Buttons.Narrow.Pressed)
            subGroup.MoveOver(0, HeightVirtualPixels, 0.25, subGroup.Delete)
            Start()
        }
    }

    return () => { }
})