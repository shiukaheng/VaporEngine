class ModifierArray {
    constructor(object, listOfModifiers=[]){
        this.object = object
        this._listOfModifiers=listOfModifiers
        this._listOfModifiers.forEach(x => this.add(x))
    }
    add(modifier){
        modifier.load(this.object)
        this._listOfModifiers.push(modifier)
    }
    remove(modifier){
        modifier.unload(this.object)
        this._listOfModifiers.splice(this._listOfModifiers.indexOf(modifier), 1)
    }
    update(dt){
        this._listOfModifiers.forEach(modifier => modifier.update(this.object, dt))
    }
}
module.exports = ModifierArray