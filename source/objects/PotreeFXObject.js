var argsProc = require("../utils/argumentProcessor")
var {Serializable} = require("../Serialization")
var BasePhysicalObject = require("./BasePhysicalObject")
var PointCloudWavyMaterial2 = require("./materials/PointCloudWavyMaterial2")

class PotreeFXObject extends Serializable.createConstructor(
    {
        "fileName": "",
        "baseUrl": "",
        "pointShape":2,
        "pointSizeType":2
    },
    function(scope) {
    },
    {
        "fileName": Serializable.readOnlyHandler(),
        "baseUrl": Serializable.readOnlyHandler(),
        "pointShape": Serializable.readOnlyHandler(),
        "pointSizeType": Serializable.readOnlyHandler()
    },
    function(scope) {
        if (scope.constructor.name===PotreeFXObject.name) {
            scope.declareAssetsLoaded()
        }
    },
    BasePhysicalObject
) {
    load(viewer) {
        super.load(viewer)
        var promise = this.viewer.potree.loadPointCloud(this.args.fileName, url => `${this.args.baseUrl}${url}`)
        promise.then(
            pco => {
                pco.material.shape = this.args.pointShape
                pco.material.pointSizeType = this.args.pointSizeType
                this.container.add(pco)
                this.pco = pco
                this.pco.material.size = Math.max(Math.abs(this.scale.x), Math.abs(this.scale.y), Math.abs(this.scale.z))
                this.viewer.potreePointClouds.push(this.pco)
            },
            function(e) {
                console.warn(`Failed to load point cloud ${this.args.fileName}, reason: ${e}`)
            }.bind(this)
        )
        var promise2 = this.viewer.potreeFX.loadPointCloud(this.args.fileName, url => `${this.args.baseUrl}${url}`)
        promise2.then(
            pco => {
                // Hijack default potree material
                pco.material = new PointCloudWavyMaterial2({
                    "treeType":pco.material.treeType,
                    "size":pco.material.size,
                    "minSize":pco.material.minSize,
                    "maxSize":pco.material.maxSize
                })
                pco.material.shape = 0
                pco.material.pointSizeType = 2
                this.container.add(pco)
                // console.log(this.container.children)
                this.fxpco = pco
                this.fxpco.material.size = Math.max(Math.abs(this.scale.x), Math.abs(this.scale.y), Math.abs(this.scale.z))
                this.viewer.potreeFXPointClouds.push(this.fxpco)
            },
            function(e) {
                // Should have already been warned once
            }.bind(this)
        )
        
    }
    unload() {
        if (this.pco!==undefined) {
            this.viewer.potreePointClouds.splice(this.viewer.potreePointClouds.indexOf(this.pco), 1)
            this.container.remove(this.pco)
        }
        if (this.fxpco!==undefined) {
            this.viewer.potreeFXPointClouds.splice(this.viewer.potreeFXPointClouds.indexOf(this.fxpco), 1)
            this.container.remove(this.fxpco)
        }
        super.unload()
    }
    set scale(scale) {
        super.scale = scale
        if (this.pco) {
            this.pco.material.size = Math.max(Math.abs(this.scale.x), Math.abs(this.scale.y), Math.abs(this.scale.z))
        }
        if (this.fxpco) {
            this.fxpco.material.size = Math.max(Math.abs(this.scale.x), Math.abs(this.scale.y), Math.abs(this.scale.z))
        }
    }
    get scale() {
        return super.scale
    }
}
PotreeFXObject.registerConstructor()

module.exports = PotreeFXObject