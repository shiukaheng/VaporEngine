BaseModifier = require("./base_modifier")
class PlayerModifier extends BaseModifier{
    constructor() {
        super()
    }
    load(physical_object) {

        // Creating control object

        this._quaternion_container = new THREE.Quaternion()
        this.object = physical_object

        this.controlObject = new THREE.Object3D()
        this.controlObject.rotation.order = 'YZX'


        // Pointer lock

        this.pointerlock = false

        this.canvas = physical_object.viewer.renderer.domElement
        console.log(this.canvas)
        var scope = this
        this.canvas.onclick = function() {
            scope.canvas.requestPointerLock()
        }

        var boundLockChangeAlert = this.lockChangeAlert.bind(this)
        this.boundUpdatePosition = this.updatePosition.bind(this)
        
        document.addEventListener('pointerlockchange', boundLockChangeAlert, false)
        document.addEventListener('mozpointerlockchange', boundLockChangeAlert, false)

        // Keybinds
        this.forward = false
        this.backward = false
        this.left = false
        this.right = false
        this.up = false
        this.down = false

        var scope = this

        function keyHandler(keyCode, boolean) {
            switch(keyCode) {
                case 87:
                    scope.forward = boolean
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

    }
    unload(object) {
        this.canvas.onclick = NaN
        document.removeEventListener("mousemove", this.updatePosition, false)
        document.removeEventListener('pointerlockchange', this.lockChangeAlert.bind(this), false)
        document.removeEventListener('mozpointerlockchange', this.lockChangeAlert.bind(this), false)
        this.removeListeners()
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
        this.controlObject.rotation.x += e.movementY*0.01
        this.controlObject.rotation.y -= e.movementX*0.01
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
        if (this.pointerlock) {
            if (this.forward) {
                this.object.addVelocity(this.object.reference.getWorldDirection(new THREE.Vector3()))
            }
        }
    }
}
module.exports = PlayerModifier