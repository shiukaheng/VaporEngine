elem = document.getElementById("test_div")

viewer = new Vapor.Viewers.Viewer(elem)


player = new Vapor.Objects.PlayerObject()
testobj = new Vapor.Objects.TestObject({color:"teal"})
potreeobj = new Vapor.Objects.PotreeObject({fileName:"bundle.js", baseUrl:"https://shiukaheng.github.io/StateTheatreArchiveDemo/"})

viewer.add(player)
viewer.add(testobj)
viewer.add(potreeobj)

viewer.objects.queueAllAssetsLoaded(function() {
    console.log("All loaded!")
    viewer.startRender()
})