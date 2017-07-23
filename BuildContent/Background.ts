import { ContentType, Error, Build, EndsWith, RemoveExtension, PackedContent } from "./Misc"

import child_process = require("child_process")
import fs = require("fs")
import mkdirp = require("mkdirp")
const pngjs = require("pngjs")
const imagemin = require("imagemin")
const pngcrush = require("imagemin-pngcrush")
const rimraf = require("rimraf")
const cpr = require("cpr")

new ContentType(".background.ase", (filename, then) => {
    mkdirp(`Temp/${filename}`, err => {
        Error(err)
        child_process.spawn("aseprite", ["--batch", filename, "--data", `Temp/${filename}/data.json`, "--list-tags", "--format", "json-array", "--save-as", `Temp/${filename}/{frame}.png`, "--ignore-empty"]).on("exit", status => {
            if (status != 0) Error(`Failed to invoke Aseprite to convert sprite "${filename}"`)
            const dataPath = `Temp/${filename}/data.json`
            console.log(`Loading "${dataPath}"...`)
            fs.readFile(dataPath, "utf8", (err, dataJson) => {
                Error(err)
                const data: {
                    readonly frames: {}[]
                } = JSON.parse(dataJson)
                let frame = 0
                CompressNextFrame()
                function CompressNextFrame() {
                    if (frame == data.frames.length) {
                        then()
                    } else {
                        console.log(`Compressing frame "Temp/${filename}/${frame}.png"...`)
                        imagemin([`Temp/${filename}/${frame}.png`], `Temp/${filename}`, {
                            plugins: [pngcrush({
                                reduce: true
                            })]
                        }).then(() => {
                            frame++
                            CompressNextFrame()
                        })
                    }
                }
            })
        })
    })
}, then => {
    const remaining = Object.keys(Build.LastModified)
    type UnpackedFrame = {
        readonly References: {
            readonly Filename: string
            readonly DurationSeconds: number
        }[]
        readonly Png: any
        readonly Filename: string
    }
    const unpackedFrames: UnpackedFrame[] = []
    LoadNextExport()
    function LoadNextExport() {
        const filename = remaining.pop()
        if (filename) {
            if (!EndsWith(filename, ".background.ase")) {
                LoadNextExport()
            } else {
                // "Lock-in" the non-undefined value.
                const filenameReference = filename
                const dataPath = `Temp/${filenameReference}/data.json`
                console.log(`Loading "${dataPath}"...`)
                fs.readFile(dataPath, "utf8", (err, dataJson) => {
                    Error(err)
                    const data: {
                        readonly frames: {
                            readonly duration: number
                        }[]
                        readonly meta: {
                            frameTags: {
                                readonly name: string
                                readonly from: number
                                readonly to: number
                                readonly direction: "forward" | "reverse" | "pingpong"
                            }[]
                        }
                    } = JSON.parse(dataJson)
                    const remainingAnimations = data.meta.frameTags.slice()
                    LoadNextAnimation()
                    function LoadNextAnimation() {
                        const animation = remainingAnimations.pop()
                        if (!animation) {
                            LoadNextExport()
                        } else {
                            console.log(`Packing animation "${animation.name}"...`)

                            let frame = animation.from
                            const LoadNextFrame = () => {
                                if (frame > animation.to) {
                                    LoadNextAnimation()
                                } else {
                                    const sheetPath = `Temp/${filenameReference}/${frame}.png`
                                    console.log(`Loading "${sheetPath}"...`)
                                    const png = new pngjs.PNG()
                                    fs.createReadStream(sheetPath).pipe(png).on("parsed", () => {
                                        let match: UnpackedFrame | undefined = undefined
                                        for (const otherFrame of unpackedFrames) {
                                            if (png.width != otherFrame.Png.width) continue
                                            if (png.height != otherFrame.Png.height) continue
                                            match = otherFrame
                                            for (let y = 0; y < png.height; y++) {
                                                for (let x = 0; x < png.width; x++) {
                                                    // Skip transparent pixels.
                                                    if (png.data[4 * png.width * y + 4 * x + 3] == 0 && otherFrame.Png.data[4 * otherFrame.Png.width * y + 4 * x + 3] == 0) continue
                                                    for (let channel = 0; channel < 4; channel++) {
                                                        if (png.data[4 * png.width * y + 4 * x + channel] == otherFrame.Png.data[4 * otherFrame.Png.width * y + 4 * x + channel]) continue
                                                        match = undefined
                                                        break
                                                    }
                                                    if (!match) break
                                                }
                                                if (!match) break
                                            }
                                            if (match) break
                                        }

                                        if (!match) {
                                            match = {
                                                References: [],
                                                Png: png,
                                                Filename: sheetPath
                                            }
                                            unpackedFrames.push(match)
                                        }

                                        if (animation.from == animation.to) {
                                            match.References.push({
                                                Filename: `${RemoveExtension(filenameReference)}/${animation.name}`,
                                                DurationSeconds: data.frames[frame].duration / 1000
                                            })
                                        } else {
                                            switch (animation.direction) {
                                                case "forward":
                                                    match.References.push({
                                                        Filename: `${RemoveExtension(filenameReference)}/${animation.name}/${frame - animation.from}`,
                                                        DurationSeconds: data.frames[frame].duration / 1000
                                                    })
                                                    break

                                                case "reverse":
                                                    match.References.push({
                                                        Filename: `${RemoveExtension(filenameReference)}/${animation.name}/${animation.to - frame}`,
                                                        DurationSeconds: data.frames[frame].duration / 1000
                                                    })
                                                    break

                                                case "pingpong":
                                                    match.References.push({
                                                        Filename: `${RemoveExtension(filenameReference)}/${animation.name}/${frame - animation.from}`,
                                                        DurationSeconds: data.frames[frame].duration / 1000
                                                    })
                                                    if (frame > animation.from && frame < animation.to) match.References.push({
                                                        Filename: `${RemoveExtension(filenameReference)}/${animation.name}/${animation.to + (animation.to - animation.from) - frame}`,
                                                        DurationSeconds: data.frames[frame].duration / 1000
                                                    })
                                                    break
                                            }
                                        }
                                        frame++
                                        LoadNextFrame()
                                    })
                                }
                            }
                            LoadNextFrame()
                        }
                    }
                })
            }
        } else {
            for (const frame of unpackedFrames) if (frame.References.length > 1) console.log(`The following frames were duplicates: ${frame.References.map(r => r.Filename).join(", ")}`)
            console.info("All frames loaded, generating code...")
            const packedFrames: PackedContent[] = []

            for (const unpackedFrame of unpackedFrames) for (const reference of unpackedFrame.References) {
                packedFrames.push({
                    Path: reference.Filename,
                    GeneratedCode: `new BackgroundFrame(${unpackedFrames.indexOf(unpackedFrame)}, ${unpackedFrame.Png.width}, ${unpackedFrame.Png.height}, ${reference.DurationSeconds})`
                })
            }

            console.log("Deleting \"Build/Backgrounds\"...")
            rimraf("Build/Backgrounds", (err: any) => {
                Error(err)
                console.log("Copying images to \"Build/Backgrounds\"...")
                const toCopy = unpackedFrames.slice()
                CopyNext()
                function CopyNext() {
                    const next = toCopy.pop()
                    if (!next) {
                        then("", packedFrames)
                    } else {
                        cpr(next.Filename, `Build/Backgrounds/${toCopy.length}.png`, (err: any) => {
                            Error(err)
                            CopyNext()
                        })
                    }
                }
            })
        }
    }
})