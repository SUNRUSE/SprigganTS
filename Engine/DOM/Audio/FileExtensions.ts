type AudioFileExtension = "ogg" | "mp3" | "wav"

function GetAudioFileExtension(): AudioFileExtension | undefined {
    if (!("Audio" in window)) return undefined
    const audio = new Audio()
    const formats: {
        FileExtension: AudioFileExtension
        MimeType: string
    }[] = [{
        FileExtension: "ogg",
        MimeType: "audio/ogg; codecs=\"vorbis\""
    }, {
        FileExtension: "mp3",
        MimeType: "audio/mp3"
    }, {
        FileExtension: "wav",
        MimeType: "audio/wav; codecs=\"1\""
    }]

    for (const format of formats) if (audio.canPlayType(format.MimeType) == "probably") return format.FileExtension
    for (const format of formats) if (audio.canPlayType(format.MimeType) == "maybe") return format.FileExtension

    return undefined
}