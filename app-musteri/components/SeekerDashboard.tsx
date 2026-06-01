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
  Activity
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

interface Offer {
  id: string;
  price: number;
  description: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  provider: {
    id: string;
    user: {
      name: string;
      phone_masked: string;
    };
  };
}

interface RequestItem {
  id: string;
  status: "pending" | "distributed" | "completed" | "cancelled";
  created_at: string;
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
}

interface SeekerDashboardProps {
  initialJobId?: string | null;
  onLogout: () => void;
}

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

export default function SeekerDashboard({ initialJobId, onLogout }: SeekerDashboardProps) {
  // Navigation tabs matching sidebar
  const [activeTab, setActiveTab] = useState<"tekliflerim" | "canlobi" | "karsilastirma" | "mesajlar" | "puanlama" | "profile">("tekliflerim");
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Form states for profile edit
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");

  // Completion/Rating states (Step 6 / Phase 2)
  const [completionState, setCompletionState] = useState<string | null>(null);
  const [providerName, setProviderName] = useState("");
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
  const [mutualPhones, setMutualPhones] = useState<{ seekerPhone?: string; providerPhone?: string } | null>(null);

  // UI state for grid / list view
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const socketRef = useRef<Socket | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch initial profile
  useEffect(() => {
    const authUser = getAuthUser();
    if (authUser) {
      setUser(authUser);
      setProfileName(authUser.name || "");
      setProfileEmail(authUser.email || "");
    }
    fetchRequests();
  }, []);

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

  // Connect to Socket.io for selectedRequest
  useEffect(() => {
    if (!selectedRequest) return;

    // Reset temporary interactive states
    setCompletionState(null);
    setProviderName("");
    setProviderDeclaredAmount(null);
    setProviderId(null);
    setShowDiscrepancyForm(false);
    setSelectedRating(0);
    setRatingSubmitted(false);
    setCommentText("");
    setPhotoPreview(null);
    setPhotoFile(null);
    setIsAddedToFavorites(false);
    setMutualPhones(null);

    // If request already has accepted offers, check if we can populate mutual details
    const acceptedOffer = selectedRequest.offers?.find(o => o.status === 'accepted');
    if (acceptedOffer) {
      setProviderId(acceptedOffer.provider.id);
      setProviderName(acceptedOffer.provider.user.name);
    }

    console.log(`[Dashboard WS] Connecting for request ${selectedRequest.id}`);
    const socket = io(process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3005/chat", {
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(`[Dashboard WS] Connected, joining room: job_${selectedRequest.id}`);
      socket.emit("join_job", { jobId: selectedRequest.id });
    });

    // Real-time incoming offer
    socket.on("new_offer", (offer: any) => {
      console.log("[Dashboard WS] New offer received:", offer);
      // Append offer to selected request in state
      const newOfferObj: Offer = {
        id: offer.offerId,
        price: offer.price,
        description: offer.description,
        status: "pending",
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
          if (req.id === selectedRequest.id) {
            const updatedOffers = [...(req.offers || []), newOfferObj];
            const updatedReq = { ...req, offers: updatedOffers };
            setSelectedRequest(updatedReq);
            return updatedReq;
          }
          return req;
        })
      );
    });

    // Provider job completion declaration (Step 6)
    socket.on("job_completed_by_provider", (data: any) => {
      console.log("[Dashboard WS] Job completed by provider:", data);
      setProviderName(data.providerName);
      setProviderDeclaredAmount(data.price);
      if (data.providerId) {
        setProviderId(data.providerId);
      }
      setCompletionState("pending_seeker");
    });

    // Finalized completion status (Step 6)
    socket.on("job_completion_finalized", (data: any) => {
      console.log("[Dashboard WS] Job completion finalized:", data);
      setCompletionState(data.status);
      
      // Update selected request status locally
      setRequests((prev) =>
        prev.map((req) => {
          if (req.id === selectedRequest.id) {
            const updatedReq = { ...req, status: (data.status === "completed" ? "completed" : req.status) as any };
            setSelectedRequest(updatedReq);
            return updatedReq;
          }
          return req;
        })
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedRequest?.id]);

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

  const handleCancelRequest = async (id: string) => {
    const confirm = window.confirm("Talebinizi iptal etmek istediğinize emin misiniz? Bekleyen tüm teklifler de iptal edilecektir.");
    if (!confirm) return;

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
  };

  const handleAcceptOffer = async (offer: Offer) => {
    const confirm = window.confirm(`${offer.provider.user.name} teklifini kabul etmek istediğinize emin misiniz?\n\nKarşılıkli telefon numaralarınız görüntülenecektir.`);
    if (!confirm) return;

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
  };

  const handleConfirmCompletion = async (isConfirmed: boolean) => {
    if (!selectedRequest) return;
    try {
      const payload: any = { jobId: selectedRequest.id };
      
      if (isConfirmed) {
        payload.confirmed = true;
        payload.declaredAmount = providerDeclaredAmount;
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
        setRatingSubmitted(true);
        alert("Değerlendirmeniz başarıyla gönderildi!");
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

  const handleAddToFavorites = async () => {
    if (!providerId) return;
    try {
      const res = await customFetch("/api/ortak/favoriler/ekle", {
        method: "POST",
        body: JSON.stringify({ provider_id: providerId }),
      });
      if (res.ok) {
        setIsAddedToFavorites(true);
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col md:flex-row antialiased font-sans select-none overflow-x-hidden">
      
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
              <span className="ml-auto w-5 h-5 rounded-full bg-slate-900 text-[#c8f252] text-[10px] flex items-center justify-center font-black">
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

        {/* Sidebar bottom action button strictly matching mockup */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col gap-3">
          <button
            onClick={() => onLogout()}
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
                {activeTab === "tekliflerim" ? "Teklif Kontrol Paneli" : activeTab === "canlobi" ? "Canlı Lobi" : activeTab === "karsilastirma" ? "Karşılaştırma" : activeTab === "mesajlar" ? "Mesajlar" : activeTab === "puanlama" ? "İş Teyit" : "Hesap"}
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-slate-850 transition-colors p-2 hover:bg-slate-50 rounded-xl relative cursor-pointer">
              <Bell className="w-4.5 h-4.5 text-slate-500" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
            </button>

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
                  <section className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-black text-slate-800 text-base">Aktif Teklifler</h3>
                      <a href="#" onClick={() => alert("Tüm aktif teklifleriniz zaten listelenmiştir.")} className="text-slate-400 hover:text-slate-800 text-xs font-extrabold flex items-center gap-1">
                        <span>Tümünü Gör</span>
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    </div>

                    {/* Filter bar exactly matching mockup style */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                      <div className="flex items-center gap-2">
                        <button className="bg-slate-50 border border-slate-200 hover:border-[#4c630a]/40 text-slate-700 text-xs font-bold py-2 px-3.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-sm">
                          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                          <span>SIRALA: En Düşük Fiyat</span>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        </button>

                        <button className="bg-slate-50 border border-slate-200 hover:border-[#4c630a]/40 text-slate-700 text-xs font-bold py-2 px-3.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-sm">
                          <Filter className="w-3.5 h-3.5 text-slate-500" />
                          <span>FİLTRELE</span>
                        </button>
                      </div>

                      {/* View mode toggle chips */}
                      <div className="flex items-center gap-2.5 text-xs text-slate-400 font-bold">
                        <span>GÖRÜNÜM:</span>
                        <div className="flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/50">
                          <button 
                            onClick={() => setViewMode("grid")}
                            className={`p-1.5 rounded-md cursor-pointer transition-all ${viewMode === "grid" ? "bg-[#c8f252] text-slate-900" : "text-slate-400 hover:text-slate-700"}`}
                          >
                            <Grid className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => setViewMode("list")}
                            className={`p-1.5 rounded-md cursor-pointer transition-all ${viewMode === "list" ? "bg-[#c8f252] text-slate-900" : "text-slate-400 hover:text-slate-700"}`}
                          >
                            <List className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ACTIVE OFFERS STREAM */}
                    <div className="space-y-8">
                      {/* Render real requests first if database has active entries */}
                      {requests.length > 0 && requests.some(r => r.status === "pending" || r.status === "distributed") ? (
                        requests.filter(r => r.status === "pending" || r.status === "distributed").map((req) => {
                          const slug = req.category?.slug || "";
                          let categoryIcon = "🛠️";
                          if (slug.includes("temizlik")) categoryIcon = "🧹";
                          else if (slug.includes("nakliyet") || slug.includes("tasima")) categoryIcon = "🚚";
                          else if (slug.includes("klima") || slug.includes("kombi")) categoryIcon = "❄️";
                          else if (slug.includes("boya") || slug.includes("badana")) categoryIcon = "🎨";
                          else if (slug.includes("tadilat") || slug.includes("tamir")) categoryIcon = "🔧";

                          const createdDate = new Date(req.created_at).toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric"
                          });

                          const offerCount = req.offers?.length || 0;

                          return (
                            <div key={req.id} className="bg-white rounded-[32px] border border-slate-100 p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.025)] transition-all duration-300 space-y-6">
                              {/* 🚀 Premium Group Header */}
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                                <div className="flex items-start gap-4">
                                  {/* Category Icon Circle */}
                                  <div className="w-12 h-12 rounded-2xl bg-[#c8f252]/10 border border-[#c8f252]/20 flex items-center justify-center shrink-0 overflow-hidden">
                                    <img 
                                      src="/logo-icon.png" 
                                      alt="Esnaaf Logo Icon" 
                                      className="w-8 h-8 object-contain" 
                                    />
                                  </div>
                                  
                                  <div className="space-y-1 text-left">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h3 
                                        className="font-black text-slate-900 text-lg md:text-xl hover:underline cursor-pointer tracking-tight"
                                        onClick={() => setSelectedRequest(req)}
                                      >
                                        {req.category?.name || "Hizmet Talebi"}
                                      </h3>
                                      
                                      <span className="bg-slate-100 text-slate-500 font-extrabold text-[10px] px-2.5 py-1 rounded-lg border border-slate-200/50">
                                        {`#TR-${req.id.substring(0, 5).toUpperCase()}`}
                                      </span>

                                      {offerCount > 0 ? (
                                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black tracking-wide uppercase px-2.5 py-1 rounded-lg border border-emerald-100">
                                          {offerCount} Teklif Alındı
                                        </span>
                                      ) : (
                                        <span className="bg-[#c8f252]/15 text-[#4c630a] text-[10px] font-black tracking-wide uppercase px-2.5 py-1 rounded-lg border border-[#c8f252]/20 animate-pulse">
                                          TEKLİF BEKLENİYOR
                                        </span>
                                      )}
                                    </div>

                                    {/* Quick Metadata Tags */}
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-400 font-bold pt-1">
                                      <span className="flex items-center gap-1">
                                        📍 {req.form_data.district || "Bilinmiyor"}{req.form_data.district ? `, ${req.form_data.city || resolveCityFromDistrict(req.form_data.district)}` : ''}
                                      </span>
                                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                      <span className="flex items-center gap-1">
                                        📅 {req.form_data.tarih || createdDate}
                                      </span>
                                      {req.form_data.butce && (
                                        <>
                                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                          <span className="flex items-center gap-1 text-slate-600">
                                            💰 ₺{Number(req.form_data.butce).toLocaleString("tr-TR")}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Header Right Actions */}
                                <div className="flex items-center gap-2 self-end md:self-center">
                                  <button 
                                    onClick={() => setSelectedRequest(req)}
                                    className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] font-black py-2.5 px-4 rounded-xl cursor-pointer transition-all border border-slate-200 shadow-sm active:scale-95 flex items-center gap-1"
                                  >
                                    Detayları İncele
                                  </button>
                                  <button 
                                    onClick={() => handleCancelRequest(req.id)}
                                    className="bg-white hover:bg-red-50 text-red-500 hover:text-red-700 border border-slate-200 hover:border-red-100 text-[10px] font-black py-2.5 px-4 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm"
                                  >
                                    İptal Et
                                  </button>
                                </div>
                              </div>

                              {/* 📥 Offers Nested List / Grid */}
                              <div>
                                {!req.offers || req.offers.length === 0 ? (
                                  /* Real-time Radar Scan Waiting Panel */
                                  <div className="flex flex-col items-center justify-center py-10 px-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/80 text-center gap-2.5">
                                    <span className="relative flex h-3 w-3">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c8f252] opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#c8f252]"></span>
                                    </span>
                                    <div className="space-y-1">
                                      <p className="text-xs text-slate-500 font-extrabold tracking-wide uppercase">Ustalar Taranıyor...</p>
                                      <p className="text-[11px] text-slate-400 font-semibold max-w-sm leading-relaxed">
                                        Talep sisteme iletildi. WebSocket canlı bağlantısı üzerinden ustaların teklifleri anlık olarak buraya yansıyacaktır.
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className={viewMode === "grid" ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "flex flex-col gap-4"}>
                                    {req.offers.map((offer) => (
                                      <div 
                                        key={offer.id}
                                        className="bg-white p-5 rounded-[24px] border border-slate-100/90 shadow-[0_4px_15px_rgba(15,23,42,0.015)] hover:shadow-[0_10px_25px_rgba(15,23,42,0.03)] hover:border-slate-200 transition-all duration-200 flex flex-col justify-between gap-4"
                                      >
                                        <div className="flex items-start gap-4">
                                          {/* Provider avatar */}
                                          <div className="relative shrink-0">
                                            <img
                                              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"
                                              alt={offer.provider.user.name}
                                              className="w-12 h-12 rounded-2xl object-cover border border-slate-250/50 shadow-sm"
                                            />
                                            <div className="absolute -bottom-1 -right-1 bg-white border border-[#c8f252] rounded-full p-0.5 shadow-sm flex items-center justify-center w-4 h-4 text-[#88b000] font-bold text-[8px]">
                                              ✓
                                            </div>
                                          </div>
                                          
                                          <div className="space-y-1.5 overflow-hidden text-left flex-1">
                                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                              <h4 className="font-extrabold text-sm text-slate-900 truncate">{offer.provider.user.name}</h4>
                                              <span className="text-[10px] text-amber-500 font-bold shrink-0">⭐ 4.8 (85 Yorum)</span>
                                            </div>
                                            <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                                              {offer.description}
                                            </p>
                                          </div>
                                        </div>

                                        {/* Footer Bid amount & Actions */}
                                        <div className="border-t border-slate-100/80 pt-4 flex items-center justify-between gap-4">
                                          <div className="text-left">
                                            <span className="text-lg font-black text-slate-900 tracking-tight">₺{offer.price.toLocaleString("tr-TR")}</span>
                                            <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-none mt-0.5">Teklif Tutarı</span>
                                          </div>

                                          <div className="flex items-center gap-2">
                                            <button 
                                              onClick={() => setSelectedRequest(req)}
                                              className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] font-black py-2.5 px-4 rounded-xl cursor-pointer transition-all border border-slate-200 active:scale-95"
                                            >
                                              Teklifi İncele
                                            </button>
                                            <button 
                                              onClick={() => handleAcceptOffer(offer)}
                                              className="bg-[#c8f252] hover:bg-[#b5e639] text-slate-950 text-[10px] font-black py-2.5 px-4 rounded-xl cursor-pointer transition-all shadow-sm active:scale-95 border border-transparent"
                                            >
                                              Teklifi Onayla
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : null}

                      {/* Mockup Active Offers from design mockup (Always rendered to show gorgeous aesthetics) */}
                      {MOCKUP_ACTIVE_OFFERS.map((group) => {
                        const offerCount = group.offers?.length || 0;
                        const categoryIcon = group.icon === "tools" ? "🛠️" : group.icon === "cleaning" ? "🧹" : "🛠️";

                        return (
                          <div key={group.id} className="bg-white rounded-[32px] border border-slate-100 p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.025)] transition-all duration-300 space-y-6">
                            {/* 🚀 Premium Group Header */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                              <div className="flex items-start gap-4">
                                {/* Category Icon Circle */}
                                <div className="w-12 h-12 rounded-2xl bg-[#c8f252]/10 border border-[#c8f252]/20 flex items-center justify-center shrink-0 overflow-hidden">
                                  <img 
                                    src="/logo-icon.png" 
                                    alt="Esnaaf Logo Icon" 
                                    className="w-8 h-8 object-contain" 
                                  />
                                </div>
                                
                                <div className="space-y-1 text-left">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 
                                      className="font-black text-slate-900 text-lg md:text-xl hover:underline cursor-pointer tracking-tight"
                                      onClick={() => alert("Bu mockup talebidir. Gerçek teklif akışlarını test etmek için anasayfadan canlı bir talep oluşturabilirsiniz!")}
                                    >
                                      {group.title}
                                    </h3>
                                    
                                    <span className="bg-slate-100 text-slate-500 font-extrabold text-[10px] px-2.5 py-1 rounded-lg border border-slate-200/50">
                                      {group.code}
                                    </span>

                                    {offerCount > 0 ? (
                                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black tracking-wide uppercase px-2.5 py-1 rounded-lg border border-emerald-100">
                                        {offerCount} Teklif Alındı
                                      </span>
                                    ) : (
                                      <span className="bg-[#c8f252]/15 text-[#4c630a] text-[10px] font-black tracking-wide uppercase px-2.5 py-1 rounded-lg border border-[#c8f252]/20 animate-pulse">
                                        TEKLİF BEKLENİYOR
                                      </span>
                                    )}
                                  </div>

                                  {/* Quick Metadata Tags */}
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-400 font-bold pt-1">
                                    <span className="flex items-center gap-1">
                                      📍 Adana, Seyhan
                                    </span>
                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                    <span className="flex items-center gap-1">
                                      📅 15 Haziran 2026
                                    </span>
                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                    <span className="flex items-center gap-1 text-slate-600">
                                      💰 ₺15.000
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Header Right Actions */}
                              <div className="flex items-center gap-2 self-end md:self-center">
                                <button 
                                  onClick={() => alert("Bu mockup talebidir. Gerçek teklif inceleme aksiyonlarını test etmek için lütfen anasayfadan yeni bir talep oluşturun!")}
                                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] font-black py-2.5 px-4 rounded-xl cursor-pointer transition-all border border-slate-200 shadow-sm active:scale-95 flex items-center gap-1"
                                >
                                  Detayları İncele
                                </button>
                                <button 
                                  onClick={() => alert("Mockup talebi iptal edilemez.")}
                                  className="bg-white hover:bg-red-50 text-red-500 hover:text-red-700 border border-slate-200 hover:border-red-100 text-[10px] font-black py-2.5 px-4 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm"
                                >
                                  İptal Et
                                </button>
                              </div>
                            </div>

                            {/* 📥 Offers Nested List / Grid */}
                            <div>
                              <div className={viewMode === "grid" ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "flex flex-col gap-4"}>
                                {group.offers.map((offer) => (
                                  <div 
                                    key={offer.id}
                                    className="bg-white p-5 rounded-[24px] border border-slate-100/90 shadow-[0_4px_15px_rgba(15,23,42,0.015)] hover:shadow-[0_10px_25px_rgba(15,23,42,0.03)] hover:border-slate-200 transition-all duration-200 flex flex-col justify-between gap-4 animate-scale-up"
                                  >
                                    <div className="flex items-start gap-4">
                                      <div className="relative shrink-0">
                                        <img 
                                          src={offer.avatar} 
                                          alt={offer.providerName} 
                                          className="w-12 h-12 rounded-2xl object-cover border border-slate-100 shadow-sm"
                                        />
                                        <div className="absolute -bottom-1 -right-1 bg-white border border-[#c8f252] rounded-full p-0.5 shadow-sm flex items-center justify-center w-4 h-4 text-[#88b000] font-bold text-[8px]">
                                          ✓
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-1.5 overflow-hidden text-left flex-1">
                                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                          <h4 className="font-extrabold text-sm text-slate-900 truncate">{offer.providerName}</h4>
                                          <span className="text-[10px] text-amber-500 font-bold shrink-0">⭐ {offer.rating} ({offer.reviewsCount} Yorum)</span>
                                        </div>
                                        <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                                          {offer.description}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-4">
                                      <div className="text-left">
                                        <span className="text-lg font-black text-slate-900 tracking-tight">₺{offer.price}</span>
                                        <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-none mt-0.5">Teklif Tutarı</span>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <button 
                                          onClick={() => alert("Bu mockup teklif inceleme penceresidir.")}
                                          className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] font-black py-2.5 px-4 rounded-xl cursor-pointer transition-all border border-slate-200 active:scale-95"
                                        >
                                          İncele
                                        </button>
                                        <button 
                                          onClick={() => alert("Mockup teklif kabulü başarıyla simüle edildi!")}
                                          className="bg-[#c8f252] hover:bg-[#b5e639] text-slate-950 text-[10px] font-black py-2.5 px-4 rounded-xl cursor-pointer transition-all shadow-sm active:scale-95 border border-transparent"
                                        >
                                          Onayla
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
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
                                          <div key={off.id} className="w-5 h-5 rounded-full bg-slate-900 text-[#c8f252] border border-white flex items-center justify-center font-bold text-[8px] select-none">
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
                                  ) : (
                                    <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider font-mono">
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
                    
                    <button
                      onClick={() => handleCancelRequest(selectedRequest.id)}
                      className="ml-auto bg-white hover:bg-red-50 text-red-500 hover:text-red-700 border border-slate-200 hover:border-red-200 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm"
                    >
                      İptal Et
                    </button>
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
                      
                      {/* Mutual Phone display if offer accepted */}
                      {mutualPhones && (
                        <div className="w-full flex flex-col p-5 bg-[#c8f252]/10 border border-[#c8f252]/40 shadow-sm rounded-[24px] animate-scale-up gap-3.5">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">📞</span>
                            <div className="flex flex-col">
                              <span className="font-extrabold text-sm text-slate-900">Usta İletişim Bilgileri</span>
                              <span className="text-[10px] text-slate-600 font-bold">Telefon Numaraları Karşılıklı Açıldı</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-xs font-bold bg-white p-4 rounded-xl shadow-inner border border-slate-100">
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Usta Telefon</span>
                              <span className="text-slate-900 text-sm font-extrabold mt-0.5 block">{mutualPhones.providerPhone}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Sizin Telefonunuz</span>
                              <span className="text-slate-900 text-sm font-extrabold mt-0.5 block">{mutualPhones.seekerPhone}</span>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-600 font-medium italic">
                            * Ustanızla doğrudan iletişime geçip randevulaşabilirsiniz. İş tamamlandığında beyanları teyit etmeyi unutmayınız.
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
                              <span className="text-xs text-slate-500 font-bold">Usta İş Sonu Ücret Beyanı</span>
                            </div>
                          </div>

                          {!showDiscrepancyForm ? (
                            <>
                              <p className="text-sm text-slate-600 leading-relaxed font-semibold">
                                <strong>{providerName || "Usta"}</strong> işi bitirdiğini ve sizden <strong>{providerDeclaredAmount} ₺</strong> aldığını beyan etti.
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
                                Ücret teyidi başarıyla sağlandı ve iş başarıyla kapatıldı. Ustanızı değerlendirebilirsiniz!
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
                                        placeholder="Ustanızın hizmet kalitesi hakkında yorum yazın..."
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
                                    onClick={handleAddToFavorites}
                                    className="flex items-center gap-2 border border-[#c8f252]/40 bg-[#c8f252]/10 hover:bg-[#c8f252]/20 text-slate-800 text-xs font-black px-4 py-2.5 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm mt-1"
                                  >
                                    ❤️ Ustayı Favorilerime Ekle
                                  </button>
                                ) : (
                                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mt-1 font-semibold">
                                    ❤️ Usta Favorilerinize Eklendi!
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
                                Usta ile beyan ettiğiniz ücretler uyuşmamaktadır. Kalite personeli ekibimiz iki tarafla da görüşerek çözüm sağlayacaktır.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* LİVE OFFERS STREAM BADGE OR ACTIVE ROOM */}
                        <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                              <span>Gelen Teklifler Akışı</span>
                            </h4>
                            <span className="text-[10px] font-bold bg-[#c8f252]/20 text-[#4c630a] px-2.5 py-1 rounded-full uppercase tracking-wider">
                              Canlı Bağlantı Aktif
                            </span>
                          </div>

                          {selectedRequest.offers?.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
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
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {selectedRequest.offers?.map((offer) => (
                                <div
                                  key={offer.id}
                                  className="border border-[#c8f252] hover:border-[#b5e639] bg-slate-50/20 p-5 rounded-[24px] flex flex-col gap-4 transition-all duration-200 shadow-[0_10px_25px_-5px_rgba(200,242,82,0.05)] animate-scale-up"
                                >
                                  <div className="flex items-center justify-between w-full border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-3">
                                      <span className="w-10 h-10 rounded-full bg-slate-900 text-[#c8f252] flex items-center justify-center font-bold text-lg select-none">
                                        🔔
                                      </span>
                                      <div className="flex flex-col">
                                        <span className="font-extrabold text-xs md:text-sm text-slate-800">
                                          {offer.provider.user.name}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                                          Profesyonel Esnaf
                                        </span>
                                      </div>
                                    </div>
                                    <span className="text-base md:text-lg font-black text-slate-900 tracking-tight">
                                      {offer.price} ₺
                                    </span>
                                  </div>

                                  <p className="text-xs md:text-sm text-slate-600 font-semibold italic bg-white p-3 rounded-2xl border border-slate-100/80 leading-relaxed">
                                    &ldquo;{offer.description}&rdquo;
                                  </p>

                                  <div className="flex items-center gap-2.5 w-full pt-1">
                                    <button 
                                      onClick={() => alert("Usta profili çok yakında görüntülenebilecek!")}
                                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] md:text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-all border border-slate-200/50"
                                    >
                                      Profili Gör
                                    </button>
                                    <button 
                                      onClick={() => alert("Canlı mesajlaşma modülü çok yakında hizmetinizde!")}
                                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] md:text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-all border border-slate-200/50"
                                    >
                                      Mesaj Gönder
                                    </button>
                                    {offer.status === "pending" ? (
                                      <button
                                        onClick={() => handleAcceptOffer(offer)}
                                        className="flex-1 bg-[#c8f252] hover:bg-[#b5e639] text-slate-950 text-[10px] md:text-xs font-black py-2.5 rounded-xl cursor-pointer transition-all shadow-md shadow-[#c8f252]/20 active:scale-95 border border-transparent"
                                      >
                                        Kabul Et
                                      </button>
                                    ) : (
                                      <span className="flex-1 text-center text-[10px] md:text-xs font-bold bg-emerald-100 text-emerald-800 py-2.5 rounded-xl uppercase tracking-wider font-mono">
                                        Kabul Edildi
                                      </span>
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
                {activeTab === "karsilastirma" && (
                  <div className="space-y-6 animate-scale-up text-left">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-2xl">Teklif Karşılaştırma Analizi</h3>
                      <p className="text-xs text-slate-400 font-semibold mt-1 font-sans">Gelen teklifleri fiyat, usta puanı ve teslimat sürelerine göre yan yana karşılaştırın.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                      <div className="bg-white border border-[#c8f252] rounded-[24px] p-6 shadow-sm flex flex-col justify-between gap-5">
                        <div className="space-y-3">
                          <span className="bg-[#c8f252]/20 text-[#4c630a] text-[9px] font-black px-2 py-0.5 rounded uppercase font-mono tracking-wider">EN DÜŞÜK FİYAT</span>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">🧑‍🔧</span>
                            <div>
                              <h4 className="font-black text-sm text-slate-900 leading-none">Usta El Yapı</h4>
                              <span className="text-[10px] text-slate-400 font-bold block mt-1">Ev & İşyeri Tadilatı</span>
                            </div>
                          </div>
                          <div className="text-xs space-y-2 text-slate-600 font-semibold border-t border-slate-50 pt-3">
                            <div className="flex justify-between"><span>Teklif Fiyatı:</span><span className="font-extrabold text-slate-900">₺16.200</span></div>
                            <div className="flex justify-between"><span>Değerlendirme:</span><span className="font-extrabold text-slate-900">⭐ 4.7 (89 Yorum)</span></div>
                            <div className="flex justify-between"><span>Teslim Süresi:</span><span className="font-extrabold text-slate-900">3 İş Günü</span></div>
                          </div>
                        </div>
                        <button 
                          onClick={() => alert("Usta El Yapı teklifi simülasyon kabulü yapıldı!")}
                          className="w-full bg-[#c8f252] hover:bg-[#b5e639] text-slate-950 text-xs font-black py-2.5 rounded-xl cursor-pointer transition-all active:scale-95 text-center"
                        >
                          Hızlı Kabul Et
                        </button>
                      </div>

                      <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm flex flex-col justify-between gap-5">
                        <div className="space-y-3">
                          <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded uppercase font-mono tracking-wider">EN YÜKSEK PUAN</span>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">🧑‍🔧</span>
                            <div>
                              <h4 className="font-black text-sm text-slate-900 leading-none">Kaya Dekorasyon</h4>
                              <span className="text-[10px] text-slate-400 font-bold block mt-1">Dekorasyon & Mimari</span>
                            </div>
                          </div>
                          <div className="text-xs space-y-2 text-slate-600 font-semibold border-t border-slate-50 pt-3">
                            <div className="flex justify-between"><span>Teklif Fiyatı:</span><span className="font-extrabold text-slate-900">₺18.500</span></div>
                            <div className="flex justify-between"><span>Değerlendirme:</span><span className="font-extrabold text-slate-900">⭐ 4.9 (156 Yorum)</span></div>
                            <div className="flex justify-between"><span>Teslim Süresi:</span><span className="font-extrabold text-slate-900">5 İş Günü</span></div>
                          </div>
                        </div>
                        <button 
                          onClick={() => alert("Kaya Dekorasyon teklifi simülasyon kabulü yapıldı!")}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-all active:scale-95 text-center"
                        >
                          Hızlı Kabul Et
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* VIEW 4: MESAJLAŞMA VIEW */}
                {activeTab === "mesajlar" && (
                  <div className="space-y-6 animate-scale-up text-left">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-2xl">Sohbet & İletişim Kutusu</h3>
                      <p className="text-xs text-slate-400 font-semibold mt-1">Anlaştığınız esnaflarla gerçekleştirdiğiniz mesaj geçmişini yönetin.</p>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[24px] p-12 text-center shadow-sm max-w-lg mx-auto mt-6">
                      <div className="text-4xl mb-4">💬</div>
                      <h4 className="font-extrabold text-slate-800 text-sm mb-1.5">Henüz Aktif Sohbet Yok</h4>
                      <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                        Bir esnafın teklifini kabul ettiğinizde, karşılıklı iletişim kanalları ve sohbet odanız burada otomatik olarak açılacaktır.
                      </p>
                    </div>
                  </div>
                )}

                {/* VIEW 5: İŞ TEYİT & PUANLAMA VIEW */}
                {activeTab === "puanlama" && (
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
                )}

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

      </main>

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
