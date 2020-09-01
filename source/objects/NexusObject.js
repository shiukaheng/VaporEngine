var Nexus = require("../nexus/Nexus")
var {Serializable} = require("../Serialization")
var BasePhysicalObject = require("./BasePhysicalObject")

class NexusObject extends Serializable.createConstructor(
    {
        "fileUrl": ""
    },
    undefined,
    {
        "fileUrl": Serializable.readOnlyHandler()
    },
    function(scope) {
        if (scope.constructor.name===NexusObject.name) {
            scope.declareAssetsLoaded()
        }
    },
    BasePhysicalObject
) {
    load(viewer) {
        super.load(viewer)
        this.obj = new Nexus.NexusObject(this.args.fileUrl, ()=>{}, ()=>{}, this.viewer.renderer)
        this.container.add(this.obj)
    }
    unload(viewer) {
        this.container.remove(this.obj)
        this.obj = undefined
        super.unload(viewer)
    }
}
NexusObject.registerConstructor()

module.exports = NexusObject