import { PageLoading } from "@/components/layout";

export default function Loading() {
  return (
    <PageLoading
      title="Projects"
      eyebrow="$ ls projects/"
      description="Loading a curated collection of tools, platforms, and systems."
    />
  );
}
