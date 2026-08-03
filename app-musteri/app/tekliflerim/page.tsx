"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SeekerDashboard from "../../components/SeekerDashboard";
import { isLoggedIn, getAuthUser, logout } from "../../lib/session";
import Link from "next/link";

function TekliflerimContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId") || searchParams.get("id");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 font-medium text-sm">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SeekerDashboard
        initialJobId={jobId || undefined}
        onLogout={() => {
          logout();
          window.location.href = "/";
        }}
      />
    </div>
  );
}

export default function TekliflerimPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-600 font-medium text-sm">Yükleniyor...</p>
          </div>
        </div>
      }
    >
      <TekliflerimContent />
    </Suspense>
  );
}
