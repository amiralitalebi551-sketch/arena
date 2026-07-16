// Procedural displacement of the Neural Core sphere:
// layered noise + sine wave + pointer displacement, driven by uTime.
uniform float uTime;
uniform float uAmplitude;
uniform float uFrequency;
uniform float uMorph;       // 0..1 scroll-driven morph amount
uniform vec3  uPointer;     // pointer in local space
uniform float uPointerStrength;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying float vDisplace;

// snoise + curlNoise injected via #include-like concat at build time.
__NOISE__

void main() {
  vec3 pos = position;

  float t = uTime * 0.35;
  float n1 = snoise(pos * uFrequency + t);
  float n2 = snoise(pos * (uFrequency * 2.1) - t * 1.3) * 0.5;
  float wave = sin(pos.y * 3.0 + uTime * 1.2) * 0.15;
  float displace = (n1 + n2 + wave) * uAmplitude;

  // extra morph turbulence tied to scroll
  displace += snoise(pos * 3.4 + uTime * 0.6) * uMorph * 0.25;

  // pointer bulge: attract surface toward pointer
  float d = distance(normalize(pos), normalize(uPointer + 1e-4));
  float pull = smoothstep(1.2, 0.0, d) * uPointerStrength;
  displace += pull * 0.35;

  vec3 displaced = pos + normal * displace;

  vDisplace = displace;
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
