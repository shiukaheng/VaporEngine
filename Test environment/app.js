elem = document.getElementById("test_div")

viewer = new Vapor.Viewers.Viewer(elem)

player = new Vapor.Objects.PlayerObject()

viewer.add(player)

viewer.objects.waitUntilAllAssetsLoaded(function() {
    console.log("All loaded!")
    viewer.startRender()
})

