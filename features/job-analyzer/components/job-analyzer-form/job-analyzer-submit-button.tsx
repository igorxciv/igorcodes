"use client";

import { motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/styles/cn";

import type { ButtonHTMLAttributes } from "react";

type JobAnalyzerSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function JobAnalyzerSubmitButton({
  className,
  ...restProps
}: JobAnalyzerSubmitButtonProps) {
  const reduceMotion = useReducedMotion();
  const hoverMotion = reduceMotion ? undefined : { y: -1, scale: 1.015 };
  const tapMotion = reduceMotion ? undefined : { y: 0, scale: 0.985 };
  const motionTransition = reduceMotion
    ? undefined
    : { type: "spring" as const, stiffness: 520, damping: 32, mass: 0.6 };

  return (
    <Button
      type="submit"
      variant="outline"
      asChild
      className={cn(
        "h-12 w-full border-emerald-400/70 text-xs font-semibold tracking-[0.2em] text-emerald-700 uppercase shadow-[0_0_0_1px_rgba(16,185,129,0.1)] transition-[color,background-color,border-color,box-shadow] duration-150 hover:border-emerald-500 hover:text-emerald-800 dark:border-emerald-400/70 dark:text-emerald-200 dark:hover:text-emerald-100",
        className,
      )}
      {...restProps}
    >
      <motion.button
        aria-label="Analyze job"
        whileHover={hoverMotion}
        whileTap={tapMotion}
        transition={motionTransition}
      >
        analyze_job()
      </motion.button>
    </Button>
  );
}
