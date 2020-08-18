BaseObject = require("./BaseObject")
argsProc = require("../utils/argumentProcessor")
Serializable = require("../Serializable")

class BasePhysicalObject extends BaseObject{
    constructor(args={}) {
        super(argsProc({
            "mass":1,
            "velocity": {
                "x": 0,
                "y": 0,
                "z": 0
            }
        }, args))
        this.mass = this.args.mass
        this.velocity = new THREE.Vector3(this.args.velocity.x, this.args.velocity.y, this.args.velocity.z)
        if (this.constructor.name === BasePhysicalObject.name) {
            this.declareAssetsLoaded()
        }
    }
    load(viewer){
        super.load(viewer)
    }
    addVelocity(vector3) {
        this.velocity.add(vector3)
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
    serialize() {
        this.args.mass = this.mass
        this.args.velocity = {
            "x": this.velocity.x,
            "y": this.velocity.y,
            "z": this.velocity.z
        }
        return super.serialize()
    }
}
Serializable.registerClass(BasePhysicalObject)
module.exports = BasePhysicalObject