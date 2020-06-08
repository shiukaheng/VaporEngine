class BaseObject2 {
    constructor() {
        // For initializing parameters. Necessary parameters first, then a object that specifies optional and variable parameters, then a list of modifiers.
        // Create loading helper
        // Define empty list of modifiers
    }
    loadAssets() {
        // For loading assets.
    }
    addToViewer(viewer) {
        // Adds object into viewer
    }
    remove() {
        // Convenience function that removes object from current viewer (an object is only supposed to be added to a viewer only once, clone if two is needed)
    }
    removeFromViewer(viewer) {
        // Removes itself from viewer
    }
    clone() {
        // Returns cloned object with same state
    }
    update(dt) {
        // Updates object on render loop
        // Make it visible only when loading is done
    }
    addModifier(modifier) {

    }
    removeModifier(modifier) {

    }
}