/// <reference path="Demos/OneTimeEvent.ts" />
/// <reference path="Demos/RecurringEvent.ts" />
/// <reference path="Demos/SceneGraph.ts" />
/// <reference path="Demos/Backgrounds.ts" />
/// <reference path="Demos/Fonts.ts" />
/// <reference path="Demos/Wrapping.ts" />
/// <reference path="Demos/SaveLoad.ts" />
/// <reference path="Demos/Transitions.ts" />
/// <reference path="Demos/Sounds.ts" />
/// <reference path="Demos/Music.ts" />
/// <reference path="Demos/BouncingBalls.ts" />

function DemoMenu() {
    const demos: {
        readonly Label: string
        readonly Run: () => () => void
    }[] = [{
        Label: "OneTimeEvent",
        Run: OneTimeEventDemo
    }, {
        Label: "RecurringEvent",
        Run: RecurringEventDemo
    }, {
        Label: "Scene Graph",
        Run: SceneGraphDemo
    }, {
        Label: "Backgrounds",
        Run: BackgroundsDemo
    }, {
        Label: "Fonts",
        Run: FontsDemo
    }, {
        Label: "Wrapping",
        Run: WrappingDemo
    }, {
        Label: "Save and Load",
        Run: SaveLoadDemo
    }, {
        Label: "Transitions",
        Run: TransitionsDemo
    }, {
        Label: "Sounds",
        Run: SoundsDemo
    }, {
        Label: "Music",
        Run: MusicDemo
    }, {
        Label: "Bouncing Balls",
        Run: BouncingBallsDemo
    }]

    const middleViewport = new Viewport()

    const rows = 8
    const columns = 1 + ((demos.length - (demos.length % rows)) / rows)
    let column = 0
    let row = 0

    FontBig.Write(middleViewport, "SprigganTS Sample", HorizontalAlignment.Middle, VerticalAlignment.Bottom, WidthVirtualPixels / 2, HeightVirtualPixels / 2 - 4 - (ButtonHeight + 2) * rows / 2)

    for (const demo of demos) {
        const buttonGroup = new Group(middleViewport, Clicked).Move(
            WidthVirtualPixels / 2 + (0.5 + column - columns / 2) * (ButtonWideWidth + 2) + 1,
            HeightVirtualPixels / 2 + (0.5 + row - rows / 2) * (ButtonHeight + 2) + 1
        )
        const buttonSprite = new Sprite(buttonGroup).Loop(Content.Buttons.Wide.Unpressed)
        FontBig.Write(buttonGroup, demo.Label, HorizontalAlignment.Middle, VerticalAlignment.Middle)

        function Clicked() {
            buttonSprite.Play(Content.Buttons.Wide.Pressed)
            Transition(FadeOutTransitionStep, FadeInTransitionStep, () => {
                middleViewport.Delete()
                const closeDemo = demo.Run()

                const homeViewport = new Viewport(-1, -1, false, HomeClicked)
                homeViewport.Move(ButtonNarrowWidth / 2, ButtonHeight / 2)
                const homeSprite = new Sprite(homeViewport).Loop(Content.Buttons.Narrow.Unpressed)
                FontBig.Write(homeViewport, "Home", HorizontalAlignment.Middle, VerticalAlignment.Middle)

                const titleViewport = new Viewport(0, -1)
                FontBig.Write(titleViewport, demo.Label, HorizontalAlignment.Middle, VerticalAlignment.Middle, WidthVirtualPixels / 2, ButtonHeight / 2)

                function HomeClicked() {
                    homeSprite.Play(Content.Buttons.Narrow.Pressed)
                    Transition(FadeOutTransitionStep, FadeInTransitionStep, () => {
                        closeDemo()
                        DemoMenu()
                        homeViewport.Delete()
                        titleViewport.Delete()
                    })
                }
            })
        }

        row++
        if (row == 8) {
            row = 0
            column++
        }
    }
}