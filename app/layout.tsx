import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import "slot-text/style.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "DigiBoard — Digital Split-Flap Display",
  description:
    "Compose messages, run live clocks and countdowns, and present them on a tactile browser-based split-flap display.",
  applicationName: "DigiBoard",
  openGraph: {
    title: "DigiBoard — Digital Split-Flap Display",
    description:
      "A tactile browser-based split-flap board with live programs, sound, and a full-screen presentation mode.",
    type: "website",
    siteName: "DigiBoard",
  },
  twitter: {
    card: "summary_large_image",
    title: "DigiBoard — Digital Split-Flap Display",
    description:
      "A tactile browser-based split-flap board with live programs, sound, and a full-screen presentation mode.",
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full antialiased font-sans",
        geistSans.variable,
        geistMono.variable,
        inter.variable,
      )}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
