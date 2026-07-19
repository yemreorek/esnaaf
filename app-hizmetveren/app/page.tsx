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
  Navigation,
  Phone,
  Lock,
  AlertTriangle,
  XCircle,
  Calendar
} from 'lucide-react';

const ConfettiEffect = ({ active }: { active: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#c8f252', '#4c630a', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
    const particles = Array.from({ length: 120 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * canvas.height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.lineWidth = p.r / 2;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });

      update();
      animationFrameId = requestAnimationFrame(draw);
    };

    const update = () => {
      particles.forEach((p) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - p.r / 2) * 5;

        if (p.y > canvas.height) {
          p.x = Math.random() * canvas.width;
          p.y = -20;
          p.tilt = Math.random() * 10 - 5;
        }
      });
    };

    draw();

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999] w-full h-full"
    />
  );
};

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

export function formatRelativeTime(dateString: string): string {
  try {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} saat önce`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Dün';
    return `${diffDays} gün önce`;
  } catch (e) {
    return 'Az önce';
  }
}

export function formatDetails(text?: string): string {
  if (!text) return '';
  return text.split(/[•\n]+/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => `• ${line}`)
    .join('\n');
}

export function normalizePhone(rawPhone: string): string {
  let digits = rawPhone.replace(/\D/g, '');
  if (digits.startsWith('90') && digits.length === 12) {
    digits = digits.substring(2);
  }
  if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.substring(1);
  }
  return `+90${digits}`;
}

const getRequestExpiryInfo = (
  createdAt: Date | string,
  compareWith: number = Date.now(),
  offers: { created_at?: Date | string | number }[] = []
) => {
  const createdDate = new Date(createdAt);
  
  // Turkey is permanently UTC+3 (no daylight saving time since 2016)
  // By adding 3 hours to the UTC timestamp, we can use UTC methods to get the correct local year, month, day, and hour.
  const localTime = new Date(createdDate.getTime() + 3 * 60 * 60 * 1000);
  
  const hour = localTime.getUTCHours();
  const isNight = hour >= 18 || hour < 10;
  
  let initialExpiresTime = 0;
  let initialLabel = '30 dakika';

  if (isNight) {
    const targetDate = new Date(localTime.getTime());
    if (hour >= 18) {
      targetDate.setUTCDate(targetDate.getUTCDate() + 1);
    }
    
    const tYear = targetDate.getUTCFullYear();
    const tMonth = (targetDate.getUTCMonth() + 1).toString().padStart(2, '0');
    const tDay = targetDate.getUTCDate().toString().padStart(2, '0');
    
    // Construct exact ISO timestamp for 10:00 AM Turkey local time (UTC+3)
    const istanbul10AMIso = `${tYear}-${tMonth}-${tDay}T10:00:00+03:00`;
    initialExpiresTime = new Date(istanbul10AMIso).getTime();
    initialLabel = "sabah 10:00'a kadar olan";
  } else {
    initialExpiresTime = createdDate.getTime() + 30 * 60 * 1000;
  }

  // Check if any offers arrived before the initial expiry time
  const offersBeforeExpiry = (offers || []).filter(o => {
    const offerTime = o.created_at ? new Date(o.created_at).getTime() : 0;
    return offerTime > 0 && offerTime < initialExpiresTime;
  });
  const hasOffersBeforeExpiry = offersBeforeExpiry.length > 0;

  let expiresTime = initialExpiresTime;
  let label = initialLabel;
  let isExtended = false;

  if (!hasOffersBeforeExpiry) {
    expiresTime = initialExpiresTime + 15 * 60 * 1000; // Extend by 15 minutes
    isExtended = true;
    label = isNight ? "sabah 10:15'e kadar uzatılan" : "45 dakikalık (uzatılmış)";
  }

  const isExpired = expiresTime <= compareWith;
  return { expiresTime, isExpired, label, isExtended, initialExpiresTime };
};

const CountdownTimer = ({ 
  createdAt, 
  expiresTime,
  onExpire, 
  variant = 'default' 
}: { 
  createdAt: string | Date; 
  expiresTime?: number;
  onExpire?: () => void; 
  variant?: 'default' | 'large';
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculateTime = () => {
      let expTime = expiresTime;
      if (!expTime) {
        const { expiresTime: calculated } = getRequestExpiryInfo(createdAt);
        expTime = calculated;
      }
      const now = Date.now();
      const diff = expTime - now;

      if (diff <= 0) {
        setTimeLeft('Süre Doldu');
        if (onExpire) onExpire();
        return false;
      }

      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      const hourStr = hours > 0 ? hours.toString().padStart(2, '0') + ':' : '';
      const minStr = minutes.toString().padStart(2, '0');
      const secStr = seconds.toString().padStart(2, '0');
      setTimeLeft(`${hourStr}${minStr}:${secStr}`);
      return true;
    };

    calculateTime();
    const interval = setInterval(() => {
      const active = calculateTime();
      if (!active) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt, onExpire]);

  if (variant === 'large') {
    return (
      <span className="font-mono font-black text-2xl md:text-3xl text-red-500 animate-pulse tracking-wider">
        {timeLeft}
      </span>
    );
  }

  return (
    <span className="font-mono font-black text-xs text-red-500 animate-pulse">
      {timeLeft}
    </span>
  );
};

const OpportunityCard = ({
  job,
  token,
  renderMockupIcon,
  setActiveJob,
  setRejectingJob,
  showAlert,
}: {
  job: any;
  token?: string | null;
  renderMockupIcon: (type: string) => React.ReactNode;
  setActiveJob: (job: any) => void;
  setRejectingJob?: (job: any) => void;
  showAlert?: (title: string, msg: string, type?: "success" | "error" | "info") => void;
}) => {
  const [isExpired, setIsExpired] = useState<boolean>(
    job.expiresTime 
      ? job.expiresTime <= Date.now() 
      : (job.created_at ? getRequestExpiryInfo(job.created_at).isExpired : false)
  );

  const badgeText = job.aciliyet || (
    job.categoryName?.includes("Temizlik") ? "ACİL TALEP" :
    job.categoryName?.includes("Nakliyat") ? "PLANLI İŞ" :
    job.categoryName?.includes("Tadilat") ? "YÜKSEK ÖNCELİK" : "STANDART İŞ"
  );
  const badgeType = job.aciliyet ? (
    job.aciliyet.toLowerCase().includes("acil") ? "urgent" :
    job.aciliyet.toLowerCase().includes("yüksek") ? "high" :
    job.aciliyet.toLowerCase().includes("plan") ? "planned" : "standard"
  ) : (
    job.categoryName?.includes("Temizlik") ? "urgent" :
    job.categoryName?.includes("Nakliyat") ? "planned" :
    job.categoryName?.includes("Tadilat") ? "high" : "standard"
  );

  const offersCount = job.offersCount || 0;
  const isClosed = offersCount >= 4 || isExpired;

  const renderOfferDots = (count: number) => {
    const dots = [];
    for (let i = 0; i < 4; i++) {
      if (i < count) {
        dots.push(
          <span key={i} className="w-2.5 h-2.5 rounded-full bg-[#4c630a] inline-block shadow-[0_0_6px_rgba(76,99,10,0.3)] transition-all duration-305" title={`${count}/4 Teklif Verildi`} />
        );
      } else if (i === 3) {
        dots.push(
          <span key={i} className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-500/30 inline-block animate-pulse transition-all duration-305" title="4. Teklif: Yeni/Temel Paket Üyelerine Özel Slot!" />
        );
      } else {
        dots.push(
          <span key={i} className="w-2.5 h-2.5 rounded-full bg-slate-200 border border-slate-350 inline-block transition-all duration-305" title={`${count}/4 Teklif Verildi`} />
        );
      }
    }
    return (
      <div className="flex items-center gap-1.5 bg-slate-50/80 px-2.5 py-1.5 rounded-full border border-slate-100/60 shrink-0">
        <span className="text-[10px] text-slate-500 font-bold">Teklifler:</span>
        <div className="flex gap-1.5">
          {dots}
        </div>
        <span className="text-[10px] text-[#4c630a] font-mono font-black ml-0.5">{count}/4</span>
      </div>
    );
  };

  return (
    <div 
      className="bg-white p-6 rounded-[24px] border border-slate-100 hover:border-slate-250 shadow-[0_4px_20px_rgba(15,23,42,0.01)] hover:shadow-md transition-all flex flex-col justify-between gap-5 animate-scale-up text-left"
    >
      <div className="space-y-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-3">
            {renderMockupIcon(
              job.categoryName?.includes("Temizlik") ? "cleaning" :
              job.categoryName?.includes("Nakliyat") ? "truck" :
              job.categoryName?.includes("Tadilat") ? "tools" : "paint"
            )}
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-sm text-slate-900 leading-snug">{job.categoryName}</span>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase mt-0.5 self-start tracking-wider font-mono flex items-center gap-1 shadow-sm border ${
                badgeType === "urgent" ? "bg-rose-100/70 text-red-700 border-rose-200/80 font-black" :
                badgeType === "high" ? "bg-[#c8f252]/20 text-[#4c630a] border-[#c8f252]/30" :
                badgeType === "planned" ? "bg-slate-100 text-slate-700 border-slate-200/40" : "bg-slate-50 text-slate-500 border-slate-100"
              }`}>
                {badgeText}
              </span>
            </div>
          </div>
          
          <div className="text-right flex flex-col text-[10px] text-slate-400 font-semibold gap-0.5">
            <span className="flex items-center gap-1 justify-end">👁️ {job.viewerCount || 3} hizmet veren inceliyor</span>
            <div className="flex items-center gap-1 justify-end">
              <span>{formatRelativeTime(job.created_at || new Date().toISOString())}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50/60 border border-slate-100/80 rounded-2xl p-3">
          <div className="w-8 h-8 rounded-full bg-[#c8f252]/10 border border-[#c8f252]/20 flex items-center justify-center text-[#4c630a] font-extrabold text-xs shrink-0 select-none">
            {(job.name || "Misafir Seeker").charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col text-left">
            <span className="font-extrabold text-xs text-slate-800 leading-snug">{job.name || "Misafir Seeker"}</span>
            <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {job.district || "Kadıköy"}, {resolveCityFromDistrict(job.district)}
            </span>
          </div>
        </div>

        {/* Centered Countdown Timer Banner */}
        {!isExpired && job.created_at && (
          <div className="bg-rose-50/50 border border-rose-100/60 rounded-2xl p-3.5 text-center flex flex-col items-center justify-center gap-1 animate-scale-up">
            <CountdownTimer createdAt={job.created_at} expiresTime={job.expiresTime} variant="large" onExpire={() => setIsExpired(true)} />
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider">
              Teklife Kapanacak
            </span>
          </div>
        )}

        <p className="text-xs text-slate-650 font-medium leading-relaxed italic bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed font-semibold whitespace-pre-line text-left">
          &ldquo;{formatDetails(job.details)}&rdquo;
        </p>
      </div>

      <div className="border-t border-slate-50 pt-4 flex items-center justify-between gap-4">
        {renderOfferDots(offersCount)}
        
        {isClosed ? (
          <button
            disabled
            className="bg-slate-55 text-slate-400 font-extrabold text-xs py-3 px-5 rounded-2xl transition-all shadow-none cursor-not-allowed border border-slate-150"
          >
            {offersCount >= 4 ? "Teklife Kapandı (4/4)" : "Süre Doldu"}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (setRejectingJob) setRejectingJob(job);
              }}
              className="border border-[#e2e8f0] text-slate-500 hover:bg-slate-50 font-extrabold text-xs py-3 px-5 rounded-2xl transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              Reddet
            </button>
            <button
              onClick={() => {
                if (!token) {
                  if (showAlert) {
                    showAlert("Giriş Gerekli", "Müşteriye teklif iletmek için lütfen sağ üstten simüle bir Hizmet Veren seçerek giriş yapın!", "info");
                  } else {
                    alert("Lütfen önce giriş yapın!");
                  }
                } else {
                  setActiveJob(job);
                }
              }}
              className="bg-[#4c630a] hover:bg-[#3d5008] text-white font-extrabold text-xs py-3 px-5 rounded-2xl transition-all shadow-sm active:scale-95 cursor-pointer border border-transparent"
            >
              Teklif Ver
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


const MOCK_USTAS = [
  { name: 'Kemal Usta (Adana - Klima & Temizlik)', phone: '+905329999901', rating: 4.8 },
  { name: 'Aylin Teknik (Adana - Hizmet Grubu)', phone: '+905329999902', rating: 4.9 },
  { name: 'Mert Yılmaz (VIP - İstanbul)', phone: '+905320000001', rating: 4.8 },
  { name: 'Usta Ahmet (VIP - İstanbul)', phone: '+905320000001', rating: 4.8 },
  { name: 'Usta Mehmet (Premium - Yeni)', phone: '+905320000002', rating: 4.5 },
  { name: 'Usta Can (Standart)', phone: '+905320000003', rating: 4.2 },
];

// Screenshot Mock Opportunities used for preview state
const MOCKUP_OPPORTUNITIES = [
  {
    id: "mockup-1",
    categoryName: "Ev Temizliği",
    aciliyet: "ACİL TALEP",
    district: "Kadıköy, İstanbul",
    name: "Ayşe K.",
    details: "3+1 dairemiz için detaylı genel temizlik yaptırmak istiyoruz. Özellikle camlar ve balkon temizliği bizi...",
    viewerCount: 7,
    butce: "1.200 TL – 1.500 TL",
    iconType: "cleaning",
    created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(), // 12 mins ago
    offersCount: 1
  },
  {
    id: "mockup-2",
    categoryName: "Nakliyat",
    aciliyet: "PLANLI İŞ",
    district: "Şişli, İstanbul",
    name: "Caner M.",
    details: "Parça eşya taşıma hizmeti aranıyor. 1 adet koltuk takımı ve yemek masası Şişli'den Beşiktaş'a...",
    viewerCount: 5,
    butce: "2.500 TL – 3.200 TL",
    iconType: "truck",
    created_at: new Date(Date.now() - 22 * 60 * 1000).toISOString(), // 22 mins ago
    offersCount: 2
  },
  {
    id: "mockup-3",
    categoryName: "Tadilat",
    aciliyet: "YÜKSEK ÖNCELİK",
    district: "Çankaya, Ankara",
    name: "Selin T.",
    details: "Banyo fayans değişimi ve lavabo montajı. Malzemeler tarafımdan alınacaktır, sadece işçilik...",
    viewerCount: 12,
    butce: "4.000 TL – 6.000 TL",
    iconType: "tools",
    created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(), // 8 mins ago
    offersCount: 3
  },
  {
    id: "mockup-4",
    categoryName: "Boya & Badana",
    aciliyet: "STANDART İŞ",
    district: "Nilüfer, Bursa",
    name: "Hakan B.",
    details: "Ofis boyama işlemi. Toplam 120m2 net alan. Beyaz ve gri tonlarında boyanacak. Ofis boş...",
    viewerCount: 3,
    butce: "8.500 TL – 12.000 TL",
    iconType: "paint",
    created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(), // 35 mins ago (expired!)
    offersCount: 4
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
  butce?: string | null;
  aciliyet?: string | null;
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
  const [profile, setProfile] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editDistricts, setEditDistricts] = useState('');
  const [editBio, setEditBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  
  const [quota, setQuota] = useState<Quota | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  
  // Modal states
  const [activeJob, setActiveJobState] = useState<any | null>(null);
  const setActiveJob = (job: any | null) => {
    if (job && profile && profile.accountStatus === 'pending_approval') {
      showAlert(
        "Özellik Kısıtlı",
        "Bu özellik sadece onaylı hizmet verenlere açıktır. Hesabınızın onaylanma süreci devam etmektedir.",
        "info"
      );
      return;
    }
    setActiveJobState(job);
  };
  const [offerPrice, setOfferPrice] = useState<string>('');
  const [offerMessage, setOfferMessage] = useState<string>('');
  const [submittingOffer, setSubmittingOffer] = useState(false);

  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);
  const [showConfettiModal, setShowConfettiModal] = useState(false);

  const toggleAvailability = async () => {
    if (!token) return;
    setIsUpdatingAvailability(true);
    try {
      const newStatus = !profile?.isAvailable;
      const res = await fetch('/api/hizmetveren/profil/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isAvailable: newStatus })
      });

      if (!res.ok) {
        throw new Error('Müsaitlik durumu güncellenemedi.');
      }

      setProfile((prev: any) => prev ? { ...prev, isAvailable: newStatus } : null);

      if (newStatus) {
        setShowConfettiModal(true);
      } else {
        showAlert("Başarılı", "Müsaitlik durumunuz 'Kapalı' olarak güncellendi. Artık yeni iş ilanları almayacaksınız.", "success");
      }
    } catch (err: any) {
      showAlert("Hata", err.message, "error");
    } finally {
      setIsUpdatingAvailability(false);
    }
  };

  const socketRef = useRef<Socket | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'firsatlar' | 'teklifler' | 'kazanilanlar' | 'tamamlananlar' | 'yorumlar' | 'abonelik' | 'uyusmazliklar' | 'belge-dogrulama' | 'kayip_iptal' | 'loyal_customers' | 'profil-ayarlar' | 'kpi'>('dashboard');
  const [lostAndCancelledJobs, setLostAndCancelledJobs] = useState<any[]>([]);
  
  // Loyalty / Direct Job states
  const [esnaafId, setEsnaafId] = useState<string>('');
  const [loyalCustomers, setLoyalCustomers] = useState<any[]>([]);
  const [searchSeekerEsnaafId, setSearchSeekerEsnaafId] = useState<string>('');
  const [searchSeekerResult, setSearchSeekerResult] = useState<any | null>(null);
  const [isSearchingSeeker, setIsSearchingSeeker] = useState<boolean>(false);
  const [searchSeekerError, setSearchSeekerError] = useState<string>('');
  const [directRequestCustomer, setDirectRequestCustomer] = useState<any | null>(null);
  const [directJobPrice, setDirectJobPrice] = useState<string>('');
  const [directJobCategory, setDirectJobCategory] = useState<string>('ev-temizligi');
  const [directJobDate, setDirectJobDate] = useState<string>('');
  const [directJobDetails, setDirectJobDetails] = useState<string>('');
  const [isSubmittingDirectJob, setIsSubmittingDirectJob] = useState<boolean>(false);
  const [isDemoStats, setIsDemoStats] = useState<boolean>(true);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  // Competitor KPI stats state variables
  const [providerKpiPeriod, setProviderKpiPeriod] = useState<'weekly' | 'monthly' | 'six_months'>('monthly');
  const [providerKpiData, setProviderKpiData] = useState<any>(null);
  const [loadingProviderKpi, setLoadingProviderKpi] = useState<boolean>(false);
  const [providerKpiSelectedCategorySlug, setProviderKpiSelectedCategorySlug] = useState<string>('');

  // Passive Account states
  const [showPassiveAlert, setShowPassiveAlert] = useState<boolean>(false);
  const [isFirstPassiveLoginModalOpen, setIsFirstPassiveLoginModalOpen] = useState<boolean>(false);
  const [registeredSuccessAlert, setRegisteredSuccessAlert] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("registered") === "true") {
        setRegisteredSuccessAlert(true);
      }
    }
  }, []);
  
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; val: number; label: string } | null>(null);
  const [offersList, setOffersList] = useState<any[]>([]);
  const [wonJobs, setWonJobs] = useState<any[]>([]);
  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean;
    acceptedOfferId: string;
    reasonCode: string;
    reasonText: string;
  }>({
    isOpen: false,
    acceptedOfferId: "",
    reasonCode: "",
    reasonText: "",
  });
  const [submittingCancelJob, setSubmittingCancelJob] = useState<boolean>(false);

  // Job Rejection states
  const [rejectingJob, setRejectingJob] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectDetails, setRejectDetails] = useState<string>('');
  const [isRejecting, setIsRejecting] = useState<boolean>(false);

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
  };

  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const showAlert = (title: string, message: string, type: "success" | "error" | "info" = "info") => {
    setAlertModal({
      isOpen: true,
      title,
      message,
      type,
    });
  };

  // Subscription management states
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);
  const [campaignCodeInput, setCampaignCodeInput] = useState('');
  const [validatedCampaign, setValidatedCampaign] = useState<any>(null);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [campaignSuccess, setCampaignSuccess] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [checkoutFormHtml, setCheckoutFormHtml] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [submittingSubscription, setSubmittingSubscription] = useState(false);

  // Card management states
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [newCardHolder, setNewCardHolder] = useState('');
  const [newCardNo, setNewCardNo] = useState('');
  const [newCardMonth, setNewCardMonth] = useState('');
  const [newCardYear, setNewCardYear] = useState('');
  const [addingCard, setAddingCard] = useState(false);
  const [payingCommission, setPayingCommission] = useState(false);

  const [submittingAppointment, setSubmittingAppointment] = useState(false);
  const [appointmentModal, setAppointmentModal] = useState<{
    isOpen: boolean;
    job: any;
    appointmentDate: string;
  }>({
    isOpen: false,
    job: null,
    appointmentDate: '',
  });
  const [submittingStartJob, setSubmittingStartJob] = useState<Record<string, boolean>>({});

  const groupedWonJobs = React.useMemo(() => {
    const groups: { [year: number]: { [month: number]: any[] } } = {};
    wonJobs.forEach(wj => {
      const date = new Date(wj.accepted_at || wj.created_at || new Date());
      const year = date.getFullYear();
      const month = date.getMonth();
      if (!groups[year]) {
        groups[year] = {};
      }
      if (!groups[year][month]) {
        groups[year][month] = [];
      }
      groups[year][month].push(wj);
    });
    Object.keys(groups).forEach(y => {
      const year = Number(y);
      Object.keys(groups[year]).forEach(m => {
        const month = Number(m);
        groups[year][month].sort((a, b) => {
          const dateA = new Date(a.accepted_at || a.created_at || 0);
          const dateB = new Date(b.accepted_at || b.created_at || 0);
          return dateB.getTime() - dateA.getTime();
        });
      });
    });
    return groups;
  }, [wonJobs]);
  const [completedJobs, setCompletedJobs] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [disputesList, setDisputesList] = useState<any[]>([]);

  // Chat states
  const [activeChat, _setActiveChat] = useState<{ jobId: string; offerId: string; customerName: string } | null>(null);
  const activeChatRef = useRef<{ jobId: string; offerId: string; customerName: string } | null>(null);
  const setActiveChat = (val: { jobId: string; offerId: string; customerName: string } | null) => {
    activeChatRef.current = val;
    _setActiveChat(val);
  };
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState<string>("");
  const [loadingChatMessages, setLoadingChatMessages] = useState<boolean>(false);
  const [unreadMessages, setUnreadMessages] = useState<any[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const [unreadDropdownOpen, setUnreadDropdownOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [notificationsDropdownOpen, setNotificationsDropdownOpen] = useState<boolean>(false);

  const notificationsDropdownRef = useRef<HTMLDivElement>(null);
  const messagesDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationsDropdownRef.current && 
        !notificationsDropdownRef.current.contains(event.target as Node)
      ) {
        setNotificationsDropdownOpen(false);
      }
      if (
        messagesDropdownRef.current && 
        !messagesDropdownRef.current.contains(event.target as Node)
      ) {
        setUnreadDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Completion modal states
  const [completingJob, setCompletingJob] = useState<any | null>(null);
  const [declarePrice, setDeclarePrice] = useState<string>('');
  const [declareNote, setDeclareNote] = useState<string>('');
  const [submittingDeclaration, setSubmittingDeclaration] = useState(false);

  // New state variables for manual premium login
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loginError, setLoginError] = useState('');
  const [devOtpSuggested, setDevOtpSuggested] = useState('');
  const [loginMethod, setLoginMethod] = useState<'otp' | 'password'>('password');
  const [password, setPassword] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [isSendingEmailCode, setIsSendingEmailCode] = useState(false);
  const [isVerifyingEmailCode, setIsVerifyingEmailCode] = useState(false);
  const [newProfilePassword, setNewProfilePassword] = useState('');
  const [confirmProfilePassword, setConfirmProfilePassword] = useState('');
  const [isUpdatingProfilePassword, setIsUpdatingProfilePassword] = useState(false);
  const [showResetPasswordPopup, setShowResetPasswordPopup] = useState(false);
  const [popupNewPassword, setPopupNewPassword] = useState('');
  const [popupConfirmPassword, setPopupConfirmPassword] = useState('');
  const [showPopupPassword, setShowPopupPassword] = useState(false);
  const [isSavingPopupPassword, setIsSavingPopupPassword] = useState(false);
  const [isImpersonated, setIsImpersonated] = useState<boolean>(false);

  const handleExitImpersonation = () => {
    localStorage.removeItem("provider_is_logged_in");
    localStorage.removeItem("provider_access_token");
    localStorage.removeItem("provider_phone");
    localStorage.removeItem("provider_impersonated");
    window.close();
    window.location.href = "/";
  };

  const isTabLocked = (tabName: typeof activeTab) => {
    if (profile && profile.accountStatus === 'pending_approval') {
      return false; // Allow passive users to browse all tabs!
    }
    return profile && !profile.isApproved && tabName !== 'belge-dogrulama' && tabName !== 'dashboard';
  };

  const handleTabClick = (tabName: typeof activeTab) => {
    if (isTabLocked(tabName)) {
      showAlert("Belge Onayı Gerekli", "Lütfen öncelikle belgelerinizi yükleyin ve onay sürecinin tamamlanmasını bekleyin.", "info");
      return;
    }
    setActiveTab(tabName);
    setMobileMenuOpen(false);
  };

  // Dashboard metrics calculation helper
  const getDashboardMetrics = () => {
    if (isDemoStats) {
      if (timeRange === 'daily') {
        return {
          totalBids: 3,
          wonJobs: 1,
          lostJobs: 2,
          completedJobs: 1,
          earnings: 25000,
          disputes: 0,
          successRate: 33.3,
          chartData: [5000, 12000, 25000, 18000, 20000, 25000],
          filteredCompletions: [] as any[]
        };
      } else if (timeRange === 'weekly') {
        return {
          totalBids: 18,
          wonJobs: 8,
          lostJobs: 10,
          completedJobs: 6,
          earnings: 180000,
          disputes: 0,
          successRate: 44.4,
          chartData: [20000, 45000, 30000, 80000, 60000, 110000, 180000],
          filteredCompletions: [] as any[]
        };
      } else {
        return {
          totalBids: 70,
          wonJobs: 30,
          lostJobs: 40,
          completedJobs: 20,
          earnings: 600000,
          disputes: 2,
          successRate: 42.8,
          chartData: [100000, 220000, 380000, 450000, 520000, 600000],
          filteredCompletions: [] as any[]
        };
      }
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const getFilterDate = () => {
      if (timeRange === 'daily') return oneDayAgo;
      if (timeRange === 'weekly') return oneWeekAgo;
      return oneMonthAgo;
    };
    const filterDate = getFilterDate();

    const filteredOffers = offersList.filter(o => new Date(o.created_at || o.accepted_at || now) >= filterDate);
    const totalBids = filteredOffers.length;
    const wonJobsCount = wonJobs.filter(wj => new Date(wj.accepted_at || wj.created_at || now) >= filterDate).length;
    const lostJobs = lostAndCancelledJobs.filter(o => new Date(o.created_at || now) >= filterDate).length;
    
    const filteredCompletions = completedJobs.filter(cj => new Date(cj.completed_at || now) >= filterDate);
    const completedCount = filteredCompletions.length;
    const earnings = filteredCompletions.reduce((acc, cj) => acc + (cj.price || 0), 0);
    
    const disputes = disputesList.filter(d => new Date(d.created_at || now) >= filterDate).length;
    const successRate = totalBids > 0 ? Number(((wonJobsCount / totalBids) * 100).toFixed(1)) : 0;

    const chartData = filteredCompletions.map(cj => cj.price || 0);
    if (chartData.length === 0) {
      chartData.push(0);
    }

    return {
      totalBids,
      wonJobs: wonJobsCount,
      lostJobs,
      completedJobs: completedCount,
      earnings,
      disputes,
      successRate,
      chartData,
      filteredCompletions
    };
  };

  const metrics = getDashboardMetrics();

  const [uploadingIdentity, setUploadingIdentity] = useState(false);
  const [uploadingTaxPlate, setUploadingTaxPlate] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'identity' | 'tax') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      showAlert("Hata", "Geçersiz dosya tipi. Yalnızca PNG, JPEG, WEBP ve PDF yükleyebilirsiniz.", "error");
      return;
    }

    if (type === 'identity') setUploadingIdentity(true);
    else setUploadingTaxPlate(true);
    setOnboardingError(null);

    try {
      const presignedRes = await fetch('/api/ortak/upload/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type
        })
      });

      const presignedData = await presignedRes.json();
      if (!presignedRes.ok) {
        throw new Error(presignedData.message || 'Presigned URL oluşturulamadı.');
      }

      const uploadRes = await fetch(presignedData.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type
        },
        body: file
      });

      if (!uploadRes.ok) {
        throw new Error('Dosya sunucuya yüklenemedi.');
      }

      const updatePayload = type === 'identity' 
        ? { identityDocument: presignedData.fileUrl } 
        : { taxPlateDocument: presignedData.fileUrl };

      const updateRes = await fetch('/api/hizmetveren/profil/belgeler', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatePayload)
      });

      const updateData = await updateRes.json();
      if (!updateRes.ok) {
        throw new Error(updateData.message || 'Belge veritabanına kaydedilemedi.');
      }

      await loadDashboardData(token!);
      addLog(`${type === 'identity' ? 'Kimlik belgesi' : 'Vergi levhası'} başarıyla yüklendi.`);
    } catch (err: any) {
      console.error(err);
      setOnboardingError(err.message || 'Dosya yüklenirken bir hata oluştu.');
      addLog(`Belge yükleme hatası: ${err.message}`);
    } finally {
      if (type === 'identity') setUploadingIdentity(false);
      else setUploadingTaxPlate(false);
    }
  };

  // Helper to add system log messages in the console log panel
  const addLog = (msg: string) => {
    setLogMessages((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);
  };

  // Load saved session on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tokenParam = params.get('token');
      const phoneParam = params.get('phone');
      const impersonateParam = params.get('impersonate');
      if (tokenParam) {
        localStorage.setItem('provider_is_logged_in', 'true');
        localStorage.setItem('provider_access_token', tokenParam); // SAVE THE ACTUAL TOKEN
        if (phoneParam) {
          localStorage.setItem('provider_phone', phoneParam);
        }
        if (impersonateParam === 'true') {
          localStorage.setItem('provider_impersonated', 'true');
        }
        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    const savedTokenStatus = localStorage.getItem('provider_is_logged_in');
    const savedActualToken = localStorage.getItem('provider_access_token');
    const savedPhone = localStorage.getItem('provider_phone');
    const savedImpersonated = localStorage.getItem('provider_impersonated') === 'true';
    setIsImpersonated(savedImpersonated);

    const tokenToUse = savedActualToken || (savedTokenStatus ? 'active' : null);

    if (tokenToUse) {
      setToken(tokenToUse);
      if (savedPhone) {
        setPhoneNumber(savedPhone);
        setSelectedPhone(savedPhone);
      }
      loadDashboardData(tokenToUse);
    }
  }, []);

  // Countdown timer for resending OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle manual/Simulator Send OTP
  const handleSendOtp = async (phoneToUse?: string) => {
    const rawPhone = phoneToUse || phoneNumber;
    if (!rawPhone) {
      setLoginError('Lütfen geçerli bir telefon numarası giriniz.');
      return;
    }

    const formattedPhone = normalizePhone(rawPhone);
    setLoading(true);
    setLoginError('');
    addLog(`OTP gönderim isteği başlatıldı: ${formattedPhone}`);

    // If it's Kemal Usta or Aylin Teknik, we suggest their live production OTP codes to prevent blockages
    if (formattedPhone === '+905329999901') {
      setDevOtpSuggested('915960');
    } else if (formattedPhone === '+905329999902') {
      setDevOtpSuggested('673334');
    } else {
      setDevOtpSuggested('');
    }

    try {
      const sendRes = await fetch('/api/ortak/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone }),
      });
      
      const sendData = await sendRes.json();
      if (!sendRes.ok) {
        throw new Error(sendData.error?.message || 'OTP gönderimi başarısız.');
      }
      
      setOtpSent(true);
      setCountdown(60);
      setPhoneNumber(formattedPhone);
      addLog(`OTP başarıyla gönderildi!`);

      // Pre-fill if devOtpCode is provided by dev environment backend
      if (sendData.devOtpCode) {
        setOtpCode(sendData.devOtpCode);
        addLog(`Dev ortamı: Doğrulama kodu otomatik dolduruldu: ${sendData.devOtpCode}`);
      }
    } catch (err: any) {
      setLoginError(err.message);
      addLog(`Hata: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle manual OTP verify
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setLoginError('Lütfen 6 haneli doğrulama kodunu giriniz.');
      return;
    }

    setLoading(true);
    setLoginError('');
    addLog(`OTP doğrulama isteği başlatıldı: ${phoneNumber} - Kod: ${otpCode}`);

    try {
      const verifyRes = await fetch('/api/ortak/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, code: otpCode, role: 'service_provider' }),
      });
      
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error?.message || 'OTP doğrulaması başarısız.');
      }
      
      const accessToken = verifyData.accessToken;
      setToken(accessToken);
      localStorage.setItem('provider_is_logged_in', 'true');
      localStorage.setItem('provider_access_token', accessToken); // SAVE THE ACTUAL TOKEN
      localStorage.setItem('provider_phone', phoneNumber);
      addLog(`JWT Access Token alındı. Başarıyla giriş yapıldı!`);
      
      if (verifyData.resetPasswordRequired) {
        setShowResetPasswordPopup(true);
      }
      
      await loadDashboardData(accessToken);
    } catch (err: any) {
      setLoginError(err.message);
      addLog(`Hata: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginIdentifier) {
      setLoginError("Lütfen telefon numaranızı veya e-posta adresinizi girin.");
      return;
    }
    if (!password) {
      setLoginError("Lütfen şifrenizi girin.");
      return;
    }
    
    setLoading(true);
    setLoginError('');
    addLog(`Şifreli giriş isteği başlatıldı: ${loginIdentifier}`);
    
    try {
      const loginRes = await fetch('/api/ortak/auth/provider-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loginIdentifier, password }),
      });
      
      const loginData = await loginRes.json();
      if (!loginRes.ok) {
        throw new Error(loginData.message || 'Giriş başarısız.');
      }
      
      const accessToken = loginData.accessToken;
      setToken(accessToken);
      localStorage.setItem('provider_is_logged_in', 'true');
      localStorage.setItem('provider_access_token', accessToken);
      localStorage.setItem('provider_phone', loginIdentifier);
      addLog(`Şifreli giriş başarılı! Jetonlar alındı.`);
      
      await loadDashboardData(accessToken);
    } catch (err: any) {
      setLoginError(err.message);
      addLog(`Hata: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailVerificationCode = async () => {
    if (!editEmail) return;
    setIsSendingEmailCode(true);
    try {
      const res = await fetch('/api/hizmetveren/profil/email/send-code', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: editEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setEmailVerificationSent(true);
        showAlert('Başarılı', 'Doğrulama kodu e-posta adresinize gönderildi.', 'success');
      } else {
        showAlert('Hata', data.message || 'Kod gönderilemedi.', 'error');
      }
    } catch (err) {
      showAlert('Hata', 'İstek gönderilirken bir hata oluştu.', 'error');
    } finally {
      setIsSendingEmailCode(false);
    }
  };

  const handleVerifyEmailCode = async () => {
    if (!editEmail || !emailCode) return;
    setIsVerifyingEmailCode(true);
    try {
      const res = await fetch('/api/hizmetveren/profil/email/verify-code', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: editEmail, code: emailCode })
      });
      const data = await res.json();
      if (res.ok) {
        showAlert('Başarılı', 'E-posta adresiniz başarıyla doğrulandı!', 'success');
        setEmailVerificationSent(false);
        setEmailCode('');
        if (token) loadDashboardData(token);
      } else {
        showAlert('Hata', data.message || 'Doğrulama başarısız.', 'error');
      }
    } catch (err) {
      showAlert('Hata', 'Doğrulama yapılırken bir hata oluştu.', 'error');
    } finally {
      setIsVerifyingEmailCode(false);
    }
  };

  const handleUpdateProfilePassword = async () => {
    if (!newProfilePassword) return;
    if (newProfilePassword !== confirmProfilePassword) {
      showAlert('Hata', 'Şifreler uyuşmuyor.', 'error');
      return;
    }
    if (newProfilePassword.length < 6) {
      showAlert('Hata', 'Şifre en az 6 karakter olmalıdır.', 'error');
      return;
    }
    setIsUpdatingProfilePassword(true);
    try {
      const res = await fetch('/api/hizmetveren/profil', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          city: editCity,
          serviceDistricts: editDistricts.split(',').map(s => s.trim()).filter(Boolean),
          password: newProfilePassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        showAlert('Başarılı', 'Giriş şifreniz başarıyla güncellendi.', 'success');
        setNewProfilePassword('');
        setConfirmProfilePassword('');
        if (token) loadDashboardData(token);
      } else {
        showAlert('Hata', data.message || 'Şifre güncellenemedi.', 'error');
      }
    } catch (err) {
      showAlert('Hata', 'Şifre güncellenirken bir hata oluştu.', 'error');
    } finally {
      setIsUpdatingProfilePassword(false);
    }
  };

  const handleSavePopupPassword = async () => {
    if (!popupNewPassword) return;
    if (popupNewPassword !== popupConfirmPassword) {
      showAlert('Hata', 'Şifreler uyuşmuyor.', 'error');
      return;
    }
    if (popupNewPassword.length < 6) {
      showAlert('Hata', 'Şifre en az 6 karakter olmalıdır.', 'error');
      return;
    }
    setIsSavingPopupPassword(true);
    try {
      const res = await fetch('/api/hizmetveren/profil', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          city: editCity || 'Adana',
          serviceDistricts: editDistricts ? editDistricts.split(',').map(s => s.trim()).filter(Boolean) : [],
          password: popupNewPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        showAlert('Başarılı', 'Giriş şifreniz başarıyla kaydedildi!', 'success');
        setShowResetPasswordPopup(false);
        setPopupNewPassword('');
        setPopupConfirmPassword('');
        if (token) loadDashboardData(token);
      } else {
        showAlert('Hata', data.message || 'Şifre kaydedilemedi.', 'error');
      }
    } catch (err) {
      showAlert('Hata', 'Şifre kaydedilirken bir hata oluştu.', 'error');
    } finally {
      setIsSavingPopupPassword(false);
    }
  };

  // Simulate login via dropdown (with hardcoded OTP bypass for prod simulated masters)
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
      
      let devOtpCode = sendData.devOtpCode;
      if (!devOtpCode) {
        if (phone === '+905329999901') {
          devOtpCode = '915960';
        } else if (phone === '+905329999902') {
          devOtpCode = '673334';
        }
      }
      
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
      localStorage.setItem('provider_is_logged_in', 'true');
      localStorage.setItem('provider_access_token', accessToken); // SAVE THE ACTUAL TOKEN
      localStorage.setItem('provider_phone', phone);
      addLog(`JWT Access Token alındı. Başarıyla giriş yapıldı!`);
      
      await loadDashboardData(accessToken);
      
    } catch (err: any) {
      addLog(`Hata: ${err.message}`);
      showAlert("Hata", err.message, "error");
    } finally {
      setLoading(false);
    }
  };


  // Fetch unread messages for the provider
  const fetchUnreadMessages = async (currentToken?: string) => {
    const activeToken = currentToken || token;
    if (!activeToken) return;
    try {
      const res = await fetch('/api/hizmetveren/okunmamis-mesajlar', {
        headers: { 'Authorization': `Bearer ${activeToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadMessages(data.slice(0, 20)); // Limit to 20 messages
        
        const lastReadTimeStr = localStorage.getItem("provider_last_read_message_time");
        if (lastReadTimeStr) {
          const lastReadTime = parseInt(lastReadTimeStr, 10);
          const unreadCount = data.filter((m: any) => new Date(m.createdAt).getTime() > lastReadTime).length;
          setUnreadMessagesCount(unreadCount);
        } else {
          setUnreadMessagesCount(data.length);
        }
      }
    } catch (err) {
      console.error('Fetch unread messages failed:', err);
    }
  };

  const fetchNotifications = async (currentToken?: string) => {
    const activeToken = currentToken || token;
    if (!activeToken) return;
    try {
      const res = await fetch("/api/ortak/bildirimler/gecmis", {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      if (res.ok) {
        const result = await res.json();
        const data = result.data || [];
        setNotifications(data.slice(0, 10)); // Keep max 10 notifications
        
        const lastReadTimeStr = localStorage.getItem("provider_last_read_notif_time");
        if (lastReadTimeStr) {
          const lastReadTime = parseInt(lastReadTimeStr, 10);
          const unreadCount = data.filter((n: any) => new Date(n.sent_at).getTime() > lastReadTime).length;
          setUnreadNotificationsCount(unreadCount);
        } else {
          setUnreadNotificationsCount(data.length);
        }
      }
    } catch (err) {
      console.error("Fetch notifications failed:", err);
    }
  };

  const toggleMessagesDropdown = () => {
    const nextState = !unreadDropdownOpen;
    setUnreadDropdownOpen(nextState);
    if (nextState) {
      setUnreadMessagesCount(0);
      localStorage.setItem("provider_last_read_message_time", Date.now().toString());
      setNotificationsDropdownOpen(false); // close notifications
    }
  };

  const toggleNotificationsDropdown = () => {
    const nextState = !notificationsDropdownOpen;
    setNotificationsDropdownOpen(nextState);
    if (nextState) {
      setUnreadNotificationsCount(0);
      localStorage.setItem("provider_last_read_notif_time", Date.now().toString());
      setUnreadDropdownOpen(false); // close messages
    }
  };

  // Mark message as read
  const handleMarkMessageAsRead = async (messageId: string) => {
    const activeToken = token;
    if (!activeToken) return;
    try {
      const res = await fetch(`/api/ortak/mesajlar/${messageId}/okundu`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${activeToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        setUnreadMessages(prev => prev.filter(m => m.id !== messageId));
      }
    } catch (err) {
      console.error('Mark message as read failed:', err);
    }
  };


  // Load dashboard data
  const loadDashboardData = async (accessToken: string) => {
    try {
      const profileRes = await fetch('/api/hizmetveren/profil', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const profileData = await profileRes.json();
      if (profileRes.ok) {
        setProfile(profileData);
        setEsnaafId(profileData.esnaaf_id || '');
        setEditName(profileData.name || '');
        setEditCity(profileData.city || '');
        setEditDistricts(profileData.serviceDistricts ? profileData.serviceDistricts.join(', ') : '');
        setEditBio(profileData.bio || '');
        setEditEmail(profileData.email || '');
        if (!profileData.hasPassword) {
          setShowResetPasswordPopup(true);
        }
        addLog(`Profil bilgileri yüklendi: Onay Durumu: ${profileData.isApproved}`);
        if (profileData.accountStatus === 'pending_approval') {
          setActiveTab('dashboard');
          setShowPassiveAlert(true);
          const hasSeenModal = localStorage.getItem('is_first_passive_login');
          if (!hasSeenModal) {
            setIsFirstPassiveLoginModalOpen(true);
            localStorage.setItem('is_first_passive_login', 'true');
          }
        } else if (!profileData.isApproved) {
          setActiveTab('belge-dogrulama');
          setShowPassiveAlert(false);
        } else {
          setShowPassiveAlert(false);
        }
      }

      const quotaRes = await fetch('/api/hizmetveren/kota', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const quotaData = await quotaRes.json();
      if (quotaRes.ok) {
        setQuota(quotaData);
        addLog(`Kota durumu yüklendi: Paket: ${quotaData.packageName.toUpperCase()}, Kullanım: ${quotaData.used}/${quotaData.limit || 'Sınırsız'}`);
        initSocket(quotaData.providerId, profileData?.userId);
      }

      const jobsRes = await fetch('/api/hizmetveren/gelen-isler', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const jobsData = await jobsRes.json();
      if (jobsRes.ok) {
        setJobs(jobsData);
        addLog(`${jobsData.length} adet yeni gelen iş listelendi.`);
      }

      await fetchUnreadMessages(accessToken);
      await fetchNotifications(accessToken);
      await fetchLoyalCustomers(accessToken);
    } catch (err: any) {
      addLog(`Dashboard yükleme hatası: ${err.message}`);
    }
  };

  const handleSaveProfile = async () => {
    if (!token) return;
    if (!editName.trim()) {
      showAlert('Hata', 'Ad soyad alanı boş bırakılamaz.', 'error');
      return;
    }
    if (!editCity.trim()) {
      showAlert('Hata', 'Şehir alanı boş bırakılamaz.', 'error');
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await fetch('/api/hizmetveren/profil', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editName,
          city: editCity,
          serviceDistricts: editDistricts.split(',').map(s => s.trim()).filter(Boolean),
          description: editBio
        })
      });

      const data = await res.json();

      if (res.ok) {
        showAlert('Başarılı', 'Profil bilgileriniz başarıyla güncellendi.', 'success');
        setProfile(data.provider || data);
        loadDashboardData(token);
      } else {
        showAlert('Hata', data.error?.message || data.message || 'Profil güncellenemedi.', 'error');
      }
    } catch (err: any) {
      showAlert('Hata', 'Profil güncellenirken bir hata oluştu.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const fetchLoyalCustomers = async (accessToken: string) => {
    try {
      const res = await fetch('/api/ortak/favoriler/musterilerim', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLoyalCustomers(data);
      }
    } catch (err) {
      console.error('Fetch loyal customers failed:', err);
    }
  };

  const handleSearchSeeker = async () => {
    if (!searchSeekerEsnaafId) return;
    setIsSearchingSeeker(true);
    setSearchSeekerError('');
    setSearchSeekerResult(null);
    try {
      const res = await fetch(`/api/ortak/favoriler/profil-bul/${searchSeekerEsnaafId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchSeekerResult(data);
      } else {
        const err = await res.json();
        setSearchSeekerError(err.error?.message || 'Müşteri bulunamadı.');
      }
    } catch (err) {
      setSearchSeekerError('Arama sırasında bir hata oluştu.');
    } finally {
      setIsSearchingSeeker(false);
    }
  };

  const handleSendLoyaltyRequest = async (seekerEsnaafId: string) => {
    try {
      const res = await fetch('/api/ortak/favoriler/ekle-istek', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ esnaafId: seekerEsnaafId })
      });
      if (res.ok) {
        showAlert('Başarılı', 'Sadık müşteri daveti başarıyla gönderildi! Müşteri onayladığında listenizde görünecektir.', 'success');
        setSearchSeekerResult(null);
        setSearchSeekerEsnaafId('');
      } else {
        const err = await res.json();
        showAlert('Hata', err.error?.message || 'Davet gönderilemedi.', 'error');
      }
    } catch (err) {
      showAlert('Hata', 'Davet gönderilirken bir hata oluştu.', 'error');
    }
  };

  const handleCreateDirectJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directRequestCustomer) return;
    if (profile && profile.accountStatus === 'pending_approval') {
      showAlert(
        "Özellik Kısıtlı",
        "Bu özellik sadece onaylı hizmet verenlere açıktır. Hesabınızın onaylanma süreci devam etmektedir.",
        "info"
      );
      return;
    }
    setIsSubmittingDirectJob(true);
    try {
      const res = await fetch('/api/hizmetveren/dogrudan-is-karti', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          seekerId: directRequestCustomer.seeker_id,
          categorySlug: directJobCategory,
          price: Number(directJobPrice),
          appointmentDate: directJobDate,
          details: directJobDetails
        })
      });
      if (res.ok) {
        showAlert('Başarılı', 'Doğrudan iş teklif kartı başarıyla oluşturuldu ve müşteriye gönderildi!', 'success');
        setDirectRequestCustomer(null);
        setDirectJobPrice('');
        setDirectJobDate('');
        setDirectJobDetails('');
        if (token) fetchLoyalCustomers(token);
      } else {
        const err = await res.json();
        showAlert('Hata', err.error?.message || 'Teklif oluşturulamadı.', 'error');
      }
    } catch (err) {
      showAlert('Hata', 'Teklif oluşturulurken bir hata oluştu.', 'error');
    } finally {
      setIsSubmittingDirectJob(false);
    }
  };

  // Socket.io integration
  const initSocket = (providerId: string, userId?: string) => {
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
      if (userId) {
        socket.emit('join_user', { userId });
        addLog(`Soket odasına katılım yapıldı: user_${userId}`);
        socket.emit('join_provider', { providerId: userId }); 
        addLog(`Soket odasına katılım yapıldı: provider_${userId}`);
      }
    });

    socket.on('new_job', (newJob: Job) => {
      addLog(`🔔 [YENİ İŞ GELDİ] ${newJob.categoryName} - Konum: ${newJob.district}`);
      setJobs((prev) => {
        if (prev.some((j) => j.id === newJob.id)) return prev;
        return [newJob, ...prev];
      });
    });

    socket.on('new_message', (msg: any) => {
      addLog(`💬 [YENİ MESAJ] Room: job_${msg.jobId}`);
      setChatMessages((prev) => {
        if (prev.some(m => m.id === msg.id)) return prev;
        const currentChat = activeChatRef.current;
        if (currentChat && msg.jobId === currentChat.jobId && msg.offerId === currentChat.offerId) {
          return [...prev, {
            id: msg.id,
            job_id: msg.jobId,
            offer_id: msg.offerId,
            sender_id: msg.senderId,
            receiver_id: msg.receiverId,
            content: msg.content,
            content_type: msg.contentType,
            is_read: msg.isRead,
            created_at: msg.createdAt
          }];
        }
        return prev;
      });
    });

    socket.on('new_message_notification', (noti: any) => {
      addLog(`🔔 [YENİ MESAJ BİLDİRİMİ] ${noti.customerName}: ${noti.content.substring(0, 20)}...`);
      setUnreadMessages((prev) => {
        if (prev.some(m => m.id === noti.id)) return prev;
        const newUnread = [noti, ...prev];
        return newUnread.slice(0, 20); // Keep max 20
      });
      
      setUnreadDropdownOpen(isOpen => {
        if (!isOpen) {
          setUnreadMessagesCount(c => c + 1);
        } else {
          localStorage.setItem("provider_last_read_message_time", Date.now().toString());
        }
        return isOpen;
      });

      setOffersList((prev) => {
        return prev.map(off => {
          if (off.id === noti.offerId) {
            return { ...off, hasMessages: true };
          }
          return off;
        });
      });
    });

    socket.on('new_notification', (notif: any) => {
      addLog(`🔔 [YENİ BİLDİRİM] ${notif.title || 'Bildirim'}`);
      setNotifications((prev) => {
        if (prev.some(n => n.id === notif.id)) return prev;
        const unifiedNotif = {
          id: notif.id,
          sent_at: notif.sentAt || new Date().toISOString(),
          payload: notif.payload || { title: notif.title, body: notif.body }
        };
        const newList = [unifiedNotif, ...prev];
        return newList.slice(0, 10); // Keep max 10
      });
      
      setNotificationsDropdownOpen(isOpen => {
        if (!isOpen) {
          setUnreadNotificationsCount(c => c + 1);
        } else {
          localStorage.setItem("provider_last_read_notif_time", Date.now().toString());
        }
        return isOpen;
      });
    });

    socket.on('offer_cancelled', (data: { jobId: string; offerId: string }) => {
      addLog(`❌ [TEKLİF İPTAL EDİLDİ] Hizmet alan başka bir teklifi kabul ettiği için bu iş iptal edildi. Job ID: ${data.jobId}`);
      setWonJobs((prev) => prev.filter((w) => w.offerId !== data.offerId && w.job.id !== data.jobId));
      if (token) {
        fetchTabDependencies('kayip_iptal', token);
      }
      showAlert(
        'İş İptal Edildi',
        'Hizmet alan başka bir firmayı seçtiği için kazandığınız iş iptal edilmiştir.',
        'error'
      );
    });

    socket.on('offer_accepted_notification', (data: { jobId: string; offerId: string; isReAccept?: boolean }) => {
      const isReAccept = !!data.isReAccept;
      addLog(isReAccept 
        ? `🎉 [TEKLİF YENİDEN KABUL EDİLDİ] Müşteri teklifinizi yeniden kabul etti! Job ID: ${data.jobId}`
        : `🎉 [TEKLİF KABUL EDİLDİ] Teklifiniz kabul edildi! Job ID: ${data.jobId}`
      );
      
      // Instantly remove from the lost and cancelled list
      setLostAndCancelledJobs((prev) => prev.filter((o) => o.id !== data.offerId));
      
      if (token) {
        fetchTabDependencies('kazanilanlar', token);
        fetchTabDependencies('kayip_iptal', token);
        fetchTabDependencies('abonelik', token);
      }
      
      showAlert(
        isReAccept ? 'Teklifiniz Yeniden Kabul Edildi!' : 'Teklifiniz Kabul Edildi!',
        isReAccept 
          ? 'Müşteri teklifinizi yeniden kabul etti! Müşteri bilgileri "Kazanılan İşler" sekmesine geri taşındı.'
          : 'Bir hizmet alan teklifinizi kabul etti. Müşteri bilgileri "Kazanılan İşler" sekmesine eklendi.',
        'success'
      );
    });

    socket.on('job_cancelled', (data: { jobId: string }) => {
      addLog(`ℹ️ [İLAN İPTAL EDİLDİ] Müşteri talebini tamamen iptal etti. Job ID: ${data.jobId}`);
      setJobs((prev) => prev.filter((j) => j.id !== data.jobId));
      setOffersList((prev) => prev.filter((o) => o.job.id !== data.jobId));
      if (token) {
        fetchTabDependencies('kayip_iptal', token);
      }
      showAlert(
        'İlan İptal Edildi',
        'Teklif verdiğiniz veya incelediğiniz bir ilan müşteri tarafından iptal edildi.',
        'info'
      );
    });

    socket.on('job_closed', (data: { jobId: string }) => {
      addLog(`ℹ️ [İŞ ALINDI / KAPATILDI] Bu ilan için başka bir teklif kabul edildi. Job ID: ${data.jobId}`);
      setJobs((prev) => prev.filter((j) => j.id !== data.jobId));
    });

    socket.on('disconnect', () => {
      addLog(`WebSocket bağlantısı kesildi.`);
    });
  };

  const fetchTabDependencies = async (tab: string, currentToken: string) => {
    if (!currentToken) return;
    setLoading(true);
    try {
      if (tab === 'dashboard') {
        const [offersRes, wonRes, completedRes, disputesRes, lostRes] = await Promise.all([
          fetch('/api/hizmetveren/teklifler', { headers: { 'Authorization': `Bearer ${currentToken}` } }),
          fetch('/api/hizmetveren/kazanilan-isler', { headers: { 'Authorization': `Bearer ${currentToken}` } }),
          fetch('/api/hizmetveren/tamamlanan-isler', { headers: { 'Authorization': `Bearer ${currentToken}` } }),
          fetch('/api/hizmetveren/uyusmazliklar', { headers: { 'Authorization': `Bearer ${currentToken}` } }),
          fetch('/api/hizmetveren/teklifler/kayip-iptal', { headers: { 'Authorization': `Bearer ${currentToken}` } }),
        ]);

        if (offersRes.ok) {
          const offersData = await offersRes.json();
          setOffersList(offersData);
        }
        if (wonRes.ok) {
          const wonData = await wonRes.json();
          setWonJobs(wonData);
        }
        if (completedRes.ok) {
          const completedData = await completedRes.json();
          setCompletedJobs(completedData);
        }
        if (disputesRes.ok) {
          const disputesData = await disputesRes.json();
          setDisputesList(disputesData);
        }
        if (lostRes.ok) {
          const lostData = await lostRes.json();
          setLostAndCancelledJobs(lostData);
        }
        addLog('Dashboard verileri başarıyla güncellendi.');
      } else if (tab === 'firsatlar') {
        const res = await fetch('/api/hizmetveren/gelen-isler', {
          headers: { 'Authorization': `Bearer ${currentToken}` },
        });
        const data = await res.json();
        if (res.ok) {
          setJobs(data);
          addLog(`${data.length} adet yeni gelen iş listelendi.`);
        }
      } else if (tab === 'teklifler') {
        const res = await fetch('/api/hizmetveren/teklifler', {
          headers: { 'Authorization': `Bearer ${currentToken}` },
        });
        const data = await res.json();
        if (res.ok) {
          setOffersList(data);
          addLog(`${data.length} adet verilmiş teklif yüklendi.`);
        }
      } else if (tab === 'kazanilanlar') {
        const res = await fetch('/api/hizmetveren/kazanilan-isler', {
          headers: { 'Authorization': `Bearer ${currentToken}` },
        });
        const data = await res.json();
        if (res.ok) {
          setWonJobs(data);
          addLog(`${data.length} adet kazanılan iş yüklendi.`);
        }
      } else if (tab === 'tamamlananlar') {
        const res = await fetch('/api/hizmetveren/tamamlanan-isler', {
          headers: { 'Authorization': `Bearer ${currentToken}` },
        });
        const data = await res.json();
        if (res.ok) {
          setCompletedJobs(data);
          addLog(`${data.length} adet tamamlanan iş yüklendi.`);
        }
      } else if (tab === 'yorumlar') {
        const res = await fetch('/api/hizmetveren/yorumlar', {
          headers: { 'Authorization': `Bearer ${currentToken}` },
        });
        const data = await res.json();
        if (res.ok) {
          setReviews(data);
          addLog(`${data.length} adet yorum yüklendi.`);
        }
      } else if (tab === 'uyusmazliklar') {
        const res = await fetch('/api/hizmetveren/uyusmazliklar', {
          headers: { 'Authorization': `Bearer ${currentToken}` },
        });
        const data = await res.json();
        if (res.ok) {
          setDisputesList(data);
          addLog(`${data.length} adet uyuşmazlık yüklendi.`);
        }
      } else if (tab === 'abonelik') {
        const subRes = await fetch('/api/hizmetveren/abonelik', {
          headers: { 'Authorization': `Bearer ${currentToken}` },
        });
        if (subRes.ok) {
          const subData = await subRes.json();
          setSubscriptionDetails(subData);
          addLog('Abonelik ve kota bilgileri yüklendi.');
        }

        const pkgsRes = await fetch('/api/ortak/paketler', {
          headers: { 'Authorization': `Bearer ${currentToken}` },
        });
        if (pkgsRes.ok) {
          const pkgsData = await pkgsRes.json();
          setAvailablePackages(pkgsData);
        }

        fetchSavedCards(currentToken);
      } else if (tab === 'kayip_iptal') {
        const res = await fetch('/api/hizmetveren/teklifler/kayip-iptal', {
          headers: { 'Authorization': `Bearer ${currentToken}` },
        });
        const data = await res.json();
        if (res.ok) {
          setLostAndCancelledJobs(data);
          addLog(`${data.length} adet kaybedilen ve iptal edilen iş yüklendi.`);
        }
      }
    } catch (err: any) {
      addLog(`Hata (${tab}): ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatMessages = async (jobId: string, offerId: string) => {
    if (!token) return;
    setLoadingChatMessages(true);
    try {
      const res = await fetch(`/api/ortak/mesajlar/${jobId}/${offerId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data);
      }
    } catch (err) {
      console.error("Fetch chat messages failed:", err);
    } finally {
      setLoadingChatMessages(false);
    }
  };

  const handleValidateCampaign = async () => {
    if (!token || !campaignCodeInput.trim() || !selectedPackage) return;
    setCampaignError(null);
    setCampaignSuccess(null);
    try {
      const res = await fetch('/api/hizmetveren/kampanya/dogrula', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: campaignCodeInput.trim(),
          packageType: selectedPackage.type,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setValidatedCampaign(data.campaign);
        setCampaignSuccess(`Kampanya kodu uygulandı! İndirim: ${data.campaign.value} TL`);
      } else {
        setCampaignError(data.error?.message || 'Kampanya kodu geçersiz.');
      }
    } catch (err) {
      setCampaignError('Bir ağ hatası oluştu.');
    }
  };

  const fetchSavedCards = async (currentToken = token) => {
    if (!currentToken) return;
    setLoadingCards(true);
    try {
      const res = await fetch('/api/hizmetveren/kartlar', {
        headers: { 'Authorization': `Bearer ${currentToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setSavedCards(data);
      }
    } catch (err: any) {
      addLog(`Kartlar yüklenirken hata: ${err.message}`);
    } finally {
      setLoadingCards(false);
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!newCardHolder || !newCardNo || !newCardMonth || !newCardYear) {
      showAlert("Hata", "Lütfen tüm kart alanlarını doldurunuz.", "error");
      return;
    }
    setAddingCard(true);
    try {
      const res = await fetch('/api/hizmetveren/kartlar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          cardHolderName: newCardHolder,
          cardNumber: newCardNo,
          expireMonth: newCardMonth,
          expireYear: newCardYear,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showAlert("Başarılı", "Kartınız güvenli bir şekilde kaydedildi.", "success");
        setShowAddCardModal(false);
        setNewCardHolder('');
        setNewCardNo('');
        setNewCardMonth('');
        setNewCardYear('');
        fetchSavedCards(token);
      } else {
        showAlert("Hata", data.error?.message || data.message || "Kart kaydedilemedi.", "error");
      }
    } catch (err: any) {
      showAlert("Hata", "Kart kaydı sırasında bir ağ hatası oluştu.", "error");
    } finally {
      setAddingCard(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!token) return;
    if (!confirm("Bu ödeme kartını silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/hizmetveren/kartlar/${cardId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showAlert("Başarılı", "Kartınız başarıyla silindi.", "success");
        fetchSavedCards(token);
      } else {
        showAlert("Hata", data.error?.message || "Kart silinemedi.", "error");
      }
    } catch (err) {
      showAlert("Hata", "Bir ağ hatası oluştu.", "error");
    }
  };

  const handleSetPrimaryCard = async (cardId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/hizmetveren/kartlar/${cardId}/varsayilan`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showAlert("Başarılı", "Varsayılan ödeme kartınız güncellendi.", "success");
        fetchSavedCards(token);
      } else {
        showAlert("Hata", data.error?.message || "Varsayılan kart güncellenemedi.", "error");
      }
    } catch (err) {
      showAlert("Hata", "Bir ağ hatası oluştu.", "error");
    }
  };

  const handlePayCommission = async () => {
    if (!token) return;
    setPayingCommission(true);
    try {
      const res = await fetch('/api/hizmetveren/abonelik/komisyon-ode', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showAlert("Başarılı", data.message || "Komisyon borcunuz başarıyla tahsil edilmiştir.", "success");
        fetchTabDependencies('abonelik', token);
      } else {
        showAlert("Tahsilat Hatası", data.error?.message || data.message || "Ödeme alınamadı. Lütfen kart limitinizi ve bilgilerinizi kontrol edin.", "error");
      }
    } catch (err) {
      showAlert("Hata", "Ödeme sırasında bir ağ hatası oluştu.", "error");
    } finally {
      setPayingCommission(false);
    }
  };

  const handleStartSubscription = async (packageType: string) => {
    if (!token) return;
    setSubmittingSubscription(true);
    try {
      const payload: any = { packageType };
      if (validatedCampaign) {
        payload.campaignCode = validatedCampaign.code;
      }
      
      const res = await fetch('/api/hizmetveren/abonelik/baslat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.status === 'trial' || data.status === 'active') {
          showAlert("Başarılı", data.message || 'Aboneliğiniz başarıyla aktifleştirildi!', "success");
          setSelectedPackage(null);
          setValidatedCampaign(null);
          setCampaignCodeInput('');
          fetchTabDependencies('abonelik', token);
          loadDashboardData(token);
        } else {
          setCheckoutFormHtml(data.checkoutFormContent);
        }
      } else {
        showAlert("Hata", data.error?.message || 'Abonelik başlatılamadı.', "error");
      }
    } catch (err) {
      showAlert("Hata", 'Abonelik başlatılırken bir hata oluştu.', "error");
    } finally {
      setSubmittingSubscription(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!token) return;
    showConfirm(
      'Abonelik İptali',
      'Aboneliğinizi iptal etmek istediğinize emin misiniz? Dönem sonuna kadar kullanımınız devam edecektir.',
      async () => {
        try {
          const res = await fetch('/api/hizmetveren/abonelik/iptal', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
          });
          const data = await res.json();
          if (res.ok && data.success) {
            showAlert('Başarılı', data.message || 'Aboneliğiniz iptal edildi.', 'success');
            fetchTabDependencies('abonelik', token);
          } else {
            showAlert('Hata', data.error?.message || 'İptal işlemi başarısız.', 'error');
          }
        } catch (err) {
          showAlert('Hata', 'Abonelik iptal edilirken bir hata oluştu.', 'error');
        }
      }
    );
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat || !newMessageText.trim() || !token) return;

    if (profile && profile.accountStatus === 'pending_approval') {
      showAlert(
        "Özellik Kısıtlı",
        "Bu özellik sadece onaylı hizmet verenlere açıktır. Hesabınızın onaylanma süreci devam etmektedir.",
        "info"
      );
      return;
    }

    const text = newMessageText.trim();
    setNewMessageText("");

    try {
      const res = await fetch("/api/ortak/mesajlar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          jobId: activeChat.jobId,
          offerId: activeChat.offerId,
          content: text,
          contentType: "text"
        })
      });

      if (res.ok) {
        const msg = await res.json();
        setChatMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      } else {
        const err = await res.json();
        showAlert("Hata", err.message || "Mesaj gönderilemedi.", "error");
      }
    } catch (err) {
      console.error("Send message error:", err);
    }
  };

  const handleDeclareCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !completingJob) return;

    const priceNum = Number(declarePrice.replace(/\D/g, ''));
    if (!priceNum || priceNum < 1) {
      showAlert("Uyarı", "Lütfen geçerli bir beyan ücreti giriniz.", "info");
      return;
    }

    setSubmittingDeclaration(true);
    try {
      const res = await fetch('/api/hizmetveren/tamamlama/beyan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          jobId: completingJob.job.id,
          price: priceNum,
          note: declareNote
        }),
      });

      if (res.ok) {
        showAlert("Başarılı", "İş tamamlanma beyanı başarıyla gönderildi!", "success");
        setCompletingJob(null);
        setDeclarePrice('');
        setDeclareNote('');
        fetchTabDependencies(activeTab, token);
      } else {
        const data = await res.json();
        showAlert("Hata", data.message || "Beyan gönderilemedi.", "error");
      }
    } catch (err: any) {
      showAlert("Hata", err.message || "Bir hata oluştu.", "error");
    } finally {
      setSubmittingDeclaration(false);
    }
  };

  const handleCreateOrUpdateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !appointmentModal.job || !appointmentModal.appointmentDate) return;

    setSubmittingAppointment(true);
    try {
      const res = await fetch(`/api/hizmetveren/kazanilan-isler/${appointmentModal.job.id}/randevu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          appointmentAt: new Date(appointmentModal.appointmentDate).toISOString(),
        }),
      });

      if (res.ok) {
        showAlert("Başarılı", "Randevu başarıyla kaydedildi!", "success");
        setAppointmentModal({ isOpen: false, job: null, appointmentDate: '' });
        fetchTabDependencies(activeTab, token);
      } else {
        const data = await res.json();
        showAlert("Hata", data.message || "Randevu kaydedilemedi.", "error");
      }
    } catch (err: any) {
      showAlert("Hata", err.message || "Bir hata oluştu.", "error");
    } finally {
      setSubmittingAppointment(false);
    }
  };

  const handleStartJob = (wj: any) => {
    if (!token) return;
    showConfirm(
      "İşi Başlat",
      "İşi başlatmak istediğinize emin misiniz? Müşteriye bilgi verilecektir.",
      async () => {
        setSubmittingStartJob(prev => ({ ...prev, [wj.id]: true }));
        try {
          const res = await fetch(`/api/hizmetveren/kazanilan-isler/${wj.id}/basla`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });

          if (res.ok) {
            showAlert("Başarılı", "İş başarıyla başlatıldı!", "success");
            fetchTabDependencies(activeTab, token);
          } else {
            const data = await res.json();
            showAlert("Hata", data.message || "İş başlatılamadı.", "error");
          }
        } catch (err: any) {
          showAlert("Hata", err.message || "Bir hata oluştu.", "error");
        } finally {
          setSubmittingStartJob(prev => ({ ...prev, [wj.id]: false }));
        }
      }
    );
  };

  const handleRejectJob = async () => {
    if (!token || !rejectingJob || !rejectReason) {
      showAlert("Uyarı", "Lütfen reddetme nedenini seçin.", "error");
      return;
    }

    setIsRejecting(true);
    try {
      const res = await fetch(`/api/hizmetveren/gelen-isler/${rejectingJob.id}/reddet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason, details: rejectDetails }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "İşlemi kaydederken bir hata oluştu.");
      }

      // Başarılı olduğunda ekranından kaldır
      setJobs(prevJobs => prevJobs.filter(j => j.id !== rejectingJob.id));
      setRejectingJob(null);
      setRejectReason("");
      setRejectDetails("");
      showAlert("Başarılı", "İş fırsatı başarıyla reddedildi.", "success");
    } catch (err: any) {
      showAlert("Hata", err.message || "Bir hata oluştu.", "error");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleCancelJob = async () => {
    if (!token) return;
    if (!cancelModal.acceptedOfferId || !cancelModal.reasonCode) {
      showAlert("Uyarı", "Lütfen iptal gerekçesini seçin.", "error");
      return;
    }
    if (cancelModal.reasonCode === 'diger' && !cancelModal.reasonText.trim()) {
      showAlert("Uyarı", "Lütfen iptal nedenini açıklayınız.", "error");
      return;
    }

    setSubmittingCancelJob(true);
    try {
      const res = await fetch(`/api/hizmetveren/kazanilan-isler/${cancelModal.acceptedOfferId}/iptal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          reasonCode: cancelModal.reasonCode,
          reasonText: cancelModal.reasonCode === 'diger' ? cancelModal.reasonText : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'İş iptal edilemedi.');
      }

      showAlert('Başarılı', 'İş başarıyla iptal edildi ve müşteriye bilgi verildi.', 'success');
      
      setCancelModal({
        isOpen: false,
        acceptedOfferId: '',
        reasonCode: '',
        reasonText: '',
      });

      fetchTabDependencies('kazanilanlar', token);
      fetchTabDependencies('kayip_iptal', token);
    } catch (err: any) {
      showAlert('Hata', err.message || 'İş iptal edilirken bir hata oluştu.', 'error');
    } finally {
      setSubmittingCancelJob(false);
    }
  };

  const fetchProviderKpiReport = async (currentToken?: string) => {
    const activeToken = currentToken || token;
    if (!activeToken) return;
    setLoadingProviderKpi(true);
    try {
      const url = new URL('/api/hizmetveren/kpi-raporlari', window.location.origin);
      url.searchParams.set('period', providerKpiPeriod);
      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setProviderKpiData(data);
        if (data.reports && data.reports.length > 0 && !providerKpiSelectedCategorySlug) {
          setProviderKpiSelectedCategorySlug(data.reports[0].categorySlug);
        }
      } else {
        addLog(`Usta KPI raporu yüklenemedi: ${data.error?.message}`);
      }
    } catch (err: any) {
      addLog(`Usta KPI raporu yükleme hatası: ${err.message}`);
    } finally {
      setLoadingProviderKpi(false);
    }
  };

  useEffect(() => {
    if (token) {
      if (activeTab === 'kpi') {
        fetchProviderKpiReport(token);
      } else {
        fetchTabDependencies(activeTab, token);
      }
    }
  }, [activeTab, token]);

  useEffect(() => {
    if (token && activeTab === 'kpi') {
      fetchProviderKpiReport(token);
    }
  }, [providerKpiPeriod, token, activeTab]);

  useEffect(() => {
    if (!activeChat) return;
    fetchChatMessages(activeChat.jobId, activeChat.offerId);
    if (socketRef.current) {
      socketRef.current.emit('join_job', { jobId: activeChat.jobId });
    }
  }, [activeChat?.jobId, activeChat?.offerId]);

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

    const priceNum = Number(offerPrice.replace(/\D/g, ''));
    if (!priceNum || priceNum < 1) {
      showAlert('Hata', 'Lütfen geçerli bir teklif fiyatı giriniz.', 'error');
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
      const isFree = quota && quota.packageName.includes('Ücretsiz');
      if (isFree) {
        showAlert(
          'Tebrikler!',
          'Teklifiniz anında müşteriye iletildi! Ancak sistemde Ücretli Aboneliğe sahip olan esnaflar teklif verdiğinde sıralamada otomatik olarak üzerinize geçecektir. Müşterinin dikkatini ilk sırada çekmek ve VIP Rozetiyle teklifinizin kabul edilme şansını artırmak için paketinizi yükseltin!',
          'info'
        );
      } else {
        showAlert('Başarılı', 'Teklifiniz başarıyla müşteriye iletildi!', 'success');
      }
      
      setJobs((prev) => prev.filter((j) => j.id !== activeJob.id));
      setActiveJob(null);
      setOfferPrice('');
      setOfferMessage('');

      await loadDashboardData(token);

    } catch (err: any) {
      addLog(`Teklif gönderme hatası: ${err.message}`);
      showAlert('Hata', err.message, 'error');
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

  if (!token) {
    return (
      <div className="bg-[#f8fafc] text-slate-900 min-h-screen flex items-center justify-center p-4 antialiased font-sans relative overflow-hidden select-none">
        
        {/* Background visual decorations */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#c8f252]/10 blur-[130px] pointer-events-none z-0"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#4c630a]/5 blur-[130px] pointer-events-none z-0"></div>

        <div className="max-w-md w-full bg-white border border-slate-200/60 rounded-[32px] p-8 shadow-2xl relative z-10 transition-all duration-350 hover:shadow-3xl animate-scale-up">
          
          {/* Brand Header Logo */}
          <div className="flex flex-col items-center mb-8">
            <img 
              alt="Esnaaf Logo" 
              className="w-auto select-none mb-4" 
              style={{ height: '70px', objectFit: 'contain' }}
              src="/logo.png" 
            />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight text-center">
              Hizmet Veren Girişi
            </h1>
            <p className="text-xs text-slate-400 font-semibold mt-1 text-center leading-relaxed">
              Esnaf yönetim paneline giriş yapın, yeni iş fırsatlarını kaçırmayın.
            </p>
          </div>

          {registeredSuccessAlert && (
            <div className="mb-5 bg-amber-50 border border-amber-200 text-amber-850 rounded-2xl p-4 text-xs font-bold leading-relaxed text-left relative animate-scale-up">
              <span className="block mb-1 font-extrabold text-[13px] text-amber-900">🎉 Başvurunuz Alındı!</span>
              Başvurunuz ve belgeleriniz başarıyla alındı! Esnaaf platformunu hemen keşfetmek için az önce belirlediğiniz giriş bilgileriyle sisteme giriş yapabilirsiniz.
            </div>
          )}

          {loginError && (
            <div className="mb-5 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl p-4 text-xs font-bold leading-relaxed text-left">
              ⚠️ {loginError}
            </div>
          )}

          {/* Method Tabs */}
          <div className="flex border-b border-slate-100 mb-6 text-xs font-bold">
            <button
              onClick={() => { setLoginMethod('otp'); setLoginError(''); }}
              className={`flex-1 pb-3 text-center transition-all border-b-2 cursor-pointer ${loginMethod === 'otp' ? 'border-[#4c630a] text-[#4c630a]' : 'border-transparent text-slate-400 hover:text-slate-650'}`}
            >
              SMS Kodu (OTP)
            </button>
            <button
              onClick={() => { setLoginMethod('password'); setLoginError(''); }}
              className={`flex-1 pb-3 text-center transition-all border-b-2 cursor-pointer ${loginMethod === 'password' ? 'border-[#4c630a] text-[#4c630a]' : 'border-transparent text-slate-400 hover:text-slate-650'}`}
            >
              Şifre ile Giriş
            </button>
          </div>

          {loginMethod === 'otp' ? (
            !otpSent ? (
              /* PHONE NUMBER STEP */
              <div className="space-y-6">
                <div className="text-left">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
                    Telefon Numaranız
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-[15px] text-xs font-black text-slate-800 font-mono">+90</span>
                    <input
                      type="tel"
                      maxLength={15}
                      disabled={loading}
                      value={phoneNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setPhoneNumber(val);
                      }}
                      placeholder="5XX XXX XX XX"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#4c630a]/50 focus:ring-2 focus:ring-[#4c630a]/5 rounded-xl py-3.5 px-4 pl-12 text-xs font-black text-slate-900 focus:outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleSendOtp()}
                  disabled={loading || phoneNumber.length < 7}
                  className="w-full bg-[#4c630a] hover:bg-[#3d5008] text-white font-extrabold py-3.5 rounded-2xl flex items-center justify-center gap-1.5 transition-all text-xs disabled:opacity-50 active:scale-[0.98] cursor-pointer shadow-md shadow-[#4c630a]/10"
                >
                  {loading ? (
                    <span>Gönderiliyor...</span>
                  ) : (
                    <>
                      <Phone className="w-4 h-4 shrink-0 text-white" />
                      <span>Doğrulama Kodu Gönder</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* OTP CODE STEP */
              <div className="space-y-6">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex justify-between items-center text-left">
                  <div>
                    <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Doğrulanacak Numara</span>
                    <span className="text-xs font-black text-slate-850 font-mono">{phoneNumber}</span>
                  </div>
                  <button
                    onClick={() => setOtpSent(false)}
                    disabled={loading}
                    className="text-xs font-bold text-[#4c630a] hover:underline bg-white px-3 py-1.5 border border-slate-200 rounded-xl active:scale-95 transition-all cursor-pointer"
                  >
                    Değiştir
                  </button>
                </div>

                <div className="text-left">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
                    6 Haneli Doğrulama Kodu (OTP)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      disabled={loading}
                      value={otpCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setOtpCode(val);
                      }}
                      placeholder="0 0 0 0 0 0"
                      className="w-full bg-slate-50 text-center tracking-[12px] border border-slate-200 focus:border-[#4c630a]/50 focus:ring-2 focus:ring-[#4c630a]/5 rounded-xl py-3.5 px-4 text-sm font-black text-slate-900 focus:outline-none transition-all shadow-inner font-mono pl-[12px]"
                    />
                  </div>
                </div>

                {devOtpSuggested && (
                  <div className="bg-[#c8f252]/10 border border-[#c8f252]/30 rounded-2xl p-4 text-[11px] text-[#4c630a] font-bold text-center leading-relaxed animate-pulse">
                    💡 Bu usta için geçerli doğrulama kodu: <span className="font-black text-sm tracking-wider underline font-mono bg-white px-2 py-0.5 rounded border border-[#c8f252]/30 text-slate-900">{devOtpSuggested}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span>Kodu almadınız mı?</span>
                  {countdown > 0 ? (
                    <span className="font-mono text-slate-500 font-bold">{countdown} sn içinde tekrar isteyebilirsiniz</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      className="text-[#4c630a] font-bold hover:underline cursor-pointer"
                    >
                      Tekrar Kod Gönder
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleVerifyOtp()}
                  disabled={loading || otpCode.length < 6}
                  className="w-full bg-[#4c630a] hover:bg-[#3d5008] text-white font-extrabold py-3.5 rounded-2xl flex items-center justify-center gap-1.5 transition-all text-xs disabled:opacity-50 active:scale-[0.98] cursor-pointer shadow-md shadow-[#4c630a]/10"
                >
                  {loading ? (
                    <span>Doğrulanıyor...</span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 shrink-0 text-white" />
                      <span>Kodu Doğrula ve Giriş Yap</span>
                    </>
                  )}
                </button>
              </div>
            )
          ) : (
            /* PASSWORD LOGIN FLOW */
            <div className="space-y-6">
              <div className="text-left">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
                  Telefon Numaranız
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-[15px] text-xs font-black text-slate-800 font-mono">+90</span>
                  <input
                    type="tel"
                    maxLength={15}
                    disabled={loading}
                    value={phoneNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setPhoneNumber(val);
                    }}
                    placeholder="5XX XXX XX XX"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#4c630a]/50 focus:ring-2 focus:ring-[#4c630a]/5 rounded-xl py-3.5 px-4 pl-12 text-xs font-black text-slate-900 focus:outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="text-left">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
                  Şifreniz
                </label>
                <input
                  type="password"
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#4c630a]/50 focus:ring-2 focus:ring-[#4c630a]/5 rounded-xl py-3.5 px-4 text-xs font-black text-slate-900 focus:outline-none transition-all shadow-inner"
                />
              </div>

              <button
                onClick={() => handlePasswordLogin()}
                disabled={loading || phoneNumber.length < 7 || !password}
                className="w-full bg-[#4c630a] hover:bg-[#3d5008] text-white font-extrabold py-3.5 rounded-2xl flex items-center justify-center gap-1.5 transition-all text-xs disabled:opacity-50 active:scale-[0.98] cursor-pointer shadow-md shadow-[#4c630a]/10"
              >
                {loading ? (
                  <span>Giriş Yapılıyor...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4 shrink-0 text-white" />
                    <span>Şifre ile Giriş Yap</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* SIMULATOR QUICK LOGINS */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-4 font-mono">
              Hızlı Test Girişleri (Simülatör)
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {MOCK_USTAS.slice(0, 2).map((u) => (
                <button
                  key={u.phone}
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setPhoneNumber(u.phone);
                    handleSendOtp(u.phone);
                  }}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-[#c8f252]/10 border border-slate-100 hover:border-[#c8f252]/40 transition-all text-left group cursor-pointer"
                >
                  <div>
                    <span className="block text-xs font-black text-slate-800 group-hover:text-[#4c630a] transition-colors">{u.name}</span>
                    <span className="block text-[9px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider font-mono">Telefon: {u.phone}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#4c630a] transition-all transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
            <p className="text-[9px] font-bold text-slate-400 text-center mt-3 font-mono">
              * Bu test hizmet verenleri Adana bölgesi için onaylanmış aktiftir.
            </p>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] text-slate-900 min-h-screen flex flex-col antialiased font-sans select-none overflow-x-hidden">
      {isImpersonated && (
        <div className="bg-gradient-to-r from-red-800 to-rose-600 text-white text-xs font-bold py-2.5 px-6 flex justify-between items-center z-[9999] animate-fade-in shadow-md border-b border-red-900 w-full shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping"></span>
            <span>Şu anda <strong>{profile?.companyName || profile?.name || "Hizmet Veren"}</strong> panelini ön izliyorsunuz (Taklit Modu).</span>
          </div>
          <button 
            onClick={handleExitImpersonation}
            className="bg-white/10 hover:bg-white/20 text-white font-extrabold px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wider transition-all active:scale-95 cursor-pointer border border-white/20"
          >
            Ön İzlemeyi Kapat
          </button>
        </div>
      )}
      <div className="flex-1 flex w-full">

      
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)} 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
        />
      )}

      <nav className={`h-[100dvh] max-h-[100dvh] md:h-screen w-64 fixed left-0 top-0 bg-white border-r border-slate-100/80 flex flex-col py-4 md:py-6 px-4 z-50 transition-transform duration-300 md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:flex shrink-0`}>
        
        {/* Brand Header */}
        <div className="mb-4 md:mb-6 px-2 flex justify-between items-center h-16 relative">
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

        {/* Circular Profile Card with status checkmark */}
        <div className="flex items-center gap-3 mb-4 md:mb-6 p-3 rounded-2xl bg-[#f8fafc] border border-slate-100 shadow-[0_2px_4px_rgba(0,0,0,0.01)]">
          <div className="relative w-10 h-10 shrink-0">
            <img
              src={profile?.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"}
              alt="Profil Resmi"
              className="w-full h-full object-cover rounded-xl border border-slate-200"
            />
            {/* Verified/Pending check badge */}
            <span className={`absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full text-white flex items-center justify-center border-2 border-white text-[8px] font-bold ${profile && !profile.isApproved ? 'bg-amber-500' : 'bg-emerald-500'}`}>
              {profile && !profile.isApproved ? '!' : '✓'}
            </span>
          </div>
          <div className="overflow-hidden text-left">
            <p className="font-extrabold text-slate-800 text-xs truncate leading-none">
              {profile ? profile.name : 'Hizmet Veren'}
            </p>
            <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase block tracking-wider font-mono">
              {profile && !profile.isApproved ? 'ONAY BEKLEYEN HİZMET VEREN' : 'DOĞRULANMIŞ UZMAN'}
            </span>
          </div>
        </div>

        {/* Sidebar Menu items */}
        <div className="flex-1 flex flex-col gap-1 overflow-y-auto scrollbar-none pr-0.5">
          <button
            onClick={() => handleTabClick('dashboard')}
            className={`flex items-center gap-3.5 px-4 py-3 w-full text-left font-bold rounded-2xl transition-all text-xs cursor-pointer ${
              activeTab === 'dashboard' 
                ? 'bg-[#4c630a] text-white font-extrabold shadow-sm shadow-[#4c630a]/20 scale-bounce' 
                : 'text-slate-450 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4.5 h-4.5 shrink-0 stroke-[2.2]" />
            <span>Performans & Özet</span>
          </button>

          <button
            onClick={() => handleTabClick('firsatlar')}
            className={`flex items-center gap-3.5 px-4 py-3 w-full text-left font-bold rounded-2xl transition-all text-xs cursor-pointer ${
              isTabLocked('firsatlar')
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : activeTab === 'firsatlar' 
                  ? 'bg-[#4c630a] text-white font-extrabold shadow-sm shadow-[#4c630a]/20 scale-bounce' 
                  : 'text-slate-450 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <Briefcase className="w-4.5 h-4.5 shrink-0 stroke-[2.2]" />
            <span>Gelen İşler (Fırsatlar)</span>
            {isTabLocked('firsatlar') && <Lock className="w-3.5 h-3.5 ml-auto text-slate-400" />}
          </button>
          
          <button
            onClick={() => handleTabClick('teklifler')}
            className={`flex items-center gap-3.5 px-4 py-3 w-full text-left font-bold rounded-2xl transition-all text-xs cursor-pointer ${
              isTabLocked('teklifler')
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : activeTab === 'teklifler' 
                  ? 'bg-[#4c630a] text-white font-extrabold shadow-sm shadow-[#4c630a]/20 scale-bounce' 
                  : 'text-slate-450 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4.5 h-4.5 shrink-0 stroke-[2.2]" />
            <span>Teklif Verilenler</span>
            {isTabLocked('teklifler') && <Lock className="w-3.5 h-3.5 ml-auto text-slate-400" />}
          </button>

          <button
            onClick={() => handleTabClick('kazanilanlar')}
            className={`flex items-center gap-3.5 px-4 py-3 w-full text-left font-bold rounded-2xl transition-all text-xs cursor-pointer ${
              isTabLocked('kazanilanlar')
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : activeTab === 'kazanilanlar' 
                  ? 'bg-[#4c630a] text-white font-extrabold shadow-sm shadow-[#4c630a]/20 scale-bounce' 
                  : 'text-slate-450 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <CheckCircle className="w-4.5 h-4.5 shrink-0 stroke-[2.2]" />
            <span>Kazanılan İşler (Aktif)</span>
            {isTabLocked('kazanilanlar') && <Lock className="w-3.5 h-3.5 ml-auto text-slate-400" />}
          </button>

          <button
            onClick={() => handleTabClick('tamamlananlar')}
            className={`flex items-center gap-3.5 px-4 py-3 w-full text-left font-bold rounded-2xl transition-all text-xs cursor-pointer ${
              isTabLocked('tamamlananlar')
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : activeTab === 'tamamlananlar' 
                  ? 'bg-[#4c630a] text-white font-extrabold shadow-sm shadow-[#4c630a]/20 scale-bounce' 
                  : 'text-slate-450 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <CheckCircle className="w-4.5 h-4.5 shrink-0 stroke-[2.2]" />
            <span>Tamamlanan İşler</span>
            {isTabLocked('tamamlananlar') && <Lock className="w-3.5 h-3.5 ml-auto text-slate-400" />}
          </button>

          <button
            onClick={() => handleTabClick('kayip_iptal')}
            className={`flex items-center gap-3.5 px-4 py-3 w-full text-left font-bold rounded-2xl transition-all text-xs cursor-pointer ${
              isTabLocked('kayip_iptal')
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : activeTab === 'kayip_iptal' 
                  ? 'bg-[#4c630a] text-white font-extrabold shadow-sm shadow-[#4c630a]/20 scale-bounce' 
                  : 'text-slate-450 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <XCircle className="w-4.5 h-4.5 shrink-0 stroke-[2.2] text-red-500" />
            <span>Kaybedilen ve İptal Edilenler</span>
            {isTabLocked('kayip_iptal') && <Lock className="w-3.5 h-3.5 ml-auto text-slate-400" />}
          </button>

          <button
            onClick={() => handleTabClick('kpi')}
            className={`flex items-center gap-3.5 px-4 py-3 w-full text-left font-bold rounded-2xl transition-all text-xs cursor-pointer ${
              isTabLocked('kpi')
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : activeTab === 'kpi' 
                  ? 'bg-[#4c630a] text-white font-extrabold shadow-sm shadow-[#4c630a]/20 scale-bounce' 
                  : 'text-slate-450 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4.5 h-4.5 shrink-0 stroke-[2.2]" />
            <span>Rakip İstatistikleri (KPI)</span>
            {isTabLocked('kpi') && <Lock className="w-3.5 h-3.5 ml-auto text-slate-400" />}
          </button>

          <button
            onClick={() => handleTabClick('yorumlar')}
            className={`flex items-center gap-3.5 px-4 py-3 w-full text-left font-bold rounded-2xl transition-all text-xs cursor-pointer ${
              isTabLocked('yorumlar')
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : activeTab === 'yorumlar' 
                  ? 'bg-[#4c630a] text-white font-extrabold shadow-sm shadow-[#4c630a]/20 scale-bounce' 
                  : 'text-slate-450 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <Star className="w-4.5 h-4.5 shrink-0 stroke-[2.2]" />
            <span>Yorumlar & Puanlar</span>
            {isTabLocked('yorumlar') && <Lock className="w-3.5 h-3.5 ml-auto text-slate-400" />}
          </button>

          <button
            onClick={() => handleTabClick('uyusmazliklar')}
            className={`flex items-center gap-3.5 px-4 py-3 w-full text-left font-bold rounded-2xl transition-all text-xs cursor-pointer ${
              isTabLocked('uyusmazliklar')
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : activeTab === 'uyusmazliklar' 
                  ? 'bg-[#4c630a] text-white font-extrabold shadow-sm shadow-[#4c630a]/20 scale-bounce' 
                  : 'text-slate-450 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-4.5 h-4.5 shrink-0 stroke-[2.2] text-red-500" />
            <span className="flex items-center justify-between w-full">
              <span>Uyuşmazlıklar</span>
              {disputesList.length > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full animate-pulse">
                  {disputesList.length}
                </span>
              )}
            </span>
            {isTabLocked('uyusmazliklar') && <Lock className="w-3.5 h-3.5 ml-auto text-slate-400" />}
          </button>

          <button
            onClick={() => handleTabClick('abonelik')}
            className={`flex items-center gap-3.5 px-4 py-3 w-full text-left font-bold rounded-2xl transition-all text-xs cursor-pointer ${
              isTabLocked('abonelik')
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : activeTab === 'abonelik' 
                  ? 'bg-[#4c630a] text-white font-extrabold shadow-sm shadow-[#4c630a]/20 scale-bounce' 
                  : 'text-slate-450 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-4.5 h-4.5 shrink-0 stroke-[2.2]" />
            <span>Abonelik & Paket Bilgisi</span>
            {isTabLocked('abonelik') && <Lock className="w-3.5 h-3.5 ml-auto text-slate-400" />}
          </button>

          <button
            onClick={() => handleTabClick('loyal_customers')}
            className={`flex items-center gap-3.5 px-4 py-3 w-full text-left font-bold rounded-2xl transition-all text-xs cursor-pointer ${
              isTabLocked('loyal_customers')
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : activeTab === 'loyal_customers' 
                  ? 'bg-[#4c630a] text-white font-extrabold shadow-sm shadow-[#4c630a]/20 scale-bounce' 
                  : 'text-slate-450 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <Star className="w-4.5 h-4.5 shrink-0 stroke-[2.2] text-amber-500" />
            <span>Sadık Müşterilerim</span>
            {isTabLocked('loyal_customers') && <Lock className="w-3.5 h-3.5 ml-auto text-slate-400" />}
          </button>

          <button
            onClick={() => handleTabClick('belge-dogrulama')}
            className={`flex items-center gap-3.5 px-4 py-3 w-full text-left font-bold rounded-2xl transition-all text-xs cursor-pointer ${
              activeTab === 'belge-dogrulama' 
                ? 'bg-[#4c630a] text-white font-extrabold shadow-sm shadow-[#4c630a]/20 scale-bounce' 
                : 'text-slate-450 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4.5 h-4.5 shrink-0 stroke-[2.2] text-amber-500" />
            <span>{profile && !profile.isApproved ? 'Belge Doğrulama' : 'Doğrulama Belgelerim'}</span>
          </button>
        </div>

        {/* Sidebar bottom lime publish button */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col gap-3">
          <button
            onClick={() => { setActiveTab("profil-ayarlar"); setMobileMenuOpen(false); }}
            className={`w-full font-black text-xs py-3.5 rounded-2xl cursor-pointer shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 border ${
              activeTab === 'profil-ayarlar'
                ? 'bg-[#4c630a] text-white border-transparent'
                : 'bg-[#c8f252] hover:bg-[#b5e639] text-slate-950 border-transparent'
            }`}
          >
            <Settings className="w-4.5 h-4.5 shrink-0 stroke-[2.2]" />
            <span>Profil ve Ayarlar</span>
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

            {/* Notifications Dropdown */}
            <div className="relative" ref={notificationsDropdownRef}>
              <button 
                onClick={toggleNotificationsDropdown}
                className="text-slate-400 hover:text-slate-855 transition-colors p-2 hover:bg-slate-50 rounded-xl relative cursor-pointer group"
              >
                <Bell className="w-4.5 h-4.5 text-slate-500 animate-wiggle" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1 right-1 bg-rose-500 text-white border border-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-sm">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {notificationsDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl z-[100] p-4 animate-scale-up text-left">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                    <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest font-mono">Bildirimler</span>
                    {unreadNotificationsCount > 0 && (
                      <span className="bg-rose-50 text-rose-600 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                        {unreadNotificationsCount} Yeni
                      </span>
                    )}
                  </div>
                  
                  {notifications.length > 0 ? (
                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-0.5 divide-y divide-slate-50 font-sans">
                      {notifications.map((notif, index) => {
                        const title = notif.payload?.title || notif.payload?.payload?.title || 'Bildirim';
                        const body = notif.payload?.body || notif.payload?.payload?.body || '';
                        return (
                          <div key={notif.id || index} className="pt-2.5 first:pt-0 space-y-0.5 text-left">
                            <h4 className="font-extrabold text-xs text-slate-800">{title}</h4>
                            <p className="text-[11px] text-slate-500 font-semibold leading-normal">{body}</p>
                            <span className="text-[9px] text-slate-400 font-bold block pt-0.5">
                              {new Date(notif.sent_at).toLocaleString("tr-TR", {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-400">
                      <span className="text-2xl">🔔</span>
                      <p className="text-xs font-bold mt-2">Bildiriminiz bulunmuyor.</p>
                    </div>
                  )}
                </div>
              )}
            </div>


            <div className="h-6 w-[1px] bg-slate-200 hidden sm:block"></div>

            <div className="hidden sm:flex items-center gap-2.5 text-left">
              <span className="text-xs font-black text-slate-850 leading-none">{quota ? quota.providerName : 'Mert Yılmaz'}</span>
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                alt="Hizmet Veren Profil"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100"
              />
            </div>
          </div>
        </header>

        {showPassiveAlert && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-semibold py-3.5 px-6 flex items-center justify-center gap-2 sticky top-16 z-30 animate-fade-in shadow-md w-full shrink-0 border-b border-orange-700/20 text-center">
            <span>⚠️ HESABINIZ ONAY SÜRECİNDEDİR (PASİF MOD). Profiliniz ve belgeleriniz incelenirken sistemdeki ilanları göremez ve teklif veremezsiniz. Onay işlemi tamamlandığında tüm özellikler anında aktif olacaktır.</span>
          </div>
        )}

        <div className="p-6 md:p-8 space-y-8 z-10 flex-1 relative overflow-y-auto">
          {/* Switchable content based on activeTab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-scale-up text-left">
              {/* VIP/Basic/Standard/Free Membership Active Banner */}
              {quota && (() => {
                const freePkg = availablePackages.find(p => p.type === 'free') || { commissionRate: 10, activeJobsLimit: 1, delayMinutes: 15 };
                const basicPkg = availablePackages.find(p => p.type === 'basic') || { commissionRate: 7, activeJobsLimit: 3, delayMinutes: 10 };
                const standardPkg = availablePackages.find(p => p.type === 'standard') || { commissionRate: 5, activeJobsLimit: 5, delayMinutes: 5 };
                const vipPkg = availablePackages.find(p => p.type === 'vip') || { commissionRate: 3, activeJobsLimit: 7, delayMinutes: 0 };

                const isFree = quota.packageName.includes('Ücretsiz') || quota.limit === 1;
                const isBasic = quota.packageName.includes('Basic');
                const isStandard = quota.packageName.includes('Standart') || quota.packageName.includes('Standard');
                const isVip = quota.packageName.includes('VIP') || profile?.package?.vipStatus || false;

                if (isFree && quota.used === 0) {
                  return (
                    <div className="bg-[#c8f252]/10 border border-[#c8f252]/40 rounded-3xl p-5 text-left space-y-3.5 animate-scale-up mb-6 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-[#4c630a] text-sm">⚡</span>
                        <h4 className="text-[#4c630a] font-extrabold text-xs uppercase tracking-wider">
                          ÜCRETSİZ ÜYELİK AKTİF (KAPASİTE: {quota.used}/{quota.limit})
                        </h4>
                      </div>
                      <p className="text-slate-700 text-xs font-semibold leading-relaxed">
                        Yeni ilanları <strong>{freePkg.delayMinutes} dakika gecikmeyle</strong> görüyorsunuz. Hemen teklif verip yeni bir iş kapmak için paketinizi yükselterek bu gecikmeyi sıfırlayabilirsiniz!
                      </p>
                      <div className="bg-red-50 border border-red-200/80 p-4 rounded-2xl text-red-950 font-extrabold text-[11px] leading-relaxed shadow-[0_2px_8px_rgba(239,68,68,0.02)]">
                        🚨 <strong>DİKKAT EDİLMESİ GEREKENLER (ÜCRETSİZ LİMİTİ):</strong>
                        <br />
                        Ücretsiz pakette aynı anda kazanabileceğiniz maksimum aktif iş kapasitesi {freePkg.activeJobsLimit} adettir. Teklifiniz müşteri tarafından kabul edilip 1 iş kazandığınızda, yeni ilan akışı siz bu işi tamamlayıp onaylayana kadar tamamen kilitlenecektir. Ayrıca bu işten %{freePkg.commissionRate} komisyon tahsil edilir. İlanların hiç kapanmaması ve anlık gelmesi için paketinizi yükseltebilirsiniz.
                      </div>
                      <div className="flex justify-end pt-1">
                        <button 
                          onClick={() => handleTabClick('abonelik')}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs py-2 px-4 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm"
                        >
                          Paketleri Karşılaştır & Aboneliğe Geç →
                        </button>
                      </div>
                    </div>
                  );
                }

                if (isBasic && quota.limit !== null && quota.used < quota.limit) {
                  return (
                    <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-5 text-left space-y-3.5 animate-scale-up mb-6 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-700 text-sm">💎</span>
                        <h4 className="text-blue-700 font-extrabold text-xs uppercase tracking-wider">
                          BASİC ÜYELİK AKTİF (KAPASİTE: {quota.used}/{quota.limit})
                        </h4>
                      </div>
                      <p className="text-slate-700 text-xs font-semibold leading-relaxed">
                        Basic paket ile aynı anda en fazla {basicPkg.activeJobsLimit} aktif iş yürütebilir ve yeni ilanları <strong>{basicPkg.delayMinutes} dakika gecikmeyle</strong> görürsünüz.
                      </p>
                      <div className="bg-white/80 border border-blue-100 p-4 rounded-2xl text-slate-800 text-[11px] font-semibold leading-relaxed">
                        🚀 <strong>DAHA FAZLA İLAN VE DÜŞÜK KOMİSYON AVANTAJI:</strong>
                        <br />
                        Standart pakete geçerek kapasitenizi {standardPkg.activeJobsLimit} aktif işe çıkarıp gecikme sürenizi {standardPkg.delayMinutes} dakikaya düşürebilir, komisyonunuzu %{standardPkg.commissionRate}'e indirebilirsiniz. Veya VIP pakete geçerek {vipPkg.activeJobsLimit} aktif iş kapasitesi, {vipPkg.delayMinutes} dakika gecikme, %{vipPkg.commissionRate} en düşük komisyon oranı ve tekliflerinizin daima en üst sırada gösterilmesini sağlayan <strong>VIP rozeti</strong> elde edebilirsiniz!
                      </div>
                      <div className="flex justify-end pt-1">
                        <button 
                          onClick={() => handleTabClick('abonelik')}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs py-2 px-4 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm"
                        >
                          Paketini Yükselt & VIP/Standart Ol →
                        </button>
                      </div>
                    </div>
                  );
                }

                if (isStandard && quota.limit !== null && quota.used < quota.limit) {
                  return (
                    <div className="bg-indigo-50/50 border border-indigo-150 rounded-3xl p-5 text-left space-y-3.5 animate-scale-up mb-6 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-indigo-700 text-sm">👑</span>
                        <h4 className="text-indigo-700 font-extrabold text-xs uppercase tracking-wider">
                          STANDART ÜYELİK AKTİF (KAPASİTE: {quota.used}/{quota.limit})
                        </h4>
                      </div>
                      <p className="text-slate-700 text-xs font-semibold leading-relaxed">
                        Standart paket ile aynı anda en fazla {standardPkg.activeJobsLimit} aktif iş yürütebilir ve yeni ilanları <strong>{standardPkg.delayMinutes} dakika gecikmeyle</strong> görürsünüz.
                      </p>
                      <div className="bg-white/80 border border-indigo-100 p-4 rounded-2xl text-slate-800 text-[11px] font-semibold leading-relaxed">
                        🏆 <strong>EN YÜKSEK PREMİUM AVANTAJ (VIP ÜYELİK):</strong>
                        <br />
                        VIP pakete geçiş yaparak kapasitenizi maksimum sınır olan {vipPkg.activeJobsLimit} aktif işe yükseltebilir, gecikme sürenizi {vipPkg.delayMinutes} dakikaya (anlık akışa) çekebilir, komisyon oranınızı en düşük oran olan %{vipPkg.commissionRate}'e düşürebilir ve tekliflerinize eklenen VIP rozeti ile rakiplerinizin daima önünde listelenme avantajını elde edebilirsiniz!
                      </div>
                      <div className="flex justify-end pt-1">
                        <button 
                          onClick={() => handleTabClick('abonelik')}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-2 px-4 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm"
                        >
                          VIP Üyeliğe Geçiş Yap →
                        </button>
                      </div>
                    </div>
                  );
                }

                if (isVip && quota.limit !== null && quota.used < quota.limit) {
                  return (
                    <div className="bg-[#c8f252]/10 border border-[#c8f252]/30 rounded-3xl p-5 text-left space-y-2 animate-scale-up mb-6 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-[#4c630a] text-sm">✨</span>
                        <h4 className="text-[#4c630a] font-extrabold text-xs uppercase tracking-wider">
                          VIP ÜYELİK AKTİF (KAPASİTE: {quota.used}/{quota.limit})
                        </h4>
                      </div>
                      <p className="text-slate-700 text-xs font-semibold leading-relaxed">
                        Tebrikler! Platformumuzdaki en yüksek üyelik seviyesindesiniz. Yeni ilanları <strong>anlık ({vipPkg.delayMinutes} dakika gecikmeyle)</strong> görüyorsunuz. Aynı anda {vipPkg.activeJobsLimit} aktif iş kapasitesi, %{vipPkg.commissionRate} en düşük komisyon oranı ve en üstte listelenme VIP avantajlarıyla ayrıcalıklı fırsatlardan yararlanıyorsunuz.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Müsait Değil (Yeni İlan Alımı Durduruldu) Uyarı Şeridi */}
              {profile && !profile.isAvailable && (
                <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 md:p-6 text-left flex flex-col md:flex-row md:items-center justify-between gap-4 animate-scale-up shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0 animate-pulse">
                      🚨
                    </div>
                    <div>
                      <h4 className="text-rose-800 font-extrabold text-xs md:text-sm uppercase tracking-wider">
                        YENİ İLAN ALIMI DURDURULDU
                      </h4>
                      <p className="text-slate-600 text-[11px] md:text-xs font-semibold leading-relaxed mt-0.5">
                        Müsaitlik durumunuz <strong>"KAPALI"</strong> olduğu için yeni ilan akışı durdurulmuştur.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleAvailability}
                      disabled={isUpdatingAvailability}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] py-2.5 px-5 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm uppercase tracking-wider"
                    >
                      {isUpdatingAvailability ? 'Güncelleniyor...' : 'AKTİF YAP 🚀'}
                    </button>
                    <button
                      onClick={() => showAlert("Bilgi", "Hesabınız pasif modda kalmaya devam ediyor. İstediğiniz zaman aktif edebilirsiniz.", "info")}
                      className="bg-transparent border border-rose-200 text-rose-700 hover:bg-rose-100/40 font-extrabold text-[11px] py-2.5 px-4 rounded-xl cursor-pointer transition-all active:scale-95 uppercase tracking-wider"
                    >
                      PASİF TUT
                    </button>
                  </div>
                </div>
              )}

              {/* Header Title & Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h2 className="font-extrabold text-slate-900 tracking-tight text-2xl md:text-3xl leading-snug">
                    Performans ve Genel Özet
                  </h2>
                  <p className="text-slate-400 text-xs mt-1 font-semibold leading-relaxed">
                    İş kazanma performansı, kazançlar ve genel istatistik raporu.
                  </p>
                </div>

                {/* Dashboard Controls: Segmented Selector & Demo Switch */}
                <div className="flex flex-wrap items-center gap-3.5">
                  {/* Segmented Time Selector */}
                  <div className="bg-slate-100/80 p-1 rounded-xl flex items-center gap-1 border border-slate-200/40">
                    {(['daily', 'weekly', 'monthly'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setTimeRange(r)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          timeRange === r
                            ? 'bg-white text-slate-900 shadow-sm border border-slate-200/30'
                            : 'text-slate-450 hover:text-slate-700'
                        }`}
                      >
                        {r === 'daily' ? 'Günlük (Son 24 Saat)' : r === 'weekly' ? 'Haftalık (Son 7 Gün)' : 'Aylık (Son 30 Gün)'}
                      </button>
                    ))}
                  </div>

                  {/* Demo Mode Toggle Switch */}
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 px-3 py-2 rounded-xl">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isDemoStats} 
                        onChange={() => setIsDemoStats(!isDemoStats)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4c630a]"></div>
                    </label>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Demo Modu</span>
                  </div>
                </div>
              </div>

              {/* Metrics Grid Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. Bids Sent */}
                <div 
                  onClick={() => handleTabClick('firsatlar')}
                  className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 hover:scale-[1.01] transition-all flex items-start gap-4 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-blue-600 stroke-[2.2]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">İletilen Teklifler</p>
                    <h3 className="text-2xl font-black text-slate-900">{metrics.totalBids} Adet</h3>
                    <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
                      <span>▲ 8.3%</span>
                      <span className="text-slate-400 font-medium lowercase">geçen döneme göre</span>
                    </p>
                  </div>
                </div>

                {/* 2. Won Jobs */}
                <div 
                  onClick={() => handleTabClick('kazanilanlar')}
                  className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 hover:scale-[1.01] transition-all flex items-start gap-4 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5 text-emerald-600 stroke-[2.2]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Kazanılan İşler</p>
                    <h3 className="text-2xl font-black text-slate-900">{metrics.wonJobs} Adet</h3>
                    <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
                      <span>▲ 12.5%</span>
                      <span className="text-slate-400 font-medium lowercase">geçen döneme göre</span>
                    </p>
                  </div>
                </div>

                {/* 3. Lost Jobs */}
                <div 
                  onClick={() => handleTabClick('kayip_iptal')}
                  className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 hover:scale-[1.01] transition-all flex items-start gap-4 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                    <X className="w-5 h-5 text-rose-500 stroke-[2.2]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Kaybedilen ve İptal Edilenler</p>
                    <h3 className="text-2xl font-black text-slate-900">{metrics.lostJobs} Adet</h3>
                    <p className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5">
                      <span>▼ 4.2%</span>
                      <span className="text-slate-400 font-medium lowercase">geçen döneme göre</span>
                    </p>
                  </div>
                </div>

                {/* 4. Completed Jobs */}
                <div 
                  onClick={() => handleTabClick('tamamlananlar')}
                  className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 hover:scale-[1.01] transition-all flex items-start gap-4 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#c8f252]/10 border border-[#c8f252]/30 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-[#4c630a] stroke-[2.2]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Tamamlanan İşler</p>
                    <h3 className="text-2xl font-black text-slate-900">{metrics.completedJobs} Adet</h3>
                    <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
                      <span>▲ 15.0%</span>
                      <span className="text-slate-400 font-medium lowercase">geçen döneme göre</span>
                    </p>
                  </div>
                </div>

                {/* 5. Total Earnings */}
                <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                    <DollarSign className="w-5 h-5 text-amber-600 stroke-[2.2]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Toplam Kazanç</p>
                    <h3 className="text-2xl font-black text-slate-900">₺{metrics.earnings.toLocaleString("tr-TR")}</h3>
                    <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
                      <span>▲ 24.1%</span>
                      <span className="text-slate-400 font-medium lowercase">geçen döneme göre</span>
                    </p>
                  </div>
                </div>

                {/* 6. Disputes */}
                <div 
                  onClick={() => handleTabClick('uyusmazliklar')}
                  className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 hover:scale-[1.01] transition-all flex items-start gap-4 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-500 stroke-[2.2]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Uyuşmazlıklar</p>
                    <h3 className="text-2xl font-black text-slate-900">{metrics.disputes} Adet</h3>
                    <p className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5">
                      <span>0% değişim</span>
                      <span className="text-slate-400 font-medium lowercase">stabil</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Analytics Section (Two Column Layout) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                {/* Left Side: Conversion Chart */}
                <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm flex flex-col justify-between items-center text-center gap-6 lg:col-span-1">
                  <div className="w-full text-left">
                    <h4 className="font-extrabold text-slate-900 text-sm">Teklif Başarı Oranı</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Gönderilen tekliflerin kazanılma yüzdesi</p>
                  </div>

                  {/* Circular Progress Meter */}
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="72"
                        cy="72"
                        r="60"
                        className="stroke-slate-100"
                        strokeWidth="12"
                        fill="transparent"
                      />
                      <circle
                        cx="72"
                        cy="72"
                        r="60"
                        className="stroke-[#4c630a]"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={376.8}
                        strokeDashoffset={376.8 - (376.8 * metrics.successRate) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-2xl font-black text-slate-900">%{metrics.successRate}</span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Dönüşüm</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl text-[10px] font-bold text-slate-650 w-full flex justify-between">
                    <span>Teklif Başarısı:</span>
                    <span className="text-[#4c630a] font-extrabold">Çok İyi seviye</span>
                  </div>
                </div>

                {/* Right Side: Earnings trend */}
                <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm flex flex-col justify-between gap-6 lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">Kazanç Trendi</h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Dönem içi kazanılan toplam ücret dağılımı</p>
                    </div>
                    <span className="bg-[#4c630a]/10 border border-[#4c630a]/30 text-[#4c630a] text-[9px] font-mono font-bold px-2 py-0.5 rounded">
                      {timeRange === 'daily' ? 'Son 24 Saat' : timeRange === 'weekly' ? 'Son 7 Gün' : 'Son 30 Gün'}
                    </span>
                  </div>

                  {/* Chart Container with Y-Axis Padding */}
                  <div className="h-44 w-full relative flex items-end pl-14 pr-2">
                    {/* Y-Axis HTML Labels */}
                    {(() => {
                      const maxVal = Math.max(...metrics.chartData, 1000);
                      const formatYLabel = (val: number) => {
                        if (val >= 1000000) return `₺${(val / 1000000).toFixed(1)}M`;
                        if (val >= 1000) return `₺${(val / 1000).toFixed(0)}B`;
                        return `₺${val}`;
                      };
                      return (
                        <div className="absolute left-0 bottom-0 h-36 w-12 text-[9px] font-bold text-slate-400 font-mono text-right pr-2 select-none pointer-events-none">
                          <span className="absolute right-2" style={{ bottom: '92.3%', transform: 'translateY(50%)' }}>{formatYLabel(maxVal)}</span>
                          <span className="absolute right-2" style={{ bottom: '50%', transform: 'translateY(50%)' }}>{formatYLabel(maxVal / 2)}</span>
                          <span className="absolute right-2" style={{ bottom: '7.69%', transform: 'translateY(50%)' }}>₺0</span>
                        </div>
                      );
                    })()}

                    {/* SVG Chart & Grid Lines */}
                    <div className="flex-1 h-36 relative">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 400 130" preserveAspectRatio="none">
                        {/* Grid Lines */}
                        <line x1="0" y1="10" x2="400" y2="10" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="0" y1="65" x2="400" y2="65" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
                        <line x1="0" y1="120" x2="400" y2="120" stroke="#e2e8f0" strokeWidth="1.5" />

                        {(() => {
                          const count = metrics.chartData.length;
                          const maxVal = Math.max(...metrics.chartData, 1000);
                          
                          const points = metrics.chartData.map((val, idx) => {
                            const x = count > 1 ? (idx / (count - 1)) * 400 : 200;
                            // Map Y from 10 (top value) to 120 (zero value)
                            const y = 120 - (val / maxVal) * 110;
                            
                            let label = '';
                            if (isDemoStats) {
                              if (timeRange === 'daily') {
                                const hours = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'];
                                label = hours[idx] || 'Saat';
                              } else if (timeRange === 'weekly') {
                                const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
                                label = days[idx] || 'Gün';
                              } else {
                                label = `${idx + 1}. Hafta`;
                              }
                            } else {
                              const cj = metrics.filteredCompletions[idx];
                              if (cj && cj.completed_at) {
                                label = new Date(cj.completed_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
                              } else {
                                label = 'İş';
                              }
                            }
                            return { x, y, val, label };
                          });

                          // Calculate smooth bezier path
                          let linePath = '';
                          if (points.length > 0) {
                            if (points.length === 1) {
                              linePath = `M 0 ${points[0].y} L 400 ${points[0].y}`;
                            } else {
                              linePath = `M ${points[0].x} ${points[0].y}`;
                              for (let i = 0; i < points.length - 1; i++) {
                                const p_curr = points[i];
                                const p_next = points[i + 1];
                                const dx = (p_next.x - p_curr.x) * 0.32; // bezier tension
                                linePath += ` C ${p_curr.x + dx} ${p_curr.y}, ${p_next.x - dx} ${p_next.y}, ${p_next.x} ${p_next.y}`;
                              }
                            }
                          }

                          const areaPath = points.length > 0
                            ? `${linePath} L ${points[points.length - 1].x} 120 L ${points[0].x} 120 Z`
                            : '';

                          return (
                            <>
                              {/* Area Under Curve */}
                              {areaPath && (
                                <path
                                  d={areaPath}
                                  fill="url(#earningsGrad)"
                                />
                              )}

                              {/* Main Curve Stroke */}
                              {linePath && (
                                <path
                                  d={linePath}
                                  fill="none"
                                  stroke="#4c630a"
                                  strokeWidth="3.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  filter="url(#chartShadow)"
                                />
                              )}

                              <defs>
                                <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#4c630a" stopOpacity="0.18" />
                                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                                </linearGradient>
                                <filter id="chartShadow" x="-5%" y="-5%" width="110%" height="110%">
                                  <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="#4c630a" floodOpacity="0.12" />
                                </filter>
                              </defs>
                            </>
                          );
                        })()}
                      </svg>

                      {/* HTML Perfect Circles & Hover Area overlays */}
                      {(() => {
                        const count = metrics.chartData.length;
                        const maxVal = Math.max(...metrics.chartData, 1000);
                        
                        return metrics.chartData.map((val, idx) => {
                          const leftPct = count > 1 ? (idx / (count - 1)) * 100 : 50;
                          const bottomPct = ((10 + (val / maxVal) * 110) / 130) * 100;
                          
                          let label = '';
                          if (isDemoStats) {
                            if (timeRange === 'daily') {
                              const hours = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'];
                              label = hours[idx] || 'Saat';
                            } else if (timeRange === 'weekly') {
                              const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
                              label = days[idx] || 'Gün';
                            } else {
                              label = `${idx + 1}. Hafta`;
                            }
                          } else {
                            const cj = metrics.filteredCompletions[idx];
                            if (cj && cj.completed_at) {
                              label = new Date(cj.completed_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
                            } else {
                              label = 'İş';
                            }
                          }

                          return (
                            <div
                              key={idx}
                              className="absolute group z-20"
                              style={{
                                  left: `${leftPct}%`,
                                  bottom: `${bottomPct}%`,
                                  transform: 'translate(-50%, 50%)'
                              }}
                            >
                              {/* Dot Ring */}
                              <div className="w-4 h-4 bg-white border-2 border-[#4c630a] rounded-full shadow-[0_2px_6px_rgba(76,99,10,0.25)] group-hover:shadow-[0_2px_10px_rgba(76,99,10,0.4)] group-hover:scale-115 transition-all duration-150 relative flex items-center justify-center cursor-pointer">
                                {/* Core */}
                                <div className="w-1.5 h-1.5 bg-[#4c630a] rounded-full group-hover:bg-[#88b000] transition-colors" />
                              </div>

                              {/* Hotspot for easy hover */}
                              <div 
                                className="absolute w-8 h-8 -top-2 -left-2 rounded-full cursor-pointer z-30"
                                onMouseEnter={() => setHoveredPoint({ x: leftPct, y: bottomPct, val, label })}
                                shift-key="true"
                                onMouseLeave={() => setHoveredPoint(null)}
                              />
                            </div>
                          );
                        });
                      })()}

                      {/* Interactive Tooltip Overlay */}
                      {hoveredPoint && (
                        <div 
                          className="absolute bg-slate-900/95 text-white px-3 py-1.5 rounded-xl text-[10px] font-extrabold shadow-xl pointer-events-none z-30 transition-all duration-150 -translate-x-1/2 -translate-y-full border border-slate-800 backdrop-blur-sm"
                          style={{ 
                            left: `${hoveredPoint.x}%`, 
                            bottom: `calc(${hoveredPoint.y}% + 16px)` 
                          }}
                        >
                          <div className="font-mono text-[#c8f252] text-xs">₺{hoveredPoint.val.toLocaleString('tr-TR')}</div>
                          <div className="text-[8px] text-slate-400 font-semibold">{hoveredPoint.label}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chart X axis HTML labels container */}
                  <div className="relative h-6 text-[8px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-50 pt-2 font-mono">
                    <div className="absolute left-14 right-2 top-0 bottom-0">
                      {(() => {
                        const count = metrics.chartData.length;
                        return metrics.chartData.map((val, idx) => {
                          let label = '';
                          if (isDemoStats) {
                            if (timeRange === 'daily') {
                              const hours = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'];
                              label = hours[idx] || 'Saat';
                            } else if (timeRange === 'weekly') {
                              const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
                              label = days[idx] || 'Gün';
                            } else {
                              label = `${idx + 1}. Hafta`;
                            }
                          } else {
                            const cj = metrics.filteredCompletions[idx];
                            if (cj && cj.completed_at) {
                              label = new Date(cj.completed_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
                            } else {
                              label = 'İş';
                            }
                          }

                          const leftPct = count > 1 ? (idx / (count - 1)) * 100 : 50;

                          // Filter for clean display on X axis
                          const shouldRender = 
                            count <= 7 || 
                            idx === 0 || 
                            idx === count - 1 || 
                            (count <= 14 && idx % 2 === 0) ||
                            idx % Math.ceil(count / 5) === 0;

                          if (!shouldRender) return null;

                          return (
                            <span 
                              key={idx} 
                              className="absolute"
                              style={{ left: `${leftPct}%`, transform: 'translateX(-50%)' }}
                            >
                              {label}
                            </span>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'firsatlar' && (() => {
            const isLocked = quota && quota.limit !== null && quota.used >= quota.limit;
            if (isLocked) {
              const isFree = quota.packageName.includes('Ücretsiz') || quota.limit === 1;
              return (
                <div className={`border rounded-[32px] p-8 md:p-12 text-center shadow-lg max-w-xl mx-auto my-6 space-y-6 animate-scale-up ${
                  isFree ? 'bg-rose-50 border-rose-200 text-rose-950' : 'bg-amber-50 border-amber-200 text-amber-950'
                }`}>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto border animate-pulse ${
                    isFree ? 'bg-rose-100 border-rose-200 text-rose-600' : 'bg-amber-100 border-amber-200 text-amber-600'
                  }`}>
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="space-y-3">
                    <h3 className={`font-black text-lg md:text-xl uppercase tracking-wider ${isFree ? 'text-rose-700' : 'text-amber-700'}`}>
                      {isFree ? '⚠️ LİMİTE ULAŞTINIZ: YENİ FIRSATLAR KİLİTLENDİ' : `⚠️ KAPASİTE LİMİTİNE ULAŞTINIZ (${quota.packageName.toUpperCase()})`}
                    </h3>
                    
                    {isFree ? (
                      <>
                        <p className="text-slate-800 text-xs md:text-sm font-bold leading-relaxed">
                          Şu anda <strong className="text-rose-700">Ücretsiz (Freemium)</strong> pakette aktif 1 adet kazanılmış işiniz bulunmaktadır.
                        </p>
                        <p className="text-slate-650 text-xs font-semibold leading-relaxed bg-white/80 border border-rose-100 p-4 rounded-2xl text-left">
                          📢 <strong>Sistem Nasıl Çalışır?</strong>
                          <br />
                          Ücretsiz pakette aynı anda en fazla 1 aktif iş yürütebilirsiniz. Kazanmış olduğunuz bu işi tamamlayıp, <strong>"Tamamlanan İşler"</strong> sekmesinden müşteri ile ücret teyidini bitirdikten sonra, kilit otomatik olarak kalkacak ve yeni canlı fırsat ilanları tekrar listelenmeye başlayacaktır.
                        </p>
                        <p className="text-rose-900 text-xs font-bold leading-relaxed bg-rose-100/40 p-3.5 rounded-2xl border border-rose-200/50">
                          🔥 <strong>İlanları Kaçırmayın!</strong> Siz işinizi tamamlayana kadar, <strong>diğer tüm ücretli paketteki rakipleriniz</strong> yeni gelen işleri anında görüp tekliflerini vermeye devam ediyor! Canlı ilan akışının hiç kesilmemesi için hemen paketinizi yükseltebilirsiniz.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-slate-800 text-xs md:text-sm font-bold leading-relaxed">
                          Yürütebileceğiniz maksimum aktif iş kapasiteniz olan <strong className={isFree ? 'text-rose-700' : 'text-amber-700'}>{quota.limit} slot</strong> tamamen dolmuştur.
                        </p>
                        <p className="text-slate-650 text-xs font-semibold leading-relaxed bg-white/80 border border-amber-100 p-4 rounded-2xl text-left">
                          📢 <strong>Sistem Nasıl Çalışır?</strong>
                          <br />
                          Mevcut işlerinizden en az birini tamamlayıp, <strong>"Tamamlanan İşler"</strong> sekmesinden müşteri teyidini tamamlayarak aktif slot sayınızı boşalttığınızda, gelen yeni fırsatlar anında tekrar akmaya başlayacaktır.
                        </p>
                        <p className="text-amber-900 text-xs font-bold leading-relaxed bg-amber-100/40 p-3.5 rounded-2xl border border-amber-200/50">
                          🔥 <strong>Diğer Esnaflar Teklif Veriyor!</strong> Siz mevcut işlerinizi tamamlayıp yer açana kadar, <strong>diğer rakipleriniz</strong> bölgenizdeki yeni iş ilanlarına teklif vermeye kesintisiz devam etmektedir. İlanları rakiplerinize kaptırmamak için mevcut işlerinizi hızlıca tamamlayın veya bir üst pakete geçerek kapasite limitinizi genişletin!
                        </p>
                      </>
                    )}
                  </div>
                  
                  {(!quota.packageName.includes('VIP') && quota.limit !== null && quota.limit < 7) ? (
                    <button 
                      onClick={() => handleTabClick('abonelik')}
                      className="w-full bg-[#c8f252] hover:bg-[#b5e639] text-slate-955 font-black text-xs py-3.5 rounded-2xl cursor-pointer shadow-md transition-all active:scale-95 border border-transparent uppercase tracking-wider"
                    >
                      {isFree ? 'Şimdi Aboneliğini Yükselt & İlanları Gör' : 'Paketini Yükselt & Kapasiteyi Artır'}
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleTabClick('kazanilanlar')}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs py-3.5 rounded-2xl cursor-pointer shadow-md transition-all active:scale-95 border border-transparent uppercase tracking-wider"
                    >
                      Mevcut Aktif İşleri Yönet
                    </button>
                  )}
                </div>
              );
            }
            return (
              <>
                {quota && (() => {
                  const freePkg = availablePackages.find(p => p.type === 'free') || { commissionRate: 10, activeJobsLimit: 1, delayMinutes: 15 };
                  const basicPkg = availablePackages.find(p => p.type === 'basic') || { commissionRate: 7, activeJobsLimit: 3, delayMinutes: 10 };
                  const standardPkg = availablePackages.find(p => p.type === 'standard') || { commissionRate: 5, activeJobsLimit: 5, delayMinutes: 5 };
                  const vipPkg = availablePackages.find(p => p.type === 'vip') || { commissionRate: 3, activeJobsLimit: 7, delayMinutes: 0 };

                  const isFree = quota.packageName.includes('Ücretsiz') || quota.limit === 1;
                  const isBasic = quota.packageName.includes('Basic');
                  const isStandard = quota.packageName.includes('Standart') || quota.packageName.includes('Standard');
                  const isVip = quota.packageName.includes('VIP');

                  if (isFree && quota.used === 0) {
                    return (
                      <div className="bg-[#c8f252]/10 border border-[#c8f252]/40 rounded-3xl p-5 text-left space-y-3.5 animate-scale-up mb-6 shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-[#4c630a] text-sm">⚡</span>
                          <h4 className="text-[#4c630a] font-extrabold text-xs uppercase tracking-wider">
                            ÜCRETSİZ ÜYELİK AKTİF (KAPASİTE: {quota.used}/{quota.limit})
                          </h4>
                        </div>
                        <p className="text-slate-700 text-xs font-semibold leading-relaxed">
                          Yeni ilanları <strong>{freePkg.delayMinutes} dakika gecikmeyle</strong> görüyorsunuz. Hemen teklif verip yeni bir iş kapmak için paketinizi yükselterek bu gecikmeyi sıfırlayabilirsiniz!
                        </p>
                        <div className="bg-red-50 border border-red-200/80 p-4 rounded-2xl text-red-950 font-extrabold text-[11px] leading-relaxed shadow-[0_2px_8px_rgba(239,68,68,0.02)]">
                          🚨 <strong>DİKKAT EDİLMESİ GEREKENLER (ÜCRETSİZ LİMİTİ):</strong>
                          <br />
                          Ücretsiz pakette aynı anda kazanabileceğiniz maksimum aktif iş kapasitesi {freePkg.activeJobsLimit} adettir. Teklifiniz müşteri tarafından kabul edilip 1 iş kazandığınızda, yeni ilan akışı siz bu işi tamamlayıp onaylayana kadar tamamen kilitlenecektir. Ayrıca bu işten %{freePkg.commissionRate} komisyon tahsil edilir. İlanların hiç kapanmaması ve anlık gelmesi için paketinizi yükseltebilirsiniz.
                        </div>
                        <div className="flex justify-end pt-1">
                          <button 
                            onClick={() => handleTabClick('abonelik')}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs py-2 px-4 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm"
                          >
                            Paketleri Karşılaştır & Aboneliğe Geç →
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (isBasic && quota.limit !== null && quota.used < quota.limit) {
                    return (
                      <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-5 text-left space-y-3.5 animate-scale-up mb-6 shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-700 text-sm">💎</span>
                          <h4 className="text-blue-700 font-extrabold text-xs uppercase tracking-wider">
                            BASİC ÜYELİK AKTİF (KAPASİTE: {quota.used}/{quota.limit})
                          </h4>
                        </div>
                        <p className="text-slate-700 text-xs font-semibold leading-relaxed">
                          Basic paket ile aynı anda en fazla {basicPkg.activeJobsLimit} aktif iş yürütebilir ve yeni ilanları <strong>{basicPkg.delayMinutes} dakika gecikmeyle</strong> görürsünüz.
                        </p>
                        <div className="bg-white/80 border border-blue-100 p-4 rounded-2xl text-slate-800 text-[11px] font-semibold leading-relaxed">
                          🚀 <strong>DAHA FAZLA İLAN VE DÜŞÜK KOMİSYON AVANTAJI:</strong>
                          <br />
                          Standart pakete geçerek kapasitenizi {standardPkg.activeJobsLimit} aktif işe çıkarıp gecikme sürenizi {standardPkg.delayMinutes} dakikaya düşürebilir, komisyonunuzu %{standardPkg.commissionRate}'e indirebilirsiniz. Veya VIP pakete geçerek {vipPkg.activeJobsLimit} aktif iş kapasitesi, {vipPkg.delayMinutes} dakika gecikme, %{vipPkg.commissionRate} en düşük komisyon oranı ve tekliflerinizin daima en üst sırada gösterilmesini sağlayan <strong>VIP rozeti</strong> elde edebilirsiniz!
                        </div>
                        <div className="flex justify-end pt-1">
                          <button 
                            onClick={() => handleTabClick('abonelik')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs py-2 px-4 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm"
                          >
                            Paketini Yükselt & VIP/Standart Ol →
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (isStandard && quota.limit !== null && quota.used < quota.limit) {
                    return (
                      <div className="bg-indigo-50/50 border border-indigo-150 rounded-3xl p-5 text-left space-y-3.5 animate-scale-up mb-6 shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-700 text-sm">👑</span>
                          <h4 className="text-indigo-700 font-extrabold text-xs uppercase tracking-wider">
                            STANDART ÜYELİK AKTİF (KAPASİTE: {quota.used}/{quota.limit})
                          </h4>
                        </div>
                        <p className="text-slate-700 text-xs font-semibold leading-relaxed">
                          Standart paket ile aynı anda en fazla {standardPkg.activeJobsLimit} aktif iş yürütebilir ve yeni ilanları <strong>{standardPkg.delayMinutes} dakika gecikmeyle</strong> görürsünüz.
                        </p>
                        <div className="bg-white/80 border border-indigo-100 p-4 rounded-2xl text-slate-800 text-[11px] font-semibold leading-relaxed">
                          🏆 <strong>EN YÜKSEK PREMİUM AVANTAJ (VIP ÜYELİK):</strong>
                          <br />
                          VIP pakete geçiş yaparak kapasitenizi maksimum sınır olan {vipPkg.activeJobsLimit} aktif işe yükseltebilir, gecikme sürenizi {vipPkg.delayMinutes} dakikaya (anlık akışa) çekebilir, komisyon oranınızı en düşük oran olan %{vipPkg.commissionRate}'e düşürebilir ve tekliflerinize eklenen VIP rozeti ile rakiplerinizin daima önünde listelenme avantajını elde edebilirsiniz!
                        </div>
                        <div className="flex justify-end pt-1">
                          <button 
                            onClick={() => handleTabClick('abonelik')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-2 px-4 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm"
                          >
                            VIP Üyeliğe Geçiş Yap →
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (isVip && quota.limit !== null && quota.used < quota.limit) {
                    return (
                      <div className="bg-[#c8f252]/10 border border-[#c8f252]/30 rounded-3xl p-5 text-left space-y-2 animate-scale-up mb-6 shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-[#4c630a] text-sm">✨</span>
                          <h4 className="text-[#4c630a] font-extrabold text-xs uppercase tracking-wider">
                            VIP ÜYELİK AKTİF (KAPASİTE: {quota.used}/{quota.limit})
                          </h4>
                        </div>
                        <p className="text-slate-700 text-xs font-semibold leading-relaxed">
                          Tebrikler! Platformumuzdaki en yüksek üyelik seviyesindesiniz. Yeni ilanları <strong>anlık ({vipPkg.delayMinutes} dakika gecikmeyle)</strong> görüyorsunuz. Aynı anda {vipPkg.activeJobsLimit} aktif iş kapasitesi, %{vipPkg.commissionRate} en düşük komisyon oranı ve en üstte listelenme VIP avantajlarıyla ayrıcalıklı fırsatlardan yararlanıyorsunuz.
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
              {/* Dashboard Title & Overview Banner */}
              {profile && !profile.isAvailable && (
                <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 md:p-6 text-left flex flex-col md:flex-row md:items-center justify-between gap-4 animate-scale-up mb-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0 animate-pulse">
                      🚨
                    </div>
                    <div>
                      <h4 className="text-rose-800 font-extrabold text-xs md:text-sm uppercase tracking-wider">
                        YENİ İLAN ALIMI DURDURULDU
                      </h4>
                      <p className="text-slate-600 text-[11px] md:text-xs font-semibold leading-relaxed mt-0.5">
                        Müsaitlik durumunuz <strong>"KAPALI"</strong> olduğu için yeni ilan akışı durdurulmuştur.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleAvailability}
                      disabled={isUpdatingAvailability}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] py-2.5 px-5 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm uppercase tracking-wider"
                    >
                      {isUpdatingAvailability ? 'Güncelleniyor...' : 'AKTİF YAP 🚀'}
                    </button>
                    <button
                      onClick={() => showAlert("Bilgi", "Hesabınız pasif modda kalmaya devam ediyor. İstediğiniz zaman aktif edebilirsiniz.", "info")}
                      className="bg-transparent border border-rose-200 text-rose-700 hover:bg-rose-100/40 font-extrabold text-[11px] py-2.5 px-4 rounded-xl cursor-pointer transition-all active:scale-95 uppercase tracking-wider"
                    >
                      PASİF TUT
                    </button>
                  </div>
                </div>
              )}

              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 border border-slate-100 p-6 rounded-[28px] shadow-sm mb-6">
                <div>
                  <h2 className="font-extrabold text-slate-900 tracking-tight text-2xl md:text-3xl leading-snug">
                    Yeni Fırsatlar
                  </h2>
                  <p className="text-slate-400 text-xs mt-1 font-semibold leading-relaxed">
                    Bölgenizdeki en yeni iş taleplerini inceleyin ve hemen teklif verin.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Availability Toggle Switch */}
                  <div className="flex items-center gap-3 bg-white border border-slate-200/80 px-4 py-2.5 rounded-2xl shadow-sm">
                    <span className="text-slate-700 text-xs font-bold uppercase tracking-wider">Yeni İş Alımı:</span>
                    <button
                      onClick={toggleAvailability}
                      disabled={isUpdatingAvailability}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        profile?.isAvailable ? 'bg-[#4c630a]' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          profile?.isAvailable ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className={`text-xs font-extrabold uppercase tracking-wide min-w-[32px] ${profile?.isAvailable ? 'text-[#4c630a]' : 'text-slate-500'}`}>
                      {profile?.isAvailable ? 'Açık' : 'Kapalı'}
                    </span>
                  </div>

                  {/* Filter & Sort buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => showAlert("Yakında", "Filtreleme özellikleri yakında aktif olacaktır.", "info")}
                      className="bg-white border border-slate-200/80 hover:border-[#4c630a]/40 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
                    >
                      <Filter className="w-3.5 h-3.5 text-slate-500" />
                      <span>Filtrele</span>
                    </button>
                    <button
                      onClick={() => showAlert("Yakında", "Sıralama parametreleri yakında eklenecektir.", "info")}
                      className="bg-white border border-slate-200/80 hover:border-[#4c630a]/40 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                      <span>Sırala</span>
                    </button>
                  </div>
                </div>
              </header>

              {/* ACTIVE OPPORTUNITIES GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                
                {/* If logged in and has actual jobs in database, render them. Otherwise show mockup grid */}
                {token ? (
                  jobs.length > 0 ? (
                    jobs.map((job) => (
                      <OpportunityCard
                        key={job.id}
                        job={job}
                        token={token}
                        renderMockupIcon={renderMockupIcon}
                        setActiveJob={setActiveJob}
                        setRejectingJob={setRejectingJob}
                        showAlert={showAlert}
                      />
                    ))
                  ) : (
                    /* Premium Empty State */
                    <div className="lg:col-span-2 bg-white p-12 rounded-[32px] border border-slate-100 shadow-[0_4px_30px_rgba(15,23,42,0.015)] text-center space-y-5 animate-scale-up py-16 w-full text-center">
                      <div className="w-16 h-16 bg-[#c8f252]/10 border border-[#c8f252]/30 rounded-full flex items-center justify-center mx-auto shadow-sm">
                        <Briefcase className="w-8 h-8 text-[#4c630a] stroke-[2.2]" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-extrabold text-slate-950 text-base">Aktif İş Fırsatı Bulunmuyor</h3>
                        <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed font-semibold">
                          Bölgenizde ve kategorinizde şu anda bekleyen aktif bir iş talebi bulunmamaktadır. 
                          Müşterilerimiz yeni talepler oluşturduğunda bu sayfada gerçek zamanlı (WebSocket) olarak anında listelenecektir!
                        </p>
                      </div>
                    </div>
                  )
                ) : (
                  // Preview State: Render exact screenshot cards with progress & countdown
                  MOCKUP_OPPORTUNITIES.map((opp) => (
                    <OpportunityCard
                      key={opp.id}
                      job={opp}
                      token={token}
                      renderMockupIcon={renderMockupIcon}
                      setActiveJob={setActiveJob}
                      showAlert={showAlert}
                    />
                  ))
                )}
              </div>
            </>
          ); })()}

          {activeTab === 'teklifler' && (
            <div className="space-y-6 animate-scale-up text-left">
              <div>
                <h2 className="font-extrabold text-slate-900 tracking-tight text-2xl md:text-3xl">
                  Teklif Verilenler
                </h2>
                <p className="text-slate-400 text-xs mt-1 font-semibold leading-relaxed">
                  Gönderdiğiniz aktif teklifleri ve durumlarını bu ekrandan takip edin.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch w-full">
                {offersList.length > 0 ? (
                  offersList.map((off) => (
                    <div key={off.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="bg-[#c8f252]/10 border border-[#c8f252]/30 text-[#4c630a] text-[10px] font-black px-2.5 py-0.5 rounded uppercase font-mono tracking-wider">
                              {off.job.categoryName}
                            </span>
                            {off.job.is_direct && (
                              <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                                🌟 Sadık Müşteriden Özel
                              </span>
                            )}
                          </div>
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded uppercase font-mono tracking-wider ${
                            off.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            off.status === 'rejected' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                            'bg-amber-50 text-amber-705 border border-amber-100'
                          }`}>
                            {off.status === 'accepted' ? 'Kabul Edildi' : off.status === 'rejected' ? 'Reddedildi' : 'Beklemede'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-650 font-semibold italic text-left bg-slate-50 p-3 rounded-xl border border-slate-100">
                          &ldquo;{off.message || 'Teklif mesajı boş bırakıldı.'}&rdquo;
                        </p>
                        <div className="text-xs space-y-1.5 text-slate-600 font-semibold border-t border-slate-50 pt-2.5">
                          <div><strong>Müşteri Konumu:</strong> {off.job.district}</div>
                          <div><strong>Talep Açıklaması:</strong> <span className="whitespace-pre-line">{formatDetails(off.job.details)}</span></div>
                        </div>
                      </div>
                      <div className="border-t border-slate-50 pt-3 flex justify-between items-center">
                        <div className="flex flex-col text-left">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Teklif Fiyatı</span>
                          <span className="text-slate-900 font-black text-sm mt-1">₺{off.price.toLocaleString("tr-TR")}</span>
                        </div>
                        <div className="flex items-center gap-3">

                          <span className="text-[10px] text-slate-400 font-mono font-bold">
                            {new Date(off.created_at).toLocaleDateString("tr-TR")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="lg:col-span-2 bg-white p-12 rounded-[32px] border border-slate-100 text-center py-16 w-full">
                    <span className="text-3xl">📝</span>
                    <h3 className="font-extrabold text-slate-950 text-base mt-3">Verilmiş Teklif Yok</h3>
                    <p className="text-slate-400 text-xs mt-1">Henüz hiçbir iş fırsatına teklif göndermediniz. Fırsatlar sekmesinden teklif verebilirsiniz.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'kazanilanlar' && (
            <div className="space-y-6 animate-scale-up text-left">
              <div>
                <h2 className="font-extrabold text-slate-900 tracking-tight text-2xl md:text-3xl">
                  Kazanılan İşler
                </h2>
                <p className="text-slate-400 text-xs mt-1 font-semibold leading-relaxed">
                  Müşterilerinizin onayladığı işleri görün, iletişime geçip hemen başlayın.
                </p>
              </div>

              {(() => {
                const yearsList = Object.keys(groupedWonJobs).map(Number).sort((a, b) => b - a);
                const activeYear = yearsList.includes(selectedYear) ? selectedYear : (yearsList[0] || new Date().getFullYear());
                const monthsInActiveYear = groupedWonJobs[activeYear] || {};
                const sortedMonths = Object.keys(monthsInActiveYear).map(Number).sort((a, b) => b - a);
                const MONTH_NAMES = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

                if (wonJobs.length === 0) {
                  return (
                    <div className="bg-white p-12 rounded-[32px] border border-slate-100 text-center py-16 w-full">
                      <span className="text-3xl">🤝</span>
                      <h3 className="font-extrabold text-slate-950 text-base mt-3">Kazanılan İş Yok</h3>
                      <p className="text-slate-400 text-xs mt-1">Tekliflerinizi gönderdikten sonra müşteriler onayladığında bu sekmede listelenecektir.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-8 w-full">
                    {/* Yıl Seçici Sekmeleri */}
                    {yearsList.length > 1 && (
                      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4 mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 font-mono">Yıl Filtresi:</span>
                        {yearsList.map((y) => (
                          <button
                            key={y}
                            onClick={() => setSelectedYear(y)}
                            className={`px-4.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border active:scale-95 ${
                              activeYear === y
                                ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                                : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200/85'
                            }`}
                          >
                            {y} Yılı
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Aylara Göre Gruplanmış Liste */}
                    <div className="space-y-10">
                      {sortedMonths.map((m) => {
                        const monthName = MONTH_NAMES[m] || `${m + 1}. Ay`;
                        const jobsInMonth = monthsInActiveYear[m] || [];
                        
                        return (
                          <div key={m} className="space-y-4">
                            {/* Ay Başlığı */}
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-2.5">
                              <span className="bg-slate-900 text-[#c8f252] text-[10px] font-black px-3 py-1 rounded-lg uppercase font-mono tracking-wider shadow-sm">
                                {monthName} {activeYear}
                              </span>
                              <span className="text-[11px] text-slate-400 font-bold font-sans">
                                ({jobsInMonth.length} Kazanılan İş)
                              </span>
                              <div className="h-[1px] bg-slate-100 flex-1"></div>
                            </div>

                            {/* İş Kartları Izgarası */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch w-full">
                              {jobsInMonth.map((wj) => (
                                <div key={wj.id} className="bg-white p-6 rounded-[24px] border border-slate-150 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 animate-scale-up">
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-start gap-4">
                                      <div className="flex flex-col gap-1 items-start">
                                        <span className="bg-[#c8f252]/10 border border-[#c8f252]/30 text-[#4c630a] text-[10px] font-black px-2.5 py-0.5 rounded uppercase font-mono tracking-wider">
                                          {wj.job.categoryName}
                                        </span>
                                        {wj.job.is_direct && (
                                          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                                            🌟 Sadık Müşteriden Özel
                                          </span>
                                        )}
                                      </div>
                                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black px-2.5 py-0.5 rounded uppercase font-mono tracking-wider">
                                        Anlaşma Sağlandı
                                      </span>
                                    </div>
                                    <div className="text-xs space-y-2 text-slate-700 font-semibold border-t border-slate-50 pt-3">
                                      <div><strong>Müşteri:</strong> {wj.job.name}</div>
                                      <div className="flex items-center gap-1.5">
                                        <strong>Telefon:</strong> 
                                        <span className="font-mono text-slate-900 font-black bg-slate-50 px-2 py-0.5 border border-slate-100 rounded">{wj.job.phone}</span>
                                      </div>
                                      <div><strong>Konum:</strong> {wj.job.district}</div>
                                      <div>
                                        <strong>Kabul Tarihi:</strong>{' '}
                                        <span className="text-slate-800 font-bold">
                                          {new Date(wj.accepted_at).toLocaleDateString("tr-TR", { 
                                            day: 'numeric', 
                                            month: 'long', 
                                            year: 'numeric',
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                          })}
                                        </span>
                                      </div>

                                      {/* Randevu Tarihi Görünümü */}
                                      {wj.appointment_at && (
                                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 flex items-center gap-2.5 mt-2">
                                          <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                                          <div className="text-[11px] font-bold text-blue-800">
                                            Randevu Tarihi: {new Date(wj.appointment_at).toLocaleString("tr-TR", {
                                              day: '2-digit',
                                              month: '2-digit',
                                              year: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </div>
                                        </div>
                                      )}

                                      {/* İş Başlama Tarihi Görünümü */}
                                      {wj.started_at && (
                                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 flex items-center gap-2.5 mt-2">
                                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                                          <div className="text-[11px] font-bold text-emerald-800">
                                            İş Başlatıldı: {new Date(wj.started_at).toLocaleString("tr-TR", {
                                              day: '2-digit',
                                              month: '2-digit',
                                              year: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </div>
                                        </div>
                                      )}

                                      <p className="italic bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 mt-2 font-semibold text-slate-650 leading-relaxed whitespace-pre-line">
                                        &ldquo;{formatDetails(wj.job.details)}&rdquo;
                                      </p>
                                    </div>
                                  </div>
                                  <div className="border-t border-slate-100 pt-3.5 flex items-center justify-between gap-3">
                                    <div className="text-left">
                                      <span className="text-[9px] block text-slate-400 font-bold uppercase tracking-wider">Anlaşılan Fiyat</span>
                                      <span className="text-slate-900 font-black text-base">₺{wj.price.toLocaleString("tr-TR")}</span>
                                    </div>
                                    <div className="flex gap-2 items-center flex-wrap">

                                      
                                      {/* Randevu Oluştur / Güncelle Butonu */}
                                      <button
                                        onClick={() => {
                                          const existingDate = wj.appointment_at ? new Date(wj.appointment_at).toISOString().slice(0, 16) : '';
                                          setAppointmentModal({
                                            isOpen: true,
                                            job: wj,
                                            appointmentDate: existingDate,
                                          });
                                        }}
                                        className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-extrabold text-[11px] py-2.5 px-4.5 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm"
                                      >
                                        {wj.appointment_at ? 'Randevu Güncelle' : 'Randevu Oluştur'}
                                      </button>

                                      {/* İşe Başla Butonu */}
                                      {wj.appointment_at && !wj.started_at && (
                                        <button
                                          onClick={() => handleStartJob(wj)}
                                          disabled={submittingStartJob[wj.id]}
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] py-2.5 px-4.5 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm disabled:opacity-50"
                                        >
                                          {submittingStartJob[wj.id] ? 'Başlatılıyor...' : 'İşe Başla'}
                                        </button>
                                      )}

                                      {wj.isPendingSeeker ? (
                                        <>
                                          <button
                                            disabled
                                            className="bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed font-black text-[11px] py-2.5 px-4.5 rounded-xl shadow-sm"
                                          >
                                            İşi Tamamla
                                          </button>
                                          <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black px-2.5 py-1.5 rounded-xl uppercase tracking-wider flex items-center gap-1.5 select-none">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                            Onay Bekliyor
                                          </span>
                                        </>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            setCompletingJob(wj);
                                            setDeclarePrice(wj.price ? Number(wj.price).toLocaleString('tr-TR') : '');
                                          }}
                                          disabled={!wj.started_at}
                                          className={`font-black text-[11px] py-2.5 px-4.5 rounded-xl transition-all shadow-sm ${
                                            wj.started_at
                                              ? 'bg-[#c8f252] hover:bg-[#b5e639] text-slate-950 cursor-pointer active:scale-95'
                                              : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                          }`}
                                        >
                                          İşi Tamamla
                                        </button>
                                      )}

                                      {!wj.isPendingSeeker && (
                                        <button
                                          onClick={() => {
                                            setCancelModal({
                                              isOpen: true,
                                              acceptedOfferId: wj.id,
                                              reasonCode: '',
                                              reasonText: '',
                                            });
                                          }}
                                          className="bg-white hover:bg-red-50 text-red-500 border border-red-200 font-extrabold text-[11px] py-2.5 px-4.5 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm"
                                        >
                                          İşi İptal Et
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === 'tamamlananlar' && (() => {
            const openDoorJobsCount = completedJobs.filter(cj => !cj.is_direct && Number(cj.commission_rate) === 0).length;
            return (
              <div className="space-y-6 animate-scale-up text-left w-full">
                <div>
                  <h2 className="font-extrabold text-slate-900 tracking-tight text-2xl md:text-3xl">
                    Tamamlanan İşler
                  </h2>
                  <p className="text-slate-400 text-xs mt-1 font-semibold leading-relaxed">
                    Başarıyla tamamlayıp teslim ettiğiniz geçmiş işleriniz.
                  </p>
                </div>

                {openDoorJobsCount > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-[20px] p-4 flex items-center gap-3.5 text-left w-full">
                    <div className="bg-emerald-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-black shrink-0 shadow-sm shadow-emerald-100">
                      🎉
                    </div>
                    <div>
                      <h4 className="font-extrabold text-emerald-950 text-sm">Sadık Müşteri Avantajı Raporu</h4>
                      <p className="text-emerald-700 text-xs mt-0.5 font-semibold">
                        Kendi müşterinizi platforma taşıdığınız için kazandığınız <strong>{openDoorJobsCount} adet</strong> genel havuz işini <strong>%0 komisyon</strong> ile tamamladınız!
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-4 w-full">
                  {completedJobs.length > 0 ? (
                    completedJobs.map((cj) => (
                      <div key={cj.id} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full overflow-hidden">
                        {/* Sol Bölüm: Kategori, Müşteri ve İş Bilgisi */}
                        <div className="flex-grow min-w-0 w-full md:w-auto space-y-2 text-left">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-[#c8f252]/10 border border-[#c8f252]/30 text-[#4c630a] text-[10px] font-black px-2.5 py-0.5 rounded uppercase font-mono tracking-wider">
                              {cj.job.categoryName}
                            </span>
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black px-2.5 py-0.5 rounded uppercase font-mono tracking-wider">
                              Tamamlandı
                            </span>
                            {!cj.is_direct && Number(cj.commission_rate) === 0 && (
                              <span className="bg-emerald-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded uppercase font-mono tracking-wider flex items-center gap-1 shadow-sm shadow-emerald-100">
                                🌟 <span className="hidden sm:inline">Sadık Müşteri Hediyesi (%0 Komisyon)</span><span className="sm:hidden">Sadık Müşteri (%0)</span>
                              </span>
                            )}
                            {cj.is_direct && (
                              <span className="bg-amber-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded uppercase font-mono tracking-wider">
                                <span className="hidden sm:inline">Doğrudan İş (%0 Komisyon)</span><span className="sm:hidden">Doğrudan İş (%0)</span>
                              </span>
                            )}
                          </div>
                          <div className="text-xs space-y-1 text-slate-600 font-semibold">
                            <div><strong className="text-slate-800">Müşteri:</strong> {cj.job.name}</div>
                            <div><strong className="text-slate-800">Konum:</strong> {cj.job.district}</div>
                            <div className="text-slate-500 font-medium break-words mt-1 leading-relaxed whitespace-pre-line"><strong className="text-slate-800 font-semibold font-mono">Detay:</strong> {formatDetails(cj.job.details)}</div>
                          </div>
                        </div>

                        {/* Orta Bölüm: Fiyat ve Tarih */}
                        <div className="flex flex-col items-start md:items-end justify-center min-w-[120px] text-left md:text-right border-l md:border-l-0 md:border-r border-slate-100 pl-4 md:pl-0 md:pr-6 py-1 shrink-0">
                          <span className="text-slate-900 font-black text-base">₺{cj.price.toLocaleString("tr-TR")}</span>
                          <span className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">
                            {new Date(cj.completed_at).toLocaleDateString("tr-TR")}
                          </span>
                        </div>

                        {/* Sağ Bölüm: Komisyon Bilgileri (Yatay Sıralanan Kartın En Sonunda) */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between md:justify-end gap-6 w-full md:w-auto min-w-[200px] shrink-0 text-left md:text-right">
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Komisyon Oranı</p>
                            <p className="text-xs font-extrabold text-slate-800 font-mono bg-white border border-slate-200 px-2 py-0.5 rounded-lg inline-block">
                              %{cj.commission_rate ?? 0}
                            </p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Komisyon Tutarı</p>
                            <p className="text-sm font-black text-rose-600 font-mono">
                              ₺{((cj.price * (cj.commission_rate ?? 0)) / 100).toLocaleString("tr-TR")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                  <div className="bg-white p-12 rounded-[32px] border border-slate-100 text-center py-16 w-full">
                    <span className="text-3xl">🏆</span>
                    <h3 className="font-extrabold text-slate-950 text-base mt-3">Tamamlanan İş Yok</h3>
                    <p className="text-slate-400 text-xs mt-1">Tamamladığınız ve her iki tarafça onaylanan iş geçmişiniz burada listelenecektir.</p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

          {activeTab === 'kayip_iptal' && (
            <div className="space-y-6 animate-scale-up text-left">
              <div>
                <h2 className="font-extrabold text-slate-900 tracking-tight text-2xl md:text-3xl flex items-center gap-2">
                  <XCircle className="w-8 h-8 text-slate-600" />
                  <span>Kaybedilen ve İptal Edilenler</span>
                </h2>
                <p className="text-slate-400 text-xs mt-1 font-semibold leading-relaxed">
                  Kaybettiğiniz, müşteri tarafından iptal edilen veya başka usta tercih edildiği için iptal olan teklifleriniz.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch w-full">
                {lostAndCancelledJobs.length > 0 ? (
                  lostAndCancelledJobs.map((item) => {
                    let badgeClass = "bg-slate-50 text-slate-500 border border-slate-100";
                    if (item.labelText === "İptal Edildi") {
                      badgeClass = "bg-rose-50 text-rose-700 border border-rose-100";
                    } else if (item.labelText === "İlan İptal Edildi") {
                      badgeClass = "bg-amber-50 text-amber-700 border border-amber-100";
                    } else if (item.cancelled_by === 'service_provider') {
                      badgeClass = "bg-red-50 text-red-700 border border-red-100";
                    }

                    return (
                      <div key={item.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 relative overflow-hidden">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-4">
                            <span className="bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-black px-2.5 py-0.5 rounded uppercase font-mono tracking-wider">
                              {item.job?.categoryName || "Hizmet"}
                            </span>
                            <span className={`${badgeClass} text-[10px] font-black px-2.5 py-0.5 rounded uppercase font-mono tracking-wider`}>
                              {item.labelText}
                            </span>
                          </div>
                          
                          {item.labelText === "İptal Edildi" && !item.cancelled_by && (
                            <div className="bg-rose-50/50 border border-rose-100/50 rounded-xl p-3 text-[11px] text-rose-800 font-medium">
                              ⚠️ Hizmet alan taraf başka bir firma teklifini onayladı. Bu işteki hakkınız sonlandırılmıştır.
                            </div>
                          )}

                          {item.cancelled_by === "service_provider" && (
                            <div className="bg-red-50/50 border border-red-100/50 rounded-xl p-3 text-[11px] text-red-800 font-semibold leading-relaxed">
                              ⚠️ Bu işi tek taraflı olarak iptal ettiniz. Müşteriye SMS/Sistem bildirimi gönderilmiştir.
                            </div>
                          )}

                          <div className="text-xs space-y-1.5 text-slate-600 font-semibold border-t border-slate-50 pt-2.5">
                            <div><strong>Müşteri:</strong> {item.job?.name || "Müşteri"}</div>
                            <div><strong>Konum:</strong> {item.job?.district || "Belirtilmemiş"}</div>
                            <div><strong>Açıklama:</strong> <span className="whitespace-pre-line">{formatDetails(item.job?.details) || "Detay yok"}</span></div>
                            {item.message && (
                              <div className="bg-slate-50 p-2 rounded-lg mt-2 text-slate-500 text-[11px] font-medium italic">
                                &ldquo;{item.message}&rdquo;
                              </div>
                            )}
                          </div>

                          {item.competitorOffers && item.competitorOffers.length > 0 && (
                            <div className="border-t border-slate-50 pt-3.5 mt-3 space-y-2.5 text-left animate-scale-up">
                              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block font-mono">
                                Rakiplerin Verdiği Teklifler
                              </span>
                              <div className="bg-slate-50/50 border border-slate-100/70 rounded-2xl p-3.5 space-y-2 text-xs font-semibold">
                                {(() => {
                                  let competitorIndex = 1;
                                  return item.competitorOffers.map((off: any, idx: number) => {
                                    if (off.isMe) {
                                      return (
                                        <div key={idx} className="flex justify-between items-center text-blue-600 bg-blue-50/50 px-3 py-1.5 rounded-xl border border-blue-100/50">
                                          <span className="font-extrabold">Sizin Teklifiniz:</span>
                                          <span className="font-black text-sm">₺{off.price.toLocaleString("tr-TR")}</span>
                                        </div>
                                      );
                                    } else {
                                      return (
                                        <div key={idx} className="flex justify-between items-center text-slate-600 px-2 py-0.5">
                                          <span>{competitorIndex++}. Teklif Veren (Anonim):</span>
                                          <span className="font-extrabold text-slate-800">₺{off.price.toLocaleString("tr-TR")}</span>
                                        </div>
                                      );
                                    }
                                  });
                                })()}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="border-t border-slate-50 pt-3 flex justify-between items-center">
                          <div>
                            <span className="text-slate-400 text-[10px] block font-bold uppercase tracking-wider">Verdiğiniz Teklif</span>
                            <span className="text-slate-900 font-black text-sm">₺{item.price.toLocaleString("tr-TR")}</span>
                          </div>
                          <span className="text-[10px] text-slate-450 font-mono font-bold">
                            {new Date(item.created_at).toLocaleDateString("tr-TR")}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="lg:col-span-2 bg-white p-12 rounded-[32px] border border-slate-100 text-center py-16 w-full">
                    <span className="text-3xl">🕊️</span>
                    <h3 className="font-extrabold text-slate-950 text-base mt-3">Kaybedilen veya İptal Edilen İş Yok</h3>
                    <p className="text-slate-400 text-xs mt-1">Bu alanda kaybettiğiniz teklifleriniz veya iptal edilen ilanlar gösterilecektir.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'uyusmazliklar' && (
            <div className="space-y-6 animate-scale-up text-left">
              <div>
                <h2 className="font-extrabold text-slate-900 tracking-tight text-2xl md:text-3xl flex items-center gap-2">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                  <span>Uyuşmazlık Çözüm Merkezi</span>
                </h2>
                <p className="text-slate-400 text-xs mt-1 font-semibold leading-relaxed">
                  Hizmet alan müşteriler ile beyan edilen ücretlerin uyuşmadığı, kalite incelemesinde olan işleriniz.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch w-full">
                {disputesList.length > 0 ? (
                  disputesList.map((disp) => {
                    const diffPct = disp.amountDiffPct || 0;
                    const isRedAlarm = disp.alarmLevel === 'red' || diffPct > 30 || disp.seekerDeclaredAmount === 0;
                    return (
                      <div key={disp.id} className={`bg-white p-6 rounded-[24px] border ${isRedAlarm ? 'border-red-200 shadow-red-50/20' : 'border-amber-200 shadow-amber-50/20'} shadow-md transition-all flex flex-col justify-between gap-5 relative overflow-hidden`}>
                        <div className={`absolute top-0 left-0 right-0 h-1.5 ${isRedAlarm ? 'bg-red-500' : 'bg-amber-500'}`} />
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-4">
                            <span className="bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-black px-2.5 py-0.5 rounded uppercase font-mono tracking-wider">
                              {disp.job.categoryName}
                            </span>
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded uppercase font-mono tracking-wider border ${
                              isRedAlarm 
                                ? 'bg-red-50 border-red-100 text-red-655' 
                                : 'bg-amber-50 border-amber-100 text-amber-600'
                            }`}>
                              {isRedAlarm ? 'Kritik Alarm (%30+ veya Red)' : 'Uyuşmazlık İnceleme'}
                            </span>
                          </div>

                          <div className="text-xs space-y-1.5 text-slate-600 font-semibold pt-2 border-t border-slate-50">
                            <div><strong>Müşteri:</strong> {disp.job.name}</div>
                            <div><strong>Konum:</strong> {disp.job.district}</div>
                            <div><strong>Talep Açıklaması:</strong> <span className="whitespace-pre-line">{formatDetails(disp.job.details) || 'Belirtilmedi'}</span></div>
                          </div>

                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs space-y-2 mt-2">
                            <div className="flex justify-between font-semibold">
                              <span className="text-slate-500">Sizin Beyanınız:</span>
                              <span className="text-slate-900 font-extrabold">₺{disp.providerDeclaredAmount?.toLocaleString("tr-TR")}</span>
                            </div>
                            <div className="flex justify-between font-semibold border-b border-slate-200/50 pb-2">
                              <span className="text-slate-500">Müşterinin İddiası:</span>
                              <span className="text-red-655 font-extrabold">
                                {disp.seekerDeclaredAmount === 0 ? 'Hizmet Almadım / Red' : `₺${disp.seekerDeclaredAmount?.toLocaleString("tr-TR")}`}
                              </span>
                            </div>
                            <div className="flex justify-between font-bold pt-1 text-slate-800">
                              <span>Sapma / Fiyat Farkı:</span>
                              <span className={`${isRedAlarm ? 'text-red-655' : 'text-amber-600'} font-black`}>
                                ₺{disp.amountDiff?.toLocaleString("tr-TR")} ({diffPct.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-slate-50 pt-3.5 space-y-2">
                          <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                            💡 <strong>Çözüm Süreci:</strong> Kalite personeli ekibimiz uyuşmazlığı incelemeye almıştır. En kısa sürede iki tarafla da kayıtlı numaralar üzerinden iletişime geçilecektir.
                          </p>
                          <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono font-bold pt-1">
                            <span>Kayıt: #{disp.id.substring(0, 8)}</span>
                            <span>{new Date(disp.created_at).toLocaleDateString("tr-TR")}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="lg:col-span-2 bg-white p-12 rounded-[32px] border border-slate-100 text-center py-16 w-full shadow-sm">
                    <span className="text-3xl">🛡️</span>
                    <h3 className="font-extrabold text-slate-950 text-base mt-3">Uyuşmazlıklı İş Yok</h3>
                    <p className="text-slate-400 text-xs mt-1">Müşteriyle fiyat uyuşmazlığı yaşadığınız herhangi bir aktif inceleme kaydı bulunmamaktadır.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'yorumlar' && (
            <div className="space-y-6 animate-scale-up text-left">
              <div>
                <h2 className="font-extrabold text-slate-900 tracking-tight text-2xl md:text-3xl">
                  Yorumlar & Puanlar
                </h2>
                <p className="text-slate-400 text-xs mt-1 font-semibold leading-relaxed">
                  Hizmet alan müşterilerinizin sizin hakkınızda bıraktığı yorumlar.
                </p>
              </div>

              <div className="space-y-6 w-full max-w-4xl">
                {reviews.length > 0 ? (
                  reviews.map((rev) => (
                    <div key={rev.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs text-amber-550 font-black">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</span>
                          <h4 className="font-black text-slate-800 text-sm mt-1">{rev.reviewerName}</h4>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono font-bold">
                          {new Date(rev.created_at).toLocaleDateString("tr-TR")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-655 font-semibold bg-slate-50 p-4 rounded-xl border border-slate-100 italic leading-relaxed">
                        &ldquo;{rev.comment}&rdquo;
                      </p>
                      <span className="text-[9px] bg-[#c8f252]/10 border border-[#c8f252]/30 text-[#4c630a] px-2.5 py-0.5 rounded font-mono font-black tracking-wider uppercase inline-block">
                        {rev.categoryName}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="bg-white p-12 rounded-[32px] border border-slate-100 text-center py-16 w-full">
                    <span className="text-3xl">⭐</span>
                    <h3 className="font-extrabold text-slate-950 text-base mt-3">Değerlendirme Bulunmuyor</h3>
                    <p className="text-slate-400 text-xs mt-1">Müşterileriniz tamamlanan işler için puanlama ve yorum yaptığında burada gösterilecektir.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'kpi' && (
            <div className="space-y-6 animate-scale-up text-left">
              <div>
                <h2 className="font-extrabold text-slate-900 tracking-tight text-2xl md:text-3xl flex items-center gap-2">
                  <TrendingUp className="w-7 h-7 text-[#4c630a]" />
                  <span>Rakip İstatistikleri & KPI Analizi</span>
                </h2>
                <p className="text-slate-400 text-xs mt-1 font-semibold leading-relaxed">
                  Bölgenizdeki rekabet durumunu ve fiyat politikalarını analiz ederek iş kazanma şansınızı optimize edin.
                </p>
              </div>

              {/* Filters bar */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center justify-between">
                {/* Category Dropdown */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-500 uppercase">Kategori:</span>
                  <select
                    value={providerKpiSelectedCategorySlug}
                    onChange={(e) => setProviderKpiSelectedCategorySlug(e.target.value)}
                    className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2 text-xs font-black text-slate-700 outline-none focus:border-slate-300"
                  >
                    {providerKpiData?.reports?.map((rep: any) => (
                      <option key={rep.categorySlug} value={rep.categorySlug}>
                        {rep.categoryName}
                      </option>
                    ))}
                    {(!providerKpiData?.reports || providerKpiData.reports.length === 0) && (
                      <option value="">Yükleniyor...</option>
                    )}
                  </select>
                </div>

                {/* Period selector */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-500 uppercase">Periyot:</span>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setProviderKpiPeriod('weekly')}
                      className={`text-[10px] font-black py-1.5 px-3.5 rounded-lg transition-all cursor-pointer ${
                        providerKpiPeriod === 'weekly' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Haftalık
                    </button>
                    <button
                      onClick={() => setProviderKpiPeriod('monthly')}
                      className={`text-[10px] font-black py-1.5 px-3.5 rounded-lg transition-all cursor-pointer ${
                        providerKpiPeriod === 'monthly' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Aylık
                    </button>
                    <button
                      onClick={() => setProviderKpiPeriod('six_months')}
                      className={`text-[10px] font-black py-1.5 px-3.5 rounded-lg transition-all cursor-pointer ${
                        providerKpiPeriod === 'six_months' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      6 Aylık
                    </button>
                  </div>
                </div>
              </div>

              {loadingProviderKpi ? (
                <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-4 border-slate-100 border-t-[#4c630a] animate-spin mb-3"></div>
                  <p className="text-slate-400 text-xs font-bold">Performans raporu hesaplanıyor...</p>
                </div>
              ) : providerKpiData ? (() => {
                const currentReport = providerKpiData.reports?.find(
                  (r: any) => r.categorySlug === providerKpiSelectedCategorySlug
                ) || providerKpiData.reports?.[0];

                if (!currentReport) {
                  return (
                    <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm text-center">
                      <p className="text-slate-400 text-xs font-bold">Seçilen kategoriye ait veri bulunamadı.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6 max-w-4xl">
                    {/* Bölge Durum Özeti */}
                    <div className="bg-gradient-to-r from-[#4c630a]/5 to-[#c8f252]/10 border border-[#4c630a]/15 p-5 rounded-[24px] shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[#c8f252]/10 rounded-full blur-xl pointer-events-none"></div>
                      <h4 className="font-extrabold text-[#4c630a] text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4c630a] animate-ping"></span>
                        Bölge Durum Özeti
                      </h4>
                      <p className="text-sm font-black text-slate-800 leading-relaxed">
                        {currentReport.summary}
                      </p>
                    </div>

                    {/* Anonim Rekabet Tablosu & Gelişim Tavsiyesi Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      {/* Competitor list */}
                      <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/60">
                          <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                            <Award className="w-4 h-4 text-[#4c630a]" />
                            <span>Anonim Rekabet Tablosu</span>
                          </h3>
                        </div>

                        <div className="divide-y divide-slate-100">
                          {currentReport.competitorTable?.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-xs italic">
                              Henüz iş kazanan usta kaydı bulunamadı.
                            </div>
                          ) : (
                            currentReport.competitorTable?.map((row: any) => (
                              <div
                                key={row.rank + '-' + row.name}
                                className={`px-6 py-4 flex justify-between items-center transition-colors ${
                                  row.isMe 
                                    ? 'bg-[#c8f252]/15 border-l-4 border-l-[#4c630a]' 
                                    : 'hover:bg-slate-50/60'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-black ${
                                    row.isMe 
                                      ? 'bg-[#4c630a] text-white' 
                                      : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    {row.rank}
                                  </span>
                                  <span className={`text-xs ${row.isMe ? 'font-black text-[#4c630a]' : 'font-bold text-slate-700'}`}>
                                    {row.name}
                                  </span>
                                </div>
                                <span className={`text-xs font-black ${row.isMe ? 'text-slate-900' : 'text-slate-500'}`}>
                                  {row.wonJobs} İş Kazandı
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Gelişim Tavsiyesi */}
                      <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6 space-y-4">
                        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                          <div className="w-8 h-8 rounded-xl bg-[#c8f252]/20 flex items-center justify-center text-[#4c630a]">
                            <Briefcase className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                              Gelişim Tavsiyesi
                            </h3>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Yapay Zeka & Sistem Önerisi</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-655 font-semibold leading-relaxed bg-[#c8f252]/5 border border-[#c8f252]/10 p-4.5 rounded-2xl italic">
                          &ldquo;{currentReport.advice}&rdquo;
                        </p>

                        {/* Price Comparison */}
                        <div className="grid grid-cols-2 gap-4 pt-1">
                          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Kazanan Teklif Ortalaması</span>
                            <p className="text-base font-black text-[#4c630a] mt-1">
                              {currentReport.winningPriceAvg ? `₺${currentReport.winningPriceAvg.toLocaleString('tr-TR')}` : '₺-'}
                            </p>
                          </div>
                          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Sizin Teklif Ortalamanız</span>
                            <p className="text-base font-black text-slate-800 mt-1">
                              {currentReport.myPriceAvg ? `₺${currentReport.myPriceAvg.toLocaleString('tr-TR')}` : '₺-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm text-center">
                  <p className="text-slate-400 text-sm font-bold">Raporlar yüklenemedi. Lütfen tekrar deneyin.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'belge-dogrulama' && (
            <div className="space-y-8 animate-scale-up text-left w-full">
              <div>
                <h2 className="font-extrabold text-slate-900 tracking-tight text-2xl md:text-3xl flex items-center gap-3">
                  <FileText className="w-8 h-8 text-amber-500 stroke-[2.5]" />
                  <span>Belge Doğrulama ve Onay Akışı</span>
                </h2>
                <p className="text-slate-400 text-xs mt-1 font-semibold leading-relaxed">
                  Esnaaf partner ağında yer almak ve canlı iş fırsatlarına teklif verebilmek için lütfen kimlik belgenizi ve vergi levhanızı yükleyin.
                </p>
              </div>

              {profile && !profile.isApproved && (
                <div className="bg-amber-50/60 border border-amber-200/60 rounded-3xl p-5 flex items-start gap-4 shadow-sm">
                  <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-amber-900 text-sm">Hesabınız Onay Bekliyor</h4>
                    <p className="text-amber-800/80 text-xs leading-relaxed font-medium">
                      Yüklediğiniz belgeler yetkililerimiz tarafından en kısa sürede kontrol edilecektir. Onay süreci tamamlanana kadar iş fırsatlarını göremez ve teklif iletemezsiniz.
                    </p>
                  </div>
                </div>
              )}

              {profile && profile.isApproved && (
                <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-3xl p-5 flex items-start gap-4 shadow-sm">
                  <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-emerald-900 text-sm">Tebrikler, Hesabınız Onaylandı!</h4>
                    <p className="text-emerald-800/80 text-xs leading-relaxed font-medium">
                      Tüm doğrulama belgeleriniz kontrol edilmiş ve onaylanmıştır. Artık canlı müşteri taleplerini inceleyebilir ve teklifler sunabilirsiniz!
                    </p>
                  </div>
                </div>
              )}

              {onboardingError && (
                <div className="bg-red-50/80 border border-red-200/60 rounded-3xl p-4 text-xs font-bold text-red-600 flex items-center gap-2">
                  <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                  <span>{onboardingError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 1. Kimlik Belgesi Card */}
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[360px] relative overflow-hidden group">
                  <div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">T.C. KİMLİK KARTI</span>
                      {profile?.identityDocument ? (
                        <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">YÜKLENDİ</span>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">YÜKLENMEDİ</span>
                      )}
                    </div>

                    <h3 className="font-black text-slate-900 text-base">Kimlik Belgesi Görseli</h3>
                    <p className="text-slate-450 text-xs mt-1 leading-relaxed font-medium">
                      Kimlik kartınızın veya ehliyetinizin ön yüzünün net çekilmiş bir görselini yükleyin.
                    </p>

                    {profile?.identityDocument && (
                      <div className="mt-5 relative w-full h-32 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 group-hover:shadow-md transition-shadow">
                        {profile.identityDocument.endsWith('.pdf') ? (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-slate-500">
                            <FileText className="w-8 h-8 text-slate-400" />
                            <span className="text-[10px] font-extrabold uppercase font-mono">PDF DOKÜMANI</span>
                          </div>
                        ) : (
                          <img src={profile.identityDocument} alt="Kimlik Önizleme" className="w-full h-full object-cover" />
                        )}
                        <a 
                          href={profile.identityDocument} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-black gap-1.5"
                        >
                          <Eye className="w-4 h-4" />
                          Görüntüle
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <label className={`w-full flex items-center justify-center gap-2 font-black text-xs py-3.5 rounded-2xl transition-all cursor-pointer border ${
                      uploadingIdentity 
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-wait' 
                        : 'bg-[#c8f252] text-slate-950 hover:bg-[#b5e639] border-transparent shadow-sm'
                    }`}>
                      {uploadingIdentity ? (
                        <>Yükleniyor...</>
                      ) : (
                        <>
                          <FileText className="w-4 h-4" />
                          <span>{profile?.identityDocument ? 'Yeni Belge Yükle' : 'Belge Seç ve Yükle'}</span>
                        </>
                      )}
                      <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/webp, application/pdf" 
                        onChange={(e) => handleDocumentUpload(e, 'identity')} 
                        disabled={uploadingIdentity} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>

                {/* 2. Vergi Levhası Card */}
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[360px] relative overflow-hidden group">
                  <div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">MALİYE BELGESİ</span>
                      {profile?.taxPlateDocument ? (
                        <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">YÜKLENDİ</span>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">YÜKLENMEDİ</span>
                      )}
                    </div>

                    <h3 className="font-black text-slate-900 text-base">Vergi Levhası</h3>
                    <p className="text-slate-450 text-xs mt-1 leading-relaxed font-medium">
                      Güncel vergi levhanızın PDF formatını veya net çekilmiş görselini yükleyin.
                    </p>

                    {profile?.taxPlateDocument && (
                      <div className="mt-5 relative w-full h-32 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 group-hover:shadow-md transition-shadow">
                        {profile.taxPlateDocument.endsWith('.pdf') ? (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-slate-500">
                            <FileText className="w-8 h-8 text-slate-400" />
                            <span className="text-[10px] font-extrabold uppercase font-mono">PDF DOKÜMANI</span>
                          </div>
                        ) : (
                          <img src={profile.taxPlateDocument} alt="Vergi Levhası Önizleme" className="w-full h-full object-cover" />
                        )}
                        <a 
                          href={profile.taxPlateDocument} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-black gap-1.5"
                        >
                          <Eye className="w-4 h-4" />
                          Görüntüle
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <label className={`w-full flex items-center justify-center gap-2 font-black text-xs py-3.5 rounded-2xl transition-all cursor-pointer border ${
                      uploadingTaxPlate 
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-wait' 
                        : 'bg-[#c8f252] text-slate-950 hover:bg-[#b5e639] border-transparent shadow-sm'
                    }`}>
                      {uploadingTaxPlate ? (
                        <>Yükleniyor...</>
                      ) : (
                        <>
                          <FileText className="w-4 h-4" />
                          <span>{profile?.taxPlateDocument ? 'Yeni Belge Yükle' : 'Belge Seç ve Yükle'}</span>
                        </>
                      )}
                      <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/webp, application/pdf" 
                        onChange={(e) => handleDocumentUpload(e, 'tax')} 
                        disabled={uploadingTaxPlate} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'abonelik' && (
            <div className="space-y-8 animate-scale-up text-left w-full">
              <div>
                <h2 className="font-extrabold text-slate-900 tracking-tight text-2xl md:text-3xl">
                  Abonelik & Limit Bilgisi
                </h2>
                <p className="text-slate-400 text-xs mt-1 font-semibold leading-relaxed">
                  Paketinizin detaylarını, aylık kullanım ve kalan kota bilgilerinizi inceleyin veya yeni bir paket satın alın.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Active Subscription Card & Commission Balance Card */}
                <div className="flex flex-col gap-6 lg:col-span-1">
                  {/* Active Subscription Card */}
                  <div className="bg-slate-900 border border-slate-800 rounded-[28px] p-6 shadow-lg text-white flex flex-col justify-between relative overflow-hidden h-[240px] shrink-0">
                    {/* Glowing blobs */}
                    <div className="absolute top-[-30px] right-[-30px] w-24 h-24 rounded-full bg-[#c8f252]/10 blur-xl"></div>
                    
                    <div className="flex justify-between items-start z-10">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block text-left">Mevcut Abonelik Planı</span>
                        <h3 className="text-2xl font-black tracking-tight text-[#c8f252] uppercase mt-1">
                          {subscriptionDetails?.subscription?.package_type === 'vip' ? 'VIP Paket (Yüksek)' :
                           subscriptionDetails?.subscription?.package_type === 'standard' ? 'Standart Paket (Orta)' :
                           subscriptionDetails?.subscription?.package_type === 'basic' ? 'Basic Paket (Düşük)' :
                           subscriptionDetails?.subscription?.package_type ? `${subscriptionDetails.subscription.package_type.toUpperCase()} Paket` :
                           'Paket Bulunmuyor'}
                        </h3>
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded border ${
                        subscriptionDetails?.subscription?.status === 'active'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : subscriptionDetails?.subscription?.status === 'trial' || subscriptionDetails?.subscription?.status === 'admin_trial'
                          ? 'bg-[#c8f252]/10 border-[#c8f252]/20 text-[#c8f252]'
                          : 'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}>
                        {subscriptionDetails?.subscription?.status || 'Abonelik Yok'}
                      </span>
                    </div>

                    <div className="space-y-2.5 z-10">
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                        <span>Aktif İş Kapasitesi (Kapasite Kilidi):</span>
                        <span className="text-white font-mono">{subscriptionDetails?.quota?.accepted_count || 0} / {subscriptionDetails?.quota?.monthly_limit || '3'}</span>
                      </div>
                      {/* Progress Bar */}
                      {subscriptionDetails?.quota?.monthly_limit && (
                        <div className="w-full h-1.5 bg-slate-880 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#c8f252]"
                            style={{ width: `${Math.min(100, ((subscriptionDetails.quota.accepted_count || 0) / subscriptionDetails.quota.monthly_limit) * 100)}%` }}
                          ></div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-[10px] text-slate-400 font-bold z-10">
                      <span>
                        {subscriptionDetails?.subscription?.expires_at 
                          ? `Yenilenme: ${new Date(subscriptionDetails.subscription.expires_at).toLocaleDateString('tr-TR')}` 
                          : 'Son Kullanım Tarihi: Yok'}
                      </span>
                      {subscriptionDetails?.subscription?.status === 'active' && (
                        <button 
                          onClick={handleCancelSubscription}
                          className="text-red-400 hover:text-red-300 font-black cursor-pointer bg-transparent border-none outline-none active:scale-95 transition-all"
                        >
                          İptal Et
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Commission Balance Card */}
                  <div className="bg-white border border-slate-150 rounded-[28px] p-6 shadow-sm flex flex-col justify-between relative overflow-hidden min-h-[240px] shrink-0 text-left">
                    <div className="absolute top-[-30px] right-[-30px] w-24 h-24 rounded-full bg-rose-500/5 blur-xl"></div>
                    
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Birikmiş Komisyon Bilgisi</span>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-3xl font-black text-rose-600 font-mono">
                          ₺{(subscriptionDetails?.unpaidCommission ?? 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs text-slate-400 font-bold">Ödenmemiş</span>
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">Sonraki Otomatik Tahsilat:</span>
                        <span className="text-slate-800 font-mono font-bold">
                          {subscriptionDetails?.nextBillingDate
                            ? new Date(subscriptionDetails.nextBillingDate).toLocaleDateString('tr-TR')
                            : 'Pazar 21:00 UTC'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed mt-1.5 font-medium">
                        Komisyonlar tamamlanan işler üzerinden hesaplanır ve her Pazar günü 21:00 UTC (Pazartesi 00:00 TSİ) birincil kayıtlı kartınızdan otomatik olarak tahsil edilir. Kendi müşterilerinizden (%0) ve sadık müşteri işlerinden komisyon alınmaz.
                      </p>

                      {subscriptionDetails?.unpaidCommission > 0 && (
                        <div className="mt-3">
                          {savedCards.some(c => c.is_primary) ? (
                            <button
                              onClick={handlePayCommission}
                              disabled={payingCommission}
                              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border-none"
                            >
                              {payingCommission ? (
                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                              ) : null}
                              {payingCommission ? 'Ödeniyor...' : 'Komisyonu Şimdi Öde'}
                            </button>
                          ) : (
                            <div className="bg-rose-50 border border-rose-100 rounded-xl p-2.5 text-[10px] text-rose-700 font-bold leading-relaxed">
                              ⚠️ Otomatik tahsilat ve teklif verebilmek için lütfen aşağıdan bir ödeme kartı kaydedin.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ödeme Yönetimi Kartı */}
                  <div className="bg-white border border-slate-150 rounded-[28px] p-6 shadow-sm flex flex-col justify-between relative overflow-hidden min-h-[260px] text-left">
                    <div className="absolute top-[-30px] right-[-30px] w-24 h-24 rounded-full bg-slate-500/5 blur-xl"></div>
                    
                    <div className="w-full">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <rect width="22" height="16" x="1" y="4" rx="3" />
                            <line x1="1" x2="23" y1="10" y2="10" />
                          </svg>
                          <span className="text-sm text-slate-800 font-extrabold tracking-tight">Ödeme Yönetimi</span>
                        </div>
                        <button
                          onClick={() => setShowAddCardModal(true)}
                          className="px-3 py-1.5 bg-[#c8f252] hover:bg-[#b5dc3e] text-slate-900 rounded-xl text-[10px] font-black tracking-tight cursor-pointer active:scale-95 transition-all flex items-center gap-1 border-none"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <line x1="12" x2="12" y1="5" y2="19" />
                            <line x1="5" x2="19" y1="12" y2="12" />
                          </svg>
                          Yeni Kart Ekle
                        </button>
                      </div>

                      {loadingCards ? (
                        <div className="flex justify-center items-center py-10">
                          <svg className="animate-spin h-6 w-6 text-[#c8f252]" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                          </svg>
                        </div>
                      ) : savedCards.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 font-semibold text-xs leading-relaxed">
                          Sistemde kayıtlı ödeme kartınız bulunmamaktadır. Komisyon tahsilatları ve paket alımları için lütfen yeni bir kart ekleyin.
                        </div>
                      ) : (
                        <div className="space-y-3 mt-4 max-h-[220px] overflow-y-auto pr-1">
                          {savedCards.map((card) => (
                            <div key={card.id} className="border border-slate-100 rounded-2xl p-3.5 flex justify-between items-center bg-slate-50 hover:bg-slate-100/70 transition-colors">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                    card.card_brand.toLowerCase() === 'visa' 
                                      ? 'bg-blue-500/10 border border-blue-500/20 text-blue-600' 
                                      : 'bg-orange-500/10 border border-orange-500/20 text-orange-600'
                                  }`}>
                                    {card.card_brand}
                                  </span>
                                  <span className="text-xs font-mono font-bold text-slate-700">
                                    •••• •••• •••• {card.last_four}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[150px]">
                                  {card.card_holder}
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                {card.is_primary ? (
                                  <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                                    Birincil
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleSetPrimaryCard(card.id)}
                                    className="text-[10px] text-slate-500 hover:text-slate-900 font-bold underline cursor-pointer bg-transparent border-none"
                                  >
                                    Birincil Yap
                                  </button>
                                )}

                                <button
                                  onClick={() => handleDeleteCard(card.id)}
                                  className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer bg-transparent border-none p-1"
                                  title="Kartı Sil"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Package catalog list */}
                <div className="lg:col-span-2 bg-white border border-slate-150 p-6 rounded-[28px] shadow-sm flex flex-col justify-start gap-5">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-slate-900 text-sm">Abonelik Paketleri</h3>
                    <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                      Sisteme gelen iş tekliflerini görebilmek ve teklif verebilmek için paket limitlerinizi yükseltin.
                    </p>
                  </div>

                  {/* Premium Benefit Showcase Grid */}
                  {(() => {
                    const vipPkg = availablePackages.find(p => p.type === 'vip') || { commissionRate: 3, delayMinutes: 0, activeJobsLimit: 7 };
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-y border-slate-100 py-5 my-1 bg-slate-50/50 rounded-2xl p-4">
                        <div className="space-y-1 text-left">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-[10px] font-black">%</span>
                            Düşük Komisyon
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium leading-normal">
                            VIP pakette %{vipPkg.commissionRate}'e varan düşük komisyon oranlarıyla tamamladığınız her işten daha fazla kazanç elde edersiniz.
                          </p>
                        </div>

                        <div className="space-y-1 text-left">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                            <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                              </svg>
                            </span>
                            Anında İlan Bildirimi
                          </div>
                          <p className="text-[10px] text-slate-450 font-medium leading-normal">
                            Yeni gelen tüm talepleri anında ({vipPkg.delayMinutes} dakika gecikmeyle) görerek ilk teklifinizi gecikmeden iletin.
                          </p>
                        </div>

                        <div className="space-y-1 text-left">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-655">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </span>
                            Ekstra Aktif İş Limiti
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium leading-normal">
                            Aynı anda yürütebileceğiniz aktif iş kapasitenizi (slot kilidini) {vipPkg.activeJobsLimit} slot'a çıkararak iş hacminizi genişletin.
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-1">
                    {availablePackages.map((pkg: any) => {
                      const isCurrent = pkg.type === 'free'
                        ? (!subscriptionDetails?.subscription || !['active', 'trial', 'admin_trial'].includes(subscriptionDetails?.subscription?.status))
                        : (subscriptionDetails?.subscription?.package_type === pkg.type && ['active', 'trial', 'admin_trial'].includes(subscriptionDetails?.subscription?.status));
                      
                      return (
                        <div 
                          key={pkg.type}
                          onClick={() => {
                            if (isCurrent) return;
                            if (pkg.type === 'free') {
                              handleCancelSubscription();
                            } else {
                              setSelectedPackage(pkg);
                              setValidatedCampaign(null);
                              setCampaignCodeInput('');
                            }
                          }}
                          className={`border rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col justify-between gap-4 h-[260px] ${
                            isCurrent
                              ? 'bg-slate-50 border-slate-200 opacity-60 pointer-events-none'
                              : selectedPackage?.type === pkg.type
                              ? 'border-[#c8f252] bg-[#c8f252]/5 ring-2 ring-[#c8f252]/30 shadow-sm'
                              : 'border-slate-150 hover:border-slate-300 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.01)]'
                          }`}
                        >
                          <div>
                            <span className="block text-[10px] text-slate-450 font-black uppercase tracking-wider">{pkg.name}</span>
                            <span className="block text-2xl font-black text-slate-900 tracking-tight mt-2">
                              {pkg.price === 0 ? 'Ücretsiz' : `₺${pkg.price.toLocaleString('tr-TR')}`}
                            </span>
                            <div className="mt-2 space-y-0.5 text-left border-t border-slate-100 pt-2">
                              <span className="block text-[9px] text-slate-500 font-medium">✓ Teklif Hakkı: Sınırsız</span>
                              <span className="block text-[9px] text-slate-500 font-medium">✓ Komisyon Oranı: %{pkg.commissionRate}</span>
                              <span className="block text-[9px] text-slate-500 font-medium">✓ Aktif İş Limiti: {pkg.activeJobsLimit} Slot</span>
                              <span className="block text-[9px] text-slate-500 font-medium">
                                ✓ Dağıtım Hızı: {
                                  pkg.delayMinutes === 0 ? 'Anında (0 Dk)' : `Rakiplere göre ${pkg.delayMinutes} Dk Gecikmeli`
                                }
                              </span>
                              <span className="block text-[9px] text-slate-500 font-medium">
                                ✓ 4. Slot Erişimi: Herkese Açık (Sınırsız)
                              </span>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            disabled={isCurrent}
                            className={`w-full py-2 rounded-xl text-[10px] font-black tracking-wide uppercase transition-all ${
                              isCurrent
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : selectedPackage?.type === pkg.type
                                ? 'bg-[#c8f252] text-slate-955 font-black'
                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                            }`}
                          >
                            {isCurrent ? 'Aktif' : selectedPackage?.type === pkg.type ? 'Seçildi' : pkg.type === 'free' ? 'Geçiş Yap' : 'Seç'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Package Purchase Form & Coupon Code Area */}
              {selectedPackage && (
                <div className="bg-white border border-slate-150 rounded-[28px] p-6 shadow-sm max-w-3xl w-full flex flex-col md:flex-row justify-between gap-8 animate-scale-up">
                  <div className="space-y-4 text-left flex-1">
                    <h3 className="font-extrabold text-slate-900 text-sm">Seçilen Plan Detayları</h3>
                    <div className="space-y-1.5 text-xs font-semibold text-slate-600 bg-slate-50 rounded-2xl p-4 border border-slate-100 shadow-sm">
                      <div className="flex justify-between">
                        <span>Paket:</span>
                        <span className="font-extrabold text-slate-800">{selectedPackage.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Teklif Hakkı:</span>
                        <span className="font-extrabold text-slate-800">Sınırsız</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Komisyon Oranı:</span>
                        <span className="font-extrabold text-slate-800">%{selectedPackage.commissionRate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Aktif İş Limiti:</span>
                        <span className="font-extrabold text-slate-800">{selectedPackage.activeJobsLimit} Slot</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dağıtım Hızı:</span>
                        <span className="font-extrabold text-slate-800">
                          {selectedPackage.type === 'free' ? 'Rakiplere göre 15 Dk Gecikmeli' :
                           selectedPackage.type === 'basic' ? 'Rakiplere göre 10 Dk Gecikmeli' :
                           selectedPackage.type === 'standard' ? 'Rakiplere göre 5 Dk Gecikmeli' :
                           'Anında (0 Dk)'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>4. Slot Ayrıcalığı:</span>
                        <span className="font-extrabold text-slate-800">
                          Var (Sınırsız)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Plan Fiyatı:</span>
                        <span className="font-extrabold text-slate-800">₺{selectedPackage.price.toLocaleString('tr-TR')} / ay</span>
                      </div>
                      {validatedCampaign && (
                        <div className="flex justify-between text-emerald-700">
                          <span>Uygulanan İndirim:</span>
                          <span className="font-black">
                            - ₺{validatedCampaign.type === 'percent' 
                              ? (selectedPackage.price * Number(validatedCampaign.value) / 100).toLocaleString('tr-TR')
                              : Number(validatedCampaign.value).toLocaleString('tr-TR')}
                          </span>
                        </div>
                      )}
                      <div className="h-[1px] bg-slate-200 my-2"></div>
                      <div className="flex justify-between text-sm font-black text-slate-900">
                        <span>Ödenecek Toplam:</span>
                        <span>
                          ₺{validatedCampaign 
                            ? Math.max(0, validatedCampaign.type === 'percent' 
                                ? selectedPackage.price * (1 - Number(validatedCampaign.value) / 100)
                                : selectedPackage.price - Number(validatedCampaign.value)).toLocaleString('tr-TR')
                            : selectedPackage.price.toLocaleString('tr-TR')} / ay
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-between gap-5">
                    {/* Coupon / Campaign Code Input */}
                    <div className="space-y-2">
                      <label className="block text-xs font-extrabold text-slate-650">Kampanya veya Referans Kodu Girin</label>
                      
                      {campaignError && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-xl text-[10px] font-bold animate-scale-up">
                          ✗ {campaignError}
                        </div>
                      )}

                      {campaignSuccess && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded-xl text-[10px] font-bold animate-scale-up">
                          ✓ {campaignSuccess}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Örn: REF-HV-CODE"
                          value={campaignCodeInput}
                          onChange={(e) => setCampaignCodeInput(e.target.value.toUpperCase())}
                          className="bg-slate-50 border border-slate-250 focus:border-[#c8f252] rounded-xl p-3 outline-none text-xs font-bold text-slate-850 flex-grow uppercase transition-colors"
                        />
                        <button
                          type="button"
                          onClick={handleValidateCampaign}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 rounded-xl cursor-pointer transition-all active:scale-95 shrink-0"
                        >
                          Uygula
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPackage(null);
                          setValidatedCampaign(null);
                          setCampaignCodeInput('');
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 px-5 rounded-xl cursor-pointer transition-all active:scale-95 flex-grow text-center"
                      >
                        Vazgeç
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartSubscription(selectedPackage.type)}
                        disabled={submittingSubscription}
                        className="bg-[#c8f252] hover:bg-[#b5e639] text-slate-950 text-xs font-black py-3 px-6 rounded-xl cursor-pointer transition-all active:scale-95 flex-grow text-center shadow-sm"
                      >
                        {submittingSubscription ? 'Hazırlanıyor...' : 'Ödemeyi Başlat'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Invoice & Payment History */}
              <div className="bg-white border border-slate-150 rounded-[28px] p-6 shadow-sm w-full">
                <div className="mb-4">
                  <h3 className="font-extrabold text-slate-900 text-sm">Fatura ve Ödeme Geçmişi</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Geçmiş dönemlerde gerçekleştirdiğiniz ödemelerin dökümü.</p>
                </div>

                <div className="overflow-x-auto w-full">
                  {subscriptionDetails?.subscription?.payments && subscriptionDetails.subscription.payments.length > 0 ? (
                    <table className="w-full text-xs font-semibold text-slate-755 border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px] text-left">
                          <th className="py-3 px-4">Ödeme Kimliği</th>
                          <th className="py-3 px-4">Fatura Tarihi</th>
                          <th className="py-3 px-4">Ödenen Tutar</th>
                          <th className="py-3 px-4">Durum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subscriptionDetails.subscription.payments.map((pmt: any) => (
                          <tr key={pmt.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="py-3.5 px-4 font-mono text-slate-550">{pmt.iyzico_payment_id || pmt.id.substring(0, 8).toUpperCase()}</td>
                            <td className="py-3.5 px-4">{new Date(pmt.paid_at || pmt.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                            <td className="py-3.5 px-4 font-extrabold text-slate-900">₺{Number(pmt.amount).toLocaleString('tr-TR')}</td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                pmt.status === 'success'
                                  ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                  : 'bg-red-50 border-red-100 text-red-700'
                              }`}>
                                {pmt.status === 'success' ? 'Başarılı' : 'Hatalı'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-8 text-slate-450 font-semibold">
                      Henüz kayıtlı bir fatura geçmişiniz bulunmamaktadır.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'loyal_customers' && (
            <div className="space-y-8 animate-scale-up text-left">
              <div>
                <h2 className="font-extrabold text-slate-900 tracking-tight text-2xl md:text-3xl">
                  Sadık Müşterilerim
                </h2>
                <p className="text-slate-400 text-xs mt-1 font-semibold leading-relaxed">
                  Müşterilerinizle doğrudan çalışın. Onları Esnaaf platformuna davet edin ve komisyonsuz veya doğrudan iş oluşturun.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start w-full">
                {/* Sol Taraf: Müşteri Arama ve Davet Etme */}
                <div className="flex flex-col gap-6 lg:col-span-1">
                  {/* Esnaaf ID & QR Kod Kartı */}
                  <div className="bg-slate-900 p-6 rounded-[28px] border border-slate-800 shadow-md hover:shadow-lg transition-all flex flex-col justify-between text-white relative overflow-hidden min-h-[160px] w-full">
                    {/* Decorative glow */}
                    <div className="absolute top-[-30px] right-[-30px] w-20 h-20 rounded-full bg-[#c8f252]/10 blur-xl"></div>
                    
                    <div className="flex justify-between items-start z-10 gap-3">
                      <div className="text-left space-y-1">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Kolay Eşleşme ID</span>
                        <div className="text-xl font-black text-[#c8f252] tracking-wide uppercase select-all">
                          {esnaafId || 'ESN-74291'}
                        </div>
                        <p className="text-[9px] text-slate-400 font-semibold leading-relaxed pt-1">
                          Müşteriniz bu ID'yi aratarak sizi sadık hizmet veren listesine ekleyebilir.
                        </p>
                      </div>
                      {/* Visual QR Code Mockup */}
                      <div className="w-16 h-16 bg-white p-1.5 rounded-xl shrink-0 flex flex-col gap-0.5 justify-between items-center relative shadow-md">
                        <div className="grid grid-cols-5 gap-0.5 w-full h-full">
                          <div className="bg-slate-900 rounded-sm"></div>
                          <div className="bg-slate-900 rounded-sm"></div>
                          <div className="bg-slate-200 rounded-sm"></div>
                          <div className="bg-slate-900 rounded-sm"></div>
                          <div className="bg-slate-900 rounded-sm"></div>

                          <div className="bg-slate-900 rounded-sm"></div>
                          <div className="bg-slate-200 rounded-sm"></div>
                          <div className="bg-slate-900 rounded-sm"></div>
                          <div className="bg-slate-200 rounded-sm"></div>
                          <div className="bg-slate-900 rounded-sm"></div>

                          <div className="bg-slate-200 rounded-sm"></div>
                          <div className="bg-slate-900 rounded-sm"></div>
                          <div className="bg-slate-900 rounded-sm"></div>
                          <div className="bg-slate-900 rounded-sm"></div>
                          <div className="bg-slate-200 rounded-sm"></div>

                          <div className="bg-slate-900 rounded-sm"></div>
                          <div className="bg-slate-200 rounded-sm"></div>
                          <div className="bg-slate-200 rounded-sm"></div>
                          <div className="bg-slate-900 rounded-sm"></div>
                          <div className="bg-slate-900 rounded-sm"></div>

                          <div className="bg-slate-900 rounded-sm"></div>
                          <div className="bg-slate-900 rounded-sm"></div>
                          <div className="bg-slate-200 rounded-sm"></div>
                          <div className="bg-slate-200 rounded-sm"></div>
                          <div className="bg-slate-900 rounded-sm"></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-slate-800 text-[10px] text-slate-400 font-bold z-10">
                      <span>Esnaaf ID Kartım</span>
                      <span className="text-[#c8f252]">Aktif</span>
                    </div>
                  </div>

                  {/* Yeni Sadık Müşteri Ekle */}
                  <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm space-y-5 w-full">
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-slate-900 text-sm">Yeni Sadık Müşteri Ekle</h3>
                      <p className="text-[11px] text-slate-450 font-semibold leading-relaxed">
                        Müşterinizin ekranındaki 5 haneli **Esnaaf ID**'sini girerek bulun ve listenize ekleme isteği gönderin.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Örn: ESN-K3T9X"
                          value={searchSeekerEsnaafId}
                          onChange={(e) => setSearchSeekerEsnaafId(e.target.value.toUpperCase())}
                          className="bg-slate-50 border border-slate-200 focus:border-[#c8f252] rounded-xl p-3 outline-none text-xs font-bold text-slate-850 flex-grow uppercase transition-colors"
                        />
                        <button
                          type="button"
                          onClick={handleSearchSeeker}
                          disabled={isSearchingSeeker}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 rounded-xl cursor-pointer transition-all active:scale-95 shrink-0"
                        >
                          {isSearchingSeeker ? 'Aranıyor...' : 'Bul'}
                        </button>
                      </div>

                      {searchSeekerError && (
                        <p className="text-xs text-red-500 font-semibold">{searchSeekerError}</p>
                      )}

                      {searchSeekerResult && (
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3 animate-scale-up">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-700 text-sm">
                              {searchSeekerResult.name?.substring(0, 2).toUpperCase() || 'MÜ'}
                            </div>
                            <div className="text-left">
                              <h4 className="font-extrabold text-xs text-slate-800">{searchSeekerResult.name}</h4>
                              <p className="text-[10px] text-slate-400 font-bold font-mono uppercase">{searchSeekerResult.esnaaf_id}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSendLoyaltyRequest(searchSeekerResult.esnaaf_id)}
                            className="w-full bg-[#c8f252] hover:bg-[#b5e639] text-slate-955 font-black text-xs py-2.5 rounded-xl cursor-pointer shadow-sm transition-all text-center border-none"
                          >
                            Sadık Müşteri İsteği Gönder
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sağ Taraf: Müşterilerim Listesi */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm space-y-4">
                    <h3 className="font-extrabold text-slate-900 text-sm">Sadık Müşteri Listesi ({loyalCustomers.length})</h3>
                    
                    {loyalCustomers.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {loyalCustomers.map((cust: any) => (
                          <div key={cust.id} className="bg-slate-50 hover:bg-slate-100/50 border border-slate-100 hover:border-slate-200 rounded-2xl p-4 transition-all flex flex-col justify-between gap-4">
                            <div className="flex items-center gap-3 text-left">
                              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-700 text-xs">
                                {cust.seeker?.user?.name?.substring(0, 2).toUpperCase() || 'C'}
                              </div>
                              <div>
                                <h4 className="font-extrabold text-xs text-slate-800">{cust.seeker?.user?.name || 'Müşteri'}</h4>
                                <p className="text-[10px] text-slate-400 font-bold font-mono">{cust.seeker?.user?.esnaaf_id}</p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setDirectRequestCustomer(cust);
                                setDirectJobCategory('temizlik');
                              }}
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] py-2 rounded-xl transition-all cursor-pointer text-center"
                            >
                              Doğrudan İş Kartı Oluştur
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 text-slate-400">
                        <span className="text-3xl">👥</span>
                        <p className="text-xs font-bold mt-2">Henüz onaylanmış sadık müşteriniz bulunmuyor.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profil-ayarlar' && (
            <div className="max-w-2xl mx-auto space-y-8 animate-scale-up text-left">
              <div>
                <h2 className="font-extrabold text-slate-900 tracking-tight text-2xl md:text-3xl">
                  Profil ve Ayarlar
                </h2>
                <p className="text-slate-400 text-xs mt-1 font-semibold leading-relaxed">
                  Müşterilere gösterilen profil bilgilerinizi güncelleyin.
                </p>
              </div>

              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-700">Ad Soyad / Firma Adı</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Örn: Ahmet Yılmaz"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#c8f252] rounded-xl p-3 outline-none text-xs font-bold text-slate-850 transition-colors"
                      required
                    />
                  </div>

                  {/* City field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-700">Şehir</label>
                    <input
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      placeholder="Örn: İstanbul"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#c8f252] rounded-xl p-3 outline-none text-xs font-bold text-slate-850 transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Service Districts field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700">
                    Hizmet Verdiğiniz İlçeler (Virgülle ayırın)
                  </label>
                  <input
                    type="text"
                    value={editDistricts}
                    onChange={(e) => setEditDistricts(e.target.value)}
                    placeholder="Örn: Kadıköy, Beşiktaş, Üsküdar"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#c8f252] rounded-xl p-3 outline-none text-xs font-bold text-slate-850 transition-colors"
                  />
                  <span className="text-[10px] text-slate-400 font-semibold block">
                    Birden fazla ilçe girmek için aralarına virgül koyarak yazabilirsiniz.
                  </span>
                </div>

                {/* Biography/Description field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700">Usta Tanıtım Yazısı / Biyografi</label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Müşterilere kendinizi ve tecrübelerinizi tanıtın..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#c8f252] rounded-xl p-3 outline-none text-xs font-bold text-slate-850 min-h-[120px] transition-colors resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="bg-[#c8f252] hover:bg-[#b5e639] text-slate-950 font-black text-xs px-6 py-3 rounded-xl cursor-pointer shadow-sm transition-all active:scale-95 flex items-center gap-2"
                  >
                    {isSavingProfile ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
                  </button>
                </div>
              </div>

              {/* E-posta Adresi & Doğrulama Kartı */}
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                <div className="text-left">
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    E-posta Adresi & Kimlik Bilgileri
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    Giriş yapmak ve önemli bildirimleri almak için e-posta adresinizi doğrulayın.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-4 items-end">
                    <div className="flex-1 space-y-1.5 text-left">
                      <label className="block text-xs font-extrabold text-slate-700">E-posta Adresi</label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="Örn: usta@esnaaf.com"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#c8f252] rounded-xl p-3 outline-none text-xs font-bold text-slate-850 transition-colors"
                      />
                    </div>
                    {profile?.emailVerified ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-3.5 rounded-xl text-xs font-black flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Doğrulanmış
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendEmailVerificationCode}
                        disabled={isSendingEmailCode || !editEmail}
                        className="bg-[#4c630a] hover:bg-[#3d5008] text-white font-extrabold text-xs px-5 py-3.5 rounded-xl cursor-pointer disabled:opacity-50 transition-all"
                      >
                        {isSendingEmailCode ? 'Kod Gönderiliyor...' : 'Kodu Gönder'}
                      </button>
                    )}
                  </div>

                  {/* Verification Code Box (Render if verification code was sent) */}
                  {emailVerificationSent && !profile?.emailVerified && (
                    <div className="p-4 bg-[#c8f252]/10 border border-[#c8f252]/30 rounded-2xl space-y-3 animate-scale-up text-left">
                      <p className="text-[11px] text-[#4c630a] font-bold">
                        E-posta adresinize gönderilen 6 haneli doğrulama kodunu giriniz. (Test kodu: <span className="font-black underline font-mono">123456</span>)
                      </p>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          maxLength={6}
                          value={emailCode}
                          onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="0 0 0 0 0 0"
                          className="w-32 bg-white text-center border border-slate-200 focus:border-[#4c630a] rounded-xl p-2.5 text-xs font-black text-slate-900 tracking-widest font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyEmailCode}
                          disabled={isVerifyingEmailCode || emailCode.length < 6}
                          className="bg-[#c8f252] hover:bg-[#b5e639] text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl cursor-pointer disabled:opacity-50 transition-all"
                        >
                          {isVerifyingEmailCode ? 'Doğrulanıyor...' : 'Kodu Doğrula'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Şifre Güncelleme Kartı */}
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                <div className="text-left">
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Giriş Şifresi
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    Uygulamaya SMS yerine şifrenizle daha hızlı giriş yapabilmek için şifre belirleyin.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-extrabold text-slate-700">Yeni Şifre</label>
                    <input
                      type="password"
                      value={newProfilePassword}
                      onChange={(e) => setNewProfilePassword(e.target.value)}
                      placeholder="••••••"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#c8f252] rounded-xl p-3 outline-none text-xs font-bold text-slate-850 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-extrabold text-slate-700">Yeni Şifre Tekrar</label>
                    <input
                      type="password"
                      value={confirmProfilePassword}
                      onChange={(e) => setConfirmProfilePassword(e.target.value)}
                      placeholder="••••••"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#c8f252] rounded-xl p-3 outline-none text-xs font-bold text-slate-850 transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={handleUpdateProfilePassword}
                    disabled={isUpdatingProfilePassword || !newProfilePassword}
                    className="bg-[#c8f252] hover:bg-[#b5e639] text-slate-950 font-black text-xs px-6 py-3 rounded-xl cursor-pointer disabled:opacity-50 transition-all active:scale-95"
                  >
                    {isUpdatingProfilePassword ? 'Şifre Güncelleniyor...' : 'Şifreyi Güncelle'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Doğrudan İş Kartı Oluşturma Modalı */}
          {directRequestCustomer && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-[32px] max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scale-up text-left space-y-5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500" />
                    <span>Doğrudan İş Kartı Gönder</span>
                  </h3>
                  <button 
                    onClick={() => {
                      setDirectRequestCustomer(null);
                      setDirectJobPrice('');
                      setDirectJobDate('');
                      setDirectJobDetails('');
                    }}
                    className="text-slate-400 hover:text-slate-850 rounded-xl p-1.5 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-700 text-xs">
                    {directRequestCustomer.seeker?.user?.name?.substring(0, 2).toUpperCase() || 'C'}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-800">{directRequestCustomer.seeker?.user?.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold font-mono">{directRequestCustomer.seeker?.user?.esnaaf_id}</p>
                  </div>
                </div>

                <form onSubmit={handleCreateDirectJob} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-700">Hizmet Kategorisi</label>
                    <select
                      value={directJobCategory}
                      onChange={(e) => setDirectJobCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#c8f252] rounded-xl p-3 outline-none text-xs font-bold text-slate-850 transition-colors"
                      required
                    >
                      <option value="temizlik">Temizlik</option>
                      <option value="nakliyat">Nakliyat</option>
                      <option value="boyaci">Boyacı</option>
                      <option value="tesisatci">Tesisatçı</option>
                      <option value="elektrikci">Elektrikçi</option>
                      <option value="marangoz">Marangoz</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-700">Doğrudan Anlaşılan Fiyat (TL)</label>
                    <input
                      type="number"
                      placeholder="Örn: 2500"
                      value={directJobPrice}
                      onChange={(e) => setDirectJobPrice(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#c8f252] rounded-xl p-3 outline-none text-xs font-bold text-slate-850 transition-colors"
                      min="1"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-700">Randevu Tarihi & Saati</label>
                    <input
                      type="datetime-local"
                      value={directJobDate}
                      onChange={(e) => setDirectJobDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#c8f252] rounded-xl p-3 outline-none text-xs font-bold text-slate-850 transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-700">İş Detayları</label>
                    <textarea
                      placeholder="Müşterinizle anlaştığınız iş detaylarını yazın..."
                      value={directJobDetails}
                      onChange={(e) => setDirectJobDetails(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#c8f252] rounded-xl p-3 outline-none text-xs font-bold text-slate-850 min-h-[100px] transition-colors resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingDirectJob}
                    className="w-full bg-[#c8f252] hover:bg-[#b5e639] text-slate-950 font-black text-xs py-3.5 rounded-xl cursor-pointer shadow-sm transition-all text-center"
                  >
                    {isSubmittingDirectJob ? 'Gönderiliyor...' : 'Doğrudan İş Kartını Gönder'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* iyzico Sandbox Payment Simulation Modal */}
          {checkoutFormHtml && (
            <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-[32px] max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-scale-up text-center flex flex-col justify-between gap-5 relative">
                <button 
                  onClick={() => {
                    setCheckoutFormHtml(null);
                    setSelectedPackage(null);
                    setValidatedCampaign(null);
                    setCampaignCodeInput('');
                    if (token) fetchTabDependencies('abonelik', token);
                  }}
                  className="text-slate-400 hover:text-slate-850 rounded-xl p-1.5 hover:bg-slate-50 transition-colors cursor-pointer absolute right-4 top-4"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="space-y-1.5 pt-2 text-left">
                  <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-slate-900" />
                    <span>Esnaaf Güvenli Ödeme Arayüzü</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                    Aboneliğinizi tamamlamak için iyzico Sandbox ödeme simülasyonunu tamamlayın.
                  </p>
                </div>

                {/* Render checkout form content securely */}
                <div 
                  className="bg-slate-50 rounded-2xl p-6 border border-slate-150 shadow-inner min-h-[160px] text-center flex items-center justify-center w-full"
                  dangerouslySetInnerHTML={{ __html: checkoutFormHtml }}
                />

                <div className="text-[10px] text-slate-450 font-bold leading-relaxed border-t border-slate-100 pt-3 text-left w-full">
                  ℹ Bu bir **iyzico Sandbox (Simülasyon)** sayfasıdır. Ödeme simülasyonu butonuna tıklayarak cüzdan/kart limitiniz etkilenmeden paket aktivasyonunu tetikleyebilirsiniz.
                </div>
              </div>
            </div>
          )}

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
              <p className="text-xs text-slate-650 font-semibold leading-relaxed italic whitespace-pre-line">
                &ldquo;{formatDetails(activeJob.details)}&rdquo;
              </p>
            </div>

            <form onSubmit={handleOfferSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
                  Teklif Fiyatı (TL)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={offerPrice}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '');
                      setOfferPrice(clean ? Number(clean).toLocaleString('tr-TR') : '');
                    }}
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

      {/* 💬 Canlı Sohbet Modalı */}
      {activeChat && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-6 shadow-2xl border border-slate-100 flex flex-col h-[550px] animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4 shrink-0">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-slate-950" />
                <span>{activeChat.customerName} ile Sohbet</span>
              </h3>
              <button 
                onClick={() => {
                  setActiveChat(null);
                  setChatMessages([]);
                }}
                className="text-slate-400 hover:text-slate-850 rounded-xl p-1.5 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 rounded-2xl border border-slate-100/60 mb-4 scrollbar-none text-left flex flex-col">
              {loadingChatMessages ? (
                <div className="w-full h-full flex items-center justify-center m-auto">
                  <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-[#c8f252] animate-spin"></div>
                </div>
              ) : chatMessages.length === 0 ? (
                <p className="text-center text-slate-400 text-xs py-12 font-medium m-auto">Müşterinize bir mesaj yazarak sohbete başlayın!</p>
              ) : (
                chatMessages.map((msg) => {
                  let myUserId = profile?.userId;
                  if (!myUserId && token) {
                    try {
                      const base64Url = token.split('.')[1];
                      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                      const pad = base64.length % 4;
                      const paddedBase64 = pad ? base64 + '='.repeat(4 - pad) : base64;
                      myUserId = JSON.parse(window.atob(paddedBase64)).sub;
                    } catch (e) {
                      console.error("JWT decode error:", e);
                    }
                  }
                  const msgSenderId = msg.sender_id || msg.senderId;
                  const isMe = msgSenderId === myUserId;
                  console.log("Chat debug:", {
                    msgId: msg.id,
                    content: msg.content,
                    msgSenderId,
                    myUserId,
                    isMe
                  });
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] p-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
                        isMe 
                          ? 'bg-slate-900 text-white rounded-tr-none' 
                          : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <span className="block text-[8px] mt-1.5 text-right font-mono text-slate-400">
                          {new Date(msg.created_at).toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Send Input bar */}
            <form onSubmit={handleSendMessage} className="border-t border-slate-100 pt-3 flex gap-2 shrink-0 bg-white">
              <input
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder="Mesajınızı yazın..."
                className="flex-1 bg-slate-50 border border-slate-200 focus:border-[#c8f252] outline-none rounded-xl px-4 py-3 text-xs font-semibold text-slate-850"
              />
              <button
                type="submit"
                disabled={!newMessageText.trim()}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                Gönder
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🏆 İş Tamamlama Beyan Modalı */}
      {completingJob && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-slate-950" />
                <span>İşi Tamamlandı Olarak Beyan Et</span>
              </h3>
              <button 
                onClick={() => {
                  setCompletingJob(null);
                  setDeclarePrice('');
                  setDeclareNote('');
                }}
                className="text-slate-400 hover:text-slate-850 rounded-xl p-1.5 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeclareCompletion} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
                  Gerçekleşen İş Ücreti (TL)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={declarePrice}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '');
                      setDeclarePrice(clean ? Number(clean).toLocaleString('tr-TR') : '');
                    }}
                    placeholder="Örn: 850"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#4c630a]/50 focus:ring-1 focus:ring-[#4c630a]/10 rounded-xl py-3.5 px-4 pl-10 text-xs font-black text-slate-900 focus:outline-none transition-all shadow-inner"
                  />
                  <span className="absolute left-4 top-3.5 text-xs font-black text-slate-900">₺</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
                  Tamamlama Notu (Müşteriye İletilecek)
                </label>
                <textarea
                  value={declareNote}
                  onChange={(e) => setDeclareNote(e.target.value)}
                  placeholder="İşle ilgili yaptığınız uygulamaları kısaca açıklayın..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#4c630a]/50 focus:ring-1 focus:ring-[#4c630a]/10 rounded-xl py-3.5 px-4 text-xs text-slate-900 focus:outline-none transition-all resize-none leading-relaxed shadow-inner font-semibold"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setCompletingJob(null);
                    setDeclarePrice('');
                    setDeclareNote('');
                  }}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-3 rounded-xl transition-all text-xs border border-slate-200 active:scale-[0.98] cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={submittingDeclaration}
                  className="flex-1 bg-[#4c630a] hover:bg-[#3d5008] text-white font-extrabold py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs disabled:opacity-55 shadow-md shadow-[#4c630a]/10 active:scale-[0.98] cursor-pointer border border-transparent"
                >
                  {submittingDeclaration ? (
                    <span>Gönderiliyor...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4 shrink-0 text-white" />
                      <span>Tamamlandığını Bildir</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔴 İşi İptal Et Modalı */}      {/* 🔴 Job Rejection Modal */}
      {rejectingJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in text-left">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-up">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-xl text-slate-800 tracking-tight">Neden ilgilenmiyorsun?</h3>
              <button 
                onClick={() => {
                  setRejectingJob(null);
                  setRejectReason("");
                  setRejectDetails("");
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="radio" 
                  name="rejectReason"
                  value="Hizmet (meslek) uygun değil"
                  checked={rejectReason === "Hizmet (meslek) uygun değil"}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-5 h-5 accent-green-600 cursor-pointer"
                />
                <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">Hizmet (meslek) uygun değil</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="radio" 
                  name="rejectReason"
                  value="Uzaklık çok fazla"
                  checked={rejectReason === "Uzaklık çok fazla"}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-5 h-5 accent-green-600 cursor-pointer"
                />
                <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">Uzaklık çok fazla</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="radio" 
                  name="rejectReason"
                  value="Detaylar yetersiz"
                  checked={rejectReason === "Detaylar yetersiz"}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-5 h-5 accent-green-600 cursor-pointer"
                />
                <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">Detaylar yetersiz</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="radio" 
                  name="rejectReason"
                  value="Talep ciddi değil"
                  checked={rejectReason === "Talep ciddi değil"}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-5 h-5 accent-green-600 cursor-pointer"
                />
                <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">Talep ciddi değil</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="radio" 
                  name="rejectReason"
                  value="Diğer"
                  checked={rejectReason === "Diğer"}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-5 h-5 accent-green-600 cursor-pointer"
                />
                <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">Diğer</span>
              </label>

              {rejectReason && (
                <div className="mt-2 relative">
                  <textarea
                    placeholder="Sana en uygun iş fırsatlarını sunabilmemiz için lütfen bu işle neden ilgilenmediğini paylaş."
                    className="w-full border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all resize-none h-28 bg-slate-50 focus:bg-white"
                    maxLength={500}
                    value={rejectDetails}
                    onChange={(e) => setRejectDetails(e.target.value)}
                  />
                  <div className="text-[10px] font-bold text-slate-400 text-right mt-1">
                    {rejectDetails.length}/500 karakter
                  </div>
                </div>
              )}

              <button
                onClick={handleRejectJob}
                disabled={isRejecting || !rejectReason}
                className="w-full mt-2 bg-[#22c55e] hover:bg-[#16a34a] text-white font-extrabold text-sm py-4 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isRejecting ? "Gönderiliyor..." : "Gönder"}
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4 text-left">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <span className="text-red-500 text-lg">⚠️</span>
                <span>İşi İptal Et (İptal Nedeni Seçin)</span>
              </h3>
              <button 
                onClick={() => setCancelModal({ isOpen: false, acceptedOfferId: '', reasonCode: '', reasonText: '' })}
                className="text-slate-400 hover:text-slate-850 rounded-xl p-1.5 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-left">
              <p className="text-xs text-slate-500 font-bold leading-relaxed">
                Hizmet veren olarak mağdur olmamanız adına işi iptal edebilirsiniz. Lütfen iptal gerekçesini dürüstçe belirtiniz. Bu gerekçe müşteriye SMS ile iletilecektir.
              </p>

              <div className="space-y-2">
                {[
                  { code: 'musteri-ulasilamiyor', text: 'Müşteriye ulaşılamıyor (Telefon/Mesajlara cevap verilmiyor)' },
                  { code: 'musteri-vazgecti', text: 'Müşteri işi sözlü olarak iptal etti / Vazgeçti' },
                  { code: 'adreste-bulunamadi', text: 'Hizmet alanı adreste bulamadım / Randevuya gelmedi' },
                  { code: 'diger', text: 'Diğer (Açıklama alanını doldurunuz)' }
                ].map((reason) => (
                  <label 
                    key={reason.code} 
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      cancelModal.reasonCode === reason.code 
                        ? 'border-red-200 bg-red-50/30' 
                        : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="cancelReason" 
                      value={reason.code}
                      checked={cancelModal.reasonCode === reason.code}
                      onChange={(e) => setCancelModal(prev => ({ ...prev, reasonCode: e.target.value }))}
                      className="mt-1 accent-red-600"
                    />
                    <span className="text-xs font-semibold text-slate-700 leading-snug">
                      {reason.text}
                    </span>
                  </label>
                ))}
              </div>

              {cancelModal.reasonCode === 'diger' && (
                <div className="space-y-1.5 animate-scale-up">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    İptal Nedeni Açıklaması
                  </label>
                  <textarea
                    value={cancelModal.reasonText}
                    onChange={(e) => setCancelModal(prev => ({ ...prev, reasonText: e.target.value }))}
                    placeholder="Lütfen iptal nedenini buraya detaylıca yazınız..."
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-red-400 focus:ring-1 focus:ring-red-100 rounded-xl py-3.5 px-4 text-xs text-slate-900 focus:outline-none transition-all resize-none leading-relaxed shadow-inner font-semibold"
                  />
                </div>
              )}

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCancelModal({ isOpen: false, acceptedOfferId: '', reasonCode: '', reasonText: '' })}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-3 rounded-xl transition-all text-xs border border-slate-200 active:scale-[0.98] cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleCancelJob}
                  disabled={submittingCancelJob || !cancelModal.reasonCode || (cancelModal.reasonCode === 'diger' && !cancelModal.reasonText.trim())}
                  className="flex-1 bg-red-600 hover:bg-red-750 text-white font-extrabold py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs disabled:opacity-55 shadow-md shadow-red-500/10 active:scale-[0.98] cursor-pointer"
                >
                  {submittingCancelJob ? 'İptal Ediliyor...' : 'İşi İptal Et'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📅 Randevu Oluştur / Güncelle Modalı */}
      {appointmentModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-950" />
                <span>{appointmentModal.job?.appointment_at ? 'Randevuyu Güncelle' : 'Randevu Oluştur'}</span>
              </h3>
              <button 
                onClick={() => setAppointmentModal({ isOpen: false, job: null, appointmentDate: '' })}
                className="text-slate-400 hover:text-slate-855 rounded-xl p-1.5 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateAppointment} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
                  Randevu Tarihi ve Saati
                </label>
                <input
                  type="datetime-local"
                  required
                  value={appointmentModal.appointmentDate}
                  onChange={(e) => setAppointmentModal(prev => ({ ...prev, appointmentDate: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#4c630a]/50 focus:ring-1 focus:ring-[#4c630a]/10 rounded-xl py-3.5 px-4 text-xs font-bold text-slate-900 focus:outline-none transition-all shadow-inner"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAppointmentModal({ isOpen: false, job: null, appointmentDate: '' })}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-3 rounded-xl transition-all text-xs border border-slate-200 active:scale-[0.98] cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={submittingAppointment}
                  className="flex-1 bg-[#4c630a] hover:bg-[#3d5008] text-white font-extrabold py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs disabled:opacity-55 shadow-md shadow-[#4c630a]/10 active:scale-[0.98] cursor-pointer border border-transparent"
                >
                  {submittingAppointment ? (
                    <span>Kaydediliyor...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4 shrink-0 text-white" />
                      <span>Randevuyu Kaydet</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {alertModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] border border-slate-100 p-6 max-w-sm w-full shadow-2xl animate-scale-up space-y-5 text-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto shadow-inner ${
              alertModal.type === 'success' ? 'bg-[#c8f252]/20 border border-[#c8f252]/40 text-[#4c630a]' :
              alertModal.type === 'error' ? 'bg-rose-50 border border-rose-150 text-rose-650' :
              'bg-blue-50 border border-blue-150 text-blue-650'
            }`}>
              {alertModal.type === 'success' && (
                <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {alertModal.type === 'error' && (
                <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
              {alertModal.type === 'info' && (
                <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              )}
            </div>
            <div className="space-y-2">
              <h4 className="font-extrabold text-slate-900 text-sm">{alertModal.title}</h4>
              <p className="text-slate-500 text-xs font-semibold leading-relaxed whitespace-pre-line text-center">
                {alertModal.message}
              </p>
            </div>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
                className="w-full bg-[#4c630a] hover:bg-[#3d5008] text-white text-xs font-extrabold py-2.5 rounded-xl cursor-pointer transition-all active:scale-95 border border-transparent shadow-sm"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] border border-slate-100 p-6 max-w-sm w-full shadow-2xl animate-scale-up space-y-5 text-center">
            <div className="w-12 h-12 rounded-full bg-[#c8f252]/20 border border-[#c8f252]/40 flex items-center justify-center mx-auto text-[#4c630a] shadow-inner">
              <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="space-y-2">
              <h4 className="font-extrabold text-slate-900 text-sm">{confirmModal.title}</h4>
              <p className="text-slate-500 text-xs font-semibold leading-relaxed whitespace-pre-line text-center">
                {confirmModal.message}
              </p>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-all active:scale-95 border border-slate-200"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  confirmModal.onConfirm();
                }}
                className="flex-1 bg-[#4c630a] hover:bg-[#3d5008] text-white text-xs font-extrabold py-2.5 rounded-xl cursor-pointer transition-all active:scale-95 border border-transparent shadow-sm"
              >
                Onayla
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Add Card Modal */}
      {showAddCardModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] border border-slate-100 p-6 max-w-md w-full shadow-2xl animate-scale-up space-y-5 text-left relative">
            <button
              onClick={() => setShowAddCardModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-transparent border-none p-1 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="18" x2="6" y1="6" y2="18" />
                <line x1="6" x2="18" y1="6" y2="18" />
              </svg>
            </button>

            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-900 text-lg">Yeni Ödeme Kartı Ekle</h4>
              <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                Kart bilgileriniz iyzico altyapısıyla şifrelenerek güvenle saklanır.
              </p>
            </div>

            <form onSubmit={handleAddCard} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Kart Sahibi</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="AD SOYAD"
                    value={newCardHolder}
                    onChange={(e) => setNewCardHolder(e.target.value.toUpperCase())}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-slate-350 focus:outline-none rounded-xl text-xs font-bold text-slate-800 transition-colors uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Kart Numarası</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect width="22" height="16" x="1" y="4" rx="3" />
                      <line x1="1" x2="23" y1="10" y2="10" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    required
                    maxLength={19}
                    placeholder="0000 0000 0000 0000"
                    value={newCardNo}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '');
                      const formatted = v.replace(/(.{4})/g, '$1 ').trim();
                      setNewCardNo(formatted);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-slate-350 focus:outline-none rounded-xl text-xs font-mono font-bold text-slate-800 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Son Kullanma Ayı</label>
                  <select
                    required
                    value={newCardMonth}
                    onChange={(e) => setNewCardMonth(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-slate-350 focus:outline-none rounded-xl text-xs font-bold text-slate-800 transition-colors"
                  >
                    <option value="">Ay Seçin</option>
                    {Array.from({ length: 12 }, (_, i) => {
                      const m = String(i + 1).padStart(2, '0');
                      return <option key={m} value={m}>{m}</option>;
                    })}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Son Kullanma Yılı</label>
                  <select
                    required
                    value={newCardYear}
                    onChange={(e) => setNewCardYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-slate-350 focus:outline-none rounded-xl text-xs font-bold text-slate-800 transition-colors"
                  >
                    <option value="">Yıl Seçin</option>
                    {Array.from({ length: 15 }, (_, i) => {
                      const y = String(new Date().getFullYear() + i);
                      return <option key={y} value={y}>{y}</option>;
                    })}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddCardModal(false)}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-all active:scale-95 border border-slate-200"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={addingCard}
                  className="flex-1 bg-[#4c630a] hover:bg-[#3d5008] text-white text-xs font-extrabold py-2.5 rounded-xl cursor-pointer transition-all active:scale-95 border border-transparent shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {addingCard ? (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                  ) : null}
                  {addingCard ? 'Kaydediliyor...' : 'Kartı Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔒 Passive Mode Welcoming Modal (Component A) */}
      {isFirstPassiveLoginModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-md w-full p-8 shadow-2xl border border-slate-100 animate-scale-up text-center space-y-6">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            
            <h3 className="font-extrabold text-slate-900 text-lg leading-snug">
              🔒 HESABINIZ ŞU AN ONAY SÜRECİNDEDİR (PASİF MOD)
            </h3>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Güvenlik, kalite ve adalet standartlarımız gereği, onay süreci tamamlanana kadar sistemdeki canlı ilanları göremez, yeni iş teklifleri alamaz ve teklif veremezsiniz. 
            </p>
            
            <p className="text-xs text-[#4c630a] font-bold leading-relaxed bg-[#c8f252]/10 p-4 rounded-2xl">
              Ancak bu süreçte esnaaf.com panelinizi özgürce gezebilir, menüleri ve sistemin işleyişini inceleyerek platformu tamamen öğrenebilirsiniz!
            </p>
            
            <button
              onClick={() => setIsFirstPassiveLoginModalOpen(false)}
              className="w-full bg-[#4c630a] hover:bg-[#3d5008] text-white font-extrabold py-3.5 rounded-2xl transition-all text-xs cursor-pointer shadow-md active:scale-95"
            >
              Anladım, Platformu Keşfet
            </button>
          </div>
        </div>
      )}

      {/* 🎉 Success Confetti Modal (Component B) */}
      {showConfettiModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm z-[9999] p-4 animate-fade-in">
          <ConfettiEffect active={showConfettiModal} />
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-2xl p-8 max-w-md w-full text-center space-y-6 animate-scale-up relative overflow-hidden">
            {/* Decorative Background Glows */}
            <div className="absolute -top-12 -left-12 w-24 h-24 bg-[#c8f252]/20 rounded-full blur-xl" />
            <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-blue-500/10 rounded-full blur-xl" />

            <div className="w-20 h-20 bg-[#c8f252]/10 border border-[#c8f252]/30 rounded-full flex items-center justify-center mx-auto text-3xl animate-bounce">
              🎉
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                TEBRİKLER, AKTİF MODDASINIZ!
              </h3>
              <p className="text-slate-500 text-xs md:text-sm font-semibold leading-relaxed">
                Müsaitlik durumunuz başarıyla <strong>"Aktif"</strong> olarak güncellendi. Canlı ilanlar anında akmaya başlayacaktır!
              </p>
            </div>
            
            <div className="bg-[#c8f252]/10 border border-[#c8f252]/30 p-4 rounded-2xl text-left">
              <div className="text-slate-800 text-[11px] font-bold leading-relaxed space-y-1">
                <p>✅ Yeni ilanlar anında akışınıza düşer.</p>
                <p>✅ En uygun teklifi vererek yeni işler kapabilirsiniz.</p>
                <p>💡 Yoğun olduğunuzda durumunuzu kapatmayı unutmayın.</p>
              </div>
            </div>

            <button
              onClick={() => setShowConfettiModal(false)}
              className="w-full bg-[#c8f252] hover:bg-[#b5e639] text-slate-955 font-black text-xs py-3.5 rounded-2xl cursor-pointer shadow-md transition-all active:scale-95 border border-transparent uppercase tracking-wider"
            >
              Hadi Başlayalım! 🚀
            </button>
          </div>
        </div>
      )}

      {/* MANDATORY RESET PASSWORD POPUP */}
      {showResetPasswordPopup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-md w-full p-8 shadow-2xl border border-slate-100 animate-scale-up text-left space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-[#c8f252]/10 border border-[#c8f252]/30 rounded-2xl flex items-center justify-center mx-auto mb-2 text-[#4c630a]">
                <Lock className="w-8 h-8 stroke-[2.2]" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg">
                Yeni Şifre Belirleyin
              </h3>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Platform güvenliğiniz için lütfen yeni bir giriş şifresi tanımlayın.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700">Yeni Şifre</label>
                <input
                  type={showPopupPassword ? "text" : "password"}
                  value={popupNewPassword}
                  onChange={(e) => setPopupNewPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#4c630a] rounded-xl p-3 outline-none text-xs font-bold text-slate-850"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700">Yeni Şifre Tekrar</label>
                <input
                  type={showPopupPassword ? "text" : "password"}
                  value={popupConfirmPassword}
                  onChange={(e) => setPopupConfirmPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#4c630a] rounded-xl p-3 outline-none text-xs font-bold text-slate-850"
                />
              </div>
              
              {/* Şifreyi Göster Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="showPopupPasswordCheckbox"
                  checked={showPopupPassword}
                  onChange={(e) => setShowPopupPassword(e.target.checked)}
                  className="w-4 h-4 rounded text-[#4c630a] focus:ring-[#4c630a]/20 border-slate-300 accent-[#4c630a] cursor-pointer"
                />
                <label 
                  htmlFor="showPopupPasswordCheckbox" 
                  className="text-xs font-bold text-slate-500 cursor-pointer select-none"
                >
                  Şifreyi Göster
                </label>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSavePopupPassword}
              disabled={isSavingPopupPassword || !popupNewPassword || popupNewPassword.length < 6}
              className="w-full bg-[#4c630a] hover:bg-[#3d5008] text-white font-extrabold py-3.5 rounded-2xl flex items-center justify-center gap-1.5 transition-all text-xs disabled:opacity-50 active:scale-[0.98] cursor-pointer shadow-md shadow-[#4c630a]/10"
            >
              {isSavingPopupPassword ? 'Şifre Kaydediliyor...' : 'Şifreyi Kaydet ve Devam Et'}
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
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
      `}} />
    </div>
    </div>
  );
}
