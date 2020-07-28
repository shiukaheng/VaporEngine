THREE = require("three")
ModifierArray = require("../arrays/ModifierArray")

class BaseObject {
    constructor() { // All assets are supposed to be loaded during object construction in async, and when its done, this.declareAssetsLoaded must be called
        this.onLoadedFunctionList = []
        this.assetsLoaded = false
        this.container = new THREE.Object3D()
        this.modifiers = new ModifierArray(this)
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
        this.modifiers.update(dt)
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
}

module.exports = BaseObject