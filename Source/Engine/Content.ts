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