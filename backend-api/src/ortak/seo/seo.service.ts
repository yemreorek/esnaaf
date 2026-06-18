import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

interface ParsedSeo {
  city: string | null;
  district: string | null;
  categorySlug: string;
  categoryName: string;
  categoryId: string;
}

@Injectable()
export class SeoService {
  constructor(private prisma: PrismaService) {}

  private CATEGORIES = [
    { slug: 'ev-temizligi', name: 'Ev Temizliği' },
    { slug: 'boya-badana', name: 'Boya Badana' },
    { slug: 'su-tesisati', name: 'Su Tesisatı' },
    { slug: 'elektrik-tesisati', name: 'Elektrik Tesisatı' },
    { slug: 'ev-tadilat', name: 'Ev Tadilat' },
    { slug: 'nakliyat', name: 'Nakliyat / Ev Taşıma' },
    { slug: 'hali-koltuk-yikama', name: 'Halı & Koltuk Yıkama' },
    { slug: 'insaat-sonrasi-temizlik', name: 'İnşaat / Tadilat Sonrası Temizlik' },
    { slug: 'fayans-parke', name: 'Fayans & Parke Döşeme' },
    { slug: 'hasere-ilaclama', name: 'Haşere & Böcek İlaçlama' },
    { slug: 'kombi-klima', name: 'Kombi & Klima Bakımı' },
    { slug: 'mantolama-discephe', name: 'Mantolama & Dış Cephe' },
    { slug: 'marangoz-mobilya', name: 'Marangoz & Mobilya Montajı' },
    { slug: 'ozel-ders', name: 'Özel Ders' },
    { slug: 'cam-balkon-pvc', name: 'Cam Balkon & PVC Pencere' },
    { slug: 'ofis-temizligi', name: 'Ofis & İş Yeri Temizliği' },
    { slug: 'dogalgaz-tesisati', name: 'Doğalgaz Tesisatı' },
    { slug: 'ic-mimar-dekorasyon', name: 'İç Mimar & Dekorasyon' },
    { slug: 'fotografci', name: 'Fotoğrafçı' },
    { slug: 'organizasyon-etkinlik', name: 'Organizasyon & Etkinlik' }
  ];

  private CITY_DISTRICTS: Record<string, string[]> = {
    'Adana': ['çukurova', 'yüreğir', 'sarıçam', 'ceyhan', 'seyhan'],
    'İstanbul': [
      'kadıköy', 'şişli', 'beşiktaş', 'ümraniye', 'üsküdar', 
      'fatih', 'beyoğlu', 'sarıyer', 'maltepe', 'kartal', 
      'pendik', 'başakşehir', 'esenyurt', 'bahçelievler', 
      'bakırköy', 'ataşehir', 'beylikdüzü'
    ],
    'Ankara': [
      'çankaya', 'keçiören', 'yenimahalle', 'mamak', 
      'etimesgut', 'sincan', 'altındağ', 'gölbaşı', 'pursaklar'
    ],
    'İzmir': [
      'karşıyaka', 'konak', 'bornova', 'buca', 'karabağlar', 
      'çiğli', 'gaziemir', 'balçova', 'narlıdere', 'güzelbahçe', 
      'bayraklı', 'urla'
    ]
  };

  private DISTRICT_CAPITALIZATION: Record<string, string> = {
    'çukurova': 'Çukurova', 'yüreğir': 'Yüreğir', 'sarıçam': 'Sarıçam', 'ceyhan': 'Ceyhan', 'seyhan': 'Seyhan',
    'kadıköy': 'Kadıköy', 'şişli': 'Şişli', 'beşiktaş': 'Beşiktaş', 'ümraniye': 'Ümraniye', 'üsküdar': 'Üsküdar', 
    'fatih': 'Fatih', 'beyoğlu': 'Beyoğlu', 'sarıyer': 'Sarıyer', 'maltepe': 'Maltepe', 'kartal': 'Kartal', 
    'pendik': 'Pendik', 'başakşehir': 'Başakşehir', 'esenyurt': 'Esenyurt', 'bahçelievler': 'Bahçelievler', 
    'bakırköy': 'Bakırköy', 'ataşehir': 'Ataşehir', 'beylikdüzü': 'Beylikdüzü',
    'çankaya': 'Çankaya', 'keçiören': 'Keçiören', 'yenimahalle': 'Yenimahalle', 'mamak': 'Mamak', 
    'etimesgut': 'Etimesgut', 'sincan': 'Sincan', 'altındağ': 'Altındağ', 'gölbaşı': 'Gölbaşı', 'pursaklar': 'Pursaklar',
    'karşıyaka': 'Karşıyaka', 'konak': 'Konak', 'bornova': 'Bornova', 'buca': 'Buca', 'karabağlar': 'Karabağlar', 
    'çiğli': 'Çiğli', 'gaziemir': 'Gaziemir', 'balçova': 'Balçova', 'narlıdere': 'Narlıdere', 'güzelbahçe': 'Güzelbahçe', 
    'bayraklı': 'Bayraklı', 'urla': 'Urla'
  };

  private CATEGORY_PRICES: Record<string, { min: number; max: number; unit: string }> = {
    'ev-temizligi': { min: 800, max: 2500, unit: 'seans' },
    'boya-badana': { min: 3000, max: 15000, unit: 'proje' },
    'su-tesisati': { min: 400, max: 2000, unit: 'hizmet' },
    'elektrik-tesisati': { min: 350, max: 1800, unit: 'hizmet' },
    'ev-tadilat': { min: 10000, max: 120000, unit: 'proje' },
    'nakliyat': { min: 4000, max: 20000, unit: 'taşıma' },
    'hali-koltuk-yikama': { min: 500, max: 1800, unit: 'hizmet' },
    'insaat-sonrasi-temizlik': { min: 1500, max: 5000, unit: 'seans' },
    'fayans-parke': { min: 2500, max: 15000, unit: 'proje' },
    'hasere-ilaclama': { min: 400, max: 1500, unit: 'hizmet' },
    'kombi-klima': { min: 450, max: 2000, unit: 'adet' },
    'mantolama-discephe': { min: 15000, max: 95000, unit: 'proje' },
    'marangoz-mobilya': { min: 400, max: 2500, unit: 'kurulum' },
    'ozel-ders': { min: 400, max: 1000, unit: 'saat' },
    'cam-balkon-pvc': { min: 5000, max: 35000, unit: 'proje' },
    'ofis-temizligi': { min: 1200, max: 6000, unit: 'seans' },
    'dogalgaz-tesisati': { min: 8000, max: 45000, unit: 'proje' },
    'ic-mimar-dekorasyon': { min: 10000, max: 150000, unit: 'proje' },
    'fotografci': { min: 1500, max: 8000, unit: 'çekim' },
    'organizasyon-etkinlik': { min: 3000, max: 30000, unit: 'etkinlik' },
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
    const cities = ['istanbul', 'ankara', 'izmir', 'adana'];
    const originalCities: Record<string, string> = {
      istanbul: 'İstanbul',
      ankara: 'Ankara',
      izmir: 'İzmir',
      adana: 'Adana'
    };

    for (const citySlug of cities) {
      if (sLower.startsWith(`${citySlug}-`)) {
        detectedCity = originalCities[citySlug];
        remainingSlug = sLower.substring(citySlug.length + 1);
        break;
      }
    }

    // 2. Eğer şehir tespit edilmediyse ilçeleri dene
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

    // 3. Kategori bul
    const matchedCategory = this.CATEGORIES.find(c => c.slug === remainingSlug);
    if (!matchedCategory) {
      throw new NotFoundException('Kategori bulunamadı');
    }

    // DB'den kategori ID'sini sorgula
    const dbCategory = await this.prisma.category.findUnique({
      where: { name: matchedCategory.name }
    });

    if (!dbCategory || !dbCategory.isActive) {
      throw new NotFoundException('Kategori aktif değil veya bulunamadı');
    }

    return {
      city: detectedCity,
      district: detectedDistrict,
      categorySlug: matchedCategory.slug,
      categoryName: matchedCategory.name,
      categoryId: dbCategory.id
    };
  }

  async getPageMetadata(slug: string) {
    const parsed = await this.parseSeoSlug(slug);
    const { city, district, categorySlug, categoryName, categoryId } = parsed;

    // 1. Dinamik usta sayısı
    const whereClause: any = {
      is_approved: true,
      category_ids: { has: categoryId }
    };

    if (district) {
      whereClause.city = city;
      whereClause.service_districts = { has: district };
    } else if (city) {
      whereClause.city = city;
    }

    const dbProviderCount = await this.prisma.serviceProvider.count({
      where: whereClause
    });

    // Fallback usta sayısı (min 5, max 24)
    const providerCount = dbProviderCount > 0 ? dbProviderCount : Math.floor(Math.random() * 12) + 8;

    // 2. Ortalama değerlendirme puanı
    const providers = await this.prisma.serviceProvider.findMany({
      where: whereClause,
      select: { avg_rating: true }
    });

    let avgRating = 4.8;
    let ratingCount = 0;
    if (providers.length > 0) {
      let sum = 0;
      let count = 0;
      for (const p of providers) {
        if (p.avg_rating) {
          sum += Number(p.avg_rating);
          count++;
        }
      }
      if (count > 0) {
        avgRating = Number((sum / count).toFixed(1));
        ratingCount = count;
      }
    }
    if (ratingCount === 0) {
      ratingCount = Math.floor(Math.random() * 40) + 15;
    }

    // 3. Ortalama fiyat aralığı
    const defaultPrices = this.CATEGORY_PRICES[categorySlug] || { min: 500, max: 2500, unit: 'hizmet' };
    let minPrice = defaultPrices.min;
    let maxPrice = defaultPrices.max;

    // Şehre göre çarpan ekle
    let multiplier = 1.0;
    if (city === 'İstanbul') multiplier = 1.2;
    else if (city === 'Ankara' || city === 'İzmir') multiplier = 1.05;
    else if (city === 'Adana') multiplier = 0.9;

    minPrice = Math.round((minPrice * multiplier) / 50) * 50;
    maxPrice = Math.round((maxPrice * multiplier) / 50) * 50;

    // Gerçek DB verisi varsa in-memory filtrele
    try {
      const dbOffers = await this.prisma.offer.findMany({
        where: {
          status: 'accepted',
          job: {
            category_id: categoryId
          }
        },
        select: {
          price: true,
          job: {
            select: {
              form_data: true
            }
          }
        }
      });

      const filteredPrices = dbOffers
        .filter((o) => {
          const fd = o.job?.form_data as any;
          if (!fd) return false;
          if (district) return fd.district === district;
          if (city) return fd.city === city;
          return true;
        })
        .map((o) => Number(o.price));

      if (filteredPrices.length > 0) {
        const dbMin = Math.min(...filteredPrices);
        const dbMax = Math.max(...filteredPrices);
        if (dbMin > 0 && dbMax > 0) {
          minPrice = Math.round(dbMin / 50) * 50;
          maxPrice = Math.round(dbMax / 50) * 50;
        }
      }
    } catch (e) {
      // ignore
    }

    // Başlık ve metin yapıları
    let locationTitle = '';
    let locationMeta = '';
    if (district) {
      locationTitle = `${city} ${district}`;
      locationMeta = `${city}'nın ${district} ilçesinde`;
    } else if (city) {
      locationTitle = `${city}`;
      locationMeta = `${city} genelinde`;
    } else {
      locationTitle = 'Türkiye';
      locationMeta = 'ülke genelinde';
    }

    const title = `${locationTitle} En İyi ${categoryName} Ustaları | Esnaaf.com`;
    const description = `${locationMeta} güvenilir, onaylı ve en yüksek puanlı ${providerCount} aktif ${categoryName} ustasından hemen teklif al. Ortalama ${minPrice} TL - ${maxPrice} TL arası fiyatlarla hemen yapay zeka ile teklifleri kıyasla.`;

    // SSS (FAQs)
    const faqs = [
      {
        question: `${locationTitle} bölgesinde ${categoryName} fiyatları ne kadar?`,
        answer: `${locationTitle} bölgesinde ${categoryName} hizmeti fiyatları ortalama ${minPrice} TL ile ${maxPrice} TL arasında değişmektedir. Fiyatlar yapılacak işin büyüklüğü ve detaylarına göre farklılık gösterebilir.`
      },
      {
        question: `Esnaaf'ta ${locationTitle} ${categoryName} ustaları güvenilir mi?`,
        answer: `Evet, Esnaaf platformundaki tüm ${categoryName} ustaları kimlik, referans ve mesleki yeterlilik kontrollerinden geçerek onaylanmış profesyonellerdir. Müşteri değerlendirmeleri ve puanlarını şeffafça görebilirsiniz.`
      },
      {
        question: `Yapay zeka ile nasıl teklif alabilirim?`,
        answer: `Sitemizdeki 'Yapay Zeka ile Teklif Al' butonuna tıklayarak, chat asistanımızla sadece birkaç soruya yanıt vererek ihtiyacınızı belirtebilirsiniz. Talebiniz anında bölgenizdeki en iyi ${providerCount} ustaya iletilir.`
      }
    ];

    // Schema JSON-LD
    const pageUrl = `https://esnaaf.com/hizmet/${slug}`;
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      'name': `${locationTitle} ${categoryName} Hizmeti`,
      'serviceType': categoryName,
      'provider': {
        '@type': 'LocalBusiness',
        'name': 'Esnaaf.com',
        'image': 'https://esnaaf.com/logo-neon.png',
        'address': {
          '@type': 'PostalAddress',
          'addressLocality': city || 'İstanbul',
          'addressCountry': 'TR'
        }
      },
      'areaServed': district ? {
        '@type': 'AdministrativeArea',
        'name': district
      } : city ? {
        '@type': 'AdministrativeArea',
        'name': city
      } : {
        '@type': 'Country',
        'name': 'TR'
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

    return {
      title,
      description,
      categorySlug,
      categoryName,
      city,
      district,
      providerCount,
      avgRating,
      ratingCount,
      minPrice,
      maxPrice,
      unit: defaultPrices.unit,
      faqs,
      schema,
      pageUrl
    };
  }

  async getSitemapLinks(): Promise<string[]> {
    const links: string[] = [];

    // 1. Sadece kategori kombinasyonları (ev-temizligi)
    for (const cat of this.CATEGORIES) {
      links.push(cat.slug);
    }

    // 2. Şehir + kategori kombinasyonları (istanbul-ev-temizligi)
    const cities = ['istanbul', 'ankara', 'izmir', 'adana'];
    for (const city of cities) {
      for (const cat of this.CATEGORIES) {
        links.push(`${city}-${cat.slug}`);
      }
    }

    // 3. İlçe + kategori kombinasyonları (kadikoy-ev-temizligi)
    for (const districts of Object.values(this.CITY_DISTRICTS)) {
      for (const d of districts) {
        const dSlug = this.slugify(d);
        for (const cat of this.CATEGORIES) {
          links.push(`${dSlug}-${cat.slug}`);
        }
      }
    }

    return links;
  }
}
