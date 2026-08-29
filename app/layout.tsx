import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trellis by Lemnisca — the shortest path for your bioprocess",
  description:
    "Trellis builds one evolving model of your process from plate to pilot to production, so every experiment adds evidence for the next decision.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link
          rel="preload"
          href="/fonts/inter-latin-wght-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
