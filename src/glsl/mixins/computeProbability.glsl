// #package glsl/mixins

// #section computeProbability

float shadingIntensity(vec3 pos ,ivec3 voxel)
{
    //Blinn-Phong model
    float ka=0.2;//ambient lighting coefficient
    float kd=0.2;//diffuse lighting coefficient
    float ks=0.2;//specular lighting coefficient
    float specular_exponent=100.0;

    vec3 normal = normalize(getGradient(voxel));
    vec3 viewDir = normalize(uCameraPos-pos);
    vec3 lightDir = normalize(uLightPos-pos);

    float Cd = max(dot(normal,lightDir), 0.0)*kd;
    vec3 H = normalize(lightDir+viewDir);
    float Cs = pow((max(dot(normal,H), 0.0)),specular_exponent)*ks;
    float Ca = ka;
    return (Cd+Cs+Ca);
}

float computeGradientMagnitude(ivec3 voxel) {
    vec3 g = getGradient(voxel);
	return sqrt(g.x*g.x + g.y*g.y + g.z*g.z);
}
float normlizedGradientMagnitud(ivec3 voxel)
{
    float gm = computeGradientMagnitude(voxel);
	return  (gm-uMinGM)/(uMaxGM-uMinGM);
}
float normlizedDistance(vec3 pos)
{ 
    return  (distance(pos,uCameraPos)-uMinDist)/(uMaxDist-uMinDist);
}
float computeProbability(vec3 pos,ivec3 voxel)
{
    // pos: current sample position
    // accColor.a: previously accumulated opacity value .. due to (1.0-accColor.a) structures located 
    // behind semitransparent regions will appear more opaque. 
    // ks & kt two parameters allow intuitive control of the visualization
    float SP=shadingIntensity(pos,voxel);
    float DP=normlizedDistance(pos);
    //float exponent=pow((uKt*SP*(1.0-DP)*(1.0-accColor.a)),uKs);
    float exponent=pow(uKt*SP*(DP),uKs);

    float GP=normlizedGradientMagnitud(voxel);
    float prob= pow(GP,exponent); 
    return prob;
}


/*
Regions with low gradient magnitude (left, top) and high shading intensity (left, center) are more likely to be suppressed. 
Due to the inclusion of the eye distance (left, bottom), this suppression will be strongest for regions close
*/