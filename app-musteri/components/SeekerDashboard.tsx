"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { io, Socket } from "socket.io-client";
import { customFetch, logout, getAuthUser } from "../lib/session";
import { 
  FileText, 
  Play, 
  BarChart2, 
  MessageSquare, 
  Star, 
  PlusCircle, 
  Plus, 
  Bell, 
  Filter, 
  ChevronDown, 
  Grid, 
  List, 
  Hammer, 
  Truck, 
  CheckCircle2, 
  Calendar,
  User,
  LogOut,
  ChevronRight,
  MoreVertical,
  X,
  Compass,
  Briefcase,
  SlidersHorizontal,
  Coins,
  MapPin,
  Award,
  Settings,
  HelpCircle,
  Activity,
  Wallet,
  Copy,
  Check,
  RefreshCw
} from "lucide-react";

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

export const getCancelReasonText = (code?: string | null, text?: string | null): string => {
  if (code === 'musteri-ulasilamiyor') return 'Müşteriye ulaşılamıyor (Telefon/Mesajlara cevap verilmiyor)';
  if (code === 'musteri-vazgecti') return 'Müşteri işi sözlü olarak iptal etti / Vazgeçti';
  if (code === 'adreste-bulunamadi') return 'Hizmet alanı adreste bulamadım / Randevuya gelmedi';
  if (code === 'diger') return text || 'Diğer Nedenler';
  return text || code || 'Gerekçe belirtilmedi';
};

interface Offer {
  id: string;
  price: number;
  description?: string;
  message?: string;
  status: "pending" | "accepted" | "rejected" | "cancelled" | "archived";
  created_at: string | Date;
  provider: {
    id: string;
    avg_rating?: number | string;
    user: {
      name: string;
      phone_masked: string;
      phone_decrypted?: string;
    };
  };
  appointment_at?: string | Date | null;
  started_at?: string | Date | null;
  cancelled_by?: string | null;
  cancel_reason_code?: string | null;
  cancel_reason_text?: string | null;
  cancelled_at?: string | Date | null;
}

interface RequestItem {
  id: string;
  status: "pending" | "distributed" | "completed" | "cancelled";
  created_at: string;
  is_direct?: boolean;
  created_by_provider?: boolean;
  form_data: {
    name?: string;
    phone?: string;
    categorySlug?: string;
    district?: string;
    details?: string;
    tarih?: string;
    daireTipi?: string;
    siflik?: string;
    sıklık?: string;
    metrekare?: string;
    tur?: string;
    renkTip?: string;
    sorunTuru?: string;
    isTuru?: string;
    aciliyet?: string;
    kapsam?: string;
    butce?: string;
    destinationDistrict?: string;
    city?: string;
    destinationCity?: string;
    sendToFavoritesOnly?: boolean;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  offers: Offer[];
  republished_from_id?: string | null;
  seeker?: {
    id: string;
    name?: string;
    phone_decrypted?: string;
  };
  job_completions?: {
    id: string;
    status: string;
    provider_declared_amount?: number | string;
    provider?: {
      id: string;
      user?: {
        name?: string;
      };
    };
  }[];
  reviews?: any[];
}

interface SeekerDashboardProps {
  initialJobId?: string | null;
  onLogout: () => void;
  onStartChat?: (initialMessage?: string) => void;
}

const getRequestExpiryInfo = (
  createdAt: Date | string,
  compareWith: number = Date.now(),
  offers: { created_at?: Date | string | number }[] = []
) => {
  const createdDate = new Date(createdAt);
  
  // Format parts timezone-independently using Intl.DateTimeFormat
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    hour12: false
  });
  
  const parts = formatter.formatToParts(createdDate);
  const partVal = (type: string) => parts.find(p => p.type === type)?.value || '';
  
  const hour = parseInt(partVal('hour'), 10);
  const isNight = hour >= 18 || hour < 10;
  
  let initialExpiresTime = 0;
  let initialLabel = '30 dakika';

  if (isNight) {
    const targetDate = new Date(createdDate);
    if (hour >= 18) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    
    // Format target date parts to get YYYY-MM-DD
    const targetFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Istanbul',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour12: false
    });
    
    const tParts = targetFormatter.formatToParts(targetDate);
    const tPartVal = (type: string) => tParts.find(p => p.type === type)?.value || '';
    
    const tYear = tPartVal('year');
    const tMonth = tPartVal('month').padStart(2, '0');
    const tDay = tPartVal('day').padStart(2, '0');
    
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
  variant = 'default',
  offers = []
}: { 
  createdAt: string | Date; 
  expiresTime?: number;
  onExpire?: () => void; 
  variant?: 'default' | 'large';
  offers?: any[];
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculateTime = () => {
      let expTime = expiresTime;
      if (!expTime) {
        const { expiresTime: calculated } = getRequestExpiryInfo(createdAt, Date.now(), offers);
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

// Mockup Active Offers exactly matching the screenshot
const MOCKUP_ACTIVE_OFFERS = [
  {
    id: "mockup-req-1",
    title: "Mutfak Tadilatı",
    code: "#TR-49210",
    icon: "tools",
    offers: [
      {
        id: "mockup-off-1",
        providerName: "Kaya Dekorasyon",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100",
        rating: "4.9",
        reviewsCount: "156",
        description: "Mutfak tadilatınız için en kaliteli malzemeleri kullanarak 5 iş günü içerisinde anahtar teslim hizmet sunuyoruz. Garanti kapsamımız mevcuttur.",
        price: "18.500",
      },
      {
        id: "mockup-off-2",
        providerName: "Usta El Yapı",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100",
        rating: "4.7",
        reviewsCount: "89",
        description: "Ekonomik ve hızlı çözüm arayanlar için ideal paketimiz. 3 günü içerisinde montaj dahil teslimat.",
        price: "16.200",
      }
    ]
  },
  {
    id: "mockup-req-2",
    title: "Ev Temizliği",
    code: "#TR-48551",
    icon: "cleaning",
    offers: [
      {
        id: "mockup-off-3",
        providerName: "Pırıl Temizlik",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100",
        rating: "4.8",
        reviewsCount: "210",
        description: "Profesyonel ekipmanlarla detaylı ev temizliği hizmeti sunuyoruz. Memnuniyet garantili.",
        price: "1.200",
      },
      {
        id: "mockup-off-4",
        providerName: "Titiz Hanım",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100",
        rating: "4.9",
        reviewsCount: "156",
        description: "Yüksek hijyen standartlarında, güvenilir ve hızlı temizlik çözümleri.",
        price: "1.450",
      }
    ]
  }
];

const MOCK_PAST_REQUESTS_MOCKUP = [
  {
    id: "mockup-past-1",
    title: "Mutfak Tadilatı",
    code: "#TR-49210",
    date: "12 Ekim 2023",
    offersCount: "6 Teklif",
    status: "6 TEKLİF",
    icon: "tools",
    actionText: "Gelen Teklifleri İncele"
  },
  {
    id: "mockup-past-2",
    title: "Şehirler Arası Nakliye",
    code: "#TR-48122",
    date: "08 Ekim 2023",
    offersCount: "2 Teklif",
    status: "BEKLEMEDE",
    icon: "truck",
    actionText: "Beklemede"
  },
  {
    id: "mockup-past-3",
    title: "Klima Bakımı",
    code: "#TR-47551",
    date: "05 Ekim 2023",
    offersCount: "Onaylandı",
    status: "TAMAMLANDI",
    icon: "check",
    actionText: "Tamamlandı"
  }
];

export default function SeekerDashboard({ initialJobId, onLogout, onStartChat }: SeekerDashboardProps) {
  // Navigation tabs matching sidebar
  const [activeTab, setActiveTab] = useState<"tekliflerim" | "canlobi" | "karsilastirma" | "mesajlar" | "puanlama" | "profile" | "cuzdan" | "favoriler">("tekliflerim");
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);
  const [compareJobId, setCompareJobId] = useState<string>("");
  const [activeChat, setActiveChat] = useState<{ jobId: string; offerId: string; providerName: string; providerId: string } | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState<string>("");
  const [loadingChatMessages, setLoadingChatMessages] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Form states for profile edit
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");

  // Completion/Rating states (Step 6 / Phase 2)
  const [completionState, setCompletionState] = useState<string | null>(null);
  const [providerName, setProviderName] = useState<string | null>("");
  const [providerDeclaredAmount, setProviderDeclaredAmount] = useState<number | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [showDiscrepancyForm, setShowDiscrepancyForm] = useState(false);
  const [isServiceNotReceived, setIsServiceNotReceived] = useState(false);
  const [seekerDisputeAmount, setSeekerDisputeAmount] = useState("");
  const [disputeNote, setDisputeNote] = useState("");
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isAddedToFavorites, setIsAddedToFavorites] = useState(false);
  const [justReviewedRequest, setJustReviewedRequest] = useState<any>(null);
  const [isImpersonated, setIsImpersonated] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsImpersonated(localStorage.getItem('esnaaf_impersonated') === 'true');
    }
  }, []);

  const handleExitImpersonation = () => {
    localStorage.removeItem("esnaaf_token");
    localStorage.removeItem("esnaaf_refresh_token");
    localStorage.removeItem("esnaaf_user");
    localStorage.removeItem("esnaaf_impersonated");
    window.close();
    window.location.href = "/";
  };
  const [mutualPhones, setMutualPhones] = useState<{ seekerPhone?: string; providerPhone?: string } | null>(null);

  // Notification states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const notifDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notifDropdownRef.current && 
        !notifDropdownRef.current.contains(event.target as Node)
      ) {
        setNotifDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Esnaaf Loyalty & Direct Request states
  const [esnaafId, setEsnaafId] = useState<string>("");
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loyaltyRequests, setLoyaltyRequests] = useState<any[]>([]);
  
  // Search & add usta
  const [searchEsnaafId, setSearchEsnaafId] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  // Direct Request Form
  const [directRequestProvider, setDirectRequestProvider] = useState<any>(null);
  const [directDetails, setDirectDetails] = useState("");
  const [directDistrict, setDirectDistrict] = useState("");
  const [directCategorySlug, setDirectCategorySlug] = useState("ev-temizligi");
  const [isSubmittingDirect, setIsSubmittingDirect] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      onCancel,
    });
  };



  // UI state for grid / list view
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Referral and wallet states
  const [referralData, setReferralData] = useState<any>(null);
  const [referralCodeInput, setReferralCodeInput] = useState("");
  const [submittingReferral, setSubmittingReferral] = useState(false);
  const [referralMessage, setReferralMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Provider profile states
  const [selectedProviderProfile, setSelectedProviderProfile] = useState<any>(null);
  const [loadingProviderProfile, setLoadingProviderProfile] = useState<boolean>(false);

  const fetchProviderProfile = async (providerId: string) => {
    setLoadingProviderProfile(true);
    try {
      const res = await customFetch(`/api/musteri/teklifler/hizmetveren/${providerId}/profil`);
      if (!res.ok) {
        throw new Error("Hizmet veren profili yüklenemedi.");
      }
      const data = await res.json();
      setSelectedProviderProfile(data);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Hizmet veren profili yüklenirken bir hata oluştu.");
    } finally {
      setLoadingProviderProfile(false);
    }
  };

  const fetchReferralData = async () => {
    setReferralLoading(true);
    try {
      const res = await customFetch("/api/ortak/referral/kod-al");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setReferralData(data);
        }
      }
    } catch (err) {
      console.error("Fetch referral data failed:", err);
    } finally {
      setReferralLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitReferralCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralCodeInput.trim()) return;
    setSubmittingReferral(true);
    setReferralMessage(null);
    try {
      const res = await customFetch("/api/ortak/referral/kod-gir", {
        method: "POST",
        body: JSON.stringify({ code: referralCodeInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReferralMessage({ type: "success", text: data.message || "Referans kodu başarıyla uygulandı!" });
        setReferralCodeInput("");
        fetchReferralData(); // Refresh balance and applied status
      } else {
        setReferralMessage({ type: "error", text: data.error?.message || "Referans kodu uygulanamadı." });
      }
    } catch (err) {
      setReferralMessage({ type: "error", text: "Bir ağ hatası oluştu." });
    } finally {
      setSubmittingReferral(false);
    }
  };

  const socketRef = useRef<Socket | null>(null);
  const selectedRequestRef = useRef<RequestItem | null>(selectedRequest);
  const activeChatRef = useRef<{ jobId: string; offerId: string; providerName: string; providerId: string } | null>(activeChat);
  const requestsRef = useRef<RequestItem[]>(requests);

  // Sync refs with state to prevent stale closures in websocket listeners without reconnecting
  useEffect(() => {
    selectedRequestRef.current = selectedRequest;
  }, [selectedRequest]);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    requestsRef.current = requests;
  }, [requests]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch initial profile & notifications
  useEffect(() => {
    const authUser = getAuthUser();
    if (authUser) {
      setUser(authUser);
      setProfileName(authUser.name || "");
      setProfileEmail(authUser.email || "");
      fetchNotifications();
    }
    fetchRequests();
    fetchFavorites();
    
    // Fetch Esnaaf ID
    const fetchEsnaafId = async () => {
      try {
        const res = await customFetch("/api/ortak/favoriler/profil-esnaaf-id");
        if (res.ok) {
          const data = await res.json();
          setEsnaafId(data.esnaaf_id);
        }
      } catch (err) {
        console.error("Failed to fetch Esnaaf ID:", err);
      }
    };
    fetchEsnaafId();
  }, []);

  // Fetch favorites and loyalty requests on tab change
  useEffect(() => {
    if (activeTab === "favoriler") {
      fetchFavorites();
      fetchLoyaltyRequests();
    }
  }, [activeTab]);

  const prevSelectedRequestRef = useRef<string | null>(null);

  // Reset justReviewedRequest when changing tabs
  useEffect(() => {
    setJustReviewedRequest(null);
    setRatingSubmitted(false);
  }, [activeTab]);

  // Reset ratingSubmitted when selectedRequest changes and sync provider / completion states
  useEffect(() => {
    if (selectedRequest?.id !== prevSelectedRequestRef.current) {
      setRatingSubmitted(false);
      prevSelectedRequestRef.current = selectedRequest?.id || null;
    }

    if (selectedRequest) {
      const currentCompletion = selectedRequest.job_completions?.[0];
      const acceptedOffer = selectedRequest.offers?.find((o: any) => o.status === 'accepted');
      
      setCompletionState(currentCompletion?.status || null);
      setProviderId(currentCompletion?.provider?.id || acceptedOffer?.provider?.id || null);
      setProviderName(currentCompletion?.provider?.user?.name || acceptedOffer?.provider?.user?.name || null);
      setProviderDeclaredAmount(Number(currentCompletion?.provider_declared_amount || 0));
    } else {
      setCompletionState(null);
      setProviderId(null);
      setProviderName(null);
      setProviderDeclaredAmount(0);
      setMutualPhones(null);
    }
  }, [selectedRequest]);

  // Sync selectedRequest with the latest data from requests when requests list updates
  useEffect(() => {
    if (selectedRequest) {
      const updated = requests.find((r) => r.id === selectedRequest.id);
      if (updated) {
        setSelectedRequest(updated);
      }
    }
  }, [requests]);

  // Synchronize isAddedToFavorites state
  useEffect(() => {
    let targetProviderId: string | null = null;
    
    if (selectedProviderProfile?.id) {
      targetProviderId = selectedProviderProfile.id;
    } else {
      const reqToUse = selectedRequest || justReviewedRequest;
      if (reqToUse) {
        targetProviderId = reqToUse.job_completions?.[0]?.provider?.id 
          || reqToUse.offers?.find((o: any) => o.status === 'accepted')?.provider?.id
          || providerId;
      } else {
        targetProviderId = providerId;
      }
    }
    
    if (targetProviderId) {
      const alreadyFav = favorites.some(fav => fav.provider_id === targetProviderId);
      setIsAddedToFavorites(alreadyFav);
    } else {
      setIsAddedToFavorites(false);
    }
  }, [selectedRequest, justReviewedRequest, favorites, providerId, selectedProviderProfile]);

  useEffect(() => {
    if (directRequestProvider?.categories && directRequestProvider.categories.length > 0) {
      setDirectCategorySlug(directRequestProvider.categories[0].slug);
    } else {
      setDirectCategorySlug("ev-temizligi");
    }
  }, [directRequestProvider]);

  async function fetchFavorites() {
    try {
      const res = await customFetch("/api/ortak/favoriler");
      if (res.ok) {
        const data = await res.json();
        setFavorites(data);
      }
    } catch (err) {
      console.error("Error fetching favorites:", err);
    }
  }

  const fetchLoyaltyRequests = async () => {
    try {
      const res = await customFetch("/api/ortak/favoriler/onay-bekleyenler");
      if (res.ok) {
        const data = await res.json();
        setLoyaltyRequests(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchUsta = async () => {
    if (!searchEsnaafId.trim()) return;
    setIsSearching(true);
    setSearchError("");
    setSearchResult(null);
    try {
      const res = await customFetch(`/api/ortak/favoriler/esnaaf-ara/${searchEsnaafId}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResult(data);
      } else {
        setSearchError("Eşleşen aktif hizmet veren bulunamadı.");
      }
    } catch (err) {
      setSearchError("Arama sırasında hata oluştu.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddUsta = async (providerEsnaafId: string) => {
    try {
      const res = await customFetch("/api/ortak/favoriler/esnaaf-ekle", {
        method: "POST",
        body: JSON.stringify({ esnaaf_id: providerEsnaafId }),
      });
      if (res.ok) {
        alert("Hizmet veren favori listenize eklendi!");
        setSearchEsnaafId("");
        setSearchResult(null);
        fetchFavorites();
      } else {
        const err = await res.json();
        alert(err.message || "Hizmet veren eklenemedi.");
      }
    } catch (err) {
      alert("Bir hata oluştu.");
    }
  };

  const handleApproveLoyalty = async (id: string) => {
    try {
      const res = await customFetch(`/api/ortak/favoriler/onayla/${id}`, { method: "POST" });
      if (res.ok) {
        alert("Sadık müşteri bağlantısı onaylandı.");
        fetchLoyaltyRequests();
        fetchFavorites();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectLoyalty = async (id: string) => {
    try {
      const res = await customFetch(`/api/ortak/favoriler/reddet/${id}`, { method: "POST" });
      if (res.ok) {
        alert("Bağlantı isteği reddedildi.");
        fetchLoyaltyRequests();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveFavorite = async (providerId: string) => {
    if (!confirm("Bu hizmet verenini favorilerinizden çıkarmak istediğinize emin misiniz?")) return;
    try {
      const res = await customFetch(`/api/ortak/favoriler/sil/${providerId}`, { method: "DELETE" });
      if (res.ok) {
        alert("Hizmet veren favorilerinizden çıkarıldı.");
        fetchFavorites();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateDirectRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directRequestProvider || !directDetails.trim() || !directDistrict.trim()) return;
    setIsSubmittingDirect(true);
    try {
      const res = await customFetch("/api/musteri/talepler", {
        method: "POST",
        body: JSON.stringify({
          categorySlug: directCategorySlug,
          district: directDistrict,
          details: directDetails,
          name: user?.name || "Müşteri",
          isDirect: true,
          directProviderId: directRequestProvider.providerId || directRequestProvider.provider?.id || directRequestProvider.id,
        }),
      });
      if (res.ok) {
        alert("Doğrudan iş talebiniz hizmet verenine iletildi!");
        setDirectRequestProvider(null);
        setDirectDetails("");
        setDirectDistrict("");
        fetchRequests();
        setActiveTab("tekliflerim");
      } else {
        const err = await res.json();
        alert(err.message || "Talep gönderilemedi.");
      }
    } catch (err) {
      alert("Hata oluştu.");
    } finally {
      setIsSubmittingDirect(false);
    }
  };

  // Fetch referral data on tab change
  useEffect(() => {
    if (activeTab === "cuzdan") {
      fetchReferralData();
    }
  }, [activeTab]);

  // Set selected request on initialJobId change
  useEffect(() => {
    if (initialJobId && requests.length > 0) {
      const match = requests.find((r) => r.id === initialJobId);
      if (match) {
        setSelectedRequest(match);
        setActiveTab("tekliflerim");
      }
    }
  }, [initialJobId, requests]);

  const fetchChatMessages = async (jobId: string, offerId: string) => {
    setLoadingChatMessages(true);
    try {
      const res = await customFetch(`/api/ortak/mesajlar/${jobId}/${offerId}`);
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat || !newMessageText.trim()) return;

    const text = newMessageText.trim();
    setNewMessageText("");

    try {
      const res = await customFetch("/api/ortak/mesajlar", {
        method: "POST",
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
        alert(err.error?.message || "Mesaj gönderilemedi.");
      }
    } catch (err) {
      console.error("Send message error:", err);
    }
  };

  // Connect to Socket.io globally on mount and listen to events
  useEffect(() => {
    const authUser = getAuthUser();
    if (!authUser) return;

    console.log("[Dashboard WS] Connecting global socket");
    const socket = io(`${process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3005"}/chat`, {
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(`[Dashboard WS] Connected globally: ${socket.id}`);
      // Join seeker's personal room for in-app notifications
      socket.emit("join_user", { userId: authUser.id });
      // Join rooms for whatever requests we currently have
      requestsRef.current.forEach(req => {
        socket.emit("join_job", { jobId: req.id });
      });
    });

    // Listen to real-time in-app notifications
    socket.on("new_notification", (notif: any) => {
      console.log("[Dashboard WS] New notification received:", notif);
      setNotifications((prev) => {
        if (prev.some(n => n.id === notif.id)) return prev;
        return [notif, ...prev];
      });
      setUnreadNotifCount((c) => c + 1);
    });

    // Listen to loyalty connection request
    socket.on("new_loyalty_request", (data: any) => {
      console.log("[Dashboard WS] New loyalty request:", data);
      showConfirm(
        "Sadık Müşteri Talebi",
        `${data.providerName} sizi sadık müşteri listesine eklemek istiyor. Onaylıyor musunuz?`,
        async () => {
          try {
            await customFetch(`/api/ortak/favoriler/onayla/${data.id}`, { method: "POST" });
            alert("Bağlantı başarıyla onaylandı!");
            fetchLoyaltyRequests();
            fetchFavorites();
          } catch (err) {
            console.error(err);
          }
        },
        async () => {
          try {
            await customFetch(`/api/ortak/favoriler/reddet/${data.id}`, { method: "POST" });
            fetchLoyaltyRequests();
          } catch (err) {
            console.error(err);
          }
        }
      );
    });

    // Listen to direct job offer
    socket.on("new_direct_job_offer", (data: any) => {
      console.log("[Dashboard WS] New direct job offer:", data);
      alert(`Favori hizmet vereniniz ${data.providerName} size özel bir iş kartı oluşturdu! Detayları Tekliflerim sayfasında inceleyebilirsiniz.`);
      fetchRequests();
    });

    // Real-time incoming offer
    socket.on("new_offer", (offer: any) => {
      console.log("[Dashboard WS] New offer received:", offer);
      const newOfferObj: Offer = {
        id: offer.offerId,
        price: offer.price,
        description: offer.description,
        status: "pending",
        created_at: offer.created_at || new Date().toISOString(),
        provider: {
          id: offer.provider.id,
          user: {
            name: offer.provider.name,
            phone_masked: offer.provider.phone_masked || "",
          }
        }
      };

      setRequests((prev) =>
        prev.map((req) => {
          if (req.id === offer.jobId) {
            // Avoid duplicate offers in state
            const exists = (req.offers || []).some(o => o.id === offer.offerId);
            if (exists) return req;
            
            const updatedOffers = [...(req.offers || []), newOfferObj];
            const updatedReq = { ...req, offers: updatedOffers };
            if (selectedRequestRef.current?.id === offer.jobId) {
              setSelectedRequest(updatedReq);
            }
            return updatedReq;
          }
          return req;
        })
      );
    });

    // Provider job completion declaration (Step 6)
    socket.on("job_completed_by_provider", (data: any) => {
      console.log("[Dashboard WS] Job completed by provider:", data);
      
      // Update the requests list so that the "İş Teyit & Puanlama" tab updates in real-time
      setRequests((prev) =>
        prev.map((req) => {
          if (req.id === data.jobId) {
            const newCompletion = {
              id: `comp-${Date.now()}`,
              status: "pending_seeker",
              provider_declared_amount: data.price,
              provider: {
                id: data.providerId,
                user: {
                  name: data.providerName
                }
              }
            };
            
            const currentCompletions = req.job_completions || [];
            const filteredCompletions = currentCompletions.filter(jc => jc.status !== "pending_seeker");
            const updatedReq = {
              ...req,
              job_completions: [...filteredCompletions, newCompletion]
            };
            
            if (selectedRequestRef.current?.id === data.jobId) {
              setSelectedRequest(updatedReq);
            }
            return updatedReq;
          }
          return req;
        })
      );

      if (selectedRequestRef.current?.id === data.jobId) {
        setProviderName(data.providerName);
        setProviderDeclaredAmount(data.price);
        if (data.providerId) {
          setProviderId(data.providerId);
        }
        setCompletionState("pending_seeker");
      }
    });

    // Finalized completion status (Step 6)
    socket.on("job_completion_finalized", (data: any) => {
      console.log("[Dashboard WS] Job completion finalized:", data);
      if (selectedRequestRef.current?.id === data.jobId) {
        setCompletionState(data.status);
      }
      setRequests((prev) =>
        prev.map((req) => {
          if (req.id === data.jobId) {
            const updatedReq = { ...req, status: (data.status === "completed" ? "completed" : req.status) as any };
            if (selectedRequestRef.current?.id === data.jobId) {
              setSelectedRequest(updatedReq);
            }
            return updatedReq;
          }
          return req;
        })
      );
    });

    // Real-time appointment update
    socket.on("appointment_updated", (data: any) => {
      console.log("[Dashboard WS] Appointment updated:", data);
      setRequests((prev) =>
        prev.map((req) => {
          if (req.id === data.jobId) {
            const updatedOffers = (req.offers || []).map((off) => {
              if (off.id === data.offerId) {
                return { ...off, appointment_at: data.appointment_at };
              }
              return off;
            });
            const updatedReq = { ...req, offers: updatedOffers };
            if (selectedRequestRef.current?.id === data.jobId) {
              setSelectedRequest(updatedReq);
            }
            return updatedReq;
          }
          return req;
        })
      );
    });

    // Real-time job started status update
    socket.on("job_started", (data: any) => {
      console.log("[Dashboard WS] Job started by provider:", data);
      setRequests((prev) =>
        prev.map((req) => {
          if (req.id === data.jobId) {
            const updatedOffers = (req.offers || []).map((off) => {
              if (off.id === data.offerId) {
                return { ...off, started_at: data.started_at };
              }
              return off;
            });
            const updatedReq = { ...req, offers: updatedOffers };
            if (selectedRequestRef.current?.id === data.jobId) {
              setSelectedRequest(updatedReq);
            }
            return updatedReq;
          }
          return req;
        })
      );
    });

    // Real-time job cancelled by provider status update
    socket.on("job_cancelled", (data: any) => {
      console.log("[Dashboard WS] Job cancelled by provider:", data);
      setRequests((prev) =>
        prev.map((req) => {
          if (req.id === data.jobId) {
            const updatedOffers = (req.offers || []).map((off) => {
              if (off.status === 'accepted' || off.provider?.user?.name === data.providerName) {
                return {
                  ...off,
                  status: 'cancelled' as const,
                  cancelled_by: data.cancelledBy,
                  cancel_reason_code: data.reasonCode,
                  cancel_reason_text: data.reasonText,
                  cancelled_at: new Date().toISOString(),
                };
              }
              return off;
            });
            const updatedReq: RequestItem = { ...req, status: 'cancelled' as const, offers: updatedOffers };
            if (selectedRequestRef.current?.id === data.jobId) {
              setSelectedRequest(updatedReq);
            }
            return updatedReq;
          }
          return req;
        })
      );
      alert(`Anlaşmış olduğunuz hizmet veren ${data.providerName} işi iptal etti.\nGerekçe: ${data.reasonText}`);
    });

    socket.on("new_message", (msg: any) => {
      console.log("[Dashboard WS] New message received:", msg);
      setChatMessages((prev) => {
        if (prev.some(m => m.id === msg.id)) return prev;
        const currentActiveChat = activeChatRef.current;
        if (currentActiveChat && msg.jobId === currentActiveChat.jobId && msg.offerId === currentActiveChat.offerId) {
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

    return () => {
      console.log("[Dashboard WS] Disconnecting global socket");
      socket.disconnect();
      socketRef.current = null;
    };
  }, []); // Connect once on mount

  // Join rooms whenever requests are updated (loaded from API)
  useEffect(() => {
    const socket = socketRef.current;
    if (socket && requests.length > 0) {
      console.log("[Dashboard WS] Emitting join_job for requests:", requests.map(r => r.id));
      requests.forEach(req => {
        socket.emit("join_job", { jobId: req.id });
      });
    }
  }, [requests]);

  useEffect(() => {
    if (!activeChat) return;
    fetchChatMessages(activeChat.jobId, activeChat.offerId);
  }, [activeChat?.jobId, activeChat?.offerId]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await customFetch("/api/musteri/talepler");
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error("Fetch requests failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await customFetch("/api/ortak/bildirimler/gecmis");
      if (res.ok) {
        const result = await res.json();
        const data = result.data || [];
        setNotifications(data);
        
        const lastReadTimeStr = localStorage.getItem("last_read_notif_time");
        if (lastReadTimeStr) {
          const lastReadTime = parseInt(lastReadTimeStr, 10);
          const unreadCount = data.filter((n: any) => new Date(n.sent_at).getTime() > lastReadTime).length;
          setUnreadNotifCount(unreadCount);
        } else {
          setUnreadNotifCount(data.length);
        }
      }
    } catch (err) {
      console.error("Fetch notifications failed:", err);
    }
  };

  const handleCancelRequest = async (id: string) => {
    showConfirm(
      "Talebi İptal Et",
      "Talebinizi iptal etmek istediğinize emin misiniz?\nBekleyen tüm teklifler de iptal edilecektir.",
      async () => {
        try {
          const res = await customFetch(`/api/musteri/talepler/${id}/iptal`, {
            method: "PUT",
          });
          if (res.ok) {
            alert("Talebiniz başarıyla iptal edildi.");
            fetchRequests();
            setSelectedRequest(null);
          } else {
            const err = await res.json();
            alert(err.error?.message || "İptal işlemi başarısız.");
          }
        } catch (err) {
          alert("Bir hata oluştu.");
        }
      }
    );
  };

  const handleRePublishRequest = async (id: string) => {
    showConfirm(
      "Talebi Tekrar Yayınla",
      "Bu talebi aynı bilgilerle tekrar yayına almak istiyor musunuz?\nEski teklifler arşivlenecek ve talebiniz yeni bir talep gibi yayına alınacaktır.",
      async () => {
        try {
          const res = await customFetch(`/api/musteri/talepler/${id}/tekrar-yayinla`, {
            method: "POST",
          });
          if (res.ok) {
            const result = await res.json();
            showConfirm("Başarılı", "Talebiniz tekrar yayına alındı. Eski teklifler arşivlendi ve önceki hizmet verenlere bildirim gönderildi.", () => {});
            fetchRequests();
            if (result.job) {
              setSelectedRequest(result.job);
            } else {
              setSelectedRequest(null);
            }
          } else {
            const err = await res.json();
            showConfirm("Hata", err.error?.message || "Tekrar yayınlama işlemi başarısız.", () => {});
          }
        } catch (err) {
          showConfirm("Hata", "Bir hata oluştu. Lütfen tekrar deneyin.", () => {});
        }
      }
    );
  };

  const handleAcceptOffer = async (offer: Offer) => {
    const alreadyAcceptedOffer = selectedRequest?.offers?.find(o => o.status === "accepted");

    const confirmTitle = "Teklifi Kabul Et";
    const confirmMessage = alreadyAcceptedOffer
      ? `Daha önce ${alreadyAcceptedOffer.provider.user.name} firmasının kabul ettiğiniz teklifi iptal edilecek olup, ${offer.provider.user.name} firmasının teklifini kabul etmiş olacaksınız. Onaylıyor musunuz?`
      : `${offer.provider.user.name} teklifini kabul etmek istediğinize emin misiniz?\n\nKarşılıklı telefon numaralarınız görüntülenecektir.`;

    showConfirm(
      confirmTitle,
      confirmMessage,
      async () => {
        try {
          const res = await customFetch(`/api/musteri/teklifler/${offer.id}/kabul`, {
            method: "POST",
            body: JSON.stringify({ consent: true }),
          });

          if (res.ok) {
            const data = await res.json();
            setMutualPhones({
              seekerPhone: data.seekerPhone,
              providerPhone: data.providerPhone,
            });

            // Set local provider details
            setProviderId(offer.provider.id);
            setProviderName(offer.provider.user.name);

            alert("Teklif başarıyla kabul edildi!");
            fetchRequests();
          } else {
            const err = await res.json();
            alert(err.error?.message || "Teklif kabul edilemedi.");
          }
        } catch (err) {
          alert("Bir hata oluştu.");
        }
      }
    );
  };

  const handleConfirmCompletion = async (isConfirmed: boolean, reqOverride?: any, amountOverride?: number) => {
    const activeReq = reqOverride || selectedRequest;
    if (!activeReq) return;
    try {
      const payload: any = { jobId: activeReq.id };
      
      if (isConfirmed) {
        payload.confirmed = true;
        payload.declaredAmount = amountOverride !== undefined ? amountOverride : providerDeclaredAmount;
      } else {
        payload.confirmed = false;
        const parsedAmount = isServiceNotReceived ? 0 : Number(seekerDisputeAmount);
        if (isNaN(parsedAmount) || parsedAmount < 0) {
          alert("Lütfen geçerli bir tutar girin.");
          return;
        }
        payload.declaredAmount = parsedAmount;
        payload.note = disputeNote;
      }

      const res = await customFetch(`/api/musteri/tamamlama/onayla`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const resData = await res.json();
        setShowDiscrepancyForm(false);
        setCompletionState(resData.data.status);
        alert(isConfirmed ? "Ücret başarıyla teyit edildi!" : "Uyuşmazlık kaydı oluşturuldu.");
        fetchRequests();
      } else {
        const errorData = await res.json();
        alert(errorData.error?.message || "İşlem başarısız.");
      }
    } catch (err) {
      alert("Bir hata oluştu.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitReview = async () => {
    if (selectedRating === 0 || !selectedRequest) return;
    setIsUploadingPhoto(true);

    try {
      let uploadedPhotoUrl = "";

      if (photoFile) {
        const filename = encodeURIComponent(photoFile.name);
        const contentType = encodeURIComponent(photoFile.type || "image/jpeg");
        const presignedRes = await customFetch(
          `/api/storage/presigned-url?filename=${filename}&contentType=${contentType}`
        );
        if (presignedRes.ok) {
          const { uploadUrl, downloadUrl } = await presignedRes.json();
          const uploadRes = await fetch(uploadUrl, {
            method: "PUT",
            body: photoFile,
            headers: { "Content-Type": photoFile.type || "image/jpeg" },
          });
          if (uploadRes.ok) {
            uploadedPhotoUrl = downloadUrl;
          }
        }
      }

      const reviewRes = await customFetch("/api/musteri/reviews", {
        method: "POST",
        body: JSON.stringify({
          job_id: selectedRequest.id,
          rating: selectedRating,
          comment: commentText || undefined,
          document_url: uploadedPhotoUrl || undefined,
        }),
      });

      if (reviewRes.ok) {
        setJustReviewedRequest(selectedRequest);
        setRatingSubmitted(true);
        setSelectedRating(0);
        setCommentText("");
        alert("Değerlendirmeniz başarıyla gönderildi! Yönetici onayından sonra hizmet verenin profilinde yayınlanacaktır.");
        fetchRequests();
      } else {
        const errorData = await reviewRes.json();
        alert(errorData.error?.message || "Gönderim başarısız.");
      }
    } catch (err) {
      alert("Puanlama sırasında hata oluştu.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleAddToFavorites = async (idOverride?: string) => {
    const idToUse = idOverride || providerId;
    if (!idToUse) return;
    try {
      const res = await customFetch("/api/ortak/favoriler/ekle", {
        method: "POST",
        body: JSON.stringify({ provider_id: idToUse }),
      });
      if (res.ok) {
        setIsAddedToFavorites(true);
        fetchFavorites();
      } else {
        const err = await res.json();
        alert(err.error?.message || "Favorilere eklenemedi.");
      }
    } catch (err) {
      alert("Bir hata oluştu.");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg("");
    try {
      const res = await customFetch("/api/ortak/auth/profile/update", {
        method: "PUT",
        body: JSON.stringify({ name: profileName, email: profileEmail }),
      });
      if (res.ok) {
        setProfileSuccessMsg("Profiliniz başarıyla güncellendi.");
        // Sync local storage
        const updatedUser = { ...user, name: profileName, email: profileEmail };
        localStorage.setItem("esnaaf_user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      } else {
        const err = await res.json();
        alert(err.error?.message || "Profil güncellenemedi.");
      }
    } catch (err) {
      alert("Güncelleme başarısız.");
    }
  };

  const handleLogoutClick = () => {
    logout();
    onLogout();
  };

  // Filter requests
  const activeRequests = requests.filter((r) => r.status === "pending" || r.status === "distributed");
  const pastRequests = requests.filter((r) => r.status === "completed" || r.status === "cancelled");

  const acceptedOffers = selectedRequest?.offers?.filter(o => o.status === "accepted") || [];
  const cancelledProviderOffer = selectedRequest?.offers?.find(o => o.status === "cancelled" && o.cancelled_by === "service_provider");
  const hasCancelledByProvider = !!cancelledProviderOffer && acceptedOffers.length === 0;
  const showCommunicationCard = (acceptedOffers.length > 0 || !!mutualPhones) && !hasCancelledByProvider;

  // Helper to render outline SVGs for past table or list categories
  const renderCategoryIcon = (type: string) => {
    const baseClass = "w-4 h-4 text-slate-700";
    if (type === "tools") {
      return (
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
          <Hammer className={baseClass} />
        </div>
      );
    }
    if (type === "truck") {
      return (
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
          <Truck className={baseClass} />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
        <CheckCircle2 className={baseClass} />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col antialiased font-sans select-none overflow-x-hidden">
      {isImpersonated && (
        <div className="bg-gradient-to-r from-red-800 to-rose-600 text-white text-xs font-bold py-2.5 px-6 flex justify-between items-center z-[9999] animate-fade-in shadow-md border-b border-red-900 w-full shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping"></span>
            <span>Şu anda <strong>{user?.name || "Müşteri"}</strong> panelini ön izliyorsunuz (Taklit Modu).</span>
          </div>
          <button 
            onClick={handleExitImpersonation}
            className="bg-white/10 hover:bg-white/20 text-white font-extrabold px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wider transition-all active:scale-95 cursor-pointer border border-white/20"
          >
            Ön İzlemeyi Kapat
          </button>
        </div>
      )}
      <div className="flex-1 flex flex-col md:flex-row w-full">
      
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)} 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
        />
      )}

      {/* 🧭 SIDEBAR Navigation - Redesigned to match the exact mockup screenshot */}
      <aside className={`h-screen w-64 fixed left-0 top-0 bg-white border-r border-slate-100/80 flex flex-col py-6 px-4 z-50 transition-transform duration-300 md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:flex shrink-0`}>
        
        {/* Unified brand Logo with subtitle exactly matching mockup style */}
        <div className="mb-8 px-2 flex flex-col items-start gap-1 justify-between relative h-16 w-full">
          <div className="flex items-center w-48 h-10 relative">
            <a className="absolute left-[-20px] top-1/2 -translate-y-1/2 flex items-center" href="#" onClick={() => { setActiveTab("tekliflerim"); setSelectedRequest(null); }}>
              <img 
                alt="Esnaaf Logo" 
                className="w-auto select-none max-w-none" 
                style={{ height: '120px', objectFit: 'contain' }}
                src="/logo.png" 
              />
            </a>
          </div>
          <span className="text-[10px] font-bold text-slate-400 mt-2 block tracking-wide uppercase pl-1">
            Premium Marketplace
          </span>
          <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-slate-800 p-1 absolute right-0 top-1/2 -translate-y-1/2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav items */}
        <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto scrollbar-none pr-0.5">
          <button
            onClick={() => { setActiveTab("tekliflerim"); setSelectedRequest(null); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-black text-xs cursor-pointer transition-all duration-150 ${
              activeTab === "tekliflerim"
                ? "bg-[#c8f252] text-slate-900 shadow-sm"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-bold"
            }`}
          >
            <FileText className="w-4.5 h-4.5 shrink-0 stroke-[2.2]" />
            <span>Tekliflerim</span>
            {activeRequests.length > 0 && (
              <span className={`ml-auto w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-black ${
                activeTab === "tekliflerim" ? "bg-white text-slate-950" : "bg-[#c8f252] text-slate-950"
              }`}>
                {activeRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab("canlobi"); setSelectedRequest(null); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-xs cursor-pointer transition-all ${
              activeTab === "canlobi"
                ? "bg-[#c8f252] text-slate-900 shadow-sm font-black"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <Play className="w-4.5 h-4.5 shrink-0 stroke-[2.2]" />
            <span>Canlı Lobi</span>
          </button>

          <button
            onClick={() => { setActiveTab("karsilastirma"); setSelectedRequest(null); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-xs cursor-pointer transition-all ${
              activeTab === "karsilastirma"
                ? "bg-[#c8f252] text-slate-900 shadow-sm font-black"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <BarChart2 className="w-4.5 h-4.5 shrink-0 stroke-[2.2]" />
            <span>Teklif Karşılaştırma</span>
          </button>

          <button
            onClick={() => { setActiveTab("mesajlar"); setSelectedRequest(null); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-xs cursor-pointer transition-all ${
              activeTab === "mesajlar"
                ? "bg-[#c8f252] text-slate-900 shadow-sm font-black"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <MessageSquare className="w-4.5 h-4.5 shrink-0 stroke-[2.2]" />
            <span>Mesajlaşma</span>
          </button>

          <button
            onClick={() => { setActiveTab("puanlama"); setSelectedRequest(null); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-xs cursor-pointer transition-all ${
              activeTab === "puanlama"
                ? "bg-[#c8f252] text-slate-900 shadow-sm font-black"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <Star className="w-4.5 h-4.5 shrink-0 stroke-[2.2]" />
            <span>İş Teyit & Puanlama</span>
          </button>

          <button
            onClick={() => { setActiveTab("cuzdan"); setSelectedRequest(null); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-xs cursor-pointer transition-all ${
              activeTab === "cuzdan"
                ? "bg-[#c8f252] text-slate-900 shadow-sm font-black"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <Wallet className="w-4.5 h-4.5 shrink-0 stroke-[2.2]" />
            <span>Cüzdan & Referans</span>
          </button>

          <button
            onClick={() => { setActiveTab("favoriler"); setSelectedRequest(null); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-xs cursor-pointer transition-all ${
              activeTab === "favoriler"
                ? "bg-[#c8f252] text-slate-900 shadow-sm font-black"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <Star className="w-4.5 h-4.5 shrink-0 stroke-[2.2]" />
            <span>Favori Hizmet Verenlerim</span>
          </button>

          <button
            onClick={() => { setActiveTab("profile"); setSelectedRequest(null); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-xs cursor-pointer transition-all ${
              activeTab === "profile"
                ? "bg-[#c8f252] text-slate-900 shadow-sm font-black"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <Settings className="w-4.5 h-4.5 shrink-0 stroke-[2.2]" />
            <span>Profil ve Ayarlar</span>
          </button>
        </div>

        {/* Sidebar bottom action button */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col gap-3">
          <button
            onClick={() => { onStartChat?.(); setMobileMenuOpen(false); }}
            className="w-full bg-[#c8f252] hover:bg-[#b5e639] text-slate-950 font-black text-xs py-3.5 rounded-2xl cursor-pointer shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 border border-transparent"
          >
            <PlusCircle className="w-4.5 h-4.5 shrink-0 stroke-[2.2]" />
            <span>Yeni Talep Oluştur</span>
          </button>
          
          <button 
            onClick={handleLogoutClick}
            className="flex items-center justify-center gap-2 text-red-500 font-bold text-[10px] hover:text-red-600 transition-colors w-full py-1 text-center cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>Oturumu Kapat</span>
          </button>
        </div>
      </aside>

      {/* 💻 Main Content Area */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen relative overflow-hidden">
        
        {/* Decorative background glow */}
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#c8f252]/5 blur-[120px] pointer-events-none z-0"></div>

        {/* 🚀 Top App Header */}
        <header className="bg-white/85 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100/60 h-16 flex justify-between items-center w-full px-6 md:px-8 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <h2 className="font-extrabold text-xs text-slate-800 tracking-tight flex items-center gap-2">
              <span>Hizmet Alan Paneli</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#88b000]"></span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {activeTab === "tekliflerim" ? "Teklif Kontrol Paneli" : activeTab === "canlobi" ? "Canlı Lobi" : activeTab === "karsilastirma" ? "Karşılaştırma" : activeTab === "mesajlar" ? "Mesajlar" : activeTab === "puanlama" ? "İş Teyit" : activeTab === "cuzdan" ? "Cüzdan & Referans" : "Hesap"}
              </span>
            </h2>
          </div>


          <div className="flex items-center gap-4">

            <div className="relative" ref={notifDropdownRef}>
              <button 
                onClick={() => {
                  setNotifDropdownOpen(!notifDropdownOpen);
                  if (!notifDropdownOpen) {
                    setUnreadNotifCount(0);
                    localStorage.setItem("last_read_notif_time", Date.now().toString());
                  }
                }}
                className="text-slate-400 hover:text-slate-850 transition-colors p-2 hover:bg-slate-50 rounded-xl relative cursor-pointer group"
              >
                <Bell className="w-4.5 h-4.5 text-slate-500 animate-wiggle" />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                )}
              </button>

              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl z-[100] p-4 animate-scale-up text-left max-h-[400px] overflow-y-auto">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                    <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest font-mono">Bildirimler</span>
                    {unreadNotifCount > 0 && (
                      <span className="bg-rose-50 text-rose-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                        {unreadNotifCount} Yeni
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 divide-y divide-slate-50 font-sans">
                    {notifications.length === 0 ? (
                      <p className="text-slate-450 text-[11px] font-medium text-center py-6">
                        Henüz bir bildiriminiz bulunmuyor.
                      </p>
                    ) : (
                      notifications.map((notif) => {
                        const title = notif.payload?.title || notif.payload?.payload?.title || 'Bildirim';
                        const body = notif.payload?.body || notif.payload?.payload?.body || '';
                        const isJobCompletionNotif = notif.event_code === 'HA-IS-BEYAN';
                        return (
                          <div
                            key={notif.id}
                            onClick={() => {
                              if (isJobCompletionNotif) {
                                setActiveTab("puanlama");
                                setNotifDropdownOpen(false);
                              }
                            }}
                            className={`pt-2.5 first:pt-0 space-y-0.5 text-left ${isJobCompletionNotif ? 'cursor-pointer hover:bg-slate-50/60 p-1.5 rounded-lg transition-colors border-l-2 border-[#88b000] pl-2' : ''}`}
                          >
                            <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                              {isJobCompletionNotif && <span className="w-1.5 h-1.5 rounded-full bg-[#88b000] inline-block animate-pulse"></span>}
                              {title}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-medium leading-normal leading-relaxed">{body}</p>
                            {isJobCompletionNotif && (
                              <span className="text-[10px] text-[#4c630a] font-extrabold hover:underline block mt-1">
                                Teyit Paneline Git ➡️
                              </span>
                            )}
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
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-[1px] bg-slate-200"></div>

            <div className="flex items-center gap-2.5 text-left cursor-pointer" onClick={() => setActiveTab("profile")}>
              <span className="text-xs font-black text-slate-850 leading-none hidden sm:inline">{user?.name || "Misafir Kullanıcı"}</span>
              <img
                src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"}
                alt="Profil Fotoğrafı"
                className="w-8 h-8 object-cover rounded-full border border-slate-200 shadow-sm"
              />
            </div>
          </div>
        </header>

        {/* 🎨 Canvas Dashboard Body */}
        <div className="p-6 md:p-8 max-w-7xl w-full mx-auto flex-grow z-10 flex flex-col gap-6 text-left">
          
          {loading ? (
            <div className="w-full flex items-center justify-center py-32">
              <div className="w-10 h-10 rounded-full border-4 border-slate-150 border-t-[#c8f252] animate-spin"></div>
            </div>
          ) : (
            <>
              {/* VIEW 1: TEKLİFLERİM TAB */}
              {activeTab === "tekliflerim" && !selectedRequest && (
                <div className="space-y-8 animate-scale-up">
                  
                  {/* Header Title strictly matching mockup */}
                  <header>
                    <h2 className="font-extrabold text-slate-900 tracking-tight text-2xl md:text-3xl leading-snug">
                      Teklif Kontrol Paneli
                    </h2>
                    <p className="text-slate-400 text-xs mt-1 font-semibold leading-relaxed">
                      Aktif süreçlerinizi ve yeni gelen teklifleri buradan yönetebilirsiniz.
                    </p>
                  </header>

                  {/* 📊 AKTİF TEKLİFLER SECTION */}
                  <section className="space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-3 text-left">
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-1.5 h-8 bg-[#c8f252] rounded-full shrink-0"></div>
                        <div className="space-y-0.5 text-left">
                          <h3 className="font-black text-slate-900 tracking-tight text-xl md:text-2xl uppercase">
                            Aktif Teklifler
                          </h3>
                          <p className="text-[10px] text-slate-400 font-extrabold tracking-wider">
                            TALEP VE SÜREÇ YÖNETİMİ
                          </p>
                        </div>
                      </div>
                      <span className="self-start sm:self-auto text-[10px] bg-[#c8f252]/20 text-[#4c630a] border border-[#c8f252]/30 font-black px-3 py-1 rounded-full uppercase tracking-wider font-mono shadow-sm">
                        CANLI SÜREÇLER
                      </span>
                    </div>

                    {/* ACTIVE OFFERS STREAM */}
                    <div className="space-y-4">
                      {/* Render real requests first if database has active entries */}
                      {requests.length > 0 && requests.some(r => r.status === "pending" || r.status === "distributed") ? (
                        requests.filter(r => r.status === "pending" || r.status === "distributed").map((req) => {
                          const slug = req.category?.slug || "";
                          const createdDate = new Date(req.created_at).toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric"
                          });

                          const offerCount = req.offers?.length || 0;

                          return (
                            <div key={req.id} className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-scale-up">
                              <div className="flex items-start gap-4 text-left">
                                {/* Category Icon Circle */}
                                <div className="w-12 h-12 rounded-xl bg-[#c8f252]/10 border border-[#c8f252]/20 flex items-center justify-center shrink-0 overflow-hidden">
                                  <img 
                                    src="/logo-icon.png" 
                                    alt="Esnaaf Logo Icon" 
                                    className="w-11 h-11 object-contain" 
                                  />
                                </div>
                                
                                <div className="space-y-1 text-left">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 
                                      className="font-black text-slate-900 text-lg hover:underline cursor-pointer tracking-tight"
                                      onClick={() => setSelectedRequest(req)}
                                    >
                                      {req.category?.name || "Hizmet Talebi"}
                                    </h3>
                                    
                                    <span className="bg-slate-100 text-slate-500 font-extrabold text-[10px] px-2.5 py-1 rounded-lg border border-slate-200/50">
                                      {`#TR-${req.id.substring(0, 5).toUpperCase()}`}
                                    </span>

                                    {req.is_direct && (
                                      <span className="bg-violet-50 text-violet-750 text-[10px] font-black tracking-wide uppercase px-2.5 py-1 rounded-lg border border-violet-100">
                                        {req.created_by_provider ? "Hizmet Verenden Doğrudan İş Kartı" : "Hizmet Verene Özel Talep"}
                                      </span>
                                    )}

                                    {offerCount >= 4 ? (
                                      <span className="bg-rose-50 text-rose-700 text-[10px] font-black tracking-wide uppercase px-2.5 py-1 rounded-lg border border-rose-100">
                                        Teklife Kapatıldı (4 Teklif Sınırı)
                                      </span>
                                    ) : getRequestExpiryInfo(req.created_at).isExpired && offerCount === 0 ? (
                                      <span className="bg-rose-50 text-rose-700 text-[10px] font-black tracking-wide uppercase px-2.5 py-1 rounded-lg border border-rose-100">
                                        Teklife Kapatıldı (Süre Dolanlar)
                                      </span>
                                    ) : (
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {!req.is_direct && !req.offers?.some((o: any) => o.status === "accepted") && !getRequestExpiryInfo(req.created_at).isExpired && (
                                          <span className="bg-rose-50 text-rose-700 text-[10px] font-black tracking-wide uppercase px-2.5 py-1 rounded-lg border border-rose-100 flex items-center gap-1">
                                            <CountdownTimer createdAt={req.created_at} /> TEKLİFE KAPANACAK
                                          </span>
                                        )}
                                        {offerCount > 0 ? (
                                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black tracking-wide uppercase px-2.5 py-1 rounded-lg border border-emerald-100">
                                            {offerCount} Teklif Alındı
                                          </span>
                                        ) : (
                                          <span className="bg-[#c8f252]/15 text-[#4c630a] text-[10px] font-black tracking-wide uppercase px-2.5 py-1 rounded-lg border border-[#c8f252]/20">
                                            TEKLİF BEKLENİYOR
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Quick Metadata Tags */}
                                  <div className="flex flex-wrap items-center gap-2 pt-2 text-left">
                                    {/* Konum Chip */}
                                    <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 rounded-lg px-2.5 py-1 text-slate-650 text-[11px] font-bold transition-colors hover:bg-slate-100/50">
                                      <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                      <span>{req.form_data.district || "Bilinmiyor"}{req.form_data.district ? `, ${req.form_data.city || resolveCityFromDistrict(req.form_data.district)}` : ''}</span>
                                    </span>

                                    {/* Tarih Chip */}
                                    <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 rounded-lg px-2.5 py-1 text-slate-650 text-[11px] font-bold transition-colors hover:bg-slate-100/50">
                                      <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                      <span>{req.form_data.tarih || createdDate}</span>
                                    </span>

                                    {/* Bütçe Chip */}
                                    {req.form_data.butce && (
                                      <span className="inline-flex items-center gap-1.5 bg-emerald-50/40 border border-emerald-100 rounded-lg px-2.5 py-1 text-emerald-800 text-[11px] font-black transition-colors hover:bg-emerald-50/80">
                                        <Coins className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        <span>₺{Number(req.form_data.butce).toLocaleString("tr-TR")}</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              {req.is_direct && req.created_by_provider && req.offers?.[0] ? (
                                <div className="flex items-center gap-2 self-end md:self-center">
                                  <span className="font-extrabold text-xs text-slate-800 bg-[#c8f252]/10 border border-[#c8f252]/30 px-3 py-2 rounded-xl mr-2">
                                    Teklif Fiyatı: ₺{Number(req.offers[0].price).toLocaleString("tr-TR")}
                                  </span>
                                  <button 
                                    onClick={() => handleAcceptOffer(req.offers[0])}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black py-2.5 px-5 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm border border-transparent"
                                  >
                                    Kabul Et
                                  </button>
                                  <button 
                                    onClick={() => handleCancelRequest(req.id)}
                                    className="bg-white hover:bg-red-50 text-red-500 hover:text-red-700 border border-slate-200 hover:border-red-100 text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm"
                                  >
                                    Reddet
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 self-end md:self-center">
                                  {getRequestExpiryInfo(req.created_at, Date.now(), req.offers).isExpired ? (
                                    <>
                                      {offerCount > 0 && (
                                        <button 
                                          onClick={() => setSelectedRequest(req)}
                                          className="bg-[#c8f252] hover:bg-[#b5e639] text-slate-950 text-xs font-black py-2.5 px-5 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm border border-transparent flex items-center gap-1"
                                        >
                                          Teklifleri Gör ({offerCount})
                                        </button>
                                      )}
                                      <button 
                                        onClick={() => handleRePublishRequest(req.id)}
                                        className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm flex items-center gap-1.5"
                                      >
                                        <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                                        Tekrar Yayınla
                                      </button>
                                      <button 
                                        onClick={() => handleCancelRequest(req.id)}
                                        className="bg-white hover:bg-red-50 text-red-500 hover:text-red-700 border border-slate-200 hover:border-red-100 text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm"
                                      >
                                        İptal Et
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button 
                                        onClick={() => setSelectedRequest(req)}
                                        className="bg-[#c8f252] hover:bg-[#b5e639] text-slate-950 text-xs font-black py-2.5 px-5 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm border border-transparent flex items-center gap-1"
                                      >
                                        {offerCount > 0 ? `Teklifleri Gör (${offerCount})` : 'Detayları İncele'}
                                      </button>
                                      <button 
                                        onClick={() => handleCancelRequest(req.id)}
                                        className="bg-white hover:bg-red-50 text-red-500 hover:text-red-700 border border-slate-200 hover:border-red-100 text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm"
                                      >
                                        İptal Et
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : null}

                      {/* Mockup Active Offers from design mockup (Always rendered to show gorgeous aesthetics) */}
                      {MOCKUP_ACTIVE_OFFERS.map((group) => {
                        const offerCount = group.offers?.length || 0;

                        return (
                          <div key={group.id} className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-scale-up">
                            <div className="flex items-start gap-4 text-left">
                              {/* Category Icon Circle */}
                              <div className="w-12 h-12 rounded-xl bg-[#c8f252]/10 border border-[#c8f252]/20 flex items-center justify-center shrink-0 overflow-hidden">
                                <img 
                                  src="/logo-icon.png" 
                                  alt="Esnaaf Logo Icon" 
                                  className="w-11 h-11 object-contain opacity-75" 
                                />
                              </div>
                              
                              <div className="space-y-1 text-left">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 
                                    className="font-black text-slate-900 text-lg hover:underline cursor-pointer tracking-tight"
                                    onClick={() => alert("Bu mockup talebidir. Gerçek teklif akışlarını test etmek için anasayfadan canlı bir talep oluşturabilirsiniz!")}
                                  >
                                    {group.title}
                                  </h3>
                                  
                                  <span className="bg-slate-100 text-slate-500 font-extrabold text-[10px] px-2.5 py-1 rounded-lg border border-slate-200/50">
                                    {group.code}
                                  </span>

                                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black tracking-wide uppercase px-2.5 py-1 rounded-lg border border-emerald-100">
                                    {offerCount} Teklif Alındı (Örnek)
                                  </span>
                                </div>

                                {/* Quick Metadata Tags */}
                                <div className="flex flex-wrap items-center gap-2 pt-2 text-left">
                                  {/* Konum Chip */}
                                  <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 rounded-lg px-2.5 py-1 text-slate-650 text-[11px] font-bold transition-colors hover:bg-slate-100/50">
                                    <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                    <span>Adana, Seyhan</span>
                                  </span>

                                  {/* Tarih Chip */}
                                  <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 rounded-lg px-2.5 py-1 text-slate-650 text-[11px] font-bold transition-colors hover:bg-slate-100/50">
                                    <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                    <span>15 Haziran 2026</span>
                                  </span>

                                  {/* Bütçe Chip */}
                                  <span className="inline-flex items-center gap-1.5 bg-emerald-50/40 border border-emerald-100 rounded-lg px-2.5 py-1 text-emerald-800 text-[11px] font-black transition-colors hover:bg-emerald-50/80">
                                    <Coins className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span>₺15.000</span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 self-end md:self-center">
                              <button 
                                onClick={() => alert("Bu mockup talebidir. Gerçek teklif inceleme aksiyonlarını test etmek için lütfen anasayfadan yeni bir talep oluşturun!")}
                                className="bg-[#c8f252] hover:bg-[#b5e639] text-slate-950 text-xs font-black py-2.5 px-5 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm border border-transparent"
                              >
                                Teklifleri Gör ({offerCount})
                              </button>
                              <button 
                                onClick={() => alert("Mockup talebi iptal edilemez.")}
                                className="bg-white hover:bg-red-50 text-red-500 hover:text-red-700 border border-slate-200 hover:border-red-100 text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm"
                              >
                                İptal Et
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* 📊 SON TALEPLERİM TABLE SECTION */}
                  <section className="space-y-4 pt-4">
                    <h3 className="font-black text-slate-800 text-base pl-1">Son Taleplerim</h3>

                    <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)] overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs font-semibold text-slate-700">
                          <thead>
                            <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 text-[10px] font-bold tracking-wider uppercase text-left">
                              <th className="py-4 px-6">Hizmet Tanımı</th>
                              <th className="py-4 px-6">Tarih</th>
                              <th className="py-4 px-6">Teklif Sayısı</th>
                              <th className="py-4 px-6">Durum</th>
                              <th className="py-4 px-6 text-center">İşlem</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-left">
                            
                            {/* Real requests rows */}
                            {requests.map((req) => (
                              <tr key={req.id} className="hover:bg-slate-50/40 transition-colors">
                                <td className="py-4.5 px-6 font-extrabold text-slate-800">
                                  <div className="flex items-center gap-3">
                                    {renderCategoryIcon(req.category?.slug)}
                                    <div className="flex flex-col">
                                      <span className="hover:underline cursor-pointer" onClick={() => setSelectedRequest(req)}>
                                        {req.category?.name || "Hizmet"}
                                      </span>
                                      <span className="text-[9px] font-bold text-slate-400 mt-0.5">{`#TR-${req.id.substring(0, 5).toUpperCase()}`}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4.5 px-6 font-bold text-slate-500">
                                  {new Date(req.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                                </td>
                                <td className="py-4.5 px-6 font-extrabold text-slate-850">
                                  {req.offers?.length > 0 ? (
                                    <div className="flex items-center gap-2">
                                      <div className="flex -space-x-1.5 overflow-hidden">
                                        {req.offers.slice(0, 3).map((off, oIdx) => (
                                          <div key={off.id} className="w-5 h-5 rounded-full bg-[#c8f252] text-slate-950 border border-white flex items-center justify-center font-bold text-[8px] select-none">
                                            {oIdx === 0 ? "🧑‍🔧" : oIdx === 1 ? "👷" : "⚙️"}
                                          </div>
                                        ))}
                                      </div>
                                      <span className="text-[10px] text-slate-700">{`${req.offers.length} Teklif`}</span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 font-medium">0 Teklif</span>
                                  )}
                                </td>
                                <td className="py-4.5 px-6">
                                  {req.status === "pending" || req.status === "distributed" ? (
                                    <div className="flex items-center gap-2">
                                      <span className="bg-[#c8f252]/20 text-[#4c630a] px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider">
                                        {`${req.offers?.length || 0} TEKLİF`}
                                      </span>
                                      <button 
                                        onClick={() => setSelectedRequest(req)}
                                        className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#88b000] text-[#4c630a] font-extrabold text-[9px] px-2.5 py-1 rounded-md transition-all active:scale-95 shadow-sm"
                                      >
                                        Gelen Teklifleri İncele
                                      </button>
                                    </div>
                                  ) : req.status === "completed" ? (
                                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-100/50 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider font-mono">
                                      TAMAMLANDI
                                    </span>
                                  ) : req.status === "cancelled" ? (
                                    <span className="bg-red-50 text-red-800 border border-red-100/50 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider font-mono">
                                      İPTAL EDİLDİ
                                    </span>
                                  ) : (
                                    <span className="bg-slate-100 text-slate-650 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider font-mono">
                                      BEKLEMEDE
                                    </span>
                                  )}
                                </td>
                                <td className="py-4.5 px-6 text-center">
                                  <button onClick={() => setSelectedRequest(req)} className="text-slate-400 hover:text-slate-700 p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
                                    <MoreVertical className="w-4 h-4 mx-auto" />
                                  </button>
                                </td>
                              </tr>
                            ))}

                            {/* Fallback Mockup rows exactly matching mockup layout */}
                            {MOCK_PAST_REQUESTS_MOCKUP.map((row) => (
                              <tr key={row.id} className="hover:bg-slate-50/40 transition-colors">
                                <td className="py-4.5 px-6 font-extrabold text-slate-800">
                                  <div className="flex items-center gap-3">
                                    {renderCategoryIcon(row.icon)}
                                    <div className="flex flex-col">
                                      <span>{row.title}</span>
                                      <span className="text-[9px] font-bold text-slate-400 mt-0.5">{row.code}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4.5 px-6 font-bold text-slate-500">
                                  {row.date}
                                </td>
                                <td className="py-4.5 px-6 font-extrabold text-slate-850">
                                  <div className="flex items-center gap-2">
                                    <div className="flex -space-x-1.5 overflow-hidden">
                                      <div className="w-5 h-5 rounded-full bg-slate-900 border border-white text-white flex items-center justify-center font-bold text-[8px]">🧑‍🔧</div>
                                      <div className="w-5 h-5 rounded-full bg-[#c8f252] border border-white text-slate-950 flex items-center justify-center font-bold text-[8px]">👷</div>
                                      <div className="w-5 h-5 rounded-full bg-slate-500 border border-white text-white flex items-center justify-center font-bold text-[8px]">+2</div>
                                    </div>
                                    <span className="text-[10px] text-slate-700">{row.offersCount}</span>
                                  </div>
                                </td>
                                <td className="py-4.5 px-6">
                                  {row.status === "6 TEKLİF" ? (
                                    <div className="flex items-center gap-2">
                                      <span className="bg-[#c8f252]/20 text-[#4c630a] px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider">
                                        {row.status}
                                      </span>
                                      <button 
                                        onClick={() => alert("Bu mockup verisidir. Gerçek teklif akışlarını görmek için lütfen anasayfadan yeni bir canlı talep oluşturun!")}
                                        className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#88b000] text-[#4c630a] font-extrabold text-[9px] px-2.5 py-1 rounded-md transition-all active:scale-95 shadow-sm"
                                      >
                                        {row.actionText}
                                      </button>
                                    </div>
                                  ) : row.status === "TAMAMLANDI" ? (
                                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-100/50 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider font-mono">
                                      {row.status}
                                    </span>
                                  ) : (
                                    <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider font-mono">
                                      {row.status}
                                    </span>
                                  )}
                                </td>
                                <td className="py-4.5 px-6 text-center">
                                  <button onClick={() => alert("İşlem detay menüsü")} className="text-slate-400 hover:text-slate-700 p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
                                    <MoreVertical className="w-4 h-4 mx-auto" />
                                  </button>
                                </td>
                              </tr>
                            ))}

                          </tbody>
                        </table>
                      </div>

                      {/* Footer table links */}
                      <div className="bg-slate-50/50 py-3.5 border-t border-slate-100 text-center">
                        <a href="#" onClick={() => alert("Tüm geçmiş talepleriniz listelenmiştir.")} className="text-slate-400 hover:text-slate-800 text-xs font-bold transition-colors">
                          Geçmiş Talepleri Görüntüle
                        </a>
                      </div>
                    </div>
                  </section>

                </div>
              )}

              {/* ACTIVE REQUEST DETAIL PANEL */}
              {activeTab === "tekliflerim" && selectedRequest && (
                <div className="space-y-6 animate-scale-up text-left">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedRequest(null)}
                      className="text-slate-400 hover:text-slate-900 p-2 hover:bg-slate-100 rounded-full cursor-pointer transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                      </svg>
                    </button>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                        <span>Talep Detayı</span>
                        <span className="text-xs font-bold text-slate-400">#{selectedRequest.id.substring(0, 8)}</span>
                      </h3>
                      <p className="text-xs text-slate-400 font-bold uppercase mt-0.5">{selectedRequest.category?.name}</p>
                    </div>
                    
                    {selectedRequest.status === "cancelled" ? (
                      <button
                        disabled
                        className="ml-auto bg-slate-100 text-slate-400 border border-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl cursor-not-allowed shadow-sm"
                      >
                        İptal Edildi
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCancelRequest(selectedRequest.id)}
                        className="ml-auto bg-white hover:bg-red-50 text-red-500 hover:text-red-700 border border-slate-200 hover:border-red-200 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm"
                      >
                        İptal Et
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left: Request details summary */}
                    <div className="lg:col-span-4 bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm space-y-5">
                      <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-1.5">
                        📋 Form Bilgileri
                      </h4>
                      
                      <div className="space-y-3.5 text-xs text-slate-700 font-semibold">
                        <div>
                          <span className="block text-[10px] text-slate-400 font-bold uppercase">Ad Soyad</span>
                          <span className="text-slate-800 font-extrabold mt-0.5 block">{selectedRequest.form_data.name || "Misafir Kullanıcı"}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400 font-bold uppercase">Konum</span>
                          <span className="text-slate-800 font-extrabold mt-0.5 block">{selectedRequest.form_data.district || "Bilinmiyor"}{selectedRequest.form_data.district ? `, ${selectedRequest.form_data.city || resolveCityFromDistrict(selectedRequest.form_data.district)}` : ''}</span>
                        </div>
                        {selectedRequest.form_data.tarih && (
                          <div>
                            <span className="block text-[10px] text-slate-400 font-bold uppercase">Hizmet Tarihi</span>
                            <span className="text-slate-800 font-extrabold mt-0.5 block">{selectedRequest.form_data.tarih}</span>
                          </div>
                        )}
                        {selectedRequest.form_data.daireTipi && (
                          <div>
                            <span className="block text-[10px] text-slate-400 font-bold uppercase">Daire Tipi</span>
                            <span className="text-slate-800 font-extrabold mt-0.5 block">{selectedRequest.form_data.daireTipi}</span>
                          </div>
                        )}
                        {selectedRequest.form_data.metrekare && (
                          <div>
                            <span className="block text-[10px] text-slate-400 font-bold uppercase">Metrekare</span>
                            <span className="text-slate-800 font-extrabold mt-0.5 block">{selectedRequest.form_data.metrekare} m²</span>
                          </div>
                        )}
                        <div>
                          <span className="block text-[10px] text-slate-400 font-bold uppercase">Detaylar / Açıklama</span>
                          <span className="text-slate-650 font-medium mt-1.5 block bg-slate-50 p-3 rounded-xl border border-slate-200/50 leading-relaxed font-semibold italic">
                            &ldquo;{selectedRequest.form_data.details || "Açıklama girilmedi"}&rdquo;
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Live Offers List & WS status */}
                    <div className="lg:col-span-8 space-y-6">
                      
                      {/* İş İptal Edildi Uyarısı */}
                      {hasCancelledByProvider && cancelledProviderOffer && (
                        <div className="w-full flex flex-col p-5 bg-red-50 border border-red-200 shadow-sm rounded-[24px] animate-scale-up gap-3.5 text-left">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-650 shrink-0 border border-red-200">
                              <X className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-extrabold text-sm text-red-950">İş İptal Edildi</span>
                              <span className="text-[10px] text-red-500 font-bold">Hizmet Veren Tarafından Tek Taraflı İptal</span>
                            </div>
                          </div>
                          <div className="bg-white p-4 rounded-xl shadow-inner border border-red-100 text-xs font-semibold text-slate-700 leading-relaxed">
                            Bu iş, <strong className="text-slate-900">{cancelledProviderOffer.provider?.user?.name || "Hizmet Veren"}</strong> tarafından iptal edilmiştir.
                            <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-col gap-1">
                              <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">İptal Gerekçesi</span>
                              <span className="text-red-700 font-extrabold text-sm">
                                {getCancelReasonText(cancelledProviderOffer.cancel_reason_code, cancelledProviderOffer.cancel_reason_text)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Mutual Phone display if offer accepted */}
                      {showCommunicationCard && (
                        <div className="w-full flex flex-col p-5 bg-[#c8f252]/10 border border-[#c8f252]/40 shadow-sm rounded-[24px] animate-scale-up gap-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#c8f252]/20 flex items-center justify-center text-[#4c630a] shrink-0 border border-[#c8f252]/30">
                              <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                              </svg>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-extrabold text-sm text-slate-900">Hizmet Veren İletişim Bilgileri</span>
                              <span className="text-[10px] text-slate-600 font-bold">Telefon Numaraları Karşılıklı Açıldı</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-3.5 bg-white p-4 rounded-xl shadow-inner border border-slate-100 text-xs">
                            <div className="pb-3 border-b border-slate-100/80">
                              <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Sizin Telefonunuz</span>
                              <span className="text-slate-900 text-sm font-extrabold mt-0.5 block">
                                {selectedRequest.seeker?.phone_decrypted || mutualPhones?.seekerPhone || "Bilinmiyor"}
                              </span>
                            </div>
                            
                            <div className="space-y-2.5">
                              <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Kabul Edilen Hizmet Verenler</span>
                              {acceptedOffers.length > 0 ? (
                                acceptedOffers.map((offer, idx) => {
                                  const providerPhone = offer.provider?.user?.phone_decrypted || (idx === acceptedOffers.length - 1 ? mutualPhones?.providerPhone : null) || "Bilinmiyor";
                                  return (
                                    <div key={offer.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200/50 text-left">
                                      <div className="flex flex-col">
                                        <span className="text-xs font-black text-slate-800">
                                          {offer.provider?.user?.name || "Hizmet Veren"}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-bold font-sans">
                                          Kabul Fiyatı: {Number(offer.price).toLocaleString("tr-TR")} ₺
                                        </span>
                                        {offer.appointment_at && (
                                          <span className="text-[10px] text-blue-600 font-extrabold mt-1 block">
                                            Randevu: {new Date(offer.appointment_at).toLocaleString("tr-TR", {
                                              day: '2-digit',
                                              month: '2-digit',
                                              year: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </span>
                                        )}
                                        {offer.started_at && (
                                          <span className="text-[10px] text-emerald-600 font-extrabold mt-1 block">
                                            İş Başlatıldı: {new Date(offer.started_at).toLocaleString("tr-TR", {
                                              day: '2-digit',
                                              month: '2-digit',
                                              year: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-slate-900 text-sm font-extrabold block">
                                          {providerPhone}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200/50 text-left">
                                  <div className="flex flex-col">
                                    <span className="text-xs font-black text-slate-800">
                                      {providerName || "Hizmet Veren"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-slate-900 text-sm font-extrabold block">
                                      {mutualPhones?.providerPhone || "Bilinmiyor"}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-600 font-medium italic">
                            * Hizmet verenlerle doğrudan iletişime geçip randevulaşabilirsiniz. İş tamamlandığında beyanları teyit etmeyi unutmayınız.
                          </p>
                        </div>
                      )}

                      {/* WS INTERACTIVE JOB COMPLETION (ADIM 6) */}
                      {completionState === "pending_seeker" && (
                        <div className="w-full flex flex-col p-5 bg-white border border-slate-150 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03)] rounded-[24px] animate-scale-up gap-4">
                          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-lg select-none">
                              💼
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-slate-900">İş Tamamlama Teyidi</span>
                              <span className="text-xs text-slate-500 font-bold">Hizmet Veren İş Sonu Ücret Beyanı</span>
                            </div>
                          </div>

                          {!showDiscrepancyForm ? (
                            <>
                              <p className="text-sm text-slate-600 leading-relaxed font-semibold">
                                <strong>{providerName || "Hizmet Veren"}</strong> işi bitirdiğini ve sizden <strong>{providerDeclaredAmount} ₺</strong> aldığını beyan etti.
                                <br /><br />
                                Ödediğiniz bu tutar doğru mu?
                              </p>
                              <div className="flex items-center gap-2.5 pt-2">
                                <button
                                  onClick={() => setShowDiscrepancyForm(true)}
                                  className="flex-1 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold py-3 rounded-xl cursor-pointer transition-all border border-slate-200 active:scale-95"
                                >
                                  Hayır, Farklı / İtiraz
                                </button>
                                <button
                                  onClick={() => handleConfirmCompletion(true)}
                                  className="flex-1 bg-[#c8f252] hover:bg-[#b5e639] text-slate-950 text-xs font-black py-3 rounded-xl cursor-pointer shadow-md shadow-[#c8f252]/10 transition-all active:scale-95"
                                >
                                  Evet, Tutar Doğru
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col gap-4 animate-scale-up text-left">
                              <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/50">
                                <input
                                  type="checkbox"
                                  id="serviceNotReceivedDashboard"
                                  checked={isServiceNotReceived}
                                  onChange={(e) => setIsServiceNotReceived(e.target.checked)}
                                  className="w-4 h-4 rounded text-slate-900 focus:ring-[#c8f252] accent-slate-900 cursor-pointer"
                                />
                                <label htmlFor="serviceNotReceivedDashboard" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
                                  Hizmeti almadım / İş eksik yapıldı
                                </label>
                              </div>

                              {!isServiceNotReceived && (
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-xs font-bold text-slate-500">Ödediğiniz Gerçek Tutar (₺):</label>
                                  <input
                                    type="number"
                                    placeholder="Örn: 800"
                                    value={seekerDisputeAmount}
                                    onChange={(e) => setSeekerDisputeAmount(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-[#c8f252] text-sm text-slate-900 font-extrabold"
                                  />
                                </div>
                              )}

                              <div className="flex flex-col gap-1.5">
                                  <label className="text-xs font-bold text-slate-500">İtiraz / Açıklama Notu:</label>
                                  <textarea
                                    placeholder="Lütfen itiraz gerekçenizi veya ödediğiniz farklı tutarın nedenini açıklayın..."
                                    value={disputeNote}
                                    onChange={(e) => setDisputeNote(e.target.value)}
                                    rows={2}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-[#c8f252] text-sm text-slate-900 resize-none font-semibold"
                                  />
                                </div>

                                <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
                                  <button
                                    onClick={() => setShowDiscrepancyForm(false)}
                                    className="flex-1 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold py-2.5 rounded-xl border border-slate-200 cursor-pointer transition-all active:scale-95"
                                  >
                                    Vazgeç
                                  </button>
                                  <button
                                    onClick={() => handleConfirmCompletion(false)}
                                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm"
                                  >
                                    İtirazı Gönder
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* CASE 2: Finished & Completed Success Panel (with Rating & Photo Review widget) */}
                        {completionState === "completed" && (
                          <div className="w-full flex flex-col p-5 bg-white border border-slate-150 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03)] rounded-[24px] animate-scale-up gap-4.5 items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-lime-50 text-[#c8f252] flex items-center justify-center font-bold text-2xl animate-bounce shadow-sm border border-lime-100">
                              🎉
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="font-extrabold text-sm text-slate-900">İş Başarıyla Tamamlandı!</span>
                              <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-[280px]">
                                Ücret teyidi başarıyla sağlandı ve iş başarıyla kapatıldı. Hizmet vereninizi değerlendirebilirsiniz!
                              </p>
                            </div>
                  
                            {!ratingSubmitted ? (
                              <div className="flex flex-col items-center gap-4 w-full border-t border-slate-100 pt-3.5 text-left">
                                <div className="flex justify-center items-center gap-1.5 w-full">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setSelectedRating(star)}
                                      className="text-3xl hover:scale-115 transition-all cursor-pointer text-amber-400 focus:outline-none"
                                    >
                                      {star <= selectedRating ? "★" : "☆"}
                                    </button>
                                  ))}
                                </div>

                                {selectedRating > 0 && (
                                  <div className="flex flex-col gap-3.5 w-full animate-scale-up">
                                    <div className="flex flex-col gap-1.5">
                                      <label className="text-xs font-bold text-slate-500">Görüşleriniz:</label>
                                      <textarea
                                        rows={3}
                                        placeholder="Hizmet vereninizin hizmet kalitesi hakkında yorum yazın..."
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        disabled={isUploadingPhoto}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-[#c8f252] text-sm text-slate-900 resize-none font-semibold"
                                      />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                      <label className="text-xs font-bold text-slate-500">Fotoğraf Ekle (Opsiyonel):</label>
                                      
                                      {!photoPreview ? (
                                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-[#c8f252] rounded-xl p-4 bg-slate-50 cursor-pointer transition-all">
                                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6 text-slate-400">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                                          </svg>
                                          <span className="text-[11px] font-bold text-slate-500 mt-1.5">Fotoğraf Yükle</span>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            disabled={isUploadingPhoto}
                                            className="hidden"
                                          />
                                        </label>
                                      ) : (
                                        <div className="relative w-full h-24 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                                          <img
                                            src={photoPreview}
                                            alt="Yorum Fotoğrafı"
                                            className="w-full h-full object-cover"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                                            disabled={isUploadingPhoto}
                                            className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-black text-white p-1 rounded-full cursor-pointer transition-all"
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                            </svg>
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    <button
                                      type="button"
                                      onClick={handleSubmitReview}
                                      disabled={isUploadingPhoto}
                                      className="w-full bg-[#c8f252] hover:bg-[#b5e639] disabled:bg-slate-200 text-slate-950 disabled:text-slate-400 text-xs font-black py-3 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm mt-1 text-center border border-transparent"
                                    >
                                      {isUploadingPhoto ? "Yükleniyor..." : "Değerlendirmeyi Gönder"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-3">
                                <span className="text-xs font-bold text-slate-800 bg-slate-100 px-4 py-2 rounded-full shadow-sm border border-slate-200/50">
                                  ✓ Değerlendirmeniz İçin Teşekkür Ederiz!
                                </span>
                                {!isAddedToFavorites ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const req = justReviewedRequest || selectedRequest;
                                      const pId = req?.job_completions?.[0]?.provider?.id 
                                        || req?.offers?.find((o: any) => o.status === 'accepted')?.provider?.id
                                        || providerId;
                                      if (pId) handleAddToFavorites(pId);
                                    }}
                                    className="flex items-center gap-2 border border-[#c8f252]/40 bg-[#c8f252]/10 hover:bg-[#c8f252]/20 text-slate-800 text-xs font-black px-4 py-2.5 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm mt-1"
                                  >
                                    ❤️ Hizmet Vereni Favorilerime Ekle
                                  </button>
                                ) : (
                                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mt-1 font-semibold">
                                    ❤️ Hizmet Veren Favorilerinize Eklendi!
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* CASE 3: Disputed & Warning Panel */}
                        {completionState === "disputed" && (
                          <div className="w-full flex flex-col p-5 bg-white border border-red-200 shadow-[0_10px_25px_-5px_rgba(239,68,68,0.05)] rounded-[24px] animate-scale-up gap-3.5 items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center font-bold text-2xl animate-pulse shadow-sm border border-red-100">
                              ⚠️
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="font-extrabold text-sm text-slate-900">Uyuşmazlık Kaydı Oluşturuldu</span>
                              <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-[280px]">
                                Hizmet veren ile beyan ettiğiniz ücretler uyuşmamaktadır. Kalite personeli ekibimiz iki tarafla da görüşerek çözüm sağlayacaktır.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* LİVE OFFERS STREAM BADGE OR ACTIVE ROOM */}
                        <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                              {selectedRequest.status !== "cancelled" && (
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                              )}
                              <span>Gelen Teklifler Akışı</span>
                            </h4>
                            {selectedRequest.status === "cancelled" ? (
                              <span className="text-[10px] font-bold bg-red-50 text-red-700 px-2.5 py-1 rounded-full border border-red-100 uppercase tracking-wider">
                                İptal Edildi
                              </span>
                            ) : selectedRequest.offers?.length >= 4 ? (
                              <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full border border-rose-100 uppercase tracking-wider">
                                Tekliflere Kapandı
                              </span>
                            ) : getRequestExpiryInfo(selectedRequest.created_at, Date.now(), selectedRequest.offers).isExpired ? (
                              <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full border border-rose-100 uppercase tracking-wider">
                                Süre Doldu
                              </span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold bg-[#c8f252]/20 text-[#4c630a] px-2.5 py-1 rounded-full uppercase tracking-wider">
                                  Canlı Bağlantı Aktif
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Center Large Countdown & Reassuring text */}
                          {selectedRequest.status === "cancelled" ? (
                            <div className="bg-red-50/40 border border-red-100/70 rounded-2xl p-5 text-center flex flex-col items-center justify-center gap-3 animate-scale-up">
                              <p className="text-red-700 text-xs font-extrabold leading-relaxed max-w-md">
                                Bu hizmet talebi iptal edilmiştir. Yeni teklif alımına kapalıdır.
                              </p>
                            </div>
                          ) : getRequestExpiryInfo(selectedRequest.created_at, Date.now(), selectedRequest.offers).isExpired ? (
                            <div className="bg-slate-50 border border-slate-200/60 rounded-[20px] p-6 text-center flex flex-col items-center justify-center gap-4 animate-scale-up">
                              <div className="space-y-1.5">
                                <h5 className="font-extrabold text-sm text-slate-900">Teklif Alım Süresi Doldu</h5>
                                <p className="text-slate-500 text-xs font-semibold max-w-[320px] leading-relaxed mx-auto">
                                  Bu talebin teklif toplama süresi dolmuştur. Dilerseniz bu talebi aynı bilgilerle tekrar yayına alabilirsiniz.
                                </p>
                              </div>
                              <button
                                onClick={() => handleRePublishRequest(selectedRequest.id)}
                                className="bg-[#c8f252] hover:bg-[#b5dc43] text-[#2c3e07] font-black text-xs py-3 px-6 rounded-2xl transition-all shadow-[0_4px_12px_rgba(200,242,82,0.2)] hover:scale-[1.02] flex items-center gap-2 border border-[#b2db42] cursor-pointer"
                              >
                                <RefreshCw className="w-4 h-4" />
                                Talebi Tekrar Yayınla
                              </button>
                            </div>
                          ) : !(selectedRequest.offers?.length >= 4) && !getRequestExpiryInfo(selectedRequest.created_at, Date.now(), selectedRequest.offers).isExpired && !selectedRequest.offers?.some((o: any) => o.status === "accepted") ? (
                            <div className="bg-rose-50/40 border border-rose-100/70 rounded-2xl p-5 text-center flex flex-col items-center justify-center gap-3 animate-scale-up">
                              <div className="flex flex-col items-center gap-1">
                                <CountdownTimer createdAt={selectedRequest.created_at} variant="large" offers={selectedRequest.offers} />
                                <span className="text-xs font-black text-rose-500 uppercase tracking-wider">
                                  Teklife Kapanacak
                                </span>
                              </div>
                              <p className="text-slate-700 text-xs font-extrabold leading-relaxed max-w-md">
                                Canlı bağlantı aktif! Talebiniz sistemdeki en iyi esnaflara iletildi. {getRequestExpiryInfo(selectedRequest.created_at, Date.now(), selectedRequest.offers).label} içerisinde en uygun teklifler canlı olarak bu ekranda listelenmeye devam edecektir.
                              </p>
                            </div>
                          ) : null}

                          {selectedRequest.offers?.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                              {selectedRequest.status !== "cancelled" ? (
                                <>
                                  {selectedRequest.republished_from_id && (
                                    <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl px-5 py-3 flex items-center gap-2.5 w-full max-w-md animate-scale-up mb-2">
                                      <RefreshCw className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                      <p className="text-amber-800 text-[11px] font-bold leading-relaxed text-left">
                                        Bu talep yeniden yayınlandı. Eski teklifler arşivlendi ve önceki hizmet verenlere bildirim gönderildi. Güncel teklifler bekleniyor...
                                      </p>
                                    </div>
                                  )}
                                  <div className="relative w-12 h-12 flex items-center justify-center">
                                    {/* Premium Neon lime spinning loading loader */}
                                    <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-[#c8f252] animate-spin"></div>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="font-extrabold text-sm text-slate-900">Teklifler Bekleniyor...</div>
                                    <div className="text-slate-500 text-xs font-semibold max-w-[280px] leading-relaxed mx-auto">
                                      Talebiniz bölgenizdeki en iyi esnaflara iletildi. Teklifler canlı olarak bu ekranda belirecek.
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div className="space-y-1">
                                  <div className="font-extrabold text-sm text-slate-400">Talep İptal Edildi</div>
                                  <div className="text-slate-550 text-xs font-semibold max-w-[280px] leading-relaxed mx-auto">
                                    Bu talebe gelen herhangi bir teklif bulunmamaktadır.
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {selectedRequest.offers?.map((offer) => (
                                <div
                                  key={offer.id}
                                  className={`border ${offer.status === "accepted" ? "border-emerald-300 bg-emerald-50/10 shadow-[0_10px_25px_-5px_rgba(16,185,129,0.03)]" : (offer.status === "cancelled" && offer.cancelled_by === "service_provider") ? "border-red-200 bg-red-50/10 shadow-[0_10px_25px_-5px_rgba(239,68,68,0.02)]" : "border-[#c8f252] hover:border-[#b5e639] bg-slate-50/20 shadow-[0_10px_25px_-5px_rgba(200,242,82,0.05)]"} p-5 rounded-[24px] flex flex-col gap-4 transition-all duration-200 animate-scale-up`}
                                >
                                  <div className="flex items-center justify-between w-full border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-3">
                                      <span className="w-10 h-10 rounded-full bg-[#c8f252] text-slate-955 flex items-center justify-center font-extrabold text-sm select-none uppercase font-mono shadow-sm border border-[#c8f252]/10">
                                        {offer.provider.user.name ? offer.provider.user.name.charAt(0) : "U"}
                                      </span>
                                      <div className="flex flex-col">
                                        <span className="font-extrabold text-xs md:text-sm text-slate-800">
                                          {offer.provider.user.name}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                                          Profesyonel Esnaf
                                        </span>
                                        <div className="flex items-center gap-1 mt-1">
                                          <div className="flex items-center gap-0.5">
                                            {Array.from({ length: 5 }).map((_, i) => {
                                              const ratingVal = Number(offer.provider.avg_rating || 5);
                                              const isFilled = i < Math.round(ratingVal);
                                              return (
                                                <svg 
                                                  key={i} 
                                                  className={`w-3 h-3 ${isFilled ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} 
                                                  viewBox="0 0 20 20"
                                                >
                                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                              );
                                            })}
                                          </div>
                                          <span className="text-[10px] font-black text-slate-700 ml-0.5">
                                            {Number(offer.provider.avg_rating || 5.0).toFixed(1)} / 5.0
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <span className="text-base md:text-lg font-black text-slate-900 tracking-tight">
                                      {Number(offer.price).toLocaleString("tr-TR")} ₺
                                    </span>
                                  </div>

                                  <p className="text-xs md:text-sm text-slate-600 font-semibold italic bg-white p-3 rounded-2xl border border-slate-100/80 leading-relaxed">
                                    &ldquo;{offer.description || offer.message || "Açıklama belirtilmedi."}&rdquo;
                                  </p>

                                  {offer.appointment_at && (
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-2 text-left">
                                      <span className="text-blue-600 text-xs">📅</span>
                                      <span className="text-[11px] font-bold text-blue-800">
                                        Randevu Tarihi: {new Date(offer.appointment_at).toLocaleString("tr-TR", {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                    </div>
                                  )}

                                  {offer.started_at && (
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-2 text-left">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                                      <span className="text-[11px] font-bold text-emerald-800">
                                        İş Başlatıldı: {new Date(offer.started_at).toLocaleString("tr-TR", {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                    </div>
                                  )}

                                  {offer.status === "cancelled" && offer.cancelled_by === "service_provider" && (
                                    <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex flex-col gap-1 text-left animate-scale-up">
                                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">İptal Gerekçesi</span>
                                      <span className="text-red-700 font-extrabold text-xs">
                                        {getCancelReasonText(offer.cancel_reason_code, offer.cancel_reason_text)}
                                      </span>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-2.5 w-full pt-1">
                                    <button 
                                      onClick={() => fetchProviderProfile(offer.provider.id)}
                                      disabled={loadingProviderProfile}
                                      className="flex-1 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-700 text-[10px] md:text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-all border border-slate-200/50 flex items-center justify-center gap-1.5"
                                    >
                                      {loadingProviderProfile ? (
                                        <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                                      ) : null}
                                      <span>Profili Gör</span>
                                    </button>
                                    <button 
                                      disabled={selectedRequest?.status === "cancelled"}
                                      onClick={() => {
                                        if (selectedRequest) {
                                          setActiveChat({
                                            jobId: selectedRequest.id,
                                            offerId: offer.id,
                                            providerName: offer.provider.user.name,
                                            providerId: offer.provider.id
                                          });
                                          setActiveTab("mesajlar");
                                        }
                                      }}
                                      className="flex-1 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 text-[10px] md:text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-all border border-slate-200/50"
                                    >
                                      Mesaj Gönder
                                    </button>
                                    {offer.status === "accepted" ? (
                                      <span className="flex-1 text-center text-[10px] md:text-xs font-bold bg-emerald-100 text-emerald-800 py-2.5 rounded-xl uppercase tracking-wider font-mono">
                                        Kabul Edildi
                                      </span>
                                    ) : (offer.status === "cancelled" && offer.cancelled_by === "service_provider") ? (
                                      <span className="flex-1 text-center text-[10px] md:text-xs font-bold bg-red-100 text-red-800 py-2.5 rounded-xl uppercase tracking-wider font-mono">
                                        İptal Edildi
                                      </span>
                                    ) : selectedRequest?.status === "cancelled" ? (
                                      <button
                                        disabled
                                        className="flex-1 bg-slate-100 text-slate-400 border border-slate-200 text-[10px] md:text-xs font-bold py-2.5 rounded-xl cursor-not-allowed text-center uppercase tracking-wider"
                                      >
                                        Geçersiz
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleAcceptOffer(offer)}
                                        className="flex-1 bg-[#c8f252] hover:bg-[#b5e639] text-slate-950 text-[10px] md:text-xs font-black py-2.5 rounded-xl cursor-pointer transition-all shadow-md shadow-[#c8f252]/20 active:scale-95 border border-transparent"
                                      >
                                        Kabul Et
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  </div>
                )}

                {/* VIEW 2: CANLI LOBİ VIEW */}
                {activeTab === "canlobi" && (
                  <div className="space-y-6 animate-scale-up text-left">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-2xl">Canlı Teklif Lobisi</h3>
                      <p className="text-xs text-slate-400 font-semibold mt-1">Platformdaki güncel aktif hizmet taleplerinizi ve canlı WebSocket veri akışlarını izleyin.</p>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[24px] p-12 text-center shadow-sm max-w-lg mx-auto mt-6">
                      <div className="w-16 h-16 rounded-full bg-[#c8f252]/10 border border-[#c8f252]/30 flex items-center justify-center mx-auto mb-4 text-[#88b000]">
                        <Activity className="w-8 h-8 animate-pulse stroke-[2.2]" />
                      </div>
                      <h4 className="font-extrabold text-slate-800 text-sm mb-1.5">Canlı İzleme Aktif</h4>
                      <p className="text-slate-400 text-xs font-semibold leading-relaxed mb-6">
                        Tekliflerinizi ve esnaf etkileşimlerini anlık canlı lobi modunda yönetiyorsunuz. Canlı Socket.io odaları arka planda sürekli olarak güncellenir.
                      </p>
                      <button 
                        onClick={() => setActiveTab("tekliflerim")}
                        className="bg-[#c8f252] hover:bg-[#b5e639] text-slate-950 text-xs font-black px-6 py-3 rounded-xl cursor-pointer shadow-sm transition-all active:scale-95"
                      >
                        Tekliflerime Geri Dön
                      </button>
                    </div>
                  </div>
                )}

                {/* VIEW 3: TEKLİF KARŞILAŞTIRMA VIEW */}
                {activeTab === "karsilastirma" && (() => {
                  const requestsWithOffers = requests.filter(r => r.offers && r.offers.length >= 2 && (r.status === 'pending' || r.status === 'distributed'));
                  const activeCompareJob = requestsWithOffers.find(r => r.id === compareJobId) || requestsWithOffers[0];
                  
                  let lowestPriceOffer: any = null;
                  let highestRatingOffer: any = null;

                  if (activeCompareJob && activeCompareJob.offers?.length >= 2) {
                    // 1. En Uygun Fiyatlı Teklif
                    const sortedByPrice = [...activeCompareJob.offers].sort((a, b) => Number(a.price) - Number(b.price));
                    lowestPriceOffer = sortedByPrice[0];

                    // 2. Diğer teklifler içinden en yüksek puanlı olanı (Farklı usta olması garanti edilir)
                    const otherOffers = activeCompareJob.offers.filter(o => o.id !== lowestPriceOffer?.id);
                    const sortedByRating = [...otherOffers].sort((a, b) => {
                      const rA = Number((a.provider as any).avg_rating || 0);
                      const rB = Number((b.provider as any).avg_rating || 0);
                      return rB - rA;
                    });
                    highestRatingOffer = sortedByRating[0];
                  }

                  return (
                    <div className="space-y-6 animate-scale-up text-left">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-2xl">Teklif Karşılaştırma Analizi</h3>
                        <p className="text-xs text-slate-400 font-semibold mt-1 font-sans">Gelen teklifleri fiyat, usta puanı ve teslimat sürelerine göre yan yana karşılaştırın.</p>
                      </div>

                      {requestsWithOffers.length === 0 ? (
                        <div className="bg-white border border-slate-100 rounded-[24px] p-12 text-center shadow-sm max-w-lg mx-auto mt-6">
                          <div className="text-4xl mb-4 font-sans">📊</div>
                          <h4 className="font-extrabold text-slate-800 text-sm mb-1.5 font-sans">Karşılaştırılacak Teklif Bulunmuyor</h4>
                          <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                            En az 2 teklif aldığınız aktif bir hizmet talebiniz olduğunda teklifleri burada yan yana analiz edebilirsiniz.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Request Selector */}
                          <div className="flex flex-col gap-2 max-w-md">
                            <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest font-mono">Hizmet Talebi Seçin</label>
                            <select
                              value={compareJobId || (activeCompareJob ? activeCompareJob.id : "")}
                              onChange={(e) => setCompareJobId(e.target.value)}
                              className="bg-white border border-slate-250 text-slate-800 rounded-xl p-3.5 outline-none text-xs font-bold transition-all shadow-sm focus:border-[#c8f252]"
                            >
                              {requestsWithOffers.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.category?.name} (#{r.id.substring(0, 5).toUpperCase()}) - {r.offers?.length} Teklif
                                </option>
                              ))}
                            </select>
                          </div>

                          {activeCompareJob && activeCompareJob.offers && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                              {/* Best Price Card */}
                              {lowestPriceOffer && (
                                <div className="bg-white border-2 border-emerald-450 rounded-[24px] p-6 shadow-sm flex flex-col justify-between gap-5 relative overflow-hidden">
                                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[8px] font-black tracking-widest px-3 py-1.5 uppercase rounded-bl-xl font-mono">
                                    EN UYGUN FİYAT
                                  </div>
                                  <div className="space-y-3">
                                    <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded uppercase font-mono tracking-wider">
                                      EKONOMİK SEÇENEK
                                    </span>
                                    <div className="flex items-center gap-2.5 pt-2">
                                      <span className="text-2xl">🧑‍🔧</span>
                                      <div>
                                        <h4 className="font-black text-sm text-slate-900 leading-none">{(lowestPriceOffer.provider?.user as any)?.name || "Usta"}</h4>
                                        <span className="text-[10px] text-slate-400 font-bold block mt-1">Usta Ortak</span>
                                      </div>
                                    </div>
                                    <p className="text-xs text-slate-650 font-semibold italic border-t border-slate-50 pt-2.5 leading-relaxed">
                                      &ldquo;{lowestPriceOffer.description || lowestPriceOffer.message || "Açıklama belirtilmedi."}&rdquo;
                                    </p>
                                    <div className="text-xs space-y-2 text-slate-600 font-semibold border-t border-slate-50 pt-3">
                                      <div className="flex justify-between"><span>Teklif Fiyatı:</span><span className="font-black text-slate-900 text-sm">₺{Number(lowestPriceOffer.price).toLocaleString("tr-TR")}</span></div>
                                      <div className="flex justify-between"><span>Ortalama Puan:</span><span className="font-extrabold text-slate-900">⭐ {Number((lowestPriceOffer.provider as any)?.avg_rating || 4.5).toFixed(1)}</span></div>
                                      <div className="flex justify-between"><span>Talep Kodu:</span><span className="font-mono text-slate-900 font-bold">#TR-{activeCompareJob.id.substring(0, 5).toUpperCase()}</span></div>
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => handleAcceptOffer(lowestPriceOffer)}
                                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black py-3 rounded-xl cursor-pointer transition-all active:scale-95 text-center shadow-sm"
                                  >
                                    Teklifi Kabul Et
                                  </button>
                                </div>
                              )}

                              {/* Best Rating Card */}
                              {highestRatingOffer && (
                                <div className="bg-white border-2 border-amber-450 rounded-[24px] p-6 shadow-sm flex flex-col justify-between gap-5 relative overflow-hidden">
                                  <div className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] font-black tracking-widest px-3 py-1.5 uppercase rounded-bl-xl font-mono">
                                    EN YÜKSEK PUAN
                                  </div>
                                  <div className="space-y-3">
                                    <span className="bg-amber-50 text-amber-700 text-[9px] font-black px-2 py-0.5 rounded uppercase font-mono tracking-wider">
                                      KALİTE SEÇENEĞİ
                                    </span>
                                    <div className="flex items-center gap-2.5 pt-2">
                                      <span className="text-2xl">🧑‍🔧</span>
                                      <div>
                                        <h4 className="font-black text-sm text-slate-900 leading-none">{(highestRatingOffer.provider?.user as any)?.name || "Usta"}</h4>
                                        <span className="text-[10px] text-slate-400 font-bold block mt-1">Usta Ortak</span>
                                      </div>
                                    </div>
                                    <p className="text-xs text-slate-650 font-semibold italic border-t border-slate-50 pt-2.5 leading-relaxed">
                                      &ldquo;{highestRatingOffer.description || highestRatingOffer.message || "Açıklama belirtilmedi."}&rdquo;
                                    </p>
                                    <div className="text-xs space-y-2 text-slate-600 font-semibold border-t border-slate-50 pt-3">
                                      <div className="flex justify-between"><span>Teklif Fiyatı:</span><span className="font-black text-slate-900 text-sm">₺{Number(highestRatingOffer.price).toLocaleString("tr-TR")}</span></div>
                                      <div className="flex justify-between"><span>Ortalama Puan:</span><span className="font-black text-[#4c630a] text-sm">⭐ {Number((highestRatingOffer.provider as any)?.avg_rating || 4.5).toFixed(1)}</span></div>
                                      <div className="flex justify-between"><span>Talep Kodu:</span><span className="font-mono text-slate-900 font-bold">#TR-{activeCompareJob.id.substring(0, 5).toUpperCase()}</span></div>
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => handleAcceptOffer(highestRatingOffer)}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-black py-3 rounded-xl cursor-pointer transition-all active:scale-95 text-center shadow-sm"
                                  >
                                    Teklifi Kabul Et
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* VIEW 4: MESAJLAŞMA VIEW */}
                {activeTab === "mesajlar" && (() => {
                  const hasAccepted = requests.some(r => r.offers?.some(o => o.status === 'accepted'));
                  const hasActiveChat = !!activeChat;

                  return (
                    <div className="space-y-6 animate-scale-up text-left">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-2xl">Sohbet & İletişim Kutusu</h3>
                        <p className="text-xs text-slate-400 font-semibold mt-1">Anlaştığınız esnaflarla gerçekleştirdiğiniz mesaj geçmişini yönetin.</p>
                      </div>

                      {!hasAccepted && !hasActiveChat ? (
                        <div className="bg-white border border-slate-100 rounded-[24px] p-12 text-center shadow-sm max-w-lg mx-auto mt-6">
                          <div className="text-4xl mb-4">💬</div>
                          <h4 className="font-extrabold text-slate-800 text-sm mb-1.5">Henüz Aktif Sohbet Yok</h4>
                          <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                            Bir esnafın teklifini kabul ettiğinizde veya mesaj gönderdiğinizde, karşılıklı iletişim kanalları ve sohbet odanız burada otomatik olarak açılacaktır.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-[500px]">
                          {/* Left: Chats Sidebar */}
                          <div className="lg:col-span-4 bg-white border border-slate-100 rounded-[24px] p-4 flex flex-col gap-3.5 max-h-[600px] overflow-y-auto">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono border-b border-slate-50 pb-2 mb-1">Aktif Görüşmeler</h4>
                            {(() => {
                              const chatItems: Array<{ jobId: string; offerId: string; providerName: string; providerId: string; categoryName: string }> = [];
                              
                              // Add accepted offers
                              requests.forEach((req) => {
                                const accOffer = req.offers?.find(o => o.status === 'accepted');
                                if (accOffer) {
                                  chatItems.push({
                                    jobId: req.id,
                                    offerId: accOffer.id,
                                    providerName: accOffer.provider.user.name,
                                    providerId: accOffer.provider.id,
                                    categoryName: req.category?.name || 'Genel Hizmet'
                                  });
                                }
                              });

                              // Add activeChat if not already present
                              if (activeChat && !chatItems.some(item => item.offerId === activeChat.offerId)) {
                                const req = requests.find(r => r.id === activeChat.jobId);
                                chatItems.push({
                                  jobId: activeChat.jobId,
                                  offerId: activeChat.offerId,
                                  providerName: activeChat.providerName,
                                  providerId: activeChat.providerId,
                                  categoryName: req?.category?.name || 'Genel Hizmet'
                                });
                              }

                              return chatItems.map((item) => {
                                const isActive = activeChat?.offerId === item.offerId;
                                return (
                                  <button
                                    key={item.offerId}
                                    onClick={() => setActiveChat({
                                      jobId: item.jobId,
                                      offerId: item.offerId,
                                      providerName: item.providerName,
                                      providerId: item.providerId
                                    })}
                                    className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                                      isActive 
                                        ? "bg-[#c8f252]/10 border-[#c8f252]/80 shadow-sm" 
                                        : "bg-slate-50 border-slate-100 hover:bg-slate-100/60"
                                    }`}
                                  >
                                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-[#c8f252] flex items-center justify-center font-black shrink-0 text-sm">
                                      {item.providerName.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="overflow-hidden flex-1">
                                      <span className="block text-xs font-extrabold text-slate-850 truncate">{item.providerName}</span>
                                      <span className="block text-[10px] text-slate-400 font-bold truncate mt-0.5">{item.categoryName}</span>
                                    </div>
                                  </button>
                                );
                              });
                            })()}
                          </div>

                          {/* Right: Message Window */}
                          <div className="lg:col-span-8 bg-white border border-slate-100 rounded-[24px] flex flex-col justify-between max-h-[600px] overflow-hidden shadow-sm relative">
                            {activeChat ? (
                              <>
                                {/* Chat Header */}
                                <div className="border-b border-slate-100 p-4 bg-slate-50/50 flex justify-between items-center shrink-0">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-[#c8f252] text-slate-950 flex items-center justify-center font-black text-xs">
                                      {activeChat.providerName.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="text-left">
                                      <span className="block text-xs font-black text-slate-850 leading-none">{activeChat.providerName}</span>
                                      <span className="text-[9px] text-[#88b000] font-black uppercase tracking-wider block mt-1">Sohbet Odası Aktif</span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => setActiveChat(null)}
                                    className="text-slate-400 hover:text-slate-800 text-xs font-bold px-3 py-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
                                  >
                                    Kapat
                                  </button>
                                </div>

                                {/* Messages list */}
                                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/35 scrollbar-none min-h-[300px]">
                                  {loadingChatMessages ? (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-[#c8f252] animate-spin"></div>
                                    </div>
                                  ) : chatMessages.length === 0 ? (
                                    <p className="text-center text-slate-400 text-xs py-12 font-medium">Ustanıza bir mesaj atarak başlayın!</p>
                                  ) : (
                                    chatMessages.map((msg) => {
                                      const isMe = msg.sender_id === user?.id;
                                      return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                          <div className={`max-w-[70%] p-3.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
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
                                <form onSubmit={handleSendMessage} className="border-t border-slate-100 p-3 flex gap-2 shrink-0 bg-white">
                                  <input
                                    type="text"
                                    value={newMessageText}
                                    onChange={(e) => setNewMessageText(e.target.value)}
                                    placeholder="Mesajınızı buraya yazın..."
                                    className="flex-1 bg-slate-50 border border-slate-200 focus:border-[#c8f252] focus:ring-1 focus:ring-[#c8f252] outline-none rounded-xl px-4 py-3 text-xs font-semibold text-slate-800"
                                  />
                                  <button
                                    type="submit"
                                    disabled={!newMessageText.trim()}
                                    className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                                  >
                                    Gönder
                                  </button>
                                </form>
                              </>
                            ) : (
                              <div className="m-auto text-center p-8">
                                <span className="text-3xl">💬</span>
                                <h4 className="text-xs font-black text-slate-800 mt-3 font-sans">Sohbet Başlatılmadı</h4>
                                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                                  Soldaki listeden görüşmek istediğiniz esnafı seçerek anlık sohbete başlayabilirsiniz.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* VIEW 5: İŞ TEYİT & PUANLAMA VIEW */}
                {activeTab === "puanlama" && (() => {
                  if (ratingSubmitted) {
                    const req = justReviewedRequest || selectedRequest;
                    const pId = req?.job_completions?.[0]?.provider?.id 
                      || req?.offers?.find((o: any) => o.status === 'accepted')?.provider?.id
                      || providerId;

                    return (
                      <div className="space-y-6 animate-scale-up text-left">
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-2xl">İş Teyit & Puanlama Paneli</h3>
                          <p className="text-xs text-slate-400 font-semibold mt-1">Tamamlanan işlerinizin onaylarını verin ve esnafları değerlendirerek puanlayın.</p>
                        </div>

                        <div className="bg-white border border-slate-100 rounded-[24px] p-8 text-center shadow-sm max-w-lg mx-auto mt-6 flex flex-col items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-lime-50 text-[#c8f252] flex items-center justify-center font-bold text-2xl animate-bounce shadow-sm border border-lime-100">
                            🎉
                          </div>
                          <div className="flex flex-col gap-1">
                            <h4 className="font-extrabold text-slate-800 text-sm mb-1.5">Değerlendirmeniz İçin Teşekkür Ederiz!</h4>
                            <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                              Değerlendirmeniz başarıyla gönderildi! Yönetici onayından sonra hizmet verenin profilinde yayınlanacaktır. Dilerseniz bu hizmet vereni favorilerinize ekleyebilirsiniz.
                            </p>
                          </div>
                          
                          <div className="flex flex-col items-center gap-3 w-full border-t border-slate-100 pt-4 mt-2">
                            {!isAddedToFavorites ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (pId) handleAddToFavorites(pId);
                                }}
                                className="flex items-center gap-2 border border-[#c8f252]/40 bg-[#c8f252]/10 hover:bg-[#c8f252]/20 text-slate-800 text-xs font-black px-6 py-3 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm"
                              >
                                ❤️ Hizmet Vereni Favorilerime Ekle
                              </button>
                            ) : (
                              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 font-semibold bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-150">
                                ❤️ Hizmet Veren Favorilerinize Eklendi!
                              </span>
                            )}
                            
                            <button
                              type="button"
                              onClick={() => {
                                setRatingSubmitted(false);
                                setJustReviewedRequest(null);
                              }}
                              className="text-xs text-slate-500 hover:text-slate-800 font-bold underline mt-2 cursor-pointer"
                            >
                              Panele Geri Dön
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const pendingCompletionsRequests = requests.filter(r => r.job_completions?.some(jc => jc.status === "pending_seeker"));
                  const completedNoReviewRequests = requests.filter(r => r.status === "completed" && (!r.reviews || r.reviews.length === 0));

                  if (pendingCompletionsRequests.length === 0 && completedNoReviewRequests.length === 0) {
                    return (
                      <div className="space-y-6 animate-scale-up text-left">
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-2xl">İş Teyit & Puanlama Paneli</h3>
                          <p className="text-xs text-slate-400 font-semibold mt-1">Tamamlanan işlerinizin onaylarını verin ve esnafları değerlendirerek puanlayın.</p>
                        </div>

                        <div className="bg-white border border-slate-100 rounded-[24px] p-12 text-center shadow-sm max-w-lg mx-auto mt-6">
                          <div className="text-4xl mb-4">⭐</div>
                          <h4 className="font-extrabold text-slate-800 text-sm mb-1.5">Teyit Bekleyen İşiniz Yok</h4>
                          <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                            Ustanız işi bitirip onay talebi yolladığında teyit ekranı otomatik belirecektir. Dilerseniz aktif teklifler listesinden işinizin durumunu kontrol edebilirsiniz.
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6 animate-scale-up text-left">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-2xl">İş Teyit & Puanlama Paneli</h3>
                        <p className="text-xs text-slate-400 font-semibold mt-1">Tamamlanan işlerinizin onaylarını verin ve esnafları değerlendirerek puanlayın.</p>
                      </div>

                      <div className="space-y-6 max-w-3xl">
                        {/* Pending completions */}
                        {pendingCompletionsRequests.map((req) => {
                          const jc = req.job_completions?.find(c => c.status === "pending_seeker");
                          if (!jc) return null;
                          return (
                            <div key={req.id} className="bg-white border-2 border-[#c8f252] rounded-[24px] p-6 shadow-sm space-y-4">
                              <h4 className="font-black text-sm text-slate-900">{req.category?.name} - Teyit Bekliyor</h4>
                              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                                Ustanız bu işin tamamlandığını beyan etti. Lütfen beyan edilen tutarı kontrol ederek teyit ediniz.
                              </p>
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs font-bold space-y-2 text-slate-700">
                                <div className="flex justify-between"><span>Esnaf Adı:</span><span className="text-slate-900">{jc.provider?.user?.name || "Usta"}</span></div>
                                <div className="flex justify-between"><span>Beyan Edilen Ücret:</span><span className="text-slate-900">₺{Number(jc.provider_declared_amount || 0).toLocaleString("tr-TR")}</span></div>
                              </div>
                              <div className="flex gap-3 pt-2">
                                <button
                                  onClick={async () => {
                                    setSelectedRequest(req);
                                    setProviderDeclaredAmount(Number(jc.provider_declared_amount || 0));
                                    await handleConfirmCompletion(true, req, Number(jc.provider_declared_amount || 0));
                                  }}
                                  className="bg-[#c8f252] hover:bg-[#b5e639] text-slate-950 text-xs font-black py-2.5 px-6 rounded-xl cursor-pointer transition-all active:scale-95"
                                >
                                  Teyit Et ve Onayla
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedRequest(req);
                                    setProviderDeclaredAmount(Number(jc.provider_declared_amount || 0));
                                    setShowDiscrepancyForm(true);
                                  }}
                                  className="bg-white hover:bg-red-50 text-red-500 border border-slate-200 hover:border-red-200 text-xs font-bold py-2.5 px-6 rounded-xl cursor-pointer transition-all active:scale-95"
                                >
                                  Uyuşmazlık Bildir
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* Pending Reviews */}
                        {completedNoReviewRequests.map((req) => {
                          const completedJc = req.job_completions?.[0];
                          const providerName = completedJc?.provider?.user?.name || "Esnaf";
                          const isCurrentReviewReq = selectedRequest?.id === req.id;
                          
                          return (
                            <div key={req.id} className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm space-y-4">
                              <h4 className="font-black text-sm text-slate-900">{req.category?.name} - Değerlendirme Yapın</h4>
                              <p className="text-xs text-slate-650 font-semibold leading-relaxed">
                                Tebrikler! İş başarıyla tamamlandı. Ustanız <strong>{providerName}</strong> için değerlendirme yazarak diğer kullanıcılara yardımcı olabilirsiniz.
                              </p>

                              {/* Star Rating selector */}
                              <div className="space-y-3 pt-2">
                                <div className="flex items-center gap-1.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      onClick={() => {
                                        if (selectedRequest?.id !== req.id) {
                                          setCommentText("");
                                        }
                                        setSelectedRequest(req);
                                        setSelectedRating(star);
                                      }}
                                      className={`text-2xl cursor-pointer transition-all ${
                                        isCurrentReviewReq && selectedRating >= star
                                          ? "text-amber-400 scale-110" 
                                          : "text-slate-200 hover:text-amber-300"
                                      }`}
                                    >
                                      ★
                                    </button>
                                  ))}
                                </div>
                                
                                {selectedRating > 0 && isCurrentReviewReq && (
                                  <div className="space-y-4 pt-2 animate-scale-up">
                                    <textarea
                                      value={commentText}
                                      onChange={(e) => setCommentText(e.target.value)}
                                      placeholder="Yorumunuzu buraya yazın (isteğe bağlı)..."
                                      rows={3}
                                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#c8f252] outline-none rounded-xl p-3 text-xs font-semibold text-slate-800"
                                    />
                                    <button
                                      onClick={handleSubmitReview}
                                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-black py-2.5 px-6 rounded-xl cursor-pointer transition-all active:scale-95"
                                    >
                                      Değerlendirmeyi Gönder
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* VIEW 6: PROFILE & SETTINGS */}
                {activeTab === "profile" && (
                  <div className="max-w-xl mx-auto bg-white border border-slate-100 rounded-[24px] p-8 shadow-sm animate-scale-up text-left">
                    <h3 className="font-extrabold text-slate-800 text-base mb-1">Hesap Ayarları</h3>
                    <p className="text-xs text-slate-400 font-semibold mb-6">Kişisel bilgilerinizi ve iletişim detaylarınızı güncelleyin</p>

                    {profileSuccessMsg && (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-bold mb-6 animate-scale-up">
                        ✓ {profileSuccessMsg}
                      </div>
                    )}

                    <form onSubmit={handleUpdateProfile} className="space-y-5">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500">Telefon Numarası (Değiştirilemez):</label>
                        <input
                          type="text"
                          disabled
                          value={user?.phone_masked || ""}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-400 rounded-xl p-3 outline-none text-xs font-bold cursor-not-allowed"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500">Adınız Soyadınız:</label>
                        <input
                          type="text"
                          required
                          placeholder="Örn: Mehmet Yılmaz"
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-[#c8f252] rounded-xl p-3 outline-none text-xs font-bold text-slate-800 transition-colors"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500">E-Posta Adresiniz:</label>
                        <input
                          type="email"
                          required
                          placeholder="Örn: mehmet@example.com"
                          value={profileEmail}
                          onChange={(e) => setProfileEmail(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-[#c8f252] rounded-xl p-3 outline-none text-xs font-bold text-slate-800 transition-colors"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3.5 rounded-xl cursor-pointer transition-all active:scale-95 shadow-md shadow-slate-950/10 mt-2"
                      >
                        Bilgileri Güncelle
                      </button>
                    </form>
                  </div>
                )}

                {/* VIEW 7: WALLET & REFERRAL */}
                {activeTab === "cuzdan" && (
                  <div className="space-y-8 animate-scale-up text-left">
                    <header>
                      <h2 className="font-extrabold text-slate-900 tracking-tight text-2xl md:text-3xl leading-snug">
                        Cüzdan ve Referans Sistemi
                      </h2>
                      <p className="text-slate-400 text-xs mt-1 font-semibold leading-relaxed">
                        Mevcut bakiyenizi görüntüleyin, arkadaşlarınızı davet edin veya referans kodu girerek ödül kazanın.
                      </p>
                    </header>

                    {referralLoading ? (
                      <div className="w-full flex items-center justify-center py-20">
                        <div className="w-8 h-8 rounded-full border-4 border-slate-150 border-t-[#c8f252] animate-spin"></div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Left: Premium Wallet Card */}
                          <div className="lg:col-span-1 bg-slate-900 rounded-[28px] p-6 shadow-lg border border-slate-800 text-white flex flex-col justify-between relative overflow-hidden h-[220px]">
                            {/* Decorative card glows */}
                            <div className="absolute top-[-40px] right-[-40px] w-24 h-24 rounded-full bg-[#c8f252]/20 blur-xl"></div>
                            <div className="absolute bottom-[-30px] left-[-30px] w-20 h-20 rounded-full bg-slate-800 blur-lg"></div>

                            <div className="flex items-center justify-between z-10">
                              <span className="text-[10px] font-bold text-[#c8f252] tracking-wider uppercase bg-[#c8f252]/10 px-2.5 py-1 rounded-lg border border-[#c8f252]/20">
                                Esnaaf Bakiye Kartı
                              </span>
                              <Wallet className="w-5 h-5 text-slate-400" />
                            </div>

                            <div className="space-y-1.5 z-10 mt-6 text-left">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Toplam Kullanılabilir Kredi</span>
                              <div className="text-3xl font-black tracking-tight flex items-baseline gap-1 text-[#c8f252]">
                                ₺{referralData ? referralData.balance.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "0.00"}
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-[10px] text-slate-400 font-bold z-10">
                              <span>Kullanıcı: {user?.name || "Esnaaf Üyesi"}</span>
                              <span>Aktif</span>
                            </div>
                          </div>

                          {/* Right: Referral code & Invite program info */}
                          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[28px] p-6 shadow-sm flex flex-col justify-between gap-6">
                            <div className="space-y-3 text-left">
                              <h4 className="font-extrabold text-slate-800 text-sm">Arkadaşını Davet Et & Kazan! 🎁</h4>
                              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                                Esnaaf'a davet ettiğin her arkadaşın ilk hizmet talebini tamamladığında, cüzdanına **100 TL** bakiye yüklenir! 
                                Üstelik davet ettiğin arkadaşın da kayıt olup ilk talebini oluştururken **100 TL** değerinde indirim/kredi elde eder.
                              </p>
                            </div>

                            {/* Referral Code Display */}
                            <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                              <div className="text-center sm:text-left">
                                <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">Senin Referans Kodun</span>
                                <span className="text-sm font-black text-slate-850 tracking-wide uppercase select-all">
                                  {referralData?.code || "YÜKLENİYOR..."}
                                </span>
                              </div>
                              
                              <button
                                onClick={() => referralData?.code && handleCopyCode(referralData.code)}
                                className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black py-2.5 px-4 rounded-xl cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
                              >
                                {copied ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-[#c8f252]" />
                                    <span>Kopyalandı!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Kodu Kopyala</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Left: Apply referral code */}
                          <div className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-sm flex flex-col gap-5 text-left">
                            <h4 className="font-extrabold text-slate-850 text-sm">Davet Kodu Gir</h4>
                            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                              Sizi Esnaaf'a davet eden arkadaşınızın kodunu aşağıya girerek anında hesabınızı ödüllendirebilirsiniz. 
                              Her üye yalnızca tek bir davet kodu uygulayabilir.
                            </p>

                            {referralMessage && (
                              <div className={`px-4 py-3 rounded-xl text-xs font-bold animate-scale-up border ${
                                referralMessage.type === "success" 
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                                  : "bg-red-50 border-red-200 text-red-800"
                              }`}>
                                {referralMessage.type === "success" ? "✓ " : "✗ "}
                                {referralMessage.text}
                              </div>
                            )}

                            {referralData?.isReferralApplied ? (
                              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold text-xs shrink-0">
                                  ✓
                                </div>
                                <div>
                                  <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">Uygulanmış Davet Kodu</span>
                                  <span className="text-xs font-black text-slate-700 uppercase">{referralData.appliedReferralCode}</span>
                                </div>
                              </div>
                            ) : (
                              <form onSubmit={handleSubmitReferralCode} className="flex gap-2">
                                <input
                                  type="text"
                                  required
                                  placeholder="Örn: EMRE9096"
                                  value={referralCodeInput}
                                  onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                                  className="bg-slate-50 border border-slate-200 focus:border-[#c8f252] rounded-xl p-3 outline-none text-xs font-bold text-slate-850 flex-grow uppercase transition-colors"
                                />
                                <button
                                  type="submit"
                                  disabled={submittingReferral}
                                  className="bg-slate-900 hover:bg-slate-855 text-white disabled:bg-slate-400 text-xs font-black px-6 rounded-xl cursor-pointer transition-all active:scale-95 shrink-0"
                                >
                                  {submittingReferral ? "Uygulanıyor..." : "Uygula"}
                                </button>
                              </form>
                            )}
                          </div>

                          {/* Right: Referrals History */}
                          <div className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-sm flex flex-col gap-4 text-left">
                            <h4 className="font-extrabold text-slate-850 text-sm">Davet Ettiklerim</h4>
                            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                              Paylaştığınız kod ile kayıt olan arkadaşlarınız ve kazandırma durumları.
                            </p>

                            <div className="overflow-y-auto max-h-[220px] scrollbar-none space-y-3">
                              {referralData && referralData.referralsMade.length > 0 ? (
                                referralData.referralsMade.map((invite: any) => (
                                  <div 
                                    key={invite.id} 
                                    className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all hover:bg-slate-50"
                                  >
                                    <div className="space-y-0.5 text-left">
                                      <span className="block text-xs font-extrabold text-slate-800">{invite.refereeName}</span>
                                      <span className="block text-[10px] text-slate-400 font-bold">{invite.refereePhoneMasked}</span>
                                    </div>

                                    <div className="text-right">
                                      {invite.rewarded ? (
                                        <>
                                          <span className="inline-block bg-emerald-50 text-emerald-700 text-[9px] font-black tracking-wide uppercase px-2.5 py-1 rounded-lg border border-emerald-100">
                                            +100 ₺ Kazanıldı
                                          </span>
                                          <span className="block text-[8px] text-slate-400 font-bold mt-0.5">
                                            {new Date(invite.rewardedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <span className="inline-block bg-amber-50 text-amber-700 text-[9px] font-black tracking-wide uppercase px-2.5 py-1 rounded-lg border border-amber-100">
                                            İlk İş Bekleniyor
                                          </span>
                                          <span className="block text-[8px] text-slate-400 font-bold mt-0.5">
                                            Davet: {new Date(invite.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                                  Henüz kimseyi davet etmediniz. Kodu kopyalayarak arkadaşlarınızla paylaşın!
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* VIEW 8: FAVORİ LİSTESİ & DOĞRUDAN İŞ TEKLİFİ */}
                {activeTab === "favoriler" && (
                  <div className="space-y-8 animate-scale-up text-left">
                    <header>
                      <h2 className="font-extrabold text-slate-900 tracking-tight text-2xl md:text-3xl leading-snug">
                        Favori Hizmet Verenlerim
                      </h2>
                      <p className="text-slate-400 text-xs mt-1 font-semibold leading-relaxed">
                        Güvendiğiniz hizmet verenleri ekleyin, doğrudan teklif isteyin ve sadık müşteri isteklerini onaylayın.
                      </p>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Sol kolon: Eşleşme ID Kartı & Usta Arama */}
                      <div className="lg:col-span-1 space-y-6">
                        {/* Esnaaf ID & QR Kod Kartı */}
                        <div className="bg-slate-900 p-6 rounded-[28px] border border-slate-800 shadow-md hover:shadow-lg transition-all flex flex-col justify-between text-white relative overflow-hidden min-h-[160px]">
                          {/* Decorative glow */}
                          <div className="absolute top-[-30px] right-[-30px] w-20 h-20 rounded-full bg-[#c8f252]/10 blur-xl"></div>
                          
                          <div className="flex justify-between items-start z-10 gap-3">
                            <div className="text-left space-y-1">
                              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest font-mono">Kolay Eşleşme ID</span>
                              <div className="text-xl font-black text-[#c8f252] tracking-wide uppercase select-all font-mono">
                                {esnaafId || 'Yükleniyor...'}
                              </div>
                              <p className="text-[9px] text-slate-400 font-semibold leading-relaxed pt-1">
                                Hizmet veren (esnaf) bu ID'yi kendi panelinde "Sadık Müşterilerim" bölümüne ekleyerek sizinle özel komisyon avantajıyla eşleşebilir.
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

                        {/* Hizmet Veren Arama & Ekleme */}
                        <div className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-sm flex flex-col gap-5 text-left h-fit">
                          <h4 className="font-extrabold text-slate-850 text-sm">Esnaaf ID ile Hizmet Veren Bul</h4>
                          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                            Hizmet vereninizin Esnaaf ID'sini (Örn: ESN-K3T9X) girerek favori listenize doğrudan ekleyebilirsiniz.
                          </p>
                          
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Örn: ESN-K3T9X"
                              value={searchEsnaafId}
                              onChange={(e) => setSearchEsnaafId(e.target.value.toUpperCase())}
                              className="bg-slate-50 border border-slate-200 focus:border-[#c8f252] rounded-xl p-3 outline-none text-xs font-bold text-slate-850 flex-grow uppercase transition-colors"
                            />
                            <button
                              onClick={handleSearchUsta}
                              disabled={isSearching}
                              className="bg-slate-900 hover:bg-slate-800 text-white disabled:bg-slate-400 text-xs font-black px-4 rounded-xl cursor-pointer transition-all active:scale-95 shrink-0"
                            >
                              {isSearching ? "Aranıyor..." : "Ara"}
                            </button>
                          </div>

                          {searchError && (
                            <div className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl border border-red-200">
                              {searchError}
                            </div>
                          )}

                          {searchResult && (
                            <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex flex-col gap-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="block text-xs font-extrabold text-slate-800">{searchResult.name}</span>
                                  <span className="block text-[9px] font-bold text-slate-400">ID: {searchResult.esnaaf_id}</span>
                                </div>
                                <span className="bg-[#c8f252]/10 border border-[#c8f252]/30 text-slate-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-md">
                                  Hizmet Veren
                                </span>
                              </div>
                              <button
                                onClick={() => handleAddUsta(searchResult.esnaaf_id)}
                                className="w-full bg-[#c8f252] hover:bg-[#b5e639] text-slate-900 font-bold text-xs py-2 rounded-xl"
                              >
                                Favorilerime Ekle
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Sağ kolon: Favori Hizmet Verenler & Onay Bekleyen Talepler */}
                      <div className="lg:col-span-2 space-y-6">
                        {/* Onay Bekleyen Sadık Müşteri İstekleri */}
                        {loyaltyRequests.length > 0 && (
                          <div className="bg-amber-50/50 border border-amber-100 rounded-[28px] p-6 shadow-inner space-y-4">
                            <h3 className="font-extrabold text-amber-900 text-sm">Onay Bekleyen Sadık Hizmet Veren Bağlantıları</h3>
                            <div className="space-y-3">
                              {loyaltyRequests.map((req) => (
                                <div key={req.id} className="bg-white border border-amber-200/60 rounded-2xl p-4 flex items-center justify-between gap-4">
                                  <div className="text-left">
                                    <span className="block text-xs font-extrabold text-slate-800">{req.provider?.user?.name || "Hizmet Veren"}</span>
                                    <span className="block text-[9px] text-slate-400 font-bold">ID: {req.provider?.user?.esnaaf_id}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleRejectLoyalty(req.id)}
                                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all"
                                    >
                                      Reddet
                                    </button>
                                    <button
                                      onClick={() => handleApproveLoyalty(req.id)}
                                      className="bg-[#c8f252] hover:bg-[#b5e639] text-slate-900 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all"
                                    >
                                      Onayla
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Favori Hizmet Verenler Listesi */}
                        <div className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-sm space-y-4 text-left">
                          <h3 className="font-extrabold text-slate-800 text-sm">Kayıtlı Favori Hizmet Verenlerim</h3>
                          
                          {favorites.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {favorites.map((fav) => {
                                const prov = fav.provider;
                                return (
                                  <div key={fav.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all hover:shadow-md">
                                    <div className="flex justify-between items-start">
                                      <div className="text-left">
                                        <span className="block text-xs font-extrabold text-slate-800">{prov?.user?.name}</span>
                                        <span className="block text-[9px] text-slate-400 font-bold mb-1">Esnaaf ID: {prov?.user?.esnaaf_id}</span>
                                        {prov?.avg_rating && (
                                          <div className="flex items-center gap-1 text-[10px] font-extrabold text-amber-500">
                                            ★ {parseFloat(prov.avg_rating).toFixed(1)}
                                          </div>
                                        )}
                                      </div>
                                      <button
                                        onClick={() => handleRemoveFavorite(prov.id)}
                                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                        title="Favorilerden Kaldır"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => setDirectRequestProvider(prov)}
                                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold py-2 rounded-xl transition-all"
                                      >
                                        Özel İş İste
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                              Henüz favori hizmet vereniniz bulunmamaktadır. Esnaaf ID arama kutusundan ekleme yapabilirsiniz.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Direct Request Modal Form */}
                {directRequestProvider && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[28px] border border-slate-100 p-6 max-w-md w-full shadow-2xl animate-scale-up space-y-5 text-left">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">
                          {directRequestProvider.user?.name} Adlı Hizmet Verene Özel İş Talebi
                        </h4>
                        <p className="text-slate-400 text-xs mt-0.5">
                          Bu talep genel havuzda yayınlanmayacak, sadece bu hizmet verene iletilecektir.
                        </p>
                      </div>

                      <form onSubmit={handleCreateDirectRequest} className="space-y-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-500">Hizmet Kategorisi:</label>
                          <select
                            value={directCategorySlug}
                            onChange={(e) => setDirectCategorySlug(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-[#c8f252] rounded-xl p-3 outline-none text-xs font-bold text-slate-800"
                          >
                            {directRequestProvider.categories && directRequestProvider.categories.length > 0 ? (
                              directRequestProvider.categories.map((cat: any) => (
                                <option key={cat.slug} value={cat.slug}>
                                  {cat.name}
                                </option>
                              ))
                            ) : (
                              <>
                                <option value="ev-temizligi">Ev Temizliği</option>
                                <option value="boya-badana">Boya Badana</option>
                                <option value="su-tesisati">Su Tesisatı</option>
                                <option value="elektrik-tesisati">Elektrik Tesisatı</option>
                                <option value="ev-tadilat">Ev Tadilatı</option>
                                <option value="nakliyat">Nakliyat / Taşıma</option>
                              </>
                            )}
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-500">İlçe / Bölge:</label>
                          <input
                            type="text"
                            required
                            placeholder="Örn: Kadıköy"
                            value={directDistrict}
                            onChange={(e) => setDirectDistrict(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-[#c8f252] rounded-xl p-3 outline-none text-xs font-bold text-slate-800"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-500">İş Detayları ve Talebiniz:</label>
                          <textarea
                            required
                            rows={4}
                            placeholder="Lütfen yapılacak işi, tarih tercihlerinizi ve varsa detayları detaylıca yazınız..."
                            value={directDetails}
                            onChange={(e) => setDirectDetails(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-[#c8f252] rounded-xl p-3 outline-none text-xs font-semibold text-slate-800 resize-none"
                          />
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setDirectRequestProvider(null)}
                            className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-3 rounded-xl transition-all"
                          >
                            Vazgeç
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmittingDirect}
                            className="flex-1 bg-[#c8f252] hover:bg-[#b5e639] disabled:bg-slate-350 text-slate-950 text-xs font-black py-3 rounded-xl transition-all"
                          >
                            {isSubmittingDirect ? "Gönderiliyor..." : "Talebi Gönder"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
            </>
          )}

        </div>

        {/* Floating lime-green "+" button strictly matching the mockup at bottom right */}
        <button
          onClick={() => onLogout()}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#c8f252] hover:bg-[#b5e639] text-slate-950 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer z-50 border border-transparent"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>

        {/* PROVIDER PROFILE OVERLAY MODAL */}
        {selectedProviderProfile && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col animate-scale-up text-left">
              {/* Sticky Header */}
              <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
                <button
                  onClick={() => setSelectedProviderProfile(null)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-slate-500"
                  title="Geri"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="font-extrabold text-slate-800 text-sm tracking-tight">Usta Profili</span>
                <div className="w-10"></div> {/* Spacer to center title */}
              </div>

              {/* Profile Body */}
              <div className="p-6 md:p-8 flex flex-col gap-8">
                
                {/* Basic Info Header Card */}
                <div className="flex flex-col items-center text-center gap-4 bg-slate-50/50 p-6 rounded-[28px] border border-slate-100">
                  <div className="w-20 h-20 rounded-full bg-[#c8f252] text-slate-950 flex items-center justify-center font-black text-2xl select-none shadow-md border border-[#c8f252]/20">
                    {selectedProviderProfile.name ? selectedProviderProfile.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) : "US"}
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5 justify-center">
                      {selectedProviderProfile.name}
                      {selectedProviderProfile.is_approved && (
                        <span className="text-slate-950 bg-[#c8f252] p-0.5 rounded-full border border-[#c8f252]/30" title="Onaylı Esnaf">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </h3>
                    
                    {/* Rating summary */}
                    <div className="flex items-center gap-1.5 justify-center text-xs font-bold text-slate-500">
                      <div className="flex items-center text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg
                            key={i}
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-4.5 w-4.5 ${i < Math.round(selectedProviderProfile.avg_rating) ? "fill-current" : "text-slate-200"}`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-slate-800 font-extrabold">{Number(selectedProviderProfile.avg_rating).toFixed(1)}</span>
                      <span>({selectedProviderProfile.reviews?.length || 0} onaylı yorum)</span>
                    </div>
                  </div>

                  {/* Masked phone and action buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-2 w-full max-w-sm">
                    <a 
                      href={`tel:${selectedProviderProfile.phone_masked}`}
                      onClick={(e) => {
                        if (selectedProviderProfile.phone_masked.includes("*")) {
                          e.preventDefault();
                          alert("Telefon numarasını aramak için öncelikle ustanın teklifini kabul etmelisiniz.");
                        }
                      }}
                      className="flex-1 bg-[#c8f252] hover:bg-[#b5e639] text-slate-955 text-xs font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all border border-transparent shadow-sm"
                    >
                      <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      <span>Ara</span>
                    </a>
                    
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.origin);
                        alert("Esnaaf tavsiye bağlantısı kopyalandı!");
                      }}
                      className="flex-1 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all border border-slate-200"
                    >
                      <span>🔗 Tavsiye Et</span>
                    </button>

                    <button 
                      onClick={() => handleAddToFavorites(selectedProviderProfile.id)}
                      disabled={isAddedToFavorites}
                      className={`flex-1 text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all border ${
                        isAddedToFavorites
                          ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                          : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      <span>
                        {isAddedToFavorites
                          ? "❤️ Favorilerinizde"
                          : "❤️ Favorilere Ekle"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Customer reviews block (Müşteri Yorumları) */}
                <div className="flex flex-col gap-5 border-b border-slate-100 pb-8">
                  <h4 className="text-base font-black text-slate-950 tracking-tight">Müşteri Yorumları</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-slate-50/30 p-5 rounded-2xl border border-slate-100">
                    <div className="flex flex-col items-center justify-center text-center">
                      <span className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                        {Number(selectedProviderProfile.avg_rating).toFixed(1)}
                      </span>
                      <div className="flex items-center text-amber-400 my-1.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 ${i < Math.round(selectedProviderProfile.avg_rating) ? "fill-current" : "text-slate-200"}`} viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase">({selectedProviderProfile.reviews?.length || 0} onaylı yorum)</span>
                    </div>

                    <div className="md:col-span-2 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span>Memnuniyet Oranı</span>
                        <span className="text-[#a4cd1f] font-extrabold">% {selectedProviderProfile.satisfaction_rate}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#c8f252] rounded-full transition-all duration-500" 
                          style={{ width: `${selectedProviderProfile.satisfaction_rate}%` }}
                        ></div>
                      </div>
                      <p className="text-[11px] text-slate-500 font-semibold mt-1">
                        Bu hizmet verenle çalışan {selectedProviderProfile.reviews?.length || 0} müşteriden{" "}
                        {Math.round(((selectedProviderProfile.reviews?.length || 0) * selectedProviderProfile.satisfaction_rate) / 100)}{" "}
                        tanesi memnun kaldı.
                      </p>
                    </div>
                  </div>

                  {/* List of Individual Reviews */}
                  <div className="flex flex-col gap-3.5 max-h-[300px] overflow-y-auto pr-1">
                    {selectedProviderProfile.reviews && selectedProviderProfile.reviews.length > 0 ? (
                      selectedProviderProfile.reviews.map((review: any) => (
                        <div key={review.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2 hover:border-slate-200 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-800 text-xs">{review.reviewer_name}</span>
                              <span className="text-[10px] text-slate-400 font-bold mt-0.5">{review.category_name}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {new Date(review.created_at).toLocaleDateString("tr-TR", { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex items-center text-amber-400">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 ${i < review.rating ? "fill-current" : "text-slate-200"}`} viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          {review.comment && (
                            <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">
                              &ldquo;{review.comment}&rdquo;
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 font-medium italic text-center py-4">Henüz yorum yapılmamış.</p>
                    )}
                  </div>
                </div>

                {/* Photos (Fotoğraflar) */}
                <div className="flex flex-col gap-3.5 border-b border-slate-100 pb-8">
                  <h4 className="text-base font-black text-slate-950 tracking-tight">Fotoğraflar</h4>
                  {selectedProviderProfile.description?.referencePhotos && selectedProviderProfile.description.referencePhotos.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {selectedProviderProfile.description.referencePhotos.map((photo: string, index: number) => (
                        <div key={index} className="aspect-square rounded-2xl overflow-hidden border border-slate-150 bg-slate-50 relative group">
                          <img src={photo} alt={`Referans ${index + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-medium italic">Henüz fotoğraf yok.</p>
                  )}
                </div>

                {/* Activity (Aktivite) */}
                <div className="flex flex-col gap-3.5 border-b border-slate-100 pb-8">
                  <h4 className="text-base font-black text-slate-950 tracking-tight">Aktivite</h4>
                  <div className="flex items-center gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <span className="w-9 h-9 rounded-xl bg-[#c8f252] text-slate-950 flex items-center justify-center font-bold text-sm">
                      💼
                    </span>
                    <div className="flex flex-col">
                      <span className="font-extrabold text-slate-800 text-xs">{selectedProviderProfile.total_jobs} İş Tamamladı</span>
                      <span className="text-[10px] text-slate-400 font-bold mt-0.5">Platform üzerindeki toplam tamamlanan iş</span>
                    </div>
                  </div>
                </div>

                {/* Verification (Doğrulandı) */}
                <div className="flex flex-col gap-3.5 border-b border-slate-100 pb-8">
                  <h4 className="text-base font-black text-slate-950 tracking-tight">Doğrulandı</h4>
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <span className="text-emerald-500">✓</span>
                      <span>Telefon numarası</span>
                    </div>
                    {selectedProviderProfile.is_approved && (
                      <>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                          <span className="text-emerald-500">✓</span>
                          <span>Kimlik belgesi doğrulanmış esnaf</span>
                        </div>
                        {selectedProviderProfile.description?.companyType === "corporate" && (
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                            <span className="text-emerald-500">✓</span>
                            <span>Vergi levhası doğrulanmış kurum</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* About (Hakkında) */}
                <div className="flex flex-col gap-3.5 border-b border-slate-100 pb-8">
                  <h4 className="text-base font-black text-slate-950 tracking-tight">Hakkında</h4>
                  <p className="text-xs md:text-sm text-slate-600 font-semibold leading-relaxed whitespace-pre-line">
                    {selectedProviderProfile.description?.descriptionText || "Açıklama belirtilmedi."}
                  </p>
                </div>

                {/* Service Areas (Hizmet Alanları) */}
                <div className="flex flex-col gap-3.5 border-b border-slate-100 pb-8">
                  <h4 className="text-base font-black text-slate-950 tracking-tight">Hizmet Alanları</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProviderProfile.categories && selectedProviderProfile.categories.length > 0 ? (
                      selectedProviderProfile.categories.map((catName: string, index: number) => (
                        <span key={index} className="px-3.5 py-1.5 bg-[#c8f252] text-slate-950 text-[10px] font-black rounded-full uppercase tracking-wider border border-[#c8f252]/20">
                          {catName}
                        </span>
                      ))
                    ) : (
                      <span className="px-3.5 py-1.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full uppercase tracking-wider">
                        Genel Esnaf Hizmetleri
                      </span>
                    )}
                  </div>
                </div>

                {/* Location (Konum) */}
                <div className="flex flex-col gap-3.5">
                  <h4 className="text-base font-black text-slate-950 tracking-tight">Konum</h4>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-black text-slate-800 tracking-tight">
                      {selectedProviderProfile.city}
                    </span>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                      Hizmet verilen ilçeler: {selectedProviderProfile.service_districts && selectedProviderProfile.service_districts.length > 0 ? selectedProviderProfile.service_districts.join(", ") : "Tüm il genelinde."}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Beautiful Custom Confirm Modal */}
        {confirmModal.isOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-[28px] border border-slate-100 p-6 max-w-sm w-full shadow-2xl animate-scale-up space-y-5 text-center">
              <div className="w-12 h-12 rounded-full bg-[#c8f252]/20 border border-[#c8f252]/40 flex items-center justify-center mx-auto text-[#4c630a] shadow-inner">
                <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
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
                  className="flex-1 bg-[#c8f252] hover:bg-[#b5e639] text-slate-955 text-xs font-black py-2.5 rounded-xl cursor-pointer transition-all active:scale-95 border border-transparent shadow-sm"
                >
                  Onayla
                </button>
              </div>
            </div>
          </div>
        )}



      </main>

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
