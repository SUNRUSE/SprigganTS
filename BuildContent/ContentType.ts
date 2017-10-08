const ContentTypes: ContentType<any, any, any>[] = []

class ContentType<Imported, Packed, PackingHeader> {
    readonly ContentTypeImports: ContentTypeImport<Imported>[] = []

    constructor(public readonly FirstExtension: string, public readonly Pack: (imported: { [contentName: string]: Imported }, then: (header: PackingHeader, packed: { [contentName: string]: Packed }) => void) => void, public readonly CreateDummyData: (then: (header: PackingHeader) => void) => void) {
        ContentTypes.push(this)
    }
}

class ContentTypeImport<Imported> {
    constructor(public readonly ContentType: ContentType<Imported, any, any>, public readonly SecondExtension: string, public readonly Import: (filename: string, then: (content: { [contentName: string]: Imported }) => void) => void) {
        ContentType.ContentTypeImports.push(this)
    }
}

export { ContentTypes, ContentType, ContentTypeImport }