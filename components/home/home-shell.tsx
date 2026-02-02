import { cn } from "@/lib/styles/cn";

import { PageBackground } from "./page-background";

import type { HTMLAttributes } from "react";

type HomeShellProps = HTMLAttributes<HTMLDivElement>;

export function HomeShell({
  className,
  children,
  ...restProps
}: HomeShellProps) {
  return (
    <div
      className={cn(
        "relative min-h-screen bg-white text-zinc-900 dark:bg-[#0b0b0c] dark:text-zinc-100",
        className,
      )}
      {...restProps}
    >
      <PageBackground />
      <div className="relative flex min-h-screen flex-col gap-20">
        {children}
      </div>
    </div>
  );
}
