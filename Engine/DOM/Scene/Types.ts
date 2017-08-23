type Child = {
    readonly Rescale: () => void
    readonly Element: HTMLDivElement
    readonly Reference: Group | Sprite
}

interface IPausable {
    readonly Pause: () => void
    readonly Resume: () => void
}

interface IDeletable {
    readonly Delete: () => void
}

interface IDisableable {
    readonly Disable: () => void
    readonly Enable: () => void
}

interface IHideable {
    readonly Hide: () => void
    readonly Show: () => void
}

interface IMoveable extends IPausable {
    readonly VirtualPixelsFromLeft: () => number
    readonly VirtualPixelsFromTop: () => number
    readonly Move: (leftPixels: number, topPixels: number) => void
    readonly MoveOver: (leftPixels: number, topPixels: number, seconds: number, onArrivingIfUninterrupted?: () => void) => void
    readonly MoveAt: (leftPixels: number, topPixels: number, pixelsPerSecond: number, onArrivingIfUninterrupted?: () => void) => void
}