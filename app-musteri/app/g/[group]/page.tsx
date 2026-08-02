import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import HeaderNavbar from "../../../components/HeaderNavbar";
import Footer from "../../../components/Footer";
import CategoryGroupClient from "./CategoryGroupClient";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ group: string }>;
}

export interface GroupData {
  slug: string;
  name: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  popularServices: {
    title: string;
    slug: string;
    image: string;
    providers: string;
    rating: string;
    reviews: string;
  }[];
  allServices: {
    name: string;
    slug: string;
  }[];
}

export const GROUP_DATABASE: Record<string, GroupData> = {
  temizlik: {
    slug: "temizlik",
    name: "Temizlik",
    heroTitle: "Temizlik Hizmetleri",
    heroSubtitle: "İhtiyacın olan temizlik hizmetine 30 dakikada kolayca ulaş, mahallendeki en iyi teklifleri topla.",
    heroImage: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1600&auto=format&fit=crop",
    popularServices: [
      {
        title: "Ev Temizliği",
        slug: "ev-temizligi",
        image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop",
        providers: "3.992 Hizmet Veren",
        rating: "4.8",
        reviews: "407.378 onaylı yorum"
      },
      {
        title: "Boş Ev Temizliği",
        slug: "bos-ev-temizligi",
        image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=600&auto=format&fit=crop",
        providers: "6.196 Hizmet Veren",
        rating: "4.8",
        reviews: "47.381 onaylı yorum"
      },
      {
        title: "Koltuk Yıkama",
        slug: "koltuk-yikama",
        image: "https://images.unsplash.com/photo-1558882224-dda166733046?q=80&w=600&auto=format&fit=crop",
        providers: "3.674 Hizmet Veren",
        rating: "4.9",
        reviews: "75.123 onaylı yorum"
      },
      {
        title: "Halı Yıkama",
        slug: "hali-yikama",
        image: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?q=80&w=600&auto=format&fit=crop",
        providers: "1.777 Hizmet Veren",
        rating: "4.7",
        reviews: "40.415 onaylı yorum"
      },
      {
        title: "Apartman & Merdiven Temizliği",
        slug: "apartman-temizligi",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop",
        providers: "3.898 Hizmet Veren",
        rating: "4.6",
        reviews: "15.283 onaylı yorum"
      },
      {
        title: "İnşaat Sonrası Temizlik",
        slug: "insaat-tadilat-sonrasi-temizlik",
        image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&auto=format&fit=crop",
        providers: "4.312 Hizmet Veren",
        rating: "4.8",
        reviews: "47.383 onaylı yorum"
      },
      {
        title: "Cam Temizliği",
        slug: "cam-temizligi",
        image: "https://images.unsplash.com/photo-1527515545081-5db817172677?q=80&w=600&auto=format&fit=crop",
        providers: "5.871 Hizmet Veren",
        rating: "4.8",
        reviews: "59.993 onaylı yorum"
      },
      {
        title: "Böcek & Haşere İlaçlama",
        slug: "bocek-ilaclama",
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop",
        providers: "4.463 Hizmet Veren",
        rating: "4.9",
        reviews: "26.596 onaylı yorum"
      }
    ],
    allServices: [
      { name: "Apartman Temizliği", slug: "apartman-temizligi" },
      { name: "Bilgisayar Temizliği", slug: "bilgisayar-temizligi" },
      { name: "Böcek İlaçlama", slug: "bocek-ilaclama" },
      { name: "Boş Ev Temizliği", slug: "bos-ev-temizligi" },
      { name: "Buharlı Ev Temizliği", slug: "buharli-ev-temizligi" },
      { name: "Cam Silme & Temizliği", slug: "cam-silme" },
      { name: "Dış Cephe Cam Silme", slug: "dis-cephe-cam-silme" },
      { name: "Dükkan & İş Yeri Temizliği", slug: "ofis-temizligi" },
      { name: "Evde Koltuk Yıkama", slug: "koltuk-yikama" },
      { name: "Evde Ütü Hizmeti", slug: "evde-utu-hizmeti" },
      { name: "Ev Temizliği", slug: "ev-temizligi" },
      { name: "Fare İlaçlama", slug: "fare-ilaclama" },
      { name: "Halı Yıkama", slug: "hali-yikama" },
      { name: "Haşere İlaçlama", slug: "hasere-ilaclama" },
      { name: "İnşaat Sonrası Temizlik", slug: "insaat-tadilat-sonrasi-temizlik" },
      { name: "Kalorifer Böceği İlaçlama", slug: "kalorifer-bocegi-ilaclama" },
      { name: "Kombili Petek Temizleme", slug: "petek-temizligi" },
      { name: "Kuru Temizleme", slug: "kuru-temizleme" },
      { name: "Merdiven Temizliği", slug: "merdiven-temizligi" },
      { name: "Mermer Cilalama & Silim", slug: "mermer-silim" },
      { name: "Ofis Halı Yıkama", slug: "ofis-hali-yikama" },
      { name: "Ofis Temizliği", slug: "ofis-temizligi" },
      { name: "Petek Temizliği", slug: "petek-temizligi" },
      { name: "Pire İlaçlama", slug: "pire-ilaclama" },
      { name: "Stor Perde Yıkama", slug: "stor-perde-yikama" },
      { name: "Su Deposu Temizliği", slug: "su-deposu-temizliği" },
      { name: "Tahta Kurusu İlaçlama", slug: "tahta-kurusu-ilaclama" },
      { name: "Taşınma Öncesi Temizlik", slug: "tasinma-oncesi-temizlik" },
      { name: "Yatak Yıkama", slug: "yatak-yikama" },
      { name: "Yerinde Araç Koltuk Yıkama", slug: "arac-koltuk-yikama" }
    ]
  },
  tadilat: {
    slug: "tadilat",
    name: "Tadilat",
    heroTitle: "Tadilat & Dekorasyon Hizmetleri",
    heroSubtitle: "Evini baştan yarat! İç mimar, boyacı ve ustalar 30 dakikada teklif sunsun.",
    heroImage: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=1600&auto=format&fit=crop",
    popularServices: [
      {
        title: "Boya Badana",
        slug: "boya-badana",
        image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=600&auto=format&fit=crop",
        providers: "11.604 Hizmet Veren",
        rating: "4.8",
        reviews: "123.393 onaylı yorum"
      },
      {
        title: "Komple Ev Tadilatı",
        slug: "komple-ev-tadilati",
        image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=600&auto=format&fit=crop",
        providers: "8.412 Hizmet Veren",
        rating: "4.9",
        reviews: "89.210 onaylı yorum"
      },
      {
        title: "Mutfak Tadilatı & Dolap",
        slug: "mutfak-tadilati",
        image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=600&auto=format&fit=crop",
        providers: "5.240 Hizmet Veren",
        rating: "4.8",
        reviews: "34.150 onaylı yorum"
      },
      {
        title: "Banyo Tadilatı & Fayans",
        slug: "banyo-tadilati",
        image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&auto=format&fit=crop",
        providers: "6.110 Hizmet Veren",
        rating: "4.7",
        reviews: "42.890 onaylı yorum"
      },
      {
        title: "Fayans Döşeme",
        slug: "fayans-doseme",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop",
        providers: "4.850 Hizmet Veren",
        rating: "4.8",
        reviews: "28.600 onaylı yorum"
      },
      {
        title: "Parke Döşeme",
        slug: "parke-doseme",
        image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=600&auto=format&fit=crop",
        providers: "5.920 Hizmet Veren",
        rating: "4.8",
        reviews: "39.400 onaylı yorum"
      },
      {
        title: "Cam Balkon Sistemleri",
        slug: "cam-balkon",
        image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=600&auto=format&fit=crop",
        providers: "3.780 Hizmet Veren",
        rating: "4.7",
        reviews: "22.150 onaylı yorum"
      },
      {
        title: "Dış Cephe Mantolama",
        slug: "mantolama",
        image: "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?q=80&w=600&auto=format&fit=crop",
        providers: "4.120 Hizmet Veren",
        rating: "4.8",
        reviews: "19.800 onaylı yorum"
      }
    ],
    allServices: [
      { name: "Amerikan Kapı Montajı", slug: "amerikan-kapi" },
      { name: "Asma Tavan & Alçıpan", slug: "asma-tavan" },
      { name: "Banyo Dekorasyonu", slug: "banyo-tadilati" },
      { name: "Banyo Tadilatı", slug: "banyo-tadilati" },
      { name: "Boya Badana Hizmeti", slug: "boya-badana" },
      { name: "Cam Balkon İmalatı", slug: "cam-balkon" },
      { name: "Çatı Tamiri & İzolasyon", slug: "cati-tamiri" },
      { name: "Dış Cephe Mantolama", slug: "mantolama" },
      { name: "Duvar Kağıdı Döşeme", slug: "duvar-kagidi" },
      { name: "Duvar Yıkma Örme Ustası", slug: "ev-tadilat" },
      { name: "Epoksi Zemin Kaplama", slug: "parke-doseme" },
      { name: "Ev Tadilatı & Dekorasyon", slug: "ev-tadilat" },
      { name: "Fayans Döşeme Ustası", slug: "fayans-doseme" },
      { name: "İç Mimar Tasarım Hizmeti", slug: "ic-mimar" },
      { name: "Kartonpiyer & Stoper", slug: "asma-tavan" },
      { name: "Komple Ev Tadilatı", slug: "komple-ev-tadilati" },
      { name: "Laminat Parke Döşeme", slug: "parke-doseme" },
      { name: "Mutfak Dolabı İmalatı", slug: "mutfak-tadilati" },
      { name: "Mutfak Tadilatı", slug: "mutfak-tadilati" },
      { name: "PVC Pencere & Doğrama", slug: "pvc-pencere" }
    ]
  },
  nakliyat: {
    slug: "nakliyat",
    name: "Nakliyat",
    heroTitle: "Nakliyat Hizmetleri",
    heroSubtitle: "Evden eve nakliyat, parça eşya taşıma ve asansörlü nakliyede en uygun teklifleri alın.",
    heroImage: "https://images.unsplash.com/photo-1580137189272-c9379f8864fd?q=80&w=1600&auto=format&fit=crop",
    popularServices: [
      {
        title: "Evden Eve Nakliyat",
        slug: "evden-eve-nakliyat",
        image: "https://images.unsplash.com/photo-1580137189272-c9379f8864fd?q=80&w=600&auto=format&fit=crop",
        providers: "5.132 Hizmet Veren",
        rating: "4.9",
        reviews: "198.089 onaylı yorum"
      },
      {
        title: "Parça Eşya Taşıma",
        slug: "parca-esya-tasima",
        image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=600&auto=format&fit=crop",
        providers: "4.210 Hizmet Veren",
        rating: "4.8",
        reviews: "65.400 onaylı yorum"
      },
      {
        title: "Şehirler Arası Nakliyat",
        slug: "sehirler-arasi-nakliyat",
        image: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=600&auto=format&fit=crop",
        providers: "6.890 Hizmet Veren",
        rating: "4.9",
        reviews: "112.300 onaylı yorum"
      },
      {
        title: "Ofis & İş Yeri Taşıma",
        slug: "ofis-tasima",
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600&auto=format&fit=crop",
        providers: "3.450 Hizmet Veren",
        rating: "4.8",
        reviews: "29.100 onaylı yorum"
      },
      {
        title: "Asansörlü Nakliyat",
        slug: "asansorlu-nakliyat",
        image: "https://images.unsplash.com/photo-1580137189272-c9379f8864fd?q=80&w=600&auto=format&fit=crop",
        providers: "4.980 Hizmet Veren",
        rating: "4.9",
        reviews: "84.500 onaylı yorum"
      },
      {
        title: "Kamyonet Kiralama (Şoförlü)",
        slug: "kamyonet-kiralama",
        image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=600&auto=format&fit=crop",
        providers: "2.890 Hizmet Veren",
        rating: "4.7",
        reviews: "18.300 onaylı yorum"
      },
      {
        title: "Eşya Depolama Hizmeti",
        slug: "esya-depolama",
        image: "https://images.unsplash.com/photo-1580137189272-c9379f8864fd?q=80&w=600&auto=format&fit=crop",
        providers: "1.950 Hizmet Veren",
        rating: "4.8",
        reviews: "12.400 onaylı yorum"
      },
      {
        title: "Uluslararası Ev Taşıma",
        slug: "uluslararasi-nakliyat",
        image: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=600&auto=format&fit=crop",
        providers: "1.240 Hizmet Veren",
        rating: "4.7",
        reviews: "9.800 onaylı yorum"
      }
    ],
    allServices: [
      { name: "Asansörlü Nakliyat", slug: "asansorlu-nakliyat" },
      { name: "Eşya Depolama", slug: "esya-depolama" },
      { name: "Evden Eve Nakliyat", slug: "evden-eve-nakliyat" },
      { name: "Kamyonet Kiralama", slug: "kamyonet-kiralama" },
      { name: "Kasalar & Ağır Eşya Taşıma", slug: "parca-esya-tasima" },
      { name: "Mobilya Paketleme & Montaj", slug: "mobilya-montaji" },
      { name: "Ofis & İş Yeri Taşıma", slug: "ofis-tasima" },
      { name: "Parça Eşya Taşıma", slug: "parca-esya-tasima" },
      { name: "Piyano Taşıma Ustası", slug: "parca-esya-tasima" },
      { name: "Şehir İçi Nakliyat", slug: "evden-eve-nakliyat" },
      { name: "Şehirler Arası Nakliyat", slug: "sehirler-arasi-nakliyat" },
      { name: "Uluslararası Ev Taşıma", slug: "uluslararasi-nakliyat" }
    ]
  },
  tamir: {
    slug: "tamir",
    name: "Tamir",
    heroTitle: "Tamir & Servis Hizmetleri",
    heroSubtitle: "Klima, kombi, su tesisatı, elektrik ve beyaz eşya arızalarında anında destek alın.",
    heroImage: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=1600&auto=format&fit=crop",
    popularServices: [
      {
        title: "Klima Servisi & Bakımı",
        slug: "klima-servisi",
        image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600&auto=format&fit=crop",
        providers: "7.840 Hizmet Veren",
        rating: "4.8",
        reviews: "98.400 onaylı yorum"
      },
      {
        title: "Kombi Servisi & Petek",
        slug: "kombi-servisi",
        image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=600&auto=format&fit=crop",
        providers: "8.920 Hizmet Veren",
        rating: "4.9",
        reviews: "145.200 onaylı yorum"
      },
      {
        title: "Su Tesisatı & Kaçak Tespiti",
        slug: "su-tesisati",
        image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=600&auto=format&fit=crop",
        providers: "6.450 Hizmet Veren",
        rating: "4.8",
        reviews: "87.600 onaylı yorum"
      },
      {
        title: "Elektrik Tesisatı & Arıza",
        slug: "elektrik-tesisati",
        image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600&auto=format&fit=crop",
        providers: "5.980 Hizmet Veren",
        rating: "4.8",
        reviews: "76.100 onaylı yorum"
      },
      {
        title: "Beyaz Eşya Servisi",
        slug: "beyaz-esya-servisi",
        image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&auto=format&fit=crop",
        providers: "4.720 Hizmet Veren",
        rating: "4.7",
        reviews: "54.300 onaylı yorum"
      },
      {
        title: "Tıkanıklık Açma (Kırılmadan)",
        slug: "tikaniklik-acma",
        image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=600&auto=format&fit=crop",
        providers: "3.890 Hizmet Veren",
        rating: "4.9",
        reviews: "48.900 onaylı yorum"
      },
      {
        title: "Marangoz & Mobilya Montajı",
        slug: "marangoz",
        image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=600&auto=format&fit=crop",
        providers: "3.120 Hizmet Veren",
        rating: "4.8",
        reviews: "31.400 onaylı yorum"
      },
      {
        title: "Doğalgaz Tesisatı",
        slug: "dogalgaz-tesisati",
        image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=600&auto=format&fit=crop",
        providers: "2.950 Hizmet Veren",
        rating: "4.8",
        reviews: "26.800 onaylı yorum"
      }
    ],
    allServices: [
      { name: "Batarya & Musluk Tamiri", slug: "su-tesisati" },
      { name: "Beyaz Eşya Servisi", slug: "beyaz-esya-servisi" },
      { name: "Bulaşık Makinesi Servisi", slug: "beyaz-esya-servisi" },
      { name: "Buzdolabı Tamiri Ustası", slug: "beyaz-esya-servisi" },
      { name: "Çamaşır Makinesi Tamiri", slug: "beyaz-esya-servisi" },
      { name: "Doğalgaz Tesisatı", slug: "dogalgaz-tesisati" },
      { name: "Elektrik Arıza Tamiri", slug: "elektrik-tesisati" },
      { name: "Görüntülü Su Kaçağı Tespiti", slug: "su-kacagi-tespiti" },
      { name: "Klima Bakımı & Temizliği", slug: "klima-bakimi" },
      { name: "Klima Gaz Dolumu", slug: "klima-gaz-dolumu" },
      { name: "Klima Montajı & Taşıma", slug: "klima-montaji" },
      { name: "Klima Servisi & Tamiri", slug: "klima-servisi" },
      { name: "Klozet & Sifon Tamiri", slug: "klozet-tamiri" },
      { name: "Kombi Bakımı & Tamiri", slug: "kombi-servisi" },
      { name: "Marangoz & Mobilya Montajı", slug: "mobilya-montaji" },
      { name: "Petek Temizliği", slug: "petek-temizligi" },
      { name: "Su Kaçağı Tespiti", slug: "su-kacagi-tespiti" },
      { name: "Su Tesisatı Tamiri", slug: "su-tesisati" },
      { name: "Tıkanıklık Açma Ustası", slug: "tikaniklik-acma" },
      { name: "TV Montajı & Uydu Servisi", slug: "elektrik-tesisati" }
    ]
  },
  "ozel-ders": {
    slug: "ozel-ders",
    name: "Özel Ders",
    heroTitle: "Özel Ders Hizmetleri",
    heroSubtitle: "Alanında uzman eğitmenlerden birebir online veya yüz yüze ders alın.",
    heroImage: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1600&auto=format&fit=crop",
    popularServices: [
      {
        title: "İngilizce Özel Ders",
        slug: "ingilizce-ozel-ders",
        image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=600&auto=format&fit=crop",
        providers: "4.150 Hizmet Veren",
        rating: "4.9",
        reviews: "45.200 onaylı yorum"
      },
      {
        title: "Matematik Özel Ders",
        slug: "matematik-ozel-ders",
        image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=600&auto=format&fit=crop",
        providers: "5.280 Hizmet Veren",
        rating: "4.9",
        reviews: "68.900 onaylı yorum"
      },
      {
        title: "Direksiyon Dersi",
        slug: "direksiyon-dersi",
        image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=600&auto=format&fit=crop",
        providers: "3.920 Hizmet Veren",
        rating: "4.8",
        reviews: "39.100 onaylı yorum"
      },
      {
        title: "Piyano & Müzik Dersi",
        slug: "piyano-dersi",
        image: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?q=80&w=600&auto=format&fit=crop",
        providers: "2.140 Hizmet Veren",
        rating: "4.9",
        reviews: "21.400 onaylı yorum"
      },
      {
        title: "Yüzme Dersi",
        slug: "yuzme-dersi",
        image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=600&auto=format&fit=crop",
        providers: "1.850 Hizmet Veren",
        rating: "4.8",
        reviews: "16.800 onaylı yorum"
      },
      {
        title: "İlkokul Takviye Dersi",
        slug: "ilkokul-takviye",
        image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=600&auto=format&fit=crop",
        providers: "3.410 Hizmet Veren",
        rating: "4.9",
        reviews: "33.500 onaylı yorum"
      },
      {
        title: "Almanca Özel Ders",
        slug: "almanca-ozel-ders",
        image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=600&auto=format&fit=crop",
        providers: "1.920 Hizmet Veren",
        rating: "4.8",
        reviews: "18.200 onaylı yorum"
      },
      {
        title: "Yazılım & Kodlama Dersi",
        slug: "yazilim-dersi",
        image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=600&auto=format&fit=crop",
        providers: "2.450 Hizmet Veren",
        rating: "4.9",
        reviews: "24.600 onaylı yorum"
      }
    ],
    allServices: [
      { name: "Almanca Özel Ders", slug: "almanca-ozel-ders" },
      { name: "Biyoloji Özel Ders", slug: "ozel-ders" },
      { name: "Direksiyon Dersi", slug: "direksiyon-dersi" },
      { name: "Fen Bilgisi Dersi", slug: "ozel-ders" },
      { name: "Fizik Özel Ders", slug: "ozel-ders" },
      { name: "Gitar Dersi Eğitmeni", slug: "ozel-ders" },
      { name: "Ilkokul Okuma Yazma Takviye", slug: "ilkokul-takviye" },
      { name: "İngilizce Özel Ders", slug: "ingilizce-ozel-ders" },
      { name: "İspanyolca Özel Ders", slug: "ozel-ders" },
      { name: "Keman Dersi", slug: "ozel-ders" },
      { name: "LGS Sınav Hazırlık Dersi", slug: "ozel-ders" },
      { name: "Matematik Özel Ders", slug: "matematik-ozel-ders" },
      { name: "Online Özel Ders", slug: "ozel-ders" },
      { name: "Pilates / Fitness Özel Ders", slug: "ozel-ders" },
      { name: "Piyano Dersi", slug: "piyano-dersi" },
      { name: "Resim & Çizim Dersi", slug: "ozel-ders" },
      { name: "Satranç Dersi", slug: "ozel-ders" },
      { name: "Yazılım & Web Geliştirme", slug: "yazilim-dersi" },
      { name: "YKS / TYT Hazırlık Dersi", slug: "ozel-ders" },
      { name: "Yüzme Dersi Eğitmeni", slug: "yuzme-dersi" }
    ]
  },
  organizasyon: {
    slug: "organizasyon",
    name: "Organizasyon",
    heroTitle: "Organizasyon & Etkinlik",
    heroSubtitle: "Düğün, nişan, doğum günü ve özel davetlerde profesyonel organizatörlerden teklif alın.",
    heroImage: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1600&auto=format&fit=crop",
    popularServices: [
      {
        title: "Düğün Fotoğrafçısı",
        slug: "dugun-fotografcisi",
        image: "https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=600&auto=format&fit=crop",
        providers: "3.840 Hizmet Veren",
        rating: "4.9",
        reviews: "52.300 onaylı yorum"
      },
      {
        title: "Nişan & Söz Organizasyonu",
        slug: "nisan-organizasyonu",
        image: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600&auto=format&fit=crop",
        providers: "4.120 Hizmet Veren",
        rating: "4.8",
        reviews: "41.800 onaylı yorum"
      },
      {
        title: "Catering & Yemek Hizmeti",
        slug: "catering",
        image: "https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=600&auto=format&fit=crop",
        providers: "2.950 Hizmet Veren",
        rating: "4.8",
        reviews: "31.200 onaylı yorum"
      },
      {
        title: "Doğum Günü Organizasyonu",
        slug: "dogum-gunu-organizasyonu",
        image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=600&auto=format&fit=crop",
        providers: "3.240 Hizmet Veren",
        rating: "4.9",
        reviews: "38.600 onaylı yorum"
      },
      {
        title: "DJ & Ses Işık Kiralama",
        slug: "dj-kiralama",
        image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop",
        providers: "2.150 Hizmet Veren",
        rating: "4.8",
        reviews: "22.400 onaylı yorum"
      },
      {
        title: "Açılış & Kokteyl Organizasyonu",
        slug: "kokteyl-organizasyonu",
        image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=600&auto=format&fit=crop",
        providers: "1.950 Hizmet Veren",
        rating: "4.8",
        reviews: "19.100 onaylı yorum"
      },
      {
        title: "Palyaço & Animasyon",
        slug: "animasyon-palyaco",
        image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=600&auto=format&fit=crop",
        providers: "2.410 Hizmet Veren",
        rating: "4.9",
        reviews: "27.500 onaylı yorum"
      },
      {
        title: "Video Çekimi & Drone",
        slug: "video-cekimi",
        image: "https://images.unsplash.com/photo-1508615039623-a25605d2b022?q=80&w=600&auto=format&fit=crop",
        providers: "2.890 Hizmet Veren",
        rating: "4.8",
        reviews: "34.200 onaylı yorum"
      }
    ],
    allServices: [
      { name: "Açılış Organizasyonu", slug: "kokteyl-organizasyonu" },
      { name: "Animasyon & Palyaço Kiralama", slug: "animasyon-palyaco" },
      { name: "Canlı Müzik Grubu & Orkestra", slug: "dj-kiralama" },
      { name: "Catering & İkram Hizmeti", slug: "catering" },
      { name: "DJ Kiralama Hizmeti", slug: "dj-kiralama" },
      { name: "Doğum Günü Organizasyonu", slug: "dogum-gunu-organizasyonu" },
      { name: "Drone Video Çekimi", slug: "video-cekimi" },
      { name: "Düğün Fotoğrafçısı", slug: "dugun-fotografcisi" },
      { name: "Düğün Organizasyonu", slug: "dugun-fotografcisi" },
      { name: "Evlilik Teklifi Organizasyonu", slug: "nisan-organizasyonu" },
      { name: "Kına Gecesi Organizasyonu", slug: "nisan-organizasyonu" },
      { name: "Kokteyl Organizasyonu", slug: "kokteyl-organizasyonu" },
      { name: "Nişan & Söz Organizasyonu", slug: "nisan-organizasyonu" },
      { name: "Özel Aşçı Hizmeti", slug: "catering" },
      { name: "Pasta Yapımı & Butik Pasta", slug: "catering" },
      { name: "Ses & Işık Sistemi Kiralama", slug: "dj-kiralama" },
      { name: "Sünnet Organizasyonu", slug: "dogum-gunu-organizasyonu" },
      { name: "Ürün Fotoğrafçılığı", slug: "dugun-fotografcisi" },
      { name: "Video Çekimi & Kurgu", slug: "video-cekimi" }
    ]
  }
};

export async function generateMetadata({ params }: PageProps) {
  const { group } = await params;
  const groupData = GROUP_DATABASE[group.toLowerCase()];

  if (!groupData) {
    return {
      title: "Hizmet Kategorileri | Esnaaf",
      description: "Esnaaf ile en iyi hizmet verenlerden anında teklif toplayın."
    };
  }

  return {
    title: `${groupData.heroTitle} | 30 Dakikada Teklif Al | Esnaaf`,
    description: groupData.heroSubtitle,
    openGraph: {
      title: `${groupData.heroTitle} | Esnaaf`,
      description: groupData.heroSubtitle,
      images: [groupData.heroImage]
    }
  };
}

export default async function CategoryGroupPage({ params }: PageProps) {
  const { group } = await params;
  const groupData = GROUP_DATABASE[group.toLowerCase()];

  if (!groupData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#c8f252]/30 flex flex-col pt-20">
      {/* Top Floating Glassmorphic Navigation Bar */}
      <HeaderNavbar />

      {/* Interactive Category Group View */}
      <CategoryGroupClient groupData={groupData} />

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
