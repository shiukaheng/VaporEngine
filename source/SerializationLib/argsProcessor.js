const _ = require("underscore");
const Serializable = require("./Serializable");
function argsProcessor(defaultArgs, args) {
    let newArgs = Object.assign({}, defaultArgs);
    let keysUnion = _.union(Object.keys(newArgs), Object.keys(args));
    keysUnion.forEach(function (x) {
      if (!((args[x]===undefined)||(args[x]===null))&&(args[x].isProxy||args[x]["className"]!==undefined||args[x].args!==undefined||args[x].constructor.name===Array.name)) { // do not further expand and check trees if is Serializable / proxy object to prevent deep cloning
        newArgs[x] = args[x]
       } else if (args[x]!==undefined &&
        !(args[x] instanceof Object) &&
        !(newArgs[x] instanceof Object)) {
        newArgs[x] = args[x];
      } else if (args[x]!=undefined && args[x] instanceof Object) {
        newArgs[x] = argsProcessor(newArgs[x], args[x]);
      }
    });
    return newArgs;
}

module.exports = argsProcessor