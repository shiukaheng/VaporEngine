BaseObject = require("./base_object")

class PotreeObject extends BasePhysicalObject {
    constructor(fileName, baseUrl, pointShape=2) {
        super()
        this.fileName = fileName
        this.baseUrl = baseUrl
        this.pointShape = pointShape

    }
    load(viewer) {
        super.load(viewer)
        var promise = viewer.potree.loadPointCloud(this.fileName, url => `${this.baseUrl}${url}`)
        promise.then(
            pco => {
                pco.material.shape = this.pointShape
                this.reference.add(pco)
                this.viewer.potreePointClouds.push(pco)
                this.pco = pco
            },
            function() {
                console.log(`Failed to load point cloud ${this.fileName}`)
            }
        )
    }
    unload(viewer) {
        super.unload(viewer)
        if (this.pco) {
            this.viewer.potreePointClouds.splice(this.viewer.potreePointClouds.indexOf(this.pco), 1)
            this.reference.remove(this.pco)
        }
    }
}

module.exports = PotreeObject