export interface FlowOption {
  label: string;
  value: string;
  next_step?: string;
}

export interface FlowStep {
  step_id: string;
  step_title: string;
  description?: string;
  input_type: 'single_select' | 'multi_select' | 'textarea' | 'text';
  options?: FlowOption[];
  placeholder?: string;
  is_optional?: boolean;
  next_step?: string;
}

export interface CategoryFlow {
  category_id: string;
  category_name: string;
  steps: FlowStep[];
}

export const QUESTION_FLOWS: Record<string, CategoryFlow> = {
  'ev-temizligi': {
    "category_id": "ev_temizligi",
    "category_name": "Ev Temizliği",
    "steps": [
      {
        "step_id": "step_evin_buyuklugu",
        "step_title": "Evin büyüklüğü nedir?",
        "description": "Evi detaylı temizleyip düzenliyoruz. Evindeki malzemeleri kullanarak yer ve cam silme, toz alma, çöp boşaltılması ve mutfak temizliği hizmetimiz kapsamında.",
        "input_type": "single_select",
        "options": [
          { "label": "1+0", "value": "1_0", "next_step": "step_banyo_sayisi" },
          { "label": "1+1", "value": "1_1", "next_step": "step_banyo_sayisi" },
          { "label": "2+1", "value": "2_1", "next_step": "step_banyo_sayisi" },
          { "label": "3+1", "value": "3_1", "next_step": "step_banyo_sayisi" },
          { "label": "4+1", "value": "4_1", "next_step": "step_banyo_sayisi" },
          { "label": "5+1", "value": "5_1", "next_step": "step_banyo_sayisi" },
          { "label": "6+1 veya daha büyük", "value": "6_1_plus", "next_step": "step_banyo_sayisi" }
        ]
      },
      {
        "step_id": "step_banyo_sayisi",
        "step_title": "Kaç banyo?",
        "description": "Banyolar da tertemiz olsun: Küvet, tuvalet, tezgah, lavabo, ayna ve cam silme, yer silme, toz alma ve çöp boşaltılması dahil.",
        "input_type": "single_select",
        "options": [
          { "label": "1 banyo", "value": "1_banyo", "next_step": "step_temizlik_sikligi" },
          { "label": "2 banyo", "value": "2_banyo", "next_step": "step_temizlik_sikligi" },
          { "label": "3 veya daha fazla banyo", "value": "3_plus_banyo", "next_step": "step_temizlik_sikligi" }
        ]
      },
      {
        "step_id": "step_temizlik_sikligi",
        "step_title": "Temizlik hangi sıklıkla yapılsın?",
        "description": "Seçeceğin sıklığa göre rezervasyonun otomatik oluşacaktır.",
        "input_type": "single_select",
        "options": [
          { "label": "Tek Sefer", "value": "once", "next_step": "step_evcil_hayvan" },
          { "label": "Haftalık Olarak", "value": "weekly", "next_step": "step_evcil_hayvan" },
          { "label": "2 Haftada Bir", "value": "biweekly", "next_step": "step_evcil_hayvan" },
          { "label": "Diğer", "value": "other_frequency", "next_step": "step_evcil_hayvan" }
        ]
      },
      {
        "step_id": "step_evcil_hayvan",
        "step_title": "Evde köpek veya kedi var mı?",
        "description": "Birden çok seçim yapabilirsiniz.",
        "input_type": "multi_select",
        "options": [
          { "label": "Köpek var", "value": "dog_present", "next_step": "step_detaylar" },
          { "label": "Kedi var", "value": "cat_present", "next_step": "step_detaylar" },
          { "label": "Diğer", "value": "other_pet", "next_step": "step_detaylar" },
          { "label": "Hiçbiri Yok", "value": "no_pets", "next_step": "step_detaylar" }
        ],
        "next_step": "step_detaylar"
      },
      {
        "step_id": "step_detaylar",
        "step_title": "Ekstra bilinmesi istediğin veya belirtmek istediğiniz detay var mı?",
        "description": "Hizmet kalitesini artırmak için eklemek istediğiniz özel bir talep varsa seçebilirsiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Hayır Yok", "value": "hayir", "next_step": "END" },
          { "label": "Evet Var", "value": "evet", "next_step": "step_detaylar_aciklama" }
        ],
        "is_optional": false
      },
      {
        "step_id": "step_detaylar_aciklama",
        "step_title": "Ekstra belirtmek istediklerinizi yazın.",
        "description": "Özel taleplerinizi buraya yazabilirsiniz.",
        "input_type": "textarea",
        "placeholder": "Örn: Evde ekstra ütü istiyoruz, pencereler yüksek vb...",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },
  'bos-ev-temizligi': {
    "category_id": "bos_ev_temizligi",
    "category_name": "Boş Ev Temizliği",
    "steps": [
      {
        "step_id": "step_evin_buyuklugu",
        "step_title": "Evin büyüklüğü nedir?",
        "description": "Evi detaylı temizleyip düzenliyoruz. Evindeki malzemeleri kullanarak yer ve cam silme, toz alma, çöp boşaltılması ve mutfak temizliği hizmetimiz kapsamında.",
        "input_type": "single_select",
        "options": [
          { "label": "1+0", "value": "1_0", "next_step": "step_banyo_sayisi" },
          { "label": "1+1", "value": "1_1", "next_step": "step_banyo_sayisi" },
          { "label": "2+1", "value": "2_1", "next_step": "step_banyo_sayisi" },
          { "label": "3+1", "value": "3_1", "next_step": "step_banyo_sayisi" },
          { "label": "4+1", "value": "4_1", "next_step": "step_banyo_sayisi" },
          { "label": "5+1", "value": "5_1", "next_step": "step_banyo_sayisi" },
          { "label": "6+1 veya daha büyük", "value": "6_plus", "next_step": "step_banyo_sayisi" }
        ]
      },
      {
        "step_id": "step_banyo_sayisi",
        "step_title": "Kaç banyo?",
        "description": "Banyolar da tertemiz olsun: Küvet, tuvalet, tezgah, lavabo, ayna ve cam silme, yer silme, toz alma ve çöp boşaltılması dahil.",
        "input_type": "single_select",
        "options": [
          { "label": "1", "value": "1_bathroom", "next_step": "step_ev_bos_sebebi" },
          { "label": "2", "value": "2_bathrooms", "next_step": "step_ev_bos_sebebi" },
          { "label": "3 veya daha fazla", "value": "3_plus_bathrooms", "next_step": "step_ev_bos_sebebi" }
        ]
      },
      {
        "step_id": "step_ev_bos_sebebi",
        "step_title": "Ev hangi sebepten boş?",
        "description": "Temizliğin türünü ve odaklanılacak alanları (örn: inşaat artığı veya standart taşınma temizliği) belirlemek için önemlidir.",
        "input_type": "single_select",
        "options": [
          { "label": "Kiracı çıktı", "value": "tenant_left", "next_step": "step_ekstra_detay_var_mi" },
          { "label": "Sıfır ev", "value": "new_building", "next_step": "step_ekstra_detay_var_mi" },
          { "label": "Diğer", "value": "other", "next_step": "step_ekstra_detay_var_mi" }
        ]
      },
      {
        "step_id": "step_ekstra_detay_var_mi",
        "step_title": "Ekstra bilinmesi istediğin veya belirtmek istediğiniz detay var mı?",
        "description": "Hizmet kalitesini artırmak için eklemek istediğiniz özel bir talep varsa seçebilirsiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Hayır Yok", "value": "hayir", "next_step": "END" },
          { "label": "Evet Var", "value": "evet", "next_step": "step_ekstra_detay_text" }
        ],
        "is_optional": false
      },
      {
        "step_id": "step_ekstra_detay_text",
        "step_title": "Lütfen eklemek istediğiniz detayları buraya yazınız:",
        "description": "Özel taleplerinizi buraya yazabilirsiniz.",
        "input_type": "textarea",
        "placeholder": "Detayları buraya giriniz...",
        "next_step": "END"
      }
    ]
  },
  'evde-koltuk-yikama': {
    "category_id": "evde_koltuk_yikama",
    "category_name": "Evde Koltuk Yıkama",
    "steps": [
      {
        "step_id": "step_tekli_koltuk",
        "step_title": "Evde kaç adet tekli koltuk (veya berjer) var?",
        "description": "Yıkanmasını istediğiniz tekli koltuk ve berjer sayısını seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "0", "value": "0", "next_step": "step_uclu_kanepe" },
          { "label": "1", "value": "1", "next_step": "step_uclu_kanepe" },
          { "label": "2", "value": "2", "next_step": "step_uclu_kanepe" },
          { "label": "3", "value": "3", "next_step": "step_uclu_kanepe" },
          { "label": "4", "value": "4", "next_step": "step_uclu_kanepe" },
          { "label": "5+", "value": "5+", "next_step": "step_uclu_kanepe" }
        ]
      },
      {
        "step_id": "step_uclu_kanepe",
        "step_title": "Evde kaç tane üçlü / ikili kanepe / çekyat var?",
        "description": "Yıkanmasını istediğiniz ikili, üçlü kanepe veya çekyat sayısını seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "0", "value": "0", "next_step": "step_kose_koltugu" },
          { "label": "1", "value": "1", "next_step": "step_kose_koltugu" },
          { "label": "2", "value": "2", "next_step": "step_kose_koltugu" },
          { "label": "3", "value": "3", "next_step": "step_kose_koltugu" },
          { "label": "4+", "value": "4+", "next_step": "step_kose_koltugu" }
        ]
      },
      {
        "step_id": "step_kose_koltugu",
        "step_title": "Evde kaç adet L-şeklinde köşe koltuğu var?",
        "description": "L şeklinde köşe koltuklarınızın sayısını seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "0", "value": "0", "next_step": "step_sandalye" },
          { "label": "1", "value": "1", "next_step": "step_sandalye" },
          { "label": "2", "value": "2", "next_step": "step_sandalye" },
          { "label": "3+", "value": "3+", "next_step": "step_sandalye" }
        ]
      },
      {
        "step_id": "step_sandalye",
        "step_title": "Evde kaç adet sandalye var?",
        "description": "Yemek masası veya çalışma sandalyeleri dahildir.",
        "input_type": "single_select",
        "options": [
          { "label": "0", "value": "0", "next_step": "step_tek_kisilik_yatak" },
          { "label": "1", "value": "1", "next_step": "step_tek_kisilik_yatak" },
          { "label": "2", "value": "2", "next_step": "step_tek_kisilik_yatak" },
          { "label": "4", "value": "4", "next_step": "step_tek_kisilik_yatak" },
          { "label": "5", "value": "5", "next_step": "step_tek_kisilik_yatak" },
          { "label": "6", "value": "6", "next_step": "step_tek_kisilik_yatak" },
          { "label": "8", "value": "8", "next_step": "step_tek_kisilik_yatak" },
          { "label": "10+", "value": "10+", "next_step": "step_tek_kisilik_yatak" }
        ]
      },
      {
        "step_id": "step_tek_kisilik_yatak",
        "step_title": "Evde kaç adet tek kişilik yatak var?",
        "description": "Eni 130 cm'den az olan tek kişilik yataklar için geçerlidir.",
        "input_type": "single_select",
        "options": [
          { "label": "0", "value": "0", "next_step": "step_cift_kisilik_yatak" },
          { "label": "1", "value": "1", "next_step": "step_cift_kisilik_yatak" },
          { "label": "2", "value": "2", "next_step": "step_cift_kisilik_yatak" },
          { "label": "3+", "value": "3+", "next_step": "step_cift_kisilik_yatak" }
        ]
      },
      {
        "step_id": "step_cift_kisilik_yatak",
        "step_title": "Evde kaç adet çift kişilik yatak var?",
        "description": "Eni 130 cm ve üzeri olan çift kişilik yataklar için geçerlidir.",
        "input_type": "single_select",
        "options": [
          { "label": "0", "value": "0", "next_step": "step_detaylar" },
          { "label": "1", "value": "1", "next_step": "step_detaylar" },
          { "label": "2", "value": "2", "next_step": "step_detaylar" },
          { "label": "3+", "value": "3+", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Leke durumu, koltukların kumaş türü (kadife, deri vb.) veya belirtmek istediğiniz özel bir durum var mı?",
        "input_type": "textarea",
        "placeholder": "Leke durumu, kumaş türü (kadife, deri vb.) veya özel talepleriniz...",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },
  'arac-koltuk-yikama': {
    "category_id": "arac_koltuk_yikama",
    "category_name": "Yerinde Araç Koltuk Yıkama",
    "steps": [
      {
        "step_id": "step_arac_turu",
        "step_title": "Yıkanacak araç türü nedir?",
        "description": "Araç büyüklüğüne göre ekipman ve vakum makinesi hazırlanır.",
        "input_type": "single_select",
        "options": [
          { "label": "Binek Araç (Sedan / Hatchback)", "value": "binek", "next_step": "step_koltuk_kapsami" },
          { "label": "SUV / Crossover / Station", "value": "suv", "next_step": "step_koltuk_kapsami" },
          { "label": "Ticari Araç / Van / Minibüs", "value": "ticari", "next_step": "step_koltuk_kapsami" },
          { "label": "Otobüs / Midibüs (Filo)", "value": "otobus", "next_step": "step_koltuk_kapsami" }
        ]
      },
      {
        "step_id": "step_koltuk_kapsami",
        "step_title": "Hangi alanların yıkanmasını istersiniz?",
        "description": "Detaylı vakumlu yıkama kapsamını seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Tüm Koltuklar (Ön + Arka)", "value": "tum_koltuklar", "next_step": "step_arac_kumas_turu" },
          { "label": "Tüm Koltuklar + Taban & Tavan Temizliği", "value": "detayli_ic", "next_step": "step_arac_kumas_turu" },
          { "label": "Sadece Ön Koltuklar", "value": "on_koltuklar", "next_step": "step_arac_kumas_turu" },
          { "label": "Sadece Arka Koltuklar", "value": "arka_koltuklar", "next_step": "step_arac_kumas_turu" }
        ]
      },
      {
        "step_id": "step_arac_kumas_turu",
        "step_title": "Koltuk döşeme türü nedir?",
        "description": "Döşemeye uygun özel şampuan uygulanır.",
        "input_type": "single_select",
        "options": [
          { "label": "Kumaş / Tay Tüyü", "value": "kumas", "next_step": "step_konum_elektrik" },
          { "label": "Deri / Suni Deri", "value": "deri", "next_step": "step_konum_elektrik" },
          { "label": "Alkantara / Süet", "value": "alkantara", "next_step": "step_konum_elektrik" }
        ]
      },
      {
        "step_id": "step_konum_elektrik",
        "step_title": "Aracın bulunduğu yerde elektrik ve su var mı?",
        "description": "Vakum makinelerinin çalışabilmesi için gereklidir.",
        "input_type": "single_select",
        "options": [
          { "label": "Evet, Elektrik & Su Mevcut", "value": "evet", "next_step": "step_detay_var_mi" },
          { "label": "Hayır (Uzantı kablo / Jeneratör gerekli)", "value": "hayir", "next_step": "step_detay_var_mi" }
        ]
      }
    ]
  },
  'su-deposu-temizligi': {
    "category_id": "su_deposu_temizligi",
    "category_name": "Su Deposu Temizliği",
    "steps": [
      {
        "step_id": "step_depo_turu",
        "step_title": "Temizlenecek su deposu nerededir ve türü nedir?",
        "description": "Depo cinsine uygun temizlik yöntemi belirlenir.",
        "input_type": "single_select",
        "options": [
          { "label": "Apartman / Bina Su Deposu", "value": "apartman", "next_step": "step_depo_tonaji" },
          { "label": "Site / Ticari Kompleks Deposu", "value": "site", "next_step": "step_depo_tonaji" },
          { "label": "Müstakil Ev / Villa Deposu", "value": "ev", "next_step": "step_depo_tonaji" },
          { "label": "Fabrika / İş Yeri / Yangın Deposu", "value": "fabrika", "next_step": "step_depo_tonaji" }
        ]
      },
      {
        "step_id": "step_depo_tonaji",
        "step_title": "Depo kapasitesi yaklaşık ne kadardır?",
        "description": "Tonaj bilgisi dezenfektan miktarını belirler.",
        "input_type": "single_select",
        "options": [
          { "label": "1 - 5 Ton Arası", "value": "1_5_ton", "next_step": "step_klorlama" },
          { "label": "5 - 20 Ton Arası", "value": "5_20_ton", "next_step": "step_klorlama" },
          { "label": "20 - 50 Ton Arası", "value": "20_50_ton", "next_step": "step_klorlama" },
          { "label": "50 Ton ve Üzeri", "value": "50_plus_ton", "next_step": "step_klorlama" }
        ]
      },
      {
        "step_id": "step_klorlama",
        "step_title": "Klorlama ve biyolojik dezenfeksiyon yapılsın mı?",
        "description": "Sağlık Bakanlığı onaylı hijyen uygulaması.",
        "input_type": "single_select",
        "options": [
          { "label": "Evet, Dezenfeksiyon & Klorlama Dahil Olsun", "value": "evet", "next_step": "step_detay_var_mi" },
          { "label": "Sadece Yıkama ve Çamur Boşaltma", "value": "sadece_yikama", "next_step": "step_detay_var_mi" }
        ]
      }
    ]
  },
  'koltuk-yikama': {
    "category_id": "evde_koltuk_yikama",
    "category_name": "Evde Koltuk Yıkama",
    "steps": [
      {
        "step_id": "step_tekli_koltuk",
        "step_title": "Evde kaç adet tekli koltuk (veya berjer) var?",
        "description": "Yıkanmasını istediğiniz tekli koltuk ve berjer sayısını seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "0", "value": "0", "next_step": "step_uclu_kanepe" },
          { "label": "1", "value": "1", "next_step": "step_uclu_kanepe" },
          { "label": "2", "value": "2", "next_step": "step_uclu_kanepe" },
          { "label": "3", "value": "3", "next_step": "step_uclu_kanepe" },
          { "label": "4", "value": "4", "next_step": "step_uclu_kanepe" },
          { "label": "5+", "value": "5+", "next_step": "step_uclu_kanepe" }
        ]
      },
      {
        "step_id": "step_uclu_kanepe",
        "step_title": "Evde kaç tane üçlü / ikili kanepe / çekyat var?",
        "description": "Yıkanmasını istediğiniz ikili, üçlü kanepe veya çekyat sayısını seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "0", "value": "0", "next_step": "step_kose_koltugu" },
          { "label": "1", "value": "1", "next_step": "step_kose_koltugu" },
          { "label": "2", "value": "2", "next_step": "step_kose_koltugu" },
          { "label": "3", "value": "3", "next_step": "step_kose_koltugu" },
          { "label": "4+", "value": "4+", "next_step": "step_kose_koltugu" }
        ]
      },
      {
        "step_id": "step_kose_koltugu",
        "step_title": "Evde kaç adet L-şeklinde köşe koltuğu var?",
        "description": "L şeklinde köşe koltuklarınızın sayısını seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "0", "value": "0", "next_step": "step_sandalye" },
          { "label": "1", "value": "1", "next_step": "step_sandalye" },
          { "label": "2", "value": "2", "next_step": "step_sandalye" },
          { "label": "3+", "value": "3+", "next_step": "step_sandalye" }
        ]
      },
      {
        "step_id": "step_sandalye",
        "step_title": "Evde kaç adet sandalye var?",
        "description": "Yemek masası veya çalışma sandalyeleri dahildir.",
        "input_type": "single_select",
        "options": [
          { "label": "0", "value": "0", "next_step": "step_tek_kisilik_yatak" },
          { "label": "1", "value": "1", "next_step": "step_tek_kisilik_yatak" },
          { "label": "2", "value": "2", "next_step": "step_tek_kisilik_yatak" },
          { "label": "4", "value": "4", "next_step": "step_tek_kisilik_yatak" },
          { "label": "5", "value": "5", "next_step": "step_tek_kisilik_yatak" },
          { "label": "6", "value": "6", "next_step": "step_tek_kisilik_yatak" },
          { "label": "8", "value": "8", "next_step": "step_tek_kisilik_yatak" },
          { "label": "10+", "value": "10+", "next_step": "step_tek_kisilik_yatak" }
        ]
      },
      {
        "step_id": "step_tek_kisilik_yatak",
        "step_title": "Evde kaç adet tek kişilik yatak var?",
        "description": "Eni 130 cm'den az olan tek kişilik yataklar için geçerlidir.",
        "input_type": "single_select",
        "options": [
          { "label": "0", "value": "0", "next_step": "step_cift_kisilik_yatak" },
          { "label": "1", "value": "1", "next_step": "step_cift_kisilik_yatak" },
          { "label": "2", "value": "2", "next_step": "step_cift_kisilik_yatak" },
          { "label": "3+", "value": "3+", "next_step": "step_cift_kisilik_yatak" }
        ]
      },
      {
        "step_id": "step_cift_kisilik_yatak",
        "step_title": "Evde kaç adet çift kişilik yatak var?",
        "description": "Eni 130 cm ve üzeri olan çift kişilik yataklar için geçerlidir.",
        "input_type": "single_select",
        "options": [
          { "label": "0", "value": "0", "next_step": "step_detaylar" },
          { "label": "1", "value": "1", "next_step": "step_detaylar" },
          { "label": "2", "value": "2", "next_step": "step_detaylar" },
          { "label": "3+", "value": "3+", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Leke durumu, koltukların kumaş türü (kadife, deri vb.) veya belirtmek istediğiniz özel bir durum var mı?",
        "input_type": "textarea",
        "placeholder": "Leke durumu, kumaş türü (kadife, deri vb.) veya özel talepleriniz...",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },
  'petek-temizligi': {
    "category_id": "petek_temizligi",
    "category_name": "Petek Temizliği",
    "steps": [
      {
        "step_id": "step_petek_sayisi",
        "step_title": "Temizlenecek petek sayısı yaklaşık kaçtır?",
        "description": "Dairenizde veya iş yerinizde temizlenecek petek sayısını seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "1 - 5 Adet Petek", "value": "1_5", "next_step": "step_isitma_sorunu" },
          { "label": "6 - 8 Adet Petek", "value": "6_8", "next_step": "step_isitma_sorunu" },
          { "label": "9 - 12 Adet Petek", "value": "9_12", "next_step": "step_isitma_sorunu" },
          { "label": "12 Adet ve Üzeri / Villa", "value": "12_plus", "next_step": "step_isitma_sorunu" }
        ]
      },
      {
        "step_id": "step_isitma_sorunu",
        "step_title": "Peteklerinizde yaşanan sorun veya hizmet türü nedir?",
        "input_type": "single_select",
        "options": [
          { "label": "Peteklerin Alt Kısmı Soğuk / Isınmıyor", "value": "alt_soguk", "next_step": "step_detaylar" },
          { "label": "Çamurlu / Siyah Su Var (Periyodik Bakım)", "value": "periyodik", "next_step": "step_detaylar" },
          { "label": "Petek Ses Yapıyor / Hava Var", "value": "ses_hava", "next_step": "step_detaylar" },
          { "label": "Yerden Isıtma Tesisatı Temizliği", "value": "yerden_isitma", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "Eklemek istediğiniz detaylar var mı?",
        "input_type": "textarea",
        "placeholder": "Örn: Kombi yeni bakımdan geçti, sadece petekler yıkanacak.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },
  'cam-temizligi': {
    "category_id": "cam_temizligi",
    "category_name": "Cam Silme & Temizliği",
    "steps": [
      {
        "step_id": "step_cam_kapsam",
        "step_title": "Silinecek cam ve alan kapsamı nedir?",
        "input_type": "single_select",
        "options": [
          { "label": "Ev Pencereleri & Cam Balkon", "value": "ev_cam", "next_step": "step_kat_bilgisi" },
          { "label": "Sadece Cam Balkon", "value": "cam_balkon", "next_step": "step_kat_bilgisi" },
          { "label": "Ofis / Dükkan Vitrin Camları", "value": "ofis_vitrin", "next_step": "step_kat_bilgisi" },
          { "label": "Dış Cephe / Yüksek Bina Camları", "value": "dis_cephe", "next_step": "step_kat_bilgisi" }
        ]
      },
      {
        "step_id": "step_kat_bilgisi",
        "step_title": "Mekan kaçıncı katta yer alıyor?",
        "input_type": "single_select",
        "options": [
          { "label": "Zemin / 1 - 3. Kat", "value": "dusuk_kat", "next_step": "step_detaylar" },
          { "label": "4 - 8. Kat", "value": "orta_kat", "next_step": "step_detaylar" },
          { "label": "9. Kat ve Üzeri / Yüksek Bina", "value": "yuksek_kat", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "Eklemek istediğiniz detaylar var mı?",
        "input_type": "textarea",
        "placeholder": "Örn: Çift açılır pimapen camlar ve katlanabilir cam balkon dahil.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },
  'evde_koltuk_yikama': {
    "category_id": "evde_koltuk_yikama",
    "category_name": "Evde Koltuk Yıkama",
    "steps": [
      {
        "step_id": "step_tekli_koltuk",
        "step_title": "Evde kaç adet tekli koltuk (veya berjer) var?",
        "description": "Yıkanmasını istediğiniz tekli koltuk ve berjer sayısını seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "0", "value": "0", "next_step": "step_uclu_kanepe" },
          { "label": "1", "value": "1", "next_step": "step_uclu_kanepe" },
          { "label": "2", "value": "2", "next_step": "step_uclu_kanepe" },
          { "label": "3", "value": "3", "next_step": "step_uclu_kanepe" },
          { "label": "4", "value": "4", "next_step": "step_uclu_kanepe" },
          { "label": "5+", "value": "5+", "next_step": "step_uclu_kanepe" }
        ]
      },
      {
        "step_id": "step_uclu_kanepe",
        "step_title": "Evde kaç tane üçlü / ikili kanepe / çekyat var?",
        "description": "Yıkanmasını istediğiniz ikili, üçlü kanepe veya çekyat sayısını seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "0", "value": "0", "next_step": "step_kose_koltugu" },
          { "label": "1", "value": "1", "next_step": "step_kose_koltugu" },
          { "label": "2", "value": "2", "next_step": "step_kose_koltugu" },
          { "label": "3", "value": "3", "next_step": "step_kose_koltugu" },
          { "label": "4+", "value": "4+", "next_step": "step_kose_koltugu" }
        ]
      },
      {
        "step_id": "step_kose_koltugu",
        "step_title": "Evde kaç adet L-şeklinde köşe koltuğu var?",
        "description": "L şeklinde köşe koltuklarınızın sayısını seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "0", "value": "0", "next_step": "step_sandalye" },
          { "label": "1", "value": "1", "next_step": "step_sandalye" },
          { "label": "2", "value": "2", "next_step": "step_sandalye" },
          { "label": "3+", "value": "3+", "next_step": "step_sandalye" }
        ]
      },
      {
        "step_id": "step_sandalye",
        "step_title": "Evde kaç adet sandalye var?",
        "description": "Yemek masası veya çalışma sandalyeleri dahildir.",
        "input_type": "single_select",
        "options": [
          { "label": "0", "value": "0", "next_step": "step_tek_kisilik_yatak" },
          { "label": "1", "value": "1", "next_step": "step_tek_kisilik_yatak" },
          { "label": "2", "value": "2", "next_step": "step_tek_kisilik_yatak" },
          { "label": "4", "value": "4", "next_step": "step_tek_kisilik_yatak" },
          { "label": "5", "value": "5", "next_step": "step_tek_kisilik_yatak" },
          { "label": "6", "value": "6", "next_step": "step_tek_kisilik_yatak" },
          { "label": "8", "value": "8", "next_step": "step_tek_kisilik_yatak" },
          { "label": "10+", "value": "10+", "next_step": "step_tek_kisilik_yatak" }
        ]
      },
      {
        "step_id": "step_tek_kisilik_yatak",
        "step_title": "Evde kaç adet tek kişilik yatak var?",
        "description": "Eni 130 cm'den az olan tek kişilik yataklar için geçerlidir.",
        "input_type": "single_select",
        "options": [
          { "label": "0", "value": "0", "next_step": "step_cift_kisilik_yatak" },
          { "label": "1", "value": "1", "next_step": "step_cift_kisilik_yatak" },
          { "label": "2", "value": "2", "next_step": "step_cift_kisilik_yatak" },
          { "label": "3+", "value": "3+", "next_step": "step_cift_kisilik_yatak" }
        ]
      },
      {
        "step_id": "step_cift_kisilik_yatak",
        "step_title": "Evde kaç adet çift kişilik yatak var?",
        "description": "Eni 130 cm ve üzeri olan çift kişilik yataklar için geçerlidir.",
        "input_type": "single_select",
        "options": [
          { "label": "0", "value": "0", "next_step": "step_detaylar" },
          { "label": "1", "value": "1", "next_step": "step_detaylar" },
          { "label": "2", "value": "2", "next_step": "step_detaylar" },
          { "label": "3+", "value": "3+", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Leke durumu, koltukların kumaş türü (kadife, deri vb.) veya belirtmek istediğiniz özel bir durum var mı?",
        "input_type": "textarea",
        "placeholder": "Leke durumu, kumaş türü (kadife, deri vb.) veya özel talepleriniz...",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },
  'hali-yikama': {
    "category_id": "hali_yikama",
    "category_name": "Halı Yıkama",
    "steps": [
      {
        "step_id": "step_yikama_yeri",
        "step_title": "Halı nerede yıkansın?",
        "description": "Hizmetin nerede verileceğini seçiniz.",
        "input_type": "single_select",
        "options": [
          {
            "label": "Adresten alınıp teslim edilsin",
            "value": "adresten_alim",
            "next_step": "step_metrekare_genel"
          },
          {
            "label": "Evde halı temizliği yapılsın",
            "value": "evde_temizlik",
            "next_step": "step_metrekare_evde"
          },
          {
            "label": "Ofiste halı temizliği yapılsın",
            "value": "ofiste_temizlik",
            "next_step": "step_metrekare_ofis"
          }
        ]
      },
      {
        "step_id": "step_metrekare_genel",
        "step_title": "Kaç metrekare halı yıkanacak?",
        "description": "Büyük oda halıları 6m2'dir ve çoğu halı 1 ila 6m2 arasındadır. En yakın seçeneği seçmeniz yeterlidir.",
        "input_type": "single_select",
        "options": [
          {"label": "5", "value": "5", "next_step": "step_leke_durumu_genel"},
          {"label": "10", "value": "10", "next_step": "step_leke_durumu_genel"},
          {"label": "15", "value": "15", "next_step": "step_leke_durumu_genel"},
          {"label": "20", "value": "20", "next_step": "step_leke_durumu_genel"},
          {"label": "25", "value": "25", "next_step": "step_leke_durumu_genel"},
          {"label": "30", "value": "30", "next_step": "step_leke_durumu_genel"},
          {"label": "40", "value": "40", "next_step": "step_leke_durumu_genel"},
          {"label": "50", "value": "50", "next_step": "step_leke_durumu_genel"},
          {"label": "60", "value": "60", "next_step": "step_leke_durumu_genel"},
          {"label": "80 veya daha fazla", "value": "80_veya_daha_fazla", "next_step": "step_leke_durumu_genel"}
        ]
      },
      {
        "step_id": "step_leke_durumu_genel",
        "step_title": "Çıkarılmasını istediğin lekeler var mı?",
        "description": "Standart yıkama dışındaki lekeli durumları belirtin.",
        "input_type": "single_select",
        "options": [
          {
            "label": "Evet, çıkması gereken lekeler var",
            "value": "evet_leke_var",
            "next_step": "step_ekstra_detay_var_mi"
          },
          {
            "label": "Hayır, standart halı yıkama yeterli",
            "value": "hayir_standart",
            "next_step": "step_ekstra_detay_var_mi"
          }
        ]
      },
      {
        "step_id": "step_metrekare_evde",
        "step_title": "Kaç metrekare halı yıkanacak?",
        "description": "Büyük oda halıları 6m2'dir ve çoğu halı 1 ila 6m2 arasındadır. En yakın seçeneği seçmeniz yeterlidir.",
        "input_type": "single_select",
        "options": [
          {"label": "5", "value": "5", "next_step": "step_leke_durumu_evde"},
          {"label": "10", "value": "10", "next_step": "step_leke_durumu_evde"},
          {"label": "15", "value": "15", "next_step": "step_leke_durumu_evde"},
          {"label": "20", "value": "20", "next_step": "step_leke_durumu_evde"},
          {"label": "25", "value": "25", "next_step": "step_leke_durumu_evde"},
          {"label": "30", "value": "30", "next_step": "step_leke_durumu_evde"},
          {"label": "40", "value": "40", "next_step": "step_leke_durumu_evde"},
          {"label": "50", "value": "50", "next_step": "step_leke_durumu_evde"},
          {"label": "60", "value": "60", "next_step": "step_leke_durumu_evde"},
          {"label": "80 veya daha fazla", "value": "80_veya_daha_fazla", "next_step": "step_leke_durumu_evde"}
        ]
      },
      {
        "step_id": "step_leke_durumu_evde",
        "step_title": "Çıkarılmasını istediğin lekeler var mı?",
        "description": "Standart yıkama dışındaki lekeli durumları belirtin.",
        "input_type": "single_select",
        "options": [
          {
            "label": "Evet, çıkması gereken lekeler var",
            "value": "evet_leke_var",
            "next_step": "step_ekstra_detay_var_mi"
          },
          {
            "label": "Hayır, standart halı yıkama yeterli",
            "value": "hayir_standart",
            "next_step": "step_ekstra_detay_var_mi"
          }
        ]
      },
      {
        "step_id": "step_metrekare_ofis",
        "step_title": "Kaç metrekare halı yıkanacak?",
        "description": "En yakın seçeneği seçmeniz yeterlidir.",
        "input_type": "single_select",
        "options": [
          {"label": "20 veya daha az", "value": "20_veya_daha_az", "next_step": "step_leke_durumu_ofis"},
          {"label": "30", "value": "30", "next_step": "step_leke_durumu_ofis"},
          {"label": "50", "value": "50", "next_step": "step_leke_durumu_ofis"},
          {"label": "60", "value": "60", "next_step": "step_leke_durumu_ofis"},
          {"label": "80", "value": "80", "next_step": "step_leke_durumu_ofis"},
          {"label": "100", "value": "100", "next_step": "step_leke_durumu_ofis"},
          {"label": "250", "value": "250", "next_step": "step_leke_durumu_ofis"},
          {"label": "500 veya daha fazla", "value": "500_veya_daha_fazla", "next_step": "step_leke_durumu_ofis"}
        ]
      },
      {
        "step_id": "step_leke_durumu_ofis",
        "step_title": "Çıkarılmasını istediğin lekeler var mı?",
        "description": "Standart yıkama dışındaki lekeli durumları belirtin.",
        "input_type": "single_select",
        "options": [
          {
            "label": "Evet, çıkması gereken lekeler var",
            "value": "evet_leke_var",
            "next_step": "step_ekstra_detay_var_mi"
          },
          {
            "label": "Hayır, standart halı yıkama yeterli",
            "value": "hayir_standart",
            "next_step": "step_ekstra_detay_var_mi"
          }
        ]
      },
      {
        "step_id": "step_ekstra_detay_var_mi",
        "step_title": "Ekstra bilinmesi istediğin veya belirtmek istediğiniz detay var mı?",
        "description": "Hizmet kalitesini artırmak için eklemek istediğiniz özel bir talep varsa seçebilirsiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Hayır Yok", "value": "hayir", "next_step": "END" },
          { "label": "Evet Var", "value": "evet", "next_step": "step_ekstra_detay_text" }
        ],
        "is_optional": false
      },
      {
        "step_id": "step_ekstra_detay_text",
        "step_title": "Lütfen eklemek istediğiniz detayları buraya yazınız:",
        "description": "Varsa lekelerin türünü, halı cinsini, ofis çalışma saatlerini veya belirtmek istediğiniz diğer detayları yazabilirsiniz.",
        "input_type": "textarea",
        "placeholder": "Detayları buraya giriniz...",
        "next_step": "END"
      }
    ]
  },

  // ----------------------------------------------------
  // EV TADİLAT
  // ----------------------------------------------------
  'ev-tadilat': {
    "category_id": "ev_tadilat",
    "category_name": "Ev Tadilat",
    "steps": [
      {
        "step_id": "step_tadilat_alani",
        "step_title": "Tadilat yapılacak alan neresidir?",
        "description": "Lütfen tadilat yaptırmak istediğiniz ana alanı seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Mutfak Tadilatı", "value": "mutfak", "next_step": "step_tadilat_m2" },
          { "label": "Banyo Tadilatı", "value": "banyo", "next_step": "step_tadilat_m2" },
          { "label": "Komple Ev Tadilatı", "value": "komple", "next_step": "step_tadilat_m2" },
          { "label": "Salon / Oda Tadilatı", "value": "salon_oda", "next_step": "step_tadilat_m2" },
          { "label": "Diğer", "value": "diger", "next_step": "step_tadilat_m2" }
        ]
      },
      {
        "step_id": "step_tadilat_m2",
        "step_title": "Tadilat yapılacak alan yaklaşık kaç metrekaredir?",
        "description": "Tahmini alan büyüklüğünü seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "50 m²'ye kadar", "value": "50_m2", "next_step": "step_islem_kapsami" },
          { "label": "50 - 100 m²", "value": "100_m2", "next_step": "step_islem_kapsami" },
          { "label": "100 - 150 m²", "value": "150_m2", "next_step": "step_islem_kapsami" },
          { "label": "150 - 200 m²", "value": "200_m2", "next_step": "step_islem_kapsami" },
          { "label": "200 m² ve üzeri", "value": "200_plus_m2", "next_step": "step_islem_kapsami" }
        ]
      },
      {
        "step_id": "step_islem_kapsami",
        "step_title": "Yapılacak ana işlemler nelerdir?",
        "description": "Öncelikli uygulama türünü seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Boya & Alçı İşleri", "value": "boya_alci", "next_step": "step_malzeme_durumu" },
          { "label": "Fayans & Seramik Döşeme", "value": "fayans", "next_step": "step_malzeme_durumu" },
          { "label": "Parke & Zemin Kaplama", "value": "parke", "next_step": "step_malzeme_durumu" },
          { "label": "Tesisat & Elektrik Yenileme", "value": "tesisat", "next_step": "step_malzeme_durumu" },
          { "label": "Komple İmalat & Montaj", "value": "komple_imalat", "next_step": "step_malzeme_durumu" }
        ]
      },
      {
        "step_id": "step_malzeme_durumu",
        "step_title": "Malzeme tedariği nasıl yapılacak?",
        "description": "Malzeme ve işçilik tercihiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Malzemeler Dahil Olsun", "value": "dahil", "next_step": "step_detaylar" },
          { "label": "Sadece İşçilik İstiyorum", "value": "iscilik", "next_step": "step_detaylar" },
          { "label": "Usta Keşif Yapıp Fiyat Versin", "value": "kesif", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Belirtmek istediğiniz özel bir istek, malzeme markası veya durum var mı?",
        "input_type": "textarea",
        "placeholder": "Örn: Mutfak dolabı değişecek, tezgah çimstone olacak vb.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },
  'ev_tadilat': {
    "category_id": "ev_tadilat",
    "category_name": "Ev Tadilat",
    "steps": [
      {
        "step_id": "step_tadilat_alani",
        "step_title": "Tadilat yapılacak alan neresidir?",
        "description": "Lütfen tadilat yaptırmak istediğiniz ana alanı seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Mutfak Tadilatı", "value": "mutfak", "next_step": "step_tadilat_m2" },
          { "label": "Banyo Tadilatı", "value": "banyo", "next_step": "step_tadilat_m2" },
          { "label": "Komple Ev Tadilatı", "value": "komple", "next_step": "step_tadilat_m2" },
          { "label": "Salon / Oda Tadilatı", "value": "salon_oda", "next_step": "step_tadilat_m2" },
          { "label": "Diğer", "value": "diger", "next_step": "step_tadilat_m2" }
        ]
      },
      {
        "step_id": "step_tadilat_m2",
        "step_title": "Tadilat yapılacak alan yaklaşık kaç metrekaredir?",
        "description": "Tahmini alan büyüklüğünü seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "50 m²'ye kadar", "value": "50_m2", "next_step": "step_islem_kapsami" },
          { "label": "50 - 100 m²", "value": "100_m2", "next_step": "step_islem_kapsami" },
          { "label": "100 - 150 m²", "value": "150_m2", "next_step": "step_islem_kapsami" },
          { "label": "150 - 200 m²", "value": "200_m2", "next_step": "step_islem_kapsami" },
          { "label": "200 m² ve üzeri", "value": "200_plus_m2", "next_step": "step_islem_kapsami" }
        ]
      },
      {
        "step_id": "step_islem_kapsami",
        "step_title": "Yapılacak ana işlemler nelerdir?",
        "description": "Öncelikli uygulama türünü seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Boya & Alçı İşleri", "value": "boya_alci", "next_step": "step_malzeme_durumu" },
          { "label": "Fayans & Seramik Döşeme", "value": "fayans", "next_step": "step_malzeme_durumu" },
          { "label": "Parke & Zemin Kaplama", "value": "parke", "next_step": "step_malzeme_durumu" },
          { "label": "Tesisat & Elektrik Yenileme", "value": "tesisat", "next_step": "step_malzeme_durumu" },
          { "label": "Komple İmalat & Montaj", "value": "komple_imalat", "next_step": "step_malzeme_durumu" }
        ]
      },
      {
        "step_id": "step_malzeme_durumu",
        "step_title": "Malzeme tedariği nasıl yapılacak?",
        "description": "Malzeme ve işçilik tercihiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Malzemeler Dahil Olsun", "value": "dahil", "next_step": "step_detaylar" },
          { "label": "Sadece İşçilik İstiyorum", "value": "iscilik", "next_step": "step_detaylar" },
          { "label": "Usta Keşif Yapıp Fiyat Versin", "value": "kesif", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Belirtmek istediğiniz özel bir istek, malzeme markası veya durum var mı?",
        "input_type": "textarea",
        "placeholder": "Örn: Mutfak dolabı değişecek, tezgah çimstone olacak vb.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },

  // ----------------------------------------------------
  // ELEKTRİK TESİSATI
  // ----------------------------------------------------
  'elektrik-tesisati': {
    "category_id": "elektrik_tesisati",
    "category_name": "Elektrik Tesisatı",
    "steps": [
      {
        "step_id": "step_elektrik_islem",
        "step_title": "Yapılacak elektrik işlemi nedir?",
        "description": "İhtiyaç duyduğunuz elektrik hizmetini seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Sigorta Arızası & Değişimi", "value": "sigorta", "next_step": "step_mekan_turu" },
          { "label": "Priz & Anahtar Montajı", "value": "priz", "next_step": "step_mekan_turu" },
          { "label": "Aydınlatma / Avize Montajı", "value": "avize", "next_step": "step_mekan_turu" },
          { "label": "İnternet & Kablo Çekimi", "value": "kablo", "next_step": "step_mekan_turu" },
          { "label": "Komple Elektrik Tesisatı", "value": "komple", "next_step": "step_mekan_turu" }
        ]
      },
      {
        "step_id": "step_mekan_turu",
        "step_title": "İşlem yapılacak mekan türü nedir?",
        "description": "Hizmetin verileceği alan türünü seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Daire / Ev", "value": "ev", "next_step": "step_elektrik_acil" },
          { "label": "Ofis / İş Yeri", "value": "ofis", "next_step": "step_elektrik_acil" },
          { "label": "Müstakil Ev / Villa", "value": "villa", "next_step": "step_elektrik_acil" },
          { "label": "Diğer", "value": "diger", "next_step": "step_elektrik_acil" }
        ]
      },
      {
        "step_id": "step_elektrik_acil",
        "step_title": "Hizmet ne zaman verilmeli?",
        "description": "Aciliyet durumunuzu seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Acil (Hemen / Aynı Gün)", "value": "acil", "next_step": "step_detaylar" },
          { "label": "Bu Hafta İçinde", "value": "hafta_icinde", "next_step": "step_detaylar" },
          { "label": "Esnek / Tarih Belli Değil", "value": "esnek", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Elektrik arızası veya işlemle ilgili eklemek istediğiniz detaylar var mı?",
        "input_type": "textarea",
        "placeholder": "Örn: Sigorta atıyor, 3 adet avize takılacak vb.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },
  'elektrik_tesisati': {
    "category_id": "elektrik_tesisati",
    "category_name": "Elektrik Tesisatı",
    "steps": [
      {
        "step_id": "step_elektrik_islem",
        "step_title": "Yapılacak elektrik işlemi nedir?",
        "description": "İhtiyaç duyduğunuz elektrik hizmetini seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Sigorta Arızası & Değişimi", "value": "sigorta", "next_step": "step_mekan_turu" },
          { "label": "Priz & Anahtar Montajı", "value": "priz", "next_step": "step_mekan_turu" },
          { "label": "Aydınlatma / Avize Montajı", "value": "avize", "next_step": "step_mekan_turu" },
          { "label": "İnternet & Kablo Çekimi", "value": "kablo", "next_step": "step_mekan_turu" },
          { "label": "Komple Elektrik Tesisatı", "value": "komple", "next_step": "step_mekan_turu" }
        ]
      },
      {
        "step_id": "step_mekan_turu",
        "step_title": "İşlem yapılacak mekan türü nedir?",
        "description": "Hizmetin verileceği alan türünü seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Daire / Ev", "value": "ev", "next_step": "step_elektrik_acil" },
          { "label": "Ofis / İş Yeri", "value": "ofis", "next_step": "step_elektrik_acil" },
          { "label": "Müstakil Ev / Villa", "value": "villa", "next_step": "step_elektrik_acil" },
          { "label": "Diğer", "value": "diger", "next_step": "step_elektrik_acil" }
        ]
      },
      {
        "step_id": "step_elektrik_acil",
        "step_title": "Hizmet ne zaman verilmeli?",
        "description": "Aciliyet durumunuzu seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Acil (Hemen / Aynı Gün)", "value": "acil", "next_step": "step_detaylar" },
          { "label": "Bu Hafta İçinde", "value": "hafta_icinde", "next_step": "step_detaylar" },
          { "label": "Esnek / Tarih Belli Değil", "value": "esnek", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Elektrik arızası veya işlemle ilgili eklemek istediğiniz detaylar var mı?",
        "input_type": "textarea",
        "placeholder": "Örn: Sigorta atıyor, 3 adet avize takılacak vb.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },

  // ----------------------------------------------------
  // SU TESİSATI
  // ----------------------------------------------------
  'su-tesisati': {
    "category_id": "su_tesisati",
    "category_name": "Su Tesisatı",
    "steps": [
      {
        "step_id": "step_su_islem",
        "step_title": "Yaşadığınız tesisat sorunu veya işlem nedir?",
        "description": "Yapılmasını istediğiniz tesisat hizmetini seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Su Kaçağı Tespiti & Tamiri", "value": "su_kacagi", "next_step": "step_su_alan" },
          { "label": "Tıkanıklık Açma (Gider/Klozet)", "value": "tikaniklik", "next_step": "step_su_alan" },
          { "label": "Musluk / Batarya / Sifon Tamiri", "value": "batarya", "next_step": "step_su_alan" },
          { "label": "Kalorifer / Petek Tesisatı", "value": "petek", "next_step": "step_su_alan" },
          { "label": "Komple Tesisat Yenileme", "value": "komple", "next_step": "step_su_alan" }
        ]
      },
      {
        "step_id": "step_su_alan",
        "step_title": "Sorun nerede yaşanıyor?",
        "description": "Hizmet verilecek alan.",
        "input_type": "single_select",
        "options": [
          { "label": "Banyo", "value": "banyo", "next_step": "step_su_acil" },
          { "label": "Mutfak", "value": "mutfak", "next_step": "step_su_acil" },
          { "label": "Tuvalet / WC", "value": "wc", "next_step": "step_su_acil" },
          { "label": "Tüm Ev / Tesisat", "value": "tum_ev", "next_step": "step_su_acil" }
        ]
      },
      {
        "step_id": "step_su_acil",
        "step_title": "Sorun ne kadar acil?",
        "description": "Müdahale zamanlaması.",
        "input_type": "single_select",
        "options": [
          { "label": "Çok Acil (Su Kaçağı / Taşma Var)", "value": "cok_acil", "next_step": "step_detaylar" },
          { "label": "Aynı Gün İçinde", "value": "ayni_gun", "next_step": "step_detaylar" },
          { "label": "Bu Hafta İçinde", "value": "hafta_icinde", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Tesisat sorunu ile ilgili belirtmek istediğiniz detaylar nelerdir?",
        "input_type": "textarea",
        "placeholder": "Örn: Mutfak lavabosu altından su sızıyor, acil usta lazım.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },
  'su_tesisati': {
    "category_id": "su_tesisati",
    "category_name": "Su Tesisatı",
    "steps": [
      {
        "step_id": "step_su_islem",
        "step_title": "Yaşadığınız tesisat sorunu veya işlem nedir?",
        "description": "Yapılmasını istediğiniz tesisat hizmetini seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Su Kaçağı Tespiti & Tamiri", "value": "su_kacagi", "next_step": "step_su_alan" },
          { "label": "Tıkanıklık Açma (Gider/Klozet)", "value": "tikaniklik", "next_step": "step_su_alan" },
          { "label": "Musluk / Batarya / Sifon Tamiri", "value": "batarya", "next_step": "step_su_alan" },
          { "label": "Kalorifer / Petek Tesisatı", "value": "petek", "next_step": "step_su_alan" },
          { "label": "Komple Tesisat Yenileme", "value": "komple", "next_step": "step_su_alan" }
        ]
      },
      {
        "step_id": "step_su_alan",
        "step_title": "Sorun nerede yaşanıyor?",
        "description": "Hizmet verilecek alan.",
        "input_type": "single_select",
        "options": [
          { "label": "Banyo", "value": "banyo", "next_step": "step_su_acil" },
          { "label": "Mutfak", "value": "mutfak", "next_step": "step_su_acil" },
          { "label": "Tuvalet / WC", "value": "wc", "next_step": "step_su_acil" },
          { "label": "Tüm Ev / Tesisat", "value": "tum_ev", "next_step": "step_su_acil" }
        ]
      },
      {
        "step_id": "step_su_acil",
        "step_title": "Sorun ne kadar acil?",
        "description": "Müdahale zamanlaması.",
        "input_type": "single_select",
        "options": [
          { "label": "Çok Acil (Su Kaçağı / Taşma Var)", "value": "cok_acil", "next_step": "step_detaylar" },
          { "label": "Aynı Gün İçinde", "value": "ayni_gun", "next_step": "step_detaylar" },
          { "label": "Bu Hafta İçinde", "value": "hafta_icinde", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Tesisat sorunu ile ilgili belirtmek istediğiniz detaylar nelerdir?",
        "input_type": "textarea",
        "placeholder": "Örn: Mutfak lavabosu altından su sızıyor, acil usta lazım.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },

  // ----------------------------------------------------
  // NAKLİYAT / EV TAŞIMA
  // ----------------------------------------------------
  'nakliyat': {
    "category_id": "nakliyat",
    "category_name": "Nakliyat / Ev Taşıma",
    "steps": [
      {
        "step_id": "step_nakliyat_turu",
        "step_title": "Ne tür bir taşıma hizmeti istiyorsunuz?",
        "description": "Taşınma türünü seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Evden Eve Nakliyat", "value": "evden_eve", "next_step": "step_ev_tipi" },
          { "label": "Parça Eşya Taşıma", "value": "parca_esya", "next_step": "step_ev_tipi" },
          { "label": "Ofis / İş Yeri Taşıma", "value": "ofis_tasima", "next_step": "step_ev_tipi" },
          { "label": "Şehirler Arası Nakliyat", "value": "sehirler_arasi", "next_step": "step_ev_tipi" }
        ]
      },
      {
        "step_id": "step_ev_tipi",
        "step_title": "Taşınacak oda sayısı / ev tipi nedir?",
        "description": "Oda sayısı bilgisi.",
        "input_type": "single_select",
        "options": [
          { "label": "1+0 / 1+1 Daire", "value": "1_1", "next_step": "step_asansor_durumu" },
          { "label": "2+1 Daire", "value": "2_1", "next_step": "step_asansor_durumu" },
          { "label": "3+1 Daire", "value": "3_1", "next_step": "step_asansor_durumu" },
          { "label": "4+1 ve üzeri", "value": "4_1_plus", "next_step": "step_asansor_durumu" },
          { "label": "Tek / Birkaç Parça Eşya", "value": "tek_parca", "next_step": "step_asansor_durumu" }
        ]
      },
      {
        "step_id": "step_asansor_durumu",
        "step_title": "Binalarda asansör durumu nedir?",
        "description": "Yük / bina asansörü durumu.",
        "input_type": "single_select",
        "options": [
          { "label": "İki Binada da Asansör Var", "value": "her_iki_asansor", "next_step": "step_paketleme" },
          { "label": "Yalnızca Birinde Asansör Var", "value": "tek_asansor", "next_step": "step_paketleme" },
          { "label": "Asansör Yok (Merdiven)", "value": "asansor_yok", "next_step": "step_paketleme" },
          { "label": "Dış Cephe Asansörü İstiyorum", "value": "dis_asansor", "next_step": "step_paketleme" }
        ]
      },
      {
        "step_id": "step_paketleme",
        "step_title": "Paketleme ve ambalaj hizmeti istiyor musunuz?",
        "description": "Eşyaların kolilenmesi ve sarılması.",
        "input_type": "single_select",
        "options": [
          { "label": "Tüm Eşyaları Usta Paketlesin", "value": "tam_paketleme", "next_step": "step_detaylar" },
          { "label": "Sadece Mobilyalar Sökülsün / Sarılsın", "value": "kaba_paketleme", "next_step": "step_detaylar" },
          { "label": "Paketlemeyi Ben Yapacağım", "value": "paketleme_yok", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Nereden nereye taşınacak, tarih ve özel ağır eşyalar (piyano, kasa vb.) var mı?",
        "input_type": "textarea",
        "placeholder": "Örn: Çankaya 3. kattan Karşıyaka 2. kata taşınacak, gardırop sökülecek vb.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },

  // ----------------------------------------------------
  // İNŞAAT / TADİLAT SONRASI TEMİZLİK
  // ----------------------------------------------------
  'insaat-sonrasi-temizlik': {
    "category_id": "insaat_sonrasi_temizlik",
    "category_name": "İnşaat / Tadilat Sonrası Temizlik",
    "steps": [
      {
        "step_id": "step_insaat_mekan",
        "step_title": "Temizlik yapılacak mekanın türü nedir?",
        "description": "Temizlenecek alanı seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Daire / Ev", "value": "daire", "next_step": "step_insaat_m2" },
          { "label": "Müstakil Ev / Villa", "value": "villa", "next_step": "step_insaat_m2" },
          { "label": "Ofis / İş Yeri", "value": "ofis", "next_step": "step_insaat_m2" },
          { "label": "Mağaza / Dükkan", "value": "dukkan", "next_step": "step_insaat_m2" },
          { "label": "Bina / Proje Teslimi", "value": "bina_proje", "next_step": "step_insaat_m2" }
        ]
      },
      {
        "step_id": "step_insaat_m2",
        "step_title": "Mekanın yaklaşık büyüklüğü nedir?",
        "description": "Ekip ve malzeme planlaması için alan büyüklüğünü seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "100 m²'den Küçük (1+1 / 2+1 Daire)", "value": "100_m2_alt", "next_step": "step_insaat_durum" },
          { "label": "100 - 180 m² (3+1 Daire / Standart Ofis)", "value": "100_180_m2", "next_step": "step_insaat_durum" },
          { "label": "180 - 250 m² (4+1 Daire / Geniş İş Yeri)", "value": "180_250_m2", "next_step": "step_insaat_durum" },
          { "label": "250 - 400 m² (Villa / Dubleks / Mağaza)", "value": "250_400_m2", "next_step": "step_insaat_durum" },
          { "label": "400 m² ve Üzeri (Bina / Proje Teslimi)", "value": "400_plus_m2", "next_step": "step_insaat_durum" }
        ]
      },
      {
        "step_id": "step_insaat_durum",
        "step_title": "İnşaat / harç / kalıntı durumu nedir?",
        "description": "Kirlilik yoğunluğu ve gerekli malzeme tespiti.",
        "input_type": "single_select",
        "options": [
          { "label": "Hafif (Boya Badana Sonrası / İnce Toz & Cam Bantları)", "value": "hafif", "next_step": "step_insaat_esya" },
          { "label": "Orta (Harç Lekeleri, Derz/Seramik İzi, Pencere Jelatinleri)", "value": "orta", "next_step": "step_insaat_esya" },
          { "label": "Ağır (Yoğun Moloz Tozu, Kurumuş Harç & Kaba Kalıntılar)", "value": "agir", "next_step": "step_insaat_esya" }
        ]
      },
      {
        "step_id": "step_insaat_esya",
        "step_title": "Mekanda eşya durumu ve asansör var mı?",
        "description": "Ekipman taşıma ve koruma ambalajı tespiti.",
        "input_type": "single_select",
        "options": [
          { "label": "Boş Mekan (Henüz Eşya Taşınmadı - Asansör Var)", "value": "bos_asansorlu", "next_step": "step_insaat_malzeme" },
          { "label": "Boş Mekan (Henüz Eşya Taşınmadı - Asansör Yok)", "value": "bos_asansorsuz", "next_step": "step_insaat_malzeme" },
          { "label": "Kısmen Eşyalı (Ambalajlı / Yeni Eşyalar Var)", "value": "esyali", "next_step": "step_insaat_malzeme" }
        ]
      },
      {
        "step_id": "step_insaat_malzeme",
        "step_title": "Temizlik malzemeleri ve ekipman kim tarafından sağlanacak?",
        "description": "Sanayi tipi süpürge, kazıyıcı ve özel kimyasallar dahil.",
        "input_type": "single_select",
        "options": [
          { "label": "Hizmet Veren Getirsin (Tüm Ekipman & Kimyasallar Dahil)", "value": "hizmetveren_getirsin", "next_step": "step_insaat_ekstra" },
          { "label": "Malzemeler Bende Var / Ben Sağlayacağım", "value": "musteri_saglasin", "next_step": "step_insaat_ekstra" }
        ]
      },
      {
        "step_id": "step_insaat_ekstra",
        "step_title": "Ekstra dahil edilecek hizmet var mı?",
        "description": "Özel temizlik taleplerinizi seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Dış Cephe / Yüksek Cam Silimi", "value": "dis_cephe_cam", "next_step": "step_detaylar" },
          { "label": "Zemin Mermer & Taş Cilalama / Silim", "value": "mermer_cila", "next_step": "step_detaylar" },
          { "label": "Balkon / Teras Yıkama", "value": "balkon_yikama", "next_step": "step_detaylar" },
          { "label": "Bina Ortak Alan & Merdiven Temizliği", "value": "bina_ortak_alan", "next_step": "step_detaylar" },
          { "label": "Ekstra Hizmet İstemiyorum (Standart Temizlik)", "value": "ekstra_yok", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "Hizmet verene iletmek istediğiniz özel bir not var mı?",
        "description": "Örn: Çizilmeye hassas zemin, vakum makinesi gerekecek vb.",
        "input_type": "textarea",
        "placeholder": "Örn: Camlarda etiket ve boya lekeleri var, vakum makinesi gerekecek.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },
  'insaat_sonrasi_temizlik': {
    "category_id": "insaat_sonrasi_temizlik",
    "category_name": "İnşaat / Tadilat Sonrası Temizlik",
    "steps": [
      {
        "step_id": "step_insaat_mekan",
        "step_title": "Temizlik yapılacak mekanın türü nedir?",
        "description": "Temizlenecek alanı seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Daire / Ev", "value": "daire", "next_step": "step_insaat_m2" },
          { "label": "Müstakil Ev / Villa", "value": "villa", "next_step": "step_insaat_m2" },
          { "label": "Ofis / İş Yeri", "value": "ofis", "next_step": "step_insaat_m2" },
          { "label": "Mağaza / Dükkan", "value": "dukkan", "next_step": "step_insaat_m2" },
          { "label": "Bina / Proje Teslimi", "value": "bina_proje", "next_step": "step_insaat_m2" }
        ]
      },
      {
        "step_id": "step_insaat_m2",
        "step_title": "Mekanın yaklaşık büyüklüğü nedir?",
        "description": "Ekip ve malzeme planlaması için alan büyüklüğünü seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "100 m²'den Küçük (1+1 / 2+1 Daire)", "value": "100_m2_alt", "next_step": "step_insaat_durum" },
          { "label": "100 - 180 m² (3+1 Daire / Standart Ofis)", "value": "100_180_m2", "next_step": "step_insaat_durum" },
          { "label": "180 - 250 m² (4+1 Daire / Geniş İş Yeri)", "value": "180_250_m2", "next_step": "step_insaat_durum" },
          { "label": "250 - 400 m² (Villa / Dubleks / Mağaza)", "value": "250_400_m2", "next_step": "step_insaat_durum" },
          { "label": "400 m² ve Üzeri (Bina / Proje Teslimi)", "value": "400_plus_m2", "next_step": "step_insaat_durum" }
        ]
      },
      {
        "step_id": "step_insaat_durum",
        "step_title": "İnşaat / harç / kalıntı durumu nedir?",
        "description": "Kirlilik yoğunluğu ve gerekli malzeme tespiti.",
        "input_type": "single_select",
        "options": [
          { "label": "Hafif (Boya Badana Sonrası / İnce Toz & Cam Bantları)", "value": "hafif", "next_step": "step_insaat_esya" },
          { "label": "Orta (Harç Lekeleri, Derz/Seramik İzi, Pencere Jelatinleri)", "value": "orta", "next_step": "step_insaat_esya" },
          { "label": "Ağır (Yoğun Moloz Tozu, Kurumuş Harç & Kaba Kalıntılar)", "value": "agir", "next_step": "step_insaat_esya" }
        ]
      },
      {
        "step_id": "step_insaat_esya",
        "step_title": "Mekanda eşya durumu ve asansör var mı?",
        "description": "Ekipman taşıma ve koruma ambalajı tespiti.",
        "input_type": "single_select",
        "options": [
          { "label": "Boş Mekan (Henüz Eşya Taşınmadı - Asansör Var)", "value": "bos_asansorlu", "next_step": "step_insaat_malzeme" },
          { "label": "Boş Mekan (Henüz Eşya Taşınmadı - Asansör Yok)", "value": "bos_asansorsuz", "next_step": "step_insaat_malzeme" },
          { "label": "Kısmen Eşyalı (Ambalajlı / Yeni Eşyalar Var)", "value": "esyali", "next_step": "step_insaat_malzeme" }
        ]
      },
      {
        "step_id": "step_insaat_malzeme",
        "step_title": "Temizlik malzemeleri ve ekipman kim tarafından sağlanacak?",
        "description": "Sanayi tipi süpürge, kazıyıcı ve özel kimyasallar dahil.",
        "input_type": "single_select",
        "options": [
          { "label": "Hizmet Veren Getirsin (Tüm Ekipman & Kimyasallar Dahil)", "value": "hizmetveren_getirsin", "next_step": "step_insaat_ekstra" },
          { "label": "Malzemeler Bende Var / Ben Sağlayacağım", "value": "musteri_saglasin", "next_step": "step_insaat_ekstra" }
        ]
      },
      {
        "step_id": "step_insaat_ekstra",
        "step_title": "Ekstra dahil edilecek hizmet var mı?",
        "description": "Özel temizlik taleplerinizi seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Dış Cephe / Yüksek Cam Silimi", "value": "dis_cephe_cam", "next_step": "step_detaylar" },
          { "label": "Zemin Mermer & Taş Cilalama / Silim", "value": "mermer_cila", "next_step": "step_detaylar" },
          { "label": "Balkon / Teras Yıkama", "value": "balkon_yikama", "next_step": "step_detaylar" },
          { "label": "Bina Ortak Alan & Merdiven Temizliği", "value": "bina_ortak_alan", "next_step": "step_detaylar" },
          { "label": "Ekstra Hizmet İstemiyorum (Standart Temizlik)", "value": "ekstra_yok", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "Hizmet verene iletmek istediğiniz özel bir not var mı?",
        "description": "Örn: Çizilmeye hassas zemin, vakum makinesi gerekecek vb.",
        "input_type": "textarea",
        "placeholder": "Örn: Camlarda etiket ve boya lekeleri var, vakum makinesi gerekecek.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },

  // ----------------------------------------------------
  // FAYANS DÖŞEME
  // ----------------------------------------------------
  'fayans-doseme': {
    "category_id": "fayans_doseme",
    "category_name": "Fayans Döşeme",
    "steps": [
      {
        "step_id": "step_fayans_alani",
        "step_title": "Fayans döşenecek alan neresidir?",
        "description": "Uygulama alanını seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Banyo Zemin & Duvar", "value": "banyo", "next_step": "step_fayans_m2" },
          { "label": "Mutfak Tezgah Arası / Zemin", "value": "mutfak", "next_step": "step_fayans_m2" },
          { "label": "Balkon / Teras", "value": "balkon", "next_step": "step_fayans_m2" },
          { "label": "Koridor / Antre", "value": "koridor", "next_step": "step_fayans_m2" },
          { "label": "Diğer", "value": "diger", "next_step": "step_fayans_m2" }
        ]
      },
      {
        "step_id": "step_fayans_m2",
        "step_title": "Tahmini kaplama alanı kaç metrekaredir?",
        "description": "Alan büyüklüğünü seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "10 m²'ye kadar", "value": "10_m2", "next_step": "step_fayans_sokum" },
          { "label": "10 - 25 m²", "value": "25_m2", "next_step": "step_fayans_sokum" },
          { "label": "25 - 50 m²", "value": "50_m2", "next_step": "step_fayans_sokum" },
          { "label": "50 - 100 m²", "value": "100_m2", "next_step": "step_fayans_sokum" },
          { "label": "100 m² ve üzeri", "value": "100_plus_m2", "next_step": "step_fayans_sokum" }
        ]
      },
      {
        "step_id": "step_fayans_sokum",
        "step_title": "Eski fayansların sökülmesi (kırım) gerekiyor mu?",
        "description": "Kırım ve hafriyat durumu.",
        "input_type": "single_select",
        "options": [
          { "label": "Evet, Eski Fayanslar Sökülecek", "value": "sokum_var", "next_step": "step_detaylar" },
          { "label": "Hayır, Zemin / Duvar Hazır", "value": "zemin_hazir", "next_step": "step_detaylar" },
          { "label": "Fayans Üzerine Döşenecek", "value": "fayans_ustu", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Fayans malzemesi hazır mı? Derz ve harç durumuyla ilgili detayları giriniz:",
        "input_type": "textarea",
        "placeholder": "Örn: 60x120 graniti ben aldım, usta derz ve yapıştırıcı getirecek.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },
  'fayans_doseme': {
    "category_id": "fayans_doseme",
    "category_name": "Fayans Döşeme",
    "steps": [
      {
        "step_id": "step_fayans_alani",
        "step_title": "Fayans döşenecek alan neresidir?",
        "description": "Uygulama alanını seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Banyo Zemin & Duvar", "value": "banyo", "next_step": "step_fayans_m2" },
          { "label": "Mutfak Tezgah Arası / Zemin", "value": "mutfak", "next_step": "step_fayans_m2" },
          { "label": "Balkon / Teras", "value": "balkon", "next_step": "step_fayans_m2" },
          { "label": "Koridor / Antre", "value": "koridor", "next_step": "step_fayans_m2" },
          { "label": "Diğer", "value": "diger", "next_step": "step_fayans_m2" }
        ]
      },
      {
        "step_id": "step_fayans_m2",
        "step_title": "Tahmini kaplama alanı kaç metrekaredir?",
        "description": "Alan büyüklüğünü seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "10 m²'ye kadar", "value": "10_m2", "next_step": "step_fayans_sokum" },
          { "label": "10 - 25 m²", "value": "25_m2", "next_step": "step_fayans_sokum" },
          { "label": "25 - 50 m²", "value": "50_m2", "next_step": "step_fayans_sokum" },
          { "label": "50 - 100 m²", "value": "100_m2", "next_step": "step_fayans_sokum" },
          { "label": "100 m² ve üzeri", "value": "100_plus_m2", "next_step": "step_fayans_sokum" }
        ]
      },
      {
        "step_id": "step_fayans_sokum",
        "step_title": "Eski fayansların sökülmesi (kırım) gerekiyor mu?",
        "description": "Kırım ve hafriyat durumu.",
        "input_type": "single_select",
        "options": [
          { "label": "Evet, Eski Fayanslar Sökülecek", "value": "sokum_var", "next_step": "step_detaylar" },
          { "label": "Hayır, Zemin / Duvar Hazır", "value": "zemin_hazir", "next_step": "step_detaylar" },
          { "label": "Fayans Üzerine Döşenecek", "value": "fayans_ustu", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Fayans malzemesi hazır mı? Derz ve harç durumuyla ilgili detayları giriniz:",
        "input_type": "textarea",
        "placeholder": "Örn: 60x120 graniti ben aldım, usta derz ve yapıştırıcı getirecek.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },

  // ----------------------------------------------------
  // PARKE DÖŞEME
  // ----------------------------------------------------
  'parke-doseme': {
    "category_id": "parke_doseme",
    "category_name": "Parke Döşeme",
    "steps": [
      {
        "step_id": "step_parke_turu",
        "step_title": "Döşenecek parke türü nedir?",
        "description": "Malzeme türünü seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Laminat Parke", "value": "laminat", "next_step": "step_parke_m2" },
          { "label": "Lamine Parke", "value": "lamine", "next_step": "step_parke_m2" },
          { "label": "Ahşap / Masif Parke", "value": "masif", "next_step": "step_parke_m2" },
          { "label": "Parke Tamiri & Süpürgelik", "value": "tamir", "next_step": "step_parke_m2" }
        ]
      },
      {
        "step_id": "step_parke_m2",
        "step_title": "Döşeme yapılacak alan yaklaşık kaç metrekaredir?",
        "description": "Alan büyüklüğünü seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "30 m²'ye kadar", "value": "30_m2", "next_step": "step_parke_supurgelik" },
          { "label": "30 - 60 m²", "value": "60_m2", "next_step": "step_parke_supurgelik" },
          { "label": "60 - 100 m²", "value": "100_m2", "next_step": "step_parke_supurgelik" },
          { "label": "100 - 150 m²", "value": "150_m2", "next_step": "step_parke_supurgelik" },
          { "label": "150 m² ve üzeri", "value": "150_plus_m2", "next_step": "step_parke_supurgelik" }
        ]
      },
      {
        "step_id": "step_parke_supurgelik",
        "step_title": "Süpürgelik ve şilte montajı dahil mi?",
        "description": "Ek uygulama tercihi.",
        "input_type": "single_select",
        "options": [
          { "label": "Evet, Süpürgelik ve Şilte Dahil", "value": "supurgelik_dahil", "next_step": "step_detaylar" },
          { "label": "Sadece Parke Döşeme", "value": "sadece_parke", "next_step": "step_detaylar" },
          { "label": "Eski Parkeler de Sökülecek", "value": "eski_sokum", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Parkeyi aldınız mı, süpürgelik yüksekliği vb. detaylar:",
        "input_type": "textarea",
        "placeholder": "Örn: 8mm laminat parke 3 oda 1 salon döşenecek.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },
  'parke_doseme': {
    "category_id": "parke_doseme",
    "category_name": "Parke Döşeme",
    "steps": [
      {
        "step_id": "step_parke_turu",
        "step_title": "Döşenecek parke türü nedir?",
        "description": "Malzeme türünü seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Laminat Parke", "value": "laminat", "next_step": "step_parke_m2" },
          { "label": "Lamine Parke", "value": "lamine", "next_step": "step_parke_m2" },
          { "label": "Ahşap / Masif Parke", "value": "masif", "next_step": "step_parke_m2" },
          { "label": "Parke Tamiri & Süpürgelik", "value": "tamir", "next_step": "step_parke_m2" }
        ]
      },
      {
        "step_id": "step_parke_m2",
        "step_title": "Döşeme yapılacak alan yaklaşık kaç metrekaredir?",
        "description": "Alan büyüklüğünü seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "30 m²'ye kadar", "value": "30_m2", "next_step": "step_parke_supurgelik" },
          { "label": "30 - 60 m²", "value": "60_m2", "next_step": "step_parke_supurgelik" },
          { "label": "60 - 100 m²", "value": "100_m2", "next_step": "step_parke_supurgelik" },
          { "label": "100 - 150 m²", "value": "150_m2", "next_step": "step_parke_supurgelik" },
          { "label": "150 m² ve üzeri", "value": "150_plus_m2", "next_step": "step_parke_supurgelik" }
        ]
      },
      {
        "step_id": "step_parke_supurgelik",
        "step_title": "Süpürgelik ve şilte montajı dahil mi?",
        "description": "Ek uygulama tercihi.",
        "input_type": "single_select",
        "options": [
          { "label": "Evet, Süpürgelik ve Şilte Dahil", "value": "supurgelik_dahil", "next_step": "step_detaylar" },
          { "label": "Sadece Parke Döşeme", "value": "sadece_parke", "next_step": "step_detaylar" },
          { "label": "Eski Parkeler de Sökülecek", "value": "eski_sokum", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Parkeyi aldınız mı, süpürgelik yüksekliği vb. detaylar:",
        "input_type": "textarea",
        "placeholder": "Örn: 8mm laminat parke 3 oda 1 salon döşenecek.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },

  // ----------------------------------------------------
  // HAŞERE / BÖCEK İLAÇLAMA
  // ----------------------------------------------------
  'hasere-ilaclama': {
    "category_id": "bocek_ilaclama",
    "category_name": "Ev & Haşere İlaçlama",
    "steps": [
      {
        "step_id": "step_ilaclama_mekan",
        "step_title": "İlaçlama yapılacak mekanın türü nedir?",
        "description": "Uygulama alanını seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Daire / Ev", "value": "daire", "next_step": "step_ilaclama_m2" },
          { "label": "Müstakil Ev / Villa", "value": "villa", "next_step": "step_ilaclama_m2" },
          { "label": "Apartman Ortak Alanı / Bodrum / Sığınak", "value": "apartman_ortak", "next_step": "step_ilaclama_m2" },
          { "label": "Ofis / Dükkan / Restoran / İş Yeri", "value": "isyeri", "next_step": "step_ilaclama_m2" },
          { "label": "Bahçe / Açık Alan / Depo", "value": "bahce_depo", "next_step": "step_ilaclama_m2" }
        ]
      },
      {
        "step_id": "step_ilaclama_m2",
        "step_title": "İlaçlanacak alanın büyüklüğü nedir?",
        "description": "Malzeme dozajı ve ekipman için metrekare seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "100 m²'den Küçük (1+1 / 2+1 Daire)", "value": "100_m2_alt", "next_step": "step_ilaclama_tur" },
          { "label": "100 - 180 m² (3+1 / 4+1 Daire veya Ofis)", "value": "100_180_m2", "next_step": "step_ilaclama_tur" },
          { "label": "180 - 300 m² (Villa / Restoran / İş Yeri)", "value": "180_300_m2", "next_step": "step_ilaclama_tur" },
          { "label": "300 m² ve Üzeri (Bina / Depo / Bahçe)", "value": "300_plus_m2", "next_step": "step_ilaclama_tur" }
        ]
      },
      {
        "step_id": "step_ilaclama_tur",
        "step_title": "Şikayetçi olduğunuz haşere / böcek türü nedir?",
        "description": "Doğru ilaç ve uygulama yöntemi tespiti için seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Hamam Böceği / Karafatma / Kalorifer Böceği", "value": "hamam_bocegi", "next_step": "step_ilaclama_guvenlik" },
          { "label": "Pire / Tahtakurusu", "value": "pire_tahtakurusu", "next_step": "step_ilaclama_guvenlik" },
          { "label": "Kemirgen (Fare / Sıçan)", "value": "fare", "next_step": "step_ilaclama_guvenlik" },
          { "label": "Gümüş Böceği / Örümcek / Akrep / Karınca", "value": "gumus_karinca", "next_step": "step_ilaclama_guvenlik" },
          { "label": "Genel Koruyucu İlaçlama (Önlem Amaçlı)", "value": "genel_onlem", "next_step": "step_ilaclama_guvenlik" }
        ]
      },
      {
        "step_id": "step_ilaclama_guvenlik",
        "step_title": "Mekanda çocuk, evcil hayvan veya hamile var mı?",
        "description": "İlaç tipi (kokusuz/zararsız jel) ve güvenlik önlemleri için.",
        "input_type": "single_select",
        "options": [
          { "label": "Evet, Evcil Hayvan Var (Kokusuz & Zararsız İlaç)", "value": "evcil_hayvan", "next_step": "step_ilaclama_yontem" },
          { "label": "Evet, Bebek / Çocuk / Hamile Var", "value": "bebek_cocuk", "next_step": "step_ilaclama_yontem" },
          { "label": "Hayır Yok (Mekan Boşaltılabilir)", "value": "guvenlik_yok", "next_step": "step_ilaclama_yontem" }
        ]
      },
      {
        "step_id": "step_ilaclama_yontem",
        "step_title": "Tercih ettiğiniz ilaçlama yöntemi nedir?",
        "description": "Mekanda kalınabilir veya evcil hayvan dostu yöntemler.",
        "input_type": "single_select",
        "options": [
          { "label": "Kokusuz Sıvı & Jel İlaçlama (Evden Çıkmaya Gerek Yok)", "value": "kokusuz_jel", "next_step": "step_ilaclama_garanti" },
          { "label": "Kokulu / Dumanlı ULV Sisleme (Ev 2-4 Saat Havalandırılır)", "value": "ulv_sisleme", "next_step": "step_ilaclama_garanti" },
          { "label": "Uzman Hizmet Veren Yerinde İnceleyip Karar Versin", "value": "uzman_karar", "next_step": "step_ilaclama_garanti" }
        ]
      },
      {
        "step_id": "step_ilaclama_garanti",
        "step_title": "Garanti veya periyodik uygulama tercihinizi seçin:",
        "description": "Tekrarlayan böcek durumlarında koruma seçeneği.",
        "input_type": "single_select",
        "options": [
          { "label": "Tek Seferlik İlaçlama", "value": "tek_seferlik", "next_step": "step_detaylar" },
          { "label": "6 Ay Garantili / Tekrarlamalı Koruma Paketi", "value": "6_ay_garantili", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "Hizmet verene iletmek istediğiniz özel bir not var mı?",
        "description": "Örn: Mutfak dolaplarında yoğun görülüyor, kokusuz ilaç olsun.",
        "input_type": "textarea",
        "placeholder": "Örn: Mutfak dolaplarında hamam böceği görüldü, kedi besliyoruz.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },
  'hasere_ilaclama': {
    "category_id": "hasere_ilaclama",
    "category_name": "Haşere İlaçlama",
    "steps": [
      {
        "step_id": "step_hasere_turu",
        "step_title": "Şikayetçi olduğunuz haşere / böcek türü nedir?",
        "description": "Haşere türünü seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Hamam Böceği / Kalorifer Böceği", "value": "hamam_bocegi", "next_step": "step_ilaclama_alani" },
          { "label": "Tahta Kurusu", "value": "tahta_kurusu", "next_step": "step_ilaclama_alani" },
          { "label": "Pire / Kene", "value": "pire", "next_step": "step_ilaclama_alani" },
          { "label": "Fare / Kemirgen", "value": "fare", "next_step": "step_ilaclama_alani" },
          { "label": "Akrep / Gümüş Böceği / Karınca", "value": "karinca_diger", "next_step": "step_ilaclama_alani" },
          { "label": "Bilmiyorum / Genel İlaçlama", "value": "genel", "next_step": "step_ilaclama_alani" }
        ]
      },
      {
        "step_id": "step_ilaclama_alani",
        "step_title": "İlaçlama yapılacak mekan neresidir?",
        "description": "Uygulama alanını seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Ev / Daire", "value": "daire", "next_step": "step_ilaclama_m2" },
          { "label": "Müstakil Ev / Bahçe", "value": "villa_bahce", "next_step": "step_ilaclama_m2" },
          { "label": "Restaurant / Kafe / İş Yeri", "value": "isyeri", "next_step": "step_ilaclama_m2" },
          { "label": "Depo / Bodrum", "value": "depo", "next_step": "step_ilaclama_m2" }
        ]
      },
      {
        "step_id": "step_ilaclama_m2",
        "step_title": "Alanın büyüklüğü nedir?",
        "description": "Tahmini metrekare.",
        "input_type": "single_select",
        "options": [
          { "label": "100 m²'ye kadar", "value": "100_m2", "next_step": "step_detaylar" },
          { "label": "100 - 200 m²", "value": "200_m2", "next_step": "step_detaylar" },
          { "label": "200 - 500 m²", "value": "500_m2", "next_step": "step_detaylar" },
          { "label": "500 m² ve üzeri", "value": "500_plus_m2", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Evcil hayvan var mı veya ilaçlama sıklığı ilgili detaylar:",
        "input_type": "textarea",
        "placeholder": "Örn: Mutfakta hamam böceği görüldü, kedi besliyoruz kokusuz ilaç olsun.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },
  'bocek-ilaclama': {
    "category_id": "bocek_ilaclama",
    "category_name": "Ev & Haşere İlaçlama",
    "steps": [
      {
        "step_id": "step_ilaclama_mekan",
        "step_title": "İlaçlama yapılacak mekanın türü nedir?",
        "description": "Uygulama alanını seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Daire / Ev", "value": "daire", "next_step": "step_ilaclama_m2" },
          { "label": "Müstakil Ev / Villa", "value": "villa", "next_step": "step_ilaclama_m2" },
          { "label": "Apartman Ortak Alanı / Bodrum / Sığınak", "value": "apartman_ortak", "next_step": "step_ilaclama_m2" },
          { "label": "Ofis / Dükkan / Restoran / İş Yeri", "value": "isyeri", "next_step": "step_ilaclama_m2" },
          { "label": "Bahçe / Açık Alan / Depo", "value": "bahce_depo", "next_step": "step_ilaclama_m2" }
        ]
      },
      {
        "step_id": "step_ilaclama_m2",
        "step_title": "İlaçlanacak alanın büyüklüğü nedir?",
        "description": "Malzeme dozajı ve ekipman için metrekare seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "100 m²'den Küçük (1+1 / 2+1 Daire)", "value": "100_m2_alt", "next_step": "step_ilaclama_tur" },
          { "label": "100 - 180 m² (3+1 / 4+1 Daire veya Ofis)", "value": "100_180_m2", "next_step": "step_ilaclama_tur" },
          { "label": "180 - 300 m² (Villa / Restoran / İş Yeri)", "value": "180_300_m2", "next_step": "step_ilaclama_tur" },
          { "label": "300 m² ve Üzeri (Bina / Depo / Bahçe)", "value": "300_plus_m2", "next_step": "step_ilaclama_tur" }
        ]
      },
      {
        "step_id": "step_ilaclama_tur",
        "step_title": "Şikayetçi olduğunuz haşere / böcek türü nedir?",
        "description": "Doğru ilaç ve uygulama yöntemi tespiti için seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Hamam Böceği / Karafatma / Kalorifer Böceği", "value": "hamam_bocegi", "next_step": "step_ilaclama_guvenlik" },
          { "label": "Pire / Tahtakurusu", "value": "pire_tahtakurusu", "next_step": "step_ilaclama_guvenlik" },
          { "label": "Kemirgen (Fare / Sıçan)", "value": "fare", "next_step": "step_ilaclama_guvenlik" },
          { "label": "Gümüş Böceği / Örümcek / Akrep / Karınca", "value": "gumus_karinca", "next_step": "step_ilaclama_guvenlik" },
          { "label": "Genel Koruyucu İlaçlama (Önlem Amaçlı)", "value": "genel_onlem", "next_step": "step_ilaclama_guvenlik" }
        ]
      },
      {
        "step_id": "step_ilaclama_guvenlik",
        "step_title": "Mekanda çocuk, evcil hayvan veya hamile var mı?",
        "description": "İlaç tipi (kokusuz/zararsız jel) ve güvenlik önlemleri için.",
        "input_type": "single_select",
        "options": [
          { "label": "Evet, Evcil Hayvan Var (Kokusuz & Zararsız İlaç)", "value": "evcil_hayvan", "next_step": "step_ilaclama_yontem" },
          { "label": "Evet, Bebek / Çocuk / Hamile Var", "value": "bebek_cocuk", "next_step": "step_ilaclama_yontem" },
          { "label": "Hayır Yok (Mekan Boşaltılabilir)", "value": "guvenlik_yok", "next_step": "step_ilaclama_yontem" }
        ]
      },
      {
        "step_id": "step_ilaclama_yontem",
        "step_title": "Tercih ettiğiniz ilaçlama yöntemi nedir?",
        "description": "Mekanda kalınabilir veya evcil hayvan dostu yöntemler.",
        "input_type": "single_select",
        "options": [
          { "label": "Kokusuz Sıvı & Jel İlaçlama (Evden Çıkmaya Gerek Yok)", "value": "kokusuz_jel", "next_step": "step_ilaclama_garanti" },
          { "label": "Kokulu / Dumanlı ULV Sisleme (Ev 2-4 Saat Havalandırılır)", "value": "ulv_sisleme", "next_step": "step_ilaclama_garanti" },
          { "label": "Uzman Hizmet Veren Yerinde İnceleyip Karar Versin", "value": "uzman_karar", "next_step": "step_ilaclama_garanti" }
        ]
      },
      {
        "step_id": "step_ilaclama_garanti",
        "step_title": "Garanti veya periyodik uygulama tercihinizi seçin:",
        "description": "Tekrarlayan böcek durumlarında koruma seçeneği.",
        "input_type": "single_select",
        "options": [
          { "label": "Tek Seferlik İlaçlama", "value": "tek_seferlik", "next_step": "step_detaylar" },
          { "label": "6 Ay Garantili / Tekrarlamalı Koruma Paketi", "value": "6_ay_garantili", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "Hizmet verene iletmek istediğiniz özel bir not var mı?",
        "description": "Örn: Mutfak dolaplarında yoğun görülüyor, kokusuz ilaç olsun.",
        "input_type": "textarea",
        "placeholder": "Örn: Mutfak dolaplarında hamam böceği görüldü, kedi besliyoruz.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },
  'ev-ilaclama': {
    "category_id": "bocek_ilaclama",
    "category_name": "Ev & Haşere İlaçlama",
    "steps": [
      {
        "step_id": "step_ilaclama_mekan",
        "step_title": "İlaçlama yapılacak mekanın türü nedir?",
        "description": "Uygulama alanını seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Daire / Ev", "value": "daire", "next_step": "step_ilaclama_m2" },
          { "label": "Müstakil Ev / Villa", "value": "villa", "next_step": "step_ilaclama_m2" },
          { "label": "Apartman Ortak Alanı / Bodrum / Sığınak", "value": "apartman_ortak", "next_step": "step_ilaclama_m2" },
          { "label": "Ofis / Dükkan / Restoran / İş Yeri", "value": "isyeri", "next_step": "step_ilaclama_m2" },
          { "label": "Bahçe / Açık Alan / Depo", "value": "bahce_depo", "next_step": "step_ilaclama_m2" }
        ]
      },
      {
        "step_id": "step_ilaclama_m2",
        "step_title": "İlaçlanacak alanın büyüklüğü nedir?",
        "description": "Malzeme dozajı ve ekipman için metrekare seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "100 m²'den Küçük (1+1 / 2+1 Daire)", "value": "100_m2_alt", "next_step": "step_ilaclama_tur" },
          { "label": "100 - 180 m² (3+1 / 4+1 Daire veya Ofis)", "value": "100_180_m2", "next_step": "step_ilaclama_tur" },
          { "label": "180 - 300 m² (Villa / Restoran / İş Yeri)", "value": "180_300_m2", "next_step": "step_ilaclama_tur" },
          { "label": "300 m² ve Üzeri (Bina / Depo / Bahçe)", "value": "300_plus_m2", "next_step": "step_ilaclama_tur" }
        ]
      },
      {
        "step_id": "step_ilaclama_tur",
        "step_title": "Şikayetçi olduğunuz haşere / böcek türü nedir?",
        "description": "Doğru ilaç ve uygulama yöntemi tespiti için seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Hamam Böceği / Karafatma / Kalorifer Böceği", "value": "hamam_bocegi", "next_step": "step_ilaclama_guvenlik" },
          { "label": "Pire / Tahtakurusu", "value": "pire_tahtakurusu", "next_step": "step_ilaclama_guvenlik" },
          { "label": "Kemirgen (Fare / Sıçan)", "value": "fare", "next_step": "step_ilaclama_guvenlik" },
          { "label": "Gümüş Böceği / Örümcek / Akrep / Karınca", "value": "gumus_karinca", "next_step": "step_ilaclama_guvenlik" },
          { "label": "Genel Koruyucu İlaçlama (Önlem Amaçlı)", "value": "genel_onlem", "next_step": "step_ilaclama_guvenlik" }
        ]
      },
      {
        "step_id": "step_ilaclama_guvenlik",
        "step_title": "Mekanda çocuk, evcil hayvan veya hamile var mı?",
        "description": "İlaç tipi (kokusuz/zararsız jel) ve güvenlik önlemleri için.",
        "input_type": "single_select",
        "options": [
          { "label": "Evet, Evcil Hayvan Var (Kokusuz & Zararsız İlaç)", "value": "evcil_hayvan", "next_step": "step_ilaclama_yontem" },
          { "label": "Evet, Bebek / Çocuk / Hamile Var", "value": "bebek_cocuk", "next_step": "step_ilaclama_yontem" },
          { "label": "Hayır Yok (Mekan Boşaltılabilir)", "value": "guvenlik_yok", "next_step": "step_ilaclama_yontem" }
        ]
      },
      {
        "step_id": "step_ilaclama_yontem",
        "step_title": "Tercih ettiğiniz ilaçlama yöntemi nedir?",
        "description": "Mekanda kalınabilir veya evcil hayvan dostu yöntemler.",
        "input_type": "single_select",
        "options": [
          { "label": "Kokusuz Sıvı & Jel İlaçlama (Evden Çıkmaya Gerek Yok)", "value": "kokusuz_jel", "next_step": "step_ilaclama_garanti" },
          { "label": "Kokulu / Dumanlı ULV Sisleme (Ev 2-4 Saat Havalandırılır)", "value": "ulv_sisleme", "next_step": "step_ilaclama_garanti" },
          { "label": "Uzman Hizmet Veren Yerinde İnceleyip Karar Versin", "value": "uzman_karar", "next_step": "step_ilaclama_garanti" }
        ]
      },
      {
        "step_id": "step_ilaclama_garanti",
        "step_title": "Garanti veya periyodik uygulama tercihinizi seçin:",
        "description": "Tekrarlayan böcek durumlarında koruma seçeneği.",
        "input_type": "single_select",
        "options": [
          { "label": "Tek Seferlik İlaçlama", "value": "tek_seferlik", "next_step": "step_detaylar" },
          { "label": "6 Ay Garantili / Tekrarlamalı Koruma Paketi", "value": "6_ay_garantili", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "Hizmet verene iletmek istediğiniz özel bir not var mı?",
        "description": "Örn: Mutfak dolaplarında yoğun görülüyor, kokusuz ilaç olsun.",
        "input_type": "textarea",
        "placeholder": "Örn: Mutfak dolaplarında hamam böceği görüldü, kedi besliyoruz.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },

  // ----------------------------------------------------
  // KOMBİ SERVİSİ
  // ----------------------------------------------------
  'kombi-servisi': {
    "category_id": "kombi_servisi",
    "category_name": "Kombi Servisi",
    "steps": [
      {
        "step_id": "step_kombi_islem",
        "step_title": "Kombi için yapılacak işlem nedir?",
        "description": "Hizmet türünü seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Yıllık Periyodik Bakım", "value": "bakim", "next_step": "step_kombi_marka" },
          { "label": "Kombi Arıza / Isıtmıyor / Su Kaçırıyor", "value": "ariza", "next_step": "step_kombi_marka" },
          { "label": "Petek Temizliği", "value": "petek_temizligi", "next_step": "step_kombi_marka" },
          { "label": "Kombi Montajı / Demontajı", "value": "montaj", "next_step": "step_kombi_marka" }
        ]
      },
      {
        "step_id": "step_kombi_marka",
        "step_title": "Kombinizin markası nedir?",
        "description": "Marka bilgisini seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Vaillant / Demirdöküm / ECA", "value": "demirdokum_eca", "next_step": "step_detaylar" },
          { "label": "Buderus / Bosch / Baymak", "value": "bosch_baymak", "next_step": "step_detaylar" },
          { "label": "Ariston / Viessmann / Protherm", "value": "viessmann", "next_step": "step_detaylar" },
          { "label": "Diğer Marka", "value": "diger_marka", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Cihazdaki arıza kodunu veya şikayetinizi detaylı yazınız:",
        "input_type": "textarea",
        "placeholder": "Örn: Kombi petekleri ısıtmıyor, ekranda F4 arıza kodu veriyor.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },
  'kombi_servisi': {
    "category_id": "kombi_servisi",
    "category_name": "Kombi Servisi",
    "steps": [
      {
        "step_id": "step_kombi_islem",
        "step_title": "Kombi için yapılacak işlem nedir?",
        "description": "Hizmet türünü seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Yıllık Periyodik Bakım", "value": "bakim", "next_step": "step_kombi_marka" },
          { "label": "Kombi Arıza / Isıtmıyor / Su Kaçırıyor", "value": "ariza", "next_step": "step_kombi_marka" },
          { "label": "Petek Temizliği", "value": "petek_temizligi", "next_step": "step_kombi_marka" },
          { "label": "Kombi Montajı / Demontajı", "value": "montaj", "next_step": "step_kombi_marka" }
        ]
      },
      {
        "step_id": "step_kombi_marka",
        "step_title": "Kombinizin markası nedir?",
        "description": "Marka bilgisini seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Vaillant / Demirdöküm / ECA", "value": "demirdokum_eca", "next_step": "step_detaylar" },
          { "label": "Buderus / Bosch / Baymak", "value": "bosch_baymak", "next_step": "step_detaylar" },
          { "label": "Ariston / Viessmann / Protherm", "value": "viessmann", "next_step": "step_detaylar" },
          { "label": "Diğer Marka", "value": "diger_marka", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Cihazdaki arıza kodunu veya şikayetinizi detaylı yazınız:",
        "input_type": "textarea",
        "placeholder": "Örn: Kombi petekleri ısıtmıyor, ekranda F4 arıza kodu veriyor.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },

  // ----------------------------------------------------
  // KLİMA SERVİSİ
  // ----------------------------------------------------
  'klima-servisi': {
    "category_id": "klima_servisi",
    "category_name": "Klima Servisi",
    "steps": [
      {
        "step_id": "step_klima_islem",
        "step_title": "Klima için yapılacak işlem nedir?",
        "description": "İhtiyaç duyduğunuz klima hizmetini seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Yıllık Klima Bakımı & Temizliği", "value": "bakim", "next_step": "step_klima_btu" },
          { "label": "Klima Gaz Dolumu", "value": "gaz_dolumu", "next_step": "step_klima_btu" },
          { "label": "Klima Arıza / Soğutmuyor", "value": "ariza", "next_step": "step_klima_btu" },
          { "label": "Klima Söküm & Montaj", "value": "montaj", "next_step": "step_klima_btu" }
        ]
      },
      {
        "step_id": "step_klima_btu",
        "step_title": "Klimanızın tahmini kapasitesi (BTU) nedir?",
        "description": "Klima kapasitesini seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "9.000 - 12.000 BTU (Küçük Oda)", "value": "12000_btu", "next_step": "step_detaylar" },
          { "label": "18.000 BTU (Salon / Orta Alan)", "value": "18000_btu", "next_step": "step_detaylar" },
          { "label": "24.000 BTU ve üzeri", "value": "24000_btu", "next_step": "step_detaylar" },
          { "label": "Bilmiyorum", "value": "bilmiyorum", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Klimanızın markasını ve sorununuzu açıklayınız:",
        "input_type": "textarea",
        "placeholder": "Örn: Arçelik 12000 BTU klima soğutmuyor, gazı eksik olabilir.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },
  'klima_servisi': {
    "category_id": "klima_servisi",
    "category_name": "Klima Servisi",
    "steps": [
      {
        "step_id": "step_klima_islem",
        "step_title": "Klima için yapılacak işlem nedir?",
        "description": "İhtiyaç duyduğunuz klima hizmetini seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Yıllık Klima Bakımı & Temizliği", "value": "bakim", "next_step": "step_klima_btu" },
          { "label": "Klima Gaz Dolumu", "value": "gaz_dolumu", "next_step": "step_klima_btu" },
          { "label": "Klima Arıza / Soğutmuyor", "value": "ariza", "next_step": "step_klima_btu" },
          { "label": "Klima Söküm & Montaj", "value": "montaj", "next_step": "step_klima_btu" }
        ]
      },
      {
        "step_id": "step_klima_btu",
        "step_title": "Klimanızın tahmini kapasitesi (BTU) nedir?",
        "description": "Klima kapasitesini seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "9.000 - 12.000 BTU (Küçük Oda)", "value": "12000_btu", "next_step": "step_detaylar" },
          { "label": "18.000 BTU (Salon / Orta Alan)", "value": "18000_btu", "next_step": "step_detaylar" },
          { "label": "24.000 BTU ve üzeri", "value": "24000_btu", "next_step": "step_detaylar" },
          { "label": "Bilmiyorum", "value": "bilmiyorum", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Klimanızın markasını ve sorununuzu açıklayınız:",
        "input_type": "textarea",
        "placeholder": "Örn: Arçelik 12000 BTU klima soğutmuyor, gazı eksik olabilir.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },

  // ----------------------------------------------------
  // MARANGOZ & MOBİLYA MONTAJI
  // ----------------------------------------------------
  'mobilya-montaji': {
    "category_id": "mobilya_montaji",
    "category_name": "Mobilya Montajı",
    "steps": [
      {
        "step_id": "step_mobilya_islem",
        "step_title": "Yapılacak mobilya / marangoz işlemi nedir?",
        "description": "İşlem türünü seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Mobilya Kurulumu / Montajı (Demonte)", "value": "montaj", "next_step": "step_urun_sayisi" },
          { "label": "Gardırop / Mutfak Dolabı Tamiri", "value": "tamir", "next_step": "step_urun_sayisi" },
          { "label": "Özel Ölçü Mobilya İmalatı", "value": "imalat", "next_step": "step_urun_sayisi" },
          { "label": "Kapı Tamiri / Menteşe Ayarı", "value": "kapi", "next_step": "step_urun_sayisi" }
        ]
      },
      {
        "step_id": "step_urun_sayisi",
        "step_title": "Kaç parça ürün işlem görecek?",
        "description": "Montaj / tamir yapılacak ürün sayısı.",
        "input_type": "single_select",
        "options": [
          { "label": "1 Parça Ürün", "value": "1_parca", "next_step": "step_detaylar" },
          { "label": "2 - 3 Parça Ürün", "value": "3_parca", "next_step": "step_detaylar" },
          { "label": "4 - 6 Parça Ürün", "value": "6_parca", "next_step": "step_detaylar" },
          { "label": "Komple Ev Mobilyası", "value": "komple_ev", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Mobilyanın markası (IKEA, Koçtaş vb.) ve tamir gereksinimlerini yazınız:",
        "input_type": "textarea",
        "placeholder": "Örn: 3 kapılı IKEA gardırop ve 1 TV ünitesi kurulacak.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },
  'mobilya_montaji': {
    "category_id": "mobilya_montaji",
    "category_name": "Mobilya Montajı",
    "steps": [
      {
        "step_id": "step_mobilya_islem",
        "step_title": "Yapılacak mobilya / marangoz işlemi nedir?",
        "description": "İşlem türünü seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Mobilya Kurulumu / Montajı (Demonte)", "value": "montaj", "next_step": "step_urun_sayisi" },
          { "label": "Gardırop / Mutfak Dolabı Tamiri", "value": "tamir", "next_step": "step_urun_sayisi" },
          { "label": "Özel Ölçü Mobilya İmalatı", "value": "imalat", "next_step": "step_urun_sayisi" },
          { "label": "Kapı Tamiri / Menteşe Ayarı", "value": "kapi", "next_step": "step_urun_sayisi" }
        ]
      },
      {
        "step_id": "step_urun_sayisi",
        "step_title": "Kaç parça ürün işlem görecek?",
        "description": "Montaj / tamir yapılacak ürün sayısı.",
        "input_type": "single_select",
        "options": [
          { "label": "1 Parça Ürün", "value": "1_parca", "next_step": "step_detaylar" },
          { "label": "2 - 3 Parça Ürün", "value": "3_parca", "next_step": "step_detaylar" },
          { "label": "4 - 6 Parça Ürün", "value": "6_parca", "next_step": "step_detaylar" },
          { "label": "Komple Ev Mobilyası", "value": "komple_ev", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Mobilyanın markası (IKEA, Koçtaş vb.) ve tamir gereksinimlerini yazınız:",
        "input_type": "textarea",
        "placeholder": "Örn: 3 kapılı IKEA gardırop ve 1 TV ünitesi kurulacak.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },
  'marangoz': {
    "category_id": "mobilya_montaji",
    "category_name": "Marangoz",
    "steps": [
      {
        "step_id": "step_mobilya_islem",
        "step_title": "Yapılacak mobilya / marangoz işlemi nedir?",
        "description": "İşlem türünü seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Mobilya Kurulumu / Montajı (Demonte)", "value": "montaj", "next_step": "step_urun_sayisi" },
          { "label": "Gardırop / Mutfak Dolabı Tamiri", "value": "tamir", "next_step": "step_urun_sayisi" },
          { "label": "Özel Ölçü Mobilya İmalatı", "value": "imalat", "next_step": "step_urun_sayisi" },
          { "label": "Kapı Tamiri / Menteşe Ayarı", "value": "kapi", "next_step": "step_urun_sayisi" }
        ]
      },
      {
        "step_id": "step_urun_sayisi",
        "step_title": "Kaç parça ürün işlem görecek?",
        "description": "Montaj / tamir yapılacak ürün sayısı.",
        "input_type": "single_select",
        "options": [
          { "label": "1 Parça Ürün", "value": "1_parca", "next_step": "step_detaylar" },
          { "label": "2 - 3 Parça Ürün", "value": "3_parca", "next_step": "step_detaylar" },
          { "label": "4 - 6 Parça Ürün", "value": "6_parca", "next_step": "step_detaylar" },
          { "label": "Komple Ev Mobilyası", "value": "komple_ev", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Mobilyanın markası (IKEA, Koçtaş vb.) ve tamir gereksinimlerini yazınız:",
        "input_type": "textarea",
        "placeholder": "Örn: 3 kapılı IKEA gardırop ve 1 TV ünitesi kurulacak.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },

  // ----------------------------------------------------
  // ÖZEL DERS
  // ----------------------------------------------------
  'ozel-ders': {
    "category_id": "ozel_ders",
    "category_name": "Özel Ders",
    "steps": [
      {
        "step_id": "step_ders_bransi",
        "step_title": "Hangi branşta ders almak istiyorsunuz?",
        "description": "Ders alanını seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Matematik / Geometri", "value": "matematik", "next_step": "step_ders_seviyesi" },
          { "label": "Fen Bilimleri / Fizik / Kimya", "value": "fen_fizik", "next_step": "step_ders_seviyesi" },
          { "label": "İngilizce / Yabancı Dil", "value": "ingilizce", "next_step": "step_ders_seviyesi" },
          { "label": "İlkokul Okuma / Takviye", "value": "ilkokul", "next_step": "step_ders_seviyesi" },
          { "label": "LGS / YKS Sınav Hazırlık", "value": "sinav_hazirlik", "next_step": "step_ders_seviyesi" },
          { "label": "Müzik / Enstrüman", "value": "muzik", "next_step": "step_ders_seviyesi" }
        ]
      },
      {
        "step_id": "step_ders_seviyesi",
        "step_title": "Öğrencinin eğitim seviyesi nedir?",
        "description": "Seviye bilgisini seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "İlkokul", "value": "ilkokul_seviye", "next_step": "step_ders_formati" },
          { "label": "Ortaokul", "value": "ortaokul_seviye", "next_step": "step_ders_formati" },
          { "label": "Lise", "value": "lise_seviye", "next_step": "step_ders_formati" },
          { "label": "Üniversite / Yetişkin", "value": "yetiskin_seviye", "next_step": "step_ders_formati" }
        ]
      },
      {
        "step_id": "step_ders_formati",
        "step_title": "Dersler nasıl işlensin?",
        "description": "Ders yer ve format tercihi.",
        "input_type": "single_select",
        "options": [
          { "label": "Öğrencinin Evinde (Yüz Yüze)", "value": "yuz_yuze_ogrenci", "next_step": "step_detaylar" },
          { "label": "Eğitmenin Evinde (Yüz Yüze)", "value": "yuz_yuze_egitmen", "next_step": "step_detaylar" },
          { "label": "Online (Canlı Ders)", "value": "online", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Haftada kaç saat ders planlıyorsunuz ve özel hedefleriniz nelerdir?",
        "input_type": "textarea",
        "placeholder": "Örn: LGS sınavına hazırlık için haftada 2 saat Matematik yüz yüze ders.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },
  'ozel_ders': {
    "category_id": "ozel_ders",
    "category_name": "Özel Ders",
    "steps": [
      {
        "step_id": "step_ders_bransi",
        "step_title": "Hangi branşta ders almak istiyorsunuz?",
        "description": "Ders alanını seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Matematik / Geometri", "value": "matematik", "next_step": "step_ders_seviyesi" },
          { "label": "Fen Bilimleri / Fizik / Kimya", "value": "fen_fizik", "next_step": "step_ders_seviyesi" },
          { "label": "İngilizce / Yabancı Dil", "value": "ingilizce", "next_step": "step_ders_seviyesi" },
          { "label": "İlkokul Okuma / Takviye", "value": "ilkokul", "next_step": "step_ders_seviyesi" },
          { "label": "LGS / YKS Sınav Hazırlık", "value": "sinav_hazirlik", "next_step": "step_ders_seviyesi" },
          { "label": "Müzik / Enstrüman", "value": "muzik", "next_step": "step_ders_seviyesi" }
        ]
      },
      {
        "step_id": "step_ders_seviyesi",
        "step_title": "Öğrencinin eğitim seviyesi nedir?",
        "description": "Seviye bilgisini seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "İlkokul", "value": "ilkokul_seviye", "next_step": "step_ders_formati" },
          { "label": "Ortaokul", "value": "ortaokul_seviye", "next_step": "step_ders_formati" },
          { "label": "Lise", "value": "lise_seviye", "next_step": "step_ders_formati" },
          { "label": "Üniversite / Yetişkin", "value": "yetiskin_seviye", "next_step": "step_ders_formati" }
        ]
      },
      {
        "step_id": "step_ders_formati",
        "step_title": "Dersler nasıl işlensin?",
        "description": "Ders yer ve format tercihi.",
        "input_type": "single_select",
        "options": [
          { "label": "Öğrencinin Evinde (Yüz Yüze)", "value": "yuz_yuze_ogrenci", "next_step": "step_detaylar" },
          { "label": "Eğitmenin Evinde (Yüz Yüze)", "value": "yuz_yuze_egitmen", "next_step": "step_detaylar" },
          { "label": "Online (Canlı Ders)", "value": "online", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Haftada kaç saat ders planlıyorsunuz ve özel hedefleriniz nelerdir?",
        "input_type": "textarea",
        "placeholder": "Örn: LGS sınavına hazırlık için haftada 2 saat Matematik yüz yüze ders.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },

  // ----------------------------------------------------
  // CAM BALKON & PVC PENCERE
  // ----------------------------------------------------
  'cam-balkon': {
    "category_id": "cam_balkon",
    "category_name": "Cam Balkon",
    "steps": [
      {
        "step_id": "step_cambalkon_turu",
        "step_title": "İstediğiniz sistem türü nedir?",
        "description": "Sistem türünü seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Katlanır Cam Balkon", "value": "katlanir", "next_step": "step_balkon_olcu" },
          { "label": "Sürme Cam Balkon", "value": "surme", "next_step": "step_balkon_olcu" },
          { "label": "Isıcamlı Cam Balkon", "value": "isicamli", "next_step": "step_balkon_olcu" },
          { "label": "PVC Pencere / Kapı Sistemleri", "value": "pvc", "next_step": "step_balkon_olcu" }
        ]
      },
      {
        "step_id": "step_balkon_olcu",
        "step_title": "Balkonun / Alanın tahmini şekli ve ölçüsü nedir?",
        "description": "Genişlik bilgisi.",
        "input_type": "single_select",
        "options": [
          { "label": "Düz Balkon (3 - 5 Metre)", "value": "duz_balkon", "next_step": "step_detaylar" },
          { "label": "L Şeklinde Balkon", "value": "l_balkon", "next_step": "step_detaylar" },
          { "label": "U Şeklinde Balkon", "value": "u_balkon", "next_step": "step_detaylar" },
          { "label": "Fransız Balkon / Pencere", "value": "fransiz", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Cam rengi (füme, şeffaf vb.) ve keşif isteğinizi belirtiniz:",
        "input_type": "textarea",
        "placeholder": "Örn: Füme cam katlanır balkon yapılacak, keşe usta gelebilir.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },
  'cam_balkon': {
    "category_id": "cam_balkon",
    "category_name": "Cam Balkon",
    "steps": [
      {
        "step_id": "step_cambalkon_turu",
        "step_title": "İstediğiniz sistem türü nedir?",
        "description": "Sistem türünü seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Katlanır Cam Balkon", "value": "katlanir", "next_step": "step_balkon_olcu" },
          { "label": "Sürme Cam Balkon", "value": "surme", "next_step": "step_balkon_olcu" },
          { "label": "Isıcamlı Cam Balkon", "value": "isicamli", "next_step": "step_balkon_olcu" },
          { "label": "PVC Pencere / Kapı Sistemleri", "value": "pvc", "next_step": "step_balkon_olcu" }
        ]
      },
      {
        "step_id": "step_balkon_olcu",
        "step_title": "Balkonun / Alanın tahmini şekli ve ölçüsü nedir?",
        "description": "Genişlik bilgisi.",
        "input_type": "single_select",
        "options": [
          { "label": "Düz Balkon (3 - 5 Metre)", "value": "duz_balkon", "next_step": "step_detaylar" },
          { "label": "L Şeklinde Balkon", "value": "l_balkon", "next_step": "step_detaylar" },
          { "label": "U Şeklinde Balkon", "value": "u_balkon", "next_step": "step_detaylar" },
          { "label": "Fransız Balkon / Pencere", "value": "fransiz", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Cam rengi (füme, şeffaf vb.) ve keşif isteğinizi belirtiniz:",
        "input_type": "textarea",
        "placeholder": "Örn: Füme cam katlanır balkon yapılacak, keşe usta gelebilir.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },
  'pvc-pencere': {
    "category_id": "cam_balkon",
    "category_name": "PVC Pencere",
    "steps": [
      {
        "step_id": "step_cambalkon_turu",
        "step_title": "İstediğiniz sistem türü nedir?",
        "description": "Sistem türünü seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Katlanır Cam Balkon", "value": "katlanir", "next_step": "step_balkon_olcu" },
          { "label": "Sürme Cam Balkon", "value": "surme", "next_step": "step_balkon_olcu" },
          { "label": "Isıcamlı Cam Balkon", "value": "isicamli", "next_step": "step_balkon_olcu" },
          { "label": "PVC Pencere / Kapı Sistemleri", "value": "pvc", "next_step": "step_balkon_olcu" }
        ]
      },
      {
        "step_id": "step_balkon_olcu",
        "step_title": "Balkonun / Alanın tahmini şekli ve ölçüsü nedir?",
        "description": "Genişlik bilgisi.",
        "input_type": "single_select",
        "options": [
          { "label": "Düz Balkon (3 - 5 Metre)", "value": "duz_balkon", "next_step": "step_detaylar" },
          { "label": "L Şeklinde Balkon", "value": "l_balkon", "next_step": "step_detaylar" },
          { "label": "U Şeklinde Balkon", "value": "u_balkon", "next_step": "step_detaylar" },
          { "label": "Fransız Balkon / Pencere", "value": "fransiz", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Cam rengi (füme, şeffaf vb.) ve keşif isteğinizi belirtiniz:",
        "input_type": "textarea",
        "placeholder": "Örn: Füme cam katlanır balkon yapılacak, keşfe usta gelebilir.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },
  'boya-badana': {
    "category_id": "boya_badana",
    "category_name": "Boya Badana",
    "steps": [
      {
        "step_id": "step_boya_alan",
        "step_title": "Boyanacak alanın türü ve büyüklüğü nedir?",
        "description": "Boyanacak mekan türünü seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "1+1 Daire Boyama", "value": "1_1", "next_step": "step_boya_malzeme" },
          { "label": "2+1 Daire Boyama", "value": "2_1", "next_step": "step_boya_malzeme" },
          { "label": "3+1 Daire Boyama", "value": "3_1", "next_step": "step_boya_malzeme" },
          { "label": "Tek Oda / Bölgesel Boyama", "value": "tek_oda", "next_step": "step_boya_malzeme" },
          { "label": "Ofis / İş Yeri Boyama", "value": "ofis", "next_step": "step_boya_malzeme" },
          { "label": "Dış Cephe / Villa Boyama", "value": "dis_cephe", "next_step": "step_boya_malzeme" }
        ]
      },
      {
        "step_id": "step_boya_malzeme",
        "step_title": "Boya malzemesi kim tarafından temin edilecek?",
        "description": "Malzeme seçimini yapınız.",
        "input_type": "single_select",
        "options": [
          { "label": "Boya Malzemesi Ustadan Olsun (Anahtar Teslim)", "value": "malzeme_ustadan", "next_step": "step_detaylar" },
          { "label": "Boya Malzemesini Ben Alacağım (Sadece İşçilik)", "value": "sadece_iscilik", "next_step": "step_detaylar" },
          { "label": "Usta Keşif Yapıp Fiyat Versin", "value": "kesif", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Alçı, çöp, eşyalı daire durumu veya renk tercihinizi belirtiniz:",
        "input_type": "textarea",
        "placeholder": "Örn: Dairemiz eşyalıdır, tavanlarda alçı ve tamirat işi mevcuttur.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },
  'boya_badana': {
    "category_id": "boya_badana",
    "category_name": "Boya Badana",
    "steps": [
      {
        "step_id": "step_boya_alan",
        "step_title": "Boyanacak alanın türü ve büyüklüğü nedir?",
        "description": "Boyanacak mekan türünü seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "1+1 Daire Boyama", "value": "1_1", "next_step": "step_boya_malzeme" },
          { "label": "2+1 Daire Boyama", "value": "2_1", "next_step": "step_boya_malzeme" },
          { "label": "3+1 Daire Boyama", "value": "3_1", "next_step": "step_boya_malzeme" },
          { "label": "Tek Oda / Bölgesel Boyama", "value": "tek_oda", "next_step": "step_boya_malzeme" },
          { "label": "Ofis / İş Yeri Boyama", "value": "ofis", "next_step": "step_boya_malzeme" }
        ]
      },
      {
        "step_id": "step_boya_malzeme",
        "step_title": "Boya malzemesi kim tarafından temin edilecek?",
        "description": "Malzeme seçimini yapınız.",
        "input_type": "single_select",
        "options": [
          { "label": "Boya Malzemesi Ustadan Olsun (Anahtar Teslim)", "value": "malzeme_ustadan", "next_step": "step_detaylar" },
          { "label": "Boya Malzemesini Ben Alacağım (Sadece İşçilik)", "value": "sadece_iscilik", "next_step": "step_detaylar" },
          { "label": "Usta Keşif Yapıp Fiyat Versin", "value": "kesif", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Detayları yazınız.",
        "input_type": "textarea",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },
  'fotografci': {
    "category_id": "fotografci",
    "category_name": "Fotoğrafçı",
    "steps": [
      {
        "step_id": "step_fotograf_tur",
        "step_title": "Fotoğraf çekimi türü ve konsepti nedir?",
        "description": "İhtiyacınız olan çekim türünü seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Düğün / Nişan / Kına / Dış Çekim", "value": "dugun_nisan", "next_step": "step_fotograf_lokasyon" },
          { "label": "Ürün / Katalog / Moda / Reklam Çekimi", "value": "urun_katalog", "next_step": "step_fotograf_lokasyon" },
          { "label": "Doğum / Bebek / Aile / Portre Çekimi", "value": "dogum_bebek", "next_step": "step_fotograf_lokasyon" },
          { "label": "Etkinlik / Parti / Kurumsal Çekim", "value": "etkinlik_party", "next_step": "step_fotograf_lokasyon" },
          { "label": "Emlak / İç Mekan / Otel Çekimi", "value": "emlak_mimari", "next_step": "step_fotograf_lokasyon" }
        ]
      },
      {
        "step_id": "step_fotograf_lokasyon",
        "step_title": "Çekim nerede gerçekleştirilecek?",
        "description": "Çekim mekanını seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Dış Mekan (Plato / Doğa / Tarihi Mekan)", "value": "dis_mekan", "next_step": "step_detaylar" },
          { "label": "Stüdyo Çekimi", "value": "studyo", "next_step": "step_detaylar" },
          { "label": "Etkinlik Salonu / Otel", "value": "salon_otel", "next_step": "step_detaylar" },
          { "label": "Evde / Kendi İş Yerimde", "value": "ev_isyeri", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Çekim tarihi, albüm/video (klip) isteği veya özel detaylarınızı yazınız:",
        "input_type": "textarea",
        "placeholder": "Örn: Dış çekim ve albüm paketi istiyorum, havadan dron çekimi de dahil olsun.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },
  'organizasyon-etkinlik': {
    "category_id": "organizasyon_etkinlik",
    "category_name": "Organizasyon & Etkinlik",
    "steps": [
      {
        "step_id": "step_etkinlik_tur",
        "step_title": "Organizasyon veya etkinlik türünüz nedir?",
        "description": "Planladığınız etkinliği seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Düğün / Nişan / Kına Organizasyonu", "value": "dugun_nisan", "next_step": "step_etkinlik_kisi" },
          { "label": "Doğum Günü / Babyshower / Parti", "value": "dogum_gunu", "next_step": "step_etkinlik_kisi" },
          { "label": "Kurumsal Etkinlik / Lansman / Seminer", "value": "kurumsal", "next_step": "step_etkinlik_kisi" },
          { "label": "Mekan Süsleme / Balon / Ses & Işık", "value": "susleme_ses", "next_step": "step_etkinlik_kisi" },
          { "label": "Catering / Yemek & İkram Hizmeti", "value": "catering", "next_step": "step_etkinlik_kisi" }
        ]
      },
      {
        "step_id": "step_etkinlik_kisi",
        "step_title": "Etkinliğe tahminen kaç kişi katılacak?",
        "description": "Kişi sayısı aralığını seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "1 - 50 Kişilik (Butik Etkinlik)", "value": "1_50", "next_step": "step_detaylar" },
          { "label": "50 - 150 Kişilik", "value": "50_150", "next_step": "step_detaylar" },
          { "label": "150 - 300 Kişilik", "value": "150_300", "next_step": "step_detaylar" },
          { "label": "300+ Kişilik (Büyük Etkinlik)", "value": "300_plus", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Mekan, konsept, müzik/DJ veya özel isteklerinizi yazınız:",
        "input_type": "textarea",
        "placeholder": "Örn: Kır düğünü konseptinde 200 kişilik masa/sandalye giydirme ve orkestra gerekiyor.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },
  'etkinlik': {
    "category_id": "organizasyon_etkinlik",
    "category_name": "Organizasyon & Etkinlik",
    "steps": [
      {
        "step_id": "step_etkinlik_tur",
        "step_title": "Organizasyon veya etkinlik türünüz nedir?",
        "description": "Planladığınız etkinliği seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Düğün / Nişan / Kına Organizasyonu", "value": "dugun_nisan", "next_step": "step_etkinlik_kisi" },
          { "label": "Doğum Günü / Babyshower / Parti", "value": "dogum_gunu", "next_step": "step_etkinlik_kisi" },
          { "label": "Kurumsal Etkinlik / Lansman / Seminer", "value": "kurumsal", "next_step": "step_etkinlik_kisi" },
          { "label": "Mekan Süsleme / Balon / Ses & Işık", "value": "susleme_ses", "next_step": "step_etkinlik_kisi" }
        ]
      },
      {
        "step_id": "step_etkinlik_kisi",
        "step_title": "Etkinliğe tahminen kaç kişi katılacak?",
        "description": "Kişi sayısı.",
        "input_type": "single_select",
        "options": [
          { "label": "1 - 50 Kişilik", "value": "1_50", "next_step": "step_detaylar" },
          { "label": "50 - 150 Kişilik", "value": "50_150", "next_step": "step_detaylar" },
          { "label": "150+ Kişilik", "value": "150_plus", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Detayları yazınız.",
        "input_type": "textarea",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },
  'ic-mimar-dekorasyon': {
    "category_id": "ic_mimar_dekorasyon",
    "category_name": "İç Mimar & Dekorasyon",
    "steps": [
      {
        "step_id": "step_dekorasyon_tur",
        "step_title": "İç mimarlık & dekorasyon hizmet alanınız nedir?",
        "description": "Tasarım yapılacak alanı seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Komple Ev Dekorasyonu & Yenileme", "value": "komple_ev", "next_step": "step_dekorasyon_hizmet" },
          { "label": "Mutfak / Banyo Tasarım & Dekorasyonu", "value": "mutfak_banyo", "next_step": "step_dekorasyon_hizmet" },
          { "label": "Ofis / Mağaza / Kafe / Restoran Dekorasyonu", "value": "isyeri", "next_step": "step_dekorasyon_hizmet" },
          { "label": "Salon / Yatak Odası Dekorasyonu", "value": "tek_oda", "next_step": "step_dekorasyon_hizmet" },
          { "label": "Sadece 3D Çizim & Mimari Görselleştirme", "value": "cizim", "next_step": "step_dekorasyon_hizmet" }
        ]
      },
      {
        "step_id": "step_dekorasyon_hizmet",
        "step_title": "Hangi kapsamda mimarlık hizmeti istiyorsunuz?",
        "description": "Hizmet kapsamını seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Anahtar Teslim Proje Uygulama (Tüm İşçilik Dahil)", "value": "anahtar_teslim", "next_step": "step_detaylar" },
          { "label": "Proje Çizimi & 3D Tasarım Danışmanlığı", "value": "sadece_proje", "next_step": "step_detaylar" },
          { "label": "Stil & Mobilya / Renk Seçimi Danışmanlığı", "value": "danismanlik", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Mekan büyüklüğü (m²), tarz tercihleriniz (modern, klas vb.) veya bütçenizi yazınız:",
        "input_type": "textarea",
        "placeholder": "Örn: 120 m² 3+1 daire için modern tarzda salon ve mutfak tasarımı yaptırmak istiyorum.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },
  'dekorasyon': {
    "category_id": "ic_mimar_dekorasyon",
    "category_name": "İç Mimar & Dekorasyon",
    "steps": [
      {
        "step_id": "step_dekorasyon_tur",
        "step_title": "Dekorasyon hizmet alanı nedir?",
        "description": "Dekorasyon yapılacak alanı seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Komple Ev Dekorasyonu & Yenileme", "value": "komple_ev", "next_step": "step_dekorasyon_hizmet" },
          { "label": "Mutfak / Banyo Dekorasyonu", "value": "mutfak_banyo", "next_step": "step_dekorasyon_hizmet" },
          { "label": "Ofis / İş Yeri Dekorasyonu", "value": "isyeri", "next_step": "step_dekorasyon_hizmet" },
          { "label": "3D Görselleştirme & Proje Çizimi", "value": "cizim", "next_step": "step_dekorasyon_hizmet" }
        ]
      },
      {
        "step_id": "step_dekorasyon_hizmet",
        "step_title": "Hizmet kapsamı nedir?",
        "description": "Kapsamı seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Anahtar Teslim Proje Uygulama", "value": "anahtar_teslim", "next_step": "step_detaylar" },
          { "label": "3D Tasarım & Danışmanlık", "value": "sadece_proje", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Detayları yazınız.",
        "input_type": "textarea",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },
  'dogalgaz-tesisati': {
    "category_id": "dogalgaz_tesisati",
    "category_name": "Doğalgaz Tesisatı",
    "steps": [
      {
        "step_id": "step_dogalgaz_islem",
        "step_title": "Doğalgaz tesisatınız için yapılacak işlem nedir?",
        "description": "İşlem türünü seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Doğalgaz Projesi Çizimi & Gaz Açma Onayı", "value": "proje_gaz_acma", "next_step": "step_detaylar" },
          { "label": "Sıfırdan Daire İçi Tesisat Çekimi", "value": "daire_tesisati", "next_step": "step_detaylar" },
          { "label": "Kombi & Radyatör Bağlantısı / Değişimi", "value": "kombi_radyator", "next_step": "step_detaylar" },
          { "label": "Doğalgaz Kaçağı / Arıza / Tesisat Tamiri", "value": "kacak_tamir", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Bina durumu, daire katı ve isteklerinizi yazınız:",
        "input_type": "textarea",
        "placeholder": "Örn: Dairemize sıfırdan doğalgaz çekilecek ve gaz açma projesi çizilecek.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },
  'mantolama-discephe': {
    "category_id": "mantolama_discephe",
    "category_name": "Mantolama & Dış Cephe",
    "steps": [
      {
        "step_id": "step_mantolama_tur",
        "step_title": "Dış cephe & mantolama hizmet türünüz nedir?",
        "description": "Hizmet türünü seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Dış Cephe Isı Yalıtımı (Mantolama)", "value": "isi_yalitimi", "next_step": "step_detaylar" },
          { "label": "Dış Cephe Boyama & Temizlik", "value": "dis_boya", "next_step": "step_detaylar" },
          { "label": "Çatı İzolasyonu & Su Yalıtımı", "value": "cati_yalitim", "next_step": "step_detaylar" },
          { "label": "Sıva, Derz & Çatlak Tamiratı", "value": "siva_tamir", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Bina kat sayısı, yaklaşık m² veya iskele durumu hakkında detay veriniz:",
        "input_type": "textarea",
        "placeholder": "Örn: 4 katlı binanın dış cephe mantolaması ve boyası yapılacak.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },
  'ofis-temizligi': {
    "category_id": "ofis_temizligi",
    "category_name": "Ofis & İş Yeri Temizliği",
    "steps": [
      {
        "step_id": "step_ofis_temizlik_tur",
        "step_title": "Ofis / iş yeri temizliği kapsamınız nedir?",
        "description": "Temizlik türünü seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Periyodik Ofis Temizliği (Haftalık / Günlük)", "value": "periyodik", "next_step": "step_detaylar" },
          { "label": "İnşaat / Taşınma Sonrası Ofis Temizliği", "value": "insaat_tasinma", "next_step": "step_detaylar" },
          { "label": "Ofis Cam & Dış Cephe Temizliği", "value": "cam_discephe", "next_step": "step_detaylar" },
          { "label": "Ofis Halı & Koltuk Yıkama", "value": "hali_koltuk", "next_step": "step_detaylar" }
        ]
      },
      {
        "step_id": "step_detaylar",
        "step_title": "İhtiyacın detayları neler?",
        "description": "Ofis m², personel sayısı veya özel isteklerinizi yazınız:",
        "input_type": "textarea",
        "placeholder": "Örn: 150 m² ofisimiz için haftada 2 gün düzenli temizlik elemanı arıyoruz.",
        "is_optional": true,
        "next_step": "END"
      }
    ]
  },
  'bilgisayar-temizligi': {
    "category_id": "bilgisayar_temizligi",
    "category_name": "Bilgisayar Temizliği & Fan Bakımı",
    "steps": [
      {
        "step_id": "step_cihaz_turu",
        "step_title": "Temizlenecek cihaz türü nedir?",
        "description": "Cihazın donanım yapısına uygun özel antistatik temizlik yapılır.",
        "input_type": "single_select",
        "options": [
          { "label": "Masaüstü Bilgisayar (Desktop Kasa)", "value": "desktop", "next_step": "step_bakim_islem" },
          { "label": "Dizüstü Laptop / Notebook", "value": "laptop", "next_step": "step_bakim_islem" },
          { "label": "Oyuncu Bilgisayarı (Gaming PC)", "value": "gaming", "next_step": "step_bakim_islem" },
          { "label": "Sunucu / Server Kabini", "value": "server", "next_step": "step_bakim_islem" }
        ]
      },
      {
        "step_id": "step_bakim_islem",
        "step_title": "Hangi bakım ve temizlik işlemleri yapılsın?",
        "description": "Termal performans ve uzun ömürlü kullanım için işlemler.",
        "input_type": "single_select",
        "options": [
          { "label": "Kasa İçi Toz Temizliği & Fan Bakımı", "value": "toz_fan", "next_step": "step_detay_var_mi" },
          { "label": "Termal Macun Yenileme (İşlemci & Ekran Kartı)", "value": "termal_macun", "next_step": "step_detay_var_mi" },
          { "label": "Komple Detaylı İç & Dış Temizlik + Termal Macun", "value": "komple_bakim", "next_step": "step_detay_var_mi" },
          { "label": "Sıvı Teması Temizliği / Oksit Temizleme", "value": "sivi_temasi", "next_step": "step_detay_var_mi" }
        ]
      }
    ]
  },
  'dukkan-temizligi': {
    "category_id": "dukkan_temizligi",
    "category_name": "Dükkan & Mağaza Temizliği",
    "steps": [
      {
        "step_id": "step_dukkan_m2",
        "step_title": "Dükkan / İş yeri alanı yaklaşık kaç m²'dir?",
        "description": "Mekan büyüklüğüne göre personel ve ekipman planlanır.",
        "input_type": "single_select",
        "options": [
          { "label": "50 m²'ye kadar", "value": "50_m2", "next_step": "step_dukkan_kapsam" },
          { "label": "50 - 150 m²", "value": "150_m2", "next_step": "step_dukkan_kapsam" },
          { "label": "150 - 300 m²", "value": "300_m2", "next_step": "step_dukkan_kapsam" },
          { "label": "300 m² ve üzeri", "value": "300_plus_m2", "next_step": "step_dukkan_kapsam" }
        ]
      },
      {
        "step_id": "step_dukkan_kapsam",
        "step_title": "Temizlik neleri kapsasın?",
        "description": "Öncelikli alanları seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Standart Dükkan & Zemin Temizliği", "value": "standart", "next_step": "step_detay_var_mi" },
          { "label": "Vitrin & Dış Cam Temizliği Dahil", "value": "vitrin", "next_step": "step_detay_var_mi" },
          { "label": "Açılış / İnşaat Sonrası Derin Dükkan Temizliği", "value": "insaat", "next_step": "step_detay_var_mi" },
          { "label": "Periyodik Düzenli Dükkan Temizliği", "value": "periyodik", "next_step": "step_detay_var_mi" }
        ]
      }
    ]
  },
  'evde-yemek-pisirme': {
    "category_id": "evde_yemek_pisirme",
    "category_name": "Evde Yemek Pişirme Hizmeti",
    "steps": [
      {
        "step_id": "step_yemek_kapsam",
        "step_title": "Yemek pişirme hizmeti kapsamı nedir?",
        "description": "Aşçı / ev hizmetlisi ihtiyacınızı seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Günlük Ev Yemeği (3-4 Çeşit)", "value": "gunluk", "next_step": "step_kisi_sayisi" },
          { "label": "Haftalık Toplu Yemek Hazırlığı", "value": "haftalik", "next_step": "step_kisi_sayisi" },
          { "label": "Özel Davet / Misafir / Etkinlik Menüsü", "value": "davet", "next_step": "step_kisi_sayisi" },
          { "label": "Diyet / Özel Beslenme Menüsü", "value": "diyet", "next_step": "step_kisi_sayisi" }
        ]
      },
      {
        "step_id": "step_kisi_sayisi",
        "step_title": "Kaç kişilik yemek hazırlanacak?",
        "description": "Porsiyon büyüklüğünü belirlemek için seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "1 - 4 Kişilik", "value": "1_4", "next_step": "step_malzeme_durumu" },
          { "label": "5 - 8 Kişilik", "value": "5_8", "next_step": "step_malzeme_durumu" },
          { "label": "9 - 15 Kişilik", "value": "9_15", "next_step": "step_malzeme_durumu" },
          { "label": "15 Kişi ve Üzeri", "value": "15_plus", "next_step": "step_malzeme_durumu" }
        ]
      },
      {
        "step_id": "step_malzeme_durumu",
        "step_title": "Yemek malzemeleri kim tarafından temin edilecek?",
        "description": "Alışveriş tercihinizi seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Malzemeleri Ben Temin Edeceğim", "value": "ev_sahibi", "next_step": "step_detay_var_mi" },
          { "label": "Malzemeleri Aşçı / Hizmet Veren Alsın", "value": "hizmet_veren", "next_step": "step_detay_var_mi" }
        ]
      }
    ]
  },
  'yaprak-sarma-yapimi': {
    "category_id": "yaprak_sarma_yapimi",
    "category_name": "Yaprak Sarma & Ev Yapımı Mantı / Gıda",
    "steps": [
      {
        "step_id": "step_gida_turu",
        "step_title": "Ne tür ev yapımı gıda / yemek istersiniz?",
        "description": "El emeği yöresel lezzetler.",
        "input_type": "single_select",
        "options": [
          { "label": "Zeytinyağlı Yaprak Sarma", "value": "zeytinyagli_sarma", "next_step": "step_kilo_miktari" },
          { "label": "Etli Yaprak Sarma", "value": "etli_sarma", "next_step": "step_kilo_miktari" },
          { "label": "Ev Yapımı Kayseri Mantısı", "value": "manti", "next_step": "step_kilo_miktari" },
          { "label": "Ev Böreği / Baklava / Çörek", "value": "borek_baklava", "next_step": "step_kilo_miktari" }
        ]
      },
      {
        "step_id": "step_kilo_miktari",
        "step_title": "Yaklaşık sipariş miktarı ne kadardır?",
        "description": "Hazırlanacak kilo miktarını seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "1 - 3 Kilo", "value": "1_3_kg", "next_step": "step_detay_var_mi" },
          { "label": "4 - 7 Kilo", "value": "4_7_kg", "next_step": "step_detay_var_mi" },
          { "label": "8 - 12 Kilo", "value": "8_12_kg", "next_step": "step_detay_var_mi" },
          { "label": "12 Kilo ve Üzeri / Toplu Sipariş", "value": "12_plus_kg", "next_step": "step_detay_var_mi" }
        ]
      }
    ]
  },
  'yatak-yikama': {
    "category_id": "yatak_yikama",
    "category_name": "Yerinde Yatak Yıkama & Dezenfeksiyon",
    "steps": [
      {
        "step_id": "step_yatak_adedi",
        "step_title": "Yıkanacak yatak türü ve adedi nedir?",
        "description": "Vakumlu yüksek hijyenik yıkama yapılır.",
        "input_type": "single_select",
        "options": [
          { "label": "1 Adet Çift Kişilik Yatak", "value": "1_cift", "next_step": "step_yatak_leke" },
          { "label": "2 Adet Çift Kişilik Yatak", "value": "2_cift", "next_step": "step_yatak_leke" },
          { "label": "1 Adet Tek Kişilik Yatak", "value": "1_tek", "next_step": "step_yatak_leke" },
          { "label": "2 Adet Tek Kişilik Yatak", "value": "2_tek", "next_step": "step_yatak_leke" },
          { "label": "Yatak + Baza / Kumaş Başlık Yıkama", "value": "baza_baslik", "next_step": "step_yatak_leke" }
        ]
      },
      {
        "step_id": "step_yatak_leke",
        "step_title": "Yatakta özel leke veya koku problemi var mı?",
        "description": "Özel leke sökücü ve dezenfektan kullanımı içindir.",
        "input_type": "single_select",
        "options": [
          { "label": "Standart Hijyen & Anti-Akar / Mayt Temizliği", "value": "standart", "next_step": "step_detay_var_mi" },
          { "label": "Çay / Kahve / Yiyecek Lekesi", "value": "leke", "next_step": "step_detay_var_mi" },
          { "label": "İdrar / Koku Giderme & Derin Dezenfeksiyon", "value": "idrar_koku", "next_step": "step_detay_var_mi" }
        ]
      }
    ]
  },
  'kuru-temizleme': {
    "category_id": "kuru_temizleme",
    "category_name": "Kuru Temizleme Hizmeti",
    "steps": [
      {
        "step_id": "step_kuru_urun",
        "step_title": "Kuru temizleme yapılacak ürün türü nedir?",
        "description": "Hassas kumaş bakımı yapılır.",
        "input_type": "single_select",
        "options": [
          { "label": "Takım Elbise / Ceket / Pantolon", "value": "takim", "next_step": "step_teslimat_turu" },
          { "label": "Kaban / Palto / Mont / Kuş Tüyü", "value": "mont", "next_step": "step_teslimat_turu" },
          { "label": "Gelinlik / Abiye / Özel Tasarım Elbise", "value": "gelinlik", "next_step": "step_teslimat_turu" },
          { "label": "Perde / Halı / Ev Tekstili", "value": "ev_tekstil", "next_step": "step_teslimat_turu" }
        ]
      },
      {
        "step_id": "step_teslimat_turu",
        "step_title": "Adrese gelip alma ve teslim etme hizmeti istiyor musunuz?",
        "description": "Servis imkanını seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Evet, Adresten Alınsın ve Adrese Teslim Edilsin", "value": "evet_adresten", "next_step": "step_detay_var_mi" },
          { "label": "Hayır, Ürünleri Kendim Dükkana Teslim Edeceğim", "value": "hayir_kendim", "next_step": "step_detay_var_mi" }
        ]
      }
    ]
  },
  'ofis-hali-yikama': {
    "category_id": "ofis_hali_yikama",
    "category_name": "Ofis Halı & Halıflex Yıkama",
    "steps": [
      {
        "step_id": "step_haliflex_m2",
        "step_title": "Yıkanacak halıflex / ofis halısı alanı yaklaşık kaç m²'dir?",
        "description": "Yerinde vakumlu yıkama makineleri ile temizlenir.",
        "input_type": "single_select",
        "options": [
          { "label": "50 m²'ye kadar", "value": "50_m2", "next_step": "step_yikama_zamani" },
          { "label": "50 - 150 m² Arası", "value": "150_m2", "next_step": "step_yikama_zamani" },
          { "label": "150 - 300 m² Arası", "value": "300_m2", "next_step": "step_yikama_zamani" },
          { "label": "300 m² ve Üzeri", "value": "300_plus_m2", "next_step": "step_yikama_zamani" }
        ]
      },
      {
        "step_id": "step_yikama_zamani",
        "step_title": "Yıkama işlemi ne zaman yapılsın?",
        "description": "Ofis çalışma saatlerine göre zamanlama seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Mesai Saatleri İçinde", "value": "mesai_ici", "next_step": "step_detay_var_mi" },
          { "label": "Mesai Saatleri Dışında / Akşam", "value": "aksam", "next_step": "step_detay_var_mi" },
          { "label": "Hafta Sonu (Cumartesi / Pazar)", "value": "hafta_sonu", "next_step": "step_detay_var_mi" }
        ]
      }
    ]
  }
};
