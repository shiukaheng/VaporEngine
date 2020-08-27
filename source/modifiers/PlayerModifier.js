var { Serializable } = require("../Serialization");
var BaseModifier = require("./BaseModifier")
var BasePhysicalObject = require("../objects/BasePhysicalObject")
var THREE = require("three")

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
    constructor(args={}, initFunc=function(){}, argHandlers={}) {
        super(
        Serializable.argsProcessor({
            // Default arguments:
            "acceleration": 7,
            "bounceRadius": 1
        }, args), 
        Serializable.initFuncProcessor(
            function(scope){
                // Initialization code:
                scope._reflectNormal = new THREE.Vector3()
            }, initFunc),
        Serializable.argHandProcessor({
            // Argument handlers:
            "acceleration": Serializable.predicateHandler((elem)=>{
                return (typeof elem === "number")
            }, "TypeError: acceleration arg must be number"),
            "bounceRadius": Serializable.predicateHandler((elem)=>{
                return (typeof elem === "number")
            }, "TypeError: bounceRadius arg must be number")
        }, argHandlers))
    }
    load(object) { // Only when object and viewer exists. When object exists in isolation, no point in updating modifiers.
        super.load(object)
        this.pointerControlsUpdate = this.pointerControlsUpdate.bind(this)
        // this.updateRotationFromControlObject = this.updateRotationFromControlObject.bind(this)

        if (!(object.isBasePhysicalObject)) {
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
        this.object.viewer.pointerControlSubscription.subscribe(this.pointerControlsUpdate)

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
    unload() {
        this.object.viewer.pointerControlSubscription.unsubscribe(this.boundPointerControlHandler)
        this.object.container.remove(this.camera)
        super.unload()
    }
    // @event_based_modifier_method TODO: Migrate to ES6 with babel
    pointerControlsUpdate(e) {
        if (this.args.enabled&&!this.object.bypassModifiers&&this.object.viewer.allowUserControl) {
            this.controlObject.setRotationFromQuaternion(this.object.container.getWorldQuaternion(this._quaternion_container))
            this.controlObject.rotation.x += e.movementY*this.mouseSensitivity
            this.controlObject.rotation.y -= e.movementX*this.mouseSensitivity
            this.updateRotationFromControlObject()
        }
        // console.log(this.controlObject.rotation) 
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
    update(dt) {
        super.update(dt)
        this.direction_helper.rotation.y = this.controlObject.rotation.y
        var front = this.direction_helper.getWorldDirection(new THREE.Vector3()).clone().multiplyScalar(this.args.acceleration*dt)
        this.direction_helper.rotation.y = this.controlObject.rotation.y + Math.PI/2
        var left = this.direction_helper.getWorldDirection(new THREE.Vector3()).clone().multiplyScalar(this.args.acceleration*dt)
        if (this.object.viewer.hasPointerLock) {
            if (this.object.viewer.getKeyState(87)) {
                this.object.addVelocity(front)
            }
            if (this.object.viewer.getKeyState(83)) {
                this.object.addVelocity(front.clone().multiplyScalar(-1))
            }
            if (this.object.viewer.getKeyState(65)) {
                this.object.addVelocity(left)
            }
            if (this.object.viewer.getKeyState(68)) {
                this.object.addVelocity(left.clone().multiplyScalar(-1))
            }
            if (this.object.viewer.getKeyState(32)) {
                this.object.addVelocity(this.up_direction.clone().multiplyScalar(this.args.acceleration*dt))
            }
            if (this.object.viewer.getKeyState(16)) {
                this.object.addVelocity(this.up_direction.clone().multiplyScalar(-1).multiplyScalar(this.args.acceleration*dt))
            }
        }
        this.object.viewer.collisionList.forEach(x => {
            var all_normals = x.searchNormals(this.object.container.position, this.args.bounceRadius)
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
        this.object.viewer.changeCamera(this.camera)
    }
}
PlayerModifier.registerConstructor()

// Serializable.registerClass(PlayerModifier)
module.exports = PlayerModifier