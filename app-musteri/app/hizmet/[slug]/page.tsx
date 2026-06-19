import { notFound } from "next/navigation";
import Link from "next/link";
import SeoPageClient from "../../../components/SeoPageClient";
import ReviewsSlider from "../../../components/ReviewsSlider";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

// Category-specific high-quality background images matching the category theme
const CATEGORY_HERO_IMAGES: Record<string, string> = {
  'boya-badana': 'https://lh3.googleusercontent.com/aida-public/AB6AXuCg86vlLZhjEB61TmuzDdNvQOyhiynxQo6O5Jp-bDn06l2pKLal3ZmtmXgzjqVpY5UjuNvY8fVdM7bccsQhElopUv1QAr45sMzXCyrHmd0c8OO2LQhNzt-AzXOYsV6oWTW1ZKqbiMQVUboVeFPIakdkPuc8szj4Emrg6EpqLTL0fGxFNJrAHZ9Ch-qSqSf2JLE5iYBc_QbDNRizobc02_Uv_pHyg0CFeoZIQ5Q7I8thTOmy8X9Fr7DZvj37O_NFUCSbcohpMwU-wLWz',
  'ev-temizligi': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop',
  'nakliyat': 'https://images.unsplash.com/photo-1580137189272-c9379f8864fd?q=80&w=1200&auto=format&fit=crop',
  'su-tesisati': 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=1200&auto=format&fit=crop',
  'elektrik-tesisati': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1200&auto=format&fit=crop',
  'ev-tadilat': 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=1200&auto=format&fit=crop',
  'default': 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=1200&auto=format&fit=crop'
};

const CATEGORY_CTA_IMAGES: Record<string, string> = {
  'boya-badana': 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCkj35tWujZ02kiBvnqgVfLGDHCW5ifiSLaRzgDFIY_IBS5kMAmgluIo25T0VVglFXazXqRc4xyb1WlkZ0lRcw7_noDkEJTp58tj1XZAmYOsEBGPxglXRzxOSr-DOzXlixi2KrBcpin4ETGAbQ3UYePNft9bmXRcBqkN7Q3YsDYeqF1PK6AE935ho7KlCFvP4viQ8oMgm1aW-9wrM3j1nx-HgDldmbzvjC9zXq3TLTOeg6_SemeKYg0_dFWpBorPUm1Lk7c4eHW6oP',
  'default': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1200&auto=format&fit=crop'
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  try {
    const res = await fetch(`${apiUrl}/api/ortak/seo/page-metadata?slug=${slug}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return {
        title: 'Hizmet Detayı | Esnaaf',
        description: 'Güvenilir usta ve esnaf bulma platformu.',
      };
    }
    const data = await res.json();
    return {
      title: data.title,
      description: data.description,
      openGraph: {
        title: data.title,
        description: data.description,
        url: data.pageUrl,
        type: 'website',
      },
    };
  } catch (e) {
    return {
      title: 'Hizmet Detayı | Esnaaf',
      description: 'Güvenilir usta ve esnaf bulma platformu.',
    };
  }
}

export default async function HizmetSeoPage({ params }: PageProps) {
  const { slug } = await params;
  let data;
  try {
    const res = await fetch(`${apiUrl}/api/ortak/seo/page-metadata?slug=${slug}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      notFound();
    }
    data = await res.json();
  } catch (e) {
    notFound();
  }

  const {
    categorySlug,
    categoryName,
    city,
    district,
    providerCount,
    avgRating,
    ratingCount,
    minPrice,
    maxPrice,
    unit,
    faqs,
    schema,
  } = data;

  let locationHeader = '';
  if (district) {
    locationHeader = `${city} ${district}`;
  } else if (city) {
    locationHeader = `${city}`;
  } else {
    locationHeader = 'Türkiye Geneli';
  }

  const heroImage = CATEGORY_HERO_IMAGES[categorySlug] || CATEGORY_HERO_IMAGES['default'];
  const ctaImage = CATEGORY_CTA_IMAGES[categorySlug] || CATEGORY_CTA_IMAGES['default'];

  return (
    <>
      {/* Schema.org JSON-LD Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      {/* Embedded CSS classes matching the mockup */}
      <style dangerouslySetInnerHTML={{ __html: `
        .glass-card {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(143, 147, 122, 0.2);
        }
        .step-number {
            font-size: 120px;
            line-height: 1;
            opacity: 0.05;
            position: absolute;
            top: -20px;
            right: -10px;
            font-weight: 900;
        }
        .reviews-slider-container {
            overflow: hidden;
            position: relative;
        }
        .reviews-track {
            display: flex;
            transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .review-slide {
            flex: 0 0 100%;
        }
        @media (min-width: 768px) {
            .review-slide {
                flex: 0 0 50%;
            }
        }
        @media (min-width: 1024px) {
            .review-slide {
                flex: 0 0 33.333333%;
            }
        }
      `}} />

      <div className="bg-background text-on-background selection:bg-primary/20 font-body min-h-screen flex flex-col pt-20">
        
        {/* Header (TopNavBar) */}
        <header className="fixed top-0 w-full z-50 backdrop-blur-md bg-white/80 border-b border-outline-variant/50 h-20 shadow-sm">
          <div className="flex justify-between items-center px-4 md:px-6 max-w-7xl mx-auto h-full w-full">
            <div className="flex items-center gap-12">
              <Link href="/">
                <img
                  alt="Esnaaf Logo"
                  className="h-14 w-auto cursor-pointer"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVgSjXJkj42ZNDCWFwJr55cLuIlwdz5IufC5zO6KFcIv_KAcAiNOdn4MkBwCcJ04shOHM9ZbvileJokrkYQsp0_Xuwm48sH8wfZVrsyIz38-XrLTbRsf16zQj8V2MGKXVRujJYXH183SmaXUD0qOc1cS-v9GXriQn34MIyIztPEgZZptZcQbdVjnhdorc0CBfcWcv7UG5hDf-1iX6EpLTEnwj4D47ie015-v-_b9PHA93SkyaQEVhvWsMHIhFT9B57MgMbPWJ8SAEg"
                />
              </Link>
              <nav className="hidden md:flex gap-8">
                <a className="text-on-surface-variant hover:text-primary transition-colors font-semibold text-sm" href="#how-it-works">Nasıl Çalışır</a>
                <a className="text-on-surface-variant hover:text-primary transition-colors font-semibold text-sm" href="#why-us">Neden Esnaaf</a>
                <a className="text-on-surface-variant hover:text-primary transition-colors font-semibold text-sm" href="#testimonials">Yorumlar</a>
                <a className="text-on-surface-variant hover:text-primary transition-colors font-semibold text-sm" href="#faqs">Soru & Cevap</a>
              </nav>
            </div>
            <Link href="/">
              <button className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-bold text-sm hover:opacity-90 transition-all active:scale-95 cursor-pointer">
                Hizmet Ver
              </button>
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-surface-container-lowest">
          <div className="absolute inset-0 z-0">
            <div
              className="w-full h-full bg-cover bg-center opacity-30"
              style={{ backgroundImage: `url("${heroImage}")` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
          </div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 w-full grid md:grid-cols-2 gap-12 items-center py-12">
            <div className="space-y-8">
              <div className="space-y-4">
                <span className="bg-primary-container text-on-primary-container px-4 py-1.5 rounded-full text-sm font-semibold inline-block border border-primary/20">
                  Profesyonel {categoryName}
                </span>
                <h1 className="font-bold text-4xl md:text-5xl leading-tight text-on-surface tracking-tight">
                  {locationHeader} {categoryName} Ustaları
                </h1>
                <p className="font-body text-lg text-on-surface-variant max-w-lg leading-relaxed">
                  {locationHeader} genelinde <strong>{providerCount} onaylı {categoryName.toLowerCase()} ustası</strong> arasından teklif al, karşılaştır ve seç. Esnaaf güvencesiyle en iyi hizmete kolayca ulaşın.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <SeoPageClient
                  categorySlug={categorySlug}
                  categoryName={categoryName}
                  city={city}
                  district={district}
                  className="bg-primary text-on-primary px-10 py-4 rounded-lg text-lg hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 group font-bold cursor-pointer"
                >
                  <span>Başla</span>
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </SeoPageClient>
                <SeoPageClient
                  categorySlug={categorySlug}
                  categoryName={categoryName}
                  city={city}
                  district={district}
                  className="border-2 border-primary text-on-surface px-10 py-4 rounded-lg text-lg hover:bg-primary/10 transition-all flex items-center justify-center font-bold cursor-pointer bg-white"
                >
                  Fiyat Hesapla
                </SeoPageClient>
              </div>
            </div>
            
            <div className="hidden md:block">
              <div className="glass-card p-8 rounded-2xl shadow-xl relative overflow-hidden border border-outline-variant">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">verified</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-on-surface">Onaylı Uzmanlar</p>
                    <p className="text-xs text-on-surface-variant">Arka plan kontrolü yapılmış</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-4/5 rounded-full"></div>
                  </div>
                  <p className="text-xs font-semibold text-on-surface-variant">
                    Bugün {locationHeader} genelinde 150+ yeni teklif verildi
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 w-full -mt-12 relative z-20">
          <div className="bg-white border border-outline-variant/50 rounded-2xl shadow-xl p-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="flex flex-col items-center text-center space-y-1 group">
              <span className="material-symbols-outlined text-primary text-4xl mb-2" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
              <span className="font-bold text-3xl text-on-surface">{avgRating} / 5.0</span>
              <span className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">puan ortalaması</span>
            </div>
            <div className="flex flex-col items-center text-center space-y-1 md:border-x border-outline-variant/30">
              <span className="material-symbols-outlined text-primary text-4xl mb-2" style={{ fontVariationSettings: '"FILL" 1' }}>group</span>
              <span className="font-bold text-3xl text-on-surface">{ratingCount * 12}+</span>
              <span className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">memnun müşteri</span>
            </div>
            <div className="flex flex-col items-center text-center space-y-1">
              <span className="material-symbols-outlined text-primary text-4xl mb-2" style={{ fontVariationSettings: '"FILL" 1' }}>reviews</span>
              <span className="font-bold text-3xl text-on-surface">{ratingCount}+</span>
              <span className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">onaylı yorum</span>
            </div>
          </div>
        </div>

        {/* Why Us Section */}
        <section id="why-us" className="py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="font-bold text-3xl text-on-surface mb-4">Neden Esnaaf'ı Seçmelisiniz?</h2>
              <p className="font-body text-lg text-on-surface-variant">
                {categoryName} sürecini stresli bir işten, keyifli bir değişime dönüştürüyoruz.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1 */}
              <div className="bg-surface-container-low p-8 rounded-xl border border-outline-variant/30 shadow-sm hover:border-primary/30 transition-all group">
                <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                  <span className="material-symbols-outlined text-3xl">verified_user</span>
                </div>
                <h3 className="font-bold text-xl text-on-surface mb-3">Kaliteli Hizmet</h3>
                <p className="font-body text-sm text-on-surface-variant">
                  Gerçek müşteri yorumlarıyla hizmet kalitesini görün, güvenle karar verin.
                </p>
              </div>
              {/* Card 2 */}
              <div className="bg-surface-container-low p-8 rounded-xl border border-outline-variant/30 shadow-sm hover:border-primary/30 transition-all group">
                <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                  <span className="material-symbols-outlined text-3xl">timer</span>
                </div>
                <h3 className="font-bold text-xl text-on-surface mb-3">Zaman Kazan</h3>
                <p className="font-body text-sm text-on-surface-variant">
                  Dükkan dolaşmayın, referans aramayın. Teklifler anında cebinize gelsin.
                </p>
              </div>
              {/* Card 3 */}
              <div className="bg-surface-container-low p-8 rounded-xl border border-outline-variant/30 shadow-sm hover:border-primary/30 transition-all group">
                <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                  <span className="material-symbols-outlined text-3xl">touch_app</span>
                </div>
                <h3 className="font-bold text-xl text-on-surface mb-3">Kolay Kullanım</h3>
                <p className="font-body text-sm text-on-surface-variant">
                  Özel sorularımıza 1 dakikada cevap verin, işinizi hızlıca halledin.
                </p>
              </div>
              {/* Card 4 */}
              <div className="bg-surface-container-low p-8 rounded-xl border border-outline-variant/30 shadow-sm hover:border-primary/30 transition-all group">
                <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                  <span className="material-symbols-outlined text-3xl">security</span>
                </div>
                <h3 className="font-bold text-xl text-on-surface mb-3">Garantide Ol</h3>
                <p className="font-body text-sm text-on-surface-variant">
                  Esnaaf üzerinden yaptığınız tüm işler bizim garantimiz altında!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-24 bg-surface-container-lowest overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 md:px-6 relative">
            <div className="text-center mb-24">
              <h2 className="font-bold text-3xl text-on-surface mb-4">Nasıl Çalışır?</h2>
              <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
            </div>
            
            <div className="space-y-24 relative">
              {/* Visual Connector Line (Desktop) */}
              <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/10 via-primary/30 to-primary/10 -translate-x-1/2 z-0"></div>
              
              {/* Step 1 */}
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-12 md:gap-24">
                <div className="flex-1 md:text-right order-2 md:order-1">
                  <div className="relative inline-block">
                    <span className="text-primary/5 font-black text-9xl absolute -top-16 md:-right-8 -left-8 md:left-auto -z-10">01</span>
                    <h3 className="font-bold text-2xl text-on-surface mb-6">İhtiyacını birkaç soruda anlat</h3>
                    <p className="font-body text-lg text-on-surface-variant mb-8 max-w-lg md:ml-auto">
                      İhtiyacına özel soruları asistanımızla cevapla. İstersen iletişim bilgilerini gizli tut.
                    </p>
                    <div className="flex items-center gap-4 text-primary font-bold md:justify-end">
                      <span className="material-symbols-outlined">quiz</span>
                      <span>1 dakikadan az sürer</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 order-1 md:order-2">
                  <div className="relative">
                    <div className="absolute -inset-4 bg-primary/5 rounded-[2.5rem] -rotate-2"></div>
                    <div className="relative rounded-3xl overflow-hidden shadow-xl transform hover:scale-[1.02] transition-transform duration-500 border border-outline-variant/30 bg-white">
                      <img alt="İhtiyacını anlat" className="w-full grayscale-[10%] hover:grayscale-0 transition-all" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAoCt95JwkhE8yRw-lN5LVufHeysmo_Tx4g422kygjbcknm6iYM2kog6FNP9p10ilUdzet_-eEK_SmQDdAJ4gn7R4z7vOckZxEvP5fDhe73okFxbdqMqafgfFiwBq84_RWdHVsTKUPj6lHCy_i2OCuU-KzCgL5dlgPgAL2mQHnSy1z-BwbsNDJL0c53IiOCBJoqeiQFxWm1h3qLDsKL9RIYLwZgUVv0ffvyVMhOHpejkMcHbgGx2Vf1398QJOMtLE3M0mpzQPn6Tewi" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-12 md:gap-24">
                <div className="flex-1">
                  <div className="relative">
                    <div className="absolute -inset-4 bg-primary/5 rounded-[2.5rem] rotate-2"></div>
                    <div className="relative rounded-3xl overflow-hidden shadow-xl transform hover:scale-[1.02] transition-transform duration-500 border border-outline-variant/30 bg-white">
                      <img alt="Teklif al" className="w-full grayscale-[10%] hover:grayscale-0 transition-all" src="https://lh3.googleusercontent.com/aida-public/AB6AXuASvamRiNA9s2c-7R_M4F9BcxAWPUJLHbzE9o0YDOl8-g4r_XrZNxXGzMpr2AIxNg4xok-xwAz4fH7iHXQLgdfSr8ChKPzehv5XV7ogXSlf_LU6L2NpueS6GmecAa-0GEy3bSmsq6GM1r_rH87VOGMbWoS2CpBy5niUiiLGBKlCbkaSu1X5GrMh4uPT5-qVApMRhtU4x5GTz1cWfZK6loc4sGGiW4jmQu47GG5Fxnml_3U0SYOCTDRiyb51fzdbrUHABuUzNHCyhYyc" />
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="relative inline-block">
                    <span className="text-primary/5 font-black text-9xl absolute -top-16 -left-8 -z-10">02</span>
                    <h3 className="font-bold text-2xl text-on-surface mb-6">Teklif al</h3>
                    <p className="font-body text-lg text-on-surface-variant mb-8 max-w-lg">
                      İşinle ilgilenen ve müsait olan profesyonellerle tanış, {categoryName} fiyatını öğren.
                    </p>
                    <div className="flex items-center gap-4 text-primary font-bold">
                      <span className="material-symbols-outlined">request_quote</span>
                      <span>Ortalama 4 farklı teklif</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-12 md:gap-24">
                <div className="flex-1 md:text-right order-2 md:order-1">
                  <div className="relative inline-block">
                    <span className="text-primary/5 font-black text-9xl absolute -top-16 md:-right-8 -left-8 md:left-auto -z-10">03</span>
                    <h3 className="font-bold text-2xl text-on-surface mb-6">Karşılaştır ve seç</h3>
                    <p className="font-body text-lg text-on-surface-variant mb-8 max-w-lg md:ml-auto">
                      Müşteri yorumlarını incele, pazarlık yap. En uygun fiyat ve kaliteyi tercih et.
                    </p>
                    <div className="flex items-center gap-4 text-primary font-bold md:justify-end">
                      <span className="material-symbols-outlined">verified</span>
                      <span>Güvenli karar verme</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 order-1 md:order-2">
                  <div className="relative">
                    <div className="absolute -inset-4 bg-primary/5 rounded-[2.5rem] -rotate-1"></div>
                    <div className="relative rounded-3xl overflow-hidden shadow-xl transform hover:scale-[1.02] transition-transform duration-500 border border-outline-variant/30 bg-white">
                      <img alt="Karşılaştır ve seç" className="w-full grayscale-[10%] hover:grayscale-0 transition-all" src="https://lh3.googleusercontent.com/aida-public/AB6AXuArsDiQBcW0vdCtjUNBiLOoqy-em53AITIxtj9_DgZ84-iqVWZM2uIOgrqs4w5NCPgEbSZ0eiijGGSea493LmQNUFZae3zifPcaskbAS2Zq24mS1xd5vqXCZP_Cd0O5xNqqLenI9K1yT4e3QuBddL6sNTZDe4Z51sHyRuDq1J6wXjMAxUndCUpbG1LfSHPHQMDERGPtdBd1RQvUU3lUCALmRC0F5mwoe2BGwMFXmkWW8Ai5iZId15lE7t_JIftDQYBlPX8UFGd1G34J" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section with Slider */}
        <section id="testimonials" className="py-24 bg-background overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <ReviewsSlider
              categorySlug={categorySlug}
              categoryName={categoryName}
            />
          </div>
        </section>

        {/* Dynamic FAQ Accordion Section */}
        <section id="faqs" className="py-24 bg-slate-50 border-t border-slate-100">
          <div className="max-w-4xl mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="font-bold text-3xl text-on-surface mb-4">Sıkça Sorulan Sorular</h2>
              <p className="font-body text-slate-500">{locationHeader} {categoryName} hizmeti hakkında merak edilenler</p>
            </div>
            
            <div className="space-y-6">
              {faqs.map((faq: any, idx: number) => (
                <div key={idx} className="bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-start gap-2">
                    <span className="text-primary font-black">?</span>
                    {faq.question}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed pl-4 border-l-2 border-primary/40">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 md:px-6">
          <div className="max-w-7xl mx-auto overflow-hidden rounded-[2rem] relative min-h-[400px] flex items-center">
            <div className="absolute inset-0 z-0">
              <div
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url("${ctaImage}")` }}
              />
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px]" />
            </div>
            
            <div className="relative z-10 w-full p-8 md:p-20 flex flex-col items-center text-center text-on-background">
              <h2 className="font-bold text-3xl md:text-5xl mb-6 max-w-2xl text-on-surface tracking-tight">
                Evinizi Yenilemeye Hazır mısınız?
              </h2>
              <p className="font-body text-lg mb-10 max-w-xl text-on-surface-variant leading-relaxed">
                En iyi fiyatlar Esnaaf'ta seni bekliyor. Hemen talep oluştur, profesyonellerden teklif al.
              </p>
              <SeoPageClient
                categorySlug={categorySlug}
                categoryName={categoryName}
                city={city}
                district={district}
                className="bg-primary text-on-primary px-12 py-5 rounded-full text-xl hover:shadow-xl transition-all active:scale-95 shadow-lg font-bold cursor-pointer"
              >
                Fiyat Hesapla
              </SeoPageClient>
            </div>
          </div>
        </section>

        {/* Mobile App Download */}
        <section className="py-24 bg-surface-container-low relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl z-0"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl z-0"></div>
          
          <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 space-y-8">
                <h2 className="font-bold text-4xl md:text-5xl text-on-surface leading-tight tracking-tight">
                  Hemen indir, işlerini hallet!
                </h2>
                <p className="font-body text-lg text-on-surface-variant max-w-xl leading-relaxed">
                  Esnaaf uygulamasını indir, ihtiyacın olan hizmete saniyeler içinde ulaş. Teklifleri anında gör, uzmanlarla kolayca mesajlaş.
                </p>
                <div className="flex flex-wrap gap-4">
                  <a className="hover:scale-105 transition-transform duration-300" href="#">
                    <img alt="App Store" className="h-14" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGEn6eQKbNLCQu5stuWa-B3Ri9MXInTaXXGCxFXbfRA-A2Oby215RWE7hW6Ze_exTF70L6QRUKEvqOFACsNOZyrhhEmJH5ejzM18JJLOhUb3llsLXydwCpQzl24KNA4nzdnd60_uv20sTGw3vLIwFFR0pi4Dvh_0gI31-JTMabV8RAD1vjbvdfRqT8xJ5JaFPlZDKUErH00Cn3P-GKrlus1judOD2dA2HvGrdYAvrhOTuXIM6dfZBTKmgHNr2OPAsv8W5qeMFY6ILX" />
                  </a>
                  <a className="hover:scale-105 transition-transform duration-300" href="#">
                    <img alt="Google Play" className="h-14" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCAExiul5BxL4el99tC-ZNqup02LQLpRNITrykCVStLfemh8HSGlPLTSmZAMLf7TVi54ShM9ga9y7rMXpqy1tUOkyuJ2M3JnjzU5hJ12Z_sr123wZkjRjCAyaD1SeifJFCZSY_yoDFRxrZZhvOtsYChHpn62XiAc8bDO13fQVQvQruDwlLVWQIVrpnarjzSXGSCJ4jCm-jx9yK0F2yWo8FgoCRkSV16RKkhZIFyFc6Cbh99aYSpn4psmcTho3lednPmdA0_MEX1siFu" />
                  </a>
                </div>
              </div>
              <div className="flex-1 flex justify-center md:justify-end">
                <div className="relative w-full max-w-md rotate-2 hover:rotate-0 transition-transform duration-500">
                  <div className="mt-8 rounded-2xl overflow-hidden shadow-2xl border border-outline-variant/30 bg-white p-2">
                    <img alt="Esnaaf App Interface" className="w-full h-auto rounded-xl" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRABpQqqodNck5bA6D8cfyAw3v1fzULbILofVeKvHmb80398nyHGcehqh91codwKbasdYR8cPIRjc-F7YPrpY_4jRSXRMgZWS_HL8xIn8McdBTSYPzhK1hhKTpfyxueGWcaatP4ZvZZRPCIBoZFnarTyHYaaP4EWc2c5firTC3ANLVJTgaBmDug8_PmaO5cbEEtGaNIQMGsRk_74LklFA9mmoj13tf3S9M8EHQmHBJl0X9iMpHBvkNJotf0Q-NBEiSA3QlJ42Fw8sC" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-surface-container-lowest border-t border-outline-variant/30 py-24 mt-auto">
          <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 w-full">
            <div className="space-y-6">
              <img
                alt="Esnaaf Logo"
                className="h-14 w-auto"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVgSjXJkj42ZNDCWFwJr55cLuIlwdz5IufC5zO6KFcIv_KAcAiNOdn4MkBwCcJ04shOHM9ZbvileJokrkYQsp0_Xuwm48sH8wfZVrsyIz38-XrLTbRsf16zQj8V2MGKXVRujJYXH183SmaXUD0qOc1cS-v9GXriQn34MIyIztPEgZZptZcQbdVjnhdorc0CBfcWcv7UG5hDf-1iX6EpLTEnwj4D47ie015-v-_b9PHA93SkyaQEVhvWsMHIhFT9B57MgMbPWJ8SAEg"
              />
              <p className="text-sm font-body text-on-surface-variant leading-relaxed">
                Türkiye'nin lider hizmet platformu. Boyadan nakliyeye, her şey için en güvenilir uzmanlar burada.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-on-surface uppercase tracking-widest">HİZMETLER</h4>
              <ul className="space-y-2">
                <li><Link href="/" className="text-on-surface-variant hover:text-primary transition-colors text-xs font-medium">Ev Boyama</Link></li>
                <li><Link href="/" className="text-on-surface-variant hover:text-primary transition-colors text-xs font-medium">Temizlik</Link></li>
                <li><Link href="/" className="text-on-surface-variant hover:text-primary transition-colors text-xs font-medium">Nakliye</Link></li>
                <li><Link href="/" className="text-on-surface-variant hover:text-primary transition-colors text-xs font-medium">Tadilat</Link></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-on-surface uppercase tracking-widest">KURUMSAL</h4>
              <ul className="space-y-2">
                <li><Link href="/" className="text-on-surface-variant hover:text-primary transition-colors text-xs font-medium">Hakkımızda</Link></li>
                <li><Link href="/" className="text-on-surface-variant hover:text-primary transition-colors text-xs font-medium">Kariyer</Link></li>
                <li><Link href="/" className="text-on-surface-variant hover:text-primary transition-colors text-xs font-medium">Basın</Link></li>
                <li><Link href="/" className="text-on-surface-variant hover:text-primary transition-colors text-xs font-medium">İletişim</Link></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-on-surface uppercase tracking-widest">YARDIM</h4>
              <ul className="space-y-2">
                <li><Link href="/" className="text-on-surface-variant hover:text-primary transition-colors text-xs font-medium">Gizlilik Politikası</Link></li>
                <li><Link href="/" className="text-on-surface-variant hover:text-primary transition-colors text-xs font-medium">Kullanıcı Sözleşmesi</Link></li>
                <li><Link href="/" className="text-on-surface-variant hover:text-primary transition-colors text-xs font-medium">Güvenlik</Link></li>
                <li><Link href="/" className="text-on-surface-variant hover:text-primary transition-colors text-xs font-medium">Destek Merkezi</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 md:px-6 mt-16 pt-8 border-t border-outline-variant/30 flex flex-col md:flex-row justify-between items-center gap-4 w-full">
            <p className="text-xs font-body text-on-surface-variant opacity-80">
              © {new Date().getFullYear()} Esnaaf Home Services. Tüm hakları saklıdır.
            </p>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-on-primary transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-sm">public</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-on-primary transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-sm">mail</span>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
