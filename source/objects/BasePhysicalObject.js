BaseObject = require("./BaseObject")

class BasePhysicalObject extends BaseObject{
    constructor(mass=1) {
        super()
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
        this.reference.position.add(this.velocity.clone().multiplyScalar(dt))
        super.update(dt)
    }
}

module.exports = BasePhysicalObject