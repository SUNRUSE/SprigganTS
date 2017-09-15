
import { ImportedBackgroundFrame } from "./../../Types"
import { Error, ScaleUpToFakeNearestNeighbor, RemoveExtension } from "./../../Misc"

import cpr = require("cpr")
import fs = require("fs")
const pngjs = require("pngjs")

function PrepareBackgroundFramePng(filename: string, durationSeconds: number, trimmedFilename: string, then: (backgroundFrame: ImportedBackgroundFrame) => void) {
    const untrimmedPng = new pngjs.PNG()
    fs.createReadStream(filename).on("error", Error).pipe(untrimmedPng).on("error", Error).on("parsed", () => {
        cpr(filename, trimmedFilename, {}, err => {
            Error(err)
            ScaleUpToFakeNearestNeighbor(trimmedFilename, `${RemoveExtension(trimmedFilename)}Prescaled.png`, 4, () => {
                then({
                    Empty: false,
                    PngFilename: trimmedFilename,
                    WidthPixels: untrimmedPng.width,
                    HeightPixels: untrimmedPng.height,
                    DurationSeconds: durationSeconds
                })
            })
        })
    })
}

export { PrepareBackgroundFramePng }