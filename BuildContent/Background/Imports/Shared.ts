
import { ImportedBackgroundFrame } from "./../../Types"
import { Error } from "./../../Misc"

import cpr = require("cpr")
import fs = require("fs")
const pngjs = require("pngjs")

function PrepareBackgroundFramePng(filename: string, durationSeconds: number, trimmedFilename: string, then: (backgroundFrame: ImportedBackgroundFrame) => void) {
    const untrimmedPng = new pngjs.PNG()
    fs.createReadStream(filename).on("error", Error).pipe(untrimmedPng).on("error", Error).on("parsed", () => {
        cpr(filename, trimmedFilename, {}, err => {
            Error(err)
            then({
                Empty: false,
                PngFilename: trimmedFilename,
                WidthPixels: untrimmedPng.width,
                HeightPixels: untrimmedPng.height,
                DurationSeconds: durationSeconds
            })
        })
    })
}

export { PrepareBackgroundFramePng }