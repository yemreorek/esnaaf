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

          {/* 🔴 DIGER CATEGORIES (Armut Style Multi-Column Section Grouping) vs REGULAR GRID */}
          {groupData.slug === 'diger' ? (
            <div className="space-y-12 pt-4">
              {[
                {
                  title: "Oto ve Araç",
                  icon: "directions_car",
                  items: [
                    { name: "Araç Bakım", slug: "arac-bakim" },
                    { name: "Araç Kaplama", slug: "arac-kaplama" },
                    { name: "Araç Koltuk Temizleme", slug: "arac-koltuk-temizleme" },
                    { name: "Araç Koltuk Yıkama", slug: "arac-koltuk-yikama" },
                    { name: "Araç PPF Kaplama", slug: "arac-ppf-kaplama" },
                    { name: "Balata Değişimi", slug: "balata-degisimi" },
                    { name: "Baskı Balata Değişimi", slug: "baski-balata-degisimi" },
                    { name: "Boyasız Göçük Düzeltme", slug: "boyasiz-gocuk-duzeltme" },
                    { name: "Cam Filmi", slug: "cam-filmi" },
                    { name: "Detaylı Araç Temizliği", slug: "detayli-arac-temizligi" },
                    { name: "Frenci", slug: "frenci" },
                    { name: "Lastikçi", slug: "lastikci" },
                    { name: "Motor Contası Değişimi", slug: "motor-contasi-degisimi" },
                    { name: "Motor Rektifiye", slug: "motor-rektifiye" },
                    { name: "Motor Tamiri", slug: "motor-tamiri" },
                    { name: "Motor Yağ Değişimi", slug: "motor-yag-degisimi" },
                    { name: "Oto Boya", slug: "oto-boya" },
                    { name: "Oto Cam Filmi", slug: "oto-cam-filmi" },
                    { name: "Oto Cam Tamiri", slug: "oto-cam-tamiri" },
                    { name: "Oto Ekspertiz", slug: "oto-ekspertiz" },
                    { name: "Oto Elektrik", slug: "oto-elektrik" },
                    { name: "Oto Kaporta Boya", slug: "oto-kaporta-boya" },
                    { name: "Oto Klima", slug: "oto-klima" },
                    { name: "Oto Klima Gazı Dolumu", slug: "oto-klima-gazi-dolumu" },
                    { name: "Oto Kuaför", slug: "oto-kuafor" },
                    { name: "Oto Lastik", slug: "oto-lastik" },
                    { name: "Oto Tamir", slug: "oto-tamir" },
                    { name: "Pasta Cila", slug: "pasta-cila" },
                    { name: "PPF Kaplama", slug: "ppf-kaplama" },
                    { name: "Seramik Kaplama", slug: "seramik-kaplama" },
                    { name: "Tampon Boyama", slug: "tampon-boyama" },
                    { name: "Tampon Tamiri", slug: "tampon-tamiri" },
                    { name: "Triger Seti Değişimi", slug: "triger-seti-degisimi" },
                    { name: "Yağ Değişimi", slug: "yag-degisimi" }
                  ]
                },
                {
                  title: "Fotoğraf ve Video",
                  icon: "photo_camera",
                  items: [
                    { name: "Dış Çekim Fotoğraf", slug: "dis-cekim-fotograf" },
                    { name: "Doğum Günü Fotoğrafçısı", slug: "dogum-gunu-fotografcisi" },
                    { name: "Drone Çekimi", slug: "drone-cekimi" },
                    { name: "Düğün Fotoğrafçısı", slug: "dugun-fotografcisi" },
                    { name: "Düğün Video Çekimi", slug: "dugun-video-cekimi" },
                    { name: "E-Ticaret Fotoğraf Çekimi", slug: "e-ticaret-fotograf-cekimi" },
                    { name: "Fotoğrafçı", slug: "fotografci" },
                    { name: "Instagram İçin Fotoğraf Çekimi", slug: "instagram-fotograf-cekimi" },
                    { name: "Katalog Çekimi", slug: "katalog-cekimi" },
                    { name: "Klip Çekimi", slug: "klip-cekimi" },
                    { name: "Nikah Fotoğrafçısı", slug: "nikah-fotografcisi" },
                    { name: "Nişan Fotoğrafçısı", slug: "nisan-fotografcisi" },
                    { name: "Reklam Filmi Çekimi", slug: "reklam-filmi-cekimi" },
                    { name: "Sosyal Medya İçin Fotoğraf Çekimi", slug: "sosyal-medya-fotograf-cekimi" },
                    { name: "Sosyal Medya Video Çekimi", slug: "sosyal-medya-video-cekimi" },
                    { name: "Söz Fotoğraf Çekimi", slug: "soz-fotograf-cekimi" },
                    { name: "Sünnet Fotoğrafçısı", slug: "sunnet-fotografcisi" },
                    { name: "Tanıtım Filmi Çekimi", slug: "tanitim-filmi-cekimi" },
                    { name: "Ürün Fotoğraf Çekimi", slug: "urun-fotografciligi" },
                    { name: "Video Çekimi", slug: "video-cekimi" },
                    { name: "Video Editörü", slug: "video-editoru" },
                    { name: "Video Kurgu", slug: "video-kurgu" }
                  ]
                },
                {
                  title: "Sağlıklı Yaşam",
                  icon: "health_and_safety",
                  items: [
                    { name: "Aile Danışmanı", slug: "aile-danismani" },
                    { name: "Aile Terapisi", slug: "aile-terapisi" },
                    { name: "Bilişsel Davranışçı Terapi", slug: "bilissel-davranisci-terapi" },
                    { name: "Çift Terapisi", slug: "cift-terapisi" },
                    { name: "Çocuk Psikoloğu", slug: "cocuk-psikologu" },
                    { name: "Dil ve Konuşma Terapisi", slug: "dil-ve-konusma-terapisi" },
                    { name: "Diyetisyen", slug: "diyetisyen" },
                    { name: "EMDR Terapisi", slug: "emdr-terapisi" },
                    { name: "Ergen Psikoloğu", slug: "ergen-psikologu" },
                    { name: "Ergoterapi", slug: "ergoterapi" },
                    { name: "Evde Fizik Tedavi", slug: "evde-fizik-tedavi" },
                    { name: "Evde Hemşire", slug: "evde-hemsire" },
                    { name: "Evde Serum Takma", slug: "evde-serum-takma" },
                    { name: "Fitness Özel Ders", slug: "fitness-ozel-ders" },
                    { name: "Fizyoterapist", slug: "fizyoterapist" },
                    { name: "Klinik Psikolog", slug: "klinik-psikolog" },
                    { name: "Konuşma Terapisi", slug: "konusma-terapisi" },
                    { name: "Manuel Lenf Drenajı", slug: "manuel-lenf-drenaji" },
                    { name: "Manuel Terapi", slug: "manuel-terapi" },
                    { name: "Moxo Testi", slug: "moxo-testi" },
                    { name: "Online Cinsel Terapi", slug: "online-cinsel-terapi" },
                    { name: "Online Çocuk Psikoloğu", slug: "online-cocuk-psikologu" },
                    { name: "Online Çift Terapisi", slug: "online-cift-terapisi" },
                    { name: "Online Dil ve Konuşma Terapisi", slug: "online-dil-ve-konusma-terapisi" },
                    { name: "Online Diyetisyen", slug: "online-diyetisyen" },
                    { name: "Online Ergen Psikolog", slug: "online-ergen-psikolog" },
                    { name: "Online Personal Trainer", slug: "online-personal-trainer" },
                    { name: "Online Psikolog", slug: "online-psikolog" },
                    { name: "Online Psikolojik Danışman", slug: "online-psikolojik-danisman" },
                    { name: "Online Psikoterapi", slug: "online-psikoterapi" },
                    { name: "Online Terapi", slug: "online-terapi" },
                    { name: "Online Yaşam Koçu", slug: "online-yasam-kocu" },
                    { name: "Online Yeme Bozukluğu Psikolog", slug: "online-yeme-bozuklugu-psikolog" },
                    { name: "Oyun Terapisi", slug: "oyun-terapisi" },
                    { name: "Pedagog", slug: "pedagog" },
                    { name: "Personal Trainer", slug: "personal-trainer" },
                    { name: "Pilates Dersi", slug: "pilates-dersi" },
                    { name: "Psikolog", slug: "psikolog" },
                    { name: "Psikolojik Danışman", slug: "psikolojik-danisman" },
                    { name: "Psikoterapi", slug: "psikoterapi" },
                    { name: "Reformer Pilates Dersi", slug: "reformer-pilates-dersi" },
                    { name: "Yaşam Koçu", slug: "yasam-kocu" },
                    { name: "Yetişkin Psikolog", slug: "yetiskin-psikolog" }
                  ]
                },
                {
                  title: "Evcil Hayvanlar",
                  icon: "pets",
                  items: [
                    { name: "Evde Kedi Bakımı", slug: "evde-kedi-bakimi" },
                    { name: "Evde Köpek Bakımı", slug: "evde-kopek-bakimi" },
                    { name: "Kedi Bakımı", slug: "kedi-bakimi" },
                    { name: "Kedi Kısırlaştırma", slug: "kedi-kisirlastirma" },
                    { name: "Kedi Kuaförü", slug: "kedi-kuaforu" },
                    { name: "Kedi Oteli", slug: "kedi-oteli" },
                    { name: "Kedi Traşı", slug: "kedi-trasi" },
                    { name: "Köpek Bakımı", slug: "kopek-bakimi" },
                    { name: "Köpek Eğitimi", slug: "kopek-egitimi" },
                    { name: "Köpek Gezdirme", slug: "kopek-gezdirme" },
                    { name: "Köpek Kuaförü", slug: "kopek-kuaforu" },
                    { name: "Köpek Makas Traşı", slug: "kopek-makas-trasi" },
                    { name: "Köpek Oteli", slug: "kopek-oteli" },
                    { name: "Köpek Pansiyonu", slug: "kopek-pansiyonu" },
                    { name: "Köpek Tuvalet Eğitimi", slug: "kopek-tuvalet-egitimi" },
                    { name: "Pet Kuaförü", slug: "pet-kuaforu" }
                  ]
                },
                {
                  title: "Dijital ve Kurumsal",
                  icon: "laptop_mac",
                  items: [
                    { name: "3D Animasyon", slug: "3d-animasyon" },
                    { name: "3D Baskı", slug: "3d-baski" },
                    { name: "3D Ürün Modelleme", slug: "3d-urun-modelleme" },
                    { name: "ABD Vize Danışmanlık", slug: "abd-vize-danismanlik" },
                    { name: "Afiş Tasarım", slug: "afis-tasarim" },
                    { name: "Almanca Yeminli Tercüme", slug: "almanca-yeminli-tercume" },
                    { name: "Almanya Vize Danışmanlık", slug: "almanya-vize-danismanlik" },
                    { name: "Ambalaj Tasarım", slug: "ambalaj-tasarim" },
                    { name: "Apartman Yönetimi", slug: "apartman-yonetimi" },
                    { name: "Arsa Değerleme", slug: "arsa-degerleme" },
                    { name: "AutoCAD Çizim", slug: "autocad-cizim" },
                    { name: "Broşür Baskı", slug: "brosur-baski" },
                    { name: "Broşür Dağıtım", slug: "brosur-dagitim" },
                    { name: "Cam Giydirme", slug: "cam-giydirme" },
                    { name: "CV Hazırlama Danışmanlığı", slug: "cv-hazirlama-danismanligi" },
                    { name: "Davetiye Baskı", slug: "davetiye-baski" },
                    { name: "Dijital Baskı", slug: "dijital-baski" },
                    { name: "Dijital Pazarlama", slug: "dijital-pazarlama" },
                    { name: "Dikim Evi", slug: "dikim-evi" },
                    { name: "Duvara Resim Yapma", slug: "duvara-resim-yapma" },
                    { name: "Editör", slug: "editor" },
                    { name: "Elektronik Devre Tasarımı", slug: "elektronik-devre-tasarimi" },
                    { name: "Emlak Satış Danışmanı", slug: "emlak-satis-danismani" },
                    { name: "E-Ticaret Danışmanlığı", slug: "e-ticaret-danismanligi" },
                    { name: "Etsy Mağaza Açma", slug: "etsy-magaza-acma" },
                    { name: "Ev Ekspertiz", slug: "ev-ekspertiz" },
                    { name: "Fransa Vize Danışmanlık", slug: "fransa-vize-danismanlik" },
                    { name: "Freelance Yazılımcı", slug: "freelance-yazilimci" },
                    { name: "Gayrimenkul Değerleme", slug: "gayrimenkul-degerleme" },
                    { name: "Google Ads Uzmanı", slug: "google-ads-uzmani" },
                    { name: "Google Reklam Yönetimi", slug: "google-reklam-yonetimi" },
                    { name: "Graffiti", slug: "graffiti" },
                    { name: "Grafik Tasarım", slug: "grafik-tasarim" },
                    { name: "Gümrük Müşaviri", slug: "gumruk-musaviri" },
                    { name: "İç Mimar Danışmanlık", slug: "ic-mimar-danismanlik" },
                    { name: "İngilizce Çeviri", slug: "ingilizce-ceviri" },
                    { name: "İngilizce Yeminli Tercüme", slug: "ingilizce-yeminli-tercume" },
                    { name: "İngiltere Vize Danışmanlık", slug: "ingiltere-vize-danismanlik" },
                    { name: "Instagram Hesap Kurtarma", slug: "instagram-hesap-kurtarma" },
                    { name: "Instagram Reklam Yönetimi", slug: "instagram-reklam-yonetimi" },
                    { name: "İnternet Sitesi Oluşturma", slug: "internet-sitesi-olusturma" },
                    { name: "Işıklı Tabela", slug: "isikli-tabela" },
                    { name: "İspanya Vize Danışmanlık", slug: "ispanya-vize-danismanlik" },
                    { name: "İş Sağlığı ve Güvenliği", slug: "is-sagligi-ve-guvenligi" },
                    { name: "İtalya Vize Danışmanlık", slug: "italya-vize-danismanlik" },
                    { name: "Karakalem Çizim", slug: "karakalem-cizim" },
                    { name: "Kartvizit", slug: "kartvizit" },
                    { name: "Kartvizit Baskı", slug: "kartvizit-baski" },
                    { name: "Kartvizit Tasarımı", slug: "kartvizit-tasarimi" },
                    { name: "Katalog Tasarımı", slug: "katalog-tasarimi" },
                    { name: "Kimya Editörü", slug: "kimya-editoru" },
                    { name: "Kompozit Tabela", slug: "kompozit-tabela" },
                    { name: "KOSGEB Danışmanlık", slug: "kosgeb-danismanlik" },
                    { name: "Kurumsal Logo Tasarımı", slug: "kurumsal-logo-tasarimi" },
                    { name: "Kutu Harf Tabela", slug: "kutu-harf-tabela" },
                    { name: "Limited Şirket Kurma", slug: "limited-sirket-kurma" },
                    { name: "Logo Tasarımı", slug: "logo-tasarimi" },
                    { name: "Marka Tescil", slug: "marka-tescil" },
                    { name: "Meta Reklam Yöneticisi", slug: "meta-reklam-yoneticisi" },
                    { name: "Metin Düzenleme", slug: "metin-duzenleme" },
                    { name: "Mevcut Web Sitesi Düzenleme", slug: "mevcut-web-sitesi-duzenleme" },
                    { name: "Mobil Uygulama Geliştirme", slug: "mobil-uygulama-gelistirme" },
                    { name: "Müzik Prodüksiyon", slug: "muzik-produksiyon" },
                    { name: "Online Çeviri", slug: "online-ceviri" },
                    { name: "Online Ön Muhasebe", slug: "online-on-muhasebe" },
                    { name: "Online Stil Danışmanı", slug: "online-stil-danismani" },
                    { name: "Ön Muhasebe", slug: "on-muhasebe" },
                    { name: "Özel Dedektif", slug: "ozel-dedektif" },
                    { name: "Özel Koruma", slug: "ozel-koruma" },
                    { name: "Özel Sağlık Sigortası", slug: "ozel-saglik-sigortasi" },
                    { name: "Photoshop Uzmanı", slug: "photoshop-uzmani" },
                    { name: "Plan Kesit Görünüş Çizimi", slug: "plan-kesit-gorunus-cizimi" },
                    { name: "Proje Yazma", slug: "proje-yazma" },
                    { name: "Reklam Ajansı", slug: "reklam-ajansi" },
                    { name: "Reklamcı", slug: "reklamci" },
                    { name: "Şahıs Şirketi Kurma", slug: "sahis-sirketi-kurma" },
                    { name: "SEO Hizmeti", slug: "seo-hizmeti" },
                    { name: "SGK Danışmanlık", slug: "sgk-danismanlik" },
                    { name: "Sigorta Acentesi", slug: "sigorta-acentesi" },
                    { name: "Site Bina ve Apartman Yönetimi", slug: "site-bina-ve-apartman-yonetimi" },
                    { name: "Site Yönetimi", slug: "site-yonetimi" },
                    { name: "Sosyal Medya Ajansı", slug: "sosyal-medya-ajansi" },
                    { name: "Sosyal Medya Danışmanlığı", slug: "sosyal-medya-danismanligi" },
                    { name: "Sosyal Medya Post Tasarımı", slug: "sosyal-medya-post-tasarimi" },
                    { name: "Sosyal Medya Tasarım", slug: "sosyal-medya-tasarim" },
                    { name: "Sosyal Medya Uzmanı", slug: "sosyal-medya-uzmani" },
                    { name: "Sosyal Medya Yönetimi", slug: "sosyal-medya-yonetimi" },
                    { name: "Sunum Hazırlama", slug: "sunum-hazirlama" },
                    { name: "Sweatshirt İmalatı", slug: "sweatshirt-imalati" },
                    { name: "Tabela", slug: "tabela" },
                    { name: "Tamamlayıcı Sağlık Sigortası", slug: "tamamlayici-saglik-sigortasi" },
                    { name: "Tercüme", slug: "tercume" },
                    { name: "Tişört Baskı", slug: "tisort-baski" },
                    { name: "Tişört İmalatı", slug: "tisort-imalati" },
                    { name: "Toptan Tişört", slug: "toptan-tisort" },
                    { name: "Trafik Sigortası", slug: "trafik-sigortasi" },
                    { name: "Vektörel Çizim", slug: "vektorel-cizim" },
                    { name: "Vize Başvurusu", slug: "vize-basvurusu" },
                    { name: "Vize Danışmanı", slug: "vize-danismani" }
                  ]
                },
                {
                  title: "Diğer Çeşitli Hizmetler",
                  icon: "grid_view",
                  items: [
                    { name: "Ahşap Dekorasyon", slug: "ahsap-dekorasyon" },
                    { name: "Alüminyum Pergole", slug: "aluminyum-pergole" },
                    { name: "Arsa Drone Çekimi", slug: "arsa-drone-cekimi" },
                    { name: "Ekspertiz", slug: "ekspertiz" },
                    { name: "İngilizce Oyun Ablası", slug: "ingilizce-oyun-ablasi" },
                    { name: "Karavan Kiralama", slug: "karavan-kiralama" },
                    { name: "Karot Kesim", slug: "karot-kesim" },
                    { name: "Kitap Bastırmak", slug: "kitap-bastirmak" },
                    { name: "Konut Değerleme", slug: "konut-degerleme" },
                    { name: "Mobilya Kaplama", slug: "mobilya-kaplama" },
                    { name: "Mutfak Dolabı Folyo Kaplama", slug: "mutfak-dolabi-folyo-kaplama" },
                    { name: "Online Mat Pilates", slug: "online-mat-pilates" },
                    { name: "Otopark Bariyeri", slug: "otopark-bariyeri" },
                    { name: "Oyun Ablası", slug: "oyun-ablasi" },
                    { name: "Terzi", slug: "terzi" },
                    { name: "TUS Koçu", slug: "tus-kocu" },
                    { name: "Yabancı Çalışma İzni", slug: "yabanci-calisma-izni" }
                  ]
                }
              ].map((section, sIdx) => {
                const sectionFilteredItems = section.items.filter((item) => {
                  if (!normQuery) return true;
                  const itemNorm = item.name.toLocaleLowerCase("tr-TR")
                    .replace(/i/g, "i").replace(/ı/g, "i").replace(/ç/g, "c")
                    .replace(/ğ/g, "g").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u");
                  return itemNorm.includes(normQuery);
                });

                if (sectionFilteredItems.length === 0) return null;

                return (
                  <div key={sIdx} className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                      <div className="w-10 h-10 rounded-2xl bg-[#c8f252]/20 border border-[#c8f252]/40 text-slate-900 flex items-center justify-center">
                        <span className="material-symbols-outlined text-xl">{section.icon}</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{section.title}</h3>
                        <p className="text-xs text-slate-400 font-semibold">{sectionFilteredItems.length} Hizmet Sıralanıyor</p>
                      </div>
                    </div>

                    {/* Armut Style 3-Column List with Underline Hover */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3.5 gap-x-8">
                      {sectionFilteredItems.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleStartQuote(item.name)}
                          className="text-left text-xs sm:text-sm font-bold text-slate-850 hover:text-[#4c630a] underline underline-offset-4 decoration-slate-300 hover:decoration-[#c8f252] transition-all cursor-pointer py-1 flex items-center justify-between group"
                        >
                          <span className="truncate pr-2">{item.name}</span>
                          <span className="material-symbols-outlined text-slate-300 group-hover:text-[#4c630a] text-xs opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                            arrow_forward
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : filteredAll.length > 0 ? (
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
