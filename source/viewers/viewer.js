THREE = require("three")
ResizeSensor = require("css-element-queries/src/ResizeSensor")
ViewerCamera = require("../cameras/viewerCamera")
PlayerModifier = require("../modifiers/player")
ConstantRotationModifier = require("../modifiers/constant_rotation")
VelocityDragModifier = require("../modifiers/velocity_drag")
BaseObject = require("../objects/base_object")
TestObject = require("../objects/test_object")
require("./viewer.css")

class ObjectArray {
    constructor(viewer, listOfObjects=[]){
        this.viewer = viewer
        this._listOfObjects=listOfObjects
        this._listOfObjects.forEach(x => this.add(x))
    }
    add(object){
        object.load(this.viewer)
        this._listOfObjects.push(object)
    }
    remove(object){
        object.unload(this.viewer)
        this._listOfObjects.splice(this._listOfObjects.indexOf(object), 1)
    }
    update(dt){
        this._listOfObjects.forEach(object => object.update(dt))
    }
}

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

        this.objects = new ObjectArray(this)

        this.devInit()
        this.renderClock = new THREE.Clock()
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
        var dt = this.renderClock.getDelta()
        this.objects.update(dt)
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

    add(object) {
        this.objects.add(object)
    }

    remove(object) {
        this.objects.remove(object)
    }

    devInit() {        
        var o = new TestObject()
        this.add(o)
        
        var m = new PlayerModifier()
        o.modifiers.add(m)

        var d = new VelocityDragModifier()
        o.modifiers.add(d)

        this.rendererCamera.position.z = 5
        console.log(this)
    }

    devRenderLoop() {
    }
}



module.exports = Viewer;