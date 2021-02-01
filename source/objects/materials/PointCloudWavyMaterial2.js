var ThreeLoader = require('@pnext/three-loader')
var glsl = require("glslify")

var { PointColorType, PointOpacityType, PointShape, PointSizeType, TreeType } = require("./enums")

const TREE_TYPE_DEFS = {
	[TreeType.OCTREE]: 'tree_type_octree',
	[TreeType.KDTREE]: 'tree_type_kdtree',
};
const SIZE_TYPE_DEFS = {
	[PointSizeType.FIXED]: 'fixed_point_size',
	[PointSizeType.ATTENUATED]: 'attenuated_point_size',
	[PointSizeType.ADAPTIVE]: 'adaptive_point_size',
};
const OPACITY_DEFS = {
	[PointOpacityType.ATTENUATED]: 'attenuated_opacity',
	[PointOpacityType.FIXED]: 'fixed_opacity',
};
const SHAPE_DEFS = {
	[PointShape.SQUARE]: 'square_point_shape',
	[PointShape.CIRCLE]: 'circle_point_shape',
	[PointShape.PARABOLOID]: 'paraboloid_point_shape',
};
const COLOR_DEFS = {
	[PointColorType.RGB]: 'color_type_rgb',
	[PointColorType.COLOR]: 'color_type_color',
	[PointColorType.DEPTH]: 'color_type_depth',
	[PointColorType.HEIGHT]: 'color_type_height',
	[PointColorType.INTENSITY]: 'color_type_intensity',
	[PointColorType.INTENSITY_GRADIENT]: 'color_type_intensity_gradient',
	[PointColorType.LOD]: 'color_type_lod',
	[PointColorType.POINT_INDEX]: 'color_type_point_index',
	[PointColorType.CLASSIFICATION]: 'color_type_classification',
	[PointColorType.RETURN_NUMBER]: 'color_type_return_number',
	[PointColorType.SOURCE]: 'color_type_source',
	[PointColorType.NORMAL]: 'color_type_normal',
	[PointColorType.PHONG]: 'color_type_phong',
	[PointColorType.RGB_HEIGHT]: 'color_type_rgb_height',
	[PointColorType.COMPOSITE]: 'color_type_composite',
};
const CLIP_MODE_DEFS = {
	[0]: 'clip_disabled',
	[1]: 'clip_outside',
	[2]: 'clip_highlight_inside',
};

class PointCloudWavyMaterial extends ThreeLoader.PointCloudMaterial {
    constructor(...args) {
        super(...args)
        this.clock = new THREE.Clock()
        this.fog = true
    }
    updateMaterial(...args) {
        super.updateMaterial(...args)
        // console.log(this)
        if (this.compiled===true) { // Hacky.. Don't know why uniform does not appear until few frames later
            this.uniforms.time.value = this.clock.getElapsedTime()
        }
    }
    updateShaderSource() {
        this.vertexShader = this.applyDefines(require('./shaders/pointcloud.vert').default);
        this.fragmentShader = this.applyDefines(require('./shaders/pointcloud.frag').default);
        this.needsUpdate = true
    }
    onBeforeCompile(scope) {
        scope.uniforms.time = {value: 0.}
        scope.uniforms.sigmoid_alpha = {value: 10.} // Controls difference of effect on high confidence / low confidence points
        scope.uniforms.sigmoid_beta = {value: 0.2} // Controls the thresholding point for judging good / bad points from confidence
        scope.uniforms.wind_scale = {value: 0.3} // Scale of wind detail
        scope.uniforms.displacement_vector = {value: new THREE.Vector3(0,0.2,0)} // Which direction waves are standing
        scope.uniforms.wind_vector = {value: new THREE.Vector3(0.5, 0, 0)}  // Which direction waves are travelling
        scope.uniforms.global_alpha = {value: 1}
        scope.uniforms.highlight_factor = {value: 0.1}
        Object.assign(scope.uniforms, THREE.UniformsLib.fog)

        scope.vertexShader = this.applyDefines(require("./shaders/pointcloud2.vert")())
        scope.fragmentShader = this.applyDefines(require("./shaders/pointcloud2.frag")())
        this.compiled = true
    }
    applyDefines(shaderSrc) {
        const parts = [];
    
        function define(value) {
            if (value) {
                parts.push(`#define ${value}`);
            }
        }
        define(TREE_TYPE_DEFS[this.treeType]);
        define(SIZE_TYPE_DEFS[this.pointSizeType]);
        define(SHAPE_DEFS[this.shape]);
        define(COLOR_DEFS[this.pointColorType]);
        define(CLIP_MODE_DEFS[this.clipMode]);
        define(OPACITY_DEFS[this.pointOpacityType]);
        // We only perform gamma and brightness/contrast calculations per point if values are specified.
        if (this.rgbGamma !== 1 ||
            this.rgbBrightness !== 0 ||
            this.rgbContrast !== 0) {
            define('use_rgb_gamma_contrast_brightness');
        }
        if (this.useFilterByNormal) {
            define('use_filter_by_normal');
        }
        if (this.useEDL) {
            define('use_edl');
        }
        if (this.weighted) {
            define('weighted_splats');
        }
        if (this.numClipBoxes > 0) {
            define('use_clip_box');
        }
        if (this.fog === true) {
            define('USE_FOG')
        }
        define('MAX_POINT_LIGHTS 0');
        define('MAX_DIR_LIGHTS 0');
        parts.push(shaderSrc);
        return parts.join('\n');
    }
}

module.exports = PointCloudWavyMaterial