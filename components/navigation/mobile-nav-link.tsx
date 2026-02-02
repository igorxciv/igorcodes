"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/styles/cn";

import type { ButtonHTMLAttributes } from "react";

type MobileNavLinkProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export function MobileNavLink({
  active = false,
  className,
  type = "button",
  ...restProps
}: MobileNavLinkProps) {
  return (
    <Button
      className={cn(
        "h-11 w-full justify-start rounded-lg px-4 text-sm",
        active
          ? "bg-zinc-100 font-medium text-zinc-900 hover:bg-zinc-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white",
        className,
      )}
      type={type}
      variant="ghost"
      {...restProps}
    />
  );
}
