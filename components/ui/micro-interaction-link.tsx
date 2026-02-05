"use client";

import { motion } from "motion/react";
import Link from "next/link";

import {
  useMicroInteraction,
  type MicroInteractionOptions,
} from "@/hooks/motion/use-micro-interaction";
import { cn } from "@/lib/styles/cn";

import type { ComponentPropsWithoutRef } from "react";

const MotionLink = motion.create(Link);

type MicroInteractionLinkProps = ComponentPropsWithoutRef<typeof Link> &
  MicroInteractionOptions;

export function MicroInteractionLink({
  preset,
  hover,
  tap,
  transition,
  className,
  ...restProps
}: MicroInteractionLinkProps) {
  const { motionProps } = useMicroInteraction({
    preset,
    hover,
    tap,
    transition,
  });

  return (
    <MotionLink
      className={cn("transition-colors duration-150", className)}
      {...motionProps}
      {...restProps}
    />
  );
}
