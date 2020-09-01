elem = document.getElementById("test_div")

viewer = new Vapor.Viewers.EditorViewer(elem)

viewer.add(new Vapor.Objects.PlayerObject())
viewer.add(new Vapor.Objects.NexusObject({fileUrl:"./barber.nxz"}))

viewer.objects.queueAllAssetsLoaded(function() {
    console.log("All loaded!")
    viewer.startRender()
})