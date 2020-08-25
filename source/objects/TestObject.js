BasePhysicalObject = require("./BasePhysicalObject")
var {Serializable} = require("../Serialization")

class TestObject extends Serializable.createConstructor(
    {
        "color": "red"
    },
    function(scope) {
    },  
    undefined,
    function(scope) {
        var geom = new THREE.BoxGeometry()
        var mat = new THREE.MeshBasicMaterial({color: scope.args.color, wireframe: true})
        scope.obj = new THREE.Mesh(geom, mat)
        if (scope.constructor===TestObject) {
            scope.declareAssetsLoaded()
        }
    },
    BasePhysicalObject
) {
    load(viewer){
        super.load(viewer)
        this.container.add(this.obj)
    }
    unload(){
        this.container.remove(this.obj)
        super.unload(viewer)
    }
}
TestObject.registerConstructor()

module.exports = TestObject