// #package js/main

// #include ../math
// #include ../WebGL.js
// #include AbstractRenderer.js

class DOSRenderer extends AbstractRenderer {

constructor(gl, volume,camera, environmentTexture, options) {
    super(gl, volume, environmentTexture, options);

    Object.assign(this, {
        steps          : 10,
        slices         : 200,
        occlusionScale : 0.01,
        occlusionDecay : 0.9,
        visibility     : 0.9,
        _depth         : 1,
        _minDepth      : -1,
        _maxDepth      : 1,
        _lightPos      :[0.5,0.5,0.5],
        _ks            :0.1,
        _kt            : 0.1
    }, options);

    this._programs = WebGL.buildPrograms(gl, {
        integrate : SHADERS.DOSIntegrate,
        render    : SHADERS.DOSRender,
        reset     : SHADERS.DOSReset,
        transfer  : SHADERS.PolarTransferFunction,
    }, MIXINS);
    
    this._camera= camera;
    this._numberInstance=0;
    this._rules = [];
    this._layout = [];
    this._attrib = gl.createBuffer();
    this._mask = null;
    //this._probMask =null;
    this._localSize = {
        x: 8,
        y: 8,
        z: 1,
    };

    this._colorStrip = WebGL.createTexture(gl, {
        min: gl.LINEAR,
        mag: gl.LINEAR,
    });

    this._transferFunction = WebGL.createTexture(gl, {
        texture : this._transferFunction,
        width   : 256,
        height  : 256,
    });

    this._transferFunctionFramebuffer = WebGL.createFramebuffer(gl, {
        color: [ this._transferFunction ]
    });
}

destroy() {
    const gl = this._gl;
    Object.keys(this._programs).forEach(programName => {
        gl.deleteProgram(this._programs[programName].program);
    });

    super.destroy();
}

calculateDepth() {
    const vertices = [
        new Vector(0, 0, 0),
        new Vector(0, 0, 1),
        new Vector(0, 1, 0),
        new Vector(0, 1, 1),
        new Vector(1, 0, 0),
        new Vector(1, 0, 1),
        new Vector(1, 1, 0),
        new Vector(1, 1, 1)
    ];

    let minDepth = 1;
    let maxDepth = -1;
    let mvp = this._mvpMatrix.clone().transpose();
    for (const v of vertices) {
        mvp.transform(v);
        const depth = Math.min(Math.max(v.z / v.w, -1), 1);
        minDepth = Math.min(minDepth, depth);
        maxDepth = Math.max(maxDepth, depth);
    }

    return [minDepth, maxDepth];
}

setVolume(volume) {
    super.setVolume(volume);

    const gl = this._gl;
    const dimensions = volume._currentModality.dimensions;

    if (this._mask) {
        gl.deleteTexture(this._mask);
    }

    this._mask = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_3D, this._mask);
    gl.texStorage3D(gl.TEXTURE_3D, 1, gl.RGBA8,
        dimensions.width, dimensions.height, dimensions.depth);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);


    /*if (this._probMask) {
        gl.deleteTexture(this._probMask);
    }
    this._probMask = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_3D, this._probMask);
    gl.texStorage3D(gl.TEXTURE_3D, 1, gl.Rf,
        dimensions.width, dimensions.height, dimensions.depth);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);*/
}

setAttributes(attributes, layout) {
    const gl = this._gl;

    WebGL.createBuffer(gl, {
        target : gl.SHADER_STORAGE_BUFFER,
        buffer : this._attrib,
        data   : attributes || new ArrayBuffer()
    });
    this._layout = layout;
    //console.log(attributes);
    if(layout) {
        var values = this._getValuesByAttributeName("Orientation", layout, attributes);
        //console.log(values);
        this._numberInstance=values.length;
    }
}
saveInFile(data) {
    // this function just to test the content of long variables 
    let bl = new Blob([data], {
       type: "text/html"
    });
    let a = document.createElement("a");
    a.href = URL.createObjectURL(bl);
    a.download = "data.txt";
    a.hidden = true;
    document.body.appendChild(a);
    a.innerHTML =
       "someinnerhtml";
    a.click();
}
setHtreeRules(rules)
{
    
    this._rules='';
    var _x = rules.map((rule, index) => {
        const attribute = rule.attribute;
        const hi = rule.hi;
        const lo = rule.lo;
        const visibility = (rule.visibility / 100).toFixed(4);
        const phi = (index / rules.length) * 2 * Math.PI;
        const tfx = (Math.cos(phi) * 0.5 + 0.5).toFixed(4);
        const tfy = (Math.sin(phi) * 0.5 + 0.5).toFixed(4);
        var rangeCondition = '';
        if(attribute.length>1)
        {
            
            for(var i=0;i<attribute.length;i++)
            {
                /*
                 const _attribute=attribute[i];
                const _value=value[i];
                valueCondition+= `(instance.${_attribute}==${_value})`;
                */
                 rangeCondition += `instance.${attribute[i]} >= float(${lo[i]}) && instance.${attribute[i]} <= float(${hi[i]})`;
                //valueCondition+= `(instance.${attribute[i]}==float(${value[i]}))`;
                if(i<attribute.length-1)
                {
                    rangeCondition+= `&&`;
                }
            }
        }
        else{
            //rangeCondition+= `instance.${attribute[0]}==float(${value[0]})`;
            rangeCondition += `instance.${attribute[0]} >= float(${lo[0]}) && instance.${attribute[0]} <= float(${hi[0]})`;
               
        }

        //const visibilityCondition = `rand(vec2(float(id))).x < ${visibility}`;
        const visibilityCondition = ` prob <  ${visibility}`;
        this._rules+= `if (${rangeCondition}) { if (${visibilityCondition}) { return vec2(${tfx}, ${tfy}); } else { return vec2(0.5); } }`;
    });
    //console.log(this._rules);
    this._recomputeTransferFunction(rules); 
    this._rebuildAttribComputeTree();
}
setRules(rules) {
    this._rules = rules.map((rule, index) => {
        const attribute = rule.attribute;
        const lo = rule.range.x.toFixed(4);
        const hi = rule.range.y.toFixed(4);
        const visibility = (rule.visibility / 100).toFixed(4);
        const phi = (index / rules.length) * 2 * Math.PI;
        const tfx = (Math.cos(phi) * 0.5 + 0.5).toFixed(4);
        const tfy = (Math.sin(phi) * 0.5 + 0.5).toFixed(4);
        const rangeCondition = `instance.${attribute} >= ${lo} && instance.${attribute} <= ${hi}`;
        //const visibilityCondition = `rand(vec2(float(id))).x < ${visibility}`;
        const visibilityCondition = ` prob <  ${visibility}`;
        return `if (${rangeCondition}) { if (${visibilityCondition}) { return vec2(${tfx}, ${tfy}); } else { return vec2(0.5); } }`;
    });
    //console.log(rules);
    this._recomputeTransferFunction(rules);
    this._rebuildAttribCompute();
}
_getCameraPosition()
{
    return [this._camera.position.x,this._camera.position.y,this._camera.position.z];
}
_rebuildAttribCompute() {
    const gl = this._gl;

    if (this._programs.compute) {
        gl.deleteProgram(this._programs.compute.program);
    }

    const members = [];
    for (const attrib of this._layout) {
        members.push(attrib.type + ' ' + attrib.name + ';');
    }
    const instance = members.join('\n');
    const rules = this._rules.join('\n');
    
    this._programs.compute = WebGL.buildPrograms(gl, {
        compute  : SHADERS.AttribCompute
    }, {
        instance,
        rules,
        rand: MIXINS.rand,
        localSizeX: this._localSize.x,
        localSizeY: this._localSize.y,
        localSizeZ: this._localSize.z,
    }).compute;

    this._recomputeMask();
}
_rebuildAttribComputeTree() {
    const gl = this._gl;

    if (this._programs.compute) {
        gl.deleteProgram(this._programs.compute.program);
    }

    const members = [];
    for (const attrib of this._layout) {
        members.push(attrib.type + ' ' + attrib.name + ';');
    }
    const instance = members.join('\n');
    const rules = this._rules;
    
    this._programs.compute = WebGL.buildPrograms(gl, {
        compute  : SHADERS.AttribCompute
    }, {
        instance,
        rules,
        rand: MIXINS.rand,
        localSizeX: this._localSize.x,
        localSizeY: this._localSize.y,
        localSizeZ: this._localSize.z,
    }).compute;

    this._recomputeMask();
}
_recomputeMask() {
    const gl = this._gl;

    const program = this._programs.compute;
    gl.useProgram(program.program);

    const cameraPos=[this._camera.position.x,this._camera.position.y,this._camera.position.y];
    gl.uniform3fv(program.uniforms.uCameraPos,cameraPos);

    const dimensions = this._volume._currentModality.dimensions;
    gl.uniform3i(program.uniforms.imageSize, dimensions.width, dimensions.height, dimensions.depth);
    gl.bindImageTexture(0, this._volume.getTexture(), 0, true, 0, gl.READ_ONLY, gl.R32UI);
    gl.bindImageTexture(1, this._mask, 0, true, 0, gl.WRITE_ONLY, gl.RGBA8);

    /*gl.uniform3fv(program.uniforms.uLightPos,this._lightPos);
    gl.uniform1f(program.uniforms.uMinDistance, this._minDepth);
    gl.uniform1f(program.uniforms.uMaxDistance, this._maxDepth);
    gl.uniform1f(program.uniforms.uKs, this._ks);
    gl.uniform1f(program.uniforms.uKt, this._kt);*/
   
    gl.uniform1f(program.uniforms.uNumInstances, this._numberInstance);
    /*gl.activeTexture(gl.TEXTURE2);
    gl.uniform1i(program.uniforms.uVolume, 2);
    gl.bindTexture(gl.TEXTURE_3D, this._volume.getTexture());*/

    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, this._attrib);

    const groupsX = Math.ceil(dimensions.width  / this._localSize.x);
    const groupsY = Math.ceil(dimensions.height / this._localSize.y);
    const groupsZ = Math.ceil(dimensions.depth  / this._localSize.z);
    gl.dispatchCompute(groupsX, groupsY, groupsZ);
}

_recomputeTransferFunction(rules) {
    const gl = this._gl;

    // create color strip
    const colors = rules
        .map(rule => rule.color)
        .map(hex => CommonUtils.hex2rgb(hex))
        .map(color => [color.r, color.g, color.b, 1])
        .flat()
        .map(x => x * 255);
    const data = new Uint8Array(colors);
    
    // upload color strip
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._colorStrip);
    WebGL.createTexture(gl, {
        unit    : 0,
        texture : this._colorStrip,
        width   : rules.length,
        height  : 1,
        data    : data
    });
   
    // render transfer function
    const program = this._programs.transfer;
    gl.useProgram(program.program);
    gl.uniform1i(program.uniforms.uColorStrip, 0);
    gl.uniform1f(program.uniforms.uOffset, 0.5 / rules.length);
    gl.uniform1f(program.uniforms.uFalloffStart, 0.2);
    gl.uniform1f(program.uniforms.uFalloffEnd, 0.8);

    gl.bindBuffer(gl.ARRAY_BUFFER, this._clipQuad);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this._transferFunctionFramebuffer);
    gl.viewport(0, 0, 256, 256); // TODO: get actual TF size
    gl.drawBuffers([ gl.COLOR_ATTACHMENT0 ]);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}


_resetFrame() {
    const gl = this._gl;

    const [minDepth, maxDepth] = this.calculateDepth();
    this._minDepth = minDepth;
    this._maxDepth = maxDepth;
    this._depth = minDepth;

    gl.drawBuffers([
        gl.COLOR_ATTACHMENT0,
        gl.COLOR_ATTACHMENT1
    ]);

    const program = this._programs.reset;
    gl.useProgram(program.program);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

_integrateFrame() {
    const gl = this._gl;

    if (!this._mask) {
        return;
    }
    const program = this._programs.integrate;
    gl.useProgram(program.program);

    gl.drawBuffers([
        gl.COLOR_ATTACHMENT0,
        gl.COLOR_ATTACHMENT1
    ]);
    
    gl.activeTexture(gl.TEXTURE2);
    gl.uniform1i(program.uniforms.uVolume, 2);
    gl.bindTexture(gl.TEXTURE_3D, this._mask);

    gl.activeTexture(gl.TEXTURE3);
    gl.uniform1i(program.uniforms.uTransferFunction, 3);
    gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);
    
    // TODO: calculate correct blur radius (occlusion scale)
    gl.uniform2f(program.uniforms.uOcclusionScale, this.occlusionScale, this.occlusionScale);
    gl.uniform1f(program.uniforms.uOcclusionDecay, this.occlusionDecay);
    //gl.uniform1f(program.uniforms.uVisibility, this.visibility);
    gl.uniformMatrix4fv(program.uniforms.uMvpInverseMatrix, false, this._mvpInverseMatrix.m);

    const depthStep = (this._maxDepth - this._minDepth) / this.slices;
    for (let step = 0; step < this.steps; step++) {
        if (this._depth > this._maxDepth) {
            break;
        }

        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(program.uniforms.uColor, 0);
        gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[0]);

        gl.activeTexture(gl.TEXTURE1);
        gl.uniform1i(program.uniforms.uOcclusion, 1);
        gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[1]);

        gl.uniform1f(program.uniforms.uDepth, this._depth);

        this._accumulationBuffer.use();
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        this._accumulationBuffer.swap();

        this._depth += depthStep;
    }

    // Swap again to undo the last swap by AbstractRenderer
    this._accumulationBuffer.swap();
}

_renderFrame() {
    const gl = this._gl;

    const program = this._programs.render;
    gl.useProgram(program.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[0]);

    gl.uniform1i(program.uniforms.uAccumulator, 0);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

_getFrameBufferSpec() {
    const gl = this._gl;
    return [{
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RGBA,
        internalFormat : gl.RGBA,
        type           : gl.UNSIGNED_BYTE
    }];
}

_getAccumulationBufferSpec() {
    const gl = this._gl;

    const colorBuffer = {
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RGBA,
        internalFormat : gl.RGBA,
        type           : gl.UNSIGNED_BYTE
    };

    const occlusionBuffer = {
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RG,
        internalFormat : gl.RG32F,
        type           : gl.FLOAT
    };

    return [
        colorBuffer,
        occlusionBuffer
    ];
}

_getValuesByAttributeName(attribName, layout, attributes) {
    var index = this._getIndexOfAttribute(attribName, layout);    
    
    return this._parseValuesFromAttributeRawFile(index, layout.length, attributes);
}

_getIndexOfAttribute(attribName, layout) {
    if(!layout) {
        return -1;
    }

    // get the index if the attribute
    var index = 0;
    for (; index < layout.length; index++) {
        if(layout[index].name == attribName) {
            break;
        }
    }
    return index;
}

_parseValuesFromAttributeRawFile(index, valuesPerRow, attributes) {
    if(index < 0 || index >= valuesPerRow) {
        return [];
    }

    const view = new DataView(attributes);    
    var count = attributes.byteLength / 4; // converting to float32
    
    var data = [];
    for(var i = index; i < count; i += valuesPerRow) {        
        data.push(view.getFloat32(i * 4, false));
    }
    
    return data;
}

}
