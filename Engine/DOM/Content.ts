class SpriteFrame {
    readonly LeftPixels: number
    readonly TopPixels: number
    readonly WidthPixels: number
    readonly HeightPixels: number
    readonly MarginLeft: number
    readonly MarginTop: number
    readonly DurationSeconds: number

    constructor(leftPixels: number, topPixels: number, widthPixels: number, heightPixels: number, marginLeft: number, marginTop: number, durationSeconds: number) {
        this.LeftPixels = leftPixels
        this.TopPixels = topPixels
        this.WidthPixels = widthPixels
        this.HeightPixels = heightPixels
        this.MarginLeft = marginLeft
        this.MarginTop = marginTop
        this.DurationSeconds = durationSeconds
    }
}

class EmptySpriteFrame {
    readonly DurationSeconds: number

    constructor(durationSeconds: number) {
        this.DurationSeconds = durationSeconds
    }
}

class BackgroundFrame {
    readonly FileNumber: number
    readonly Width: number
    readonly Height: number
    readonly DurationSeconds: number

    constructor(fileNumber: number, width: number, height: number, durationSeconds: number) {
        this.FileNumber = fileNumber
        this.Width = width
        this.Height = height
        this.DurationSeconds = durationSeconds
    }
}

class Sound {
    readonly StartSeconds: number
    readonly DurationSeconds: number
    readonly Gain: number

    constructor(startSeconds: number, durationSeconds: number, gain: number) {
        this.StartSeconds = startSeconds
        this.DurationSeconds = durationSeconds
        this.Gain = gain
    }
}

class Dialog {
    readonly Id: number
    readonly Gain: number

    constructor(id: number, gain: number) {
        this.Id = id
        this.Gain = gain
    }
}