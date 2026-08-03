"use client";

import { useEffect, useState, use } from "react";
import SeekerDashboard from "../../../components/SeekerDashboard";
import { logout } from "../../../lib/session";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TalepDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const jobId = resolvedParams.id;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 font-medium text-sm">Talep Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SeekerDashboard
        initialJobId={jobId}
        onLogout={() => {
          logout();
          window.location.href = "/";
        }}
      />
    </div>
  );
}
