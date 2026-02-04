import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import "@/styles.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Xicons - SVG Icon Animator",
  description: "A designer-first SVG icon animator that produces production-ready animated icons. Create stunning icon animations with wiggle, pop, bounce, draw, and more presets. Export to React, Framer Motion, CSS, or plain SVG.",
  keywords: ["SVG", "icon", "animation", "animator", "Framer Motion", "React", "CSS", "motion design", "icon design", "animated icons"],
  authors: [{ name: "Framerlists" }],
  creator: "Framerlists",
  openGraph: {
    title: "Xicons - SVG Icon Animator",
    description: "Create stunning animated SVG icons with ease. Export production-ready code for React, Framer Motion, CSS, and more.",
    url: "https://xicons.app",
    siteName: "Xicons",
    images: [
      {
        url: "/Tenicon - OG image.png",
        width: 1200,
        height: 630,
        alt: "Xicons - SVG Icon Animator",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Xicons - SVG Icon Animator",
    description: "Create stunning animated SVG icons with ease. Export production-ready code for React, Framer Motion, CSS, and more.",
    images: ["/Tenicon - OG image.png"],
  },
  icons: {
    icon: [
      { url: "/Tenicon - Favicon light.png", media: "(prefers-color-scheme: light)" },
      { url: "/Tenicon - Favicon dark.png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: "/Tenicon - Favicon light.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
