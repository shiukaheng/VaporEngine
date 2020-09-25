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
if (query.serializedCode !== undefined) {
    viewer.importNewJSON(query.serializedCode)
}

viewer.objects.queueAllAssetsLoaded(function() {
    console.log("All loaded!")
    viewer.startRender()
    viewer.potree.pointBudget=10000000
})