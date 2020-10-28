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

if (query.magicCode !== undefined ) {
// if (true) {
    overlay.style.visibility = "hidden"
    overlay.style.pointerEvents = "none"
    viewer.importNewJSON(query.magicCode)
} else {
    button.addEventListener("click", ()=>{
        if (inputElem.value==="Go away!") {
            titleElem.textContent="Ok."
            overlay.style.opacity = 0;
            overlay.style.pointerEvents = "none";
            return
        }  
        viewer.importNewJSON(inputElem.value, ()=>{
            overlay.style.opacity = 0;
            overlay.style.pointerEvents = "none";
        },
        (e)=>{
            titleElem.textContent="Oops. That's an invalid code."
            throw e
        })
    })
}


viewer.objects.queueAllAssetsLoaded(function() {
    viewer.startRender()
    viewer.potree.pointBudget=10000000
})