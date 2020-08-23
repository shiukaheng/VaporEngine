const uuid = require("uuid")
const argsProcessor = require("./argsProcessor")
const _ = require("underscore")

class SerializableClassesManager {
    constructor() {
        this.classList = {}
    }
    register(newClass) {
        // console.log(newClass)
        if ((newClass.prototype instanceof Serializable)||(newClass===Serializable)) {
            this.classList[newClass.name] = newClass
        } else {
            throw new TypeError("attempt to register invalid class")
        }
    }
    lookup(lookupClass) {
        if (!(this.classList[lookupClass]===undefined)) {
            return this.classList[lookupClass]
        } else {
            throw new TypeError("unrecognized Serializable class")
        }
    }
}

var serializableClassesManager = new SerializableClassesManager()

function applyArgs(targetArgs, sourceArgs) {
    for (const [key, value] of Object.entries(sourceArgs)) {
        targetArgs[key] = value
    }
}

function serializableArrayRemoveDuplicates(serializableArray) { // For instantiated Serializables, order aware, keeps duplicate with lowest index (earliest)
    var uuidDictObj = {}
    var uuidIndexDictObj = {}
    serializableArray.forEach((obj, index) => {
        if (!(obj instanceof Serializable)) {
            throw new TypeError("Array contains non-serializable class")
        }
        uuidDictObj[obj.args.uuid] = obj
        if (uuidDictObj[obj.args.uuid]===undefined) { // If not in set
            uuidIndexDictObj[obj.args.uuid] = index // Add to set
        } else { // If in set already
            uuidIndexDictObj[obj.args.uuid] = Math.min([index, uuidIndexDictObj[obj.args.uuid]]) // Remove the higher index duplicate
        }
    })
    var unorderedObjectArray = []
    for (const [key, value] of Object.entries(uuidIndexDictObj)) {
        unorderedObjectArray.push({
            "index":value,
            "object":uuidDictObj[key]
        })
    }
    var orderedObjectArray = []
    _.sortBy(unorderedObjectArray, "index").forEach((elem)=>{
        orderedObjectArray.push(elem["object"])
    })
    return orderedObjectArray
}

function serializableArraysDiff(before, after) { // For instantiated Serializables
    return {
        "added": [],
        "removed": []
    }
}

class Serializable {
    constructor(args={}, initFunc=function(){}, argHandlers={}) {
        // Check if constructor is valid, i.e. registered!
        serializableClassesManager.lookup(this.constructor.name)
        // Initialize uuid, className in args for Serializable
        var defaultArgs = {
            "uuid": uuid.v4(),
            "className": this.constructor.name,
            "serialize": true
        }
        // Initialize args functionality
        this.argHandlers = _.extend({}, argHandlers)
        this._args = {}
        this.args = this.getArgObjectProxy()
        // Run initialization code
        initFunc(this)
        // Set arguments, triggering necessary argHandlers (must happend after initialization, setting container variables etc)
        applyArgs(this.args, Serializable.argsProcessor(defaultArgs, args))
        this.getSelf = this.getSelf.bind(this)
    }
    serializeWithDependencies() {
        return serializeElement(this)
    }
    updateArgs() {
    }
    getSelf() {
        return this
    }
    getArgObjectProxy() {
        var scope = this
        return new Proxy(this._args, {
            get(target, prop) {
                if(scope.argHandlers[prop]!==undefined&&scope.argHandlers[prop].get!==undefined) {
                    return scope.argHandlers[prop].get(scope, prop)
                } else {
                    return Reflect.get(...arguments)
                }
            },
            set(target, prop, value) {
                if(scope.argHandlers[prop]!==undefined&&scope.argHandlers[prop].set!==undefined) {
                    return scope.argHandlers[prop].set(scope, value, prop)
                } else {
                    return Reflect.set(...arguments)
                }
            }
        })
    }
    _setArgsPropHandler(propName, getter, setter) { // Handlers will not be serialized! Thus should only be used when writing classes that inherits Serializable.
        if (getter.constructor!==Function||setter.constructor!==Function) {
            throw new TypeError("invalid getters or setters")
        }
        this.argHandlers[propName] = {
            get: getter,
            set: setter
        }
    }
    static serializeElement(elem) {
        return serializeElement(elem)
    }
    static registerConstructor() {
        serializableClassesManager.register(this)
    }
    static getSerializableClassesManager() {
        return serializableClassesManager
    }
    static argsProcessor(defaultArgs, args) {
        return argsProcessor(defaultArgs, args)
    }
    static argHandProcessor(handlers, additionalHandlers) { // Could be modified to combine multiple handlers
        return _.extend(handlers, additionalHandlers)
    }
    static initFuncProcessor(initFunc, additionalInitFunc) {
        return function(scope) {
            initFunc(scope),
            additionalInitFunc(scope)
        }
    }
    static encodeTraversal(path=[]) {
        return new Proxy((args)=>{}, {
            get(target, prop, receiver) {
                path.push(prop)
                return Serializable.encodeTraversal(path)
            },
            set() {
                throw new Error("attempt to set property of encodeTraversal proxy")
            },
            apply(target, thisArg, argArray) {
                var destination = argArray[0]
                path.forEach(child => {
                    destination = destination[child]
                })
                return destination
            }
        })
    }
    static getReadOnly(object) {
        return new Proxy(object, {
            get(target, prop, receiever) {
                if (Object(target[prop])!==target[prop]&&target[prop]!==undefined) {
                    return Serializable.getReadOnly(target[prop])
                } else {
                    return target[prop]
                }
            },
            set(target, prop, value) {
                throw new Error("Read only property. Modify the direct children of the args object!")
            },
            apply(target, thisArg, argumentsList) {
                throw new Error("Read only property. Modify the direct children of the args object!")
            }
        })
    }
    static getRecursiveSetTrigger(object, callback) {
        return new Proxy(object, {
            get(target, prop, receiever) {
                if (Object(target[prop])===target[prop]&&target[prop]!==undefined) {
                    return Serializable.getRecursiveSetTrigger(target[prop], callback)
                } else {
                    return target[prop]
                }
            },
            set(target, prop, value) {
                Reflect.set(...arguments)
                callback()
            },
            apply(target, thisArg, argumentsList) {
                Reflect.apply(...arguments)
                callback()
            }
        })
    }
    static predicateHandler(predicate, error=new TypeError("Rejection by predicate")) {
        return {
            "set":function(scope, val, argName) {
                if(predicate(val)===false) {
                    throw error
                }
                scope._args[argName] = val
            },
            "get":function(scope, argName) {
                if (!(Object(scope._args[argName])===scope._args[argName])||scope._args[argName]===undefined) {
                    return scope._args[argName]
                } else {
                    return Serializable.getRecursiveSetTrigger(scope._args[argName], 
                        ()=>{
                            scope.args[argName] = scope._args[argName]
                        })
                }
                
            }
        }
    }
    static serializableArrayRemoveDuplicates(array) {
        return serializableArrayRemoveDuplicates(array)
    }
    static createConstructor(args={}, initFunc=function(scope){}, argHandlers={}, inherits=Serializable) {
        class CustomBaseSerializable extends inherits{
            constructor(_args={}, _initFunc=function(){}, _argHandlers={}) {
                super(
                    Serializable.argsProcessor(args, _args), 
                    Serializable.initFuncProcessor(initFunc, _initFunc),
                    Serializable.argHandProcessor(argHandlers, _argHandlers))
            }
        }
        return CustomBaseSerializable
    }
    static numberHandler(min=-Infinity, max=Infinity, integerOnly=false) {
        return {
            "set": function(scope, val, argName) {
                if (typeof val !== "number") {
                    throw TypeError(argName+" must be a number")
                }
                if (integerOnly===true&&!(Number.isInteger(val))) {
                    throw TypeError(argName+" must be a integer")
                }
                if (val<=min) {
                    throw TypeError(argName+" must be above or equal to "+(min).toString())
                }
                if (val>=max) {
                    throw TypeError(argName+" must be below or equal to "+(max).toString())
                }
                scope._args[argName] = val
            }
        }
    }
}

Serializable.registerConstructor()

class DependencyArgSet{
    constructor(set=[]) {
        this.set = {}
    }
    forEach(func) {
        this.toArray().forEach(func)
    }
    add(dependencyArg) {
        if (dependencyArg["uuid"]===undefined) {
            throw new Error("nonexistent uuid")
        }
        this.set[dependencyArg["uuid"]] = dependencyArg
    }
    merge(dependencyArgSet) {
        this.set = _.extend(this.set, dependencyArgSet.set)
    }
    toArray() {
        var returnArr = []
        for (const [key, value] of Object.entries(this.set)) {
            returnArr.push(value)
        }
        return returnArr
    }
    has(dependencyArg) {
        return (this.set[dependencyArg["uuid"]]!==undefined)
    }
    reserve(uuid) {
        if (this.set[uuid]!==undefined) {
            throw new Error("attempt to reserve existing uuid")
        }
        this.set[uuid] = null
    }
}

function serializeElement(elem, isTopLevel=true, _dependencies=new DependencyArgSet()) {
    // console.log(elem)
    var serialized
    if (Object(elem)!==elem) {
        serialized = elem
    } else if (elem.constructor === Array) {
        var returnVar = []
        elem.forEach(value => {
            var processedValue = serializeElement(value, false, _dependencies)
            returnVar.push(processedValue.serialized)
        })
        serialized = returnVar  
    } else if (elem.constructor === Object) {
        var returnVar = {}
        for (const [key, value] of Object.entries(elem)) {
            var processedValue = serializeElement(value, false, _dependencies)
            returnVar[key] = processedValue.serialized
        }
        serialized = returnVar
    } else if (elem instanceof Serializable) {
        if (!(elem.args.uuid)) {
            throw new Error("UUID not found")
        }
        elem.updateArgs()
        if (_dependencies.has(elem.args)) {
            serialized = {
                "className": "uuidProxy",
                "uuid": elem.args.uuid
            }
        } else {
            _dependencies.reserve(elem.args.uuid)
            var processedValue = serializeElement(elem.args, false, _dependencies)
            serialized = {
                "className": "uuidProxy",
                "uuid": elem.args.uuid
            }
            _dependencies.add(processedValue.serialized)  
        }
        
    } else {
        console.warn("Unhandled data type for ",elem)
    }
    var returnDependencies
    if (isTopLevel) {
        returnDependencies = _dependencies.toArray()
    } else {
        returnDependencies = _dependencies
    }
    return {
        "serialized": serialized,
        "dependencies": returnDependencies
    }
}

module.exports = Serializable