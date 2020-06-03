BaseObject = require("./BaseObject")

var audioLoader = new THREE.AudioLoader()

class AudioSourceObject extends BasePhysicalObject {
    constructor(audioSourceURL="") {
        super()
        this.delayLoadUntilInteraction = true
        this.audioSourceURL = audioSourceURL
        this.randomizeStart = false
        this.loop = true
        this.autoStart = true
        this.refDistance = 1
        this.volume = 1
        audioLoader.load(this.audioSourceURL, (audioBuffer)=>{
            this.audioBuffer=audioBuffer
            this.positionalAudio = new THREE.PositionalAudio(this.viewer.audioListener)
            this.positionalAudio.setBuffer(this.audioBuffer)
            if (this.randomizeStart) {
                this.offset = this.audioBuffer.duration * Math.random()
            }
            this.setLoop(this.loop)
            this.setRefDistance(this.refDistance)
            this.setVolume(this.volume)
            this.container.add(this.positionalAudio)
            if (this.constructor.name == AudioSourceObject.name) {
                this.declareAssetsLoaded()
            }
        })
    }
    load(viewer) {
        super.load(viewer)
        if (this.autoStart) {
            this.viewer.queueFirstInteraction(() => {
                this.positionalAudio.play()
            })
        }
    }
}