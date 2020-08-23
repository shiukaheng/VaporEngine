var BaseObject = require("./BaseObject")
var PCDLoader = require("../loaders/PCDLoader")
var createTree = require('yaot');
var argsProc = require("../utils/argumentProcessor")
var Serializable = require("../Serializable")

class CollisionCloudObject extends BaseObject {
    constructor(args={}) {
        var defaultArgs = {
            "pcdPath": ""
        }
        super(argsProc(defaultArgs, args))
        this.assetsLoaded = false

        this.pcdPath = this.args.pcdPath
        this.inverseTransform = new THREE.Matrix4()
        this.searchLocalVec4 = new THREE.Vector4()
        this.rotationTransform = new THREE.Matrix4()
        this._workingVector4 = new THREE.Vector4()
        this._workingVector3 = new THREE.Vector3()

        var loader = new PCDLoader();
        loader.load(
            pcdPath,
            mesh => {
                this.geometry = mesh
                this.tree = createTree()
                this.tree.init(mesh.geometry.attributes.position.array)
                this.assetsLoaded = true
                this.declareAssetsLoaded()
            }
        )
    }
    load(viewer) {
        super.load(viewer)
        // this.container.add(this.geometry)
        viewer.collisionList.push(this)
    }
    unload(viewer) {
        super.unload(viewer)
        // this.container.remove(this.geometry)
        viewer.collisionList.splice(viewer.collisionList.indexOf(this), 1)
    }
    searchNormals(vec3, r) {
        if (this.viewer) {
            this.inverseTransform.getInverse(this.container.matrixWorld);
            this.searchLocalVec4.set(vec3.x, vec3.y, vec3.z, 1)
            this.searchLocalVec4.applyMatrix4(this.inverseTransform)
            var matches = this.tree.intersectSphere(this.searchLocalVec4.x, this.searchLocalVec4.y, this.searchLocalVec4.z, r)
            // console.log(this.geometry.geometry.attributes)
            var listOfMatches = []
            matches.forEach(x => {
                var arr = this.geometry.geometry.attributes.normal.array.slice(x, x+3)
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
    serialize() {
        this.args.pcdPath = this.pcdPath
        return super.serialize()
    }
}
// Serializable.registerClass(CollisionCloudObject)
module.exports = CollisionCloudObject