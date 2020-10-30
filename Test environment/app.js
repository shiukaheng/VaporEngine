function parseQuery(queryString) {
    var query = {};
    var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    return query;
}

elem = document.getElementById("viewport-div")

viewer = new Vapor.Viewers.Viewer(elem)

var query = parseQuery(window.location.search)
var overlay = document.getElementById("nocode-div")
var button = document.getElementById("code-submit")
var inputElem = document.getElementById("code-input")
var titleElem = document.getElementById("title")

// if (query.magicCode !== undefined ) {
// // if (true) {
//     overlay.style.visibility = "hidden"
//     overlay.style.pointerEvents = "none"
//     viewer.importNewJSON(query.magicCode)
// } else {
//     button.addEventListener("click", ()=>{
//         if (inputElem.value==="Go away!") {
//             titleElem.textContent="Ok."
//             overlay.style.opacity = 0;
//             overlay.style.pointerEvents = "none";
//             return
//         }  
//         viewer.importNewJSON(inputElem.value, ()=>{
//             overlay.style.opacity = 0;
//             overlay.style.pointerEvents = "none";
//         },
//         (e)=>{
//             titleElem.textContent="Oops. That's an invalid code."
//             throw e
//         })
//     })
// }

// Debug stuff:
overlay.style.visibility = "hidden"
overlay.style.pointerEvents = "none"
window.player = new Vapor.Objects.PlayerObject()
viewer.add(window.player)
window.player.position = {x: 0.24371145418086904, y: -1.4386158357237322, z: 0.4360854928179726}

window.interview = new Vapor.Objects.DepthkitObject({"metaUrl":"barber.txt", "videoUrl":"barber.mp4", "displayMode":"mesh"})
window.interview.position.x = 1.24371145418086904
window.interview.position.y = -0.4386158357237322
window.interview.position.z = -1
// // window.interview.scale.x=10
// // window.interview.scale.y=10
// // window.interview.scale.z=10
viewer.add(window.interview)

window.shop = new Vapor.Objects.PotreeObject({"fileName":"cloud.js", "baseUrl":"http://tlmhk.synology.me/data/TailorShopDenoise/", "pointShape":0, "pointSizeType":0})
window.shop.scale = {x:0.05, y:0.05, z:0.05}
window.shop.rotation.x = -0.54999
// window.shop.rotation = {x:-0.5499, y:0, z:0} <-- Bug!
viewer.add(window.shop)


viewer.objects.queueAllAssetsLoaded(function() {
    viewer.startRender()
    viewer.potree.pointBudget=2000000
})