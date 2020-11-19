elem = document.getElementById("viewport-div")

viewer = new Vapor.Viewers.EditorViewer(elem)

viewer.add(new Vapor.Objects.PlayerObject())

viewer.objects.queueAllAssetsLoaded(function() {
    viewer.startRender()
})