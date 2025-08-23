import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { synonim, amulya, satoshi } from "@/font/font";
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
  title: "Ainalytic",
  description: "Ai Analytics app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${amulya.variable} font-sans  bg-gray-100`}>
        <div className="h-full ">{children}</div>
      </body>
    </html>
  );
}
