"use client";

import { useState, useEffect, useRef } from "react";
import ChatScreen from "../components/ChatScreen";
import SeekerDashboard from "../components/SeekerDashboard";
import { startNewSession, isLoggedIn, getAuthUser, logout } from "../lib/session";

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

// Helper function to render a thin, elegant, mono-colored SVG outline icon for categories
const renderCategoryIcon = (icon: string) => {
  const baseClass = "w-5 h-5 text-slate-500 shrink-0 stroke-[2.2]";
  switch (icon) {
    case "🏠": // Ev Temizliği (Clean House Icon)
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
        </svg>
      );
    case "🧹": // Tadilat Sonrası Temizlik (Broom brush)
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.656 48.656 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3h-3m-3-3h-3m-3 3H3M9 12V3m6 9V3M4 12v6a2 2 0 002 2h12a2 2 0 002-2v-6"></path>
        </svg>
      );
    case "🔨": // Tadilat / Çekiç
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
        </svg>
      );
    case "📦": // Nakliyat / Truck
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 17a2 2 0 11-4 0 2 2 0 014 0zM7 17a2 2 0 11-4 0 2 2 0 014 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 17h10M19 17h2v-6l-3-3h-3V5H3v10h2" />
        </svg>
      );
    case "🔧": // Su Tesisatı (Water Droplet)
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"></path>
        </svg>
      );
    case "📚": // Özel Ders / Kep
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6M12 21a9.003 9.003 0 008.361-5.639M12 21a9.003 9.003 0 01-8.361-5.639"></path>
        </svg>
      );
    case "🎨": // Boya Badana / Rulo
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-3"></path>
        </svg>
      );
    case "⚡": // Elektrik / Yıldırım
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </svg>
      );
    case "🧼": // Halı Koltuk Yıkama (Bubbles)
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8a3 3 0 100-6 3 3 0 000 6zm-7 9a2 2 0 100-4 2 2 0 000 4zm14 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM7.5 12a1 1 0 100-2 1 1 0 000 2z"></path>
        </svg>
      );
    case "🧱": // Fayans & Parke (Tiled Grid Pattern)
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v4m-6 0v4m12-4v4m-9-12v4m6-4v4"></path>
        </svg>
      );
    case "🐜": // Haşere
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12a3 3 0 106 0a3 3 0 00-6 0zm-4 0h4m6 0h4m-7-5V3m0 18v-4m-4-1.5L5 19m4-13.5L5 5m10 10.5l4 3.5m-4-10.5l4-3.5"></path>
        </svg>
      );
    case "❄️": // Kombi Klima
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m9-9H3m15-6l-6 6 6 6m-12 0l6-6-6-6"></path>
        </svg>
      );
    case "🏢": // Ofis / Bina
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
        </svg>
      );
    case "🪚": // Mobilya
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0V12m-3-2.5h3m1-4.5V14m0-7.5v-2a1.5 1.5 0 113 0V12m-3-5.5h3m2 3.5h3a1.5 1.5 0 010 3h-3v4M4 19h16"></path>
        </svg>
      );
    case "🪟": // Cam Balkon
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm8-1v16M4 12h16"></path>
        </svg>
      );
    case "🔥": // Doğalgaz (Flame)
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.58a8.5 8.5 0 11-11.314 0zM12 15a3 3 0 11-3-3"></path>
        </svg>
      );
    case "📐": // İç mimar
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
        </svg>
      );
    case "📷": // Fotoğraf
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
      );
    case "🎉": // Etkinlik
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
      );
    default:
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      );
  }
};

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("marketplace"); // Marketplace highlighted in mockup
  const [notification, setNotification] = useState<string | null>(null);

  // Scroll targets refs
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Transition States for Chat Interaction
  const [activeView, setActiveView] = useState<"home" | "chat" | "dashboard">("home");
  const [chatInitialMessage, setChatInitialMessage] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isClientLoggedIn, setIsClientLoggedIn] = useState(false);
  const [clientUser, setClientUser] = useState<any>(null);

  // Giriş (Login) & OTP States
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginPhone, setLoginPhone] = useState("");
  const [loginOtp, setLoginOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [unregisteredUser, setUnregisteredUser] = useState(false);

  const handleHizmetVerRedirect = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/hizmetveren-basvuru";
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    setDevOtp(null);

    const cleanPhone = loginPhone.replace(/\s+/g, "");
    if (!cleanPhone) {
      setLoginError("Telefon numarası giriniz.");
      setLoginLoading(false);
      return;
    }

    try {
      // 1. Check if the user is registered first
      const checkResponse = await fetch("/api/ortak/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, checkOnly: true }),
      });
      const checkData = await checkResponse.json();

      if (!checkResponse.ok) {
        throw new Error(checkData.message || "Telefon numarası kontrol edilemedi.");
      }

      // 2. If not registered, show the unregistered panel inside the modal
      if (!checkData.isRegistered) {
        setUnregisteredUser(true);
        return;
      }

      // 3. If registered, proceed to send standard OTP
      const response = await fetch("/api/ortak/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "OTP kodu gönderilemedi.");
      }

      setOtpSent(true);
      if (data.devOtpCode) {
        setDevOtp(data.devOtpCode);
      }
      triggerNotification("Doğrulama kodu gönderildi.");
    } catch (err: any) {
      setLoginError(err.message || "Bir hata oluştu.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    const cleanPhone = loginPhone.replace(/\s+/g, "");
    if (!loginOtp || loginOtp.length !== 6) {
      setLoginError("6 haneli doğrulama kodunu giriniz.");
      setLoginLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/ortak/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, code: loginOtp }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Doğrulama kodu hatalı.");
      }

      // Check role - if service_provider (hizmet veren), redirect them to their provider dashboard
      if (data.user && data.user.role === "service_provider") {
        triggerNotification("Hizmet Veren paneline yönlendiriliyorsunuz...");
        let providerBaseUrl = "https://partner.esnaaf.com";
        if (typeof window !== "undefined") {
          const hostname = window.location.hostname;
          if (hostname === "localhost" || hostname === "127.0.0.1") {
            providerBaseUrl = "http://localhost:3001";
          }
        }

        setIsLoginModalOpen(false);
        setOtpSent(false);
        setLoginOtp("");
        setLoginPhone("");
        setDevOtp(null);

        // Redirect to provider app passing the token and phone in parameters
        window.location.href = `${providerBaseUrl}?token=${encodeURIComponent(data.accessToken)}&phone=${encodeURIComponent(data.user.phone_masked || "")}`;
        return;
      }

      // Standard customer / admin role login
      localStorage.setItem("esnaaf_token", data.accessToken);
      localStorage.setItem("esnaaf_refresh_token", data.refreshToken);
      localStorage.setItem("esnaaf_user", JSON.stringify(data.user));

      setIsClientLoggedIn(true);
      setClientUser(data.user);
      setIsLoginModalOpen(false);
      setOtpSent(false);
      setLoginOtp("");
      setLoginPhone("");
      setDevOtp(null);

      triggerNotification("Giriş başarılı!");
      setActiveView("dashboard");
    } catch (err: any) {
      setLoginError(err.message || "Giriş başarısız.");
    } finally {
      setLoginLoading(false);
    }
  };

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
    setActiveView("chat");
  };

  const handleSend = () => {
    handleStartChat(inputValue);
  };

  // Show premium alert instead of standard browser alert
  const triggerNotification = (message: string) => {
    setNotification(message);
  };

  // Render full-screen ChatScreen if chat is active
  if (activeView === "chat") {
    return (
      <ChatScreen
        initialMessage={chatInitialMessage}
        onClose={() => {
          setActiveView(isLoggedIn() ? "dashboard" : "home");
          setInputValue("");
        }}
        onJobCompleted={(jobId) => {
          setSelectedJobId(jobId);
          setActiveView("dashboard");
        }}
      />
    );
  }

  // Render Seeker Dashboard if dashboard active
  if (activeView === "dashboard") {
    return (
      <SeekerDashboard
        initialJobId={selectedJobId}
        onLogout={() => {
          setActiveView("home");
          setSelectedJobId(null);
        }}
      />
    );
  }

  return (
    <div className="bg-[#f8fafc] text-slate-900 font-body-md antialiased overflow-x-hidden selection:bg-accent selection:text-slate-900 min-h-screen pb-16 md:pb-0 relative">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-24 right-4 z-[99] bg-white/95 text-slate-900 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 animate-slide-up max-w-sm">
          <svg className="w-5 h-5 text-[#2ecc71] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span className="font-button-text text-sm text-slate-800">{notification}</span>
        </div>
      )}

      {/* 🧭 Header & Floating Navigation Bar */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 md:px-12 py-4 h-16">
          
          {/* Logo & Brand Name */}
          <div className="flex items-center w-48 h-10 relative">
            <a className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center" href="#" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              <img 
                alt="Esnaaf Logo" 
                className="w-auto select-none max-w-none" 
                style={{ height: '120px', objectFit: 'contain' }}
                src="/logo.png" 
              />
            </a>
          </div>
          
          {/* Mockup Tabs - Marketplace, Services, Help */}
          <div className="hidden md:flex items-center gap-1.5 p-1 rounded-full bg-slate-100/50 border border-slate-200/50">
            <button 
              onClick={() => setActiveTab("marketplace")} 
              className={`font-button-text text-xs px-5 py-2 rounded-full transition-all cursor-pointer ${activeTab === "marketplace" ? "bg-white text-slate-900 shadow-sm border-b-2 border-[#88b000]" : "text-slate-500 hover:text-slate-800"}`}
            >
              Pazaryeri
            </button>
            <button 
              onClick={() => {
                setActiveTab("services");
                setIsModalOpen(true);
              }} 
              className={`font-button-text text-xs px-5 py-2 rounded-full transition-all cursor-pointer ${activeTab === "services" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              Hizmetler
            </button>
            <button 
              onClick={() => {
                setActiveTab("help");
                triggerNotification("Yardım ve Destek merkezimiz çok yakında hizmetinizde!");
              }} 
              className={`font-button-text text-xs px-5 py-2 rounded-full transition-all cursor-pointer ${activeTab === "help" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              Yardım
            </button>
          </div>

          {/* Action Icons on the Right (Giriş & Hizmet Ver) */}
          <div>
            {isClientLoggedIn ? (
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleHizmetVerRedirect}
                  className="bg-slate-900 hover:bg-slate-800 text-[#c8f252] border border-[#c8f252] text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 flex items-center gap-1.5"
                >
                  <span>Hizmet Ver</span>
                </button>
                
                <button
                  onClick={() => setActiveView("dashboard")}
                  className="bg-[#c8f252] hover:bg-[#b5e639] text-slate-950 text-xs font-black px-4.5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 flex items-center gap-1.5 border border-transparent scale-bounce"
                >
                  <span>Panelime Git</span>
                  <svg className="w-3.5 h-3.5 text-slate-950" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </button>

                <button
                  onClick={() => {
                    logout();
                    setIsClientLoggedIn(false);
                    setClientUser(null);
                    setActiveView("home");
                    triggerNotification("Çıkış yapıldı.");
                  }}
                  className="text-slate-500 hover:text-slate-850 hover:bg-slate-50 text-xs font-bold px-4 py-2 rounded-xl transition-all border border-slate-200 cursor-pointer"
                >
                  Çıkış
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsLoginModalOpen(true)}
                  className="text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold px-4.5 py-2.5 rounded-xl transition-all border border-slate-250 cursor-pointer"
                >
                  Giriş
                </button>
                
                <button 
                  onClick={handleHizmetVerRedirect}
                  className="bg-slate-900 hover:bg-slate-800 text-[#c8f252] border border-[#c8f252] text-xs font-black px-4.5 py-2.5 rounded-xl transition-all cursor-pointer shadow-md active:scale-95 flex items-center gap-1.5 hover:shadow-lg hover:shadow-[#c8f252]/10"
                >
                  <span>Hizmet Ver</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* 🚀 Hero Section - "Hizmet Piş, Ağzıma Düş" */}
      <main className="relative flex flex-col items-center justify-center pt-32 pb-20 px-4 md:px-12 hero-glow min-h-[70vh] border-b border-slate-100">
        <div className="w-full max-w-4xl text-center z-10 space-y-6 mt-6 md:mt-0">
          
          <h1 className="font-headline-xl text-4xl md:text-[56px] text-slate-900 tracking-tight leading-[1.15] font-extrabold">
            Aynı Mahalleyi Paylaştığın <br />
            <span className="text-[#88b000] font-black tracking-tight relative inline-block mt-2">
              Esnaf'tan Teklif Al
            </span>
          </h1>
          
          <p className="font-body-md text-slate-500 max-w-2xl mx-auto text-xs md:text-sm leading-relaxed font-semibold">
            Yıllardır aynı sokaktan geçtiğin, belki selamlaştığın ama henüz tanışmadığın esnafları keşfet.
          </p>
          
          {/* AI Sparkle Search Bar */}
          <div className="w-full max-w-2xl mx-auto mt-8 bg-white border border-slate-200/80 rounded-full p-2 pl-5 shadow-2xl shadow-slate-200/30 hover:shadow-slate-200/50 hover:border-slate-350 focus-within:border-[#88b000] focus-within:ring-4 focus-within:ring-[#88b000]/5 transition-all duration-300">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              
              <input 
                ref={searchInputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSend();
                  }
                }}
                className="bg-transparent border-none outline-none w-full text-slate-900 font-body-md placeholder-slate-400 focus:ring-0 text-xs md:text-sm py-1.5" 
                placeholder="Hangi hizmete ihtiyacın var? (Örn: Ev Temizliği, Nakliyat)" 
                type="text"
              />
              
              <button 
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="bg-[#4c630a] hover:bg-[#3d5008] text-white px-7 py-3 rounded-full font-button-text text-xs font-bold transition-all shrink-0 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-[#4c630a]/10"
              >
                Ara
              </button>
            </div>
          </div>
          
          {/* Quick Selection Chips with Icons */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <button 
              onClick={() => handleSelectCategory("Ev Temizliği")}
              className="px-4 py-2 rounded-full border border-slate-200/80 bg-white font-button-text text-xs text-slate-600 cursor-pointer hover:border-slate-400 hover:text-slate-900 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 scale-bounce"
            >
              {renderCategoryIcon("🧹")} Temizlik
            </button>
            <button 
              onClick={() => handleSelectCategory("Ev Tadilat")}
              className="px-4 py-2 rounded-full border border-slate-200/80 bg-white font-button-text text-xs text-slate-600 cursor-pointer hover:border-slate-400 hover:text-slate-900 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 scale-bounce"
            >
              {renderCategoryIcon("🔨")} Tadilat
            </button>
            <button 
              onClick={() => handleSelectCategory("Evden Eve Nakliyat")}
              className="px-4 py-2 rounded-full border border-slate-200/80 bg-white font-button-text text-xs text-slate-600 cursor-pointer hover:border-slate-400 hover:text-slate-900 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 scale-bounce"
            >
              {renderCategoryIcon("📦")} Nakliyat
            </button>
            <button 
              onClick={() => handleSelectCategory("Su Tesisatı")}
              className="px-4 py-2 rounded-full border border-slate-200/80 bg-white font-button-text text-xs text-slate-600 cursor-pointer hover:border-slate-400 hover:text-slate-900 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 scale-bounce"
            >
              {renderCategoryIcon("🔧")} Tamir
            </button>
            <button 
              onClick={() => handleSelectCategory("Özel Ders")}
              className="px-4 py-2 rounded-full border border-slate-200/80 bg-white font-button-text text-xs text-slate-600 cursor-pointer hover:border-slate-400 hover:text-slate-900 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 scale-bounce"
            >
              {renderCategoryIcon("📚")} Özel Ders
            </button>
          </div>
        </div>
      </main>

      {/* 📊 Haftanın Trend Hizmetleri Section */}
      <section className="py-20 px-4 md:px-12 max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="font-headline-lg text-2xl md:text-3xl text-slate-900 font-bold tracking-tight">
              Haftanın Trend Hizmetleri
            </h2>
            <p className="font-body-md text-slate-400 text-xs mt-1.5 font-semibold">
              En çok tercih edilen hizmetleri keşfet
            </p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-button-text text-xs transition-colors cursor-pointer group font-bold"
          >
            <span>Tümünü Gör</span>
            <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform stroke-current shrink-0" fill="none" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
        
        {/* Horizontal Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          
          {/* Card 1: Evden Eve Nakliyat (Takes 6 cols in large screens) */}
          <div className="md:col-span-6 bg-white border border-slate-100 rounded-3xl overflow-hidden flex flex-col justify-between shadow-md hover:shadow-xl transition-all duration-300 group scale-bounce relative">
            <div className="relative h-60 w-full overflow-hidden shrink-0">
              <img 
                alt="Evden Eve Nakliyat" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                src="/nakliyat.png" 
              />
              <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm border border-slate-100">
                <svg className="w-3 h-3 text-amber-500 fill-current shrink-0" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <span className="ml-1">4.9</span>
              </span>
            </div>
            
            <div className="p-6 flex flex-col justify-between flex-grow gap-4">
              <div>
                <h3 className="font-headline-lg text-slate-900 text-base md:text-lg font-bold">Evden Eve Nakliyat</h3>
                <p className="font-label-sm text-[11px] text-slate-400 font-bold mt-1">2.976 profesyonel • 172.197 onaylı yorum</p>
              </div>
              
              <button 
                onClick={() => handleSelectCategory("Evden Eve Nakliyat")}
                className="w-full bg-accent hover:bg-accent-hover text-slate-950 font-button-text text-xs py-3.5 rounded-2xl transition-all font-bold border border-transparent shadow-sm shadow-[#c8f252]/10 cursor-pointer text-center"
              >
                Teklif Al
              </button>
            </div>
          </div>

          {/* Card 2: Ev Temizliği (Takes 3 cols in large screens) */}
          <div className="md:col-span-3 bg-white border border-slate-100 rounded-3xl overflow-hidden flex flex-col justify-between shadow-md hover:shadow-xl transition-all duration-300 group scale-bounce relative">
            <div className="relative h-60 w-full overflow-hidden shrink-0">
              <img 
                alt="Ev Temizliği" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                src="/temizlik.png" 
              />
              <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm border border-slate-100">
                <svg className="w-3 h-3 text-amber-500 fill-current shrink-0" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <span className="ml-1">4.6</span>
              </span>
            </div>
            
            <div className="p-6 flex flex-col justify-between flex-grow gap-4">
              <div>
                <h3 className="font-headline-lg text-slate-900 text-base font-bold">Ev Temizliği</h3>
                <p className="font-label-sm text-[11px] text-slate-400 font-bold mt-1">9.861 profesyonel</p>
              </div>
              
              <button 
                onClick={() => handleSelectCategory("Ev Temizliği")}
                className="w-full bg-[#f1f5f9] hover:bg-[#e2e8f0] text-slate-800 font-button-text text-xs py-3.5 rounded-2xl transition-all font-bold border border-slate-200/40 cursor-pointer text-center"
              >
                Rezervasyon
              </button>
            </div>
          </div>

          {/* Card 3: Boya Badana (Takes 3 cols in large screens) */}
          <div className="md:col-span-3 bg-white border border-slate-100 rounded-3xl overflow-hidden flex flex-col justify-between shadow-md hover:shadow-xl transition-all duration-300 group scale-bounce relative">
            <div className="relative h-60 w-full overflow-hidden shrink-0">
              <img 
                alt="Boya Badana" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                src="/boya.png" 
              />
              <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm border border-slate-100">
                <svg className="w-3 h-3 text-amber-500 fill-current shrink-0" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <span className="ml-1">4.8</span>
              </span>
            </div>
            
            <div className="p-6 flex flex-col justify-between flex-grow gap-4">
              <div>
                <h3 className="font-headline-lg text-slate-900 text-base font-bold">Boya Badana</h3>
                <p className="font-label-sm text-[11px] text-slate-400 font-bold mt-1">11.214 profesyonel</p>
              </div>
              
              <button 
                onClick={() => handleSelectCategory("Boya Badana")}
                className="w-full bg-[#f1f5f9] hover:bg-[#e2e8f0] text-slate-800 font-button-text text-xs py-3.5 rounded-2xl transition-all font-bold border border-slate-200/40 cursor-pointer text-center"
              >
                Teklif Al
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 💼 Footer Section */}
      <footer className="bg-white border-t border-slate-100 py-12 px-4 md:px-12 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 w-full">
          
          {/* Logo & Copyright */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="flex items-center">
              <img 
                alt="Esnaaf Logo" 
                className="w-auto object-contain select-none" 
                style={{ height: '80px' }}
                src="/logo.png" 
              />
            </div>
            <p className="text-[11px] text-slate-400 font-semibold text-center md:text-left">
              &copy; {new Date().getFullYear()} Esnaaf Pazaryeri. Premium Hizmet Mükemmelliği.
            </p>
          </div>
          
          {/* Footer Links */}
          <div className="flex flex-wrap justify-center gap-6">
            <button 
              onClick={() => triggerNotification("Kullanım koşulları yakında güncellenecektir.")}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer transition-colors"
            >
              Kullanım Koşulları
            </button>
            <button 
              onClick={() => triggerNotification("Gizlilik politikamız kişisel verilerin korunmasını garanti eder.")}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer transition-colors"
            >
              Gizlilik Politikası
            </button>
            <button 
              onClick={() => triggerNotification("Hizmet veren kayıt portalı yakında yayında olcaktır!")}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer transition-colors"
            >
              Esnaf Olun
            </button>
            <button 
              onClick={() => triggerNotification("Destek ekibimiz 7/24 hizmetinizde!")}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer transition-colors"
            >
              Destek Alın
            </button>
          </div>
        </div>
      </footer>

      {/* 📱 BottomNavBar (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-safe pt-2 md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-[0_-4px_25px_rgba(0,0,0,0.03)] rounded-t-2xl pb-4">
        <button 
          onClick={() => {
            setActiveTab("marketplace");
            setIsModalOpen(true);
          }}
          className={`flex flex-col items-center justify-center p-2 rounded-xl cursor-pointer ${activeTab === "marketplace" ? "text-slate-900 bg-accent/20 font-bold animate-pulse" : "text-slate-400"}`}
        >
          <svg className="w-5 h-5 mb-0.5 stroke-current" fill="none" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
          <span className="font-label-sm text-[9px] font-bold">Kategoriler</span>
        </button>
        
        <button 
          onClick={() => {
            setActiveTab("services");
            if (searchInputRef.current) searchInputRef.current.focus();
            triggerNotification("Yeni bir eşleşme başlatmak için yukarıdaki arama alanını kullanabilirsiniz.");
          }}
          className={`flex flex-col items-center justify-center p-2 rounded-xl cursor-pointer ${activeTab === "services" ? "text-slate-900 bg-accent/20 font-bold" : "text-slate-400"}`}
        >
          <svg className="w-5 h-5 mb-0.5 stroke-current" fill="none" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
          <span className="font-label-sm text-[9px] font-bold">Eşleşmeler</span>
        </button>
        
        <button 
          onClick={() => {
            setActiveTab("help");
            triggerNotification("Gelen kutunuz yakında burada aktif olacaktır!");
          }}
          className={`flex flex-col items-center justify-center p-2 rounded-xl cursor-pointer ${activeTab === "help" ? "text-slate-900 bg-accent/20 font-bold" : "text-slate-400"}`}
        >
          <svg className="w-5 h-5 mb-0.5 stroke-current" fill="none" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5a2 2 0 012-2h2a2 2 0 002 2h4a2 2 0 002-2h2a2 2 0 012 2z"></path>
          </svg>
          <span className="font-label-sm text-[9px] font-bold">Gelen Kutusu</span>
        </button>
      </nav>

      {/* 🪟 Category Overlay Sheet (Modal) */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-xs animate-fade-in p-0 sm:p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full sm:max-w-[560px] bg-white rounded-t-[20px] sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[70vh] animate-slide-up border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex flex-col">
                <h3 className="font-button-text text-sm md:text-base text-slate-900">Tüm Hizmet Kategorileri</h3>
                <p className="text-[11px] text-slate-400 font-medium">Lütfen ihtiyaç duyduğunuz iş kolunu seçin</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-800 p-1.5 rounded-full hover:bg-slate-50 cursor-pointer transition-all"
              >
                <svg className="w-4.5 h-4.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* Grid list of categories */}
            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-2 gap-2.5">
              {categories.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectCategory(cat.name)}
                  className="flex items-center gap-3.5 p-3 border border-slate-100 rounded-2xl hover:border-accent hover:bg-accent/10 text-left cursor-pointer active:scale-98 transition-all w-full bg-white shadow-sm"
                >
                  {renderCategoryIcon(cat.icon)}
                  <div className="flex flex-col min-w-0">
                    <span className="font-button-text text-sm font-extrabold text-slate-800 truncate">
                      {cat.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 🔐 Login Modal */}
      {isLoginModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-xs animate-fade-in p-0 sm:p-4"
          onClick={() => {
            setIsLoginModalOpen(false);
            setOtpSent(false);
            setLoginError("");
            setDevOtp(null);
            setUnregisteredUser(false);
          }}
        >
          <div
            className="w-full sm:max-w-[420px] bg-white rounded-t-[24px] sm:rounded-3xl shadow-2xl flex flex-col animate-slide-up border border-slate-100 p-8 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background decorative glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#c8f252]/10 rounded-full blur-3xl pointer-events-none" />
            
            {/* Close button */}
            <button
              onClick={() => {
                setIsLoginModalOpen(false);
                setOtpSent(false);
                setLoginError("");
                setDevOtp(null);
                setUnregisteredUser(false);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-850 p-1.5 rounded-full hover:bg-slate-50 cursor-pointer transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>

            {unregisteredUser ? (
              <div className="flex flex-col items-center text-center mt-2 space-y-6">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center border border-red-100 shadow-sm animate-pulse">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-headline-lg text-slate-900 text-lg font-bold tracking-tight">
                    Kayıt Bulunamadı
                  </h3>
                  <p className="font-body-md text-xs text-slate-500 max-w-[280px] leading-relaxed">
                    Telefon numaranız sistemde kayıtlı değil. Yanlış veya eksik giriş yapmış olabilirsiniz.
                  </p>
                </div>

                <div className="flex gap-3 w-full pt-2">
                  <button
                    onClick={() => {
                      setUnregisteredUser(false);
                    }}
                    className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-4 rounded-2xl transition-all cursor-pointer text-center font-semibold"
                  >
                    Telefon Gir
                  </button>
                  <button
                    onClick={() => {
                      setIsLoginModalOpen(false);
                      setUnregisteredUser(false);
                      setInputValue("Merhaba, hizmet almak istiyorum.");
                      setTimeout(() => {
                        handleStartChat("Merhaba, hizmet almak istiyorum.");
                      }, 300);
                    }}
                    className="w-1/2 bg-slate-900 hover:bg-slate-800 text-[#c8f252] border border-[#c8f252] font-bold text-xs py-4 rounded-2xl transition-all cursor-pointer text-center"
                  >
                    Hizmet Ara
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Logo and Intro */}
                <div className="flex flex-col items-center text-center mt-2 mb-6">
                  <img 
                    alt="Esnaaf Logo" 
                    className="h-14 w-auto object-contain select-none mb-3" 
                    src="/logo.png" 
                  />
              <h3 className="font-headline-lg text-slate-900 text-lg md:text-xl font-bold tracking-tight">
                {otpSent ? "Doğrulama Kodunu Girin" : "Esnaaf'a Giriş Yap"}
              </h3>
              <p className="font-body-md text-xs text-slate-500 mt-1 max-w-[280px]">
                {otpSent 
                  ? `${loginPhone} numaralı telefona gelen 6 haneli kodu yazın.` 
                  : "Mahallendeki güvenilir hizmet verenlere anında ulaşın."}
              </p>
            </div>

            {loginError && (
              <div className="bg-red-50 text-red-600 border border-red-150 rounded-2xl px-4 py-3 text-xs font-semibold flex items-start gap-2.5 mb-4">
                <svg className="w-4 h-4 shrink-0 text-red-500 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{loginError}</span>
              </div>
            )}

            {/* Form */}
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Telefon Numarası
                  </label>
                  <div className="relative flex items-center bg-slate-50 border border-slate-200/80 rounded-2xl p-3 pl-4 focus-within:bg-white focus-within:border-slate-400 focus-within:ring-4 focus-within:ring-slate-100 transition-all duration-300">
                    <span className="text-slate-400 font-semibold text-sm shrink-0 mr-2 select-none">🇹🇷 +90</span>
                    <input 
                      type="tel"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      placeholder="555 123 4567"
                      className="bg-transparent border-none outline-none w-full text-slate-900 font-semibold text-sm focus:ring-0 p-0"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-[#c8f252] border border-[#c8f252] font-button-text text-sm py-4 rounded-2xl transition-all font-bold cursor-pointer flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {loginLoading ? (
                    <div className="w-5 h-5 border-2 border-t-transparent border-[#c8f252] rounded-full animate-spin" />
                  ) : (
                    "Doğrulama Kodu Gönder"
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Doğrulama Kodu (OTP)
                  </label>
                  <input 
                    type="text"
                    maxLength={6}
                    value={loginOtp}
                    onChange={(e) => setLoginOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center tracking-widest text-lg font-bold text-slate-900 focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all"
                    required
                  />
                </div>

                {devOtp && (
                  <div 
                    onClick={() => setLoginOtp(devOtp)}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-150 rounded-2xl px-4 py-3 text-xs cursor-pointer transition-colors flex justify-between items-center group font-medium"
                  >
                    <span>Test Kodu: <strong className="font-extrabold">{devOtp}</strong></span>
                    <span className="text-[10px] text-amber-600 group-hover:text-amber-700 font-bold underline">Kodu Doldur</span>
                  </div>
                )}

                {/* Default fallback helper for developers */}
                {!devOtp && (
                  <div 
                    onClick={() => setLoginOtp("123456")}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-650 border border-slate-200 rounded-2xl px-4 py-3 text-[11px] cursor-pointer transition-colors flex justify-between items-center group font-medium"
                  >
                    <span>Geliştirici Girişi için kod: <strong className="font-extrabold">123456</strong></span>
                    <span className="text-[10px] text-slate-500 group-hover:text-slate-650 font-bold underline">Kodu Doldur</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setLoginOtp("");
                      setLoginError("");
                      setDevOtp(null);
                    }}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-4 rounded-2xl transition-all cursor-pointer text-center"
                  >
                    Geri
                  </button>
                  <button
                    type="submit"
                    disabled={loginLoading || loginOtp.length !== 6}
                    className="w-2/3 bg-slate-900 hover:bg-slate-800 text-[#c8f252] border border-[#c8f252] font-button-text text-sm py-4 rounded-2xl transition-all font-bold cursor-pointer flex justify-center items-center gap-2 disabled:opacity-50"
                  >
                    {loginLoading ? (
                      <div className="w-5 h-5 border-2 border-t-transparent border-[#c8f252] rounded-full animate-spin" />
                    ) : (
                      "Giriş Yap"
                    )}
                  </button>
                </div>
              </form>
            )}
              </>
            )}
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
            from { transform: scale(0.97) translateY(15px); opacity: 0; }
            to { transform: scale(1) translateY(0); opacity: 1; }
          }
        }
        .animate-fade-in {
          animation: fadeIn 180ms ease-out forwards;
        }
        .animate-slide-up {
          animation: slideUp 240ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
