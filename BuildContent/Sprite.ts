import { ContentType, Build, EndsWith, PackedContent, Error, RemoveExtension } from "./Misc"

import child_process = require("child_process")
import fs = require("fs")
import mkdirp = require("mkdirp")
const pngjs = require("pngjs")
const imagemin = require("imagemin")
const pngcrush = require("imagemin-pngcrush")

new ContentType(".sprite.ase", (filename, then) => {
    mkdirp(`Temp/${filename}`, err => {
        Error(err)
        child_process.spawn("aseprite", ["--batch", filename, "--data", `Temp/${filename}/data.json`, "--list-tags", "--format", "json-array", "--sheet", `Temp/${filename}/Sheet.png`, "--trim", "--sheet-pack", "--ignore-empty"]).on("exit", status => {
            if (status != 0) Error(`Failed to invoke Aseprite to convert sprite "${filename}"`)
            then()
        })
    })
}, then => {
    const remaining = Object.keys(Build.LastModified)
    console.info("Loading sheets/data...")

    type UnpackedFrame = {
        readonly References: {
            readonly Filename: string
            readonly MarginLeft: number
            readonly MarginTop: number
            readonly DurationSeconds: number
        }[]
        readonly Width: number
        readonly Height: number
        readonly Png: any
        readonly SourceLeft: number
        readonly SourceTop: number
    }
    const unpackedFrames: UnpackedFrame[] = []

    LoadNextExport()
    function LoadNextExport() {
        const filename = remaining.pop()
        if (!filename) {
            for (const frame of unpackedFrames) if (frame.References.length > 1) console.log(`The following frames were duplicates: ${frame.References.map(r => r.Filename).join(", ")}`)
            console.info("All frames loaded, sorting by difficulty to pack...")
            unpackedFrames.sort((a, b) => {
                if (Math.max(a.Width, a.Height) > Math.max(b.Width, b.Height)) return -1
                if (Math.max(a.Width, a.Height) < Math.max(b.Width, b.Height)) return 1
                if ((a.Width * a.Height) > (b.Width * b.Height)) return -1
                if ((a.Width * a.Height) < (b.Width * b.Height)) return 1
                return 0
            })
            let greatestWidth = 1
            let greatestHeight = 1
            for (const frame of unpackedFrames) {
                greatestWidth = Math.max(greatestWidth, frame.Width)
                greatestHeight = Math.max(greatestHeight, frame.Height)
            }
            PackAtlas(greatestWidth, greatestHeight, 1)
        } else if (!EndsWith(filename, ".sprite.ase")) {
            LoadNextExport()
        } else {
            const dataPath = `Temp/${filename}/data.json`
            console.log(`Loading "${dataPath}"...`)
            fs.readFile(dataPath, "utf8", (err, dataJson) => {
                Error(err)
                const data: {
                    readonly frames: {
                        readonly frame: {
                            readonly x: number
                            readonly y: number
                            readonly w: number
                            readonly h: number
                        }
                        readonly spriteSourceSize: {
                            readonly x: number
                            readonly y: number
                            readonly w: number
                            readonly h: number
                        }
                        readonly sourceSize: {
                            readonly w: number
                            readonly h: number
                        }
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
                const sheetPath = `Temp/${filename}/Sheet.png`
                console.log(`Loading "${sheetPath}"...`)
                const png = new pngjs.PNG()
                fs.createReadStream(sheetPath).pipe(png).on("parsed", () => {
                    for (const animation of data.meta.frameTags) {
                        for (const frame of data.frames.slice(animation.from, animation.to + 1)) {
                            let match: UnpackedFrame | undefined = undefined
                            for (const otherFrame of unpackedFrames) {
                                if (frame.frame.w != otherFrame.Width - 2) continue
                                if (frame.frame.h != otherFrame.Height - 2) continue
                                match = otherFrame
                                for (let y = 0; y < frame.frame.h; y++) {
                                    for (let x = 0; x < frame.frame.w; x++) {
                                        // Skip transparent pixels.
                                        if (png.data[4 * png.width * (y + frame.frame.y) + 4 * (x + frame.frame.x) + 3] == 0 && otherFrame.Png.data[4 * otherFrame.Png.width * (y + otherFrame.SourceTop) + 4 * (x + otherFrame.SourceLeft) + 3] == 0) continue
                                        for (let channel = 0; channel < 4; channel++) {
                                            if (png.data[4 * png.width * (y + frame.frame.y) + 4 * (x + frame.frame.x) + channel] == otherFrame.Png.data[4 * otherFrame.Png.width * (y + otherFrame.SourceTop) + 4 * (x + otherFrame.SourceLeft) + channel]) continue
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
                                    Width: frame.frame.w + 2,
                                    Height: frame.frame.h + 2,
                                    Png: png,
                                    SourceLeft: frame.frame.x,
                                    SourceTop: frame.frame.y,
                                }
                                unpackedFrames.push(match)
                            }

                            const marginLeft = frame.spriteSourceSize.x - (frame.sourceSize.w / 2)
                            const marginTop = frame.spriteSourceSize.y - (frame.sourceSize.h / 2)

                            if (animation.from == animation.to) {
                                match.References.push({
                                    Filename: `${RemoveExtension(filename)}/${animation.name}`,
                                    MarginLeft: marginLeft,
                                    MarginTop: marginTop,
                                    DurationSeconds: frame.duration / 1000
                                })
                            } else {
                                const frameId = data.frames.indexOf(frame)
                                switch (animation.direction) {
                                    case "forward":
                                        match.References.push({
                                            Filename: `${RemoveExtension(filename)}/${animation.name}/${frameId - animation.from}`,
                                            MarginLeft: marginLeft,
                                            MarginTop: marginTop,
                                            DurationSeconds: frame.duration / 1000
                                        })
                                        break

                                    case "reverse":
                                        match.References.push({
                                            Filename: `${RemoveExtension(filename)}/${animation.name}/${animation.to - frameId}`,
                                            MarginLeft: marginLeft,
                                            MarginTop: marginTop,
                                            DurationSeconds: frame.duration / 1000
                                        })
                                        break

                                    case "pingpong":
                                        match.References.push({
                                            Filename: `${RemoveExtension(filename)}/${animation.name}/${frameId - animation.from}`,
                                            MarginLeft: marginLeft,
                                            MarginTop: marginTop,
                                            DurationSeconds: frame.duration / 1000
                                        })
                                        if (frameId > animation.from && frameId < animation.to) match.References.push({
                                            Filename: `${RemoveExtension(filename)}/${animation.name}/${animation.to + (animation.to - animation.from) - frameId}`,
                                            MarginLeft: marginLeft,
                                            MarginTop: marginTop,
                                            DurationSeconds: frame.duration / 1000
                                        })
                                        break
                                }
                            }
                        }
                    }
                    LoadNextExport()
                })
            })
        }
    }

    function PackAtlas(atlasWidth: number, atlasHeight: number, packingAttempts: number) {
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
            readonly Width: number
            readonly Height: number
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
                if (space.Width != frame.Width || space.Height != frame.Height) continue
                found = true
                packedFrames.push({
                    Left: space.Left,
                    Top: space.Top,
                    Width: frame.Width,
                    Height: frame.Height,
                    Unpacked: frame
                })
                spaces.splice(spaces.indexOf(space), 1)
                break
            }
            if (found) continue

            const FindWidthFit = () => {
                let bestSpace: Space | undefined = undefined
                for (const space of spaces) {
                    if (space.Width != frame.Width) continue
                    if (space.Height < frame.Height) continue
                    if (bestSpace && bestSpace.Height < space.Height) continue
                    bestSpace = space
                }
                if (!bestSpace) return false
                packedFrames.push({
                    Left: bestSpace.Left,
                    Top: bestSpace.Top,
                    Width: frame.Width,
                    Height: frame.Height,
                    Unpacked: frame
                })
                spaces.splice(spaces.indexOf(bestSpace), 1)
                spaces.push({
                    Left: bestSpace.Left,
                    Top: bestSpace.Top + frame.Height,
                    Width: bestSpace.Width,
                    Height: bestSpace.Height - frame.Height
                })
                return true
            }

            const FindHeightFit = () => {
                let bestSpace: Space | undefined = undefined
                for (const space of spaces) {
                    if (space.Height != frame.Height) continue
                    if (space.Width < frame.Width) continue
                    if (bestSpace && bestSpace.Width < space.Width) continue
                    bestSpace = space
                }
                if (!bestSpace) return false
                packedFrames.push({
                    Left: bestSpace.Left,
                    Top: bestSpace.Top,
                    Width: frame.Width,
                    Height: frame.Height,
                    Unpacked: frame
                })
                spaces.splice(spaces.indexOf(bestSpace), 1)
                spaces.push({
                    Left: bestSpace.Left + frame.Width,
                    Top: bestSpace.Top,
                    Width: bestSpace.Width - frame.Width,
                    Height: bestSpace.Height
                })
                return true
            }

            if (frame.Width >= frame.Height) {
                found = FindWidthFit() || FindHeightFit()
            } else {
                found = FindHeightFit() || FindWidthFit()
            }

            if (!found) {
                // Find the "most awkward" space for this frame, even if it wastes space to right and bottom; it might still get filled.
                let bestSpace: Space | undefined = undefined
                for (const space of spaces) {
                    if (space.Width < frame.Width) continue
                    if (space.Height < frame.Height) continue
                    if (bestSpace && Math.min(bestSpace.Width - frame.Width, bestSpace.Height - frame.Height) < Math.min(space.Width - frame.Width, space.Height - frame.Height)) continue
                    bestSpace = space
                }
                if (!bestSpace) {
                    // We can increase efficiency by widening when we were too wide, etc. but this tends to make very narrow "strips".
                    // Ideally we want a square as this is less likely to hit any driver constraints.
                    if (atlasWidth <= atlasHeight) {
                        atlasWidth += 1
                    } else {
                        atlasHeight += 1
                    }
                    PackAtlas(atlasWidth, atlasHeight, packingAttempts + 1)
                    return
                }
                packedFrames.push({
                    Left: bestSpace.Left,
                    Top: bestSpace.Top,
                    Width: frame.Width,
                    Height: frame.Height,
                    Unpacked: frame
                })
                spaces.splice(spaces.indexOf(bestSpace), 1)
                if (bestSpace.Width - frame.Width > bestSpace.Height - frame.Height) {
                    spaces.push({
                        Left: bestSpace.Left + frame.Width,
                        Top: bestSpace.Top,
                        Width: bestSpace.Width - frame.Width,
                        Height: bestSpace.Height
                    })
                    spaces.push({
                        Left: bestSpace.Left,
                        Top: bestSpace.Top + frame.Height,
                        Width: frame.Width,
                        Height: bestSpace.Height - frame.Height
                    })
                } else {
                    spaces.push({
                        Left: bestSpace.Left,
                        Top: bestSpace.Top + frame.Height,
                        Width: bestSpace.Width,
                        Height: bestSpace.Height - frame.Height
                    })
                    spaces.push({
                        Left: bestSpace.Left + frame.Width,
                        Top: bestSpace.Top,
                        Width: bestSpace.Width - frame.Width,
                        Height: frame.Height
                    })
                }
            }
        }

        let totalPixels = 0
        for (const frame of unpackedFrames) totalPixels += frame.Width * frame.Height
        console.info(`Packed into ${atlasWidth}x${atlasHeight} in ${packingAttempts} attempts with ${Math.floor(10000 * totalPixels / (atlasWidth * atlasHeight)) / 100}% efficiency; generating atlas...`)

        const atlas = new pngjs.PNG({
            width: atlasWidth,
            height: atlasHeight
        })

        for (let i = 0; i < atlas.data.length; i++) atlas.data[i] = 0

        // Uncomment this to fill empty space with unique colors; this is useful when debugging optimizations to the above algorithm.
        // let spaceId = 0
        // for (const space of spaces) {
        //     for (let y = 0; y < space.Height; y++)
        //         for (let x = 0; x < space.Width; x++) {
        //             atlas.data[(space.Top + y) * atlasWidth * 4 + (space.Left + x) * 4] = spaceId & 1 ? (spaceId & 2 ? 255 : 170) : (spaceId & 2 ? 85 : 0)
        //             atlas.data[(space.Top + y) * atlasWidth * 4 + (space.Left + x) * 4 + 1] = spaceId & 4 ? (spaceId & 8 ? 255 : 170) : (spaceId & 8 ? 85 : 0)
        //             atlas.data[(space.Top + y) * atlasWidth * 4 + (space.Left + x) * 4 + 2] = spaceId & 16 ? (spaceId & 32 ? 255 : 170) : (spaceId & 32 ? 85 : 0)
        //             atlas.data[(space.Top + y) * atlasWidth * 4 + (space.Left + x) * 4 + 3] = 255
        //         }
        //     spaceId++
        // }

        for (const frame of packedFrames) {
            frame.Unpacked.Png.bitblt(atlas, frame.Unpacked.SourceLeft, frame.Unpacked.SourceTop, frame.Width - 2, frame.Height - 2, frame.Left + 1, frame.Top + 1)

            // This is padding to prevent bleed.
            frame.Unpacked.Png.bitblt(atlas, frame.Unpacked.SourceLeft, frame.Unpacked.SourceTop, 1, frame.Height - 2, frame.Left, frame.Top + 1)
            frame.Unpacked.Png.bitblt(atlas, frame.Unpacked.SourceLeft + frame.Width - 3, frame.Unpacked.SourceTop, 1, frame.Height - 2, frame.Left + frame.Width - 1, frame.Top + 1)
            frame.Unpacked.Png.bitblt(atlas, frame.Unpacked.SourceLeft, frame.Unpacked.SourceTop, frame.Width - 2, 1, frame.Left + 1, frame.Top)
            frame.Unpacked.Png.bitblt(atlas, frame.Unpacked.SourceLeft, frame.Unpacked.SourceTop + frame.Height - 3, frame.Width - 2, 1, frame.Left + 1, frame.Top + frame.Height - 1)

            // And in the corners.
            frame.Unpacked.Png.bitblt(atlas, frame.Unpacked.SourceLeft, frame.Unpacked.SourceTop, 1, 1, frame.Left, frame.Top)
            frame.Unpacked.Png.bitblt(atlas, frame.Unpacked.SourceLeft + frame.Width - 3, frame.Unpacked.SourceTop, 1, 1, frame.Left + frame.Width - 1, frame.Top)
            frame.Unpacked.Png.bitblt(atlas, frame.Unpacked.SourceLeft, frame.Unpacked.SourceTop + frame.Height - 3, 1, 1, frame.Left, frame.Top + frame.Height - 1)
            frame.Unpacked.Png.bitblt(atlas, frame.Unpacked.SourceLeft + frame.Width - 3, frame.Unpacked.SourceTop + frame.Height - 3, 1, 1, frame.Left + frame.Width - 1, frame.Top + frame.Height - 1)
        }

        const writeStream = fs.createWriteStream("Build/Sprites.png")
        atlas.pack().pipe(writeStream)
        writeStream.on("close", () => {
            console.info("Compressing packed sprites...")
            imagemin(["Build/Sprites.png"], "Build", {
                plugins: [pngcrush({
                    reduce: true
                })]
            }).then(() => {
                const packedContent: PackedContent[] = []
                for (const frame of packedFrames)
                    for (const reference of frame.Unpacked.References)
                        packedContent.push({ Path: reference.Filename, GeneratedCode: `new SpriteFrame(${frame.Left + 1}, ${frame.Top + 1}, ${frame.Width - 2}, ${frame.Height - 2}, ${reference.MarginLeft}, ${reference.MarginTop}, ${reference.DurationSeconds})` })
                then(`const ContentSpritesWidth = ${atlasWidth}\nconst ContentSpritesHeight = ${atlasHeight}\n`, packedContent)
            })
        })
    }
})