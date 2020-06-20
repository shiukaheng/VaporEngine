BaseModifier = require("./BaseModifier")
BasePhysicalObject = require("../objects/BasePhysicalObject")

class PlayerModifier extends BaseModifier{
    constructor(speed=5, bounceRadius=10) {
        super()
        this.speed = speed
        this.bounceRadius = bounceRadius
        this._reflectNormal = new THREE.Vector3()
    }
    load(physical_object) {
        this.viewer = physical_object.viewer
        if (!(physical_object instanceof BasePhysicalObject)) {
            throw new TypeError("PlayerModifier must only be added to class that extends BasePhysicalObject")
        }

        // Parameters
        this.mouseSensitivity = 0.001

        // Creating control object

        this._quaternion_container = new THREE.Quaternion()
        this.object = physical_object

        this.controlObject = new THREE.Object3D()
        this.controlObject.rotation.order = 'YZX'


        // Pointer lock

        this.pointerlock = false
        // console.log(physical_object)
        this.canvas = this.viewer.renderer.domElement
        var scope = this
        this.canvas.onclick = function() {
            scope.canvas.requestPointerLock()
            // navigator.xr.requestSession('immersive-ar')
        }

        var boundLockChangeAlert = this.lockChangeAlert.bind(this)
        this.boundUpdatePosition = this.updatePosition.bind(this)
        
        document.addEventListener('pointerlockchange', boundLockChangeAlert, false)
        document.addEventListener('mozpointerlockchange', boundLockChangeAlert, false)

        // Keybinds

        this.horizontal_helper = new THREE.Object3D()
        this.controlObject.add(this.horizontal_helper)
        this.horizontal_helper.rotation.y = Math.PI/2
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
        this.canvas.onclick = undefined
        document.removeEventListener("mousemove", this.updatePosition, false)
        document.removeEventListener('pointerlockchange', this.lockChangeAlert.bind(this), false)
        document.removeEventListener('mozpointerlockchange', this.lockChangeAlert.bind(this), false)
        this.removeListeners()
        this.object.container.remove(this.camera)
    }
    lockChangeAlert() {
        if (document.pointerLockElement === this.canvas ||
            document.mozPointerLockElement === this.canvas) {
          this.pointerlock=true
          document.addEventListener("mousemove", this.boundUpdatePosition, false)
        } else {
          this.pointerlock=false
          document.removeEventListener("mousemove", this.boundUpdatePosition, false)
        }
    }
    updatePosition(e) {
        this.controlObject.setRotationFromQuaternion(this.object.container.getWorldQuaternion(this._quaternion_container))
        this.controlObject.rotation.x += e.movementY*this.mouseSensitivity
        this.controlObject.rotation.y -= e.movementX*this.mouseSensitivity
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
        var front = this.object.container.getWorldDirection(new THREE.Vector3()).clone().multiplyScalar(this.speed)
        var left = this.horizontal_helper.getWorldDirection(new THREE.Vector3()).clone().multiplyScalar(this.speed)
        if (this.pointerlock) {
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
                this.object.addVelocity(this.up_direction.clone().multiplyScalar(this.speed))
            }
            if (this.viewer.getKeyState(16)) {
                this.object.addVelocity(this.up_direction.clone().multiplyScalar(-1).multiplyScalar(this.speed))
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