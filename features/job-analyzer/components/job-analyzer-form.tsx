"use client";

import { FileText, Link2, Sparkles, Upload } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobAnalyzerDropzone } from "@/features/job-analyzer/components/job-analyzer-dropzone";
import { useJobAnalyzerForm } from "@/features/job-analyzer/hooks/use-job-analyzer-form";
import { cn } from "@/lib/styles/cn";

import type { JobAnalyzerSource } from "@/features/job-analyzer/utils/job-analyzer-schema";
import type { HTMLAttributes } from "react";

type JobAnalyzerFormProps = HTMLAttributes<HTMLDivElement>;

type SourceOption = JobAnalyzerSource;

const sourceOptions: {
  value: SourceOption;
  label: string;
  description: string;
  icon: typeof FileText;
}[] = [
  {
    value: "text",
    label: "Text",
    description: "Paste a full job description.",
    icon: FileText,
  },
  {
    value: "link",
    label: "Link",
    description: "Use the posting URL.",
    icon: Link2,
  },
  {
    value: "pdf",
    label: "PDF",
    description: "Upload a PDF posting.",
    icon: Upload,
  },
];

export function JobAnalyzerForm({
  className,
  ...restProps
}: JobAnalyzerFormProps) {
  const { form, setSource, submitForm } = useJobAnalyzerForm();
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "mt-8 flex flex-col gap-6 rounded-2xl border border-zinc-200/60 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-950/70",
        className,
      )}
      {...restProps}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-[0.2em] text-zinc-500 uppercase dark:text-zinc-400">
          <Sparkles aria-hidden="true" className="size-4 text-emerald-400" />
          job_analyzer.ai
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Analyze job postings to see how candidates fit the role, values, and
          culture.
        </p>
      </div>

      <form onSubmit={submitForm} className="flex flex-col gap-4">
        <form.Subscribe selector={(state) => state.values.source}>
          {(source) => (
            <Tabs value={source} onValueChange={setSource}>
              <TabsList className="grid h-auto w-full grid-cols-1 gap-2 rounded-xl border border-zinc-200/70 bg-zinc-50/80 p-2 sm:grid-cols-3 dark:border-white/10 dark:bg-white/5">
                {sourceOptions.map((option) => {
                  const Icon = option.icon;
                  const triggerId = `job-analyzer-tab-${option.value}`;
                  const panelId = `job-analyzer-panel-${option.value}`;

                  return (
                    <TabsTrigger
                      key={option.value}
                      value={option.value}
                      id={triggerId}
                      aria-controls={panelId}
                      className="h-10 w-full justify-start gap-2 rounded-lg border border-transparent px-3 text-xs font-semibold text-zinc-500 uppercase data-[state=active]:border-zinc-200 data-[state=active]:bg-white data-[state=active]:text-zinc-900 sm:h-[calc(100%-1px)] sm:flex-1 sm:justify-center dark:data-[state=active]:border-white/10 dark:data-[state=active]:bg-white/10 dark:data-[state=active]:text-white"
                    >
                      <Icon aria-hidden="true" className="size-4" />
                      {option.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <div className="mt-4">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={source}
                    role="tabpanel"
                    id={`job-analyzer-panel-${source}`}
                    aria-labelledby={`job-analyzer-tab-${source}`}
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      reduceMotion
                        ? { opacity: 1, y: 0 }
                        : { opacity: 0, y: -6 }
                    }
                    transition={{ duration: 0.24, ease: "easeOut" }}
                    className="flex flex-col gap-2"
                  >
                    {source === "text" && (
                      <form.Field name="jobText">
                        {(field) => (
                          <>
                            <label
                              htmlFor="job-text"
                              className="text-xs font-semibold tracking-[0.18em] text-zinc-500 uppercase dark:text-zinc-400"
                            >
                              Job description
                            </label>
                            <textarea
                              id="job-text"
                              name={field.name}
                              value={field.state.value ?? ""}
                              onChange={(event) =>
                                field.handleChange(event.target.value)
                              }
                              placeholder="Paste the job description here..."
                              rows={6}
                              className="min-h-[140px] rounded-xl border border-zinc-200/70 bg-white/80 px-4 py-3 text-sm text-zinc-900 shadow-inner transition outline-none focus-visible:border-emerald-400/60 focus-visible:ring-2 focus-visible:ring-emerald-400/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                            />
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              Include responsibilities, requirements, and skills
                              for a richer match.
                            </p>
                          </>
                        )}
                      </form.Field>
                    )}

                    {source === "link" && (
                      <form.Field name="jobUrl">
                        {(field) => (
                          <>
                            <label
                              htmlFor="job-url"
                              className="text-xs font-semibold tracking-[0.18em] text-zinc-500 uppercase dark:text-zinc-400"
                            >
                              Job posting link
                            </label>
                            <input
                              id="job-url"
                              name={field.name}
                              value={field.state.value ?? ""}
                              onChange={(event) =>
                                field.handleChange(event.target.value)
                              }
                              placeholder="https://company.com/careers/job-posting"
                              type="url"
                              inputMode="url"
                              className="h-12 rounded-xl border border-zinc-200/70 bg-white/80 px-4 text-sm text-zinc-900 shadow-inner transition outline-none focus-visible:border-emerald-400/60 focus-visible:ring-2 focus-visible:ring-emerald-400/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                            />
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              Use a direct link to the live posting.
                            </p>
                          </>
                        )}
                      </form.Field>
                    )}

                    {source === "pdf" && (
                      <form.Field name="jobFile">
                        {(field) => (
                          <>
                            <label
                              htmlFor="job-pdf"
                              className="text-xs font-semibold tracking-[0.18em] text-zinc-500 uppercase dark:text-zinc-400"
                            >
                              Upload PDF
                            </label>
                            <AnimatePresence mode="wait" initial={false}>
                              {field.state.value ? (
                                <motion.div
                                  key="job-analyzer-file"
                                  initial={
                                    reduceMotion ? false : { opacity: 0, y: 6 }
                                  }
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={
                                    reduceMotion
                                      ? { opacity: 1, y: 0 }
                                      : { opacity: 0, y: -6 }
                                  }
                                  transition={{
                                    duration: 0.2,
                                    ease: "easeOut",
                                  }}
                                  className="flex items-center justify-between rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-100"
                                >
                                  <span className="truncate">
                                    {(field.state.value as File).name}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => field.handleChange(null)}
                                    className="ml-3 text-[10px] font-semibold tracking-[0.2em] text-emerald-200 uppercase transition hover:text-emerald-100"
                                  >
                                    Remove
                                  </button>
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="job-analyzer-dropzone"
                                  initial={
                                    reduceMotion ? false : { opacity: 0, y: 6 }
                                  }
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={
                                    reduceMotion
                                      ? { opacity: 1, y: 0 }
                                      : { opacity: 0, y: -6 }
                                  }
                                  transition={{
                                    duration: 0.2,
                                    ease: "easeOut",
                                  }}
                                >
                                  <JobAnalyzerDropzone
                                    id="job-pdf"
                                    name={field.name}
                                    onFileSelect={(file) =>
                                      field.handleChange(file)
                                    }
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              PDF only, up to 10MB.
                            </p>
                          </>
                        )}
                      </form.Field>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </Tabs>
          )}
        </form.Subscribe>

        <Button
          type="submit"
          variant="outline"
          className="h-12 w-full border-emerald-400/70 text-xs font-semibold tracking-[0.2em] text-emerald-200 uppercase shadow-[0_0_0_1px_rgba(16,185,129,0.15)] transition hover:border-emerald-300 hover:text-emerald-100 dark:border-emerald-400/70 dark:text-emerald-200"
        >
          analyze_job()
        </Button>
      </form>

      <div className="flex flex-col gap-3 rounded-xl border border-dashed border-zinc-200/70 bg-zinc-50/80 p-4 text-xs text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
        {sourceOptions.map((option) => (
          <div key={option.value} className="flex items-center gap-2">
            <span className="text-[10px] font-semibold tracking-[0.18em] text-zinc-400 uppercase dark:text-zinc-500">
              {option.label}
            </span>
            <span>{option.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
