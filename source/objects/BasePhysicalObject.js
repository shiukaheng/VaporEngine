var BaseObject = require("./BaseObject")
var argsProc = require("../utils/argumentProcessor")
var {Serializable} = require("../Serialization")
var vec3ShadowHandler = require("../utils/vec3ShadowHandler")

class BasePhysicalObject extends Serializable.createConstructor(
    // Default arguments
    {
        "mass":1,
        "velocity": {
            "x": 0,
            "y": 0,
            "z": 0
        }
    },
    // Initialization function
    function(scope) {
        scope.velocity = new THREE.Vector3(scope.args.velocity.x, scope.args.velocity.y, scope.args.velocity.z)
        if (scope.constructor === BasePhysicalObject) {
            scope.declareAssetsLoaded()
        }
    },
    // Argument handlers
    {
        "mass": Serializable.numberHandler(),
        "velocity": vec3ShadowHandler(Serializable.encodeTraversal().velocity)
    },
    // Inherits from
    BaseObject
) {
    load(viewer){
        super.load(viewer)
    }
    addVelocity(normal) {
        this.velocity.add(normal)
    }
    reflectVelocity(vector3) {
        this.velocity.reflect(vector3)
    }
    addMomentum(vector3) {
        this.velocity.add(vector3.clone().multiplyScalar(this.mass))
    }
    update(dt) {
        this.container.position.add(this.velocity.clone().multiplyScalar(dt))
        super.update(dt)
    }
    get mass() {
        return this.args.mass
    }
    set mass(value) {
        this.args.mass = value
    }
}
BasePhysicalObject.registerConstructor()

module.exports = BasePhysicalObject