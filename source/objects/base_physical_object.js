BaseObject = require("./base_object")

class BasePhysicalObject extends BaseObject{
    constructor(mass=1) {
        super()
        this.mass=mass
    }
    load(viewer){
        this.velocity = new THREE.Vector3(0, 0, 0)
        super.load(viewer)
    }
    addVelocity(vector3) {
        this.velocity.add(vector3)
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