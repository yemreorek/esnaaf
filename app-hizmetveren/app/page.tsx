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
  FileText
} from 'lucide-react';

// Seeded mock providers from seed-providers.ts
const MOCK_USTAS = [
  { name: 'Usta Ahmet (VIP)', phone: '+905320000001', rating: 4.8 },
  { name: 'Usta Mehmet (Premium - Yeni)', phone: '+905320000002', rating: 4.5 },
  { name: 'Usta Can (Standart)', phone: '+905320000003', rating: 4.2 },
  { name: 'Usta Hasan (Standart - Eski)', phone: '+905320000004', rating: 3.9 },
  { name: 'Usta Veli (Basic)', phone: '+905320000005', rating: 3.5 },
  { name: 'Usta Ayşe (VIP - Yeni)', phone: '+905320000006', rating: 4.9 },
  { name: 'Usta Fatma (Premium - Yeni)', phone: '+905320000007', rating: 4.6 },
  { name: 'Usta Murat (Standart)', phone: '+905320000008', rating: 4.0 },
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
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [offerPrice, setOfferPrice] = useState<string>('');
  const [offerMessage, setOfferMessage] = useState<string>('');
  const [submittingOffer, setSubmittingOffer] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  // Helper to add system log messages in the console log panel
  const addLog = (msg: string) => {
    setLogMessages((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);
  };

  // 1. Simulate login when a mock provider is selected
  const handleSimulatedLogin = async (phone: string) => {
    if (!phone) return;
    setLoading(true);
    addLog(`Simüle giriş başlatılıyor: ${phone}`);
    
    try {
      // Step A: Send OTP (Returns devOtpCode in development environment)
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
      
      // Step B: Verify OTP to obtain real JWT Access Token
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
      
      // Step C: Load Quota and Jobs
      await loadDashboardData(accessToken);
      
    } catch (err: any) {
      addLog(`Hata: ${err.message}`);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Load dashboard data (Jobs & Quota)
  const loadDashboardData = async (accessToken: string) => {
    try {
      // Fetch Quota
      const quotaRes = await fetch('/api/hizmetveren/kota', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const quotaData = await quotaRes.json();
      if (quotaRes.ok) {
        setQuota(quotaData);
        addLog(`Kota durumu yüklendi: Paket: ${quotaData.packageName.toUpperCase()}, Kullanım: ${quotaData.used}/${quotaData.limit || 'Sınırsız'}`);
        
        // Initialize Socket.io connection for real-time notifications
        initSocket(quotaData.providerId);
      }

      // Fetch Incoming Jobs
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

  // 3. Socket.io integration
  const initSocket = (providerId: string) => {
    // Clean up existing socket
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    addLog(`Soket bağlantısı kuruluyor...`);
    const socket = io(`${process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3005'}/chat`);
    socketRef.current = socket;

    socket.on('connect', () => {
      addLog(`WebSocket connected! Client ID: ${socket.id}`);
      // Join the provider's specific room
      socket.emit('join_provider', { providerId });
      addLog(`Soket odasına katılım yapıldı: provider_${providerId}`);
    });

    // Listen to real-time distributed jobs
    socket.on('new_job', (newJob: Job) => {
      addLog(`🔔 [YENİ İŞ GELDİ] ${newJob.categoryName} - Konum: ${newJob.district}`);
      setJobs((prev) => {
        // Prevent duplicate jobs
        if (prev.some((j) => j.id === newJob.id)) return prev;
        return [newJob, ...prev];
      });
    });

    socket.on('disconnect', () => {
      addLog(`WebSocket bağlantısı kesildi.`);
    });
  };

  // Disconnect socket on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // 4. Submit Bid
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
      
      // Remove this job from the list as the provider has already bid on it
      setJobs((prev) => prev.filter((j) => j.id !== activeJob.id));
      setActiveJob(null);
      setOfferPrice('');
      setOfferMessage('');

      // Reload quota status
      await loadDashboardData(token);

    } catch (err: any) {
      addLog(`Teklif gönderme hatası: ${err.message}`);
      alert(err.message);
    } finally {
      setSubmittingOffer(false);
    }
  };

  return (
    <main className="min-h-screen bg-bg font-sans pb-12">
      {/* 🚀 Header */}
      <header className="bg-primary text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center font-bold text-primary text-xl">
              e.
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Esnaaf Partner</h1>
              <p className="text-xs text-zinc-400">Esnaf & Hizmet Veren Paneli</p>
            </div>
          </div>

          {/* Simulated Login Selector */}
          <div className="flex items-center gap-2 bg-zinc-800 p-2 rounded-xl border border-zinc-700 w-full md:w-auto">
            <span className="text-xs font-semibold text-zinc-400 px-2 hidden lg:inline">Test Girişi:</span>
            <select
              value={selectedPhone}
              onChange={(e) => {
                setSelectedPhone(e.target.value);
                handleSimulatedLogin(e.target.value);
              }}
              className="bg-transparent text-white text-sm focus:outline-none cursor-pointer pr-4 w-full md:w-60"
            >
              <option value="" className="bg-primary text-white">--- Bir Usta Seçerek Giriş Yapın ---</option>
              {MOCK_USTAS.map((u) => (
                <option key={u.phone} value={u.phone} className="bg-primary text-white">
                  {u.name} (⭐ {u.rating})
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 📊 Sidebar (Quota & Profile Info) */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          {quota ? (
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-zinc-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-primary text-lg">Hesap Durumu</h2>
                <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-lg ${
                  quota.packageName === 'vip' ? 'bg-accent text-primary' : 'bg-zinc-800 text-white'
                }`}>
                  {quota.packageName}
                </span>
              </div>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-accent-light flex items-center justify-center text-primary font-bold text-lg">
                  {quota.providerName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-primary">{quota.providerName}</h3>
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                    <span>Onaylı Esnaf</span>
                  </div>
                </div>
              </div>

              {/* Progress and Quota status */}
              <div className="border-t border-zinc-100 pt-4">
                <div className="flex justify-between text-sm font-semibold mb-2">
                  <span className="text-zinc-500">Aylık Kota Kullanımı:</span>
                  <span className="text-primary">
                    {quota.limit ? `${quota.used} / ${quota.limit} İş` : `${quota.used} / Sınırsız`}
                  </span>
                </div>
                
                {quota.limit ? (
                  <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden mb-3">
                    <div 
                      className="bg-accent h-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (quota.used / quota.limit) * 100)}%` }}
                    />
                  </div>
                ) : (
                  <div className="w-full bg-accent-light h-1 rounded-full overflow-hidden mb-3" />
                )}

                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Yenilenme: Her Ayın 1&apos;i</span>
                  {quota.remaining !== null && (
                    <span className="font-semibold text-zinc-700">Kalan Teklif Hakkı: {quota.remaining}</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-zinc-200 text-center py-12">
              <Briefcase className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">Hizmet veren hesabınızın kota bilgilerini görmek için lütfen yukarıdan giriş yapın.</p>
            </div>
          )}

          {/* 💻 System Logs Console */}
          <div className="bg-primary text-zinc-300 rounded-2xl p-4 shadow-sm border border-zinc-800 font-mono text-[11px] h-64 overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2 mb-3">
              <span className="text-accent uppercase tracking-wider font-bold">Terminal / Log Çıktısı</span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            </div>
            {logMessages.length === 0 ? (
              <p className="text-zinc-600 italic">Sistem logları burada belirecektir...</p>
            ) : (
              logMessages.map((log, idx) => (
                <p key={idx} className="mb-1 leading-relaxed text-zinc-400">
                  {log}
                </p>
              ))
            )}
          </div>
        </section>

        {/* 💼 Incoming Jobs Feed */}
        <section className="lg:col-span-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
              <Briefcase className="w-5.5 h-5.5 text-zinc-600" />
              <span>Bölgenizdeki Gelen İşler</span>
            </h2>
            {token && (
              <span className="bg-accent-light border border-accent text-primary px-3 py-1 rounded-full text-xs font-bold">
                {jobs.length} Yeni İş
              </span>
            )}
          </div>

          {!token ? (
            <div className="bg-surface rounded-2xl p-12 text-center shadow-sm border border-zinc-200">
              <Briefcase className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-primary mb-2">Partner Girişi Bekleniyor</h3>
              <p className="text-zinc-500 text-sm max-w-md mx-auto">
                Yeni gelen işleri görmek ve teklif vermek için lütfen sağ üst köşedeki test barından bir usta hesabı seçip simüle giriş yapın.
              </p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-surface rounded-2xl p-12 text-center shadow-sm border border-zinc-200 py-16 animate-pulse">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-primary mb-2">Harika! Yeni İş Yok</h3>
              <p className="text-zinc-500 text-sm max-w-md mx-auto">
                Bölgenizde atanmış yeni bir iş bulunmamaktadır. Yeni işler dağıtıldığında WebSocket ile bu ekrana **canlı olarak düşecektir**.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {jobs.map((job) => (
                <div 
                  key={job.id} 
                  className="bg-surface rounded-2xl p-6 shadow-sm border border-zinc-200 hover:border-zinc-300 transition-all duration-200 animate-scale-up"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-zinc-100 pb-4 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="bg-accent-light text-primary border border-accent text-xs font-bold px-3 py-1 rounded-lg">
                        {job.categoryName}
                      </span>
                      <span className="bg-zinc-100 text-zinc-700 text-xs font-medium px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                        {job.district}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 bg-zinc-50 border border-zinc-200/60 px-3 py-1 rounded-lg">
                      <Eye className="w-4 h-4 text-zinc-400" />
                      <span>Bu işi şu an <span className="text-primary font-extrabold">{job.viewerCount}</span> usta görüyor</span>
                    </div>
                  </div>

                  <div className="mb-5">
                    <h4 className="text-xs text-zinc-400 uppercase tracking-wider font-bold mb-1">Hizmet Detayları</h4>
                    <p className="text-zinc-700 text-sm leading-relaxed">{job.details}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400">
                      Eklenme Tarihi: {new Date(job.created_at).toLocaleString('tr-TR')}
                    </span>

                    <button
                      onClick={() => setActiveJob(job)}
                      className="bg-accent hover:bg-accent/90 text-primary font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Coins className="w-4.5 h-4.5" />
                      <span>Teklif Ver</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* 🪙 Teklif Verme Modalı */}
      {activeJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl max-w-lg w-full p-6 shadow-xl border border-zinc-200/80 animate-scale-up">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3 mb-4">
              <h3 className="font-bold text-primary text-lg flex items-center gap-2">
                <Coins className="w-5 h-5 text-accent" />
                <span>Hizmet Teklifi Ver</span>
              </h3>
              <button 
                onClick={() => {
                  setActiveJob(null);
                  setOfferPrice('');
                  setOfferMessage('');
                }}
                className="text-zinc-400 hover:text-zinc-600 rounded-lg p-1.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-bg rounded-xl p-4 border border-zinc-200/50 mb-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-accent-light text-primary text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-accent">
                  {activeJob.categoryName}
                </span>
                <span className="text-zinc-500 text-xs flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {activeJob.district}
                </span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed italic">
                &ldquo;{activeJob.details}&rdquo;
              </p>
            </div>

            <form onSubmit={handleOfferSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
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
                    className="w-full bg-bg border border-zinc-200 focus:border-accent rounded-xl py-3 px-4 pl-9 text-sm font-semibold focus:outline-none transition-colors"
                  />
                  <span className="absolute left-4 top-3.5 text-sm font-bold text-zinc-400">₺</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                  Teklif Açıklaması / Not (Müşteriye İletilecek)
                </label>
                <textarea
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  placeholder="Müşteriye işi nasıl yapacağınızı anlatın. Örn: Kadıköy bölgesine çok yakınız, yarın sabah istediğiniz saatte gelip temizliği ekibimle tamamlayabiliriz."
                  rows={4}
                  className="w-full bg-bg border border-zinc-200 focus:border-accent rounded-xl py-3 px-4 text-sm focus:outline-none transition-colors resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveJob(null);
                    setOfferPrice('');
                    setOfferMessage('');
                  }}
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold py-3 rounded-xl transition-colors text-sm"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={submittingOffer}
                  className="flex-1 bg-accent hover:bg-accent/90 text-primary font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors text-sm disabled:opacity-55"
                >
                  {submittingOffer ? (
                    <span>Gönderiliyor...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Teklif Gönder</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
