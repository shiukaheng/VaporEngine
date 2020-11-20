var Viewer = require("./Viewer")
var THREE = require("three")
var gsap = require("gsap")
var Serializable = require("../SerializationLib/Serializable")

var EditorViewerCss = require("./EditorViewer.css")

class EditorViewer extends Viewer {
    constructor(containerElement) {
        super(containerElement, false)
        this.floorMat = new THREE.MeshBasicMaterial({wireframe:true, color:"grey"})
        this.floorGeom = new THREE.PlaneGeometry(200,200,100,100)
        this.floor = new THREE.Mesh(this.floorGeom, this.floorMat)
        this.floor.rotation.x = Math.PI/2
        this.scene.add(this.floor)

        this.UIContainer = document.createElement("div")
        this.UIContainer.classList.add("vapor-editor-overlay")
        this.containerElement.appendChild(this.UIContainer)
        var ar = new ButtonRow([new Button(()=>{ar.parent.add(br)},"Add"), new Button(undefined,"Select"), new Button(undefined,"Select from list"), new Button(undefined,"Settings")])
        var scm = Serializable.getSerializableClassesManager()
        var buttonList = []
        Object.keys(scm.classList).forEach(className=>{
            if (scm.classList[className].prototype instanceof scm.classList["BaseObject"]) {
                buttonList.push(new Button(()=>{
                    br.parent.remove(br)
                }, className))
            }
        })
        var br = new ButtonRow(buttonList)
        // var br = new ButtonRow([new Button(()=>{ar.disabled = false; br.parent.remove(br)}, "Option")])
        var ab = new RowStack([ar], true)
        this.UIContainer.appendChild(ab.domElement)
    }
}

class Button {
    constructor(buttonFunc=()=>{}, text="Button", fontPx=18, disabled=false) {
        this.parent = null
        this.function = buttonFunc
        this._disabled = disabled
        this.domElement = document.createElement("div")
        this.domElement.innerHTML = text
        this.domElement.classList.add("vapor-editor-button")
        this.domElement.style.fontSize = (fontPx).toString()+"px"
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
}

class ButtonRow {
    constructor(listOfButtons=[]) {
        this.parent = null
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
        button.parent = null
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
        var ogHeight = row.domElement.clientHeight // Todo: try method that doesnt use clientHeight, instead, transition using em sizes.
        if (ogHeight!==0) {
            row.domElement.style.maxHeight = "0px"
            row.domElement.style.overflowY = "hidden" //
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
        row.parent = null
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
    constructor(interpType="string", defaultStr, valCheck=()=>{return true}) {
        if (!(interpType in this.supportedInterpTypes)) {
            throw new Error("invalid interpType")
        }
        this.interpType = interpType
        this._valCheck = valCheck
        this._inputValue = null
        this._defaultStr = this.castStrToDestType(defaultStr)
        this._valid = true
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
    valueCheck(val) {
        return this._valCheck(val)
    }
    inputString(str) {
        var val
        try {
            val = castStrToDestType(str)
        } catch(err) {

        }
            
    }
    get value() {
        // if invalid, return undefined
    }
    set value(val) {
        // check if value matches type
        // check if value matches valid check
    }
    get valid() {

    }
    onContentChanged() {
        var content = "get content here"
        // Interpret to destination type, if failed set valid = false
        // Value check, if failed set valid = false
    }
}

class ObjectCreationWizard {
    constructor(className, onDone=()=>{return {"arg":"..."}}) {
        this.className = className
    }
}

module.exports = EditorViewer