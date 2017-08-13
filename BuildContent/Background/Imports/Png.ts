import { ImportedBackgroundFrame } from "./../../Types"
import { ContentTypeImport } from "./../../ContentType"
import { PrepareBackgroundFramePng } from "./Shared"
import { BackgroundContentType } from "./../ContentType"
import { RemoveExtension } from "./../../Misc"

import path = require("path")

new ContentTypeImport<ImportedBackgroundFrame>(BackgroundContentType, "png", (filename, then) => {
    PrepareBackgroundFramePng(filename, 0, path.join("Temp", "Content", "Imported", filename, "Background.png"), backgroundFrame => {
        const frames: { [contentName: string]: ImportedBackgroundFrame } = {}
        frames[RemoveExtension(RemoveExtension(filename))] = backgroundFrame
        then(frames)
    })
})