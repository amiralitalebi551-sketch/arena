"use client";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { NeuralCore } from "./NeuralCore";
import { ParticleField } from "./ParticleField";
import { PointerTracker } from "./PointerTracker";
import { useAdaptiveQuality } from "@/lib/useAdaptiveQuality";
import { useReducedMotion } from "@/lib/useReducedMotion";

export default function Scene() {
  const quality = useAdaptiveQuality();
  const reduced = useReducedMotion();
  const pointer = useRef(new THREE.Vector3());
  const scroll = useRef(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);

  // Scroll progress across the hero (0 at top, 1 when hero scrolled away).
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = wrapRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const total = rect.height + window.innerHeight;
        const progress = THREE.MathUtils.clamp(
          (window.innerHeight - rect.top) / total,
          0,
          1
        );
        scroll.current = progress;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Pause when off-screen.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0.01 }
    );
    io.observe(el);
    const onVis = () => setActive(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div ref={wrapRef} className="absolute inset-0" aria-hidden="true">
      <Canvas
        frameloop={active ? "always" : "never"}
        dpr={quality.dpr}
        gl={{
          antialias: quality.antialias,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 6], fov: 45 }}
        style={{ pointerEvents: "none" }}
      >
        <PerformanceMonitor />
        <AdaptiveDpr pixelated />
        <color attach="background" args={["#0C0D0C"]} />
        <fog attach="fog" args={["#0C0D0C", 6, 14]} />
        <ambientLight intensity={0.4} />
        <pointLight position={[4, 5, 4]} intensity={40} color="#1F9D6B" />
        <pointLight position={[-5, -3, 2]} intensity={25} color="#3FCF8E" />

        <PointerTracker pointer={pointer} reduced={reduced} />
        <NeuralCore
          detail={quality.sphereDetail}
          pointer={pointer}
          scroll={scroll}
          reduced={reduced}
        />
        <ParticleField
          count={quality.particleCount}
          pointer={pointer}
          scroll={scroll}
          reduced={reduced}
        />
      </Canvas>
    </div>
  );
}
