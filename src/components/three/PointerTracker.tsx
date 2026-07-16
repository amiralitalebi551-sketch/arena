"use client";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useRef } from "react";

/**
 * Converts the pointer (or gentle auto-motion on touch devices) into a 3D
 * point on the z=0 plane, written into the shared `pointer` ref.
 */
export function PointerTracker({
  pointer,
  reduced,
}: {
  pointer: React.MutableRefObject<THREE.Vector3>;
  reduced: boolean;
}) {
  const { camera } = useThree();
  const ndc = useRef(new THREE.Vector2(0, 0));
  const isTouch = useRef(false);
  const raycaster = useRef(new THREE.Raycaster());
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const hit = useRef(new THREE.Vector3());

  useEffect(() => {
    isTouch.current =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches;

    const onMove = (e: PointerEvent) => {
      ndc.current.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
    };
    const onOrient = (e: DeviceOrientationEvent) => {
      const gamma = (e.gamma ?? 0) / 45; // left/right tilt
      const beta = ((e.beta ?? 0) - 45) / 45; // front/back tilt
      ndc.current.set(
        THREE.MathUtils.clamp(gamma, -1, 1),
        THREE.MathUtils.clamp(-beta, -1, 1)
      );
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("deviceorientation", onOrient, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("deviceorientation", onOrient);
    };
  }, []);

  useFrame((state) => {
    // Gentle automatic orbit target for touch / reduced motion.
    if (reduced || (isTouch.current && ndc.current.lengthSq() < 0.001)) {
      const t = state.clock.elapsedTime * 0.3;
      ndc.current.set(Math.sin(t) * 0.6, Math.cos(t * 0.8) * 0.4);
    }
    raycaster.current.setFromCamera(ndc.current, camera);
    raycaster.current.ray.intersectPlane(plane.current, hit.current);
    pointer.current.lerp(hit.current, 0.1);
  });

  return null;
}
