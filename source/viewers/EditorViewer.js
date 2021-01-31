var Viewer = require("./Viewer")
var ResizeSensor = require("css-element-queries/src/ResizeSensor")
var Serializable = require("../SerializationLib/Serializable")
var { TransformControls, TransformControlsGizmo, TransformControlsPlane } = require("../helpers/TransformControls");
var PlayerObject = require("../Objects/PlayerObject")
var ObjectArray = require("../arrays/ObjectArray")
var c2c = require("copy-to-clipboard")

var EditorViewerCss = require("./EditorViewer.css")

var scm = Serializable.getSerializableClassesManager()

function getObjectClassNames() {
    var r = []
    Object.keys(scm.classList).forEach(className=>{
        if (scm.classList[className].prototype instanceof scm.classList["BaseObject"]||className==="BaseObject") {
            r.push(className)
        }
    })
    return r
}

function createObject(className, args={}) {
    return new scm.classList[className](args)
}

function saveContent(fileContents, fileName)
{
    var link = document.createElement('a');
    link.download = fileName;
    link.href = 'data:,' + fileContents;
    link.click();
}

function openContent(callback) {

    var input = document.createElement("input")
    input.type = "file"
    input.click()

    var reader = new FileReader()
    reader.onload = (ev) => {
        callback(ev.target.result)
    }

    input.onchange = e => {
        reader.readAsText(e.target.files[0])
    }
}

//       Add Transform mode
//       Click to select (outline pass: https://stackoverflow.com/questions/26341396/outline-a-3d-object-in-three-js)
//       List to select / search to select?

class HistoryState{
    constructor(json, description) {
        this.json = json
        this.description = description
    }
}

class EditorViewer extends Viewer {
    constructor(containerElement) {
        super(containerElement, false)

        this.editorObjects = new ObjectArray()
        this.editorObjects.load(this)

        this._editorPlayerView = true
        this.editorPlayer = new PlayerObject()
        this.editorPlayer.position.y = 1.8
        // this.editorPlayer.position.z = 4
        this.editorObjects.add(this.editorPlayer)
        // this.add(this.editorPlayer)


        this.floorMat = new THREE.MeshBasicMaterial({wireframe:true, color:"grey"})
        this.floorGeom = new THREE.PlaneGeometry(200,200,100,100)
        this.floor = new THREE.Mesh(this.floorGeom, this.floorMat)
        this.floor.rotation.x = Math.PI/2
        this.scene.add(this.floor)

        this.transformControls = new TransformControls(this.rendererCamera, this.renderer.domElement);
        this.scene.add(this.transformControls)

        this.UIContainer = document.createElement("div")
        this.UIContainer.classList.add("vapor-editor-overlay")
        this.containerElement.appendChild(this.UIContainer)

        this.historyList = []
        this.currentHistoryIndex = undefined

        this.objectEditors = new Set()

        // Container
        var uiRowStack = new RowStack([], true)
        this.UIContainer.appendChild(uiRowStack.domElement)
        // Main menu
        var mainMenu = new Row(
            [
                new Button(()=>{uiRowStack.add(classCreationMenu)},"Add"), 
                new Button(()=>{uiRowStack.add(createListSelect())},"Select"), 
                new Button(()=>{this.stepHistory(-1)}, "Undo"), 
                new Button(()=>{this.stepHistory(1)}, "Redo"), 
                new Button(()=>{
                    saveContent(this.export(), `${window.prompt("File name", "Untitled")}.vapor`) // TODO: Hacky, make it better..
                }, "Save"), 
                new Button(()=>{
                    openContent((data)=>{
                        this.import(data)
                    })
                }, "Open")]
                
                )
        uiRowStack.add(mainMenu)
        // Main menu -> Add
        var classesCreateData = []
        getObjectClassNames().forEach((className) => {
            classesCreateData.push({
                "text": className,
                "onclick": ()=>{
                    var newObjectInit = createObject(className)
                    newObjectInit.position.copy(this.editorPlayer.position)
                    var uuid = newObjectInit.uuid
                    this.add(newObjectInit)
                    
                    this.transformControls.addEventListener("objectChange", ()=>{
                        this.objectEditors.forEach(oe => {
                            oe.updateTransform()
                        })
                    })
                    var objectEditor = new ObjectEditor(this, newObjectInit.uuid, ()=>{
                        uiRowStack.remove(objectEditor)
                        this.saveHistory(`Added ${this.lookupUUID(uuid).args.name} [${this.lookupUUID(uuid).args.className}] <${uuid}>`)
                    }, undefined,
                    ()=>{
                        uiRowStack.remove(objectEditor)
                        this.exitEditTransform()
                    },
                    ()=>{
                        uiRowStack.remove(objectEditor)
                    }, undefined, undefined)
                    uiRowStack.remove(classCreationMenu)
                    uiRowStack.add(objectEditor)
                }
            })
        })
        var classCreationMenu = new SearchableList(classesCreateData, ()=>{uiRowStack.remove(classCreationMenu)})
        // Main menu -> Select
        var createListSelect = () => {
            var objectList = []
            this.objects.forEach(object => {
                if (object !== this.editorPlayer) {
                    objectList.push({
                        "text": `${object.args.name} [${object.args.className}] <${object.args.uuid}>`,
                        "onclick": ()=>{
                            uiRowStack.remove(elem)
                            var uuid = object.args.uuid
                            var objectEditor = new ObjectEditor(
                                this, 
                                uuid,
                                // onDone 
                                ()=>{
                                    uiRowStack.remove(objectEditor)
                                    this.saveHistory(`Modified ${this.lookupUUID(uuid).args.name} [${this.lookupUUID(uuid).args.className}] <${uuid}>`)
                                }, 
                                // onApply - forgot what it does..
                                undefined, 
                                // onCancel
                                ()=>{
                                    uiRowStack.remove(objectEditor)
                                }, 
                                ()=>{uiRowStack.remove(objectEditor)}, 
                                true)
                            uiRowStack.add(objectEditor)
                        },
                        "onmouseover": ()=>{"highlight / outline object"},
                        "onmouseout": ()=>{"un-highlight / un-outline object"},
                        "distance": 0 // get distance of activecamera to object, later sort list using this key, in increasing order
                    })
                }
            })
            var elem = new SearchableList(objectList, ()=>{uiRowStack.remove(elem)})
            return elem
        }
        this.onContainerElementResizeEditor = this.onContainerElementResizeEditor.bind(this)
        this.containerElementResizeListener = new ResizeSensor(containerElement, this.onContainerElementResizeEditor)
        this.saveHistory("Initial state")
    }
    saveHistory(description) {
        if (this.currentHistoryIndex === undefined) {
            this.historyList.push(new HistoryState(this.export(), description))
            this.currentHistoryIndex = 0
        } else {
            if (this.currentHistoryIndex === this.historyList.length-1) {
                // If no redo steps, add new history and incrememnt currentHistoryIndex
                this.historyList.push(new HistoryState(this.export(), description))
                this.currentHistoryIndex += 1
            } else {
                // If has redo steps, remove all of them.
                this.historyList = this.historyList.slice(0, this.currentHistoryIndex)
                this.historyList.push(new HistoryState(this.export(), description))
                this.currentHistoryIndex = this.historyList.length-1
            }
        }
        console.log(`Saved history state: ${description}`)
    }
    loadCurrentHistoryState() {
        if (this.currentHistoryIndex===undefined) {
            console.warn("No saved history states")
        } else {
            this.import(this.historyList[this.currentHistoryIndex].json, false)
        }
    }
    stepHistory(steps=-1) {
        var newIndex = this.currentHistoryIndex+steps
        if ((newIndex>=0) && (newIndex<=(this.historyList.length-1))) {
            this.currentHistoryIndex = newIndex
            this.loadCurrentHistoryState()
        } else {
            if (steps>0) {
                console.warn("To little history states to redo")
            }
            if (steps<0) {
                console.warn("To little history states to undo")
            }
        }
    }

    editTransformUUID(uuid) { // Todo: Create different modes,  first person OR mouse; also, add crosshair during first person mode. Also, add rotation and scaling functionality.
        this.allowUserControl = false
        this.allowPointerLock = false
        this.transformControls.attach(this.lookupUUID(uuid).container)
    }
    exitEditTransform() {
        this.transformControls.detach()
        this.allowUserControl = true
        this.allowPointerLock = true
    }
    // Todo: Modify render loop; setCamera function also create cameraHelpers for each non-active camera

    /** Render loop */
    renderLoop() {
        if (this.editorPlayerView) {
            var dt = this.renderClock.getDelta()
            this.objects.update(dt, this._updatePlayerOnly)
            this.editorObjects.update(dt, this._updatePlayerOnly)
            // this.editorObjectArray.update(dt, this._updatePlayerOnly)
            if (this.editorPlayer.playerModifier.camera) {
                if (this.skippedRender) {
                    this.onContainerElementResize()
                }
                // Copy source camera to renderer camera, this is so that the rendering camera never actually changes. Easier for post-processing.
                this.rendererCamera.copy(this.editorPlayer.playerModifier.camera)
                this.rendererCamera.position.setFromMatrixPosition(this.editorPlayer.playerModifier.camera.matrixWorld)
                this.rendererCamera.rotation.setFromRotationMatrix(this.editorPlayer.playerModifier.camera.matrixWorld)
                this.rendererCamera.fov = this.editorPlayer.playerModifier.camera.fov
    
                // Point culling for Potree clouds
                if (this.renderer.xr.isPresenting) {
                    this.potree.updatePointClouds(this.potreePointClouds, this.renderer.xr.getCamera(this.rendererCamera), this.renderer) // This works but this.renderer.getCamera is undocumented. Maybe there's a better away?
                } else {
                    this.potree.updatePointClouds(this.potreePointClouds, this.rendererCamera, this.renderer)
                }
    
                // Render stuff
                if (this.renderer.xr.isPresenting) {
                    this.renderer.render(this.scene, this.editorPlayer.playerModifier.camera)
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
        } else {
            super.renderLoop()
        }
    }

    onContainerElementResizeEditor() {
        var width = this.containerElement.clientWidth
        var height = this.containerElement.clientHeight

        this.editorPlayer.playerModifier.camera.aspect = width/height
        this.editorPlayer.playerModifier.camera.updateProjectionMatrix()
    }

    import(json, saveHistory=true) {
        super.import(json)
        if (saveHistory===true) {
            this.saveHistory("Imported json")
        }
    }

    append(json, saveHistory=true) {
        super.append(json)
        if (saveHistory===true) {
            this.saveHistory("Appended json")
        }
    }
    
    set editorPlayerView(val) {
        if (typeof val === "boolean") {
            this._editorPlayerView = val
        }
    }
    get editorPlayerView() {
        return this._editorPlayerView
    }
}

class UIElement {
    constructor() {
        this._disabled = false
        this.parent = null
        this._domElement = this.createDOMElement()
    }
    createDOMElement() {
        return document.createElement("div")
    }
    addTo(elem) {
        if (!(elem instanceof containerUIElement)) {
            throw new Error("invalid element")
        }
        elem.domElement.appendChild(this.domElement)
    }
    removeFromParent() {
        if (this.parent === null) {
            throw new Error("element has no parent")
        }
        this.parent.domElement.removeChild(this.domElement)
    }
    get disabled() {
        return this._disabled
    }
    set disabled(bool) {
        this._disabled = bool
    }
    get domElement() {
        return this._domElement
    }
}

class containerUIElement extends UIElement {
    constructor(elements=[]) {
        elements.forEach(element => {
            this.add(element)
        })
    }
    add(elem) {
        elem.addTo(this)
    }
    remove(elem) {
        if (!(elem.parent === this)) {
            throw new Error("element not child")
        }
        elem.removeFromParent()
    }
}

class Button {
    constructor(buttonFunc=()=>{}, text="Button", fontSize="18px", disabled=false) {
        this.function = buttonFunc
        this._disabled = disabled
        this.domElement = document.createElement("div")
        this.domElement.innerHTML = text
        this.domElement.classList.add("vapor-editor-button")
        this.domElement.style.fontSize = fontSize
        this.domElement.onclick = ()=>{
            if (!this.domElement.matches(".vapor-editor-disabled.vapor-editor-button, .vapor-editor-disabled *.vapor-editor-button")) {
                this.disabled = true
                buttonFunc()
                this.disabled = false
            }
        }
    }
    get text() {
        return this.domElement.innerHTML
    }
    set text(value) {
        this.domElement.innerHTML = value
    }
    get disabled() {
        return this._disabled
    }
    set disabled(value) {
        if (value===true) {
            this.domElement.classList.add("vapor-editor-disabled")
            this._disabled = true
        } else {
            this.domElement.classList.remove("vapor-editor-disabled")
            this._disabled = false
        }
    }
    get fontSize() {
        return this.domElement.style.fontSize
    }
    set fontSize(v) {
        this.domElement.style.fontSize = v
    }
}

class Row {
    constructor(listOfButtons=[]) {
        this._disabled = false
        this.domElement = document.createElement("div")
        this.domElement.classList.add("vapor-editor-button-row")
        listOfButtons.forEach(button=>{
            this.add(button)
        })
    }
    get disabled() {
        return this._disabled
    }
    set disabled(value) {
        if (value===true) {
            this.domElement.classList.add("vapor-editor-disabled")
            this._disabled = true
        } else {
            this.domElement.classList.remove("vapor-editor-disabled")
            this._disabled = false
        }
    }
    add(button) {
        this.domElement.appendChild(button.domElement)
        button.parent = this
    }
    remove(button) {
        if (button.parent !== this) {
            throw new Error("attempt to remove child from non-parent")
        }
        this.domElement.removeChild(button.domElement)
        button.parent = undefined
    }
}

class RowStack {
    constructor(listOfRows=[], onlyEnableLastRow=false) {
        this._disabled = false
        this._onlyEnableLastRow = onlyEnableLastRow
        this._rowList = []
        this.domElement = document.createElement("div")
        this.domElement.classList.add("vapor-editor-button-row-stack")
        listOfRows.forEach(rows=>{
            this.add(rows)
        })
    }
    get disabled() {
        return this._disabled
    }
    set disabled(value) {
        if (value===true) {
            this.domElement.classList.add("vapor-editor-disabled")
            this._disabled = true
        } else {
            this.domElement.classList.remove("vapor-editor-disabled")
            this._disabled = false
        }
    }
    add(row) {
        this.domElement.appendChild(row.domElement)
        this._rowList.push(row)
        if (this._onlyEnableLastRow) {
            this._rowList.slice(0,-1).forEach(row=>{
                row.disabled = true
            })
        }
        row.parent = this
    }
    remove(row) {
        if (row.parent !== this) {
            throw new Error("attempt to remove child from non-parent")
        }
        this.domElement.removeChild(row.domElement)
        this._rowList.pop()
        if (this._onlyEnableLastRow) {
            this._rowList.slice(-1).forEach(row=>{
                row.disabled = false
            })
        }
        row.parent = undefined
    }
}

function isFloat(val) {
    var floatRegex = /^-?\d+(?:[.,]\d*?)?$/;
    if (!floatRegex.test(val))
        return false;

    val = parseFloat(val);
    if (isNaN(val))
        return false;
    return true;
}

function isInt(val) {
    var intRegex = /^-?\d+$/;
    if (!intRegex.test(val))
        return false;

    var intVal = parseInt(val, 10);
    return parseFloat(val) == intVal && !isNaN(intVal);
}
 
class InputCell {
    constructor(interpType="string", defaultStr, valCheck=()=>{return true}, onNewInput=(value)=>{}, updateMode="blur"||"input") { // updateMode could be blur or input
        if (!(this.supportedInterpTypes.indexOf(interpType) >= 0)) {
            throw new Error("invalid interpType")
        }
        this.onFocus = this.onFocus.bind(this)
        this.onBlur = this.onBlur.bind(this)
        this.onInput = this.onInput.bind(this)
        this.update = this.update.bind(this)
        this.onNewInputCallback = onNewInput
        this._focus = false
        this.updateMode = updateMode

        this.interpType = interpType
        this._valCheck = valCheck
        this._inputValue = null
        var val = this.castStrToDestType(defaultStr)
        if (!(this.checkValue(val))) {
            // console.log(val) // debug
            throw Error("defaultStr failed to pass valCheck")
        }
        this._defaultValue = val
        this._valid = true

        this.domElement = document.createElement("input")
        this.domElement.type = "text"
        this.domElement.classList.add("vapor-editor-input")

        this.domElement.addEventListener("focus", this.onFocus)
        this.domElement.addEventListener("blur", this.onBlur)
        this.domElement.addEventListener("input", this.onInput)

        this.clearInput()
    }
    get supportedInterpTypes() {
        return ["string", "float", "int"]
    }
    castStrToDestType(str) {
        var error = new Error("failed to cast to type")
        switch(this.interpType) {
            case "string":
                return str
            case "float":
                if (!(isFloat(str))) {
                    throw error
                }
                return parseFloat(str)
            case "int":
                if (!(isInt(str))) {
                    throw error
                }
                return parseFloat(str)
        }
    }
    checkValue(val) {
        return this._valCheck(val)
    }
    checkValType(val) {
        switch(this.interpType) {
            case "string":
                return (typeof val === "string" || val instanceof String)
            case "int":
                return (typeof val === "number" && Number.isInteger(val))
            case "float":
                return (typeof val === "number")
        }
    }
    _invalidInput() {
        this._inputValue = null
        this._valid = false
        // Update element style to have red outline
        this.domElement.classList.add("vapor-editor-input-invalid")
        this.domElement.classList.remove("vapor-editor-input-default")
    }
    _setInput(val) {
        // Assumes value is of right type and is valid
        this._inputValue = val
        this._valid = true
        // Update element style and content
        this.domElement.classList.remove("vapor-editor-input-invalid")
        this.domElement.classList.remove("vapor-editor-input-default")
        this.domElement.value = val
    }
    clearInput() {
        this._inputValue = null
        this._valid = true
        // Update element content to greyed text of defaultVar
        this.domElement.classList.add("vapor-editor-input-default")
        this.domElement.classList.remove("vapor-editor-input-invalid")
        this.domElement.value = this._defaultValue
    }
    inputString(str) { // For when the cell is prompted with new input
        if (str==="") {
            this.clearInput()
        }
        var val
        try { // Test if it casts fine first
            val = this.castStrToDestType(str)
            // Then test if the value check function agrees
            if (this.checkValue(val)) {
                // If pass, update value
                this._setInput(val)
            } else {
                // If not then call invalidInput
                this._invalidInput()
            }
        } catch(err) {
            // Call invalidInput if failed to cast
            this._invalidInput()
        }
            
    }
    get value() {
        // if invalid, return undefined
        if (this.valid===true) {
            if (this._inputValue===null) {
                return this._defaultValue
            } else {
                return this._inputValue
            }
        } else {
            return null
        }
    }
    set value(val) {
        if (this.checkValType(val) && this.checkValue(val)) {
            this._setInput(val)
        } else {
            throw new Error("invalid value")
        }
    }
    get valid() {
        return this._valid
    }
    get empty() {
        return (this._inputValue===null && this._valid===true)
    }
    get focus() {
        return this._focus
    }
    get updateMode() {
        return this._updateMode
    }
    set updateMode(val) {
        if (!((val==="blur")||(val==="input"))) {
            throw "invalid value for updateMode"
        }
        this._updateMode = val
    }
    onFocus(e) {
        this._focus = true
        this.domElement.classList.remove("vapor-editor-input-invalid")
        this.domElement.classList.remove("vapor-editor-input-default")
        if (this.empty) {
            this.domElement.value = ""
        }
    }
    onBlur(e) {
        this._focus = false
        if (this.domElement.value === "") {
            this.clearInput()
            this.onNewInputCallback(this.value)
        } else {
            if (this.updateMode==="blur") {
                this.update()
            }
        }
    }
    onInput(e) {
        if (this.updateMode==="input") {
            this.update()
        }
    }
    update() {
        this.inputString(this.domElement.value)
        this.onNewInputCallback(this.value)
    }
}

class CheckBox {
    constructor(defaultVal, onChange=()=>{}) {
        this.onChange = onChange
        this.domElement = document.createElement("input")
        this.domElement.type = "checkbox"
        this.domElement.checked = defaultVal
        this.domElement.classList.add("vapor-editor-checkbox")
        this.domElement.addEventListener("change", (e)=>{this.onChange()})
    }
    get value() {
        return this.domElement.checked
    }
    set value(bool) {
        this.domElement.checked = bool
    }
}

class Label {
    constructor(text, fontColor="#FFFFFF", fontSize="18px") {
        this.domElement = document.createElement("div")
        this.domElement.classList.add("vapor-editor-label")
        this.domElement.textContent = text
        this.domElement.style.color = fontColor
        this.domElement.style.fontSize = fontSize
    }
    get text() {
        return this.domElement.innerHTML
    }
    set text(v) {
        this.domElement.innerHTML = v 
    }
    get fontColor() {
        return this.domElement.style.color
    }
    set fontColor(color) {
        this.domElement.style.color = color
    }
    get fontSize() {
        return this.domElement.style.fontSize
    }
    set fontSize(v) {
        this.domElement.style.fontSize = v
    }
}

class PositionCells {
    constructor(defaultVal, onBlur=()=>{}) {
        this.checkBlur = this.checkBlur.bind(this)
        this.onFocus = this.onFocus.bind(this)
        this.onBlur = this.onBlur.bind(this)
        this.onBlurCB = onBlur
        this._focus = false

        this._defaultVal = defaultVal

        this.xLabel = new Label("x")
        this.yLabel = new Label("y")
        this.zLabel = new Label("z")
        
        this.xInput = new InputCell("float", this.defaultVal.x, undefined, this.checkBlur)
        this.yInput = new InputCell("float", this.defaultVal.y, undefined, this.checkBlur)
        this.zInput = new InputCell("float", this.defaultVal.z, undefined, this.checkBlur)

        this.containerRow = new Row([this.xLabel, this.xInput, this.yLabel, this.yInput, this.zLabel, this.zInput])
        this.containerRow.domElement.classList.add("vapor-editor-grouped-cells-row")

        this.domElement = this.containerRow.domElement
    }
    checkBlur() {
        this._focus = (this.xInput.focus || this.yInput.focus || this.zInput.focus)
        if (this.focus) {
            this.onFocus()
        } else {
            this.onBlur()
        }
    }
    onFocus() {
    }
    onBlur() {
        this.onBlurCB()
    }
    get defaultVal(){
        return this._defaultVal
    }
    get focus() {
        return this._focus
    }
    get valid() {
        return (this.xInput.valid && this.yInput.valid && this.zInput.valid)
    }
    get value() {
        if (this.valid) {
            return {
                "x": this.xInput.value,
                "y": this.yInput.value,
                "z": this.zInput.value
            }
        } else {
            return null
        }
    }
    set value(object) {
        this.xInput.value = object.x
        this.yInput.value = object.y
        this.zInput.value = object.z
    }
}

class ScaleCells {
    constructor(defaultVal, onBlur=()=>{}) {
        this.checkBlur = this.checkBlur.bind(this)
        this.onFocus = this.onFocus.bind(this)
        this.onBlur = this.onBlur.bind(this)
        this.onBlurCB = onBlur
        this._focus = false

        this._defaultVal = defaultVal

        this.xLabel = new Label("x")
        this.yLabel = new Label("y")
        this.zLabel = new Label("z")
        
        this.xInput = new InputCell("float", this.defaultVal.x, undefined, this.checkBlur)
        this.yInput = new InputCell("float", this.defaultVal.y, undefined, this.checkBlur)
        this.zInput = new InputCell("float", this.defaultVal.z, undefined, this.checkBlur)

        this.containerRow = new Row([this.xLabel, this.xInput, this.yLabel, this.yInput, this.zLabel, this.zInput])
        this.containerRow.domElement.classList.add("vapor-editor-grouped-cells-row")

        this.domElement = this.containerRow.domElement
    }
    checkBlur() {
        this._focus = (this.xInput.focus || this.yInput.focus || this.zInput.focus)
        if (this.focus) {
            this.onFocus()
        } else {
            this.onBlur()
        }
    }
    onFocus() {
    }
    onBlur() {
        this.onBlurCB()
    }
    get defaultVal(){
        return this._defaultVal
    }
    get focus() {
        return this._focus
    }
    get valid() {
        return (this.xInput.valid && this.yInput.valid && this.zInput.valid)
    }
    get value() {
        if (this.valid) {
            return {
                "x": this.xInput.value,
                "y": this.yInput.value,
                "z": this.zInput.value
            }
        } else {
            return null
        }
    }
    set value(object) {
        this.xInput.value = object.x
        this.yInput.value = object.y
        this.zInput.value = object.z
    }
}

class RotationCells {
    constructor(defaultVal, onBlur=()=>{}) {
        this.checkBlur = this.checkBlur.bind(this)
        this.onFocus = this.onFocus.bind(this)
        this.onBlur = this.onBlur.bind(this)
        this.onBlurCB = onBlur
        this._focus = false

        this._defaultVal = defaultVal

        this.xLabel = new Label("x")
        this.yLabel = new Label("y")
        this.zLabel = new Label("z")
        this.orderLabel = new Label("order")
        
        this.xInput = new InputCell("float", this.defaultVal.x, undefined, this.checkBlur)
        this.yInput = new InputCell("float", this.defaultVal.y, undefined, this.checkBlur)
        this.zInput = new InputCell("float", this.defaultVal.z, undefined, this.checkBlur)
        this.orderInput = new InputCell("string", this.defaultVal.order, (order)=>{
            return (["XYZ", "YXZ", "ZXY", "XZY", "YZX", "ZYX"].indexOf(order.toUpperCase())>=0)
        }, this.checkBlur)

        this.containerRow = new Row([this.xLabel, this.xInput, this.yLabel, this.yInput, this.zLabel, this.zInput, this.orderLabel, this.orderInput])
        this.containerRow.domElement.classList.add("vapor-editor-grouped-cells-row")
        this.domElement = this.containerRow.domElement
    }
    checkBlur() {
        this._focus = (this.xInput.focus || this.yInput.focus || this.zInput.focus || this.orderInput.focus)
        if (this.focus) {
            this.onFocus()
        } else {
            this.onBlur()
        }
    }
    onFocus() {
    }
    onBlur() {
        this.onBlurCB()
    }
    get defaultVal(){
        return this._defaultVal
    }
    get focus() {
        return this._focus
    }
    get valid() {
        return (this.xInput.valid && this.yInput.valid && this.zInput.valid && this.orderInput.valid)
    }
    get value() {
        if (this.valid) {
            return {
                "x": this.xInput.value,
                "y": this.yInput.value,
                "z": this.zInput.value,
                "order": this.orderInput.value
            }
        } else {
            return null
        }
    }
    set value(object) {
        this.xInput.value = object.x
        this.yInput.value = object.y
        this.zInput.value = object.z
        this.orderInput.value = object.order
    }
}

class CloseButton extends Button {
    constructor(callback = ()=>{}, fontSize=undefined, disabled=false) {
        super(callback, "⨉", fontSize, disabled)
        this.domElement.classList.add("vapor-editor-close-button")
    }
}

class ObjectEditor {
    constructor(editorViewer, uuid, onDone=()=>{}, onApply=()=>{}, onCancel=()=>{}, onDelete=()=>{}, collapse=false, initAsDefault=true, allowDelete=true) {
        this.viewer = editorViewer
        this.viewer.objectEditors.add(this)
        this.viewer.editTransformUUID(uuid)
        this.close = this.close.bind(this)
        this.uuid = uuid
        this.object = this.viewer.lookupUUID(uuid)
        if (this.object.viewer===undefined) { // Should not happen as if UUID is visible, it should be in objectContaienr
            throw new Error("object has to be added into viewer")
        }
        this.onDone = onDone
        this.onApply = onApply
        this.onCancel = onCancel
        this.onDelete = onDelete
        this.valid = false
        this.checkForms = this.checkForms.bind(this)
        this.done = this.done.bind(this)
        this.delete = this.delete.bind(this)
        this._collapse = false
        var className = this.object.args.className
        // check if is valid Object class
        if (getObjectClassNames().indexOf(className) < 0) {
            throw new Error("invalid className")
        }
        this.targetClass = className
        var classMeta = scm.classArgMetaList[className]
        this.keysToEditDict = {}
        Object.keys(scm.classArgMetaList[className]).forEach(key => {
            var keyMeta = classMeta[key]
            // console.log(key, keyMeta) // debug
            if (["uuid", "className", "serialize"].indexOf(key)<0) {
                if (typeof keyMeta.defaultValue === "boolean") {
                    this.keysToEditDict[key] = {
                        "element": new CheckBox(this.viewer.lookupUUID(uuid).args[key], this.checkForms)
                    }
                }
                if ((typeof keyMeta.defaultValue === "number")||keyMeta.defaultValue instanceof Number) {
                    this.keysToEditDict[key] = {
                        "element": new InputCell("float", this.viewer.lookupUUID(uuid).args[key].toString(), keyMeta.predicate, this.checkForms)
                    }
                }
                if (typeof keyMeta.defaultValue === "string") {
                    this.keysToEditDict[key] = {
                        "element": new InputCell("string", this.viewer.lookupUUID(uuid).args[key].toString(), keyMeta.predicate, this.checkForms)
                    }
                }
                if (key === "position") {
                    this.keysToEditDict[key] = {
                        "element": new PositionCells(this.viewer.lookupUUID(uuid).args.position, this.checkForms)
                    }
                }
                if (key === "rotation") {
                    this.keysToEditDict[key] = {
                        "element": new RotationCells(this.viewer.lookupUUID(uuid).args.rotation, this.checkForms)
                    }
                }
                if (key === "scale") {
                    this.keysToEditDict[key] = {
                        "element": new ScaleCells(this.viewer.lookupUUID(uuid).args.scale, this.checkForms)
                    }
                }
            }
        })
        // console.log(this.keysToEditDict)
        this.domElement = document.createElement("div")
        this.domElement.classList.add("vapor-editor-object-editor")
        this.titleElem = new Label(`${className} \<${uuid}\>`, undefined, "24px")
        this.titleElem.domElement.classList.add("vapor-editor-object-editor-title")
        this.titleCollapse = new Button(()=>{
            if (this.titleCollapse.text === "Expand") {
                this.collapse = false
            } else {
                this.collapse = true
            }
        }, "Collapse")
        this.transformModeButton = new Button(()=>{
            switch(editorViewer.transformControls.mode) {
                case "translate":
                    editorViewer.transformControls.mode = "rotate"
                    break
                case "rotate":
                    editorViewer.transformControls.mode = "scale"
                    break
                case "scale":
                    editorViewer.transformControls.mode = "translate"
                    break
            }
        }, "Transform Mode")
        this.deleteButton = new Button(this.delete, "Delete")
        this.cancelButton = new Button(()=>{this.cancel()}, "⨉")
        this.cancelButton.domElement.classList.add("vapor-editor-close-button")

        this.submitButton = new Button(()=>{this.done()}, "Done")
        this.submitButton.disabled = true

        this.titleRow = new Row([this.cancelButton, this.titleElem, this.titleCollapse, this.transformModeButton, this.deleteButton, this.submitButton])
        this.titleRow.domElement.classList.add("vapor-editor-object-editor-title-row")
        this.domElement.appendChild(this.titleRow.domElement)


        this.form = document.createElement("table")
        this.form.style.marginTop = "20px"
        this.form.classList.add("vapor-editor-object-editor-form")
        Object.keys(this.keysToEditDict).forEach(key => {
            var tr = document.createElement("tr")
            var labelCell = document.createElement("td")
            var spacing = document.createElement("td")
            spacing.style.width = "10px"
            var inputCell = document.createElement("td")
            tr.appendChild(labelCell)
            tr.appendChild(spacing)
            tr.appendChild(inputCell)
            labelCell.appendChild(new Label(key).domElement)
            inputCell.appendChild(this.keysToEditDict[key].element.domElement)
            this.form.appendChild(tr)
            var v_spacing = document.createElement("tr")
            v_spacing.style.height = "1em"
            this.form.appendChild(v_spacing)
        })
        this.domElement.appendChild(this.form)
        this.checkForms()
        this.collapse = collapse
        this.allowDelete = allowDelete
    }
    checkForms() {
        var err = 0
        Object.keys(this.keysToEditDict).forEach(key => {
            var field = this.keysToEditDict[key].element
            if (field instanceof InputCell || field instanceof PositionCells || field instanceof RotationCells || field instanceof ScaleCells) {
                if (!field.valid) {
                    err += 1
                }
            }
        })
        if (err===0) {
            this.submitButton.disabled = false
            this.valid = true
            this.apply()
        } else {
            this.submitButton.disabled = true
            this.valid = false
        }
    }
    apply() {
        if (!this.valid) {
            throw Error("cannot apply invalid arguments")
        }
        var delta_args = {}
        Object.keys(this.keysToEditDict).forEach(key=>{
            if (!this.keysToEditDict[key].element.empty) {
                delta_args[key] = this.keysToEditDict[key].element.value
            }
        })
        var original_args = Object.assign({}, this.viewer.lookupUUID(this.uuid).args)
        var modified_args = Object.assign(original_args, delta_args)
        try {
            // Try assigning new properties without reloading
            this.viewer.pauseRender()
            Object.assign(this.viewer.lookupUUID(this.uuid).args, delta_args)
            this.viewer.startRender()
        } catch(e) {
            if (e===Serializable.readOnlyError) {
                this.viewer.pauseRender()
                // If read-only error arises
                var viewer = this.viewer.lookupUUID(this.uuid).viewer
                var oldObject = this.viewer.lookupUUID(this.uuid)
                viewer.remove(this.viewer.lookupUUID(this.uuid))
                var newObject = createObject(oldObject.args.className, modified_args)
                viewer.add(newObject)
                this.viewer.editTransformUUID(this.uuid)
                this.viewer.startRender()
            } else {
                throw e
            }
        }
        this.onApply()
    }
    done() {
        this.apply()
        this.onDone()
        this.close()
    }
    cancel() {
        this.viewer.loadCurrentHistoryState()
        this.onCancel()
        this.close()
    }
    delete() {
        this.viewer.remove(this.viewer.lookupUUID(this.uuid))
        this.onDelete()
        this.close()
    }
    update() {
        return
    }
    close() {
        this.viewer.exitEditTransform()
        this.viewer.objectEditors.delete(this)
    }
    updateTransform() {
        this.keysToEditDict["position"]["element"].value = {...this.viewer.lookupUUID(this.uuid).args.position}
        this.keysToEditDict["rotation"]["element"].value = {...this.viewer.lookupUUID(this.uuid).args.rotation}
        this.keysToEditDict["scale"]["element"].value = {...this.viewer.lookupUUID(this.uuid).args.scale}
    }
    get collapse() {
        return this._collapse
    }
    set collapse(val) {
        if (val!==this.collapse) {
            if (val===true) {
                this.titleCollapse.text = "Expand"
                this.form.style.display = "none"
                this._collapse = val
                return
            } else if (val===false) {
                this.titleCollapse.text = "Collapse"
                this.form.style.display = ""
                this._collapse = val
                return
            }
            throw "invalid value"
        }
    }
    get allowDelete() {
        if (this.deleteButton.domElement.style.display==="none") {
            return false
        } else {
            return true
        }
    }
    set allowDelete(val) {
        if (typeof val === "boolean") {
            if (val===true) {
                this.deleteButton.domElement.style.display = ""
            } else {
                this.deleteButton.domElement.style.display = "none"
            }
        } else {
            throw "allowDelete must be boolean"
        }
    }
}

class SearchableList {
    constructor(listOfEntries=[], onClose=()=>{}) { // Entries should be of dicts that have key "text", "onclick", "onmouseover", and "onmouseout"
        this.domElement = document.createElement("div")
        this.domElement.classList.add("vapor-editor-searchable-list")
        this.searchBox = new InputCell("string", "", undefined, (string)=>{
            this.updateFilter(string)
        }, "input")
        this.closeButton = new CloseButton(onClose)
        this.titleRow = new Row([this.closeButton, this.searchBox])
        this.domElement.appendChild(this.titleRow.domElement)
        this.entryListElement = document.createElement("div")
        this.entryListElement.classList.add("vapor-editor-searchable-list-entry-list")
        this.domElement.appendChild(this.entryListElement)
        listOfEntries.forEach(elemData => {
            var elem = document.createElement("div")
            elem.classList.add("vapor-editor-searchable-list-entry")
            elem.innerText = elemData.text
            elem.onclick = elemData.onclick
            elem.onmouseover = elemData.onmouseover
            elem.onmouseout = elemData.onmouseout
            this.entryListElement.appendChild(elem)
        })
    }
    updateFilter(string) {
        this.entryListElement.childNodes.forEach(childNode => {
            if (childNode.innerText.toLowerCase().includes(string.toLowerCase())) {
                childNode.style.display = ""
            } else {
                childNode.style.display = "none"
            }
        })
    }
}

module.exports = EditorViewer