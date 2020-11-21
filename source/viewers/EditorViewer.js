var Viewer = require("./Viewer")
var THREE = require("three")
var gsap = require("gsap")
var Serializable = require("../SerializationLib/Serializable")
var { TransformControls, TransformControlsGizmo, TransformControlsPlane } = require("../helpers/TransformControls");

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

// Todo: Override playerObject / camera selection process
//       Add Transform mode
//       Add transformation controls in object editor
//       Click to select (outline pass: https://stackoverflow.com/questions/26341396/outline-a-3d-object-in-three-js)
//       List to select / search to select?


class EditorViewer extends Viewer {
    constructor(containerElement) {
        super(containerElement, false)
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

        this.objectEditors = new Set()

        // Container
        var uiRowStack = new RowStack([], true)
        this.UIContainer.appendChild(uiRowStack.domElement)
        // Main menu
        var mainMenu = new Row([new Button(()=>{uiRowStack.add(classCreationMenu)},"Add"), new Button(undefined,"Select"), new Button(undefined,"Select from list"), new Button(undefined,"Settings")])
        uiRowStack.add(mainMenu)
        // Main menu -> Add
        var classCreationMenuButtons = []
        getObjectClassNames().forEach(className=>{
            classCreationMenuButtons.push(new Button(()=>{
                var newObjectInit = createObject(className)
                this.add(newObjectInit)
                this.editTransformUUID(newObjectInit.uuid)
                this.transformControls.addEventListener("objectChange", ()=>{
                    this.objectEditors.forEach(oe => {
                        oe.updateTransform()
                    })
                })
                // console.log(newObjectInit.uuid, this.objects.args.objects)
                var objectEditor = new ObjectEditor(this, newObjectInit.uuid, ()=>{
                    uiRowStack.remove(objectEditor)
                    uiRowStack.remove(classCreationMenu)
                    this.exitEditTransform()
                    objectEditor.close()
                }, ()=>{
                    this.editTransformUUID(newObjectInit.uuid)
                })
                uiRowStack.add(objectEditor)
            }, className))
        })
        var classCreationMenu = new Row(classCreationMenuButtons)
    }
    editTransformUUID(uuid) { // Todo: Create different modes,  first person OR mouse; also, add crosshair during first person mode.
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
        var ogHeight = row.domElement.clientHeight
        if (ogHeight!==0) {
            row.domElement.style.maxHeight = "0px"
            row.domElement.style.overflowY = "hidden"
            gsap.TweenLite.fromTo(row.domElement, {maxHeight: "0px"}, {maxHeight: ogHeight.toString()+"px", duration:0.1}) // Todo: Cancel animation if new animation happens
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
    constructor(interpType="string", defaultStr, valCheck=()=>{return true}, onBlur=()=>{}) {
        if (!(this.supportedInterpTypes.indexOf(interpType) >= 0)) {
            throw new Error("invalid interpType")
        }
        this.onFocus = this.onFocus.bind(this)
        this.onBlur = this.onBlur.bind(this)
        this.onBlurCB = onBlur
        this._focus = false

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
        } else {
            this.inputString(this.domElement.value)
        }
        this.onBlurCB()
    }
}

class CheckBox {
    constructor(defaultVal) {
        this.domElement = document.createElement("input")
        this.domElement.type = "checkbox"
        this.domElement.checked = defaultVal
        this.domElement.classList.add("vapor-editor-checkbox")
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
        this.domElement.innerHTML = text
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
        this.xInput = object.x
        this.yInput = object.y
        this.zInput = object.z
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
    }
}

class ObjectEditor {
    constructor(editorViewer, uuid, onDone=()=>{}, onApply=()=>{}, initAsDefault=true) {
        this.viewer = editorViewer
        this.viewer.objectEditors.add(this)
        this.close = this.close.bind(this)
        this.uuid = uuid
        this.object = this.viewer.lookupUUID(uuid)
        if (this.object.viewer===undefined) { // Should not happen as if UUID is visible, it should be in objectContaienr
            throw new Error("object has to be added into viewer")
        }
        this.onDone = onDone
        this.onApply = onApply
        this.valid = false
        this.checkForms = this.checkForms.bind(this)
        this.done = this.done.bind(this)
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
                        "element": new CheckBox(this.viewer.lookupUUID(uuid).args[key])
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
        this.domElement.appendChild(new Label(`${className} <${uuid}>`, undefined, "24px").domElement)
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
            v_spacing.style.height = "10px"
            this.form.appendChild(v_spacing)
        })
        this.domElement.appendChild(this.form)
        this.submitButton = new Button(()=>{this.done()}, "Done")
        this.submitButton.disabled = true
        this.submitButton.domElement.classList.add("vapor-editor-object-editor-submit-button")
        this.domElement.appendChild(this.submitButton.domElement)
        this.checkForms()
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
    }
    update() {
        return
    }
    close() {
        this.viewer.objectEditors.delete(this)
    }
    updateTransform() {
        console.log(this.keysToEditDict["position"]["element"].value)
    }
}

module.exports = EditorViewer