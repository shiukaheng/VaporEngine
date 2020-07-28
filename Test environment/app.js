elem = document.getElementById("test_div")

// Create viewer
viewer = new Vapor.Viewers.Viewer(elem)

// Initialize all objects
player = new Vapor.Objects.PlayerObject()
map = new Vapor.Objects.PotreeObject("cloud.js", "InternalUpper/", 2)
// audioSourceObject = new Vapor.Objects.AudioSourceObject("01_Moderato_quasi_marcia.ogg", viewer)
window.camB = new THREE.PerspectiveCamera()

// Add all objects to the viewer
viewer.add(player)
viewer.add(map)
// viewer.add(audioSourceObject)

viewer.objects.waitUntilAllAssetsLoaded(function() {
    // Configure objects after all is loaded (just in case if some references require assets to be loaded)
    map.container.rotation.x = -Math.PI/2 -0.01
    // player.container.rotation.x = 1
    // player.container.position.x = 5
    // player.modifiers.add(new Vapor.Modifiers.PlayerModifier(0.1))
    // player.modifiers.add(new Vapor.Modifiers.VelocityDragModifier())
    // player.modifiers.add(new Vapor.Modifiers.LinearAccelerationModifier(new THREE.Vector3(0, 0, 0)))
    // Start experience
    console.log("All loaded!")
    viewer.startRender()
})