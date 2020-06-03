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
precision mediump usampler2D;
precision mediump usampler3D;

uniform usampler3D uIDVolume;

uniform usampler2D uInstanceID;
uniform usampler2D uGroupID;

in vec2 vPosition2D;
in vec3 vPosition3D;

layout (location = 0) out uint oInstanceID;
layout (location = 1) out uint oGroupID;

layout (std430, binding = 1) buffer bGroupMembership {
    uint sGroupMembership[];
};

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
    uint newGroupID = sGroupMembership[newInstanceID];

    oInstanceID = newInstanceID;
    oGroupID = newGroupID;
}

// #section IDBuffer/reset/vertex

#version 310 es
precision mediump float;

layout (location = 0) in vec2 aPosition;

void main() {
    gl_Position = vec4(aPosition, 0, 1);
}

// #section IDBuffer/reset/fragment

#version 310 es
precision mediump float;

layout (location = 0) out uint oInstanceID;
layout (location = 1) out uint oGroupID;

void main() {
    oInstanceID = 0u;
    oGroupID = 0u;
}
