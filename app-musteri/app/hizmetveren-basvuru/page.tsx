"use client";

import React, { useState, useEffect } from "react";

const CITIES = {
  "Adana": ["Seyhan", "Çukurova", "Yüreğir", "Sarıçam", "Ceyhan", "Kozan"],
  "Ankara": ["Çankaya", "Keçiören", "Yenimahalle", "Mamak", "Etimesgut", "Altındağ", "Sincan", "Gölbaşı"],
  "İstanbul": ["Kadıköy", "Beşiktaş", "Üsküdar", "Şişli", "Fatih", "Ataşehir", "Beylikdüzü", "Pendik", "Ümraniye", "Maltepe"],
  "İzmir": ["Karşıyaka", "Konak", "Bornova", "Buca", "Çiğli", "Karabağlar", "Gaziemir", "Balçova"]
};

export default function HizmetVerenBasvuru() {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingReferences, setUploadingReferences] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    primaryCategory: "", // Category ID
    companyType: "Şahıs", // 'Şahıs' | 'Şirket'
    companyName: "",
    name: "",
    surname: "",
    city: "Adana",
    districts: [] as string[],
    phone: "",
    email: "",
    otherServices: [] as string[], // Category IDs
    profilePhoto: "",
    description: "",
    referencePhotos: [] as string[],
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });

  useEffect(() => {
    fetch("/api/ortak/auth/categories")
      .then((res) => {
        if (!res.ok) throw new Error("Kategoriler alınamadı.");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
        }
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage("Hizmet kategorileri veritabanından yüklenirken hata oluştu.");
      });
  }, []);

  const handleNext = () => {
    setErrorMessage("");
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 13));
    }
  };

  const handleBack = () => {
    setErrorMessage("");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.primaryCategory) {
          setErrorMessage("Lütfen devam etmek için bir hizmet seçin.");
          return false;
        }
        return true;
      case 2:
        return true;
      case 3:
        if (formData.companyType === "Şirket" && !formData.companyName.trim()) {
          setErrorMessage("Lütfen firma adınızı girin.");
          return false;
        }
        return true;
      case 4:
        if (!formData.name.trim() || !formData.surname.trim()) {
          setErrorMessage("Lütfen adınızı ve soyadınızı girin.");
          return false;
        }
        return true;
      case 5:
        if (formData.districts.length === 0) {
          setErrorMessage("Lütfen hizmet verdiğiniz en az bir ilçe seçin.");
          return false;
        }
        return true;
      case 6:
        const cleanPhone = formData.phone.replace(/\D/g, "");
        if (cleanPhone.length < 10) {
          setErrorMessage("Lütfen geçerli bir cep telefonu numarası girin.");
          return false;
        }
        return true;
      case 7:
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          setErrorMessage("Lütfen geçerli bir e-posta adresi girin.");
          return false;
        }
        return true;
      case 8:
        return true;
      case 9:
        if (!formData.profilePhoto) {
          setErrorMessage("Lütfen profil fotoğrafınızı yükleyin.");
          return false;
        }
        return true;
      case 10:
        if (formData.description.trim().length < 20) {
          setErrorMessage("Tanıtım yazınız en az 20 karakter uzunluğunda olmalıdır.");
          return false;
        }
        return true;
      case 11:
        return true;
      case 12:
        if (!formData.termsAccepted) {
          setErrorMessage("Kayıt olmak için kullanım koşullarını ve KVKK metnini onaylamanız gerekmektedir.");
          return false;
        }
        return true;
      case 13:
        if (!formData.password) {
          setErrorMessage("Şifre boş bırakılamaz.");
          return false;
        }
        if (formData.password.length < 6) {
          setErrorMessage("Şifre en az 6 karakter uzunluğunda olmalıdır.");
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setErrorMessage("Şifreler eşleşmiyor.");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingProfile(true);
    setErrorMessage("");

    try {
      const filename = `${Date.now()}_profile_${file.name.replace(/\s+/g, "_")}`;
      const response = await fetch(`/api/storage/mock-upload?file=${encodeURIComponent(filename)}`, {
        method: "PUT",
        body: file,
      });

      if (!response.ok) throw new Error("Dosya yüklenemedi.");
      const data = await response.json();
      
      setFormData((prev) => ({ ...prev, profilePhoto: data.url }));
    } catch (err) {
      console.error(err);
      setErrorMessage("Profil fotoğrafı yüklenirken bir hata oluştu.");
    } finally {
      setUploadingProfile(false);
    }
  };

  const handleReferencePhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (formData.referencePhotos.length + files.length > 5) {
      setErrorMessage("En fazla 5 adet referans fotoğrafı ekleyebilirsiniz.");
      return;
    }

    setUploadingReferences(true);
    setErrorMessage("");

    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filename = `${Date.now()}_ref_${i}_${file.name.replace(/\s+/g, "_")}`;
        const response = await fetch(`/api/storage/mock-upload?file=${encodeURIComponent(filename)}`, {
          method: "PUT",
          body: file,
        });

        if (!response.ok) throw new Error("Bir dosya yüklenemedi.");
        const data = await response.json();
        urls.push(data.url);
      }

      setFormData((prev) => ({
        ...prev,
        referencePhotos: [...prev.referencePhotos, ...urls],
      }));
    } catch (err) {
      console.error(err);
      setErrorMessage("Bazı referans fotoğrafları yüklenirken hata oluştu.");
    } finally {
      setUploadingReferences(false);
    }
  };

  const removeReferencePhoto = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      referencePhotos: prev.referencePhotos.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setSubmitting(true);
    setErrorMessage("");

    const categoryIds = [formData.primaryCategory, ...formData.otherServices];

    try {
      const res = await fetch("/api/ortak/auth/register-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: formData.phone,
          name: `${formData.name} ${formData.surname}`,
          email: formData.email,
          categoryIds,
          city: formData.city,
          districts: formData.districts,
          companyType: formData.companyType,
          companyName: formData.companyName,
          password: formData.password,
          profilePhoto: formData.profilePhoto,
          referencePhotos: formData.referencePhotos,
          description: formData.description,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Kayıt sırasında bir hata oluştu.");
      }

      setSuccessMessage(data.message || "Başvurunuz başarıyla alındı! Yönlendiriliyorsunuz...");
      setTimeout(() => {
        window.location.href = "/";
      }, 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Başvuru gönderilirken bir hata oluştu.");
      setSubmitting(false);
    }
  };

  const primaryCategoryName = categories.find((c) => c.id === formData.primaryCategory)?.name || "Hizmet";

  // Filter categories for Step 1
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-6 px-4 md:px-8 font-body-md text-slate-800">
      {/* Top Header */}
      <header className="max-w-xl mx-auto w-full flex items-center justify-between pb-4 border-b border-slate-100">
        <button 
          onClick={currentStep > 1 ? handleBack : () => window.location.href = "/"}
          className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span className="font-button-text text-sm tracking-tight text-slate-800">{primaryCategoryName}</span>
        <button 
          onClick={() => window.location.href = "/"}
          className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      {/* Main Wizard Form Card */}
      <main className="max-w-xl mx-auto w-full bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 p-6 md:p-8 flex flex-col items-center justify-between min-h-[520px] my-6 transition-all duration-300">
        <div className="w-full">
          {/* Step Progress Bar */}
          <div className="w-full mb-8">
            <div className="flex justify-between items-center gap-1.5">
              {[...Array(13)].map((_, i) => (
                <div key={i} className="flex-1 relative">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i + 1 < currentStep 
                        ? "bg-[#88b000]" 
                        : i + 1 === currentStep 
                        ? "bg-[#88b000] shadow-sm shadow-[#88b000]/30" 
                        : "bg-slate-100"
                    }`}
                  />
                  {i + 1 === currentStep && (
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4.5 h-4.5 rounded-full bg-[#88b000] border-4 border-white shadow-sm flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="text-right text-[10px] text-slate-400 font-bold mt-2.5">
              Profil Detayları | Adım {currentStep}/13
            </div>
          </div>

          {/* Step Form Rendering */}
          <div className="animate-scale-up">
            
            {/* STEP 1: HİZMET SEÇİMİ */}
            {currentStep === 1 && (
              <div className="space-y-6 text-center">
                <div className="mx-auto w-16 h-16 bg-[#c8f252]/10 text-slate-800 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl font-black text-slate-850">search</span>
                </div>
                <div className="space-y-2">
                  <h2 className="font-headline-lg text-xl md:text-2xl text-slate-900 leading-tight">Hizmet Seçimi</h2>
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                    Müşterilere vereceğiniz ana hizmet alanını arayıp seçin.
                  </p>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Hizmet Ara (Örn: Boya Badana)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 pl-11 text-sm font-semibold outline-none focus:border-[#88b000] focus:ring-4 focus:ring-[#88b000]/5 transition-all text-slate-800"
                  />
                  <svg className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="max-h-[220px] overflow-y-auto border border-slate-100 rounded-2xl p-2 space-y-1 scrollbar-thin">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setFormData({ ...formData, primaryCategory: cat.id })}
                        className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex justify-between items-center cursor-pointer ${
                          formData.primaryCategory === cat.id
                            ? "bg-slate-900 text-white"
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <span>{cat.name}</span>
                        {formData.primaryCategory === cat.id && (
                          <svg className="w-4.5 h-4.5 text-[#c8f252]" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="text-slate-400 text-xs font-semibold py-8">Kategori bulunamadı.</div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: ŞİRKET BİLGİLERİ */}
            {currentStep === 2 && (
              <div className="space-y-6 text-center">
                <div className="mx-auto w-16 h-16 bg-[#c8f252]/10 text-slate-800 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl font-black text-slate-850">business</span>
                </div>
                <div className="space-y-2">
                  <h2 className="font-headline-lg text-xl md:text-2xl text-slate-900 leading-tight">Şirket Türünüz Nedir?</h2>
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                    Faaliyet gösterdiğiniz hukuki yapıyı seçin.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {["Şahıs", "Şirket"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFormData({ ...formData, companyType: type })}
                      className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                        formData.companyType === type
                          ? "border-slate-900 bg-slate-50 text-slate-900 font-bold"
                          : "border-slate-100 hover:border-slate-200 text-slate-500"
                      }`}
                    >
                      <span className="material-symbols-outlined text-3xl mb-2">
                        {type === "Şahıs" ? "person" : "corporate_fare"}
                      </span>
                      <span className="text-xs font-bold">{type}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: FİRMA ADI */}
            {currentStep === 3 && (
              <div className="space-y-6 text-center">
                <div className="mx-auto w-16 h-16 bg-[#c8f252]/10 text-slate-800 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl font-black text-slate-850">badge</span>
                </div>
                <div className="space-y-2">
                  <h2 className="font-headline-lg text-xl md:text-2xl text-slate-900 leading-tight">Firma Adınız Nedir?</h2>
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                    Varsa ticari ünvanınızı veya firma isminizi girin.
                  </p>
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[11px] font-bold text-slate-400">FİRMA / MARKA ADI {formData.companyType === "Şirket" && <span className="text-red-500">*</span>}</label>
                  <input
                    type="text"
                    placeholder="Örn: Net Boya Badana Hizmetleri"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-semibold outline-none focus:border-[#88b000] focus:ring-4 focus:ring-[#88b000]/5 transition-all text-slate-800"
                  />
                  {formData.companyType === "Şahıs" && (
                    <span className="text-[10px] text-slate-400 block pt-1">Şahıs firmaları için bu alanı boş bırakabilirsiniz.</span>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: AD VE SOYAD */}
            {currentStep === 4 && (
              <div className="space-y-6 text-center">
                <div className="mx-auto w-16 h-16 bg-[#c8f252]/10 text-slate-800 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl font-black text-slate-850">person</span>
                </div>
                <div className="space-y-2">
                  <h2 className="font-headline-lg text-xl md:text-2xl text-slate-900 leading-tight">Adınız ve Soyadınız Nedir?</h2>
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                    Profilinizde görüntülenecek ve faturalandırmada kullanılacak resmi isminiz.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">AD</label>
                    <input
                      type="text"
                      placeholder="Adınız"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-semibold outline-none focus:border-[#88b000] focus:ring-4 focus:ring-[#88b000]/5 transition-all text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">SOYAD</label>
                    <input
                      type="text"
                      placeholder="Soyadınız"
                      value={formData.surname}
                      onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-semibold outline-none focus:border-[#88b000] focus:ring-4 focus:ring-[#88b000]/5 transition-all text-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: NEREDE HİZMET VERİYORSUN (İL VE İLÇE) */}
            {currentStep === 5 && (
              <div className="space-y-5 text-center">
                <div className="mx-auto w-15 h-15 bg-[#c8f252]/10 text-slate-800 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl font-black text-slate-850">location_on</span>
                </div>
                <div className="space-y-1">
                  <h2 className="font-headline-lg text-lg text-slate-900 leading-tight">Nerede Hizmet Veriyorsunuz?</h2>
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                    Hizmet bölgenizi (İl ve İlçeler) seçin.
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-left">
                  <div className="col-span-1 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">İL SEÇİN</label>
                    <select
                      value={formData.city}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          city: e.target.value,
                          districts: [] // Reset districts when city changes
                        });
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none focus:border-[#88b000]"
                    >
                      {Object.keys(CITIES).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">İLÇELER (ÇOKLU SEÇEBİLİRSİNİZ)</label>
                    <div className="max-h-[160px] overflow-y-auto border border-slate-100 rounded-xl p-2 space-y-1 text-xs">
                      {CITIES[formData.city as keyof typeof CITIES].map((district) => {
                        const isChecked = formData.districts.includes(district);
                        return (
                          <label 
                            key={district} 
                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                              isChecked ? "bg-slate-50 font-bold text-slate-900" : "text-slate-650 hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setFormData({
                                    ...formData,
                                    districts: formData.districts.filter((d) => d !== district)
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    districts: [...formData.districts, district]
                                  });
                                }
                              }}
                              className="accent-[#88b000] w-4 h-4 cursor-pointer"
                            />
                            <span>{district}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: CEP TELEFONU */}
            {currentStep === 6 && (
              <div className="space-y-6 text-center">
                <div className="mx-auto w-16 h-16 bg-[#c8f252]/10 text-slate-800 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl font-black text-slate-850">call</span>
                </div>
                <div className="space-y-2">
                  <h2 className="font-headline-lg text-xl md:text-2xl text-slate-900 leading-tight">Cep Telefonu Numaranız Nedir?</h2>
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                    İş bildirimlerini alacağınız ve giriş yapacağınız telefon numarası.
                  </p>
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[11px] font-bold text-slate-400">TELEFON NUMARASI</label>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="05XX XXX XX XX"
                      value={formData.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setFormData({ ...formData, phone: val });
                      }}
                      maxLength={11}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 pl-12 text-sm font-semibold outline-none focus:border-[#88b000] focus:ring-4 focus:ring-[#88b000]/5 transition-all text-slate-800"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">+90</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 7: EMAIL ADRESİ */}
            {currentStep === 7 && (
              <div className="space-y-6 text-center">
                <div className="mx-auto w-16 h-16 bg-[#c8f252]/10 text-slate-800 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl font-black text-slate-850">mail</span>
                </div>
                <div className="space-y-2">
                  <h2 className="font-headline-lg text-xl md:text-2xl text-slate-900 leading-tight">E-posta Adresiniz Nedir?</h2>
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                    İş teklifleri özetleri ve faturalar e-posta adresinize gönderilir.
                  </p>
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[11px] font-bold text-slate-400">E-POSTA ADRESİ</label>
                  <input
                    type="email"
                    placeholder="ornek@esnaaf.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-semibold outline-none focus:border-[#88b000] focus:ring-4 focus:ring-[#88b000]/5 transition-all text-slate-800"
                  />
                </div>
              </div>
            )}

            {/* STEP 8: BAŞKA HANGİ HİZMETLERİ VERİYORSUN */}
            {currentStep === 8 && (
              <div className="space-y-6 text-center">
                <div className="mx-auto w-16 h-16 bg-[#c8f252]/10 text-slate-800 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl font-black text-slate-850">add_task</span>
                </div>
                <div className="space-y-2">
                  <h2 className="font-headline-lg text-xl md:text-2xl text-slate-900 leading-tight">Başka Hangi Hizmetleri Veriyorsunuz?</h2>
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                    Hizmet alanınızı genişletmek için verebildiğiniz diğer ek hizmetleri de seçebilirsiniz.
                  </p>
                </div>
                <div className="max-h-[220px] overflow-y-auto border border-slate-100 rounded-2xl p-2.5 space-y-1 text-xs text-left scrollbar-thin">
                  {categories
                    .filter((cat) => cat.id !== formData.primaryCategory)
                    .map((cat) => {
                      const isSelected = formData.otherServices.includes(cat.id);
                      return (
                        <label 
                          key={cat.id} 
                          className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all ${
                            isSelected ? "bg-slate-50 font-bold text-slate-900" : "text-slate-650 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setFormData({
                                  ...formData,
                                  otherServices: formData.otherServices.filter((id) => id !== cat.id)
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  otherServices: [...formData.otherServices, cat.id]
                                });
                              }
                            }}
                            className="accent-[#88b000] w-4 h-4 cursor-pointer"
                          />
                          <span>{cat.name}</span>
                        </label>
                      );
                    })}
                </div>
              </div>
            )}

            {/* STEP 9: PROFİL FOTOĞRAFI */}
            {currentStep === 9 && (
              <div className="space-y-6 text-center">
                <div className="mx-auto w-16 h-16 bg-[#c8f252]/10 text-slate-800 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl font-black text-slate-850">add_a_photo</span>
                </div>
                <div className="space-y-2">
                  <h2 className="font-headline-lg text-xl md:text-2xl text-slate-900 leading-tight">Yüzünüzün Net Göründüğü Profil Resmi</h2>
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                    Güvenilirlik ve onay için yüzünüzün net göründüğü bir profil resmi yükleyin.
                  </p>
                </div>
                
                <div className="flex flex-col items-center justify-center space-y-4">
                  {formData.profilePhoto ? (
                    <div className="relative group">
                      <img 
                        src={formData.profilePhoto} 
                        alt="Profil Önizleme" 
                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                      <button
                        onClick={() => setFormData({ ...formData, profilePhoto: "" })}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-650 text-white rounded-full p-1.5 shadow-md cursor-pointer transition-all active:scale-90 flex items-center justify-center"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <label className="w-32 h-32 rounded-full bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-200 hover:border-slate-350 cursor-pointer flex flex-col items-center justify-center transition-all p-3 text-slate-400 group">
                      {uploadingProfile ? (
                        <div className="flex flex-col items-center space-y-1">
                          <div className="w-6 h-6 border-2 border-[#88b000] border-t-transparent rounded-full animate-spin" />
                          <span className="text-[10px] font-bold text-slate-500">Yükleniyor...</span>
                        </div>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-all text-slate-500">upload_file</span>
                          <span className="text-[9px] font-bold text-slate-500 text-center mt-1.5">Fotoğraf Seç</span>
                        </>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleProfilePhotoUpload} 
                        className="hidden" 
                        disabled={uploadingProfile}
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* STEP 10: TANITIM YAZISI */}
            {currentStep === 10 && (
              <div className="space-y-6 text-center">
                <div className="mx-auto w-16 h-16 bg-[#c8f252]/10 text-slate-800 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl font-black text-slate-850">description</span>
                </div>
                <div className="space-y-2">
                  <h2 className="font-headline-lg text-xl md:text-2xl text-slate-900 leading-tight">Ustalık Tanıtım Yazısı</h2>
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                    Müşterilerin sizi tercih etmesi için tecrübenizi, uzmanlıklarınızı anlatan bir yazı yazın.
                  </p>
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[11px] font-bold text-slate-400">TANITIM YAZISI (EN AZ 20 KARAKTER)</label>
                  <textarea
                    placeholder="Örn: 15 yıllık boya badana tecrübemizle, evinizi titizlikle boyuyor ve gününde teslim ediyoruz. Eşyalarınızı özenle koruyoruz..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-semibold outline-none focus:border-[#88b000] focus:ring-4 focus:ring-[#88b000]/5 transition-all text-slate-800 resize-none"
                  />
                  <div className="text-right text-[10px] text-slate-400 font-bold">
                    {formData.description.trim().length} karakter
                  </div>
                </div>
              </div>
            )}

            {/* STEP 11: REFERANS FOTOĞRAFLARI */}
            {currentStep === 11 && (
              <div className="space-y-6 text-center">
                <div className="mx-auto w-16 h-16 bg-[#c8f252]/10 text-slate-800 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl font-black text-slate-850">photo_library</span>
                </div>
                <div className="space-y-2">
                  <h2 className="font-headline-lg text-xl md:text-2xl text-slate-900 leading-tight">Önceki İşlerinize Ait Fotoğraflar</h2>
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                    Yaptığınız iş kalitesini sergileyen en fazla 5 adet referans fotoğrafı ekleyin.
                  </p>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 justify-center items-center">
                  {formData.referencePhotos.map((url, index) => (
                    <div key={index} className="relative w-full aspect-square bg-slate-100 rounded-xl overflow-hidden group shadow-sm">
                      <img src={url} alt="Referans" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeReferencePhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 cursor-pointer hover:bg-red-650 transition-all active:scale-90 flex items-center justify-center"
                      >
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}

                  {formData.referencePhotos.length < 5 && (
                    <label className="w-full aspect-square rounded-xl bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-200 hover:border-slate-350 cursor-pointer flex flex-col items-center justify-center transition-all p-2 text-slate-400 group">
                      {uploadingReferences ? (
                        <div className="w-5 h-5 border-2 border-[#88b000] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-all text-slate-500">add</span>
                          <span className="text-[8px] font-bold text-slate-500 text-center mt-1">Ekle</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleReferencePhotosUpload}
                        className="hidden"
                        disabled={uploadingReferences}
                      />
                    </label>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 font-bold">
                  {formData.referencePhotos.length}/5 fotoğraf yüklendi. (İsteğe bağlı)
                </div>
              </div>
            )}

            {/* STEP 12: ESNAAF'A HOŞ GELDİN */}
            {currentStep === 12 && (
              <div className="space-y-6 text-center">
                <div className="mx-auto w-16 h-16 bg-[#c8f252]/10 text-slate-800 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl font-black text-slate-850">handshake</span>
                </div>
                <div className="space-y-2">
                  <h2 className="font-headline-lg text-xl md:text-2xl text-slate-900 leading-tight">Esnaaf'a Hoş Geldiniz!</h2>
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                    Hizmet veren başvuru profiliniz başarıyla derlendi. Devam etmek ve şifrenizi belirlemek için sözleşmeleri onaylayın.
                  </p>
                </div>
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50 space-y-3 text-left">
                  <label className="flex items-start gap-3 cursor-pointer text-xs leading-relaxed text-slate-600">
                    <input
                      type="checkbox"
                      checked={formData.termsAccepted}
                      onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                      className="accent-[#88b000] w-4.5 h-4.5 shrink-0 mt-0.5 cursor-pointer"
                    />
                    <span>
                      <strong className="text-slate-800">Hizmet Sözleşmesini</strong> ve <strong className="text-slate-800">KVKK Aydınlatma Metnini</strong> okudum, kabul ediyorum. Profilimin doğrulanması amacıyla girilen verilerin incelenmesini onaylıyorum.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* STEP 13: ŞİFRE BELİRLE */}
            {currentStep === 13 && (
              <div className="space-y-6 text-center">
                <div className="mx-auto w-16 h-16 bg-[#c8f252]/10 text-slate-800 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl font-black text-slate-850">lock</span>
                </div>
                <div className="space-y-2">
                  <h2 className="font-headline-lg text-xl md:text-2xl text-slate-900 leading-tight">Giriş Şifrenizi Belirleyin</h2>
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                    Yönetici profilinizi onayladıktan sonra telefon numaranız ve bu şifreyle sisteme giriş yapabileceksiniz.
                  </p>
                </div>
                
                <div className="space-y-4 text-left">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">ŞİFRE</label>
                    <input
                      type="password"
                      placeholder="Şifreniz"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-semibold outline-none focus:border-[#88b000] focus:ring-4 focus:ring-[#88b000]/5 transition-all text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">ŞİFREYİ TEKRAR GİRİN</label>
                    <input
                      type="password"
                      placeholder="Şifre tekrarı"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-semibold outline-none focus:border-[#88b000] focus:ring-4 focus:ring-[#88b000]/5 transition-all text-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Validation Errors and Next/Submit Action Button */}
        <div className="w-full mt-8 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 text-red-650 border border-red-100 rounded-xl text-center text-xs font-bold animate-pulse">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-green-50 text-green-700 border border-green-150 rounded-xl text-center text-xs font-extrabold">
              {successMessage}
            </div>
          )}

          {currentStep < 13 ? (
            <button
              onClick={handleNext}
              className="w-full bg-[#88b000] hover:bg-[#7aa000] text-white font-button-text text-sm py-4 rounded-2xl shadow-lg shadow-[#88b000]/10 transition-all cursor-pointer hover:shadow-xl active:scale-98 flex items-center justify-center gap-1.5"
            >
              <span>Devam Et</span>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-button-text text-sm py-4 rounded-2xl shadow-lg transition-all cursor-pointer hover:shadow-xl active:scale-98 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Başvuruyu Tamamla</span>
                  <svg className="w-4 h-4 text-[#c8f252]" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </>
              )}
            </button>
          )}

          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="w-full text-slate-500 hover:text-slate-800 font-bold text-xs py-2 text-center transition-all cursor-pointer"
            >
              Önceki Adım
            </button>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[10px] text-slate-400 font-bold max-w-xl mx-auto w-full pt-4 border-t border-slate-100">
        © {new Date().getFullYear()} Esnaaf. Tüm Hakları Saklıdır.
      </footer>
    </div>
  );
}
