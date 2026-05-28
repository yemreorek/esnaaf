---
title: Monorepo Yapısı
type: teknoloji
prd-refs: ["§16.0"]
related: ["[[Stack]]", "[[M7-Altyapı]]"]
status: complete
updated: 2026-05-24
---

> Esnaaf platformunun monorepo dizin yapısı — backend API, HA mobil uygulaması ve HV mobil uygulaması tek repoda yönetilir.

## PRD Referansları

- [§16.0 — Monorepo Yapısı](../../esnaaf-claude.md) — Proje dizin organizasyonu

## Genel Yapı

```
esnaaf/
├── backend-api/          # NestJS Backend API
├── app-musteri/          # Esnaaf HA — React Native Expo (Müşteri)
├── app-hizmetveren/      # Esnaaf Partner HV — React Native Expo (Usta)
├── docs/                 # Dokümantasyon (bu wiki)
├── .github/              # GitHub Actions CI/CD
├── .env.example          # Örnek environment değişkenleri
├── package.json          # Root package.json (workspace)
└── README.md
```

## Backend API (`backend-api/`)

NestJS uygulaması, domain-driven modüler yapıda organize edilmiştir:

```
backend-api/
├── src/
│   ├── musteri/              # Hizmet Alan (HA) domain modülü
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── dto/
│   │   └── musteri.module.ts
│   │
│   ├── hizmetveren/          # Hizmet Veren (HV) domain modülü
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── dto/
│   │   └── hizmetveren.module.ts
│   │
│   ├── ortak/                # Ortak iş mantığı modülü
│   │   ├── talep/            # Talep yönetimi
│   │   ├── teklif/           # Teklif yönetimi
│   │   ├── mesajlasma/       # Mesajlaşma (Socket.io)
│   │   ├── degerlendirme/    # Değerlendirme & NPS
│   │   └── bildirim/         # Bildirim servisi
│   │
│   ├── admin/                # Admin panel API modülü
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── dto/
│   │   └── admin.module.ts
│   │
│   ├── common/               # Paylaşılan yardımcı modüller
│   │   ├── guards/           # JWT, Role, Throttle guard'ları
│   │   ├── interceptors/     # Logging, Transform interceptor'ları
│   │   ├── decorators/       # Custom decorator'lar
│   │   ├── filters/          # Exception filter'lar
│   │   ├── pipes/            # Validation pipe'lar
│   │   └── utils/            # Yardımcı fonksiyonlar
│   │
│   ├── prisma/               # Prisma service & migrations
│   │   ├── prisma.service.ts
│   │   └── schema.prisma
│   │
│   ├── app.module.ts         # Root module
│   └── main.ts               # Entry point
│
├── test/                     # E2E testler
├── prisma/
│   ├── schema.prisma         # Veritabanı şeması
│   ├── migrations/           # Migration dosyaları
│   └── seed.ts               # Seed data
├── package.json
├── tsconfig.json
└── nest-cli.json
```

### Domain Modülleri

| Modül | İçerik | Açıklama |
|-------|--------|----------|
| `musteri/` | HA kayıt, profil, talep geçmişi | Hizmet Alan'a özel endpoint'ler |
| `hizmetveren/` | HV kayıt, profil, teklif, abonelik | Hizmet Veren'e özel endpoint'ler |
| `ortak/` | Talep, teklif, mesajlaşma, değerlendirme | Her iki rol tarafından kullanılan ortak iş mantığı |
| `admin/` | Onay, moderasyon, raporlama | Admin panel API endpoint'leri |
| `common/` | Guard, interceptor, pipe, decorator | Tüm modüller tarafından paylaşılan teknik bileşenler |

## Müşteri Uygulaması (`app-musteri/`)

**Esnaaf HA** — Hizmet Alan (müşteri) mobil uygulaması.

```
app-musteri/
├── src/
│   ├── screens/              # Uygulama ekranları
│   │   ├── auth/             # Giriş, OTP doğrulama
│   │   ├── chat/             # AI sohbet (talep oluşturma)
│   │   ├── offers/           # Teklif listesi & detay
│   │   ├── messages/         # HV ile mesajlaşma
│   │   ├── reviews/          # Değerlendirme yazma
│   │   └── profile/          # Profil yönetimi
│   ├── components/           # Yeniden kullanılabilir bileşenler
│   ├── navigation/           # React Navigation yapısı
│   ├── store/                # Zustand / Redux state
│   ├── services/             # API çağrıları
│   ├── hooks/                # Custom hook'lar
│   └── utils/                # Yardımcı fonksiyonlar
├── assets/                   # Görseller, fontlar
├── app.json                  # Expo yapılandırması
└── package.json
```

**Store Listesi**: `Esnaaf` (iOS App Store + Google Play Store)

## Hizmet Veren Uygulaması (`app-hizmetveren/`)

**Esnaaf Partner HV** — Hizmet Veren (usta) mobil uygulaması.

```
app-hizmetveren/
├── src/
│   ├── screens/              # Uygulama ekranları
│   │   ├── auth/             # Giriş, OTP, belge yükleme
│   │   ├── jobs/             # İş ilanları listesi
│   │   ├── offers/           # Teklif gönderme & takip
│   │   ├── messages/         # HA ile mesajlaşma
│   │   ├── subscription/     # Abonelik & ödeme
│   │   ├── reviews/          # Değerlendirmelerim
│   │   └── profile/          # Profil & hizmet alanları
│   ├── components/           # Yeniden kullanılabilir bileşenler
│   ├── navigation/           # React Navigation yapısı
│   ├── store/                # Zustand / Redux state
│   ├── services/             # API çağrıları
│   ├── hooks/                # Custom hook'lar
│   └── utils/                # Yardımcı fonksiyonlar
├── assets/                   # Görseller, fontlar
├── app.json                  # Expo yapılandırması
└── package.json
```

**Store Listesi**: `Esnaaf Partner` (iOS App Store + Google Play Store)

## Neden Monorepo?

| Avantaj | Açıklama |
|---------|----------|
| **Kod paylaşımı** | Ortak tipler, validasyon kuralları ve API contract'ları tek yerde |
| **Atomic commit** | Backend + Frontend değişiklikleri tek commit'te |
| **CI/CD kolaylığı** | Tek pipeline ile tüm projelerin build/test/deploy işlemleri |
| **Versiyon tutarlılığı** | Bağımlılıklar merkezi olarak yönetilir |

## İlgili Sayfalar

- [[Stack]] — Teknoloji yığını
- [[M7-Altyapı]] — Altyapı modülü detayları
- [[ENV-Değişkenleri]] — Environment değişkenleri
