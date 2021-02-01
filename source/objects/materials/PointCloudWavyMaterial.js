var ThreeLoader = require('@pnext/three-loader')
var glsl = require("glslify")

class PointCloudWavyMaterial extends ThreeLoader.PointCloudMaterial {
    constructor(...args) {
        super(...args)
        this.clock = new THREE.Clock()
        this.compiled = false
    }
    updateMaterial(...args) {
        super.updateMaterial(...args)
        // console.log(this)
        if (this.compiled===true) { // Hacky.. Don't know why uniform does not appear until few frames later
            this.uniforms.time.value = this.clock.getElapsedTime()
        }

    }
    onBeforeCompile(scope) {
        scope.uniforms.time = {value: 0.}
        scope.uniforms.sigmoid_alpha = {value: 10.}
        scope.uniforms.sigmoid_beta = {value: 0.2}
        scope.uniforms.displaceFac = {value: 0.1}
        scope.uniforms.displaceSize = {value: 8.0}
        scope.uniforms.timeFac = {value: 0.2}

        scope.vertexShader = this.applyDefines(require("./shaders/pointcloud.vert")())
        scope.fragmentShader = this.applyDefines(require("./shaders/pointcloud.frag")())
        this.compiled = true
    }
}

module.exports = PointCloudWavyMaterial