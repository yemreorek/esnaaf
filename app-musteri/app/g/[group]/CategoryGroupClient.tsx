"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GroupData } from "./page";
import ChatScreen from "../../../components/ChatScreen";

interface CategoryGroupClientProps {
  groupData: GroupData;
}

export default function CategoryGroupClient({ groupData }: CategoryGroupClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleStartQuote = (serviceName: string) => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("esnaaf_chat_session_id");
    }
    setSelectedService(serviceName);
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("esnaaf_chat_session_id");
    }
    setIsChatOpen(false);
    setSelectedService(null);
  };

  if (isChatOpen && selectedService) {
    return (
      <div className="fixed inset-0 z-[999] bg-white">
        <ChatScreen
          key={`${selectedService}-${Date.now()}`}
          initialMessage={selectedService}
          onClose={handleCloseChat}
          onJobCompleted={(jobId) => {
            window.location.href = `/tekliflerim?jobId=${jobId}`;
          }}
        />
      </div>
    );
  }

  const normQuery = searchQuery
    .toLocaleLowerCase("tr-TR")
    .replace(/i/g, "i").replace(/ı/g, "i").replace(/ç/g, "c")
    .replace(/ğ/g, "g").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .trim();

  const filteredPopular = groupData.popularServices.filter((s) => {
    if (!normQuery) return true;
    const sName = s.title.toLocaleLowerCase("tr-TR")
      .replace(/i/g, "i").replace(/ı/g, "i").replace(/ç/g, "c")
      .replace(/ğ/g, "g").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u");
    return sName.includes(normQuery);
  });

  const filteredAll = groupData.allServices.filter((s) => {
    if (!normQuery) return true;
    const sName = s.name.toLocaleLowerCase("tr-TR")
      .replace(/i/g, "i").replace(/ı/g, "i").replace(/ç/g, "c")
      .replace(/ğ/g, "g").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u");
    return sName.includes(normQuery);
  });

  return (
    <div className="w-full flex flex-col min-h-screen">
      {/* 🔴 HERO SECTION (Armut Banner Style with Esnaaf Premium Aesthetic) */}
      <section className="relative min-h-[50vh] md:min-h-[58vh] flex items-center justify-center overflow-hidden bg-slate-950 text-white py-16 md:py-24">
        {/* Background Image with Blur & Dark Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={groupData.heroImage}
            alt={groupData.heroTitle}
            className="w-full h-full object-cover object-center opacity-35 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center space-y-6">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#c8f252]/20 border border-[#c8f252]/40 text-[#c8f252] text-xs font-black uppercase tracking-wider backdrop-blur-md animate-fade-in">
            ⚡ 30 Dakikada Teklif Al
          </span>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight drop-shadow-md">
            {groupData.heroTitle}
          </h1>

          <p className="text-sm md:text-lg text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
            {groupData.heroSubtitle}
          </p>

          {/* Search Input Bar (Instant Quote Prompt Trigger) */}
          <div className="max-w-2xl mx-auto pt-2">
            <div className="relative flex items-center bg-white/95 backdrop-blur-md rounded-2xl md:rounded-3xl p-2 shadow-2xl border border-white/20">
              <div className="pl-4 text-slate-400 pointer-events-none">
                <span className="material-symbols-outlined text-2xl text-slate-400">search</span>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Hangi hizmeti arıyorsun? (Örn: Ev Temizliği, Boya, Nakliyat)"
                className="w-full px-4 py-3 bg-transparent text-sm md:text-base font-semibold text-slate-900 placeholder:text-slate-400 outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (searchQuery.trim()) {
                    handleStartQuote(searchQuery.trim());
                  } else {
                    handleStartQuote(groupData.popularServices[0].title);
                  }
                }}
                className="bg-[#c8f252] hover:bg-[#b8e242] text-slate-950 px-6 py-3 rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider transition-all shrink-0 cursor-pointer shadow-lg active:scale-95"
              >
                Teklif Al
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 🔴 SECTION 1: POPÜLER / TREND HİZMETLER GRID */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Popüler {groupData.name} Hizmetleri
              </h2>
              <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
                Bölgendeki onaylı uzmanlardan anında fiyat teklifi topla
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/60">
              {groupData.popularServices.length} Öne Çıkan Hizmet
            </span>
          </div>

          {/* Cards Grid: 2 columns on mobile, 4 on desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {filteredPopular.map((service, idx) => (
              <div
                key={idx}
                onClick={() => handleStartQuote(service.title)}
                className="group bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 hover:border-[#c8f252] shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between"
              >
                {/* Photo Header */}
                <div className="relative h-28 sm:h-44 overflow-hidden bg-slate-100">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-slate-950/80 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border border-white/20">
                    ⚡ 30 Dk Teklif
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between space-y-2 sm:space-y-4">
                  <div>
                    <h3 className="font-extrabold text-xs sm:text-base text-slate-900 group-hover:text-slate-950 group-hover:underline transition-colors line-clamp-1">
                      {service.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 sm:mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs sm:text-sm text-emerald-600">group</span>
                      <span className="truncate">{service.providers}</span>
                    </p>
                  </div>

                  {/* Rating & Reviews */}
                  <div className="pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-xs">
                    <div className="flex items-center gap-0.5 sm:gap-1 text-amber-500 font-bold">
                      <span className="material-symbols-outlined text-xs sm:text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>
                        star
                      </span>
                      <span className="text-slate-900 font-extrabold">{service.rating}</span>
                    </div>
                    <span className="text-slate-400 text-[9px] sm:text-[11px] font-medium truncate">{service.reviews}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🔴 SECTION 2: TÜM KATEGORİ HİZMETLERİ (COMPREHENSIVE 2-COLUMN MOBILE GRID) */}
      <section className="py-12 md:py-16 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-6 md:space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">
                  Tüm {groupData.name} Hizmetleri
                </h2>
                <span className="text-[11px] font-bold text-slate-600 bg-slate-200/80 px-2.5 py-0.5 rounded-full">
                  {filteredAll.length} Hizmet
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
                İstediğin hizmete tıkla, 30 saniyede AI asistanımız ile teklif topla
              </p>
            </div>

            {/* Quick Live Filter Input */}
            <div className="relative w-full md:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                filter_alt
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Hizmetlerde ara..."
                className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:border-[#c8f252] focus:ring-2 focus:ring-[#c8f252]/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* 2-Column Mobile & 4-Column Desktop Grid */}
          {filteredAll.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
              {filteredAll.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleStartQuote(item.name)}
                  className="text-left text-xs font-bold bg-white hover:bg-slate-900 border border-slate-200/90 hover:border-[#c8f252] shadow-xs hover:shadow-lg p-3 rounded-2xl transition-all duration-200 flex items-center justify-between group cursor-pointer"
                >
                  <span className="truncate pr-1.5 text-slate-800 group-hover:text-white transition-colors">
                    {item.name}
                  </span>
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-[#c8f252] text-sm group-hover:translate-x-0.5 transition-all shrink-0">
                    arrow_forward
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">search_off</span>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Aranan Hizmet Bulunamadı</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  "{searchQuery}" aramasıyla eşleşen bir hizmet bulunamadı. Dilerseniz özel canlı sohbet başlatabilirsiniz.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleStartQuote(searchQuery)}
                className="inline-flex items-center gap-2 bg-[#c8f252] text-slate-950 font-extrabold text-xs px-5 py-2.5 rounded-xl hover:bg-[#b5dc43] transition-colors cursor-pointer"
              >
                <span>Yapay Zeka ile Teklif Al</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
