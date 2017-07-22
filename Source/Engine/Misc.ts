function IndexOf<T>(list: T[], item: T) {
    for (let i = 0; i < list.length; i++) if (list[i] == item) return i
    return -1
}

function Remove<T>(list: T[], item: T) {
    while (true) {
        const index = IndexOf(list, item)
        if (index == -1) return
        list.splice(index, 1)
    }
}

function Contains<T>(list: T[], item: T) {
    return IndexOf(list, item) != -1
}

type HorizontalAlignment = "Left" | "Middle" | "Right"
type VerticalAlignment = "Top" | "Middle" | "Bottom"

function Mix(from: number, to: number, byUnitInterval: number) {
    return from + (to - from) * byUnitInterval
}

function DistanceSquared(x1: number, y1: number, x2: number, y2: number) {
    return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)
}

function Distance(x1: number, y1: number, x2: number, y2: number) {
    return Math.sqrt(DistanceSquared(x1, y1, x2, y2))
}