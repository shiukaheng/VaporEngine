var THREE = require('three')
var BaseModifier = require("./BaseModifier")
var Serialization = require("../Serialization")
var vec3ShadowHandler = require("../utils/vec3ShadowHandler")

class LinearAccelerationModifier extends BaseModifier{
    constructor(args={}, initFunc=function(){}, argHandlers={}) {
        super(
        Serialization.Serializable.argsProcessor({
            // Default arguments:
            "accVector":{
                "x": 0,
                "y": 0,
                "z": 0
            }
        }, args), 
        Serialization.Serializable.initFuncProcessor(
            function(scope){
                // Initialization code:
                scope.accVector = new THREE.Vector3()
            }, initFunc),
        Serialization.Serializable.argHandProcessor({
            // Argument handlers:
            "accVector": vec3ShadowHandler(Serialization.Serializable.encodeTraversal().accVector)
        }, argHandlers))
    }
    update(dt) {
        super.update(dt)
        this.object.addVelocity(this.accVector.clone().multiplyScalar(dt))
    }
}
LinearAccelerationModifier.registerConstructor()
module.exports = LinearAccelerationModifier