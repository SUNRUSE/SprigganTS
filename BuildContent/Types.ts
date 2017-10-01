type Configuration = {
    Name: string
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

    PackingHeaders: { [contentTypeFirstExtension: string]: any }

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

type SpritePackingHeader = {
    readonly AtlasWidthPixels: number
    readonly AtlasHeightPixels: number
}

type ImportedBackgroundFrame =
    {
        readonly Empty: false
        readonly PngFilename: string
        readonly WidthPixels: number
        readonly HeightPixels: number
        readonly DurationSeconds: number
    } | {
        readonly Empty: true
        readonly DurationSeconds: number
    }

type PackedBackgroundFrame =
    {
        readonly Empty: false
        readonly Id: number
        readonly WidthPixels: number
        readonly HeightPixels: number
        readonly DurationSeconds: number
    } | {
        readonly Empty: true
        readonly DurationSeconds: number
    }

type BackgroundPackingHeader = {}

type ImportedSound = {
    readonly Directory: string
    readonly Gain: number
}

type PackedSound = {
    readonly Directory: string
    readonly StartSeconds: number
    readonly DurationSeconds: number
    readonly Gain: number
}

type SoundPackingHeader = {}

type ImportedMusic = {
    readonly Directory: string
    readonly Gain: number
}

type PackedMusic = {
    readonly Id: number
    readonly Directory: string
    readonly Gain: number
}

type MusicPackingHeader = {}

type ImportedDialog = {
    readonly Directory: string
    readonly Gain: number
}

type PackedDialog = {
    readonly Id: number
    readonly Directory: string
    readonly Gain: number
}

type DialogPackingHeader = {}

export { Configuration, Build, ImportedSpriteFrame, PackedSpriteFrame, SpritePackingHeader, ImportedBackgroundFrame, PackedBackgroundFrame, BackgroundPackingHeader, ImportedSound, PackedSound, SoundPackingHeader, ImportedMusic, PackedMusic, MusicPackingHeader, ImportedDialog, PackedDialog, DialogPackingHeader }