import { ImportedSpriteFrame } from "./../../Types"
import { ContentTypeImport } from "./../../ContentType"
import { PrepareSpriteFramePng } from "./Shared"
import { SpriteContentType } from "./../ContentType"
import { RemoveExtension, Error } from "./../../Misc"

import fs = require("fs")
import path = require("path")
import child_process = require("child_process")

new ContentTypeImport<ImportedSpriteFrame>(SpriteContentType, "ase", (filename, then) => {
    console.log(`Invoking Aseprite to convert sprite "${filename}"...`)
    const dataPath = path.join("Temp", "Content", "Imported", filename, "data.json")
    child_process.spawn("aseprite", ["--batch", filename, "--data", dataPath, "--list-tags", "--format", "json-array", "--save-as", path.join("Temp", "Content", "Imported", filename, `{frame}.png`)]).on("exit", status => {
        if (status != 0) Error(`Failed to invoke Aseprite to convert sprite "${filename}"`)
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

            let remainingFrames = data.frames.length
            const preparedFrames: ImportedSpriteFrame[] = []
            console.log(`Preparing frames from "${dataPath}"...`)
            for (const frame in data.frames) {
                PrepareSpriteFramePng(path.join("Temp", "Content", "Imported", filename, `${frame}.png`), data.frames[frame].duration / 1000, path.join("Temp", "Content", "Imported", filename, `${frame}.trimmed.png`), preparedFrame => {
                    frame // Workaround for a TypeScript transpilation bug (possibly #17632).
                    preparedFrames[frame] = preparedFrame
                    remainingFrames--
                    if (!remainingFrames) AllFramesPrepared()
                })
            }

            function AllFramesPrepared() {
                console.log(`Converting animations from "${dataPath}"...`)
                const filenameWithoutExtension = RemoveExtension(RemoveExtension(filename))

                const frames: { [contentName: string]: ImportedSpriteFrame } = {}
                for (const animation of data.meta.frameTags) {
                    // path.join might be clever with content named "/" here.
                    // We don't want that as we have fonts, etc.
                    if (animation.from == animation.to) {
                        frames[`${filenameWithoutExtension}/${animation.name}`] = preparedFrames[animation.from]
                    } else {
                        for (let frame = 0; frame <= animation.to - animation.from; frame++) {
                            switch (animation.direction) {
                                case "forward":
                                    frames[`${filenameWithoutExtension}/${animation.name}/${frame}`] = preparedFrames[animation.from + frame]
                                    break

                                case "reverse":
                                    frames[`${filenameWithoutExtension}/${animation.name}/${frame}`] = preparedFrames[animation.to - frame]
                                    break

                                case "pingpong":
                                    frames[`${filenameWithoutExtension}/${animation.name}/${frame}`] = preparedFrames[animation.from + frame]
                                    if (frame > 0 && frame + animation.from < animation.to) {
                                        frames[`${filenameWithoutExtension}/${animation.name}/${(animation.to - animation.from) + frame}`] = preparedFrames[animation.to - frame]
                                    }
                                    break
                            }
                        }
                    }
                }

                then(frames)
            }
        })
    })
})