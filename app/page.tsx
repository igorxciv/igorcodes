import { SiteHeader, SiteShell } from "@/components/layout";
import { HomeMain } from "@/components/page-sections/home";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Short, compelling summary of your home page for search results.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <SiteShell>
      <SiteHeader />
      <HomeMain />
    </SiteShell>
  );
}
