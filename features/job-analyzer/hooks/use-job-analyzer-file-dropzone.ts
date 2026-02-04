"use client";

import { useCallback, useMemo, useState } from "react";

import type { ChangeEvent, DragEvent } from "react";

interface UseJobAnalyzerFileDropzoneOptions {
  onFileSelect: (file: File | null) => void;
  accept?: string[];
}

const DEFAULT_ACCEPT = ["application/pdf"];

export function useJobAnalyzerFileDropzone({
  onFileSelect,
  accept = DEFAULT_ACCEPT,
}: UseJobAnalyzerFileDropzoneOptions) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isDragReject, setIsDragReject] = useState(false);

  const accepts = useMemo(() => new Set(accept), [accept]);

  const matchesAccept = useCallback(
    (file: File | null) => {
      if (!file) {
        return false;
      }

      if (accepts.has(file.type)) {
        return true;
      }

      return file.name.toLowerCase().endsWith(".pdf");
    },
    [accepts],
  );

  const isPdfDrag = useCallback(
    (event: DragEvent) => {
      const item = event.dataTransfer?.items?.[0];
      const type = item?.type ?? "";
      const name = item?.getAsFile?.()?.name ?? "";

      if (accepts.has(type)) {
        return true;
      }

      if (!type && name) {
        return name.toLowerCase().endsWith(".pdf");
      }

      return false;
    },
    [accepts],
  );

  const selectFile = useCallback(
    (file: File | null) => {
      if (!file) {
        onFileSelect(null);
        return;
      }

      if (matchesAccept(file)) {
        onFileSelect(file);
      }
    },
    [matchesAccept, onFileSelect],
  );

  const startDrag = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const pdfDrag = isPdfDrag(event);
      setIsDragActive(pdfDrag);
      setIsDragReject(!pdfDrag);
    },
    [isPdfDrag],
  );

  const endDrag = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
    setIsDragReject(false);
  }, []);

  const allowDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const pdfDrag = isPdfDrag(event);
      setIsDragActive(pdfDrag);
      setIsDragReject(!pdfDrag);
    },
    [isPdfDrag],
  );

  const dropFile = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragActive(false);
      setIsDragReject(false);

      const file = event.dataTransfer.files?.[0] ?? null;
      selectFile(file);
    },
    [selectFile],
  );

  const setFileFromInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      selectFile(file);
    },
    [selectFile],
  );

  return {
    isDragActive,
    isDragReject,
    startDrag,
    endDrag,
    allowDrop,
    dropFile,
    setFileFromInput,
  };
}
