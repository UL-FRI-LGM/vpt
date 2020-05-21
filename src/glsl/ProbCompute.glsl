// #package glsl/shaders

// #section ProbCompute/compute

#version 310 es
layout (local_size_x = @localSizeX, local_size_y = @localSizeY, local_size_z = @localSizeZ) in;

uniform ivec3 imageSize;
uniform int uNumInstances;
uniform uint start;
uniform uint end;
uniform int uMax_nAtomic;

@computeProbability //TODO: need to change

layout (binding=0 , offset=0) uniform atomic_uint counter[8];//counter[uMaxACSize]
layout (r32ui, binding = 1) restrict readonly highp uniform uimage3D iID;

void main() {
    ivec3 voxel = ivec3(gl_GlobalInvocationID);
    uint id = imageLoad(iID, voxel).r;
    if (voxel.x < imageSize.x && voxel.y < imageSize.y && voxel.z < imageSize.z) {
        if(id>=start && id< end)
        {
            int p=1;//TODO: computePrbability(pos, color);
            uint index=id-start;
            for(int i=0;i<p;i++) // the loop replace the use of atomicCounterAddARB(counter[index],p);  
            {
                atomicCounterIncrement(counter[index]); //accumulate prbability
            }
            atomicCounterIncrement(counter[++index]);//accumulate number of Voxels
        }
    }

}