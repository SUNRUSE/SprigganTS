import { ImportedDialog, PackedDialog, DialogPackingHeader } from "./Types"
import { ContentType } from "./ContentType"
import { SetupAudioImports } from "./Audio"

const DialogContentType = new ContentType<ImportedDialog, PackedDialog, DialogPackingHeader>("dialog", (imported, then) => {
    const output: { [name: string]: PackedDialog } = {}
    let id = 0
    for (const name in imported) output[name] = {
        Id: id++,
        Directory: imported[name].Directory,
        Gain: imported[name].Gain
    }
    then({}, output)
})

SetupAudioImports<ImportedDialog>(DialogContentType, false, true, true, (directory, gain) => ({
    Directory: directory,
    Gain: gain
}))