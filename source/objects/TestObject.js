BasePhysicalObject = require("./BasePhysicalObject")
var Serializable = require("../Serializable")

class TestObject extends BasePhysicalObject{
    constructor() {
        super()
        var geom = new THREE.BoxGeometry()
        var mat = new THREE.MeshBasicMaterial({color: 0x00ff00, wireframe: true})
        this.obj = new THREE.Mesh(geom, mat)
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

Serializable.registerClass(TestObject)

module.exports = TestObject