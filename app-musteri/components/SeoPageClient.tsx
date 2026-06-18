"use client";

import { useRouter } from "next/navigation";

interface SeoPageClientProps {
  categorySlug: string;
  categoryName: string;
  city: string | null;
  district: string | null;
}

export default function SeoPageClient({ categorySlug, categoryName, city, district }: SeoPageClientProps) {
  const router = useRouter();

  const handleCtaClick = () => {
    const preset = {
      categorySlug,
      categoryName,
      city,
      district
    };
    sessionStorage.setItem("esnaaf_seo_preset", JSON.stringify(preset));
    router.push("/");
  };

  return (
    <button
      onClick={handleCtaClick}
      className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-slate-900 bg-[#c8f252] hover:bg-[#b5e639] rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer group active:scale-95"
    >
      <span>Yapay Zeka ile Teklif Al</span>
      <svg
        className="w-5 h-5 ml-2 transition-transform duration-200 group-hover:translate-x-1"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
          d="M13 5l7 7-7 7M5 5l7 7-7 7"
        ></path>
      </svg>
    </button>
  );
}
