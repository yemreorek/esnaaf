import type { Metadata, Viewport } from "next";
import "./globals.css";
import GlobalAlert from "../components/GlobalAlert";
import CookieConsent from "../components/CookieConsent";
import FetchInterceptor from "./FetchInterceptor";

export const metadata: Metadata = {
  metadataBase: new URL('https://esnaaf.com'),
  title: "Esnaaf — Güvenilir Hizmet Verenler",
  description: "Aradığınız güvenilir hizmet verenleri yapay zeka destekli sohbetle kolayca bulun.",
  openGraph: {
    title: "Esnaaf — 30 Dakikada Mahallendeki En İyi Hizmet Verenden Teklif Al",
    description: "Aradığınız güvenilir hizmet verenleri yapay zeka destekli sohbetle kolayca bulun.",
    images: [{ url: "/esnaaf-logo.png", width: 464, height: 189, alt: "Esnaaf Logo - Türkiye'nin En İyi Hizmet Veren Ağı" }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className="h-full antialiased"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" />
      </head>
      <body className="min-h-full flex flex-col" style={{ minHeight: '100dvh' }}>
        <FetchInterceptor />
        {children}
        <GlobalAlert />
        <CookieConsent />
      </body>
    </html>
  );
}
