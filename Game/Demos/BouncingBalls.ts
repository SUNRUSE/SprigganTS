new Demo("Bouncing Balls", (group) => {
    const left = Content.Demos.BouncingBalls.Red.WidthPixels / 2
    const top = Content.Demos.BouncingBalls.Red.HeightPixels / 2
    const width = WidthVirtualPixels - left * 2
    const height = HeightVirtualPixels - top * 2
    const right = left + width
    const bottom = top + height
    for (let i = 0; i < 10; i++) {
        const ball = new Sprite(group)
        ball.Loop(Content.Demos.BouncingBalls.Red)
        ball.Move(Content.Demos.BouncingBalls.Red.WidthPixels + Math.random() * (WidthVirtualPixels - Content.Demos.BouncingBalls.Red.WidthPixels * 2), Content.Demos.BouncingBalls.Red.HeightPixels + Math.random() * (HeightVirtualPixels - Content.Demos.BouncingBalls.Red.HeightPixels * 2))
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
    return () => {

    }
})