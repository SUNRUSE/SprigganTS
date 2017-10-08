import { ImportedSound, PackedSound, SoundPackingHeader } from "./Types"
import { Error } from "./Misc"
import { ContentType } from "./ContentType"
import { SetupAudioImports, EncodeAudioInMemory } from "./Audio"

import fs = require("fs")
import path = require("path")

const SoundContentType = new ContentType<ImportedSound, PackedSound, SoundPackingHeader>("sound", (imported, then) => {
    const output: { [contentName: string]: PackedSound } = {}
    const paddingArray: number[] = []
    const spacing = 0.05
    let offset = spacing
    while (paddingArray.length < 44100 * 4 * spacing) paddingArray.push(0)
    const padding = new Buffer(paddingArray)
    let left: Buffer[] = [padding]
    let right: Buffer[] = [padding]
    let remainingSounds = Object.keys(imported).length
    const loadedSounds: { [filename: string]: Buffer } = {}
    if (!remainingSounds) {
        console.warn("There are no sounds to pack, skipping loading...")
        Done()
    } else {
        console.info("Loading all sounds...")
        for (const filename in imported) {
            fs.readFile(path.join(imported[filename].Directory, "Planar.bin"), (err, data) => {
                console.log(`Loaded "${filename}"`)
                Error(err)
                output[filename] = {
                    StartSeconds: offset,
                    DurationSeconds: data.byteLength / (2 * 4 * 44100),
                    Directory: imported[filename].Directory,
                    Gain: imported[filename].Gain
                }
                offset += data.byteLength / (2 * 4 * 44100)
                offset += spacing
                left.push(data.slice(0, data.byteLength / 2))
                left.push(padding)
                right.push(data.slice(data.byteLength / 2))
                right.push(padding)
                remainingSounds--
                loadedSounds[filename] = data
                if (!remainingSounds) Done()
            })
        }
    }

    function Done() {
        console.info("Packing sounds...")
        function ConvertBufferToFloat32Array(buffer: Buffer): Float32Array {
            const floats: number[] = []
            for (let i = 0; i < buffer.byteLength / 4; i++) floats.push(buffer.readFloatLE(i * 4))
            return new Float32Array(floats)
        }

        EncodeAudioInMemory("Temp/Content/Packed/sound", [ConvertBufferToFloat32Array(Buffer.concat(left)), ConvertBufferToFloat32Array(Buffer.concat(right))], () => then({}, output))
    }
}, then => EncodeAudioInMemory("Temp/Content/Packed/sound", [new Float32Array([0]), new Float32Array([0])], () => then({}))
)

SetupAudioImports<ImportedSound>(SoundContentType, true, true, false, (directory, gain) => ({
    Directory: directory,
    Gain: gain
}))