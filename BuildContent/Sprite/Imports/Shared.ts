import { Error } from "./../../Misc"
import { ImportedSpriteFrame } from "./../../Types"

import fs = require("fs")
const pngjs = require("pngjs")

function PrepareSpriteFramePng(filename: string, durationSeconds: number, trimmedFilename: string, then: (spriteFrame: ImportedSpriteFrame) => void) {
    const untrimmedPng = new pngjs.PNG()
    fs.createReadStream(filename).on("error", Error).pipe(untrimmedPng).on("error", Error).on("parsed", () => {
        let trimLeft = 0
        while (trimLeft < untrimmedPng.width) {
            let foundPixel = false
            for (let y = 0; y < untrimmedPng.height; y++) {
                if (untrimmedPng.data[y * untrimmedPng.width * 4 + trimLeft * 4 + 3]) {
                    foundPixel = true
                    break
                }
            }
            if (foundPixel) break
            trimLeft++
        }

        if (trimLeft == untrimmedPng.width) {
            then({
                Empty: true,
                DurationSeconds: durationSeconds
            })
            return
        }

        let trimRight = 0
        while (true) {
            let foundPixel = false
            for (let y = 0; y < untrimmedPng.height; y++) {
                if (untrimmedPng.data[y * untrimmedPng.width * 4 + (untrimmedPng.width - 1 - trimRight) * 4 + 3]) {
                    foundPixel = true
                    break
                }
            }
            if (foundPixel) break
            trimRight++
        }

        let trimTop = 0
        while (true) {
            let foundPixel = false
            for (let x = 0; x < untrimmedPng.width; x++) {
                if (untrimmedPng.data[trimTop * untrimmedPng.width * 4 + x * 4 + 3]) {
                    foundPixel = true
                    break
                }
            }
            if (foundPixel) break
            trimTop++
        }

        let trimBottom = 0
        while (true) {
            let foundPixel = false
            for (let x = 0; x < untrimmedPng.width; x++) {
                if (untrimmedPng.data[(untrimmedPng.height - 1 - trimBottom) * untrimmedPng.width * 4 + x * 4 + 3]) {
                    foundPixel = true
                    break
                }
            }
            if (foundPixel) break
            trimBottom++
        }

        const trimmedWidth = untrimmedPng.width - trimLeft - trimRight
        const trimmedHeight = untrimmedPng.height - trimTop - trimBottom

        const trimmedPng = new pngjs.PNG({
            width: trimmedWidth + 2,
            height: trimmedHeight + 2
        })

        untrimmedPng.bitblt(trimmedPng, trimLeft, trimTop, trimmedWidth, trimmedHeight, 1, 1)

        // Edge padding.
        untrimmedPng.bitblt(trimmedPng, trimLeft, trimTop, trimmedWidth, 1, 1, 0)
        untrimmedPng.bitblt(trimmedPng, trimLeft, trimTop + trimmedHeight - 1, trimmedWidth, 1, 1, trimmedHeight + 1)
        untrimmedPng.bitblt(trimmedPng, trimLeft, trimTop, 1, trimmedHeight, 0, 1)
        untrimmedPng.bitblt(trimmedPng, trimLeft + trimmedWidth - 1, trimTop, 1, trimmedHeight, trimmedWidth + 1, 1)

        // Corner padding.
        untrimmedPng.bitblt(trimmedPng, trimLeft, trimTop, 1, 1, 0, 0)
        untrimmedPng.bitblt(trimmedPng, trimLeft + trimmedWidth - 1, trimTop, 1, 1, trimmedWidth + 1, 0)
        untrimmedPng.bitblt(trimmedPng, trimLeft, trimTop + trimmedHeight - 1, 1, 1, 0, trimmedHeight + 1)
        untrimmedPng.bitblt(trimmedPng, trimLeft + trimmedWidth - 1, trimTop + trimmedHeight - 1, 1, 1, trimmedWidth + 1, trimmedHeight + 1)

        const writeStream = fs.createWriteStream(trimmedFilename)
        trimmedPng.pack().pipe(writeStream)
        writeStream.on("error", Error).on("close", () => {
            then({
                Empty: false,
                PngFilename: trimmedFilename,
                OffsetLeftPixels: trimLeft - untrimmedPng.width / 2,
                OffsetTopPixels: trimTop - untrimmedPng.height / 2,
                DurationSeconds: durationSeconds
            })
        })
    })
}

export { PrepareSpriteFramePng }