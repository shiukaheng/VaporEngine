BaseObject = require("./BaseObject")

var audioLoader = new THREE.AudioLoader()

class AudioSourceObject extends BasePhysicalObject {
    constructor(audioSourceURL="") {
        super()
        this.audioSourceURL = audioSourceURL
        audioLoader.load(this.audioSourceURL, (audioBuffer)=>{
            this.audioBuffer=audioBuffer
            if (this.constructor.name == AudioSourceObject.name) {
                this.declareAssetsLoaded()
            }
        })
    }
    load(viewer) {
        super.load(viewer)
        this.container.add()
    }
}