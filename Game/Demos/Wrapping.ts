new Demo("Wrapping", (group) => {
    const text = "Text can be wrapped to fit a width.\n\nThis respects space (including\ttabs) within wrapped lines, and can split incomprehensibly long words which do not fit on one line.\n\nOh, and words-which-are-joined-by-hyphens, don't forget those."

    const staticRulerSprite = new Sprite(group)
    staticRulerSprite.Loop(Content.Markers.Ruler)
    staticRulerSprite.Move(0, 30)

    const rulerSprite = new Sprite(group)
    rulerSprite.Loop(Content.Markers.Ruler)
    rulerSprite.Move(0, 30)

    let movingRight = true
    let cachedText = ""
    let cachedTextGroup = new Group(group)

    const refresh = () => {
        if (movingRight) {
            rulerSprite.Move(rulerSprite.VirtualPixelsFromLeft() + 1, rulerSprite.VirtualPixelsFromTop())
            if (rulerSprite.VirtualPixelsFromLeft() == WidthVirtualPixels - 1) movingRight = false
        } else {
            rulerSprite.Move(rulerSprite.VirtualPixelsFromLeft() - 1, rulerSprite.VirtualPixelsFromTop())
            if (rulerSprite.VirtualPixelsFromLeft() == 0) movingRight = true
        }

        const wrapped = FontBig.Wrap(text, rulerSprite.VirtualPixelsFromLeft())
        if (wrapped != cachedText) {
            cachedTextGroup.Delete()
            cachedTextGroup = new Group(group)
            FontBig.Write(cachedTextGroup, wrapped, HorizontalAlignment.Left, VerticalAlignment.Top, 0, 30)
            cachedText = wrapped
        }
    }

    refresh()

    const timer = new RecurringTimer(0.25, refresh)
    return () => timer.Stop()
})