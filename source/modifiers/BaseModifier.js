ModifierArray = require("../arrays/ModifierArray")
class BaseModifier {
    constructor() {
        this.children = new ModifierArray()
    }
    update(object, dt) {
        this.children.update(dt)
    }
    load(object) {
        this.children.object = object
    }
    unload(object) {
        this.children.object = undefined
    }
}
module.exports = BaseModifier