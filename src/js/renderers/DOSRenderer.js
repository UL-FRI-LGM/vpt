// #package js/main

// #include ../math
// #include ../WebGL.js
// #include ../loaders/AttributesParser.js
// #include ../DoubleBuffer.js
// #include AbstractRenderer.js

class DOSRenderer extends AbstractRenderer {

    constructor(gl, volume, camera, environmentTexture, options) {
        super(gl, volume, environmentTexture, options);

        Object.assign(this, {
            steps: 10,
            slices: 200,
            occlusionScale: 0.01,
            occlusionDecay: 0.9,
            visibility: 0.9,
            _depth: 1,
            _minDepth: -1,
            _maxDepth: 1,
            _lightPos: [0.5, 0.5, 0.5],
            _ks: 0.1,
            _kt: 0.1
        }, options);

        this._programs = WebGL.buildPrograms(gl, {
            integrate: SHADERS.DOSIntegrate,
            render: SHADERS.DOSRender,
            reset: SHADERS.DOSReset,
            transfer: SHADERS.PolarTransferFunction,
        }, MIXINS);

        this._camera = camera;
        this._numberInstance = 0;
        this._rules = [];
        this._layout = [];
        this._attrib = gl.createBuffer();
        this._groupMembership = gl.createBuffer();
        this._mask = null;
        this._elements = [];
        this.visStatusArr = null;
        this._visibilityStatus = gl.createBuffer();
        this._localSize = {
            x: 128,
            y: 1,
            z: 1,
        };

        this._colorStrip = WebGL.createTexture(gl, {
            min: gl.LINEAR,
            mag: gl.LINEAR,
        });

        this._transferFunction = WebGL.createTexture(gl, {
            texture: this._transferFunction,
            width: 256,
            height: 256,
        });

        this._transferFunctionFramebuffer = WebGL.createFramebuffer(gl, {
            color: [this._transferFunction]
        });
    }

    destroy() {
        const gl = this._gl;
        Object.keys(this._programs).forEach(programName => {
            gl.deleteProgram(this._programs[programName].program);
        });

        super.destroy();
    }

    _rebuildBuffers() {
        const gl = this._gl;

        if (this._idFramebuffer) {
            this._idFramebuffer.destroy();
        }

        this._idFramebuffer = new DoubleBuffer(gl, this._getIDFramebufferSpec());

        super._rebuildBuffers();
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

    setAttributes(attributes, layout, elements) {
        const gl = this._gl;

        WebGL.createBuffer(gl, {
            target: gl.SHADER_STORAGE_BUFFER,
            buffer: this._attrib,
            data: attributes || new ArrayBuffer()
        });

        // TODO: only float works for now
        const numberOfInstances = attributes ? (attributes.length / (layout.length * 4)) : 0;

        WebGL.createBuffer(gl, {
            target: gl.SHADER_STORAGE_BUFFER,
            buffer: this._groupMembership,
            data: new ArrayBuffer(numberOfInstances * 4)
        })

        this._layout = layout;
        if (layout) {
            var parser = new AttributesParser();
            this._numberInstance = parser.getInstanceNumberFromRawFile(attributes, layout);
            this.initInstancesArray();
            this._elements = elements;
            this._rebuildProbCompute();
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

    setHtreeRules(rules) {
        this.clearVisStatusArray();

        this._rules = '';
        var _x = rules.map((rule, index) => {
            const attribute = rule.attribute;
            const hi = rule.hi;
            const lo = rule.lo;
            var instancesStRule = this._getRuleElements(attribute, hi, lo);
            this._sort_by_key(instancesStRule, 'avgProb');
            const visibility = (rule.visibility / 100).toFixed(4);
            this.updateVisStatusArray(instancesStRule, visibility);
            const phi = (index / rules.length) * 2 * Math.PI;
            const tfx = (Math.cos(phi) * 0.5 + 0.5).toFixed(4);
            const tfy = (Math.sin(phi) * 0.5 + 0.5).toFixed(4);
            var rangeCondition = '';

            if (attribute.length > 1) {

                for (var i = 0; i < attribute.length; i++) {
                    rangeCondition += `(instance.${attribute[i]} >= float(${lo[i]}) && instance.${attribute[i]} <= float(${hi[i]}))`;

                    if (i < attribute.length - 1) {
                        rangeCondition += `&&`;
                    }
                }
            }
            else {
                rangeCondition += `instance.${attribute[0]} >= float(${lo[0]}) && instance.${attribute[0]} <= float(${hi[0]})`;

            }
            const visibilityCondition = `visStatus> uint(0)`;
            this._rules += `if (${rangeCondition}) { if (${visibilityCondition}) { return vec2(${tfx}, ${tfy}); } else { return vec2(0.5); } }`;
        });
        this._recomputeTransferFunction(rules);
        this._createVisibilityStatusBuffer();
        this._rebuildAttribCompute(true);
    }
    initInstancesArray() {
        this.visStatusArr = new Uint32Array(this._numberInstance);
    }
    clearVisStatusArray() {
        for (var i = 0; i < this._numberInstance; i++) {
            this.visStatusArr[i] = 1;
        }
    }

    setRules(rules) {
        this.clearVisStatusArray();

        this._rules = rules.map((rule, index) => {
            const attribute = rule.attribute;
            const lo = rule.range.x.toFixed(4);
            const hi = rule.range.y.toFixed(4);
            var instancesStRule = this._getRuleElements([attribute], [hi], [lo]);
            this._sort_by_key(instancesStRule, 'avgProb');
            const visibility = (rule.visibility / 100).toFixed(4);
            this.updateVisStatusArray(instancesStRule, visibility);
            const phi = (index / rules.length) * 2 * Math.PI;
            const tfx = (Math.cos(phi) * 0.5 + 0.5).toFixed(4);
            const tfy = (Math.sin(phi) * 0.5 + 0.5).toFixed(4);

            const rangeCondition = `instance.${attribute} >= ${lo} && instance.${attribute} <= ${hi}`;
            const visibilityCondition = `rand(vec2(float(id))).x < ${visibility}`;
            const groupStatement = `sGroupMembership[id] = ${index + 1}u; return vec2(${tfx}, ${tfy});`;
            const backgroundStatement = `sGroupMembership[id] = 0u; return vec2(0.5);`;
            return `if (${rangeCondition}) {
            if (${visibilityCondition}) {
                ${groupStatement}
            } else {
                ${backgroundStatement}
            }
        }`;
        });

        this._recomputeTransferFunction(rules);
        this._createVisibilityStatusBuffer();
        this._rebuildAttribCompute(false);
    }
    updateVisStatusArray(instancesStRule, visibility) {
        var numberRemoved = instancesStRule.length - (Math.floor(instancesStRule.length * visibility));
        for (var i = 0; i < numberRemoved; i++) {
            if (this.visStatusArr[instancesStRule[i]['id']] == 1)
                this.visStatusArr[instancesStRule[i]['id']] = 0;//invisible 
        }
        for (var i = numberRemoved; i < instancesStRule.length; i++) {
            if (this.visStatusArr[instancesStRule[i]['id']] == 1)
                this.visStatusArr[instancesStRule[i]['id']] = 2;//visible
        }
    }
    _sort_by_key(array, key) {
        return array.sort(function (a, b) {
            var x = a[key];
            var y = b[key];
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });
    }

    _getCameraPosition() {
        return [this._camera.position.x, this._camera.position.y, this._camera.position.z];
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
        if (isTreeRules)
            temp = this._rules;
        else
            temp = this._rules.join('\n');
        const rules = temp;

        this._programs.compute = WebGL.buildPrograms(gl, {
            compute: SHADERS.AttribCompute
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
        gl.uniform1f(program.uniforms.uNumInstances, this._numberInstance);
        gl.bindImageTexture(0, this._volume.getTexture(), 0, true, 0, gl.READ_ONLY, gl.R32UI);
        gl.bindImageTexture(1, this._mask, 0, true, 0, gl.WRITE_ONLY, gl.RGBA8);

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, this._attrib);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, this._groupMembership);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 2, this._visibilityStatus);

        const groupsX = Math.ceil(dimensions.width / this._localSize.x);
        const groupsY = Math.ceil(dimensions.height / this._localSize.y);
        const groupsZ = Math.ceil(dimensions.depth / this._localSize.z);
        gl.dispatchCompute(groupsX, groupsY, groupsZ);
    }

    _rebuildProbCompute() {
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
            compute: SHADERS.ProbCompute
        }, {
            computeProbability: MIXINS.computeProbability,
            localSizeX: this._localSize.x,
            localSizeY: this._localSize.y,
            localSizeZ: this._localSize.z,
        }).compute;
        this._recomputeProbability();
    }

    _recomputeProbability() {

        var t0 = performance.now();

        const gl = this._gl;
        const program = this._programs.compute;
        gl.useProgram(program.program);

        const dimensions = this._volume._currentModality.dimensions;
        gl.uniform3i(program.uniforms.imageSize, dimensions.width, dimensions.height, dimensions.depth);
        gl.bindImageTexture(1, this._volume.getTexture(), 0, true, 0, gl.READ_ONLY, gl.R32UI);
        gl.uniformMatrix4fv(program.uniforms.uMvpInverseMatrix, false, this._mvpInverseMatrix.m);

        const Max_nAtomic = this._numberInstance * 2;
        gl.uniform1f(program.uniforms.vx, 1.0 / dimensions.width);
        gl.uniform1f(program.uniforms.vy, 1.0 / dimensions.height);
        gl.uniform1f(program.uniforms.vz, 1.0 / dimensions.depth);

        const ssbo = gl.createBuffer();
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, ssbo);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, ssbo);

        const result = new Uint32Array(Max_nAtomic);
        gl.bufferData(gl.SHADER_STORAGE_BUFFER, result, gl.DYNAMIC_COPY);

        const groupsX = Math.ceil(dimensions.width / this._localSize.x);
        const groupsY = Math.ceil(dimensions.height / this._localSize.y);
        const groupsZ = Math.ceil(dimensions.depth / this._localSize.z);

        gl.dispatchCompute(groupsX, groupsY, groupsZ);
        gl.getBufferSubData(gl.SHADER_STORAGE_BUFFER, 0, result);


        /***** compute avarage  ****/
        var j = 0;
        for (var i = 0; i < this._numberInstance; i++) {
            var prob_float = result[j] / 100.0;
            if (result[j + 1] > 0) {
                this._elements[i].avgProb = prob_float / result[j + 1];
            } else {
                this._elements[i].avgProb = 0;
            }
            j += 2;
        }

        gl.deleteBuffer(ssbo);
        var t1 = performance.now();
        console.log('avg Probability is computed in ' + (t1 - t0) + " milliseconds.");
        //console.log(this._elements); 
    }
    _getRuleElements(className, hiList, loList) {
        var el = this.clone(this._elements);
        for (var j = 0; j < className.length; j++) {
            if (hiList[j] == null)
                break;
            el = el.filter(x => x[className[j]] <= hiList[j] && x[className[j]] >= loList[j])
        }

        return el.map(function (x) {
            var v = new Object();
            v.id = x.id;
            v.avgProb = x.avgProb;
            return v;
        });
    }
    clone(obj) {
        if (null == obj || "object" != typeof obj) return obj;
        var copy = new obj.constructor();
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
        }
        return copy;
    }
    _createVisibilityStatusBuffer() {
        const gl = this._gl;

        var visStatus_buffer = this.visStatusArr.buffer;
        WebGL.createBuffer(gl, {
            target: gl.SHADER_STORAGE_BUFFER,
            buffer: this._visibilityStatus,
            data: visStatus_buffer,
            hint: gl.DYNAMIC_COPY
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
            unit: 0,
            texture: this._colorStrip,
            width: rules.length,
            height: 1,
            data: data
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
        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
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
            gl.COLOR_ATTACHMENT1,
            gl.COLOR_ATTACHMENT2,
            gl.COLOR_ATTACHMENT3,
        ]);

        let program = this._programs.reset;
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
            gl.COLOR_ATTACHMENT1,
            gl.COLOR_ATTACHMENT2,
            gl.COLOR_ATTACHMENT3,
        ]);

        gl.activeTexture(gl.TEXTURE4);
        gl.uniform1i(program.uniforms.uVolume, 4);
        gl.bindTexture(gl.TEXTURE_3D, this._mask);

        gl.activeTexture(gl.TEXTURE5);
        gl.uniform1i(program.uniforms.uIDVolume, 5);
        gl.bindTexture(gl.TEXTURE_3D, this._volume.getTexture());

        gl.activeTexture(gl.TEXTURE6);
        gl.uniform1i(program.uniforms.uTransferFunction, 6);
        gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);

        // TODO: calculate correct blur radius (occlusion scale)
        gl.uniform2f(program.uniforms.uOcclusionScale, this.occlusionScale, this.occlusionScale);
        gl.uniform1f(program.uniforms.uOcclusionDecay, this.occlusionDecay);
        gl.uniform1f(program.uniforms.uVisibility, this.visibility);
        gl.uniformMatrix4fv(program.uniforms.uMvpInverseMatrix, false, this._mvpInverseMatrix.m);

        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, this._groupMembership);

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

            gl.activeTexture(gl.TEXTURE2);
            gl.uniform1i(program.uniforms.uInstanceID, 2);
            gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[2]);

            gl.activeTexture(gl.TEXTURE3);
            gl.uniform1i(program.uniforms.uGroupID, 3);
            gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[3]);

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
            width: this._bufferSize,
            height: this._bufferSize,
            min: gl.NEAREST,
            mag: gl.NEAREST,
            format: gl.RGBA,
            internalFormat: gl.RGBA,
            type: gl.UNSIGNED_BYTE
        }];
    }

    _getAccumulationBufferSpec() {
        const gl = this._gl;

        const colorBuffer = {
            width: this._bufferSize,
            height: this._bufferSize,
            min: gl.NEAREST,
            mag: gl.NEAREST,
            format: gl.RGBA,
            internalFormat: gl.RGBA,
            type: gl.UNSIGNED_BYTE
        };

        const occlusionBuffer = {
            width: this._bufferSize,
            height: this._bufferSize,
            min: gl.NEAREST,
            mag: gl.NEAREST,
            format: gl.RED,
            internalFormat: gl.R32F,
            type: gl.FLOAT
        };

        const instanceIDBuffer = {
            width: this._bufferSize,
            height: this._bufferSize,
            min: gl.NEAREST,
            mag: gl.NEAREST,
            format: gl.RED_INTEGER,
            internalFormat: gl.R32UI,
            type: gl.UNSIGNED_INT
        };

        const groupIDBuffer = {
            width: this._bufferSize,
            height: this._bufferSize,
            min: gl.NEAREST,
            mag: gl.NEAREST,
            format: gl.RED_INTEGER,
            internalFormat: gl.R32UI,
            type: gl.UNSIGNED_INT
        };

        return [
            colorBuffer,
            occlusionBuffer,
            instanceIDBuffer,
            groupIDBuffer
        ];
    }

    _getIDFramebufferSpec() {
        const gl = this._gl;

        const spec = {
            width: this._bufferSize,
            height: this._bufferSize,
            min: gl.NEAREST,
            mag: gl.NEAREST,
            format: gl.RED_INTEGER,
            internalFormat: gl.R32UI,
            type: gl.UNSIGNED_INT
        };

        return [
            spec, // instance ID
            spec  // group ID
        ];
    }

}
