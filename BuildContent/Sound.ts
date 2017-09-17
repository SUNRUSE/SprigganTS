import { ImportedSound, PackedSound, SoundPackingHeader } from "./Types"
import { Error } from "./Misc"
import { ContentType } from "./ContentType"
import { SetupAudioImports } from "./Audio"

import fs = require("fs")
const wav = require("node-wav")

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
            fs.readFile(imported[filename].PlanarFilename, (err, data) => {
                console.log(`Loaded "${filename}"`)
                Error(err)
                output[filename] = {
                    PlanarFilename: imported[filename].PlanarFilename,
                    InterleavedFilename: imported[filename].InterleavedFilename,
                    StartSeconds: offset,
                    DurationSeconds: data.byteLength / (2 * 4 * 44100),
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
        console.info("Encoding sounds to WAV...")
        function ConvertBufferToFloat32Array(buffer: Buffer): Float32Array {
            const floats: number[] = []
            for (let i = 0; i < buffer.byteLength / 4; i++) floats.push(buffer.readFloatLE(i * 4))
            return new Float32Array(floats)
        }
        const encodedWav = wav.encode([ConvertBufferToFloat32Array(Buffer.concat(left)), ConvertBufferToFloat32Array(Buffer.concat(right))], {
            sampleRate: 44100,
            float: true,
            bitDepth: 32
        })
        console.info("Writing packed sounds as WAV...")
        fs.writeFile("Temp/Content/Packed/sound/Sounds.wav", encodedWav, err => {
            Error(err)
            then({}, output)
        })
    }
})

SetupAudioImports<ImportedSound>(SoundContentType, (planarFilename, interleavedFilename, wavFilename, gain) => ({
    PlanarFilename: planarFilename,
    InterleavedFilename: interleavedFilename,
    Gain: gain
}))