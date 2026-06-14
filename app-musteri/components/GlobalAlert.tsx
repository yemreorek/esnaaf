"use client";

import { useEffect, useState } from "react";

export default function GlobalAlert() {
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.alert = (message: string) => {
        const msgStr = typeof message === "object" ? JSON.stringify(message) : String(message);

        // Analyze message to determine type
        const isSuccess =
          msgStr.includes("başarıyla") ||
          msgStr.includes("Başarılı") ||
          msgStr.includes("kopyalandı") ||
          msgStr.includes("kaydedildi") ||
          msgStr.includes("güncellendi") ||
          msgStr.includes("onaylandı") ||
          msgStr.includes("kabul edildi") ||
          msgStr.includes("teyit edildi");
        const isError =
          msgStr.includes("hata") ||
          msgStr.includes("başarısız") ||
          msgStr.includes("Geçersiz") ||
          msgStr.includes("Hata") ||
          msgStr.includes("eklenemedi") ||
          msgStr.includes("güncellenemedi") ||
          msgStr.toLowerCase().includes("unauthorized") ||
          msgStr.toLowerCase().includes("yetkisiz");

        const type = isSuccess ? "success" : isError ? "error" : "info";
        const title = isSuccess ? "Başarılı" : isError ? "Hata" : "Bilgi";

        // Translate "Unauthorized" to a user-friendly Turkish message
        let displayMessage = msgStr;
        if (displayMessage.toLowerCase() === "unauthorized") {
          displayMessage = "Oturumunuzun süresi dolmuş veya bu işlem için yetkiniz bulunmuyor. Lütfen tekrar giriş yapın.";
        }

        setAlertModal({
          isOpen: true,
          title,
          message: displayMessage,
          type,
        });
      };
    }
  }, []);

  if (!alertModal.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
      <div className="bg-white/95 border border-slate-100 rounded-[32px] p-6 max-w-sm w-full shadow-2xl animate-scale-up space-y-6 text-center backdrop-blur-lg">
        {/* Animated Custom Status Icon */}
        <div className="flex justify-center">
          {alertModal.type === "success" && (
            <div className="w-16 h-16 rounded-full bg-[#c8f252]/20 border border-[#c8f252]/40 flex items-center justify-center text-[#4c630a] shadow-inner animate-scale-up">
              <svg className="w-8 h-8 stroke-current animate-draw-check" fill="none" viewBox="0 0 24 24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          )}
          {alertModal.type === "error" && (
            <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-150 flex items-center justify-center text-rose-650 shadow-inner animate-scale-up">
              <svg className="w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
          )}
          {alertModal.type === "info" && (
            <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-150 flex items-center justify-center text-blue-650 shadow-inner animate-scale-up">
              <svg className="w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
          )}
        </div>

        {/* Modal Texts */}
        <div className="space-y-2">
          <h4 className="font-extrabold text-slate-900 text-base tracking-tight">{alertModal.title}</h4>
          <p className="text-slate-500 text-xs font-semibold leading-relaxed whitespace-pre-line text-center">
            {alertModal.message}
          </p>
        </div>

        {/* Dismiss Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setAlertModal((prev) => ({ ...prev, isOpen: false }))}
            className="w-full bg-[#c8f252] text-slate-950 hover:bg-[#b5e639] text-xs font-black py-3 rounded-2xl cursor-pointer transition-all active:scale-95 border border-transparent shadow-md shadow-[#c8f252]/20 font-sans tracking-wide uppercase"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
}
