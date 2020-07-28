elem = document.getElementById("test_div")

// Create viewer
viewer = new Vapor.Viewers.Viewer(elem)

// Initialize all objects
player = new Vapor.Objects.PlayerObject()
// window.player = player
map = new Vapor.Objects.PotreeObject("cloud.js", "InternalUpper/", 2)
// audioSourceObject = new Vapor.Objects.AudioSourceObject("01_Moderato_quasi_marcia.ogg", viewer)

// Add all objects to the viewer
window.camB = new THREE.PerspectiveCamera()
window.camB.position.x = 2
viewer.add(player)
viewer.add(map)

// var lam = new Vapor.Modifiers.LinearAccelerationModifier(new THREE.Vector3(1, 0, 0))
// player.modifiers.add(lam)
// viewer.add(audioSourceObject)

viewer.objects.waitUntilAllAssetsLoaded(function() {
    // Configure objects after all is loaded (just in case if some references require assets to be loaded)
    map.container.rotation.x = -Math.PI/2 -0.01
    // player.rotation.z = 0.2
    // player.position.x = 5
    // player.modifiers.add(new Vapor.Modifiers.LinearAccelerationModifier(new THREE.Vector3(0, 0, 0)))

    // Start experience
    console.log("All loaded!")
    viewer.startRender()
})

