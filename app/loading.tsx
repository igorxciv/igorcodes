export default function Loading() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-zinc-900 dark:bg-[#0b0b0c] dark:text-zinc-100">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-gradient-to-br from-emerald-500/20 via-cyan-400/10 to-transparent blur-3xl" />
        <div className="absolute right-[-10%] bottom-0 h-96 w-96 rounded-full bg-gradient-to-tr from-white/10 via-blue-500/10 to-transparent blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_55%)]" />
      </div>
      <div className="relative mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-white/20 dark:border-t-white" />
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Loading experience...
          </p>
        </div>
      </div>
    </div>
  );
}
