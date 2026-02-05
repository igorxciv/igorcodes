"use client";

import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import {
  useMicroInteraction,
  type MicroInteractionOptions,
} from "@/hooks/motion/use-micro-interaction";
import { cn } from "@/lib/styles/cn";

import type { ComponentPropsWithoutRef } from "react";

type MicroInteractionButtonProps = Omit<
  ComponentPropsWithoutRef<typeof Button>,
  "asChild"
> &
  MicroInteractionOptions;

export function MicroInteractionButton({
  preset,
  hover,
  tap,
  transition,
  className,
  children,
  ...restProps
}: MicroInteractionButtonProps) {
  const { motionProps } = useMicroInteraction({
    preset,
    hover,
    tap,
    transition,
  });

  return (
    <Button
      asChild
      className={cn(
        "transition-[color,background-color,border-color,box-shadow] duration-150",
        className,
      )}
      {...restProps}
    >
      <motion.button {...motionProps}>{children}</motion.button>
    </Button>
  );
}
