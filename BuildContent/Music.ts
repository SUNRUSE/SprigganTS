import { ImportedMusic, PackedMusic, MusicPackingHeader } from "./Types"
import { ContentType } from "./ContentType"
import { SetupAudioImports } from "./Audio"

const MusicContentType = new ContentType<ImportedMusic, PackedMusic, MusicPackingHeader>("music", (imported, then) => {
    const output: { [name: string]: PackedMusic } = {}
    let id = 0
    for (const name in imported) output[name] = {
        Id: id++,
        WavFilename: imported[name].WavFilename,
        InterleavedFilename: imported[name].InterleavedFilename,
        Gain: imported[name].Gain
    }
    then({}, output)
})

SetupAudioImports<ImportedMusic>(MusicContentType, (planarFilename, interleavedFilename, wavFilename, gain) => ({
    WavFilename: wavFilename,
    InterleavedFilename: interleavedFilename,
    Gain: gain
}))