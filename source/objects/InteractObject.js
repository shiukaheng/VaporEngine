BaseObject = require("./BaseObject")
gsap = require("gsap")
TweenLite = gsap.TweenLite

class InteractObject extends BaseObject{
    constructor(keyCode, activateTime=0.5, revealDistance=Infinity) {
        super()
        this.keyCode = keyCode
        this.activateTime = activateTime
        this.revealDistance = revealDistance
        this.keyPressed = false
        this.projectedCoordinates = new THREE.Vector3()
        this._screenPos = new THREE.Vector2()
        this.screenRadiusSquared = Infinity
        this.worldRadiusSquared = Infinity
        this.beingInteracted = false
        this.clock = new THREE.Clock(false)
        this.inScreenRadius = false

        var geom = new THREE.CircleGeometry(1.5, 30)
        var mat = new THREE.MeshBasicMaterial({color: 'white'})
        this.innerCirc = new THREE.Mesh(geom, mat)
        this.innerCirc.rotation.x = Math.PI

        this.reference.add(this.innerCirc)

        var geom2 = new THREE.CircleGeometry(1.5, 30)
        var mat2 = new THREE.MeshBasicMaterial({color: 'white', transparent:true, opacity:0.5})
        this.outerCirc = new THREE.Mesh(geom2, mat2)
        this.outerCirc.rotation.x = Math.PI

        this.reference.add(this.outerCirc)

        this.declareAssetsLoaded()
    }
    update(dt) {
        super.update(dt)
        var referenceWorldCoor = this.reference.getWorldPosition(this.projectedCoordinates)
        var projectedPos = referenceWorldCoor.project(this.viewer.rendererCamera)
        this._screenPos.set(projectedPos.x*this.viewer.containerElement.clientWidth/this.viewer.containerElement.clientHeight, projectedPos.y)
        if (projectedPos.z <= 1) {
            this.screenRadiusSquared = this._screenPos.x**2 + this._screenPos.y**2
        } else {
            this.screenRadiusSquared = NaN
        }

        this.worldRadius = referenceWorldCoor.distanceTo(this.reference.position)

        var newKeyPressed = this.viewer.getKeyState(this.keyCode)

        // console.log(this.viewer.nearestInteractObject)
        if (this.screenRadiusSquared <= MIN_SCREEN_POS_DISTANCE_SQUARED && this.viewer.nearestInteractObject === this) {
            if (! newKeyPressed == this.keyPressed) {
                if (newKeyPressed) {
                    TweenLite.to(this.outerCirc.scale, 0.1, {x: 1.5, y: 1.5, z: 1.5})
                } else {
                    TweenLite.to(this.outerCirc.scale, 0.1, {x: 1, y: 1, z: 1})
                }
                }
            } else {
                TweenLite.to(this.outerCirc.scale, 0.1, {x: 1, y: 1, z: 1})
            }
        this.keyPressed = newKeyPressed
        this.reference.setRotationFromQuaternion(this.viewer.rendererCamera.parent.quaternion)
    }
    activate() {
        console.log("activated")
    }
    load(viewer) {
        super.load(viewer)
        this.viewer.interactObjects.push(this)
    }
    unload(viewer) {
        super.unload(viewer)
        viewer.remove(this)
        this.viewer.interactObjects.splice(this.viewer.interactObjects.indexOf(this), 1)
    }
}

module.exports = InteractObject