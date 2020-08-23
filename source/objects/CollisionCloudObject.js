var BaseObject = require("./BaseObject")
var PCDLoader = require("../loaders/PCDLoader")
var createTree = require('yaot');
var argsProc = require("../utils/argumentProcessor")
var {Serializable} = require("../Serialization")

class CollisionCloudObject extends Serializable.createConstructor(
    {
        "pcdPath": "",
        "visible": false
    },
    function(scope) {
        scope.assetsLoaded = false,
        scope.inverseTransform = new THREE.Matrix4(),
        scope.searchLocalVec4 = new THREE.Vector4()
        scope.rotationTransform = new THREE.Matrix4()
        scope._workingVector4 = new THREE.Vector4()
        scope._workingVector3 = new THREE.Vector3()
        var loader = new PCDLoader();
        loader.load(
            pcdPath,
            mesh => {
                scope.cloud = mesh
                scope.tree = createTree()
                scope.tree.init(mesh.geometry.attributes.position.array)
                scope.assetsLoaded = true
                scope.declareAssetsLoaded()
            }
        )
    },
    {
        "visible": Serializable.boolHandler()
    },
    function(scope) {

    },
    BaseObject
) {
    load(viewer) {
        super.load(viewer)
        // this.container.add(this.cloud)
        viewer.collisionList.push(this)
    }
    unload(viewer) {
        super.unload(viewer)
        // this.container.remove(this.cloud)
        viewer.collisionList.splice(viewer.collisionList.indexOf(this), 1)
    }
    searchNormals(vec3, r) {
        if (this.viewer) {
            this.inverseTransform.getInverse(this.container.matrixWorld);
            this.searchLocalVec4.set(vec3.x, vec3.y, vec3.z, 1)
            this.searchLocalVec4.applyMatrix4(this.inverseTransform)
            var matches = this.tree.intersectSphere(this.searchLocalVec4.x, this.searchLocalVec4.y, this.searchLocalVec4.z, r)
            // console.log(this.cloud.geometry.attributes)
            var listOfMatches = []
            matches.forEach(x => {
                var arr = this.cloud.geometry.attributes.normal.array.slice(x, x+3)
                this._workingVector4.set(arr[0], arr[1], arr[2], 1)
                this.rotationTransform.extractRotation(this.container.matrixWorld)
                this._workingVector4.applyMatrix4(this.rotationTransform)
                this._workingVector3.set(this._workingVector4.x, this._workingVector4.y, this._workingVector4.z)
                listOfMatches.push(this._workingVector3.clone())
            })
            return listOfMatches
        } else {
            return []
        }
    }
}
CollisionCloudObject.registerConstructor()

module.exports = CollisionCloudObject