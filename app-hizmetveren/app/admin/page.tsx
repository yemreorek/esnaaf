'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Users, 
  CheckCircle, 
  Briefcase, 
  Search, 
  Power, 
  Ban, 
  Trash2, 
  Eye, 
  Lock, 
  RefreshCw, 
  X, 
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  FileText,
  Percent,
  Sliders
} from 'lucide-react';

interface Stats {
  todayNewRequests: number;
  todayNewUsers: number;
  todayOpenComplaints: number;
  pendingProviders: number;
  pendingComments: number;
  pendingDisputes: number;
  kvkkRequests: number;
  payments24h: {
    success: number;
    failed: number;
    pending: number;
  };
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  phone_masked: string;
  phone_decrypted?: string;
  role: string;
  is_active: boolean;
  kvkk_consent: boolean;
  created_at: string;
}

interface Provider {
  id: string;
  user_id: string;
  category_ids: string[];
  is_approved: boolean;
  user: User;
}

export default function AdminPortal() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'approvals' | 'reviews' | 'nps' | 'abtest'>('dashboard');
  const [logMessages, setLogMessages] = useState<string[]>([]);
  
  // Data states
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [approvals, setApprovals] = useState<Provider[]>([]);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);

  // NPS & A/B testing & Role-based Dashboard states
  const [npsStats, setNpsStats] = useState<any>(null);
  const [npsAlarms, setNpsAlarms] = useState<any[]>([]);
  const [loadingNps, setLoadingNps] = useState(false);
  
  const [dashboardRole, setDashboardRole] = useState<'executive' | 'quality_staff' | 'sales_staff'>('executive');
  const [roleStats, setRoleStats] = useState<any>(null);
  const [loadingRoleStats, setLoadingRoleStats] = useState(false);
  
  const [abTestConfig, setAbTestConfig] = useState<any>({
    chatModel: 'gpt-4o',
    temperature: 0.7,
    splitRatio: 0.5,
  });
  const [savingAbConfig, setSavingAbConfig] = useState(false);
  
  // Search & Filter states for Users
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Modals / Overlays
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [banUserTarget, setBanUserTarget] = useState<User | null>(null);
  const [banReason, setBanReason] = useState('fake_profile');
  const [banNotes, setBanNotes] = useState('');
  
  const [rejectProviderTarget, setRejectProviderTarget] = useState<Provider | null>(null);
  const [rejectReason, setRejectReason] = useState('R01');
  const [rejectNotes, setRejectNotes] = useState('');
  
  const [viewDocsTarget, setViewDocsTarget] = useState<Provider | null>(null);

  // System Log helper
  const addLog = (msg: string) => {
    setLogMessages((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 20)]);
  };

  // 1. Geliştirici Girişi: Admin Yetkisi Al
  const handleAdminLogin = async () => {
    setLoading(true);
    addLog('Admin simüle giriş başlatılıyor...');
    const adminPhone = '+905999999999';

    try {
      // Step A: Send OTP
      const sendRes = await fetch('/api/ortak/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: adminPhone }),
      });
      const sendData = await sendRes.json();
      if (!sendRes.ok) {
        throw new Error(sendData.error?.message || 'OTP gönderimi başarısız.');
      }

      const devOtpCode = sendData.devOtpCode;
      addLog(`Doğrulama kodu alındı (Yönetici): ${devOtpCode}`);

      // Step B: Verify OTP to obtain real JWT Access Token
      const verifyRes = await fetch('/api/ortak/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: adminPhone, code: devOtpCode }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error?.message || 'OTP doğrulaması başarısız.');
      }

      const accessToken = verifyData.accessToken;
      setToken(accessToken);
      addLog('Yönetici yetkileri tescil edildi! Giriş Başarılı.');

      // Load all admin data
      await refreshAllData(accessToken);

    } catch (err: any) {
      addLog(`Giriş Hatası: ${err.message}`);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Load/Refresh Admin Data
  const refreshAllData = async (accessToken: string) => {
    await Promise.all([
      loadStats(accessToken),
      loadUsers(accessToken, 1),
      loadApprovals(accessToken),
      loadPendingReviews(accessToken),
      loadRoleDashboardStats(accessToken, dashboardRole),
      loadNpsData(accessToken),
      loadAbTestConfig(accessToken)
    ]);
  };

  const loadNpsData = async (accessToken: string) => {
    setLoadingNps(true);
    try {
      const statsRes = await fetch('/api/admin/nps/stats', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const alarmsRes = await fetch('/api/admin/nps/alarms', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      const statsData = await statsRes.json();
      const alarmsData = await alarmsRes.json();

      if (statsRes.ok) setNpsStats(statsData);
      if (alarmsRes.ok) setNpsAlarms(alarmsData);
      addLog('NPS istatistikleri ve detraktör alarmları yüklendi.');
    } catch (err: any) {
      addLog(`NPS verileri yüklenirken hata oluştu: ${err.message}`);
    } finally {
      setLoadingNps(false);
    }
  };

  const loadRoleDashboardStats = async (accessToken: string, roleName: string) => {
    setLoadingRoleStats(true);
    try {
      const res = await fetch(`/api/admin/dashboard/role/${roleName}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setRoleStats(data);
        addLog(`Rol tabanlı dashboard metrikleri yüklendi: ${roleName}`);
      }
    } catch (err: any) {
      addLog(`Rol tabanlı metrik yükleme hatası: ${err.message}`);
    } finally {
      setLoadingRoleStats(false);
    }
  };

  const loadAbTestConfig = async (accessToken: string) => {
    try {
      const res = await fetch('/api/admin/ab-test/config', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAbTestConfig(data);
        addLog('Yapay Zeka A/B test parametreleri yüklendi.');
      }
    } catch (err: any) {
      addLog(`A/B test ayarları yüklenemedi: ${err.message}`);
    }
  };

  const handleSaveAbTestConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingAbConfig(true);
    try {
      const res = await fetch('/api/admin/ab-test/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(abTestConfig)
      });
      const data = await res.json();
      if (res.ok) {
        addLog('A/B test konfigürasyonu güncellendi.');
        alert('A/B Test ayarları başarıyla kaydedildi!');
      } else {
        alert(data.error?.message || 'A/B Test ayarları kaydedilemedi.');
      }
    } catch (err: any) {
      addLog(`A/B test kaydetme hatası: ${err.message}`);
    } finally {
      setSavingAbConfig(false);
    }
  };

  const loadStats = async (accessToken: string) => {
    try {
      const res = await fetch('/api/admin/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStats(data);
        addLog('Dashboard istatistikleri güncellendi.');
      }
    } catch (err: any) {
      addLog(`Metrik yükleme hatası: ${err.message}`);
    }
  };

  const loadUsers = async (accessToken: string, pageNum: number = 1) => {
    try {
      const url = new URL('/api/admin/users', window.location.origin);
      url.searchParams.append('page', pageNum.toString());
      url.searchParams.append('limit', '10');
      if (searchQuery) url.searchParams.append('search', searchQuery);
      if (roleFilter) url.searchParams.append('role', roleFilter);
      if (statusFilter) url.searchParams.append('status', statusFilter);

      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.data);
        setTotalUsers(data.total);
        setUserPage(pageNum);
        addLog(`Kullanıcı listesi yüklendi. Toplam kayıt: ${data.total}`);
      }
    } catch (err: any) {
      addLog(`Kullanıcı yükleme hatası: ${err.message}`);
    }
  };

  const loadApprovals = async (accessToken: string) => {
    try {
      const res = await fetch('/api/admin/hizmetveren/onay-kuyrugu', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setApprovals(data);
        addLog(`Hizmet veren onay kuyruğu güncellendi. Bekleyen: ${data.length}`);
      }
    } catch (err: any) {
      addLog(`Onay kuyruğu yükleme hatası: ${err.message}`);
    }
  };

  const loadPendingReviews = async (accessToken: string) => {
    try {
      const res = await fetch('/api/admin/reviews/queue', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setPendingReviews(data);
        addLog(`Yorum onay kuyruğu güncellendi. Bekleyen: ${data.length}`);
      }
    } catch (err: any) {
      addLog(`Yorum kuyruğu yükleme hatası: ${err.message}`);
    }
  };

  const handleApproveReview = async (reviewId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        addLog(`Yorum onaylandı: ID ${reviewId}`);
        alert('Yorum onaylandı ve usta profili güncellendi!');
        await loadPendingReviews(token);
        await loadStats(token);
      } else {
        alert(data.error?.message || 'İşlem başarısız.');
      }
    } catch (err: any) {
      addLog(`Yorum onaylama hatası: ${err.message}`);
    }
  };

  const handleRejectReview = async (reviewId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}/reject`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        addLog(`Yorum reddedildi: ID ${reviewId}`);
        alert('Yorum reddedildi ve kuyruktan kaldırıldı.');
        await loadPendingReviews(token);
        await loadStats(token);
      } else {
        alert(data.error?.message || 'İşlem başarısız.');
      }
    } catch (err: any) {
      addLog(`Yorum reddetme hatası: ${err.message}`);
    }
  };

  // 3. User operations
  const handleToggleActive = async (userId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-active`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        addLog(`Kullanıcı durumu güncellendi: ID ${userId} - ${data.isActive ? 'Aktif' : 'Pasif'}`);
        await loadUsers(token, userPage);
        await loadStats(token);
      } else {
        alert(data.error?.message || 'İşlem başarısız.');
      }
    } catch (err: any) {
      addLog(`Aktiflik değiştirme hatası: ${err.message}`);
    }
  };

  const handleBanUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !banUserTarget) return;

    try {
      const res = await fetch(`/api/admin/users/${banUserTarget.id}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: banReason, notes: banNotes })
      });
      const data = await res.json();
      if (res.ok) {
        addLog(`Kullanıcı banlandı: ${banUserTarget.name || 'N/A'} | Sebep: ${banReason}`);
        alert('Kullanıcı başarıyla banlandı.');
        setBanUserTarget(null);
        setBanNotes('');
        await loadUsers(token, userPage);
        await loadStats(token);
      } else {
        alert(data.error?.message || 'Banlama başarısız.');
      }
    } catch (err: any) {
      addLog(`Banlama hatası: ${err.message}`);
    }
  };

  const handleKvkkForceDelete = async (userId: string) => {
    if (!confirm('DİKKAT: Bu kullanıcının tüm kişisel verileri (ad, telefon, e-posta) KVKK gereğince tamamen ve geri alınamaz biçimde silinecektir. Onaylıyor musunuz?')) {
      return;
    }
    if (!token) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}/kvkk-delete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        addLog(`Kullanıcı verileri KVKK kapsamında silindi: ID ${userId}`);
        alert('Kullanıcı verileri başarıyla anonimleştirildi.');
        setSelectedUser(null);
        await loadUsers(token, userPage);
        await loadStats(token);
      } else {
        alert(data.error?.message || 'KVKK silme işlemi başarısız.');
      }
    } catch (err: any) {
      addLog(`KVKK silme hatası: ${err.message}`);
    }
  };

  const showUserDetail = async (userId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedUser(data);
      } else {
        alert(data.error?.message || 'Detaylar yüklenemedi.');
      }
    } catch (err: any) {
      addLog(`Detay yükleme hatası: ${err.message}`);
    }
  };

  // 4. Provider Approvals
  const handleApproveProvider = async (providerId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/hizmetveren/${providerId}/onay`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        addLog(`Hizmet veren başvurusu onaylandı: ID ${providerId}`);
        alert('Hizmet veren onaylandı ve HV-14 bildirimi gönderildi.');
        await loadApprovals(token);
        await loadStats(token);
      } else {
        alert(data.error?.message || 'Onaylama başarısız.');
      }
    } catch (err: any) {
      addLog(`Onay hatası: ${err.message}`);
    }
  };

  const handleRejectProviderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !rejectProviderTarget) return;

    try {
      const res = await fetch(`/api/admin/hizmetveren/${rejectProviderTarget.id}/red`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reasonCode: rejectReason, notes: rejectNotes })
      });
      const data = await res.json();
      if (res.ok) {
        addLog(`Hizmet veren başvurusu reddedildi: ID ${rejectProviderTarget.id} | Kod: ${rejectReason}`);
        alert(`Hizmet veren reddedildi ve HV-15 mail bildirimi tetiklendi.`);
        setRejectProviderTarget(null);
        setRejectNotes('');
        await loadApprovals(token);
        await loadStats(token);
      } else {
        alert(data.error?.message || 'Reddetme başarısız.');
      }
    } catch (err: any) {
      addLog(`Red hatası: ${err.message}`);
    }
  };

  // Trigger user load on search / filter updates
  useEffect(() => {
    if (token) {
      loadUsers(token, 1);
    }
  }, [searchQuery, roleFilter, statusFilter]);

  // Cron simulation stats automatic refresh
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      loadStats(token);
      addLog('Metrikler otomatik yenilendi (SLA 60s)');
    }, 60000);
    return () => clearInterval(interval);
  }, [token]);

  // A/B, NPS, and Role Dashboard reactivity
  useEffect(() => {
    if (token) {
      if (activeTab === 'dashboard') {
        loadRoleDashboardStats(token, dashboardRole);
      } else if (activeTab === 'nps') {
        loadNpsData(token);
      } else if (activeTab === 'abtest') {
        loadAbTestConfig(token);
      }
    }
  }, [activeTab, token]);

  useEffect(() => {
    if (token && activeTab === 'dashboard') {
      loadRoleDashboardStats(token, dashboardRole);
    }
  }, [dashboardRole, token]);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-12">
      {/* 🚀 Admin Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center font-extrabold text-zinc-950 text-xl shadow-lg shadow-accent/25">
              e.
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Esnaaf Admin
                <span className="bg-red-500/25 border border-red-500/50 text-red-400 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md">
                  Panel
                </span>
              </h1>
              <p className="text-xs text-zinc-400">Merkezi Denetim ve Güvenlik Yönetimi</p>
            </div>
          </div>

          {/* Simulated Super Admin Login */}
          {!token ? (
            <button
              onClick={handleAdminLogin}
              disabled={loading}
              className="bg-accent hover:bg-accent/90 text-zinc-950 font-black text-sm px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-accent/20 hover:scale-105 active:scale-95"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? 'Yükleniyor...' : 'Süper Admin Olarak Giriş Yap'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-zinc-850 px-4 py-2.5 rounded-xl border border-zinc-800">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
              <div className="text-right">
                <p className="text-xs font-black text-white">Süper Admin</p>
                <p className="text-[10px] text-zinc-400">admin@esnaaf.com</p>
              </div>
              <button 
                onClick={() => setToken(null)}
                className="text-zinc-500 hover:text-zinc-300 text-xs font-bold border-l border-zinc-700 pl-3 ml-1"
              >
                Çıkış
              </button>
            </div>
          )}
        </div>
      </header>

      {!token ? (
        <section className="max-w-xl mx-auto px-6 mt-20 text-center">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 shadow-xl">
            <Lock className="w-16 h-16 text-accent mx-auto mb-6 drop-shadow-[0_0_8px_rgba(212,245,78,0.3)] animate-pulse" />
            <h2 className="text-2xl font-black text-white mb-3">Admin Girişi Gerekli</h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-8">
              Esnaaf Platformu Yönetim Arayüzüne erişmek için Süper Admin kimlik yetkilerinin alınması gerekmektedir. Aşağıdaki buton aracılığıyla simüle OTP doğrulamasını anında yürütebilirsiniz.
            </p>
            <button
              onClick={handleAdminLogin}
              disabled={loading}
              className="w-full bg-accent hover:bg-accent/90 text-zinc-950 font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent/10"
            >
              <Lock className="w-5 h-5" />
              <span>{loading ? 'OTP Gönderiliyor...' : 'Denetçi Oturumu Başlat (Tek Tık)'}</span>
            </button>
          </div>
        </section>
      ) : (
        <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Navigation Tabs Sidebar */}
          <nav className="lg:col-span-3 flex flex-col gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left px-5 py-4 rounded-2xl font-black text-sm flex items-center justify-between transition-all border ${
                activeTab === 'dashboard'
                  ? 'bg-zinc-900 border-zinc-700 text-accent font-extrabold shadow-md'
                  : 'bg-transparent border-transparent text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5" />
                <span>Genel Durum (Stats)</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full text-left px-5 py-4 rounded-2xl font-black text-sm flex items-center justify-between transition-all border ${
                activeTab === 'users'
                  ? 'bg-zinc-900 border-zinc-700 text-accent font-extrabold shadow-md'
                  : 'bg-transparent border-transparent text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5" />
                <span>Kullanıcı Yönetimi</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`w-full text-left px-5 py-4 rounded-2xl font-black text-sm flex items-center justify-between transition-all border ${
                activeTab === 'approvals'
                  ? 'bg-zinc-900 border-zinc-700 text-accent font-extrabold shadow-md'
                  : 'bg-transparent border-transparent text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5" />
                <span>Hizmet Veren Onay</span>
              </div>
              <span className="bg-red-500/25 border border-red-500/50 text-red-400 text-xs px-2.5 py-0.5 rounded-lg font-bold">
                {approvals.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`w-full text-left px-5 py-4 rounded-2xl font-black text-sm flex items-center justify-between transition-all border ${
                activeTab === 'reviews'
                  ? 'bg-zinc-900 border-zinc-700 text-accent font-extrabold shadow-md'
                  : 'bg-transparent border-transparent text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5" />
                <span>Yorum Onay Kuyruğu</span>
              </div>
              {stats && stats.pendingComments > 0 && (
                <span className="bg-red-500/25 border border-red-500/50 text-red-400 text-xs px-2.5 py-0.5 rounded-lg font-bold">
                  {stats.pendingComments}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('nps')}
              className={`w-full text-left px-5 py-4 rounded-2xl font-black text-sm flex items-center justify-between transition-all border ${
                activeTab === 'nps'
                  ? 'bg-zinc-900 border-zinc-700 text-accent font-extrabold shadow-md'
                  : 'bg-transparent border-transparent text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Percent className="w-5 h-5" />
                <span>NPS Analiz Paneli</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>

            <button
              onClick={() => setActiveTab('abtest')}
              className={`w-full text-left px-5 py-4 rounded-2xl font-black text-sm flex items-center justify-between transition-all border ${
                activeTab === 'abtest'
                  ? 'bg-zinc-900 border-zinc-700 text-accent font-extrabold shadow-md'
                  : 'bg-transparent border-transparent text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sliders className="w-5 h-5" />
                <span>A/B Test ve Ar-Ge</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>

            {/* SLA Timer Indicator */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mt-4 text-center">
              <RefreshCw className="w-5 h-5 text-accent mx-auto mb-2.5 animate-spin" style={{ animationDuration: '3s' }} />
              <p className="text-xs text-zinc-400 font-semibold">Dashboard Canlı Senkronizasyon</p>
              <p className="text-[10px] text-zinc-500 mt-1">Son Güncelleme: 60 saniyede bir</p>
            </div>
          </nav>

          {/* Main Panel Content Area */}
          <section className="lg:col-span-9 flex flex-col gap-6">
            
            {/* TAB 1: DASHBOARD METRICS */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-accent" />
                  <span>Genel Durum ve SLA Metrikleri</span>
                </h2>

                {stats ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {/* Stat 1 */}
                      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-black/40">
                        <div className="absolute right-4 top-4 bg-accent-light/10 border border-accent/20 w-10 h-10 rounded-xl flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-accent" />
                        </div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Bugün Yeni Talep</p>
                        <h3 className="text-4xl font-black text-white mt-3">{stats.todayNewRequests}</h3>
                        <p className="text-[10px] text-zinc-500 mt-1">Platform genelinde açılan</p>
                      </div>

                      {/* Stat 2 */}
                      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-black/40">
                        <div className="absolute right-4 top-4 bg-accent-light/10 border border-accent/20 w-10 h-10 rounded-xl flex items-center justify-center">
                          <Users className="w-5 h-5 text-accent" />
                        </div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Bugün Yeni Kayıt</p>
                        <h3 className="text-4xl font-black text-white mt-3">{stats.todayNewUsers}</h3>
                        <p className="text-[10px] text-zinc-500 mt-1">Seeker / Provider kaydı</p>
                      </div>

                      {/* Stat 3 */}
                      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-zinc-950/50">
                        <div className="absolute right-4 top-4 bg-red-500/10 border border-red-500/20 w-10 h-10 rounded-xl flex items-center justify-center">
                          <ShieldAlert className="w-5 h-5 text-red-400" />
                        </div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Aktif Uyuşmazlık</p>
                        <h3 className="text-4xl font-black text-red-500 mt-3">{stats.todayOpenComplaints}</h3>
                        <p className="text-[10px] text-red-400/60 mt-1">Müşteri itirazlı iş bitişleri</p>
                      </div>
                    </div>

                    {/* Pending actions block */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl">
                      <h3 className="text-sm font-black text-zinc-300 uppercase tracking-wider border-b border-zinc-850 pb-3 mb-5">
                        Bekleyen Operasyonel İşlemler
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-850 text-center">
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Onay Bekleyen Usta</p>
                          <h4 className="text-2xl font-black text-accent mt-2">{stats.pendingProviders}</h4>
                        </div>
                        <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-850 text-center">
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Onay Bekleyen Yorum</p>
                          <h4 className="text-2xl font-black text-zinc-400 mt-2">{stats.pendingComments}</h4>
                        </div>
                        <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-850 text-center">
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Bekleyen İtiraz</p>
                          <h4 className="text-2xl font-black text-red-400 mt-2">{stats.pendingDisputes}</h4>
                        </div>
                        <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-850 text-center">
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">KVKK Başvurusu</p>
                          <h4 className="text-2xl font-black text-zinc-400 mt-2">{stats.kvkkRequests}</h4>
                        </div>
                      </div>
                    </div>

                    {/* Payment status block */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl">
                      <h3 className="text-sm font-black text-zinc-300 uppercase tracking-wider border-b border-zinc-850 pb-3 mb-5">
                        Ödeme Durumu (Son 24 Saat)
                      </h3>
                      <div className="grid grid-cols-3 gap-6">
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Başarılı Ödemeler</p>
                          <h4 className="text-3xl font-black text-green-400 mt-2">{stats.payments24h.success}</h4>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Başarısız Ödemeler</p>
                          <h4 className="text-3xl font-black text-red-400 mt-2">{stats.payments24h.failed}</h4>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider">Bekleyen Ödemeler</p>
                          <h4 className="text-3xl font-black text-yellow-400 mt-2">{stats.payments24h.pending}</h4>
                        </div>
                      </div>
                    </div>

                    {/* 👤 Role-Based Custom Dashboards Section */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-850 pb-4">
                        <div>
                          <h3 className="text-sm font-black text-zinc-300 uppercase tracking-wider">
                            Personel Rolüne Göre Canlı Göstergeler
                          </h3>
                          <p className="text-[10px] text-zinc-500">Seçilen personel rolü için özel veri ve operasyon paneli</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDashboardRole('executive')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                              dashboardRole === 'executive'
                                ? 'bg-accent/15 border-accent/30 text-accent font-extrabold shadow-md shadow-accent/5'
                                : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-white'
                            }`}
                          >
                            Yönetici (Executive)
                          </button>
                          <button
                            onClick={() => setDashboardRole('quality_staff')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                              dashboardRole === 'quality_staff'
                                ? 'bg-accent/15 border-accent/30 text-accent font-extrabold shadow-md shadow-accent/5'
                                : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-white'
                            }`}
                          >
                            Kalite (Quality)
                          </button>
                          <button
                            onClick={() => setDashboardRole('sales_staff')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                              dashboardRole === 'sales_staff'
                                ? 'bg-accent/15 border-accent/30 text-accent font-extrabold shadow-md shadow-accent/5'
                                : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-white'
                            }`}
                          >
                            Satış (Sales)
                          </button>
                        </div>
                      </div>

                      {loadingRoleStats ? (
                        <div className="text-center py-10">
                          <p className="text-xs text-zinc-500 italic">Veriler yükleniyor...</p>
                        </div>
                      ) : roleStats ? (
                        <div className="space-y-6">
                          {/* 1. EXECUTIVE VIEW */}
                          {dashboardRole === 'executive' && (
                            <div className="space-y-6 animate-scale-up">
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850">
                                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Aylık Tekrarlayan Gelir (MRR)</p>
                                  <h4 className="text-2xl font-black text-green-400 mt-2">₺{roleStats.mrr?.toLocaleString('tr-TR')}</h4>
                                  <p className="text-[9px] text-zinc-500 mt-1">Son 30 gündeki başarılı ödemeler</p>
                                </div>
                                <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850">
                                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Genel NPS Skoru</p>
                                  <h4 className="text-2xl font-black text-accent mt-2">{roleStats.overallNps}</h4>
                                  <p className="text-[9px] text-zinc-500 mt-1">Net Tavsiye Skoru (%P - %D)</p>
                                </div>
                                <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850">
                                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Aktif Hizmet Verenler</p>
                                  <h4 className="text-2xl font-black text-white mt-2">{roleStats.activeProvidersCount}</h4>
                                  <p className="text-[9px] text-zinc-500 mt-1">Sistemde onaylı ustalar</p>
                                </div>
                                <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850">
                                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Eşleşen Aktif Talepler</p>
                                  <h4 className="text-2xl font-black text-white mt-2">{roleStats.activeRequestsCount}</h4>
                                  <p className="text-[9px] text-zinc-500 mt-1">Dağıtılmış durumda olanlar</p>
                                </div>
                              </div>

                              <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850 space-y-4">
                                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider">Başarısız Abonelik Ödemeleri</h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs">
                                    <thead className="text-zinc-550 uppercase text-[9px] border-b border-zinc-850">
                                      <tr>
                                        <th className="pb-2">Hizmet Veren Usta</th>
                                        <th className="pb-2">İletişim</th>
                                        <th className="pb-2">Tutar</th>
                                        <th className="pb-2">Tarih</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-850">
                                      {roleStats.failedPayments?.length === 0 ? (
                                        <tr>
                                          <td colSpan={4} className="py-4 text-center text-zinc-500 italic">Kayıt yok.</td>
                                        </tr>
                                      ) : (
                                        roleStats.failedPayments?.map((p: any) => (
                                          <tr key={p.id} className="hover:bg-zinc-900/40">
                                            <td className="py-2.5 font-bold text-white">{p.providerName}</td>
                                            <td className="py-2.5 font-mono text-zinc-400">{p.providerPhone}</td>
                                            <td className="py-2.5 text-red-400 font-extrabold">₺{p.amount}</td>
                                            <td className="py-2.5 text-zinc-500">{new Date(p.created_at).toLocaleString('tr-TR')}</td>
                                          </tr>
                                        ))
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 2. QUALITY STAFF VIEW */}
                          {dashboardRole === 'quality_staff' && (
                            <div className="space-y-6 animate-scale-up">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850">
                                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Açık Arama Görevleri (FIFO)</p>
                                  <h4 className="text-2xl font-black text-accent mt-2">{roleStats.callTasks?.length || 0}</h4>
                                </div>
                                <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850">
                                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Bekleyen Yorum Onayları</p>
                                  <h4 className="text-2xl font-black text-zinc-300 mt-2">{roleStats.pendingReviews?.length || 0}</h4>
                                </div>
                                <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850">
                                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Gecikmiş SLA Aramaları (Acil)</p>
                                  <h4 className="text-2xl font-black text-red-400 mt-2">{roleStats.slaBreachedCalls?.length || 0}</h4>
                                </div>
                              </div>

                              <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850 space-y-4">
                                <h4 className="text-xs font-black text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <AlertTriangle className="w-4 h-4" />
                                  <span>SLA Aşımı Olan Kalite Arama Görevleri</span>
                                </h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs">
                                    <thead className="text-zinc-550 uppercase text-[9px] border-b border-zinc-850">
                                      <tr>
                                        <th className="pb-2">Müşteri</th>
                                        <th className="pb-2">Hizmet Veren</th>
                                        <th className="pb-2">Kategori</th>
                                        <th className="pb-2">Son Tarih (Due)</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-850">
                                      {roleStats.slaBreachedCalls?.length === 0 ? (
                                        <tr>
                                          <td colSpan={4} className="py-4 text-center text-zinc-500 italic">SLA aşımı bulunmamaktadır.</td>
                                        </tr>
                                      ) : (
                                        roleStats.slaBreachedCalls?.map((task: any) => (
                                          <tr key={task.id} className="hover:bg-zinc-900/40">
                                            <td className="py-2.5 font-bold text-white">{task.seeker?.name}</td>
                                            <td className="py-2.5 text-zinc-350">{task.provider?.name}</td>
                                            <td className="py-2.5 text-accent font-bold">{task.job?.categoryName}</td>
                                            <td className="py-2.5 text-red-400 font-mono">{new Date(task.due_at).toLocaleString('tr-TR')}</td>
                                          </tr>
                                        ))
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 3. SALES STAFF VIEW */}
                          {dashboardRole === 'sales_staff' && (
                            <div className="space-y-6 animate-scale-up">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850">
                                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Toplam Aktif Abonelik</p>
                                  <h4 className="text-2xl font-black text-green-400 mt-2">{roleStats.activeSubsCount}</h4>
                                </div>
                                <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850">
                                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Kotası &gt; %85 Dolan Usta Sayısı</p>
                                  <h4 className="text-2xl font-black text-red-400 mt-2">{roleStats.highQuotaUsage?.length || 0}</h4>
                                </div>
                                <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850">
                                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Churn Risk Grubu (30 Gün Teklif Vermeyen)</p>
                                  <h4 className="text-2xl font-black text-zinc-300 mt-2">{roleStats.churnRiskProviders?.length || 0}</h4>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* High Quota Usage */}
                                <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850 space-y-4">
                                  <h4 className="text-xs font-black text-red-400 uppercase tracking-wider">Kritik Kota Dolum Alarmları (&gt; %85)</h4>
                                  <div className="overflow-y-auto max-h-60 space-y-2.5">
                                    {roleStats.highQuotaUsage?.length === 0 ? (
                                      <p className="text-xs text-zinc-500 italic py-2">Kritik kota aşımı yok.</p>
                                    ) : (
                                      roleStats.highQuotaUsage?.map((q: any) => (
                                        <div key={q.providerId} className="flex justify-between items-center bg-zinc-900 border border-zinc-850 p-3 rounded-xl">
                                          <div>
                                            <p className="text-xs font-bold text-white">{q.name}</p>
                                            <p className="text-[10px] text-zinc-400 font-mono">{q.phone_decrypted}</p>
                                          </div>
                                          <div className="text-right">
                                            <span className="text-xs font-black text-red-400">{q.usagePct}%</span>
                                            <p className="text-[9px] text-zinc-500">{q.acceptedCount}/{q.monthlyLimit} Limit</p>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>

                                {/* Churn Risk */}
                                <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850 space-y-4">
                                  <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider">Churn Riski Taşıyan Abone Ustalar</h4>
                                  <div className="overflow-y-auto max-h-60 space-y-2.5">
                                    {roleStats.churnRiskProviders?.length === 0 ? (
                                      <p className="text-xs text-zinc-500 italic py-2">Churn riskli usta bulunmamaktadır.</p>
                                    ) : (
                                      roleStats.churnRiskProviders?.map((p: any) => (
                                        <div key={p.providerId} className="flex justify-between items-center bg-zinc-900 border border-zinc-850 p-3 rounded-xl">
                                          <div>
                                            <p className="text-xs font-bold text-white">{p.name}</p>
                                            <p className="text-[10px] text-zinc-400 font-mono">{p.phone_decrypted}</p>
                                          </div>
                                          <div className="text-right text-[10px] text-zinc-300">
                                            {p.lastOfferDate ? (
                                              <>
                                                <span className="text-zinc-500">Son Teklif:</span>
                                                <p className="font-mono text-zinc-400">{new Date(p.lastOfferDate).toLocaleDateString('tr-TR')}</p>
                                              </>
                                            ) : (
                                              <span className="text-zinc-500 font-bold italic text-amber-500">Hiç Teklif Vermedi</span>
                                            )}
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-10">
                          <p className="text-xs text-zinc-500 italic">Seçilen rol verisi yüklenemedi.</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-3xl">
                    <p className="text-zinc-500 text-sm">Metrikler yükleniyor...</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: USER MANAGEMENT */}
            {activeTab === 'users' && (
              <div className="space-y-6 animate-scale-up">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Users className="w-6 h-6 text-accent" />
                  <span>Kullanıcı Yönetim Paneli</span>
                </h2>

                {/* Filter and Search controls */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Search input */}
                  <div className="relative md:col-span-2">
                    <input
                      type="text"
                      placeholder="İsim veya e-posta ile arama yapın..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-accent rounded-xl py-2.5 px-4 pl-10 text-sm focus:outline-none transition-colors"
                    />
                    <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-500" />
                  </div>

                  {/* Role filter */}
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 focus:border-accent text-zinc-300 text-sm rounded-xl px-4 py-2.5 focus:outline-none cursor-pointer"
                  >
                    <option value="">Tüm Roller</option>
                    <option value="service_seeker">Hizmet Alan</option>
                    <option value="service_provider">Hizmet Veren</option>
                    <option value="admin">Yönetici (Admin)</option>
                  </select>

                  {/* Status filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 focus:border-accent text-zinc-300 text-sm rounded-xl px-4 py-2.5 focus:outline-none cursor-pointer"
                  >
                    <option value="">Tüm Durumlar</option>
                    <option value="active">Aktif</option>
                    <option value="inactive">Pasif / Kilitli</option>
                  </select>
                </div>

                {/* User List Table */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-zinc-950 text-zinc-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-zinc-800">
                        <tr>
                          <th className="px-6 py-4">Ad Soyad</th>
                          <th className="px-6 py-4">Telefon</th>
                          <th className="px-6 py-4">Rol</th>
                          <th className="px-6 py-4">Durum</th>
                          <th className="px-6 py-4">Kayıt Tarihi</th>
                          <th className="px-6 py-4 text-right">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-850">
                        {users.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-12 text-zinc-500 text-sm italic">
                              Kriterlere uygun kullanıcı bulunamadı.
                            </td>
                          </tr>
                        ) : (
                          users.map((user) => (
                            <tr key={user.id} className="hover:bg-zinc-850/40 transition-colors">
                              <td className="px-6 py-4 font-bold text-white">
                                {user.name || 'Ad Belirtilmemiş'}
                              </td>
                              <td className="px-6 py-4 text-xs font-mono text-zinc-400">
                                {user.phone_decrypted || user.phone_masked}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-md border ${
                                  user.role === 'admin' 
                                    ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                                    : user.role === 'service_provider' 
                                      ? 'bg-accent/10 border-accent/20 text-accent' 
                                      : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                                }`}>
                                  {user.role === 'service_seeker' ? 'Müşteri' : user.role === 'service_provider' ? 'Usta' : 'Admin'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`flex items-center gap-1.5 text-xs font-bold ${
                                  user.is_active ? 'text-green-500' : 'text-zinc-500'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    user.is_active ? 'bg-green-500' : 'bg-zinc-500'
                                  }`}></span>
                                  {user.is_active ? 'Aktif' : 'Banlı / Pasif'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-xs text-zinc-500">
                                {new Date(user.created_at).toLocaleDateString('tr-TR')}
                              </td>
                              <td className="px-6 py-4 text-right flex items-center justify-end gap-2.5">
                                <button
                                  onClick={() => showUserDetail(user.id)}
                                  className="text-zinc-400 hover:text-white p-1 hover:bg-zinc-800 rounded-lg transition-colors"
                                  title="İncele"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleToggleActive(user.id)}
                                  className={`p-1 rounded-lg transition-colors ${
                                    user.is_active ? 'text-yellow-500 hover:bg-yellow-500/10' : 'text-green-500 hover:bg-green-500/10'
                                  }`}
                                  title={user.is_active ? 'Pasif Yap' : 'Aktif Yap'}
                                >
                                  <Power className="w-4 h-4" />
                                </button>
                                {user.is_active && (
                                  <button
                                    onClick={() => setBanUserTarget(user)}
                                    className="text-red-500 hover:bg-red-500/10 p-1 rounded-lg transition-colors"
                                    title="Banla"
                                  >
                                    <Ban className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination control */}
                  {totalUsers > 10 && (
                    <div className="bg-zinc-950 px-6 py-4 flex justify-between items-center border-t border-zinc-800">
                      <span className="text-xs text-zinc-500 font-semibold">
                        Toplam {totalUsers} kayıttan {(userPage - 1) * 10 + 1}-{Math.min(userPage * 10, totalUsers)} arası gösteriliyor
                      </span>
                      <div className="flex gap-2">
                        <button
                          disabled={userPage === 1}
                          onClick={() => loadUsers(token!, userPage - 1)}
                          className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs px-3 py-1.5 rounded-lg disabled:opacity-40"
                        >
                          Önceki
                        </button>
                        <button
                          disabled={userPage * 10 >= totalUsers}
                          onClick={() => loadUsers(token!, userPage + 1)}
                          className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs px-3 py-1.5 rounded-lg disabled:opacity-40"
                        >
                          Sonraki
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: PROVIDER APPROVALS */}
            {activeTab === 'approvals' && (
              <div className="space-y-6 animate-scale-up">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-accent" />
                  <span>Hizmet Veren Onay Kuyruğu</span>
                </h2>

                {approvals.length === 0 ? (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center">
                    <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">Tüm Başvurular İşlendi</h3>
                    <p className="text-zinc-500 text-sm max-w-md mx-auto">
                      Onay veya belge denetimi bekleyen yeni bir usta başvurusu bulunmamaktadır.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {approvals.map((prov) => (
                      <div 
                        key={prov.id}
                        className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-extrabold text-white text-lg">{prov.user.name || 'Usta İsmi Belirtilmemiş'}</h3>
                              <p className="text-xs text-zinc-500 mt-0.5">Kayıt: {new Date(prov.user.created_at).toLocaleDateString('tr-TR')}</p>
                            </div>
                            <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md">
                              Onay Bekliyor
                            </span>
                          </div>

                          <div className="space-y-2 border-t border-zinc-850 pt-4 mb-6">
                            <div className="flex justify-between text-xs">
                              <span className="text-zinc-500">Telefon:</span>
                              <span className="text-zinc-300 font-semibold">{prov.user.phone_decrypted || prov.user.phone_masked}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-zinc-500">E-Posta:</span>
                              <span className="text-zinc-300 font-semibold">{prov.user.email || 'Yok'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-zinc-500">Kategori:</span>
                              <span className="text-accent font-semibold">Ev Temizliği</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => setViewDocsTarget(prov)}
                            className="bg-zinc-950 border border-zinc-850 hover:bg-zinc-850 text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <FileText className="w-4 h-4 text-accent" />
                            <span>Yüklenen Belgeleri İncele</span>
                          </button>

                          <div className="flex gap-2">
                            <button
                              onClick={() => setRejectProviderTarget(prov)}
                              className="flex-1 bg-red-500/10 border border-red-500/20 hover:bg-red-500 text-red-500 hover:text-white font-bold py-3 rounded-xl transition-all text-xs"
                            >
                              Reddet
                            </button>
                            <button
                              onClick={() => handleApproveProvider(prov.id)}
                              className="flex-1 bg-accent text-zinc-950 hover:bg-accent/90 font-black py-3 rounded-xl transition-all text-xs shadow-md shadow-accent/10"
                            >
                              Onayla
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: REVIEWS APPROVAL QUEUE */}
            {activeTab === 'reviews' && (
              <div className="space-y-6 animate-scale-up">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <FileText className="w-6 h-6 text-accent" />
                  <span>Yorum ve Değerlendirme Onay Kuyruğu</span>
                </h2>

                {pendingReviews.length === 0 ? (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center">
                    <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">Tüm Yorumlar İşlendi</h3>
                    <p className="text-zinc-500 text-sm max-w-md mx-auto">
                      Onay bekleyen yeni bir müşteri yorumu veya değerlendirmesi bulunmamaktadır.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {pendingReviews.map((review) => (
                      <div 
                        key={review.id}
                        className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row gap-6 justify-between items-start md:items-center"
                      >
                        <div className="space-y-3 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-white">{review.reviewer.name || 'Müşteri'}</span>
                            <span className="text-xs text-zinc-500 font-mono">({review.reviewer.phone_masked})</span>
                            <span className="text-xs text-zinc-500 font-bold">→</span>
                            <span className="font-extrabold text-accent">{review.provider.user.name}</span>
                            <span className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md">
                              {review.job.category.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span 
                                key={star} 
                                className={`text-xl ${star <= review.rating ? 'text-amber-400' : 'text-zinc-700'}`}
                              >
                                ★
                              </span>
                            ))}
                          </div>

                          {review.comment && (
                            <p className="text-zinc-300 text-sm italic bg-zinc-950/40 p-3 rounded-xl border border-zinc-850/60 leading-relaxed">
                              &ldquo;{review.comment}&rdquo;
                            </p>
                          )}

                          {review.document_url && (
                            <div className="mt-2.5">
                              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Yüklenen Fotoğraf:</p>
                              <div className="relative w-48 h-32 rounded-2xl overflow-hidden border border-zinc-800 shadow-inner group cursor-pointer hover:border-accent transition-all">
                                <img 
                                  src={review.document_url} 
                                  alt="Yorum görseli" 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                                />
                                <a 
                                  href={review.document_url} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white font-bold transition-all"
                                >
                                  Tam Ekran Gör
                                </a>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2.5 w-full md:w-auto self-stretch md:self-center shrink-0">
                          <button
                            onClick={() => handleRejectReview(review.id)}
                            className="flex-1 md:flex-none bg-red-500/10 border border-red-500/20 hover:bg-red-500 text-red-500 hover:text-white font-bold px-6 py-3 rounded-xl transition-all text-xs"
                          >
                            Reddet
                          </button>
                          <button
                            onClick={() => handleApproveReview(review.id)}
                            className="flex-1 md:flex-none bg-accent text-zinc-950 hover:bg-accent/90 font-black px-6 py-3 rounded-xl transition-all text-xs shadow-md shadow-accent/10"
                          >
                            Onayla
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: NPS ANALİZ PANELİ */}
            {activeTab === 'nps' && (
              <div className="space-y-6 animate-scale-up">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Percent className="w-6 h-6 text-accent" />
                  <span>NPS Memnuniyet Analitiği & Usta Denetim Paneli</span>
                </h2>

                {loadingNps ? (
                  <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-3xl">
                    <p className="text-zinc-500 text-sm animate-pulse">NPS verileri derleniyor...</p>
                  </div>
                ) : npsStats ? (
                  <div className="space-y-6">
                    {/* NPS Gauge & Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Premium Gauge Card */}
                      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"></div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Platform Net NPS Skoru</p>
                        
                        {/* Gauge Visual */}
                        <div className="relative w-36 h-36 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke="#1f1f22"
                              strokeWidth="8"
                              fill="transparent"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke="#D4F54E"
                              strokeWidth="8"
                              fill="transparent"
                              strokeDasharray={`${2 * Math.PI * 40}`}
                              strokeDashoffset={`${2 * Math.PI * 40 * (1 - Math.max(0, Math.min(100, npsStats.npsScore + 100)) / 200)}`}
                              className="transition-all duration-1000"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black text-white">{npsStats.npsScore}</span>
                            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
                              {npsStats.npsScore >= 50 ? 'Mükemmel' : npsStats.npsScore >= 0 ? 'İyi' : 'Kritik'}
                            </span>
                          </div>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-4">Toplam {npsStats.totalCount} anket yanıtına göre hesaplanmıştır.</p>
                      </div>

                      {/* Breakdown Card */}
                      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between md:col-span-2">
                        <h3 className="text-xs font-black text-zinc-300 uppercase tracking-wider mb-4">Puan Dağılım Dağılımı</h3>
                        
                        <div className="space-y-4">
                          {/* Promoter */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-green-400">Destekleyiciler (Promoters - 7-10 Puan)</span>
                              <span className="text-white">{npsStats.promoterCount} ({npsStats.totalCount > 0 ? Math.round((npsStats.promoterCount / npsStats.totalCount) * 100) : 0}%)</span>
                            </div>
                            <div className="w-full bg-zinc-950 h-3.5 rounded-full overflow-hidden border border-zinc-850">
                              <div 
                                className="bg-green-550 h-full rounded-full transition-all duration-1000"
                                style={{ width: `${npsStats.totalCount > 0 ? (npsStats.promoterCount / npsStats.totalCount) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Passive */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-yellow-400">Pasifler (Passives - 4-6 Puan)</span>
                              <span className="text-white">{npsStats.passiveCount} ({npsStats.totalCount > 0 ? Math.round((npsStats.passiveCount / npsStats.totalCount) * 100) : 0}%)</span>
                            </div>
                            <div className="w-full bg-zinc-950 h-3.5 rounded-full overflow-hidden border border-zinc-850">
                              <div 
                                className="bg-yellow-550 h-full rounded-full transition-all duration-1000"
                                style={{ width: `${npsStats.totalCount > 0 ? (npsStats.passiveCount / npsStats.totalCount) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Detractor */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-red-400">Kötüleyenler (Detractors - 0-3 Puan)</span>
                              <span className="text-white">{npsStats.detractorCount} ({npsStats.totalCount > 0 ? Math.round((npsStats.detractorCount / npsStats.totalCount) * 100) : 0}%)</span>
                            </div>
                            <div className="w-full bg-zinc-950 h-3.5 rounded-full overflow-hidden border border-zinc-850">
                              <div 
                                className="bg-red-550 h-full rounded-full transition-all duration-1000"
                                style={{ width: `${npsStats.totalCount > 0 ? (npsStats.detractorCount / npsStats.totalCount) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-zinc-950 border border-zinc-850 p-3 rounded-2xl text-[10px] text-zinc-500 leading-relaxed mt-4">
                          <strong>NPS Formülü:</strong> Destekleyenlerin Yüzdesi (%) - Kötüleyenlerin Yüzdesi (%) = Net NPS Skoru. Puanlama aralığı -100 ile +100 arasındadır.
                        </div>
                      </div>
                    </div>

                    {/* Category satisfaction scores table */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
                      <h3 className="text-xs font-black text-zinc-300 uppercase tracking-wider border-b border-zinc-850 pb-3">
                        Kategorilere Göre NPS ve Ortalama Puan Dağılımı
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="text-zinc-500 uppercase text-[9px] border-b border-zinc-850">
                            <tr>
                              <th className="pb-2">Kategori</th>
                              <th className="pb-2">Toplam Geri Bildirim</th>
                              <th className="pb-2">Ortalama Puan (0-10)</th>
                              <th className="pb-2">Kategori Net NPS Skoru</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-850">
                            {npsStats.categoryStats?.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="py-4 text-center text-zinc-550 italic">Hiç NPS yanıtı girilmemiş.</td>
                              </tr>
                            ) : (
                              npsStats.categoryStats?.map((cat: any) => (
                                <tr key={cat.categoryId} className="hover:bg-zinc-850/30">
                                  <td className="py-3 font-bold text-white">{cat.categoryName}</td>
                                  <td className="py-3 text-zinc-350">{cat.totalResponses}</td>
                                  <td className="py-3 font-mono text-zinc-300">{cat.avgScore} / 10</td>
                                  <td className="py-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                                      cat.npsScore >= 50
                                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                        : cat.npsScore >= 0
                                          ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                                          : 'bg-red-500/10 border-red-500/20 text-red-400'
                                    }`}>
                                      NPS: {cat.npsScore}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Detractor Warning Panel (Alarms) */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
                      <div className="flex items-center gap-2 text-red-400 border-b border-zinc-850 pb-3">
                        <AlertTriangle className="w-5 h-5" />
                        <h3 className="text-xs font-black uppercase tracking-wider">
                          Kritik Detraktör Alarm Listesi (Son 30 Günde 3+ Detraktör Alan Ustalar)
                        </h3>
                      </div>

                      {npsAlarms.length === 0 ? (
                        <div className="text-center py-8 bg-zinc-950/30 rounded-2xl border border-zinc-850/60">
                          <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                          <p className="text-xs text-zinc-550 font-bold">Kritik seviyede kötüleyici yorum biriktirmiş usta bulunmamaktadır.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {npsAlarms.map((alarm) => (
                            <div key={alarm.providerId} className="bg-zinc-950 p-5 rounded-2xl border border-red-500/20 relative overflow-hidden shadow-md">
                              <div className="absolute right-0 top-0 bg-red-500/10 text-red-400 text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl border-l border-b border-red-500/20">
                                {alarm.detractorCount} Detraktör
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <h4 className="font-extrabold text-white text-sm">{alarm.name}</h4>
                                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{alarm.phone_decrypted} | {alarm.email}</p>
                                </div>

                                <div className="flex items-center gap-4 text-[10px] border-t border-zinc-850 pt-2.5">
                                  <span className="text-zinc-500">
                                    Genel Puan: <strong className="text-zinc-300">{alarm.avg_rating} / 5.00</strong>
                                  </span>
                                  <span className="text-zinc-500">
                                    Alarm: <strong className="text-red-400">Son 30 günde 3+ olumsuz anket</strong>
                                  </span>
                                </div>

                                {alarm.recentResponses?.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-zinc-850/60 space-y-1.5">
                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Son Olumsuz Geri Bildirimler:</p>
                                    {alarm.recentResponses.map((r: any) => (
                                      <div key={r.id} className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-850/50 text-[10px] space-y-0.5">
                                        <div className="flex justify-between font-bold">
                                          <span className="text-red-400">Skor: {r.score}</span>
                                          <span className="text-zinc-500">{new Date(r.created_at).toLocaleDateString('tr-TR')}</span>
                                        </div>
                                        {r.comment && <p className="text-zinc-400 italic">&ldquo;{r.comment}&rdquo;</p>}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-3xl">
                    <p className="text-zinc-500 text-sm">Veriler çekilemedi.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: A/B TEST PARAMETRELERİ */}
            {activeTab === 'abtest' && (
              <div className="space-y-6 animate-scale-up">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Sliders className="w-6 h-6 text-accent" />
                  <span>A/B Sürüm Testi & Yapay Zeka Ar-Ge Paneli</span>
                </h2>

                <form onSubmit={handleSaveAbTestConfig} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-6">
                  <div className="border-b border-zinc-850 pb-4 mb-4">
                    <h3 className="text-sm font-black text-zinc-300 uppercase tracking-wider">Yapay Zeka Sohbet Asistanı Ayarları</h3>
                    <p className="text-[10px] text-zinc-500">Müşterilerin talep oluştururken konuştuğu AI asistan model ve sıcaklık ayarları (Redis)</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Model Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Aktif Yapay Zeka Modeli (A Sürümü)</label>
                      <select
                        value={abTestConfig.chatModel}
                        onChange={(e) => setAbTestConfig({ ...abTestConfig, chatModel: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-850 focus:border-accent text-zinc-300 text-xs rounded-xl px-4 py-3.5 focus:outline-none cursor-pointer"
                      >
                        <option value="gpt-4o">GPT-4o (Gelişmiş Doğal Dil Modeli)</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Hızlı Mock Yanıtlar)</option>
                        <option value="custom-model-v2">Custom Esnaaf LLM v2 (Ar-Ge)</option>
                      </select>
                    </div>

                    {/* Temperature Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        <span>Model Sıcaklığı (Temperature)</span>
                        <span className="text-accent font-mono font-black">{abTestConfig.temperature}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={abTestConfig.temperature}
                        onChange={(e) => setAbTestConfig({ ...abTestConfig, temperature: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-accent"
                      />
                      <div className="flex justify-between text-[9px] text-zinc-550 font-bold">
                        <span>Daha Tutarlı / Belirli</span>
                        <span>Daha Yaratıcı / Serbest</span>
                      </div>
                    </div>

                    {/* Split Ratio Slider */}
                    <div className="space-y-2 md:col-span-2">
                      <div className="flex justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        <span>A/B Test Trafik Dağılımı (Sürüm B Oranı)</span>
                        <span className="text-accent font-mono font-black">{(abTestConfig.splitRatio * 100).toFixed(0)}% Sürüm B</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={abTestConfig.splitRatio}
                        onChange={(e) => setAbTestConfig({ ...abTestConfig, splitRatio: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-accent"
                      />
                      <div className="flex justify-between text-[10px] font-black text-white">
                        <span>Sürüm A (Genel Asistan): {((1 - abTestConfig.splitRatio) * 100).toFixed(0)}%</span>
                        <span>Sürüm B (Ar-Ge Test Modeli): {(abTestConfig.splitRatio * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic simulated conversion rates graphics */}
                  <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider">Sürüm Dönüşüm Başarı Oranları (Simüle Grafiği)</h4>
                      <span className="bg-accent/15 border border-accent/25 text-accent text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md animate-pulse">Canlı Veri</span>
                    </div>

                    {/* Stunning conversion rate bars */}
                    <div className="space-y-4 pt-2">
                      {/* Version A Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-zinc-300">Sürüm A (Asistan Genel) - {abTestConfig.chatModel}</span>
                          <span className="text-white font-bold">84.2% Başarı</span>
                        </div>
                        <div className="w-full bg-zinc-900 h-4 rounded-lg overflow-hidden border border-zinc-805 bg-zinc-950">
                          <div 
                            className="bg-accent h-full rounded-lg transition-all duration-500 shadow-md shadow-accent/20"
                            style={{ width: '84.2%' }}
                          ></div>
                        </div>
                      </div>

                      {/* Version B Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-zinc-300">Sürüm B (Ar-Ge Modeli)</span>
                          <span className="text-white font-bold">78.5% Başarı</span>
                        </div>
                        <div className="w-full bg-zinc-900 h-4 rounded-lg overflow-hidden border border-zinc-805 bg-zinc-950">
                          <div 
                            className="bg-zinc-650 h-full rounded-lg transition-all duration-500"
                            style={{ width: '78.5%' }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <p className="text-[9px] text-zinc-500 leading-relaxed">
                      * Dönüşüm Başarı Oranı: Müşterinin yapay zeka asistanı ile konuşmayı yarıda bırakmadan başarıyla talep oluşturma aşamasına ulaşmasının yüzdesel oranıdır. Sürüm oranları ve split parametresi güncellendiğinde yapay zeka API yönlendirmesi otomatik olarak güncellenecektir.
                    </p>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-zinc-850 gap-4">
                    <button
                      type="button"
                      onClick={() => loadAbTestConfig(token!)}
                      className="bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 font-bold px-6 py-3 rounded-xl transition-all text-xs"
                    >
                      Ayarları Sıfırla
                    </button>
                    <button
                      type="submit"
                      disabled={savingAbConfig}
                      className="bg-accent text-zinc-950 hover:bg-accent/90 font-black px-8 py-3 rounded-xl transition-all text-xs shadow-lg shadow-accent/10"
                    >
                      {savingAbConfig ? 'Kaydediliyor...' : 'Redis Parametrelerini Kaydet'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 💻 Technical System Logs console at the bottom */}
            <div className="bg-zinc-950 text-zinc-400 rounded-3xl p-5 border border-zinc-850 font-mono text-[11px] h-60 overflow-y-auto">
              <div className="flex justify-between items-center border-b border-zinc-850 pb-2 mb-3">
                <span className="text-accent uppercase tracking-wider font-extrabold text-[10px]">Admin System Logs / Audit Trail</span>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              </div>
              {logMessages.length === 0 ? (
                <p className="text-zinc-700 italic">Sistem logları ve aksiyon denetim günlükleri burada belirecektir...</p>
              ) : (
                logMessages.map((log, idx) => (
                  <p key={idx} className="mb-1 leading-relaxed text-zinc-500">
                    {log}
                  </p>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {/* 👤 Kullanıcı Detay Modalı */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-zinc-800 animate-scale-up">
            <div className="flex justify-between items-center border-b border-zinc-850 pb-3 mb-5">
              <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" />
                <span>Kullanıcı Detay Kartı</span>
              </h3>
              <button 
                onClick={() => setSelectedUser(null)}
                className="text-zinc-500 hover:text-zinc-300 p-1.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Profile Card Summary */}
              <div className="flex items-center gap-4 bg-zinc-950 p-4 rounded-2xl border border-zinc-850">
                <div className="w-14 h-14 rounded-full bg-accent-light/10 border border-accent/25 flex items-center justify-center text-accent font-black text-xl">
                  {(selectedUser.name || 'U').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-lg">{selectedUser.name || 'Ad Belirtilmemiş'}</h4>
                  <p className="text-xs text-zinc-500">Kayıt: {new Date(selectedUser.created_at).toLocaleString('tr-TR')}</p>
                </div>
              </div>

              {/* Personal Details */}
              <div className="space-y-2.5">
                <h4 className="text-xs text-zinc-400 font-extrabold uppercase tracking-wider mb-2">Kişisel Bilgiler</h4>
                <div className="flex justify-between text-sm border-b border-zinc-850 pb-2">
                  <span className="text-zinc-500">Telefon (Tam):</span>
                  <span className="text-white font-mono">{selectedUser.phone_decrypted || selectedUser.phone_masked}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-zinc-850 pb-2">
                  <span className="text-zinc-500">E-Posta:</span>
                  <span className="text-white">{selectedUser.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-zinc-850 pb-2">
                  <span className="text-zinc-500">Rol:</span>
                  <span className="text-accent uppercase text-xs font-black">{selectedUser.role}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-zinc-850 pb-2">
                  <span className="text-zinc-500">KVKK Onayı:</span>
                  <span className="text-white">{selectedUser.kvkk_consent ? '✅ Onaylandı' : '❌ Onay Yok'}</span>
                </div>
              </div>

              {/* Activity Stats */}
              {selectedUser.stats && (
                <div className="space-y-2.5 pt-2">
                  <h4 className="text-xs text-zinc-400 font-extrabold uppercase tracking-wider mb-2">Aktivite Özeti</h4>
                  {selectedUser.role === 'service_seeker' ? (
                    <div className="flex justify-between text-sm border-b border-zinc-850 pb-2">
                      <span className="text-zinc-500">Toplam Oluşturulan Talep:</span>
                      <span className="text-white font-extrabold">{selectedUser.stats.totalRequests || 0}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-sm border-b border-zinc-850 pb-2">
                        <span className="text-zinc-500">Toplam Verilen Teklif:</span>
                        <span className="text-white font-extrabold">{selectedUser.stats.totalOffers || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm border-b border-zinc-850 pb-2">
                        <span className="text-zinc-500">Kazanılan (Kabul Edilen) İş:</span>
                        <span className="text-white font-extrabold">{selectedUser.stats.totalWonJobs || 0}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-zinc-850">
                <button
                  onClick={() => handleToggleActive(selectedUser.id)}
                  className="flex-1 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-xs font-bold py-3.5 rounded-xl transition-all"
                >
                  {selectedUser.is_active ? 'Geçici Pasifleştir' : 'Aktifleştir'}
                </button>
                <button
                  onClick={() => handleKvkkForceDelete(selectedUser.id)}
                  className="flex-1 bg-red-950 border border-red-800/50 text-red-400 hover:bg-red-500 hover:text-white text-xs font-bold py-3.5 rounded-xl transition-all"
                >
                  Zorla Sil (KVKK)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🚫 Kullanıcı Banlama Modalı */}
      {banUserTarget && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-800 animate-scale-up">
            <div className="flex justify-between items-center border-b border-zinc-850 pb-3 mb-4">
              <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                <Ban className="w-5 h-5 text-red-500" />
                <span>Kullanıcıyı Yasakla (Ban)</span>
              </h3>
              <button 
                onClick={() => setBanUserTarget(null)}
                className="text-zinc-500 hover:text-zinc-300 p-1.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-5 text-xs text-red-400 leading-relaxed flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                <span className="font-bold">UYARI:</span> Bu kullanıcı platformdan kalıcı olarak kilitlenecek ve hesap oturumu durdurulacaktır. Karar activity_logs denetim günlüğüne işlenir.
              </div>
            </div>

            <form onSubmit={handleBanUserSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Yasaklama Gerekçesi</label>
                <select
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-accent cursor-pointer"
                >
                  <option value="fake_profile">Sahte Profil / Kimlik Şüphesi</option>
                  <option value="abuse">Hatalı / Kötüye Kullanım Davranışı</option>
                  <option value="payment_issue">Ödeme & Abonelik Uyuşmazlığı</option>
                  <option value="other">Diğer</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Açıklama / Denetçi Notu</label>
                <textarea
                  value={banNotes}
                  onChange={(e) => setBanNotes(e.target.value)}
                  placeholder="Denetim ekibi için yasaklama ayrıntılarını detaylandırın..."
                  rows={4}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-accent rounded-xl py-3 px-4 text-sm focus:outline-none transition-colors resize-none leading-relaxed"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBanUserTarget(null)}
                  className="flex-1 bg-zinc-950 hover:bg-zinc-850 border border-zinc-850 font-bold py-3.5 rounded-xl transition-all text-xs"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-650 hover:bg-red-500 text-white font-extrabold py-3.5 rounded-xl transition-all text-xs"
                >
                  Kullanıcıyı Yasakla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ❌ Hizmet Veren Reddetme Modalı */}
      {rejectProviderTarget && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-800 animate-scale-up">
            <div className="flex justify-between items-center border-b border-zinc-850 pb-3 mb-4">
              <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span>Başvuruyu Reddet</span>
              </h3>
              <button 
                onClick={() => setRejectProviderTarget(null)}
                className="text-zinc-500 hover:text-zinc-300 p-1.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRejectProviderSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Red Sebebi Kodu</label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-accent cursor-pointer"
                >
                  <option value="R01">R01 - Kimlik belgesi eksik veya okunamaz</option>
                  <option value="R02">R02 - Verilen bilgiler doğrulanamadı</option>
                  <option value="R03">R03 - Hizmet kategorisi uygun değil</option>
                  <option value="R04">R04 - Daha önce banlı hesap</option>
                  <option value="R05">R05 - Diğer (Açıklama alanına yazınız)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Red Açıklaması (HV-15 Bildirimine Eklenecektir)</label>
                <textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Başvurana iletilecek ayrıntılı açıklama yazın..."
                  rows={4}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-accent rounded-xl py-3 px-4 text-sm focus:outline-none transition-colors resize-none leading-relaxed"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectProviderTarget(null)}
                  className="flex-1 bg-zinc-950 hover:bg-zinc-850 border border-zinc-850 font-bold py-3.5 rounded-xl transition-all text-xs"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-extrabold py-3.5 rounded-xl transition-all text-xs shadow-lg shadow-red-650/15"
                >
                  Başvuruyu Reddet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📄 Belgeleri İnceleme Modalı */}
      {viewDocsTarget && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-zinc-800 animate-scale-up">
            <div className="flex justify-between items-center border-b border-zinc-850 pb-3 mb-5">
              <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent" />
                <span>Usta Belgeleri: {viewDocsTarget.user.name}</span>
              </h3>
              <button 
                onClick={() => setViewDocsTarget(null)}
                className="text-zinc-500 hover:text-zinc-300 p-1.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
              {/* Document 1: Identity Card Mockup */}
              <div className="bg-zinc-950 rounded-2xl p-5 border border-zinc-850 relative overflow-hidden flex flex-col justify-between h-64 shadow-inner">
                <div>
                  <div className="flex justify-between items-center border-b border-zinc-850 pb-2 mb-3">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">T.C. KİMLİK KARTI</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-accent"></span>
                  </div>
                  <h5 className="font-extrabold text-zinc-200 text-sm tracking-wide">TÜRKİYE CUMHURİYETİ KİMLİK VESİKASI</h5>
                  <div className="space-y-1 mt-4 text-[11px] font-mono text-zinc-400">
                    <p>Soyadı: <span className="text-zinc-200 font-bold">USTA</span></p>
                    <p>Adı: <span className="text-zinc-200 font-bold">{(viewDocsTarget.user.name || '').split(' ')[1] || 'DAVUT'}</span></p>
                    <p>T.C. No: <span className="text-zinc-200 font-bold">123*****890</span></p>
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-4">
                  <span>Esnaaf Doğrulama Servisi</span>
                  <span>Belge Durumu: E-Devlet Onaylı</span>
                </div>
              </div>

              {/* Document 2: Tax Certificate Mockup */}
              <div className="bg-zinc-950 rounded-2xl p-5 border border-zinc-850 relative overflow-hidden flex flex-col justify-between h-64 shadow-inner">
                <div>
                  <div className="flex justify-between items-center border-b border-zinc-850 pb-2 mb-3">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">VERGİ LEVHASI</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-accent"></span>
                  </div>
                  <h5 className="font-extrabold text-zinc-200 text-sm tracking-wide">T.C. GELİR İDARESİ BAŞKANLIĞI</h5>
                  <div className="space-y-1 mt-4 text-[11px] font-mono text-zinc-400">
                    <p>Unvan: <span className="text-zinc-200 font-bold">{(viewDocsTarget.user.name || 'TEMİZLİK USTASI').toUpperCase()}</span></p>
                    <p>Vergi Dairesi: <span className="text-zinc-200 font-bold">KADIKÖY VD.</span></p>
                    <p>Vergi No: <span className="text-zinc-200 font-bold">9876543210</span></p>
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-4">
                  <span>Maliye Bakanlığı Entegrasyonu</span>
                  <span>İş Kolu: Ev Temizliği Hizmetleri</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-zinc-850 justify-end">
              <button
                onClick={() => setViewDocsTarget(null)}
                className="bg-zinc-950 hover:bg-zinc-850 border border-zinc-850 font-bold px-6 py-3 rounded-xl transition-all text-xs text-zinc-400"
              >
                Kapat
              </button>
              <button
                onClick={() => {
                  setViewDocsTarget(null);
                  setRejectProviderTarget(viewDocsTarget);
                }}
                className="bg-red-500/10 border border-red-500/20 hover:bg-red-500 text-red-500 hover:text-white font-bold px-6 py-3 rounded-xl transition-all text-xs"
              >
                Başvuruyu Reddet
              </button>
              <button
                onClick={() => {
                  setViewDocsTarget(null);
                  handleApproveProvider(viewDocsTarget.id);
                }}
                className="bg-accent text-zinc-950 hover:bg-accent/90 font-black px-6 py-3 rounded-xl transition-all text-xs"
              >
                Başvuruyu Onayla
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
