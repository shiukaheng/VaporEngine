var ModifierArray = require("../arrays/ModifierArray")
var Serialization = require("../Serialization")

class BaseModifier extends Serialization.Serializable {
    constructor(args={}, initFunc=function(){}, argHandlers={}) {
        super(
        Serialization.Serializable.argsProcessor({
            // Default arguments:
            "enabled": true
        }, args), 
        Serialization.Serializable.initFuncProcessor(
            function(scope){
                // Initialization code:
            }, initFunc),
        Serialization.Serializable.argHandProcessor({
            // Argument handlers:
            "enabled": Serialization.Serializable.predicateHandler((elem)=>{
                return (typeof elem === "boolean")
            }, new TypeError("Modifier enabled flag must be bool"))
        }, argHandlers))
    }
    update(dt) {
        if (!this.isLoaded) {
            throw new Error("Attempt to update Modifier before object is loaded.")
        }
    }
    load(object) {
        this.object = object
    }
    unload() {
        this.object = undefined
    }
    get isLoaded() {
        return (!(this.object===undefined))
    }
}
BaseModifier.registerConstructor()

module.exports = BaseModifier