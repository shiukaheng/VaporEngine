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

viewer = new Vapor.Viewers.Viewer(elem, false)

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

// Start of app
function goto(d, x, y, z, rx, ry, rz, fov, ease="power2.inOut") {
    gsap.to(player.position, {x: x, y:y, z:z, ease: ease, duration:d})
    gsap.to(player.rotation, {x: rx, y:ry, z:rz, ease: ease, duration:d})
    if (fov!==undefined) {
        gsap.to(player, {fov: fov, ease: ease, duration: d})
    }
}

player = new Vapor.Objects.PlayerObject()
player.position.set(0.3700998552821573, -1.4232343686563165, 0.875684609066992)
viewer.add(player)

// tailorshop_cloud = new Vapor.Objects.PotreeObject({"fileName":"cloud.js", "baseUrl":"https://tlmhk.synology.me/data/TailorShopDenoise2/", "pointShape":0, "pointSizeType":0})
// tailorshop_cloud.scale = {x:0.05, y:0.05, z:0.05}
// tailorshop_cloud.rotation.x = -0.54999
// viewer.add(tailorshop_cloud)

tailorshop_mesh = new Vapor.Objects.NexusObject({"fileUrl":"https://tlmhk.synology.me/data/tailor-shop-2-textured.nxz"})
tailorshop_mesh.scale = {x:0.05, y:0.05, z:0.05}
tailorshop_mesh.rotation.x = -0.54999
viewer.add(tailorshop_mesh)


// interview = new Vapor.Objects.DepthkitObject({"metaUrl":"./media/barber.txt", "videoUrl":"./media/barber.mp4", "displayMode":"mesh"})
// interview.position.set(4.143711,0.551384,1.3)
// interview.rotation.y = 3.2
// viewer.add(interview)
// interview.depthkitObject.depthkit.setLoop(true)

// tv = new Vapor.Objects.AudioSourceObject({audioSourceURL:"./media/tv.ogg", refDistance:0.2, volume:1.5, randomizeStart:true})
// tv.position.set(3.396508834739505, 0.49228014404444914, 1.1884569859618133)
// viewer.add(tv)

// exhaust = new Vapor.Objects.AudioSourceObject({audioSourceURL:"./media/exhaust.ogg", volume:0.5, refDistance:0.3, randomizeStart:true})
// exhaust.position.set(-0.8389830972697512, 1.1137704263469475, 0.9996509968931954)
// viewer.add(exhaust)

// light1 = new Vapor.Objects.AudioSourceObject({audioSourceURL:"./media/light.ogg", volume:0.1, refDistance:0.3, randomizeStart:true})
// light1.position.set(0.12170987789164787, 1.6391059557985566, 0.7679865166384259)
// viewer.add(light1)

// light2 = new Vapor.Objects.AudioSourceObject({audioSourceURL:"./media/light.ogg", volume:0.1, refDistance:0.3, randomizeStart:true})
// light2.position.set(1.4619025395339935, 1.589875559894504, 0.30668078687990746)
// viewer.add(light2)

// light3 = new Vapor.Objects.AudioSourceObject({audioSourceURL:"./media/light.ogg", volume:0.1, refDistance:0.4, randomizeStart:true})
// light3.position.set(0.4304936471907918, 0.19985503590937695, -1.0857866613948526)
// viewer.add(light3)



viewer.objects.queueAllAssetsLoaded(function() {
    viewer.startRender()
    viewer.potree.pointBudget=7000000
    // gsap.to(viewer.potree, {pointBudget:7000000, duration:5})
})

// Initial configuration
// goto(0, 18.71430889333481, -6.511007352587474, -1.6404616768048537, 0.21012630885547592, 0.4383911998683646, -0.0902853508618578, 50)