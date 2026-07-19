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
  'koltuk-yikama': {
    "category_id": "koltuk_yikama",
    "category_name": "Koltuk Yıkama",
    "steps": [
      {
        "step_id": "step_tekli_koltuk",
        "step_title": "Kaç adet tekli koltuk (veya berjer) yıkanacak?",
        "description": "Tekli koltuk veya berjerlerinizi kapsar.",
        "input_type": "single_select",
        "options": [
          { "label": "0", "value": "0", "next_step": "step_uclu_ikili_koltuk" },
          { "label": "1", "value": "1", "next_step": "step_uclu_ikili_koltuk" },
          { "label": "2", "value": "2", "next_step": "step_uclu_ikili_koltuk" },
          { "label": "3", "value": "3", "next_step": "step_uclu_ikili_koltuk" },
          { "label": "4", "value": "4", "next_step": "step_uclu_ikili_koltuk" },
          { "label": "5+", "value": "5_plus", "next_step": "step_uclu_ikili_koltuk" }
        ]
      },
      {
        "step_id": "step_uclu_ikili_koltuk",
        "step_title": "Kaç tane üçlü / ikili kanepe / çekyat yıkanacak?",
        "description": "Standart ikili, üçlü oturma grupları ve çekyatlar dahildir.",
        "input_type": "single_select",
        "options": [
          { "label": "0", "value": "0", "next_step": "step_kose_koltuk" },
          { "label": "1", "value": "1", "next_step": "step_kose_koltuk" },
          { "label": "2", "value": "2", "next_step": "step_kose_koltuk" },
          { "label": "3", "value": "3", "next_step": "step_kose_koltuk" },
          { "label": "4+", "value": "4_plus", "next_step": "step_kose_koltuk" }
        ]
      },
      {
        "step_id": "step_kose_koltuk",
        "step_title": "Kaç adet L-şeklinde köşe koltuğu yıkanacak?",
        "description": "L koltuk veya köşe takımlarını kapsar.",
        "input_type": "single_select",
        "options": [
          { "label": "0", "value": "0", "next_step": "step_sandalye_var_mi" },
          { "label": "1", "value": "1", "next_step": "step_sandalye_var_mi" },
          { "label": "2", "value": "2", "next_step": "step_sandalye_var_mi" },
          { "label": "3+", "value": "3_plus", "next_step": "step_sandalye_var_mi" }
        ]
      },
      {
        "step_id": "step_sandalye_var_mi",
        "step_title": "Sandalye yıkanacak mı?",
        "description": "Yemek masası, mutfak veya çalışma sandalyeleri.",
        "input_type": "single_select",
        "options": [
          { "label": "Evet", "value": "yes", "next_step": "step_sandalye_sayisi" },
          { "label": "Hayır", "value": "no", "next_step": "step_yatak_var_mi" }
        ]
      },
      {
        "step_id": "step_sandalye_sayisi",
        "step_title": "Kaç adet sandalye yıkanacak?",
        "description": "Yıkanmasını istediğiniz toplam sandalye adedi.",
        "input_type": "single_select",
        "options": [
          { "label": "1", "value": "1", "next_step": "step_yatak_var_mi" },
          { "label": "2", "value": "2", "next_step": "step_yatak_var_mi" },
          { "label": "4", "value": "4", "next_step": "step_yatak_var_mi" },
          { "label": "5", "value": "5", "next_step": "step_yatak_var_mi" },
          { "label": "6", "value": "6", "next_step": "step_yatak_var_mi" },
          { "label": "8", "value": "8", "next_step": "step_yatak_var_mi" },
          { "label": "10+", "value": "10_plus", "next_step": "step_yatak_var_mi" }
        ]
      },
      {
        "step_id": "step_yatak_var_mi",
        "step_title": "Yatak yıkanacak mı?",
        "description": "Evdeki yatakların yıkanma ve hijyen hizmeti.",
        "input_type": "single_select",
        "options": [
          { "label": "Evet", "value": "yes", "next_step": "step_yatak_tipi" },
          { "label": "Hayır", "value": "no", "next_step": "step_ekstra_detay_var_mi" }
        ]
      },
      {
        "step_id": "step_yatak_tipi",
        "step_title": "Yıkanacak yatak hangi tipte?",
        "description": "Lütfen yatak türünü seçiniz.",
        "input_type": "single_select",
        "options": [
          { "label": "Tek Kişilik Yatak", "value": "single", "next_step": "step_tek_kisilik_yatak_sayisi" },
          { "label": "Çift Kişilik Yatak", "value": "double", "next_step": "step_cift_kisilik_yatak_sayisi" }
        ]
      },
      {
        "step_id": "step_tek_kisilik_yatak_sayisi",
        "step_title": "Kaç adet tek kişilik yatak yıkanacak?",
        "description": "Eni 130 cm'den az olan yataklar için geçerlidir.",
        "input_type": "single_select",
        "options": [
          { "label": "1", "value": "1", "next_step": "step_ekstra_detay_var_mi" },
          { "label": "2", "value": "2", "next_step": "step_ekstra_detay_var_mi" },
          { "label": "3+", "value": "3_plus", "next_step": "step_ekstra_detay_var_mi" }
        ]
      },
      {
        "step_id": "step_cift_kisilik_yatak_sayisi",
        "step_title": "Kaç adet çift kişilik yatak yıkanacak?",
        "description": "Geniş yataklar ve çift kişilik standart yatak modelleri.",
        "input_type": "single_select",
        "options": [
          { "label": "1", "value": "1", "next_step": "step_ekstra_detay_var_mi" },
          { "label": "2", "value": "2", "next_step": "step_ekstra_detay_var_mi" },
          { "label": "3+", "value": "3_plus", "next_step": "step_ekstra_detay_var_mi" }
        ]
      },
      {
        "step_id": "step_ekstra_detay_var_mi",
        "step_title": "Ustanın bilmesi gereken ekstra bir detay veya leke var mı?",
        "description": "Özel kumaş türü, çıkmayan zorlu lekeler veya evcil hayvan idrar durumu.",
        "input_type": "single_select",
        "options": [
          { "label": "Evet", "value": "yes", "next_step": "step_ekstra_detay_text" },
          { "label": "Hayır", "value": "no", "next_step": "END" }
        ]
      },
      {
        "step_id": "step_ekstra_detay_text",
        "step_title": "Lütfen eklemek istediğiniz detayları buraya yazınız:",
        "description": "Örn: Kanepe kolunda kahve lekesi var, yatakta evcil hayvan tüyü yoğun.",
        "input_type": "textarea",
        "placeholder": "Detayları buraya giriniz...",
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
  }
};
