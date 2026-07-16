"use client";
import { motion, useScroll, useSpring } from "framer-motion";

/** نوار باریک بالای صفحه که میزان پیشرفت اسکرول را نشان می‌دهد. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  });

  return (
    <motion.div
      style={{ scaleX }}
      aria-hidden="true"
      className="scroll-progress fixed inset-x-0 top-0 z-[95] h-[3px] origin-right bg-gradient-to-l from-primary via-accent to-warm"
    />
  );
}
