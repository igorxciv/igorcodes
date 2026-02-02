"use client";

import { useAnimationControls, useReducedMotion } from "motion/react";
import { useTheme } from "next-themes";
import { useCallback, useRef } from "react";

interface ThemeToggleAnimation {
  iconControls: ReturnType<typeof useAnimationControls>;
  toggleTheme: () => void;
}

export function useThemeToggleAnimation(): ThemeToggleAnimation {
  const { setTheme } = useTheme();
  const iconControls = useAnimationControls();
  const shouldReduceMotion = useReducedMotion();
  const animatingRef = useRef(false);

  const toggleTheme = useCallback(async () => {
    if (animatingRef.current) return;
    animatingRef.current = true;
    const isDark = document.documentElement.classList.contains("dark");
    if (!shouldReduceMotion) {
      await iconControls.start({
        rotate: -22,
        scale: 0.6,
        opacity: 0,
        transition: {
          scale: { duration: 0.16, ease: "easeIn" },
          opacity: { duration: 0.16, ease: "easeIn" },
          rotate: { delay: 0.04, duration: 0.16, ease: "easeIn" },
        },
      });
    }
    setTheme(isDark ? "light" : "dark");
    if (!shouldReduceMotion) {
      await iconControls.start({
        rotate: [18, -10, 0],
        scale: [0.7, 1.16, 0.94, 1],
        opacity: 1,
        transition: {
          scale: { duration: 0.34, ease: "easeOut" },
          opacity: { duration: 0.22, ease: "easeOut" },
          rotate: { delay: 0.05, duration: 0.3, ease: "easeOut" },
        },
      });
    }
    animatingRef.current = false;
  }, [iconControls, setTheme, shouldReduceMotion]);

  return { iconControls, toggleTheme };
}
