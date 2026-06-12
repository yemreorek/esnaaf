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
  AlertTriangle
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

  const [activeTab, setActiveTab] = useState<'firsatlar' | 'teklifler' | 'kazanilanlar' | 'tamamlananlar' | 'yorumlar' | 'abonelik' | 'uyusmazliklar' | 'belge-dogrulama'>('firsatlar');
  const [offersList, setOffersList] = useState<any[]>([]);
  const [wonJobs, setWonJobs] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [disputesList, setDisputesList] = useState<any[]>([]);

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
  const [loginMethod, setLoginMethod] = useState<'otp' | 'password'>('otp');
  const [password, setPassword] = useState('');

  const isTabLocked = (tabName: typeof activeTab) => {
    return profile && !profile.isApproved && tabName !== 'belge-dogrulama';
  };

  const handleTabClick = (tabName: typeof activeTab) => {
    if (isTabLocked(tabName)) {
      alert("Lütfen öncelikle belgelerinizi yükleyin ve onay sürecinin tamamlanmasını bekleyin.");
      return;
    }
    setActiveTab(tabName);
    setMobileMenuOpen(false);
  };

  const [uploadingIdentity, setUploadingIdentity] = useState(false);
  const [uploadingTaxPlate, setUploadingTaxPlate] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'identity' | 'tax') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert("Geçersiz dosya tipi. Yalnızca PNG, JPEG, WEBP ve PDF yükleyebilirsiniz.");
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
      if (tokenParam) {
        localStorage.setItem('provider_token', tokenParam);
        if (phoneParam) {
          localStorage.setItem('provider_phone', phoneParam);
        }
        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    const savedToken = localStorage.getItem('provider_token');
    const savedPhone = localStorage.getItem('provider_phone');
    if (savedToken) {
      setToken(savedToken);
      if (savedPhone) {
        setPhoneNumber(savedPhone);
        setSelectedPhone(savedPhone);
      }
      loadDashboardData(savedToken);
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
        body: JSON.stringify({ phone: phoneNumber, code: otpCode }),
      });
      
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error?.message || 'OTP doğrulaması başarısız.');
      }
      
      const accessToken = verifyData.accessToken;
      setToken(accessToken);
      localStorage.setItem('provider_token', accessToken);
      localStorage.setItem('provider_phone', phoneNumber);
      addLog(`JWT Access Token alındı. Başarıyla giriş yapıldı!`);
      
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
    if (!phoneNumber) {
      setLoginError("Lütfen telefon numaranızı girin.");
      return;
    }
    if (!password) {
      setLoginError("Lütfen şifrenizi girin.");
      return;
    }
    
    setLoading(true);
    setLoginError('');
    addLog(`Şifreli giriş isteği başlatıldı: ${phoneNumber}`);
    
    try {
      const loginRes = await fetch('/api/ortak/auth/provider-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, password }),
      });
      
      const loginData = await loginRes.json();
      if (!loginRes.ok) {
        throw new Error(loginData.message || 'Giriş başarısız.');
      }
      
      const accessToken = loginData.accessToken;
      setToken(accessToken);
      localStorage.setItem('provider_token', accessToken);
      localStorage.setItem('provider_phone', phoneNumber);
      addLog(`Şifreli giriş başarılı! Jetonlar alındı.`);
      
      await loadDashboardData(accessToken);
    } catch (err: any) {
      setLoginError(err.message);
      addLog(`Hata: ${err.message}`);
    } finally {
      setLoading(false);
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
      localStorage.setItem('provider_token', accessToken);
      localStorage.setItem('provider_phone', phone);
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
      const profileRes = await fetch('/api/hizmetveren/profil', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const profileData = await profileRes.json();
      if (profileRes.ok) {
        setProfile(profileData);
        addLog(`Profil bilgileri yüklendi: Onay Durumu: ${profileData.isApproved}`);
        if (!profileData.isApproved) {
          setActiveTab('belge-dogrulama');
        }
      }

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

    socket.on('disconnect', () => {
      addLog(`WebSocket bağlantısı kesildi.`);
    });
  };

  const fetchTabDependencies = async (tab: string, currentToken: string) => {
    if (!currentToken) return;
    setLoading(true);
    try {
      if (tab === 'firsatlar') {
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
        if (data.status === 'trial') {
          alert(data.message || 'Deneme süreniz başarıyla başlatıldı!');
          setSelectedPackage(null);
          setValidatedCampaign(null);
          setCampaignCodeInput('');
          fetchTabDependencies('abonelik', token);
          loadDashboardData(token);
        } else {
          setCheckoutFormHtml(data.checkoutFormContent);
        }
      } else {
        alert(data.error?.message || 'Abonelik başlatılamadı.');
      }
    } catch (err) {
      alert('Abonelik başlatılırken bir hata oluştu.');
    } finally {
      setSubmittingSubscription(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!token) return;
    const confirm = window.confirm('Aboneliğinizi iptal etmek istediğinize emin misiniz? Dönem sonuna kadar kullanımınız devam edecektir.');
    if (!confirm) return;

    try {
      const res = await fetch('/api/hizmetveren/abonelik/iptal', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || 'Aboneliğiniz iptal edildi.');
        fetchTabDependencies('abonelik', token);
      } else {
        alert(data.error?.message || 'İptal işlemi başarısız.');
      }
    } catch (err) {
      alert('Abonelik iptal edilirken bir hata oluştu.');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat || !newMessageText.trim() || !token) return;

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
        alert(err.message || "Mesaj gönderilemedi.");
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
      alert("Lütfen geçerli bir beyan ücreti giriniz.");
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
        alert("İş tamamlanma beyanı başarıyla gönderildi!");
        setCompletingJob(null);
        setDeclarePrice('');
        setDeclareNote('');
        fetchTabDependencies(activeTab, token);
      } else {
        const data = await res.json();
        alert(data.message || "Beyan gönderilemedi.");
      }
    } catch (err: any) {
      alert(err.message || "Bir hata oluştu.");
    } finally {
      setSubmittingDeclaration(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTabDependencies(activeTab, token);
    }
  }, [activeTab, token]);

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
              * Bu test ustaları Adana bölgesi için onaylanmış aktiftir.
            </p>
          </div>

        </div>
      </div>
    );
  }

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

        {/* Circular Profile Card with status checkmark */}
        <div className="flex items-center gap-3 mb-6 p-3 rounded-2xl bg-[#f8fafc] border border-slate-100 shadow-[0_2px_4px_rgba(0,0,0,0.01)]">
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
              {profile ? profile.name : 'Usta'}
            </p>
            <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase block tracking-wider font-mono">
              {profile && !profile.isApproved ? 'ONAY BEKLEYEN USTA' : 'DOĞRULANMIŞ UZMAN'}
            </span>
          </div>
        </div>

        {/* Sidebar Menu items */}
        <div className="flex-1 flex flex-col gap-1 overflow-y-auto scrollbar-none pr-0.5">
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
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                alt="Usta Profil"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100"
              />
            </div>
          </div>
        </header>

        <div className="p-6 md:p-8 space-y-8 z-10 flex-1 relative overflow-y-auto">
          {/* Switchable content based on activeTab */}
          {activeTab === 'firsatlar' && (
            <>
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
                {token ? (
                  jobs.length > 0 ? (
                    jobs.map((job) => {
                      const badgeText = job.aciliyet || (
                        job.categoryName.includes("Temizlik") ? "ACİL TALEP" :
                        job.categoryName.includes("Nakliyat") ? "PLANLI İŞ" :
                        job.categoryName.includes("Tadilat") ? "YÜKSEK ÖNCELİK" : "STANDART İŞ"
                      );
                      const badgeType = job.aciliyet ? (
                        job.aciliyet.toLowerCase().includes("acil") ? "urgent" :
                        job.aciliyet.toLowerCase().includes("yüksek") ? "high" :
                        job.aciliyet.toLowerCase().includes("plan") ? "planned" : "standard"
                      ) : (
                        job.categoryName.includes("Temizlik") ? "urgent" :
                        job.categoryName.includes("Nakliyat") ? "planned" :
                        job.categoryName.includes("Tadilat") ? "high" : "standard"
                      );

                      const estBudget = job.butce || (
                        job.categoryName.includes("Temizlik") ? "1.200 TL – 1.500 TL" :
                        job.categoryName.includes("Nakliyat") ? "2.500 TL – 3.200 TL" :
                        job.categoryName.includes("Tadilat") ? "4.000 TL – 6.000 TL" :
                        job.categoryName.includes("Boya") ? "8.500 TL – 12.000 TL" : "1.500 TL – 3.000 TL"
                      );

                      return (
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
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase mt-0.5 self-start tracking-wider font-mono ${
                                    badgeType === "urgent" ? "bg-rose-50 text-rose-600 border border-rose-100/50 font-black" :
                                    badgeType === "high" ? "bg-[#c8f252]/20 text-[#4c630a] border border-[#c8f252]/30" :
                                    badgeType === "planned" ? "bg-slate-100 text-slate-700" : "bg-slate-50 text-slate-500"
                                  }`}>
                                    {badgeText}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="text-right flex flex-col text-[10px] text-slate-400 font-semibold gap-0.5">
                                <span className="flex items-center gap-1 justify-end">👁️ {job.viewerCount || 3} usta inceliyor</span>
                                <span>{formatRelativeTime(job.created_at)}</span>
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

                            <p className="text-xs text-slate-650 font-medium leading-relaxed italic bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed font-semibold whitespace-pre-line">
                              &ldquo;{job.details}&rdquo;
                            </p>
                          </div>

                          <div className="border-t border-slate-50 pt-4 flex items-center justify-between gap-4">
                            <div className="text-left">
                              <span className="block text-[9px] text-slate-450 font-bold uppercase tracking-wider">Tahmini Bütçe</span>
                              <span className="text-base font-black text-slate-900 tracking-tight">{estBudget}</span>
                            </div>

                            <button
                              onClick={() => setActiveJob(job)}
                              className="bg-[#4c630a] hover:bg-[#3d5008] text-white font-extrabold text-xs py-3 px-5 rounded-2xl transition-all shadow-sm active:scale-95 cursor-pointer border border-transparent"
                            >
                              Teklif Ver
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    /* Premium Empty State */
                    <div className="lg:col-span-2 bg-white p-12 rounded-[32px] border border-slate-100 shadow-[0_4px_30px_rgba(15,23,42,0.015)] text-center space-y-5 animate-scale-up py-16 w-full">
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

                        <div className="flex items-center gap-3 bg-slate-50/60 border border-slate-100/80 rounded-2xl p-3">
                          <div className="w-8 h-8 rounded-full bg-[#c8f252]/10 border border-[#c8f252]/20 flex items-center justify-center text-[#4c630a] font-extrabold text-xs shrink-0 select-none">
                            {(opp.name || "Misafir Seeker").charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="font-extrabold text-xs text-slate-800 leading-snug">{opp.name}</span>
                            <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {opp.district}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-650 font-semibold italic bg-[#f8fafc] p-4 rounded-2xl border border-slate-100 leading-relaxed text-left whitespace-pre-line">
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
            </>
          )}

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
                          <span className="bg-[#c8f252]/10 border border-[#c8f252]/30 text-[#4c630a] text-[10px] font-black px-2.5 py-0.5 rounded uppercase font-mono tracking-wider">
                            {off.job.categoryName}
                          </span>
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
                          <div><strong>Talep Açıklaması:</strong> <span className="whitespace-pre-line">{off.job.details}</span></div>
                        </div>
                      </div>
                      <div className="border-t border-slate-50 pt-3 flex justify-between items-center">
                        <span className="text-slate-900 font-black text-sm">₺{off.price.toLocaleString("tr-TR")}</span>
                        <span className="text-[10px] text-slate-400 font-mono font-bold">
                          {new Date(off.created_at).toLocaleDateString("tr-TR")}
                        </span>
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
                                      <span className="bg-[#c8f252]/10 border border-[#c8f252]/30 text-[#4c630a] text-[10px] font-black px-2.5 py-0.5 rounded uppercase font-mono tracking-wider">
                                        {wj.job.categoryName}
                                      </span>
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
                                      <p className="italic bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 mt-2 font-semibold text-slate-650 leading-relaxed whitespace-pre-line">
                                        &ldquo;{wj.job.details}&rdquo;
                                      </p>
                                    </div>
                                  </div>
                                  <div className="border-t border-slate-100 pt-3.5 flex items-center justify-between gap-3">
                                    <div className="text-left">
                                      <span className="text-[9px] block text-slate-400 font-bold uppercase tracking-wider">Anlaşılan Fiyat</span>
                                      <span className="text-slate-900 font-black text-base">₺{wj.price.toLocaleString("tr-TR")}</span>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => setActiveChat({ jobId: wj.job.id, offerId: wj.offerId, customerName: wj.job.name })}
                                        className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[11px] py-2.5 px-4.5 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm"
                                      >
                                        Mesaj Gönder
                                      </button>
                                      <button
                                        onClick={() => {
                                          setCompletingJob(wj);
                                          setDeclarePrice(wj.price ? Number(wj.price).toLocaleString('tr-TR') : '');
                                        }}
                                        className="bg-[#c8f252] hover:bg-[#b5e639] text-slate-950 font-black text-[11px] py-2.5 px-4.5 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm"
                                      >
                                        İşi Tamamla
                                      </button>
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

          {activeTab === 'tamamlananlar' && (
            <div className="space-y-6 animate-scale-up text-left">
              <div>
                <h2 className="font-extrabold text-slate-900 tracking-tight text-2xl md:text-3xl">
                  Tamamlanan İşler
                </h2>
                <p className="text-slate-400 text-xs mt-1 font-semibold leading-relaxed">
                  Başarıyla tamamlayıp teslim ettiğiniz geçmiş işleriniz.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch w-full">
                {completedJobs.length > 0 ? (
                  completedJobs.map((cj) => (
                    <div key={cj.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <span className="bg-[#c8f252]/10 border border-[#c8f252]/30 text-[#4c630a] text-[10px] font-black px-2.5 py-0.5 rounded uppercase font-mono tracking-wider">
                            {cj.job.categoryName}
                          </span>
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black px-2.5 py-0.5 rounded uppercase font-mono tracking-wider">
                            Tamamlandı
                          </span>
                        </div>
                        <div className="text-xs space-y-1.5 text-slate-600 font-semibold border-t border-slate-50 pt-2.5">
                          <div><strong>Müşteri:</strong> {cj.job.name}</div>
                          <div><strong>Konum:</strong> {cj.job.district}</div>
                          <div><strong>Açıklama:</strong> <span className="whitespace-pre-line">{cj.job.details}</span></div>
                        </div>
                      </div>
                      <div className="border-t border-slate-50 pt-3 flex justify-between items-center">
                        <span className="text-slate-900 font-black text-sm">₺{cj.price.toLocaleString("tr-TR")}</span>
                        <span className="text-[10px] text-slate-400 font-mono font-bold">
                          {new Date(cj.completed_at).toLocaleDateString("tr-TR")}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="lg:col-span-2 bg-white p-12 rounded-[32px] border border-slate-100 text-center py-16 w-full">
                    <span className="text-3xl">🏆</span>
                    <h3 className="font-extrabold text-slate-950 text-base mt-3">Tamamlanan İş Yok</h3>
                    <p className="text-slate-400 text-xs mt-1">Tamamladığınız ve her iki tarafça onaylanan iş geçmişiniz burada listelenecektir.</p>
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
                            <div><strong>Talep Açıklaması:</strong> <span className="whitespace-pre-line">{disp.job.details || 'Belirtilmedi'}</span></div>
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
                      <p className="text-xs text-slate-650 font-semibold bg-slate-50 p-4 rounded-xl border border-slate-100 italic leading-relaxed">
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
                {/* Left: Active Subscription Card */}
                <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-[28px] p-6 shadow-lg text-white flex flex-col justify-between relative overflow-hidden h-[240px]">
                  {/* Glowing blobs */}
                  <div className="absolute top-[-30px] right-[-30px] w-24 h-24 rounded-full bg-[#c8f252]/10 blur-xl"></div>
                  
                  <div className="flex justify-between items-start z-10">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block text-left">Mevcut Abonelik Planı</span>
                      <h3 className="text-2xl font-black tracking-tight text-[#c8f252] uppercase mt-1">
                        {subscriptionDetails?.subscription?.package_type ? `${subscriptionDetails.subscription.package_type} Paket` : 'Paket Bulunmuyor'}
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
                      <span>Bu Ayki Kullanılan Kota:</span>
                      <span className="text-white font-mono">{subscriptionDetails?.quota?.accepted_count || 0} / {subscriptionDetails?.quota?.monthly_limit || 'Sınırsız (VIP)'}</span>
                    </div>
                    {/* Progress Bar */}
                    {subscriptionDetails?.quota?.monthly_limit && (
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
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

                {/* Right: Package catalog list */}
                <div className="lg:col-span-2 bg-white border border-slate-150 p-6 rounded-[28px] shadow-sm flex flex-col justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-slate-900 text-sm">Abonelik Paketleri</h3>
                    <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                      Sisteme gelen iş tekliflerini görebilmek ve teklif verebilmek için paket limitlerinizi yükseltin.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
                    {availablePackages.map((pkg: any) => {
                      const isCurrent = subscriptionDetails?.subscription?.package_type === pkg.type;
                      return (
                        <div 
                          key={pkg.type}
                          onClick={() => {
                            if (!isCurrent) {
                              setSelectedPackage(pkg);
                              setValidatedCampaign(null);
                              setCampaignCodeInput('');
                            }
                          }}
                          className={`border rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col justify-between gap-4 h-[180px] ${
                            isCurrent
                              ? 'bg-slate-50 border-slate-200 opacity-60 pointer-events-none'
                              : selectedPackage?.type === pkg.type
                              ? 'border-[#c8f252] bg-[#c8f252]/5 ring-2 ring-[#c8f252]/30 shadow-sm'
                              : 'border-slate-150 hover:border-slate-300 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.01)]'
                          }`}
                        >
                          <div>
                            <span className="block text-[10px] text-slate-450 font-black uppercase tracking-wider">{pkg.name}</span>
                            <span className="block text-2xl font-black text-slate-900 tracking-tight mt-2">₺{pkg.price.toLocaleString('tr-TR')}</span>
                            <span className="block text-[9px] text-slate-400 font-bold mt-1">{pkg.quota ? `${pkg.quota} Teklif / Ay` : 'Sınırsız Teklif (VIP)'}</span>
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
                            {isCurrent ? 'Aktif' : selectedPackage?.type === pkg.type ? 'Seçildi' : 'Seç'}
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
                        <span>Kota Sınırı:</span>
                        <span className="font-extrabold text-slate-800">{selectedPackage.quota ? `${selectedPackage.quota} Teklif` : 'Sınırsız (VIP)'}</span>
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
