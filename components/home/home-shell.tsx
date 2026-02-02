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
        "relative min-h-screen overflow-hidden bg-[#0b0b0c] text-zinc-100",
        className,
      )}
      {...restProps}
    >
      <PageBackground />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 pt-10 pb-20 sm:px-10">
        {children}
      </div>
    </div>
  );
}
