var {Serializable} = require("../Serialization")
var PlayerObject = require("../Objects/PlayerObject")
class ObjectArray extends Serializable.createConstructor(
    {
        "objects": []
    },
    function(scope) {
        scope.onAllAssetsLoadedQueue = new Set()
    },
    {
        "objects": Serializable.readOnlyHandler(new Error("objects argument needs to be modified with object interface"))
    },
    function(scope) {
        scope.uuidDict = {}
        scope.args.objects.forEach(object => {
            scope.uuidDict[object.uuid] = object
        })
    },
    Serializable    
) {
    update(dt, playerOnly=false){
        this._args.objects.forEach(object => {
            if (object.assetsLoaded) {
                if (playerOnly===true) {
                    if (object.isPlayerObject) {
                        object.update(dt)
                    }
                } else {
                    object.update(dt)
                }
                
            }
        })
    }
    _queueLoadObject(object) {
        object.objectArray = this
        object.queueOnAssetLoaded(()=>{
            object.load(this.viewer)
            this.updateAssetsLoaded()
        })        
    } // what happens to object.objectArray if unloaded before assets are loaded?
    _unloadObject(object) {
        object.objectArray = undefined
        object.unload()
    }
    load(viewer) {
        // unload all objects and reload ??
        this.viewer = viewer
        this.args.objects.forEach(object => {
            this._queueLoadObject(object)
        })
    }
    unload() {
        this.args.objects.forEach(object => {
            this._unloadObject(object)
        })
    }
    add(object) {
        this._args.objects.push(object)
        this.uuidDict[object.uuid] = object
        if (this.isLoaded) { // If ObjectArray is already loaded, will need to load this object on an individual basis
            this._queueLoadObject(object)
        }
    }
    remove(object) {
        this.uuidDict[object.uuid] = undefined
        this._args.objects.splice(this._args.objects.indexOf(object), 1)
        if (this.isLoaded) {
            this._unloadObject(object)
        }
    }
    queueAllAssetsLoaded(callback=function(){}) {
        this.onAllAssetsLoadedQueue.add(
            {
                "objectsToCheck": [...this.args.objects],
                "callback": callback
            }
        )
        this.updateAssetsLoaded()
    }
    updateAssetsLoaded() {
        this.onAllAssetsLoadedQueue.forEach(check => {
            var checkList = []
            check.objectsToCheck.forEach((toCheck)=>{
                checkList.push(toCheck.assetsLoaded===true)
            })
            if (!(checkList.includes(false))) {
                check.callback()
                this.onAllAssetsLoadedQueue.delete(check)
            }
        })
    }
    lookupUUID(uuid) {
        var returnObj = this.uuidDict[uuid]
        if (returnObj!==undefined) {
            return returnObj
        }
        throw new Error("no matching uuid found")
    }
    forEach(func) {
        this.args.objects.forEach(func)
    }
    get isLoaded() {
        return (this.viewer!==undefined)
    }
}
ObjectArray.registerConstructor()
class OldObjectArray {
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