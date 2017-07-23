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
    filename = filename.slice(0, filename.lastIndexOf("."))
    return filename.slice(0, filename.lastIndexOf("."))
}

type Build = {
    LastModified: { [filename: string]: number }
    AdditionalGeneratedCode: {
        [extension: string]: string
    }
    PackedContent: {
        [extension: string]: PackedContent[]
    }
}

const Build: Build = {
    LastModified: {},
    AdditionalGeneratedCode: {},
    PackedContent: {}
}

type PackedContent = {
    readonly Path: string
    readonly GeneratedCode: string
}

const ContentTypes: { [extension: string]: ContentType } = {}

class ContentType {
    constructor(public readonly Extension: string, public readonly Convert: (filename: string, then: () => void) => void, public readonly Pack: (then: (additionalGeneratedCode: string, packedContent: PackedContent[]) => void) => void) {
        ContentTypes[Extension] = this
    }
}

export { Error, EndsWith, RemoveExtension, Build, PackedContent, ContentType, ContentTypes }