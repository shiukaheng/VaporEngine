THREE = require('three')
BaseModifier = require("./base_modifier")
class LinearAccelerationModifier extends BaseModifier{
    constructor(direction=new THREE.Vector3(0, 0, 0)) {
        super()
        this.direction = direction
    }
    update(object, dt) {
        super.update(object, dt)
        object.addVelocity(this.direction.clone().multiplyScalar(dt))
    }
}
module.exports = LinearAccelerationModifier