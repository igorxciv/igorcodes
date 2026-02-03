import localFont from "next/font/local";

export const wotfard = localFont({
  src: [
    {
      path: "./fonts/wotfard/wotfard-thin-webfont.woff2",
      weight: "100",
      style: "normal",
    },
    {
      path: "./fonts/wotfard/wotfard-extralight-webfont.woff2",
      weight: "200",
      style: "normal",
    },
    {
      path: "./fonts/wotfard/wotfard-light-webfont.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/wotfard/wotfard-regular-webfont.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/wotfard/wotfard-medium-webfont.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/wotfard/wotfard-semibold-webfont.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/wotfard/wotfard-bold-webfont.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-wotfard",
  display: "swap",
});

export const dankMono = localFont({
  src: [
    {
      path: "./fonts/dank-mono/DankMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/dank-mono/DankMono-Italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "./fonts/dank-mono/DankMono-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-dank-mono",
  display: "swap",
});
