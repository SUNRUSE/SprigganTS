new Demo("OneTimeEvent", (group) => {
    let subGroup: Group
    let event: OneTimeEvent<(value: number) => void>

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
        event = new OneTimeEvent()

        for (let i = 1; i <= 4; i++) {
            const y = ButtonHeight * (i + 0.5) + i * 2
            FontBig.Write(subGroup, `Callback ${i}`, HorizontalAlignment.Left, VerticalAlignment.Middle, 0, y)
            let x = FontBig.WidthVirtualPixels(`Callback ${i}`) + 2

            const listenGroup = new Group(subGroup, Listen)
            listenGroup.Move(x + ButtonNarrowWidth / 2, y)
            const listenSprite = new Sprite(listenGroup)
            listenSprite.Loop(Content.Buttons.Narrow.Unpressed)
            FontBig.Write(listenGroup, "Listen", HorizontalAlignment.Middle, VerticalAlignment.Middle)
            function Listen() {
                listenSprite.Play(Content.Buttons.Narrow.Pressed)
                event.Listen(Callback)
            }

            x += ButtonNarrowWidth + 2
            const unlistenGroup = new Group(subGroup, Unlisten)
            unlistenGroup.Move(x + ButtonNarrowWidth / 2, y)
            const unlistenSprite = new Sprite(unlistenGroup)
            unlistenSprite.Loop(Content.Buttons.Narrow.Unpressed)
            FontBig.Write(unlistenGroup, "Unlisten", HorizontalAlignment.Middle, VerticalAlignment.Middle)
            function Unlisten() {
                unlistenSprite.Play(Content.Buttons.Narrow.Pressed)
                event.Unlisten(Callback)
            }

            x += ButtonNarrowWidth + 2

            let calls = 0
            let calledGroup = new Group(subGroup)
            FontBig.Write(calledGroup, "Not yet called", HorizontalAlignment.Middle, VerticalAlignment.Middle, x + (WidthVirtualPixels - x) / 2, y)
            function Callback(arg: number) {
                calledGroup.Delete()
                calledGroup = new Group(subGroup)
                calls++
                FontBig.Write(calledGroup, `${calls} call(s); last arg ${arg}`, HorizontalAlignment.Middle, VerticalAlignment.Middle, x + (WidthVirtualPixels - x) / 2, y)
            }
        }

        const raisedX = (WidthVirtualPixels + 4 + ButtonNarrowWidth * 2.5) / 2
        let raisedGroup = new Group(subGroup)
        FontBig.Write(raisedGroup, "Not yet raised", HorizontalAlignment.Middle, VerticalAlignment.Middle, raisedX, HeightVirtualPixels - ButtonHeight / 2)

        const raiseGroup = new Group(subGroup, Raise)
        raiseGroup.Move(ButtonNarrowWidth / 2, HeightVirtualPixels - ButtonHeight / 2)
        const raiseSprite = new Sprite(raiseGroup)
        raiseSprite.Loop(Content.Buttons.Narrow.Unpressed)
        FontBig.Write(raiseGroup, "Raise", HorizontalAlignment.Middle, VerticalAlignment.Middle)
        let raises = 0
        function Raise() {
            raiseSprite.Play(Content.Buttons.Narrow.Pressed)
            const arg = Math.floor(Math.random() * 100)
            event.Raise(arg)
            raisedGroup.Delete()
            raisedGroup = new Group(subGroup)
            raises++
            FontBig.Write(raisedGroup, `Raised ${raises} time(s); last arg ${arg}`, HorizontalAlignment.Middle, VerticalAlignment.Middle, raisedX, HeightVirtualPixels - ButtonHeight / 2)
        }

        const resetGroup = new Group(subGroup, Reset)
        resetGroup.Move(2 + ButtonNarrowWidth * 1.5, HeightVirtualPixels - ButtonHeight / 2)
        const resetSprite = new Sprite(resetGroup)
        resetSprite.Loop(Content.Buttons.Narrow.Unpressed)
        FontBig.Write(resetGroup, "Reset", HorizontalAlignment.Middle, VerticalAlignment.Middle)
        function Reset() {
            resetSprite.Play(Content.Buttons.Narrow.Pressed)
            subGroup.MoveOver(0, HeightVirtualPixels, 0.25, () => subGroup.Delete())
            Start()
        }
    }

    return () => { }
})