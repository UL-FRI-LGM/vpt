//@@../Util.js
//@@../WebGLUtils.js
//@@AbstractRenderer.js

(function(global) {
'use strict';

var Class = global.MCSRenderer = MCSRenderer;
Util.inherit(Class, AbstractRenderer);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function MCSRenderer(gl, volumeTexture, environmentTexture, options) {
    _.sup.constructor.call(this, gl, volumeTexture, environmentTexture, options);
    $.extend(true, this, Class.defaults, options);

    _._init.call(this);
};

Class.defaults = {
    _lightPosition : [2, 2, 2],
    _lightColor    : [1, 1, 1],
    _lightSize     : 2,
    _sigmaMax      : 1
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._programs      = null;
    this._frameNumber   = null;
    this._randomTexture = null;
};

_._init = function() {
    _._nullify.call(this);

    var gl = this._gl;

    this._programs = WebGLUtils.compileShaders(gl, {
        generate  : SHADERS.MCSGenerate,
        integrate : SHADERS.MCSIntegrate,
        render    : SHADERS.MCSRender,
        reset     : SHADERS.MCSReset
    }, MIXINS);

    var nRandomValues = 100;
    var randomValues = new Float32Array(nRandomValues * 4);
    for (var i = 0; i < nRandomValues * 4; i++) {
        randomValues[i] = Math.random();
    }
    this._randomTexture = WebGLUtils.createTexture(gl, {
        data           : randomValues,
        width          : nRandomValues,
        height         : 1,
        format         : gl.RGBA,
        internalFormat : gl.RGBA16F,
        type           : gl.FLOAT,
        wrapS          : gl.CLAMP_TO_EDGE,
        wrapT          : gl.CLAMP_TO_EDGE,
        min            : gl.NEAREST,
        max            : gl.NEAREST
    });

    this._frameNumber = 1;
};

_.destroy = function() {
    _.sup.destroy.call(this);

    var gl = this._gl;
    this._programs.forEach(function(program) {
        gl.deleteProgram(program.program);
    });

    gl.deleteTexture(this._randomTexture);

    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_._resetFrame = function() {
    var gl = this._gl;

    var program = this._programs.reset;
    gl.useProgram(program.program);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    this._frameNumber = 1;
};

_._generateFrame = function() {
    var gl = this._gl;

    var program = this._programs.generate;
    gl.useProgram(program.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_3D, this._volumeTexture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this._environmentTexture);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, this._randomTexture);

    gl.uniform1i(program.uniforms.uVolume, 0);
    gl.uniform1i(program.uniforms.uEnvironment, 1);
    gl.uniform1i(program.uniforms.uTransferFunction, 2);
    gl.uniform1i(program.uniforms.uRandom, 3);
    gl.uniformMatrix4fv(program.uniforms.uMvpInverseMatrix, false, this._mvpInverseMatrix.m);
    gl.uniform1f(program.uniforms.uOffset, Math.random());
    gl.uniform1f(program.uniforms.uSigmaMax, this._sigmaMax);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
};

_._integrateFrame = function() {
    var gl = this._gl;

    var program = this._programs.integrate;
    gl.useProgram(program.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getTexture());
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this._frameBuffer.getTexture());

    gl.uniform1i(program.uniforms.uAccumulator, 0);
    gl.uniform1i(program.uniforms.uFrame, 1);
    gl.uniform1f(program.uniforms.uFrameNumber, this._frameNumber);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    this._frameNumber += 1;
};

_._renderFrame = function() {
    var gl = this._gl;

    var program = this._programs.render;
    gl.useProgram(program.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getTexture());

    gl.uniform1i(program.uniforms.uAccumulator, 0);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
};

_._getFrameBufferOptions = function() {
    var gl = this._gl;
    return {
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RGBA,
        internalFormat : gl.RGBA16F,
        type           : gl.FLOAT
    };
};

_._getAccumulationBufferOptions = function() {
    var gl = this._gl;
    return {
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RGBA,
        internalFormat : gl.RGBA16F,
        type           : gl.FLOAT
    };
};

// ============================ STATIC METHODS ============================= //

})(this);
