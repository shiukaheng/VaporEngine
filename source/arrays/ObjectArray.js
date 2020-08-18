var Serializable = require("../Serializable")
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
    }
    update(dt){
        this._listOfObjects.forEach(object => {
            if (object.assetsLoaded) {
                object.update(dt)
            }
        })
    }
    serialize() {
        var output = []
        this._listOfObjects.forEach(object => {
            output.push(object.serialize())
        })
        return output
    }
    deserialize(object, clear=true) {
        if (clear) {
            this._listOfObjects.forEach(object => {
                this.remove(object)
            })
        }
        object.forEach(serializedObject => {
            this.add(Serializable.deserialize(serializedObject))
        })
    }
}

module.exports = ObjectArray