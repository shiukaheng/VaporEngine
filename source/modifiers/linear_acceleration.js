THREE = require(THREE)
BaseModifier = require("./base_modifier")
class LinearAccelerationModifier extends BaseModifier{
    constructor(direction=new THREE.Vector3(0, 0, 0)) {
        this.direction = direction
    }
    update(object, dt) {
        super(object, dt)

    }
}
module.exports = LinearAccelerationModifier