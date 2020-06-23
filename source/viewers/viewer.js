THREE = require("three")
ResizeSensor = require("css-element-queries/src/ResizeSensor")
ThreeLoader = require('@pnext/three-loader')
ObjectArray = require("../arrays/ObjectArray")
// PCDLoader = require("../loaders/PCDLoader")

Stats = require('stats.js')

require("./viewer.css")

/** Viewer class that binds to a container element */
class Viewer {
    /**
     * Used to construct a viewer
     * @param {Element} containerElement [Canvas element that the viewer will render to]
     */
    constructor(containerElement) {
        this.stats = new Stats()
        this.stats.showPanel(0)

        this.stats.dom.style.pointerEvents = "none" 
        document.body.appendChild(this.stats.dom)
    

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

        this.nearestInteractObject = undefined

        var gl = this.renderer.domElement.getContext('webgl')
        gl.getExtension('EXT_frag_depth')
        gl.getExtension('WEBGL_depth_texture')
        gl.getExtension('OES_vertex_array_object')

        this.potree = new ThreeLoader.Potree()
        this.potreePointClouds = []

        // this.PCDLoader = new PCDLoader()
        this.renderClock = new THREE.Clock()

        this.keyPressed = {}
        var scope = this
        
        // Keyboard input
        function keyHandler(keyCode, boolean) {
            scope.keyPressed[`key${keyCode}`] = boolean
        }

        function onKeyDown(e) {
            e.preventDefault()
            e.stopPropagation()
            keyHandler(e.keyCode, true)
        }

        function onKeyUp(e) {
            e.preventDefault()
            e.stopPropagation()
            keyHandler(e.keyCode, false)
        }

        document.addEventListener('keydown', onKeyDown, false)
        document.addEventListener('keyup', onKeyUp, false)

        this.removeListeners = function() {
            document.removeEventListener('keydown', onKeyDown, false)
            document.removeEventListener('keyup', onKeyUp, false)
        }

        this.audioListener = new THREE.AudioListener()
        this.firstInteraction = false
        this.firstInteractionQueue = []

        var events = ["click"]
        events.forEach((eventName)=>{
            window.addEventListener(eventName, ()=>{
                if(!this.firstInteraction) {
                    this.firstInteraction = true
                    this.firstInteractionQueue.forEach(method => {method()})
                    if (this.audioListener) {
                        this.audioListener.context.resume()
                    }
                }
            })
        })   

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
        this.stats.begin()
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
        this.stats.end()
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

    getKeyState(keyCode) {
        if (this.keyPressed[`key${keyCode}`]) {
            return true
        } else {
            return false
        }
    }

    add(object) {
        this.objects.add(object)
        object.modifiers.flushDeferredLoads()
    }

    remove(object) {
        this.objects.remove(object)
    }

    queueForFirstInteraction(method) {
        if (this.firstInteraction) {
            method()
        } else {
            this.firstInteractionQueue.push(method)
        }
    }

    updateFirstInteraction() {
    }

    changeCamera(camera) {
        this.rendererCamera = camera
        this.onContainerElementResize()
        var audioListener = this.audioListener
        if (this.audioListener.parent) {
            this.audioListener.parent.remove(this.viewer.audioListener)
        }
        camera.add(audioListener)
    }
}



module.exports = Viewer;