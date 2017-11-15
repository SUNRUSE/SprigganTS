function EventDemo(eventFactory: () => {
    Listen(callback: Function): void
    Unlisten(callback: Function): void
    Raise(value: number): void
}) {
    return () => {
        let viewports: Viewport[] = []

        Reset()

        return () => {
            for (const viewport of viewports) viewport.Delete()
        }

        function Reset() {
            for (const viewport of viewports) viewport.Delete()

            const middleViewport = new Viewport()
            const bottomViewport = new Viewport(0, 1)
            viewports = [middleViewport, bottomViewport]

            const event = eventFactory()
            for (let i = 2; i < 6; i++) {
                const listenButtonGroup = new Group(middleViewport, ListenClicked)
                listenButtonGroup.Move(ButtonNarrowWidth / 2, i * (ButtonHeight + 2))
                const listenButtonSprite = new Sprite(listenButtonGroup).Loop(Content.Buttons.Narrow.Unpressed)
                FontBig.Write(listenButtonGroup, "Listen", HorizontalAlignment.Middle, VerticalAlignment.Middle)
                function ListenClicked() {
                    listenButtonSprite.Play(Content.Buttons.Narrow.Pressed)
                    event.Listen(Listener)
                }

                const unlistenButtonGroup = new Group(middleViewport, UnlistenClicked)
                unlistenButtonGroup.Move(2 + ButtonNarrowWidth * 3 / 2, i * (ButtonHeight + 2))
                const unlistenButtonSprite = new Sprite(unlistenButtonGroup).Loop(Content.Buttons.Narrow.Unpressed)
                FontBig.Write(unlistenButtonGroup, "Unlisten", HorizontalAlignment.Middle, VerticalAlignment.Middle)
                function UnlistenClicked() {
                    unlistenButtonSprite.Play(Content.Buttons.Narrow.Pressed)
                    event.Unlisten(Listener)
                }

                let lineCalls = 0
                function Listener(value: number) {
                    lineCalls++
                    SetLineStatusText(`Called ${lineCalls} times; last value ${value}`)
                }

                const capturedI = i
                let lineStatusTextGroup: Group | undefined = undefined
                function SetLineStatusText(text: string) {
                    if (lineStatusTextGroup) lineStatusTextGroup.Delete()
                    lineStatusTextGroup = new Group(middleViewport)
                    lineStatusTextGroup.Move(8 + ButtonNarrowWidth * 2, capturedI * (ButtonHeight + 2))
                    FontBig.Write(lineStatusTextGroup, text, HorizontalAlignment.Left, VerticalAlignment.Middle)
                }
                SetLineStatusText("Not yet called")
            }

            const raiseButtonGroup = new Group(bottomViewport, RaiseClicked)
            raiseButtonGroup.Move(ButtonNarrowWidth / 2, HeightVirtualPixels - ButtonHeight / 2)
            const raiseButtonSprite = new Sprite(raiseButtonGroup).Loop(Content.Buttons.Narrow.Unpressed)
            FontBig.Write(raiseButtonGroup, "Raise", HorizontalAlignment.Middle, VerticalAlignment.Middle)
            let raisedTimes = 0
            function RaiseClicked() {
                raiseButtonSprite.Play(Content.Buttons.Narrow.Pressed)
                raisedTimes++
                const value = Math.floor(Math.random() * 100)
                SetStatusText(`Raised ${raisedTimes} time(s); last value ${value}.`)
                event.Raise(value)
            }

            const resetButtonGroup = new Group(bottomViewport, ResetClicked)
            resetButtonGroup.Move(2 + ButtonNarrowWidth * 3 / 2, HeightVirtualPixels - ButtonHeight / 2)
            const resetButtonSprite = new Sprite(resetButtonGroup).Loop(Content.Buttons.Narrow.Unpressed)
            FontBig.Write(resetButtonGroup, "Reset", HorizontalAlignment.Middle, VerticalAlignment.Middle)
            function ResetClicked() {
                resetButtonSprite.Play(Content.Buttons.Narrow.Pressed)
                Transition(FadeOutTransitionStep, FadeInTransitionStep, Reset)
            }

            let statusTextGroup: Group | undefined = undefined
            function SetStatusText(text: string) {
                if (statusTextGroup) statusTextGroup.Delete()
                statusTextGroup = new Group(bottomViewport)
                statusTextGroup.Move(8 + ButtonNarrowWidth * 2, HeightVirtualPixels - ButtonHeight / 2)
                FontBig.Write(statusTextGroup, text, HorizontalAlignment.Left, VerticalAlignment.Middle)
            }
            SetStatusText("Not yet called")
        }
    }
}