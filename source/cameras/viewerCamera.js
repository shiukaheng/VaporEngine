THREE = require("three")

class ViewerCamera extends THREE.PerspectiveCamera {
    constructor(fov, aspect, near, far) {
        super(fov, aspect, near, far)
        this.masterCamera = null
    }
    followCamera(camera) {
        this.masterCamera = camera
    }
    unfollowCamera() {
        this.masterCamera = null
    }
    onBeforeRender(renderer, scene, camera, geometry, material, group) {
        console.log("Before")
    }
}

module.exports = ViewerCamera