import { Camera, ChefHat, Mountain, Music } from "lucide-react";

import { FeatureGrid } from "@/components/page-sections/shared/feature-grid";
import { SectionTitle } from "@/components/page-sections/shared/section-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/styles/cn";

import type { HTMLAttributes } from "react";

type AboutInterestsProps = HTMLAttributes<HTMLElement>;

type InterestCardProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  description: string;
  icon: typeof Mountain;
};

function InterestCard({
  title,
  description,
  icon: Icon,
  className,
  ...restProps
}: InterestCardProps) {
  return (
    <Card className={cn("overflow-hidden p-0", className)} {...restProps}>
      <div className="relative h-40 w-full border-b border-zinc-200 bg-zinc-100 dark:border-white/10 dark:bg-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.35),_transparent_70%)]" />
        <div className="relative flex h-full items-center justify-center text-xs font-semibold tracking-[0.3em] text-zinc-400 uppercase">
          Image Placeholder
        </div>
      </div>
      <CardContent className="p-6">
        <div className="mb-3 flex items-center gap-2 text-zinc-900 dark:text-white">
          <Icon className="size-4" aria-hidden="true" />
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

export function AboutInterests({
  className,
  ...restProps
}: AboutInterestsProps) {
  return (
    <section className={cn("flex flex-col gap-10", className)} {...restProps}>
      <SectionTitle className="text-2xl sm:text-3xl">
        Beyond the code
      </SectionTitle>
      <FeatureGrid className="md:grid-cols-2 lg:grid-cols-4">
        <InterestCard
          icon={Music}
          title="Guitar"
          description="Finding balance and flow through music."
        />
        <InterestCard
          icon={Mountain}
          title="Hiking"
          description="Resetting in nature and exploring new trails."
        />
        <InterestCard
          icon={Camera}
          title="Photography"
          description="Capturing moments and telling stories visually."
        />
        <InterestCard
          icon={ChefHat}
          title="Cooking"
          description="Experimenting with flavors and techniques."
        />
      </FeatureGrid>
    </section>
  );
}
