// #package glsl/shaders

// #section AttribCompute/compute

#version 310 es
precision mediump sampler3D;
layout (local_size_x = @localSizeX, local_size_y = @localSizeY, local_size_z = @localSizeZ) in;

struct Instance {
    @instance
};

layout (std430, binding = 0) buffer bAttributes {
    Instance sInstances[];
};

layout (std430, binding = 1) buffer bGroupMembership {
    uint sGroupMembership[];
};

uniform ivec3 imageSize;
layout (r32ui, binding = 0) restrict readonly highp uniform uimage3D iID;
layout (rgba8, binding = 1) restrict writeonly highp uniform image3D oMask;
uniform float uNumInstances;
/*layout(binding = 2) uniform sampler3D uVolume;
uniform vec3 uCameraPos;
float max_gm=5.0;
float min_gm=0.0;
uniform float uKt;
uniform float uKs;
uniform vec3 uLightPos;
uniform float uMinDistance;
uniform float uMaxDistance;*/
@rand
vec2 rules(Instance instance, uint id, float depth) {
    if (id == 0u) {
        sGroupMembership[id] = 0u;
        return vec2(0.5);
    }

    float prob= (rand(vec2(float(id))).x);
    //float prob= rand(vec2(depth)).x;
    //float prob= fract(float(id)/uNumInstances);
    @rules

    sGroupMembership[id] = 0u;
    return vec2(0.5);
}

void main() {
    ivec3 voxel = ivec3(gl_GlobalInvocationID);
    if (voxel.x < imageSize.x && voxel.y < imageSize.y && voxel.z < imageSize.z) {
        //-----------------------------------------------------------------------
        //vec4 color = texelFetch(uVolume, voxel, 0);
        //float prob = computeProbability(voxel,color.a);
         float depth=1.0; //instance depth
        //----------------------------------------------------------------------
        uint id = imageLoad(iID, voxel).r;
        Instance instance = sInstances[id];
        vec2 mask = rules(instance, id ,depth);
        imageStore(oMask, voxel, vec4(mask, 0, 0));

    }
}
