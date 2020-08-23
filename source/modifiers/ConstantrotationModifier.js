var BaseModifier = require("./BaseModifier")
var THREE = require("three")
var Serialization = require("../Serialization")
var vec3ShadowHandler = require("../utils/vec3ShadowHandler")

class ConstantRotationModifier extends BaseModifier {
    constructor(args={}, initFunc=function(){}, argHandlers={}) {
        super(
        Serialization.Serializable.argsProcessor({
            // Default arguments:
            "rotVector":{
                "x": 0,
                "y": 0,
                "z": 0
            }
        }, args), 
        Serialization.Serializable.initFuncProcessor(
            function(scope){
                // Initialization code:
                scope.rotation = new THREE.Vector3()
            }, initFunc),
        Serialization.Serializable.argHandProcessor({
            // Argument handlers:
            "rotVector":vec3ShadowHandler(Serialization.Serializable.encodeTraversal().rotation)
        }, argHandlers))
    }
    update(dt) {
        super.update(dt)
        this.object.container.rotation.x += this.rotation.x * dt
        this.object.container.rotation.y += this.rotation.y * dt
        this.object.container.rotation.z += this.rotation.z * dt
    }
}
ConstantRotationModifier.registerConstructor()
module.exports = ConstantRotationModifier