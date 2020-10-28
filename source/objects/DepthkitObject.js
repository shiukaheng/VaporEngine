var argsProc = require("../utils/argumentProcessor")
var {Serializable} = require("../Serialization")
var BasePhysicalObject = require("./BasePhysicalObject")
var Depthkit = require("../depthkit")
var THREE = require("three")

class DepthkitObject extends Serializable.createConstructor(
    {
        "metaUrl": "",
        "videoUrl": "",
        "displayMode": ""
    },
    function(scope) {
    },
    {
        "metaUrl": Serializable.readOnlyHandler(),
        "videoUrl": Serializable.readOnlyHandler(),
        "displayMode": Serializable.readOnlyHandler()
    },
    function(scope) {
        if (scope.constructor.name===DepthkitObject.name) {
            if (!(scope.args.metaUrl===""||scope.args.videoUrl===""||scope.args.displayMode==="")) {
                scope.depthkitObject = new Depthkit(scope.args.displayMode, scope.args.metaUrl, scope.args.videoUrl)
            } else {
                scope.depthkitObject = new THREE.Object3D()
            }
            scope.declareAssetsLoaded()
        }
    },
    BasePhysicalObject
) {
    load(viewer) {
        super.load(viewer)
        this.container.add(this.depthkitObject)        
    }
    unload() {
        this.container.remove(this.depthkitObject)
        super.unload()
    }
}
DepthkitObject.registerConstructor()

module.exports = DepthkitObject