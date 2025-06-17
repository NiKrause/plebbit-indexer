import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CookieConsent from '../components/CookieConsent';
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
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen flex flex-col`}>
        <div className="fixed bottom-0 left-0 left-0 z-[9999] p-8 md:p-16 px-4 m-8">
           <CookieConsent />
        </div>
        <div className="fixed bottom-0 left-0 left-0 z-[9999] p-8 md:p-16 px-4 m-8">
           <CookieConsent />
        </div>
        <div className="flex-grow container mx-auto px-4 pb-40">
          {children}
        </div>
        <footer className="fixed bottom-0 left-0 right-0 py-4 text-center text-xs text-gray-500 border-t z-[9998] bg-white">
          <div className="container mx-auto px-4">
            <p className="text-center">
              Plebscan test is a search engine for Plebbit, a decentralized P2P Reddit alternative. 
              All content is user-generated and we are not responsible for any content posted by users. 
              Plebbit aims to provide a censorship-resistant platform similar to Reddit, but with enhanced privacy and decentralization features.
            </p>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
