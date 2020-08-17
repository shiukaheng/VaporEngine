const uuid = require("uuid")
const _ = require("underscore")
const argsProc = require("./utils/argumentProcessor")

class Serializable {
    constructor(args={}) {
        var defaultArgs = {
            "uuid": uuid.v4(),
            "className": this.constructor.name,
            "ignore": false
        }
        this.args = argsProc(defaultArgs, args)
    }
    serialize() {
        return this.args
    }   
}

module.exports = Serializable