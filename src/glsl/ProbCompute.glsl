// #package glsl/shaders

// #section ProbCompute/compute

#version 310 es
layout (local_size_x = @localSizeX, local_size_y = @localSizeY, local_size_z = @localSizeZ) in;

uniform ivec3 imageSize;
uniform int uNumInstances;
uniform uint start;
uniform uint end;
uniform int uMax_nAtomic;


layout (binding=0 , offset=0) uniform atomic_uint counter[8];//[uMaxACSize]
layout (r32ui, binding = 1) restrict readonly highp uniform uimage3D iID;

void main() {
    ivec3 voxel = ivec3(gl_GlobalInvocationID);
    uint id = imageLoad(iID, voxel).r;
    if (voxel.x < imageSize.x && voxel.y < imageSize.y && voxel.z < imageSize.z) {
        if(id>=start && id< end)
        {
            float p=1.0;//TODO: compute prbability
            uint index=id-start;
           // atomicCounterAddARB(counter[index],p); //accumulate prbability 
            atomicCounterIncrement(counter[index]);
            atomicCounterIncrement(counter[++index]);//accumulate number of Voxels
        }
    }

}
