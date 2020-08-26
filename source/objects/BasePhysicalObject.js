var BaseObject = require("./BaseObject")
var {Serializable} = require("../Serialization")
var vec3ShadowHandler = require("../utils/vec3ShadowHandler")
var THREE = require("three")

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
        scope.velocity = new THREE.Vector3()
    },
    // Argument handlers
    {
        "mass": Serializable.numberHandler(),
        "velocity": vec3ShadowHandler(Serializable.encodeTraversal().velocity)
    },
    function(scope) {
        
        if (scope.constructor.name===BasePhysicalObject.name) {
            scope.declareAssetsLoaded()
        }
    },
    // Inherits from
    BaseObject
) {
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
    get isBasePhysicalObject() {
        return true
    }
}
BasePhysicalObject.registerConstructor()

module.exports = BasePhysicalObject