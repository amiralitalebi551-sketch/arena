// Flow-field particle motion around the core with pointer attraction.
uniform float uTime;
uniform float uSize;
uniform vec3  uPointer;
uniform float uPointerStrength;
uniform float uScale;

attribute float aSeed;

varying float vAlpha;

__NOISE__

void main() {
  vec3 pos = position;

  // Organic drift along the curl of the noise field.
  float t = uTime * 0.12;
  vec3 flow = curlNoise(pos * 0.35 + aSeed * 0.5 + t);
  vec3 animated = pos + flow * (0.6 + 0.4 * sin(uTime * 0.5 + aSeed * 6.28));

  // Gentle orbit
  float ang = uTime * 0.05 * (0.6 + aSeed * 0.8);
  float c = cos(ang), s = sin(ang);
  animated.xz = mat2(c, -s, s, c) * animated.xz;

  // Pointer attraction (soft, distance-limited)
  vec3 toPointer = uPointer - animated;
  float dist = length(toPointer);
  float pull = smoothstep(2.5, 0.0, dist) * uPointerStrength;
  animated += normalize(toPointer + 1e-4) * pull * 0.8;

  animated *= uScale;

  vec4 mvPosition = modelViewMatrix * vec4(animated, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float depthFade = clamp(1.0 / (-mvPosition.z * 0.15), 0.2, 1.6);
  gl_PointSize = uSize * depthFade * (0.5 + aSeed * 0.9);
  vAlpha = clamp(0.25 + pull * 0.6 + aSeed * 0.3, 0.0, 0.9);
}
