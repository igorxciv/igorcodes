import { PageLoading } from "@/components/layout";

export default function Loading() {
  return (
    <PageLoading
      title="About"
      eyebrow="$ cat about.md"
      description="Loading a closer look at the builder, the values, and the interests beyond the code."
    />
  );
}
