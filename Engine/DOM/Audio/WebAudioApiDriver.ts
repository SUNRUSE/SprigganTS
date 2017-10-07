function WebAudioApiDriver(): AudioDriver | undefined {
    if (!("AudioContext" in window) && !("webkitAudioContext" in window)) return undefined
    const fileExtension = GetAudioFileExtension()
    if (!fileExtension) return undefined
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
    let currentMusic: WebAudioApiMusicInstance | undefined = undefined
    let musicPaused = false
    class WebAudioApiMusicInstance {
        private State: {
            readonly Loaded: false
            readonly Request: XMLHttpRequest
        } | {
            readonly Loaded: true
            readonly Buffer: AudioBuffer
            Source: AudioBufferSourceNode | undefined
            readonly Gain: GainNode
        }
        private StartedAt: number
        private Progress = 0
        constructor(music: Music) {
            currentMusic = this
            const request = new XMLHttpRequest()
            request.open("GET", `music/${music.Id}.${fileExtension}`, true)
            request.responseType = "arraybuffer"
            request.onload = () => {
                if (request.readyState != 4) return
                if (request.status >= 200 && request.status < 300) context.decodeAudioData(request.response, buffer => {
                    this.State = {
                        Loaded: true,
                        Buffer: buffer,
                        Source: undefined,
                        Gain: context.createGain()
                    }
                    this.State.Gain.gain.setValueAtTime(music.Gain, context.currentTime)
                    this.State.Gain.connect(context.destination)
                    if (!musicPaused) this.Resume()
                }, () => { })
            }
            request.send()
            this.State = {
                Loaded: false,
                Request: request
            }
        }
        Pause(): void {
            if (!this.State.Loaded) return
            if (!this.State.Source) return
            this.Progress = (this.Progress + context.currentTime - this.StartedAt) % this.State.Buffer.duration
            this.State.Source.disconnect(this.State.Gain)
            this.State.Source.stop()
            this.State.Source = undefined
        }
        Resume(): void {
            if (!this.State.Loaded) return
            if (this.State.Source) return
            this.StartedAt = context.currentTime
            this.State.Source = context.createBufferSource()
            this.State.Source.buffer = this.State.Buffer
            this.State.Source.loop = true
            this.State.Source.connect(this.State.Gain)
            this.State.Source.start(context.currentTime, this.Progress)
        }
        Delete(): void {
            if (this.State.Loaded) {
                if (this.State.Source) {
                    this.State.Source.disconnect(this.State.Gain)
                    this.State.Source.stop()
                }
                this.State.Gain.disconnect(context.destination)
            } else {
                this.State.Request.abort()
            }
            currentMusic = undefined
        }
    }
    return {
        Load(then: () => void): void {
            SetLoadingMessage("Downloading sounds...")
            const request = new XMLHttpRequest()
            request.open("GET", `sounds.${fileExtension}`, true)
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
        },
        FirstUserInteraction(): void {
            const source = context.createBufferSource()
            source.buffer = context.createBuffer(1, 1, 44100)
            source.connect(context.destination)
            source.start()
        },
        SetMusic(music: Music): void {
            if (currentMusic) currentMusic.Delete()
            currentMusic = new WebAudioApiMusicInstance(music)
        },
        StopMusic(): void {
            if (!currentMusic) return
            currentMusic.Delete()
            currentMusic = undefined
        },
        PauseMusic(): void {
            musicPaused = true
            if (currentMusic) currentMusic.Pause()
        },
        ResumeMusic(): void {
            musicPaused = false
            if (currentMusic) currentMusic.Resume()
        }
    }
}