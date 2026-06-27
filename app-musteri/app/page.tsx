"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
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

  // Handle pSEO presets redirect funnel
  useEffect(() => {
    if (typeof window !== "undefined") {
      const presetStr = sessionStorage.getItem("esnaaf_seo_preset");
      if (presetStr) {
        try {
          const preset = JSON.parse(presetStr);
          sessionStorage.removeItem("esnaaf_seo_preset");
          if (preset && preset.categoryName) {
            let initialMsg = preset.categoryName;
            if (preset.district) {
              initialMsg = `${preset.district} bölgesinde ${preset.categoryName.toLowerCase()} hizmeti almak istiyorum.`;
            } else if (preset.city) {
              initialMsg = `${preset.city} genelinde ${preset.categoryName.toLowerCase()} hizmeti almak istiyorum.`;
            } else {
              initialMsg = `${preset.categoryName} hizmeti almak istiyorum.`;
            }
            handleStartChat(initialMsg);
          }
        } catch (e) {
          console.error("Failed to parse esnaaf_seo_preset", e);
        }
      }
    }
  }, []);

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
    console.log("[handleStartChat] Starting chat with message:", messageText);
    if (!messageText.trim()) return;
    try {
      const sessId = startNewSession();
      console.log("[handleStartChat] New session started successfully, ID:", sessId);
    } catch (e) {
      console.error("[handleStartChat] startNewSession failed:", e);
    }
    setChatInitialMessage(messageText);
    setActiveView("chat");
    console.log("[handleStartChat] activeView set to chat");
  };

  const handleSend = () => {
    handleStartChat(inputValue);
  };

  // Show premium alert instead of standard browser alert
  const triggerNotification = (message: string) => {
    setNotification(message);
  };

  // Check if logged in on mount
  useEffect(() => {
    if (isLoggedIn()) {
      setIsClientLoggedIn(true);
      setClientUser(getAuthUser());
      setActiveView("dashboard");
    }
  }, []);

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
          logout();
          setIsClientLoggedIn(false);
          setClientUser(null);
          setActiveView("home");
          triggerNotification("Çıkış yapıldı.");
        }}
        onStartChat={(initialMessage?: string) => {
          setChatInitialMessage(initialMessage || "");
          setActiveView("chat");
        }}
      />
    );
  }

  return (
    <div className="bg-background text-on-background selection:bg-primary/20 font-body antialiased overflow-x-hidden min-h-screen pb-16 md:pb-0 relative">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-24 right-4 z-[99] bg-white/95 text-slate-900 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl border border-slate-150/80 flex items-center gap-3 animate-slide-up max-w-sm">
          <span className="material-symbols-outlined text-[#719600]">verified</span>
          <span className="font-semibold text-sm text-slate-700">{notification}</span>
        </div>
      )}

      {/* 🧭 Header (TopNavBar) */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-md bg-white/70 border-b border-slate-100 h-20 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
        <div className="flex justify-between items-center px-4 md:px-6 max-w-7xl mx-auto h-full w-full">
          <div className="flex items-center gap-12">
            <a href="/" className="flex items-center">
              <div className="h-16 w-[180px] overflow-hidden flex items-center justify-center relative cursor-pointer">
                <img
                  alt="Esnaaf Logo"
                  className="absolute h-[180px] w-auto max-w-none object-contain"
                  src="/logo.png"
                />
              </div>
            </a>
            <nav className="hidden md:flex gap-8">
              <a className="text-slate-650 hover:text-slate-900 transition-colors font-bold text-xs uppercase tracking-wider" href="#how-it-works">Nasıl Çalışır</a>
              <a className="text-slate-650 hover:text-slate-900 transition-colors font-bold text-xs uppercase tracking-wider" href="#trend-services">Hizmetler</a>
              <a className="text-slate-650 hover:text-slate-900 transition-colors font-bold text-xs uppercase tracking-wider" href="#why-us">Neden Esnaaf</a>
              <a className="text-slate-650 hover:text-slate-900 transition-colors font-bold text-xs uppercase tracking-wider" href="#app-download">Uygulamamız</a>
            </nav>
          </div>
          
          <div className="flex items-center gap-3">
            {isClientLoggedIn ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveView("dashboard")}
                  className="bg-[#c8f252] hover:bg-[#b5e639] text-slate-950 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-md shadow-[#c8f252]/10"
                >
                  Panelim
                </button>
                <button
                  onClick={() => {
                    logout();
                    setIsClientLoggedIn(false);
                    setClientUser(null);
                    setActiveView("home");
                    triggerNotification("Çıkış yapıldı.");
                  }}
                  className="text-slate-700 hover:text-slate-900 border border-slate-200 px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer bg-slate-50"
                >
                  Çıkış
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="text-slate-700 hover:text-slate-900 border border-slate-200 px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer bg-slate-50"
                >
                  Giriş Yap
                </button>
                <button
                  onClick={handleHizmetVerRedirect}
                  className="bg-[#c8f252] hover:bg-[#b5e639] text-slate-950 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-md shadow-[#c8f252]/10"
                >
                  Hizmet Ver
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 🚀 Hero Section */}
      <section className="relative min-h-[85vh] flex flex-col justify-center items-center pt-24 pb-8 overflow-hidden bg-[#ffffff] text-slate-900 text-center tech-grid">
        {/* Glow ambient meshes */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full mesh-glow-green pointer-events-none z-0 transform -translate-x-1/2 -translate-y-1/2 opacity-60"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full mesh-glow-indigo pointer-events-none z-0 transform translate-x-1/2 translate-y-1/2 opacity-40"></div>
        <div className="absolute top-1/2 left-1/2 w-[700px] h-[700px] rounded-full mesh-glow-purple pointer-events-none z-0 transform -translate-x-1/2 -translate-y-1/2 opacity-30"></div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 w-full flex flex-col items-center space-y-6">
          {/* AI Subtitle Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-550/10 border border-slate-200 backdrop-blur-sm text-[10px] md:text-xs font-black tracking-widest text-slate-600 uppercase mb-2 animate-fade-in shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#719600] animate-pulse"></span>
            Yapay Zeka Destekli Mahalle Esnaf Ağı
          </div>

          <div className="space-y-4">
            <h1 className="font-extrabold text-4xl md:text-6xl lg:text-7xl leading-[1.08] text-slate-900 tracking-tighter max-w-4xl mx-auto">
              Aynı Mahalleyi Paylaştığın <br />
              En İyi <span className="bg-gradient-to-r from-[#719600] to-[#88b500] bg-clip-text text-transparent">5 Esnaftan</span> Teklif Al
            </h1>
            <p className="font-body text-base md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
              İhtiyacınızı AI asistanımıza anlatın, mahallenizdeki en iyi esnaf ve hizmet verenleri saniyeler içinde tespit edip en uygun teklifleri kapınıza getirelim.
            </p>
          </div>

          {/* AI Search Box */}
          <div className="w-full max-w-2xl glass-input rounded-[24px] p-2 pl-5 shadow-[0_15px_35px_rgba(0,0,0,0.04)] focus-within:ring-4 focus-within:ring-[#c8f252]/20 transition-all duration-300 mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-slate-400 shrink-0 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <input
                ref={searchInputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                className="bg-transparent border-none outline-none w-full text-slate-800 font-semibold text-sm placeholder-slate-450 focus:ring-0 p-0"
                placeholder="Hangi hizmete ihtiyacınız var? (Örn: Ev temizliği, boya badana...)"
                type="text"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="bg-[#c8f252] hover:bg-[#b5e639] text-slate-950 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shrink-0 active:scale-95 disabled:opacity-40 cursor-pointer shadow-md"
              >
                Ara & Başla
              </button>
            </div>
          </div>

          {/* Popular services list */}
          <div className="flex flex-wrap justify-center items-center gap-2.5 text-xs text-slate-550 font-semibold z-10 pt-2">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Popüler:</span>
            {["ev temizliği", "boya badana", "nakliyat", "su tesisatı"].map((pop, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectCategory(pop.charAt(0).toUpperCase() + pop.slice(1))}
                className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200 hover:border-[#c8f252] hover:bg-[#c8f252]/5 text-slate-655 hover:text-[#719600] transition-all cursor-pointer font-bold tracking-tight shadow-xs"
              >
                {pop}
              </button>
            ))}
          </div>

          {/* Down Arrow Indicator & App Downloads */}
          <div className="pt-8 flex flex-col items-center gap-6">
            <a href="#categories-section" className="w-11 h-11 rounded-full bg-white border border-slate-200 hover:border-[#c8f252] hover:bg-[#c8f252]/5 flex items-center justify-center text-slate-650 hover:text-slate-900 shadow-sm transition-colors cursor-pointer animate-bounce">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
              </svg>
            </a>

            {/* App Store & Google Play Download Badges */}
            <div className="flex gap-4 items-center justify-center pt-2 select-none z-10">
              <a href="#" className="hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer h-[56px] rounded-2xl overflow-hidden">
                <img src="/app-store.jpg" alt="App Store'dan İndirin" className="h-full w-auto object-contain" />
              </a>
              <a href="#" className="hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer h-[56px] rounded-2xl overflow-hidden">
                <img src="/google-play.jpg" alt="Google Play'den Alın" className="h-full w-auto object-contain" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 🧭 Categories Section */}
      <section id="categories-section" className="py-10 bg-slate-50/40 border-y border-slate-100 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 w-full">
            {[
              { name: "Ev Temizliği", icon: "cleaning_services", category: "Ev Temizliği" },
              { name: "Boya Badana", icon: "format_paint", category: "Boya Badana" },
              { name: "Nakliyat", icon: "local_shipping", category: "Nakliyat" },
              { name: "Su Tesisatı", icon: "plumbing", category: "Su Tesisatı" },
              { name: "Elektrik", icon: "electrical_services", category: "Elektrik Tesisatı" },
              { name: "Ev Tadilat", icon: "construction", category: "Ev Tadilat" },
              { name: "Kombi & Klima", icon: "ac_unit", category: "Kombi & Klima Bakımı" },
              { name: "Diğer", icon: "more_horiz", category: "Hizmet" }
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectCategory(item.category === "Hizmet" ? "Hizmet" : item.category)}
                className="flex flex-col items-center justify-center p-5 rounded-[24px] bg-[#c8f252]/10 border border-[#c8f252]/60 shadow-xs hover:border-slate-200 hover:bg-white transition-all duration-300 group cursor-pointer hover:-translate-y-1 hover:shadow-sm"
              >
                <div className="w-12 h-12 rounded-full bg-[#c8f252] text-slate-950 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center mb-3 shadow-xs transition-all duration-300">
                  <span className="material-symbols-outlined text-lg font-bold">{item.icon}</span>
                </div>
                <span className="font-bold text-xs text-slate-900 group-hover:text-slate-650 transition-colors tracking-tight text-center">
                  {item.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 📊 Haftanın Trend Hizmetleri Section */}
      <section id="trend-services" className="py-12 max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-4">
          <span className="text-xs font-bold text-[#719600] bg-[#c8f252]/10 px-3.5 py-1.5 rounded-full uppercase tracking-wider border border-[#c8f252]/20">Popüler Listeler</span>
          <h2 className="font-extrabold text-3xl md:text-4xl text-slate-900 tracking-tight">Haftanın Trend Hizmetleri</h2>
          <p className="font-body text-slate-500 text-sm">Mahallenizde en çok aranan ve en hızlı teklif toplayan popüler hizmetler</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[
            { name: "Ev Temizliği", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=400&auto=format&fit=crop", rating: "4.8", count: "9.861", commentCount: "8.875" },
            { name: "Boya Badana", image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=400&auto=format&fit=crop", rating: "4.9", count: "5.546", commentCount: "4.920" },
            { name: "Nakliyat", image: "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?q=80&w=400&auto=format&fit=crop", rating: "4.7", count: "2.976", commentCount: "2.540" },
            { name: "Su Tesisatı", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop", rating: "4.8", count: "4.120", commentCount: "3.680" },
            { name: "Elektrik Tesisatı", image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?q=80&w=400&auto=format&fit=crop", rating: "4.9", count: "3.245", commentCount: "2.890" },
            { name: "Ev Tadilat", image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=400&auto=format&fit=crop", rating: "4.8", count: "1.890", commentCount: "1.520" },
            { name: "Kombi & Klima Bakımı", image: "https://images.unsplash.com/photo-1647329797478-52c45b06856b?q=80&w=400&auto=format&fit=crop", rating: "4.7", count: "2.100", commentCount: "1.840" },
            { name: "Halı & Koltuk Yıkama", image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?q=80&w=400&auto=format&fit=crop", rating: "4.6", count: "1.540", commentCount: "1.230" },
          ].map((srv, idx) => (
            <div key={idx} className="bg-white border border-[#c8f252]/60 rounded-[32px] overflow-hidden flex flex-col justify-between shadow-[0_12px_35px_rgba(0,0,0,0.05)] -translate-y-1 transition-all duration-300 group relative hover:shadow-xs hover:border-slate-150/60 hover:translate-y-0">
              <div className="relative h-48 w-full overflow-hidden shrink-0">
                <img
                  alt={srv.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  src={srv.image}
                />
                
                {/* Branded esnaaf marker pin badge - positioned flush at top-left corner (top-0 left-0) */}
                <img
                  src="/logo-icon.png"
                  alt="esnaaf"
                  className="absolute top-0 left-0 w-18 h-18 object-contain select-none filter drop-shadow-md"
                />
              </div>
              
              <div className="p-5 flex flex-col justify-between flex-grow gap-4.5">
                <div className="space-y-2">
                  <h3 className="font-extrabold text-[#719600] text-[15px] group-hover:opacity-90 transition-opacity tracking-tight">{srv.name}</h3>
                  
                  {/* Rating / Counts row */}
                  <div className="flex justify-between items-center w-full">
                    {/* Left: Professional Count */}
                    <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[10px]">
                      <span className="material-symbols-outlined text-[13px] shrink-0 text-slate-400">group</span>
                      <span>{srv.count} Profesyonel</span>
                    </div>

                    {/* Right: Rating Box & Stars */}
                    <div className="flex items-center gap-1.5">
                      <div className="bg-[#c8f252] text-slate-950 font-black text-[10px] px-1.5 py-1 rounded-md shadow-xs shrink-0">
                        {srv.rating}
                      </div>
                      <div className="flex flex-col justify-center leading-none">
                        <div className="flex items-center text-amber-500 select-none">
                          <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                          <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                          <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                          <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                          <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                        </div>
                        <span className="text-[8px] text-slate-400 font-bold mt-0.5 tracking-tight shrink-0 whitespace-nowrap">
                          ({srv.commentCount} Onaylı Yorum)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectCategory(srv.name)}
                  className="w-full bg-[#181d20] hover:bg-[#719600] text-white font-extrabold text-xs py-3.5 rounded-xl transition-all cursor-pointer text-center active:scale-98 shadow-sm"
                >
                  Teklif Al
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3 Easy Steps Section */}
      <section id="how-it-works" className="py-12 bg-slate-50/40 border-t border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-6 relative">
          <div className="text-center mb-10 space-y-4">
            <span className="text-xs font-bold text-[#719600] bg-[#c8f252]/10 px-3.5 py-1.5 rounded-full uppercase tracking-wider border border-[#c8f252]/20">Kolay Süreç</span>
            <h2 className="font-extrabold text-3xl md:text-4xl text-slate-900 tracking-tight">3 Kolay Adımla Komşu Esnaftan Hizmet Al</h2>
            <p className="font-body text-slate-500 text-sm">Zaman kaybetmeden, yorulmadan, komşu hizmet veren ve esnaflarla buluşun</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center space-y-6 bg-white border border-slate-150/60 p-6 rounded-3xl hover:border-[#c8f252]/30 transition-all duration-300 hover:-translate-y-1 shadow-xs hover:shadow-md">
              <div className="w-full h-64 overflow-hidden rounded-2xl bg-slate-50 relative flex items-center justify-center p-4">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAoCt95JwkhE8yRw-lN5LVufHeysmo_Tx4g422kygjbcknm6iYM2kog6FNP9p10ilUdzet_-eEK_SmQDdAJ4gn7R4z7vOckZxEvP5fDhe73okFxbdqMqafgfFiwBq84_RWdHVsTKUPj6lHCy_i2OCuU-KzCgL5dlgPgAL2mQHnSy1z-BwbsNDJL0c53IiOCBJoqeiQFxWm1h3qLDsKL9RIYLwZgUVv0ffvyVMhOHpejkMcHbgGx2Vf1398QJOMtLE3M0mpzQPn6Tewi" alt="Adım 1" className="max-h-full max-w-full object-contain" />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-black text-[#719600] uppercase tracking-wider block">Adım 1</span>
                <h3 className="font-black text-slate-900 text-lg tracking-tight">İhtiyacını AI Asistanına Anlat</h3>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-semibold">
                  Akıllı asistanımızla birkaç basit soruda ihtiyacını belirle, sistem arka planda çalışsın.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center space-y-6 bg-white border border-slate-150/60 p-6 rounded-3xl hover:border-[#c8f252]/30 transition-all duration-300 hover:-translate-y-1 shadow-xs hover:shadow-md">
              <div className="w-full h-64 overflow-hidden rounded-2xl bg-slate-50 relative flex items-center justify-center p-4">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuASvamRiNA9s2c-7R_M4F9BcxAWPUJLHbzE9o0YDOl8-g4r_XrZNxXGzMpr2AIxNg4xok-xwAz4fH7iHXQLgdfSr8ChKPzehv5XV7ogXSlf_LU6L2NpueS6GmecAa-0GEy3bSmsq6GM1r_rH87VOGMbWoS2CpBy5niUiiLGBKlCbkaSu1X5GrMh4uPT5-qVApMRhtU4x5GTz1cWfZK6loc4sGGiW4jmQu47GG5Fxnml_3U0SYOCTDRiyb51fzdbrUHABuUzNHCyhYyc" alt="Adım 2" className="max-h-full max-w-full object-contain" />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-black text-[#719600] uppercase tracking-wider block">Adım 2</span>
                <h3 className="font-black text-slate-900 text-lg tracking-tight">Teklifleri Topla</h3>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-semibold">
                  Mahallendeki onaylanmış hizmet veren ve esnaflardan gelen teklifleri ve fiyatları gör.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center space-y-6 bg-white border border-slate-150/60 p-6 rounded-3xl hover:border-[#c8f252]/30 transition-all duration-300 hover:-translate-y-1 shadow-xs hover:shadow-md">
              <div className="w-full h-64 overflow-hidden rounded-2xl bg-slate-50 relative flex items-center justify-center p-4">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuArsDiQBcW0vdCtjUNBiLOoqy-em53AITIxtj9_DgZ84-iqVWZM2uIOgrqs4w5NCPgEbSZ0eiijGGSea493LmQNUFZae3zifPcaskbAS2Zq24mS1xd5vqXCZP_Cd0O5xNqqLenI9K1yT4e3QuBddL6sNTZDe4Z51sHyRuDq1J6wXjMAxUndCUpbG1LfSHPHQMDERGPtdBd1RQvUU3lUCALmRC0F5mwoe2BGwMFXmkWW8Ai5iZId15lE7t_JIftDQYBlPX8UFGd1G34J" alt="Adım 3" className="max-h-full max-w-full object-contain" />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-black text-[#719600] uppercase tracking-wider block">Adım 3</span>
                <h3 className="font-black text-slate-900 text-lg tracking-tight">Karşılaştır ve Seç</h3>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-semibold">
                  Hizmet veren profillerini, referansları inceleyin; fiyatları karşılaştırıp en uygununu seçin.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Neden Biz Section */}
      <section id="why-us" className="py-12 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-4">
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3.5 py-1.5 rounded-full uppercase tracking-wider border border-slate-200/50">Neden Esnaaf</span>
            <h2 className="font-extrabold text-3xl md:text-4xl text-slate-900 tracking-tight">Uzağa Arama, Mahallendeki Esnaflara Hızlıca Ulaş</h2>
            <p className="font-body text-slate-500 text-sm">Ev işlerini stresli bir yükten, mahalle esnafıyla keyifli bir işbirliğine dönüştürüyoruz.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-150/55 hover:border-[#c8f252] hover:bg-[#c8f252]/5 transition-all duration-300 group text-center flex flex-col items-center hover:-translate-y-1 hover:shadow-xs">
              <div className="w-14 h-14 rounded-full bg-slate-950 text-[#c8f252] group-hover:bg-[#c8f252] group-hover:text-slate-950 flex items-center justify-center mb-6 shadow-xs transition-all duration-300">
                <span className="material-symbols-outlined text-2xl font-bold">verified_user</span>
              </div>
              <h3 className="font-black text-slate-900 text-lg mb-3 tracking-tight">Güvenli Hizmet</h3>
              <p className="font-body text-xs text-slate-500 leading-relaxed font-semibold">Gerçek mahalle sakinlerinin yorumleriyle hizmet kalitesini görün, güvenle seçin.</p>
            </div>
            
            <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-150/55 hover:border-[#c8f252] hover:bg-[#c8f252]/5 transition-all duration-300 group text-center flex flex-col items-center hover:-translate-y-1 hover:shadow-xs">
              <div className="w-14 h-14 rounded-full bg-slate-950 text-[#c8f252] group-hover:bg-[#c8f252] group-hover:text-slate-950 flex items-center justify-center mb-6 shadow-xs transition-all duration-300">
                <span className="material-symbols-outlined text-2xl font-bold">timer</span>
              </div>
              <h3 className="font-black text-slate-900 text-lg mb-3 tracking-tight">Zaman Kazan</h3>
              <p className="font-body text-xs text-slate-500 leading-relaxed font-semibold">Dükkan dükkan gezmeyin. 1 dakikada talebi gönderin, teklifler cebinize gelsin.</p>
            </div>
            
            <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-150/55 hover:border-[#c8f252] hover:bg-[#c8f252]/5 transition-all duration-300 group text-center flex flex-col items-center hover:-translate-y-1 hover:shadow-xs">
              <div className="w-14 h-14 rounded-full bg-slate-950 text-[#c8f252] group-hover:bg-[#c8f252] group-hover:text-slate-950 flex items-center justify-center mb-6 shadow-xs transition-all duration-300">
                <span className="material-symbols-outlined text-2xl font-bold">touch_app</span>
              </div>
              <h3 className="font-black text-slate-900 text-lg mb-3 tracking-tight">Kolay Kullanım</h3>
              <p className="font-body text-xs text-slate-500 leading-relaxed font-semibold">Pratik chat asistanımızla detayları birkaç soruda belirleyin, zamanınız size kalsın.</p>
            </div>
            
            <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-150/55 hover:border-[#c8f252] hover:bg-[#c8f252]/5 transition-all duration-300 group text-center flex flex-col items-center hover:-translate-y-1 hover:shadow-xs">
              <div className="w-14 h-14 rounded-full bg-slate-950 text-[#c8f252] group-hover:bg-[#c8f252] group-hover:text-slate-950 flex items-center justify-center mb-6 shadow-xs transition-all duration-300">
                <span className="material-symbols-outlined text-2xl font-bold">security</span>
              </div>
              <h3 className="font-black text-slate-900 text-lg mb-3 tracking-tight">Garantide Ol</h3>
              <p className="font-body text-xs text-slate-500 leading-relaxed font-semibold">Esnaaf üzerinden aldığınız tüm işler platformumuzun koruması altındadır.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Provider Join CTA Section */}
      <section className="py-12 bg-white border-t border-slate-100 px-4 md:px-6">
        <div className="max-w-7xl mx-auto bg-slate-50 border border-slate-150/50 rounded-[2rem] overflow-hidden grid md:grid-cols-2 items-center">
          <div className="h-96 md:h-[450px] relative">
            <Image
              alt="Esnaaf Provider"
              className="object-cover"
              src="/esnaaf_van_driver.webp"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
          <div className="p-8 md:p-16 space-y-6">
            <span className="text-xs font-extrabold text-[#719600] uppercase tracking-widest block">Komşu Esnaf Olarak Platformumuza Katıl</span>
            <h2 className="font-bold text-3xl text-slate-900 leading-tight">Müşterilere Kolayca Ulaşın ve İşinizi Büyütün</h2>
            <p className="font-body text-sm text-slate-500 leading-relaxed">
              İşinizi büyütmek, mahalledeki yeni iş fırsatlarına anında ulaşmak ve referans edinmek için hemen aramıza katılın.
            </p>
            <button
              onClick={handleHizmetVerRedirect}
              className="bg-slate-950 hover:bg-slate-850 text-white px-8 py-4 rounded-xl font-bold transition-all active:scale-95 cursor-pointer shadow-md"
            >
              Aramıza Katıl / İşe Başla
            </button>
          </div>
        </div>
      </section>

      {/* Category Link List 1 */}
      <section className="py-10 bg-white border-t border-slate-100 px-4 md:px-6">
        <div className="max-w-7xl mx-auto text-center space-y-8">
          <h3 className="font-bold text-xl text-slate-900">
            Mahallendeki En Çok Tercih Edilen <span className="text-[#719600]">Esnaflar ve Hizmetler :</span>
          </h3>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 max-w-4xl mx-auto text-sm text-slate-500 font-semibold">
            {[
              { name: "Ev Temizliği", slug: "ev-temizligi" },
              { name: "Boya Badana", slug: "boya-badana" },
              { name: "Evden Eve Nakliyat", slug: "nakliyat" },
              { name: "Su Tesisatı", slug: "su-tesisati" },
              { name: "Elektrik Tesisatı", slug: "elektrik-tesisati" },
              { name: "Ev Tadilat", slug: "ev-tadilat" },
              { name: "Halı & Koltuk Yıkama", slug: "hali-koltuk-yikama" },
              { name: "Kombi & Klima Bakımı", slug: "kombi-klima" },
              { name: "Mantolama & Dış Cephe", slug: "mantolama-discephe" },
              { name: "Marangoz & Mobilya", slug: "marangoz-mobilya" },
              { name: "Özel Ders", slug: "ozel-ders" },
              { name: "Ofis Temizliği", slug: "ofis-temizligi" }
            ].map((link, idx) => (
              <Link
                key={idx}
                href={`/hizmet/${link.slug}`}
                className="hover:text-slate-900 transition-colors hover:underline"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Cleaners Banner Section */}
      <section className="py-8 bg-white px-4 md:px-6">
        <div className="max-w-7xl mx-auto overflow-hidden rounded-[2rem] bg-slate-900 text-white grid md:grid-cols-12 items-center shadow-lg">
          <div className="md:col-span-7 p-8 md:p-16 space-y-6">
            <h2 className="font-bold text-3xl md:text-4xl text-white tracking-tight">
              Komşu Esnaflarla Hayatını Kolaylaştır
            </h2>
            <p className="font-body text-slate-350 text-sm leading-relaxed max-w-xl">
              Mahallendeki güvenilir hizmet veren ve esnafları bulmanın en konforlu yolu. Güvenli ödeme, kaliteli hizmet ve Esnaaf koruma garantisiyle hemen başlayın.
            </p>
            <button
              onClick={() => handleStartChat("Merhaba, hizmet almak istiyorum.")}
              className="bg-[#c8f252] hover:bg-[#b5e639] text-slate-955 px-8 py-4 rounded-xl font-bold transition-all active:scale-95 cursor-pointer shadow-md"
            >
              Fiyat Hesapla / Başla
            </button>
          </div>
          <div className="md:col-span-5 h-80 md:h-[400px] relative">
            <Image
              alt="Esnaaf Cleaners"
              className="object-cover"
              src="/esnaaf_cleaners.webp"
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
            />
          </div>
        </div>
      </section>

      {/* Category Link List 2 */}
      <section className="py-10 bg-white px-4 md:px-6">
        <div className="max-w-7xl mx-auto text-center space-y-8">
          <h3 className="font-bold text-xl text-slate-900">
            En Çok Tercih Edilen İllerde <span className="text-[#719600]">Esnaflar ve Hizmetler :</span>
          </h3>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 max-w-4xl mx-auto text-sm text-slate-500 font-semibold">
            {[
              { name: "İstanbul Ev Temizliği", slug: "istanbul-ev-temizligi" },
              { name: "İstanbul Boya Badana", slug: "istanbul-boya-badana" },
              { name: "Kadıköy Ev Temizliği", slug: "kadikoy-ev-temizligi" },
              { name: "Şişli Ev Temizliği", slug: "sisli-ev-temizligi" },
              { name: "Ankara Boya Badana", slug: "ankara-boya-badana" },
              { name: "Ankara Nakliyat", slug: "ankara-nakliyat" },
              { name: "İzmir Su Tesisatı", slug: "izmir-su-tesisati" },
              { name: "İzmir Ev Temizliği", slug: "izmir-ev-temizligi" },
              { name: "Adana Boya Badana", slug: "adana-boya-badana" },
              { name: "Adana Elektrik Tesisatı", slug: "adana-elektrik-tesisati" }
            ].map((link, idx) => (
              <Link
                key={idx}
                href={`/hizmet/${link.slug}`}
                className="hover:text-slate-900 transition-colors hover:underline"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Guarantee Banner Section */}
      <section className="py-8 bg-white px-4 md:px-6">
        <div className="max-w-7xl mx-auto overflow-hidden rounded-[2rem] bg-slate-50 border border-slate-150/50 grid md:grid-cols-12 items-center shadow-sm">
          <div className="md:col-span-6 h-80 md:h-[400px] relative">
            <img
              alt="Esnaaf Guarantee"
              className="w-full h-full object-cover"
              src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop"
            />
          </div>
          <div className="md:col-span-6 p-8 md:p-16 bg-[#c8f252]/10 h-full flex flex-col justify-center space-y-6">
            <div className="w-14 h-14 rounded-full bg-[#c8f252] flex items-center justify-center text-slate-950 shadow-md">
              <span className="material-symbols-outlined text-2xl font-bold">verified</span>
            </div>
            <h2 className="font-bold text-3xl text-slate-900 leading-tight">
              Mahallede Komşu Esnaf Garantisi
            </h2>
            <p className="font-body text-sm text-slate-600 leading-relaxed">
              Esnaaf üzerinden aldığınız tüm işler platformumuzun koruması altındadır. İletişimden iş teslimine, her anınız güvence altında.
            </p>
            <button
              onClick={() => handleStartChat("Merhaba, esnaf garantisi hakkında bilgi almak istiyorum.")}
              className="bg-slate-950 hover:bg-slate-850 text-white px-8 py-4 rounded-xl font-bold transition-all active:scale-95 cursor-pointer shadow-md self-start"
            >
              Detayları Öğren
            </button>
          </div>
        </div>
      </section>

      {/* 📱 Mobile App Download Banner */}
      <section id="app-download" className="py-12 bg-surface-container-low relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl z-0"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl z-0"></div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-8">
              <h2 className="font-bold text-4xl md:text-5xl text-on-surface leading-tight tracking-tight">
                Esnaaf uygulamasını hemen indir, mahallede işlerini bitir!
              </h2>
              <p className="font-body text-lg text-on-surface-variant max-w-xl leading-relaxed">
                Esnaaf uygulamasını indir, ihtiyacın olan hizmete saniyeler içinde ulaş. Teklifleri anında gör, uzmanlarla kolayca mesajlaş.
              </p>
              <div className="flex flex-wrap gap-4">
                <a className="hover:scale-105 transition-transform duration-300" href="#">
                  <img alt="App Store" className="h-14" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGEn6eQKbNLCQu5stuWa-B3Ri9MXInTaXXGCxFXbfRA-A2Oby215RWE7hW6Ze_exTF70L6QRUKEvqOFACsNOZyrhhEmJH5ejzM18JJLOhUb3llsLXydwCpQzl24KNA4nzdnd60_uv20sTGw3vLIwFFR0pi4Dvh_0gI31-JTMabV8RAD1vjbvdfRqT8xJ5JaFPlZDKUErH00Cn3P-GKrlus1judOD2dA2HvGrdYAvrhOTuXIM6dfZBTKmgHNr2OPAsv8W5qeMFY6ILX" />
                </a>
                <a className="hover:scale-105 transition-transform duration-300" href="#">
                  <img alt="Google Play" className="h-14" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCAExiul5BxL4el99tC-ZNqup02LQLpRNITrykCVStLfemh8HSGlPLTSmZAMLf7TVi54ShM9ga9y7rMXpqy1tUOkyuJ2M3JnjzU5hJ12Z_sr123wZkjRjCAyaD1SeifJFCZSY_yoDFRxrZZhvOtsYChHpn62XiAc8bDO13fQVQvQruDwlLVWQIVrpnarjzSXGSCJ4jCm-jx9yK0F2yWo8FgoCRkSV16RKkhZIFyFc6Cbh99aYSpn4psmcTho3lednPmdA0_MEX1siFu" />
                </a>
              </div>
            </div>
            <div className="flex-1 flex justify-center md:justify-end">
              <div className="relative w-full max-w-md rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="mt-8 rounded-2xl overflow-hidden shadow-2xl border border-outline-variant/30 bg-white p-2">
                  <img alt="Esnaaf App Interface" className="w-full h-auto rounded-xl" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRABpQqqodNck5bA6D8cfyAw3v1fzULbILofVeKvHmb80398nyHGcehqh91codwKbasdYR8cPIRjc-F7YPrpY_4jRSXRMgZWS_HL8xIn8McdBTSYPzhK1hhKTpfyxueGWcaatP4ZvZZRPCIBoZFnarTyHYaaP4EWc2c5firTC3ANLVJTgaBmDug8_PmaO5cbEEtGaNIQMGsRk_74LklFA9mmoj13tf3S9M8EHQmHBJl0X9iMpHBvkNJotf0Q-NBEiSA3QlJ42Fw8sC" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant/30 py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 w-full">
          <div className="space-y-6">
            <a href="/" className="block h-16 w-[180px] overflow-hidden flex items-center justify-center relative -ml-[18px]">
              <img
                alt="Esnaaf Logo"
                className="absolute h-[180px] w-auto max-w-none object-contain"
                src="/logo.png"
              />
            </a>
            <p className="text-sm font-body text-on-surface-variant leading-relaxed">
              Türkiye'nin lider hizmet platformu. Boyadan nakliyeye, her şey için en güvenilir uzmanlar burada.
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-bold text-xs text-on-surface uppercase tracking-widest">HİZMETLER</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-on-surface-variant hover:text-primary transition-colors text-xs font-medium">Ev Boyama</Link></li>
              <li><Link href="/" className="text-on-surface-variant hover:text-primary transition-colors text-xs font-medium">Temizlik</Link></li>
              <li><Link href="/" className="text-on-surface-variant hover:text-primary transition-colors text-xs font-medium">Nakliye</Link></li>
              <li><Link href="/" className="text-on-surface-variant hover:text-primary transition-colors text-xs font-medium">Tadilat</Link></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-bold text-xs text-on-surface uppercase tracking-widest">KURUMSAL</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-on-surface-variant hover:text-primary transition-colors text-xs font-medium">Hakkımızda</Link></li>
              <li><Link href="/" className="text-on-surface-variant hover:text-primary transition-colors text-xs font-medium">Kariyer</Link></li>
              <li><Link href="/" className="text-on-surface-variant hover:text-primary transition-colors text-xs font-medium">Basın</Link></li>
              <li><Link href="/" className="text-on-surface-variant hover:text-primary transition-colors text-xs font-medium">İletişim</Link></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-bold text-xs text-on-surface uppercase tracking-widest">YARDIM</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-on-surface-variant hover:text-primary transition-colors text-xs font-medium">Gizlilik Politikası</Link></li>
              <li><Link href="/" className="text-on-surface-variant hover:text-primary transition-colors text-xs font-medium">Kullanıcı Sözleşmesi</Link></li>
              <li><Link href="/" className="text-on-surface-variant hover:text-primary transition-colors text-xs font-medium">Güvenlik</Link></li>
              <li><Link href="/" className="text-on-surface-variant hover:text-primary transition-colors text-xs font-medium">Destek Merkezi</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 mt-16 pt-8 border-t border-outline-variant/30 flex flex-col md:flex-row justify-between items-center gap-4 w-full">
          <p className="text-xs font-body text-on-surface-variant opacity-80">
            © {new Date().getFullYear()} Esnaaf Home Services. Tüm hakları saklıdır.
          </p>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-on-primary transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-sm">public</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-on-primary transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-sm">mail</span>
            </div>
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
          className={`flex flex-col items-center justify-center p-2 rounded-xl cursor-pointer ${activeTab === "marketplace" ? "text-slate-900 bg-[#c8f252]/20 font-bold" : "text-slate-400"}`}
        >
          <span className="material-symbols-outlined text-xl mb-0.5">menu</span>
          <span className="font-label-sm text-[9px] font-bold">Kategoriler</span>
        </button>
        
        <button 
          onClick={() => {
            setActiveTab("services");
            if (searchInputRef.current) searchInputRef.current.focus();
            triggerNotification("Yeni bir eşleşme başlatmak için yukarıdaki arama alanını kullanabilirsiniz.");
          }}
          className={`flex flex-col items-center justify-center p-2 rounded-xl cursor-pointer ${activeTab === "services" ? "text-slate-900 bg-[#c8f252]/20 font-bold" : "text-slate-400"}`}
        >
          <span className="material-symbols-outlined text-xl mb-0.5">bolt</span>
          <span className="font-label-sm text-[9px] font-bold">Eşleşmeler</span>
        </button>
        
        <button 
          onClick={() => {
            setActiveTab("help");
            triggerNotification("Gelen kutunuz yakında burada aktif olacaktır!");
          }}
          className={`flex flex-col items-center justify-center p-2 rounded-xl cursor-pointer ${activeTab === "help" ? "text-slate-900 bg-[#c8f252]/20 font-bold" : "text-slate-400"}`}
        >
          <span className="material-symbols-outlined text-xl mb-0.5">mail</span>
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
                <h3 className="font-bold text-sm md:text-base text-slate-900">Tüm Hizmet Kategorileri</h3>
                <p className="text-[11px] text-slate-400 font-medium">Lütfen ihtiyaç duyduğunuz iş kolunu seçin</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-800 p-1.5 rounded-full hover:bg-slate-50 cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Grid list of categories */}
            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-2 gap-2.5">
              {categories.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectCategory(cat.name)}
                  className="flex items-center gap-3.5 p-3 border border-slate-100 rounded-2xl hover:border-primary hover:bg-primary-container/20 text-left cursor-pointer active:scale-98 transition-all w-full bg-white shadow-sm"
                >
                  {renderCategoryIcon(cat.icon)}
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm text-slate-800 truncate">
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
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
            
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
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            {unregisteredUser ? (
              <div className="flex flex-col items-center text-center mt-2 space-y-6">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center border border-red-100 shadow-sm animate-pulse">
                  <span className="material-symbols-outlined text-3xl">warning</span>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-slate-900 tracking-tight">
                    Kayıt Bulunamadı
                  </h3>
                  <p className="font-body text-xs text-slate-500 max-w-[280px] leading-relaxed">
                    Telefon numaranız sistemde kayıtlı değil. Yanlış veya eksik giriş yapmış olabilirsiniz.
                  </p>
                </div>

                <div className="flex gap-3 w-full pt-2">
                  <button
                    onClick={() => setUnregisteredUser(false)}
                    className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-4 rounded-2xl transition-all cursor-pointer text-center"
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
                    className="w-1/2 bg-primary text-on-primary font-bold text-xs py-4 rounded-2xl transition-all cursor-pointer text-center"
                  >
                    Hizmet Ara
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Logo and Intro */}
                <div className="flex flex-col items-center text-center mt-2 mb-6">
                  <a href="/">
                    <img 
                      alt="Esnaaf Logo" 
                      className="h-14 w-auto object-contain select-none mb-3" 
                      src="/logo.png" 
                    />
                  </a>
                  <h3 className="font-bold text-lg md:text-xl text-slate-900 tracking-tight">
                    {otpSent ? "Doğrulama Kodunu Girin" : "Esnaaf'a Giriş Yap"}
                  </h3>
                  <p className="font-body text-xs text-slate-500 mt-1 max-w-[280px]">
                    {otpSent 
                      ? `${loginPhone} numaralı telefona gelen 6 haneli kodu yazın.` 
                      : "Mahallendeki güvenilir hizmet verenlere anında ulaşın."}
                  </p>
                </div>

                {loginError && (
                  <div className="bg-red-50 text-red-600 border border-red-150 rounded-2xl px-4 py-3 text-xs font-semibold flex items-start gap-2.5 mb-4">
                    <span className="material-symbols-outlined text-sm text-red-500 mt-0.5">error</span>
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
                      className="w-full bg-primary text-on-primary px-7 py-4 rounded-2xl text-sm transition-all font-bold cursor-pointer flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                      {loginLoading ? (
                        <div className="w-5 h-5 border-2 border-t-transparent border-slate-950 rounded-full animate-spin" />
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
                        className="w-2/3 bg-primary text-on-primary px-7 py-4 rounded-2xl text-sm transition-all font-bold cursor-pointer flex justify-center items-center gap-2 disabled:opacity-50"
                      >
                        {loginLoading ? (
                          <div className="w-5 h-5 border-2 border-t-transparent border-slate-950 rounded-full animate-spin" />
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
      <style dangerouslySetInnerHTML={{ __html: `
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
      `}} />
    </div>
  );
}
