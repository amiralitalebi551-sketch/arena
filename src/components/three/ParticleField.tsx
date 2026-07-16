"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { particlesVert, particlesFrag } from "@/shaders";

interface Props {
  count: number;
  pointer: React.MutableRefObject<THREE.Vector3>;
  scroll: React.MutableRefObject<number>;
  reduced: boolean;
}

export function ParticleField({ count, pointer, scroll, reduced }: Props) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Points>(null);

  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // distribute on a shell around the core with some radial noise
      const r = 2.0 + Math.random() * 2.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      seeds[i] = Math.random();
    }
    return { positions, seeds };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 14 },
      uScale: { value: 1 },
      uPointer: { value: new THREE.Vector3() },
      uPointerStrength: { value: 0 },
      uColorA: { value: new THREE.Color("#3FCF8E") },
      uColorB: { value: new THREE.Color("#5CE0A5") },
    }),
    []
  );

  useFrame((state, delta) => {
    if (!matRef.current || !groupRef.current) return;
    const u = matRef.current.uniforms;
    u.uTime.value += reduced ? delta * 0.2 : delta;
    (u.uPointer.value as THREE.Vector3).lerp(
      pointer.current,
      Math.min(1, delta * 3.5)
    );
    u.uPointerStrength.value = reduced ? 0 : 1;
    u.uScale.value += (1 + scroll.current * 0.35 - u.uScale.value) * Math.min(1, delta * 3);
    groupRef.current.rotation.y += delta * (reduced ? 0.01 : 0.03);
  });

  return (
    <points ref={groupRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-aSeed"
          count={count}
          array={seeds}
          itemSize={1}
          args={[seeds, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={particlesVert}
        fragmentShader={particlesFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
