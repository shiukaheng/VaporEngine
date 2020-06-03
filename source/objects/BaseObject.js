THREE = require("three")
ModifierArray = require("../arrays/ModifierArray")

class BaseObject {
    constructor() {
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
    load(viewer) {
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