import { HomeMain, HomeShell, SiteHeader } from "@/components/home";

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
    <HomeShell>
      <SiteHeader />
      <HomeMain />
    </HomeShell>
  );
}
