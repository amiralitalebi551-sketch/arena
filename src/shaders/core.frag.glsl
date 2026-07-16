// Dynamic gradient + iridescent fresnel rim light for the Neural Core.
uniform float uTime;
uniform vec3  uColorA;
uniform vec3  uColorB;
uniform vec3  uRimColor;
uniform float uFresnelPower;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying float vDisplace;

// رنگ‌آمیزی رنگین‌کمانی (iridescent) بر پایه‌ی زاویه‌ی دید برای درخشش soap-bubble
vec3 iridescence(float t) {
  return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67)));
}

void main() {
  vec3 viewDir = normalize(vViewPosition);
  vec3 normal = normalize(vNormal);

  // Fresnel / rim
  float fresnel = pow(1.0 - clamp(dot(viewDir, normal), 0.0, 1.0), uFresnelPower);

  // گرادیان پویا بر پایه‌ی جابجایی سطح + زمان آرام
  float g = clamp(vDisplace * 2.0 + 0.5 + sin(uTime * 0.4) * 0.1, 0.0, 1.0);
  vec3 base = mix(uColorA, uColorB, g);

  // نور اصلی
  vec3 lightDir = normalize(vec3(0.6, 0.8, 0.5));
  float diff = clamp(dot(normal, lightDir), 0.0, 1.0);
  vec3 lit = base * (0.32 + diff * 0.78);

  // درخشش داخلی (inner glow) در دره‌های جابجایی
  float inner = smoothstep(0.15, -0.15, vDisplace);
  lit += uColorA * inner * 0.35;

  // لبه‌ی رنگین‌کمانی که با زمان و جابجایی می‌چرخد
  vec3 irid = iridescence(fresnel * 0.8 + uTime * 0.05 + vDisplace);
  vec3 rim = mix(uRimColor, irid, 0.55) * fresnel * 1.5;

  // specular sparkle ظریف روی برجستگی‌ها
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(clamp(dot(normal, halfDir), 0.0, 1.0), 48.0) * 0.6;

  vec3 color = lit + rim + spec;

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
