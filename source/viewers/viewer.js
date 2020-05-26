THREE = require("three")
ResizeSensor = require("css-element-queries/src/ResizeSensor")
ThreeLoader = require('@pnext/three-loader')
ObjectArray = require("../arrays/ObjectArray")
// PCDLoader = require("../loaders/PCDLoader")

require("./viewer.css")

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

        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.domElement.className += "vaporViewer"
        this.containerElement.appendChild(this.renderer.domElement)
        this.renderer.setSize(this.containerElement.scrollWidth, this.containerElement.scrollHeight)

        var onContainerElementResizeBound = this.onContainerElementResize.bind(this)
        this.containerElementResizeListener = new ResizeSensor(containerElement, onContainerElementResizeBound)

        this.scene = new THREE.Scene()
        this.rendererCamera = undefined

        this.objects = new ObjectArray(this)
        this.collisionList = []

        var gl = this.renderer.domElement.getContext('webgl')
        gl.getExtension('EXT_frag_depth')
        gl.getExtension('WEBGL_depth_texture')
        gl.getExtension('OES_vertex_array_object')

        this.potree = new ThreeLoader.Potree()
        this.potreePointClouds = []

        // this.PCDLoader = new PCDLoader()
        this.renderClock = new THREE.Clock()
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
            this.potree.updatePointClouds(this.potreePointClouds, this.rendererCamera, this.renderer)
            this.renderer.render(this.scene, this.rendererCamera)
            this.skippedRender = false
        } else {
            if (!this.skippedRender) {
                // console.log("No camera set. Skipping render.")
                this.skippedRender = true
            }
        }
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
        object.modifiers.flushDeferredLoads()
    }

    remove(object) {
        this.objects.remove(object)
    }
}



module.exports = Viewer;