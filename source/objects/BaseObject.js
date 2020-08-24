var THREE = require("three")
var ModifierArray = require("../arrays/ModifierArray")
var {Serializable} = require("../Serialization")
var vec3sh = require("../utils/vec3ShadowHandler")
var eush = require("../utils/eulerShadowHandler")
var Viewer = require("../viewers/viewer")

var enc = Serializable.encodeTraversal

class BaseObject extends Serializable.createConstructor(
{
    "position": {
        "x": 0,
        "y": 0,
        "z": 0
    },
    "rotation": {
        "x": 0,
        "y": 0,
        "z": 0,
        "eulerOrder": "XYZ"
    },
    "scale": {
        "x": 1,
        "y": 1,
        "z": 1
    },
    "bypassModifiers": false,
    "modifiers": new ModifierArray()
},
function(scope){
    // Initialization code:
    scope.onLoadedFunctionList = []
    scope.assetsLoaded = false
    scope.container = new THREE.Object3D()
    scope.bypassModifiers = false
    if (scope.constructor.name === BaseObject.name) {
        scope.declareAssetsLoaded()
    }
},
{
    "position":vec3sh(enc().position), 
    "rotation":eush(enc().rotation),
    "scale":vec3sh(enc().scale)
}
) {
    load(viewer) {
        if (!(viewer.isViewer)) {
            throw new TypeError("attempt to load invalid class")
        }
        this.viewer = viewer
        viewer.scene.add(this.container)
        this.args.modifiers.load(this)
    }
    unload() {
        this.args.modifiers.unload(this)
        this.onLoadedFunctionList = []
        this.viewer.scene.remove(this.container)
        this.viewer = undefined
    }
    update(dt) {
        if (!this.isLoaded) {
            throw new Error("attempt to update "+this.constructor.name+" before loaded")
        }
        if (!this.args.bypassModifiers) {
            this.args.modifiers.update(dt)
        }
    }
    declareAssetsLoaded() {
        this.assetsLoaded = true
        this.onLoadedFunctionList.forEach(x => {x()})
        this.onLoadedFunctionList = []
    } // Todo: Make it so that there is an option to block user input + load screen while loading, or load async.
    queueOnAssetLoaded(queuedFunction) {
        if (this.assetsLoaded) {
            queuedFunction()
        } else {
            this.onLoadedFunctionList.push(queuedFunction)
        }
    }
    set position(position) {
        this.container.position.copy(position)
    }
    get position() {
        return this.container.position
    }
    set rotation(rotation) {
        this.container.rotation.copy(rotation)
    }
    get rotation() {
        return this.container.rotation
    }
    set scale(scale) {
        this.container.scale.copy(scale)
    }
    get scale() {
        return this.container.scale
    }
    get isLoaded() {
        return (!(this.viewer===undefined))
    }
    get modifiers() {
        return this.args.modifiers
    }

}
BaseObject.registerConstructor()

module.exports = BaseObject