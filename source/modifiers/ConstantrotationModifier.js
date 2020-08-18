BaseModifier = require("./BaseModifier")
THREE = require("three")
argsProc = require("../utils/argumentProcessor")
Serializable = require("../Serializable")

class ConstantRotationModifier extends BaseModifier {
    constructor(args={}) {
        super(argsProc(
            {"rotVector":{
                "x": 0,
                "y": 0,
                "z": 0
            }}
            , args))
        this.rotation = new THREE.Vector3(this.args.rotVector.x, this.args.rotVector.y, this.args.rotVector.z)
    }
    update(object, dt) {
        super.update()
        object.container.rotation.x += this.rotation.x * dt
        object.container.rotation.y += this.rotation.y * dt
        object.container.rotation.z += this.rotation.z * dt
    }
    serialize() {
        this.args.rotVector = {
            "x": this.rotation.x,
            "y": this.rotation.y,
            "z": this.rotation.z
        }
        return super.serialize()
    }
}
Serializable.registerClass(ConstantRotationModifier)
module.exports = ConstantRotationModifier