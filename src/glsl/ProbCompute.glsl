// #package glsl/shaders

// #section ProbCompute/compute

#version 310 es
layout (local_size_x = @localSizeX, local_size_y = @localSizeY, local_size_z = @localSizeZ) in;
//layout (local_size_x = 128, local_size_y = 1, local_size_z = 1) in;

uniform ivec3 imageSize;
uniform ivec3 uVoxelLength;

uniform int uNumInstances;
uniform uint start;
uniform uint end;
uniform int uMax_nAtomic;
uniform mat4 uMvpInverseMatrix;
uniform float vx;
uniform float vy;
uniform float vz;

layout (std430, binding = 0) buffer ssbo {
	uint counter[];
};
//layout (binding=0 , offset=0) uniform atomic_uint counter[8];//counter[uMaxACSize]
layout (r32ui, binding = 1) restrict readonly highp uniform uimage3D iID;

vec3 getPosition3D(ivec3 voxel)
{    
    vec3 pos = vec3(float(voxel.x) * vx, float(voxel.y) * vy, float(voxel.z) * vz); // corner
    pos += vec3(vx * 0.5, vy * 0.5, vz * 0.5); // center

    vec4 dirty = uMvpInverseMatrix * vec4(pos, 1);

    return (dirty.xyz / dirty.w); // division by 1?
}

/*
void atomicCounterAdd(int index, int p)
{
    for(int i=0;i<p;i++)  
    {
        atomicCounterIncrement(counter[index]); //accumulate prbability
    }
}
*/

uint convertProbToInt(float x)
{
    return uint(round(x*100.0));
}

void main() {
    ivec3 voxel = ivec3(gl_GlobalInvocationID);
    uint id = imageLoad(iID, voxel).r;
    if (voxel.x < imageSize.x && voxel.y < imageSize.y && voxel.z < imageSize.z) {
        
        if(id>=start && id< end)
        {
            vec3 pos = getPosition3D(voxel);
            uint p = convertProbToInt(pos.z);//TODO: later use computeProbability(pos);
            int index=(int(id-start))*2;

            atomicAdd(counter[index], p);            
            atomicAdd(counter[index + 1], uint(1));
            //atomicCounterIncrement(counter[++index]);//accumulate number of Voxels
        }
    }

}