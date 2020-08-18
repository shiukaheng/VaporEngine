const _ = require("underscore")

function argumentProcessor(defaultArgs, args) {
  let newArgs = Object.assign({}, defaultArgs);
  let keysUnion = _.union(Object.keys(newArgs), Object.keys(args));
  keysUnion.forEach(function (x) {
    if (args[x]!=undefined &&
      !(args[x].constructor == Object)) {
      newArgs[x] = args[x];

    }
    if (args[x]!=undefined && args[x].constructor == Object) {
      newArgs[x] = argumentProcessor(newArgs[x], args[x]);
    }
  });
  return newArgs;
}

module.exports = argumentProcessor