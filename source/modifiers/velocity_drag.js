BaseModifier = require("./base_modifier")
class VelocityDragModifier extends BaseModifier{
    constructor(coef=0.9) {
        super()
        this.coef=coef
    }
    update(physical_object, dt) {
        physical_object.velocity = physical_object.velocity.clone().multiplyScalar((1-this.coef)**dt)
    }
}
module.exports = VelocityDragModifier