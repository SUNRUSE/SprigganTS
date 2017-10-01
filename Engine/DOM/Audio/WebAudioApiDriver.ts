function WebAudioApiDriver(): AudioDriver | undefined {
    if (!("AudioContext" in window) && !("webkitAudioContext" in window)) return undefined
    const context: AudioContext = "AudioContext" in window ? new AudioContext : new (window as any).webkitAudioContext()
    let soundsBuffer: AudioBuffer
    const SoundInstancesRequiringTick: WebAudioApiSoundInstance[] = []
    class WebAudioApiSoundInstance implements SoundInstance {
        private Source: AudioBufferSourceNode | undefined
        private readonly Panner: {
            // Chrome, Firefox, Edge.
            Type: "StereoPannerNode"
            Node: StereoPannerNode
        } | {
            // iOS.
            Type: "PannerNode",
            Node: PannerNode
        }
        private readonly Gain: GainNode
        private readonly Sound: Sound
        private Progress = 0
        private StartedAt = 0

        private readonly GetPanning: () => number
        private readonly OnDeletion: () => void

        constructor(sound: Sound, getPanning: () => number, onDeletion: () => void) {
            if ("createStereoPanner" in context) {
                this.Panner = {
                    // Chrome, Firefox, Edge.
                    Type: "StereoPannerNode",
                    Node: context.createStereoPanner()
                }
            } else {
                this.Panner = {
                    // iOS.
                    Type: "PannerNode",
                    Node: context.createPanner()
                }
                this.Panner.Node.rolloffFactor = 0
            }

            this.Gain = context.createGain()
            this.Panner.Node.connect(this.Gain)
            this.Gain.connect(context.destination)
            this.StartedAt = context.currentTime
            this.Gain.gain.setValueAtTime(sound.Gain, this.StartedAt)
            this.Sound = sound
            this.GetPanning = getPanning
            this.OnDeletion = onDeletion
        }
        Pause(): void {
            if (!this.Source) return
            this.Progress += context.currentTime - this.StartedAt
            this.Source.disconnect(this.Panner.Node)
            this.Source.onended = () => { }
            this.Source.stop()
            this.Source = undefined
            Remove(SoundInstancesRequiringTick, this)
        }
        ResumeAt(pan: number): void {
            if (this.Panner.Type == "StereoPannerNode")
                // Chrome, Firefox, Edge.
                this.Panner.Node.pan.setValueAtTime(pan, context.currentTime)
            else {
                // iOS.
                this.Panner.Node.setPosition(pan, 0, -1)
                Remove(SoundInstancesRequiringTick, this)
            }

            if (!this.Source) {
                this.Source = context.createBufferSource()
                this.Source.buffer = soundsBuffer
                this.StartedAt = context.currentTime
                this.Source.onended = () => this.Delete()
                this.Source.connect(this.Panner.Node)
                this.Source.start(this.StartedAt, this.Sound.StartSeconds + this.Progress, this.Sound.DurationSeconds - this.Progress)
            }
        }
        ResumeMotion(fromPan: number, toPan: number, durationSeconds: number): void {
            this.ResumeAt(fromPan)

            if (this.Panner.Type == "StereoPannerNode")
                // Chrome, Firefox, Edge.
                this.Panner.Node.pan.linearRampToValueAtTime(toPan, context.currentTime + durationSeconds)
            else
                // iOS.
                SoundInstancesRequiringTick.push(this)
        }
        Tick(): void {
            if (this.Panner.Type == "PannerNode")
                this.Panner.Node.setPosition(this.GetPanning(), 0, -1)
        }
        Delete(): void {
            this.OnDeletion()
            if (this.Source) {
                this.Source.stop()
                this.Source.disconnect(this.Panner.Node)
            }
            this.Panner.Node.disconnect(this.Gain)
            this.Gain.disconnect(context.destination)
            Remove(SoundInstancesRequiringTick, this)
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
        PlaySound(sound: Sound, getPanning: () => number, onDeletion: () => void): SoundInstance {
            return new WebAudioApiSoundInstance(sound, getPanning, onDeletion)
        },
        Tick(): boolean {
            for (const soundInstance of SoundInstancesRequiringTick) soundInstance.Tick()
            return SoundInstancesRequiringTick.length > 0
        }
    }
}