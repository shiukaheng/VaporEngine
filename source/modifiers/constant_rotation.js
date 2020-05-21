BaseModifier = require("./base_modifier")
THREE = require("three")
class ConstantRotationModifier extends BaseModifier {
    constructor(vector3=new THREE.Vector3(0, 0, 0)) {
        super()
        this.rotation = vector3
    }
    update(object, dt) {
        super.update()
        object.reference.rotation.x += this.rotation.x * dt
        object.reference.rotation.y += this.rotation.y * dt
        object.reference.rotation.z += this.rotation.z * dt
    }
}
module.exports = ConstantRotationModifier