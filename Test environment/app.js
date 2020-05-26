elem = document.getElementById("test_div")

viewer = new Vapor.Viewers.Viewer(elem)
viewer.potree.pointBudget = 1000000

player = new Vapor.Objects.BasePhysicalObject()
viewer.add(player)
player.modifiers.add(new Vapor.Modifiers.PlayerModifier(viewer))
player.modifiers.add(new Vapor.Modifiers.VelocityDragModifier())


map = new Vapor.Objects.PotreeObject("cloud.js", "")
map.reference.rotation.x = -0.08
viewer.add(map)

col = new Vapor.Objects.CollisionCloudObject("collision.pcd")
col.reference.rotation.x = -0.08
viewer.add(col)

viewer.objects.waitUntilAllAssetsLoaded(function() {
    console.log("All loaded!")
    viewer.startRender()
})