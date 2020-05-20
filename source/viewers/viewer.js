THREE = require("three")
ResizeSensor = require("css-element-queries/src/ResizeSensor")
ViewerCamera = require("../cameras/viewerCamera")
require("./viewer.css")

/** Viewer class that binds to a container element */
class Viewer {
    /**
     * Used to construct a viewer
     * @param {Element} containerElement [Canvas element that the viewer will render to]
     */
    constructor(containerElement) {
        this.pauseRenderFlag = false
        this.containerElement = containerElement

        // this.viewerCanvas = document.createElement("canvas")
        // this.viewerCanvas.className += "vaporViewer"

        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.domElement.className += "vaporViewer"
        this.containerElement.appendChild(this.renderer.domElement)
        this.renderer.setSize(this.containerElement.scrollWidth, this.containerElement.scrollHeight)

        var onContainerElementResizeBound = this.onContainerElementResize.bind(this)
        this.containerElementResizeListener = new ResizeSensor(containerElement, onContainerElementResizeBound)

        this.scene = new THREE.Scene()
        this.rendererCamera = new ViewerCamera(35, this.containerElement.scrollWidth/this.containerElement.scrollHeight, 0.1, 1000)
        this.scene.add(this.rendererCamera)

        this.devInit()
        this.startRender()
    }

    /** Starts rendering loop with requestAnimationFrame, calls renderLoop method */
    startRender() {
        var scope = this
        if (!this.pauseRenderFlag) {
            requestAnimationFrame(function() {scope.startRender();})
        } else {
            scope.pauseRenderFlag = false
        }
        this.renderLoop()
    }

    /** Pauses rendering loop */
    pauseRender() {
        this.pauseRenderFlag = true
    }
    
    /** Render loop */
    renderLoop() {
        // console.log("render")
        this.renderer.render(this.scene, this.rendererCamera)
        this.devRenderLoop()
    }

    onContainerElementResize() {
        var width = this.containerElement.clientWidth
        var height = this.containerElement.clientHeight
        
        this.rendererCamera.aspect = width/height
        this.rendererCamera.updateProjectionMatrix()
        this.renderer.setSize(width, height)
    }

    devInit() {        
        var geom = new THREE.BoxGeometry()
        var mat = new THREE.MeshBasicMaterial({color: 0x00ff00, wireframe: true})
        this.obj = new THREE.Mesh(geom, mat)
        this.scene.add(this.obj)

        this.rendererCamera.position.z = 5
        console.log(this.scene)
    }

    devRenderLoop() {
        this.obj.rotation.x += 0.01
        this.obj.rotation.y += 0.01
        this.obj.rotation.z += 0.01
    }
}

module.exports = Viewer;