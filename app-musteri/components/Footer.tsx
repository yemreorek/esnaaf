"use client";

import React from "react";
import Link from "next/link";

export default function Footer() {
  const openCookiePreferences = () => {
    try {
      localStorage.removeItem("esnaaf_cookie_consent");
      window.location.reload();
    } catch (e) {
      // Fallback
    }
  };

  return (
    <footer className="w-full text-slate-300 font-sans select-none">
      
      {/* 🔴 SECTION 1: TOP FOOTER (Dark Charcoal Anthracite Background) */}
      <div className="bg-[#21242b] py-16 md:py-20 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 w-full">
            
            {/* Column 4: BRAND BLOCK (LOGO + SOCIAL + PHONE + EMAIL) - First on mobile, Right side on desktop */}
            <div className="order-1 lg:order-4 lg:col-span-4 flex flex-col items-start lg:items-end text-left lg:text-right gap-5 border-b lg:border-b-0 border-slate-800/80 pb-8 lg:pb-0">
              
              {/* Logo */}
              <a href="/" className="inline-block hover:scale-105 transition-transform">
                <img
                  src="/logo_white.png"
                  alt="Esnaaf Logo"
                  className="h-16 w-auto md:h-20 lg:h-24 object-contain drop-shadow-[0_4px_25px_rgba(200,242,82,0.35)] shrink-0"
                />
              </a>

              {/* Social Media Icons */}
              <div className="flex items-center gap-2.5">
                <a
                  href="#"
                  title="Instagram"
                  className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/80 hover:border-[#c8f252] hover:bg-[#c8f252] hover:text-slate-950 flex items-center justify-center text-slate-300 text-xs transition-all"
                >
                  📷
                </a>
                <a
                  href="#"
                  title="Facebook"
                  className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/80 hover:border-[#c8f252] hover:bg-[#c8f252] hover:text-slate-950 flex items-center justify-center text-slate-300 text-xs transition-all font-bold"
                >
                  f
                </a>
                <a
                  href="#"
                  title="YouTube"
                  className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/80 hover:border-[#c8f252] hover:bg-[#c8f252] hover:text-slate-950 flex items-center justify-center text-slate-300 text-xs transition-all"
                >
                  ▶
                </a>
                <a
                  href="#"
                  title="LinkedIn"
                  className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/80 hover:border-[#c8f252] hover:bg-[#c8f252] hover:text-slate-950 flex items-center justify-center text-slate-300 text-xs transition-all font-bold"
                >
                  in
                </a>
                <a
                  href="#"
                  title="X (Twitter)"
                  className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/80 hover:border-[#c8f252] hover:bg-[#c8f252] hover:text-slate-950 flex items-center justify-center text-slate-300 text-xs transition-all font-bold"
                >
                  𝕏
                </a>
              </div>

              {/* Phone Hotline Support Box */}
              <div className="flex flex-col gap-1 mt-1">
                <span className="text-xs text-slate-400 font-medium">
                  Esnaaf Çözüm Merkezi
                </span>
                <a
                  href="tel:08503094578"
                  className="text-2xl md:text-3xl font-black text-white hover:text-[#c8f252] transition-colors tracking-tight"
                >
                  0850 309 45 78
                </a>
                <p className="text-[11px] text-slate-400 font-medium leading-snug max-w-xs lg:ml-auto">
                  Tüm soru ve ihtiyaçlarınız için hafta içi 09:00–18:00 saatleri arasında bize ulaşabilirsiniz.
                </p>
              </div>

              {/* Email Support Box */}
              <div className="flex flex-col gap-1 mt-1">
                <span className="text-xs text-slate-400 font-medium">
                  Bize Yazın
                </span>
                <a
                  href="mailto:destek@esnaaf.com"
                  className="text-base font-extrabold text-[#c8f252] hover:underline tracking-tight"
                >
                  destek@esnaaf.com
                </a>
                <p className="text-[11px] text-slate-400 font-medium leading-snug lg:ml-auto">
                  Dilediğiniz zaman e-posta yoluyla bize ulaşabilirsiniz.
                </p>
              </div>

            </div>

            {/* Column 1: HAKKIMIZDA (lg:col-span-2) */}
            <div className="order-2 lg:order-1 lg:col-span-2 flex flex-col gap-4 text-left">
              <h4 className="font-extrabold text-xs text-white uppercase tracking-wider">
                HAKKIMIZDA
              </h4>
              <ul className="flex flex-col gap-2.5 text-xs text-slate-400 font-medium">
                <li>
                  <Link href="#why-esnaaf-section" className="hover:text-[#c8f252] transition-colors">
                    Biz Kimiz?
                  </Link>
                </li>
                <li>
                  <Link href="#why-esnaaf-section" className="hover:text-[#c8f252] transition-colors">
                    Neden Esnaaf?
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-[#c8f252] transition-colors">
                    Kurumsal Yönetim
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#c8f252] transition-colors">
                    Temsilciler
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#c8f252] transition-colors">
                    Kariyer
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#c8f252] transition-colors">
                    İletişim
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 2: ÇÖZÜMLERİMİZ / HİZMETLERİMİZ (lg:col-span-3) */}
            <div className="order-3 lg:order-2 lg:col-span-3 flex flex-col gap-4 text-left">
              <h4 className="font-extrabold text-xs text-white uppercase tracking-wider">
                HİZMETLERİMİZ
              </h4>
              <ul className="flex flex-col gap-2.5 text-xs text-slate-400 font-medium">
                <li>
                  <Link href="/ev-temizligi" className="hover:text-[#c8f252] transition-colors">
                    Ev Temizliği
                  </Link>
                </li>
                <li>
                  <Link href="/boya-badana" className="hover:text-[#c8f252] transition-colors">
                    Boya Badana
                  </Link>
                </li>
                <li>
                  <Link href="/nakliyat" className="hover:text-[#c8f252] transition-colors">
                    Nakliyat / Ev Taşıma
                  </Link>
                </li>
                <li>
                  <Link href="/su-tesisati" className="hover:text-[#c8f252] transition-colors">
                    Su Tesisatı
                  </Link>
                </li>
                <li>
                  <Link href="/elektrik-tesisati" className="hover:text-[#c8f252] transition-colors">
                    Elektrik Tesisatı
                  </Link>
                </li>
                <li>
                  <Link href="/kombi-servisi" className="hover:text-[#c8f252] transition-colors">
                    Kombi & Klima Servisi
                  </Link>
                </li>
                <li>
                  <Link href="/ev-tadilat" className="hover:text-[#c8f252] transition-colors">
                    Komple Ev Tadilatı
                  </Link>
                </li>
                <li>
                  <Link href="#categories-section" className="text-[#c8f252] font-semibold hover:underline">
                    Tüm Kategoriler →
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: DESTEK VE BİLGİLER / ESNAAF AI (lg:col-span-3) */}
            <div className="order-4 lg:order-3 lg:col-span-3 flex flex-col gap-6 text-left">
              {/* Support Links */}
              <div className="flex flex-col gap-4">
                <h4 className="font-extrabold text-xs text-white uppercase tracking-wider">
                  DESTEK VE BİLGİLER
                </h4>
                <ul className="flex flex-col gap-2.5 text-xs text-slate-400 font-medium">
                  <li>
                    <a href="#" className="hover:text-[#c8f252] transition-colors">
                      Yardım Merkezi
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#c8f252] transition-colors">
                      Hizmet Rehberi & Blog
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#c8f252] transition-colors">
                      Sıkça Sorulan Sorular (SSS)
                    </a>
                  </li>
                </ul>
              </div>

              {/* ESNAAF AI Feature Badges */}
              <div className="flex flex-col gap-3 pt-2">
                <h4 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                  ESNAAF AI <span className="w-2 h-2 rounded-full bg-[#c8f252] animate-pulse"></span>
                </h4>
                <div className="flex flex-wrap gap-2.5">
                  {/* Badge 1: Google Gemini 3.6 Flash */}
                  <span className="text-xs font-extrabold bg-slate-900/90 text-blue-100 border border-blue-500/35 px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-2 hover:border-blue-400 transition-colors">
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                      <defs>
                        <linearGradient id="gemini-sparkle-footer" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#4e80ee" />
                          <stop offset="50%" stopColor="#8ab4f8" />
                          <stop offset="100%" stopColor="#c58af9" />
                        </linearGradient>
                      </defs>
                      <path d="M12 0C12 6.627 6.627 12 0 12c6.627 0 12 5.373 12 12 0-6.627 5.373-12 12-12-6.627 0-12-5.373-12-12z" fill="url(#gemini-sparkle-footer)" />
                    </svg>
                    Gemini 3.6 Flash
                  </span>

                  {/* Badge 2: 0ms Akıllı Yanıt */}
                  <span className="text-xs font-bold bg-slate-900/90 text-slate-200 border border-[#c8f252]/35 px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-2 hover:border-[#c8f252] transition-colors">
                    <svg className="w-3.5 h-3.5 text-[#c8f252] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13 2L3 14h7v8l10-12h-7V2z" />
                    </svg>
                    0ms Akıllı Yanıt
                  </span>

                  {/* Badge 3: PII Koruması */}
                  <span className="text-xs font-bold bg-slate-900/90 text-emerald-100 border border-emerald-500/35 px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-2 hover:border-emerald-400 transition-colors">
                    <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                    </svg>
                    PII Koruması
                  </span>

                  {/* Badge 4: Doğrudan Eşleşme */}
                  <span className="text-xs font-bold bg-slate-900/90 text-rose-100 border border-rose-500/35 px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-2 hover:border-rose-400 transition-colors">
                    <svg className="w-3.5 h-3.5 text-rose-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" />
                      <circle cx="12" cy="12" r="5" />
                      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                    </svg>
                    Doğrudan Eşleşme
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ⬛ SECTION 2: BOTTOM FOOTER (Solid Jet Black Background) */}
      <div className="bg-[#0b0c0f] py-8 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col gap-6">
          
          {/* Row A: Security, Regulatory & Partner Badges */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
            {/* Left: Esnaaf Brand Emblem */}
            <div className="flex items-center gap-3.5 text-xs font-bold text-slate-200">
              <img
                src="/esnaaf_pin.png"
                alt="Esnaaf Pin Logo"
                className="h-14 w-auto md:h-16 lg:h-20 object-contain shrink-0 drop-shadow-[0_4px_16px_rgba(200,242,82,0.35)] hover:scale-110 transition-all duration-300 cursor-pointer"
              />
              <span className="text-sm md:text-base font-extrabold text-white tracking-tight">Esnaaf 100% Güvenli Hizmet Ağı</span>
            </div>

            {/* Right: Security Badges (TÖDEB, PCI, KVKK, SSL, T.C. Ticaret Bakanlığı) */}
            <div className="flex items-center flex-wrap justify-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800/80">KVKK UYUMLU</span>
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800/80">SSL 256-BIT</span>
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800/80">T.C. TİCARET BAKANLIĞI</span>
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800/80">PCI-DSS SECURITY</span>
              <span className="text-[#c8f252] font-black tracking-widest text-xs">esnaaf</span>
            </div>
          </div>

          {/* Divider Line */}
          <div className="w-full h-px bg-slate-800/80"></div>

          {/* Row B: Legal Navigation & Copyright */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 text-[11px] text-slate-400 font-medium w-full">
            
            {/* Left Links */}
            <div className="flex items-center flex-wrap justify-center lg:justify-start gap-x-3 gap-y-1.5">
              <a href="#" className="hover:text-slate-200 transition-colors">
                KVKK ve Gizlilik
              </a>
              <span>•</span>
              <a href="#" className="hover:text-slate-200 transition-colors">
                Güvenlik ve Bilgilendirmeler
              </a>
              <span>•</span>
              <a href="#" className="hover:text-slate-200 transition-colors">
                Yasal Uyarı
              </a>
              <span>•</span>
              <button
                onClick={openCookiePreferences}
                className="hover:text-[#c8f252] transition-colors cursor-pointer bg-transparent border-none p-0"
              >
                Çerezleri Yönet
              </button>
              <span>•</span>
              <a href="#" className="hover:text-slate-200 transition-colors">
                Bilgi Toplumu Hizmetleri
              </a>
              <span>•</span>
              <a href="#" className="hover:text-slate-200 transition-colors">
                Politikalarımız
              </a>
            </div>

            {/* Copyright & Sub-brand */}
            <div className="flex items-center gap-3 shrink-0 text-slate-400">
              <span>© {new Date().getFullYear()} Esnaaf Hizmet Teknolojileri A.Ş. Tüm hakları saklıdır.</span>
              <span className="hidden sm:inline-block text-slate-400">|</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                powered by <strong className="text-white font-extrabold">esnaaf ai</strong>
              </span>
            </div>

          </div>

        </div>
      </div>

    </footer>
  );
}
