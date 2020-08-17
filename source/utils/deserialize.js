var argsProc = require("./argumentProcessor")

var test = require("../modifiers/PlayerModifier") // WHAT?! HOW?? CIRCULAR DEPENDENCIES ARE SHIT
console.log(test)


function deserialize(entry) {
    // return new serializableObjects[entry.className](entry)
}

module.exports = deserialize