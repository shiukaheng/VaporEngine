var Serialization = require("../Serialization")
function vec3ShadowHandler(shadowVec3TraversalFunc) {
    return {
        "get":function(scope, argName) {
            return Serialization.Serializable.getRecursiveSetTrigger(scope._args[argName] = {
                "x": shadowVec3TraversalFunc(scope).x,
                "y": shadowVec3TraversalFunc(scope).y,
                "z": shadowVec3TraversalFunc(scope).z
            }, ()=>{
                scope.args[argName] = scope._args[argName]
            })
        },
        "set":function(scope, val, argName) {
            if (val.constructor!==Object) {
                throw "TypeError: "+argName+" must be an object"
            }
            if (scope._args[argName]===undefined) {
                scope._args[argName]={x:0, y:0, z:0}
            }
            ["x", "y", "z"].forEach(key => {
                if (val[key]!==undefined) {
                    if (typeof val[key] === "number") {
                        shadowVec3TraversalFunc(scope)[key]=val[key]
                        scope._args[argName][key] = val[key]
                    } else {
                        throw "TypeError: coordinates must be in numbers"
                    }
                }
            })
            return true
        }
    }
}
module.exports = vec3ShadowHandler