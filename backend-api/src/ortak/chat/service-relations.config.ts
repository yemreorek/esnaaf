export interface SubServiceItem {
  slug: string;
  title: string;
  categorySlug: string;
}

export interface ServiceCluster {
  clusterId: string;
  name: string;
  icon: string;
  primarySlugs: string[];
  subservices: SubServiceItem[];
}

export const SERVICE_CLUSTERS: ServiceCluster[] = [
  {
    clusterId: 'ilaclama-dezenfeksiyon',
    name: 'İlaçlama & Dezenfeksiyon',
    icon: 'pest_control',
    primarySlugs: ['bocek-ilaclama', 'ev-ilaclama', 'hasere-ilaclama'],
    subservices: [
      { slug: 'bocek-ilaclama', title: 'Böcek & Haşere İlaçlama', categorySlug: 'hasere-ilaclama' },
      { slug: 'ev-ilaclama', title: 'Ev İlaçlama', categorySlug: 'hasere-ilaclama' },
      { slug: 'hasere-ilaclama', title: 'Haşere İlaçlama', categorySlug: 'hasere-ilaclama' },
      { slug: 'tahtakurusu-ilaclama', title: 'Tahtakurusu İlaçlama', categorySlug: 'hasere-ilaclama' },
      { slug: 'fare-ilaclama', title: 'Fare İlaçlama', categorySlug: 'hasere-ilaclama' },
      { slug: 'bahce-ilaclama', title: 'Bahçe İlaçlama', categorySlug: 'hasere-ilaclama' },
      { slug: 'dezenfeksiyon', title: 'Dezenfeksiyon Hizmeti', categorySlug: 'hasere-ilaclama' },
    ],
  },
  {
    clusterId: 'ev-mekan-temizligi',
    name: 'Ev & Mekan Temizliği',
    icon: 'cleaning_services',
    primarySlugs: ['ev-temizligi', 'bos-ev-temizligi', 'insaat-sonrasi-temizlik'],
    subservices: [
      { slug: 'ev-temizligi', title: 'Ev Temizliği', categorySlug: 'ev-temizligi' },
      { slug: 'bos-ev-temizligi', title: 'Boş Ev Temizliği', categorySlug: 'ev-temizligi' },
      { slug: 'insaat-sonrasi-temizlik', title: 'İnşaat Sonrası Temizlik', categorySlug: 'ev-temizligi' },
      { slug: 'tasinma-oncesi-temizlik', title: 'Taşınma Öncesi Temizlik', categorySlug: 'ev-temizligi' },
      { slug: 'buharli-ev-temizligi', title: 'Buharlı Temizlik Hizmeti', categorySlug: 'ev-temizligi' },
      { slug: 'gundelikci-temizlik', title: 'Gündelikçi Temizlik Hizmeti', categorySlug: 'ev-temizligi' },
    ],
  },
  {
    clusterId: 'bina-dis-cephe',
    name: 'Bina, İş Yeri & Dış Cephe Temizliği',
    icon: 'corporate_fare',
    primarySlugs: ['merdiven-temizligi', 'apartman-temizligi', 'dis-cephe-cam-silme', 'ofis-temizligi'],
    subservices: [
      { slug: 'merdiven-temizligi', title: 'Merdiven Temizliği', categorySlug: 'ev-temizligi' },
      { slug: 'apartman-temizligi', title: 'Apartman Temizliği', categorySlug: 'ev-temizligi' },
      { slug: 'dis-cephe-cam-silme', title: 'Dış Cephe Cam Silme', categorySlug: 'ev-temizligi' },
      { slug: 'cam-temizligi', title: 'Cam Silme & Temizliği', categorySlug: 'ev-temizligi' },
      { slug: 'dukkan-temizligi', title: 'Dükkan Temizliği', categorySlug: 'ev-temizligi' },
      { slug: 'ofis-temizligi', title: 'Ofis Temizliği', categorySlug: 'ev-temizligi' },
      { slug: 'is-yeri-temizligi', title: 'İş Yeri Temizliği', categorySlug: 'ev-temizligi' },
      { slug: 'mermer-cilalama', title: 'Mermer Silim ve Cilalama', categorySlug: 'ev-temizligi' },
      { slug: 'su-deposu-temizligi', title: 'Su Deposu Temizliği', categorySlug: 'ev-temizligi' },
    ],
  },
  {
    clusterId: 'koltuk-tekstil-yikama',
    name: 'Koltuk & Tekstil Yıkama',
    icon: 'dry_cleaning',
    primarySlugs: ['koltuk-yikama', 'hali-yikama', 'yatak-yikama'],
    subservices: [
      { slug: 'koltuk-yikama', title: 'Koltuk Yıkama', categorySlug: 'koltuk-yikama' },
      { slug: 'yatak-yikama', title: 'Yatak Yıkama', categorySlug: 'koltuk-yikama' },
      { slug: 'hali-yikama', title: 'Halı Yıkama', categorySlug: 'hali-yikama' },
      { slug: 'arac-koltuk-yikama', title: 'Yerinde Araç Koltuk Yıkama', categorySlug: 'koltuk-yikama' },
      { slug: 'stor-perde-yikama', title: 'Stor & Zebra Perde Yıkama', categorySlug: 'koltuk-yikama' },
      { slug: 'kuru-temizleme', title: 'Kuru Temizleme', categorySlug: 'ev-temizligi' },
      { slug: 'evde-utu-hizmeti', title: 'Evde Ütü Hizmeti', categorySlug: 'ev-temizligi' },
    ],
  },
  {
    clusterId: 'iklimlendirme-isitma',
    name: 'İklimlendirme & Isıtma',
    icon: 'ac_unit',
    primarySlugs: ['klima-servisi', 'kombi-servisi'],
    subservices: [
      { slug: 'klima-servisi', title: 'Klima Servisi', categorySlug: 'klima-servisi' },
      { slug: 'klima-montaj', title: 'Klima Montajı', categorySlug: 'klima-servisi' },
      { slug: 'klima-tamir', title: 'Klima Tamiri', categorySlug: 'klima-servisi' },
      { slug: 'klima-bakim', title: 'Klima Bakımı', categorySlug: 'klima-servisi' },
      { slug: 'klima-gaz-dolumu', title: 'Klima Gaz Dolumu', categorySlug: 'klima-servisi' },
      { slug: 'vrf-klima', title: 'VRF Klima Servisi', categorySlug: 'klima-servisi' },
      { slug: 'kombi-servisi', title: 'Kombi Servisi', categorySlug: 'kombi-servisi' },
      { slug: 'kombi-bakim', title: 'Kombi Bakımı', categorySlug: 'kombi-servisi' },
      { slug: 'petek-temizligi', title: 'Petek Temizliği', categorySlug: 'kombi-servisi' },
    ],
  },
  {
    clusterId: 'su-dogalgaz-tesisati',
    name: 'Su & Doğalgaz Tesisatı',
    icon: 'plumbing',
    primarySlugs: ['su-tesisati', 'dogalgaz-tesisati'],
    subservices: [
      { slug: 'su-tesisati', title: 'Su Tesisatı', categorySlug: 'su-tesisati' },
      { slug: 'su-kacagi-tespiti', title: 'Su Kaçağı Tespiti', categorySlug: 'su-tesisati' },
      { slug: 'tikaniklik-acma', title: 'Tıkanıklık Açma', categorySlug: 'su-tesisati' },
      { slug: 'musluk-batarya-degisimi', title: 'Musluk / Batarya Değişimi', categorySlug: 'su-tesisati' },
      { slug: 'dogalgaz-tesisati', title: 'Doğalgaz Tesisatı', categorySlug: 'dogalgaz-tesisati' },
      { slug: 'kalorifer-tesisati', title: 'Kalorifer Tesisatı', categorySlug: 'su-tesisati' },
    ],
  },
  {
    clusterId: 'elektrik-aydinlatma',
    name: 'Elektrik & Aydınlatma',
    icon: 'electrical_services',
    primarySlugs: ['elektrik-tesisati'],
    subservices: [
      { slug: 'elektrik-tesisati', title: 'Elektrik Tesisatı', categorySlug: 'elektrik-tesisati' },
      { slug: 'avize-montaji', title: 'Avize Montajı', categorySlug: 'elektrik-tesisati' },
      { slug: 'priz-anahtar-degisimi', title: 'Priz / Anahtar Değişimi', categorySlug: 'elektrik-tesisati' },
      { slug: 'internet-kablo-cekimi', title: 'İnternet & Kablo Çekimi', categorySlug: 'elektrik-tesisati' },
      { slug: 'sigorta-ariza-tamiri', title: 'Sigorta Arıza Tamiri', categorySlug: 'elektrik-tesisati' },
      { slug: 'diafon-montaji', title: 'Görüntülü Diafon Montajı', categorySlug: 'elektrik-tesisati' },
    ],
  },
  {
    clusterId: 'boya-badana-duvar',
    name: 'Boya, Badana & Duvar',
    icon: 'format_paint',
    primarySlugs: ['boya-badana'],
    subservices: [
      { slug: 'boya-badana', title: 'Boya Badana', categorySlug: 'boya-badana' },
      { slug: 'ic-cephe-boyama', title: 'İç Cephe Boyama', categorySlug: 'boya-badana' },
      { slug: 'dis-cephe-boyama', title: 'Dış Cephe Boyama', categorySlug: 'boya-badana' },
      { slug: 'duvar-kagidi-doseme', title: 'Duvar Kağıdı Döşeme', categorySlug: 'boya-badana' },
      { slug: 'alcipan-kartonpiyer', title: 'Alçıpan & Kartonpiyer', categorySlug: 'boya-badana' },
    ],
  },
  {
    clusterId: 'zemin-kaplama',
    name: 'Zemin & Kaplama',
    icon: 'grid_view',
    primarySlugs: ['fayans-doseme', 'parke-doseme'],
    subservices: [
      { slug: 'fayans-doseme', title: 'Fayans Döşeme', categorySlug: 'fayans-doseme' },
      { slug: 'parke-doseme', title: 'Parke Döşeme', categorySlug: 'parke-doseme' },
      { slug: 'mermer-doseme', title: 'Mermer Döşeme', categorySlug: 'fayans-doseme' },
      { slug: 'epoksi-kaplama', title: 'Epoksi Zemin Kaplama', categorySlug: 'fayans-doseme' },
      { slug: 'supurgelik-montaji', title: 'Süpürgelik Montajı', categorySlug: 'parke-doseme' },
    ],
  },
  {
    clusterId: 'ev-tadilat-yapi',
    name: 'Ev Tadilat & Yapı',
    icon: 'construction',
    primarySlugs: ['ev-tadilat', 'mantolama'],
    subservices: [
      { slug: 'ev-tadilat', title: 'Ev Tadilat', categorySlug: 'ev-tadilat' },
      { slug: 'mutfak-tadilati', title: 'Mutfak Tadilatı', categorySlug: 'ev-tadilat' },
      { slug: 'banyo-tadilati', title: 'Banyo Tadilatı', categorySlug: 'ev-tadilat' },
      { slug: 'ic-mimar', title: 'İç Mimar', categorySlug: 'ic-mimar' },
      { slug: 'dekorasyon', title: 'Dekorasyon', categorySlug: 'dekorasyon' },
      { slug: 'mantolama', title: 'Mantolama', categorySlug: 'mantolama' },
      { slug: 'dis-cephe', title: 'Dış Cephe', categorySlug: 'dis-cephe' },
    ],
  },
  {
    clusterId: 'tasima-nakliyat',
    name: 'Taşıma & Nakliyat',
    icon: 'local_shipping',
    primarySlugs: ['nakliyat'],
    subservices: [
      { slug: 'nakliyat', title: 'Nakliyat / Ev Taşıma', categorySlug: 'nakliyat' },
      { slug: 'sehirler-arasi-nakliyat', title: 'Şehirler Arası Nakliyat', categorySlug: 'nakliyat' },
      { slug: 'parca-esya-tasima', title: 'Parça Eşya Taşıma', categorySlug: 'nakliyat' },
      { slug: 'asansorlu-nakliyat', title: 'Asansörlü Nakliyat', categorySlug: 'nakliyat' },
      { slug: 'ofis-tasima', title: 'Ofis Taşıma', categorySlug: 'nakliyat' },
    ],
  },
  {
    clusterId: 'marangoz-mobilya',
    name: 'Marangoz & Mobilya',
    icon: 'carpenter',
    primarySlugs: ['marangoz', 'mobilya-montaji'],
    subservices: [
      { slug: 'marangoz', title: 'Marangoz', categorySlug: 'marangoz' },
      { slug: 'mobilya-montaji', title: 'Mobilya Montajı', categorySlug: 'mobilya-montaji' },
      { slug: 'mobilya-tamiri', title: 'Mobilya Tamiri', categorySlug: 'marangoz' },
      { slug: 'ozel-imalat-dolap', title: 'Özel İmalat Dolap', categorySlug: 'marangoz' },
    ],
  },
  {
    clusterId: 'cam-pvc-yapi',
    name: 'Cam, PVC & Yapı',
    icon: 'window',
    primarySlugs: ['cam-balkon', 'pvc-pencere'],
    subservices: [
      { slug: 'cam-balkon', title: 'Cam Balkon', categorySlug: 'cam-balkon' },
      { slug: 'pvc-pencere', title: 'PVC Pencere', categorySlug: 'pvc-pencere' },
      { slug: 'sineklik-montaji', title: 'Sineklik Montajı', categorySlug: 'pvc-pencere' },
      { slug: 'otomatik-kepenk', title: 'Otomatik Kepenk', categorySlug: 'cam-balkon' },
    ],
  },
  {
    clusterId: 'yemek-ev-isleri',
    name: 'Yemek & Ev İşleri',
    icon: 'restaurant',
    primarySlugs: ['evde-yemek-pisirme', 'yaprak-sarma-yapimi'],
    subservices: [
      { slug: 'evde-yemek-pisirme', title: 'Evde Yemek Pişirme', categorySlug: 'evde-yemek-pisirme' },
      { slug: 'yaprak-sarma-yapimi', title: 'Yaprak Sarma & Mantı Yapımı', categorySlug: 'yaprak-sarma-yapimi' },
      { slug: 'davet-yemegi', title: 'Davet & Organizasyon Yemeği', categorySlug: 'evde-yemek-pisirme' },
    ],
  },
  {
    clusterId: 'egitim-ozel-ders',
    name: 'Eğitim & Özel Ders',
    icon: 'school',
    primarySlugs: ['ozel-ders'],
    subservices: [
      { slug: 'ozel-ders', title: 'Özel Ders', categorySlug: 'ozel-ders' },
      { slug: 'matematik-ozel-ders', title: 'Matematik Özel Ders', categorySlug: 'ozel-ders' },
      { slug: 'ingilizce-ozel-ders', title: 'İngilizce Özel Ders', categorySlug: 'ozel-ders' },
      { slug: 'direksiyon-dersi', title: 'Direksiyon Dersi', categorySlug: 'ozel-ders' },
    ],
  },
  {
    clusterId: 'fotograf-organizasyon',
    name: 'Fotoğraf & Video & Organizasyon',
    icon: 'photo_camera',
    primarySlugs: ['fotografci', 'organizasyon', 'etkinlik', 'dugun-fotografcisi'],
    subservices: [
      { slug: 'fotografci', title: 'Fotoğrafçı', categorySlug: 'fotografci' },
      { slug: 'dis-cekim-fotograf', title: 'Dış Çekim Fotoğraf', categorySlug: 'fotografci' },
      { slug: 'dogum-gunu-fotografcisi', title: 'Doğum Günü Fotoğrafçısı', categorySlug: 'fotografci' },
      { slug: 'drone-cekimi', title: 'Drone Çekimi', categorySlug: 'fotografci' },
      { slug: 'dugun-fotografcisi', title: 'Düğün Fotoğrafçısı', categorySlug: 'fotografci' },
      { slug: 'dugun-video-cekimi', title: 'Düğün Video Çekimi', categorySlug: 'fotografci' },
      { slug: 'urun-fotografciligi', title: 'Ürün Fotoğrafçılığı', categorySlug: 'fotografci' },
      { slug: 'katalog-cekimi', title: 'Katalog Çekimi', categorySlug: 'fotografci' },
      { slug: 'sunnet-fotografcisi', title: 'Sünnet Fotoğrafçısı', categorySlug: 'fotografci' },
      { slug: 'nisan-fotografcisi', title: 'Nişan Fotoğrafçısı', categorySlug: 'fotografci' },
      { slug: 'klip-cekimi', title: 'Klip Çekimi', categorySlug: 'fotografci' },
      { slug: 'reklam-filmi-cekimi', title: 'Reklam Filmi Çekimi', categorySlug: 'fotografci' },
      { slug: 'organizasyon', title: 'Organizasyon', categorySlug: 'organizasyon' },
      { slug: 'etkinlik', title: 'Etkinlik', categorySlug: 'etkinlik' },
    ],
  },
  {
    clusterId: 'oto-arac',
    name: 'Oto ve Araç Bakım',
    icon: 'directions_car',
    primarySlugs: ['oto-tamir', 'oto-kuafor', 'oto-lastik', 'oto-ekspertiz'],
    subservices: [
      { slug: 'arac-bakim', title: 'Araç Bakım', categorySlug: 'oto-tamir' },
      { slug: 'arac-kaplama', title: 'Araç Kaplama', categorySlug: 'oto-tamir' },
      { slug: 'arac-koltuk-temizleme', title: 'Araç Koltuk Temizleme', categorySlug: 'oto-kuafor' },
      { slug: 'arac-koltuk-yikama', title: 'Araç Koltuk Yıkama', categorySlug: 'oto-kuafor' },
      { slug: 'arac-ppf-kaplama', title: 'Araç PPF Kaplama', categorySlug: 'oto-tamir' },
      { slug: 'balata-degisimi', title: 'Balata Değişimi', categorySlug: 'oto-tamir' },
      { slug: 'baski-balata-degisimi', title: 'Baskı Balata Değişimi', categorySlug: 'oto-tamir' },
      { slug: 'boyasiz-gocuk-duzeltme', title: 'Boyasız Göçük Düzeltme', categorySlug: 'oto-tamir' },
      { slug: 'cam-filmi', title: 'Cam Filmi', categorySlug: 'oto-tamir' },
      { slug: 'detayli-arac-temizligi', title: 'Detaylı Araç Temizliği', categorySlug: 'oto-kuafor' },
      { slug: 'frenci', title: 'Frenci', categorySlug: 'oto-tamir' },
      { slug: 'lastikci', title: 'Lastikçi', categorySlug: 'oto-lastik' },
      { slug: 'motor-contasi-degisimi', title: 'Motor Contası Değişimi', categorySlug: 'oto-tamir' },
      { slug: 'motor-rektifiye', title: 'Motor Rektifiye', categorySlug: 'oto-tamir' },
      { slug: 'motor-tamiri', title: 'Motor Tamiri', categorySlug: 'oto-tamir' },
      { slug: 'motor-yag-degisimi', title: 'Motor Yağ Değişimi', categorySlug: 'oto-tamir' },
      { slug: 'oto-boya', title: 'Oto Boya', categorySlug: 'oto-tamir' },
      { slug: 'oto-cam-filmi', title: 'Oto Cam Filmi', categorySlug: 'oto-tamir' },
      { slug: 'oto-cam-tamiri', title: 'Oto Cam Tamiri', categorySlug: 'oto-tamir' },
      { slug: 'oto-ekspertiz', title: 'Oto Ekspertiz', categorySlug: 'oto-ekspertiz' },
      { slug: 'oto-elektrik', title: 'Oto Elektrik', categorySlug: 'oto-tamir' },
      { slug: 'oto-kaporta-boya', title: 'Oto Kaporta Boya', categorySlug: 'oto-tamir' },
      { slug: 'oto-klima', title: 'Oto Klima', categorySlug: 'oto-tamir' },
      { slug: 'oto-klima-gazi-dolumu', title: 'Oto Klima Gazı Dolumu', categorySlug: 'oto-tamir' },
      { slug: 'oto-kuafor', title: 'Oto Kuaför', categorySlug: 'oto-kuafor' },
      { slug: 'oto-lastik', title: 'Oto Lastik', categorySlug: 'oto-lastik' },
      { slug: 'oto-tamir', title: 'Oto Tamir', categorySlug: 'oto-tamir' },
      { slug: 'pasta-cila', title: 'Pasta Cila', categorySlug: 'oto-kuafor' },
      { slug: 'ppf-kaplama', title: 'PPF Kaplama', categorySlug: 'oto-tamir' },
      { slug: 'seramik-kaplama', title: 'Seramik Kaplama', categorySlug: 'oto-kuafor' },
      { slug: 'tampon-boyama', title: 'Tampon Boyama', categorySlug: 'oto-tamir' },
      { slug: 'tampon-tamiri', title: 'Tampon Tamiri', categorySlug: 'oto-tamir' },
      { slug: 'triger-seti-degisimi', title: 'Triger Seti Değişimi', categorySlug: 'oto-tamir' },
      { slug: 'yag-degisimi', title: 'Yağ Değişimi', categorySlug: 'oto-tamir' },
    ],
  },
];

/**
 * Returns all subservices flattened with title and slug
 */
export function getAllSubservices(): SubServiceItem[] {
  const result: SubServiceItem[] = [];
  const set = new Set<string>();

  for (const cluster of SERVICE_CLUSTERS) {
    for (const sub of cluster.subservices) {
      if (!set.has(sub.slug)) {
        set.add(sub.slug);
        result.push(sub);
      }
    }
  }
  return result;
}

/**
 * Given any service slug, returns all related subservices in the same cluster
 */
export function getRelatedSubservices(slug: string): SubServiceItem[] {
  if (!slug) return [];
  const targetCluster = SERVICE_CLUSTERS.find(
    (c) => c.primarySlugs.includes(slug) || c.subservices.some((s) => s.slug === slug),
  );
  if (!targetCluster) return [];
  return targetCluster.subservices;
}
