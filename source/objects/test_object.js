BasePhysicalObject = require("./base_physical_object")

class TestObject extends BasePhysicalObject{
    constructor() {
        super()
        var geom = new THREE.BoxGeometry()
        var mat = new THREE.MeshBasicMaterial({color: 0x00ff00, wireframe: true})
        this.obj = new THREE.Mesh(geom, mat)
        this.reference.add(this.obj)
    }
}

module.exports = TestObject