import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
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
      className={cn("overflow-hidden border-white/10 bg-white/5", className)}
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
        "relative h-44 w-full border-b border-white/10 bg-[linear-gradient(135deg,_rgba(59,130,246,0.18),_rgba(15,23,42,0.6))]",
        className,
      )}
      {...restProps}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.3),_transparent_70%)]" />
      <div className="relative flex h-full items-center justify-center text-xs font-semibold tracking-[0.32em] text-zinc-300 uppercase">
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
      className={cn("text-sm leading-relaxed text-zinc-400", className)}
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
        "border-white/10 bg-white/5 text-[11px] text-zinc-300",
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
      className={cn("px-0 text-sm text-zinc-300 hover:text-white", className)}
    >
      <Link {...restProps} />
    </Button>
  );
}
