elem = document.getElementById("test_div")

viewer = new Vapor.Viewers.EditorViewer(elem)

viewer.add(new Vapor.Objects.PotreeObject({baseUrl:"http://192.168.0.114:8000/Writing%20Shop%20filtered/", fileName:"cloud.js"}))
viewer.add(new Vapor.Objects.PlayerObject())

viewer.objects.queueAllAssetsLoaded(function() {
    console.log("All loaded!")
    viewer.startRender()
})