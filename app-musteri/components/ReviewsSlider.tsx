"use client";

import { useState, useEffect } from "react";

interface ReviewsSliderProps {
  categorySlug: string;
  categoryName: string;
}

export default function ReviewsSlider({ categorySlug, categoryName }: ReviewsSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleSlides, setVisibleSlides] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setVisibleSlides(3);
      else if (window.innerWidth >= 768) setVisibleSlides(2);
      else setVisibleSlides(1);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getReviews = () => {
    const lCategory = categoryName.toLowerCase();
    switch (categorySlug) {
      case "ev-temizligi":
        return [
          {
            name: "Elif Ş.",
            rating: 5.0,
            date: "26/07/2025",
            comment: "Harika bir temizlik işi çıkardı. Tek başına üç artı bir evi pırıl pırıl yaptı, yerler o kadar temizdi ki şaşırdık. Çok detaylı çalıştı.",
            initials: "EŞ"
          },
          {
            name: "Kaan Ş.",
            rating: 5.0,
            date: "15/10/2025",
            comment: "Temizlik ekibi tam zamanında geldi. Çok titiz çalıştılar, ince detaylara, kapı kollarına kadar önem veren bir ustalıkla temizlediler. Çekinmeden iş verebilirsiniz.",
            initials: "KŞ"
          },
          {
            name: "Melek A.",
            rating: 4.8,
            date: "28/09/2025",
            comment: "Gelen ablanın işçiliğinden çok memnun kaldım, tavsiye ederim. İstediğimiz gün ve saatte geldi, temizlik işimizi çok güzel yaptı, çok beğendim.",
            initials: "MA"
          }
        ];
      case "boya-badana":
        return [
          {
            name: "Elif Ş.",
            rating: 5.0,
            date: "26/07/2025",
            comment: "Harika bir iş çıkardı tek başına üç artı bir evi boyadı, yerler o kadar temizdi ki şaşırdık. Rezalet duvarları vardı harika bir işçilik ile kapattı hepsini...",
            initials: "EŞ"
          },
          {
            name: "Kaan Ş.",
            rating: 5.0,
            date: "15/10/2025",
            comment: "Hasan usta ve ekibi tam zamanında geldiler. Çok titiz çalıştılar. İnce detaylara önem veren bir ustalıkla boyayı yaptı. Çekinmeden iş verebilirsiniz.",
            initials: "KŞ"
          },
          {
            name: "Melek A.",
            rating: 4.8,
            date: "28/09/2025",
            comment: "Murat beyin işçiliğinden çok memnun kaldım tavsiye ederim. İstediğimiz gün ve saatte geldi boya işimizi çok güzel yaptı, çok beğendim.",
            initials: "MA"
          }
        ];
      case "su-tesisati":
        return [
          {
            name: "Ahmet T.",
            rating: 5.0,
            date: "12/08/2025",
            comment: "Banyodaki su sızıntısını yarım saatte tespit edip kırmadan dökmeden onardı. İşinin ehli, dürüst bir usta. Fiyatı da son derece makuldü.",
            initials: "AT"
          },
          {
            name: "Selin Y.",
            rating: 5.0,
            date: "04/11/2025",
            comment: "Mutfak bataryasını ve giderleri değiştirdiler. Çok temiz ve hızlı çalıştılar, hiçbir yeri kirletmediler. Kendilerine çok teşekkür ederim.",
            initials: "SY"
          },
          {
            name: "Can K.",
            rating: 4.8,
            date: "19/09/2025",
            comment: "Tesisat ustası tam saatinde geldi. Gerekli tüm parçaları yanında getirmişti, sorunu hızlıca çözdü. Kesinlikle tavsiye ederim.",
            initials: "CK"
          }
        ];
      default:
        return [
          {
            name: "Elif Ş.",
            rating: 5.0,
            date: "26/07/2025",
            comment: `Harika bir iş çıkardı. İhtiyacımız olan ${lCategory} hizmetini en ince detayına kadar titizlikle tamamladı, çok memnun kaldık.`,
            initials: "EŞ"
          },
          {
            name: "Kaan Ş.",
            rating: 5.0,
            date: "15/10/2025",
            comment: `Gelen uzman ve ekibi tam zamanında geldiler. Çok kibar ve titiz çalıştılar. ${categoryName} işimizi kusursuz tamamladılar.`,
            initials: "KŞ"
          },
          {
            name: "Melek A.",
            rating: 4.8,
            date: "28/09/2025",
            comment: `Verilen hizmetten çok memnun kaldım tavsiye ederim. İstediğimiz gün ve saatte geldi, işimizi çok güzel yaptı, çok beğendim.`,
            initials: "MA"
          }
        ];
    }
  };

  const reviews = getReviews();
  const maxIndex = Math.max(0, reviews.length - visibleSlides);

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < maxIndex) setCurrentIndex(currentIndex + 1);
  };

  const slideWidth = 100 / visibleSlides;

  return (
    <div className="reviews-slider-container relative">
      {/* Slider Header inside Testimonials */}
      <div className="flex justify-between items-end mb-16 gap-4">
        <div className="text-left">
          <h2 className="font-headline text-headline-md text-on-surface mb-2">Gerçek Müşteri Yorumları</h2>
          <p className="text-on-surface-variant font-body-md">Sizin gibi binlerce mutlu müşterinin deneyimlerini okuyun.</p>
        </div>
        <div className="flex gap-2 z-10">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-primary cursor-pointer"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex >= maxIndex}
            className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-primary cursor-pointer"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Slider Track */}
      <div className="overflow-hidden">
        <div
          className="reviews-track flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * slideWidth}%)` }}
        >
          {reviews.map((rev, idx) => (
            <div key={idx} className="review-slide flex-shrink-0 px-3" style={{ width: `${slideWidth}%` }}>
              <div className="bg-white p-8 rounded-xl border border-outline-variant/30 shadow-sm relative overflow-hidden group h-full flex flex-col justify-between">
                <span className="step-number text-primary">{rev.rating.toFixed(1)}</span>
                
                <div>
                  <div className="flex text-primary mb-4">
                    {Array.from({ length: 5 }).map((_, starIdx) => {
                      const isHalf = rev.rating - starIdx === 0.8;
                      const isFull = rev.rating - starIdx >= 1;
                      return (
                        <span
                          key={starIdx}
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: isFull || isHalf ? '"FILL" 1' : undefined }}
                        >
                          {isFull ? "star" : isHalf ? "star_half" : "star"}
                        </span>
                      );
                    })}
                  </div>
                  
                  <p className="font-body text-body-md text-on-surface mb-6 relative z-10 italic leading-relaxed">
                    "{rev.comment}"
                  </p>
                </div>

                <div className="flex items-center gap-3 relative z-10 mt-auto pt-4 border-t border-slate-50">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary shrink-0 text-sm">
                    {rev.initials}
                  </div>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">{rev.name}</p>
                    <p className="text-xs text-on-surface-variant">{rev.date}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-2 mt-12">
        {Array.from({ length: maxIndex + 1 }).map((_, dotIdx) => (
          <button
            key={dotIdx}
            onClick={() => setCurrentIndex(dotIdx)}
            className={`h-2 rounded-full transition-all duration-300 ${
              dotIdx === currentIndex ? "bg-primary w-8" : "bg-outline-variant w-2"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
