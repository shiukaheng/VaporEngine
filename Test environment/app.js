elem = document.getElementById("test_div")

viewer = new Vapor.Viewers.Viewer(elem)

player = new Vapor.Objects.PlayerObject()
testobj = new Vapor.Objects.TestObject()

viewer.add(player)
viewer.add(testobj)

viewer.objects.queueAllAssetsLoaded(function() {
    console.log("All loaded!")
    viewer.startRender()
})