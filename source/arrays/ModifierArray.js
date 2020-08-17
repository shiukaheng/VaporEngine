class ModifierArray {
    constructor(object, serializedModifiers){
        this.object = object
        this._listOfModifiers=[]
        this._listOfModifiers.forEach(x => this.add(x))
        this.deferredLoads = []
        if (!serializedModifiers==undefined) {
            serializedModifiers.forEach(
                this.add()
            )
        }
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
        this._listOfModifiers.forEach(modifier => {
            if (modifier.enabled) {
                modifier.update(this.object, dt)
            }
        })
    }
    flushDeferredLoads() {
        this.deferredLoads.forEach(deferredLoad => {
            deferredLoad()
        })
    }
    serialize() {
        var serializedModifiers = []
        this._listOfModifiers.forEach(modifier => {
            if (!modifier.args.ignore) {
                serializedModifiers.push(modifier.serialize())
            }
        })
        return serializedModifiers
    }
}
module.exports = ModifierArray