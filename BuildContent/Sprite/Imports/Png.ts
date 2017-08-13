import { ImportedSpriteFrame } from "./../../Types"
import { ContentTypeImport } from "./../../ContentType"
import { PrepareSpriteFramePng } from "./Shared"
import { SpriteContentType } from "./../ContentType"
import { RemoveExtension } from "./../../Misc"

import path = require("path")

new ContentTypeImport<ImportedSpriteFrame>(SpriteContentType, "png", (filename, then) => {
    PrepareSpriteFramePng(filename, 0, path.join("Temp", "Content", "Imported", filename, "Sprite.png"), spriteFrame => {
        const frames: { [contentName: string]: ImportedSpriteFrame } = {}
        frames[RemoveExtension(RemoveExtension(filename))] = spriteFrame
        then(frames)
    })
})