ModifierArray = require("../arrays/ModifierArray")
class BaseModifier {
    constructor() {
        this.enabled = true
    }
    update(object, dt) {
    }
    load(object) {
        this.object = object
    }
    unload(object) {
        this.object = undefined

    }
}
module.exports = BaseModifier