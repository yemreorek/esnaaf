"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export const CATEGORIES_LIST = [
  { name: "Ev Temizliği", icon: "cleaning_services", slug: "ev-temizligi" },
  { name: "Boya Badana", icon: "format_paint", slug: "boya-badana" },
  { name: "Nakliyat", icon: "local_shipping", slug: "nakliyat" },
  { name: "Su Tesisatı", icon: "plumbing", slug: "su-tesisati" },
  { name: "Elektrik Tesisatı", icon: "bolt", slug: "elektrik-tesisati" },
  { name: "Ev Tadilat", icon: "home_repair_service", slug: "ev-tadilat" },
  { name: "Halı Yıkama", icon: "dry_cleaning", slug: "hali-yikama" },
  { name: "Koltuk Yıkama", icon: "weekend", slug: "koltuk-yikama" },
  { name: "İnşaat Sonrası Temizlik", icon: "cleaning_bucket", slug: "insaat-tadilat-sonrasi-temizlik" },
  { name: "Fayans Döşeme", icon: "space_dashboard", slug: "fayans-doseme" },
  { name: "Parke Döşeme", icon: "layers", slug: "parke-doseme" },
  { name: "Böcek İlaçlama", icon: "bug_report", slug: "bocek-ilaclama" },
  { name: "Kombi Servisi", icon: "thermostat", slug: "kombi-servisi" },
  { name: "Klima Servisi", icon: "ac_unit", slug: "klima-servisi" },
  { name: "Mantolama", icon: "format_color_fill", slug: "mantolama" },
  { name: "Marangoz", icon: "handyman", slug: "marangoz" },
  { name: "Özel Ders", icon: "school", slug: "ozel-ders" },
  { name: "Cam Balkon", icon: "window", slug: "cam-balkon" },
  { name: "Doğalgaz Tesisatı", icon: "propane_tank", slug: "dogalgaz-tesisati" },
  { name: "İç Mimar & Dekorasyon", icon: "architecture", slug: "ic-mimar" }
];

export default function AllCategoriesModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setSearchQuery("");
    };

    window.addEventListener("open-category-modal", handleOpen);
    return () => window.removeEventListener("open-category-modal", handleOpen);
  }, []);

  if (!isOpen) return null;

  const normQuery = searchQuery
    .toLocaleLowerCase("tr-TR")
    .replace(/i/g, "i").replace(/ı/g, "i").replace(/ç/g, "c")
    .replace(/ğ/g, "g").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .trim();

  const filtered = CATEGORIES_LIST.filter((cat) => {
    if (!normQuery) return true;
    const catName = cat.name.toLocaleLowerCase("tr-TR")
      .replace(/i/g, "i").replace(/ı/g, "i").replace(/ç/g, "c")
      .replace(/ğ/g, "g").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u");
    return catName.includes(normQuery);
  });

  const handleSelectCategory = (cat: typeof CATEGORIES_LIST[0]) => {
    setIsOpen(false);
    setSearchQuery("");
    router.push(`/${cat.slug}`);
  };

  return (
    <div
      className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full sm:max-w-[560px] bg-white rounded-3xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[75vh] animate-slide-up border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Search Input Bar */}
        <div className="p-5 bg-white border-b border-slate-100 sticky top-0 z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Hangi Hizmete İhtiyacınız Var?</h3>
              <p className="text-xs text-slate-400 font-medium">Arayın veya listeden istediğiniz hizmeti seçin</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-800 p-2 rounded-full hover:bg-slate-100 cursor-pointer transition-all"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* 🔍 Search Input Bar */}
          <div className="relative flex items-center">
            <div className="absolute left-4 text-slate-400 pointer-events-none">
              <span className="material-symbols-outlined text-xl">search</span>
            </div>
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hizmet arayın... (Örn: Klima, Boya, Nakliyat)"
              className="w-full pl-11 pr-10 py-3.5 bg-slate-50 border-2 border-slate-200 focus:border-[#c8f252] focus:bg-white focus:ring-2 focus:ring-[#c8f252]/20 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-200/60 cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Filtered Result List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <span className="text-3xl">🔍</span>
              <h4 className="font-bold text-slate-800 text-sm">Aradığınız kriterde hizmet bulunamadı</h4>
              <p className="text-xs text-slate-400">Farklı bir arama kelimesi yazmayı veya popüler kategorileri seçmeyi deneyin.</p>
            </div>
          ) : (
            filtered.map((cat, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectCategory(cat)}
                className="flex items-center justify-between p-3.5 border border-slate-150 hover:border-[#c8f252] hover:bg-[#c8f252]/10 rounded-2xl text-left cursor-pointer active:scale-98 transition-all w-full bg-white shadow-xs group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100/90 group-hover:bg-[#c8f252] text-slate-700 group-hover:text-slate-950 flex items-center justify-center shrink-0 transition-all shadow-xs group-hover:scale-105">
                    <span className="material-symbols-outlined text-xl">{cat.icon}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-extrabold text-sm text-slate-850 group-hover:text-slate-950">
                      {cat.name}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Soru-cevap başlat ve teklif topla
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-800 text-lg group-hover:translate-x-1 transition-all">
                  arrow_forward
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
