import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trellis by Lemnisca: the shortest path for your bioprocess",
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
        {/* PT Serif — the accent typeface, a permanent departure from
            Inter-only for headings/emphasis. Linked rather than a local
            @font-face: liquidglass prefetches every @font-face in the
            document, and this way it never enters that scan. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=PT+Serif:ital,wght@0,400;0,700;1,400;1,700&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
