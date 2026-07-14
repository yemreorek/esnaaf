export const SECTOR_PROMPTS: Record<string, string> = {
  'bos-ev-temizligi': `
**Boş Ev Temizliği:**
- Evin eşyasız/boş olması temizlik süresini ve şeklini etkiler. Genellikle taşınma öncesi/sonrası temizliktir.
- İnşaat sonrası veya kiracı sonrası olma durumu kullanılacak kimyasalları değiştirir.
- Müşteriye sor: Evin büyüklüğü (kaç oda, kaç banyo)? Evin boş olma sebebi (sıfır bina, kiracı çıktı vs)?
`,
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
  'hali-yikama': `
**Halı Yıkama:**
- Halı boyutuna ve cinsine göre fiyat değişir.
- Fabrikada yıkama veya yerinde yıkama seçenekleri vardır.
- Müşteriye sor: Kaç metrekare halı? Özel bir kumaş türü mü (ör. el dokuması, ipek)?
`,
  'koltuk-yikama': `
**Koltuk Yıkama:**
- Koltuk takımının boyutuna ve yastık sayısına göre fiyat değişir.
- Genellikle yerinde yıkama makineleri ile yapılır.
- Müşteriye sor: Kaç kişilik koltuk takımı? Sandalye veya yatak da eklenecek mi? Leke durumu nasıl?
`,
  'insaat-sonrasi-temizlik': `
**İnşaat Sonrası Temizlik:**
- İnşaat/tadilat sonrası toz ve moloz temizliği ağır iştir; profesyonel ekipman gerektirir.
- Müşteriye sor: İnşaat mı tadilat sonrası mı? Tahmini alan? Ne zaman bitiyor?
`,
  'fayans-doseme': `
**Fayans Döşeme:**
- Mutfak, banyo, koridor zemin veya duvar fayansı uzmanlığı farklı olabilir.
- Kırım işlemi ayrıca fiyatlandırılabilir.
- Müşteriye sor: Söküm (kırım) var mı? Tahmini metrekare? Kullanılacak malzemenin ebatları büyük mü?
`,
  'parke-doseme': `
**Parke Döşeme:**
- Laminat veya lamine parke için uygulanır, süpürgelik dahil olup olmadığı önemlidir.
- Müşteriye sor: Eski parkenin sökülmesi gerekiyor mu? Tahmini metrekare?
`,
  'hasere-ilaclama': `
**Haşere İlaçlama:**
- Hamamböceği, tahta kurusu, bit, karınca gibi farklı türlere özel çözümler sunulur.
- İlaçlama sonrası evi belirli bir süre havalandırmak gerekir.
- Müşteriye sor: Ev mi iş yeri mi? Haşere türü belli mi? Kaç metrekare alan?
`,
  'bocek-ilaclama': `
**Böcek İlaçlama:**
- Fare, akrep gibi özel kemirgen veya böcek türlerine göre yemleme/ilaçlama yapılır.
- Müşteriye sor: Alanın büyüklüğü nedir? Daha önce ilaçlama yapıldı mı?
`,
  'kombi-servisi': `
**Kombi Servisi:**
- Kombi bakımı yılda en az 1 kez (kış öncesi) yapılmalıdır.
- Arıza durumunda cihazın hata kodunu öğrenmek önemlidir.
- Müşteriye sor: Kombinin markası ve modeli nedir? Sorun nedir (ısıtmıyor, su akıtıyor vb.) veya sadece bakım mı?
`,
  'klima-servisi': `
**Klima Servisi:**
- Klima gaz dolumu, filtre temizliği ve arıza onarımı yapılır.
- Müşteriye sor: Klimanın markası nedir ve kaç BTU? Sadece bakım mı yoksa arıza mı var?
`,
  'mantolama': `
**Mantolama:**
- Dış cephe yalıtımı binaların enerji tasarrufunu artırır.
- Müşteriye sor: Sadece sizin dairenize mi yoksa tüm binaya mı uygulanacak?
`,
  'dis-cephe': `
**Dış Cephe:**
- Dış cephe boya, kaplama, izolasyon işleri kapsanır.
- Müşteriye sor: Binanın kaçıncı katında çalışılacak veya tüm bina mı kaplanacak?
`,
  'marangoz': `
**Marangoz:**
- Kapı, pencere onarımı veya mutfak dolabı gibi sıfırdan imalat veya tamirleri içerir.
- Müşteriye sor: Özel üretim mi yoksa onarım/tamirat işi mi?
`,
  'mobilya-montaji': `
**Mobilya Montajı:**
- Hazır alınan dolap, kitaplık, yatak, TV ünitesi kurulumlarını içerir.
- Müşteriye sor: Kaç parça ürün var? Ürünler demonte şekilde adreste mi?
`,
  'ozel-ders': `
**Özel Ders:**
- Online veya yüz yüze ders seçenekleri mevcuttur.
- Müşteriye sor: Hangi ders/seviye? Yüz yüze mi online mı?
`,
  'cam-balkon': `
**Cam Balkon:**
- Balkon kapatma sistemleri için katlanır, sürme, ısıcamlı gibi seçenekler mevcuttur.
- Müşteriye sor: Isıcamlı mı isteniyor yoksa standart katlanır cam mı? Tahmini ölçü (en ve boy) nedir?
`,
  'pvc-pencere': `
**PVC Pencere:**
- Kapı ve pencerelerin PVC doğrama ile yapılması işleri.
- Müşteriye sor: Kaç pencere/kapı değişecek? Özel bir renk veya marka tercihi var mı?
`,
  'ofis-temizligi': `
**Ofis Temizliği:**
- Ofis, büro veya mağaza temizlik hizmetleri.
- Müşteriye sor: Temizlik mesai saatleri içinde mi dışında mı yapılacak? Düzenli mi yoksa tek seferlik mi?
`,
  'is-yeri-temizligi': `
**İş Yeri Temizliği:**
- Daha geniş fabrika, mağaza, restoran tarzı yerlerin temizliğini kapsar.
- Müşteriye sor: Ne kadar bir alan temizlenecek? Özel temizlik (davlumbaz vs) gerektiren yerler var mı?
`,
  'dogalgaz-tesisati': `
**Doğalgaz Tesisatı:**
- Proje çizimi ve gaz açma süreçlerini kapsar.
- Müşteriye sor: Yeni tesisat mı yoksa tadilat mı? Proje çizimi gerekiyor mu?
`,
  'ic-mimar': `
**İç Mimar:**
- Ev veya iş yeri için mekan tasarımı ve planlaması.
- Müşteriye sor: Tasarım projelendirme mi (3D çizim vb) yoksa komple danışmanlık mı isteniyor?
`,
  'dekorasyon': `
**Dekorasyon:**
- Uygulamalı dekorasyon işlemleri (duvar çıtalama, alçıpan asma tavan vb).
- Müşteriye sor: Uygulama dahil mi? Ne tarz değişiklikler planlanıyor?
`,
  'fotografci': `
**Fotoğrafçı:**
- Dış çekim, düğün fotoğrafı veya ürün çekimi.
- Müşteriye sor: Çekim türü nedir? Ne zaman ve nerede yapılacak?
`,
  'organizasyon': `
**Organizasyon:**
- Düğün, nişan, kına, açılış organizasyonlarını kapsar.
- Müşteriye sor: Etkinlik türü ve tarihi nedir? Davetli sayısı yaklaşık kaçtır?
`,
  'etkinlik': `
**Etkinlik:**
- Daha çok doğum günü, parti, sürpriz etkinlik düzenlemeleri.
- Müşteriye sor: Etkinlik için mekan süslemesi mi animatör/palyaço vb. ek hizmetler mi aranıyor?
`
};
