uniform vec3 uColorA;
uniform vec3 uColorB;
varying float vAlpha;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float soft = smoothstep(0.5, 0.0, d);
  vec3 color = mix(uColorA, uColorB, vAlpha);
  gl_FragColor = vec4(color, soft * vAlpha);
}
