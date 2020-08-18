const uuid = require("uuid")
const _ = require("underscore")
const argsProc = require("./utils/argumentProcessor")

class Serializable {
    constructor(args={}) {
        var defaultArgs = {
            "uuid": uuid.v4(),
            "className": this.constructor.name,
            "ignore": false,
        }
        this.args = argsProc(defaultArgs, args)
    }
    serialize() {
        return this.args
    } 
    static deserialize(object) {
        var constructor = manager.lookup(object["className"])
        return new constructor(object)
    }
    static registerClass(constructor) {
        manager.register(constructor)
    }
}

class SerializableClassesManager {
    constructor() {
        this.classList = {}
    }
    register(newClass) {
        if (newClass.prototype instanceof Serializable) {
            this.classList[newClass.name] = newClass
        } else {
            throw "Attempted to register invalid class."
        }
    }
    lookup(lookupClass) {
        if (!(this.classList[lookupClass]==undefined)) {
            return this.classList[lookupClass]
        } else {
            throw "Class not found!"
        }
    }
}

// Todo: Automatically register serializable classes using class decorators.
//       Automatically serialize and deserialize "args" object recursively, also substitute serializable objects with a proxy. Move nested objects into the "global context", and when the nested object is to be deserialized, the proxy provides a reference to the object.
//       Make it so that the scene itself is also a serializable (?)
//       For each data type found in the "args" object, there should only be the need to write a serializer / deserializer once.

var manager = new SerializableClassesManager()

module.exports = Serializable