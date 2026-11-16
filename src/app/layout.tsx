import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Zhe Cao · Multimodal AI and Agents",
  description:
    "Personal academic homepage for Zhe Cao at Nanjing University, featuring research in multimodal AI, agents, world models, evaluation, and reliable ML systems.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
