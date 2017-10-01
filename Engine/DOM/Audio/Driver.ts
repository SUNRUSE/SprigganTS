type AudioDriver = {
    Load(then: () => void): void
    PlaySound(sound: Sound, getPanning: () => number, onDeletion: () => void): SoundInstance
    Tick(): boolean
    FirstUserInteraction(): void
}

type SoundInstance = {
    Pause(): void
    ResumeAt(pan: number): void
    ResumeMotion(fromPan: number, toPan: number, durationSeconds: number): void
    Delete(): void
}

let AudioDriver = WebAudioApiDriver() || DummyDriver()