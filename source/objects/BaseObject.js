THREE = require("three")
ModifierArray = require("../arrays/ModifierArray")

class BaseObject {
    constructor() {
        this.reference = new THREE.Object3D()
        this.modifiers = new ModifierArray(this)
        this.ready = true
    }
    getDistanceFromReference() {
    }
    load(viewer) {
        this.viewer = viewer
        viewer.scene.add(this.reference)
    }
    unload(viewer) {
        this.viewer = undefined
        viewer.scene.remove(this.reference)
    }
    update(dt) {
        this.modifiers.update(dt)
    }
}

module.exports = BaseObject