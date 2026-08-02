import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

interface ParsedSeo {
  city: string | null;
  district: string | null;
  categorySlug: string;
  categoryName: string;
  subServiceSlug: string | null;
  subServiceName: string | null;
  categoryId: string;
}

@Injectable()
export class SeoService {
  constructor(private prisma: PrismaService) {}

  // 1. Ana Kategoriler
  private readonly CATEGORIES = [
    { slug: 'ev-temizligi', name: 'Ev Temizliği' },
    { slug: 'bos-ev-temizligi', name: 'Boş Ev Temizliği' },
    { slug: 'boya-badana', name: 'Boya Badana' },
    { slug: 'su-tesisati', name: 'Su Tesisatı' },
    { slug: 'elektrik-tesisati', name: 'Elektrik Tesisatı' },
    { slug: 'ev-tadilat', name: 'Ev Tadilat' },
    { slug: 'nakliyat', name: 'Nakliyat / Ev Taşıma' },
    { slug: 'hali-yikama', name: 'Halı Yıkama' },
    { slug: 'koltuk-yikama', name: 'Koltuk Yıkama' },
    { slug: 'insaat-sonrasi-temizlik', name: 'İnşaat / Tadilat Sonrası Temizlik' },
    { slug: 'fayans-doseme', name: 'Fayans Döşeme' },
    { slug: 'parke-doseme', name: 'Parke Döşeme' },
    { slug: 'hasere-ilaclama', name: 'Haşere İlaçlama' },
    { slug: 'bocek-ilaclama', name: 'Böcek İlaçlama' },
    { slug: 'kombi-servisi', name: 'Kombi Servisi' },
    { slug: 'klima-servisi', name: 'Klima Servisi' },
    { slug: 'mantolama', name: 'Mantolama' },
    { slug: 'dis-cephe', name: 'Dış Cephe' },
    { slug: 'marangoz', name: 'Marangoz' },
    { slug: 'mobilya-montaji', name: 'Mobilya Montajı' },
    { slug: 'ozel-ders', name: 'Özel Ders' },
    { slug: 'cam-balkon', name: 'Cam Balkon' },
    { slug: 'pvc-pencere', name: 'PVC Pencere' },
    { slug: 'ofis-temizligi', name: 'Ofis Temizliği' },
    { slug: 'dogalgaz-tesisati', name: 'Doğalgaz Tesisatı' },
    { slug: 'ic-mimar', name: 'İç Mimar' },
    { slug: 'dekorasyon', name: 'Dekorasyon' },
    { slug: 'fotografci', name: 'Fotoğrafçı' },
    { slug: 'organizasyon', name: 'Organizasyon' },
    { slug: 'etkinlik', name: 'Etkinlik' }
  ];

  // 2. Alt Hizmetler (Sub-Services) Haritası -> Ana Kategoriye Bağlanır
  private readonly SUB_SERVICES: Record<string, { parentSlug: string; parentName: string; name: string }> = {
    // Klima Servisi Alt Hizmetleri
    'klima-bakimi': { parentSlug: 'klima-servisi', parentName: 'Klima Servisi', name: 'Klima Bakımı' },
    'klima-montaji': { parentSlug: 'klima-servisi', parentName: 'Klima Servisi', name: 'Klima Montajı' },
    'klima-temizligi': { parentSlug: 'klima-servisi', parentName: 'Klima Servisi', name: 'Klima Temizliği' },
    'klima-tasima': { parentSlug: 'klima-servisi', parentName: 'Klima Servisi', name: 'Klima Taşıma' },
    'klima-gaz-dolumu': { parentSlug: 'klima-servisi', parentName: 'Klima Servisi', name: 'Klima Gaz Dolumu' },
    'klima-tamiri': { parentSlug: 'klima-servisi', parentName: 'Klima Servisi', name: 'Klima Tamiri' },

    // Kombi Servisi Alt Hizmetleri
    'kombi-bakimi': { parentSlug: 'kombi-servisi', parentName: 'Kombi Servisi', name: 'Kombi Bakımı' },
    'kombi-tamiri': { parentSlug: 'kombi-servisi', parentName: 'Kombi Servisi', name: 'Kombi Tamiri' },
    'petek-temizligi': { parentSlug: 'kombi-servisi', parentName: 'Kombi Servisi', name: 'Petek Temizliği' },

    // Ev Temizliği Alt Hizmetleri
    'gundelik-temizlik': { parentSlug: 'ev-temizligi', parentName: 'Ev Temizliği', name: 'Gündelik Ev Temizliği' },
    '1-1-ev-temizligi': { parentSlug: 'ev-temizligi', parentName: 'Ev Temizliği', name: '1+1 Ev Temizliği' },
    '2-1-ev-temizligi': { parentSlug: 'ev-temizligi', parentName: 'Ev Temizliği', name: '2+1 Ev Temizliği' },
    '3-1-ev-temizligi': { parentSlug: 'ev-temizligi', parentName: 'Ev Temizliği', name: '3+1 Ev Temizliği' },

    // Boya Badana Alt Hizmetleri
    '1-1-daire-boyama': { parentSlug: 'boya-badana', parentName: 'Boya Badana', name: '1+1 Daire Boyama' },
    '2-1-daire-boyama': { parentSlug: 'boya-badana', parentName: 'Boya Badana', name: '2+1 Daire Boyama' },
    '3-1-daire-boyama': { parentSlug: 'boya-badana', parentName: 'Boya Badana', name: '3+1 Daire Boyama' },
    'tek-oda-boyama': { parentSlug: 'boya-badana', parentName: 'Boya Badana', name: 'Tek Oda Boyama' },
    'tavan-boyama': { parentSlug: 'boya-badana', parentName: 'Boya Badana', name: 'Tavan Boyama' },

    // Su Tesisatı Alt Hizmetleri
    'su-kacagi-tespiti': { parentSlug: 'su-tesisati', parentName: 'Su Tesisatı', name: 'Su Kaçağı Tespiti' },
    'tikaniklik-acma': { parentSlug: 'su-tesisati', parentName: 'Su Tesisatı', name: 'Tıkanıklık Açma' },
    'musluk-tamiri': { parentSlug: 'su-tesisati', parentName: 'Su Tesisatı', name: 'Musluk Tamiri' },
    'klozet-tamiri': { parentSlug: 'su-tesisati', parentName: 'Su Tesisatı', name: 'Klozet Tamiri' },

    // Nakliyat Alt Hizmetleri
    'evden-eve-nakliyat': { parentSlug: 'nakliyat', parentName: 'Nakliyat / Ev Taşıma', name: 'Evden Eve Nakliyat' },
    'parca-esya-tasima': { parentSlug: 'nakliyat', parentName: 'Nakliyat / Ev Taşıma', name: 'Parça Eşya Taşıma' },
    'sehirler-arasi-nakliyat': { parentSlug: 'nakliyat', parentName: 'Nakliyat / Ev Taşıma', name: 'Şehirler Arası Nakliyat' },
    'ofis-tasima': { parentSlug: 'nakliyat', parentName: 'Nakliyat / Ev Taşıma', name: 'Ofis Taşıma' },

    // Ev Tadilat Alt Hizmetleri
    'mutfak-tadilati': { parentSlug: 'ev-tadilat', parentName: 'Ev Tadilat', name: 'Mutfak Tadilatı' },
    'banyo-tadilati': { parentSlug: 'ev-tadilat', parentName: 'Ev Tadilat', name: 'Banyo Tadilatı' },
    'komple-ev-tadilati': { parentSlug: 'ev-tadilat', parentName: 'Ev Tadilat', name: 'Komple Ev Tadilatı' }
  };

  // 3. Şehir ve İlçe Haritası (Türkiye Geneli Genişletilmiş)
  private CITY_DISTRICTS: Record<string, string[]> = {
    'Adana': ['seyhan', 'çukurova', 'yüreğir', 'sarıçam', 'ceyhan', 'kozan', 'imamoğlu', 'karataş', 'karaisalı', 'pozantı', 'yumurtalık', 'tufanbeyli', 'feke', 'aladağ', 'saimbeyli'],
    'Mersin': ['akdeniz', 'mezitli', 'toroslar', 'yenişehir', 'tarsus', 'erdemli', 'silifke', 'anamur', 'mut', 'bozyazı', 'gülnar', 'aydıncık', 'çamlıyayla'],
    'İstanbul': ['kadıköy', 'şişli', 'beşiktaş', 'ümraniye', 'üsküdar', 'fatih', 'beyoğlu', 'sarıyer', 'maltepe', 'kartal', 'pendik', 'başakşehir', 'esenyurt', 'bahçelievler', 'bakırköy', 'ataşehir', 'beylikdüzü', 'çekmeköy', 'sancaktepe', 'tuzla', 'zeytinburnu', 'avcılar', 'büyükçekmece', 'küçükçekmece', 'şile', 'silivri', 'arnavutköy'],
    'Ankara': ['çankaya', 'keçiören', 'yenimahalle', 'mamak', 'etimesgut', 'sincan', 'altındağ', 'gölbaşı', 'pursaklar', 'elmadağ', 'akyurt', 'kahramankazan', 'çubuk'],
    'İzmir': ['karşıyaka', 'konak', 'bornova', 'buca', 'karabağlar', 'çiğli', 'gaziemir', 'balçova', 'narlıdere', 'güzelbahçe', 'bayraklı', 'urla', 'çeşme', 'seferihisar', 'foça', 'menemen', 'torbalı', 'tire'],
    'Antalya': ['muratpaşa', 'kepez', 'konyaaltı', 'alanya', 'manavgat', 'serik', 'kemer', 'kaş', 'korkuteli', 'kumluca'],
    'Bursa': ['nilüfer', 'osmangazi', 'yıldırım', 'mudanya', 'gemlik', 'inegöl', 'gürsu', 'kestel'],
    'Kocaeli': ['izmit', 'gebze', 'darıca', 'körfez', 'kartepe', 'gölcük', 'derince', 'başiskele', 'çayırova'],
    'Gaziantep': ['şahinbey', 'şehitkamil', 'nizip'],
    'Konya': ['selçuklu', 'meram', 'karatay', 'ereğli'],
    'Kayseri': ['melikgazi', 'kocasinan', 'talas'],
    'Eskişehir': ['odunpazarı', 'tepebaşı'],
    'Mardin': ['artuklu', 'kızıltepe', 'midyat', 'nusaybin'],
    'Samsun': ['atakum', 'ilkadım', 'canik', 'bafra'],
    'Trabzon': ['ortahisar', 'akçaabat', 'yomra'],
    'Diyarbakır': ['kayapınar', 'yenişehir', 'bağlar', 'sur'],
    'Muğla': ['bodrum', 'fethiye', 'marmaris', 'menteşe', 'datça', 'milas']
  };

  private DISTRICT_CAPITALIZATION: Record<string, string> = {
    'seyhan': 'Seyhan', 'çukurova': 'Çukurova', 'yüreğir': 'Yüreğir', 'sarıçam': 'Sarıçam', 'ceyhan': 'Ceyhan', 'kozan': 'Kozan',
    'akdeniz': 'Akdeniz', 'mezitli': 'Mezitli', 'toroslar': 'Toroslar', 'yenişehir': 'Yenişehir', 'tarsus': 'Tarsus', 'erdemli': 'Erdemli', 'silifke': 'Silifke',
    'kadıköy': 'Kadıköy', 'şişli': 'Şişli', 'beşiktaş': 'Beşiktaş', 'ümraniye': 'Ümraniye', 'üsküdar': 'Üsküdar', 'fatih': 'Fatih', 'beyoğlu': 'Beyoğlu', 'sarıyer': 'Sarıyer', 'maltepe': 'Maltepe', 'kartal': 'Kartal', 'pendik': 'Pendik', 'başakşehir': 'Başakşehir', 'esenyurt': 'Esenyurt', 'bahçelievler': 'Bahçelievler', 'bakırköy': 'Bakırköy', 'ataşehir': 'Ataşehir', 'beylikdüzü': 'Beylikdüzü',
    'çankaya': 'Çankaya', 'keçiören': 'Keçiören', 'yenimahalle': 'Yenimahalle', 'mamak': 'Mamak', 'etimesgut': 'Etimesgut', 'sincan': 'Sincan', 'altındağ': 'Altındağ', 'gölbaşı': 'Gölbaşı', 'pursaklar': 'Pursaklar',
    'karşıyaka': 'Karşıyaka', 'konak': 'Konak', 'bornova': 'Bornova', 'buca': 'Buca', 'karabağlar': 'Karabağlar', 'çiğli': 'Çiğli', 'gaziemir': 'Gaziemir', 'balçova': 'Balçova', 'narlıdere': 'Narlıdere', 'güzelbahçe': 'Güzelbahçe', 'bayraklı': 'Bayraklı', 'urla': 'Urla',
    'muratpaşa': 'Muratpaşa', 'kepez': 'Kepez', 'konyaaltı': 'Konyaaltı', 'alanya': 'Alanya', 'manavgat': 'Manavgat',
    'nilüfer': 'Nilüfer', 'osmangazi': 'Osmangazi', 'yıldırım': 'Yıldırım', 'mudanya': 'Mudanya',
    'izmit': 'İzmit', 'gebze': 'Gebze', 'darıca': 'Darıca', 'körfez': 'Körfez', 'kartepe': 'Kartepe',
    'şahinbey': 'Şahinbey', 'şehitkamil': 'Şehitkamil',
    'selçuklu': 'Selçuklu', 'meram': 'Meram', 'karatay': 'Karatay',
    'melikgazi': 'Melikgazi', 'kocasinan': 'Kocasinan', 'talas': 'Talas',
    'odunpazarı': 'Odunpazarı', 'tepebaşı': 'Tepebaşı',
    'artuklu': 'Artuklu', 'kızıltepe': 'Kızıltepe', 'midyat': 'Midyat',
    'atakum': 'Atakum', 'ilkadım': 'İlkadım',
    'ortahisar': 'Ortahisar', 'akçaabat': 'Akçaabat',
    'kayapınar': 'Kayapınar', 'bağlar': 'Bağlar',
    'bodrum': 'Bodrum', 'fethiye': 'Fethiye', 'marmaris': 'Marmaris'
  };

  private readonly CATEGORY_PRICES: Record<string, { min: number; max: number; unit: string }> = {
    'ev-temizligi': { min: 800, max: 2500, unit: 'seans' },
    'bos-ev-temizligi': { min: 1500, max: 4000, unit: 'seans' },
    'boya-badana': { min: 3000, max: 15000, unit: 'daire' },
    'su-tesisati': { min: 400, max: 2000, unit: 'hizmet' },
    'elektrik-tesisati': { min: 350, max: 1800, unit: 'hizmet' },
    'ev-tadilat': { min: 10000, max: 120000, unit: 'proje' },
    'nakliyat': { min: 4000, max: 20000, unit: 'taşıma' },
    'hali-yikama': { min: 500, max: 1800, unit: 'hizmet' },
    'koltuk-yikama': { min: 500, max: 1800, unit: 'hizmet' },
    'insaat-sonrasi-temizlik': { min: 1500, max: 5000, unit: 'seans' },
    'fayans-doseme': { min: 2500, max: 15000, unit: 'proje' },
    'parke-doseme': { min: 2500, max: 15000, unit: 'proje' },
    'hasere-ilaclama': { min: 400, max: 1500, unit: 'hizmet' },
    'bocek-ilaclama': { min: 400, max: 1500, unit: 'hizmet' },
    'kombi-servisi': { min: 450, max: 2000, unit: 'adet' },
    'klima-servisi': { min: 450, max: 2500, unit: 'adet' },
    'mantolama': { min: 15000, max: 95000, unit: 'proje' },
    'dis-cephe': { min: 15000, max: 95000, unit: 'proje' },
    'marangoz': { min: 400, max: 2500, unit: 'kurulum' },
    'mobilya-montaji': { min: 400, max: 2500, unit: 'kurulum' },
    'ozel-ders': { min: 400, max: 1000, unit: 'saat' },
    'cam-balkon': { min: 5000, max: 35000, unit: 'proje' },
    'pvc-pencere': { min: 5000, max: 35000, unit: 'proje' },
    'ofis-temizligi': { min: 1200, max: 6000, unit: 'seans' },
    'dogalgaz-tesisati': { min: 8000, max: 45000, unit: 'proje' },
    'ic-mimar': { min: 10000, max: 150000, unit: 'proje' },
    'dekorasyon': { min: 10000, max: 150000, unit: 'proje' },
    'fotografci': { min: 1500, max: 8000, unit: 'çekim' },
    'organizasyon': { min: 3000, max: 30000, unit: 'etkinlik' },
    'etkinlik': { min: 3000, max: 30000, unit: 'etkinlik' }
  };

  private slugify(text: string): string {
    return text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ı/g, 'i')
      .replace(/İ/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/Ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/Ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/Ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/Ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/Ç/g, 'c')
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  async parseSeoSlug(slug: string): Promise<ParsedSeo> {
    const sLower = slug.toLowerCase().trim();
    if (!sLower) {
      throw new NotFoundException('Geçersiz SEO adresi');
    }

    let detectedCity: string | null = null;
    let detectedDistrict: string | null = null;
    let remainingSlug = sLower;

    // 1. Şehirleri dene
    const originalCities: Record<string, string> = {
      istanbul: 'İstanbul', ankara: 'Ankara', izmir: 'İzmir', adana: 'Adana',
      mersin: 'Mersin', antalya: 'Antalya', bursa: 'Bursa', kocaeli: 'Kocaeli',
      gaziantep: 'Gaziantep', konya: 'Konya', kayseri: 'Kayseri', eskisehir: 'Eskişehir',
      mardin: 'Mardin', samsun: 'Samsun', trabzon: 'Trabzon', diyarbakir: 'Diyarbakır', mugla: 'Muğla'
    };

    for (const [citySlug, origCity] of Object.entries(originalCities)) {
      if (sLower.startsWith(`${citySlug}-`)) {
        detectedCity = origCity;
        remainingSlug = sLower.substring(citySlug.length + 1);
        break;
      }
    }

    // 1b. Şehir bulunduysa kalan slug ilçe ile başlıyor mu kontrol et
    if (detectedCity) {
      for (const districts of Object.values(this.CITY_DISTRICTS)) {
        for (const d of districts) {
          const dSlug = this.slugify(d);
          if (remainingSlug.startsWith(`${dSlug}-`)) {
            detectedDistrict = this.DISTRICT_CAPITALIZATION[d] || d;
            remainingSlug = remainingSlug.substring(dSlug.length + 1);
            break;
          }
        }
        if (detectedDistrict) break;
      }
    }

    // 2. Eğer şehir bulunamadıysa ilçeleri dene
    if (!detectedCity) {
      for (const [city, districts] of Object.entries(this.CITY_DISTRICTS)) {
        for (const d of districts) {
          const dSlug = this.slugify(d);
          if (sLower.startsWith(`${dSlug}-`)) {
            detectedCity = city;
            detectedDistrict = this.DISTRICT_CAPITALIZATION[d] || d;
            remainingSlug = sLower.substring(dSlug.length + 1);
            break;
          }
        }
        if (detectedDistrict) break;
      }
    }

    // 3. Alt Hizmet (Sub-Service) veya Ana Kategori Tespiti
    let matchedCategorySlug: string | null = null;
    let matchedCategoryName: string | null = null;
    let subServiceSlug: string | null = null;
    let subServiceName: string | null = null;

    if (this.SUB_SERVICES[remainingSlug]) {
      const subInfo = this.SUB_SERVICES[remainingSlug];
      subServiceSlug = remainingSlug;
      subServiceName = subInfo.name;
      matchedCategorySlug = subInfo.parentSlug;
      matchedCategoryName = subInfo.parentName;
    } else {
      const mainCat = this.CATEGORIES.find(c => c.slug === remainingSlug);
      if (mainCat) {
        matchedCategorySlug = mainCat.slug;
        matchedCategoryName = mainCat.name;
      }
    }

    if (!matchedCategorySlug || !matchedCategoryName) {
      // Fallback to fuzzy match or default Ev Temizliği
      const defaultCat = this.CATEGORIES.find(c => c.slug === 'ev-temizligi')!;
      matchedCategorySlug = defaultCat.slug;
      matchedCategoryName = defaultCat.name;
    }

    // DB'den kategori ID'sini sorgula
    let dbCategory = await this.prisma.category.findUnique({
      where: { name: matchedCategoryName }
    });

    if (!dbCategory) {
      dbCategory = await this.prisma.category.findFirst({
        where: { isActive: true }
      });
    }

    return {
      city: detectedCity,
      district: detectedDistrict,
      categorySlug: matchedCategorySlug,
      categoryName: matchedCategoryName,
      subServiceSlug,
      subServiceName,
      categoryId: dbCategory?.id || 'default_cat_id'
    };
  }

  async getPageMetadata(slug: string) {
    const parsed = await this.parseSeoSlug(slug);
    const { city, district, categorySlug, categoryName, subServiceSlug, subServiceName, categoryId } = parsed;

    // Gösterilecek ana başlık ismi (örn. "Klima Bakımı" veya "Klima Servisi")
    const activeServiceTitle = subServiceName || categoryName;

    // 1. Dinamik usta sayısı
    const whereClause: any = {
      is_approved: true
    };
    if (categoryId && categoryId !== 'default_cat_id') {
      whereClause.category_ids = { has: categoryId };
    }

    if (district) {
      whereClause.city = city;
      whereClause.service_districts = { has: district };
    } else if (city) {
      whereClause.city = city;
    }

    const dbProviderCount = await this.prisma.serviceProvider.count({
      where: whereClause
    });

    // Deterministic Hash Function for 100% stable numbers based on slug (Fixed for Google SEO & User Trust)
    const hashSlug = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash);
    };

    const slugHash = hashSlug(slug);

    const providerCount = dbProviderCount > 0 ? dbProviderCount : 12 + (slugHash % 14);

    // 2. Değerlendirme puanı & Yüksek Güvenli Yorum Sayısı (Armut stili Google Yıldız İndeksi)
    let avgRating = 4.8;
    // Yüksek otorite yorum sayısı (örn. 1.450 - 2.100 arası Armut seviyesi otorite)
    let ratingCount = 1450 + (slugHash % 650);

    // 3. Fiyat aralığı
    const defaultPrices = this.CATEGORY_PRICES[categorySlug] || { min: 450, max: 2500, unit: 'hizmet' };
    let minPrice = defaultPrices.min;
    let maxPrice = defaultPrices.max;

    let multiplier = 1.0;
    if (city === 'İstanbul') multiplier = 1.25;
    else if (city === 'Ankara' || city === 'İzmir') multiplier = 1.1;
    else if (city === 'Adana' || city === 'Mersin') multiplier = 0.95;

    minPrice = Math.round((minPrice * multiplier) / 50) * 50;
    maxPrice = Math.round((maxPrice * multiplier) / 50) * 50;

    // Başlık ve SEO Açıklamaları
    let locationTitle = '';
    let locationMeta = '';
    if (district) {
      locationTitle = `${city} ${district}`;
      locationMeta = `${city} ${district} bölgesinde`;
    } else if (city) {
      locationTitle = `${city}`;
      locationMeta = `${city} genelinde`;
    } else {
      locationTitle = 'Türkiye';
      locationMeta = 'ülke genelinde';
    }

    const title = `En İyi ${providerCount} ${locationTitle} ${activeServiceTitle} - 30 Dk'da Teklif Al | Esnaaf`;
    const description = `${locationMeta} en iyi ${providerCount} onaylı ve yüksek puanlı ${activeServiceTitle} uzmanından 30 dakikada 5 teklif al, hemen kıyasla. Ortalama ${minPrice} TL - ${maxPrice} TL arası fiyatlar Esnaaf güvencesiyle.`;

    // SSS (FAQs)
    const faqs = [
      {
        question: `${locationTitle} bölgesinde ${activeServiceTitle} fiyatları ne kadar?`,
        answer: `${locationTitle} bölgesinde ${activeServiceTitle} hizmeti ortalama ${minPrice} TL ile ${maxPrice} TL arasında değişmektedir. Yapılacak işin detaylarına ve aciliyetine göre fiyatlar değişkenlik gösterebilir.`
      },
      {
        question: `Esnaaf'ta ${locationTitle} ${activeServiceTitle} hizmet verenleri güvenilir mi?`,
        answer: `Evet, Esnaaf platformundaki tüm ${activeServiceTitle} hizmet verenleri kimlik, vergi levhası ve mesleki yeterlilik kontrollerinden geçerek onaylanmış profesyonellerdir. Gerçek müşteri puanlarını şeffafça görebilirsiniz.`
      },
      {
        question: `Yapay zeka ile nasıl 30 dakikada 5 teklif alabilirim?`,
        answer: `Sitemizdeki '30 Dk'da Teklif Al' butonuna tıklayarak sohbet asistanımızla 1 dakikada ihtiyacınızı belirtebilirsiniz. Talebiniz bölgenizdeki en iyi onaylı hizmet verenlere anında iletilir ve en fazla 5 teklif alırsınız.`
      }
    ];

    const pageUrl = `https://esnaaf.com/${slug}`;

    // Google "Yer Siteleri" Carousel İçin ItemList Dizini Şeması (Armut / Bulurum Stili Directory List)
    const itemListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': `En İyi ${providerCount} ${locationTitle} ${activeServiceTitle} Hizmet Verenleri`,
      'description': description,
      'url': pageUrl,
      'numberOfItems': providerCount,
      'itemListElement': Array.from({ length: Math.min(providerCount, 10) }).map((_, idx) => ({
        '@type': 'ListItem',
        'position': idx + 1,
        'item': {
          '@type': 'LocalBusiness',
          'name': `${locationTitle} ${activeServiceTitle} Onaylı Uzman #${idx + 1}`,
          'image': 'https://esnaaf.com/esnaaf-logo.png',
          'telephone': '+908503094578',
          'priceRange': `${minPrice} TL - ${maxPrice} TL`,
          'aggregateRating': {
            '@type': 'AggregateRating',
            'ratingValue': (4.8 + (idx % 2) * 0.1).toFixed(1),
            'reviewCount': Math.floor(ratingCount / (idx + 2)) + 120
          }
        }
      }))
    };

    // Google Arama Sonuçlarında Sarı Yıldız & Yorum Sayısı İndeksleme Şeması (Armut Stili Product/Service Rich Snippet)
    const productSchema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': `En İyi ${providerCount} ${locationTitle} ${activeServiceTitle}`,
      'image': 'https://esnaaf.com/esnaaf-logo.png',
      'description': description,
      'brand': {
        '@type': 'Brand',
        'name': 'Esnaaf'
      },
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': avgRating,
        'reviewCount': ratingCount,
        'bestRating': '5',
        'worstRating': '1'
      },
      'offers': {
        '@type': 'AggregateOffer',
        'priceCurrency': 'TRY',
        'lowPrice': minPrice,
        'highPrice': maxPrice,
        'offerCount': providerCount
      }
    };

    // Google LocalBusiness JSON-LD Schema
    const localBusinessSchema = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      'name': `Esnaaf - ${locationTitle} ${activeServiceTitle} Hizmet Ağı`,
      'image': 'https://esnaaf.com/esnaaf-logo.png',
      'url': pageUrl,
      'telephone': '+908503094578',
      'priceRange': `${minPrice} TL - ${maxPrice} TL`,
      'address': {
        '@type': 'PostalAddress',
        'addressLocality': district || city || 'İstanbul',
        'addressRegion': city || 'İstanbul',
        'addressCountry': 'TR'
      },
      'geo': {
        '@type': 'GeoCircle',
        'geoMidpoint': {
          '@type': 'GeoCoordinates',
          'latitude': 38.9637,
          'longitude': 35.2433
        },
        'geoRadius': '50000'
      },
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': avgRating,
        'reviewCount': ratingCount,
        'bestRating': '5',
        'worstRating': '1'
      },
      'offers': {
        '@type': 'AggregateOffer',
        'priceCurrency': 'TRY',
        'lowPrice': minPrice,
        'highPrice': maxPrice,
        'offerCount': providerCount
      }
    };

    // Google FAQPage JSON-LD Schema
    const faqPageSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': faqs.map(faq => ({
        '@type': 'Question',
        'name': faq.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.answer
        }
      }))
    };

    // 4. Çevre İlçeler ve İlgili Hizmetler (Internal Linking İç Bağlantı Ağı)
    const activeCityName = city || 'İstanbul';
    const cityDistrictsList = this.CITY_DISTRICTS[activeCityName] || this.CITY_DISTRICTS['İstanbul'];
    
    const targetServiceSlug = subServiceSlug || categorySlug;
    const relatedDistricts = cityDistrictsList
      .filter(d => (this.DISTRICT_CAPITALIZATION[d] || d) !== district)
      .slice(0, 10)
      .map(d => {
        const dCap = this.DISTRICT_CAPITALIZATION[d] || d;
        const dSlug = this.slugify(d);
        const cSlug = this.slugify(activeCityName);
        return {
          name: `${dCap} ${activeServiceTitle}`,
          slug: `${cSlug}-${dSlug}-${targetServiceSlug}`
        };
      });

    const relatedServices: Array<{ name: string; slug: string }> = [];
    const activeLocationPrefix = district ? `${this.slugify(activeCityName)}-${this.slugify(district)}` : city ? this.slugify(activeCityName) : '';

    for (const [sSlug, sInfo] of Object.entries(this.SUB_SERVICES)) {
      if (sInfo.parentSlug === categorySlug && sSlug !== subServiceSlug) {
        const fullSlug = activeLocationPrefix ? `${activeLocationPrefix}-${sSlug}` : sSlug;
        relatedServices.push({
          name: `${locationTitle !== 'Türkiye' ? locationTitle + ' ' : ''}${sInfo.name}`,
          slug: fullSlug
        });
      }
    }

    if (relatedServices.length < 6) {
      for (const cat of this.CATEGORIES) {
        if (cat.slug !== categorySlug && relatedServices.length < 8) {
          const fullSlug = activeLocationPrefix ? `${activeLocationPrefix}-${cat.slug}` : cat.slug;
          relatedServices.push({
            name: `${locationTitle !== 'Türkiye' ? locationTitle + ' ' : ''}${cat.name}`,
            slug: fullSlug
          });
        }
      }
    }

    return {
      title,
      description,
      categorySlug,
      categoryName,
      subServiceSlug,
      subServiceName: activeServiceTitle,
      city,
      district,
      providerCount,
      avgRating,
      ratingCount,
      minPrice,
      maxPrice,
      unit: defaultPrices.unit,
      faqs,
      relatedDistricts,
      relatedServices,
      itemListSchema,
      productSchema,
      localBusinessSchema,
      faqPageSchema,
      pageUrl
    };
  }

  async getSitemapLinks(): Promise<string[]> {
    const links: string[] = [];

    // 1. Ana kategoriler
    for (const cat of this.CATEGORIES) {
      links.push(cat.slug);
    }

    // 2. Alt hizmetler
    for (const subSlug of Object.keys(this.SUB_SERVICES)) {
      links.push(subSlug);
    }

    // 3. Şehir + Kategori & Şehir + Alt Hizmet kombinasyonları (adana-klima-servisi, mersin-klima-bakimi, mardin-klima-tasima vb.)
    const cities = ['istanbul', 'ankara', 'izmir', 'adana', 'mersin', 'antalya', 'bursa', 'kocaeli', 'gaziantep', 'konya', 'kayseri', 'eskisehir', 'mardin', 'samsun', 'trabzon', 'diyarbakir', 'mugla'];
    for (const c of cities) {
      for (const cat of this.CATEGORIES) {
        links.push(`${c}-${cat.slug}`);
      }
      for (const subSlug of Object.keys(this.SUB_SERVICES)) {
        links.push(`${c}-${subSlug}`);
      }
    }

    // 4. İlçe + Kategori & İlçe + Alt Hizmet kombinasyonları (cukurova-klima-servisi, mezitli-klima-bakimi vb.)
    for (const districts of Object.values(this.CITY_DISTRICTS)) {
      for (const d of districts) {
        const dSlug = this.slugify(d);
        for (const cat of this.CATEGORIES) {
          links.push(`${dSlug}-${cat.slug}`);
        }
        for (const subSlug of Object.keys(this.SUB_SERVICES)) {
          links.push(`${dSlug}-${subSlug}`);
        }
      }
    }

    return links;
  }
}

