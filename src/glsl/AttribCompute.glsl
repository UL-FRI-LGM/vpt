// #package glsl/shaders

// #section AttribCompute/compute

#version 310 es
layout (local_size_x = 8, local_size_y = 8, local_size_z = 1) in;

struct Instance {
    @instance
};

layout (std430, binding = 0) buffer bAttributes {
    Instance sInstances[];
};

uniform ivec3 imageSize;
layout (r32ui, binding = 0) restrict readonly highp uniform uimage3D iID;
layout (rgba8, binding = 1) restrict writeonly highp uniform image3D oClassesMask;

vec2 rules(Instance instance) {
    @rules
    return vec2(0, 0);
}

void main() {
    ivec3 voxel = ivec3(gl_GlobalInvocationID);
    if (voxel.x < imageSize.x && voxel.y < imageSize.y && voxel.z < imageSize.z) {
        uint id = imageLoad(iID, voxel).r;
        Instance instance = sInstances[id];
        vec2 mask = rules(instance);
        imageStore(oClassesMask, voxel, vec4(mask, 0, 0));
    }
}
