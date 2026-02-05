import Link from "next/link";

import { Button } from "@/components/ui/button";
import { MicroInteractionLink } from "@/components/ui/micro-interaction-link";
import { cn } from "@/lib/styles/cn";

import type { ComponentPropsWithoutRef } from "react";

type MobileNavLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  active?: boolean;
};

export function MobileNavLink({
  active = false,
  className,
  href,
  children,
  ...restProps
}: MobileNavLinkProps) {
  return (
    <Button
      asChild
      className={cn(
        "h-11 w-full justify-start rounded-lg px-4 text-sm transition-[color,background-color,border-color,box-shadow] duration-150",
        active
          ? "bg-zinc-100 font-medium text-zinc-900 hover:bg-zinc-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white",
        className,
      )}
      variant="ghost"
    >
      <MicroInteractionLink preset="text" href={href} {...restProps}>
        {children}
      </MicroInteractionLink>
    </Button>
  );
}
