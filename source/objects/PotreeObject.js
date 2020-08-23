var argsProc = require("../utils/argumentProcessor")
var Serializable = require("../Serializable")
var BasePhysicalObject = require("./BasePhysicalObject")

class PotreeObject extends BasePhysicalObject {
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