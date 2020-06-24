// #package glsl/shaders

// #section DOSIntegrate/vertex

#version 310 es
precision mediump float;

uniform mat4 uMvpInverseMatrix;
uniform float uDepth;

layout (location = 0) in vec2 aPosition;

out vec2 vPosition2D;
out vec3 vPosition3D;

void main() {
    vec4 dirty = uMvpInverseMatrix * vec4(aPosition, uDepth, 1);
    vPosition3D = dirty.xyz / dirty.w;
    vPosition2D = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0, 1);
}

// #section DOSIntegrate/fragment

#version 310 es
precision mediump float;
precision mediump sampler2D;
precision mediump sampler3D;
precision mediump usampler2D;
precision mediump usampler3D;

uniform sampler3D uMaskVolume;
uniform usampler3D uIDVolume;
uniform sampler3D uDataVolume;
uniform sampler2D uMaskTransferFunction;
uniform sampler2D uDataTransferFunction;

uniform sampler2D uColor;
uniform sampler2D uOcclusion;
uniform usampler2D uInstanceID;
uniform usampler2D uGroupID;

uniform vec2 uOcclusionScale;
uniform float uOcclusionDecay;
uniform float uColorBias;
uniform float uAlphaBias;
uniform float uAlphaTransfer;

in vec2 vPosition2D;
in vec3 vPosition3D;
//-------- for context preserve formula --- 
uniform int uCPF; //bool
uniform float uMinGM;
uniform float uMaxGM;
uniform float uMinDist;
uniform float uMaxDist;
uniform float uKs;
uniform float uKt;
uniform vec3 uLightPos;
uniform vec3 uCameraPos;
//-----------------------------------------
layout (location = 0) out vec4 oColor;
layout (location = 1) out float oOcclusion;
layout (location = 2) out uint oInstanceID;
layout (location = 3) out uint oGroupID;

layout (std430, binding = 0) buffer bGroupMembership {
    uint sGroupMembership[];
};
float computeGradientMagnitude(vec3 g) {
	return sqrt(g.x*g.x + g.y*g.y + g.z*g.z);
}
//==== just for testing CPF ========================
/*
vec3 getGradient(vec3 pos) {
    vec4 dataVolumeSample = texture(uDataVolume, pos);
    return dataVolumeSample.gba;
}
float shadingIntensity(vec3 pos )
{
    //Blinn-Phong model
    float ka=0.20;//ambient lighting coefficient
    float kd=0.20;//diffuse lighting coefficient
    float ks=0.60;//specular lighting coefficient
    float specular_exponent=10.0;

    vec3 normal = normalize(getGradient(pos));
    vec3 viewDir = normalize(uCameraPos-pos);
    vec3 lightDir = normalize(uLightPos-pos);

    float Cd = max(dot(normal,lightDir), 0.0)*kd;
    vec3 H = normalize(lightDir+viewDir);
    float Cs = pow((max(dot(normal,H), 0.0)),specular_exponent)*ks;
    float Ca = ka;
    return (Cd+Cs+Ca);
}
float normlizedGradientMagnitud(vec3 pos)
{
    vec3 g = getGradient(pos);
    float gm = computeGradientMagnitude(g);
	return  (gm-uMinGM)/(uMaxGM-uMinGM);
}
float normlizedDistance(vec3 pos)
{ 
    return  (distance(pos,uCameraPos)-uMinDist)/(uMaxDist-uMinDist);
}
float computeCPF(vec3 pos,float accOpacity)
{
    // pos: current sample position
    // accOpacity: previously accumulated opacity value .. due to (1.0-accOpacity) structures located 
    // behind semitransparent regions will appear more opaque. 
    // ks & kt two parameters allow intuitive control of the visualization
    float SP=shadingIntensity(pos);
    float DP=normlizedDistance(pos);
    float exponent=pow((uKt*SP*(1.0-DP)*(1.0-accOpacity)),uKs);
    float GP=1.0;//normlizedGradientMagnitud(pos);
    return pow(GP,exponent); 
    
}*/
//=====================================================
vec4 getSample(vec3 position) {
    vec4 maskVolumeSample = texture(uMaskVolume, position);
    vec4 dataVolumeSample = texture(uDataVolume, position);
    vec4 maskTransferSample = texture(uMaskTransferFunction, maskVolumeSample.rg);
    //vec4 dataTransferSample = texture(uDataTransferFunction, dataVolumeSample.rg);
    float gm = computeGradientMagnitude(dataVolumeSample.gba);
    vec4 dataTransferSample = texture(uDataTransferFunction, vec2(dataVolumeSample.r,gm));
    //vec3 mixedColor = mix(maskTransferSample.rgb, dataTransferSample.rgb, dataTransferSample.a);
    //vec4 finalColor = vec4(mixedColor, maskTransferSample.a);
    vec3 finalColor = mix(maskTransferSample.rgb, dataTransferSample.rgb, uColorBias);
    float maskAlpha = maskTransferSample.a * mix(1.0, dataTransferSample.a, uAlphaTransfer);
    float finalAlpha = mix(maskAlpha, dataTransferSample.a, uAlphaBias);
    return vec4(finalColor, finalAlpha);
}

float getOcclusion() {
    const vec2 offsets[9] = vec2[](
        vec2(-1, -1),
        vec2( 0, -1),
        vec2( 1, -1),
        vec2(-1,  0),
        vec2( 0,  0),
        vec2( 1,  0),
        vec2(-1,  1),
        vec2( 0,  1),
        vec2( 1,  1)
    );

    const float weights[9] = float[](
        1.0 / 16.0, 2.0 / 16.0, 1.0 / 16.0,
        2.0 / 16.0, 4.0 / 16.0, 2.0 / 16.0,
        1.0 / 16.0, 2.0 / 16.0, 1.0 / 16.0
    );

    float occlusion = 0.0;
    for (int i = 0; i < 9; i++) {
        vec2 occlusionPos = vPosition2D + offsets[i] * uOcclusionScale;
        occlusion += texture(uOcclusion, occlusionPos).r * weights[i];
    }

    return occlusion;
}

void main() {
    float occlusion = getOcclusion();
    vec4 color = texture(uColor, vPosition2D);
    uint instanceID = texture(uInstanceID, vPosition2D).r;
    uint groupID = texture(uGroupID, vPosition2D).r;

    if (any(greaterThan(vPosition3D, vec3(1))) || any(lessThan(vPosition3D, vec3(0)))) {
        oColor = color;
        oOcclusion = occlusion;
        oInstanceID = instanceID;
        oGroupID = groupID;
        return;
    }

    if (groupID == 0u) {
        uint newInstanceID = texture(uIDVolume, vPosition3D).r;
        uint newGroupID = sGroupMembership[newInstanceID];
        if (newGroupID != 0u) {
            oInstanceID = newInstanceID;
            oGroupID = newGroupID;
        } else {
            oInstanceID = instanceID;
            oGroupID = groupID;
        }
    } else {
        oInstanceID = instanceID;
        oGroupID = groupID;
    }

    vec4 transferSample = getSample(vPosition3D);
    
   // if(uCPF==1)
      // transferSample.a *= computeCPF(vPosition3D,color.a);
    transferSample.rgb *= (transferSample.a * occlusion) ;
    oColor = color + transferSample * (1.0 - color.a);
    // TODO: do this calculation right
    oOcclusion = 1.0 - ((1.0 - (occlusion - transferSample.a)) * uOcclusionDecay);
}

// #section DOSRender/vertex

#version 310 es
precision mediump float;

layout (location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #section DOSRender/fragment

#version 310 es
precision mediump float;

uniform mediump sampler2D uAccumulator;

in vec2 vPosition;
out vec4 oColor;

void main() {
    vec4 color = texture(uAccumulator, vPosition);
    oColor = mix(vec4(1), vec4(color.rgb, 1), color.a);
}

// #section DOSReset/vertex

#version 310 es
precision mediump float;

layout (location = 0) in vec2 aPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #section DOSReset/fragment

#version 310 es
precision mediump float;

layout (location = 0) out vec4 oColor;
layout (location = 1) out float oOcclusion;
layout (location = 2) out uint oInstanceID;
layout (location = 3) out uint oGroupID;

void main() {
    oColor = vec4(0, 0, 0, 0);
    oOcclusion = 1.0;
    oInstanceID = 0u;
    oGroupID = 0u;
}
