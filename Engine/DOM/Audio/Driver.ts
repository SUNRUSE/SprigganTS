type AudioDriver = {
    Load(then: () => void): void
    PlaySound(sound: Sound, onDeletion: () => void): SoundInstance
}

type SoundInstance = {
    Pause(): void
    ResumeAt(pan: number): void
    ResumeMotion(fromPan: number, toPan: number, durationSeconds: number): void
    Delete(): void
}

let AudioDriver = WebAudioApiDriver() || DummyDriver()