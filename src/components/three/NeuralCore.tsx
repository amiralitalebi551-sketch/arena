"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { coreVert, coreFrag } from "@/shaders";

interface Props {
  detail: number;
  pointer: React.MutableRefObject<THREE.Vector3>;
  scroll: React.MutableRefObject<number>;
  reduced: boolean;
}

export function NeuralCore({ detail, pointer, scroll, reduced }: Props) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmplitude: { value: 0.28 },
      uFrequency: { value: 1.1 },
      uMorph: { value: 0 },
      uPointer: { value: new THREE.Vector3() },
      uPointerStrength: { value: 0 },
      uColorA: { value: new THREE.Color("#6D5EF6") },
      uColorB: { value: new THREE.Color("#22D3EE") },
      uRimColor: { value: new THREE.Color("#8B7FF9") },
      uFresnelPower: { value: 2.6 },
    }),
    []
  );

  useFrame((state, delta) => {
    if (!matRef.current || !meshRef.current) return;
    const u = matRef.current.uniforms;
    u.uTime.value += reduced ? delta * 0.15 : delta;

    // morph amount from scroll (0..1)
    const target = scroll.current;
    u.uMorph.value += (target - u.uMorph.value) * Math.min(1, delta * 3);

    // pointer -> local space, smoothed
    const p = u.uPointer.value as THREE.Vector3;
    p.lerp(pointer.current, Math.min(1, delta * 4));
    u.uPointerStrength.value = reduced ? 0 : 1;

    // slow autonomous rotation + scroll rotation
    const rot = meshRef.current.rotation;
    rot.y += delta * (reduced ? 0.03 : 0.08);
    rot.x = 0.15 + scroll.current * 0.6;

    // subtle scale breathing / scroll scale
    const s = 1 + Math.sin(u.uTime.value * 0.4) * 0.015 + scroll.current * 0.12;
    meshRef.current.scale.setScalar(s);
  });

  // Map the abstract "detail" budget (48..160) to a safe icosahedron
  // subdivision count. Each subdivision roughly quadruples the triangle
  // count, so we keep this small and bounded to protect polygon budgets.
  const subdivisions = useMemo(() => {
    if (detail >= 160) return 20;
    if (detail >= 96) return 14;
    return 9;
  }, [detail]);

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.4, subdivisions]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={coreVert}
        fragmentShader={coreFrag}
        uniforms={uniforms}
      />
    </mesh>
  );
}
