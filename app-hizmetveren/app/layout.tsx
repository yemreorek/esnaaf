import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import GlobalAlert from "./GlobalAlert";
import FetchInterceptor from "./FetchInterceptor";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  title: "Esnaaf Partner — Hizmet Veren Paneli",
  description: "Bölgenizdeki hizmet taleplerine anlık teklif verin, işinizi büyütün",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,300,0,0&display=block" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" />
      </head>
      <body className={`${plusJakartaSans.className} bg-bg min-h-full flex flex-col`}>
        <FetchInterceptor />
        {children}
        <GlobalAlert />
      </body>
    </html>
  );
}

