BaseModifier = require("./BaseModifier")
argsProc = require("../utils/argumentProcessor")

class VelocityDragModifier extends BaseModifier{
    constructor(args={}) {
        super(argsProc(
            {"coef": 0.9}, args
        ))
        this.coef=this.args.coef
    }
    update(physical_object, dt) {
        physical_object.velocity = physical_object.velocity.clone().multiplyScalar((1-this.coef)**dt)
    }
    load(physical_object) {
        if (!(physical_object instanceof BasePhysicalObject)) {
            throw new TypeError("VelocityDragModifier must only be added to class that extends BasePhysicalObject")
        }
    }
    serialize() {
        this.args.coef = this.coef
        super.serialize()
    }
}
module.exports = VelocityDragModifier