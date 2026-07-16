"use client";

export type QualityTier = "low" | "medium" | "high";

export interface QualitySettings {
  tier: QualityTier;
  dpr: [number, number];
  particleCount: number;
  sphereDetail: number;
  antialias: boolean;
  shadows: boolean;
}

const PRESETS: Record<QualityTier, QualitySettings> = {
  low: {
    tier: "low",
    dpr: [1, 1],
    particleCount: 900,
    sphereDetail: 48,
    antialias: false,
    shadows: false,
  },
  medium: {
    tier: "medium",
    dpr: [1, 1.5],
    particleCount: 2200,
    sphereDetail: 96,
    antialias: true,
    shadows: false,
  },
  high: {
    tier: "high",
    dpr: [1, 2],
    particleCount: 4000,
    sphereDetail: 160,
    antialias: true,
    shadows: false,
  },
};

/** Estimate an initial tier from device characteristics. */
export function detectInitialTier(): QualityTier {
  if (typeof window === "undefined") return "medium";
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const width = window.innerWidth;
  const dpr = window.devicePixelRatio ?? 1;

  if (width < 640 || cores <= 4 || mem <= 4) return "low";
  if (width < 1280 || cores <= 8 || dpr > 2) return "medium";
  return "high";
}

export function getSettings(tier: QualityTier): QualitySettings {
  return PRESETS[tier];
}

export function downgrade(tier: QualityTier): QualityTier {
  if (tier === "high") return "medium";
  if (tier === "medium") return "low";
  return "low";
}
