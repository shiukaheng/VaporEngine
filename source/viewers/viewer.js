var THREE = require("three")
var ResizeSensor = require("css-element-queries/src/ResizeSensor")
var ThreeLoader = require('@pnext/three-loader')
var ObjectArray = require("../arrays/ObjectArray")
var Subscription = require("../utils/Subscription")
var {Serializable, DeserializationObjectContainer} = require("../Serialization")
var VRButton = require("../utils/VRButton")


require("./viewer.css")

class SettingsInterface{
    constructor(viewer) {
        this._viewer = viewer
    }
    _exportSettings() {
        return {
            version: this.version,
            activeCameraUUID: this.activeCameraUUID,
            potreePointBudget: this.potreePointBudget
        }
    }
    _importSettings(settingDict) {
        this.activeCameraUUID = this.activeCameraUUID
        this.potreePointBudget = this.potreePointBudget
    }

    get version() {
        return "1.0"
    }
    get activeCameraUUID() {
        return this._viewer.sourceCamera.args.uuid
    }
    set activeCameraUUID(uuid) {
        this._viewer.changeCamera(this._viewer.lookupUUID(uuid))
        
    }
    get potreePointBudget() {
        return this._viewer.potree.pointBudget
    }
    set potreePointBudget(pointBudget) {
        this._viewer.potree.pointBudget = pointBudget
    }
}

class ViewerSaveContainer {
    /**
     *  Container that saves and loads viewer settings and scene
     */
    constructor() {
        // These values should not be opened or accessed, rather it should be handled by the Viewer class
        this._openedInViewer = false
        this._metadata = {
            version: "1.0",
            activeCameraUUID: null,
            potreePointBudget: 1000000,
        }
        this._objects = new ObjectArray()
    }

    /** Exports state into a serialized form */
    export() {
    }

    /** Resets container and imports serialized state */
    import(serializedJSON) {
        this.reset()
        this.append(serializedJSON, true)
    }

    /** Adds content of serialized state to current container */
    append(serializedJSON, cloneMeta=false) {

    }

    reset() {

    }

    static decodeSerializedJSON(serializedJSON) {

    }

    static encodeObject(object) {

    }
}

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
        this.renderer = new THREE.WebGL1Renderer({antialias: true});
        this.renderer.domElement.className += "vaporViewer"
        this.containerElement.appendChild(this.renderer.domElement)
        this.renderer.setSize(this.containerElement.scrollWidth, this.containerElement.scrollHeight)
        var onContainerElementResizeBound = this.onContainerElementResize.bind(this)
        this.containerElementResizeListener = new ResizeSensor(containerElement, onContainerElementResizeBound)
        this.renderClock = new THREE.Clock() // clock to calculate time between frames, used for modifiers

        // Get required WebGL extensions
        var gl = this.renderer.getContext('webgl')
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
        this.settings = new SettingsInterface(this)
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
            if (this.hasPointerLock) {
                e.preventDefault()
                e.stopPropagation()
                keyHandler(e.keyCode, true)
            }
        }
        var onKeyDown = onKeyDown.bind(this)
        function onKeyUp(e) {
            if (this.hasPointerLock) {
                e.preventDefault()
                e.stopPropagation()
                keyHandler(e.keyCode, false)
            }
        }
        var onKeyUp = onKeyUp.bind(this)
        document.addEventListener('keydown', onKeyDown, false)
        document.addEventListener('keyup', onKeyUp, false)
        this.removeListeners = function() {
            document.removeEventListener('keydown', onKeyDown, false)
            document.removeEventListener('keyup', onKeyUp, false)
        }

        // Point controls input initialization
        this.pointerlock = false
        var scope = this
        this.renderer.domElement.addEventListener("click", ()=>{
            scope.renderer.domElement.requestPointerLock()
        })

        document.addEventListener('pointerlockerror', (event) => {
            console.log(event);
        });

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

        // Enable XR
        this.renderer.xr.enabled = true
        document.body.appendChild(VRButton.createButton(this.renderer))
        
    }

    // Internal functions

    /** Render loop */
    renderLoop() {
        var dt = this.renderClock.getDelta()
        this.objects.update(dt, this._updatePlayerOnly)
        if (this.sourceCamera) {
            if (this.skippedRender) {
                this.onContainerElementResize()
            }
            // Copy source camera to renderer camera, this is so that the rendering camera never actually changes.
            this.rendererCamera.copy(this.sourceCamera)
            this.rendererCamera.position.setFromMatrixPosition(this.sourceCamera.matrixWorld)
            this.rendererCamera.rotation.setFromRotationMatrix(this.sourceCamera.matrixWorld)

            // Point culling for Potree clouds
            if (this.renderer.xr.isPresenting) {
                this.potree.updatePointClouds(this.potreePointClouds, this.renderer.xr.getCamera(this.rendererCamera), this.renderer) // This works but this.renderer.getCamera is undocumented. Maybe there's a better away?
            } else {
                this.potree.updatePointClouds(this.potreePointClouds, this.rendererCamera, this.renderer)
            }

            // Render stuff
            if (this.renderer.xr.isPresenting) {
                this.renderer.render(this.scene, this.sourceCamera)
            } else {
                this.renderer.render(this.scene, this.rendererCamera) // Somehow, the XR camera doesnt follow the rendererCamera..
            }
            

            // Update flags
            this.skippedRender = false
        } else {
            if (!this.skippedRender) {
                // console.log("No camera set. Skipping render.")
                this.skippedRender = true
            }
        }
    }

    /** Callback function when container element for canvas is resized */
    onContainerElementResize() {
        var width = this.containerElement.clientWidth
        var height = this.containerElement.clientHeight
        
        try {
            this.renderer.setSize(width, height)
            this.sourceCamera.aspect = width/height
            this.sourceCamera.updateProjectionMatrix()
        }
        catch(error) {
            if (error instanceof TypeError) {
                // console.log("TypeError while attempting to change camera parameters. Likely because camera is not set!")
            } else {
                throw(error)
            }
        }
    }

    // Accessor functions

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

    // External functions

    /** Starts rendering loop with requestAnimationFrame, calls renderLoop method */
    startRender() {
        this.renderer.setAnimationLoop(this.renderLoop.bind(this))
    }

    /** Pauses rendering loop */
    pauseRender() {
        this.renderer.setAnimationLoop(null)
    }

    /** Gets state of key */
    getKeyState(keyCode) {
        if (this.keyPressed[`key${keyCode}`]) {
            return true
        } else {
            return false
        }
    }

    /** Adds objects to viewer */
    add(object) {
        this.objects.add(object)
    }

    /** Removes objects to viewer */
    remove(object) {
        this.objects.remove(object)
    }

    /** Calls callback function once when user interacts with viewer in any way */
    queueForFirstInteraction(method) {
        if (this.firstInteraction) {
            method()
        } else {
            this.firstInteractionQueue.push(method)
        }
    }

    /** Exports save */
    export() {
        var rawSave = {
            settings: this.settings._exportSettings(),
            objects: this.objects
        }
        return btoa(JSON.stringify(Serializable.serializeElement(rawSave)))
    }

    /** Append objects from exported save */
    append(save) {
        var rawSave = this.deserializationContainer.deserializeWithDependencies(JSON.parse(atob(save)))
        rawSave.objects.forEach(object => {
            this.objects.add(object)
        })
    }

    /** Clears all objects from viewer */
    clear() {
        this.objects.unload()
        this.deserializationContainer = new DeserializationObjectContainer()
        this.objects = new ObjectArray()
        this.objects.load(this)
    }

    applySettingsFromSave(save) {
        var rawSave = this.deserializationContainer.deserializeWithDependencies(JSON.parse(atob(save)))
        this.settings.import(rawSave.settings)
    }

    /** Imports save */
    import(save) {
        if (save.settings.version !== this.settings.version) {
            throw "Save file version not compatible."
        }
        this.objects.unload()
        try {
            var object = JSON.parse(atob(save))
        } catch (e) {
            throw "Error reading save"
        }
        this.deserializationContainer = new DeserializationObjectContainer()
        var rawSave = this.deserializationContainer.deserializeWithDependencies(JSON.parse(atob(save)))
        this.objects = rawSave.objects
        this.objects.load(this)
    }

    /** Exports serialized JSON of object array of viewer */
    exportJSON() {
        return btoa(JSON.stringify(this.objects.serializeWithDependencies()))
    }

    /** Clears viewer, then imports serialized JSON of object array of viewer */
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

    /** Sets active camera to camera specified */
    changeCamera(camera) {
        this.sourceCamera = camera
        this.onContainerElementResize()
    }

    // Todo:

    // URGENT: Demo
    // Create pointShape, pointSize, autoPointSize arguments
    // Make 3D video functional WITH positional audio
    // Enter VR button
    // Add "enterVR" and "exitVR" method to viewer (hacky and must not be used later on in development)
    // Hand tracking??`

    // Replace importNewJSON and exportJSON functionality by integrating ViewerSave object
    // Improve camera handling by explicitly using BaseCameraObjects, camera setting functionality, handling no camera
    // In EditorViewer, modify the rendering loop so that it will always use an external camera and also visualize existing cameras using CameraHelpers
    // Create and check argument setting / checking / default values
    // Create editor
    // Create point and pick object selection
    // Use axis helper to help transformation, rotation and scaling
    // Live argument modification (if does not allow modification, respawn object)
    // Create events object that can be listened to (in viewer and objects)
    // Switch player control modes on the viewer: types -> ["dummy", "fps", "ar", "vr", "touch", "joystick"]
    // Create 3D video object based off of Depthkit
    // Update Potree (long term)
    // Create "methods" object for each SerializableObject, which makes interfacing with objects easier.
    //   - hide / show
    // Create new serializable classes that will be replaced with dictionaries (but allow custom get / set / apply functionalities)


}



module.exports = Viewer;