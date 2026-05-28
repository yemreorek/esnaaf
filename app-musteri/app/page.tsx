"use client";

import { useState, useEffect, useRef } from "react";
import ChatScreen from "../components/ChatScreen";
import { startNewSession } from "../lib/session";

// All 20 categories for the full selection [Explore] modal
const categories = [
  { name: "Ev Temizliği", icon: "🏠", phase: "Faz 1" },
  { name: "Boya Badana", icon: "🎨", phase: "Faz 1" },
  { name: "Nakliyat", icon: "📦", phase: "Faz 1" },
  { name: "Su Tesisatı", icon: "🔧", phase: "Faz 1" },
  { name: "Elektrik Tesisatı", icon: "⚡", phase: "Faz 1" },
  { name: "Ev Tadilat", icon: "🔨", phase: "Faz 1" },
  { name: "Halı & Koltuk Yıkama", icon: "🧼", phase: "Faz 2" },
  { name: "Tadilat Sonrası Temizlik", icon: "🧹", phase: "Faz 2" },
  { name: "Fayans & Parke Döşeme", icon: "🧱", phase: "Faz 2" },
  { name: "Haşere & Böcek İlaçlama", icon: "🐜", phase: "Faz 2" },
  { name: "Kombi & Klima Bakımı", icon: "❄️", phase: "Faz 2" },
  { name: "Mantolama & Dış Cephe", icon: "🏢", phase: "Faz 2" },
  { name: "Marangoz & Mobilya Montajı", icon: "🪚", phase: "Faz 2" },
  { name: "Özel Ders", icon: "📚", phase: "Faz 2" },
  { name: "Cam Balkon & PVC", icon: "🪟", phase: "Faz 3" },
  { name: "Ofis & İş Yeri Temizliği", icon: "🏢", phase: "Faz 3" },
  { name: "Doğalgaz Tesisatı", icon: "🔥", phase: "Faz 3" },
  { name: "İç Mimar & Dekorasyon", icon: "📐", phase: "Faz 3" },
  { name: "Fotoğrafçı", icon: "📷", phase: "Faz 3" },
  { name: "Organizasyon & Etkinlik", icon: "🎉", phase: "Faz 3" },
];

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("explore"); // For mobile navigation highlights
  const [notification, setNotification] = useState<string | null>(null);

  // Scroll targets refs
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const partnerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Transition States for Chat Interaction
  const [isChatActive, setIsChatActive] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState("");

  // Dismiss notification automatically
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Handle category chip selection
  const handleSelectCategory = (categoryName: string) => {
    setInputValue(categoryName);
    setIsModalOpen(false);

    // Auto-focus and submit instantly to start matching
    setTimeout(() => {
      handleStartChat(categoryName);
    }, 150);
  };

  const handleStartChat = (messageText: string) => {
    if (!messageText.trim()) return;
    startNewSession();
    setChatInitialMessage(messageText);
    setIsChatActive(true);
  };

  const handleSend = () => {
    handleStartChat(inputValue);
  };

  // Smooth scroll handler
  const scrollTo = (elementRef: React.RefObject<HTMLDivElement | null>) => {
    if (elementRef && elementRef.current) {
      elementRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Show premium alert instead of standard browser alert
  const triggerNotification = (message: string) => {
    setNotification(message);
  };

  // Render full-screen ChatScreen if chat is active
  if (isChatActive) {
    return (
      <ChatScreen
        initialMessage={chatInitialMessage}
        onClose={() => {
          setIsChatActive(false);
          setInputValue("");
        }}
      />
    );
  }

  return (
    <div className="bg-white text-gray-900 font-body-md antialiased overflow-x-hidden selection:bg-primary-fixed selection:text-gray-900 min-h-screen pb-16 md:pb-0 relative">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 bg-gray-900/95 text-white backdrop-blur-md px-6 py-3.5 rounded-[12px] shadow-2xl border border-white/10 flex items-center gap-3 animate-slide-up max-w-sm">
          <span className="material-symbols-outlined text-primary-fixed">info</span>
          <span className="font-button-text text-sm">{notification}</span>
        </div>
      )}

      {/* TopAppBar */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-12 py-4 max-w-[1440px] mx-auto bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="flex items-center gap-4">
          <a className="flex items-center" href="#" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <img 
              alt="Esnaaf Logo" 
              className="h-10 w-auto object-contain select-none" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBptmJN3hqvYxRihZRqKcLceXhb79LA3c8lAd_vIye27uTtG8soeAw8liWOYXSyEfl-FjbLyt4Y_I-a2tq7Yu4NyHDusAHRkgog5ziwTa3TgC8mxcpR8fFV_GQG-K-KVetA5B1F1uxKQ2msUQDShDG3A93DbshYfza3MEL_K8qpHrBc4vCpwK99tKHllB6ftOhW3nAa2rZTHhbLkIiP6PNG3SmS3F02i9WEg7KsS6yoTJej_rkrOfl_TtpRwbQ46NwiFamefsRVH_V7" 
            />
          </a>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="text-gray-900 hover:text-gray-950 font-button-text text-button-text border-b-2 border-primary-fixed pb-1 cursor-pointer transition-all"
          >
            Kategoriler (Explore)
          </button>
          <button 
            onClick={() => scrollTo(howItWorksRef)} 
            className="text-gray-600 hover:text-gray-900 transition-colors font-button-text text-button-text hover:bg-gray-50 px-3 py-1 rounded cursor-pointer"
          >
            Nasıl Çalışır
          </button>
          <button 
            onClick={() => scrollTo(partnerRef)} 
            className="text-gray-600 hover:text-gray-900 transition-colors font-button-text text-button-text hover:bg-gray-50 px-3 py-1 rounded cursor-pointer"
          >
            Hizmet Verenler
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => triggerNotification("Giriş Yap özelliği yakında hizmetinizde!")}
            className="px-4 py-2 rounded-full border border-gray-300 font-button-text text-button-text text-gray-700 hover:border-gray-400 hover:text-gray-900 transition-colors bg-white cursor-pointer"
          >
            Giriş Yap
          </button>
          <button 
            onClick={() => scrollTo(partnerRef)}
            className="px-4 py-2 rounded-full bg-primary-fixed text-gray-900 font-button-text text-button-text hover:bg-[#b5e639] transition-colors border border-transparent cursor-pointer shadow-sm"
          >
            Hizmet Ver
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative flex flex-col items-center justify-center pt-32 pb-24 px-4 md:px-12 particle-bg hero-glow min-h-[90vh]">
        <div className="w-full max-w-4xl text-center z-10 space-y-6 mt-12 md:mt-0">
          <h1 className="font-headline-xl text-3xl md:text-headline-xl text-gray-900 tracking-tighter leading-tight">
            Hizmetin Geleceği:<br />
            <span className="text-gray-900 relative inline-block mt-1">
              Yapay Zeka ile Kusursuz Eşleşme
              <span className="absolute -bottom-1.5 left-0 w-full h-3 bg-primary-fixed/40 -z-10 rounded"></span>
            </span>
          </h1>
          <p className="font-body-lg text-body-lg text-gray-600 max-w-2xl mx-auto">
            Yapay zeka destekli hassas eşleştirme ile fikirlerinizi gerçeğe dönüştürün. İhtiyaçlarınız için mükemmel profesyoneli anında bulun.
          </p>
          
          {/* AI Search Bar */}
          <div className="w-full max-w-3xl mx-auto mt-12 bg-white/90 backdrop-blur-xl border border-gray-200 rounded-[16px] p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-fixed/10 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            
            <div className="flex flex-col gap-4 relative z-10">
              <p className="font-body-md text-gray-500 text-left">Hangi hizmete ihtiyacınız var?</p>
              
              <div className="flex items-center gap-4 border-b border-gray-200 pb-4 focus-within:border-gray-400 transition-colors">
                <input 
                  ref={searchInputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSend();
                    }
                  }}
                  className="bg-transparent border-none outline-none w-full text-gray-900 font-body-lg placeholder-gray-400 focus:ring-0" 
                  placeholder="Örn: Ev temizliği, İngilizce özel ders..." 
                  type="text"
                />
                
                <button 
                  onClick={() => triggerNotification("Sesli arama özelliği çok yakında esnaflarımızla buluşuyor!")}
                  className="bg-gray-100 p-2.5 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors cursor-pointer"
                  title="Sesle Anlat"
                >
                  <span className="material-symbols-outlined text-[20px]">mic</span>
                </button>
                <button 
                  onClick={() => triggerNotification("Fotoğrafla hasar/talep analizi ve arama özelliği çok yakında!")}
                  className="bg-gray-100 p-2.5 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors cursor-pointer"
                  title="Fotoğraf Yükle"
                >
                  <span className="material-symbols-outlined text-[20px]">image</span>
                </button>
              </div>
              
              <div className="flex justify-between items-center mt-2 flex-wrap gap-4">
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleSelectCategory("Ev Temizliği")}
                    className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full border border-gray-200 hover:border-gray-300 transition-colors font-button-text text-button-text text-gray-700 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">cleaning_services</span> Temizlik
                  </button>
                  <button 
                    onClick={() => handleSelectCategory("Özel Ders")}
                    className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full border border-gray-200 hover:border-gray-300 transition-colors font-button-text text-button-text text-gray-700 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">school</span> Eğitim
                  </button>
                </div>
                
                <button 
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className="bg-primary-fixed text-gray-900 px-8 py-3 rounded-full font-button-text text-button-text flex items-center gap-2 hover:bg-[#b5e639] disabled:opacity-50 disabled:cursor-not-allowed transition-colors glow-hover shadow-sm border border-transparent cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">auto_awesome</span> Eşleş
                </button>
              </div>
            </div>
          </div>
          
          {/* Suggestion Chips */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <button 
              onClick={() => handleSelectCategory("Su Tesisatçısı")}
              className="px-4 py-2 rounded-full border border-gray-200 bg-white/50 font-button-text text-button-text text-gray-600 cursor-pointer hover:border-gray-400 hover:text-gray-900 transition-all flex items-center gap-2 shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">bolt</span> Hızlı Tesisatçı
            </button>
            <button 
              onClick={() => handleSelectCategory("UX Tasarımcı")}
              className="px-4 py-2 rounded-full border border-gray-200 bg-white/50 font-button-text text-button-text text-gray-600 cursor-pointer hover:border-gray-400 hover:text-gray-900 transition-all flex items-center gap-2 shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">design_services</span> UX Tasarımcı
            </button>
            <button 
              onClick={() => handleSelectCategory("Özel Şoför")}
              className="px-4 py-2 rounded-full border border-gray-200 bg-white/50 font-button-text text-button-text text-gray-600 cursor-pointer hover:border-gray-400 hover:text-gray-900 transition-all flex items-center gap-2 shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">directions_car</span> Şoför
            </button>
          </div>
        </div>
      </main>

      {/* Popular Categories Section */}
      <section className="py-24 px-4 md:px-12 max-w-[1440px] mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-headline-lg text-headline-lg text-gray-900 mb-4">Popüler Hizmet Kategorileri</h2>
          <p className="font-body-lg text-gray-600">En çok aranan profesyonelleri keşfedin.</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Category Cards */}
          <button 
            onClick={() => handleSelectCategory("Ev Temizliği")}
            className="glass-card rounded-[16px] p-6 flex flex-col items-center justify-center text-center gap-4 hover:border-gray-300 hover:-translate-y-1 transition-all duration-300 group cursor-pointer w-full"
          >
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary-fixed/20 transition-colors border border-gray-100">
              <span className="material-symbols-outlined text-3xl text-gray-600 group-hover:text-gray-900 transition-colors">cleaning_services</span>
            </div>
            <div>
              <h3 className="font-button-text text-gray-900 mb-1">Temizlik</h3>
              <p className="font-label-sm text-gray-500">Ev, Ofis, İnşaat Sonrası</p>
            </div>
          </button>

          <button 
            onClick={() => handleSelectCategory("Tadilat & Tamirat")}
            className="glass-card rounded-[16px] p-6 flex flex-col items-center justify-center text-center gap-4 hover:border-gray-300 hover:-translate-y-1 transition-all duration-300 group cursor-pointer w-full"
          >
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary-fixed/20 transition-colors border border-gray-100">
              <span className="material-symbols-outlined text-3xl text-gray-600 group-hover:text-gray-900 transition-colors">home_repair_service</span>
            </div>
            <div>
              <h3 className="font-button-text text-gray-900 mb-1">Tadilat &amp; Tamirat</h3>
              <p className="font-label-sm text-gray-500">Boya, Tesisat, Marangoz</p>
            </div>
          </button>

          <button 
            onClick={() => handleSelectCategory("Teknoloji ve Yazılım")}
            className="glass-card rounded-[16px] p-6 flex flex-col items-center justify-center text-center gap-4 hover:border-gray-300 hover:-translate-y-1 transition-all duration-300 group cursor-pointer w-full"
          >
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary-fixed/20 transition-colors border border-gray-100">
              <span className="material-symbols-outlined text-3xl text-gray-600 group-hover:text-gray-900 transition-colors">computer</span>
            </div>
            <div>
              <h3 className="font-button-text text-gray-900 mb-1">Teknoloji</h3>
              <p className="font-label-sm text-gray-500">Yazılım, Ağ Kurulumu, Onarım</p>
            </div>
          </button>

          <button 
            onClick={() => handleSelectCategory("Özel Ders")}
            className="glass-card rounded-[16px] p-6 flex flex-col items-center justify-center text-center gap-4 hover:border-gray-300 hover:-translate-y-1 transition-all duration-300 group cursor-pointer w-full"
          >
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary-fixed/20 transition-colors border border-gray-100">
              <span className="material-symbols-outlined text-3xl text-gray-600 group-hover:text-gray-900 transition-colors">school</span>
            </div>
            <div>
              <h3 className="font-button-text text-gray-900 mb-1">Eğitim</h3>
              <p className="font-label-sm text-gray-500">Özel Ders, Dil Eğitimi, Koçluk</p>
            </div>
          </button>
        </div>
      </section>

      {/* AI Trust Section */}
      <section ref={howItWorksRef} className="py-24 px-4 md:px-12 bg-gray-50 relative overflow-hidden border-y border-gray-200">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center gap-16 relative z-10">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-fixed/20 border border-primary-fixed/40 text-gray-900 font-label-sm">
              <span className="material-symbols-outlined text-sm">memory</span>
              Akıllı Eşleştirme Motoru
            </div>
            <h2 className="font-headline-lg text-gray-900">Nasıl Çalışır?</h2>
            <p className="font-body-lg text-gray-600">
              Yapay zeka algoritmamız, talebinizi analiz eder, profesyonellerin geçmiş performanslarını, yetkinliklerini ve müsaitlik durumlarını saniyeler içinde tarayarak size en uygun eşleşmeyi sunar.
            </p>
            
            <ul className="space-y-4 mt-8">
              <li className="flex items-start gap-4">
                <div className="mt-1 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-900 font-bold">1</div>
                <div>
                  <h4 className="font-button-text text-gray-900">Talebinizi İletin</h4>
                  <p className="font-body-md text-gray-600 text-sm">İhtiyacınızı detaylı veya özet olarak yazın veya sesli anlatın.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="mt-1 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-900 font-bold">2</div>
                <div>
                  <h4 className="font-button-text text-gray-900">Yapay Zeka Analizi</h4>
                  <p className="font-body-md text-gray-600 text-sm">Motorumuz, kelime dağarcığınızdan niyetinizi anlar ve doğru kategoriyi belirler.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="mt-1 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-900 font-bold">3</div>
                <div>
                  <h4 className="font-button-text text-gray-900">Anında Eşleşme</h4>
                  <p className="font-body-md text-gray-600 text-sm">En yüksek puanlı ve müsait profesyonellerle saniyeler içinde bağlantı kurun.</p>
                </div>
              </li>
            </ul>
          </div>
          
          <div className="flex-1 w-full max-w-md mx-auto">
            {/* Visual aesthetic matching graphic */}
            <div className="relative w-full aspect-square glass-card rounded-[24px] p-8 flex items-center justify-center bg-white/50">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-fixed/20 to-transparent rounded-[24px]"></div>
              
              <div className="relative z-10 grid grid-cols-2 gap-4 w-full">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center gap-2 animate-pulse">
                  <span className="material-symbols-outlined text-gray-900">search</span>
                  <span className="font-label-sm text-gray-600">Analiz</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-gray-900">filter_alt</span>
                  <span className="font-label-sm text-gray-600">Filtreleme</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-gray-900">verified_user</span>
                  <span className="font-label-sm text-gray-600">Doğrulama</span>
                </div>
                <div className="bg-primary-fixed p-4 rounded-xl flex flex-col items-center justify-center gap-2 shadow-[0_4px_20px_rgba(200,242,82,0.4)] border border-transparent">
                  <span className="material-symbols-outlined text-gray-900">handshake</span>
                  <span className="font-label-sm text-gray-900 font-bold">Eşleşme</span>
                </div>
              </div>
              
              {/* Connection lines (decorative) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path className="text-gray-900" d="M25 25 L75 75 M75 25 L25 75" stroke="currentColor" strokeWidth="2"></path>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section ref={testimonialsRef} className="py-24 px-4 md:px-12 max-w-[1440px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-headline-lg text-gray-900 mb-4">Güvenle Hizmet Alanlar</h2>
          <p className="font-body-lg text-gray-600">Binlerce mutlu müşteri yapay zeka ile eşleşti.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Testimonial Cards */}
          <div className="glass-card rounded-[16px] p-8 flex flex-col gap-6 bg-white">
            <div className="flex gap-1 text-[#a5cc2b]">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            </div>
            <p className="font-body-md text-gray-700 italic">
              "Sadece neye ihtiyacım olduğunu yazdım, sistem beni 2 dakika içinde mükemmel bir tesisatçı ile eşleştirdi. Fiyat da çok uygundu."
            </p>
            <div className="mt-auto flex items-center gap-4 pt-4 border-t border-gray-100">
              <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-button-text text-gray-900">A</div>
              <div>
                <h4 className="font-button-text text-gray-900 flex items-center gap-1">Ahmet Y. <span className="material-symbols-outlined text-[#a5cc2b] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span></h4>
                <p className="font-label-sm text-gray-500">Tadilat Hizmeti Aldı</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-[16px] p-8 flex flex-col gap-6 bg-white">
            <div className="flex gap-1 text-[#a5cc2b]">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            </div>
            <p className="font-body-md text-gray-700 italic">
              "Kızımın İngilizce dersleri için hoca arıyordum. Seçenekler arasında kaybolmadan, yapay zeka tam istediğimiz profili buldu."
            </p>
            <div className="mt-auto flex items-center gap-4 pt-4 border-t border-gray-100">
              <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-button-text text-gray-900">Z</div>
              <div>
                <h4 className="font-button-text text-gray-900 flex items-center gap-1">Zeynep K. <span className="material-symbols-outlined text-[#a5cc2b] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span></h4>
                <p className="font-label-sm text-gray-500">Eğitim Hizmeti Aldı</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-[16px] p-8 flex flex-col gap-6 bg-white">
            <div className="flex gap-1 text-[#a5cc2b]">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-xl">star_half</span>
            </div>
            <p className="font-body-md text-gray-700 italic">
              "Yeni taşındığım evin temizliği için acil birine ihtiyacım vardı. Hızlı eşleşme sayesinde aynı gün içinde hallettik."
            </p>
            <div className="mt-auto flex items-center gap-4 pt-4 border-t border-gray-100">
              <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-button-text text-gray-900">M</div>
              <div>
                <h4 className="font-button-text text-gray-900 flex items-center gap-1">Murat T. <span className="material-symbols-outlined text-[#a5cc2b] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span></h4>
                <p className="font-label-sm text-gray-500">Temizlik Hizmeti Aldı</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Entry Point */}
      <section ref={partnerRef} className="py-24 px-4 md:px-12 bg-gray-50 border-t border-gray-200 text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-8">
          <h2 className="font-headline-lg text-gray-900">Siz de mi bir profesyonelsiniz?</h2>
          <p className="font-body-lg text-gray-600 max-w-2xl">
            Yeteneklerinizi binlerce müşteriyle buluşturun. Esnaaf ile işinizi büyütün ve yeni müşterilere zahmetsizce ulaşın.
          </p>
          <button 
            onClick={() => triggerNotification("Hizmet veren kayıt portalı yakında yayında olcaktır!")}
            className="inline-flex items-center gap-3 text-gray-900 bg-primary-fixed hover:bg-[#b5e639] transition-colors font-button-text px-8 py-4 rounded-full glow-hover mt-4 shadow-sm border border-transparent cursor-pointer"
          >
            <span className="material-symbols-outlined">work</span>
            Hemen Hizmet Vermeye Başla
          </button>
        </div>
      </section>

      {/* BottomNavBar (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-safe pt-2 md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-xl pb-4">
        <button 
          onClick={() => {
            setActiveTab("explore");
            setIsModalOpen(true);
          }}
          className={`flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer ${activeTab === "explore" ? "text-gray-900 bg-primary-fixed/20 font-bold" : "text-gray-500"}`}
        >
          <span className="material-symbols-outlined mb-1">search_spark</span>
          <span className="font-label-sm text-[10px]">Explore</span>
        </button>
        
        <button 
          onClick={() => {
            setActiveTab("matches");
            if (searchInputRef.current) searchInputRef.current.focus();
            triggerNotification("Yeni bir eşleşme başlatmak için yukarıdaki arama alanını kullanabilirsiniz.");
          }}
          className={`flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer ${activeTab === "matches" ? "text-gray-900 bg-primary-fixed/20 font-bold" : "text-gray-500"}`}
        >
          <span className="material-symbols-outlined mb-1">bolt</span>
          <span className="font-label-sm text-[10px]">Matches</span>
        </button>
        
        <button 
          onClick={() => {
            setActiveTab("requests");
            triggerNotification("Önceki talepleriniz ve aktif iş durumlarınız yakında burada listelenecektir!");
          }}
          className={`flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer ${activeTab === "requests" ? "text-gray-900 bg-primary-fixed/20 font-bold" : "text-gray-500"}`}
        >
          <span className="material-symbols-outlined mb-1">auto_awesome_motion</span>
          <span className="font-label-sm text-[10px]">Requests</span>
        </button>
        
        <button 
          onClick={() => {
            setActiveTab("profile");
            triggerNotification("Profil sekmesi ve üyelik paneli yakında aktif edilecektir!");
          }}
          className={`flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer ${activeTab === "profile" ? "text-gray-900 bg-primary-fixed/20 font-bold" : "text-gray-500"}`}
        >
          <span className="material-symbols-outlined mb-1">account_circle</span>
          <span className="font-label-sm text-[10px]">Profile</span>
        </button>
      </nav>

      {/* Category Overlay Sheet (Modal) */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs animate-fade-in p-0 sm:p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full sm:max-w-[600px] bg-white rounded-t-[24px] sm:rounded-[24px] shadow-[0_10px_40px_rgba(0,0,0,0.15)] flex flex-col max-h-[85vh] sm:max-h-[75vh] animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E0E0E0] px-6 py-4">
              <div className="flex flex-col">
                <h3 className="font-bold text-lg text-[#232323]">Hizmet Kategorileri</h3>
                <p className="text-xs text-[#888888]">İhtiyacınız olan hizmeti seçip başlayın</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#888888] hover:text-[#232323] p-1.5 rounded-full hover:bg-[#F5F5F5] cursor-pointer transition-all duration-150"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Grid list of categories */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-3">
              {categories.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectCategory(cat.name)}
                  className="flex items-center gap-3 p-3 border border-[#E0E0E0] rounded-[16px] hover:border-[#D4F54E] hover:bg-[#F7FCD4] text-left cursor-pointer active:scale-98 transition-all duration-150 w-full"
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-sm text-[#232323] truncate">
                      {cat.name}
                    </span>
                    <span className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">
                      {cat.phase}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Styled utilities injection for quick keyframes */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @media (min-width: 640px) {
          @keyframes slideUp {
            from { transform: scale(0.95) translateY(20px); opacity: 0; }
            to { transform: scale(1) translateY(0); opacity: 1; }
          }
        }
        .animate-fade-in {
          animation: fadeIn 200ms ease-out forwards;
        }
        .animate-slide-up {
          animation: slideUp 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
