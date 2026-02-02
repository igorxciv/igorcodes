export default function Forbidden() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0b0c] text-zinc-100">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-gradient-to-br from-rose-500/20 via-emerald-400/10 to-transparent blur-3xl" />
        <div className="absolute right-[-10%] bottom-0 h-96 w-96 rounded-full bg-gradient-to-tr from-white/10 via-blue-500/10 to-transparent blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_55%)]" />
      </div>
      <div className="relative mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[11px] text-zinc-300">
            <span className="text-rose-300">403</span> forbidden
          </span>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">
            Access denied.
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-base">
            You do not have permission to view this page.
          </p>
        </div>
      </div>
    </div>
  );
}
