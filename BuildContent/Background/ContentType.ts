import { ImportedBackgroundFrame, PackedBackgroundFrame, BackgroundPackingHeader } from "./../Types"
import { ContentType } from "./../ContentType"
import { Error } from "./../Misc"

import fs = require("fs")
import path = require("path")
import cpr = require("cpr")
const pngjs = require("pngjs")

const BackgroundContentType = new ContentType<ImportedBackgroundFrame, PackedBackgroundFrame, BackgroundPackingHeader>("background", (imported, then) => {
    console.info("Loading all background frames; finding duplicates and copying to output directory...")
    type UnpackedFrame = {
        readonly Imported: ImportedBackgroundFrame
        readonly Users: {
            readonly ContentName: string
            readonly DurationSeconds: number
        }[]
        readonly Png: any
    }
    const packedFrames: UnpackedFrame[] = []
    let remainingFrames = Object.keys(imported).length
    if (!remainingFrames) {
        console.info("There are no frames to pack")
        then({}, {})
        return
    }

    for (const contentName in imported) {
        const importedFrame = imported[contentName]
        if (importedFrame.Empty) {
            console.log(`Background frame "${contentName}" is empty`)
            FrameCompleted()
        } else {
            const png = new pngjs.PNG()
            fs.createReadStream(importedFrame.PngFilename).on("error", Error).pipe(png).on("error", Error).on("parsed", () => {
                let match: UnpackedFrame | undefined = undefined
                for (const other of packedFrames) {
                    if (other.Png.width != png.width) continue
                    if (other.Png.height != png.height) continue
                    match = other
                    for (let y = 0; y < other.Png.height; y++) {
                        for (let x = 0; x < other.Png.width; x++) {
                            if (png.data[y * png.width * 4 + x * 4 + 3] != other.Png.data[y * png.width * 4 + x * 4 + 3]) {
                                match = undefined
                                break
                            }

                            // Ignore RGB of transparent pixels.
                            if (png.data[y * png.width * 4 + x * 4 + 3]) {
                                for (let channel = 0; channel < 3; channel++) {
                                    if (png.data[y * png.width * 4 + x * 4 + channel] != other.Png.data[y * png.width * 4 + x * 4 + channel]) {
                                        match = undefined
                                        break
                                    }
                                }
                            }

                            if (!match) break
                        }

                        if (!match) break
                    }

                    if (match) break
                }

                if (match) {
                    console.warn(`Background frame "${contentName}" is identical to background frame "${match.Users[0].ContentName}"`)
                    match.Users.push({
                        ContentName: contentName,
                        DurationSeconds: importedFrame.DurationSeconds
                    })
                    FrameCompleted()
                } else {
                    match = {
                        Imported: importedFrame,
                        Users: [{
                            ContentName: contentName,
                            DurationSeconds: importedFrame.DurationSeconds
                        }],
                        Png: png
                    }
                    const id = packedFrames.length
                    packedFrames.push(match)
                    cpr(importedFrame.PngFilename, path.join("Temp", "Content", "Packed", "background", `${id}.png`), {}, err => {
                        Error(err)
                        FrameCompleted()
                    })
                }
            })
        }
    }

    function FrameCompleted() {
        remainingFrames--
        if (remainingFrames) return
        console.info("All frames copied, listing packed content...")
        const collapsed: { [contentName: string]: PackedBackgroundFrame } = {}
        for (let i = 0; i < packedFrames.length; i++) {
            const packed = packedFrames[i]
            for (const user of packed.Users) {
                if (packed.Imported.Empty) throw "This should never happen; required to satisfy type checker"
                collapsed[user.ContentName] = {
                    Empty: false,
                    Id: i,
                    WidthPixels: packed.Imported.WidthPixels,
                    HeightPixels: packed.Imported.HeightPixels,
                    DurationSeconds: packed.Imported.DurationSeconds
                }
            }
        }
        for (const contentName in imported) if (imported[contentName].Empty) collapsed[contentName] = {
            Empty: true,
            DurationSeconds: imported[contentName].DurationSeconds
        }
        then({}, collapsed)
    }
})

export { BackgroundContentType }