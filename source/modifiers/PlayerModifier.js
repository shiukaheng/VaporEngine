BaseModifier = require("./BaseModifier")
BasePhysicalObject = require("../objects/BasePhysicalObject")

function event_based_modifier_method(target, name, descriptor) {
    const original = descriptor.value;
    if (typeof original === 'function') {
            descriptor.value = function(...args) {
                if (target.enabled||!target.object.bypassModifiers) {
                    const result = original.apply(this, args)
                    return result
                }
            }
    }
}
class PlayerModifier extends BaseModifier{
    constructor(acceleration=7, bounceRadius=1) {
        super()
        this.acceleration = acceleration
        this.bounceRadius = bounceRadius
        this._reflectNormal = new THREE.Vector3()
    }
    load(object) {
        super.load(object)
        this.viewer = object.viewer
        this.pointerControlsUpdate = this.pointerControlsUpdate.bind(this)
        // this.updateRotationFromControlObject = this.updateRotationFromControlObject.bind(this)

        if (!(object instanceof BasePhysicalObject)) {
            throw new TypeError("PlayerModifier must only be added to class that extends BasePhysicalObject")
        }
        // Parameters
        this.mouseSensitivity = 0.001

        // Creating control object
        this._quaternion_container = new THREE.Quaternion()
        this.controlObject = new THREE.Object3D()
        this.controlObject.rotation.order = 'YZX'
        this.direction_helper = new THREE.Object3D()
        this.direction_helper.rotation.order = 'YZX'

        // Pointer lock
        this.boundPointerControlHandler = this.pointerControlsUpdate
        this.viewer.pointerControlSubscription.subscribe(this.pointerControlsUpdate)

        // Keybinds
        this.forward = false
        this.backward = false
        this.left = false
        this.right = false
        this.up = false
        this.down = false
        this.up_direction = new THREE.Vector3(0, 1, 0)
        var scope = this

        // Create camera
        this.camera = new THREE.PerspectiveCamera(90)
        this.camera.rotation.y = Math.PI
        this.object.container.add(this.camera)

        this.setAsActive()
    }
    unload(object) {
        this.viewer = undefined
        this.viewer.pointerControlSubscription.unsubscribe(this.boundPointerControlHandler)
        this.object.container.remove(this.camera)
    }
    // @event_based_modifier_method TODO: Migrate to ES6 with babel
    pointerControlsUpdate(e) {
        if (this.enabled&&!this.object.bypassModifiers) {
            this.controlObject.setRotationFromQuaternion(this.object.container.getWorldQuaternion(this._quaternion_container))
            this.controlObject.rotation.x += e.movementY*this.mouseSensitivity
            this.controlObject.rotation.y -= e.movementX*this.mouseSensitivity
            this.updateRotationFromControlObject()
        }
    }
    updateRotationFromControlObject() {
        if (this.controlObject.rotation.x > Math.PI/2) {
            this.controlObject.rotation.x = Math.PI/2
        }
        if (this.controlObject.rotation.x < -Math.PI/2) {
            this.controlObject.rotation.x = -Math.PI/2
        }
        this.object.container.setRotationFromQuaternion(this.controlObject.getWorldQuaternion(this._quaternion_container))
    }
    update(object, dt) {
        super.update(object, dt)
        this.direction_helper.rotation.y = this.controlObject.rotation.y
        var front = this.direction_helper.getWorldDirection(new THREE.Vector3()).clone().multiplyScalar(this.acceleration*dt)
        this.direction_helper.rotation.y = this.controlObject.rotation.y + Math.PI/2
        var left = this.direction_helper.getWorldDirection(new THREE.Vector3()).clone().multiplyScalar(this.acceleration*dt)
        if (this.viewer.hasPointerLock) {
            if (this.viewer.getKeyState(87)) {
                this.object.addVelocity(front)
            }
            if (this.viewer.getKeyState(83)) {
                this.object.addVelocity(front.clone().multiplyScalar(-1))
            }
            if (this.viewer.getKeyState(65)) {
                this.object.addVelocity(left)
            }
            if (this.viewer.getKeyState(68)) {
                this.object.addVelocity(left.clone().multiplyScalar(-1))
            }
            if (this.viewer.getKeyState(32)) {
                this.object.addVelocity(this.up_direction.clone().multiplyScalar(this.acceleration*dt))
            }
            if (this.viewer.getKeyState(16)) {
                this.object.addVelocity(this.up_direction.clone().multiplyScalar(-1).multiplyScalar(this.acceleration*dt))
            }
        }
        this.object.viewer.collisionList.forEach(x => {
            var all_normals = x.searchNormals(this.object.container.position, this.bounceRadius)
            var filtered_normals = []

            all_normals.forEach(x => {
                if (Math.abs(x.angleTo(this.object.velocity)) > Math.PI/2) {
                    filtered_normals.push(x)
                }
            })
            if (filtered_normals.length > 0) {
                this._reflectNormal.set(0, 0, 0)
                filtered_normals.forEach(x => {
                    this._reflectNormal.add(x.divideScalar(filtered_normals.length))
                })
                this.object.reflectVelocity(this._reflectNormal)
            }
        })
    }
    setAsActive() {
        this.viewer.changeCamera(this.camera)
    }
}
module.exports = PlayerModifier