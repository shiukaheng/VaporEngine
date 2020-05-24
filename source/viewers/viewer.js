THREE = require("three")
ResizeSensor = require("css-element-queries/src/ResizeSensor")
ViewerCamera = require("../cameras/viewerCamera")
PlayerModifier = require("../modifiers/player")
ConstantRotationModifier = require("../modifiers/constant_rotation")
VelocityDragModifier = require("../modifiers/velocity_drag")
BaseObject = require("../objects/base_object")
BasePhysicalObject = require("../objects/base_physical_object")
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
        this.skippedRender = false
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
        this.rendererCamera = undefined

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
        if (this.rendererCamera) {
            if (this.skippedRender) {
                this.onContainerElementResize()
            }
            this.renderer.render(this.scene, this.rendererCamera)
            this.skippedRender = false
        } else {
            if (!this.skippedRender) {
                console.log("No camera set. Skipping render.")
                this.skippedRender = true
            }
        }
        this.devRenderLoop()
    }

    onContainerElementResize() {
        var width = this.containerElement.clientWidth
        var height = this.containerElement.clientHeight
        
        try {
            this.rendererCamera.aspect = width/height
            this.rendererCamera.updateProjectionMatrix()
            this.renderer.setSize(width, height)
        }
        catch(error) {
            if (error instanceof TypeError) {
                // console.log("TypeError while attempting to change camera parameters. Likely because camera is not set!")
            } else {
                throw(error)
            }
        }
    }

    add(object) {
        this.objects.add(object)
    }

    remove(object) {
        this.objects.remove(object)
    }

    devInit() {       
        var t = new TestObject()
        this.add(t)

        t.reference.scale.x = 0.5
        t.modifiers.add(new ConstantRotationModifier(new THREE.Vector3(0.1,1,0.1)))

        var p = new BasePhysicalObject()
        this.add(p)
        
        var m = new PlayerModifier()
        p.modifiers.add(m)

        var d = new VelocityDragModifier(0.9)
        p.modifiers.add(d)
    }

    devRenderLoop() {
    }
}



module.exports = Viewer;