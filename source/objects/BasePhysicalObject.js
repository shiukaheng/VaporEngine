BaseObject = require("./BaseObject")
argsProc = require("../utils/argumentProcessor")

class BasePhysicalObject extends BaseObject{
    constructor(args={}) {
        super(argsProc({"mass":1}, args))
        this.mass = this.args.mass
        if (this.constructor.name === BasePhysicalObject.name) {
            this.declareAssetsLoaded()
        }
    }
    load(viewer){
        this.velocity = new THREE.Vector3(0, 0, 0)
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
        return super.serialize()
    }
}

module.exports = BasePhysicalObject