'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  Briefcase, 
  MapPin, 
  Eye, 
  Coins, 
  CheckCircle, 
  MessageSquare, 
  ChevronRight, 
  Star, 
  ShieldCheck, 
  Send,
  X,
  FileText,
  Bell,
  HelpCircle,
  LogOut,
  Activity,
  Wifi,
  Award,
  Grid,
  Settings,
  DollarSign,
  Search,
  Filter,
  ArrowUpDown,
  BookOpen,
  CreditCard,
  Wallet,
  TrendingUp,
  Navigation
} from 'lucide-react';

export function resolveCityFromDistrict(district?: string): string {
  if (!district) return 'İstanbul';
  const adanaDistricts = [
    'çukurova', 'yüreğir', 'sarıçam', 'ceyhan', 'seyhan'
  ];
  const istanbulDistricts = [
    'kadıköy', 'şişli', 'beşiktaş', 'ümraniye', 'üsküdar', 'fatih', 'beyoğlu', 'sarıyer', 'maltepe', 'kartal', 'pendik', 'başakşehir', 'esenyurt', 'bahçelievler', 'bakırköy', 'ataşehir', 'beylikdüzü'
  ];
  const ankaraDistricts = [
    'çankaya', 'keçiören', 'yenimahalle', 'mamak', 'etimesgut', 'sincan', 'altındağ', 'gölbaşı', 'pursaklar'
  ];
  const izmirDistricts = [
    'karşıyaka', 'konak', 'bornova', 'buca', 'karabağlar', 'çiğli', 'gaziemir', 'balçova', 'narlıdere', 'güzelbahçe', 'bayraklı', 'urla'
  ];

  const dLower = district.toLowerCase().trim();
  if (adanaDistricts.includes(dLower)) return 'Adana';
  if (istanbulDistricts.includes(dLower)) return 'İstanbul';
  if (ankaraDistricts.includes(dLower)) return 'Ankara';
  if (izmirDistricts.includes(dLower)) return 'İzmir';
  return 'İstanbul';
}

const MOCK_USTAS = [
  { name: 'Mert Yılmaz (VIP)', phone: '+905320000001', rating: 4.8 },
  { name: 'Usta Ahmet (VIP)', phone: '+905320000001', rating: 4.8 },
  { name: 'Usta Mehmet (Premium - Yeni)', phone: '+905320000002', rating: 4.5 },
  { name: 'Usta Can (Standart)', phone: '+905320000003', rating: 4.2 },
  { name: 'Usta Hasan (Standart - Eski)', phone: '+905320000004', rating: 3.9 },
  { name: 'Usta Veli (Basic)', phone: '+905320000005', rating: 3.5 },
];

// Screenshot Mock Opportunities used for preview state
const MOCKUP_OPPORTUNITIES = [
  {
    id: "mockup-1",
    categoryName: "Ev Temizliği",
    subBadge: "ACİL TALEP",
    badgeType: "urgent",
    district: "Kadıköy, İstanbul",
    name: "Ayşe K.",
    details: "3+1 dairemiz için detaylı genel temizlik yaptırmak istiyoruz. Özellikle camlar ve balkon temizliği bizi...",
    viewerCount: 7,
    timeText: "2 saat önce",
    budget: "1.200 TL – 1.500 TL",
    iconType: "cleaning"
  },
  {
    id: "mockup-2",
    categoryName: "Nakliyat",
    subBadge: "PLANLI İŞ",
    badgeType: "planned",
    district: "Şişli, İstanbul",
    name: "Caner M.",
    details: "Parça eşya taşıma hizmeti aranıyor. 1 adet koltuk takımı ve yemek masası Şişli'den Beşiktaş'a...",
    viewerCount: 5,
    timeText: "5 saat önce",
    budget: "2.500 TL – 3.200 TL",
    iconType: "truck"
  },
  {
    id: "mockup-3",
    categoryName: "Tadilat",
    subBadge: "YÜKSEK ÖNCELİK",
    badgeType: "high",
    district: "Çankaya, Ankara",
    name: "Selin T.",
    details: "Banyo fayans değişimi ve lavabo montajı. Malzemeler tarafımdan alınacaktır, sadece işçilik...",
    viewerCount: 12,
    timeText: "Dün",
    budget: "4.000 TL – 6.000 TL",
    iconType: "tools"
  },
  {
    id: "mockup-4",
    categoryName: "Boya & Badana",
    subBadge: "STANDART İŞ",
    badgeType: "standard",
    district: "Nilüfer, Bursa",
    name: "Hakan B.",
    details: "Ofis boyama işlemi. Toplam 120m2 net alan. Beyaz ve gri tonlarında boyanacak. Ofis boş...",
    viewerCount: 3,
    timeText: "2 gün önce",
    budget: "8.500 TL – 12.000 TL",
    iconType: "paint"
  }
];

interface Job {
  id: string;
  categoryName: string;
  district: string;
  details: string;
  name: string;
  created_at: string;
  viewerCount: number;
}

interface Quota {
  providerId: string;
  providerName: string;
  packageName: string;
  used: number;
  limit: number | null;
  remaining: number | null;
}

export default function ProviderDashboard() {
  const [selectedPhone, setSelectedPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  
  const [quota, setQuota] = useState<Quota | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  
  // Modal states
  const [activeJob, setActiveJob] = useState<any | null>(null);
  const [offerPrice, setOfferPrice] = useState<string>('');
  const [offerMessage, setOfferMessage] = useState<string>('');
  const [submittingOffer, setSubmittingOffer] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Helper to add system log messages in the console log panel
  const addLog = (msg: string) => {
    setLogMessages((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);
  };

  // Simulate login
  const handleSimulatedLogin = async (phone: string) => {
    if (!phone) return;
    setLoading(true);
    addLog(`Simüle giriş başlatılıyor: ${phone}`);
    
    try {
      const sendRes = await fetch('/api/ortak/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      
      const sendData = await sendRes.json();
      if (!sendRes.ok) {
        throw new Error(sendData.error?.message || 'OTP gönderimi başarısız.');
      }
      
      const devOtpCode = sendData.devOtpCode;
      addLog(`Doğrulama kodu alındı (Dev simülatör): ${devOtpCode}`);
      
      const verifyRes = await fetch('/api/ortak/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: devOtpCode }),
      });
      
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error?.message || 'OTP doğrulaması başarısız.');
      }
      
      const accessToken = verifyData.accessToken;
      setToken(accessToken);
      addLog(`JWT Access Token alındı. Başarıyla giriş yapıldı!`);
      
      await loadDashboardData(accessToken);
      
    } catch (err: any) {
      addLog(`Hata: ${err.message}`);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load dashboard data
  const loadDashboardData = async (accessToken: string) => {
    try {
      const quotaRes = await fetch('/api/hizmetveren/kota', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const quotaData = await quotaRes.json();
      if (quotaRes.ok) {
        setQuota(quotaData);
        addLog(`Kota durumu yüklendi: Paket: ${quotaData.packageName.toUpperCase()}, Kullanım: ${quotaData.used}/${quotaData.limit || 'Sınırsız'}`);
        initSocket(quotaData.providerId);
      }

      const jobsRes = await fetch('/api/hizmetveren/gelen-isler', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const jobsData = await jobsRes.json();
      if (jobsRes.ok) {
        setJobs(jobsData);
        addLog(`${jobsData.length} adet yeni gelen iş listelendi.`);
      }
    } catch (err: any) {
      addLog(`Dashboard yükleme hatası: ${err.message}`);
    }
  };

  // Socket.io integration
  const initSocket = (providerId: string) => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    addLog(`Soket bağlantısı kuruluyor...`);
    const socket = io(`${process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3005'}/chat`, {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      addLog(`WebSocket connected! Client ID: ${socket.id}`);
      socket.emit('join_provider', { providerId });
      addLog(`Soket odasına katılım yapıldı: provider_${providerId}`);
    });

    socket.on('new_job', (newJob: Job) => {
      addLog(`🔔 [YENİ İŞ GELDİ] ${newJob.categoryName} - Konum: ${newJob.district}`);
      setJobs((prev) => {
        if (prev.some((j) => j.id === newJob.id)) return prev;
        return [newJob, ...prev];
      });
    });

    socket.on('disconnect', () => {
      addLog(`WebSocket bağlantısı kesildi.`);
    });
  };

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Submit Bid
  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !activeJob) return;

    const priceNum = Number(offerPrice);
    if (!priceNum || priceNum < 1) {
      alert('Lütfen geçerli bir teklif fiyatı giriniz.');
      return;
    }

    setSubmittingOffer(true);
    addLog(`Teklif gönderiliyor... Tutar: ${priceNum} TL`);

    try {
      const res = await fetch('/api/hizmetveren/teklifler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          jobId: activeJob.id,
          price: priceNum,
          message: offerMessage,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Teklif gönderilemedi.');
      }

      addLog(`Teklif başarıyla gönderildi! Teklif ID: ${data.offer?.id}`);
      alert('Teklifiniz başarıyla müşteriye iletildi!');
      
      setJobs((prev) => prev.filter((j) => j.id !== activeJob.id));
      setActiveJob(null);
      setOfferPrice('');
      setOfferMessage('');

      await loadDashboardData(token);

    } catch (err: any) {
      addLog(`Teklif gönderme hatası: ${err.message}`);
      alert(err.message);
    } finally {
      setSubmittingOffer(false);
    }
  };

  const handleSignOut = () => {
    setToken(null);
    setQuota(null);
    setJobs([]);
    setSelectedPhone('');
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    addLog('Oturum sonlandırıldı.');
  };

  // Helper to render outline SVGs matching the screenshot
  const renderMockupIcon = (type: string) => {
    const baseClass = "w-5 h-5 text-slate-700";
    if (type === "cleaning") {
      return (
        <div className="w-10 h-10 rounded-2xl bg-[#c8f252]/10 flex items-center justify-center border border-[#c8f252]/30">
          <svg className="w-5 h-5 text-[#88b000]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
      );
    }
    if (type === "truck") {
      return (
        <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-200/60">
          <svg className={baseClass} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 17a2 2 0 11-4 0 2 2 0 014 0zM7 17a2 2 0 11-4 0 2 2 0 014 0zM5 17h10M19 17h2v-6l-3-3h-3V5H3v10h2" />
          </svg>
        </div>
      );
    }
    if (type === "tools") {
      return (
        <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-200/60">
          <svg className={baseClass} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>
      );
    }
    // paint
    return (
      <div className="w-10 h-10 rounded-2xl bg-[#c8f252]/10 flex items-center justify-center border border-[#c8f252]/30">
        <svg className="w-5 h-5 text-[#88b000]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-3" />
        </svg>
      </div>
    );
  };

  return (
    <div className="bg-[#f8fafc] text-slate-900 min-h-screen flex antialiased font-sans select-none overflow-x-hidden">
      
      {/* 🧭 Sidebar Menu matching the exact mockup */}
      <nav className={`h-screen w-64 fixed left-0 top-0 bg-white border-r border-slate-100/80 flex flex-col py-6 px-4 z-50 transition-transform duration-300 md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:flex shrink-0`}>
        
        {/* Brand Header */}
        <div className="mb-6 px-2 flex justify-between items-center h-16 relative">
          <div className="flex items-center w-48 h-10 relative">
            <a className="absolute left-[-20px] top-1/2 -translate-y-1/2 flex items-center" href="#">
              <img 
                alt="Esnaaf Logo" 
                className="w-auto select-none max-w-none" 
                style={{ height: '120px', objectFit: 'contain' }}
                src="/logo.png" 
              />
            </a>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-slate-800 p-1 absolute right-2 top-1/2 -translate-y-1/2 z-10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Circular Profile Card with green checkmark */}
        <div className="flex items-center gap-3 mb-6 p-3 rounded-2xl bg-[#f8fafc] border border-slate-100 shadow-[0_2px_4px_rgba(0,0,0,0.01)]">
          <div className="relative w-10 h-10 shrink-0">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"
              alt="Mert Yılmaz"
              className="w-full h-full object-cover rounded-xl border border-slate-200"
            />
            {/* Green verified check badge */}
            <span className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white text-[8px] font-bold">
              ✓
            </span>
          </div>
          <div className="overflow-hidden text-left">
            <p className="font-extrabold text-slate-800 text-xs truncate leading-none">
              {quota ? quota.providerName : 'Mert Yılmaz'}
            </p>
            <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase block tracking-wider font-mono">
              DOĞRULANMIŞ UZMAN
            </span>
          </div>
        </div>

        {/* Sidebar Menu items */}
        <div className="flex-1 flex flex-col gap-1 overflow-y-auto scrollbar-none pr-0.5">
          <a className="flex items-center gap-3.5 px-4 py-3 bg-[#4c630a] text-white font-extrabold rounded-2xl transition-all duration-150 shadow-sm shadow-[#4c630a]/20 scale-bounce text-xs" href="#">
            <Briefcase className="w-4.5 h-4.5 shrink-0 stroke-[2.2]" />
            <span>Gelen İşler (Fırsatlar)</span>
          </a>
          <a className="flex items-center gap-3.5 px-4 py-3 text-slate-450 hover:bg-slate-50 hover:text-slate-800 font-bold rounded-2xl transition-all text-xs" href="#">
            <FileText className="w-4.5 h-4.5 shrink-0 stroke-[2.2]" />
            <span>Teklif Verilenler</span>
          </a>
          <a className="flex items-center gap-3.5 px-4 py-3 text-slate-450 hover:bg-slate-50 hover:text-slate-800 font-bold rounded-2xl transition-all text-xs" href="#">
            <CheckCircle className="w-4.5 h-4.5 shrink-0 stroke-[2.2]" />
            <span>Kazanılan İşler (Aktif Süreç)</span>
          </a>
          <a className="flex items-center gap-3.5 px-4 py-3 text-slate-450 hover:bg-slate-50 hover:text-slate-800 font-bold rounded-2xl transition-all text-xs" href="#">
            <CheckCircle className="w-4.5 h-4.5 shrink-0 stroke-[2.2]" />
            <span>Tamamlanan İşler</span>
          </a>
          <a className="flex items-center gap-3.5 px-4 py-3 text-slate-450 hover:bg-slate-50 hover:text-slate-800 font-bold rounded-2xl transition-all text-xs" href="#">
            <X className="w-4.5 h-4.5 shrink-0 stroke-[2.2]" />
            <span>İptal Edilenler</span>
          </a>
          <a className="flex items-center gap-3.5 px-4 py-3 text-slate-450 hover:bg-slate-50 hover:text-slate-800 font-bold rounded-2xl transition-all text-xs" href="#">
            <Star className="w-4.5 h-4.5 shrink-0 stroke-[2.2]" />
            <span>Yorumlar & Puanlar</span>
          </a>
          <a className="flex items-center gap-3.5 px-4 py-3 text-slate-450 hover:bg-slate-50 hover:text-slate-800 font-bold rounded-2xl transition-all text-xs" href="#">
            <CreditCard className="w-4.5 h-4.5 shrink-0 stroke-[2.2]" />
            <span>Abonelik & Paket Bilgisi</span>
          </a>
          <a className="flex items-center gap-3.5 px-4 py-3 text-slate-450 hover:bg-slate-50 hover:text-slate-800 font-bold rounded-2xl transition-all text-xs" href="#">
            <Wallet className="w-4.5 h-4.5 shrink-0 stroke-[2.2]" />
            <span>Ödeme Geçmişi</span>
          </a>
          <a className="flex items-center gap-3.5 px-4 py-3 text-slate-450 hover:bg-slate-50 hover:text-slate-800 font-bold rounded-2xl transition-all text-xs" href="#">
            <TrendingUp className="w-4.5 h-4.5 shrink-0 stroke-[2.2]" />
            <span>Kazanç Analizi</span>
          </a>
          <a className="flex items-center gap-3.5 px-4 py-3 text-slate-450 hover:bg-slate-50 hover:text-slate-800 font-bold rounded-2xl transition-all text-xs" href="#">
            <Navigation className="w-4.5 h-4.5 shrink-0 stroke-[2.2]" />
            <span>Rota Planlama</span>
          </a>
        </div>

        {/* Sidebar bottom lime publish button */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col gap-3">
          <button
            onClick={() => alert("Hizmet yayınlama özelliği yakında partnerlerimizin kullanımına sunulacaktır.")}
            className="w-full bg-[#c8f252] hover:bg-[#b5e639] text-slate-950 font-black text-xs py-3.5 rounded-2xl cursor-pointer shadow-sm active:scale-95 transition-all text-center border border-transparent"
          >
            Hizmet Yayınla
          </button>
          
          {token && (
            <button 
              onClick={handleSignOut}
              className="flex items-center justify-center gap-2 text-red-500 font-bold text-[10px] hover:text-red-600 transition-colors w-full py-1 text-center cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>Oturumu Kapat</span>
            </button>
          )}
        </div>
      </nav>

      {/* 💻 Main Content Area */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen relative overflow-hidden">
        
        {/* Decorative background glow */}
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#c8f252]/5 blur-[120px] pointer-events-none z-0"></div>

        {/* 🚀 Top App Header */}
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100/60 h-16 flex justify-between items-center w-full px-6 md:px-8 shadow-sm">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            {/* Fırsat Arama Kutusu */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/50 rounded-full px-4.5 py-2 w-full focus-within:border-[#4c630a]/40 focus-within:ring-2 focus-within:ring-[#4c630a]/5 transition-all">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Fırsat araması yapın..."
                className="bg-transparent border-0 outline-none text-slate-800 font-semibold text-xs w-full focus:ring-0"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Dev Simulator Login Dropdown */}
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 px-3 rounded-xl border border-slate-200/60 focus-within:border-[#4c630a]/50 transition-all text-xs">
              <span className="text-[10px] font-bold text-slate-900 uppercase tracking-wider hidden lg:inline shrink-0 bg-[#c8f252] px-2.5 py-0.5 rounded-md border border-[#c8f252]/20 shadow-sm font-extrabold">Simülatör Giriş:</span>
              <select
                value={selectedPhone}
                onChange={(e) => {
                  setSelectedPhone(e.target.value);
                  handleSimulatedLogin(e.target.value);
                }}
                disabled={loading}
                className="bg-transparent text-slate-800 text-[11px] font-black focus:outline-none cursor-pointer w-full border-none outline-none font-sans"
              >
                <option value="" className="bg-white text-slate-800">--- Esnaf Girişi Yap ---</option>
                {MOCK_USTAS.map((u) => (
                  <option key={u.phone} value={u.phone} className="bg-white text-slate-800">
                    {u.name} (⭐ {u.rating})
                  </option>
                ))}
              </select>
            </div>

            <button className="text-slate-400 hover:text-slate-850 transition-colors p-2 hover:bg-slate-50 rounded-xl relative cursor-pointer">
              <Bell className="w-4.5 h-4.5 text-slate-500" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
            </button>

            <button className="text-slate-400 hover:text-slate-850 transition-colors p-2 hover:bg-slate-50 rounded-xl cursor-pointer">
              <MessageSquare className="w-4.5 h-4.5 text-slate-500" />
            </button>

            <div className="h-6 w-[1px] bg-slate-200 hidden sm:block"></div>

            <div className="hidden sm:flex items-center gap-2.5 text-left">
              <span className="text-xs font-black text-slate-850 leading-none">{quota ? quota.providerName : 'Mert Yılmaz'}</span>
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"
                alt="Mert Yılmaz"
                className="w-7 h-7 object-cover rounded-full border border-slate-200"
              />
            </div>
          </div>
        </header>

        {/* 🎨 Canvas Dashboard Body */}
        <div className="p-6 md:p-8 max-w-7xl w-full mx-auto flex-grow z-10 flex flex-col gap-6 text-left">
          
          {/* Dashboard Title & Overview Banner */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="font-extrabold text-slate-900 tracking-tight text-2xl md:text-3xl leading-snug">
                Yeni Fırsatlar
              </h2>
              <p className="text-slate-400 text-xs mt-1 font-semibold leading-relaxed">
                Bölgenizdeki en yeni iş taleplerini inceleyin ve hemen teklif verin.
              </p>
            </div>

            {/* Filter & Sort buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => alert("Filtreleme özellikleri yakında aktif olacaktır.")}
                className="bg-white border border-slate-200/80 hover:border-[#4c630a]/40 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
              >
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Filtrele</span>
              </button>
              <button
                onClick={() => alert("Sıralama parametreleri yakında eklenecektir.")}
                className="bg-white border border-slate-200/80 hover:border-[#4c630a]/40 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                <span>Sırala</span>
              </button>
            </div>
          </header>

          {/* ACTIVE OPPORTUNITIES GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            
            {/* If logged in and has actual jobs in database, render them. Otherwise show mockup grid */}
            {token && jobs.length > 0 ? (
              jobs.map((job) => (
                <div 
                  key={job.id} 
                  className="bg-white p-6 rounded-[24px] border border-slate-100 hover:border-slate-250 shadow-[0_4px_20px_rgba(15,23,42,0.01)] hover:shadow-md transition-all flex flex-col justify-between gap-5 animate-scale-up"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-3">
                        {renderMockupIcon(
                          job.categoryName.includes("Temizlik") ? "cleaning" :
                          job.categoryName.includes("Nakliyat") ? "truck" :
                          job.categoryName.includes("Tadilat") ? "tools" : "paint"
                        )}
                        <div className="flex flex-col text-left">
                          <span className="font-extrabold text-sm text-slate-900 leading-snug">{job.categoryName}</span>
                          <span className="text-[9px] font-black text-rose-500 bg-rose-50 border border-rose-100/50 px-1.5 py-0.5 rounded uppercase mt-0.5 self-start tracking-wider font-mono">
                            ACİL TALEP
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right flex flex-col text-[10px] text-slate-400 font-semibold gap-0.5">
                        <span className="flex items-center gap-1 justify-end">👁️ 3 usta inceliyor</span>
                        <span>Az önce</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold text-left">
                      <svg className="w-4 h-4 text-slate-450" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      <span>{job.name || "Misafir Seeker"} • {job.district || "Kadıköy"}, {resolveCityFromDistrict(job.district)}</span>
                    </div>

                    <p className="text-xs text-slate-650 font-medium leading-relaxed italic bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed font-semibold">
                      &ldquo;{job.details}&rdquo;
                    </p>
                  </div>

                  <div className="border-t border-slate-50 pt-4 flex items-center justify-between gap-4">
                    <div className="text-left">
                      <span className="block text-[9px] text-slate-450 font-bold uppercase tracking-wider">Tahmini Bütçe</span>
                      <span className="text-base font-black text-slate-900 tracking-tight">1.500 TL – 3.000 TL</span>
                    </div>

                    <button
                      onClick={() => setActiveJob(job)}
                      className="bg-[#4c630a] hover:bg-[#3d5008] text-white font-extrabold text-xs py-3 px-5 rounded-2xl transition-all shadow-sm active:scale-95 cursor-pointer border border-transparent"
                    >
                      Teklif Ver
                    </button>
                  </div>
                </div>
              ))
            ) : (
              // Preview State: Render exact screenshot cards
              MOCKUP_OPPORTUNITIES.map((opp) => (
                <div 
                  key={opp.id} 
                  className="bg-white p-6 rounded-[24px] border border-slate-100 hover:border-slate-200 shadow-[0_4px_20px_rgba(15,23,42,0.01)] hover:shadow-md transition-all flex flex-col justify-between gap-5 animate-scale-up"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-3">
                        {renderMockupIcon(opp.iconType)}
                        <div className="flex flex-col text-left">
                          <span className="font-extrabold text-sm text-slate-900 leading-none">{opp.categoryName}</span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase mt-1 self-start tracking-wider font-mono ${
                            opp.badgeType === "urgent" ? "bg-rose-50 text-rose-600 border border-rose-100/50 font-black" :
                            opp.badgeType === "high" ? "bg-[#c8f252]/20 text-[#4c630a] border border-[#c8f252]/30" :
                            opp.badgeType === "planned" ? "bg-slate-100 text-slate-700" : "bg-slate-50 text-slate-500"
                          }`}>
                            {opp.subBadge}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right flex flex-col text-[10px] text-slate-400 font-semibold gap-0.5">
                        <span className="flex items-center gap-1 justify-end">👁️ {opp.viewerCount} usta inceliyor</span>
                        <span>{opp.timeText}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold text-left">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      <span>{opp.name} • {opp.district}</span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium leading-relaxed italic bg-[#f8fafc] p-4 rounded-2xl border border-slate-100 leading-relaxed font-semibold text-left">
                      &ldquo;{opp.details}&rdquo;
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-4">
                    <div className="text-left">
                      <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Tahmini Bütçe</span>
                      <span className="text-sm md:text-base font-black text-slate-900 tracking-tight">{opp.budget}</span>
                    </div>

                    <button
                      onClick={() => {
                        if (!token) {
                          alert("Müşteriye teklif iletmek için lütfen sağ üstten simüle bir usta seçerek giriş yapın!");
                        } else {
                          setActiveJob({
                            id: opp.id,
                            categoryName: opp.categoryName,
                            district: opp.district,
                            details: opp.details
                          });
                        }
                      }}
                      className="bg-[#4c630a] hover:bg-[#3d5008] text-white font-extrabold text-xs py-3 px-5 rounded-2xl transition-all shadow-sm active:scale-95 cursor-pointer border border-transparent"
                    >
                      Teklif Ver
                    </button>
                  </div>
                </div>
              ))
            )}

          </div>

          {/* Simulated quota details in preview or active states */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-4">
            
            {/* Quota overview (Full Width) */}
            <div className="lg:col-span-12 bg-white border border-slate-100 shadow-sm p-6 rounded-[24px]">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Kota Limit Bilgileri</h3>
                <span className="bg-[#c8f252] text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded uppercase tracking-wider font-mono">
                  {quota ? quota.packageName : 'Mert Yılmaz - VIP'}
                </span>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400">Teklif Kotası:</span>
                  <span className="text-slate-800 font-black font-mono">
                    {quota?.limit ? `${quota.used} / ${quota.limit} İş` : `${quota ? quota.used : 2} / Sınırsız (VIP)`}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/50">
                  <div className="bg-[#c8f252] h-full rounded-full shadow-sm" style={{ width: quota ? `${(quota.used / (quota.limit || 100)) * 100}%` : '5%' }} />
                </div>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed font-mono">
                  * VIP paketlerde kota sınırı yoktur. Test esnaflarımız sınırsız işlem yapabilmektedir.
                </p>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* 🪙 Frosted Glass Teklif Verme Modalı */}
      {activeJob && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Coins className="w-5 h-5 text-slate-950" />
                <span>Müşteriye Fiyat Teklifi Gönder</span>
              </h3>
              <button 
                onClick={() => {
                  setActiveJob(null);
                  setOfferPrice('');
                  setOfferMessage('');
                }}
                className="text-slate-400 hover:text-slate-850 rounded-xl p-1.5 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-5 shadow-sm text-left">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-[#c8f252]/15 text-slate-950 border border-[#c8f252]/30 text-[10px] font-black px-2.5 py-0.5 rounded shadow-sm">
                  {activeJob.categoryName}
                </span>
                <span className="text-slate-500 text-xs flex items-center gap-1 font-bold">
                  <MapPin className="w-3.5 h-3.5 text-slate-550" />
                  {activeJob.district}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic font-semibold">
                &ldquo;{activeJob.details}&rdquo;
              </p>
            </div>

            <form onSubmit={handleOfferSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
                  Teklif Fiyatı (TL)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    placeholder="Örn: 850"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#4c630a]/50 focus:ring-1 focus:ring-[#4c630a]/10 rounded-xl py-3.5 px-4 pl-10 text-xs font-black text-slate-900 focus:outline-none transition-all shadow-inner"
                  />
                  <span className="absolute left-4 top-3.5 text-xs font-black text-slate-900">₺</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
                  Teklif Açıklaması & Mesaj (Müşteriye İletilecek)
                </label>
                <textarea
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  placeholder="Müşteriye işi nasıl yapacağınızı anlatın..."
                  rows={4}
                  required
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#4c630a]/50 focus:ring-1 focus:ring-[#4c630a]/10 rounded-xl py-3.5 px-4 text-xs text-slate-900 focus:outline-none transition-all resize-none leading-relaxed shadow-inner font-semibold"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setActiveJob(null);
                    setOfferPrice('');
                    setOfferMessage('');
                  }}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-3 rounded-xl transition-all text-xs border border-slate-200 active:scale-[0.98] cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={submittingOffer}
                  className="flex-1 bg-[#4c630a] hover:bg-[#3d5008] text-white font-extrabold py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs disabled:opacity-55 shadow-md shadow-[#4c630a]/10 active:scale-[0.98] cursor-pointer border border-transparent"
                >
                  {submittingOffer ? (
                    <span>Gönderiliyor...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4 shrink-0 text-white" />
                      <span>Teklifi İlet</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes scaleUp {
          from { transform: scale(0.97); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up {
          animation: scaleUp 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
