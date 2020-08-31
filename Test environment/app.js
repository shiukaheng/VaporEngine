elem = document.getElementById("test_div")

// Create viewer
viewer = new Vapor.Viewers.Viewer(elem)

// Initialize all objects
player = new Vapor.Objects.BasePhysicalObject()
map = new Vapor.Objects.PotreeObject("cloud.js", "glasses_clean/")
// Add all objects to the viewer
viewer.add(player)
viewer.add(map)


viewer.objects.waitUntilAllAssetsLoaded(function() {
    // Configure objects after all is loaded (just in case if some references require assets to be loaded)
    map.container.rotation.x = -0.85
    map.container.rotation.y = -0.02
    player.modifiers.add(new Vapor.Modifiers.PlayerModifier(0.5))
    player.modifiers.add(new Vapor.Modifiers.VelocityDragModifier())
    // player.modifiers.add(new Vapor.Modifiers.LinearAccelerationModifier(new THREE.Vector3(-0.5, -0.1, -0.1)))

    // Start experience
    console.log("All loaded!")
    viewer.startRender()
})

