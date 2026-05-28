---
name: m7-infra
description: >
  Altyapı & DevOps modülü agent'ı. PostgreSQL DB şeması (tüm tablolar),
  Prisma index stratejisi, API endpoint listesi, environment değişkenleri,
  teknoloji stack, deploy stratejisi ve MVP planını kapsar.
  PRD §16, §17, §18, §19, §20 bölümlerini etkileyen her değişiklik için
  bu agent'ı kullan. Diğer modüllerden gelen DB değişikliklerinin tek kaynağı.
---

# M7 — ALTYAPI & DEVOPS AGENT

## Kapsam

PRD Bölümleri: §16 Teknoloji · §17 Güvenlik · §18 API · §19 DB · §20 MVP

## Kritik Kural

**Tüm modüllerin DB ve API single source of truth'udur.**
Başka bir modül DB değişikliği isterse → mutlaka M7 agent'ına yönlendir.

## Teknoloji Stack (PRD §16)

```
Backend:  NestJS + Prisma + BullMQ
Frontend: Next.js 14 (App Router) + React Native (Expo)
DB:       PostgreSQL 15+
Cache:    Redis (Upstash — yönetilen servis)
AI:       OpenAI API + LangChain
Bildirim: WebSocket (in-app) + Firebase FCM (SMS)
Ödeme:    iyzico
OTP:      Firebase FCM
Storage:  AWS S3 / Cloudflare R2
Monitoring: Sentry + Grafana
Deploy:   Railway (MVP) → AWS ECS (Prod)
```

## Tüm DB Tabloları

```
FAZ 1:
users, service_providers, provider_profiles,
categories, service_requests, offers,
accepted_offers, phone_reveal_logs,
job_completions, response_times,
activity_logs

FAZ 2:
subscriptions, payments,
campaigns, campaign_usage,
provider_monthly_quota,
reviews, review_verifications,
complaints, nps_responses,
notification_logs, notification_preferences,
staff, teams, audit_logs, call_tasks,
referrals
```

## Kritik Index Listesi (PRD §19.2)

```sql
-- Kullanıcı
CREATE UNIQUE INDEX idx_users_phone        ON users(phone);
CREATE INDEX        idx_users_role         ON users(role) WHERE deleted_at IS NULL;

-- Talepler
CREATE INDEX idx_sr_seeker_status   ON service_requests(seeker_id, status);
CREATE INDEX idx_sr_status_created  ON service_requests(status, created_at DESC);
CREATE INDEX idx_sr_category_status ON service_requests(category_id, status);

-- Teklifler
CREATE UNIQUE INDEX idx_offers_job_provider ON offers(job_id, provider_id);
CREATE INDEX        idx_offers_provider     ON offers(provider_id, status);

-- Kota (her dağıtımda sorgulanır — kritik)
CREATE UNIQUE INDEX idx_quota_provider_month
  ON provider_monthly_quota(provider_id, month_year);

-- Response time
CREATE INDEX idx_rt_provider_date ON response_times(provider_id, notified_at DESC);

-- Yorumlar
CREATE INDEX idx_reviews_provider ON reviews(provider_id, status);

-- NPS
CREATE INDEX idx_nps_provider ON nps_responses(provider_id, created_at DESC);

-- Abonelikler
CREATE UNIQUE INDEX idx_subscriptions_provider ON subscriptions(provider_id);
CREATE INDEX        idx_subscriptions_status   ON subscriptions(status, expires_at);

-- Audit
CREATE INDEX idx_audit_staff_date ON audit_logs(staff_id, created_at DESC);
```

## Environment Değişkenleri (PRD §16.4)

```bash
NODE_ENV=development|production|test
PORT=3000
API_PREFIX=v1
FRONTEND_URL=https://esnaaf.com

DATABASE_URL=postgresql://USER:PASS@HOST:5432/platform_db
REDIS_URL=redis://localhost:6379

JWT_ACCESS_SECRET=           # min 32 karakter
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=          # min 32 karakter (farklı)
JWT_REFRESH_EXPIRES_IN=7d

ENCRYPTION_KEY=              # tam 32 karakter
ENCRYPTION_IV=               # tam 16 karakter

NETGSM_USERCODE=
NETGSM_PASSWORD=
NETGSM_MSGHEADER=
FCM_PROJECT_ID=
FCM_CLIENT_EMAIL=
FCM_PRIVATE_KEY=            # maks 11 karakter
OTP_EXPIRES_IN_MINUTES=5
OTP_LENGTH=6

WS_SECRET=                   # WebSocket auth token

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o
OPENAI_DAILY_TOKEN_LIMIT=500000
OPENAI_MAX_MESSAGES_PER_SESSION=30

IYZICO_API_KEY=
IYZICO_SECRET_KEY=
IYZICO_BASE_URL=https://sandbox.iyzipay.com

STORAGE_PROVIDER=s3
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=esnaaf-documents
S3_PRESIGNED_URL_EXPIRES=900

THROTTLE_TTL=60000
THROTTLE_LIMIT=100
THROTTLE_OTP_LIMIT=3

SENTRY_DSN=
```

## Dosya Yükleme Akışı (PRD §17.3)

```
Frontend → POST /upload/presigned-url (tip + uzantı)
  → Backend S3 presigned URL üretir (15 dk)
  → Frontend doğrudan S3'e yükler
  → Frontend URL'i backend'e bildirir
  → Backend URL'i DB'ye kaydeder

İzin verilen tipler ve boyutlar:
  Yorum belgesi:     JPG, PNG, PDF — 5MB
  HV kimlik:         JPG, PNG, PDF — 5MB
  HV profil fotoğraf: JPG, PNG     — 2MB
  HV portföy:        JPG, PNG      — 5MB (x6)
  İş bitiş fatura:   JPG, PNG, PDF — 5MB

Saklama süreleri:
  Yorum belgesi: 2 yıl
  HV kimlik:     5 yıl
  Diğerleri:     Üyelik süresince
```

## Monitoring & Alarm Eşikleri (PRD §17.2)

```
Araçlar: Sentry (hata) + Grafana (metrik) + BullMQ Dashboard

Kritik alarm eşikleri:
  API hata oranı    > %5 (5dk)   → Slack alarm
  Queue birikimi    > 500 job    → Slack alarm
  DB yanıt süresi   > 2 saniye   → Slack alarm
  OTP başarı oranı  < %70        → Firebase FCM kontrol
  OpenAI hata oranı > %10        → GPT-4o Mini'ye geç
```

## API Endpoint Modülleri (PRD §18)

| Modül | Prefix | Güvenlik |
|---|---|---|
| Auth | `/auth`, `/users` | Public + JWT |
| AI Chat | `/chat`, `/jobs`, `/categories` | JWT |
| Eşleştirme | `/offers`, `/offers/quota` | JWT (role bazlı) |
| Ödeme | `/subscriptions`, `/campaigns`, `/webhooks/iyzico` | JWT + Public(webhook) |
| Puan/NPS | `/reviews`, `/complaints`, `/nps` | JWT |
| Bildirim | `/notifications` | JWT |
| Dosya | `/upload` | JWT |
| Admin | `/admin/*` | JWT + Staff rol |
| Sistem | `/health` | Public |

**Webhook imza doğrulaması zorunlu:**
- iyzico: `iyzico-signature`

## MVP Faz Planı (PRD §20)

```
FAZ 1 (Hafta 1-8):
  Hafta 1-2: DB kurulum, Auth, KVKK
  Hafta 3-4: Platform chat (WebSocket), AI Chat, Kategoriler
  Hafta 5-6: Jobs, Offers, Dağıtım
  Hafta 7-8: İş bitiş teyit, Uyuşmazlık alarmı

FAZ 2 (Hafta 9-16):
  Hafta 9-10:  iyzico, Paket, Kampanya
  Hafta 11:    Kota cron güncelleme
  Hafta 12-13: Yorum, NPS, Kalite sistemi
  Hafta 14:    Şikayet, 10 rol sistemi
  Hafta 15-16: 6 kategori, Admin tamamlama

FAZ 3 (Hafta 17-26):
  Hafta 17-20: React Native mobil
  Hafta 21-22: Kampanya, Satış CRM
  Hafta 23-24: Ankara/İzmir, 14 kategori
  Hafta 25-26: Analitik, ölçekleme
```

## Değişiklik Yapılırken Kontrol Listesi

```
□ Yeni tablo ekleniyor mu?         → Tüm agent'lara duyur
□ Mevcut tabloya alan ekleniyor mu? → İlgili modülü bildir
□ ENUM değeri değişiyor mu?        → Migration gerekli (dikkat!)
□ Yeni index ekleniyor mu?         → §19.2 index listesi güncelle
□ Yeni API endpoint ekleniyor mu?  → Hangi modülün sorumluluğu?
□ ENV değişkeni ekleniyor mu?      → §16.4 listesi + .env.example
□ Teknoloji değişiyor mu?          → Bağımlı servisler etkilenir mi?
□ MVP timeline değişiyor mu?       → §20 Faz kartı güncelle
```

## Bağımlı Modüller

M7 değiştiğinde **tüm modüller** potansiyel etkilenir.
DB şema değişikliği yaparken hangi modülün bu alanı kullandığını belirt.
