var Viewer = require("./Viewer")
var THREE = require("three")
class EditorViewer extends Viewer {
    constructor(...args) {
        super(...args)
        this.floorMat = new THREE.MeshBasicMaterial({wireframe:true, color:"grey"})
        this.floorGeom = new THREE.PlaneGeometry(200,200,100,100)
        this.floor = new THREE.Mesh(this.floorGeom, this.floorMat)
        this.floor.rotation.x = Math.PI/2
        this.scene.add(this.floor)
    }
    update(dt, playerOnly=false){
        this._args.objects.forEach(object => {
            if (object.assetsLoaded) {
                if (playerOnly===true) {
                    if (object.isPlayerObject) {
                        object.update(dt)
                    }
                } else {
                    object.update(dt)
                }
                
            }
        })
    }
}
module.exports = EditorViewer