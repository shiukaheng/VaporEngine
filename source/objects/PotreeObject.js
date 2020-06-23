

class PotreeObject extends BasePhysicalObject {
    constructor(fileName, baseUrl="", pointShape=0) {
        super()
        this.fileName = fileName
        this.baseUrl = baseUrl
        this.pointShape = pointShape
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
}

module.exports = PotreeObject