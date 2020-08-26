var Serializable = require("./Serializable")
// Keeps track of deserialized objects and its dependencies!
function isUuidProxyArgsObj(elem) {
    return ((elem.constructor.name===Object.name) && (elem["className"] === "uuidProxy"))
}
function isSerializableArgsObj(elem) {
    return ((elem.constructor.name===Object.name) && (elem["className"] !== undefined))
}
function isObject(elem) {
    return (elem.constructor.name===Object.name)
}
function isArray(elem) {
    return (elem.constructor.name=== Array.name)
}
function isLiteral(elem) {
    return (Object(elem)!==elem)
}
function isUuidProxy(elem) {
    return elem.isProxy
}

function peek(elem) {
    console.log(elem)
    return elem
}

class DeserializationObjectContainer{
    constructor(serializableClassesManager) {
        this.serializableClassesManager = Serializable.getSerializableClassesManager()
        this.unfulfilledDependencies={}
        this.serializableInstances={}
        this.bufferedVirtualInstances={}
        this.requestResolveDependency = this.requestResolveDependency.bind(this)
        this.getUuidPlaceholder = this.getUuidPlaceholder.bind(this)
                
    }
    requestResolveDependency(uuid, callback) {
        if (this.serializableInstances[uuid]===undefined) {
            if (this.unfulfilledDependencies[uuid]===undefined) {
                this.unfulfilledDependencies[uuid] = [callback]
            } else if (this.unfulfilledDependencies[uuid].constructor.name==Array.name) {
                this.unfulfilledDependencies[uuid].push(callback)
            } else {
                throw new Error("unfulfilledDependencies corruption")
            }
        } else {
            callback(this.serializableInstances[uuid])
        }

    }
    registerSerializableInstance(serializable) {
        if (this.serializableInstances[serializable.args.uuid] !== undefined) {
            throw new Error("attempt to register existing uuid")
        }
        this.serializableInstances[serializable.args.uuid] = serializable
        if (this.unfulfilledDependencies[serializable.args.uuid]!==undefined) {
            this.unfulfilledDependencies[serializable.args.uuid].forEach(callback => {
                callback(serializable)
            })
        }
    }
    deserializeSerializable(serializable) {
        if(serializable["serialize"]===false) {
            return null
        }
        var relinked = {}
        for (const [key, value] of Object.entries(serializable)) {
            relinked[key] = this.deserialize(value)
        }
        var returnVar = this.reconstruct(relinked)
        this.registerSerializableInstance(returnVar)
        return returnVar
    }
    deserialize(elem) { // Can deserialize any arbitrary structure as long as follows JSON compatible structured object, and that a serialized object only exists once.
        // console.log(elem)
        var returnVar
        if (elem.isProxy) {
            returnVar = elem
        } else if (isLiteral(elem)) {
            returnVar = elem
        } else if (isArray(elem)) {
            returnVar = []
            elem.forEach(value => {
                returnVar.push(this.deserialize(value))
            })
            // console.log("isArray", returnVar)
        } else if (isUuidProxyArgsObj(elem)) {
            returnVar = this.getUuidPlaceholder(elem["uuid"])
        } else if (isSerializableArgsObj(elem)) {
            returnVar = this.deserializeSerializable(elem)
        } else if (isObject(elem)) {
            var returnVar = {}
            for (const [key, value] of Object.entries(elem)) {
                returnVar[key] = this.deserialize(value)
            }
            // console.log("isObject", returnVar)
        } else {
            console.warn("Unhandled data type for ",elem)
        }
        // console.log(elem, returnVar)
        return returnVar
    }
    deserializeWithDependencies(serializedWithDependencies) {
        return this.deserialize(serializedWithDependencies).serialized
    }
    reconstruct(serialized) {
        return new (this.serializableClassesManager.lookup(serialized.className))(serialized)
    }
    getUuidPlaceholder(uuid) {
        var scope = this
        var actualTarget
        this.requestResolveDependency(uuid, replacementObject => {
            actualTarget = replacementObject
            if (scope.bufferedVirtualInstances[uuid]!==undefined) {
                for (const [key, value] of Object.entries(scope.bufferedVirtualInstances[uuid])) {
                    if (!((key==="className")||(key==="uuid"))) {
                        replacementObject[key] = value
                    }
                }
            }
        })
        if (scope.bufferedVirtualInstances[uuid]===undefined) {
            scope.bufferedVirtualInstances[uuid] = {
                "uuid": uuid,
                "className": "uuidProxy"
            }
        }
        var switcherooProxy = new Proxy(scope.bufferedVirtualInstances[uuid], {
            get: function(placeholderTarget, prop, receiver) {
                if (prop==="isProxy") {
                    return true
                }
                if (!(actualTarget===undefined)) {
                    return actualTarget[prop]
                } else {
                    console.warn("Getting properties of uninstantiated object. Serializable objects should not access other Serializable objects during construction!")
                    
                    return scope.bufferedVirtualInstances[uuid][prop]
                }
            },
            set: function(placeholderTarget, prop, receiver) {
                if (!(actualTarget===undefined)) {
                    actualTarget[prop] = receiver
                    return true
                } else {
                    placeholderTarget[prop] = receiver
                    console.warn("Setting properties of uninstantiated object.")
                    return true
                }
            }
        })
        return switcherooProxy
    }
}

module.exports = DeserializationObjectContainer