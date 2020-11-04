var BasePhysicalObject = require("./BasePhysicalObject")
var PlayerModifier = require("../modifiers/PlayerModifier")
var VelocityDragModifier = require("../modifiers/VelocityDragModifier")
var argsProc = require("../utils/argumentProcessor")
var THREE = require("three")
var {Serializable} = require("../Serialization")

function peek(x) {
    console.log(x)
    return x
}

//source: https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
function randn_bm() {
    var u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

class PlayerObject extends Serializable.createConstructor(
    {
        "drag": 0.9,
        "acceleration": 7,
        "bounceRadius": 1
    },
    function(scope) {
        scope._bezierFlyToMode = false
        scope._bezierHelper = undefined
        scope._sampledBezierPath = undefined
        scope._lastCam = new THREE.PerspectiveCamera()
        scope._direction = new THREE.Vector3()
        scope.__direction = new THREE.Vector3()
        scope._bezierAnimClock = new THREE.Clock(false)
        scope._demoLookTo = undefined
        
        if (scope.constructor.name === PlayerObject.name) {
            scope.declareAssetsLoaded()
        }
    },
    {
        "drag": Serializable.numberHandler(),
        "acceleration": Serializable.numberHandler(),
        "bounceRadius": Serializable.numberHandler(0)
    },
    function(scope) {
    },
    BasePhysicalObject
) {
    load(viewer) {
        super.load(viewer)
        this.playerModifier = new PlayerModifier({"acceleration":this.args.acceleration, "bounceRadius":this.args.bounceRadius, "serialize":false})
        this.velocityDragModifier = new VelocityDragModifier({"coef":this.args.drag, "serialize":false})
        this.modifiers.add(this.playerModifier)
        this.modifiers.add(this.velocityDragModifier)
    }
    unload(){
        this.modifiers.remove(this.playerModifier)
        this.modifiers.remove(this.velocityDragModifier)
        super.unload()
    }
    update(dt) {
        super.update(dt)
        if (this._bezierHelper) {
            this._bezierHelper.update((pos, vel) => {
                this.position.copy(pos)
                this.velocity.copy(vel)
                if (this._demoLookTo) {
                    this.lookAt(this._demoLookTo)
                } else {
                    if (this.velocity.length()>0) {
                        this.lookAt(this.position.clone().add(this.velocity))
                    }
                }
            })
        }
        this._direction = this.__direction.copy(this.playerModifier.camera.position).addScaledVector(this._lastCam.position, -1).normalize()
        this._lastCam.copy(this.playerModifier.camera) 
    }
    lookAt(pos) {
        this.container.lookAt(pos)
    }
    bezierFlyTo(destCamera=camB, duration=10, segments=500, endVel=1, onEnd=()=>{}) {
        var startPos = this.playerModifier.camera.getWorldPosition(new THREE.Vector3())
        if (this.velocity.length() == 0) {
            var startDir = this.playerModifier.camera.getWorldDirection(new THREE.Vector3())
        } else {
            var startDir = this.velocity.clone().normalize()
        }
        var startVel = this.velocity
        var destPos = destCamera.getWorldPosition(new THREE.Vector3())
        var destDir = destCamera.getWorldDirection(new THREE.Vector3())
        var destScalarVel = endVel
        this._bezierHelper = new BezierPathAnimation(startPos, startDir, startVel, destPos, destDir, destScalarVel, duration, segments, ()=>{
            this._bezierHelper=undefined
            onEnd()
        })
    }
    demoMode(center=new THREE.Vector3(0,0,0), radius=30, radiusVariance=1, donutConstant=10, perPointTime=20, _destCamera=new THREE.PerspectiveCamera()) {
        this.viewer.allowUserControl = false
        if (donutConstant<0) {
            throw "Donut constant must be larger than 0!"
        }
        var pos = new THREE.Vector3(randn_bm(), randn_bm()/(1+donutConstant), randn_bm()).normalize()
        pos.multiplyScalar(radius+randn_bm()*radiusVariance).add(center)
        _destCamera.position.copy(pos)
        _destCamera.lookAt(center)
        this.bezierFlyTo(_destCamera, perPointTime, 500, 0, ()=>{
            this.demoMode(center, radius, radiusVariance, donutConstant, perPointTime, _destCamera)
        })
        this._demoLookTo = center.clone()
    }
    exitDemoMode() {
        this._bezierHelper = undefined
        this._demoLookTo = undefined
        this.allowUserControl = true
    }
    get pan() {
        return -this.playerModifier.controlObject.rotation.y
    }
    set pan(pan) {
        this.playerModifier.controlObject.rotation.y = -pan
        this.playerModifier.updateRotationFromControlObject()
    }
    get tilt() {
        return -this.playerModifier.controlObject.rotation.x
    }
    set tilt(tilt) {
        this.playerModifier.controlObject.rotation.x = -tilt
        this.playerModifier.updateRotationFromControlObject()
    }
    get row() {
        return -this.playerModifier.controlObject.rotation.z
    }
    set row(row) {
        this.playerModifier.controlObject.rotation.z = -row
        this.playerModifier.updateRotationFromControlObject()
    }
    get speed() {
        return this.playerModifier.acceleration
    }
    set speed(speed) {
        this.playerModifier.acceleration = speed
    }
    get drag() {
        return this.velocityDragModifier.coef
    }
    set drag(drag) {
        this.velocityDragModifier.coef = drag
    }
    get isPlayerObject() {
        return true
    }
    set fov(fov) {
        this.playerModifier.camera.fov = fov
        this.playerModifier.camera.updateProjectionMatrix()
    }
}
PlayerObject.registerConstructor()

class OldPlayerObject extends BasePhysicalObject {
    constructor(args={}) {
        super(argsProc({"drag":0.9, "acceleration":7, "bounceRadius":1}, args))
        if (this.constructor.name === PlayerObject.name) {
            this._bezierFlyToMode = false
            this._bezierHelper = undefined
            this._sampledBezierPath = undefined
            this._lastCam = new THREE.PerspectiveCamera()
            this._direction = new THREE.Vector3()
            this.__direction = new THREE.Vector3()
            this._bezierAnimClock = new THREE.Clock(false)
            this._demoLookTo = undefined
            this.playerModifier = new PlayerModifier({"acceleration":this.args.acceleration, "bounceRadius":this.args.bounceRadius, "ignore":true})
            this.velocityDragModifier = new VelocityDragModifier({"coef":this.args.drag, "ignore":true})
            this.declareAssetsLoaded()
        }
    }
    lookAt(pos) {
        this.container.lookAt(pos)
    }
    load(viewer) {
        super.load(viewer)
        this.modifiers.add(this.playerModifier)
        this.modifiers.add(this.velocityDragModifier)
    }
    unload(viewer){
        super.unload(viewer)
        this.modifiers.remove(this.playerModifier)
        this.modifiers.remove(this.velocityDragModifier)
    }
    update(dt) {
        super.update(dt)
        if (this._bezierHelper) {
            this._bezierHelper.update((pos, vel) => {
                this.position.copy(pos)
                this.velocity.copy(vel)
                if (this._demoLookTo) {
                    this.lookAt(this._demoLookTo)
                } else {
                    if (this.velocity.length()>0) {
                        this.lookAt(this.position.clone().add(this.velocity))
                    }
                }
            })
        }
        this._direction = this.__direction.copy(this.playerModifier.camera.position).addScaledVector(this._lastCam.position, -1).normalize()
        this._lastCam.copy(this.playerModifier.camera) 

    }
    get pan() {
         return -this.playerModifier.controlObject.rotation.y
    }
    set pan(pan) {
        this.playerModifier.controlObject.rotation.y = -pan
        this.playerModifier.updateRotationFromControlObject()
    }
    get tilt() {
        return -this.playerModifier.controlObject.rotation.x
    }
    set tilt(tilt) {
        this.playerModifier.controlObject.rotation.x = -tilt
        this.playerModifier.updateRotationFromControlObject()
    }
    get row() {
        return -this.playerModifier.controlObject.rotation.z
    }
    set row(row) {
        this.playerModifier.controlObject.rotation.z = -row
        this.playerModifier.updateRotationFromControlObject()
    }
    get speed() {
        return this.playerModifier.acceleration
    }
    set speed(speed) {
        this.playerModifier.acceleration = speed
    }
    get drag() {
        return this.velocityDragModifier.coef
    }
    set drag(drag) {
        this.velocityDragModifier.coef = drag
    }
    bezierFlyTo(destCamera=camB, duration=10, segments=500, endVel=1, onEnd=()=>{}) {
        var startPos = this.playerModifier.camera.getWorldPosition(new THREE.Vector3())
        if (this.velocity.length() == 0) {
            var startDir = this.playerModifier.camera.getWorldDirection(new THREE.Vector3())
        } else {
            var startDir = this.velocity.clone().normalize()
        }
        var startVel = this.velocity
        var destPos = destCamera.getWorldPosition(new THREE.Vector3())
        var destDir = destCamera.getWorldDirection(new THREE.Vector3())
        var destScalarVel = endVel
        this._bezierHelper = new BezierPathAnimation(startPos, startDir, startVel, destPos, destDir, destScalarVel, duration, segments, ()=>{
            this._bezierHelper=undefined
            onEnd()
        })
    }
    demoMode(center=new THREE.Vector3(0,0,0), radius=30, radiusVariance=1, donutConstant=10, perPointTime=20, _destCamera=new THREE.PerspectiveCamera()) {
        this.viewer.allowUserControl = false
        if (donutConstant<0) {
            throw "Donut constant must be larger than 0!"
        }
        var pos = new THREE.Vector3(randn_bm(), randn_bm()/(1+donutConstant), randn_bm()).normalize()
        pos.multiplyScalar(radius+randn_bm()*radiusVariance).add(center)
        _destCamera.position.copy(pos)
        _destCamera.lookAt(center)
        this.bezierFlyTo(_destCamera, perPointTime, 500, 0, ()=>{
            this.demoMode(center, radius, radiusVariance, donutConstant, perPointTime, _destCamera)
        })
        this._demoLookTo = center.clone()
    }
    exitDemoMode() {
        this._bezierHelper = undefined
        this._demoLookTo = undefined
        this.allowUserControl = true
    }
    serialize() {
        this.args.drag = this.velocityDragModifier.coef
        this.args.acceleration = this.playerModifier.acceleration
        this.args.bounceRadius = this.playerModifier.bounceRadius
        return super.serialize()
    }
}

// Serializable.registerClass(PlayerObject)

class BezierPathAnimation{
    constructor(startPos=new THREE.Vector3(0, 0, 0), startDir=new THREE.Vector3(1, 0, 0), startVel=new THREE.Vector3(1, 0, 0), destPos=new THREE.Vector3(3, 3, 0), destDir=new THREE.Vector3(1, 0, 0), destScalarVel=0, duration=5, segments=100, endCallback, impossibleParamCompensation=true) {
        this.startPos = startPos
        this.destPos = destPos
        this._lerpVector = new THREE.Vector3()
        this.duration = duration
        this.startVel = startVel
        this.startScalarVel = startVel.length()
        this.destScalarVel = destScalarVel
        this.clock = new THREE.Clock()
        this.endCallback = endCallback
        this.velocity = new THREE.Vector3()
        this._lastPos = new THREE.Vector3()

        var a = startPos
        var d = destPos.clone()
        var bc_offset = a.distanceTo(d)/2
        var b
        if (!startVel < 1) {
            b = a.clone().add(startDir.multiplyScalar(bc_offset+(-1/(bc_offset*this.startScalarVel**2+1))))
        } else {
            b = a.clone().add(this._direction.clone().multiplyScalar(bc_offset+(-1/(bc_offset*this.startScalarVel**2+1))))
        }
        var c = d.clone().addScaledVector(destDir, -bc_offset)
        this.bezierPath = new THREE.CubicBezierCurve3(a, b, c ,d)
        this.bezierLength = this.bezierPath.getLength()
        this.sampledBezierPath = this.bezierPath.getSpacedPoints(segments)
        this._w = this.bezierLength/this.duration-this.startScalarVel/2-this.destScalarVel/2
        console.log(this.bezierLength, this.duration, this.startScalarVel, this.destScalarVel, this._w)
        if (this._w < 0) {
            if (impossibleParamCompensation) {
                var original_duration = this.duration
                this.duration = this.bezierLength/(this.startScalarVel/2+this.destScalarVel/2)
                console.log("New duration: "+this.duration)
                this._w = 0
                console.warn("Bezier camera transition duration compensated: "+original_duration+" --> "+this.duration)
            } else {
                throw "Impossible parameters!"
            }
        }
        this._halfTimeDistance = (this.duration/2)**2*(this._w-this.startScalarVel)/this.duration + (this.duration/2)*this.startScalarVel
        this._halfTimeDistanceB = (this.duration/2)*(this.duration*(2*this._w-this.destScalarVel)+(this.duration/2)*(this.destScalarVel-this._w))/this.duration
        // console.log(this)
        this.update = this.update.bind(this)
    }
    update(updateCallback) {
        var delta_time = this.clock.getDelta()
        var time = this.clock.elapsedTime
        if (time>this.duration||time<0) {
            console.log("True duration: "+this.clock.elapsedTime)
            this.endCallback()
        }
        var s
        var u = this.startScalarVel
        var v = this.destScalarVel
        var w = this._w
        var t_total = this.duration
        if (time<=this.duration/2) {
            s = 2*((time**2*(w-u))/t_total+time*u)
        } else {
            s = 2*(this._halfTimeDistance - this._halfTimeDistanceB + time*(t_total*(2*w-v)+time*(v-w))/t_total)
        }
        var t = s/this.bezierLength
        // console.log(t)
        t = Math.max(0, Math.min(1, t))
        var fuzzyIndex = t*(this.sampledBezierPath.length-1)
        var posVec
        if (fuzzyIndex%1 == 0) {
            posVec = this.sampledBezierPath[fuzzyIndex]
        } else {
            var p2 = Math.ceil(fuzzyIndex)
            var p1 = p2-1
            posVec = this._lerpVector.lerpVectors(this.sampledBezierPath[p1], this.sampledBezierPath[p2], fuzzyIndex-p1)
        }
        if (delta_time==0) {
            this.velocity.copy(this.startVel)
        } else {
            this.velocity.subVectors(posVec, this._lastPos).divideScalar(delta_time)
        }
        updateCallback(posVec, this.velocity)
        this._lastPos.copy(posVec)
    }
}

window.BezierPathAnimation = BezierPathAnimation;

module.exports = PlayerObject

// Todo: Properly handle setting fov, and make it a serializable argument