// #package glsl/shaders

// #section IDBuffer/render/vertex

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

// #section IDBuffer/render/fragment

#version 310 es
precision mediump float;

uniform usampler3D uIDVolume;

uniform usampler2D uInstanceID;
uniform usampler2D uGroupID;

in vec2 vPosition2D;
in vec3 vPosition3D;

layout (location = 0) out uint oInstanceID;
layout (location = 1) out uint oGroupID;

struct Instance {
    @instance
};

layout (std430, binding = 0) buffer bAttributes {
    Instance sInstances[];
};

@rand

uint getGroupID(Instance instance, uint instanceId) {
    if (id == 0u) { return 0u; }
    @groupRules
    return 0u;
}

void main() {
    uint instanceID = texture(uInstanceID, vPosition2D).r;
    uint groupID = texture(uGroupID, vPosition2D).r;

    if (groupID != 0u) {
        oInstanceID = instanceID;
        oGroupID = groupID;
        return;
    }

    if (any(greaterThan(vPosition3D, vec3(1))) || any(lessThan(vPosition3D, vec3(0)))) {
        oInstanceID = instanceID;
        oGroupID = groupID;
        return;
    }

    uint newInstanceID = texture(uIDVolume, vPosition3D).r;
    Instance instance = sInstances[instanceID];
    uint newGroupID = getGroupID(instance, instanceID);

    oInstanceID = newInstanceID;
    oGroupID = newGroupID;
}

// #section IDBuffer/reset/vertex

#version 310 es
precision mediump float;

void main() {

}

// #section IDBuffer/reset/fragment

#version 310 es
precision mediump float;

void main() {

}
