type Configuration = {
    VirtualWidth: number
    VirtualHeight: number
}

type Build = {
    LastModified: { [filename: string]: number }

    ImportedContent: {
        [contentTypeFirstExtension: string]: {
            [filename: string]: {
                [contentName: string]: any
            }
        }
    }

    PackedContent: {
        [contentTypeFirstExtension: string]: {
            [contentName: string]: any
        }
    }
}

type ImportedSpriteFrame =
    {
        readonly Empty: false
        readonly PngFilename: string
        readonly OffsetLeftPixels: number
        readonly OffsetTopPixels: number
        readonly DurationSeconds: number
    } | {
        readonly Empty: true
        readonly DurationSeconds: number
    }

type PackedSpriteFrame =
    {
        readonly Empty: false
        readonly AtlasLeftPixels: number
        readonly AtlasTopPixels: number
        readonly WidthPixels: number
        readonly HeightPixels: number
        readonly OffsetLeftPixels: number
        readonly OffsetTopPixels: number
        readonly DurationSeconds: number
    } | {
        readonly Empty: true
        readonly DurationSeconds: number
    }

type ImportedBackground = {
    readonly PngFilename: string
    readonly WidthPixels: number
    readonly HeightPixels: number
    readonly DurationSeconds: number
}

type PackedBackground = {
    readonly Id: number
    readonly WidthPixels: number
    readonly HeightPixels: number
    readonly DurationSeconds: number
}

export { Build, ImportedSpriteFrame, PackedSpriteFrame, ImportedBackground, PackedBackground }