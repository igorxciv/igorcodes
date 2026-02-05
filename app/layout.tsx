import { ThemeProvider } from "@/components/theme-provider";

import { dankMono, wotfard } from "./fonts";

import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Igor — Principal Engineer",
    template: "%s | Igor",
  },
  description:
    "Principal Engineer at Electives building live learning platforms. Full-stack since 2014 with a focus on performance, accessibility, and developer experience.",
  applicationName: "Igor",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Igor — Principal Engineer",
    description:
      "Principal Engineer at Electives building live learning platforms. Full-stack since 2014 with a focus on performance, accessibility, and developer experience.",
    siteName: "Igor",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Igor — Open Graph image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Igor — Principal Engineer",
    description:
      "Principal Engineer at Electives building live learning platforms. Full-stack since 2014 with a focus on performance, accessibility, and developer experience.",
    images: ["/twitter-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${wotfard.variable} ${dankMono.variable}`}
    >
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
