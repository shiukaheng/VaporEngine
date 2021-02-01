elem = document.getElementById("viewport-div")

viewer = new Vapor.Viewers.EditorViewer(elem)

viewer.queueReady(function() {
    viewer.startRender()
})