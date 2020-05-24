class ObjectArray {
    constructor(viewer, listOfObjects=[]){
        this.viewer = viewer
        this._listOfObjects=listOfObjects
        this._listOfObjects.forEach(x => this.add(x))
    }
    add(object){
        object.load(this.viewer)
        this._listOfObjects.push(object)
    }
    remove(object){
        object.unload(this.viewer)
        this._listOfObjects.splice(this._listOfObjects.indexOf(object), 1)
    }
    update(dt){
        this._listOfObjects.forEach(object => object.update(dt))
    }
}

module.exports = ObjectArray