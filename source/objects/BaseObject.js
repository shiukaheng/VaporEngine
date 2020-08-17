THREE = require("three")
ModifierArray = require("../arrays/ModifierArray")
Serializable = require("../Serializable")
argsProc = require("../utils/argumentProcessor")

class BaseObject extends Serializable {
    constructor(args={}) { // All assets are supposed to be loaded during object construction in async, and when its done, this.declareAssetsLoaded must be called
        // Process arguments
        var defaultArgs = {
            "position": {
                "x": 0,
                "y": 0,
                "z": 0
            },
            "rotation": {
                "x": 0,
                "y": 0,
                "z": 0
            },
            "scale": {
                "x": 1,
                "y": 1,
                "z": 1
            },
            "bypassModifiers": false
        }
        var newArgs = argsProc(defaultArgs, args)
        super(newArgs)

        this.onLoadedFunctionList = []
        this.assetsLoaded = false
        this.container = new THREE.Object3D()
        this.container.position.x = this.args.position.x
        this.container.position.y = this.args.position.y
        this.container.position.z = this.args.position.z
        this.container.rotation.x = this.args.rotation.x
        this.container.rotation.y = this.args.rotation.y
        this.container.rotation.z = this.args.rotation.z
        this.container.scale.x = this.args.scale.x
        this.container.scale.y = this.args.scale.y
        this.container.scale.z = this.args.scale.z

        this.modifiers = new ModifierArray(this)
        this.bypassModifiers = false
        if (this.constructor.name === BaseObject.name) {
            this.declareAssetsLoaded()
        }
    }
    getDistanceFromReference() {
    }
    load(viewer) { // How to add itself into the viewer
        this.viewer = viewer
        viewer.scene.add(this.container)
    }
    unload(viewer) {
        this.viewer = undefined
        viewer.scene.remove(this.container)
    }
    update(dt) {
        if (!this.bypassModifiers) {
            this.modifiers.update(dt)
        }
    }
    declareAssetsLoaded() {
        this.assetsLoaded = true
        this.onLoadedFunctionList.forEach(x => {x()})
        this.onLoadedFunctionList = []
        if (this.objectArray) {
            this.objectArray.updateAssetLoaded()
        }
        this.modifiers.flushDeferredLoads()
    }
    queueOnAssetLoaded(queuedFunction) {
        if (this.assetsLoaded) {
            queuedFunction()
        } else {
            this.onLoadedFunctionList.push(queuedFunction)
        }
    }
    set position(position) {
        this.container.position = position
    }
    get position() {
        return this.container.position
    }
    set rotation(rotation) {
        this.container.rotation = rotation
    }
    get rotation() {
        return this.container.rotation
    }

    serialize() {
        this.args.position = {
            "x": this.container.position.x,
            "y": this.container.position.y,
            "z": this.container.position.z
        }
        this.args.rotation = {
            "x": this.container.rotation.x,
            "y": this.container.rotation.y,
            "z": this.container.rotation.z
        }
        this.args.scale = {
            "x": this.container.scale.x,
            "y": this.container.scale.y,
            "z": this.container.scale.z
        }
        this.args.bypassModifiers = this.bypassModifiers
        this.args.modifiers = this.modifiers.serialize()
        return super.serialize()
    }
}

module.exports = BaseObject