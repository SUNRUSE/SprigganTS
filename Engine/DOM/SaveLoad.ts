function Save(name: string, data: Json): boolean {
    if (!("localStorage" in window)) return false
    try {
        localStorage.setItem(`SprigganTS_Save_${name}`, JSON.stringify(data))
    } catch (e) { return false }
    return true
}

function Load<T extends Json>(name: string): T | undefined {
    if (!("localStorage" in window)) return undefined
    try {
        const data = localStorage.getItem(`SprigganTS_Save_${name}`)
        if (data === null) return undefined
        return JSON.parse(data)
    }
    catch (e) { return undefined }
}