import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AR Experiences Showcase",
  description: "High-fidelity interactive 3D product configurations and mechanical exploded-views built for WebAR.",
};

import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <Script
          src="/spatial-engine.js"
          strategy="beforeInteractive"
          data-preload-chunks="slam"
        />
        <Script
          src="/spatial-extras.js"
          strategy="beforeInteractive"
        />
      </head>
      <body suppressHydrationWarning style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>{children}</body>
    </html>
  );
}
