BasePhysicalObject = require("./BasePhysicalObject")


class TestObject extends BasePhysicalObject{
    constructor() {
        super()
        var geom = new THREE.BoxGeometry()
        var mat = new THREE.MeshBasicMaterial({color: 0x00ff00, wireframe: true})
        this.obj = new THREE.Mesh(geom, mat)
        if (this.constructor.name === TestObject.name) {
            this.declareAssetsLoaded()
        }
    }
    load(viewer){
        super.load(viewer)
        this.container.add(this.obj)
    }
    unload(viewer){
        super.unload(viewer)
        this.container.remove(this.obj)
    }
}

module.exports = TestObject