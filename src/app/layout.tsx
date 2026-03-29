import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Buzzd",
  description: "Real-time BAC monitoring from your wearable",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-[oklch(20.8%_0.042_265.755)] antialiased`}
    >
      <body className="min-h-screen bg-[oklch(20.8%_0.042_265.755)] m-0 p-0 flex flex-col">{children}</body>
    </html>
  );
}
