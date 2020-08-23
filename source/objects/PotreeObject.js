var argsProc = require("../utils/argumentProcessor")
var {Serializable} = require("../Serialization")
var BasePhysicalObject = require("./BasePhysicalObject")

class PotreeObject extends Serializable.createConstructor(
    {
        "fileName": "",
        "baseUrl": "",
        "pointShape":2
    },
    function(scope) {
    },
    {
        "fileName": Serializable.readOnlyHandler(),
        "baseUrl": Serializable.readOnlyHandler(),
        "pointShape": Serializable.readOnlyHandler()
    },
    function(scope) {
    },
    BasePhysicalObject
) {
    load(viewer) {
        super.load(viewer)
        var promise = this.viewer.potree.loadPointCloud(this.args.fileName, url => `${this.args.baseUrl}${url}`)
        promise.then(
            pco => {
                pco.material.shape = this.args.pointShape
                this.container.add(pco)
                this.pco = pco
            },
            function() {
                console.warn(`Failed to load point cloud ${this.fileName}`)
            }
        )
        this.viewer.potreePointClouds.push(this.pco)
    }
    unload() {
        if (this.pco!==undefined) {
            this.viewer.potreePointClouds.splice(this.viewer.potreePointClouds.indexOf(this.pco), 1)
            this.container.remove(this.pco)
        }
        super.unload()
    }
}
PotreeObject.registerConstructor()

class OldPotreeObject extends BasePhysicalObject {
    constructor(args={}) {
        super(argsProc(
                {"fileName": "",
                "baseUrl":"", 
                "pointShape":2},
                args
             )
        )
        this.fileName = this.args.fileName
        this.baseUrl = this.args.baseUrl
        this.pointShape = this.args.pointShape
        var promise = viewer.potree.loadPointCloud(this.fileName, url => `${this.baseUrl}${url}`)
        promise.then(
            pco => {
                // console.log(pco)
                pco.material.shape = this.pointShape
                this.container.add(pco)
                this.pco = pco
                // console.log("potree load assets")
                this.declareAssetsLoaded()
            },
            function() {
                console.log(`Failed to load point cloud ${this.fileName}`)
            }
        )
    }
    load(viewer) {
        this.viewer = viewer
        // console.log("potree added")
        viewer.potreePointClouds.push(this.pco)
        super.load(viewer)
    }
    unload(viewer) {
        super.unload(viewer)
        if (this.pco) {
            this.viewer.potreePointClouds.splice(this.viewer.potreePointClouds.indexOf(this.pco), 1)
            this.container.remove(this.pco)
        }
    }
    serialize() {
        this.args.fileName = this.fileName
        this.args.baseUrl = this.baseUrl
        this.args.pointShape = this.pointShape
        return super.serialize()
    }
}

// Serializable.registerClass(PotreeObject)

module.exports = PotreeObject