import { ImportedMusic, PackedMusic, MusicPackingHeader } from "./Types"
import { ContentType } from "./ContentType"
import { SetupAudioImports } from "./Audio"

const MusicContentType = new ContentType<ImportedMusic, PackedMusic, MusicPackingHeader>("music", (imported, then) => {
    const output: { [name: string]: PackedMusic } = {}
    let id = 0
    for (const name in imported) output[name] = {
        Id: id++,
        Directory: imported[name].Directory,
        Gain: imported[name].Gain
    }
    then({}, output)
})

SetupAudioImports<ImportedMusic>(MusicContentType, false, true, true, (directory, gain) => ({
    Directory: directory,
    Gain: gain
}))