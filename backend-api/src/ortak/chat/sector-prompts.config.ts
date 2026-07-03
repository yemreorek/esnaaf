export const SECTOR_PROMPTS: Record<string, string> = {
  'ev-temizligi': `
**Ev Temizliği:**
- Standart temizlik (2+1 daire): Yaklaşık 3-4 saat sürer. Fiyatlar evin büyüklüğüne ve temizlik kapsamına göre değişir.
- Detaylı/Derin temizlik: Ütü, buzdolabı içi, fırın temizliği, dolap içleri dahildir ve daha uzun sürer.
- Ek hizmetler: Perde yıkama, cam silimi, balkon yıkama gibi ek işlemler ayrıca fiyatlandırılabilir.
- Müşteriye sor: Kaç odalı ev? Tek seferlik mi periyodik mi? Özel temizlik beklentisi var mı?
`,
  'boya-badana': `
**Boya Badana:**
- 1 odanın boyası ortalama 1-2 gün sürebilir; komple daire boyası birkaç gün alabilir.
- İç cephe ve dış cephe boyası farklıdır; dış cephe hava koşullarına bağlıdır.
- Boya markası ve renk tercihi, ustanın fiyat teklifini önemli ölçüde etkiler.
- Müşteriye sor: Kaç oda? İç boya mı dış boya mı? Tahmini metrekare? Boya markası/renk tercihi var mı?
`,
  'nakliyat': `
**Nakliyat / Ev Taşıma:**
- Asansörlü binalarda taşıma daha hızlı ve ekonomiktir.
- Sigortalı nakliye seçeneği mutlaka sorulmalıdır.
- Ambalajlama hizmeti (koli, streç, balon) ek ücretli olabilir.
- Müşteriye sor: Çıkış/varış ilçeleri, kat ve asansör bilgisi, daire tipi (1+1, 2+1, 3+1), taşınma tarihi.
`,
  'su-tesisati': `
**Su Tesisatı:**
- Acil kaçaklar hemen müdahale gerektirir; ustalar genellikle aynı gün gelebilir.
- Tıkanıklık, sızıntı, musluk değişimi ve boru döşeme farklı uzmanlıklar gerektirebilir.
- Müşteriye sor: Sorun türü (kaçak, tıkanıklık, arıza)? Acil mi? Hangi ilçede?
`,
  'elektrik-tesisati': `
**Elektrik Tesisatı:**
- Priz/anahtar montajı, sigorta arızası, kablo çekimi farklı işlerdir.
- Elektrik arızalarında güvenlik çok önemlidir; yetkili/sertifikalı usta tercihi önerilir.
- Müşteriye sor: İş türü (arıza onarım, yeni tesisat, montaj)? Acil mi?
`,
  'ev-tadilat': `
**Ev Tadilat:**
- Kapsamlı tadilat (mutfak, banyo, komple) birkaç hafta sürebilir.
- Kısmi tadilat (duvar yıkma, bölme, alçıpan) daha kısa sürer.
- Müşteriye sor: Tadilat kapsamı (mutfak, banyo, komple)? Tahmini metrekare?
`,
  'hali-koltuk-yikama': `
**Halı & Koltuk Yıkama:**
- Halı boyutuna ve koltuk sayısına göre fiyat değişir.
- Yerinde yıkama (evde) ve fabrikada yıkama seçenekleri vardır.
- Müşteriye sor: Kaç parça halı/koltuk? Yerinde mi fabrikada mı yıkansın? Leke/kir durumu?
`,
  'insaat-sonrasi-temizlik': `
**İnşaat Sonrası Temizlik:**
- İnşaat/tadilat sonrası toz ve moloz temizliği ağır iştir; profesyonel ekipman gerektirir.
- Müşteriye sor: İnşaat mı tadilat sonrası mı? Tahmini alan? Ne zaman bitiyor?
`,
  'fayans-parke': `
**Fayans & Parke Döşeme:**
- Fayans ve parke farklı uzmanlıklardır; mutfak/banyo fayansı, salon parkesi gibi.
- Müşteriye sor: Fayans mı parke mi? Söküm var mı? Tahmini metrekare?
`,
  'hasere-ilaclama': `
**Haşere & Böcek İlaçlama:**
- Hamamböceği, fare, tahta kurusu, bit gibi haşereler farklı ilaçlama yöntemleri gerektirir.
- İlaçlama sonrası 2-4 saat evi havalandırmak gerekir.
- Müşteriye sor: Haşere türü? Ev mi iş yeri mi? Kaç metrekare alan?
`,
  'kombi-klima': `
**Kombi & Klima Bakımı:**
- Kombi bakımı yılda en az 1 kez yapılmalıdır (kış öncesi idealdir).
- Klima gaz dolumu 2-3 yılda bir gerekebilir; klima temizliği mevsim başında önerilir.
- Marka ve model bilgisi, doğru yedek parça hazırlığı için önemlidir.
- Müşteriye sor: Cihaz türü (kombi/klima)? Marka/model? İşlem türü (bakım, arıza, montaj)?
`,
  'mantolama-discephe': `
**Mantolama & Dış Cephe:**
- Dış cephe mantolama enerji tasarrufu sağlar; bina/daire bazında farklılık gösterir.
- Müşteriye sor: Bina mı daire mi? Kaçıncı kat? Tahmini alan?
`,
  'marangoz-mobilya': `
**Marangoz & Mobilya Montajı:**
- Mutfak dolabı, gardırop, raf, masa gibi işler farklı beceriler gerektirir.
- Müşteriye sor: Ne tür mobilya? Montaj mı, tamir mi, özel imalat mı?
`,
  'ozel-ders': `
**Özel Ders:**
- İnşaat düzeyleri yerine okul düzeylerinde dersler verilebilir.
- Online veya yüz yüze ders seçenekleri mevcuttur.
- Müşteriye sor: Hangi ders/seviye? Yüz yüze mi online mı?
`,
  'cam-balkon-pvc': `
**Cam Balkon & PVC Pencere:**
- Cam balkon ve PVC kaplama işleri bu kategoridedir.
- Müşteriye sor: PVC mi Cam Balkon mu? Yaklaşık ölçü veya adet nedir?
`,
  'ofis-temizligi': `
**Ofis & İş Yeri Temizliği:**
- Ofis temizlik hizmetleri.
- Müşteriye sor: Ofisiniz kaç metrekare? Hafta içi mi hafta sonu mu istersiniz?
`,
  'dogalgaz-tesisati': `
**Doğalgaz Tesisatı:**
- Proje çizimi ve gaz açma süreçlerini kapsar.
- Müşteriye sor: Yeni tesisat mı yoksa tadilat mı? Proje çizimi gerekiyor mu?
`,
  'ic-mimar-dekorasyon': `
**İç Mimar & Dekorasyon:**
- Ev veya iş yeri dekorasyon/mimarlık hizmetleri.
- Müşteriye sor: Uygulama dahil mi, sadece 3D çizim mi istiyorsunuz?
`,
  'fotografci': `
**Fotoğrafçı:**
- Dış çekim, düğün fotoğrafı veya ürün çekimi.
- Müşteriye sor: Çekim türü nedir? Ne zaman ve nerede yapılacak?
`,
  'organizasyon-etkinlik': `
**Organizasyon & Etkinlik:**
- Doğum günü, kına, düğün veya açılış organizasyonu.
- Müşteriye sor: Etkinlik türü nedir? Davetli sayısı yaklaşık kaçtır?
`
};
