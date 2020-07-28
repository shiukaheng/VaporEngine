class ModifierArray {
    constructor(object, listOfModifiers=[]){
        this.object = object
        this._listOfModifiers=listOfModifiers
        this._listOfModifiers.forEach(x => this.add(x))
        this.deferredLoads = []
    }
    add(modifier){
        if (this.object.viewer) {
            this.flushDeferredLoads()
            modifier.load(this.object)
        } else {
            this.deferredLoads.push((function() {
                modifier.load(this.object)
            }).bind(this))
        }
        this._listOfModifiers.push(modifier)
    }
    remove(modifier){
        modifier.unload(this.object)
        this._listOfModifiers.splice(this._listOfModifiers.indexOf(modifier), 1)
    }
    update(dt){
        this._listOfModifiers.forEach(modifier => modifier.update(this.object, dt))
    }
    flushDeferredLoads() {
        this.deferredLoads.forEach(deferredLoad => {
            deferredLoad()
        })
    }
}
module.exports = ModifierArray