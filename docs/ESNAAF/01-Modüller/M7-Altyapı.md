---
title: M7 — Altyapı & DevOps
type: modül
prd-refs: ["§16", "§17", "§18", "§19", "§20"]
related: ["[[M1-Auth-Kullanıcı]]", "[[M2-AI-Chat-Talep]]", "[[M3-Eşleştirme-Teklif]]", "[[M4-Ödeme-Kampanya]]", "[[M5-Puan-Şikayet-NPS]]", "[[M6-Admin-Roller]]"]
status: complete
updated: 2026-05-24
---

> Tüm modüllerin bağımlı olduğu altyapı katmanı — veritabanı şeması, API endpoint listesi, teknoloji stack'i, deploy stratejisi ve MVP planından sorumlu Single Source of Truth modülü.

## PRD Bölümleri

- [§16 Teknoloji Stack](../../esnaaf-claude.md)
- [§17 Hata Senaryoları & Edge Case'ler](../../esnaaf-claude.md)
- [§18 Performans & Ölçeklendirme](../../esnaaf-claude.md)
- [§19 MVP Yol Haritası](../../esnaaf-claude.md)
- [§20 Başarı Metrikleri & KPI](../../esnaaf-claude.md)

## Sorumluluk Alanı

- PostgreSQL veritabanı şeması (tüm tablolar) — Single Source of Truth
- Prisma index stratejisi ve migration yönetimi
- API endpoint listesi ve versiyon yönetimi
- ENV değişkenleri ve secret yönetimi
- Teknoloji stack seçimi ve entegrasyonları
- Deploy stratejisi (Railway MVP → AWS ECS Prod)
- MVP fazlama planı
- Monitoring, alarm ve fallback mekanizmaları
- Rate limiting ve güvenlik altyapısı

## Bağımlılıklar

```
Tüm modüller → M7 (DB, API, Auth altyapısı)
M1 → M7 (JWT, rate limit, hata yönetimi)
M2 → M7 (WebSocket, Redis, OpenAI entegrasyonu)
M3 → M7 (BullMQ kuyruk, eşleştirme altyapısı)
M4 → M7 (iyzico entegrasyonu, cron job'lar)
M5 → M7 (bildirim altyapısı, analitik)
M6 → M7 (loglama, audit trail)
```

## Teknoloji Stack

### Backend

| Katman | Teknoloji | Not |
|---|---|---|
| API Framework | NestJS (Node.js) | Modüler mimari, TypeScript |
| ORM | Prisma | Type-safe, migration desteği |
| Kuyruk | BullMQ | Redis-based job queue |
| WebSocket | Socket.io (NestJS Gateway) | Gerçek zamanlı iletişim |

### Frontend & Mobil

| Katman | Teknoloji | Not |
|---|---|---|
| Web (Müşteri) | Next.js 14 (App Router) | SSR, SEO optimizasyonu |
| Mobil (HA) | React Native (Expo) | `app-musteri/` — Esnaaf HA |
| Mobil (HV) | React Native (Expo) | `app-hizmetveren/` — Esnaaf Partner HV |

### Veritabanı & Cache

| Katman | Teknoloji | Not |
|---|---|---|
| Veritabanı | PostgreSQL 15+ | Ana veritabanı |
| Cache & Session | Redis (Upstash) | Serverless Redis |

### AI & Entegrasyonlar

| Katman | Teknoloji | Not |
|---|---|---|
| AI Chat | OpenAI GPT-4o Mini + LangChain | Akıllı talep oluşturma |
| Ödeme | iyzico | Abonelik & tek çekim |
| Bildirim (Push) | Firebase FCM | Mobil push notification |
| SMS | Netgsm (birincil), İleTiMer (yedek) | OTP & bildirim |
| Dosya Depolama | AWS S3 / Cloudflare R2 | Presigned URL ile upload |
| Monitoring | Sentry + Grafana | Hata takibi & metrikler |

### Deploy

| Ortam | Altyapı | Not |
|---|---|---|
| MVP | Railway | Hızlı deploy, düşük maliyet |
| Production | AWS ECS | Auto-scaling, yüksek erişilebilirlik |

## Monorepo Yapısı

```
esnaaf/
├── backend-api/          # NestJS API servisi
│   ├── src/
│   │   ├── auth/         # M1 modülü
│   │   ├── chat/         # M2 modülü
│   │   ├── matching/     # M3 modülü
│   │   ├── payment/      # M4 modülü
│   │   ├── review/       # M5 modülü
│   │   ├── admin/        # M6 modülü
│   │   └── common/       # Ortak servisler
│   ├── prisma/
│   │   └── schema.prisma
│   └── .env
├── app-musteri/          # Esnaaf HA (React Native Expo)
├── app-hizmetveren/      # Esnaaf Partner HV (React Native Expo)
├── docs/                 # Bu wiki
└── package.json
```

## Dosya Yükleme Stratejisi

```
1. Frontend → Backend'den presigned URL ister
2. Backend → S3/R2'den presigned URL üretir, döner
3. Frontend → Presigned URL ile doğrudan S3/R2'ye yükler
4. Frontend → Yükleme tamamlandığında Backend'e file key bildirir
5. Backend → DB'ye kaydeder
```

> **Not:** Backend dosya proxy'si yapmaz — doğrudan istemciden S3'e yükleme yapılır.

## MVP Fazlama Planı

### Phase 1 — Temel Akış (Hafta 1–8)

| Hafta | Çıktı |
|---|---|
| 1–2 | Auth (OTP kayıt/giriş), DB şeması, proje iskeleti |
| 3–4 | AI Chat talep oluşturma, kategori tespiti |
| 5–6 | Eşleştirme motoru, teklif gönderme |
| 7–8 | Teklif kabul, telefon açma, temel bildirimler |

### Phase 2 — Gelir & Kalite (Hafta 9–16)

| Hafta | Çıktı |
|---|---|
| 9–10 | iyzico ödeme entegrasyonu, abonelik sistemi |
| 11–12 | Puan verme, yorum sistemi, şikayet yönetimi |
| 13–14 | NPS anketi, admin panel (temel modüller) |
| 15–16 | Admin panel (ileri modüller), raporlama |

### Phase 3 — Mobil & Ölçek (Hafta 17–26)

| Hafta | Çıktı |
|---|---|
| 17–20 | React Native mobil uygulamalar (HA + HV) |
| 21–23 | CRM entegrasyonu, kampanya motoru |
| 24–26 | Performans optimizasyonu, ölçeklendirme, yük testi |

## Monitoring & Alarm Kuralları

| Metrik | Eşik | Aksiyon |
|---|---|---|
| API Error Rate | > 5% | 🔴 Acil alarm, on-call bildirim |
| Queue Backlog | > 500 iş | 🟡 Worker ölçeklendirme uyarısı |
| DB Query Süresi | > 2 saniye | 🟡 Sorgu optimizasyonu uyarısı |
| OTP Başarı Oranı | < 70% | 🔴 SMS provider kontrol, yedek geçiş |
| OpenAI Error Rate | > 10% | 🟡 GPT-4o Mini fallback aktif |

### AI Fallback Stratejisi

```
GPT-4o → hata oranı > 10% → GPT-4o Mini'ye otomatik geçiş
GPT-4o Mini → hata → "Anlayamadım" mesajı + kategori listesi göster
```

## DB Tabloları

Tüm modüllerin tablo tanımları:

- [[users]] — kullanıcı kayıtları
- [[service_providers]] — HV profil bilgileri
- [[kvkk_consents]] — KVKK onay kayıtları
- [[otp_codes]] — OTP kodları
- [[sessions]] — aktif oturumlar
- [[chat_sessions]] — AI chat oturumları
- [[chat_messages]] — chat mesajları
- [[service_requests]] — hizmet talepleri
- [[offers]] — HV teklifleri
- [[offer_acceptances]] — teklif kabulleri
- [[subscriptions]] — abonelikler
- [[payments]] — ödeme kayıtları
- [[campaigns]] — kampanyalar
- [[reviews]] — puanlar ve yorumlar
- [[complaints]] — şikayetler
- [[nps_responses]] — NPS anket yanıtları
- [[notifications]] — bildirim kayıtları
- [[admin_users]] — admin personel
- [[admin_roles]] — admin rolleri
- [[admin_permissions]] — izin matrisi
- [[activity_logs]] — admin aktivite logları
- [[audit_logs]] — denetim kayıtları
- [[categories]] — hizmet kategorileri

## Endpoint'ler

- [[Auth-Endpoints]] — `/api/auth/*`
- [[Chat-Endpoints]] — `/api/chat/*`
- [[Request-Endpoints]] — `/api/requests/*`
- [[Offer-Endpoints]] — `/api/offers/*`
- [[Payment-Endpoints]] — `/api/payments/*`
- [[Review-Endpoints]] — `/api/reviews/*`
- [[Admin-Endpoints]] — `/api/admin/*`
- [[Notification-Endpoints]] — `/api/notifications/*`
- [[Upload-Endpoints]] — `/api/upload/*`

## İlgili Akışlar

- [[AI-Chat-Akışı]]
- [[OTP-Kayıt-Akışı]]
- [[Talep-Yaşam-Döngüsü]]
- [[Abonelik-Ödeme-Akışı]]

## İlgili Kavramlar

- [[JWT-Token]]
- [[Rate-Limit]]
- [[ENV-Değişkenleri]]
- [[Monorepo-Yapısı]]
- [[Presigned-URL]]
- [[WebSocket-Gateway]]
