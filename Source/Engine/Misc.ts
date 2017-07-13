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