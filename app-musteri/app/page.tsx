"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import ChatScreen from "../components/ChatScreen";
import { startNewSession } from "../lib/session";

// All 20 categories for the [➕] modal
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
  const [hideChips, setHideChips] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Transition States for Chat Interaction
  const [isChatActive, setIsChatActive] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Monitor the visual viewport height changes (mobile keyboard detection)
  useEffect(() => {
    const handleViewportChange = () => {
      if (window.visualViewport) {
        const isKeyboardActive = window.visualViewport.height < window.innerHeight * 0.75;
        setHideChips(isKeyboardActive);
      }
    };

    window.visualViewport?.addEventListener("resize", handleViewportChange);
    return () => {
      window.visualViewport?.removeEventListener("resize", handleViewportChange);
    };
  }, []);

  // Handle category chip selection
  const handleSelectCategory = (categoryName: string) => {
    setInputValue(categoryName);
    setIsModalOpen(false);

    // Auto-focus and submit
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
      // Instantly trigger transition
      handleStartChat(categoryName);
    }, 100);
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
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#F5F5F5] px-4 font-sans select-none overflow-hidden relative animate-fade-in">
      {/* Container holding the brand and the chat input */}
      <div className="w-full max-w-[680px] flex flex-col items-center gap-8 z-10 transition-all duration-300">
        
        {/* Animated Brand Logo */}
        <div className="hover:scale-102 transition-transform duration-300 pointer-events-none">
          <Image
            src="/logo.svg"
            alt="Esnaaf Logo"
            width={180}
            height={54}
            priority
            className="select-none"
          />
        </div>

        {/* Input Card Container */}
        <div className="w-full flex flex-col gap-4 relative">
          
          {/* Main Large Textarea container */}
          <div className="w-full bg-white rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#E0E0E0] focus-within:border-[#D4F54E] focus-within:ring-3 focus-within:ring-[rgba(212,245,78,0.2)] transition-all duration-200 p-4 flex flex-col gap-2">
            
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Bana neye ihtiyacın olduğunu söyle..."
              rows={3}
              className="w-full bg-transparent border-0 text-[#232323] placeholder-[#888888] font-medium text-base outline-none resize-none focus:ring-0 focus:border-0 p-0"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            {/* Right-aligned premium neon lime submit button */}
            <div className="flex justify-end items-center pt-2 border-t border-[#F5F5F5]">
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="flex items-center justify-center gap-2 bg-[#D4F54E] hover:bg-[#c5e645] disabled:bg-[#C0C0C0] text-[#232323] disabled:text-[#FFFFFF] h-10 px-5 rounded-[12px] font-semibold text-sm cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.05)] active:scale-97 hover:scale-102 transition-all duration-150"
              >
                Gönder
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Quick Selection Chips - hidden on mobile keyboard activation */}
          {!hideChips && (
            <div className="flex flex-wrap items-center justify-center gap-2 transition-all duration-200">
              <button
                onClick={() => handleSelectCategory("Ev Temizliği")}
                className="flex items-center gap-1.5 bg-[#F7FCD4] border border-[#D4F54E] text-[#232323] text-[13px] font-medium py-1.5 px-3.5 rounded-[20px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer hover:scale-105 active:scale-95 transition-all duration-150 hover:bg-[#edf5ab]"
              >
                <span>🏠</span> Ev Temizliği
              </button>
              <button
                onClick={() => handleSelectCategory("Boya Badana")}
                className="flex items-center gap-1.5 bg-[#F7FCD4] border border-[#D4F54E] text-[#232323] text-[13px] font-medium py-1.5 px-3.5 rounded-[20px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer hover:scale-105 active:scale-95 transition-all duration-150 hover:bg-[#edf5ab]"
              >
                <span>🎨</span> Boya
              </button>
              <button
                onClick={() => handleSelectCategory("Su Tesisatı")}
                className="flex items-center gap-1.5 bg-[#F7FCD4] border border-[#D4F54E] text-[#232323] text-[13px] font-medium py-1.5 px-3.5 rounded-[20px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer hover:scale-105 active:scale-95 transition-all duration-150 hover:bg-[#edf5ab]"
              >
                <span>🔧</span> Tesisat
              </button>
              <button
                onClick={() => handleSelectCategory("Elektrik Tesisatı")}
                className="flex items-center gap-1.5 bg-[#F7FCD4] border border-[#D4F54E] text-[#232323] text-[13px] font-medium py-1.5 px-3.5 rounded-[20px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer hover:scale-105 active:scale-95 transition-all duration-150 hover:bg-[#edf5ab]"
              >
                <span>⚡</span> Elektrik
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center bg-[#F7FCD4] border border-[#D4F54E] text-[#232323] text-[13px] font-bold py-1.5 px-4 rounded-[20px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer hover:scale-105 active:scale-95 transition-all duration-150 hover:bg-[#edf5ab]"
                title="Tüm Kategoriler"
              >
                <span>➕</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Category Overlay Sheet (Modal) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs animate-fade-in p-0 sm:p-4">
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
                  className="flex items-center gap-3 p-3 border border-[#E0E0E0] rounded-[16px] hover:border-[#D4F54E] hover:bg-[#F7FCD4] text-left cursor-pointer active:scale-98 transition-all duration-150"
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
