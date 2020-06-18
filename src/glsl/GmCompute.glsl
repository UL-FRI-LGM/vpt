// #package glsl/shaders
// #section GmCompute/compute

#version 310 es
precision mediump sampler3D;
layout (local_size_x = @localSizeX, local_size_y = @localSizeY, local_size_z = @localSizeZ) in;
uniform mat4 uMvpInverseMatrix;
uniform vec3 uCameraPos;
uniform float vx;
uniform float vy;
uniform float vz;
layout (rgba8, binding = 1) restrict readonly highp uniform image3D uDataVolume;
layout (std430, binding = 0) buffer gm_ssbo {
	uint gmBounds[];
};

vec3 getPosition3D(ivec3 voxel)
{    
    vec3 pos = vec3(float(voxel.x) * vx, float(voxel.y) * vy, float(voxel.z) * vz); // corner
    pos += vec3(vx * 0.5, vy * 0.5, vz * 0.5); // center
    vec4 dirty = uMvpInverseMatrix * vec4(pos, 1);
    return (dirty.xyz / dirty.w); // division by 1?
}
vec3 getGradient(ivec3 voxel) {
    vec4 dataVolumeSample = imageLoad(uDataVolume, voxel);
    return dataVolumeSample.gba;
}

float computeGradientMagnitude(ivec3 voxel) {
    vec3 g = getGradient(voxel);
	return sqrt(g.x*g.x + g.y*g.y + g.z*g.z);
}
uint convertToInt(float x)
{
    return uint(round(x*100.0));
}
void main() {
    ivec3 voxel = ivec3(gl_GlobalInvocationID);
    ivec3 imageSize = imageSize(uDataVolume);
    if (voxel.x < imageSize.x && voxel.y < imageSize.y && voxel.z < imageSize.z) {
        float gm = computeGradientMagnitude(voxel);
        float dist = distance(getPosition3D(voxel),uCameraPos);
        atomicMin(gmBounds[0],convertToInt(gm)); //minGM
        atomicMax(gmBounds[1],convertToInt(gm)); // maxGM 

        atomicMin(gmBounds[2],convertToInt(dist)); 
        atomicMax(gmBounds[3],convertToInt(dist)); 

    }

}