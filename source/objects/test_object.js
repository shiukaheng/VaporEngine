BasePhysicalObject = require("./base_physical_object")


class TestObject extends BasePhysicalObject{
    constructor() {
        super()
        var geom = new THREE.BoxGeometry()
        var mat = new THREE.MeshBasicMaterial({color: 0x00ff00, wireframe: true})
        this.obj = new THREE.Mesh(geom, mat)
    }
    load(viewer){
        super.load(viewer)
        this.reference.add(this.obj)
    }
    unload(viewer){
        super.unload(viewer)
        this.reference.remove(this.obj)
    }
}

module.exports = TestObject