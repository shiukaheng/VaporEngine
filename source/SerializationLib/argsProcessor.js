const _ = require("underscore");
var lodash = require("lodash/lodash")
const Serializable = require("./Serializable");
function argsProcessor(defaultArgs, args) {
    let newArgs = Object.assign({}, defaultArgs); // Output args, start with default as template
    let keysUnion = _.union(Object.keys(newArgs), Object.keys(args)); // Find union of both dict's keys
    keysUnion.forEach(function (x) { // For each unioned key
      // console.log(x, args[x], newArgs[x])
      if (!((args[x]===undefined)||(args[x]===null))&&(args[x].isProxy||args[x]["className"]!==undefined||args[x].args!==undefined)) { // do not further expand and check trees if is Serializable / proxy object to prevent deep cloning
        newArgs[x] = args[x]
      } else if (args[x]!==undefined && !(typeof args[x] === "object") && !(typeof newArgs[x] === "object")) { // If arg not instance of object and default is not object either 
        newArgs[x] = args[x]; // Copy
      } else if ((typeof args[x] === "object") && args[x].constructor.name===Array.name) {
        var raw = argsProcessor({}, args[x])
        newArgs[x] = Object.keys(raw).map(function(k) {return raw[k]})
      } else if (args[x]!==undefined && (typeof args[x] === "object")) { // If arg instace of object
        newArgs[x] = argsProcessor(newArgs[x], args[x]);
      }
    });
    return newArgs;
}

module.exports = argsProcessor