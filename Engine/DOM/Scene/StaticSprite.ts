function AddStaticSprite(parent: Viewport | Group, frame: SpriteFrame, virtualPixelsFromLeft: number, virtualPixelsFromTop: number) {
    const sprite = new Sprite(parent)
    sprite.Loop(frame)
    sprite.Move(virtualPixelsFromLeft, virtualPixelsFromTop)
}