var Viewer = require("./Viewer")
var THREE = require("three")
var gsap = require("gsap")

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
        var ar = new ButtonRow([new Button(()=>{ar.parent.add(br); ar.disabled=true},"Add"), new Button(undefined,"Select"), new Button(undefined,"Select from list"), new Button(undefined,"Settings")])
        var br = new ButtonRow([new Button(()=>{ar.disabled = false; br.parent.remove(br)}, "Option")])
        var ab = new ButtonRowStack([ar])
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

class ButtonRowStack {
    constructor(listOfButtonRows=[]) {
        this._disabled = false
        this.domElement = document.createElement("div")
        this.domElement.classList.add("vapor-editor-button-row-stack")
        listOfButtonRows.forEach(buttonRows=>{
            this.add(buttonRows)
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
    add(buttonRow) {
        this.domElement.appendChild(buttonRow.domElement)
        var ogHeight = buttonRow.domElement.clientHeight // Todo: try method that doesnt use clientHeight, instead, transition using em sizes.
        if (ogHeight!==0) {
            buttonRow.domElement.style.maxHeight = "0px"
            buttonRow.domElement.style.overflow = "hidden" //
            gsap.TweenLite.to(buttonRow.domElement, {maxHeight: ogHeight.toString()+"px"}) // Todo: Cancel animation if new animation happens
        }
        
        buttonRow.parent = this
    }
    remove(buttonRow) {
        if (buttonRow.parent !== this) {
            throw new Error("attempt to remove child from non-parent")
        }
        this.domElement.removeChild(buttonRow.domElement)
        buttonRow.parent = null
    }
}

module.exports = EditorViewer