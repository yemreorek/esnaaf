"use client";

import { useState } from "react";
import SeoPageClient from "./SeoPageClient";

export interface ProviderItem {
  id: string;
  name: string;
  categoryName: string;
  city: string;
  district: string;
  locationStr: string;
  rating: string;
  reviewCount: number;
  establishedYear: string;
  membershipDuration: string;
  bio: string;
  securityBadges: string[];
  photos: string[];
}

interface ProviderListSectionProps {
  providers: ProviderItem[];
  providerCount: number;
  locationHeader: string;
  activeTitle: string;
  categorySlug: string;
  categoryName: string;
  city: string;
  district: string;
}

export default function ProviderListSection({
  providers,
  providerCount,
  locationHeader,
  activeTitle,
  categorySlug,
  categoryName,
  city,
  district,
}: ProviderListSectionProps) {
  const [selectedProvider, setSelectedProvider] = useState<ProviderItem | null>(null);

  if (!providers || providers.length === 0) return null;

  return (
    <section id="providers-list" className="py-20 bg-surface-container-lowest border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-primary font-bold text-xs uppercase tracking-widest bg-primary/10 px-3.5 py-1.5 rounded-full inline-block mb-3 border border-primary/20">
              ONAYLI HİZMET VEREN LİSTESİ
            </span>
            <h2 className="font-bold text-3xl md:text-4xl text-on-surface tracking-tight">
              En İyi {providerCount} {locationHeader} {activeTitle} Hizmet Verenleri
            </h2>
            <p className="font-body text-slate-500 mt-2 text-sm md:text-base">
              {locationHeader} bölgesinde müşteriler tarafından en yüksek puanı alan onaylı uzman profilleri
            </p>
          </div>
        </div>

        {/* Provider Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((prov) => (
            <div
              key={prov.id}
              onClick={() => setSelectedProvider(prov)}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:border-primary/40 relative overflow-hidden"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-slate-900 text-lime-400 font-extrabold text-lg flex items-center justify-center shrink-0 border-2 border-lime-400/40 shadow-inner">
                      {prov.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary transition-colors">
                          {prov.name}
                        </h3>
                        <span className="material-symbols-outlined text-sky-500 text-lg" title="Onaylı Uzman">
                          verified
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">{prov.locationStr}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{prov.membershipDuration}</p>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1 shrink-0">
                    <span className="material-symbols-outlined text-amber-500 text-base" style={{ fontVariationSettings: '"FILL" 1' }}>
                      star
                    </span>
                    <span className="font-bold text-xs text-slate-900">{prov.rating}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed italic border-l-2 border-primary/30 pl-3 py-1">
                  "{prov.bio}"
                </p>

                {/* Security Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {prov.securityBadges.slice(0, 2).map((badge, bIdx) => (
                    <span key={bIdx} className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <span className="text-emerald-500 font-bold">✓</span> {badge}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-primary group-hover:underline flex items-center gap-1">
                  Profili İncele
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {prov.reviewCount} Değerlendirme
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🔴 PUBLIC PROVIDER PROFILE MODAL */}
      {selectedProvider && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 relative text-slate-900 my-8">
            {/* Modal Header Bar */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between z-20">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Hizmet Veren Profili
              </span>
              <button
                onClick={() => setSelectedProvider(null)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 space-y-8">
              {/* Profile Top Summary */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                <div className="w-24 h-24 rounded-full bg-slate-950 text-lime-400 font-black text-3xl flex items-center justify-center shrink-0 border-4 border-lime-400/40 shadow-xl">
                  {selectedProvider.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h3 className="font-extrabold text-2xl text-slate-900">
                      {selectedProvider.name}
                    </h3>
                    <span className="bg-sky-100 text-sky-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">verified</span> Onaylı Hizmet Veren
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-slate-600">
                    <span className="bg-slate-100 px-3 py-1 rounded-lg">
                      📍 {selectedProvider.locationStr}
                    </span>
                    <span className="bg-slate-100 px-3 py-1 rounded-lg">
                      🛠️ {selectedProvider.categoryName}
                    </span>
                    <span className="bg-slate-100 px-3 py-1 rounded-lg">
                      📅 {selectedProvider.establishedYear}'den Beri
                    </span>
                  </div>

                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                    <div className="flex items-center gap-1 text-amber-400">
                      <span className="material-symbols-outlined text-amber-400 text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>
                        star
                      </span>
                      <span className="font-black text-slate-900 text-base">{selectedProvider.rating}</span>
                    </div>
                    <span className="text-slate-400 text-xs">• {selectedProvider.reviewCount} Değerlendirme</span>
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60 space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Hizmet Veren Hakkında
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {selectedProvider.bio}
                </p>
              </div>

              {/* Security Badges (Admin Canlı Doğrulama Paneli Uyumlu) */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Güvenlik Kontrolleri
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(selectedProvider.securityBadges || ["Geçerli Cep Telefonu", "Kimlik Doğrulaması", "Vergi Levhası Kontrolü"]).map((badge, bIdx) => {
                    const isVerified = !badge.toLowerCase().includes("bekliyor") && !badge.toLowerCase().includes("değil") && !badge.toLowerCase().includes("yok");
                    return (
                      <div
                        key={bIdx}
                        className={`rounded-xl p-3 flex items-center gap-2 border transition-all ${
                          isVerified
                            ? "bg-emerald-50 border-emerald-200/80 text-emerald-900"
                            : "bg-slate-50 border-slate-200 text-slate-500"
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isVerified ? "bg-emerald-500 text-white" : "bg-slate-300 text-slate-600"
                          }`}
                        >
                          {isVerified ? "✓" : "✕"}
                        </span>
                        <span className="text-xs font-bold">{badge}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Work Photos Gallery */}
              {selectedProvider.photos && selectedProvider.photos.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                    Örnek Çalışma Fotoğrafları
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {selectedProvider.photos.map((photo, pIdx) => (
                      <div key={pIdx} className="rounded-xl overflow-hidden aspect-square border border-slate-200 bg-slate-100 group">
                        <img
                          src={photo}
                          alt={`Çalışma Fotoğrafı #${pIdx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews Masking Banner (Forces Request Creation to Protect Privacy) */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-lime-400/20 border border-lime-400/40 text-lime-400 flex items-center justify-center mx-auto text-xl">
                  🔒
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-lg text-white">Müşteri Yorumları & Teklifler</h4>
                  <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                    {selectedProvider.name} adlı uzmanımızdan ve bölgenizdeki diğer onaylı hizmet verenlerden teklif almak ve detaylı müşteri yorumlarını incelemek için hemen talep oluşturun.
                  </p>
                </div>

                <div className="pt-2">
                  <SeoPageClient
                    categorySlug={categorySlug}
                    categoryName={categoryName}
                    city={city}
                    district={district}
                    className="bg-[#c8f252] hover:bg-[#b8e242] text-slate-950 px-8 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider transition-all cursor-pointer shadow-lg hover:scale-105 inline-block"
                  >
                    30 Dk'da Ücretsiz Teklif Al
                  </SeoPageClient>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
