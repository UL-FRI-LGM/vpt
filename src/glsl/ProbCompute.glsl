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
    float vx = 1.0 / float(imageSize.x);
    float vy = 1.0 / float(imageSize.y);
    float vz = 1.0 / float(imageSize.z);
    vec3 pos= vec3(float(voxel.x) * vx,float( voxel.y) * vy, float(voxel.z) * vz); // corner
    pos += vec3(vx * 0.5, vy * 0.5, vz * 0.5); // center
    vec4 dirty = uMvpInverseMatrix * vec4(pos, 1);
    return (dirty.xyz / dirty.w); // division by 1?
}
void atomicCounterAdd(int index, int p)
{
    for(int i=0;i<p;i++)  
    {
        atomicCounterIncrement(counter[index]); //accumulate prbability
    }
}
int convertProbToInt(float x)
{
    return int(round(x*100.0));
}
void main() {
    ivec3 voxel = ivec3(gl_GlobalInvocationID);
    uint id = imageLoad(iID, voxel).r;
    if (voxel.x < imageSize.x && voxel.y < imageSize.y && voxel.z < imageSize.z) {
        
        if(id>=start && id< end)
        {
            vec3 pos = getPosition3D(voxel);
             int p = convertProbToInt(pos.z);//TODO: later use computeProbability(pos);
            int index=(int(id-start))*2;
            atomicCounterAdd(index, p);
            atomicCounterIncrement(counter[++index]);//accumulate number of Voxels
        }
    }

}