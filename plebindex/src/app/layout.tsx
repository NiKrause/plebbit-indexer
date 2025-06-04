import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import CookieConsent from '../components/CookieConsent';
import Analytics from '../components/Analytics';

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
        <div className="fixed bottom-0 left-0 left-0 z-[9999]">
          i am a cookie consent
          {/* <CookieConsent /> */}
        </div>
        <div className="container mx-auto">
          {children}
        </div>
        <Analytics />
      </body>
    </html>
  );
}
