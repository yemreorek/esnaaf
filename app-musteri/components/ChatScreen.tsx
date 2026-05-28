"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { io, Socket } from "socket.io-client";
import { customFetch, getSessionId } from "../lib/session";

interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "offer";
  content: string;
  collected_data?: any;
  offerData?: {
    id: string | number;
    price: number;
    description: string;
    provider: {
      id: string;
      name: string;
      rating: number;
    };
  };
}

interface ChatScreenProps {
  initialMessage: string;
  onClose: () => void;
}

const initializedSessions = new Set<string>();

export default function ChatScreen({ initialMessage, onClose }: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("greeting");
  const [jobId, setJobId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const hasInitialized = useRef(false);

  // Job Completion (Adım 6) States
  const [completionState, setCompletionState] = useState<string | null>(null);
  const [providerDeclaredAmount, setProviderDeclaredAmount] = useState<number | null>(null);
  const [providerName, setProviderName] = useState<string | null>(null);
  const [showDiscrepancyForm, setShowDiscrepancyForm] = useState(false);
  const [seekerDisputeAmount, setSeekerDisputeAmount] = useState("");
  const [disputeNote, setDisputeNote] = useState("");
  const [isServiceNotReceived, setIsServiceNotReceived] = useState(false);
  const [finalDetails, setFinalDetails] = useState<any | null>(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [isAddedToFavorites, setIsAddedToFavorites] = useState(false);
  const [sendToFavoritesOnlyChecked, setSendToFavoritesOnlyChecked] = useState(false);

  // Auto-scroll to bottom of the chat on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Main chat initialization on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initializeChat = async () => {
      const sessionId = getSessionId();
      if (initializedSessions.has(sessionId)) return;
      initializedSessions.add(sessionId);

      setIsLoading(true);
      try {
        // 1. Initialize anonymous session
        const startRes = await customFetch("/api/ortak/chat/anonim/baslat", { method: "POST" });
        if (!startRes.ok) {
          throw new Error('Oturum başlatılamadı.');
        }
        const startData = await startRes.json();
        
        setMessages([
          {
            id: "system-greet",
            role: "assistant",
            content: startData.message || "Merhaba! Esnaaf platformuna hoş geldiniz. Size bugün hangi konuda yardımcı olabilirim?",
          },
        ]);

        // 2. Immediately post the initial user message
        await sendMessage(initialMessage);
      } catch (err) {
        console.error("Chat initialization failed:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();

    // Clean up socket connection on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Automatically restore focus to textarea when loading completes (UX Focus Improvement)
  useEffect(() => {
    if (!isLoading && currentStep !== "confirm_form" && currentStep !== "completed") {
      // Small timeout to ensure DOM element is enabled before focus
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isLoading, currentStep]);

  // Connect to WebSocket once request is registered (jobId obtained)
  useEffect(() => {
    if (!jobId) return;

    console.log(`[Socket.io Client] Attempting connection for Job: ${jobId}`);
    
    // Connect to backend namespace 'chat' on port 3005
    const socket = io(`${process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3005"}/chat`, {
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(`[Socket.io Client] Connected successfully! ID: ${socket.id}`);
      // Join the job specific room
      socket.emit("join_job", { jobId });
    });

    // Listen for new offers in the room
    socket.on("new_offer", (offer: any) => {
      console.log("[Socket.io Client] New offer received via WS:", offer);
      setMessages((prev) => [
        ...prev,
        {
          id: `offer-${Date.now()}-${Math.random()}`,
          role: "offer",
          content: `🔔 ${offer.provider.name} size teklif verdi.`,
          offerData: {
            id: offer.offerId,
            price: offer.price,
            description: offer.description,
            provider: offer.provider,
          },
        },
      ]);
    });

    // Listen for provider job completion declaration
    socket.on("job_completed_by_provider", (data: any) => {
      console.log("[Socket.io Client] Job completed by provider received:", data);
      
      setProviderName(data.providerName);
      setProviderDeclaredAmount(data.price);
      if (data.providerId) {
        setProviderId(data.providerId);
      }
      setCompletionState("pending_seeker");
      
      setMessages((prev) => [
        ...prev,
        {
          id: `completion-decl-${Date.now()}`,
          role: "assistant",
          content: `🔔 Hizmet vereniniz ${data.providerName} işin tamamlandığını beyan etti. Beyan Edilen Ücret: ${data.price} ₺.\n\nLütfen aşağıdaki panelden ödediğiniz tutarı teyit edin.`,
        },
      ]);
    });

    // Listen for finalized job completion status
    socket.on("job_completion_finalized", (data: any) => {
      console.log("[Socket.io Client] Job completion finalized received:", data);
      setCompletionState(data.status);
      setFinalDetails(data);
      
      let resultMsg = "";
      if (data.status === "completed") {
        resultMsg = `🎉 İş başarıyla tamamlandı ve onaylandı! Ödenen Tutar: ${data.seekerDeclared} ₺. \n\nBizi tercih ettiğiniz için teşekkür ederiz! Hizmet kalitemizi artırmak için usta profilini puanlayabilirsiniz.`;
      } else {
        resultMsg = `⚠️ Ücret uyuşmazlığı (%${data.amountDiffPct.toFixed(1)} fark) veya itiraz nedeniyle uyuşmazlık incelemesi başlatıldı. Kalite personeli ekibimiz iki tarafla da görüşerek incelemeyi yürütecektir.`;
      }
      
      setMessages((prev) => [
        ...prev,
        {
          id: `completion-final-${Date.now()}`,
          role: "assistant",
          content: resultMsg,
        },
      ]);
    });

    socket.on("disconnect", () => {
      console.log("[Socket.io Client] Disconnected from server");
    });

    return () => {
      socket.disconnect();
    };
  }, [jobId]);

  // Post message to the NestJS backend
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    // Append user message local bubble
    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: "user",
        content: messageText,
      },
    ]);

    setIsLoading(true);
    setInputVal("");

    const startTime = Date.now(); // Record start time to calculate typing delay

    // If message is "Onayla" and favorites checked, append suffix for backend parsing
    let apiMessage = messageText;
    if (messageText === "Onayla" && sendToFavoritesOnlyChecked) {
      apiMessage = "Onayla - Sadece Favori Ustalarima Gonder";
    }

    try {
      const response = await customFetch("/api/musteri/chat/mesaj", {
        method: "POST",
        body: JSON.stringify({ message: apiMessage }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Mesaj iletilemedi.");
      }

      const data = await response.json();

      // Simulated typing delay for "humanized" feel (2 seconds optimum)
      const duration = Date.now() - startTime;
      const minDelay = 2000;
      if (duration < minDelay) {
        await new Promise((resolve) => setTimeout(resolve, minDelay - duration));
      }
      
      // Update local state machine step
      setCurrentStep(data.step);

      // Append assistant's response bubble
      const assistantMsgId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: "assistant",
          content: data.responseMessage,
          collected_data: data.collected_data,
        },
      ]);

      // Detect if job has been created (contains jobId / completed step)
      if (data.step === "completed" || data.responseMessage.includes("Talebiniz #")) {
        // Extract Job ID from response text using Regex
        const match = data.responseMessage.match(/#([a-fA-F0-9-]{36})/i);
        if (match && match[1]) {
          setJobId(match[1]);
        } else {
          // fallback mock UUID for local testing if not matched
          setJobId("mock-job-uuid-12345");
        }
      }
    } catch (err: any) {
      console.error("Message send error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: err.message || "Sistemimiz şu an yoğun, lütfen tekrar deneyiniz.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!inputVal.trim()) return;
    sendMessage(inputVal);
  };

  const handleAcceptOffer = async (offer: any) => {
    if (!offer?.id) return;
    const confirmed = window.confirm(
      `${offer.provider?.name || 'Usta'} teklifini ${offer.price} TL ile kabul etmek istediğinize emin misiniz?\n\nKabul ettiğinizde telefon numaralarınız karşılıklı olarak açılacaktır.`
    );
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const res = await customFetch(`/api/musteri/teklifler/${offer.id}/kabul`, {
        method: 'POST',
        body: JSON.stringify({ consent: true }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Teklif kabul edilemedi.');
      }

      const data = await res.json();
      setProviderId(offer.provider?.id || null);

      setMessages((prev) => [
        ...prev,
        {
          id: `accept-${Date.now()}`,
          role: 'assistant',
          content: `✅ Teklif başarıyla kabul edildi!\n\n📞 Usta Telefon: ${data.providerPhone || 'Açıldı'}\n📞 Sizin Telefonunuz: ${data.seekerPhone || 'Paylaşıldı'}\n\nArtık doğrudan iletişime geçebilirsiniz.`,
        },
      ]);
    } catch (err: any) {
      console.error('Offer accept error:', err);
      alert(err.message || 'Teklif kabul sırasında bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  // Seeker confirmation action for job completion (Adım 6)
  const handleConfirmCompletion = async (isConfirmed: boolean) => {
    if (!jobId) return;
    setIsLoading(true);
    try {
      const payload: any = { jobId };
      
      if (isConfirmed) {
        payload.confirmed = true;
        payload.declaredAmount = providerDeclaredAmount;
      } else {
        payload.confirmed = false;
        const parsedAmount = isServiceNotReceived ? 0 : Number(seekerDisputeAmount);
        if (isNaN(parsedAmount) || parsedAmount < 0) {
          alert("Lütfen geçerli bir tutar girin.");
          setIsLoading(false);
          return;
        }
        payload.declaredAmount = parsedAmount;
        payload.note = disputeNote;
      }

      const res = await customFetch(`/api/musteri/tamamlama/onayla`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || "Teyit işlemi başarısız oldu.");
      }

      const resData = await res.json();
      console.log("[ChatScreen] Seeker confirmation success:", resData);
      
      // Reset forms and trigger completionState updates locally as fallback
      setShowDiscrepancyForm(false);
      setCompletionState(resData.data.status);
      setFinalDetails(resData.data);
    } catch (err: any) {
      console.error("Confirmation error:", err);
      alert(err.message || "Bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate usta completes job on backend (Adım 6 Simülatör)
  const handleSimulateProviderCompletion = async (price: number) => {
    if (!jobId) {
      alert("Simülasyon için önce bir talep oluşturmalısınız!");
      return;
    }
    setIsLoading(true);
    try {
      const res = await customFetch(`/api/ortak/jobs/${jobId}/simulate-provider-complete`, {
        method: "POST",
        body: JSON.stringify({ price }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || "Simülasyon başarısız oldu.");
      }

      const data = await res.json();
      console.log("[ChatScreen] Simulator provider complete success:", data);
    } catch (err: any) {
      console.error("Simulation error:", err);
      alert(err.message || "Simülasyon sırasında bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle review photo selection and preview
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

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  // Submit review with photo (Adım 12 / Faz 2)
  const handleSubmitReview = async () => {
    if (selectedRating === 0 || !jobId) return;
    setIsLoading(true);
    setIsUploadingPhoto(true);

    try {
      let uploadedPhotoUrl = "";

      if (photoFile) {
        // 1. Get presigned URL from backend S3/Mock storage
        const filename = encodeURIComponent(photoFile.name);
        const contentType = encodeURIComponent(photoFile.type || "image/jpeg");
        const presignedRes = await customFetch(
          `/api/storage/presigned-url?filename=${filename}&contentType=${contentType}`
        );
        if (!presignedRes.ok) {
          throw new Error("Yükleme adresi alınamadı.");
        }
        const { uploadUrl, downloadUrl } = await presignedRes.json();

        // 2. Upload photo directly via PUT request
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: photoFile,
          headers: {
            "Content-Type": photoFile.type || "image/jpeg",
          },
        });

        if (!uploadRes.ok) {
          throw new Error("Fotoğraf yükleme başarısız oldu.");
        }

        uploadedPhotoUrl = downloadUrl;
      }

      // 3. Post review details to backend
      const reviewRes = await customFetch("/api/musteri/reviews", {
        method: "POST",
        body: JSON.stringify({
          job_id: jobId,
          rating: selectedRating,
          comment: commentText || undefined,
          document_url: uploadedPhotoUrl || undefined,
        }),
      });

      if (!reviewRes.ok) {
        const errorData = await reviewRes.json();
        throw new Error(errorData.error?.message || "Değerlendirme gönderilemedi.");
      }

      setRatingSubmitted(true);
      alert("Değerlendirmeniz başarıyla gönderildi ve yönetici onayına sunuldu!");
    } catch (err: any) {
      console.error("Review submission error:", err);
      alert(err.message || "Puanlama sırasında bir hata oluştu.");
    } finally {
      setIsLoading(false);
      setIsUploadingPhoto(false);
    }
  };

  const handleAddToFavorites = async () => {
    if (!providerId) {
      alert("Hizmet veren bilgisi alınamadı.");
      return;
    }
    try {
      const res = await customFetch("/api/ortak/favoriler/ekle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider_id: providerId }),
      });
      if (res.ok) {
        setIsAddedToFavorites(true);
      } else {
        const err = await res.json();
        alert(err.error?.message || "Ustayı favorilere ekleme sırasında hata oluştu.");
      }
    } catch (err: any) {
      alert("Hata: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-[#F5F5F5] flex flex-col z-40 select-none overflow-hidden font-sans">
      
      {/* Top Header bar with custom organic pin logo */}
      <header className="w-full h-16 bg-white border-b border-[#E0E0E0] shadow-[0_1px_3px_rgba(0,0,0,0.03)] px-6 flex items-center justify-between z-50 shrink-0">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="Esnaaf Logo"
            width={120}
            height={36}
            priority
            className="cursor-pointer"
            onClick={onClose}
          />
          <span className="text-[10px] font-bold bg-[#D4F54E] text-[#232323] px-2 py-0.5 rounded-full uppercase tracking-wider">
            Canlı Sohbet
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-[#888888] hover:text-[#232323] p-2 rounded-full hover:bg-[#F5F5F5] cursor-pointer transition-all duration-150"
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
      </header>

      {/* DEV SIMULATOR BAR */}
      {jobId && completionState !== "completed" && completionState !== "disputed" && (
        <div className="w-full bg-[#232323] text-white py-2 px-4 flex flex-wrap items-center justify-center gap-2 border-b border-[#D4F54E]/20 text-xs font-sans z-40">
          <span className="font-extrabold text-[#D4F54E] tracking-wider uppercase mr-1 animate-pulse">
            🛠️ Simülasyon:
          </span>
          <button
            onClick={() => handleSimulateProviderCompletion(850)}
            className="bg-white/10 hover:bg-[#D4F54E] hover:text-[#232323] text-white px-2.5 py-1 rounded-[6px] font-bold cursor-pointer transition-all active:scale-95"
          >
            Eşleşen Beyan (850 ₺)
          </button>
          <button
            onClick={() => handleSimulateProviderCompletion(1020)}
            className="bg-white/10 hover:bg-[#D4F54E] hover:text-[#232323] text-white px-2.5 py-1 rounded-[6px] font-bold cursor-pointer transition-all active:scale-95"
          >
            Sarı Alarm (%20 Fark - 1020 ₺)
          </button>
          <button
            onClick={() => handleSimulateProviderCompletion(1200)}
            className="bg-white/10 hover:bg-[#D4F54E] hover:text-[#232323] text-white px-2.5 py-1 rounded-[6px] font-bold cursor-pointer transition-all active:scale-95"
          >
            Kırmızı Alarm (%41 Fark - 1200 ₺)
          </button>
        </div>
      )}

      {/* Main scrolling viewport */}
      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-6 md:max-w-[720px] md:mx-auto w-full">
        {messages.map((msg) => {
          if (msg.role === "offer" && msg.offerData) {
            // RENDER WS LIVE OFFER BUBBLE
            return (
              <div
                key={msg.id}
                className="w-full flex flex-col items-center justify-center p-4 bg-white border border-[#D4F54E] shadow-[0_4px_12px_rgba(212,245,78,0.15)] rounded-[20px] animate-scale-up gap-3 my-2"
              >
                <div className="flex items-center justify-between w-full border-b border-[#F5F5F5] pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#232323] text-[#D4F54E] flex items-center justify-center font-bold text-lg">
                      🛠️
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-[#232323]">
                        {msg.offerData.provider.name}
                      </span>
                      <span className="text-xs text-[#888888]">
                        ⭐ {msg.offerData.provider.rating.toFixed(1)} Puan · Ev Temizliği Uzmanı
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-[#232323]">
                      {msg.offerData.price} ₺
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-[#555555] leading-relaxed w-full italic px-2">
                  &ldquo;{msg.offerData.description}&rdquo;
                </p>

                <div className="flex items-center gap-2 w-full pt-2">
                  <button className="flex-1 bg-[#F5F5F5] hover:bg-[#EAEAEA] text-[#232323] text-xs font-semibold py-2.5 rounded-[12px] cursor-pointer transition-all">
                    Profili Gör
                  </button>
                  <button className="flex-1 bg-[#F5F5F5] hover:bg-[#EAEAEA] text-[#232323] text-xs font-semibold py-2.5 rounded-[12px] cursor-pointer transition-all">
                    Mesaj Gönder
                  </button>
                  <button
                    onClick={() => handleAcceptOffer(msg.offerData)}
                    className="flex-1 bg-[#D4F54E] hover:bg-[#c5e645] text-[#232323] text-xs font-bold py-2.5 rounded-[12px] cursor-pointer shadow-[0_2px_4px_rgba(212,245,78,0.2)] hover:scale-102 transition-all"
                  >
                    Kabul Et
                  </button>
                </div>
              </div>
            );
          }

          const isUser = msg.role === "user";

          return (
            <div
              key={msg.id}
              className={`flex w-full items-end gap-3 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {/* Left Avatar for AI response */}
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-[#232323] text-white flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-sm">
                  e.
                </div>
              )}

              {/* Text Bubble */}
              <div
                className={`max-w-[80%] rounded-[20px] px-4 py-3 text-sm font-medium leading-relaxed shadow-[0_1px_3px_rgba(0,0,0,0.03)] border transition-all duration-200 ${
                  isUser
                    ? "bg-[#232323] text-white border-transparent rounded-br-[4px] self-end"
                    : "bg-white text-[#232323] border-[#E0E0E0] rounded-bl-[4px] self-start"
                }`}
              >
                {/* Parse newline characters for clean spacing */}
                <p className="whitespace-pre-line">{msg.content}</p>

                {/* SUMMARY CARD IN THE SOHBET FLOW */}
                {msg.collected_data && currentStep === "confirm_form" && msg.id === [...messages].reverse().find(m => m.collected_data)?.id && (
                  <div className="mt-4 p-4 bg-[#F5F5F5] border border-[#E0E0E0] rounded-[16px] flex flex-col gap-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[#888888] border-b border-[#E0E0E0] pb-2">
                      📋 Talep Bilgileri
                    </h4>
                    <div className="flex flex-col gap-1.5 text-xs text-[#232323]">
                      <div><strong>Hizmet:</strong> {
                        msg.collected_data.categorySlug === 'ev-temizligi' ? 'Ev Temizliği' : 
                        msg.collected_data.categorySlug === 'boya-badana' ? 'Boya Badana' : 
                        msg.collected_data.categorySlug === 'su-tesisati' ? 'Su Tesisatı' : 
                        msg.collected_data.categorySlug === 'elektrik-tesisati' ? 'Elektrik Tesisatı' : 
                        msg.collected_data.categorySlug === 'ev-tadilat' ? 'Ev Tadilatı' : 
                        msg.collected_data.categorySlug === 'nakliyat' ? 'Nakliyat / Taşıma' : 'Genel Esnaf Hizmeti'
                      }</div>
                      <div><strong>Ad Soyad:</strong> {msg.collected_data.name}</div>
                      
                      {msg.collected_data.categorySlug === 'nakliyat' ? (
                        <>
                          <div><strong>Çıkış Konumu:</strong> {msg.collected_data.district}, İstanbul</div>
                          <div><strong>Varış Konumu:</strong> {msg.collected_data.destinationDistrict}, İstanbul</div>
                          <div><strong>Tarih:</strong> {msg.collected_data.tarih}</div>
                          <div><strong>Daire Tipi:</strong> {msg.collected_data.daireTipi}</div>
                          <div><strong>Kat & Asansör:</strong> {msg.collected_data.katAsansor}</div>
                        </>
                      ) : (
                        <>
                          <div><strong>Konum:</strong> {msg.collected_data.district || 'Belirtilmedi'}, İstanbul</div>
                          {msg.collected_data.categorySlug === 'ev-temizligi' && (
                            <>
                              <div><strong>Daire Tipi:</strong> {msg.collected_data.daireTipi}</div>
                              <div><strong>Temizlik Sıklığı:</strong> {msg.collected_data.siflik || msg.collected_data.sıklık}</div>
                              <div><strong>Tarih:</strong> {msg.collected_data.tarih}</div>
                            </>
                          )}
                          {msg.collected_data.categorySlug === 'boya-badana' && (
                            <>
                              <div><strong>Metrekare:</strong> {msg.collected_data.metrekare}</div>
                              <div><strong>Uygulama Alanı:</strong> {msg.collected_data.tur}</div>
                              <div><strong>Renk / Boya Tipi:</strong> {msg.collected_data.renkTip}</div>
                            </>
                          )}
                          {(msg.collected_data.categorySlug === 'su-tesisati' || msg.collected_data.categorySlug === 'elektrik-tesisati') && (
                            <>
                              <div><strong>İş / Sorun Türü:</strong> {msg.collected_data.sorunTuru || msg.collected_data.isTuru}</div>
                              <div><strong>Aciliyet:</strong> {msg.collected_data.aciliyet}</div>
                            </>
                          )}
                          {msg.collected_data.categorySlug === 'ev-tadilat' && (
                            <>
                              <div><strong>Tadilat Kapsamı:</strong> {msg.collected_data.kapsam}</div>
                              <div><strong>Metrekare:</strong> {msg.collected_data.metrekare}</div>
                              <div><strong>Bütçe Aralığı:</strong> {msg.collected_data.butce}</div>
                            </>
                          )}
                        </>
                      )}
                      <div><strong>Açıklama:</strong> {msg.collected_data.details || "Standart Hizmet"}</div>
                    </div>
                    <div className="flex items-center gap-2.5 py-1 px-0.5 text-xs text-[#555555] border-t border-[#E0E0E0] pt-2">
                      <input
                        type="checkbox"
                        id="sendToFavoritesOnly"
                        checked={sendToFavoritesOnlyChecked}
                        onChange={(e) => {
                          setSendToFavoritesOnlyChecked(e.target.checked);
                          msg.collected_data.sendToFavoritesOnly = e.target.checked;
                        }}
                        className="w-4 h-4 accent-[#D4F54E] cursor-pointer rounded"
                      />
                      <label htmlFor="sendToFavoritesOnly" className="cursor-pointer font-bold select-none flex items-center gap-1">
                        ❤️ Sadece Favori Ustalarıma Gönder (Eski Memnuniyet Öncelikli)
                      </label>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-[#E0E0E0]">
                      <button
                        onClick={() => sendMessage("Düzelt")}
                        className="flex-1 bg-white hover:bg-[#F5F5F5] border border-[#E0E0E0] text-[#232323] py-2 rounded-[10px] font-bold text-xs cursor-pointer active:scale-95 transition-all"
                      >
                        ✏️ Düzelt
                      </button>
                      <button
                        onClick={() => sendMessage("Onayla")}
                        className="flex-1 bg-[#D4F54E] hover:bg-[#c5e645] text-[#232323] py-2 rounded-[10px] font-bold text-xs cursor-pointer shadow-sm active:scale-95 transition-all"
                      >
                        ✅ Onayla
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* LOADING TYPING INDICATOR */}
        {isLoading && (
          <div className="flex w-full items-end gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-[#232323] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              e.
            </div>
            <div className="bg-white border border-[#E0E0E0] rounded-[20px] rounded-bl-[4px] px-5 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-1.5 h-3">
                <div className="w-2.5 h-2.5 bg-[#888888] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2.5 h-2.5 bg-[#888888] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2.5 h-2.5 bg-[#888888] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        )}

        {/* BEKLEME EKRANI loader displayed after job submission */}
        {jobId && currentStep === "completed" && !completionState && (
          <div className="w-full flex flex-col items-center justify-center p-6 bg-white border border-[#E0E0E0] rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-center animate-scale-up gap-4 mt-2 mb-12">
            <div className="relative w-12 h-12 flex items-center justify-center">
              {/* Premium Neon lime spinning loading loader */}
              <div className="absolute inset-0 rounded-full border-4 border-[#F5F5F5] border-t-[#D4F54E] animate-spin"></div>
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="font-bold text-sm text-[#232323]">Teklifler Bekleniyor...</h4>
              <p className="text-xs text-[#888888] leading-relaxed max-w-[280px]">
                Talebiniz bölgedeki en iyi esnaflara iletildi. Teklifler canlı olarak bu ekranda belirecek.
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* JOB COMPLETION (ADIM 6) INTERACTIVE UI PANELS */}
        {/* ======================================================== */}

        {/* CASE 1: Pending Seeker Confirmation Card */}
        {completionState === "pending_seeker" && (
          <div className="w-full flex flex-col p-5 bg-white border border-[#D4F54E] shadow-[0_4px_20px_rgba(212,245,78,0.12)] rounded-[20px] animate-scale-up gap-4 my-4 mb-12">
            <div className="flex items-center gap-3 border-b border-[#F5F5F5] pb-3">
              <div className="w-10 h-10 rounded-full bg-[#232323] text-white flex items-center justify-center font-bold text-lg select-none">
                💼
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-[#232323]">İş Tamamlama Teyidi</span>
                <span className="text-xs text-[#888888] font-semibold">Karşılıklı Ücret Onayı</span>
              </div>
            </div>

            {!showDiscrepancyForm ? (
              <>
                <p className="text-sm text-[#555555] leading-relaxed font-medium">
                  <strong>{providerName || "Usta"}</strong> işi bitirdiğini ve sizden <strong>{providerDeclaredAmount} ₺</strong> aldığını beyan etti.
                  <br /><br />
                  Ödediğiniz bu tutar doğru mu?
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setShowDiscrepancyForm(true)}
                    className="flex-1 bg-white hover:bg-[#F5F5F5] text-[#232323] text-xs font-semibold py-3 rounded-[12px] cursor-pointer transition-all border border-[#E0E0E0] active:scale-95"
                  >
                    Hayır, Farklı / İtiraz
                  </button>
                  <button
                    onClick={() => handleConfirmCompletion(true)}
                    className="flex-1 bg-[#D4F54E] hover:bg-[#c5e645] text-[#232323] text-xs font-extrabold py-3 rounded-[12px] cursor-pointer shadow-[0_2px_4px_rgba(212,245,78,0.15)] transition-all active:scale-95"
                  >
                    Evet, Tutar Doğru
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-4 animate-scale-up text-left">
                <div className="flex items-center gap-2.5 bg-[#F5F5F5] p-2.5 rounded-[10px]">
                  <input
                    type="checkbox"
                    id="serviceNotReceived"
                    checked={isServiceNotReceived}
                    onChange={(e) => setIsServiceNotReceived(e.target.checked)}
                    className="w-4 h-4 rounded text-[#232323] focus:ring-[#D4F54E] accent-[#232323] cursor-pointer"
                  />
                  <label htmlFor="serviceNotReceived" className="text-xs font-bold text-[#232323] cursor-pointer select-none">
                    Hizmeti almadım / İş eksik yapıldı
                  </label>
                </div>

                {!isServiceNotReceived && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#888888]">Ödediğiniz Gerçek Tutar (₺):</label>
                    <input
                      type="number"
                      placeholder="Örn: 800"
                      value={seekerDisputeAmount}
                      onChange={(e) => setSeekerDisputeAmount(e.target.value)}
                      className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-[12px] p-2.5 outline-none focus:border-[#D4F54E] text-sm text-[#232323] font-extrabold"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#888888]">İtiraz / Açıklama Notu:</label>
                  <textarea
                    placeholder="Lütfen itiraz gerekçenizi veya ödediğiniz farklı tutarın nedenini açıklayın..."
                    value={disputeNote}
                    onChange={(e) => setDisputeNote(e.target.value)}
                    rows={2}
                    className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-[12px] p-2.5 outline-none focus:border-[#D4F54E] text-sm text-[#232323] resize-none font-medium"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[#F5F5F5]">
                  <button
                    onClick={() => setShowDiscrepancyForm(false)}
                    className="flex-1 bg-white hover:bg-[#F5F5F5] text-[#232323] text-xs font-semibold py-2.5 rounded-[12px] border border-[#E0E0E0] cursor-pointer transition-all active:scale-95"
                  >
                    Vazgeç
                  </button>
                  <button
                    onClick={() => handleConfirmCompletion(false)}
                    className="flex-1 bg-[#232323] hover:bg-[#333333] text-white text-xs font-bold py-2.5 rounded-[12px] cursor-pointer transition-all active:scale-95"
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
          <div className="w-full flex flex-col p-5 bg-white border border-[#D4F54E] shadow-[0_4px_20px_rgba(212,245,78,0.08)] rounded-[20px] animate-scale-up gap-4 my-4 mb-12 items-center text-center">
            <div className="w-12 h-12 rounded-full bg-[#F7FCD4] text-[#D4F54E] flex items-center justify-center font-bold text-2xl animate-bounce shadow-sm">
              🎉
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-extrabold text-sm text-[#232323]">İş Başarıyla Tamamlandı!</span>
              <p className="text-xs text-[#888888] font-medium leading-relaxed max-w-[280px]">
                Ücret teyidi başarıyla sağlandı ve iş başarıyla kapatıldı. Ustanızı değerlendirebilirsiniz!
              </p>
            </div>
 
            {!ratingSubmitted ? (
              <div className="flex flex-col items-center gap-4 w-full border-t border-[#F5F5F5] pt-3 text-left">
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
                  <div className="flex flex-col gap-3 w-full animate-scale-up">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-[#888888]">Görüşleriniz:</label>
                      <textarea
                        rows={3}
                        placeholder="Ustanızın hizmet kalitesi hakkında yorum yazın..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        disabled={isUploadingPhoto}
                        className="w-full bg-[#F5F5F5] border border-[#E0E0E0] rounded-[12px] p-2.5 outline-none focus:border-[#D4F54E] text-sm text-[#232323] resize-none font-medium"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-[#888888]">Fotoğraf Ekle (Opsiyonel):</label>
                      
                      {!photoPreview ? (
                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#E0E0E0] hover:border-[#D4F54E] rounded-[12px] p-4 bg-[#F5F5F5] cursor-pointer transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6 text-[#888888]">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                          </svg>
                          <span className="text-[11px] font-bold text-[#888888] mt-1.5">Fotoğraf Yükle</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={isUploadingPhoto}
                            className="hidden"
                          />
                        </label>
                      ) : (
                        <div className="relative w-full h-24 rounded-[12px] overflow-hidden border border-[#E0E0E0] shadow-sm">
                          <img
                            src={photoPreview}
                            alt="Yorum Fotoğrafı"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
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
                      className="w-full bg-[#D4F54E] hover:bg-[#c5e645] disabled:bg-[#C0C0C0] text-[#232323] disabled:text-white text-xs font-extrabold py-3 rounded-[12px] cursor-pointer transition-all active:scale-95 shadow-sm mt-1 text-center"
                    >
                      {isUploadingPhoto ? "Yükleniyor..." : "Değerlendirmeyi Gönder"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <span className="text-xs font-bold text-[#D4F54E] bg-[#232323] px-4 py-1.5 rounded-full shadow-sm">
                  ✓ Değerlendirmeniz İçin Teşekkür Ederiz!
                </span>
                {!isAddedToFavorites ? (
                  <button
                    type="button"
                    onClick={handleAddToFavorites}
                    className="flex items-center gap-2 border border-[#D4F54E] bg-[#F7FCD4]/50 hover:bg-[#F7FCD4] text-[#232323] text-xs font-extrabold px-4 py-2 rounded-[12px] cursor-pointer transition-all active:scale-95 shadow-sm mt-1"
                  >
                    ❤️ Ustayı Favorilerime Ekle
                  </button>
                ) : (
                  <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5 mt-1">
                    ❤️ Usta Favorilerinize Eklendi!
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* CASE 3: Disputed & Warning Panel */}
        {completionState === "disputed" && (
          <div className="w-full flex flex-col p-5 bg-white border border-red-500 shadow-[0_4px_20px_rgba(239,68,68,0.08)] rounded-[20px] animate-scale-up gap-3 my-4 mb-12 items-center text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center font-bold text-2xl animate-pulse shadow-sm">
              ⚠️
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-extrabold text-sm text-[#232323]">Uyuşmazlık Kaydı Oluşturuldu</span>
              <p className="text-xs text-[#888888] font-medium leading-relaxed max-w-[280px]">
                Usta ile beyan ettiğiniz ücretler uyuşmamaktadır. Kalite personeli ekibimiz iki tarafla da görüşerek çözüm sağlayacaktır.
              </p>
            </div>
            {finalDetails && (
              <div className="bg-red-50/50 p-3 rounded-[12px] border border-red-100 text-[11px] text-red-700 font-bold w-full flex flex-col gap-1.5 text-left">
                <div>Usta Beyan Tutarı: {finalDetails.providerDeclared || providerDeclaredAmount} ₺</div>
                <div>Sizin Beyan Tutarınız: {finalDetails.seekerDeclared || seekerDisputeAmount} ₺</div>
                <div>Sapma Oranı: %{finalDetails.amountDiffPct ? finalDetails.amountDiffPct.toFixed(1) : "0.0"}</div>
              </div>
            )}
          </div>
        )}

        <div ref={scrollRef} className="h-2"></div>
      </div>

      {/* Bottom Fixed Chat Input Bar */}
      <footer className="w-full border-t border-[#E0E0E0] bg-white p-4 shrink-0 z-50">
        <div className="w-full md:max-w-[720px] md:mx-auto flex items-center gap-3 relative bg-[#F5F5F5] rounded-[16px] border border-[#E0E0E0] focus-within:border-[#D4F54E] focus-within:ring-2 focus-within:ring-[rgba(212,245,78,0.15)] transition-all p-2.5">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Mesajınızı buraya yazın..."
            disabled={isLoading || currentStep === "confirm_form" || currentStep === "completed"}
            className="flex-1 bg-transparent border-0 outline-none text-[#232323] font-medium text-sm p-1.5 resize-none leading-relaxed focus:ring-0 disabled:text-[#888888]"
          />
          <button
            onClick={handleSend}
            disabled={!inputVal.trim() || isLoading || currentStep === "confirm_form" || currentStep === "completed"}
            className="bg-[#D4F54E] hover:bg-[#c5e645] disabled:bg-[#C0C0C0] text-[#232323] disabled:text-[#FFFFFF] w-10 h-10 rounded-[12px] flex items-center justify-center cursor-pointer shadow-sm hover:scale-102 active:scale-97 transition-all duration-150 shrink-0"
          >
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
      </footer>

      <style jsx global>{`
        @keyframes scaleUp {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up {
          animation: scaleUp 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
