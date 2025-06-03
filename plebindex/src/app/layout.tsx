import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from '@next/third-parties/google'
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: process.env.NEXT_PUBLIC_APP_TITLE ?? "Plebindex",
    description: process.env.NEXT_PUBLIC_APP_DESCRIPTION ?? "",
    icons: {
      icon: '/favicon.ico',
    },
    alternates: {
      types: {
        'application/xml': [
          {
            url: '/sitemap.xml',
            title: 'Sitemap',
          },
        ],
      },
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="alternate" type="application/xml" href="/sitemap.xml" title="Sitemap" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen p-4 md:p-8`}>
        <div className="container mx-auto">
          {children}
        </div>
        <GoogleAnalytics gaId="G-GPL56C3ZBM" />
      </body>
    </html>
  );
}
