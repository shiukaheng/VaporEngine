BaseModifier = require("./base_modifier")
class VelocityDragModifier extends BaseModifier{
    constructor(coef=0.9) {
        super()
        this.coef=coef
    }
    update(physical_object, dt) {
        physical_object.velocity = physical_object.velocity.clone().multiplyScalar((1-this.coef)**dt)
    }
    load(physical_object) {
        if (!(physical_object instanceof BasePhysicalObject)) {
            throw new TypeError("VelocityDragModifier must only be added to class that extends BasePhysicalObject")
        }
    }
}
module.exports = VelocityDragModifier