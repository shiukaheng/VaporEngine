BaseObject = require("./BaseObject")
Serializable = require("../Serializable")
argsProc = require("../utils/argumentProcessor")
var audioLoader = new THREE.AudioLoader()

/**
 * Convenience function to handle setters of AudioSourceObject class properties
 * @param {*} input Input when user sets variable
 * @param {THREE.Audio, THREE.PositionalAudio} audioObject Audio object to check if its exists (to see if the AudioSourceObject has been loaded / initialized)
 * @param {*} storageVar Variable used to store property when the audioObj has not been initialized
 * @param {*} setFunction Function that sets audioObj property
 */
function setWrapper(input, audioObject, storageVar, setFunction) {
    if (audioObject) {
        storageVar = input
        setFunction(input)
    } else {
        storageVar = input
    }
}

class AudioSourceObject extends BasePhysicalObject {
    constructor(args={}) {
        var defaultArgs = {
            "audioSourceURL":"",
            "delayLoadUntilInteraction": true,
            "randomizeStart": false,
            "autoStart": true,
            "positional": true,
            "loop": true,
            "volume": 1,
            "refDistance": 1,
            "rolloffFactor": 1
        }
        super(argsProc(defaultArgs, args))

        // Variables that cant be changed after initialization
        this.delayLoadUntilInteraction = this.args.delayLoadUntilInteraction
        this.audioSourceURL = this.args.audioSourceURL
        this.randomizeStart = this.args.randomizeStart
        this.autoStart = this.args.autoStart
        this.positional = this.args.positional

        // Variables that CAN be changed after initialization
        this._loop = this.args.loop
        this._volume = this.args.volume
        this._refDistance = this.args.refDistance
        this._rolloffFactor = this.args.rolloffFactor

        // Load audio data from URL
        audioLoader.load(this.audioSourceURL, (audioBuffer)=>{
            this.audioBuffer=audioBuffer
            
            if (this.constructor.name == AudioSourceObject.name) {
                this.declareAssetsLoaded()
            }
        })

        //this.assign(param)
    }

    // Getters and setters for variables that can be changed after initialization

    set loop(loop) {
        setWrapper(loop, this.audioObj, this._loop, (x)=>{this.audioObj.setLoop(x)})
    }

    get loop() {
        return this._loop
    }

    set volume(volume) {
        setWrapper(volume, this.audioObj, this._volume, (x)=>{this.audioObj.setVolume(x)})
    }

    get volume() {
        return this._volume
    }

    set rolloffFactor(rolloffFactor) {
        setWrapper(rolloffFactor, this.audioObj, this._rolloffFactor, (x)=>{this.audioObj.setRolloffFactor(x)})
    }

    get rolloffFactor() {
        return this._rolloffFactor
    }

    set refDistance(refDistance) {
        setWrapper(refDistance, this.audioObj, this._refDistance, (x)=>{this.audioObj.setRefDistance(x)})
    }

    get refDistance() {
        return this._refDistance
    }


    play() {
        this.audioObj.play()
    }

    pause() {
        this.audioObj.pause()
    }

    load(viewer) {
        super.load(viewer)

        // Create an offset to start the audio recording with if this.randomizeStart is true
        if (this.randomizeStart) {
            this.offset = this.audioBuffer.duration * Math.random()
            this.audioObj.offset = this.offset
        }

        // Initialize the THREE.Audio / THREE.PositionalAudio object, depending on this.positional
        if (this.positional) {
            this.audioObj = new THREE.PositionalAudio(this.viewer.audioListener)
            this.audioObj.setRefDistance(this._refDistance)
            this.audioObj.setRolloffFactor(this._rolloffFactor)
        } else {
            this.audioObj = new THREE.Audio(this.viewer.audioListener)
        }

        // Set audio type agnostic properties
        this.audioObj.setVolume(this._volume)
        this.audioObj.setLoop(this._loop)
        this.audioObj.setBuffer(this.audioBuffer)
        
        // Add the audio object to the container
        this.container.add(this.audioObj)

        // Queue the audio to be played when the user first interacts with the page if autoplay is set to true
        if (this.autoStart) {
            this.viewer.queueForFirstInteraction(() => {
                this.audioObj.play()
            })
        }
    }

    unload(viewer) {
        super.unload(viewer)
        this.container.remove(this.audioObj)
    }

    serialize() {
        this.args.delayLoadUntilInteraction = this.delayLoadUntilInteraction
        this.args.audioSourceURL = this.audioSourceURL
        this.args.randomizeStart = this.randomizeStart
        this.args.autoStart = this.autoStart
        this.args.positional = this.positional

        // Variables that CAN be changed after initialization
        this.args.loop = this.loop
        this.args.volume = this.volume
        this.args.refDistance = this.refDistance
        this.args.rolloffFactor = this.rolloffFactor
        return super.serialize()
    }
}
Serializable.registerClass(AudioSourceObject)
module.exports = AudioSourceObject