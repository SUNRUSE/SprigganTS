import { Error, RemoveExtension } from "./Misc"
import { ContentType, ContentTypeImport } from "./ContentType"
const wav = require("node-wav")

import fs = require("fs")
import path = require("path")
const vorbis = require("libvorbis.js")

function PreprocessRawAudio(filename: string, channelData: Float32Array[], sampleRate: number, then: (channelDAta: Float32Array[], gain: number) => void) {
    channelData = channelData.slice()

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
    then(channelData, gain)
}

function WritePlanarAudio(directory: string, channelData: Float32Array[], then: () => void): void {
    const planarFilename = path.join(directory, "Planar.bin")
    console.log(`Writing raw planar audio samples to "${planarFilename}"...`)
    fs.writeFile(planarFilename, Buffer.concat([new Buffer(channelData[0].buffer), new Buffer(channelData[1].buffer)]), err => {
        Error(err)
        then()
    })
}

function WriteInterleavedAudio(directory: string, channelData: Float32Array[], then: () => void): void {
    console.log("Generating interleaved audio...")
    const interleaved = new Int16Array(channelData[0].length * 2)
    for (let i = 0; i < channelData[0].length; i++) {
        interleaved[i * 2] = channelData[0][i] * 32767
        interleaved[i * 2 + 1] = channelData[1][i] * 32767
    }
    const interleavedFilename = path.join(directory, "Interleaved.bin")
    console.log(`Writing raw interleaved audio samples "${interleavedFilename}"`)
    fs.writeFile(interleavedFilename, new Buffer(interleaved.buffer), err => {
        Error(err)
        then()
    })
}

function SetupAudioImports<Imported>(contentType: ContentType<Imported, any, any>, writeRawPlanarOnImport: boolean, writeRawInterleavedOnImport: boolean, encodeOnImport: boolean, convertToContentData: (directory: string, gain: number) => Imported) {
    new ContentTypeImport<Imported>(contentType, "wav", (filename, then) => {
        console.log(`Reading "${filename}"...`)
        fs.readFile(filename, (err, data) => {
            Error(err)
            console.log(`Read "${filename}", decoding...`)
            const decoded: {
                readonly sampleRate: number
                readonly channelData: Float32Array[]
            } = wav.decode(data)
            PreprocessRawAudio(filename, decoded.channelData, decoded.sampleRate, (channelData, gain) => {
                const directory = path.join("Temp", "Content", "Imported", filename)

                if (writeRawPlanarOnImport)
                    WritePlanarAudio(directory, channelData, AfterWritingRawPlanar)
                else
                    AfterWritingRawPlanar()

                function AfterWritingRawPlanar() {
                    if (writeRawInterleavedOnImport)
                        WriteInterleavedAudio(directory, channelData, AfterWritingRawInterleaved)
                    else
                        AfterWritingRawInterleaved()

                    function AfterWritingRawInterleaved() {
                        if (encodeOnImport)
                            EncodeAudioInMemory(directory, channelData, AfterEncoding)
                        else
                            AfterEncoding()

                        function AfterEncoding() {
                            const content: { [name: string]: Imported } = {}
                            content[RemoveExtension(RemoveExtension(filename))] = convertToContentData(directory, gain)
                            then(content)
                        }
                    }
                }
            })
        })
    })
}

const Encoders: { [name: string]: (channelData: Float32Array[], then: (buffer: Buffer) => void) => void } = {
    wav(channelData, then) {
        then(wav.encode(channelData, {
            sampleRate: 44100,
            float: true,
            bitDepth: 32
        }))
    },
    ogg(channelData, then) {
        const encoder = vorbis._encoder_create_vbr(2, 44100, 0.5)
        const chunks: Buffer[] = []
        function FlushVorbis() {
            const dataLength = vorbis._encoder_get_data_len(encoder)
            if (!dataLength) return
            const dataPointer = vorbis._encoder_get_data(encoder)
            const chunk = vorbis.HEAPU8.subarray(dataPointer, dataPointer + dataLength)
            const data = new Uint8Array(chunk)
            const buffer = data.buffer
            vorbis._encoder_clear_data(encoder)
            chunks.push(new Buffer(buffer))
        }
        vorbis._encoder_write_headers(encoder)
        FlushVorbis()
        let readSamples = 0
        while (readSamples < channelData[0].length) {
            const sliceStart = readSamples
            readSamples += 4096 * 10
            readSamples = Math.min(readSamples, channelData[0].length)
            vorbis._encoder_prepare_analysis_buffers(encoder, readSamples - sliceStart)
            const bufferPointer = vorbis._encoder_get_analysis_buffer(encoder, 0)
            vorbis.HEAPF32.set(new Float32Array(channelData[0].subarray(sliceStart, readSamples)), bufferPointer >> 2)
            const bufferPointer2 = vorbis._encoder_get_analysis_buffer(encoder, 1)
            vorbis.HEAPF32.set(new Float32Array(channelData[1].subarray(sliceStart, readSamples)), bufferPointer2 >> 2)
            vorbis._encoder_encode(encoder)
            FlushVorbis()
        }
        vorbis._encoder_finish(encoder)
        FlushVorbis()
        vorbis._encoder_destroy(encoder)
        then(Buffer.concat(chunks))
    }
}

function EncodeAudioInMemory(directory: string, channelData: Float32Array[], then: () => void) {
    console.log(`Encoding "${directory}"...`)
    let remainingEncoders = Object.keys(Encoders).length
    for (const name in Encoders) Encoders[name](channelData, buffer => {
        const filename = path.join(directory, `Encoded.${name}`)
        console.log(`Writing "${filename}"...`)
        fs.writeFile(filename, buffer, err => {
            Error(err)
            console.log(`Written "${filename}"`)
            remainingEncoders--
            if (!remainingEncoders) then()
        })
    })
}

export { SetupAudioImports, WritePlanarAudio, WriteInterleavedAudio, EncodeAudioInMemory }