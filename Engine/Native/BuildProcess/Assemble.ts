import { Error } from "./../../../BuildContent/Misc"
import { Build, Configuration, PackedSpriteFrame, PackedBackgroundFrame, PackedSound, PackedMusic, PackedDialog } from "./../../../BuildContent/Types"
import { GenerateCodeFromContentTree, GenerateContentTreeFromBuild } from "./../../../BuildContent/Tree"

import zlib = require("zlib")
import fs = require("fs")
import path = require("path")
const rimraf = require("rimraf")
import mkdirp = require("mkdirp")
import uglifyjs = require("uglify-js")

DeleteExistingAssembledDirectory()

function DeleteExistingAssembledDirectory() {
    console.info("Deleting \"Temp/Assembled/Native/game.bin\" if it exists...")
    rimraf("Temp/Assembled/Native/game.bin", (err: any) => {
        Error(err)
        ReadContent()
    })
}

let Build: Build

function ReadContent() {
    console.info("Reading content... (Temp/Content/Index.json)")
    fs.readFile("Temp/Content/Index.json", "utf8", (err, data) => {
        Error(err)
        Build = JSON.parse(data)
        ReadConfiguration()
    })
}

let Configuration: Configuration

function ReadConfiguration() {
    console.info("Reading configuration file... (Game/Configuration.json)")
    fs.readFile("Game/Configuration.json", "utf8", (err, data) => {
        Error(err)
        Configuration = JSON.parse(data)
        GenerateContent()
    })
}

const Chunks: ArrayBuffer[] = []

let Content: string
const SpriteFrameAtlasLeftPixels: number[] = []
const SpriteFrameAtlasTopPixels: number[] = []
const SpriteFrameWidthPixels: number[] = []
const SpriteFrameHeightPixels: number[] = []
const SpriteFrameOffsetLeftPixels: number[] = []
const SpriteFrameOffsetTopPixels: number[] = []
const SpriteFrameDurationMilliseconds: number[] = []
const BackgroundFrameIds: number[] = []
const BackgroundFrameDurationMilliseconds: number[] = []
const SoundDirectories: string[] = []
const SoundGains: number[] = []
const MusicDirectories: string[] = []
const MusicGains: number[] = []
const DialogDirectories: string[] = []
const DialogGains: number[] = []

function GenerateContent() {
    console.info("Generating content scripts...")

    Content = GenerateCodeFromContentTree(GenerateContentTreeFromBuild(Build), false, {
        sprite: (spriteFrame: PackedSpriteFrame) => {
            SpriteFrameAtlasLeftPixels.push(spriteFrame.Empty ? 0 : spriteFrame.AtlasLeftPixels)
            SpriteFrameAtlasTopPixels.push(spriteFrame.Empty ? 0 : spriteFrame.AtlasTopPixels)
            SpriteFrameWidthPixels.push(spriteFrame.Empty ? 0 : spriteFrame.WidthPixels)
            SpriteFrameHeightPixels.push(spriteFrame.Empty ? 0 : spriteFrame.HeightPixels)
            SpriteFrameOffsetLeftPixels.push(spriteFrame.Empty ? 0 : spriteFrame.OffsetLeftPixels)
            SpriteFrameOffsetTopPixels.push(spriteFrame.Empty ? 0 : spriteFrame.OffsetTopPixels)
            SpriteFrameDurationMilliseconds.push(spriteFrame.DurationSeconds * 1000)
            return `${SpriteFrameAtlasLeftPixels.length - 1}`
        },
        background: (backgroundFrame: PackedBackgroundFrame) => {
            BackgroundFrameIds.push(backgroundFrame.Empty ? 65535 : backgroundFrame.Id)
            BackgroundFrameDurationMilliseconds.push(backgroundFrame.DurationSeconds * 1000)
            return `${BackgroundFrameIds.length - 1}`
        },
        sound: (sound: PackedSound) => {
            SoundDirectories.push(sound.Directory)
            SoundGains.push(sound.Gain)
            return `${SoundDirectories.length - 1}`
        },
        music: (music: PackedMusic) => {
            MusicDirectories[music.Id] = music.Directory
            MusicGains.push(music.Gain)
            return `${music.Id}`
        },
        dialog: (dialog: PackedDialog) => {
            DialogDirectories[dialog.Id] = dialog.Directory
            DialogGains.push(dialog.Gain)
            return `${dialog.Id}`
        }
    })
    GenerateHeader()
}

let Header: string
let UniqueBackgroundIds: number

function GenerateHeader() {
    console.info("Generating header...")
    UniqueBackgroundIds = Math.max.apply(Math, BackgroundFrameIds)
    UniqueBackgroundIds = UniqueBackgroundIds == -Infinity ? 0 : UniqueBackgroundIds + 1
    Chunks.push(Uint16Array.from([
        process.env.NODE_ENV == "production" ? 32768 : 0,
        Configuration.VirtualWidth,
        Configuration.VirtualHeight,
        SpriteFrameAtlasLeftPixels.length,
        BackgroundFrameIds.length,
        UniqueBackgroundIds,
        SoundDirectories.length,
        MusicDirectories.length,
        DialogDirectories.length
    ]).buffer)
    Chunks.push(Buffer.from(Configuration.Name, "utf8"))
    Header = `var WidthVirtualPixels = ${Configuration.VirtualWidth}
var HeightVirtualPixels = ${Configuration.VirtualHeight}`
    ReadSharedEngine()
}

let SharedEngine: string

function ReadSharedEngine() {
    console.info("Reading Shared engine JavaScript...")
    fs.readFile("Temp/Scripts/Engine/Shared.js", "utf8", (err, data) => {
        Error(err)
        SharedEngine = data
        ReadGame()
    })
}

let Game: string

function ReadGame() {
    console.info("Reading game JavaScript...")
    fs.readFile("Temp/Scripts/Game/Index.js", "utf8", (err, data) => {
        Error(err)
        Game = data
        ConcatenateScripts()
    })
}

let ConcatenatedScripts: string

function ConcatenateScripts() {
    console.info("Concatenating scripts...")
    ConcatenatedScripts = `${Header}
${SharedEngine}
${Content}
function StartGame() {
${Game}
}
SetLoadingMessage("Starting scripts, please wait...")`
    MinifyScripts()
}

function MinifyScripts() {
    if (process.env.NODE_ENV != "production") {
        console.info("Skipping script minification as not building for production")
        Chunks.push(Buffer.from(ConcatenatedScripts, "utf8"))
    } else {
        console.info("Minifying scripts...")
        ConcatenatedScripts = uglifyjs.minify(ConcatenatedScripts, {
            compress: true,
            mangle: {
                toplevel: true,
                properties: {
                    keep_quoted: true,
                    builtins: true
                }
            }
        }).code
        console.info("Deflating scripts...")
        zlib.deflate(Buffer.from(ConcatenatedScripts, "utf8"), (err, deflated) => {
            Error(err)
            Chunks.push(deflated)
        })
    }
    BuildSpriteFrameTable()
}

function BuildSpriteFrameTable() {
    console.info("Building sprite frame table...")
    let buffer = Buffer.concat([
        Uint16Array.from(SpriteFrameAtlasLeftPixels).buffer,
        Uint16Array.from(SpriteFrameAtlasTopPixels).buffer,
        Uint16Array.from(SpriteFrameWidthPixels).buffer,
        Uint16Array.from(SpriteFrameHeightPixels).buffer,
        Int16Array.from(SpriteFrameOffsetLeftPixels).buffer,
        Int16Array.from(SpriteFrameOffsetTopPixels).buffer,
        Uint16Array.from(SpriteFrameDurationMilliseconds).buffer
    ].map(ab => new Buffer(ab)))

    if (process.env.NODE_ENV != "production") {
        console.info("Skipping sprite table deflation as not building for production")
        Chunks.push(buffer)
        LoadSpriteAtlas()
    } else {
        console.info("Deflating sprite table...")
        zlib.deflate(buffer, (err, deflated) => {
            Error(err)
            Chunks.push(deflated)
            LoadSpriteAtlas()
        })
    }
}

function LoadSpriteAtlas() {
    console.info("Loading sprite atlas...")
    fs.readFile("Temp/Content/Packed/sprite/Atlas.png", (err, data) => {
        Error(err)
        Chunks.push(data)
        BuildBackgroundFrameTable()
    })
}

function BuildBackgroundFrameTable() {
    console.info("Building background frame table...")
    const buffer = Buffer.concat([
        Uint16Array.from(BackgroundFrameIds).buffer,
        Uint16Array.from(BackgroundFrameDurationMilliseconds).buffer
    ].map(ab => new Buffer(ab)))

    if (process.env.NODE_ENV != "production") {
        console.info("Skipping background table deflation as not building for production")
        Chunks.push(buffer)
        LoadBackgroundFrames()
    } else {
        console.info("Deflating background table...")
        zlib.deflate(buffer, (err, deflated) => {
            Error(err)
            Chunks.push(deflated)
            LoadBackgroundFrames()
        })
    }
}

function LoadBackgroundFrames() {
    console.info("Loading background frames...")
    const addBackgroundFramesAt = Chunks.length
    let remainingFrames = UniqueBackgroundIds
    for (let i = 0; i < UniqueBackgroundIds; i++) fs.readFile(`Temp/Content/Packed/background/${i}.png`, (err, data) => {
        console.log(`Background frame ${i} loaded`)
        Error(err)
        Chunks[addBackgroundFramesAt + i] = data
        remainingFrames--
        if (!remainingFrames) BuildSoundTable()
    })
    if (!remainingFrames) BuildSoundTable()
}

function BuildSoundTable() {
    console.info("Building sound table...")
    const buffer = Buffer.concat([
        Float32Array.from(SoundGains).buffer
    ].map(ab => new Buffer(ab)))

    if (process.env.NODE_ENV != "production") {
        console.info("Skipping sound table deflation as not building for production")
        Chunks.push(buffer)
        LoadSounds()
    } else {
        console.info("Deflating sound table...")
        zlib.deflate(buffer, (err, deflated) => {
            Error(err)
            Chunks.push(deflated)
            LoadSounds()
        })
    }
}

function LoadSounds() {
    console.info("Loading sounds...")
    const addSoundsAt = Chunks.length
    let remainingFrames = SoundDirectories.length
    let index = 0
    for (const sound of SoundDirectories) fs.readFile(path.join(sound, "Interleaved.bin"), (err, data) => {
        const capturedIndex = index++
        console.log(`Sound ${capturedIndex} (${sound}) loaded`)
        Error(err)
        Chunks[addSoundsAt + capturedIndex] = data
        remainingFrames--
        if (!remainingFrames) BuildMusicTable()
    })
    if (!remainingFrames) BuildMusicTable()
}

function BuildMusicTable() {
    console.info("Building music table...")
    const buffer = Buffer.concat([
        Float32Array.from(MusicGains).buffer
    ].map(ab => new Buffer(ab)))

    if (process.env.NODE_ENV != "production") {
        console.info("Skipping music table deflation as not building for production")
        Chunks.push(buffer)
        LoadMusic()
    } else {
        console.info("Deflating music table...")
        zlib.deflate(buffer, (err, deflated) => {
            Error(err)
            Chunks.push(deflated)
            LoadMusic()
        })
    }
}

function LoadMusic() {
    console.info("Loading music...")
    const addMusicAt = Chunks.length
    let remainingFrames = MusicDirectories.length
    let index = 0
    for (const music of MusicDirectories) fs.readFile(path.join(music, "Interleaved.bin"), (err, data) => {
        const capturedIndex = index++
        console.log(`Music ${capturedIndex} (${music}) loaded`)
        Error(err)
        Chunks[addMusicAt + capturedIndex] = data
        remainingFrames--
        if (!remainingFrames) BuildDialogTable()
    })
    if (!remainingFrames) BuildDialogTable()
}

function BuildDialogTable() {
    console.info("Building dialog table...")
    const buffer = Buffer.concat([
        Float32Array.from(DialogGains).buffer
    ].map(ab => new Buffer(ab)))

    if (process.env.NODE_ENV != "production") {
        console.info("Skipping dialog table deflation as not building for production")
        Chunks.push(buffer)
        LoadDialog()
    } else {
        console.info("Deflating dialog table...")
        zlib.deflate(buffer, (err, deflated) => {
            Error(err)
            Chunks.push(deflated)
            LoadDialog()
        })
    }
}

function LoadDialog() {
    console.info("Loading dialog...")
    const addDialogAt = Chunks.length
    let remainingFrames = DialogDirectories.length
    let index = 0
    for (const dialog of DialogDirectories) fs.readFile(path.join(dialog, "Interleaved.bin"), (err, data) => {
        const capturedIndex = index++
        console.log(`Dialog ${capturedIndex} (${dialog}) loaded`)
        Error(err)
        Chunks[addDialogAt + capturedIndex] = data
        remainingFrames--
        if (!remainingFrames) CompileChunks()
    })
    if (!remainingFrames) CompileChunks()
}

let CompiledChunks: Buffer

function CompileChunks() {
    console.info("Compiling chunks...")
    CompiledChunks = Buffer.concat([Uint32Array.from([Chunks.length]).buffer, Uint32Array.from(Chunks.map(c => c.byteLength)).buffer].concat(Chunks).map(ab => new Buffer(ab)))
    CreateAssembledDirectory()
}

function CreateAssembledDirectory() {
    console.info("Creating \"Temp/Assembled/Native\" if it does not exist...")
    mkdirp("Temp/Assembled/Native", err => {
        Error(err)
        CreateFile()
    })
}

function CreateFile() {
    console.info("Writing \"Temp/Assembled/Native/game.bin\"...")
    fs.writeFile("Temp/Assembled/Native/game.bin", CompiledChunks, err => {
        Error(err)
        Done()
    })
}

function Done() {
    console.info("Done")
}