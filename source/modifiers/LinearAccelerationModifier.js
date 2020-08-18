THREE = require('three')
BaseModifier = require("./BaseModifier")
argsProc = require("../utils/argumentProcessor")
Serializable = require("../Serializable")

class LinearAccelerationModifier extends BaseModifier{
    constructor(args={}) {
        super(argsProc(
            {
                "AccVector":{
                    "x": 0,
                    "y": 0,
                    "z": 0
                }
            }, args
        ))
        this.direction = new THREE.Vector3(this.args.AccVector.x, this.args.AccVector.y, this.args.AccVector.z)
    }
    update(object, dt) {
        super.update(object, dt)
        object.addVelocity(this.direction.clone().multiplyScalar(dt))
    }
    serialize() {
        this.args.AccVector = {
            "x": this.direction.x,
            "y": this.direction.y,
            "z": this.direction.z
        }
        return super.serialize()
    }
}
Serializable.registerClass(LinearAccelerationModifier)
module.exports = LinearAccelerationModifier