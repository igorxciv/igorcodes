import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { MicroInteractionLink } from "@/components/ui/micro-interaction-link";
import { cn } from "@/lib/styles/cn";

import type { ComponentPropsWithoutRef, HTMLAttributes } from "react";

type ProjectCardProps = HTMLAttributes<HTMLDivElement>;

type ProjectCardMediaProps = HTMLAttributes<HTMLDivElement>;

type ProjectCardTagsProps = HTMLAttributes<HTMLDivElement>;

type ProjectCardActionsProps = HTMLAttributes<HTMLDivElement>;

type ProjectLinkProps = ComponentPropsWithoutRef<typeof Link>;

export function ProjectCard({
  className,
  children,
  ...restProps
}: ProjectCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden border-zinc-200/70 bg-white dark:border-white/10 dark:bg-white/5",
        className,
      )}
      {...restProps}
    >
      {children}
    </Card>
  );
}

export function ProjectCardMedia({
  className,
  ...restProps
}: ProjectCardMediaProps) {
  return (
    <div
      className={cn(
        "relative h-44 w-full border-b border-zinc-200/70 bg-[linear-gradient(135deg,_rgba(37,99,235,0.12),_rgba(226,232,240,0.9))] dark:border-white/10 dark:bg-[linear-gradient(135deg,_rgba(59,130,246,0.18),_rgba(15,23,42,0.6))]",
        className,
      )}
      {...restProps}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_70%)] dark:bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.3),_transparent_70%)]" />
      <div className="relative flex h-full items-center justify-center text-xs font-semibold tracking-[0.32em] text-zinc-500 uppercase dark:text-zinc-300">
        Image Placeholder
      </div>
    </div>
  );
}

export function ProjectCardContent({
  className,
  ...restProps
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <CardContent className={cn("space-y-4 p-6", className)} {...restProps} />
  );
}

export function ProjectCardTitle({
  className,
  ...restProps
}: HTMLAttributes<HTMLHeadingElement>) {
  return <CardTitle className={cn("text-lg", className)} {...restProps} />;
}

export function ProjectCardDescription({
  className,
  ...restProps
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <CardDescription
      className={cn(
        "text-sm leading-relaxed text-zinc-600 dark:text-zinc-400",
        className,
      )}
      {...restProps}
    />
  );
}

export function ProjectCardTags({
  className,
  ...restProps
}: ProjectCardTagsProps) {
  return (
    <div
      className={cn("flex flex-wrap gap-2 text-xs", className)}
      {...restProps}
    />
  );
}

export function ProjectTag({
  className,
  ...restProps
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-zinc-200/80 bg-white text-[11px] text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300",
        className,
      )}
      {...restProps}
    />
  );
}

export function ProjectCardActions({
  className,
  ...restProps
}: ProjectCardActionsProps) {
  return (
    <div className={cn("flex flex-wrap gap-3", className)} {...restProps} />
  );
}

export function ProjectLink({ className, ...restProps }: ProjectLinkProps) {
  return (
    <Button
      asChild
      size="sm"
      variant="ghost"
      className={cn(
        "px-0 text-sm text-zinc-600 transition-[color,background-color,border-color,box-shadow] duration-150 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white",
        className,
      )}
    >
      <MicroInteractionLink preset="text" {...restProps} />
    </Button>
  );
}
