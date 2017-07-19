function DemoMenu() {
    const spacing = 2

    const titleViewport = new Scene.Viewport("Middle", "Top", false)
    let titleGroup = new Scene.Group(titleViewport)
    titleGroup.Move(ResolutionX / 2, Content.Buttons.Wide.Unpressed.HeightPixels / 2)
    FontBig.Write(titleGroup, "SprigganTS Sample", "Middle", "Middle")

    const rowsPerColumn = Math.floor(ResolutionY / (Content.Buttons.Wide.Unpressed.HeightPixels + spacing)) - 1
    const columns = Math.ceil(Demos.length / rowsPerColumn)

    let openedDemos = 0
    const remainingButtonGroups: [Scene.Group, Scene.Sprite][] = []
    TakeNextDemo()

    function TakeNextDemo() {
        if (openedDemos == Demos.length) return
        const demo = Demos[openedDemos]

        // "Lock in" the non-undefined reference here.
        const demoReference = demo

        const buttonGroup = new Scene.Group(titleViewport, Select)
        buttonGroup.Move(ResolutionX + Content.Buttons.Wide.Unpressed.WidthPixels / 2, Content.Buttons.Wide.Unpressed.HeightPixels * 1.5 + (openedDemos % rowsPerColumn) * (Content.Buttons.Wide.Unpressed.HeightPixels + spacing))
        buttonGroup.MoveAt(Math.floor(openedDemos / rowsPerColumn) * (Content.Buttons.Wide.Unpressed.WidthPixels + spacing) + (ResolutionX - (columns - 1) * Content.Buttons.Wide.Unpressed.WidthPixels + Math.max(0, (columns - 2)) * spacing) / 2, buttonGroup.Y(), 2500, TakeNextDemo)

        const buttonSprite = new Scene.Sprite(buttonGroup)
        buttonSprite.Play(Content.Buttons.Wide.Materialize)

        FontBig.Write(buttonGroup, demoReference.Name, "Middle", "Middle")

        remainingButtonGroups.push([buttonGroup, buttonSprite])
        openedDemos++

        function Select() {
            buttonSprite.Play(Content.Buttons.Wide.Pressed)

            const demoViewport = new Scene.Viewport("Middle", "Middle")
            const demoScrollingGroup = new Scene.Group(demoViewport)
            demoScrollingGroup.Move(0, ResolutionY)
            demoScrollingGroup.MoveAt(0, 0, 500)
            const demoGroup = new Scene.Group(demoScrollingGroup)
            const stopDemo = demoReference.Setup(demoGroup)

            const homeButtonViewport = new Scene.Viewport("Left", "Top")
            const homeButtonGroup = new Scene.Group(homeButtonViewport, ReturnHome)
            homeButtonGroup.Move(Content.Buttons.Narrow.Unpressed.WidthPixels / 2, -Content.Buttons.Narrow.Unpressed.HeightPixels / 2)
            const homeButtonSprite = new Scene.Sprite(homeButtonGroup)
            homeButtonSprite.Loop(Content.Buttons.Narrow.Unpressed)
            FontBig.Write(homeButtonGroup, "< Home", "Middle", "Middle")
            homeButtonGroup.MoveAt(Content.Buttons.Narrow.Unpressed.WidthPixels / 2, Content.Buttons.Narrow.Unpressed.HeightPixels / 2, 125)

            function ReturnHome() {
                stopDemo()
                demoScrollingGroup.MoveAt(0, ResolutionY, 500, demoViewport.Delete)
                homeButtonSprite.Play(Content.Buttons.Narrow.Pressed)
                titleGroup.MoveAt(ResolutionX / 2, Content.Buttons.Wide.Unpressed.HeightPixels / 2, 125, titleViewport.Delete)
                homeButtonGroup.MoveAt(Content.Buttons.Narrow.Unpressed.WidthPixels / 2, -Content.Buttons.Narrow.Unpressed.HeightPixels / 2, 125, homeButtonViewport.Delete)
                DemoMenu()
            }

            buttonGroup.MoveOver(ResolutionX / 2, Content.Buttons.Wide.Unpressed.HeightPixels / 2, 0.125, () => {
                titleGroup.Delete()
                titleGroup = new Scene.Group(titleViewport)
                titleGroup.Move(ResolutionX / 2, Content.Buttons.Wide.Unpressed.HeightPixels / 2)
                FontBig.Write(titleGroup, demoReference.Name, "Middle", "Middle")
                buttonSprite.Play(Content.Buttons.Wide.Dematerialize, () => buttonGroup.Delete())
            })

            RemoveNextButtonGroup()
            function RemoveNextButtonGroup() {
                const otherGroup = remainingButtonGroups.shift()
                if (!otherGroup) return
                if (otherGroup[0] == buttonGroup) {
                    RemoveNextButtonGroup()
                    return
                }
                otherGroup[0].MoveAt(-Content.Buttons.Wide.Unpressed.WidthPixels / 2, otherGroup[0].Y(), 2500, () => {
                    otherGroup[0].Delete()
                    RemoveNextButtonGroup()
                })
                otherGroup[1].Play(Content.Buttons.Wide.Dematerialize)
            }
        }
    }
}