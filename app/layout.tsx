import type { Metadata } from "next";
import { Syne, JetBrains_Mono, Inter, Oswald } from "next/font/google";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";
import { Shell } from "@/components/Shell";

const display = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["500", "600", "700", "800"],
});

const title = Oswald({
  subsets: ["latin"],
  variable: "--font-title",
  weight: ["500", "600", "700"],
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-geist",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "SEAL — Storm Emergency Action Ledger",
  description: "Seal the drain before the rain. Pay crews only when the photo proves it.",
  icons: {
    icon: "/seal-icon.jpg",
    apple: "/seal-icon.jpg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${title.variable} ${sans.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
