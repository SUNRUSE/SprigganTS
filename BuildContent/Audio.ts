import { Error, RemoveExtension } from "./Misc"
import { ContentType, ContentTypeImport } from "./ContentType"
const wav = require("node-wav")

import fs = require("fs")
import path = require("path")

function PreprocessRawAudio(filename: string, channelData: Float32Array[], sampleRate: number, then: (planarFilename: string, interleavedFilename: string, wavFilename: string, gain: number) => void) {
    if (sampleRate != 44100) Error(`File "${filename}" uses a sample rate of ${sampleRate}; 44100 was expected`)
    if (channelData.length < 1) Error(`File "${filename}" contains no audio channels`)
    if (channelData.length > 2) Error(`File "${filename}" contains more than two audio channels`)
    if (channelData.length == 1) {
        console.warn(`Expanding "${filename}" from mono to stereo...`)
        channelData.push(channelData[0].slice())
    }

    console.log("Checking gain...")
    let gain = 0.0
    for (const channel of channelData) for (let i = 0; i < channel.length; i++) gain = Math.max(gain, Math.abs(channel[i]))
    if (gain) {
        if (gain < 1) {
            console.log(`Maximum gain ${gain}, boosting...`)
            for (const channel of channelData) for (let i = 0; i < channel.length; i++) channel[i] /= gain
        } else console.log("This file already uses maximum gain")
    } else {
        console.warn("This file is silent")
        gain = 1
    }

    const silenceThreshold = 0.02

    console.log("Checking to see if leading silence can be trimmed...")
    let leadingLeft = 0
    while (leadingLeft < channelData[0].length && Math.abs(channelData[0][leadingLeft]) < silenceThreshold) leadingLeft++
    let leadingRight = 0
    while (leadingRight < channelData[1].length && Math.abs(channelData[1][leadingRight]) < silenceThreshold) leadingRight++
    const leading = Math.min(leadingLeft, leadingRight)
    if (leading) {
        console.log(`Trimming ${leading} samples (left ${leadingLeft}, right ${leadingRight})...`)
        channelData[0] = new Float32Array(channelData[0].slice(leading))
        channelData[1] = new Float32Array(channelData[1].slice(leading))
    } else console.log(`There are no leading samples which can be trimmed (left ${leadingLeft}, right ${leadingRight})`)

    console.log("Checking to see if trailing silence can be trimmed...")
    let trailingLeft = 0
    while (trailingLeft < channelData[0].length && Math.abs(channelData[0][channelData[0].length - 1 - trailingLeft]) < silenceThreshold) trailingLeft++
    let trailingRight = 0
    while (trailingRight < channelData[1].length && Math.abs(channelData[1][channelData[1].length - 1 - trailingRight]) < silenceThreshold) trailingRight++
    const trailing = Math.min(trailingLeft, trailingRight)
    if (trailing) {
        console.log(`Trimming ${trailing} samples (left ${trailingLeft}, right ${trailingRight})...`)
        channelData[0] = new Float32Array(channelData[0].slice(0, -trailing))
        channelData[1] = new Float32Array(channelData[1].slice(0, -trailing))
    } else console.log(`There are no trailing samples which can be trimmed (left ${trailingLeft}, right ${trailingRight})`)

    const planarFilename = path.join("Temp", "Content", "Imported", filename, "Planar.bin")
    console.log(`Writing raw audio samples from "${filename}" to "${planarFilename}"...`)
    fs.writeFile(planarFilename, Buffer.concat([new Buffer(channelData[0].buffer), new Buffer(channelData[1].buffer)]), err => {
        Error(err)
        console.log(`Raw audio samples from "${filename}" written to "${planarFilename}" successfully`)
        console.log("Generating interleaved audio...")
        const interleaved = new Int16Array(channelData[0].length * 2)
        for (let i = 0; i < channelData[0].length; i++) {
            interleaved[i * 2] = channelData[0][i] * 32767
            interleaved[i * 2 + 1] = channelData[1][i] * 32767
        }
        const interleavedFilename = path.join("Temp", "Content", "Imported", filename, "Interleaved.bin")
        console.log(`Writing interleaved audio samples from "${filename}" to "${interleavedFilename}"...`)
        fs.writeFile(interleavedFilename, new Buffer(interleaved.buffer), err => {
            Error(err)
            const wavFilename = path.join("Temp", "Content", "Imported", filename, "Encoded.wav")
            console.log("Encoding .wav...")
            const encodedWav = wav.encode(channelData, {
                sampleRate: 44100,
                float: true,
                bitDepth: 32
            })
            console.log(`Writing .wav encoded audio samples from "${filename}" to "${wavFilename}"...`)
            fs.writeFile(wavFilename, encodedWav, err => {
                Error(err)
                then(planarFilename, interleavedFilename, wavFilename, gain)
            })
        })
    })
}

function SetupAudioImports<Imported>(contentType: ContentType<Imported, any, any>, convertToContentData: (planarFilename: string, interleavedFilename: string, wavFilename: string, gain: number) => Imported) {
    new ContentTypeImport<Imported>(contentType, "wav", (filename, then) => {
        console.log(`Reading "${filename}"...`)
        fs.readFile(filename, (err, data) => {
            Error(err)
            console.log(`Read "${filename}", decoding...`)
            const decoded: {
                readonly sampleRate: number
                readonly channelData: Float32Array[]
            } = wav.decode(data)
            PreprocessRawAudio(filename, decoded.channelData, decoded.sampleRate, (planarFilename, interleavedFilename, wavFilename, gain) => {
                const content: { [name: string]: Imported } = {}
                content[RemoveExtension(RemoveExtension(filename))] = convertToContentData(planarFilename, interleavedFilename, wavFilename, gain)
                then(content)
            })
        })
    })
}

export { SetupAudioImports }