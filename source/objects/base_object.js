class BaseObject {
    constructor() {
        this.position = NaN
        this.modifiers = new ModifierArray()
        this.undeletable = false
    }
    setPosition() {

    }
    getPosition() {

    }
    incrementPosition() {
        
    }
    getDistanceFromCenter() {

    }
    load() {

    }
    unload() {

    }
    update(dt) {
        this.modifiers.update(this, dt)
    }
}

class ModifierArray {
    constructor(object){
        this.object = object
        this.modifiers = []
        arguments.forEach(x => this.add(x))
    }
    add(modifier){
        modifier.load(this.object)
        this.modifiers.push(this.modifiers)
    }
    remove(modifier){
        modifier.unload(this.object)
        this.modifiers.splice(this.modifiers.indexOf(modifier), 1)
    }
    update(object, dt){
        this.modifiers.forEach(modifier => modifier.update(object, dt))
    }
}

module.exports = BaseObject