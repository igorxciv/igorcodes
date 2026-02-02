import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/styles/cn";

import type { HTMLAttributes } from "react";

type FeatureCardProps = HTMLAttributes<HTMLDivElement>;

type FeatureCardMediaProps = HTMLAttributes<HTMLDivElement>;

type FeatureCardTitleProps = HTMLAttributes<HTMLHeadingElement>;

type FeatureCardDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

export function FeatureCard({
  className,
  children,
  ...restProps
}: FeatureCardProps) {
  return (
    <Card className={className} {...restProps}>
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  );
}

export function FeatureCardMedia({
  className,
  ...restProps
}: FeatureCardMediaProps) {
  return (
    <div
      className={cn("mb-4 h-40 rounded-xl border border-white/10", className)}
      {...restProps}
    />
  );
}

export function FeatureCardTitle({
  className,
  ...restProps
}: FeatureCardTitleProps) {
  return <CardTitle className={className} {...restProps} />;
}

export function FeatureCardDescription({
  className,
  ...restProps
}: FeatureCardDescriptionProps) {
  return <CardDescription className={cn("mt-2", className)} {...restProps} />;
}
