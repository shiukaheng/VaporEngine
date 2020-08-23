// elem = document.getElementById("test_div")

// viewer = new Vapor.Viewers.Viewer(elem)

// player = new Vapor.Objects.PlayerObject()

// viewer.add(player)

// viewer.objects.waitUntilAllAssetsLoaded(function() {
//     console.log("All loaded!")
//     viewer.startRender()
// })

var a = new Vapor.Objects.BaseObject()

n = new Vapor.Modifiers.BaseModifier()

a.load({})
a.modifiers.add(n)


// Serializable.serializableArray
