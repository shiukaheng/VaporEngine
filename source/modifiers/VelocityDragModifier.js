var BaseModifier = require("./BaseModifier")
var {Serializable} = require("../Serialization")

class VelocityDragModifier extends BaseModifier{
    constructor(args={}, initFunc=function(){}, argHandlers={}) {
        super(
        Serializable.argsProcessor({
            // Default arguments:
            "coef": 0.9
        }, args), 
        Serializable.initFuncProcessor(
            function(scope){
                // Initialization code:
            }, initFunc),
        Serializable.argHandProcessor({
            // Argument handlers:
            "coef": Serializable.predicateHandler((elem)=>{
                return (typeof elem==="number")
            }, "TypeError: coef argument must be a number")
        }, argHandlers))
    }
    update(dt) {
        this.object.velocity = this.object.velocity.clone().multiplyScalar((1-this.args.coef)**dt)
    }
    load(object) {
        if (!(object.isBasePhysicalObject)) {
            throw new TypeError("VelocityDragModifier must only be added to class that extends BasePhysicalObject")
        }
        super.load(object)
    }
}
VelocityDragModifier.registerConstructor()

module.exports = VelocityDragModifier