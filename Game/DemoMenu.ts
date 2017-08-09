function DemoMenu() {
    const spacing = 2

    const titleViewport = new Viewport(HorizontalAlignment.Middle, VerticalAlignment.Top, false)
    let titleGroup = new Group(titleViewport)
    titleGroup.Move(WidthVirtualPixels / 2, ButtonHeight / 2)
    FontBig.Write(titleGroup, "SprigganTS Sample", HorizontalAlignment.Middle, VerticalAlignment.Middle)

    const rowsPerColumn = Math.floor(HeightVirtualPixels / (ButtonHeight + spacing)) - 1
    const columns = Math.ceil(Demos.length / rowsPerColumn)

    let openedDemos = 0
    const remainingButtonGroups: [Group, Sprite][] = []
    TakeNextDemo()

    function TakeNextDemo() {
        if (openedDemos == Demos.length) return
        const demo = Demos[openedDemos]

        // "Lock in" the non-undefined reference here.
        const demoReference = demo

        const buttonGroup = new Group(titleViewport, Select)
        buttonGroup.Move(WidthVirtualPixels + ButtonWideWidth / 2, ButtonHeight * 1.5 + (openedDemos % rowsPerColumn) * (ButtonHeight + spacing))
        buttonGroup.MoveAt(Math.floor(openedDemos / rowsPerColumn) * (ButtonWideWidth + spacing) + (WidthVirtualPixels - (columns - 1) * ButtonWideWidth + Math.max(0, (columns - 2)) * spacing) / 2, buttonGroup.VirtualPixelsFromTop(), 2500, TakeNextDemo)

        const buttonSprite = new Sprite(buttonGroup)
        buttonSprite.Play(Content.Buttons.Wide.Materialize)

        FontBig.Write(buttonGroup, demoReference.Name, HorizontalAlignment.Middle, VerticalAlignment.Middle)

        remainingButtonGroups.push([buttonGroup, buttonSprite])
        openedDemos++

        function Select() {
            buttonSprite.Play(Content.Buttons.Wide.Pressed)

            const demoViewport = new Viewport(HorizontalAlignment.Middle, VerticalAlignment.Middle)
            const demoScrollingGroup = new Group(demoViewport)
            demoScrollingGroup.Move(0, HeightVirtualPixels)
            demoScrollingGroup.MoveAt(0, 0, 500)
            const demoGroup = new Group(demoScrollingGroup)
            const stopDemo = demoReference.Setup(demoGroup)

            const homeButtonViewport = new Viewport(HorizontalAlignment.Left, VerticalAlignment.Top)
            const homeButtonGroup = new Group(homeButtonViewport, ReturnHome)
            homeButtonGroup.Move(ButtonNarrowWidth / 2, -ButtonHeight / 2)
            const homeButtonSprite = new Sprite(homeButtonGroup)
            homeButtonSprite.Loop(Content.Buttons.Narrow.Unpressed)
            FontBig.Write(homeButtonGroup, "< Home", HorizontalAlignment.Middle, VerticalAlignment.Middle)
            homeButtonGroup.MoveAt(ButtonNarrowWidth / 2, ButtonHeight / 2, 125)

            function ReturnHome() {
                stopDemo()
                demoScrollingGroup.MoveAt(0, HeightVirtualPixels, 500, demoViewport.Delete)
                homeButtonSprite.Play(Content.Buttons.Narrow.Pressed)
                titleGroup.MoveAt(WidthVirtualPixels / 2, ButtonHeight / 2, 125, titleViewport.Delete)
                homeButtonGroup.MoveAt(ButtonNarrowWidth / 2, -ButtonHeight / 2, 125, homeButtonViewport.Delete)
                DemoMenu()
            }

            buttonGroup.MoveOver(WidthVirtualPixels / 2, ButtonHeight / 2, 0.125, () => {
                titleGroup.Delete()
                titleGroup = new Group(titleViewport)
                titleGroup.Move(WidthVirtualPixels / 2, ButtonHeight / 2)
                FontBig.Write(titleGroup, demoReference.Name, HorizontalAlignment.Middle, VerticalAlignment.Middle)
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
                otherGroup[0].MoveAt(-ButtonWideWidth / 2, otherGroup[0].VirtualPixelsFromTop(), 2500, () => {
                    otherGroup[0].Delete()
                    RemoveNextButtonGroup()
                })
                otherGroup[1].Play(Content.Buttons.Wide.Dematerialize)
            }
        }
    }
}