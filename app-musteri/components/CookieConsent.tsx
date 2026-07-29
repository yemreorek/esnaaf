"use client";

import React, { useState, useEffect } from "react";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Custom Cookie Preferences State
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true
    analytics: true,
    functional: true,
    marketing: true,
  });

  useEffect(() => {
    // Check if consent has already been saved
    try {
      const consent = localStorage.getItem("esnaaf_cookie_consent");
      if (!consent) {
        // Show banner after short delay for smooth appearance
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      // LocalStorage fallback
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const data = {
      status: "accepted_all",
      necessary: true,
      analytics: true,
      functional: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    };
    try {
      localStorage.setItem("esnaaf_cookie_consent", JSON.stringify(data));
    } catch (e) {}
    setIsVisible(false);
    setIsModalOpen(false);
  };

  const handleRejectAll = () => {
    const data = {
      status: "rejected_all",
      necessary: true,
      analytics: false,
      functional: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    };
    try {
      localStorage.setItem("esnaaf_cookie_consent", JSON.stringify(data));
    } catch (e) {}
    setIsVisible(false);
    setIsModalOpen(false);
  };

  const handleSaveCustom = () => {
    const data = {
      status: "custom",
      ...preferences,
      necessary: true,
      timestamp: new Date().toISOString(),
    };
    try {
      localStorage.setItem("esnaaf_cookie_consent", JSON.stringify(data));
    } catch (e) {}
    setIsVisible(false);
    setIsModalOpen(false);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* 🍪 Main Cookie Consent Banner (Bottom Center Floating Card) */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[99999] w-[94%] max-w-4xl animate-slide-up">
        <div className="bg-[#18181b]/95 backdrop-blur-xl border border-slate-800 text-white rounded-3xl p-5 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row items-center justify-between gap-5 md:gap-8">
          
          {/* Left: Explanatory Text */}
          <div className="text-xs md:text-sm text-slate-300 font-normal leading-relaxed text-left flex-1">
            Sitemizde, içeriğin tarafınıza sağlanması, Site'nin performansının optimize edilmesi ve ziyaretçi profilinin anlaşılması için gerekli olan çerezler kullanılmaktadır. Site üzerinde kullanılan çerezler hakkında detaylı bilgi almak için{" "}
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-white underline hover:text-[#c8f252] font-semibold transition-colors cursor-pointer bg-transparent border-none p-0 inline"
            >
              Çerez Aydınlatma Metni
            </button>
            'ni incelemenizi rica ederiz.
          </div>

          {/* Right: 3 Stacked Buttons in Esnaaf Neon Lime (#c8f252) */}
          <div className="flex flex-col gap-2.5 w-full md:w-56 shrink-0">
            <button
              onClick={handleAcceptAll}
              className="w-full py-2.5 px-4 bg-[#c8f252] hover:bg-[#b8e242] text-slate-950 font-extrabold text-xs md:text-sm rounded-xl transition-all active:scale-[0.98] shadow-md text-center cursor-pointer border-none"
            >
              Tüm Çerezleri Kabul Et
            </button>

            <button
              onClick={handleRejectAll}
              className="w-full py-2.5 px-4 bg-[#c8f252] hover:bg-[#b8e242] text-slate-950 font-extrabold text-xs md:text-sm rounded-xl transition-all active:scale-[0.98] shadow-md text-center cursor-pointer border-none"
            >
              Tüm Çerezleri Reddet
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full py-2.5 px-4 bg-[#c8f252] hover:bg-[#b8e242] text-slate-950 font-extrabold text-xs md:text-sm rounded-xl transition-all active:scale-[0.98] shadow-md text-center cursor-pointer border-none"
            >
              Çerezleri Yönet
            </button>
          </div>
        </div>
      </div>

      {/* 📋 Detailed Cookie Management Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8 flex flex-col gap-6 text-left relative">
            
            {/* Header & Close Button */}
            <div className="flex justify-between items-start gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span className="text-2xl">🍪</span> Çerez Aydınlatma Metni ve Tercihleri
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-normal font-medium">
                  Esnaaf platformunda kişiselleştirilmiş bir deneyim sunmak amacıyla çerezler kullanılmaktadır. Çerez tercihlerinizi aşağıdan özelleştirebilirsiniz.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 border-none"
              >
                ✕
              </button>
            </div>

            {/* Cookie Categories List */}
            <div className="flex flex-col gap-4">
              
              {/* 1. Necessary Cookies */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">Zorunlu Çerezler</span>
                    <span className="text-[10px] font-bold bg-[#c8f252]/20 text-[#c8f252] px-2 py-0.5 rounded-md border border-[#c8f252]/30">
                      Her Zaman Aktif
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Sitenin temel işlevlerinin, güvenliğin ve oturum yönetiminin çalışabilmesi için zorunludur. Devre dışı bırakılamaz.
                  </p>
                </div>
              </div>

              {/* 2. Analytics Cookies */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-sm text-white">Performans & Analitik Çerezleri</span>
                  <p className="text-xs text-slate-400 mt-1">
                    Ziyaretçi trafiğini ve sayfa kullanım istatistiklerini anonim olarak analiz ederek platformumuzu geliştirmemizi sağlar.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c8f252]"></div>
                </label>
              </div>

              {/* 3. Functional Cookies */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-sm text-white">İşlevsel Çerezler</span>
                  <p className="text-xs text-slate-400 mt-1">
                    Dil seçenekleri ve kişisel tercihlerinizi hatırlayarak daha akıcı bir kullanım deneyimi sunar.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={preferences.functional}
                    onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c8f252]"></div>
                </label>
              </div>

              {/* 4. Marketing Cookies */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-sm text-white">Pazarlama & Reklam Çerezleri</span>
                  <p className="text-xs text-slate-400 mt-1">
                    İlgi alanlarınıza uygun kişiselleştirilmiş hizmet teklifleri ve kampanyalar sunmamıza yardımcı olur.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c8f252]"></div>
                </label>
              </div>

            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={handleAcceptAll}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs md:text-sm rounded-xl transition-all cursor-pointer border-none"
              >
                Tümünü Kabul Et
              </button>
              <button
                onClick={handleSaveCustom}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#c8f252] hover:bg-[#b8e242] text-slate-950 font-extrabold text-xs md:text-sm rounded-xl transition-all cursor-pointer border-none shadow-md"
              >
                Seçimleri Kaydet
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
