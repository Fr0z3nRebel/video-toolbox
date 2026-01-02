import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GoogleAnalytics } from "./components/GoogleAnalytics";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { SpeedInsights as VercelSpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Video Toolbox - Process Videos Online",
  description: "Professional video tools by Lefty Studios. Extract frames, process videos client-side for maximum privacy and speed.",
  keywords: "video tools, frame extractor, video processing, extract video frame, last frame, client-side processing",
  authors: [{ name: "Lefty Studios" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <Footer />
        </div>
        <GoogleAnalytics />
        <VercelSpeedInsights />
      </body>
    </html>
  );
}
