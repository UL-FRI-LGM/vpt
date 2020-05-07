// #package glsl/mixins

// #section computeProbability

vec3 gradient(vec3 pos) { //gradient without normlization
	float h=1;
    vec3 positive = vec3(
        texelFetch(uVolume, pos + vec3( h, 0.0, 0.0)).r,
        texelFetch(uVolume, pos + vec3(0.0,  h, 0.0)).r,
        texelFetch(uVolume, pos + vec3(0.0, 0.0,  h)).r
    );
    vec3 negative = vec3(
        texelFetch(uVolume, pos + vec3(-h, 0.0, 0.0)).r,
        texelFetch(uVolume, pos + vec3(0.0, -h, 0.0)).r,
        texelFetch(uVolume, pos + vec3(0.0, 0.0, -h)).r
    );
    return (positive - negative);
}
float shadingIntensity(vec3 pos )
{
    //Blinn-Phong model
    float ka=0.2;//ambient lighting coefficients
    float kd=0.2;//diffuse lighting coefficients
    float ks=0.2;//specular lighting coefficients
    float specular_exponent=100.0;
    
    vec3 normal = normalize(gradient(pos));
    vec3 viewDir = normalize(uCameraPos-pos);
    vec3 lightDir = normalize(uLightPos-pos);
    float Cd = max(dot(normal, lightDir), 0.0)*kd;
    vec3 H = normalize(lightDir + viewDir);
    float Cs = pow((max(dot(normal, H), 0.0)),specular_exponent)*ks;
    float Ca = ka;
    return (Cd+Cs+Ca);
}
float gradient_magnitud(vec3 pos) {
    vec3 g = gradient(pos);
	return sqrt(g.x*g.x + g.y*g.y + g.z*g.z);
}
float normlized_gradient_magnitud(vec3 pos)
{
    float gm = gradient_magnitud( pos);
	return  (gm-min_gm)/(max_gm-min_gm);
}
float normlized_distance(vec3 pos)
{ 
     return  (distance(pos,uCameraPos)-uMinDistance)/(uMaxDistance-uMinDistance);
}
float computeProbability(vec3 pos,float color_a)
{
    //float color_a=0.0;//can we assume ??
    // pos: current sample position
    // color: current sample color
    // ks & kt two parameters allow intuitive control of the visualization
    float GP=normlized_gradient_magnitud( pos);
    float SP=shadingIntensity( pos );
    float DP=normlized_distance(pos );
    float exponent=pow((uKt*SP*(1.0-DP)*(1.0-color_a)),uKs);
    return pow(GP,exponent);
}
