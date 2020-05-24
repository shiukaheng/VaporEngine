elem = document.getElementById("test_div")

viewer = new Vapor.Viewers.Viewer(elem)
viewer.potree.pointBudget = 1000000

player = new Vapor.Objects.BasePhysicalObject()

player.modifiers.add(new Vapor.Modifiers.PlayerModifier())
player.modifiers.add(new Vapor.Modifiers.VelocityDragModifier())
viewer.add(player)

map = new Vapor.Objects.PotreeObject("cloud.js", "")
viewer.add(map)
map.reference.rotation.x = -0.08