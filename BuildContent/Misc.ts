function Error(message: any) {
    if (!message) return
    console.error(message)
    process.exit(1)
}

function EndsWith(str: string, endsWith: string): boolean {
    if (str.length < endsWith.length) return false
    if (str.slice(str.length - endsWith.length) != endsWith) return false
    return true
}

function RemoveExtension(filename: string): string {
    return filename.slice(0, filename.lastIndexOf("."))
}

export { Error, EndsWith, RemoveExtension }