ModifierArray = require("../arrays/ModifierArray")
Serializable = require("../Serializable")
argsProc = require("../utils/argumentProcessor")

class BaseModifier extends Serializable {
    constructor(args={}) {
        var defaultArgs = {"enabled": true}
        var newArgs = argsProc(defaultArgs, args)
        super(newArgs)
        this.enabled = this.args.enabled
    }
    update(object, dt) {
    }
    load(object) {
        this.object = object
    }
    unload(object) {
        this.object = undefined
    }
    serialize() {
        this.args.enabled = this.enabled
        return super.serialize()
    }
}
module.exports = BaseModifier