// #package glsl/shaders

// #section ProbCompute/compute

#version 310 es
precision mediump sampler3D;
layout (local_size_x = @localSizeX, local_size_y = @localSizeY, local_size_z = @localSizeZ) in;

/*struct Instance {
    @instance
    /* float Label
       float RealX1
    *
};*/

/*layout (std430, binding = 0) buffer bAttributes {
    Instance sInstances[];
};*/

uniform ivec3 imageSize;
layout (r32ui, binding = 0) restrict readonly highp uniform uimage3D iID;
//layout (rgba8, binding = 1) restrict writeonly highp uniform image3D oMask;
uniform int uNumInstances;
uniform vec3 uCameraPos;
uniform mat4 uMvpInverseMatrix;

/*layout(binding = 2) uniform sampler3D uVolume;
float max_gm=5.0;
float min_gm=0.0;
uniform float uKt;
uniform float uKs;
uniform vec3 uLightPos;
uniform float uMinDistance;
uniform float uMaxDistance;*/
/*@rand
vec2 rules(Instance instance, uint id) {
    if (id == 0u) { return vec2(0.5); }
    float prob= (rand(vec2(float(id))).x);
    @rules
    return vec2(0.5);
}*/

void main() {
    ivec3 voxel = ivec3(gl_GlobalInvocationID);
    if (voxel.x < imageSize.x && voxel.y < imageSize.y && voxel.z < imageSize.z) {
        uint id = imageLoad(iID, voxel).r;
        

    }

}
