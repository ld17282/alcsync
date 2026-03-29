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
      <head>
        <meta name="theme-color" content="oklch(20.8% 0.042 265.755)" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preload" href="/assets/buzzd-logo.svg" as="image" type="image/svg+xml" />
      </head>
      <body className="min-h-screen bg-black m-0 p-0 font-righteous" suppressHydrationWarning>
        <div className="min-h-screen flex justify-center bg-black">
          <div className="w-full max-w-[430px] min-h-screen relative bg-[oklch(20.8%_0.042_265.755)]">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
