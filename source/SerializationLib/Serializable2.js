const { min } = require("underscore")

class ArgValidator {
    constructor(predicate, failHint) {
        this.predicate = predicate
        this.failHint = failHint
    }
    eval(input) {
        if (this.predicate(input)) {
            return true
        } else {
            return false
        }
    }
}

var readOnlyValidator = new ArgValidator(
    () => false,
    "Argument is read only"
)

function createCustomNumberValidator(minValue, maxValue, intOnly) {
    var typeOfNum
    if (intOnly) {
        typeOfNum = "integer"
    } else {
        typeOfNum = "number"
    }
    return new ArgValidator(
        x => (x>=minValue && x<=maxValue && Number.isInteger(x)===intOnly),
        `Argument must be a ${typeOfNum} between ${minValue.toString()} and ${maxValue.toString()}`
    )
}

function validURL(str) {
    // Credits: https://www.webmasterworld.com/devshed/javascript-development-115/regexp-to-match-url-pattern-493764.html
    var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(str);
}

var urlValidator = new ArgValidator(
    x => validURL(x),
    "Argument must be a valid URL"
)

var dummyValidator = new ArgValidator(
    () => true,
    ""
)

function newArgMeta(defaultValue=null, inputValidator=dummyValidator, setHandler=function(){}, readHandler=function(){}) {
    return {
        "defaultValue": defaultValue,
        "inputValidator": inputValidator,
        "setHandler": setHandler,
        "readHandler": readHandler
    }
}

class Serializable {
    constructor(args, argsMeta, constructionInit, postLoadInit) {
        // Check if constructor is valid, i.e. registered!
        serializableClassesManager.lookup(this.constructor.name)
        // Bind function before anything happens
        this.getSelf = this.getSelf.bind(this)
        // Initialize uuid, className in args for Serializable
        var argsMeta = {
            "uuid":{
                "default": uuid.v4(),
                "inputValidator": dumm
            }
        }
    }
}