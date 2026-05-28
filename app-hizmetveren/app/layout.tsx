import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  title: "Esnaaf Partner — Hizmet Veren Paneli",
  description: "Bölgenizdeki esnaf taleplerine anlık teklif verin, işinizi büyütün",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className={`${plusJakartaSans.className} bg-bg min-h-full flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
