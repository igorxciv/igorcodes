import { PageLoading } from "@/components/layout";

export default function Loading() {
  return (
    <PageLoading
      title="Blog"
      eyebrow="$ cat blog/*.md"
      description="Loading the latest thoughts on systems, product, and leverage."
    />
  );
}
