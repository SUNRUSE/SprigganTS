function WebAudioApiDriver(): AudioDriver | undefined {
    if (!("AudioContext" in window)) return undefined
    const context = new AudioContext()
    let soundsBuffer: AudioBuffer
    class WebAudioApiSoundInstance implements SoundInstance {
        private Source: AudioBufferSourceNode | undefined
        private readonly Panner: StereoPannerNode
        private readonly Gain: GainNode
        private readonly Sound: Sound
        private Progress = 0
        private StartedAt = 0

        private readonly OnDeletion: () => void

        constructor(sound: Sound, onDeletion: () => void) {
            this.Panner = context.createStereoPanner()
            this.Gain = context.createGain()
            this.Panner.connect(this.Gain)
            this.Gain.connect(context.destination)
            this.StartedAt = context.currentTime
            this.Gain.gain.setValueAtTime(sound.Gain, this.StartedAt)
            this.Sound = sound
            this.OnDeletion = onDeletion
        }
        Pause(): void {
            if (!this.Source) return
            this.Progress += context.currentTime - this.StartedAt
            this.Source.disconnect(this.Panner)
            this.Source.onended = () => { }
            this.Source.stop()
            this.Source = undefined
        }
        ResumeAt(pan: number): void {
            this.Panner.pan.setValueAtTime(pan, context.currentTime)
            if (!this.Source) {
                this.Source = context.createBufferSource()
                this.Source.buffer = soundsBuffer
                this.StartedAt = context.currentTime
                this.Source.onended = () => this.Delete()
                this.Source.connect(this.Panner)
                this.Source.start(this.StartedAt, this.Sound.StartSeconds + this.Progress, this.Sound.DurationSeconds - this.Progress)
            }
        }
        ResumeMotion(fromPan: number, toPan: number, durationSeconds: number): void {
            this.ResumeAt(fromPan)
            this.Panner.pan.linearRampToValueAtTime(toPan, context.currentTime + durationSeconds)
        }
        Delete(): void {
            this.OnDeletion()
            if (this.Source) {
                this.Source.stop()
                this.Source.disconnect(this.Panner)
            }
            this.Panner.disconnect(this.Gain)
            this.Gain.disconnect(context.destination)
        }
    }
    return {
        Load(then: () => void): void {
            SetLoadingMessage("Downloading sounds...")
            const request = new XMLHttpRequest()
            request.open("GET", "sounds.wav", true)
            request.responseType = "arraybuffer"
            request.onload = () => {
                if (request.readyState != 4) return
                if (request.status < 200 || request.status >= 300) {
                    SetLoadingMessage("Failed to load sounds, disabling audio...")
                    AudioDriver = DummyDriver()
                    AudioDriver.Load(then)
                } else {
                    SetLoadingMessage("Decoding sounds...")
                    context.decodeAudioData(request.response, buffer => {
                        soundsBuffer = buffer
                        then()
                    }, () => {
                        SetLoadingMessage("Failed to decode sounds, disabling audio...")
                        AudioDriver = DummyDriver()
                        AudioDriver.Load(then)
                    })
                }
            }
            request.send()
        },
        PlaySound(sound: Sound, onDeletion: () => void): SoundInstance {
            return new WebAudioApiSoundInstance(sound, onDeletion)
        }
    }
}