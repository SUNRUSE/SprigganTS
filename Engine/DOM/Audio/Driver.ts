type AudioDriver = {
    Load(then: () => void): void
    PlaySound(sound: Sound, getPanning: () => number, onDeletion: () => void): SoundInstance
    Tick(): boolean
    FirstUserInteraction(): void
    SetMusic(music: Music): void
    StopMusic(): void
    PauseMusic(): void
    ResumeMusic(): void
}

type SoundInstance = {
    Pause(): void
    ResumeAt(pan: number): void
    ResumeMotion(fromPan: number, toPan: number, durationSeconds: number): void
    Delete(): void
}

let AudioDriver = WebAudioApiDriver() || DummyDriver()

class Music {
    readonly Id: number
    readonly Gain: number

    constructor(id: number, gain: number) {
        this.Id = id
        this.Gain = gain
    }
}

namespace Music {
    export function Set(music: Music): void {
        AudioDriver.SetMusic(music)
    }

    export function Stop(): void {
        AudioDriver.StopMusic()
    }
}