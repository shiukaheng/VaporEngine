var Viewer = require("./Viewer")
var THREE = require("three")
class EditorViewer extends Viewer {
    constructor(containerElement) {
        super(containerElement, false)
        this.floorMat = new THREE.MeshBasicMaterial({wireframe:true, color:"grey"})
        this.floorGeom = new THREE.PlaneGeometry(200,200,100,100)
        this.floor = new THREE.Mesh(this.floorGeom, this.floorMat)
        this.floor.rotation.x = Math.PI/2
        this.scene.add(this.floor)
        this.UIInitialized = false
    }
    initUI() {
        if (this.UIInitialized) {
            return
        }
    }
    discardUI() {
    }
}
module.exports = EditorViewer