var Serialization = require("../Serialization")
function eulerShadowHandler(shadowVec3TraversalFunc) {
    return {
        "get":function(scope, argName) {
            return Serialization.Serializable.getRecursiveSetTrigger(scope._args[argName] = {
                "x": shadowVec3TraversalFunc(scope).x,
                "y": shadowVec3TraversalFunc(scope).y,
                "z": shadowVec3TraversalFunc(scope).z,
                "order": shadowVec3TraversalFunc(scope).order
            }, ()=>{
                scope.args[argName] = scope._args[argName]
            })
        },
        "set":function(scope, val, argName) {
            if (val.constructor!==Object) {
                throw new TypeError(argName+" must be an object")
            }
            if (scope._args[argName]===undefined) {
                scope._args[argName]={x:0, y:0, z:0, order:"XYZ"}
            }
            ["x", "y", "z", "order"].forEach(key => {
                if (val[key]!==undefined) {
                    if (new Set(["x", "y", "z"]).has(key)) {
                        if (typeof val[key] === "number") {
                            shadowVec3TraversalFunc(scope)[key]=val[key]
                            scope._args[argName][key] = val[key]
                        } else {
                            throw new TypeError("Coordinates must be numbers")
                        }
                    } else {
                        if (new Set(["XYZ", "YZX", "ZXY", "XZY", "YXZ", "ZYX"]).has(val[key].toUpperCase())) {
                            shadowVec3TraversalFunc(scope)[key]=val[key].toUpperCase()
                            scope._args[argName][key] = val[key]
                        } else {
                            throw new TypeError("Invalid euler order")
                        }
                    }

                }
            })
            return true
        }
    }
}
module.exports = eulerShadowHandler