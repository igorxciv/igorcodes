"use client";

import { useForm } from "@tanstack/react-form";

import {
  jobAnalyzerSchema,
  type JobAnalyzerSource,
  type JobAnalyzerValues,
} from "../utils/job-analyzer-schema";

import type { SubmitEvent } from "react";

export function useJobAnalyzerForm() {
  const defaultValues: JobAnalyzerValues = {
    source: "text",
    jobText: "",
    jobUrl: "",
    jobFile: null,
  };

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: jobAnalyzerSchema,
    },
    onSubmit: async ({ value }) => {
      void value;
    },
  });

  const setSource = (value: JobAnalyzerSource) => {
    form.setFieldValue("source", value);

    if (value !== "text") {
      form.setFieldValue("jobText", "");
    }

    if (value !== "link") {
      form.setFieldValue("jobUrl", "");
    }

    if (value !== "pdf") {
      form.setFieldValue("jobFile", null);
    }
  };

  const submitForm = (event: SubmitEvent) => {
    event.preventDefault();
    void form.handleSubmit();
  };

  return {
    form,
    setSource,
    submitForm,
  };
}
