elem = document.getElementById("test_div")

// Create viewer
viewer = new Vapor.Viewers.Viewer(elem)

// Initialize all objects
player = new Vapor.Objects.BasePhysicalObject()
map = new Vapor.Objects.PotreeObject("cloud.js", "http://tlmhk.synology.me/data/TailorShop/")
// Add all objects to the viewer
viewer.add(player)
viewer.add(map)

viewer.objects.waitUntilAllAssetsLoaded(function() {
    // Configure objects after all is loaded (just in case if some references require assets to be loaded)
    // map.container.position.x = -130
    player.modifiers.add(new Vapor.Modifiers.PlayerModifier(0.5))
    player.modifiers.add(new Vapor.Modifiers.VelocityDragModifier())
    // player.modifiers.add(new Vapor.Modifiers.LinearAccelerationModifier(new THREE.Vector3(-0.5, -0.1, -0.1)))
    viewer.potree.pointBudget = 2000000
    // Start experience
    map.pco.material.pointSizeType = 0
    map.pco.scale.x = 0.05
    map.pco.scale.y = 0.05
    map.pco.scale.z = 0.05
    player.container.position.set(-59.73068325699371, -70.10970395053404, -8.303445118204364)
    map.container.rotation.x = -0.55
    console.log("All loaded!")
    viewer.startRender()
})

