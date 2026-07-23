'use client';

import React, { useState, useEffect, useRef } from 'react';

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
  Sliders,
  Award,
  Check,
  FileJson,
  CreditCard
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
  description?: string;
  is_approved: boolean;
  user: User;
}

const defaultDisputes = [
  {
    id: "disp_1",
    job_id: "job_f8219ae3",
    status: "open",
    job: {
      price: 1500,
      category: { name: "Su Tesisatı" },
      seeker: { user: { name: "Ahmet Kozan", phone_masked: "+90 532 *** 45 12" } },
      provider: { user: { name: "Davut Usta", phone_masked: "+90 544 *** 89 21" } }
    }
  },
  {
    id: "disp_2",
    job_id: "job_e1204cf8",
    status: "open",
    job: {
      price: 1200,
      category: { name: "Ev Temizliği" },
      seeker: { user: { name: "Selin Yılmaz", phone_masked: "+90 555 *** 12 34" } },
      provider: { user: { name: "Ayşe Temizlik", phone_masked: "+90 507 *** 56 78" } }
    }
  }
];

const defaultCallTasks = [
  {
    id: "call_1",
    priority: "high",
    due_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    seeker: { name: "Mehmet Tok", phone_masked: "+90 533 *** 78 90", phone_decrypted: "+90 533 123 78 90" },
    provider: { name: "Hasan Boyacı", phone_masked: "+90 542 *** 34 56" },
    job: { categoryName: "Boya & Badana" }
  },
  {
    id: "call_2",
    priority: "high",
    due_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    seeker: { name: "Zeynep Sönmez", phone_masked: "+90 505 *** 11 22", phone_decrypted: "+90 505 987 11 22" },
    provider: { name: "Fatma Temizlik", phone_masked: "+90 539 *** 44 55" },
    job: { categoryName: "Ev Temizliği" }
  }
];

const defaultStaffList = [
  {
    id: "staff_1",
    name: "Can Demir",
    email: "can.demir@esnaaf.com",
    phone_masked: "+90 532 *** 00 11",
    phone_decrypted: "+90 532 999 00 11",
    role: "quality_staff",
    kvkk_consent: true,
    is_active: true
  },
  {
    id: "staff_2",
    name: "Elif Kaya",
    email: "elif.kaya@esnaaf.com",
    phone_masked: "+90 544 *** 22 33",
    phone_decrypted: "+90 544 999 22 33",
    role: "ops_staff",
    kvkk_consent: true,
    is_active: true
  },
  {
    id: "staff_3",
    name: "Burak Yılmaz",
    email: "burak.yilmaz@esnaaf.com",
    phone_masked: "+90 555 *** 44 55",
    phone_decrypted: "+90 555 999 44 55",
    role: "finance_staff",
    kvkk_consent: true,
    is_active: true
  }
];

const defaultCampaigns = [
  {
    id: "camp_1",
    name: "Yaz Sezonu Hizmet Veren Tanıtım Kuponu",
    code: "YAZ2026",
    type: "percent",
    value: 20,
    uses_count: 154,
    max_uses: 500,
    valid_from: "2026-05-01",
    valid_until: "2026-08-31",
    is_active: true
  },
  {
    id: "camp_2",
    name: "Yeni Üye Teklif Kotası Bonusu",
    code: "KOTA50",
    type: "quota_bonus",
    value: 50,
    uses_count: 423,
    max_uses: 1000,
    valid_from: "2026-01-01",
    valid_until: "2026-12-31",
    is_active: true
  }
];

const defaultAuditLogs = [
  {
    id: "log_1",
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    user: { name: "Admin Mert", email: "mert@esnaaf.com" },
    action: "APPROVE_PROVIDER",
    target: "Hizmet Veren: Davut Temiz (ID: prov_44)",
    ip_address: "192.168.1.45"
  },
  {
    id: "log_2",
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    user: { name: "Admin Mert", email: "mert@esnaaf.com" },
    action: "BAN_USER",
    target: "Kullanıcı: Hakan Sarıcı (Gerekçe: abuse)",
    ip_address: "192.168.1.45"
  },
  {
    id: "log_3",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    user: { name: "System", email: "system@esnaaf.com" },
    action: "AUTO_SLA_TASK_CREATE",
    target: "İş #8812 için kalite araması görevi",
    ip_address: "127.0.0.1"
  }
];

const decodeJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export default function AdminPortal() {
  const [token, setToken] = useState<string | null>(null);
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



  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'sectors' | 'dashboard' | 'users' | 'approvals' | 'reviews' | 'nps' | 'abtest' | 'disputes' | 'calltasks' | 'staff' | 'campaigns' | 'auditlogs' | 'kpi' | 'subscription_mgmt'>('dashboard');
  const [logMessages, setLogMessages] = useState<string[]>([]);
  
  // Subscription management states
  const [packageConfigs, setPackageConfigs] = useState<any[]>([]);
  const [subReports, setSubReports] = useState<any[]>([]);
  const [churnedSubs, setChurnedSubs] = useState<any[]>([]);
  const [subReportCity, setSubReportCity] = useState('');
  const [subReportCategoryId, setSubReportCategoryId] = useState('');
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  
  // Simulated Logged-In User Profile and RBAC States
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: string; email?: string; phone?: string; permissions?: Record<string, string> } | null>(null);
  const [loginPhone, setLoginPhone] = useState<string>('+905999999999');

  // Data states
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [approvals, setApprovals] = useState<Provider[]>([]);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);

  // Expanded Data States
  const [disputes, setDisputes] = useState<any[]>(defaultDisputes);
  const [callTasks, setCallTasks] = useState<any[]>(defaultCallTasks);
  const [staffList, setStaffList] = useState<any[]>(defaultStaffList);
  const [campaigns, setCampaigns] = useState<any[]>(defaultCampaigns);
  const [auditLogs, setAuditLogs] = useState<any[]>(defaultAuditLogs);
  const [auditLogsPage, setAuditLogsPage] = useState(1);
  const [totalAuditLogs, setTotalAuditLogs] = useState(defaultAuditLogs.length);

  // Tab permissions checker based on user roles and permissions from backend
  const isTabAllowed = (tab: string): boolean => {
    if (!currentUser) return false;
    
    // Super admin sees everything
    if (currentUser.role === 'super_admin' || currentUser.role === 'admin') return true;

    // Check if user has permissions object loaded from backend
    if (currentUser.permissions) {
      const perms = currentUser.permissions;
      
      switch (tab) {
        case 'dashboard':
          return !!(perms.dashboard && perms.dashboard !== 'none');
        case 'kpi':
          return !!(perms.dashboard && perms.dashboard !== 'none');
        case 'users':
          return !!(perms.users && perms.users !== 'none');
        case 'approvals':
          return !!(perms.providers && perms.providers !== 'none');
        case 'reviews':
          return !!(perms.reviews && perms.reviews !== 'none');
        case 'nps':
          return !!(perms.reviews && perms.reviews !== 'none'); // NPS shares reviews/satisfaction permission
        case 'calltasks':
          return !!(perms.reviews && perms.reviews !== 'none'); // Call tasks also under reviews/satisfaction
        case 'disputes':
          return !!(perms.disputes && perms.disputes !== 'none');
        case 'staff':
          return !!(perms.staff && perms.staff !== 'none');
        case 'campaigns':
          return !!(perms.campaigns && perms.campaigns !== 'none');
        case 'auditlogs':
          return !!(perms.staff && perms.staff !== 'none'); // Audit logs under staff permission
        case 'sectors':
          return !!(perms.dashboard && perms.dashboard !== 'none');
        case 'abtest':
          return !!(perms.ab_test && perms.ab_test !== 'none');
        case 'subscription_mgmt':
          return !!(perms.users && perms.users !== 'none');
        default:
          return false;
      }
    }

    // Fallback static rules if permissions not loaded yet
    const role = currentUser.role;
    switch (role) {
      case 'quality_staff':
        return ['calltasks', 'reviews', 'nps', 'dashboard', 'kpi'].includes(tab);
      case 'finance_staff':
        return ['disputes', 'campaigns', 'dashboard', 'kpi'].includes(tab);
      case 'ops_staff':
        return ['approvals', 'users', 'disputes', 'kpi'].includes(tab);
      case 'sales_staff':
        return ['campaigns', 'dashboard', 'kpi'].includes(tab);
      default:
        return false;
    }
  };

  const loadUserProfile = async (accessToken: string) => {
    try {
      const res = await fetch('/api/admin/me', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser({
          id: data.id,
          name: data.name,
          role: data.role,
          email: data.email,
          phone: data.phone,
          permissions: data.permissions
        });
        addLog(`Profil ve yetkiler yüklendi. Rol: ${data.role}`);
        return data;
      } else {
        throw new Error(data.message || 'Profil yüklenemedi.');
      }
    } catch (err: any) {
      addLog(`Profil yükleme hatası: ${err.message}`);
      return null;
    }
  };

  // Decode JWT and set current user info when token changes
  useEffect(() => {
    const initUser = async () => {
      if (token) {
        const decoded = decodeJwt(token);
        if (decoded) {
          // First set a temp local match
          const normalizedDecodedPhone = decoded.phone ? decoded.phone.replace(/\s+/g, '') : '';
          const matchingStaff = staffList.find(s => 
            (s.phone && s.phone.replace(/\s+/g, '') === normalizedDecodedPhone) || 
            (s.phone_masked && s.phone_masked.replace(/\s+/g, '') === normalizedDecodedPhone) || 
            (s.phone_decrypted && s.phone_decrypted.replace(/\s+/g, '') === normalizedDecodedPhone)
          );
          const nameToUse = matchingStaff ? matchingStaff.name : (decoded.role === 'admin' ? 'Süper Admin' : 'Personel');
          const roleToUse = matchingStaff ? matchingStaff.role : decoded.role;
          
          setCurrentUser({
            id: decoded.sub,
            name: nameToUse,
            role: roleToUse,
            email: decoded.email || (matchingStaff ? matchingStaff.email : undefined),
            phone: decoded.phone
          });

          addLog(`İlk giriş yapıldı. Rol: ${roleToUse} | Kullanıcı: ${nameToUse}`);
          
          // Now fetch the real profile and permissions from backend
          const profile = await loadUserProfile(token);
          const activeRole = profile ? profile.role : roleToUse;

          // Auto routing active tab to allowed section based on role
          if (activeRole === 'quality_staff') {
            setActiveTab('calltasks'); // Can Demir goes directly to call tasks!
          } else if (activeRole === 'finance_staff') {
            setActiveTab('campaigns');
          } else if (activeRole === 'ops_staff') {
            setActiveTab('approvals');
          } else if (activeRole === 'sales_staff') {
            setActiveTab('dashboard');
          } else {
            setActiveTab('dashboard');
          }
        }
      } else {
        setCurrentUser(null);
      }
    };

    initUser();
  }, [token]);

  // Expanded Modal / Action States
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
  const [disputeTab, setDisputeTab] = useState<'details' | 'evidence'>('details');
  const [resolutionDecision, setResolutionDecision] = useState<'provider_correct' | 'seeker_correct' | 'mutual_agreement'>('mutual_agreement');
  const [resolvedAmount, setResolvedAmount] = useState<string>('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [submittingResolution, setSubmittingResolution] = useState(false);

  const [selectedCallTask, setSelectedCallTask] = useState<any | null>(null);
  const [callTaskResult, setCallTaskResult] = useState<'satisfied' | 'partial' | 'unsatisfied' | 'unreachable'>('satisfied');
  const [callTaskNotes, setCallTaskNotes] = useState('');
  const [submittingCallTask, setSubmittingCallTask] = useState(false);

  // VoIP Dialer and Quality Survey states
  const [isDialing, setIsDialing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [surveyRating, setSurveyRating] = useState(5);
  const [surveyTiming, setSurveyTiming] = useState<'ontime' | 'delayed' | 'noshow'>('ontime');
  const [surveyPricing, setSurveyPricing] = useState<'correct' | 'overcharged'>('correct');
  const callTimerRef = useRef<any>(null);

  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'quality_staff' | 'ops_staff' | 'finance_staff' | 'marketing_staff' | 'sales_staff'>('quality_staff');
  const [selectedStaffRoleFilter, setSelectedStaffRoleFilter] = useState<string>('all');
  const [submittingStaff, setSubmittingStaff] = useState(false);

  const [showAddCampaignModal, setShowAddCampaignModal] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignCode, setCampaignCode] = useState('');
  const [campaignType, setCampaignType] = useState<'percent' | 'fixed' | 'free_trial' | 'upgrade' | 'quota_bonus'>('percent');
  const [campaignValue, setCampaignValue] = useState<string>('');
  const [campaignUpgradeTo, setCampaignUpgradeTo] = useState<string>('');
  const [campaignNewUsers, setCampaignNewUsers] = useState(false);
  const [campaignMaxUses, setCampaignMaxUses] = useState<string>('');
  const [campaignValidFrom, setCampaignValidFrom] = useState('');
  const [campaignValidUntil, setCampaignValidUntil] = useState('');
  const [submittingCampaign, setSubmittingCampaign] = useState(false);

  // NPS & A/B testing & Role-based Dashboard states
  const [npsStats, setNpsStats] = useState<any>(null);
  const [npsAlarms, setNpsAlarms] = useState<any[]>([]);
  const [loadingNps, setLoadingNps] = useState(false);
  
  const [dashboardRole, setDashboardRole] = useState<'executive' | 'quality_staff' | 'sales_staff'>('executive');
  const [roleStats, setRoleStats] = useState<any>(null);
  const [loadingRoleStats, setLoadingRoleStats] = useState(false);
  
  const [abTestConfig, setAbTestConfig] = useState<any>({
    chatModel: 'gemini-1.5-flash',
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

  // Regional KPI state variables
  const [kpiCity, setKpiCity] = useState('');
  const [kpiDistrict, setKpiDistrict] = useState('');
  const [kpiCategorySlug, setKpiCategorySlug] = useState('');
  const [kpiPeriod, setKpiPeriod] = useState<'weekly' | 'monthly' | 'six_months'>('monthly');
  const [kpiData, setKpiData] = useState<any>(null);
  const [loadingKpi, setLoadingKpi] = useState(false);

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
  const handleAdminLogin = async (customPhone?: string) => {
    setLoading(true);
    const targetPhone = customPhone || loginPhone || '+905999999999';
    addLog(`Simüle giriş başlatılıyor: ${targetPhone}...`);

    try {
      // Step A: Send OTP
      const sendRes = await fetch('/api/ortak/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: targetPhone }),
      });
      const sendData = await sendRes.json();
      if (!sendRes.ok) {
        throw new Error(sendData.error?.message || 'OTP gönderimi başarısız.');
      }

      let devOtpCode = sendData.devOtpCode;
      if (!devOtpCode) {
        devOtpCode = '123456';
      }
      addLog(`Doğrulama kodu alındı (Dev OTP): ${devOtpCode}`);

      // Step B: Verify OTP to obtain real JWT Access Token
      const verifyRes = await fetch('/api/ortak/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: targetPhone, code: devOtpCode }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error?.message || 'OTP doğrulaması başarısız.');
      }

      const accessToken = verifyData.accessToken;
      setToken(accessToken);
      addLog(`Oturum tescil edildi! Telefon: ${targetPhone}`);

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
    let profile = null;
    try {
      const res = await fetch('/api/admin/me', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        profile = await res.json();
        setCurrentUser({
          id: profile.id,
          name: profile.name,
          role: profile.role,
          email: profile.email,
          phone: profile.phone,
          permissions: profile.permissions
        });
        addLog(`Yetkiler doğrulandı. Rol: ${profile.role}`);
      }
    } catch (e) {
      addLog('Profil doğrulaması atlanıyor, yerel modda veri yükleniyor.');
    }

    const perms = profile?.permissions || {};
    const isSuper = profile?.role === 'super_admin' || profile?.role === 'admin' || !profile;

    const promises: Promise<any>[] = [];

    if (isSuper || (perms.dashboard && perms.dashboard !== 'none')) {
      promises.push(loadStats(accessToken));
    }
    if (isSuper || (perms.users && perms.users !== 'none')) {
      promises.push(loadUsers(accessToken, 1));
    }
    if (isSuper || (perms.providers && perms.providers !== 'none')) {
      promises.push(loadApprovals(accessToken));
    }
    if (isSuper || (perms.reviews && perms.reviews !== 'none')) {
      promises.push(loadPendingReviews(accessToken));
      promises.push(loadNpsData(accessToken));
      promises.push(loadCallTasks(accessToken));
    }
    if (isSuper || (perms.disputes && perms.disputes !== 'none')) {
      promises.push(loadDisputes(accessToken));
    }
    if (isSuper || (perms.staff && perms.staff !== 'none')) {
      promises.push(loadStaffList(accessToken));
      promises.push(loadAuditLogs(accessToken, 1));
    }
    if (isSuper || (perms.campaigns && perms.campaigns !== 'none')) {
      promises.push(loadCampaigns(accessToken));
    }
    if (isSuper || (perms.ab_test && perms.ab_test !== 'none')) {
      promises.push(loadAbTestConfig(accessToken));
    }

    // Role-specific metrics if allowed dashboard
    if (profile && (isSuper || (perms.dashboard && perms.dashboard !== 'none'))) {
      const roleName = profile.role;
      if (['quality_staff', 'finance_staff', 'sales_staff', 'executive'].includes(roleName)) {
        promises.push(loadRoleDashboardStats(accessToken, roleName));
      }
    } else if (!profile) {
      promises.push(loadRoleDashboardStats(accessToken, dashboardRole));
    }

    await Promise.all(promises);
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

  // --- Uyuşmazlık Çözüm (Disputes) ---
  const loadDisputes = async (accessToken: string) => {
    try {
      const res = await fetch('/api/admin/disputes', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setDisputes(data && data.length > 0 ? data : defaultDisputes);
        addLog(`Uyuşmazlık kuyruğu yüklendi. Açık İtiraz: ${data.length || defaultDisputes.length}`);
      }
    } catch (err: any) {
      addLog(`Uyuşmazlık yüklenemedi: ${err.message}`);
    }
  };

  const handleResolveDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedDispute) return;
    setSubmittingResolution(true);
    try {
      const res = await fetch(`/api/admin/disputes/${selectedDispute.id}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          decision: resolutionDecision,
          resolvedAmount: resolvedAmount ? parseFloat(resolvedAmount) : undefined,
          resolutionNote
        })
      });
      const data = await res.json();
      if (res.ok) {
        addLog(`Uyuşmazlık çözümlendi: ID ${selectedDispute.id} | Karar: ${resolutionDecision}`);
        alert('Uyuşmazlık başarıyla karara bağlandı ve iş kapatıldı.');
        setSelectedDispute(null);
        setResolutionNote('');
        setResolvedAmount('');
        setDisputeTab('details');
        await loadDisputes(token);
        await loadStats(token);
      } else {
        alert(data.error?.message || 'Uyuşmazlık çözümlenemedi.');
      }
    } catch (err: any) {
      addLog(`Dispute çözüm hatası: ${err.message}`);
    } finally {
      setSubmittingResolution(false);
    }
  };

  // --- Arama Görevleri (Call Tasks) ---
  const loadCallTasks = async (accessToken: string) => {
    try {
      const res = await fetch('/api/admin/call-tasks', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCallTasks(data && data.length > 0 ? data : defaultCallTasks);
        addLog(`Çağrı görevleri FIFO kuyruğu yüklendi. Bekleyen: ${data.length || defaultCallTasks.length}`);
      }
    } catch (err: any) {
      addLog(`Çağrı görevleri yüklenemedi: ${err.message}`);
    }
  };

  const startVoipCall = () => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    setIsDialing(true);
    setCallDuration(0);
    callTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const endVoipCall = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    setIsDialing(false);
  };

  const closeCallTaskModal = () => {
    endVoipCall();
    setSelectedCallTask(null);
    setCallTaskNotes('');
    setSurveyRating(5);
    setSurveyTiming('ontime');
    setSurveyPricing('correct');
    setCallDuration(0);
  };

  const handleCallTaskResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedCallTask) return;
    setSubmittingCallTask(true);
    try {
      const timingLabels: Record<string, string> = {
        ontime: 'Zamanında Geldi',
        delayed: 'Gecikmeli Geldi',
        noshow: 'Gelmeyi Reddetti / İptal'
      };
      const pricingLabels: Record<string, string> = {
        correct: 'Anlaşılan Fiyatla Uyumlu',
        overcharged: 'Ekstra Tutar Talep Etti'
      };

      const formattedSurveyNotes = `[KALİTE ANKETİ]
- Hizmet Veren Deneyim Puanı: ${surveyRating}/5 Yıldız
- Zamanlama Uyum: ${timingLabels[surveyTiming] || surveyTiming}
- Fiyatlandırma Uyum: ${pricingLabels[surveyPricing] || surveyPricing}
- Görüşme Süresi: ${callDuration} saniye

[DETAY NOTLARI]
${callTaskNotes}`;

      const res = await fetch(`/api/admin/call-tasks/${selectedCallTask.id}/result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          result: callTaskResult,
          notes: formattedSurveyNotes
        })
      });
      const data = await res.json();
      if (res.ok) {
        addLog(`Arama görevi tamamlandı: ID ${selectedCallTask.id} | Sonuç: ${callTaskResult}`);
        alert('Arama görevi sonucu başarıyla sisteme işlendi.');
        closeCallTaskModal();
        await loadCallTasks(token);
        await loadStats(token);
      } else {
        alert(data.error?.message || 'İşlem başarısız.');
      }
    } catch (err: any) {
      addLog(`Çağrı sonuç kaydetme hatası: ${err.message}`);
    } finally {
      setSubmittingCallTask(false);
    }
  };

  // --- Personel Yönetimi (Staff) ---
  const loadStaffList = async (accessToken: string) => {
    try {
      const res = await fetch('/api/admin/staff', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStaffList(data && data.length > 0 ? data : defaultStaffList);
        addLog(`Personel listesi güncellendi. Çalışan sayısı: ${data.length || defaultStaffList.length}`);
      }
    } catch (err: any) {
      addLog(`Personel listesi yüklenemedi: ${err.message}`);
    }
  };

  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmittingStaff(true);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newStaffName,
          email: newStaffEmail,
          phone: newStaffPhone,
          role: newStaffRole
        })
      });
      const data = await res.json();
      if (res.ok) {
        addLog(`Yeni personel onboard edildi: ${newStaffName} (${newStaffRole})`);
        alert('Personel başarıyla onboard edildi ve sistem yöneticisi oluşturuldu.');
        setShowAddStaffModal(false);
        setNewStaffName('');
        setNewStaffEmail('');
        setNewStaffPhone('');
        await loadStaffList(token);
      } else {
        alert(data.error?.message || 'Personel eklenemedi.');
      }
    } catch (err: any) {
      addLog(`Personel ekleme hatası: ${err.message}`);
    } finally {
      setSubmittingStaff(false);
    }
  };

  // --- Kampanyalar & Kuponlar (Campaigns) ---
  const loadCampaigns = async (accessToken: string) => {
    try {
      const res = await fetch('/api/admin/campaigns', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCampaigns(data && data.length > 0 ? data : defaultCampaigns);
        addLog(`Tanımlı kampanyalar yüklendi. Adet: ${data.length || defaultCampaigns.length}`);
      }
    } catch (err: any) {
      addLog(`Kampanyalar yüklenemedi: ${err.message}`);
    }
  };

  const handleAddCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmittingCampaign(true);
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: campaignName,
          code: campaignCode,
          type: campaignType,
          value: parseFloat(campaignValue),
          upgrade_to: campaignUpgradeTo || undefined,
          applicable_packages: campaignUpgradeTo ? [campaignUpgradeTo] : [],
          new_users_only: campaignNewUsers,
          max_uses: campaignMaxUses ? parseInt(campaignMaxUses) : undefined,
          valid_from: new Date(campaignValidFrom).toISOString(),
          valid_until: new Date(campaignValidUntil).toISOString()
        })
      });
      const data = await res.json();
      if (res.ok) {
        addLog(`Yeni kampanya kodu oluşturuldu: ${campaignCode}`);
        alert('Kampanya kodu başarıyla tanımlandı ve aktifleştirildi.');
        setShowAddCampaignModal(false);
        setCampaignName('');
        setCampaignCode('');
        setCampaignValue('');
        setCampaignUpgradeTo('');
        setCampaignMaxUses('');
        setCampaignValidFrom('');
        setCampaignValidUntil('');
        await loadCampaigns(token);
      } else {
        alert(data.error?.message || 'Kampanya oluşturulamadı.');
      }
    } catch (err: any) {
      addLog(`Kampanya oluşturma hatası: ${err.message}`);
    } finally {
      setSubmittingCampaign(false);
    }
  };

  // --- Denetim Günlüğü (Audit Logs) ---
  const loadAuditLogs = async (accessToken: string, pageNum: number = 1) => {
    try {
      const res = await fetch(`/api/admin/audit-logs?page=${pageNum}&limit=10`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAuditLogs(data.data && data.data.length > 0 ? data.data : defaultAuditLogs);
        setTotalAuditLogs(data.data && data.data.length > 0 ? data.total : defaultAuditLogs.length);
        setAuditLogsPage(pageNum);
        addLog(`Denetim günlükleri yüklendi. Toplam kayıt: ${data.total || defaultAuditLogs.length}`);
      }
    } catch (err: any) {
      addLog(`Audit log yükleme hatası: ${err.message}`);
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
        alert('Yorum onaylandı ve hizmet veren profili güncellendi!');
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
    showConfirm(
      'DİKKAT (KVKK Silme)',
      'Bu kullanıcının tüm kişisel verileri (ad, telefon, e-posta) KVKK gereğince tamamen ve geri alınamaz biçimde silinecektir. Onaylıyor musunuz?',
      async () => {
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
      }
    );
  };

  const handleImpersonateUser = async (targetUser: any) => {
    if (!token || !targetUser) return;
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}/impersonate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.accessToken) {
        addLog(`Kullanıcı taklit modunda ön izleniyor: ${targetUser.name || 'N/A'} (ID: ${targetUser.id})`);
        
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        let targetUrl = '';
        if (targetUser.role === 'service_provider') {
          const providerBase = isLocal ? 'http://localhost:3001' : window.location.origin;
          targetUrl = `${providerBase}/?token=${data.accessToken}&phone=${data.user.phone}&impersonate=true`;
        } else {
          const customerBase = isLocal ? 'http://localhost:3000' : 'https://esnaaf.com';
          targetUrl = `${customerBase}/?token=${data.accessToken}&refresh=${data.refreshToken}&user=${encodeURIComponent(JSON.stringify(data.user))}&impersonate=true`;
        }

        window.open(targetUrl, '_blank');
      } else {
        alert(data.error?.message || 'Ön izleme başlatılamadı.');
      }
    } catch (err: any) {
      addLog(`Ön izleme başlatma hatası: ${err.message}`);
    }
  };

  const loadKpiReport = async (tokenString?: string) => {
    const activeToken = tokenString || token;
    if (!activeToken) return;
    setLoadingKpi(true);
    try {
      const url = new URL('/api/admin/reports/regional-kpi', window.location.origin);
      if (kpiCity) url.searchParams.set('city', kpiCity);
      if (kpiDistrict) url.searchParams.set('district', kpiDistrict);
      if (kpiCategorySlug) url.searchParams.set('categorySlug', kpiCategorySlug);
      url.searchParams.set('period', kpiPeriod);

      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setKpiData(data);
      } else {
        addLog(`KPI Raporu yükleme başarısız: ${data.error?.message}`);
      }
    } catch (err: any) {
      addLog(`KPI Raporu yükleme hatası: ${err.message}`);
    } finally {
      setLoadingKpi(false);
    }
  };

  const loadSubscriptionMgmtData = async (accessToken: string) => {
    const activeToken = accessToken || token;
    if (!activeToken) return;
    try {
      // 0. Load categories
      const resCats = await fetch('/api/auth/categories');
      if (resCats.ok) {
        const cats = await resCats.json();
        setAvailableCategories(cats);
      }

      // 1. Load package configs
      const resConfig = await fetch('/api/admin/package-configs', {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      if (resConfig.ok) {
        const data = await resConfig.json();
        setPackageConfigs(data);
      }

      // 2. Load churned subs
      const resChurned = await fetch('/api/admin/subscription-reports/churned', {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      if (resChurned.ok) {
        const data = await resChurned.json();
        setChurnedSubs(data);
      }

      // 3. Load reports
      await loadSubscriptionReports(activeToken);
    } catch (err: any) {
      addLog(`Abonelik yönetim verisi yükleme hatası: ${err.message}`);
    }
  };

  const loadSubscriptionReports = async (accessToken: string) => {
    const activeToken = accessToken || token;
    if (!activeToken) return;
    try {
      const url = new URL('/api/admin/subscription-reports', window.location.origin);
      if (subReportCity) url.searchParams.append('city', subReportCity);
      if (subReportCategoryId) url.searchParams.append('categoryId', subReportCategoryId);

      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubReports(data);
      }
    } catch (err: any) {
      addLog(`Rapor yükleme hatası: ${err.message}`);
    }
  };

  const updatePackageConfigOnServer = async (pkgDto: { package_type: string; price: number; commission_rate: number; active_jobs_limit: number; delay_minutes: number }) => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/package-configs', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pkgDto)
      });
      const data = await res.json();
      if (res.ok) {
        addLog(`Paket ayarı güncellendi: ${pkgDto.package_type}`);
        const resConfig = await fetch('/api/admin/package-configs', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resConfig.ok) {
          const freshConfigs = await resConfig.json();
          setPackageConfigs(freshConfigs);
        }
        alert('Paket başarıyla güncellendi!');
      } else {
        alert(`Güncelleme başarısız: ${data.message || 'Hata oluştu'}`);
      }
    } catch (err: any) {
      addLog(`Paket güncelleme hatası: ${err.message}`);
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
      } else if (activeTab === 'disputes') {
        loadDisputes(token);
      } else if (activeTab === 'calltasks') {
        loadCallTasks(token);
      } else if (activeTab === 'staff') {
        loadStaffList(token);
      } else if (activeTab === 'campaigns') {
        loadCampaigns(token);
      } else if (activeTab === 'auditlogs') {
        loadAuditLogs(token, auditLogsPage);
      } else if (activeTab === 'kpi') {
        loadKpiReport(token);
      } else if (activeTab === 'subscription_mgmt') {
        loadSubscriptionMgmtData(token);
      }
    }
  }, [activeTab, token]);

  useEffect(() => {
    if (token && activeTab === 'subscription_mgmt') {
      loadSubscriptionReports(token);
    }
  }, [subReportCity, subReportCategoryId, token, activeTab]);

  useEffect(() => {
    if (token && activeTab === 'dashboard') {
      loadRoleDashboardStats(token, dashboardRole);
    }
  }, [dashboardRole, token]);

  useEffect(() => {
    if (token && activeTab === 'kpi') {
      loadKpiReport(token);
    }
  }, [kpiCity, kpiDistrict, kpiCategorySlug, kpiPeriod, token, activeTab]);

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-12 relative overflow-hidden selection:bg-[#c8f252]/30 selection:text-slate-950">
      {/* Decorative background glow */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#c8f252]/10 blur-[120px] pointer-events-none z-0"></div>

      {/* 🚀 Admin Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 h-20 flex justify-between items-center w-full px-6 shadow-sm shadow-slate-100/5">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row justify-between items-center gap-4 w-full">
          <div className="flex items-center w-48 h-10 relative">
            <img 
              alt="Esnaaf Logo" 
              className="absolute left-[-20px] top-1/2 -translate-y-1/2 w-auto select-none max-w-none" 
              style={{ height: '120px', objectFit: 'contain' }}
              src="/logo.png" 
            />
          </div>

          {/* Simulated Super Admin Login */}
          {!token ? (
            <div className="text-xs text-slate-500 font-bold bg-slate-50 border border-slate-200/60 px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>Oturum Açılmadı</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200/60 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
              <div className="text-right">
                <p className="text-xs font-black text-slate-900">{currentUser?.name || 'Süper Admin'}</p>
                <p className="text-[10px] text-slate-400 font-mono uppercase bg-slate-200/60 px-1.5 py-0.5 rounded text-slate-700 font-extrabold mt-0.5 inline-block">
                  {currentUser?.role === 'admin'
                    ? 'Süper Admin'
                    : currentUser?.role === 'quality_staff'
                      ? 'Kalite Sorumlusu'
                      : currentUser?.role === 'finance_staff'
                        ? 'Finans Personeli'
                        : currentUser?.role === 'ops_staff'
                          ? 'Operasyon Temsilcisi'
                          : currentUser?.role === 'sales_staff'
                            ? 'Satış Sorumlusu'
                            : 'Yetkisiz Rol'}
                </p>
              </div>
              <button 
                onClick={() => setToken(null)}
                className="text-slate-500 hover:text-slate-800 text-xs font-bold border-l border-slate-200 pl-3 ml-1 cursor-pointer"
              >
                Çıkış
              </button>
            </div>
          )}
        </div>
      </header>

      {!token ? (
        <section className="max-w-2xl mx-auto px-6 mt-16 text-center relative z-10">
          <div className="bg-white border border-slate-100 rounded-3xl p-10 shadow-xl space-y-6">
            <Lock className="w-14 h-14 text-slate-800 mx-auto mb-2 drop-shadow-[0_0_8px_rgba(200,242,82,0.3)] animate-pulse" />
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900">Merkezi Denetim Yetki Girişi</h2>
              <p className="text-slate-500 text-sm max-w-lg mx-auto font-semibold leading-relaxed">
                Platform yöneticileri ve görevli personel, kendi telefon numaraları ile simüle OTP doğrulamasını yürüterek rollerine özel atanan panellere erişim sağlayabilir.
              </p>
            </div>

            {/* Predefined Quick Login Profiles */}
            <div className="bg-slate-50 border border-slate-200/50 p-5 rounded-2xl space-y-3.5 text-left shadow-inner">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                KOLAY GİRİŞ PROFİLLERİ (SİMÜLASYON)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Profile 1: Admin */}
                <button
                  type="button"
                  onClick={() => {
                    setLoginPhone('+905999999999');
                    handleAdminLogin('+905999999999');
                  }}
                  className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 p-3 rounded-xl flex items-center justify-between transition-all text-xs font-bold cursor-pointer group shadow-sm"
                >
                  <div className="text-left">
                    <p className="font-extrabold text-slate-900 group-hover:text-slate-955">Mert Yılmaz (Yönetici)</p>
                    <p className="text-[10px] text-slate-400 font-mono">+90 599 999 99 99</p>
                  </div>
                  <span className="bg-red-50 border border-red-100 text-red-655 text-[9px] uppercase px-2 py-0.5 rounded font-black">
                    Süper Admin
                  </span>
                </button>

                {/* Profile 2: Can Demir */}
                <button
                  type="button"
                  onClick={() => {
                    setLoginPhone('+905329990011');
                    handleAdminLogin('+905329990011');
                  }}
                  className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 p-3 rounded-xl flex items-center justify-between transition-all text-xs font-bold cursor-pointer group shadow-sm"
                >
                  <div className="text-left">
                    <p className="font-extrabold text-slate-900 group-hover:text-slate-955">Can Demir (Kalite)</p>
                    <p className="text-[10px] text-slate-400 font-mono">+90 532 999 00 11</p>
                  </div>
                  <span className="bg-[#c8f252]/10 border border-[#c8f252]/20 text-slate-850 text-[9px] uppercase px-2 py-0.5 rounded font-black font-sans">
                    Kalite (SLA)
                  </span>
                </button>

                {/* Profile 3: Elif Kaya */}
                <button
                  type="button"
                  onClick={() => {
                    setLoginPhone('+905449992233');
                    handleAdminLogin('+905449992233');
                  }}
                  className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 p-3 rounded-xl flex items-center justify-between transition-all text-xs font-bold cursor-pointer group shadow-sm"
                >
                  <div className="text-left">
                    <p className="font-extrabold text-slate-900 group-hover:text-slate-955">Elif Kaya (Operasyon)</p>
                    <p className="text-[10px] text-slate-400 font-mono">+90 544 999 22 33</p>
                  </div>
                  <span className="bg-blue-50 border border-blue-100 text-blue-600 text-[9px] uppercase px-2 py-0.5 rounded font-black font-sans">
                    Operasyon
                  </span>
                </button>

                {/* Profile 4: Burak Yılmaz */}
                <button
                  type="button"
                  onClick={() => {
                    setLoginPhone('+905559994455');
                    handleAdminLogin('+905559994455');
                  }}
                  className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 p-3 rounded-xl flex items-center justify-between transition-all text-xs font-bold cursor-pointer group shadow-sm"
                >
                  <div className="text-left">
                    <p className="font-extrabold text-slate-900 group-hover:text-slate-955">Burak Yılmaz (Finans)</p>
                    <p className="text-[10px] text-slate-400 font-mono">+90 555 999 44 55</p>
                  </div>
                  <span className="bg-amber-50 border border-amber-100 text-amber-600 text-[9px] uppercase px-2 py-0.5 rounded font-black font-sans">
                    Finans Sorumlusu
                  </span>
                </button>
              </div>
            </div>

            {/* Custom Phone Number Input */}
            <div className="space-y-4 pt-2">
              <div className="text-left">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  DİĞER YETKİLİ TELEFON NUMARASI
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="+905XXXXXXXXX"
                    className="flex-1 bg-slate-50 border border-slate-200/60 focus:border-[#c8f252] rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#c8f252]/30 font-mono"
                  />
                  <button
                    onClick={() => handleAdminLogin()}
                    disabled={loading}
                    className="bg-[#c8f252] hover:bg-[#b5e639] text-slate-955 hover:bg-[#b5e639] font-black px-6 py-3 rounded-xl transition-all text-sm shadow-sm active:scale-[0.98] border border-[#c8f252]/20 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Yükleniyor...' : 'Giriş Simüle Et'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 w-full">
          
          {/* Navigation Tabs Sidebar */}
          <nav className="lg:col-span-3 flex flex-col gap-3">
            {isTabAllowed('dashboard') && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full text-left px-5 py-4 rounded-2xl font-black text-sm flex items-center justify-between transition-all border cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-[#c8f252] border-[#c8f252]/20 text-slate-950 font-extrabold shadow-sm shadow-[#c8f252]/10'
                    : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5" />
                  <span>Genel Durum (Stats)</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>
            )}
            {isTabAllowed('users') && (
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full text-left px-5 py-4 rounded-2xl font-black text-sm flex items-center justify-between transition-all border cursor-pointer ${
                  activeTab === 'users'
                    ? 'bg-[#c8f252] border-[#c8f252]/20 text-slate-950 font-extrabold shadow-sm shadow-[#c8f252]/10'
                    : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5" />
                  <span>Kullanıcı Yönetimi</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>
            )}
            {isTabAllowed('approvals') && (
              <button
                onClick={() => setActiveTab('approvals')}
                className={`w-full text-left px-5 py-4 rounded-2xl font-black text-sm flex items-center justify-between transition-all border cursor-pointer ${
                  activeTab === 'approvals'
                    ? 'bg-[#c8f252] border-[#c8f252]/20 text-slate-950 font-extrabold shadow-sm shadow-[#c8f252]/10'
                    : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5" />
                  <span>Hizmet Veren Onay</span>
                </div>
                <span className="bg-red-50 text-red-655 text-xs px-2.5 py-0.5 rounded-lg font-bold border border-red-100">
                  {approvals.length}
                </span>
              </button>
            )}
            {isTabAllowed('reviews') && (
              <button
                onClick={() => setActiveTab('reviews')}
                className={`w-full text-left px-5 py-4 rounded-2xl font-black text-sm flex items-center justify-between transition-all border cursor-pointer ${
                  activeTab === 'reviews'
                    ? 'bg-[#c8f252] border-[#c8f252]/20 text-slate-950 font-extrabold shadow-sm shadow-[#c8f252]/10'
                    : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5" />
                  <span>Yorum Onay Kuyruğu</span>
                </div>
                {stats && stats.pendingComments > 0 && (
                  <span className="bg-red-50 text-red-655 text-xs px-2.5 py-0.5 rounded-lg font-bold border border-red-100">
                    {stats.pendingComments}
                  </span>
                )}
              </button>
            )}

            {isTabAllowed('nps') && (
              <button
                onClick={() => setActiveTab('nps')}
                className={`w-full text-left px-5 py-4 rounded-2xl font-black text-sm flex items-center justify-between transition-all border cursor-pointer ${
                  activeTab === 'nps'
                    ? 'bg-[#c8f252] border-[#c8f252]/20 text-slate-950 font-extrabold shadow-sm shadow-[#c8f252]/10'
                    : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Percent className="w-5 h-5" />
                  <span>NPS Analiz Paneli</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>
            )}

            {isTabAllowed('abtest') && (
              <button
                onClick={() => setActiveTab('abtest')}
                className={`w-full text-left px-5 py-4 rounded-2xl font-black text-sm flex items-center justify-between transition-all border cursor-pointer ${
                  activeTab === 'abtest'
                    ? 'bg-[#c8f252] border-[#c8f252]/20 text-slate-950 font-extrabold shadow-sm shadow-[#c8f252]/10'
                    : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sliders className="w-5 h-5" />
                  <span>A/B Test ve Ar-Ge</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>
            )}

            {isTabAllowed('disputes') && (
              <button
                onClick={() => setActiveTab('disputes')}
                className={`w-full text-left px-5 py-4 rounded-2xl font-black text-sm flex items-center justify-between transition-all border cursor-pointer ${
                  activeTab === 'disputes'
                    ? 'bg-[#c8f252] border-[#c8f252]/20 text-slate-950 font-extrabold shadow-sm shadow-[#c8f252]/10'
                    : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5" />
                  <span>Uyuşmazlık Çözüm</span>
                </div>
                {disputes.length > 0 && (
                  <span className="bg-red-50 text-red-655 text-xs px-2.5 py-0.5 rounded-lg font-bold border border-red-100 animate-pulse">
                    {disputes.length}
                  </span>
                )}
              </button>
            )}

            {isTabAllowed('calltasks') && (
              <button
                onClick={() => setActiveTab('calltasks')}
                className={`w-full text-left px-5 py-4 rounded-2xl font-black text-sm flex items-center justify-between transition-all border cursor-pointer ${
                  activeTab === 'calltasks'
                    ? 'bg-[#c8f252] border-[#c8f252]/20 text-slate-950 font-extrabold shadow-sm shadow-[#c8f252]/10'
                    : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Power className="w-5 h-5" />
                  <span>SLA Çağrı Görevleri</span>
                </div>
                {callTasks.length > 0 && (
                  <span className="bg-[#c8f252]/20 text-slate-900 text-xs px-2.5 py-0.5 rounded-lg font-bold border border-[#c8f252]/30">
                    {callTasks.length}
                  </span>
                )}
              </button>
            )}

            {isTabAllowed('staff') && (
              <button
                onClick={() => setActiveTab('staff')}
                className={`w-full text-left px-5 py-4 rounded-2xl font-black text-sm flex items-center justify-between transition-all border cursor-pointer ${
                  activeTab === 'staff'
                    ? 'bg-[#c8f252] border-[#c8f252]/20 text-slate-950 font-extrabold shadow-sm shadow-[#c8f252]/10'
                    : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5" />
                  <span>Personel Yönetimi</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>
            )}

            {isTabAllowed('campaigns') && (
              <button
                onClick={() => setActiveTab('campaigns')}
                className={`w-full text-left px-5 py-4 rounded-2xl font-black text-sm flex items-center justify-between transition-all border cursor-pointer ${
                  activeTab === 'campaigns'
                    ? 'bg-[#c8f252] border-[#c8f252]/20 text-slate-950 font-extrabold shadow-sm shadow-[#c8f252]/10'
                    : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Percent className="w-5 h-5" />
                  <span>Kampanya & Kupon</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>
            )}

            {isTabAllowed('auditlogs') && (
              <button
                onClick={() => setActiveTab('auditlogs')}
                className={`w-full text-left px-5 py-4 rounded-2xl font-black text-sm flex items-center justify-between transition-all border cursor-pointer ${
                  activeTab === 'auditlogs'
                    ? 'bg-[#c8f252] border-[#c8f252]/20 text-slate-950 font-extrabold shadow-sm shadow-[#c8f252]/10'
                    : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5" />
                  <span>Denetim Günlükleri</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>
            )}

            {isTabAllowed('kpi') && (
              <button
                onClick={() => setActiveTab('kpi')}
                className={`w-full text-left px-5 py-4 rounded-2xl font-black text-sm flex items-center justify-between transition-all border cursor-pointer ${
                  activeTab === 'kpi'
                    ? 'bg-[#c8f252] border-[#c8f252]/20 text-slate-955 font-extrabold shadow-sm shadow-[#c8f252]/10'
                    : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5" />
                  <span>Bölgesel Raporlar / KPI</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>
            )}

            {isTabAllowed('subscription_mgmt') && (
              <button
                onClick={() => setActiveTab('subscription_mgmt')}
                className={`w-full text-left px-5 py-4 rounded-2xl font-black text-sm flex items-center justify-between transition-all border cursor-pointer ${
                  activeTab === 'subscription_mgmt'
                    ? 'bg-[#c8f252] border-[#c8f252]/20 text-slate-955 font-extrabold shadow-sm shadow-[#c8f252]/10'
                    : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5" />
                  <span>Komisyon ve Abonelik</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>
            )}

            


            {/* SLA Timer Indicator */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 mt-4 text-center shadow-sm">
              <RefreshCw className="w-5 h-5 text-slate-800 mx-auto mb-2.5 animate-spin" style={{ animationDuration: '3s' }} />
              <p className="text-xs text-slate-700 font-bold">Dashboard Canlı Senkronizasyon</p>
              <p className="text-[10px] text-slate-400 font-mono mt-1">Son Güncelleme: 60 saniyede bir</p>
            </div>
          </nav>

          {/* Main Panel Content Area */}
          <section className="lg:col-span-9 flex flex-col gap-6 w-full">
            
            {/* TAB 1: DASHBOARD METRICS */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-slate-800" />
                  <span>Genel Durum ve SLA Metrikleri</span>
                </h2>

                {stats ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {/* Stat 1 */}
                      <div className="bg-white border border-slate-100 rounded-2xl p-6 relative overflow-hidden shadow-sm">
                        <div className="absolute right-4 top-4 bg-[#c8f252]/10 border border-[#c8f252]/20 w-10 h-10 rounded-xl flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-slate-800" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bugün Yeni Talep</p>
                        <h3 className="text-4xl font-black text-slate-900 mt-3">{stats.todayNewRequests}</h3>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">Platform genelinde açılan</p>
                      </div>

                      {/* Stat 2 */}
                      <div className="bg-white border border-slate-100 rounded-2xl p-6 relative overflow-hidden shadow-sm">
                        <div className="absolute right-4 top-4 bg-[#c8f252]/10 border border-[#c8f252]/20 w-10 h-10 rounded-xl flex items-center justify-center">
                          <Users className="w-5 h-5 text-slate-800" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bugün Yeni Kayıt</p>
                        <h3 className="text-4xl font-black text-slate-900 mt-3">{stats.todayNewUsers}</h3>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">Seeker / Provider kaydı</p>
                      </div>

                      {/* Stat 3 */}
                      <div className="bg-white border border-slate-100 rounded-2xl p-6 relative overflow-hidden shadow-sm">
                        <div className="absolute right-4 top-4 bg-red-50 border border-red-100 w-10 h-10 rounded-xl flex items-center justify-center">
                          <ShieldAlert className="w-5 h-5 text-red-600" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aktif Uyuşmazlık</p>
                        <h3 className="text-4xl font-black text-red-600 mt-3">{stats.todayOpenComplaints}</h3>
                        <p className="text-[10px] text-red-500/80 font-semibold mt-1">Müşteri itirazlı iş bitişleri</p>
                      </div>
                    </div>

                    {/* Pending actions block */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                      <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-3 mb-5">
                        Bekleyen Operasyonel İşlemler
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-center shadow-inner">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Onay Bekleyen Hizmet Veren</p>
                          <h4 className="text-2xl font-black text-slate-900 mt-2">{stats.pendingProviders}</h4>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-center shadow-inner">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Onay Bekleyen Yorum</p>
                          <h4 className="text-2xl font-black text-slate-500 mt-2">{stats.pendingComments}</h4>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-center shadow-inner">
                          <p className="text-[10px] font-bold text-red-550 uppercase tracking-wider">Bekleyen İtiraz</p>
                          <h4 className="text-2xl font-black text-red-600 mt-2">{stats.pendingDisputes}</h4>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-center shadow-inner">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">KVKK Başvurusu</p>
                          <h4 className="text-2xl font-black text-slate-500 mt-2">{stats.kvkkRequests}</h4>
                        </div>
                      </div>
                    </div>

                    {/* Payment status block */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                      <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-3 mb-5">
                        Ödeme Durumu (Son 24 Saat)
                      </h3>
                      <div className="grid grid-cols-3 gap-6">
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Başarılı Ödemeler</p>
                          <h4 className="text-3xl font-black text-green-600 mt-2">{stats.payments24h.success}</h4>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-red-650 uppercase tracking-wider">Başarısız Ödemeler</p>
                          <h4 className="text-3xl font-black text-red-600 mt-2">{stats.payments24h.failed}</h4>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Bekleyen Ödemeler</p>
                          <h4 className="text-3xl font-black text-amber-600 mt-2">{stats.payments24h.pending}</h4>
                        </div>
                      </div>
                    </div>

                    {/* 👤 Role-Based Custom Dashboards Section */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                        <div>
                          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                            Personel Rolüne Göre Canlı Göstergeler
                          </h3>
                          <p className="text-[10px] text-slate-400 font-semibold">Seçilen personel rolü için özel veri ve operasyon paneli</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDashboardRole('executive')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                              dashboardRole === 'executive'
                                ? 'bg-[#c8f252] border-[#c8f252]/20 text-slate-950 font-extrabold shadow-sm'
                                : 'bg-slate-50 border-slate-150 text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Yönetici (Executive)
                          </button>
                          <button
                            onClick={() => setDashboardRole('quality_staff')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                              dashboardRole === 'quality_staff'
                                ? 'bg-[#c8f252] border-[#c8f252]/20 text-slate-950 font-extrabold shadow-sm'
                                : 'bg-slate-50 border-slate-150 text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Kalite (Quality)
                          </button>
                          <button
                            onClick={() => setDashboardRole('sales_staff')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                              dashboardRole === 'sales_staff'
                                ? 'bg-[#c8f252] border-[#c8f252]/20 text-slate-950 font-extrabold shadow-sm'
                                : 'bg-slate-50 border-slate-150 text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Satış (Sales)
                          </button>
                        </div>
                      </div>

                      {loadingRoleStats ? (
                        <div className="text-center py-10">
                          <p className="text-xs text-slate-450 italic">Veriler yükleniyor...</p>
                        </div>
                      ) : roleStats ? (
                        <div className="space-y-6">
                          {/* 1. EXECUTIVE VIEW */}
                          {dashboardRole === 'executive' && (
                            <div className="space-y-6 animate-scale-up">
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 shadow-inner">
                                  <p className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Aylık Tekrarlayan Gelir (MRR)</p>
                                  <h4 className="text-2xl font-black text-green-600 mt-2">₺{roleStats.mrr?.toLocaleString('tr-TR')}</h4>
                                  <p className="text-[9px] text-slate-400 font-semibold mt-1">Son 30 gündeki başarılı ödemeler</p>
                                </div>
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 shadow-inner">
                                  <p className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Genel NPS Skoru</p>
                                  <h4 className="text-2xl font-black text-slate-900 mt-2">{roleStats.overallNps}</h4>
                                  <p className="text-[9px] text-slate-400 font-semibold mt-1">Net Tavsiye Skoru (%P - %D)</p>
                                </div>
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 shadow-inner">
                                  <p className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Aktif Hizmet Verenler</p>
                                  <h4 className="text-2xl font-black text-slate-900 mt-2">{roleStats.activeProvidersCount}</h4>
                                  <p className="text-[9px] text-slate-400 font-semibold mt-1">Sistemde onaylı ustalar</p>
                                </div>
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 shadow-inner">
                                  <p className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Eşleşen Aktif Talepler</p>
                                  <h4 className="text-2xl font-black text-slate-900 mt-2">{roleStats.activeRequestsCount}</h4>
                                  <p className="text-[9px] text-slate-400 font-semibold mt-1">Dağıtılmış durumda olanlar</p>
                                </div>
                              </div>

                              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4 shadow-inner">
                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">Başarısız Abonelik Ödemeleri</h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs">
                                    <thead className="text-slate-500 uppercase text-[9px] border-b border-slate-200">
                                      <tr>
                                        <th className="pb-2">Hizmet Veren Usta</th>
                                        <th className="pb-2">İletişim</th>
                                        <th className="pb-2">Tutar</th>
                                        <th className="pb-2">Tarih</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {roleStats.failedPayments?.length === 0 ? (
                                        <tr>
                                          <td colSpan={4} className="py-4 text-center text-slate-400 italic">Kayıt yok.</td>
                                        </tr>
                                      ) : (
                                        roleStats.failedPayments?.map((p: any) => (
                                          <tr key={p.id} className="hover:bg-slate-100/40">
                                            <td className="py-2.5 font-bold text-slate-800">{p.providerName}</td>
                                            <td className="py-2.5 font-mono text-slate-500">{p.providerPhone}</td>
                                            <td className="py-2.5 text-red-600 font-extrabold">₺{p.amount}</td>
                                            <td className="py-2.5 text-slate-400">{new Date(p.created_at).toLocaleString('tr-TR')}</td>
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
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 shadow-inner">
                                  <p className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Açık Arama Görevleri (FIFO)</p>
                                  <h4 className="text-2xl font-black text-slate-900 mt-2">{roleStats.callTasks?.length || 0}</h4>
                                </div>
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 shadow-inner">
                                  <p className="text-[10px] font-bold text-slate-555 uppercase tracking-wider">Bekleyen Yorum Onayları</p>
                                  <h4 className="text-2xl font-black text-slate-900 mt-2">{roleStats.pendingReviews?.length || 0}</h4>
                                </div>
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 shadow-inner">
                                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Gecikmiş SLA Aramaları (Acil)</p>
                                  <h4 className="text-2xl font-black text-red-600 mt-2">{roleStats.slaBreachedCalls?.length || 0}</h4>
                                </div>
                              </div>

                              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4 shadow-inner">
                                <h4 className="text-xs font-black text-red-600 uppercase tracking-wider flex items-center gap-1.5">
                                  <AlertTriangle className="w-4 h-4" />
                                  <span>SLA Aşımı Olan Kalite Arama Görevleri</span>
                                </h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs">
                                    <thead className="text-slate-500 uppercase text-[9px] border-b border-slate-200">
                                      <tr>
                                        <th className="pb-2">Müşteri</th>
                                        <th className="pb-2">Hizmet Veren</th>
                                        <th className="pb-2">Kategori</th>
                                        <th className="pb-2">Son Tarih (Due)</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {roleStats.slaBreachedCalls?.length === 0 ? (
                                        <tr>
                                          <td colSpan={4} className="py-4 text-center text-slate-400 italic">SLA aşımı bulunmamaktadır.</td>
                                        </tr>
                                      ) : (
                                        roleStats.slaBreachedCalls?.map((task: any) => (
                                          <tr key={task.id} className="hover:bg-slate-100/40">
                                            <td className="py-2.5 font-bold text-slate-800">{task.seeker?.name}</td>
                                            <td className="py-2.5 text-slate-600">{task.provider?.name}</td>
                                            <td className="py-2.5 text-green-600 font-bold">{task.job?.categoryName}</td>
                                            <td className="py-2.5 text-red-650 font-mono">{new Date(task.due_at).toLocaleString('tr-TR')}</td>
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
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 shadow-inner">
                                  <p className="text-[10px] font-bold text-slate-555 uppercase tracking-wider">Toplam Aktif Abonelik</p>
                                  <h4 className="text-2xl font-black text-green-600 mt-2">{roleStats.activeSubsCount}</h4>
                                </div>
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 shadow-inner">
                                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Kotası &gt; %85 Dolan Usta Sayısı</p>
                                  <h4 className="text-2xl font-black text-red-600 mt-2">{roleStats.highQuotaUsage?.length || 0}</h4>
                                </div>
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 shadow-inner">
                                  <p className="text-[10px] font-bold text-slate-555 uppercase tracking-wider">Churn Risk Grubu (30 Gün Teklif Vermeyen)</p>
                                  <h4 className="text-2xl font-black text-slate-900 mt-2">{roleStats.churnRiskProviders?.length || 0}</h4>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* High Quota Usage */}
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4 shadow-inner">
                                  <h4 className="text-xs font-black text-red-600 uppercase tracking-wider">Kritik Kota Dolum Alarmları (&gt; %85)</h4>
                                  <div className="overflow-y-auto max-h-60 space-y-2.5">
                                    {roleStats.highQuotaUsage?.length === 0 ? (
                                      <p className="text-xs text-slate-400 italic py-2">Kritik kota aşımı yok.</p>
                                    ) : (
                                      roleStats.highQuotaUsage?.map((q: any) => (
                                        <div key={q.providerId} className="flex justify-between items-center bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                                          <div>
                                            <p className="text-xs font-bold text-slate-800">{q.name}</p>
                                            <p className="text-[10px] text-slate-400 font-mono">{q.phone_decrypted}</p>
                                          </div>
                                          <div className="text-right">
                                            <span className="text-xs font-black text-red-650">{q.usagePct}%</span>
                                            <p className="text-[9px] text-slate-400">{q.acceptedCount}/{q.monthlyLimit} Limit</p>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>

                                {/* Churn Risk */}
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4 shadow-inner">
                                  <h4 className="text-xs font-black text-slate-555 uppercase tracking-wider">Churn Riski Taşıyan Abone Ustalar</h4>
                                  <div className="overflow-y-auto max-h-60 space-y-2.5">
                                    {roleStats.churnRiskProviders?.length === 0 ? (
                                      <p className="text-xs text-slate-400 italic py-2">Churn riskli usta bulunmamaktadır.</p>
                                    ) : (
                                      roleStats.churnRiskProviders?.map((p: any) => (
                                        <div key={p.providerId} className="flex justify-between items-center bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                                          <div>
                                            <p className="text-xs font-bold text-slate-800">{p.name}</p>
                                            <p className="text-[10px] text-slate-400 font-mono">{p.phone_decrypted}</p>
                                          </div>
                                          <div className="text-right text-[10px] text-slate-500">
                                            {p.lastOfferDate ? (
                                              <>
                                                <span className="text-slate-400">Son Teklif:</span>
                                                <p className="font-mono text-slate-555">{new Date(p.lastOfferDate).toLocaleDateString('tr-TR')}</p>
                                              </>
                                            ) : (
                                              <span className="font-bold italic text-amber-600">Hiç Teklif Vermedi</span>
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
                          <p className="text-xs text-slate-450 italic">Seçilen rol verisi yüklenemedi.</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 bg-white border border-slate-100 rounded-3xl shadow-sm">
                    <p className="text-slate-400 text-sm">Metrikler yükleniyor...</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: USER MANAGEMENT */}
            {activeTab === 'users' && (
              <div className="space-y-6 animate-scale-up">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-6 h-6 text-slate-800" />
                  <span>Kullanıcı Yönetim Paneli</span>
                </h2>

                {/* Filter and Search controls */}
                <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Search input */}
                  <div className="relative md:col-span-2">
                    <input
                      type="text"
                      placeholder="İsim, telefon veya e-posta ile arama yapın..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/60 focus:border-[#c8f252] rounded-xl py-2.5 px-4 pl-10 text-sm focus:outline-none transition-colors focus:ring-1 focus:ring-[#c8f252]/30"
                    />
                    <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                  </div>

                  {/* Role filter */}
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200/60 focus:border-[#c8f252] text-slate-700 text-sm rounded-xl px-4 py-2.5 focus:outline-none cursor-pointer focus:ring-1 focus:ring-[#c8f252]/30"
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
                    className="bg-slate-50 border border-slate-200/60 focus:border-[#c8f252] text-slate-700 text-sm rounded-xl px-4 py-2.5 focus:outline-none cursor-pointer focus:ring-1 focus:ring-[#c8f252]/30"
                  >
                    <option value="">Tüm Durumlar</option>
                    <option value="active">Aktif</option>
                    <option value="inactive">Pasif / Kilitli</option>
                  </select>
                </div>

                {/* User List Table */}
                <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                        <tr>
                          <th className="px-6 py-4">Ad Soyad</th>
                          <th className="px-6 py-4">Telefon</th>
                          <th className="px-6 py-4">Rol</th>
                          <th className="px-6 py-4">Durum</th>
                          <th className="px-6 py-4">Kayıt Tarihi</th>
                          <th className="px-6 py-4 text-right">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-12 text-slate-400 text-sm italic">
                              Kriterlere uygun kullanıcı bulunamadı.
                            </td>
                          </tr>
                        ) : (
                          users.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-800">
                                {user.name || 'Ad Belirtilmemiş'}
                              </td>
                              <td className="px-6 py-4 text-xs font-mono text-slate-500">
                                {user.phone_decrypted || user.phone_masked}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-md border ${
                                  user.role === 'admin' 
                                    ? 'bg-red-50 border-red-100 text-red-655' 
                                    : user.role === 'service_provider' 
                                      ? 'bg-[#c8f252]/10 border-[#c8f252]/20 text-slate-900 font-bold' 
                                      : 'bg-slate-50 border-slate-150 text-slate-650'
                                }`}>
                                  {user.role === 'service_seeker' ? 'Müşteri' : user.role === 'service_provider' ? 'Usta' : 'Admin'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`flex items-center gap-1.5 text-xs font-bold ${
                                  user.is_active ? 'text-green-600' : 'text-slate-400'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    user.is_active ? 'bg-green-500' : 'bg-slate-450'
                                  }`}></span>
                                  {user.is_active ? 'Aktif' : 'Banlı / Pasif'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-400">
                                {new Date(user.created_at).toLocaleDateString('tr-TR')}
                              </td>
                              <td className="px-6 py-4 text-right flex items-center justify-end gap-2.5">
                                <button
                                  onClick={() => showUserDetail(user.id)}
                                  className="text-slate-400 hover:text-slate-800 p-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title="İncele"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleToggleActive(user.id)}
                                  className={`p-1 rounded-lg transition-colors cursor-pointer ${
                                    user.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'
                                  }`}
                                  title={user.is_active ? 'Pasif Yap' : 'Aktif Yap'}
                                >
                                  <Power className="w-4 h-4" />
                                </button>
                                {user.is_active && (
                                  <button
                                    onClick={() => setBanUserTarget(user)}
                                    className="text-red-650 hover:bg-red-50 p-1 rounded-lg transition-colors cursor-pointer"
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
                    <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-t border-slate-200/80">
                      <span className="text-xs text-slate-500 font-semibold">
                        Toplam {totalUsers} kayıttan {(userPage - 1) * 10 + 1}-{Math.min(userPage * 10, totalUsers)} arası gösteriliyor
                      </span>
                      <div className="flex gap-2">
                        <button
                          disabled={userPage === 1}
                          onClick={() => loadUsers(token!, userPage - 1)}
                          className="bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-slate-600 text-xs px-3 py-1.5 rounded-lg disabled:opacity-40 shadow-sm cursor-pointer"
                        >
                          Önceki
                        </button>
                        <button
                          disabled={userPage * 10 >= totalUsers}
                          onClick={() => loadUsers(token!, userPage + 1)}
                          className="bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-slate-600 text-xs px-3 py-1.5 rounded-lg disabled:opacity-40 shadow-sm cursor-pointer"
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
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-slate-800" />
                  <span>Hizmet Veren Onay Kuyruğu</span>
                </h2>

                {approvals.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-12 text-center shadow-inner">
                    <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-855 mb-2">Tüm Başvurular İşlendi</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto">
                      Onay veya belge denetimi bekleyen yeni bir hizmet veren başvurusu bulunmamaktadır.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {approvals.map((prov) => (
                      <div 
                        key={prov.id}
                        className="bg-white border border-slate-100 rounded-3xl p-6 flex flex-col justify-between shadow-sm"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-extrabold text-slate-800 text-lg">{prov.user.name || 'Hizmet Veren İsmi Belirtilmemiş'}</h3>
                              <p className="text-xs text-slate-400 mt-0.5">Kayıt: {new Date(prov.user.created_at).toLocaleDateString('tr-TR')}</p>
                            </div>
                            <span className="bg-amber-500/10 border border-amber-500/20 text-amber-600 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md">
                              Onay Bekliyor
                            </span>
                          </div>

                          <div className="space-y-2 border-t border-slate-100 pt-4 mb-6">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400">Telefon:</span>
                              <span className="text-slate-700 font-semibold">{prov.user.phone_decrypted || prov.user.phone_masked}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400">E-Posta:</span>
                              <span className="text-slate-700 font-semibold">{prov.user.email || 'Yok'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400">Kategori:</span>
                              <span className="text-[#c8f252] font-semibold bg-[#c8f252]/10 border border-[#c8f252]/20 px-2 py-0.5 rounded text-[11px] font-black">Ev Temizliği</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => setViewDocsTarget(prov)}
                            className="bg-slate-50 border border-slate-200/60 hover:bg-slate-100 text-slate-700 text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <FileText className="w-4 h-4 text-slate-500" />
                            <span>Yüklenen Belgeleri İncele</span>
                          </button>

                          <div className="flex gap-2">
                            <button
                              onClick={() => setRejectProviderTarget(prov)}
                              className="flex-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold py-3 rounded-xl transition-all text-xs cursor-pointer"
                            >
                              Reddet
                            </button>
                            <button
                              onClick={() => handleApproveProvider(prov.id)}
                              className="flex-1 bg-[#c8f252] text-slate-950 hover:bg-[#b5e639] font-black py-3 rounded-xl transition-all text-xs shadow-sm shadow-[#c8f252]/10 cursor-pointer"
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
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-slate-800" />
                  <span>Yorum ve Değerlendirme Onay Kuyruğu</span>
                </h2>

                {pendingReviews.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-12 text-center shadow-inner">
                    <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-855 mb-2">Tüm Yorumlar İşlendi</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto">
                      Onay bekleyen yeni bir müşteri yorumu veya değerlendirmesi bulunmamaktadır.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {pendingReviews.map((review) => (
                      <div 
                        key={review.id}
                        className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start md:items-center"
                      >
                        <div className="space-y-3 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-slate-800">{review.reviewer.name || 'Müşteri'}</span>
                            <span className="text-xs text-slate-400 font-mono">({review.reviewer.phone_masked})</span>
                            <span className="text-xs text-slate-400 font-bold">→</span>
                            <span className="font-extrabold text-slate-900">{review.provider.user.name}</span>
                            <span className="bg-slate-50 border border-slate-150 text-slate-600 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md">
                              {review.job.category.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span 
                                key={star} 
                                className={`text-xl ${star <= review.rating ? 'text-amber-400' : 'text-slate-200'}`}
                              >
                                ★
                              </span>
                            ))}
                          </div>

                          {review.comment && (
                            <p className="text-slate-655 text-sm italic bg-slate-50 p-3 rounded-xl border border-slate-200/60 leading-relaxed">
                              &ldquo;{review.comment}&rdquo;
                            </p>
                          )}

                          {review.document_url && (
                            <div className="mt-2.5">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Yüklenen Fotoğraf:</p>
                              <div className="relative w-48 h-32 rounded-2xl overflow-hidden border border-slate-200 shadow-inner group cursor-pointer hover:border-[#c8f252] transition-all">
                                <img 
                                  src={review.document_url} 
                                  alt="Yorum görseli" 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                                />
                                <a 
                                  href={review.document_url} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white font-bold transition-all"
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
                            className="flex-1 md:flex-none bg-red-55 border border-red-100 hover:bg-red-500 hover:text-white text-red-650 font-bold px-6 py-3 rounded-xl transition-all text-xs cursor-pointer"
                          >
                            Reddet
                          </button>
                          <button
                            onClick={() => handleApproveReview(review.id)}
                            className="flex-1 md:flex-none bg-[#c8f252] text-slate-950 hover:bg-[#b5e639] font-black px-6 py-3 rounded-xl transition-all text-xs shadow-md shadow-[#c8f252]/10 border border-[#c8f252]/20 cursor-pointer"
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
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Percent className="w-6 h-6 text-slate-800" />
                  <span>NPS Memnuniyet Analitiği & Hizmet Veren Denetim Paneli</span>
                </h2>

                {loadingNps ? (
                  <div className="text-center py-12 bg-white border border-slate-100 rounded-3xl shadow-sm">
                    <p className="text-slate-400 text-sm animate-pulse">NPS verileri derleniyor...</p>
                  </div>
                ) : npsStats ? (
                  <div className="space-y-6">
                    {/* NPS Gauge & Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Premium Gauge Card */}
                      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"></div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Platform Net NPS Skoru</p>
                        
                        {/* Gauge Visual */}
                        <div className="relative w-36 h-36 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke="#f1f5f9"
                              strokeWidth="8"
                              fill="transparent"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke="#c8f252"
                              strokeWidth="8"
                              fill="transparent"
                              strokeDasharray={`${2 * Math.PI * 40}`}
                              strokeDashoffset={`${2 * Math.PI * 40 * (1 - Math.max(0, Math.min(100, npsStats.npsScore + 100)) / 200)}`}
                              className="transition-all duration-1000"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black text-slate-900">{npsStats.npsScore}</span>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                              {npsStats.npsScore >= 50 ? 'Mükemmel' : npsStats.npsScore >= 0 ? 'İyi' : 'Kritik'}
                            </span>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-4">Toplam {npsStats.totalCount} anket yanıtına göre hesaplanmıştır.</p>
                      </div>

                      {/* Breakdown Card */}
                      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between md:col-span-2">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4">Puan Dağılım Dağılımı</h3>
                        
                        <div className="space-y-4">
                          {/* Promoter */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-green-600">Destekleyiciler (Promoters - 7-10 Puan)</span>
                              <span className="text-slate-800">{npsStats.promoterCount} ({npsStats.totalCount > 0 ? Math.round((npsStats.promoterCount / npsStats.totalCount) * 100) : 0}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden border border-slate-200/50">
                              <div 
                                className="bg-green-550 h-full rounded-full transition-all duration-1000"
                                style={{ width: `${npsStats.totalCount > 0 ? (npsStats.promoterCount / npsStats.totalCount) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Passive */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-amber-600">Pasifler (Passives - 4-6 Puan)</span>
                              <span className="text-slate-800">{npsStats.passiveCount} ({npsStats.totalCount > 0 ? Math.round((npsStats.passiveCount / npsStats.totalCount) * 100) : 0}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden border border-slate-200/50">
                              <div 
                                className="bg-[#f0c23a] h-full rounded-full transition-all duration-1000"
                                style={{ width: `${npsStats.totalCount > 0 ? (npsStats.passiveCount / npsStats.totalCount) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Detractor */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-red-650">Kötüleyenler (Detractors - 0-3 Puan)</span>
                              <span className="text-slate-800">{npsStats.detractorCount} ({npsStats.totalCount > 0 ? Math.round((npsStats.detractorCount / npsStats.totalCount) * 100) : 0}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden border border-slate-200/50">
                              <div 
                                className="bg-red-550 h-full rounded-full transition-all duration-1000"
                                style={{ width: `${npsStats.totalCount > 0 ? (npsStats.detractorCount / npsStats.totalCount) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-2xl text-[10px] text-slate-500 leading-relaxed mt-4">
                          <strong>NPS Formülü:</strong> Destekleyenlerin Yüzdesi (%) - Kötüleyenlerin Yüzdesi (%) = Net NPS Skoru. Puanlama aralığı -100 ile +100 arasındadır.
                        </div>
                      </div>
                    </div>

                    {/* Category satisfaction scores table */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
                        Kategorilere Göre NPS ve Ortalama Puan Dağılımı
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="text-slate-500 uppercase text-[9px] border-b border-slate-200">
                            <tr>
                              <th className="pb-2">Kategori</th>
                              <th className="pb-2">Toplam Geri Bildirim</th>
                              <th className="pb-2">Ortalama Puan (0-10)</th>
                              <th className="pb-2">Kategori Net NPS Skoru</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {npsStats.categoryStats?.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="py-4 text-center text-slate-550 italic">Hiç NPS yanıtı girilmemiş.</td>
                              </tr>
                            ) : (
                              npsStats.categoryStats?.map((cat: any) => (
                                <tr key={cat.categoryId} className="hover:bg-slate-50/60">
                                  <td className="py-3 font-bold text-slate-800">{cat.categoryName}</td>
                                  <td className="py-3 text-slate-500">{cat.totalResponses}</td>
                                  <td className="py-3 font-mono text-slate-700">{cat.avgScore} / 10</td>
                                  <td className="py-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                                      cat.npsScore >= 50
                                        ? 'bg-green-50 border-green-100 text-green-600'
                                        : cat.npsScore >= 0
                                          ? 'bg-amber-50 border-amber-100 text-amber-600'
                                          : 'bg-red-50 border-red-100 text-red-600'
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
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 text-red-650 border-b border-slate-100 pb-3">
                        <AlertTriangle className="w-5 h-5" />
                        <h3 className="text-xs font-black uppercase tracking-wider">
                          Kritik Detraktör Alarm Listesi (Son 30 Günde 3+ Detraktör Alan Hizmet Verenler)
                        </h3>
                      </div>

                      {npsAlarms.length === 0 ? (
                        <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200/60">
                          <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                          <p className="text-xs text-slate-500 font-bold">Kritik seviyede kötüleyici yorum biriktirmiş hizmet veren bulunmamaktadır.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {npsAlarms.map((alarm) => (
                            <div key={alarm.providerId} className="bg-slate-50 p-5 rounded-2xl border border-red-100 relative overflow-hidden shadow-sm">
                              <div className="absolute right-0 top-0 bg-red-50 text-red-650 text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl border-l border-b border-red-100">
                                {alarm.detractorCount} Detraktör
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <h4 className="font-extrabold text-slate-800 text-sm">{alarm.name}</h4>
                                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{alarm.phone_decrypted} | {alarm.email}</p>
                                </div>

                                <div className="flex items-center gap-4 text-[10px] border-t border-slate-200/40 pt-2.5">
                                  <span className="text-slate-500">
                                    Genel Puan: <strong className="text-slate-700">{alarm.avg_rating} / 5.00</strong>
                                  </span>
                                  <span className="text-slate-550">
                                    Alarm: <strong className="text-red-600">Son 30 günde 3+ olumsuz anket</strong>
                                  </span>
                                </div>

                                {alarm.recentResponses && alarm.recentResponses.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-slate-200/40 space-y-1.5">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Son Olumsuz Geri Bildirimler:</p>
                                    {alarm.recentResponses.map((r: any) => (
                                      <div key={r.id} className="bg-white p-2 rounded-lg border border-slate-200/50 text-[10px] space-y-0.5 shadow-sm">
                                        <div className="flex justify-between font-bold">
                                          <span className="text-red-655">Skor: {r.score}</span>
                                          <span className="text-slate-400">{new Date(r.created_at).toLocaleDateString('tr-TR')}</span>
                                        </div>
                                        {r.comment && <p className="text-slate-500 italic">&ldquo;{r.comment}&rdquo;</p>}
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
                  <div className="text-center py-12 bg-white border border-slate-100 rounded-3xl shadow-sm">
                    <p className="text-slate-400 text-sm">Veriler çekilemedi.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: A/B TEST PARAMETRELERİ */}
            {activeTab === 'abtest' && (
              <div className="space-y-6 animate-scale-up">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Sliders className="w-6 h-6 text-slate-800" />
                  <span>A/B Sürüm Testi & Google Gemini Ar-Ge Paneli</span>
                </h2>

                <form onSubmit={handleSaveAbTestConfig} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="border-b border-slate-100 pb-4 mb-4">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Google Gemini Sohbet Asistanı Ayarları</h3>
                    <p className="text-[10px] text-slate-400">Müşterilerin talep oluştururken konuştuğu Google Gemini AI asistan model ve sıcaklık ayarları (Redis)</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Model Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-550 uppercase tracking-wider">Aktif Yapay Zeka Modeli (A Sürümü)</label>
                      <select
                        value={abTestConfig.chatModel}
                        onChange={(e) => setAbTestConfig({ ...abTestConfig, chatModel: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200/60 focus:border-[#c8f252] text-slate-705 text-xs rounded-xl px-4 py-3.5 focus:outline-none cursor-pointer focus:ring-1 focus:ring-[#c8f252]/30 font-semibold"
                      >
                        <option value="gemini-3.5-flash">Google Gemini 3.5 Flash (Ultra Hızlı & Düşük Maliyet)</option>
                        <option value="gemini-3.1-pro">Google Gemini 3.1 Pro (Gelişmiş Mantık & Derin Analiz)</option>
                        <option value="gemini-2.0-flash-exp">Google Gemini 2.0 Flash (Önceki Sürüm Deneysel)</option>
                      </select>
                    </div>

                    {/* Temperature Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <span>Model Sıcaklığı (Temperature)</span>
                        <span className="text-slate-950 font-mono font-black">{abTestConfig.temperature}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={abTestConfig.temperature}
                        onChange={(e) => setAbTestConfig({ ...abTestConfig, temperature: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#c8f252]"
                      />
                      <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                        <span>Daha Tutarlı / Belirli</span>
                        <span>Daha Yaratıcı / Serbest</span>
                      </div>
                    </div>

                    {/* Split Ratio Slider */}
                    <div className="space-y-2 md:col-span-2">
                      <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <span>A/B Test Trafik Dağılımı (Sürüm B Oranı)</span>
                        <span className="text-slate-950 font-mono font-black">{(abTestConfig.splitRatio * 100).toFixed(0)}% Sürüm B</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={abTestConfig.splitRatio}
                        onChange={(e) => setAbTestConfig({ ...abTestConfig, splitRatio: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#c8f252]"
                      />
                      <div className="flex justify-between text-[10px] font-black text-slate-700">
                        <span>Sürüm A ({abTestConfig.stats?.control?.modelName || 'Gemini 3.5 Flash'}): {((1 - abTestConfig.splitRatio) * 100).toFixed(0)}% ({abTestConfig.stats?.control?.sessions || 0} Oturum)</span>
                        <span>Sürüm B ({abTestConfig.stats?.variant?.modelName || 'Gemini 3.1 Pro'}): {(abTestConfig.splitRatio * 100).toFixed(0)}% ({abTestConfig.stats?.variant?.sessions || 0} Oturum)</span>
                      </div>
                    </div>
                  </div>

                  {/* 📊 Proje için Yararlı Canlı Grafikler ve Metrikler */}
                  <div className="space-y-6 pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Google Gemini Canlı Karşılaştırma & Performans Analizi</h4>
                        <p className="text-[10px] text-slate-400">Esnaaf yapay zeka asistanı için Gemini modellerinin gerçek zamanlı operasyonel metrikleri</p>
                      </div>
                      <span className="bg-[#c8f252]/10 border border-[#c8f252]/20 text-slate-800 text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md animate-pulse">Canlı Veri Analizi</span>
                    </div>

                    {/* 2x2 Grid of Useful Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Metric 1: Conversion Success Rates */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-3 shadow-inner">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-slate-700" />
                            Talep Dönüşüm Oranı (%)
                          </span>
                          {abTestConfig.stats && (abTestConfig.stats.control.sessions > 0 || abTestConfig.stats.variant.sessions > 0) ? (
                            <span className={`font-bold text-xs px-1.5 py-0.5 rounded ${
                              abTestConfig.stats.variant.rate >= abTestConfig.stats.control.rate
                                ? 'text-green-600 bg-green-50'
                                : 'text-red-650 bg-red-50'
                            }`}>
                              {abTestConfig.stats.variant.rate >= abTestConfig.stats.control.rate
                                ? `+${(abTestConfig.stats.variant.rate - abTestConfig.stats.control.rate).toFixed(1)}% Fark`
                                : `-${(abTestConfig.stats.control.rate - abTestConfig.stats.variant.rate).toFixed(1)}% Fark`}
                            </span>
                          ) : (
                            <span className="text-green-650 font-bold text-xs bg-green-50 px-1.5 py-0.5 rounded">+2.8% Kayma</span>
                          )}
                        </div>
                        <div className="space-y-2.5 pt-1">
                          {/* Flash */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-semibold text-slate-650">
                              <span>Sürüm A ({abTestConfig.stats?.control?.modelName || 'Gemini 3.5 Flash'})</span>
                              <span className="font-extrabold text-slate-900">
                                {abTestConfig.stats?.control?.sessions > 0 ? `${abTestConfig.stats.control.rate}%` : '88.4%'}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200/50 h-2.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-[#c8f252] h-full rounded-full shadow-sm border border-[#c8f252]/10" 
                                style={{ width: abTestConfig.stats?.control?.sessions > 0 ? `${abTestConfig.stats.control.rate}%` : '88.4%' }}
                              ></div>
                            </div>
                          </div>
                          {/* Pro */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-semibold text-slate-650">
                              <span>Sürüm B ({abTestConfig.stats?.variant?.modelName || 'Gemini 3.1 Pro'})</span>
                              <span className="font-extrabold text-slate-900">
                                {abTestConfig.stats?.variant?.sessions > 0 ? `${abTestConfig.stats.variant.rate}%` : '91.2%'}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200/50 h-2.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-slate-700 h-full rounded-full" 
                                style={{ width: abTestConfig.stats?.variant?.sessions > 0 ? `${abTestConfig.stats.variant.rate}%` : '91.2%' }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <p className="text-[9px] text-slate-400 leading-relaxed font-sans">* Müşterinin yapay zeka sohbet asistanı ile konuşmayı yarıda bırakmadan başarıyla talep oluşturma oranıdır.</p>
                      </div>

                      {/* Metric 2: Latency Speed */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-3 shadow-inner">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <RefreshCw className="w-3.5 h-3.5 text-slate-700 animate-spin" style={{ animationDuration: '6s' }} />
                            Ortalama Yanıt Hızı (ms)
                          </span>
                          {abTestConfig.stats && abTestConfig.stats.control.latency > 0 && abTestConfig.stats.variant.latency > 0 ? (
                            <span className="text-[#c8f252] font-black text-[9px] bg-slate-900 px-1.5 py-0.5 rounded">
                              {abTestConfig.stats.control.latency > abTestConfig.stats.variant.latency
                                ? `${(abTestConfig.stats.control.latency / abTestConfig.stats.variant.latency).toFixed(1)}x Hızlı`
                                : `${(abTestConfig.stats.variant.latency / abTestConfig.stats.control.latency).toFixed(1)}x Yavaş`}
                            </span>
                          ) : (
                            <span className="text-[#c8f252] font-black text-[9px] bg-slate-900 px-1.5 py-0.5 rounded">4x Daha Hızlı</span>
                          )}
                        </div>
                        <div className="space-y-2.5 pt-1">
                          {/* Flash */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-semibold text-slate-650">
                              <span>Sürüm A ({abTestConfig.stats?.control?.modelName || 'Gemini 3.5 Flash'})</span>
                              <span className="font-extrabold text-slate-900">
                                {abTestConfig.stats?.control?.latency > 0 ? `${abTestConfig.stats.control.latency} ms` : '120 ms'}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200/50 h-2.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-[#c8f252] h-full rounded-full shadow-sm border border-[#c8f252]/10" 
                                style={{ width: abTestConfig.stats?.control?.latency > 0 ? `${Math.min(100, (abTestConfig.stats.control.latency / 2000) * 100)}%` : '12%' }}
                              ></div>
                            </div>
                          </div>
                          {/* Pro */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-semibold text-slate-650">
                              <span>Sürüm B ({abTestConfig.stats?.variant?.modelName || 'Gemini 3.1 Pro'})</span>
                              <span className="font-extrabold text-slate-900">
                                {abTestConfig.stats?.variant?.latency > 0 ? `${abTestConfig.stats.variant.latency} ms` : '480 ms'}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200/50 h-2.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-slate-700 h-full rounded-full" 
                                style={{ width: abTestConfig.stats?.variant?.latency > 0 ? `${Math.min(100, (abTestConfig.stats.variant.latency / 2000) * 100)}%` : '48%' }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <p className="text-[9px] text-slate-400 leading-relaxed font-sans">* Yapay zekanın ilk token'ı üretip istemciye göndermeye başlama (Time to First Token) ortalama süresidir.</p>
                      </div>

                      {/* Metric 3: Token Cost Comparison */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-3 shadow-inner">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-slate-700" />
                            1M Token Başına Maliyet ($)
                          </span>
                          <span className="text-green-600 font-bold text-xs bg-green-50 px-1.5 py-0.5 rounded">16x Tasarruf</span>
                        </div>
                        <div className="space-y-2.5 pt-1">
                          {/* Flash */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-semibold text-slate-650">
                              <span>Sürüm A (Gemini 3.5 Flash)</span>
                              <span className="font-extrabold text-slate-900">$0.075 / 1M</span>
                            </div>
                            <div className="w-full bg-slate-200/50 h-2.5 rounded-full overflow-hidden">
                              <div className="bg-[#c8f252] h-full rounded-full shadow-sm border border-[#c8f252]/10" style={{ width: '6%' }}></div>
                            </div>
                          </div>
                          {/* Pro */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-semibold text-slate-650">
                              <span>Sürüm B (Gemini 3.1 Pro)</span>
                              <span className="font-extrabold text-slate-900">$1.25 / 1M</span>
                            </div>
                            <div className="w-full bg-slate-200/50 h-2.5 rounded-full overflow-hidden">
                              <div className="bg-slate-700 h-full rounded-full" style={{ width: '96%' }}></div>
                            </div>
                          </div>
                        </div>
                        <p className="text-[9px] text-slate-400 leading-relaxed font-sans">* Girdi ve çıktı token'larının birleşik ortalama maliyet tablosudur. Flash sürümü devasa bütçe avantajı sağlar.</p>
                      </div>

                      {/* Metric 4: NPS & CSAT Alignment */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-3 shadow-inner">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Percent className="w-3.5 h-3.5 text-slate-700" />
                            Yapay Zeka NPS / CSAT Memnuniyet Skoru
                          </span>
                          <span className="text-indigo-600 font-bold text-xs bg-indigo-50 px-1.5 py-0.5 rounded">Yüksek Uyum</span>
                        </div>
                        <div className="space-y-2.5 pt-1">
                          {/* Flash */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-semibold text-slate-650">
                              <span>Sürüm A (Gemini 3.5 Flash)</span>
                              <span className="font-extrabold text-slate-900">4.6 / 5.0</span>
                            </div>
                            <div className="w-full bg-slate-200/50 h-2.5 rounded-full overflow-hidden">
                              <div className="bg-[#c8f252] h-full rounded-full shadow-sm border border-[#c8f252]/10" style={{ width: '92%' }}></div>
                            </div>
                          </div>
                          {/* Pro */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-semibold text-slate-650">
                              <span>Sürüm B (Gemini 3.1 Pro)</span>
                              <span className="font-extrabold text-slate-900">4.9 / 5.0</span>
                            </div>
                            <div className="w-full bg-slate-200/50 h-2.5 rounded-full overflow-hidden">
                              <div className="bg-slate-700 h-full rounded-full" style={{ width: '98%' }}></div>
                            </div>
                          </div>
                        </div>
                        <p className="text-[9px] text-slate-400 leading-relaxed font-sans">* Müşterilerin talep tamamlandıktan sonra sohbet asistanına verdiği anlamlılık ve anlaşılma puanları ortalamasıdır.</p>
                      </div>

                    </div>

                    {/* Highly relevant trade-off notification */}
                    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex gap-3 text-left">
                      <TrendingUp className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-xs">
                        <p className="font-black text-blue-900">Maliyet-Performans Optimizasyon Önerisi</p>
                        <p className="text-blue-700 leading-relaxed font-semibold">
                          Canlı verilerin analizi sonucunda, <strong>Google Gemini 3.5 Flash</strong> kullanımı, <strong>3.1 Pro</strong> modeline kıyasla <strong>%94 daha düşük maliyet</strong> ve <strong>4 kat daha yüksek hız</strong> sağlamaktadır. %2.8'lik düşük dönüşüm oran farkına rağmen, ölçeklenebilir esnaf talepleri için varsayılan model olarak <strong>Gemini 3.5 Flash</strong> kullanılması finansal ve kullanıcı deneyimi açısından en verimli seçenektir.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100 gap-4">
                    <button
                      type="button"
                      onClick={() => loadAbTestConfig(token!)}
                      className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold px-6 py-3 rounded-xl transition-all text-xs cursor-pointer shadow-sm"
                    >
                      Ayarları Sıfırla
                    </button>
                    <button
                      type="submit"
                      disabled={savingAbConfig}
                      className="bg-[#c8f252] text-slate-955 hover:bg-[#b5e639] font-black px-8 py-3 rounded-xl transition-all text-xs shadow-md shadow-[#c8f252]/10 border border-[#c8f252]/20 cursor-pointer"
                    >
                      {savingAbConfig ? 'Kaydediliyor...' : 'Redis Parametrelerini Kaydet'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 7: DISPUTE RESOLUTION CENTER */}
            {activeTab === 'disputes' && (
              <div className="space-y-6 animate-scale-up">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="w-6 h-6 text-red-600" />
                    <span>Uyuşmazlık Çözüm Merkezi (Disputes)</span>
                  </h2>
                  <span className="bg-red-50 text-red-655 text-xs px-3 py-1 rounded-xl font-bold border border-red-100">
                    {disputes.length} Açık Uyuşmazlık
                  </span>
                </div>

                <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                        <tr>
                          <th className="px-6 py-4">Müşteri</th>
                          <th className="px-6 py-4">Hizmet Veren</th>
                          <th className="px-6 py-4">İş Detayı / Kategori</th>
                          <th className="px-6 py-4">Toplam Tutar</th>
                          <th className="px-6 py-4">Durum</th>
                          <th className="px-6 py-4 text-right">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {disputes.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-12 text-slate-400 text-sm italic">
                              Aktif uyuşmazlık bulunmamaktadır.
                            </td>
                          </tr>
                        ) : (
                          disputes.map((disp) => (
                            <tr key={disp.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-bold text-slate-800">{disp.job?.seeker?.user?.name || 'Müşteri'}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{disp.job?.seeker?.user?.phone_masked}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-bold text-slate-800">{disp.job?.provider?.user?.name || 'Usta'}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{disp.job?.provider?.user?.phone_masked}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-semibold text-slate-700">İş #{disp.job_id.substring(0, 8)}</div>
                                <div className="text-xs text-slate-500">{disp.job?.category?.name || 'Genel Hizmet'}</div>
                              </td>
                              <td className="px-6 py-4 font-mono font-bold text-slate-800">
                                ₺{disp.job?.price || '0'}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-md border ${
                                  disp.status === 'open'
                                    ? 'bg-red-50 border-red-100 text-red-655'
                                    : 'bg-green-50 border-green-100 text-green-600'
                                }`}>
                                  {disp.status === 'open' ? 'Açık İtiraz' : 'Çözüldü'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {disp.status === 'open' ? (
                                  <button
                                    onClick={() => {
                                      setSelectedDispute(disp);
                                      setResolutionDecision('mutual_agreement');
                                      setResolvedAmount(disp.job?.price?.toString() || '');
                                    }}
                                    className="bg-[#c8f252] text-slate-950 hover:bg-[#b5e639] font-black px-4 py-2 rounded-xl transition-all text-xs shadow-sm cursor-pointer border border-[#c8f252]/20"
                                  >
                                    Karara Bağla
                                  </button>
                                ) : (
                                  <span className="text-slate-400 text-xs font-bold">Çözümlendi</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: SLA FIFO CALL TASKS QUEUE */}
            {activeTab === 'calltasks' && (
              <div className="space-y-6 animate-scale-up">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Power className="w-6 h-6 text-slate-800" />
                    <span>SLA Uyumlu FIFO Çağrı Görevleri</span>
                  </h2>
                  <span className="bg-[#c8f252]/20 text-slate-900 text-xs px-3 py-1 rounded-xl font-bold border border-[#c8f252]/30">
                    {callTasks.length} Bekleyen Arama
                  </span>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-3xl p-5 text-xs text-amber-850 leading-relaxed flex items-start gap-2.5 shadow-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold">FIFO SLA Protokolü:</span> Aşağıdaki arama görevleri platform kalite standartları gereğince ilk giren ilk çıkar (FIFO) kuralına göre sıralanmıştır. SLA süresi dolmak üzere veya geçmiş olan aramalar en öncelikli sırada yer alır.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {callTasks.length === 0 ? (
                    <div className="col-span-2 bg-slate-50 border border-slate-200/60 rounded-3xl p-12 text-center shadow-inner">
                      <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-slate-855 mb-2">Arama Kuyruğu Boş</h3>
                      <p className="text-slate-500 text-sm max-w-md mx-auto">
                        Müşteri veya hizmet veren kalite takip araması yapılması gereken aktif bir görev bulunmamaktadır.
                      </p>
                    </div>
                  ) : (
                    callTasks.map((task) => {
                      const now = new Date();
                      const dueTime = new Date(task.due_at);
                      const isOverdue = dueTime < now;
                      
                      let slaLabel = '';
                      let slaBadgeClass = '';
                      
                      const diffMs = Math.abs(dueTime.getTime() - now.getTime());
                      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

                      if (isOverdue) {
                        slaLabel = `⚠️ SLA AŞILDI (${diffHrs} sa ${diffMins} dk)`;
                        slaBadgeClass = 'bg-red-50 border-red-100 text-red-655 animate-pulse font-extrabold';
                      } else if (diffHrs < 2) {
                        slaLabel = `⏳ SLA KRİTİK (${diffHrs} sa ${diffMins} dk)`;
                        slaBadgeClass = 'bg-amber-55 border-amber-200 text-amber-700 animate-pulse font-bold';
                      } else {
                        slaLabel = `✅ SLA Güvenli (${diffHrs} sa ${diffMins} dk)`;
                        slaBadgeClass = 'bg-emerald-50 border-emerald-150 text-emerald-700 font-semibold';
                      }

                      const attempts = task.attempt_count || 0;

                      return (
                        <div 
                          key={task.id}
                          className={`bg-white border rounded-3xl p-6 flex flex-col justify-between shadow-sm transition-all ${
                            isOverdue ? 'border-red-200 shadow-red-50/10 shadow-md' : 'border-slate-100 hover:shadow-md'
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <span className={`text-[9px] uppercase px-2 py-0.5 rounded-md border ${slaBadgeClass}`}>
                                  {slaLabel}
                                </span>
                                <h3 className="font-extrabold text-slate-800 text-base mt-2">
                                  Kalite Arama Görevi
                                </h3>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono font-bold">
                                Vade: {new Date(task.due_at).toLocaleDateString('tr-TR')}
                              </span>
                            </div>

                            <div className="space-y-2 border-t border-slate-100 pt-4 mb-6 text-xs text-slate-655">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400">Müşteri (Alıcı):</span>
                                <span className="font-bold text-slate-800">{task.seeker?.name || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-medium">Usta (Hizmet Veren):</span>
                                <span className="font-bold text-slate-800">{task.provider?.name || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400">İş Kategori:</span>
                                <span className="font-semibold text-slate-700 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded text-[10px]">{task.job?.categoryName || 'Genel'}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400">Beyan Edilen Tutar:</span>
                                <span className="font-extrabold text-[#4c630a] bg-[#c8f252]/10 border border-[#c8f252]/30 px-2 py-0.5 rounded text-[10px] font-mono">₺{task.declaredAmount || 0}</span>
                              </div>
                              <div className="flex justify-between items-center pt-1">
                                <span className="text-slate-400">SLA Son Tarih:</span>
                                <span className={`font-mono font-bold ${isOverdue ? 'text-red-600' : 'text-slate-600'}`}>
                                  {new Date(task.due_at).toLocaleTimeString('tr-TR')}
                                </span>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-slate-100/60">
                                <span className="text-slate-400">Çağrı Denemeleri:</span>
                                <div className="flex items-center gap-1.5">
                                  {[1, 2, 3].map((step) => (
                                    <span 
                                      key={step} 
                                      className={`w-2.5 h-2.5 rounded-full border ${
                                        step <= attempts 
                                          ? 'bg-amber-500 border-amber-600 shadow-sm' 
                                          : 'bg-slate-100 border-slate-200'
                                      }`}
                                      title={`${attempts}/3 Deneme`}
                                    />
                                  ))}
                                  <span className="text-[10px] text-slate-450 font-bold ml-1">({attempts}/3)</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedCallTask(task);
                              setCallTaskResult('satisfied');
                            }}
                            className="w-full bg-[#c8f252] text-slate-955 hover:bg-[#b5e639] font-black py-3 rounded-xl transition-all text-xs shadow-sm cursor-pointer border border-[#c8f252]/20 flex items-center justify-center gap-1.5"
                          >
                            <Power className="w-4 h-4" />
                            <span>Aramayı Başlat & Sonuçlandır</span>
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 9: STAFF MANAGEMENT */}
            {activeTab === 'staff' && (
              <div className="space-y-6 animate-scale-up">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Users className="w-6 h-6 text-slate-800" />
                    <span>Personel Ekleme & Yönetimi (Staff)</span>
                  </h2>
                  <button
                    onClick={() => {
                      setNewStaffName('');
                      setNewStaffEmail('');
                      setNewStaffPhone('');
                      setNewStaffRole('quality_staff');
                      setShowAddStaffModal(true);
                    }}
                    className="bg-[#c8f252] text-slate-955 hover:bg-[#b5e639] font-black px-5 py-3 rounded-xl transition-all text-xs shadow-md shadow-[#c8f252]/10 border border-[#c8f252]/20 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>+ Yeni Personel Onboard Et</span>
                  </button>
                </div>

                {/* 📊 Department Breakdown Metric Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {/* Card 1: Kalite */}
                  <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm space-y-2 text-left">
                    <span className="text-xl">🛡️</span>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Kalite & Güvence</h4>
                    <p className="text-xs font-bold text-slate-800 leading-snug">SLA, Yorum ve Uyuşmazlık Yönetimi</p>
                    <div className="text-[10px] text-slate-400 font-bold">
                      Aktif: <strong className="text-slate-800">{staffList.filter(s => s.role === 'quality_staff' && s.is_active).length} Personel</strong>
                    </div>
                  </div>

                  {/* Card 2: Operasyon */}
                  <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm space-y-2 text-left">
                    <span className="text-xl">⚙️</span>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Operasyon & Onay</h4>
                    <p className="text-xs font-bold text-slate-800 leading-snug">Hizmet Veren Belge Onay ve Denetim</p>
                    <div className="text-[10px] text-slate-400 font-bold">
                      Aktif: <strong className="text-slate-800">{staffList.filter(s => s.role === 'ops_staff' && s.is_active).length} Personel</strong>
                    </div>
                  </div>

                  {/* Card 3: Finans */}
                  <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm space-y-2 text-left">
                    <span className="text-xl">💵</span>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Finans & Fatura</h4>
                    <p className="text-xs font-bold text-slate-800 leading-snug">Ödeme, Hakediş ve MRR Takibi</p>
                    <div className="text-[10px] text-slate-400 font-bold">
                      Aktif: <strong className="text-slate-800">{staffList.filter(s => s.role === 'finance_staff' && s.is_active).length} Personel</strong>
                    </div>
                  </div>

                  {/* Card 4: Satış */}
                  <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm space-y-2 text-left">
                    <span className="text-xl">🚀</span>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Satış & Destek</h4>
                    <p className="text-xs font-bold text-slate-800 leading-snug">Hizmet Veren Onboarding ve Kota Alarmları</p>
                    <div className="text-[10px] text-slate-400 font-bold">
                      Aktif: <strong className="text-slate-800">{staffList.filter(s => s.role === 'sales_staff' && s.is_active).length} Personel</strong>
                    </div>
                  </div>

                  {/* Card 5: Pazarlama */}
                  <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm space-y-2 text-left col-span-2 md:col-span-1">
                    <span className="text-xl">🎁</span>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Kampanya & Pazarlama</h4>
                    <p className="text-xs font-bold text-slate-800 leading-snug">Kupon Motoru ve Referans Döngüsü</p>
                    <div className="text-[10px] text-slate-400 font-bold">
                      Aktif: <strong className="text-slate-800">{staffList.filter(s => s.role === 'marketing_staff' && s.is_active).length} Personel</strong>
                    </div>
                  </div>
                </div>

                {/* 🔘 Pill-style Department Filter Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
                  {[
                    { id: 'all', label: 'Tüm Departmanlar', count: staffList.length },
                    { id: 'quality_staff', label: 'Kalite & Güvence', count: staffList.filter(s => s.role === 'quality_staff').length },
                    { id: 'ops_staff', label: 'Operasyon & Onay', count: staffList.filter(s => s.role === 'ops_staff').length },
                    { id: 'finance_staff', label: 'Finans & Fatura', count: staffList.filter(s => s.role === 'finance_staff').length },
                    { id: 'sales_staff', label: 'Satış & Onboarding', count: staffList.filter(s => s.role === 'sales_staff').length },
                    { id: 'marketing_staff', label: 'Pazarlama & Kupon', count: staffList.filter(s => s.role === 'marketing_staff').length }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedStaffRoleFilter(tab.id)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                        selectedStaffRoleFilter === tab.id
                          ? 'bg-[#c8f252] border-[#c8f252]/20 text-slate-950 font-extrabold shadow-sm'
                          : 'bg-slate-50 border-slate-150 text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                        selectedStaffRoleFilter === tab.id
                          ? 'bg-slate-950 text-[#c8f252] font-black'
                          : 'bg-slate-200 text-slate-600 font-bold'
                      }`}>{tab.count}</span>
                    </button>
                  ))}
                </div>

                <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                        <tr>
                          <th className="px-6 py-4">Ad Soyad</th>
                          <th className="px-6 py-4">E-Posta / Tel</th>
                          <th className="px-6 py-4">Departman / Rol</th>
                          <th className="px-6 py-4">Üstlenilen Sorumluluklar</th>
                          <th className="px-6 py-4">Yetki Seviyesi</th>
                          <th className="px-6 py-4">KVKK</th>
                          <th className="px-6 py-4">Durum</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(() => {
                          const filtered = staffList.filter(st => {
                            if (selectedStaffRoleFilter === 'all') return true;
                            return st.role === selectedStaffRoleFilter;
                          });

                          if (filtered.length === 0) {
                            return (
                              <tr>
                                <td colSpan={7} className="text-center py-12 text-slate-400 text-sm italic">
                                  Bu departmanda kayıtlı personel bulunamadı.
                                </td>
                              </tr>
                            );
                          }

                          return filtered.map((st) => (
                            <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-bold text-slate-800">{st.name || 'Ad Belirtilmemiş'}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5 font-semibold">Sistem ID: #{st.id.substring(0, 8)}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-xs font-semibold text-slate-700">{st.email}</div>
                                <div className="text-[10px] font-mono text-slate-450 mt-0.5">{st.phone_decrypted || st.phone_masked}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                                  st.role === 'quality_staff'
                                    ? 'bg-red-50 border-red-100 text-red-655'
                                    : st.role === 'ops_staff'
                                      ? 'bg-blue-50 border-blue-100 text-blue-600'
                                      : st.role === 'finance_staff'
                                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                        : st.role === 'sales_staff'
                                          ? 'bg-[#c8f252]/10 border-[#c8f252]/30 text-[#4c630a]'
                                          : 'bg-purple-50 border-purple-100 text-purple-600'
                                }`}>
                                  {st.role === 'quality_staff' 
                                    ? 'Kalite Personeli' 
                                    : st.role === 'finance_staff' 
                                      ? 'Finans Personeli' 
                                      : st.role === 'sales_staff' 
                                        ? 'Satış Personeli' 
                                        : st.role === 'ops_staff' 
                                          ? 'Operasyon' 
                                          : st.role === 'marketing_staff'
                                            ? 'Pazarlama'
                                            : st.role}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1 max-w-[280px]">
                                  {st.role === 'quality_staff' && (
                                    <>
                                      <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded">SLA Çağrıları</span>
                                      <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded">İtiraz Çözme</span>
                                      <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded">Yorum Onay</span>
                                    </>
                                  )}
                                  {st.role === 'ops_staff' && (
                                    <>
                                      <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded">Usta Onaylama</span>
                                      <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded">Evrak Denetim</span>
                                      <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded">Sistem Günlükleri</span>
                                    </>
                                  )}
                                  {st.role === 'finance_staff' && (
                                    <>
                                      <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded">Ödeme Onayı</span>
                                      <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded">İade / Hakediş</span>
                                      <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded">Fatura Raporu</span>
                                    </>
                                  )}
                                  {st.role === 'sales_staff' && (
                                    <>
                                      <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded">Onboarding</span>
                                      <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded">Kota Alarmları</span>
                                      <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded">Paket Tanımı</span>
                                    </>
                                  )}
                                  {st.role === 'marketing_staff' && (
                                    <>
                                      <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded">Kupon Yönetimi</span>
                                      <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded">Referans Kampanya</span>
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-xs font-bold text-slate-700">
                                {st.role === 'quality_staff' && 'Okuma + Kalite Operasyon'}
                                {st.role === 'ops_staff' && 'Yazma + Sistem Onayları'}
                                {st.role === 'finance_staff' && 'Okuma + Finansal Onay'}
                                {st.role === 'sales_staff' && 'Yazma + Paket Yönetimi'}
                                {st.role === 'marketing_staff' && 'Yazma + Kampanya Ayarı'}
                                {!['quality_staff', 'ops_staff', 'finance_staff', 'sales_staff', 'marketing_staff'].includes(st.role) && 'Tam Yetkili (Süper)'}
                              </td>
                              <td className="px-6 py-4 text-xs">
                                <span className={`font-bold ${st.kvkk_consent ? 'text-green-600' : 'text-slate-400'}`}>
                                  {st.kvkk_consent ? '✅ Onaylı' : '❌ Onaysız'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`flex items-center gap-1 text-xs font-bold ${
                                  st.is_active ? 'text-green-600' : 'text-slate-400'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${st.is_active ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                                  {st.is_active ? 'Aktif' : 'Pasif'}
                                </span>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 10: CAMPAIGN & COUPON ENGINE */}
            {activeTab === 'campaigns' && (
              <div className="space-y-6 animate-scale-up">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Percent className="w-6 h-6 text-slate-800" />
                    <span>Kampanya & Kupon Yönetim Paneli (Engine)</span>
                  </h2>
                  <button
                    onClick={() => {
                      setCampaignName('');
                      setCampaignCode('');
                      setCampaignValue('');
                      setCampaignUpgradeTo('');
                      setCampaignNewUsers(false);
                      setCampaignMaxUses('');
                      setCampaignValidFrom(new Date().toISOString().split('T')[0]);
                      setCampaignValidUntil(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
                      setShowAddCampaignModal(true);
                    }}
                    className="bg-[#c8f252] text-slate-955 hover:bg-[#b5e639] font-black px-5 py-3 rounded-xl transition-all text-xs shadow-md shadow-[#c8f252]/10 border border-[#c8f252]/20 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>+ Yeni Kupon Kodu Tanımla</span>
                  </button>
                </div>

                <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                        <tr>
                          <th className="px-6 py-4">Kampanya Adı</th>
                          <th className="px-6 py-4">Kupon Kodu</th>
                          <th className="px-6 py-4">Tür</th>
                          <th className="px-6 py-4">Değer</th>
                          <th className="px-6 py-4">Kullanım (Maks)</th>
                          <th className="px-6 py-4">Geçerlilik Aralığı</th>
                          <th className="px-6 py-4">Durum</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {campaigns.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-12 text-slate-400 text-sm italic">
                              Kayıtlı kampanya veya kupon bulunmamaktadır.
                            </td>
                          </tr>
                        ) : (
                          campaigns.map((camp) => {
                            const isExpired = new Date(camp.valid_until) < new Date();
                            const isLimitReached = camp.max_uses && camp.uses_count >= camp.max_uses;
                            const isActive = camp.is_active && !isExpired && !isLimitReached;
                            return (
                              <tr key={camp.id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-800">
                                  {camp.name}
                                </td>
                                <td className="px-6 py-4 font-mono font-black text-slate-900 bg-slate-50 border-r border-slate-100 px-3 py-1.5 rounded-lg text-xs">
                                  {camp.code}
                                </td>
                                <td className="px-6 py-4">
                                  <span className="bg-slate-50 border border-slate-150 text-slate-655 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                                    {camp.type === 'percent' 
                                      ? 'Yüzdesel İndirim' 
                                      : camp.type === 'fixed' 
                                        ? 'Sabit İndirim' 
                                        : camp.type === 'quota_bonus' 
                                          ? 'Kota Bonusu' 
                                          : camp.type === 'free_trial' 
                                            ? 'Ücretsiz Deneme' 
                                            : camp.type}
                                  </span>
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-855">
                                  {camp.type === 'percent' 
                                    ? `%${camp.value}` 
                                    : camp.type === 'quota_bonus' 
                                      ? `+${camp.value} Teklif Kotası` 
                                      : `₺${camp.value}`}
                                </td>
                                <td className="px-6 py-4 text-xs font-mono text-slate-500">
                                  {camp.uses_count} / {camp.max_uses || '∞'}
                                </td>
                                <td className="px-6 py-4 text-xs text-slate-400">
                                  {new Date(camp.valid_from).toLocaleDateString('tr-TR')} - {new Date(camp.valid_until).toLocaleDateString('tr-TR')}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-md border ${
                                    isActive
                                      ? 'bg-green-50 border-green-100 text-green-600'
                                      : 'bg-red-50 border-red-100 text-red-655'
                                  }`}>
                                    {isActive ? 'Aktif' : isExpired ? 'Süresi Doldu' : isLimitReached ? 'Tükendi' : 'Pasif'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 11: SYSTEM AUDIT LOG VIEWER */}
            {activeTab === 'auditlogs' && (
              <div className="space-y-6 animate-scale-up">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-slate-800" />
                    <span>Canlı Denetim Günlüğü İzleyici (Audit Log)</span>
                  </h2>
                  <span className="bg-slate-50 border border-slate-200 text-slate-600 text-xs px-3 py-1 rounded-xl font-semibold">
                    Toplam {totalAuditLogs} Kayıt
                  </span>
                </div>

                <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                        <tr>
                          <th className="px-6 py-4">Tarih / Saat</th>
                          <th className="px-6 py-4">Kullanıcı (Denetçi)</th>
                          <th className="px-6 py-4">Aksiyon (Action)</th>
                          <th className="px-6 py-4">Hedef (Target)</th>
                          <th className="px-6 py-4">IP Adresi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-xs">
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-12 text-slate-400 text-sm italic font-sans">
                              Kayıtlı denetim günlüğü bulunmamaktadır.
                            </td>
                          </tr>
                        ) : (
                          auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="px-6 py-4 text-slate-400 text-[11px] whitespace-nowrap">
                                {new Date(log.created_at).toLocaleString('tr-TR')}
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-bold text-slate-800 font-sans">{log.user?.name || 'Sistem'}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{log.user?.email || 'system@esnaaf.com'}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md border ${
                                  log.action?.includes('BAN') || log.action?.includes('REJECT')
                                    ? 'bg-red-50 border-red-100 text-red-655'
                                    : log.action?.includes('APPROVE') || log.action?.includes('RESOLVE') || log.action?.includes('CREATE')
                                      ? 'bg-green-50 border-green-100 text-green-600'
                                      : 'bg-slate-50 border-slate-150 text-slate-655'
                                }`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-[11px] text-slate-550 max-w-xs truncate" title={log.target}>
                                {log.target}
                              </td>
                              <td className="px-6 py-4 text-slate-500 text-[11px]">
                                {log.ip_address || '127.0.0.1'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination control */}
                  {totalAuditLogs > 10 && (
                    <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-t border-slate-200/80">
                      <span className="text-xs text-slate-500 font-sans font-semibold">
                        Toplam {totalAuditLogs} kayıttan {(auditLogsPage - 1) * 10 + 1}-{Math.min(auditLogsPage * 10, totalAuditLogs)} arası gösteriliyor
                      </span>
                      <div className="flex gap-2">
                        <button
                          disabled={auditLogsPage === 1}
                          onClick={() => loadAuditLogs(token!, auditLogsPage - 1)}
                          className="bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-slate-600 text-xs px-3 py-1.5 rounded-lg disabled:opacity-40 shadow-sm cursor-pointer font-sans"
                        >
                          Önceki
                        </button>
                        <button
                          disabled={auditLogsPage * 10 >= totalAuditLogs}
                          onClick={() => loadAuditLogs(token!, auditLogsPage + 1)}
                          className="bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-slate-600 text-xs px-3 py-1.5 rounded-lg disabled:opacity-40 shadow-sm cursor-pointer font-sans"
                        >
                          Sonraki
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 12: REGIONAL KPI & PERFORMANCE REPORTS */}
            {activeTab === 'kpi' && (
              <div className="space-y-6 animate-scale-up">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-slate-800" />
                    <span>Bölgesel KPI & Performans Raporları</span>
                  </h2>
                  <div className="text-xs bg-[#c8f252]/10 border border-[#c8f252]/20 text-slate-800 font-extrabold px-3 py-1.5 rounded-xl">
                    Veri Güncelleme: Anlık
                  </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-black text-slate-500 mb-2 uppercase">İl</label>
                    <select
                      value={kpiCity}
                      onChange={(e) => {
                        setKpiCity(e.target.value);
                        setKpiDistrict('');
                      }}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-slate-350"
                    >
                      <option value="">Tüm İller</option>
                      <option value="Adana">Adana</option>
                      <option value="İstanbul">İstanbul</option>
                      <option value="Ankara">Ankara</option>
                      <option value="İzmir">İzmir</option>
                    </select>
                  </div>

                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-black text-slate-500 mb-2 uppercase">İlçe</label>
                    <select
                      value={kpiDistrict}
                      onChange={(e) => setKpiDistrict(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-slate-350"
                    >
                      <option value="">Tüm İlçeler</option>
                      {kpiCity === 'Adana' && (
                        <>
                          <option value="Seyhan">Seyhan</option>
                          <option value="Çukurova">Çukurova</option>
                          <option value="Yüreğir">Yüreğir</option>
                        </>
                      )}
                      {kpiCity === 'İstanbul' && (
                        <>
                          <option value="Kadıköy">Kadıköy</option>
                          <option value="Beşiktaş">Beşiktaş</option>
                          <option value="Şişli">Şişli</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="flex-1 min-w-[180px]">
                    <label className="block text-xs font-black text-slate-500 mb-2 uppercase">Kategori</label>
                    <select
                      value={kpiCategorySlug}
                      onChange={(e) => setKpiCategorySlug(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-slate-350"
                    >
                      <option value="">Tüm Kategoriler</option>
                      <option value="ev-temizligi">Ev Temizliği</option>
                      <option value="bos-ev-temizligi">Boş Ev Temizliği</option>
                      <option value="boya-badana">Boya Badana</option>
                      <option value="su-tesisati">Su Tesisatı</option>
                      <option value="elektrik-tesisati">Elektrik Tesisatı</option>
                    </select>
                  </div>

                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-black text-slate-500 mb-2 uppercase">Zaman Dilimi</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button
                        onClick={() => setKpiPeriod('weekly')}
                        className={`flex-1 text-[11px] font-black py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
                          kpiPeriod === 'weekly' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Haftalık
                      </button>
                      <button
                        onClick={() => setKpiPeriod('monthly')}
                        className={`flex-1 text-[11px] font-black py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
                          kpiPeriod === 'monthly' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Aylık
                      </button>
                      <button
                        onClick={() => setKpiPeriod('six_months')}
                        className={`flex-1 text-[11px] font-black py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
                          kpiPeriod === 'six_months' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        6 Aylık
                      </button>
                    </div>
                  </div>
                </div>

                {loadingKpi ? (
                  <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-4 border-slate-100 border-t-slate-800 animate-spin mb-3"></div>
                    <p className="text-slate-400 text-xs font-bold">KPI verileri hesaplanıyor...</p>
                  </div>
                ) : kpiData ? (
                  <>
                    {/* General Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
                          <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-400 uppercase">Toplam Talep (Hacim)</p>
                          <h4 className="text-2xl font-black text-slate-900 mt-1">{kpiData.metrics?.totalRequests} Adet</h4>
                        </div>
                      </div>

                      <div className="bg-[#c8f252]/10 rounded-3xl p-6 border border-[#c8f252]/20 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-2xl bg-[#c8f252]/30 flex items-center justify-center text-slate-900">
                          <Check className="w-6 h-6 font-bold" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-500 uppercase">Başarılı İş (Dönüşüm)</p>
                          <h4 className="text-2xl font-black text-slate-900 mt-1">
                            {kpiData.metrics?.successfulRequests} İş <span className="text-xs font-extrabold text-slate-500">(Dönüşüm: %{kpiData.metrics?.conversionRate})</span>
                          </h4>
                        </div>
                      </div>

                      <div className="bg-red-50 rounded-3xl p-6 border border-red-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-2xl bg-red-100/50 flex items-center justify-center text-red-500">
                          <X className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-400 uppercase">İptal / Kabul Edilmeyen</p>
                          <h4 className="text-2xl font-black text-slate-900 mt-1">
                            {kpiData.metrics?.lostRequests} İş <span className="text-xs font-extrabold text-red-500">(Kayıp: %{kpiData.metrics?.lossRate})</span>
                          </h4>
                        </div>
                      </div>
                    </div>

                    {/* Leaderboard Table */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
                        <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                          <Award className="w-4 h-4 text-slate-700" />
                          <span>Liderlik Tablosu (Açık İsimli)</span>
                        </h3>
                        <span className="text-[10px] text-slate-400 font-mono">En Çok İş Kazananlar</span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                            <tr>
                              <th className="px-6 py-4 text-center w-20">Sıralama</th>
                              <th className="px-6 py-4">Usta / İşletme İsmi</th>
                              <th className="px-6 py-4 text-center">Kazanılan İş</th>
                              <th className="px-6 py-4 text-center">Gönderilen Teklif</th>
                              <th className="px-6 py-4 text-center">Teklif Başarı Oranı</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {kpiData.leaderboard?.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="text-center py-12 text-slate-400 text-sm italic font-sans">
                                  Seçilen filtrelerde henüz kayıt bulunmamaktadır.
                                </td>
                              </tr>
                            ) : (
                              kpiData.leaderboard?.map((item: any, idx: number) => (
                                <tr key={item.providerId} className="hover:bg-slate-50/60 transition-colors">
                                  <td className="px-6 py-4 text-center">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black mx-auto ${
                                      idx === 0 
                                        ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                                        : idx === 1 
                                          ? 'bg-slate-100 text-slate-700 border border-slate-200' 
                                          : idx === 2 
                                            ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                                            : 'bg-slate-50 text-slate-400'
                                    }`}>
                                      {idx + 1}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 font-bold text-slate-800">
                                    {item.name}
                                  </td>
                                  <td className="px-6 py-4 text-center font-black text-slate-900">
                                    {item.jobsWon} İş
                                  </td>
                                  <td className="px-6 py-4 text-center text-slate-500 font-mono text-xs">
                                    {item.bidsSent} Teklif
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm text-center">
                    <p className="text-slate-400 text-sm font-bold">Lütfen filtreleri kullanarak analiz yapın.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 13: COMMISSION & SUBSCRIPTION MANAGEMENT */}
            {activeTab === 'subscription_mgmt' && (
              <div className="space-y-6 animate-scale-up">
                {/* Header */}
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-slate-800" />
                    <span>Komisyon ve Abonelik Yönetimi</span>
                  </h2>
                  <div className="text-xs bg-[#c8f252]/10 border border-[#c8f252]/20 text-slate-800 font-extrabold px-3 py-1.5 rounded-xl">
                    Konsol Ayarları: Aktif
                  </div>
                </div>

                {/* Section 1: Package Configurations */}
                <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6">
                  <h3 className="font-extrabold text-slate-900 text-sm mb-4 uppercase tracking-wider">Fiyat ve Komisyon Konsolu</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {['free', 'basic', 'standard', 'vip'].map(type => {
                      const config = packageConfigs.find(c => c.package_type === type) || {
                        package_type: type,
                        price: type === 'free' ? 0 : type === 'basic' ? 5000 : type === 'standard' ? 10000 : 20000,
                        commission_rate: type === 'free' ? 10 : type === 'basic' ? 7 : type === 'standard' ? 5 : 3,
                        active_jobs_limit: type === 'free' ? 1 : type === 'basic' ? 3 : type === 'standard' ? 5 : 7,
                        delay_minutes: type === 'free' ? 15 : type === 'basic' ? 10 : type === 'standard' ? 5 : 0
                      };

                      return (
                        <form
                          key={type}
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const price = Number(formData.get('price'));
                            const commission_rate = Number(formData.get('commission_rate'));
                            const active_jobs_limit = Number(formData.get('active_jobs_limit'));
                            const delay_minutes = Number(formData.get('delay_minutes'));
                            await updatePackageConfigOnServer({
                              package_type: type,
                              price,
                              commission_rate,
                              active_jobs_limit,
                              delay_minutes
                            });
                          }}
                          className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-sm"
                        >
                          <div>
                            <h4 className="font-black text-xs uppercase text-slate-500 tracking-wider mb-3">
                              {type === 'free' ? '🆓 ÜCRETSİZ' : type === 'basic' ? '💎 BASIC' : type === 'standard' ? '👑 STANDART' : '✨ VIP'} PAKET
                            </h4>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-[10px] font-black text-slate-450 uppercase mb-1">Aylık Fiyat (₺)</label>
                                <input
                                  name="price"
                                  type="number"
                                  defaultValue={Number(config.price)}
                                  disabled={type === 'free'}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-[#c8f252] disabled:opacity-60"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-slate-450 uppercase mb-1">Komisyon Oranı (%)</label>
                                <input
                                  name="commission_rate"
                                  type="number"
                                  step="0.1"
                                  defaultValue={Number(config.commission_rate)}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-[#c8f252]"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-slate-450 uppercase mb-1">Aktif İş Limiti</label>
                                <input
                                  name="active_jobs_limit"
                                  type="number"
                                  defaultValue={config.active_jobs_limit}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-[#c8f252]"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-slate-450 uppercase mb-1">Dağıtım Gecikmesi (Dk)</label>
                                <input
                                  name="delay_minutes"
                                  type="number"
                                  defaultValue={config.delay_minutes}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-[#c8f252]"
                                />
                              </div>
                            </div>
                          </div>
                          <button
                            type="submit"
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase py-2 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 mt-2"
                          >
                            Ayarları Kaydet
                          </button>
                        </form>
                      );
                    })}
                  </div>
                  <div className="mt-8 bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                    <p className="text-blue-700 leading-relaxed font-semibold">
                      Canlı verilerin analizi sonucunda, <strong>Google Gemini 3.5 Flash</strong> kullanımı, <strong>3.1 Pro</strong> modeline kıyasla <strong>%94 daha düşük maliyet</strong> ve <strong>4 kat daha yüksek hız</strong> sağlamaktadır. %2.8'lik düşük dönüşüm oran farkına rağmen, ölçeklenebilir hizmet talepleri için varsayılan model olarak <strong>Gemini 3.5 Flash</strong> kullanılması finansal ve kullanıcı deneyimi açısından en verimli seçenektir.
                    </p>
                  </div>
                </div>

                {/* Section 2: Regional / Sectoral Active Subscribers Breakdown (KPI) */}
                <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5 pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">Abonelik Dağılım Raporu (KPI)</h3>
                      <p className="text-xs text-slate-400 mt-1">İl ve Sektör bazında aktif hizmet veren sayıları</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <select
                        value={subReportCity}
                        onChange={(e) => setSubReportCity(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                      >
                        <option value="">Tüm İller</option>
                        <option value="Adana">Adana</option>
                        <option value="İstanbul">İstanbul</option>
                        <option value="Ankara">Ankara</option>
                        <option value="İzmir">İzmir</option>
                      </select>

                      <select
                        value={subReportCategoryId}
                        onChange={(e) => setSubReportCategoryId(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer max-w-[200px]"
                      >
                        <option value="">Tüm Kategoriler</option>
                        {availableCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-450 font-black uppercase border-b border-slate-150">
                          <th className="px-6 py-4">İl</th>
                          <th className="px-6 py-4">Kategori (Sektör)</th>
                          <th className="px-6 py-4 text-center">Ücretsiz</th>
                          <th className="px-6 py-4 text-center">Basic</th>
                          <th className="px-6 py-4 text-center">Standart</th>
                          <th className="px-6 py-4 text-center">VIP</th>
                          <th className="px-6 py-4 text-center">Toplam</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                        {subReports.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-12 text-slate-400 text-xs italic">
                              Seçilen filtrelere uygun aktif hizmet veren bulunamadı.
                            </td>
                          </tr>
                        ) : (
                          subReports.map((row, idx) => {
                            const totalRow = row.free + row.basic + row.standard + row.vip;
                            return (
                              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 text-slate-900">{row.city}</td>
                                <td className="px-6 py-4 text-slate-600">{row.categoryName}</td>
                                <td className="px-6 py-4 text-center text-slate-500 font-mono">{row.free}</td>
                                <td className="px-6 py-4 text-center text-blue-600 font-mono">{row.basic}</td>
                                <td className="px-6 py-4 text-center text-indigo-600 font-mono">{row.standard}</td>
                                <td className="px-6 py-4 text-center text-amber-600 font-mono">{row.vip}</td>
                                <td className="px-6 py-4 text-center text-slate-900 font-mono font-extrabold">{totalRow}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 3: Churned Expired Subscribers List */}
                <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6">
                  <div className="border-b border-slate-100 pb-4 mb-5">
                    <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider text-rose-800">
                      Aboneliği Biten & Yenilemeyen Hizmet Verenler
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Ödemesi veya süresi bitip ücretsiz pakete geri dönmüş hizmet verenlerin takibi</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-rose-50/40 text-rose-900/60 font-black uppercase border-b border-slate-150">
                          <th className="px-6 py-4">Hizmet Veren</th>
                          <th className="px-6 py-4">E-Posta</th>
                          <th className="px-6 py-4">Telefon</th>
                          <th className="px-6 py-4">Son Paket</th>
                          <th className="px-6 py-4">Durum</th>
                          <th className="px-6 py-4">Sona Erme Tarihi</th>
                          <th className="px-6 py-4 text-right">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-650">
                        {churnedSubs.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-12 text-slate-400 text-xs italic">
                              Aboneliği biten hizmet veren bulunmamaktadır.
                            </td>
                          </tr>
                        ) : (
                          churnedSubs.map(sub => (
                            <tr key={sub.id} className="hover:bg-slate-50/40 transition-colors">
                              <td className="px-6 py-4 font-black text-slate-800">{sub.providerName}</td>
                              <td className="px-6 py-4 font-mono text-slate-500">{sub.providerEmail}</td>
                              <td className="px-6 py-4 font-mono text-slate-800">{sub.providerPhone}</td>
                              <td className="px-6 py-4">
                                <span className="bg-slate-100 text-slate-700 text-[10px] font-extrabold uppercase px-2 py-1 rounded-md">
                                  {sub.packageType}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`text-[10px] font-extrabold uppercase px-2 py-1 rounded-md ${
                                  sub.status === 'expired' 
                                    ? 'bg-rose-50 text-rose-700' 
                                    : sub.status === 'cancelled' 
                                      ? 'bg-amber-50 text-amber-700' 
                                      : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {sub.status === 'expired' ? 'Süresi Bitti' : sub.status === 'cancelled' ? 'İptal Edildi' : 'Askıda'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-500">
                                {new Date(sub.expiresAt).toLocaleDateString('tr-TR')}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => showUserDetail(sub.providerId)}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-[10px] px-2.5 py-1.5 rounded-lg cursor-pointer transition-all active:scale-95"
                                >
                                  Kartı Aç
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </section>
        </div>
      )}

      {/* 👤 Kullanıcı Detay Modalı */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-5">
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-800" />
                <span>Kullanıcı Detay Kartı</span>
              </h3>
              <div className="flex items-center gap-3">
                {selectedUser.role !== 'admin' && (
                  <button
                    onClick={() => handleImpersonateUser(selectedUser)}
                    className="bg-[#c8f252] hover:bg-[#b5e639] text-slate-955 text-xs font-black py-1.5 px-3.5 rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm border border-transparent flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ön İzle</span>
                  </button>
                )}
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Profile Card Summary */}
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60 shadow-inner">
                <div className="w-14 h-14 rounded-full bg-[#c8f252]/10 border border-[#c8f252]/20 flex items-center justify-center text-slate-800 font-black text-xl">
                  {(selectedUser.name || 'U').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-lg">{selectedUser.name || 'Ad Belirtilmemiş'}</h4>
                  <p className="text-xs text-slate-400">Kayıt: {new Date(selectedUser.created_at).toLocaleString('tr-TR')}</p>
                </div>
              </div>

              {/* Personal Details */}
              <div className="space-y-2.5">
                <h4 className="text-xs text-slate-500 font-extrabold uppercase tracking-wider mb-2">Kişisel Bilgiler</h4>
                <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Telefon (Tam):</span>
                  <span className="text-slate-800 font-mono">{selectedUser.phone_decrypted || selectedUser.phone_masked}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-500">E-Posta:</span>
                  <span className="text-slate-800">{selectedUser.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Rol:</span>
                  <span className="text-slate-800 font-extrabold uppercase text-xs">{selectedUser.role === 'service_seeker' ? 'Müşteri' : selectedUser.role === 'service_provider' ? 'Hizmet Veren' : 'Admin'}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                  <span className="text-slate-500">KVKK Onayı:</span>
                  <span className="text-slate-800">{selectedUser.kvkk_consent ? '✅ Onaylandı' : '❌ Onay Yok'}</span>
                </div>
              </div>

              {/* Activity Stats */}
              {selectedUser.stats && (
                <div className="space-y-2.5 pt-2">
                  <h4 className="text-xs text-slate-500 font-extrabold uppercase tracking-wider mb-2">Aktivite Özeti</h4>
                  {selectedUser.role === 'service_seeker' ? (
                    <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Toplam Oluşturulan Talep:</span>
                      <span className="text-slate-800 font-extrabold">{selectedUser.stats.totalRequests || 0}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                        <span className="text-slate-500">Toplam Verilen Teklif:</span>
                        <span className="text-slate-800 font-extrabold">{selectedUser.stats.totalOffers || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm border-b border-slate-100 pb-2">
                        <span className="text-slate-500">Kazanılan (Kabul Edilen) İş:</span>
                        <span className="text-slate-800 font-extrabold">{selectedUser.stats.totalWonJobs || 0}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-150">
                <button
                  onClick={() => handleToggleActive(selectedUser.id)}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold py-3.5 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  {selectedUser.is_active ? 'Geçici Pasifleştir' : 'Aktifleştir'}
                </button>
                <button
                  onClick={() => handleKvkkForceDelete(selectedUser.id)}
                  className="flex-1 bg-red-55 border border-red-100 text-red-655 hover:bg-red-500 hover:text-white text-xs font-bold py-3.5 rounded-xl transition-all cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <Ban className="w-5 h-5 text-red-500" />
                <span>Kullanıcıyı Yasakla (Ban)</span>
              </h3>
              <button 
                onClick={() => setBanUserTarget(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-5 text-xs text-red-655 leading-relaxed flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                <span className="font-bold">UYARI:</span> Bu kullanıcı platformdan kalıcı olarak kilitlenecek ve hesap oturumu durdurulacaktır. Karar activity_logs denetim günlüğüne işlenir.
              </div>
            </div>

            <form onSubmit={handleBanUserSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Yasaklama Gerekçesi</label>
                <select
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/60 text-slate-700 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#c8f252] cursor-pointer focus:ring-1 focus:ring-[#c8f252]/30"
                >
                  <option value="fake_profile">Sahte Profil / Kimlik Şüphesi</option>
                  <option value="abuse">Hatalı / Kötüye Kullanım Davranışı</option>
                  <option value="payment_issue">Ödeme & Abonelik Uyuşmazlığı</option>
                  <option value="other">Diğer</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-555 uppercase tracking-wider mb-1.5">Açıklama / Denetçi Notu</label>
                <textarea
                  value={banNotes}
                  onChange={(e) => setBanNotes(e.target.value)}
                  placeholder="Denetim ekibi için yasaklama ayrıntılarını detaylandırın..."
                  rows={4}
                  required
                  className="w-full bg-slate-50 border border-slate-200/60 focus:border-[#c8f252] text-slate-700 rounded-xl py-3 px-4 text-sm focus:outline-none transition-colors resize-none leading-relaxed focus:ring-1 focus:ring-[#c8f252]/30"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBanUserTarget(null)}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition-all text-xs cursor-pointer shadow-sm"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-650 hover:bg-red-500 text-white font-extrabold py-3.5 rounded-xl transition-all text-xs cursor-pointer shadow-md shadow-red-600/15"
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-505" />
                <span>Başvuruyu Reddet</span>
              </h3>
              <button 
                onClick={() => setRejectProviderTarget(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRejectProviderSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Red Sebebi Kodu</label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/60 text-slate-700 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#c8f252] cursor-pointer focus:ring-1 focus:ring-[#c8f252]/30"
                >
                  <option value="R01">R01 - Kimlik belgesi eksik veya okunamaz</option>
                  <option value="R02">R02 - Verilen bilgiler doğrulanamadı</option>
                  <option value="R03">R03 - Hizmet kategorisi uygun değil</option>
                  <option value="R04">R04 - Daha önce banlı hesap</option>
                  <option value="R05">R05 - Diğer (Açıklama alanına yazınız)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-555 uppercase tracking-wider mb-1.5">Red Açıklaması (HV-15 Bildirimine Eklenecektir)</label>
                <textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Başvurana iletilecek ayrıntılı açıklama yazın..."
                  rows={4}
                  required
                  className="w-full bg-slate-50 border border-slate-200/60 focus:border-[#c8f252] text-slate-700 rounded-xl py-3 px-4 text-sm focus:outline-none transition-colors resize-none leading-relaxed focus:ring-1 focus:ring-[#c8f252]/30"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectProviderTarget(null)}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition-all text-xs cursor-pointer shadow-sm"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-extrabold py-3.5 rounded-xl transition-all text-xs shadow-lg shadow-red-650/15 cursor-pointer"
                >
                  Başvuruyu Reddet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📄 Belgeleri İnceleme Modalı */}
      {viewDocsTarget && (() => {
        let onboardingData: any = null;
        try {
          if (viewDocsTarget.description && viewDocsTarget.description.startsWith('{')) {
            onboardingData = JSON.parse(viewDocsTarget.description);
          }
        } catch (e) {
          console.error("Error parsing onboarding data", e);
        }
        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-5">
                <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#c8f252]" />
                  <span>Hizmet Veren Belgeleri: {viewDocsTarget.user.name}</span>
                </h3>
                <button 
                  onClick={() => setViewDocsTarget(null)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {onboardingData ? (
                <div className="space-y-6 pb-6 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin text-left">
                  {/* Profile Photo & Basic Company Details */}
                  <div className="flex flex-col md:flex-row gap-5 items-start bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                    {onboardingData.profilePhoto && (
                      <img 
                        src={onboardingData.profilePhoto} 
                        alt="Profil Resmi" 
                        className="w-24 h-24 rounded-full object-cover border-2 border-slate-200 shadow-sm shrink-0 mx-auto md:mx-0"
                      />
                    )}
                    <div className="space-y-2 flex-1 w-full">
                      <h4 className="font-extrabold text-slate-800 text-base">{viewDocsTarget.user.name}</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Şirket Türü</span>
                          <span className="text-slate-850 font-bold">{onboardingData.companyType}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Firma Adı</span>
                          <span className="text-slate-855 font-bold">{onboardingData.companyName || 'Belirtilmemiş'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Telefon</span>
                          <span className="text-slate-855 font-bold font-mono">{viewDocsTarget.user.phone_decrypted || viewDocsTarget.user.phone_masked}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">E-Posta</span>
                          <span className="text-slate-855 font-bold">{viewDocsTarget.user.email || 'Belirtilmemiş'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tanıtım Yazısı */}
                  <div className="space-y-1.5 bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Tanıtım Yazısı</span>
                    <p className="text-xs text-slate-700 leading-relaxed italic">{onboardingData.descriptionText || 'Tanıtım yazısı yok.'}</p>
                  </div>

                  {/* Referans Resimleri */}
                  {onboardingData.referencePhotos && onboardingData.referencePhotos.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Referans İş Resimleri ({onboardingData.referencePhotos.length})</span>
                      <div className="grid grid-cols-5 gap-3">
                        {onboardingData.referencePhotos.map((url: string, idx: number) => (
                          <a 
                            key={idx} 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="aspect-square bg-slate-100 border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:scale-[1.03] transition-all animate-scale-up"
                          >
                            <img src={url} alt={`Referans ${idx}`} className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Doğrulama Belgeleri */}
                  <div className="space-y-3 bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold mb-2">Doğrulama Belgeleri</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Kimlik Belgesi */}
                      <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between h-40">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">T.C. KİMLİK BELGESİ</span>
                            {onboardingData.identityDocument ? (
                              <span className="bg-emerald-100 text-emerald-700 text-[8px] font-bold px-2 py-0.5 rounded-full font-mono">YÜKLENDİ</span>
                            ) : (
                              <span className="bg-red-100 text-red-700 text-[8px] font-bold px-2 py-0.5 rounded-full font-mono">YÜKLENMEDİ</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 font-semibold mb-2">Kimlik kartı veya sürücü belgesi görseli</p>
                        </div>
                        {onboardingData.identityDocument ? (
                          <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
                            {onboardingData.identityDocument.endsWith('.pdf') ? (
                              <span className="text-[10px] font-black text-slate-550 font-mono">📄 PDF DOKÜMANI</span>
                            ) : (
                              <img src={onboardingData.identityDocument} className="w-12 h-8 object-cover rounded-md border border-slate-200" />
                            )}
                            <a 
                              href={onboardingData.identityDocument} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-slate-900 bg-[#c8f252] hover:bg-[#b5e639] font-black px-4 py-2 rounded-lg transition-all"
                            >
                              Görüntüle
                            </a>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Belge henüz yüklenmemiş.</span>
                        )}
                      </div>

                      {/* Vergi Levhası */}
                      <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between h-40">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">VERGİ LEVHASI</span>
                            {onboardingData.taxPlateDocument ? (
                              <span className="bg-emerald-100 text-emerald-700 text-[8px] font-bold px-2 py-0.5 rounded-full font-mono">YÜKLENDİ</span>
                            ) : (
                              <span className="bg-red-100 text-red-700 text-[8px] font-bold px-2 py-0.5 rounded-full font-mono">YÜKLENMEDİ</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 font-semibold mb-2">Resmi maliye vergi levhası belgesi</p>
                        </div>
                        {onboardingData.taxPlateDocument ? (
                          <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
                            {onboardingData.taxPlateDocument.endsWith('.pdf') ? (
                              <span className="text-[10px] font-black text-slate-550 font-mono">📄 PDF DOKÜMANI</span>
                            ) : (
                              <img src={onboardingData.taxPlateDocument} className="w-12 h-8 object-cover rounded-md border border-slate-200" />
                            )}
                            <a 
                              href={onboardingData.taxPlateDocument} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-slate-900 bg-[#c8f252] hover:bg-[#b5e639] font-black px-4 py-2 rounded-lg transition-all"
                            >
                              Görüntüle
                            </a>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Belge henüz yüklenmemiş.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Fallback (Mockup Identity & Tax certificate) */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 text-left">
                  {/* Document 1: Identity Card Mockup */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60 relative overflow-hidden flex flex-col justify-between h-64 shadow-inner">
                    <div>
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">T.C. KİMLİK KARTI</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-green-555"></span>
                      </div>
                      <h5 className="font-extrabold text-slate-800 text-sm tracking-wide">TÜRKİYE CUMHURİYETİ KİMLİK VESİKASI</h5>
                      <div className="space-y-1 mt-4 text-[11px] font-mono text-slate-600">
                        <p>Soyadı: <span className="text-slate-800 font-bold">USTA</span></p>
                        <p>Adı: <span className="text-slate-800 font-bold">{(viewDocsTarget.user.name || '').split(' ')[1] || 'DAVUT'}</span></p>
                        <p>T.C. No: <span className="text-slate-800 font-bold">123*****890</span></p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-450 mt-4">
                      <span>Esnaaf Doğrulama Servisi</span>
                      <span>Belge Durumu: E-Devlet Onaylı</span>
                    </div>
                  </div>

                  {/* Document 2: Tax Certificate Mockup */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60 relative overflow-hidden flex flex-col justify-between h-64 shadow-inner">
                    <div>
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">VERGİ LEVHASI</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-green-555"></span>
                      </div>
                      <h5 className="font-extrabold text-slate-800 text-sm tracking-wide">T.C. GELİR İDARESİ BAŞKANLIĞI</h5>
                      <div className="space-y-1 mt-4 text-[11px] font-mono text-slate-600">
                        <p>Unvan: <span className="text-slate-800 font-bold">{(viewDocsTarget.user.name || 'TEMİZLİK USTASI').toUpperCase()}</span></p>
                        <p>Vergi Dairesi: <span className="text-slate-800 font-bold">KADIKÖY VD.</span></p>
                        <p>Vergi No: <span className="text-slate-800 font-bold">9876543210</span></p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-455 mt-4">
                      <span>Maliye Bakanlığı Entegrasyonu</span>
                      <span>İş Kolu: Ev Temizliği Hizmetleri</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-slate-100 justify-end">
                <button
                  onClick={() => setViewDocsTarget(null)}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 font-bold px-6 py-3 rounded-xl transition-all text-xs text-slate-600 cursor-pointer shadow-sm"
                >
                  Kapat
                </button>
                <button
                  onClick={() => {
                    setViewDocsTarget(null);
                    setRejectProviderTarget(viewDocsTarget);
                  }}
                  className="bg-red-50 border border-red-100 hover:bg-red-500 hover:text-white text-red-650 font-bold px-6 py-3 rounded-xl transition-all text-xs cursor-pointer"
                >
                  Başvuruyu Reddet
                </button>
                <button
                  onClick={() => {
                    setViewDocsTarget(null);
                    handleApproveProvider(viewDocsTarget.id);
                  }}
                  className="bg-[#c8f252] text-slate-955 hover:bg-[#b5e639] font-black px-6 py-3 rounded-xl transition-all text-xs cursor-pointer"
                >
                  Başvuruyu Onayla
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ⚖️ Uyuşmazlık Çözüm Karar Modalı */}
      {selectedDispute && (() => {
        const totalVal = Number(selectedDispute.job?.price || 0);
        const commission = totalVal * 0.1;
        const netTotal = totalVal - commission;
        const customerClaim = "Usta işi taahhüt ettiği tarihte bitirmedi, duvarlarda boya dalgalanmaları mevcut ve evi temizlemeden terk etti. Hizmet kusurlu olduğu için ücretin tamamının iadesini talep ediyorum.";
        const providerDefense = "Duvar boyaması anlaşılan kat sayısında ve standartlara uygun tamamlandı. Müşteri sonradan ekstra tavan boyaması talep etti, ek bütçe vermeyeceğini söyleyince tartışma çıktı. Emeğimin tam karşılığı ödenmeli.";
        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-up max-h-[95vh] overflow-y-auto pr-2 scrollbar-thin">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                  <span>Uyuşmazlık Karara Bağla</span>
                </h3>
                <button 
                  onClick={() => setSelectedDispute(null)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-xs text-slate-655 space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Müşteri:</span>
                  <span className="font-bold text-slate-800">{selectedDispute.job?.seeker?.user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hizmet Veren:</span>
                  <span className="font-bold text-slate-800">{selectedDispute.job?.provider?.user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Toplam İş Tutarı:</span>
                  <span className="font-bold text-slate-800 font-mono">₺{selectedDispute.job?.price}</span>
                </div>
              </div>

              {/* Tabs for Details vs Claim/Defense */}
              <div className="flex border-b border-slate-100 mb-4 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setDisputeTab('details')}
                  className={`flex-1 pb-2 border-b-2 transition-colors cursor-pointer text-center ${
                    disputeTab === 'details' ? 'border-[#c8f252] text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-655'
                  }`}
                >
                  Karar & Bölüşüm
                </button>
                <button
                  type="button"
                  onClick={() => setDisputeTab('evidence')}
                  className={`flex-1 pb-2 border-b-2 transition-colors cursor-pointer text-center ${
                    disputeTab === 'evidence' ? 'border-[#c8f252] text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-655'
                  }`}
                >
                  Savunma & Kanıtlar
                </button>
              </div>

              {disputeTab === 'evidence' && (
                <div className="space-y-4 mb-4">
                  <div className="bg-rose-50 border border-rose-100/60 p-3.5 rounded-2xl text-[11px] text-slate-700 animate-scale-up">
                    <span className="font-extrabold text-rose-700 block mb-1">Müşteri İddiası (İtiraz Sebebi)</span>
                    "{selectedDispute.job?.seekerClaim || customerClaim}"
                  </div>

                  <div className="bg-indigo-50 border border-indigo-100/60 p-3.5 rounded-2xl text-[11px] text-slate-700 animate-scale-up">
                    <span className="font-extrabold text-indigo-700 block mb-1">Hizmet Veren Savunması (Açıklama)</span>
                    "{selectedDispute.job?.providerDefense || providerDefense}"
                  </div>

                  <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl text-[10px] text-slate-500 animate-scale-up">
                    <span className="font-extrabold text-slate-700 block mb-1">Kanıt Ekleri</span>
                    <div className="flex gap-2 mt-2">
                      <span className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono cursor-pointer hover:bg-slate-100">📷 hasar_goruntusu_1.jpg</span>
                      <span className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono cursor-pointer hover:bg-slate-100">📄 is_sozlesmesi.pdf</span>
                    </div>
                  </div>
                </div>
              )}

              {disputeTab === 'details' && (
                <form onSubmit={handleResolveDisputeSubmit} className="space-y-4 animate-scale-up">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nihai Hak Hakem Kararı</label>
                    <select
                      value={resolutionDecision}
                      onChange={(e) => {
                        const dec = e.target.value as any;
                        setResolutionDecision(dec);
                        if (dec === 'seeker_correct') setResolvedAmount('0');
                        else if (dec === 'provider_correct') setResolvedAmount(netTotal.toString());
                        else if (dec === 'mutual_agreement') setResolvedAmount((netTotal / 2).toString());
                      }}
                      className="w-full bg-slate-50 border border-slate-200/60 text-slate-700 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#c8f252] cursor-pointer"
                    >
                      <option value="mutual_agreement">Karşılıklı Uzlaşma / Anlaşma</option>
                      <option value="seeker_correct">Müşteri Haklı (İade Yapılsın)</option>
                      <option value="provider_correct">Hizmet Veren Haklı (Hakediş Aktarılsın)</option>
                    </select>
                  </div>

                  {/* Split Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold text-slate-555 uppercase tracking-wider">Hakediş Bölüşüm Oranı</label>
                      <span className="text-[11px] font-black text-indigo-650 font-mono">
                        %{Math.round((Number(resolvedAmount || 0) / (netTotal || 1)) * 100)} Hizmet Veren / %{Math.round(((netTotal - Number(resolvedAmount || 0)) / (netTotal || 1)) * 100)} Müşteri
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={netTotal}
                      step="1"
                      value={Number(resolvedAmount || 0)}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setResolvedAmount(val.toString());
                        if (val === 0) setResolutionDecision('seeker_correct');
                        else if (val === netTotal) setResolutionDecision('provider_correct');
                        else setResolutionDecision('mutual_agreement');
                      }}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#c8f252]"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1">
                      <span>Müşteri (%100 İade)</span>
                      <span>Orta Uzlaşı</span>
                      <span>Usta (%100 Payout)</span>
                    </div>
                  </div>

                  {/* Preset split buttons */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setResolutionDecision('seeker_correct');
                        setResolvedAmount('0');
                      }}
                      className={`flex-1 py-1.5 text-[10px] font-bold border rounded-lg transition-all cursor-pointer ${
                        Number(resolvedAmount) === 0 ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-200 text-slate-655 hover:bg-slate-100'
                      }`}
                    >
                      Müşteriye %100
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setResolutionDecision('mutual_agreement');
                        setResolvedAmount((netTotal / 2).toString());
                      }}
                      className={`flex-1 py-1.5 text-[10px] font-bold border rounded-lg transition-all cursor-pointer ${
                        Math.abs(Number(resolvedAmount) - netTotal / 2) < 2 ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-200 text-slate-655 hover:bg-slate-100'
                      }`}
                    >
                      %50 / %50
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setResolutionDecision('provider_correct');
                        setResolvedAmount(netTotal.toString());
                      }}
                      className={`flex-1 py-1.5 text-[10px] font-bold border rounded-lg transition-all cursor-pointer ${
                        Number(resolvedAmount) === netTotal ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-200 text-slate-655 hover:bg-slate-100'
                      }`}
                    >
                      Hizmet Verene %100
                    </button>
                  </div>

                  {/* Breakdown Summary Card */}
                  <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 text-xs border border-slate-800 shadow-lg">
                    <span className="text-[9px] font-black text-slate-400 block border-b border-slate-800 pb-1.5 mb-2 tracking-wider font-mono">HAKEDİŞ DAĞILIM RAPORU</span>
                    <div className="flex justify-between items-center font-mono">
                      <span className="text-slate-400">Brüt İş Bedeli:</span>
                      <span className="font-bold">₺{totalVal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center font-mono text-[#c8f252]">
                      <span className="text-slate-400">Platform Komisyonu (%10):</span>
                      <span className="font-bold">-₺{commission.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center font-mono border-t border-slate-800 pt-1.5">
                      <span className="text-slate-400">Net Dağıtılabilir:</span>
                      <span className="font-bold text-slate-200">₺{netTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center font-mono text-emerald-400 border-t border-slate-800 pt-1.5">
                      <span>Müşteriye İade:</span>
                      <span className="font-black">₺{(netTotal - Number(resolvedAmount || 0)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center font-mono text-amber-400">
                      <span>Hizmet Veren Payout:</span>
                      <span className="font-black">₺{Number(resolvedAmount || 0).toFixed(2)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-555 uppercase tracking-wider mb-1.5 font-mono">Hakem Çözüm Açıklaması / Rapor</label>
                    <textarea
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      placeholder="İade veya ödeme gerekçesini, tarafların kanıt durumlarını detaylıca raporlayın..."
                      rows={3}
                      required
                      className="w-full bg-slate-50 border border-slate-200/60 focus:border-[#c8f252] text-slate-700 rounded-xl py-3 px-4 text-sm focus:outline-none transition-colors resize-none leading-relaxed"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDispute(null)}
                      className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition-all text-xs cursor-pointer shadow-sm"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      disabled={submittingResolution}
                      className="flex-1 bg-[#c8f252] text-slate-955 hover:bg-[#b5e639] font-black py-3.5 rounded-xl transition-all text-xs shadow-md border border-[#c8f252]/20 cursor-pointer"
                    >
                      {submittingResolution ? 'Karar Kaydediliyor...' : 'Uyuşmazlığı Kapat'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        );
      })()}

      {/* 📞 SLA Kalite Arama Sonuç Modalı */}
      {selectedCallTask && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-up max-h-[90vh] overflow-y-auto pr-2 scrollbar-thin">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <Power className="w-5 h-5 text-[#c8f252]" />
                <span>Çağrı Sonucu Kaydet</span>
              </h3>
              <button 
                onClick={closeCallTaskModal}
                className="text-slate-400 hover:text-slate-700 p-1.5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-xs text-slate-655 space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Müşteri:</span>
                <span className="font-bold text-slate-800">{selectedCallTask.seeker?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Hizmet Veren:</span>
                <span className="font-bold text-slate-800">{selectedCallTask.provider?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>İş Kategori / Tutar:</span>
                <span className="font-bold text-slate-850">{selectedCallTask.job?.categoryName || 'Genel'} / ₺{selectedCallTask.declaredAmount || 0}</span>
              </div>
            </div>

            {/* VoIP Simulation Area */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl mb-4 space-y-3 relative overflow-hidden shadow-inner">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">SANAL VOIP TELEFON</span>
                {isDialing ? (
                  <span className="flex items-center gap-1.5 bg-red-500/20 text-red-400 text-[9px] font-black px-2 py-0.5 rounded-full border border-red-500/30 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    AKTİF GÖRÜŞME
                  </span>
                ) : (
                  <span className="bg-slate-800 text-slate-400 text-[9px] font-bold px-2 py-0.5 rounded-full">ÇEVRİMİÇİ / HAZIR</span>
                )}
              </div>

              <div className="text-center py-2">
                <h4 className="text-slate-350 text-[10px] font-semibold">ARANAN NUMARA</h4>
                <p className="text-lg font-black font-mono text-white tracking-wider mt-0.5">
                  {selectedCallTask.seeker?.phone_decrypted || 'Gizli Numara'}
                </p>
                {isDialing && (
                  <div className="text-2xl font-black font-mono text-[#c8f252] mt-1 tracking-widest">
                    {Math.floor(callDuration / 60).toString().padStart(2, '0')}:{(callDuration % 60).toString().padStart(2, '0')}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-2">
                {!isDialing ? (
                  <button
                    type="button"
                    onClick={startVoipCall}
                    className="w-full bg-[#c8f252] text-slate-955 hover:bg-[#b5e639] font-black py-2.5 rounded-xl transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5 border border-[#c8f252]/20"
                  >
                    📞 Arama Başlat (VoIP)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={endVoipCall}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-2.5 rounded-xl transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    🔴 Aramayı Sonlandır
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleCallTaskResultSubmit} className="space-y-4">
              {/* Kalite Anketi Form Alanı */}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Müşteri Memnuniyet Anketi</h4>
                
                {/* 1. Yıldız Puanı */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Hizmet Veren Hizmet Kalitesi (Puanı)</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setSurveyRating(star)}
                        className="p-1 focus:outline-none transition-transform hover:scale-125 cursor-pointer"
                      >
                        <span className={`text-2xl ${star <= surveyRating ? 'text-amber-400' : 'text-slate-200'}`}>
                          ★
                        </span>
                      </button>
                    ))}
                    <span className="text-xs font-black text-slate-600 ml-1">{surveyRating}/5 Puan</span>
                  </div>
                </div>

                {/* 2. Zamanlama */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">İş Zamanlama Uyumu</label>
                  <select
                    value={surveyTiming}
                    onChange={(e) => setSurveyTiming(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200/60 text-slate-700 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#c8f252] cursor-pointer"
                  >
                    <option value="ontime">⏱️ Zamanında Geldi</option>
                    <option value="delayed">🐢 Gecikmeli Geldi</option>
                    <option value="noshow">❌ Gelmedi / İptal Etti</option>
                  </select>
                </div>

                {/* 3. Fiyatlandırma */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Fiyatlandırma Doğruluğu</label>
                  <select
                    value={surveyPricing}
                    onChange={(e) => setSurveyPricing(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200/60 text-slate-700 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#c8f252] cursor-pointer"
                  >
                    <option value="correct">💰 Anlaşılan Fiyatla Uyumlu</option>
                    <option value="overcharged">📈 Ekstra Ücret Talep Etti</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Arama Kalite Değerlendirmesi</label>
                <select
                  value={callTaskResult}
                  onChange={(e) => setCallTaskResult(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200/60 text-slate-700 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#c8f252] cursor-pointer"
                >
                  <option value="satisfied">Memnun (Çok İyi Deneyim)</option>
                  <option value="partial">Kısmen Memnun (Orta Deneyim)</option>
                  <option value="unsatisfied">Memnun Değil (Sorunlu Deneyim)</option>
                  <option value="unreachable">Ulaşılamadı (Telefon Cevap Vermiyor)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-555 uppercase tracking-wider mb-1.5">Görüşme Detay Notu</label>
                <textarea
                  value={callTaskNotes}
                  onChange={(e) => setCallTaskNotes(e.target.value)}
                  placeholder="Görüşmede konuşulan detayları, varsa müşteri şikayetlerini not alın..."
                  rows={3}
                  required
                  className="w-full bg-slate-50 border border-slate-200/60 focus:border-[#c8f252] text-slate-700 rounded-xl py-3 px-4 text-sm focus:outline-none transition-colors resize-none leading-relaxed"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeCallTaskModal}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition-all text-xs cursor-pointer shadow-sm"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submittingCallTask}
                  className="flex-1 bg-[#c8f252] text-slate-955 hover:bg-[#b5e639] font-black py-3.5 rounded-xl transition-all text-xs shadow-md border border-[#c8f252]/20 cursor-pointer"
                >
                  {submittingCallTask ? 'Kaydediliyor...' : 'Çağrıyı Tamamla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 👤 Yeni Personel Onboard Modalı */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-800" />
                <span>Yeni Personel Onboard Et</span>
              </h3>
              <button 
                onClick={() => setShowAddStaffModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ad Soyad</label>
                <input
                  type="text"
                  placeholder="Personel ad soyad girin..."
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200/60 focus:border-[#c8f252] text-slate-750 text-sm rounded-xl px-4 py-3 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">E-Posta Adresi</label>
                <input
                  type="email"
                  placeholder="name@esnaaf.com"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200/60 focus:border-[#c8f252] text-slate-755 text-sm rounded-xl px-4 py-3 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Telefon Numarası</label>
                <input
                  type="text"
                  placeholder="+905XXXXXXXXX"
                  value={newStaffPhone}
                  onChange={(e) => setNewStaffPhone(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200/60 focus:border-[#c8f252] text-slate-755 text-sm rounded-xl px-4 py-3 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Departman ve Sistem Yetki Rolü</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200/60 text-slate-700 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#c8f252] cursor-pointer"
                >
                  <option value="quality_staff">Kalite Personeli (Quality Staff)</option>
                  <option value="ops_staff">Operasyon Personeli (Ops Staff)</option>
                  <option value="finance_staff">Finans Personeli (Finance Staff)</option>
                  <option value="marketing_staff">Pazarlama Personeli (Marketing Staff)</option>
                  <option value="sales_staff">Satış Temsilcisi (Sales Staff)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition-all text-xs cursor-pointer shadow-sm"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submittingStaff}
                  className="flex-1 bg-[#c8f252] text-slate-955 hover:bg-[#b5e639] font-black py-3.5 rounded-xl transition-all text-xs shadow-md border border-[#c8f252]/20 cursor-pointer"
                >
                  {submittingStaff ? 'Personel Onboard Ediliyor...' : 'Onboard İşlemini Tamamla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🏷️ Yeni Kampanya / Kupon Tanımlama Modalı */}
      {showAddCampaignModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <Percent className="w-5 h-5 text-slate-800" />
                <span>Yeni Kampanya Kuponu Tanımla</span>
              </h3>
              <button 
                onClick={() => setShowAddCampaignModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCampaignSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kampanya Adı</label>
                <input
                  type="text"
                  placeholder="Örn: Yaz Sezonu Hizmet Veren Hoşgeldin Kampanyası"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200/60 focus:border-[#c8f252] text-slate-750 text-sm rounded-xl px-4 py-3 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kupon Kodu</label>
                  <input
                    type="text"
                    placeholder="Örn: YAZ100"
                    value={campaignCode}
                    onChange={(e) => setCampaignCode(e.target.value.toUpperCase())}
                    required
                    className="w-full bg-slate-50 border border-slate-200/60 focus:border-[#c8f252] text-slate-750 text-sm rounded-xl px-4 py-3 focus:outline-none font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tür</label>
                  <select
                    value={campaignType}
                    onChange={(e) => setCampaignType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200/60 text-slate-750 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#c8f252] cursor-pointer"
                  >
                    <option value="percent">Yüzdesel İndirim (%)</option>
                    <option value="fixed">Sabit İndirim (₺)</option>
                    <option value="quota_bonus">Kota Bonusu (+Kota)</option>
                    <option value="free_trial">Ücretsiz Deneme</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Değer (Value)</label>
                  <input
                    type="number"
                    placeholder="Örn: 20 veya 100"
                    value={campaignValue}
                    onChange={(e) => setCampaignValue(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200/60 focus:border-[#c8f252] text-slate-750 text-sm rounded-xl px-4 py-3 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Hedef Paket Yükseltme</label>
                  <select
                    value={campaignUpgradeTo}
                    onChange={(e) => setCampaignUpgradeTo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/60 text-slate-750 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#c8f252] cursor-pointer"
                  >
                    <option value="">Yok (Tüm Paketlerde Geçerli)</option>
                    <option value="basic">Basic Paket (Düşük)</option>
                    <option value="standard">Standart Paket (Orta)</option>
                    <option value="vip">VIP Paket (Yüksek)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Maks Kullanım Adedi</label>
                  <input
                    type="number"
                    placeholder="Örn: 1000"
                    value={campaignMaxUses}
                    onChange={(e) => setCampaignMaxUses(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/60 focus:border-[#c8f252] text-slate-750 text-sm rounded-xl px-4 py-3 focus:outline-none"
                  />
                </div>
                <div className="flex items-center pt-6 pl-2">
                  <input
                    type="checkbox"
                    id="campaignNewUsers"
                    checked={campaignNewUsers}
                    onChange={(e) => setCampaignNewUsers(e.target.checked)}
                    className="w-4 h-4 text-[#c8f252] border-slate-300 rounded focus:ring-[#c8f252] cursor-pointer"
                  />
                  <label htmlFor="campaignNewUsers" className="ml-2 text-xs font-bold text-slate-655 cursor-pointer">Sadece Yeni Üyeler</label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    value={campaignValidFrom}
                    onChange={(e) => setCampaignValidFrom(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200/60 focus:border-[#c8f252] text-slate-750 text-sm rounded-xl px-4 py-3 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Bitiş Tarihi</label>
                  <input
                    type="date"
                    value={campaignValidUntil}
                    onChange={(e) => setCampaignValidUntil(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200/60 focus:border-[#c8f252] text-slate-750 text-sm rounded-xl px-4 py-3 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCampaignModal(false)}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition-all text-xs cursor-pointer shadow-sm"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submittingCampaign}
                  className="flex-1 bg-[#c8f252] text-slate-955 hover:bg-[#b5e639] font-black py-3.5 rounded-xl transition-all text-xs shadow-md border border-[#c8f252]/20 cursor-pointer"
                >
                  {submittingCampaign ? 'Oluşturuluyor...' : 'Kampanyayı Aktifleştir'}
                </button>
              </div>
            </form>
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
                className="flex-1 bg-[#c8f252] text-slate-955 hover:bg-[#b5e639] text-xs font-extrabold py-2.5 rounded-xl cursor-pointer transition-all active:scale-95 border border-transparent shadow-sm"
              >
                Onayla
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
