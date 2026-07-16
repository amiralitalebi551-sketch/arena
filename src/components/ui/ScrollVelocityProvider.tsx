"use client";
import { useScrollVelocity } from "@/lib/useScrollVelocity";

/** فعال‌کننده‌ی الگوریتم سرعت اسکرول (CSS var --scroll-vel را منتشر می‌کند). */
export function ScrollVelocityProvider() {
  useScrollVelocity();
  return null;
}
