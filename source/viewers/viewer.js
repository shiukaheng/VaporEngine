var THREE = require("three")
var ResizeSensor = require("css-element-queries/src/ResizeSensor")
var ThreeLoader = require('@pnext/three-loader')
var ObjectArray = require("../arrays/ObjectArray")
var Subscription = require("../utils/Subscription")
var {Serializable, DeserializationObjectContainer} = require("../Serialization")


require("./viewer.css")

/** Viewer class that binds to a container element */
class Viewer {
    /**
     * Used to construct a viewer
     * @param {Element} containerElement [Canvas element that the viewer will render to]
     */
    constructor(containerElement) {
        // Set default variables for renderer
        this.pauseRenderFlag = false
        this.skippedRender = false
        this.containerElement = containerElement

        // Initialize renderer
        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.domElement.className += "vaporViewer"
        this.containerElement.appendChild(this.renderer.domElement)
        this.renderer.setSize(this.containerElement.scrollWidth, this.containerElement.scrollHeight)
        var onContainerElementResizeBound = this.onContainerElementResize.bind(this)
        this.containerElementResizeListener = new ResizeSensor(containerElement, onContainerElementResizeBound)
        this.renderClock = new THREE.Clock() // clock to calculate time between frames, used for modifiers

        // Get required WebGL extensions
        var gl = this.renderer.domElement.getContext('webgl')
        Object.defineProperty(this, "splatCapable", {
            value: (gl.getExtension('EXT_frag_depth')&&gl.getExtension('WEBGL_depth_texture')&&gl.getExtension('OES_vertex_array_object')),
            writable: false
        })        

        // Initialize scene, renderer camera, object array, collision detection, interact object variables
        // TODO: Move collision detection, interact object processing to global modifiers
        this.scene = new THREE.Scene()
        this.sourceCamera = undefined
        this.rendererCamera = new THREE.PerspectiveCamera()
        this.scene.add(this.rendererCamera)
        this.scene.add(new THREE.AmbientLight("white"))
        this.objects = new ObjectArray()
        this.objects.load(this)
        this.collisionList = []
        this.nearestInteractObject = undefined

        // Initialize Potree (used to cull point clouds)
        this.potree = new ThreeLoader.Potree()
        this.potreePointClouds = []

        // this.PCDLoader = new PCDLoader()

        // Keyboard input initialization
        this.keyPressed = {}
        var scope = this
        function keyHandler(keyCode, boolean) {
            if (scope._allowUserControl) {
                scope.keyPressed[`key${keyCode}`] = boolean
            }
        }
        function onKeyDown(e) {
            if (this.pointerlock) {
                e.preventDefault()
                e.stopPropagation()
                keyHandler(e.keyCode, true)
            }
        }
        function onKeyUp(e) {
            if (this.pointerlock) {
                e.preventDefault()
                e.stopPropagation()
                keyHandler(e.keyCode, false)
            }
        }
        document.addEventListener('keydown', onKeyDown, false)
        document.addEventListener('keyup', onKeyUp, false)
        this.removeListeners = function() {
            document.removeEventListener('keydown', onKeyDown, false)
            document.removeEventListener('keyup', onKeyUp, false)
        }

        // Point controls input initialization
        this.pointerlock = false
        var scope = this
        this.renderer.domElement.onclick = function() {
            scope.renderer.domElement.requestPointerLock()
        }

        // this.pointerControlsSubscribers = []
        // this.pointerControlsStateSubscribers = []

        this.pointerControlSubscription = new Subscription()
        this.pointerControlStateSubscription = new Subscription()

        var lockChangeAlert = function() {
            if (document.pointerLockElement === this.renderer.domElement ||
                document.mozPointerLockElement === this.renderer.domElement) {
              this.hasPointerLock=true
              document.addEventListener("mousemove", this.pointerControlSubscription.update, false)
            } else {
              this.hasPointerLock=false
              document.removeEventListener("mousemove", this.pointerControlSubscription.update, false)
            }
            if (this._allowUserControl) {
                this.pointerControlStateSubscription.update(this.pointerlock)
            }
        }.bind(this)

        document.addEventListener('pointerlockchange', lockChangeAlert, false)
        document.addEventListener('mozpointerlockchange', lockChangeAlert, false)

        // Positional audio initialization
        this.audioListener = new THREE.AudioListener()
        this.rendererCamera.add(this.audioListener)

        // Page interaction checking initialization, used for starting objects with audio. Unreliable for that purpose though!
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

        // Some extra flags
        this._allowUserControl = true
        this._updatePlayerOnly = false
        this.deserializationContainer = new DeserializationObjectContainer()
        
        
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
        this.objects.update(dt, this._updatePlayerOnly)
        if (this.sourceCamera) {
            if (this.skippedRender) {
                this.onContainerElementResize()
            }
            this.rendererCamera.copy(this.sourceCamera)
            this.rendererCamera.position.setFromMatrixPosition(this.sourceCamera.matrixWorld)
            this.rendererCamera.rotation.setFromRotationMatrix(this.sourceCamera.matrixWorld)
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
            this.sourceCamera.aspect = width/height
            this.sourceCamera.updateProjectionMatrix()
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

    exportJSON() {
        return btoa(JSON.stringify(this.objects.serializeWithDependencies()))
    }

    importNewJSON(json, onSuccess=()=>{}, onFailure=()=>{}) {
        this.objects.unload()
        try {
            var object = JSON.parse(atob(json))
        } catch (e) {
            onFailure(e) // Only checks whether it is valid JSON
            return
        }
        this.deserializationContainer = new DeserializationObjectContainer()
        this.objects = this.deserializationContainer.deserializeWithDependencies(object)
        this.objects.load(this)
        onSuccess()
    }

    cloneTest() {
        this.importNewJSON(this.exportJSON())
    }

    changeCamera(camera) {
        this.sourceCamera = camera
        this.onContainerElementResize()
    }

    set allowUserControl(bool) {
        if (typeof bool !== "boolean") {
            throw new TypeError("allowUserControl must be bool")
        }
        this._allowUserControl = bool
        this.keyPressed = {}
    }

    get allowUserControl() {
        return this._allowUserControl
    }

    get isViewer() {
        return (this instanceof Viewer)
    }

    set updatePlayerOnly(bool) {
        if (typeof bool !== "boolean") {
            throw new TypeError("updatePlayerOnly must be bool")
        }
        this._updatePlayerOnly = bool
    }

    get updatePlayerOnly() {
        return this._updatePlayerOnly
    }

}



module.exports = Viewer;