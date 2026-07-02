"use client";

import { useState, useEffect, useRef } from "react";

import { io, Socket } from "socket.io-client";
import { customFetch, getSessionId } from "../lib/session";

async function safeJsonParse(response: Response, defaultError = "Sunucu hatası oluştu."): Promise<any> {
  try {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("[JSON Parse Error] Response is not valid JSON:", text, e);
      throw new Error(defaultError);
    }
  } catch (err) {
    console.error("[Response Text Read Error]:", err);
    throw new Error(defaultError);
  }
}

function TypewriterText({ text = "", speed = 12, onComplete }: { text: string; speed?: number; onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState("");
  const elementRef = useRef<HTMLParagraphElement>(null);
  const textRef = useRef(text || "");
  textRef.current = text || "";

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let index = 0;
    setDisplayedText("");
    
    const intervalId = setInterval(() => {
      setDisplayedText((prev) => {
        const fullText = textRef.current || "";
        if (index >= fullText.length) {
          clearInterval(intervalId);
          if (onCompleteRef.current) {
            requestAnimationFrame(() => onCompleteRef.current?.());
          }
          return prev;
        }
        
        const nextChar = fullText.charAt(index);
        index++;
        
        // Auto scroll parent scroll container to bottom
        const container = elementRef.current?.closest('.overflow-y-auto');
        if (container) {
          container.scrollTop = container.scrollHeight;
        }

        return prev + nextChar;
      });
    }, speed);

    return () => clearInterval(intervalId);
  }, [speed]);

  return (
    <p ref={elementRef} className="whitespace-pre-line">
      {displayedText}
    </p>
  );
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "offer";
  content: string;
  collected_data?: any;
  isStreaming?: boolean;
  offerData?: {
    id: string | number;
    price: number;
    description?: string;
    message?: string;
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
  onJobCompleted?: (jobId: string) => void;
}

const FIELD_LABELS: Record<string, string> = {
  daireTipi: 'Daire Tipi',
  siflik: 'Temizlik Sıklığı',
  sıklık: 'Temizlik Sıklığı',
  tarih: 'Tarih',
  metrekare: 'Metrekare / Alan',
  tur: 'Hizmet Türü',
  renkTip: 'Renk / Boya Tipi',
  destinationDistrict: 'Varış Konumu',
  katAsansor: 'Kat & Asansör',
  sorunTuru: 'Sorun Türü',
  isTuru: 'İş / Sorun Türü',
  aciliyet: 'Aciliyet',
  kapsam: 'Kapsam',
  butce: 'Bütçe Aralığı',
  adet: 'Adet / Sayı',
  durum: 'Genel Durum / Lekeler',
  islemTuru: 'İşlem Türü',
  hasereTuru: 'Haşere Türü',
  binaTipi: 'Bina / Mülk Tipi',
  cihazTuru: 'Cihaz Türü',
  dersTuru: 'Ders Branşı',
  sinifSeviyesi: 'Sınıf Seviyesi',
  camTipi: 'Cam Tipi',
  kombiDurumu: 'Kombi Durumu',
  etkinlikTuru: 'Etkinlik Türü',
  davetliSayisi: 'Davetli Sayısı',
  malzemeDurumu: 'Malzeme Durumu',
  esyaDurumu: 'Eşya Durumu',
  malzemeDahil: 'Malzeme Temini',
  paketlemeHizmeti: 'Paketleme Hizmeti',
  evcilHayvan: 'Evcil Hayvan',
  markaModel: 'Marka / Model',
  katSayisi: 'Bina Kat Sayısı',
  mobilyaTuru: 'Mobilya Türü',
  dersYeri: 'Ders Yeri',
  odaSayisi: 'Oda Sayısı',
  projeGerekli: 'Proje Çizimi',
  tarzTercihi: 'Tarz Tercihi',
  albumTalebi: 'Albüm Talebi',
  cateringDahil: 'Catering Durumu'
};


export function resolveCityFromDistrict(district?: any): string {
  if (!district || typeof district !== 'string') return 'İstanbul';
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

export default function ChatScreen({ initialMessage, onClose, onJobCompleted }: ChatScreenProps) {
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
  const [kvkkChecked, setKvkkChecked] = useState(true);

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

  // Speech & Voice States (Adım 29)
  const [isListening, setIsListening] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef("");

  // Clean up speech synthesis on screen close or unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Auto-grow textarea height dynamically based on content (Speech to Text or Typing)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = `${newHeight}px`;
      
      // Auto-scroll to the bottom of the textarea so the latest words are always visible
      textarea.scrollTop = textarea.scrollHeight;
    }
  }, [inputVal]);

  // Speech Recognition (Speech-to-Text) Handler
  const startSpeechRecognition = () => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        alert("Tarayıcınız ses tanıma özelliğini desteklemiyor. Google Chrome veya Edge kullanabilirsiniz.");
        return;
      }

      if (!recognitionRef.current) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.lang = "tr-TR";
        recognition.interimResults = true;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";
          for (let i = 0; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + " ";
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          const addition = finalTranscript + interimTranscript;
          setInputVal(
            baseTextRef.current
              ? baseTextRef.current.trim() + " " + addition.trim()
              : addition.trim()
          );
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }

      if (isListening) {
        recognitionRef.current.stop();
      } else {
        baseTextRef.current = inputVal;
        recognitionRef.current.start();
      }
    }
  };

  // Text-to-Speech (SpeechSynthesis) Handler
  const toggleSpeech = (msgId: string, text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (playingMessageId === msgId) {
        window.speechSynthesis.cancel();
        setPlayingMessageId(null);
      } else {
        window.speechSynthesis.cancel();

        // Clean markdown symbols for cleaner voice pronunciation
        const cleanText = text.replace(/[*#_`~]/g, "");

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = "tr-TR";

        utterance.onend = () => {
          setPlayingMessageId(null);
        };
        utterance.onerror = () => {
          setPlayingMessageId(null);
        };

        setPlayingMessageId(msgId);
        window.speechSynthesis.speak(utterance);
      }
    } else {
      alert("Tarayıcınız ses seslendirme özelliğini desteklemiyor.");
    }
  };



  // Lock body scroll when chat is open (prevents background scrolling on mobile)
  useEffect(() => {
    document.body.classList.add('chat-open');
    return () => {
      document.body.classList.remove('chat-open');
    };
  }, []);

  // Auto-scroll to bottom — uses container scroll instead of scrollIntoView
  // to prevent the jarring jump when keyboard is open on mobile
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    // Use rAF to ensure DOM has painted the new message before scrolling
    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    });
  }, [messages, isLoading]);

  // Main chat initialization on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initializeChat = async () => {
      console.log("[ChatScreen] initializeChat started. InitialMessage:", initialMessage);
      try {
        const sessionId = getSessionId();
        console.log("[ChatScreen] Session ID obtained:", sessionId);

        setIsLoading(true);
        // 1. Initialize anonymous session
        console.log("[ChatScreen] Fetching /api/ortak/chat/anonim/baslat...");
        const startRes = await customFetch("/api/ortak/chat/anonim/baslat", { method: "POST" });
        console.log("[ChatScreen] Fetch /api/ortak/chat/anonim/baslat finished. Status:", startRes.status);
        if (!startRes.ok) {
          throw new Error('Oturum başlatılamadı.');
        }
        const startData = await safeJsonParse(startRes, 'Oturum başlatılamadı.');
        console.log("[ChatScreen] Session initialized on server. Data:", startData);
        
        setMessages([]);
        if (initialMessage && initialMessage.trim() !== "") {
          console.log("[ChatScreen] Sending initial message:", initialMessage);
          await sendMessage(initialMessage);
        } else {
          setMessages([
            {
              id: `assistant-welcome`,
              role: "assistant",
              content: startData.message || "Size bugün hangi konuda yardımcı olabilirim? (Örn: Ev temizliği, boya badana, tesisat veya elektrik işi...)",
              isStreaming: true,
            }
          ]);
        }
      } catch (err: any) {
        console.error("[ChatScreen] Chat initialization failed:", err);
        setMessages([
          {
            id: `init-error-${Date.now()}`,
            role: "assistant",
            content: `Sohbet başlatılamadı: ${err.message || "Bilinmeyen bir hata oluştu"}. Lütfen sayfayı yenileyip tekrar deneyin.`,
          }
        ]);
      } finally {
        setIsLoading(false);
        console.log("[ChatScreen] initializeChat finished.");
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

  // Restore focus to textarea ONLY on desktop — on mobile, auto-focus opens
  // the keyboard which pushes content up and hides the AI's last message
  useEffect(() => {
    if (!isLoading && currentStep !== "confirm_form" && currentStep !== "completed") {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      if (!isMobile) {
        const timer = setTimeout(() => {
          textareaRef.current?.focus();
        }, 50);
        return () => clearTimeout(timer);
      }
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
            description: offer.description || offer.message,
            message: offer.message || offer.description,
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
          content: `🔔 Hizmet vereniniz ${data.providerName} işin tamamlandığını beyan etti. Beyan Edilen Ücret: ${Number(data.price).toLocaleString("tr-TR")} ₺.\n\nLütfen aşağıdaki panelden ödediğiniz tutarı teyit edin.`,
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
        resultMsg = `🎉 İş başarıyla tamamlandı ve onaylandı! Ödenen Tutar: ${data.seekerDeclared} ₺. \n\nBizi tercih ettiğiniz için teşekkür ederiz! Hizmet kalitemizi artırmak için hizmet veren profilini puanlayabilirsiniz.`;
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

    // Stop speech recognition on message send to reset speech session history
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    baseTextRef.current = "";

    if (currentStep === "confirm_form" && (messageText.toLowerCase().includes("onayla") || messageText.toLowerCase() === "evet" || messageText.toLowerCase() === "doğru") && !kvkkChecked) {
      alert("Lütfen devam etmeden önce KVKK Aydınlatma Metni'ni onaylayın.");
      return;
    }

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
      // Otomatik retry mekanizması: 503/network hatalarında max 2 kez tekrar dene
      const MAX_RETRIES = 2;
      let lastErr: any = null;
      let data: any = null;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const response = await customFetch("/api/musteri/chat/mesaj", {
            method: "POST",
            body: JSON.stringify({ message: apiMessage }),
          });

          if (!response.ok) {
            const status = response.status;
            // 503 hatalarında retry
            if ((status === 503 || status === 502 || status === 504) && attempt < MAX_RETRIES) {
              console.warn(`[ChatScreen] Sunucu ${status} döndü. ${attempt + 1}/${MAX_RETRIES} tekrar deneniyor...`);
              // Kullanıcıya bekleme mesajı göster (sadece ilk retry'da)
              if (attempt === 0) {
                setMessages((prev) => [
                  ...prev,
                  {
                    id: `retry-wait-${Date.now()}`,
                    role: "assistant",
                    content: "Yanıt hazırlanıyor, lütfen bekleyin...",
                    isRetryWait: true,
                  },
                ]);
              }
              await new Promise((resolve) => setTimeout(resolve, 3000));
              continue;
            }
            const errorData = await safeJsonParse(response, "Mesaj iletilemedi.");
            throw new Error(errorData.error?.message || "Mesaj iletilemedi.");
          }

          data = await safeJsonParse(response, "Mesaj iletilemedi.");
          // Retry beklemesi varsa kaldır
          setMessages((prev) => prev.filter((m) => !(m as any).isRetryWait));
          break; // Başarılı, döngüden çık
        } catch (retryErr: any) {
          lastErr = retryErr;
          const isNetworkErr = retryErr.message && (
            retryErr.message.toLowerCase().includes("failed to fetch") ||
            retryErr.message.toLowerCase().includes("networkerror") ||
            retryErr.message.toLowerCase().includes("load failed")
          );
          if (isNetworkErr && attempt < MAX_RETRIES) {
            console.warn(`[ChatScreen] Ağ hatası. ${attempt + 1}/${MAX_RETRIES} tekrar deneniyor...`);
            if (attempt === 0) {
              setMessages((prev) => [
                ...prev,
                {
                  id: `retry-wait-${Date.now()}`,
                  role: "assistant",
                  content: "Bağlantı kontrol ediliyor, lütfen bekleyin...",
                  isRetryWait: true,
                },
              ]);
            }
            await new Promise((resolve) => setTimeout(resolve, 3000));
            continue;
          }
          throw retryErr; // Son deneme de başarısızsa üst catch'e ilet
        }
      }

      if (!data) {
        throw lastErr || new Error("Mesaj iletilemedi.");
      }

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
          isStreaming: true,
        },
      ]);

      // Store JWT tokens if session has migrated (OTP verified)
      if (data.sessionMigrated && data.accessToken) {
        localStorage.setItem("esnaaf_token", data.accessToken);
        localStorage.setItem("esnaaf_refresh_token", data.refreshToken || "");
        localStorage.setItem("esnaaf_user", JSON.stringify(data.user || null));
        console.log("[ChatScreen] Auto-logged in service seeker:", data.user);
      }

      // Detect if job has been created (contains jobId / completed step)
      if (data.step === "completed" || data.responseMessage.includes("Talebiniz #")) {
        const foundJobId = data.jobId || (data.responseMessage.match(/#([a-fA-F0-9-]{36})/i)?.[1] || "mock-job-uuid-12345");
        setJobId(foundJobId);

        // Redirect to Seeker Dashboard after a brief delay
        if (onJobCompleted) {
          setTimeout(() => {
            onJobCompleted(foundJobId);
          }, 1500);
        }
      }
    } catch (err: any) {
      console.error("Message send error:", err);
      // Retry bekleme mesajlarını temizle
      setMessages((prev) => prev.filter((m) => !(m as any).isRetryWait));
      let errMsg = "Bağlantıda bir sorun yaşandı. Lütfen internet bağlantınızı kontrol edip mesajınızı tekrar gönderin.";
      if (err.message && typeof err.message === 'string') {
        const lowerMsg = err.message.toLowerCase();
        if (!lowerMsg.includes("failed to fetch") && !lowerMsg.includes("fetch") && !lowerMsg.includes("networkerror") && !lowerMsg.includes("load failed")) {
          errMsg = err.message;
        }
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: errMsg,
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
    showConfirm(
      "Teklifi Kabul Et",
      `${offer.provider?.name || 'Hizmet Veren'} teklifini ${Number(offer.price).toLocaleString("tr-TR")} TL ile kabul etmek istediğinize emin misiniz?\n\nKabul ettiğinizde telefon numaralarınız karşılıklı olarak açılacaktır.`,
      async () => {
        setIsLoading(true);
        try {
          const res = await customFetch(`/api/musteri/teklifler/${offer.id}/kabul`, {
            method: 'POST',
            body: JSON.stringify({ consent: true }),
          });

          if (!res.ok) {
            const errorData = await safeJsonParse(res, 'Teklif kabul edilemedi.');
            throw new Error(errorData.error?.message || 'Teklif kabul edilemedi.');
          }

          const data = await safeJsonParse(res, 'Teklif kabul edilemedi.');
          setProviderId(offer.provider?.id || null);

          setMessages((prev) => [
            ...prev,
            {
              id: `accept-${Date.now()}`,
              role: 'assistant',
              content: `✅ Teklif başarıyla kabul edildi!\n\n📞 Hizmet Veren Telefon: ${data.providerPhone || 'Açıldı'}\n📞 Sizin Telefonunuz: ${data.seekerPhone || 'Paylaşıldı'}\n\nArtık doğrudan iletişime geçebilirsiniz.`,
            },
          ]);
        } catch (err: any) {
          console.error('Offer accept error:', err);
          alert(err.message || 'Teklif kabul sırasında bir hata oluştu.');
        } finally {
          setIsLoading(false);
        }
      }
    );
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
        const errorData = await safeJsonParse(res, "Teyit işlemi başarısız oldu.");
        throw new Error(errorData.error?.message || "Teyit işlemi başarısız oldu.");
      }

      const resData = await safeJsonParse(res, "Teyit işlemi başarısız oldu.");
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
        const errorData = await safeJsonParse(res, "Simülasyon başarısız oldu.");
        throw new Error(errorData.error?.message || "Simülasyon başarısız oldu.");
      }

      const data = await safeJsonParse(res, "Simülasyon başarısız oldu.");
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
        const { uploadUrl, downloadUrl } = await safeJsonParse(presignedRes, "Yükleme adresi alınamadı.");

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
        const errorData = await safeJsonParse(reviewRes, "Değerlendirme gönderilemedi.");
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
        const err = await safeJsonParse(res, "Hizmet veren favorilere eklenemedi.");
        alert(err.error?.message || "Hizmet veren favorilere eklenemedi.");
      }
    } catch (err: any) {
      console.error("Favoriye ekleme hatası:", err);
      alert(err.message || "Bir hata oluştu.");
    }
  };

  return (
    <div className="fixed inset-0 w-full bg-[#f8fafc] flex flex-col z-40 select-none overflow-hidden font-sans" style={{ height: '100dvh' }}>
      
      {/* Top Header bar with custom organic pin logo */}
      <header className="w-full h-14 md:h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] px-4 md:px-6 flex items-center justify-between z-50 shrink-0" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Esnaaf Logo"
            className="h-9 w-auto cursor-pointer object-contain"
            onClick={onClose}
          />
          <span className="text-[10px] font-bold bg-[#c8f252] text-slate-900 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
            Canlı Sohbet
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-800 p-2 rounded-full hover:bg-slate-50 cursor-pointer transition-all duration-150"
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
        <div className="w-full bg-slate-50 text-slate-800 py-2.5 px-4 flex flex-wrap items-center justify-center gap-2 border-b border-slate-200/60 text-xs font-sans z-40 shadow-sm animate-scale-up">
          <span className="font-extrabold text-slate-900 tracking-wider uppercase mr-1 animate-pulse flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c8f252] animate-ping"></span> 🛠️ Simülasyon:
          </span>
          <button
            onClick={() => handleSimulateProviderCompletion(850)}
            className="bg-white border border-slate-200 hover:border-[#c8f252] hover:bg-[#c8f252]/10 hover:text-slate-950 text-slate-700 px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all active:scale-95 shadow-sm text-[11px]"
          >
            Eşleşen Beyan (850 ₺)
          </button>
          <button
            onClick={() => handleSimulateProviderCompletion(1020)}
            className="bg-white border border-slate-200 hover:border-[#c8f252] hover:bg-[#c8f252]/10 hover:text-slate-950 text-slate-700 px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all active:scale-95 shadow-sm text-[11px]"
          >
            Sarı Alarm (%20 Fark - 1020 ₺)
          </button>
          <button
            onClick={() => handleSimulateProviderCompletion(1200)}
            className="bg-white border border-slate-200 hover:border-[#c8f252] hover:bg-[#c8f252]/10 hover:text-slate-950 text-slate-700 px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all active:scale-95 shadow-sm text-[11px]"
          >
            Kırmızı Alarm (%41 Fark - 1200 ₺)
          </button>
        </div>
      )}

      {/* Main scrolling viewport */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-3 md:px-4 py-4 md:py-6 flex flex-col gap-4 md:gap-6 md:max-w-[720px] md:mx-auto w-full" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
        {messages.map((msg) => {
          if (msg.role === "offer" && msg.offerData) {
            // RENDER WS LIVE OFFER BUBBLE
            return (
              <div
                key={msg.id}
                className="w-full flex flex-col items-center justify-center p-5 bg-white border border-[#c8f252] shadow-[0_10px_25px_-5px_rgba(200,242,82,0.12),0_8px_10px_-6px_rgba(200,242,82,0.1)] rounded-[24px] animate-scale-up gap-4.5 my-2"
              >
                <div className="flex items-center justify-between w-full border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#c8f252] text-slate-950 flex items-center justify-center font-bold text-lg shadow-sm">
                      🛠️
                    </div>
                    <div className="flex flex-col">
                      <span className="font-extrabold text-sm text-slate-900">
                        {msg.offerData.provider.name}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold mt-0.5">
                        ⭐ {msg.offerData.provider.rating.toFixed(1)} Puan · Ev Temizliği Uzmanı
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-slate-900 tracking-tight">
                      {Number(msg.offerData.price).toLocaleString("tr-TR")} ₺
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-slate-600 leading-relaxed w-full italic px-2 font-medium">
                  &ldquo;{msg.offerData.description || msg.offerData.message || "Açıklama belirtilmedi."}&rdquo;
                </p>

                <div className="flex items-center gap-2.5 w-full pt-2">
                  <button className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-all border border-slate-200/50">
                    Profili Gör
                  </button>
                  <button className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-all border border-slate-200/50">
                    Mesaj Gönder
                  </button>
                  <button
                    onClick={() => handleAcceptOffer(msg.offerData)}
                    className="flex-1 bg-[#c8f252] hover:bg-[#b5e639] text-slate-950 text-xs font-black py-2.5 rounded-xl cursor-pointer shadow-md shadow-[#c8f252]/20 hover:scale-102 transition-all border border-transparent"
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
                <img 
                  alt="Esnaaf AI Avatar" 
                  className="w-20 h-20 rounded-full object-contain shrink-0 select-none shadow-sm bg-white p-0.5 border border-slate-100" 
                  src="/bot-avatar.png" 
                />
              )}

              {/* Text Bubble */}
              <div
                className={`max-w-[80%] rounded-[20px] px-4 py-3 text-sm font-medium leading-relaxed shadow-[0_1px_3px_rgba(0,0,0,0.02)] border transition-all duration-200 ${
                  isUser
                    ? "bg-slate-900 text-white border-transparent rounded-br-[4px] self-end"
                    : "bg-white text-slate-800 border-slate-100 rounded-bl-[4px] self-start"
                }`}
              >
                {/* Parse newline characters for clean spacing */}
                {msg.role === "assistant" && msg.isStreaming ? (
                  <TypewriterText 
                    text={msg.content} 
                    onComplete={() => {
                      setMessages((prev) =>
                        prev.map((m) => (m.id === msg.id ? { ...m, isStreaming: false } : m))
                      );
                    }}
                  />
                ) : (
                  <p className="whitespace-pre-line">{msg.content}</p>
                )}



                {/* SUMMARY CARD IN THE SOHBET FLOW */}
                {msg.collected_data && currentStep === "confirm_form" && msg.id === [...messages].reverse().find(m => m.collected_data)?.id && (
                  <div className="mt-4 p-4.5 bg-slate-50 border border-slate-200/80 rounded-[20px] flex flex-col gap-3.5 shadow-inner">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200/60 pb-2">
                      📋 Talep Bilgileri
                    </h4>
                    <div className="flex flex-col gap-2 text-xs text-slate-700 font-semibold">
                      <div><strong className="text-slate-900">Hizmet:</strong> {
                        msg.collected_data.categorySlug === 'ev-temizligi' ? 'Ev Temizliği' : 
                        msg.collected_data.categorySlug === 'boya-badana' ? 'Boya Badana' : 
                        msg.collected_data.categorySlug === 'su-tesisati' ? 'Su Tesisatı' : 
                        msg.collected_data.categorySlug === 'elektrik-tesisati' ? 'Elektrik Tesisatı' : 
                        msg.collected_data.categorySlug === 'ev-tadilat' ? 'Ev Tadilatı' : 
                        msg.collected_data.categorySlug === 'nakliyat' ? 'Nakliyat / Taşıma' : 'Genel Esnaf Hizmeti'
                      }</div>
                      <div><strong className="text-slate-900">Ad Soyad:</strong> {msg.collected_data.name}</div>
                      
                      {msg.collected_data.categorySlug === 'nakliyat' ? (
                        <>
                          <div><strong className="text-slate-900">Çıkış Konumu:</strong> {msg.collected_data.district}, {msg.collected_data.city || resolveCityFromDistrict(msg.collected_data.district)}</div>
                          <div><strong className="text-slate-900">Varış Konumu:</strong> {msg.collected_data.destinationDistrict}, {msg.collected_data.destinationCity || msg.collected_data.city || resolveCityFromDistrict(msg.collected_data.destinationDistrict)}</div>
                          {Object.entries(msg.collected_data).map(([key, val]) => {
                            if (['name', 'phone', 'city', 'district', 'destinationDistrict', 'destinationCity', 'categorySlug', 'details', 'sendToFavoritesOnly', 'hasAskedDetails'].includes(key)) return null;
                            if (!val) return null;
                            const label = FIELD_LABELS[key] || key;
                            return (
                              <div key={key}><strong className="text-slate-900">{label}:</strong> {String(val)}</div>
                            );
                          })}
                        </>
                      ) : (
                        <>
                          <div><strong className="text-slate-900">Konum:</strong> {msg.collected_data.district || 'Belirtilmedi'}{msg.collected_data.district ? `, ${msg.collected_data.city || resolveCityFromDistrict(msg.collected_data.district)}` : ''}</div>
                          {Object.entries(msg.collected_data).map(([key, val]) => {
                            if (['name', 'phone', 'city', 'district', 'categorySlug', 'details', 'sendToFavoritesOnly', 'hasAskedDetails'].includes(key)) return null;
                            if (!val) return null;
                            const label = FIELD_LABELS[key] || key;
                            return (
                              <div key={key}><strong className="text-slate-900">{label}:</strong> {String(val)}</div>
                            );
                          })}
                        </>
                      )}
                      <div><strong className="text-slate-900">Açıklama:</strong> {msg.collected_data.details || "Standart Hizmet"}</div>
                    </div>
                    <div className="flex items-start gap-2.5 py-1 px-0.5 text-xs text-slate-600 border-t border-slate-200/60 pt-2.5">
                      <input
                        type="checkbox"
                        id="kvkkConsent"
                        checked={kvkkChecked}
                        onChange={(e) => setKvkkChecked(e.target.checked)}
                        className="w-4 h-4 accent-[#c8f252] cursor-pointer rounded mt-0.5"
                      />
                      <label htmlFor="kvkkConsent" className="cursor-pointer select-none text-slate-700 leading-normal">
                        <strong className="text-slate-950 font-bold">KVKK Aydınlatma Metni</strong>'ni okudum ve verilerimin işlenmesini kabul ediyorum.
                      </label>
                    </div>

                    <div className="flex items-center gap-2 pt-2.5 border-t border-slate-200/60">
                      <button
                        onClick={() => sendMessage("Düzelt")}
                        className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-xs cursor-pointer active:scale-95 transition-all"
                      >
                        ✏️ Düzelt
                      </button>
                      <button
                        onClick={() => sendMessage("Onayla")}
                        className="flex-1 bg-[#c8f252] hover:bg-[#b5e639] text-slate-950 py-2.5 rounded-xl font-bold text-xs cursor-pointer shadow-sm active:scale-95 transition-all"
                      >
                        Onayla
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
          <div className="flex w-full items-end gap-3.5 justify-start">
            <img 
              alt="Esnaaf AI Avatar" 
              className="w-20 h-20 rounded-full object-contain shrink-0 select-none shadow-sm bg-white p-0.5 border border-slate-100" 
              src="/bot-avatar.png" 
            />
            <div className="bg-white border border-slate-100 rounded-[20px] rounded-bl-[4px] px-5 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-1.5 h-3">
                <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        )}

        {/* BEKLEME EKRANI loader displayed after job submission */}
        {jobId && currentStep === "completed" && !completionState && (
          <div className="w-full flex flex-col items-center justify-center p-6 bg-white border border-slate-150 rounded-[24px] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.02)] text-center animate-scale-up gap-4.5 mt-2 mb-12">
            <div className="relative w-12 h-12 flex items-center justify-center">
              {/* Premium Neon lime spinning loading loader */}
              <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-[#c8f252] animate-spin"></div>
            </div>
            <div className="flex flex-col gap-1.5">
              <h4 className="font-extrabold text-sm text-slate-900">Teklifler Bekleniyor...</h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-[280px] font-semibold">
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
          <div className="w-full flex flex-col p-5 bg-white border border-slate-150 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03)] rounded-[24px] animate-scale-up gap-4 my-4 mb-12">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-lg select-none">
                💼
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-slate-900">İş Tamamlama Teyidi</span>
                <span className="text-xs text-slate-500 font-bold">Karşılıklı Ücret Onayı</span>
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
                    id="serviceNotReceived"
                    checked={isServiceNotReceived}
                    onChange={(e) => setIsServiceNotReceived(e.target.checked)}
                    className="w-4 h-4 rounded text-slate-900 focus:ring-[#c8f252] accent-slate-900 cursor-pointer"
                  />
                  <label htmlFor="serviceNotReceived" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
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
          <div className="w-full flex flex-col p-5 bg-white border border-slate-150 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03)] rounded-[24px] animate-scale-up gap-4.5 my-4 mb-12 items-center text-center">
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
          <div className="w-full flex flex-col p-5 bg-white border border-red-200 shadow-[0_10px_25px_-5px_rgba(239,68,68,0.05)] rounded-[24px] animate-scale-up gap-3.5 my-4 mb-12 items-center text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center font-bold text-2xl animate-pulse shadow-sm border border-red-100">
              ⚠️
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-extrabold text-sm text-slate-900">Uyuşmazlık Kaydı Oluşturuldu</span>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-[280px]">
                Hizmet veren ile beyan ettiğiniz ücretler uyuşmamaktadır. Kalite personeli ekibimiz iki tarafla da görüşerek çözüm sağlayacaktır.
              </p>
            </div>
            {finalDetails && (
              <div className="bg-red-50/50 p-3.5 rounded-xl border border-red-100 text-[11px] text-red-700 font-bold w-full flex flex-col gap-1.5 text-left">
                <div>Hizmet Veren Beyan Tutarı: {finalDetails.providerDeclared || providerDeclaredAmount} ₺</div>
                <div>Sizin Beyan Tutarınız: {finalDetails.seekerDeclared || seekerDisputeAmount} ₺</div>
                <div>Sapma Oranı: %{finalDetails.amountDiffPct ? finalDetails.amountDiffPct.toFixed(1) : "0.0"}</div>
              </div>
            )}
          </div>
        )}

        <div ref={scrollRef} className="h-2"></div>
      </div>

      {/* Bottom Fixed Chat Input Bar */}
      <footer className="w-full border-t border-slate-100 bg-white px-3 md:px-4 pt-3 shrink-0 z-50 shadow-sm" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 8px), 12px)' }}>
        <div className="w-full md:max-w-[720px] md:mx-auto flex items-end gap-3 relative bg-slate-50 rounded-[20px] border border-slate-200 focus-within:border-[#c8f252] focus-within:ring-2 focus-within:ring-[#c8f252]/15 transition-all p-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onFocus={() => {
              // When user taps the input and keyboard opens on mobile,
              // wait for the keyboard animation to finish, then scroll
              // to bottom so the AI's last message stays visible
              setTimeout(() => {
                const container = chatContainerRef.current;
                if (container) {
                  container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'smooth',
                  });
                }
              }, 350);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Mesajınızı buraya yazın..."
            disabled={isLoading || currentStep === "confirm_form" || currentStep === "completed"}
            className="flex-1 bg-transparent border-0 outline-none text-slate-800 font-semibold text-sm p-2 resize-none leading-relaxed focus:ring-0 disabled:text-slate-400 max-h-[200px] overflow-y-auto min-h-[36px]"
          />
          {/* Sound Wave Visualizer when recording in chat */}
          {isListening && (
            <div className="flex items-end gap-[3px] h-4 px-1 select-none shrink-0" title="Mikrofonunuz dinleniyor...">
              <span className="w-[2.5px] h-full bg-rose-500 rounded-full animate-sound-wave-1 origin-bottom"></span>
              <span className="w-[2.5px] h-full bg-rose-500 rounded-full animate-sound-wave-2 origin-bottom"></span>
              <span className="w-[2.5px] h-full bg-rose-500 rounded-full animate-sound-wave-3 origin-bottom"></span>
              <span className="w-[2.5px] h-full bg-rose-500 rounded-full animate-sound-wave-4 origin-bottom"></span>
              <span className="w-[2.5px] h-full bg-rose-500 rounded-full animate-sound-wave-5 origin-bottom"></span>
            </div>
          )}

          {/* Microphone Button (Speech to Text) */}
          <button
            onClick={startSpeechRecognition}
            disabled={isLoading || currentStep === "confirm_form" || currentStep === "completed"}
            title={isListening ? "Dinlemeyi Durdur" : "Sesle Anlat"}
            className={`w-10 h-10 rounded-[12px] border flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0 bg-transparent ${
              isListening
                ? "border-rose-300 bg-rose-50/50 text-rose-600 animate-pulse"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500"
            }`}
          >
            {isListening ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="9" y="9" width="6" height="6" rx="1" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            )}
          </button>

          <button
            onClick={handleSend}
            disabled={!inputVal.trim() || isLoading || currentStep === "confirm_form" || currentStep === "completed"}
            className="bg-[#c8f252] hover:bg-[#b5e639] disabled:bg-slate-200 text-slate-955 disabled:text-slate-400 w-10 h-10 rounded-[12px] flex items-center justify-center cursor-pointer shadow-sm hover:scale-102 active:scale-97 transition-all duration-150 shrink-0 border border-transparent"
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



      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scaleUp {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up {
          animation: scaleUp 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  );
}
