import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://michaelcao0.github.io"),
  title: "Zhe Cao · Multimodal AI, Agents & World Models",
  description:
    "Academic homepage of Zhe Cao at Nanjing University — researching multimodal large language models (MLLMs), agentic systems, world models, and reliable ML systems.",
  openGraph: {
    title: "Zhe Cao · Multimodal AI, Agents & World Models",
    description:
      "Undergraduate researcher at Nanjing University working on MLLMs, agentic AI, world models, and reliable evaluation.",
    url: "https://michaelcao0.github.io",
    siteName: "Zhe Cao",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Zhe Cao · Multimodal AI, Agents & World Models",
    description:
      "Undergraduate researcher at Nanjing University working on MLLMs, agentic AI, world models, and reliable evaluation.",
  },
};

const bootScript = `
(() => {
  try {
    const saved = window.localStorage.getItem("theme");
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const theme = saved === "dark" || saved === "light" ? saved : (media.matches ? "dark" : "light");
    document.documentElement.dataset.theme = theme;
    media.addEventListener?.("change", (event) => {
      if (!window.localStorage.getItem("theme")) {
        document.documentElement.dataset.theme = event.matches ? "dark" : "light";
      }
    });
  } catch {
    document.documentElement.dataset.theme = "light";
  }

  try {
    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.media = "print";
    fontLink.href =
      "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400..600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap";
    fontLink.onload = () => {
      fontLink.media = "all";
    };
    document.head.appendChild(fontLink);
  } catch {
    // System font stack fallback remains active
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
