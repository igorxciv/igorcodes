"use client";

import { useReducedMotion } from "motion/react";
import { useMemo } from "react";

import type { TargetAndTransition, Transition } from "motion/react";

type MicroInteractionPreset = "lift" | "text" | "icon";

interface MicroInteractionOptions {
  preset?: MicroInteractionPreset;
  hover?: TargetAndTransition;
  tap?: TargetAndTransition;
  transition?: Transition;
}

const DEFAULT_TRANSITION: Transition = {
  type: "spring",
  stiffness: 520,
  damping: 32,
  mass: 0.6,
};

const PRESET_CONFIG: Record<
  MicroInteractionPreset,
  { hover: TargetAndTransition; tap: TargetAndTransition }
> = {
  lift: {
    hover: { y: -1, scale: 1.015 },
    tap: { y: 0, scale: 0.985 },
  },
  text: {
    hover: { y: -1 },
    tap: { y: 0, scale: 0.98 },
  },
  icon: {
    hover: { y: -1, scale: 1.04 },
    tap: { y: 0, scale: 0.96 },
  },
};

export function useMicroInteraction(options: MicroInteractionOptions = {}) {
  const reduceMotion = useReducedMotion();
  const preset = options.preset ?? "lift";
  const presetConfig = PRESET_CONFIG[preset];
  const hover = options.hover ?? presetConfig.hover;
  const tap = options.tap ?? presetConfig.tap;
  const transition = options.transition ?? DEFAULT_TRANSITION;

  const motionProps = useMemo(() => {
    if (reduceMotion) {
      return {};
    }

    return {
      whileHover: hover,
      whileTap: tap,
      transition,
    };
  }, [reduceMotion, hover, tap, transition]);

  const getMotionProps = <T extends Record<string, unknown>>(
    userProps?: T,
  ) => ({
    ...motionProps,
    ...(userProps ?? {}),
  });

  return { motionProps, getMotionProps, reduceMotion };
}

export type { MicroInteractionOptions, MicroInteractionPreset };
