// #package js/main

// #include ../math
// #include ../WebGL.js
// #include ../loaders/AttributesParser.js
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
    this._elements=[];
    this.visStatusArr= null;
    this._avgProbability = null;
    this._visibilityStatus = gl.createBuffer();
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

}

setAttributes(attributes, layout,elements) {
    const gl = this._gl;

    WebGL.createBuffer(gl, {
        target : gl.SHADER_STORAGE_BUFFER,
        buffer : this._attrib,
        data   : attributes || new ArrayBuffer()
    });
    this._layout = layout;
    if(layout) {
        var parser = new AttributesParser();
        var values = parser.getValuesByAttributeName("RealX2", layout, attributes);
        this._numberInstance=values.length;
        this.initInstancesArray();
        //TODO: recall _rebuildProbCompute() everytime camera is changed
        this._elements=elements;
        //console.log(this._elements);
        this._rebuildProbCompute(); // compute avg probability for evey instance
        
    }
   
    //=========================================
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
                 rangeCondition += `(instance.${attribute[i]} >= float(${lo[i]}) && instance.${attribute[i]} <= float(${hi[i]}))`;
                
                if(i<attribute.length-1)
                {
                    rangeCondition+= `&&`;
                }
            }
        }
        else{
            rangeCondition += `instance.${attribute[0]} >= float(${lo[0]}) && instance.${attribute[0]} <= float(${hi[0]})`;
               
        }
        const visibilityCondition = ` prob <  ${visibility}`;
        this._rules+= `if (${rangeCondition}) { if (${visibilityCondition}) { return vec2(${tfx}, ${tfy}); } else { return vec2(0.5); } }`;
    });
   // console.log(rules);
    //this.saveInFile(this._rules);
    this._recomputeTransferFunction(rules); 
    this._rebuildAttribCompute(true);
}
initInstancesArray()
{
    this.visStatusArr = new Uint8Array(this._numberInstance);
}
clearVisStatusArray()
{
    for(var i=0;i<this._numberInstance;i++)
    {
        this.visStatusArr[i]=0;
    }
}
setRules(rules) { 
//setRulesBasedAvgProb(rules) {
    this.clearVisStatusArray();//defult 0=visible .. 1=invisible
    this._rules = rules.map((rule, index) => {
        const attribute = rule.attribute;
        const lo = rule.range.x.toFixed(4);
        const hi = rule.range.y.toFixed(4);
        var instancesStRule=this._getRuleElements([attribute], [hi], [lo]);
        this._sort_by_key(instancesStRule,'avgProb');
        //console.log(instances);
        const visibility = (rule.visibility / 100).toFixed(4);
        this.updateVisStatusArray(instancesStRule,visibility);
        const phi = (index / rules.length) * 2 * Math.PI;
        const tfx = (Math.cos(phi) * 0.5 + 0.5).toFixed(4);
        const tfy = (Math.sin(phi) * 0.5 + 0.5).toFixed(4);
        const rangeCondition = `instance.${attribute} >= ${lo} && instance.${attribute} <= ${hi}`;
       // const visibilityCondition = ` prob == uint(0)`;
        return `if (${rangeCondition}) { return vec2(${tfx}, ${tfy}); }`;
    });
    //console.log(this.visStatusArr);    
    this._recomputeTransferFunction(rules);
    this._createVisibilityStatusBuffer();
    this._rebuildAttribCompute(false);
}

/*setRules(rules) {
    this._rules = rules.map((rule, index) => {
        const attribute = rule.attribute;
        const lo = rule.range.x.toFixed(4);
        const hi = rule.range.y.toFixed(4);
        const visibility = (rule.visibility / 100).toFixed(4);
        const phi = (index / rules.length) * 2 * Math.PI;
        const tfx = (Math.cos(phi) * 0.5 + 0.5).toFixed(4);
        const tfy = (Math.sin(phi) * 0.5 + 0.5).toFixed(4);
        const rangeCondition = `instance.${attribute} >= ${lo} && instance.${attribute} <= ${hi}`;
        const visibilityCondition = ` prob <  ${visibility}`;
        return `if (${rangeCondition}) { if (${visibilityCondition}) { return vec2(${tfx}, ${tfy}); } else { return vec2(0.5); } }`;
    });
    this._recomputeTransferFunction(rules);
    this._rebuildAttribCompute();
}*/
updateVisStatusArray(instancesStRule,visibility)
{
    var numberRemoved=instancesStRule.length-(Math.floor(instancesStRule.length*visibility));
    for(var i=0;i<numberRemoved;i++)
    {
        //console.log(instances[i]['id']);
        this.visStatusArr[instancesStRule[i]['id']]=1;
    }
}
_sort_by_key(array, key)
{
 return array.sort(function(a, b)
 {
  var x = a[key]; 
  var y = b[key];
  return ((x < y) ? -1 : ((x > y) ? 1 : 0));
 });
}
_getCameraPosition()
{
    return [this._camera.position.x,this._camera.position.y,this._camera.position.z];
}
_rebuildAttribCompute(isTreeRules) {
    const gl = this._gl;

    if (this._programs.compute) {
        gl.deleteProgram(this._programs.compute.program);
    }

    const members = [];
    for (const attrib of this._layout) {
        members.push(attrib.type + ' ' + attrib.name + ';');
    }
    const instance = members.join('\n');

    var temp;
    if(isTreeRules)
        temp = this._rules;
    else
        temp = this._rules.join('\n');
    const rules =temp;

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

    const dimensions = this._volume._currentModality.dimensions;
    gl.uniform3i(program.uniforms.imageSize, dimensions.width, dimensions.height, dimensions.depth);
    gl.bindImageTexture(0, this._volume.getTexture(), 0, true, 0, gl.READ_ONLY, gl.R32UI);
    gl.bindImageTexture(1, this._mask, 0, true, 0, gl.WRITE_ONLY, gl.RGBA8);

    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, this._attrib);
    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, this._visibilityStatus);

    const groupsX = Math.ceil(dimensions.width  / this._localSize.x);
    const groupsY = Math.ceil(dimensions.height / this._localSize.y);
    const groupsZ = Math.ceil(dimensions.depth  / this._localSize.z);
    gl.dispatchCompute(groupsX, groupsY, groupsZ);
}
_rebuildProbCompute() {
    const gl = this._gl;

    if (this._programs.compute) {
        gl.deleteProgram(this._programs.compute.program);
    }
    this._programs.compute = WebGL.buildPrograms(gl, {
        compute  : SHADERS.ProbCompute
    }, {
        computeProbability: MIXINS.computeProbability,
        localSizeX: this._localSize.x,
        localSizeY: this._localSize.y,
        localSizeZ: this._localSize.z,
    }).compute;
    this._recomputeProbability();
}
_recomputeProbability() {

    const gl = this._gl;
    var avgProbArray=new Float32Array(this._numberInstance);
    const program = this._programs.compute;
    gl.useProgram(program.program);

    const dimensions = this._volume._currentModality.dimensions;
    gl.uniform3i(program.uniforms.imageSize, dimensions.width, dimensions.height, dimensions.depth);
    gl.bindImageTexture(1, this._volume.getTexture(), 0, true, 0, gl.READ_ONLY, gl.R32UI);
    gl.uniformMatrix4fv(program.uniforms.uMvpInverseMatrix, false, this._mvpInverseMatrix.m);
    gl.uniform1i(program.uniforms.uNumInstances, this._numberInstance);
    //console.log(gl.getParameter(gl.MAX_COMBINED_ATOMIC_COUNTERS));
    const Max_nAtomic=gl.getParameter(gl.MAX_COMBINED_ATOMIC_COUNTERS);
    gl.uniform1i(program.uniforms.uMax_nAtomic, Max_nAtomic);

    const groupsX = Math.ceil(dimensions.width  / this._localSize.x);
    const groupsY = Math.ceil(dimensions.height / this._localSize.y);
    const groupsZ = Math.ceil(dimensions.depth  / this._localSize.z);

    gl.uniform3i(program.uniforms.uVoxelLength, groupsX, groupsY, groupsZ);
     // --------------------------------------------------------------
    var stepSize=Math.floor(Max_nAtomic/2.0);
    let start=0;
    let end=start+stepSize;
    for (; end < this._numberInstance; start+=stepSize) {
        end=start+stepSize;
        if(end> this._numberInstance)
            end= this._numberInstance;

        gl.uniform1ui(program.uniforms.start, start);
        gl.uniform1ui(program.uniforms.end, end);

        const atomicCounter= gl.createBuffer();
        gl.bindBuffer(gl.ATOMIC_COUNTER_BUFFER, atomicCounter);
        gl.bufferData(gl.ATOMIC_COUNTER_BUFFER, new Uint32Array(Max_nAtomic),gl.DYNAMIC_COPY);
        gl.bindBufferBase(gl.ATOMIC_COUNTER_BUFFER, 0, atomicCounter);

        
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bufferSubData(gl.ATOMIC_COUNTER_BUFFER, 0, new Uint32Array(Max_nAtomic));// clear counter

        gl.dispatchCompute(groupsX, groupsY, groupsZ);
        
      
        gl.memoryBarrier(gl.ATOMIC_COUNTER_BARRIER_BIT);
        const result  = new Uint32Array(Max_nAtomic);
        gl.getBufferSubData(gl.ATOMIC_COUNTER_BUFFER, 0, result);
        //console.log(result);
        gl.deleteBuffer(atomicCounter);

        /***** comput avarage  ****/
        var j=0;
        for(var i=start;i<end;i++)
        {
            
            avgProbArray[i]=parseFloat(result[j])/parseFloat(result[j+1]);
            this._elements[i].avgProb=avgProbArray[i];
            j+=2;
        }
    }
    console.log('avg Probabilities..');
    //console.log(this._elements);
    //this._createAvgProbBuffer(avgProbArray);  
}
_getRuleElements(className, hiList, loList) {
    var el = this.clone(this._elements);
    for (var j = 0; j < className.length; j++) {
      if (hiList[j] == null)
        break;
      el = el.filter(x => x[className[j]] < hiList[j] && x[className[j]] >= loList[j])
    }
    
    return el.map(function(x) { 
        var v=new Object();
        v.id=x.id;
        v.avgProb=x.avgProb; 
        return v;});
}
clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = new obj.constructor();
    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}
_createVisibilityStatusBuffer()
{
    const gl = this._gl;
    
    var visStatus_buffer = this.visStatusArr.buffer;
    
    //console.log(visStatus_buffer);
    //if(this._visibilityStatus)
    //{
    //    gl.deleteBuffer(this._visibilityStatus);
    //}

    WebGL.createBuffer(gl, {
        target : gl.SHADER_STORAGE_BUFFER,
        buffer : this._visibilityStatus,
        data   : visStatus_buffer,
        hint : gl.DYNAMIC_COPY
    });
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
    gl.uniform1f(program.uniforms.uVisibility, this.visibility);
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
        format         : gl.RED,
        internalFormat : gl.R32F,
        type           : gl.FLOAT
    };

    return [
        colorBuffer,
        occlusionBuffer
    ];
}

}
  // const cameraPos=[this._camera.position.x,this._camera.position.y,this._camera.position.y];
    //gl.uniform3fv(program.uniforms.uCameraPos,cameraPos);
    //gl.uniformMatrix4fv(program.uniforms.uMvpInverseMatrix, false, this._mvpInverseMatrix.m);
    /*gl.uniform3fv(program.uniforms.uLightPos,this._lightPos);
    gl.uniform1f(program.uniforms.uMinDistance, this._minDepth);
    gl.uniform1f(program.uniforms.uMaxDistance, this._maxDepth);
    gl.uniform1f(program.uniforms.uKs, this._ks);
    gl.uniform1f(program.uniforms.uKt, this._kt);
    
    //--------------------

    /*uniform vec3 uCameraPos;
uniform mat4 uMvpInverseMatrix;
layout(binding = 2) uniform sampler3D uVolume;
float max_gm=5.0;
float min_gm=0.0;
uniform float uKt;
uniform float uKs;
uniform vec3 uLightPos;
uniform float uMinDistance;
uniform float uMaxDistance;*/