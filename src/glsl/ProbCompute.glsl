// #package glsl/shaders

// #section ProbCompute/compute

#version 310 es
layout (local_size_x = @localSizeX, local_size_y = @localSizeY, local_size_z = @localSizeZ) in;

uniform ivec3 imageSize;
uniform ivec3 uVoxelLength;

uniform int uNumInstances;
uniform uint start;
uniform uint end;
uniform int uMax_nAtomic;
uniform mat4 uMvpInverseMatrix;

layout (binding=0 , offset=0) uniform atomic_uint counter[8];//counter[uMaxACSize]
layout (r32ui, binding = 1) restrict readonly highp uniform uimage3D iID;



vec3 getPosition3D(ivec3 voxel)
{
    vec3 pos= vec3(voxel.x*uVoxelLength.x,voxel.y*uVoxelLength.y,voxel.z*uVoxelLength.z );
    pos= vec3(pos.x/float(imageSize.x) ,pos.y /float(imageSize.y), pos.z /float(imageSize.z));// between 0-1
    vec4 dirty = uMvpInverseMatrix * vec4(pos, 1);
    return (dirty.xyz / dirty.w);
}
void atomicCounterAdd(int index, int p)
{
    for(int i=0;i<p;i++) // the loop replace the use of atomicCounterAddARB(counter[index],p);  
    {
        atomicCounterIncrement(counter[index]); //accumulate prbability
    }
}
void main() {
    ivec3 voxel = ivec3(gl_GlobalInvocationID);
    uint id = imageLoad(iID, voxel).r;
    if (voxel.x < imageSize.x && voxel.y < imageSize.y && voxel.z < imageSize.z) {
        //if
        if(id>=start && id< end)
        {
            vec3 pos = getPosition3D(voxel);
            int p=int(floor(pos.z));//TODO: computeProbability(pos, color);
            int index=(int(id-start))*2;
            atomicCounterAdd(index, p);
            atomicCounterIncrement(counter[++index]);//accumulate number of Voxels
        }
    }

}