var {Serializable} = require("../Serialization")
var _ = require("underscore")
var BaseModifier = require("../modifiers/BaseModifier")

class ModifierArray extends Serializable {
    constructor(args={}, initFunc=function(){}, argHandlers={}) {
        super(
        Serializable.argsProcessor({
            // Default arguments:
            "modifiers":[]
        }, args), 
        Serializable.initFuncProcessor(
            function(scope){
                // Initialization code:
            }, initFunc),
        Serializable.argHandProcessor({
            // Argument handlers:
            "modifiers":{
                "set":function(scope, val, argName) {
                    if (scope._argumentsInitialized===true) {
                        throw("attempt to set modifier argument in ModifierArray")
                    } else {
                        scope._args[argName] = val
                        scope._argumentsInitialized = true
                    }
                    
                },
                "get":function(scope, argName) {
                    return(new Proxy(scope._args[argName], {
                        "set":function(){
                            throw "attempt to modify modifier argument in ModifierArray"
                        },
                        "get":function(target, prop) {
                            if(_.contains(["forEach", "toString", "toLocaleString", "length", "constructor"],prop)||(parseInt(prop).toString()===prop)) {
                                var returnVar = target[prop]
                                if (target.constructor.name === Function.name) {
                                    returnVar = returnVar.bind(target)
                                }
                                return returnVar
                            } else {
                                throw "attempt to modify modifier argument in ModifierArray"
                            }
                        }
                    }))
                }
            }
        }, argHandlers))
    }
    load(object) { // Todo: add compatibility on side of object. // Only at this moment, load modifiers
        // if (this.isLoaded) {
        //     throw "attempt to load ModifierArray that is already loaded"
        // }
        this.object = object
        this.forEach(modifier=>{
            modifier.load(object)
        })
    }
    unload() { // Unload modifiers too
        this.forEach(modifier=>{
            modifier.unload(this.object)
        })
        this.object = undefined
    }
    add(...modifiers) {
        modifiers.forEach(modifier=>{
            this.addSingle(modifier)
        })
    }
    remove(...modifiers) {
        modifiers.forEach(modifier=>{
            this.removeSingle(modifier)
        })
    }
    addSingle(modifier){
        if (_.contains(this._args.modifiers, modifier)) {
            throw "attempt to add already existing modifier"
        } else if (!(modifier.isBaseModifier)) {
            throw "attempt to add invalid class to ModifierArray"
        } else {
            this._args.modifiers.push(modifier)
            if (this.isLoaded) {
                modifier.load(this.object)
            }
        }

    }
    removeSingle(modifier){
        if (!(_.contains(this._args.modifiers, modifier))) {
            throw "attempt to remove non-existent modifier"
        } else {
            this._args.modifiers.splice(this._args.modifiers.indexOf(modifier), 1)
            if (this.isLoaded) {
                modifier.unload()
            }
        }
    }
    update(dt){
        if (!this.isLoaded) {
            throw "attempt to update "+this.constructor.name+" before loaded"
        }
        this.forEach(modifier => {
            if (modifier.args.enabled) {
                modifier.update(dt)
            }
        })
    }
    get isLoaded() {
        return (this.object!==undefined)
    }
    get forEach() {
        return (this.args.modifiers.forEach.bind(this.args.modifiers))
    }
}
ModifierArray.registerConstructor()
module.exports = ModifierArray