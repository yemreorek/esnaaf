import { notFound } from "next/navigation";
import Link from "next/link";
import SeoPageClient from "../../../components/SeoPageClient";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

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

  return (
    <>
      {/* Schema.org JSON-LD Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 md:px-12 py-4 h-16">
          <div className="flex items-center w-48 h-10 relative">
            <Link href="/" className="flex items-center">
              <img
                alt="Esnaaf Logo"
                className="w-auto select-none max-w-none"
                style={{ height: '90px', objectFit: 'contain' }}
                src="/logo.png"
              />
            </Link>
          </div>
          <div>
            <Link
              href="/"
              className="text-xs font-semibold px-4 py-2 rounded-full border border-slate-200 hover:border-slate-400 transition-all text-slate-700"
            >
              Anasayfa
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow pt-24 pb-16 bg-slate-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
            <Link href="/" className="hover:text-slate-900">Anasayfa</Link>
            <span>/</span>
            <span className="text-slate-400">Hizmetler</span>
            <span>/</span>
            {city && (
              <>
                <span className="text-slate-400">{city}</span>
                <span>/</span>
              </>
            )}
            <span className="text-slate-900 font-medium">{categoryName}</span>
          </div>

          {/* Hero Content Section */}
          <div className="bg-white rounded-2xl border border-slate-100 p-8 md:p-12 shadow-sm relative overflow-hidden mb-8">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#c8f252]/10 to-transparent rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 max-w-3xl">
              {/* Vertical Neon-Green Accent Line and Title */}
              <div className="flex items-stretch gap-5 mb-4">
                <div className="w-1.5 bg-[#c8f252] rounded-full shadow-[0_0_12px_rgba(200,242,82,0.8)] shrink-0" />
                <div>
                  <span className="text-xs font-bold text-[#719600] uppercase tracking-wider bg-[#c8f252]/20 px-3 py-1 rounded-full">
                    {locationHeader}
                  </span>
                  <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mt-2">
                    {locationHeader} {categoryName} Ustaları
                  </h1>
                </div>
              </div>

              <p className="text-slate-600 text-base md:text-lg leading-relaxed mb-8">
                {locationHeader} bölgesinde güvenilir, onaylı ve işinde uzman <strong>{providerCount} aktif {categoryName.toLowerCase()}</strong> ustasından anında fiyat teklifi alıp kıyaslayın. Yapay zeka destekli asistanımızla 1 dakikada ihtiyacınızı anlatın, en iyi teklifleri toplayın.
              </p>

              {/* Direct CTA Button Integration */}
              <div className="flex flex-wrap items-center gap-4">
                <SeoPageClient
                  categorySlug={categorySlug}
                  categoryName={categoryName}
                  city={city}
                  district={district}
                />
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <svg className="w-4.5 h-4.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                  Güvenli & Onaylı Hizmet
                </span>
              </div>
            </div>
          </div>

          {/* Stats Grid Dashboard Panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            
            {/* Stat Card 1: Price */}
            <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ortalama Fiyat</span>
                <span className="p-2 bg-blue-50 text-blue-600 rounded-lg text-lg">₺</span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {minPrice} TL - {maxPrice} TL
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Bölgenizdeki işlerin ortalama 1 {unit} bazlı tutarıdır.
              </p>
            </div>

            {/* Stat Card 2: Provider Count */}
            <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aktif Usta Sayısı</span>
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg text-lg">👷</span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {providerCount}+ Onaylı Usta
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {locationHeader} bölgesinde hizmet veren aktif profesyoneller.
              </p>
            </div>

            {/* Stat Card 3: Rating */}
            <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Müşteri Memnuniyeti</span>
                <span className="p-2 bg-amber-50 text-amber-500 rounded-lg text-lg">⭐</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{avgRating}</span>
                <span className="text-slate-400 font-medium">/ 5</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Son 30 günde tamamlanan {ratingCount} değerlendirme üzerinden.
              </p>
            </div>

          </div>

          {/* How it works section */}
          <div className="mb-12">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-6 text-center">Esnaaf Nasıl Çalışır?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl border border-slate-100">
                <div className="w-12 h-12 bg-[#c8f252]/20 text-slate-800 rounded-full flex items-center justify-center font-bold text-lg mb-4">
                  1
                </div>
                <h3 className="font-bold text-slate-900 mb-2">Talebini Asistana Anlat</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Yapay zeka asistanımızla chat yaparak ihtiyacının detaylarını hızlıca belirt.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl border border-slate-100">
                <div className="w-12 h-12 bg-[#c8f252]/20 text-slate-800 rounded-full flex items-center justify-center font-bold text-lg mb-4">
                  2
                </div>
                <h3 className="font-bold text-slate-900 mb-2">Teklifleri Karşılaştır</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Bölgendeki onaylı ustalar detaylara göre fiyat teklifi versin, kıyasla ve uyuş.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl border border-slate-100">
                <div className="w-12 h-12 bg-[#c8f252]/20 text-slate-800 rounded-full flex items-center justify-center font-bold text-lg mb-4">
                  3
                </div>
                <h3 className="font-bold text-slate-900 mb-2">Güvenle Tamamla</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Usta işi bitirdikten sonra onaylayarak süreci güvenle tamamla.
                </p>
              </div>

            </div>
          </div>

          {/* Dynamic FAQ Accordion */}
          <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Sıkça Sorulan Sorular</h2>
            <div className="space-y-6">
              {faqs.map((faq: any, idx: number) => (
                <div key={idx} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img
              alt="Esnaaf Logo"
              className="brightness-0 invert select-none opacity-80"
              style={{ height: '70px', objectFit: 'contain' }}
              src="/logo.png"
            />
          </div>
          <div className="text-xs text-slate-500">
            © {new Date().getFullYear()} Esnaaf.com - Tüm Hakları Saklıdır.
          </div>
        </div>
      </footer>
    </>
  );
}
