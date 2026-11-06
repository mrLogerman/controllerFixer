import type { Metadata } from "next";
import { Geist, Space_Grotesk } from "next/font/google";
import { siteDescription, siteName, siteUrl } from "@/lib/site";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const title = `${siteName} — Xbox & PS5 Stick Drift Repair`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description: siteDescription,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName,
    title,
    description: siteDescription,
    locale: "en_CA",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: siteDescription,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${spaceGrotesk.variable}`}>
        {children}
      </body>
    </html>
  );
}
