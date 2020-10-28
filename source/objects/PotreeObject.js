var argsProc = require("../utils/argumentProcessor")
var {Serializable} = require("../Serialization")
var BasePhysicalObject = require("./BasePhysicalObject")

class PotreeObject extends Serializable.createConstructor(
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
        if (scope.constructor.name===PotreeObject.name) {
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
        
    }
    unload() {
        if (this.pco!==undefined) {
            this.viewer.potreePointClouds.splice(this.viewer.potreePointClouds.indexOf(this.pco), 1)
            this.container.remove(this.pco)
        }
        super.unload()
    }
    set scale(scale) {
        super.scale = scale
        if (this.pco) {
            this.pco.material.size = Math.max(Math.abs(this.scale.x), Math.abs(this.scale.y), Math.abs(this.scale.z))
        }
    }
    get scale() {
        return super.scale
    }
}
PotreeObject.registerConstructor()

module.exports = PotreeObject