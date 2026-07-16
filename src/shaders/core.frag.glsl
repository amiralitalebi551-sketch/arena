// Dynamic gradient + fresnel rim light for the Neural Core.
uniform float uTime;
uniform vec3  uColorA;
uniform vec3  uColorB;
uniform vec3  uRimColor;
uniform float uFresnelPower;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying float vDisplace;

void main() {
  vec3 viewDir = normalize(vViewPosition);
  vec3 normal = normalize(vNormal);

  // Fresnel / rim
  float fresnel = pow(1.0 - clamp(dot(viewDir, normal), 0.0, 1.0), uFresnelPower);

  // Dynamic gradient driven by displacement + slow time
  float g = clamp(vDisplace * 2.0 + 0.5 + sin(uTime * 0.4) * 0.1, 0.0, 1.0);
  vec3 base = mix(uColorA, uColorB, g);

  // Simple key light
  vec3 lightDir = normalize(vec3(0.6, 0.8, 0.5));
  float diff = clamp(dot(normal, lightDir), 0.0, 1.0);
  vec3 lit = base * (0.35 + diff * 0.75);

  vec3 color = lit + uRimColor * fresnel * 1.3;

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
