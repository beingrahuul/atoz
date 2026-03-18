import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "atoz - Fast, Free & Local Tools",
  description: "An all-in-one local toolkit for editing, converting, and compressing PDFs and images. Completely private and offline in your browser.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="app-wrapper">
          {children}
        </div>
        <Analytics />
      </body>
    </html>
  );
}
