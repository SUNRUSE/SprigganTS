class DummySoundInstance implements SoundInstance {
    private readonly OnDeletion: () => void
    constructor(onDeletion: () => void) {
        this.OnDeletion = onDeletion
    }
    Pause(): void { }
    ResumeAt(pan: number): void { }
    ResumeMotion(fromPan: number, toPan: number, durationSeconds: number): void { }
    Delete(): void {
        this.OnDeletion()
    }
}

function DummyDriver(): AudioDriver {
    return {
        Load(then: () => void): void {
            then()
        },
        PlaySound(sound: Sound, getPanning: () => number, onDeletion: () => void): SoundInstance {
            return new DummySoundInstance(onDeletion)
        },
        Tick(): boolean { return false },
        FirstUserInteraction(): void { }
    }
}