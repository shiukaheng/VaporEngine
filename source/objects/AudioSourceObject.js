BaseObject = require("./BaseObject")

var audioLoader = new THREE.AudioLoader()



class AudioSourceObject extends BasePhysicalObject {
    constructor(audioSourceURL="", param) {
        super()
        this.delayLoadUntilInteraction = true
        this.audioSourceURL = audioSourceURL
        this.randomizeStart = false
        this.loop = false
        this.autoStart = true
        this.refDistance = 1
        this.volume = 1
        this.positional = true

        this.setVolume = this._setVolume

        audioLoader.load(this.audioSourceURL, (audioBuffer)=>{
            this.audioBuffer=audioBuffer
            
            if (this.constructor.name == AudioSourceObject.name) {
                this.declareAssetsLoaded()
            }
        })

        //this.assign(param)
    }

    _setVolume(volume) {
        this.volume = volume
    }

    play() {
        this.audioObj.play()
    }

    pause() {
        this.audioObj.pause()
    }

    load(viewer) {
        super.load(viewer)
        if (this.randomizeStart) {
            this.offset = this.audioBuffer.duration * Math.random()
            this.audioObj.offset = this.offset
        }
        if (this.positional) {
            this.audioObj = new THREE.PositionalAudio(this.viewer.audioListener)
        } else {
            this.audioObj = new THREE.Audio(this.viewer.audioListener)
        }
        this.audioObj.setBuffer(this.audioBuffer)
        
        this.setVolume = this.audioObj.setVolume
        this.container.add(this.audioObj)

        if (this.autoStart) {
            this.viewer.queueForFirstInteraction(() => {
                this.audioObj.play()
            })
        }
    }


    unload(viewer) {
        super.unload(viewer)
        this.setVolume = this._setVolume
        this.container.remove(this.audioObj)
    }

    unload(viewer) {
        super.unload(viewer)
        if (this.pco) {
            this.viewer.potreePointClouds.splice(this.viewer.potreePointClouds.indexOf(this.pco), 1)
            this.container.remove(this.pco)
        }
    }
}

module.exports = AudioSourceObject