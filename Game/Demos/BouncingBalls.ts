function BouncingBallsDemo() {
    const middleViewport = new Viewport()
    const ballSize = 32
    const left = ballSize / 2
    const top = ballSize / 2
    const width = WidthVirtualPixels - left * 2
    const height = HeightVirtualPixels - top * 2
    const right = left + width
    const bottom = top + height
    for (let i = 0; i < 10; i++) {
        const ball = new Sprite(middleViewport)
        ball.Loop(Content.Demos.BouncingBalls.Red)
        ball.Move(ballSize + Math.random() * (WidthVirtualPixels - ballSize * 2), ballSize + Math.random() * (HeightVirtualPixels - ballSize * 2))
        let movingRight = Math.random() < 0.5
        let movingDown = Math.random() < 0.5
        MoveAgain()
        function MoveAgain() {
            const distanceX = Math.abs((movingRight ? right : left) - ball.VirtualPixelsFromLeft())
            const distanceY = Math.abs((movingDown ? bottom : top) - ball.VirtualPixelsFromTop())

            const speed = 180

            if (distanceX < distanceY) {
                ball.MoveAt(movingRight ? right : left, ball.VirtualPixelsFromTop() + (movingDown ? distanceX : -distanceX), speed, MoveAgain)
                movingRight = !movingRight
            } else {
                ball.MoveAt(ball.VirtualPixelsFromLeft() + (movingRight ? distanceY : -distanceY), movingDown ? bottom : top, speed, MoveAgain)
                movingDown = !movingDown
            }
        }
    }
    return () => middleViewport.Delete()
}