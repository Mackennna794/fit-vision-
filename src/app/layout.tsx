import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Use the pre-bundled Geist fonts (already downloaded in /src/app/fonts/)
// This avoids relying on Google Fonts CDN, which may be blocked on some networks.
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FitVision — AR Virtual Try-On SaaS",
    template: "%s | FitVision",
  },
  description:
    "B2B AR Virtual Try-On platform. Integrate real-time garment try-on into any e-commerce store — zero backend GPU cost, powered by WebAssembly and WebGL.",
  keywords: ["AR", "virtual try-on", "e-commerce", "SaaS", "WebGL", "fashion tech"],
  authors: [{ name: "FitVision" }],
  openGraph: {
    title: "FitVision — AR Virtual Try-On SaaS",
    description: "Real-time garment try-on for any store, powered by client-side AI.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased bg-fv-alabaster text-fv-obsidian">
        {children}
      </body>
    </html>
  );
}
