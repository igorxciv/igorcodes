import { HomeMain, HomeShell, SiteHeader } from "@/components/home";

export default function Home() {
  return (
    <HomeShell>
      <SiteHeader />
      <HomeMain />
    </HomeShell>
  );
}
