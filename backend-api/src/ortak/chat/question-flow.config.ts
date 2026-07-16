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
          { "label": "Kiracı çıktı", "value": "tenant_left", "next_step": "END" },
          { "label": "Sıfır ev", "value": "new_building", "next_step": "END" },
          { "label": "Diğer", "value": "other", "next_step": "END" }
        ]
      }
    ]
  }
};
