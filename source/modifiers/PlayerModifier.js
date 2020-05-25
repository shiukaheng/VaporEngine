BaseModifier = require("./BaseModifier")
BasePhysicalObject = require("../objects/BasePhysicalObject")

class PlayerModifier extends BaseModifier{
    constructor() {
        super()
        this.speed = 5
        this.bounceRadius = 10
        this._reflectNormal = new THREE.Vector3()
    }
    load(physical_object) {

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

        this.canvas = physical_object.viewer.renderer.domElement
        var scope = this
        this.canvas.onclick = function() {
            scope.canvas.requestPointerLock()
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

        function keyHandler(keyCode, boolean) {
            switch(keyCode) {
                case 87:
                    scope.forward = boolean
                    break
                case 83:
                    scope.backward = boolean
                    break
                case 65:
                    scope.left = boolean
                    break
                case 68:
                    scope.right = boolean
                    break
                case 32:
                    scope.up = boolean
                    break
                case 16:
                    scope.down = boolean
                    break
            }
        }

        function onKeyDown(e) {
            e.preventDefault()
            e.stopPropagation()
            keyHandler(e.keyCode, true)
        }

        function onKeyUp(e) {
            e.preventDefault()
            e.stopPropagation()
            keyHandler(e.keyCode, false)
        }

        document.addEventListener('keydown', onKeyDown, false)
        document.addEventListener('keyup', onKeyUp, false)

        this.removeListeners = function() {
            document.removeEventListener('keydown', onKeyDown, false)
            document.removeEventListener('keyup', onKeyUp, false)
        }

        // Create camera
        this.camera = new THREE.PerspectiveCamera(90)
        this.camera.rotation.y = Math.PI
        this.object.reference.add(this.camera)

        this.setAsActive()
    }
    unload(object) {
        this.canvas.onclick = NaN
        document.removeEventListener("mousemove", this.updatePosition, false)
        document.removeEventListener('pointerlockchange', this.lockChangeAlert.bind(this), false)
        document.removeEventListener('mozpointerlockchange', this.lockChangeAlert.bind(this), false)
        this.removeListeners()
        this.object.reference.remove(this.camera)
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
        this.controlObject.setRotationFromQuaternion(this.object.reference.getWorldQuaternion(this._quaternion_container))
        this.controlObject.rotation.x += e.movementY*this.mouseSensitivity
        this.controlObject.rotation.y -= e.movementX*this.mouseSensitivity
        if (this.controlObject.rotation.x > Math.PI/2) {
            this.controlObject.rotation.x = Math.PI/2
        }
        if (this.controlObject.rotation.x < -Math.PI/2) {
            this.controlObject.rotation.x = -Math.PI/2
        }
        this.object.reference.setRotationFromQuaternion(this.controlObject.getWorldQuaternion(this._quaternion_container))
    }
    update(dt) {
        super.update(dt)
        var front = this.object.reference.getWorldDirection(new THREE.Vector3()).clone().multiplyScalar(this.speed)
        var left = this.horizontal_helper.getWorldDirection(new THREE.Vector3()).clone().multiplyScalar(this.speed)
        if (this.pointerlock) {
            if (this.forward) {
                this.object.addVelocity(front)
            }
            if (this.backward) {
                this.object.addVelocity(front.clone().multiplyScalar(-1))
            }
            if (this.left) {
                this.object.addVelocity(left)
            }
            if (this.right) {
                this.object.addVelocity(left.clone().multiplyScalar(-1))
            }
            if (this.up) {
                this.object.addVelocity(this.up_direction.clone().multiplyScalar(this.speed))
            }
            if (this.down) {
                this.object.addVelocity(this.up_direction.clone().multiplyScalar(-1).multiplyScalar(this.speed))
            }
        }
        this.object.viewer.collisionList.forEach(x => {
            var all_normals = x.searchNormals(this.object.reference.position, this.bounceRadius)
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
        this.object.viewer.rendererCamera = this.camera
    }

}
module.exports = PlayerModifier