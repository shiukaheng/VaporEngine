function procArgs(defaultArgs, args) {
    let newArgs = Object.assign({}, defaultArgs);
    let keysUnion = _.union(Object.keys(newArgs), Object.keys(args));
    keysUnion.forEach(function (x) {
      if (args[x] &&
        !(args[x] instanceof Object) &&
        !(newArgs[x] instanceof Object)) {
        newArgs[x] = args[x];
      }
      if (args[x] && args[x] instanceof Object && newArgs[x] instanceof Object) {
        newArgs[x] = procArgsRecur(newArgs[x], args[x]);
      }
    });
    return newArgs;
  }

module.exports = {
    procArgs: procArgs
}