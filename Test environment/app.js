// elem = document.getElementById("test_div")

// viewer = new Vapor.Viewers.Viewer(elem)

// player = new Vapor.Objects.PlayerObject()

// viewer.add(player)

// viewer.objects.waitUntilAllAssetsLoaded(function() {
//     console.log("All loaded!")
//     viewer.startRender()
// })

var a = new Vapor.Objects.BaseObject()

class NewModifier extends Vapor.Serialization.Serializable.createConstructor(
    {
        "testArg": "sample"
    },
    function(scope) {
        console.log("Constructed!", scope)
    },
    {},
    undefined,
    Vapor.Modifiers.BaseModifier
) {
    foo(arg) {
        console.log(this.args.testArg)
    }
    load(object) {
        super.load(object)
        console.log("Loaded")
    }
}
NewModifier.registerConstructor()

n = new NewModifier()

a.load({})
a.modifiers.add(n)


// Serializable.serializableArray
