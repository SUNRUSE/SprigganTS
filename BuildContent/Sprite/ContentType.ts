import { ImportedSpriteFrame, PackedSpriteFrame, SpritePackingHeader } from "./../Types"
import { Error, ScaleUpFromMemoryToFakeNearestNeighbor } from "./../Misc"
import { ContentType } from "./../ContentType"

import fs = require("fs")
const pngjs = require("pngjs")

const SpriteContentType = new ContentType<ImportedSpriteFrame, PackedSpriteFrame, SpritePackingHeader>("sprite", (imported, then) => {
    console.info("Loading all sprite frames...")
    type UnpackedFrame = {
        readonly Imported: ImportedSpriteFrame
        readonly Users: {
            readonly ContentName: string
            readonly OffsetLeftPixels: number
            readonly OffsetTopPixels: number
            readonly DurationSeconds: number
        }[]
        readonly Png: any
    }
    const unpackedFrames: UnpackedFrame[] = []
    let remainingFrames = Object.keys(imported).length
    if (!remainingFrames) Error("There are no sprite frames to pack")

    for (const contentName in imported) {
        const importedFrame = imported[contentName]
        if (importedFrame.Empty) {
            console.log(`Sprite frame "${contentName}" is empty`)
            FrameCompleted()
        } else {
            const png = new pngjs.PNG()
            fs.createReadStream(importedFrame.PngFilename).on("error", Error).pipe(png).on("error", Error).on("parsed", () => {
                let match: UnpackedFrame | undefined = undefined
                for (const other of unpackedFrames) {
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
                    console.warn(`Sprite frame "${contentName}" is identical to sprite frame "${match.Users[0].ContentName}"`)
                } else {
                    match = {
                        Imported: importedFrame,
                        Users: [],
                        Png: png
                    }
                    unpackedFrames.push(match)
                }
                match.Users.push({
                    ContentName: contentName,
                    OffsetLeftPixels: importedFrame.OffsetLeftPixels,
                    OffsetTopPixels: importedFrame.OffsetTopPixels,
                    DurationSeconds: importedFrame.DurationSeconds
                })
                FrameCompleted()
            })
        }
    }

    function FrameCompleted() {
        remainingFrames--
        if (remainingFrames) return
        console.info("All frames loaded, sorting by difficulty to pack...")
        unpackedFrames.sort((a, b) => {
            if (Math.max(a.Png.width, a.Png.height) > Math.max(b.Png.width, b.Png.height)) return -1
            if (Math.max(a.Png.width, a.Png.height) < Math.max(b.Png.width, b.Png.height)) return 1
            if ((a.Png.width * a.Png.height) > (b.Png.width * b.Png.height)) return -1
            if ((a.Png.width * a.Png.height) < (b.Png.width * b.Png.height)) return 1
            return 0
        })
        let initialAtlasWidth = 1
        let initialAtlasHeight = 1
        for (const frame of unpackedFrames) {
            initialAtlasWidth = Math.max(initialAtlasWidth, frame.Png.width)
            initialAtlasHeight = Math.max(initialAtlasHeight, frame.Png.height)
        }
        const greatestWidth = initialAtlasWidth
        const greatestHeight = initialAtlasHeight

        let totalPixels = 0
        for (const frame of unpackedFrames) totalPixels += frame.Png.width * frame.Png.height

        while (initialAtlasWidth * initialAtlasHeight < totalPixels) {
            if (initialAtlasWidth <= initialAtlasHeight) {
                initialAtlasWidth++
            } else {
                initialAtlasHeight++
            }
        }

        console.log(`Starting from ${initialAtlasWidth}x${initialAtlasHeight}(smallest covering ${totalPixels} pixels and ${greatestWidth}x${greatestHeight})...`)

        let attempts = 0
        Pack(initialAtlasWidth, initialAtlasHeight)

        function Pack(atlasWidth: number, atlasHeight: number) {
            attempts++
            type Space = {
                readonly Left: number
                readonly Top: number
                readonly Width: number
                readonly Height: number
            }

            const spaces: Space[] = [{
                Left: 0,
                Top: 0,
                Width: atlasWidth,
                Height: atlasHeight
            }]

            const packedFrames: {
                readonly Left: number
                readonly Top: number
                readonly Unpacked: UnpackedFrame
            }[] = []

            for (const frame of unpackedFrames) {
                // If any of the empty spaces can be merged, do it here.  
                while (true) {
                    let nothingToOptimize = true
                    for (const space of spaces) for (const otherSpace of spaces) {
                        if (space.Left != otherSpace.Left) continue
                        if (space.Width != otherSpace.Width) continue
                        if (space.Top + space.Height != otherSpace.Top && otherSpace.Top + otherSpace.Height != space.Top) continue
                        spaces.splice(spaces.indexOf(space), 1)
                        spaces.splice(spaces.indexOf(otherSpace), 1)
                        spaces.push({
                            Left: space.Left,
                            Top: Math.min(space.Top, otherSpace.Top),
                            Width: space.Width,
                            Height: space.Height + otherSpace.Height
                        })
                        nothingToOptimize = false
                        break
                    }
                    if (!nothingToOptimize) continue
                    for (const space of spaces) for (const otherSpace of spaces) {
                        if (space.Top != otherSpace.Top) continue
                        if (space.Height != otherSpace.Height) continue
                        if (space.Left + space.Width != otherSpace.Left && otherSpace.Left + otherSpace.Width != space.Left) continue
                        spaces.splice(spaces.indexOf(space), 1)
                        spaces.splice(spaces.indexOf(otherSpace), 1)
                        spaces.push({
                            Left: Math.min(space.Left, otherSpace.Left),
                            Top: space.Top,
                            Width: space.Width + otherSpace.Width,
                            Height: space.Height
                        })
                        nothingToOptimize = false
                        break
                    }
                    if (!nothingToOptimize) continue
                    break
                }

                let found = false
                for (const space of spaces) {
                    if (space.Width != frame.Png.width || space.Height != frame.Png.height) continue
                    found = true
                    packedFrames.push({
                        Left: space.Left,
                        Top: space.Top,
                        Unpacked: frame
                    })
                    spaces.splice(spaces.indexOf(space), 1)
                    break
                }
                if (found) continue

                const FindWidthFit = () => {
                    let bestSpace: Space | undefined = undefined
                    for (const space of spaces) {
                        if (space.Width != frame.Png.width) continue
                        if (space.Height < frame.Png.height) continue
                        if (bestSpace && bestSpace.Height < space.Height) continue
                        bestSpace = space
                    }
                    if (!bestSpace) return false
                    packedFrames.push({
                        Left: bestSpace.Left,
                        Top: bestSpace.Top,
                        Unpacked: frame
                    })
                    spaces.splice(spaces.indexOf(bestSpace), 1)
                    spaces.push({
                        Left: bestSpace.Left,
                        Top: bestSpace.Top + frame.Png.height,
                        Width: bestSpace.Width,
                        Height: bestSpace.Height - frame.Png.height
                    })
                    return true
                }

                const FindHeightFit = () => {
                    let bestSpace: Space | undefined = undefined
                    for (const space of spaces) {
                        if (space.Height != frame.Png.height) continue
                        if (space.Width < frame.Png.width) continue
                        if (bestSpace && bestSpace.Width < space.Width) continue
                        bestSpace = space
                    }
                    if (!bestSpace) return false
                    packedFrames.push({
                        Left: bestSpace.Left,
                        Top: bestSpace.Top,
                        Unpacked: frame
                    })
                    spaces.splice(spaces.indexOf(bestSpace), 1)
                    spaces.push({
                        Left: bestSpace.Left + frame.Png.width,
                        Top: bestSpace.Top,
                        Width: bestSpace.Width - frame.Png.width,
                        Height: bestSpace.Height
                    })
                    return true
                }

                if (frame.Png.width >= frame.Png.height) {
                    found = FindWidthFit() || FindHeightFit()
                } else {
                    found = FindHeightFit() || FindWidthFit()
                }

                if (!found) {
                    // Find the "most awkward" space for this frame, even if it wastes space to right and bottom; it might still get filled.
                    let bestSpace: Space | undefined = undefined
                    for (const space of spaces) {
                        if (space.Width < frame.Png.width) continue
                        if (space.Height < frame.Png.height) continue
                        if (bestSpace && Math.min(bestSpace.Width - frame.Png.width, bestSpace.Height - frame.Png.height) < Math.min(space.Width - frame.Png.width, space.Height - frame.Png.height)) continue
                        bestSpace = space
                    }
                    if (!bestSpace) {
                        // We can increase efficiency by widening when we were too wide, etc. but this tends to make very narrow "strips".
                        // Ideally we want a square as this is less likely to hit any driver constraints.
                        if (atlasWidth <= atlasHeight) {
                            atlasWidth++
                        } else {
                            atlasHeight++
                        }
                        Pack(atlasWidth, atlasHeight)
                        return
                    }
                    packedFrames.push({
                        Left: bestSpace.Left,
                        Top: bestSpace.Top,
                        Unpacked: frame
                    })
                    spaces.splice(spaces.indexOf(bestSpace), 1)
                    if (bestSpace.Width - frame.Png.width > bestSpace.Height - frame.Png.height) {
                        spaces.push({
                            Left: bestSpace.Left + frame.Png.width,
                            Top: bestSpace.Top,
                            Width: bestSpace.Width - frame.Png.width,
                            Height: bestSpace.Height
                        })
                        spaces.push({
                            Left: bestSpace.Left,
                            Top: bestSpace.Top + frame.Png.height,
                            Width: frame.Png.width,
                            Height: bestSpace.Height - frame.Png.height
                        })
                    } else {
                        spaces.push({
                            Left: bestSpace.Left,
                            Top: bestSpace.Top + frame.Png.height,
                            Width: bestSpace.Width,
                            Height: bestSpace.Height - frame.Png.height
                        })
                        spaces.push({
                            Left: bestSpace.Left + frame.Png.width,
                            Top: bestSpace.Top,
                            Width: bestSpace.Width - frame.Png.width,
                            Height: frame.Png.height
                        })
                    }
                }
            }

            console.info(`Packed into ${atlasWidth}x${atlasHeight} in ${attempts} attempt(s) with ${Math.floor(10000 * totalPixels / (atlasWidth * atlasHeight)) / 100}% efficiency; generating atlas...`)

            const atlas = new pngjs.PNG({
                width: atlasWidth,
                height: atlasHeight
            })

            for (let i = 0; i < atlas.data.length; i++) atlas.data[i] = 0

            for (const frame of packedFrames) frame.Unpacked.Png.bitblt(atlas, 0, 0, frame.Unpacked.Png.width, frame.Unpacked.Png.height, frame.Left, frame.Top)

            console.log("Writing atlas...")
            const writeStream = fs.createWriteStream("Temp/Content/Packed/sprite/Atlas.png")
            atlas.pack().pipe(writeStream)
            writeStream.on("error", Error).on("close", () => {
                ScaleUpFromMemoryToFakeNearestNeighbor(atlas, "Temp/Content/Packed/sprite/AtlasPrescaled.png", 4, () => {
                    console.log("Listing packed content...")
                    const collapsed: { [contentName: string]: PackedSpriteFrame } = {}
                    for (const packed of packedFrames) {
                        for (const user of packed.Unpacked.Users) {
                            collapsed[user.ContentName] = {
                                Empty: false,
                                AtlasLeftPixels: packed.Left + 1,
                                AtlasTopPixels: packed.Top + 1,
                                WidthPixels: packed.Unpacked.Png.width - 2,
                                HeightPixels: packed.Unpacked.Png.height - 2,
                                OffsetLeftPixels: user.OffsetLeftPixels,
                                OffsetTopPixels: user.OffsetTopPixels,
                                DurationSeconds: user.DurationSeconds
                            }
                        }
                    }
                    for (const contentName in imported) if (imported[contentName].Empty) collapsed[contentName] = {
                        Empty: true,
                        DurationSeconds: imported[contentName].DurationSeconds
                    }
                    then({
                        AtlasWidthPixels: atlasWidth,
                        AtlasHeightPixels: atlasHeight
                    }, collapsed)
                })
            })
        }
    }
})

export { SpriteContentType }