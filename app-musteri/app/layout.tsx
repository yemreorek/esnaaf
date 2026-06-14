import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import GlobalAlert from "../components/GlobalAlert";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Esnaaf — Güvenilir Esnaf ve Ustalar",
  description: "Aradığınız güvenilir esnaf ve ustaları yapay zeka destekli sohbetle kolayca bulun.",
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
      className={`${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ minHeight: '100dvh' }}>
        {children}
        <GlobalAlert />
      </body>
    </html>
  );
}

