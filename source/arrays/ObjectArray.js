class ObjectArray {
    constructor(viewer, listOfObjects=[]){
        this.viewer = viewer
        this._listOfObjects=listOfObjects
        this._listOfObjects.forEach(x => this.add(x))
        this.allAssetsLoadedCallback = function() {}
    }
    add(object){
        object.objectArray = this
        object.queueOnAssetLoaded(() => {
            object.load(this.viewer)
        })
        this._listOfObjects.push(object)
        this.updateAssetLoaded
    }
    remove(object){
        object.unload(this.viewer)
        object.objectArray = undefined
        this._listOfObjects.splice(this._listOfObjects.indexOf(object), 1)
    }
    waitUntilAllAssetsLoaded(callback){
        var scope = this
        this.allAssetsLoadedCallback = function() {
            callback()
            scope.allAssetsLoadedCallback = function() {}
        }
        this.updateAssetLoaded()
    }
    updateAssetLoaded() {
        var loadedList = []
        this._listOfObjects.forEach(object => {
            loadedList.push(object.assetsLoaded)
        })
        if (! loadedList.includes(false)) {
            this.allAssetsLoadedCallback()
        }
        // console.log(this._listOfObjects)
        // console.log(loadedList)
    }
    update(dt){
        this._listOfObjects.forEach(object => {
            if (object.assetsLoaded) {
                object.update(dt)
            }
        })
    }
}

module.exports = ObjectArray