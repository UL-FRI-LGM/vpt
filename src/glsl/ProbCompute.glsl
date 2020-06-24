// #package glsl/shaders

// #section ProbCompute/compute

#version 310 es
precision mediump sampler3D;
layout (local_size_x = @localSizeX, local_size_y = @localSizeY, local_size_z = @localSizeZ) in;

uniform mat4 uMvpInverseMatrix;
uniform float vx;
uniform float vy;
uniform float vz;
//-------- for context preserve formula --- 
uniform int uCPF; //bool
uniform float uMinGM;
uniform float uMaxGM;
uniform float uMinDist;
uniform float uMaxDist;
uniform float uKs;
uniform float uKt;
uniform vec3 uLightPos;
uniform vec3 uCameraPos;
//-----------------------------------------
layout (r32ui, binding = 1) restrict readonly highp uniform uimage3D iID;
layout (rgba8, binding = 2) restrict readonly highp uniform image3D uDataVolume;
layout (std430, binding = 0) buffer ssbo {
	uint counter[];
};
vec3 getPosition3D(ivec3 voxel)
{    
    vec3 pos = vec3(float(voxel.x) * vx, float(voxel.y) * vy, float(voxel.z) * vz); // corner
    pos += vec3(vx * 0.5, vy * 0.5, vz * 0.5); // center
    //vec4 dirty = uMvpInverseMatrix * vec4(pos, 1);
    return pos;//(dirty.xyz / dirty.w); // division by 1?
}
float getDepth(vec3 pos)
{    
    vec4 dirty = uMvpInverseMatrix * vec4(pos, 1);
    return (dirty.xyz / dirty.w).z; // division by 1?
}
vec3 getGradient(ivec3 voxel) {
    vec4 dataVolumeSample = imageLoad(uDataVolume, voxel);
    return dataVolumeSample.gba;
}
uint convertProbToInt(float x)
{
    return uint(round(x*100.0));
}
@computeCPF
void main() {
    ivec3 voxel = ivec3(gl_GlobalInvocationID);
    ivec3 imageSize = imageSize(iID);
    uint id = imageLoad(iID, voxel).r;
    if (voxel.x < imageSize.x && voxel.y < imageSize.y && voxel.z < imageSize.z) {
        vec3 pos = getPosition3D(voxel);
        float prob;
        if(uCPF == 0)
        {
            prob = distance(pos,uCameraPos); 
            //prob =getDepth(pos); //prob based on depth
        }
        else
        {
           // float accOpacity = imageLoad(uColor, voxel).a;
            prob = computeCPF(pos,voxel); // prob based on context preserved formula
        }
        uint p = convertProbToInt(prob); 
        int index=(int(id))*2;
        atomicAdd(counter[index], p);            
        atomicAdd(counter[index + 1], uint(1));
    }

}