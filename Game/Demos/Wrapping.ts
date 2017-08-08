new Demo("Wrapping", (group) => {
    const text = "Text can be wrapped to fit a width.\n\nThis respects space (including\ttabs) within wrapped lines, and can split incomprehensibly long words which do not fit on one line.\n\nOh, and words-which-are-joined-by-hyphens, don't forget those."

    const staticRulerSprite = new Scene.Sprite(group)
    staticRulerSprite.Loop(Content.Markers.Ruler)
    staticRulerSprite.Move(0, 30)

    const rulerSprite = new Scene.Sprite(group)
    rulerSprite.Loop(Content.Markers.Ruler)
    rulerSprite.Move(0, 30)

    let movingRight = true
    let cachedText = ""
    let cachedTextGroup = new Scene.Group(group)

    const refresh = () => {
        if (movingRight) {
            rulerSprite.Move(rulerSprite.X() + 1, rulerSprite.Y())
            if (rulerSprite.X() == WidthVirtualPixels - 1) movingRight = false
        } else {
            rulerSprite.Move(rulerSprite.X() - 1, rulerSprite.Y())
            if (rulerSprite.X() == 0) movingRight = true
        }

        const wrapped = FontBig.Wrap(text, rulerSprite.X())
        if (wrapped != cachedText) {
            cachedTextGroup.Delete()
            cachedTextGroup = new Scene.Group(group)
            FontBig.Write(cachedTextGroup, wrapped, "Left", "Top", 0, 30)
            cachedText = wrapped
        }
    }

    refresh()

    const timer = new Timers.Recurring(0.25, refresh)
    return timer.Stop
})