---
title: Stack
type: teknoloji
prd-refs: ["§16"]
related: ["[[Monorepo-Yapısı]]", "[[ENV-Değişkenleri]]", "[[M7-Altyapı]]"]
status: complete
updated: 2026-05-24
---

> Esnaaf platformunun tüm teknoloji yığını — backend, frontend, altyapı ve üçüncü parti servis entegrasyonları.

## PRD Referansları

- [§16 — Teknoloji Yığını](../../esnaaf-claude.md) — Teknoloji seçimleri ve gerekçeleri
- [§16.4 — Environment Değişkenleri](../../esnaaf-claude.md) — 35+ ortam değişkeni listesi

## Backend

| Teknoloji | Amaç | Versiyon |
|-----------|-------|----------|
| **NestJS** | Ana API framework | Latest |
| **Prisma ORM** | Veritabanı erişim katmanı | Latest |
| **BullMQ (Redis)** | Kuyruk yönetimi, zamanlanmış görevler, bildirimler | Latest |
| **LangChain + OpenAI** | AI destekli sohbet, talep oluşturma, NLP | GPT-4o / GPT-4o-mini |
| **Socket.io** | Gerçek zamanlı mesajlaşma (WebSocket) | Latest |
| **iyzico SDK** | Ödeme altyapısı, abonelik yönetimi | Latest |
| **Netgsm SMS** | OTP gönderimi, SMS bildirimleri | API v1 |
| **AWS S3 / Cloudflare R2** | Dosya depolama (belgeler, görseller) | — |

### Backend Mimari Kararları

- **NestJS** modüler yapısı ile domain-driven tasarım uygulanır
- **Prisma** type-safe ORM olarak seçildi — migration yönetimi dahil
- **BullMQ** ile delayed jobs, cron jobs ve retry mekanizması
- **Socket.io** ile HA↔HV mesajlaşma ve gerçek zamanlı bildirimler

## Frontend

| Teknoloji | Amaç | Platform |
|-----------|-------|----------|
| **Next.js 14** | Web uygulaması (landing, admin panel) | Web |
| **React Native Expo** | Esnaaf HA (müşteri) mobil uygulaması | iOS + Android |
| **React Native Expo** | Esnaaf Partner HV (usta) mobil uygulaması | iOS + Android |
| **Zustand / Redux Toolkit** | State yönetimi | Tüm platformlar |

### Frontend Mimari Kararları

- **İki ayrı mobil uygulama**: HA ve HV için ayrı Expo projeleri (farklı store listingleri)
- **Zustand** hafif state yönetimi için tercih, karmaşık durumlar için **Redux Toolkit**
- **Next.js 14** App Router ile server-side rendering (SSR) ve SEO optimizasyonu

## Altyapı (Infrastructure)

| Bileşen | MVP Ortamı | Production Ortamı |
|---------|------------|-------------------|
| **Veritabanı** | PostgreSQL 15+ (Railway) | PostgreSQL 15+ (AWS RDS) |
| **Cache & Queue** | Redis (Upstash) | Redis (Upstash / ElastiCache) |
| **Hosting** | Railway | AWS ECS |
| **CDN** | — | Cloudflare |
| **CI/CD** | GitHub Actions | GitHub Actions |
| **Monitoring** | — | Sentry, Grafana |

### Altyapı Notları

- **MVP**: Railway üzerinde hızlı deployment, tek ortam
- **Production**: AWS ECS ile container orchestration, auto-scaling
- **PostgreSQL 15+**: JSON operatörleri, gelişmiş indeksleme desteği
- **Redis (Upstash)**: Serverless Redis — BullMQ kuyrukları ve session cache

## Üçüncü Parti Servisler

| Servis | Amaç | Entegrasyon |
|--------|-------|-------------|
| **OpenAI API** | AI sohbet, talep özeti, NLP | LangChain SDK |
| **iyzico** | Ödeme, abonelik, kart saklama | iyzico Node.js SDK |
| **Netgsm** | SMS OTP gönderimi | REST API |
| **Firebase** | Push bildirimler (FCM) | Firebase Admin SDK |
| **SendGrid / AWS SES** | Transactional e-posta | SDK / SMTP |
| **AWS S3 / Cloudflare R2** | Dosya depolama | AWS SDK |
| **Sentry** | Hata takibi (Production) | Sentry SDK |

## Environment Değişkenleri

PRD §16.4'te tanımlanan **35+ environment değişkeni** mevcuttur. Başlıca kategoriler:

| Kategori | Örnek Değişkenler |
|----------|------------------|
| **Veritabanı** | `DATABASE_URL`, `REDIS_URL` |
| **Kimlik Doğrulama** | `JWT_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL` |
| **Ödeme** | `IYZICO_API_KEY`, `IYZICO_SECRET_KEY`, `IYZICO_BASE_URL` |
| **SMS** | `NETGSM_USERCODE`, `NETGSM_PASSWORD`, `NETGSM_HEADER` |
| **AI** | `OPENAI_API_KEY`, `OPENAI_MODEL` |
| **Depolama** | `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` |
| **Push** | `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY` |
| **E-posta** | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` |
| **Uygulama** | `APP_PORT`, `APP_ENV`, `CORS_ORIGINS` |

> Detaylı liste için bkz: [[ENV-Değişkenleri]]

## İlgili Sayfalar

- [[Monorepo-Yapısı]] — Proje dizin yapısı
- [[ENV-Değişkenleri]] — Tüm environment değişkenleri listesi
- [[M7-Altyapı]] — Altyapı modülü detayları
- [[JWT-Token]] — JWT token güvenlik yapılandırması
- [[Dosya-Yükleme]] — Dosya yükleme altyapısı
