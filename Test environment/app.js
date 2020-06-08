elem = document.getElementById("test_div")

viewer = new Vapor.Viewers.Viewer(elem)
viewer.potree.pointBudget = 1000000

player = new Vapor.Objects.BasePhysicalObject()
viewer.add(player)
player.modifiers.add(new Vapor.Modifiers.PlayerModifier(0.5))
player.modifiers.add(new Vapor.Modifiers.VelocityDragModifier())


map = new Vapor.Objects.PotreeObject("cloud.js", "glasses_clean/")
map.container.position.x = -130
map.container.position.y = -20
map.container.position.z = 20
map.container.rotation.x = -0.53
// map.container.rotation.y = 0.01
map.container.rotation.z = -0.08
viewer.add(map)

// col = new Vapor.Objects.CollisionCloudObject("collision.pcd")
// col.container.rotation.x = -0.08
// viewer.add(col)



viewer.objects.waitUntilAllAssetsLoaded(function() {
    viewer.potree.pointBudget = 10000000
    console.log("All loaded!")
    viewer.startRender()
})