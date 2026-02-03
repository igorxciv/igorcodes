import { PageLoading } from "@/components/layout";

export default function Loading() {
  return (
    <PageLoading
      title="Resume"
      eyebrow="$ cat resume.pdf"
      description="Loading experience, skills, and education highlights."
    />
  );
}
