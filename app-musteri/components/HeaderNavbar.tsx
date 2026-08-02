"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface HeaderNavbarProps {
  isLoggedIn?: boolean;
  onOpenDashboard?: () => void;
  onLogout?: () => void;
}

export const NAV_ITEMS = [
  { name: "Temizlik", href: "/g/temizlik" },
  { name: "Tadilat", href: "/g/tadilat" },
  { name: "Nakliyat", href: "/g/nakliyat" },
  { name: "Tamir", href: "/g/tamir" },
  { name: "Özel Ders", href: "/g/ozel-ders" },
  { name: "Organizasyon", href: "/g/organizasyon" },
  { name: "Diğer", isModal: true }
];

export default function HeaderNavbar({ isLoggedIn = false, onOpenDashboard, onLogout }: HeaderNavbarProps) {
  const pathname = usePathname();

  const handleModalClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("open-category-modal"));
  };

  return (
    <header className="fixed top-3 md:top-5 inset-x-0 mx-auto max-w-7xl px-3 md:px-6 z-50 transition-all duration-300">
      <div className="w-full backdrop-blur-2xl bg-slate-950/75 border border-white/15 rounded-2xl md:rounded-3xl h-14 md:h-18 px-4 md:px-8 flex justify-between items-center shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        
        {/* Brand Logo & Category Tabs */}
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center group shrink-0">
            <img
              alt="Esnaaf Logo - 30 Dakikada Mahallendeki En İyi Hizmet Verenden Teklif Al"
              className="h-8 md:h-10 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform duration-300 drop-shadow-[0_4px_20px_rgba(200,242,82,0.35)]"
              src="/esnaaf-logo.png?v=20260801"
            />
          </Link>

          {/* 7 Category Tabs (Armut Style Header Tabs) */}
          <nav className="hidden lg:flex items-center gap-6">
            {NAV_ITEMS.map((item, idx) => {
              if (item.isModal) {
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={handleModalClick}
                    className="text-slate-300 hover:text-[#c8f252] transition-colors font-bold text-xs uppercase tracking-wider cursor-pointer bg-transparent border-none p-0"
                  >
                    {item.name}
                  </button>
                );
              }

              const isActive = pathname === item.href;
              return (
                <Link
                  key={idx}
                  href={item.href!}
                  className={`transition-all font-bold text-xs uppercase tracking-wider relative py-1 ${
                    isActive
                      ? "text-[#c8f252] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#c8f252] after:rounded-full"
                      : "text-slate-200 hover:text-[#c8f252]"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 md:gap-3">
          {isLoggedIn ? (
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={onOpenDashboard}
                className="bg-[#c8f252] hover:bg-[#b8e242] text-slate-950 px-3.5 py-1.5 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-lg shadow-[#c8f252]/20 hover:scale-105"
              >
                Panelim
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="bg-slate-900/90 hover:bg-rose-600 text-slate-300 hover:text-white px-3 py-1.5 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl font-bold text-[10px] md:text-xs uppercase tracking-wider transition-all cursor-pointer border border-slate-800"
                >
                  Çıkış
                </button>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={handleModalClick}
                className="hidden sm:inline-flex bg-slate-900/80 hover:bg-slate-850 text-slate-200 hover:text-white px-3.5 py-1.5 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl font-extrabold text-[10px] md:text-xs tracking-wider transition-all cursor-pointer border border-slate-700/60"
              >
                Tüm Hizmetler
              </button>
              <Link href="/hizmetveren-basvuru">
                <button className="bg-[#c8f252] hover:bg-[#b8e242] text-slate-950 px-3.5 py-1.5 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-lg shadow-[#c8f252]/20 hover:scale-105">
                  Hizmet Ver
                </button>
              </Link>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
