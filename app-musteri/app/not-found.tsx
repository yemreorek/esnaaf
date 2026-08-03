import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-[#c8f252] selection:text-slate-950 relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Background Ambient Glows & Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#c8f252]/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-3xl" />
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
            backgroundSize: `24px 24px`
          }}
        />
      </div>

      {/* Header Bar */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#c8f252] to-emerald-400 p-0.5 shadow-lg shadow-[#c8f252]/20 group-hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <span className="text-[#c8f252] font-black text-xl tracking-tighter">e</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-[#c8f252] transition-colors">
              esnaaf
            </span>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
              Güvenilir Hizmet Verenler
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-800 text-xs font-semibold text-slate-300">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>Hata Kodu: 404 Sayfa Bulunamadı</span>
        </div>
      </header>

      {/* Main 404 Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 py-12 max-w-4xl mx-auto">
        {/* Floating 404 Badge */}
        <div className="relative mb-6 group">
          <div className="absolute inset-0 bg-gradient-to-r from-[#c8f252] via-emerald-400 to-teal-400 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
          
          <div className="relative bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl px-8 py-4 flex items-center gap-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-[#c8f252]/10 border border-[#c8f252]/30 flex items-center justify-center text-[#c8f252]">
              <span className="material-symbols-outlined text-2xl">search_off</span>
            </div>
            <span className="text-6xl sm:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#c8f252] via-emerald-300 to-white">
              404
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-2xl leading-tight">
          Aradığınız Sayfa <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c8f252] to-emerald-400">Bulunamadı</span>
        </h1>

        <p className="mt-4 text-slate-400 text-sm sm:text-base max-w-xl leading-relaxed font-medium">
          Tıkladığınız bağlantı silinmiş, adresi değişmiş veya geçici olarak hizmet dışı kalmış olabilir. 
          Aradığınız hizmete hızlıca ulaşmak için aşağıdaki butonları kullanabilirsiniz.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#c8f252] hover:bg-[#b6e241] text-slate-950 font-extrabold text-sm px-8 py-4 rounded-2xl shadow-xl shadow-[#c8f252]/20 hover:shadow-[#c8f252]/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">home</span>
            <span>Ana Sayfaya Dön</span>
          </Link>

          <Link
            href="/g/temizlik"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700/80 font-bold text-sm px-7 py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg text-[#c8f252]">auto_awesome</span>
            <span>Hizmetleri İncele</span>
          </Link>
        </div>

        {/* Popular Quick Links */}
        <div className="mt-12 w-full pt-8 border-t border-slate-800/80">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
            Sık Aranan Popüler Hizmetler
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
            {[
              { name: "🏠 Ev Temizliği", href: "/g/temizlik" },
              { name: "🎨 Boya Badana", href: "/g/tadilat" },
              { name: "📦 Nakliyat", href: "/g/nakliyat" },
              { name: "🔧 Su Tesisatı", href: "/g/tamir" },
              { name: "🪲 Haşere İlaçlama", href: "/g/temizlik" },
              { name: "🪜 Merdiven Temizliği", href: "/g/temizlik" },
            ].map((chip, idx) => (
              <Link
                key={idx}
                href={chip.href}
                className="text-xs font-bold text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-[#c8f252]/50 px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center gap-1.5"
              >
                <span>{chip.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Footer Footer */}
      <footer className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
        <p>© 2026 Esnaaf. Tüm hakları saklıdır.</p>
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:text-slate-300 transition-colors">Ana Sayfa</Link>
          <span>•</span>
          <Link href="/tekliflerim" className="hover:text-slate-300 transition-colors">Tekliflerim</Link>
          <span>•</span>
          <Link href="/hizmetveren-basvuru" className="hover:text-slate-300 transition-colors">Hizmet Veren Ol</Link>
        </div>
      </footer>
    </div>
  );
}
