elem = document.getElementById("viewport-div")

viewer = new Vapor.Viewers.EditorViewer(elem)

viewer.objects.queueAllAssetsLoaded(function() {
    viewer.startRender()
})