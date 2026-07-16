"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { StaticFallback } from "./StaticFallback";

const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => <StaticFallback />,
});

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

export function HeroCanvas() {
  const [state, setState] = useState<"loading" | "webgl" | "fallback">(
    "loading"
  );

  useEffect(() => {
    setState(hasWebGL() ? "webgl" : "fallback");
  }, []);

  if (state === "fallback") return <StaticFallback />;
  if (state === "loading") return <StaticFallback />;
  return <Scene />;
}
