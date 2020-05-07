// #package glsl/mixins

// #section getProbability

float random(float p) {
  vec2 p2 = fract(vec2(p * 5.3983, p * 5.4427));
  p2 += dot(p2.yx, p2.xy + vec2(21.5351, 14.3137));
  return fract(p2.x * p2.y * 95.4337);
}
float getProbability(uint id)
{
    //float r=random(float(id));
    float id_float = float(id);
    float total_float = float(4000);
    return fract(id_float/total_float);
}
