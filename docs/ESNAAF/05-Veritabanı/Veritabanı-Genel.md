---
title: Veritabanı — Genel Bakış
type: tablo
prd-refs: ["§19"]
related: ["[[M7-Altyapı]]", "[[Stack]]"]
status: complete
updated: 2026-05-24
---

> Esnaaf platformunun tüm veritabanı tablolarının modül bazlı gruplandırması ve kritik indeksler.

## PRD Bölümleri

- [§19 Veritabanı Şeması](../../esnaaf-claude.md)
- [§19.2 Kritik İndeksler](../../esnaaf-claude.md)

## Veritabanı Teknolojisi

| Bileşen | Teknoloji |
|---|---|
| RDBMS | PostgreSQL |
| Cache | Redis |
| Kuyruk | BullMQ (Redis tabanlı) |
| ORM | Prisma veya TypeORM |
| Migration | Framework ORM migration |

## Tablo Grupları

### 1. Auth & Kullanıcılar

| Tablo | Açıklama | İlişkili Modül |
|---|---|---|
| `users` | Tüm kullanıcılar (HA + HV + Admin) | [[M1-Auth-Kullanıcı]] |
| `service_providers` | Hizmet veren profil ve detay bilgileri | [[M1-Auth-Kullanıcı]] |
| `temp_sessions` | Anonim oturum verileri (kayıt öncesi chat) | [[M1-Auth-Kullanıcı]] |

### 2. Talepler & Teklifler

| Tablo | Açıklama | İlişkili Modül |
|---|---|---|
| `service_requests` | Hizmet talepleri (job) | [[M2-AI-Chat-Talep]] |
| `offers` | HV'lerin verdiği teklifler | [[M3-Eşleştirme-Teklif]] |
| `accepted_offers` | HA'nın kabul ettiği teklifler | [[M3-Eşleştirme-Teklif]] |
| `phone_reveal_logs` | Telefon maskeleme açma logları | [[M3-Eşleştirme-Teklif]] |
| `job_completions` | İş tamamlama kayıtları | [[M3-Eşleştirme-Teklif]] |
| `response_times` | HV yanıt süresi metrikleri | [[M3-Eşleştirme-Teklif]] |

### 3. İletişim

| Tablo | Açıklama | İlişkili Modül |
|---|---|---|
| `messages` | HA ↔ HV mesajlaşma kayıtları | [[M2-AI-Chat-Talep]] |

### 4. Ödeme

| Tablo | Açıklama | İlişkili Modül |
|---|---|---|
| `subscriptions` | HV abonelik bilgileri | [[M4-Ödeme-Kampanya]] |
| `payments` | Ödeme işlem kayıtları (iyzico) | [[M4-Ödeme-Kampanya]] |
| `campaigns` | Kampanya tanımları | [[M4-Ödeme-Kampanya]] |
| `campaign_usage` | Kampanya kullanım kayıtları | [[M4-Ödeme-Kampanya]] |
| `provider_monthly_quota` | HV aylık kota takibi | [[M4-Ödeme-Kampanya]] |

### 5. Değerlendirme & NPS

| Tablo | Açıklama | İlişkili Modül |
|---|---|---|
| `reviews` | HA → HV yorum ve puanlar | [[M5-Puan-Şikayet-NPS]] |
| `review_verifications` | Yorum doğrulama kayıtları | [[M5-Puan-Şikayet-NPS]] |
| `complaints` | Şikayet kayıtları | [[M5-Puan-Şikayet-NPS]] |
| `nps_responses` | NPS anket yanıtları | [[M5-Puan-Şikayet-NPS]] |

### 6. Bildirimler

| Tablo | Açıklama | İlişkili Modül |
|---|---|---|
| `notification_logs` | Gönderilen bildirim kayıtları | [[M7-Altyapı]] |
| `notification_preferences` | Kullanıcı bildirim tercihleri | [[M7-Altyapı]] |

### 7. Admin

| Tablo | Açıklama | İlişkili Modül |
|---|---|---|
| `staff` | Admin personel kayıtları | [[M6-Admin-Roller]] |
| `teams` | Personel ekip tanımları | [[M6-Admin-Roller]] |
| `audit_logs` | Admin işlem denetim kaydı | [[M6-Admin-Roller]] |
| `call_tasks` | Kalite ekibi çağrı görevleri | [[M6-Admin-Roller]] |
| `activity_logs` | Genel aktivite logları | [[M6-Admin-Roller]] |

### 8. Büyüme

| Tablo | Açıklama | İlişkili Modül |
|---|---|---|
| `referrals` | Referans davetiye ve dönüşüm kayıtları | [[M4-Ödeme-Kampanya]] |

## Tablo Sayısı Özeti

| Grup | Tablo Sayısı |
|---|---|
| Auth & Kullanıcılar | 3 |
| Talepler & Teklifler | 6 |
| İletişim | 1 |
| Ödeme | 5 |
| Değerlendirme & NPS | 4 |
| Bildirimler | 2 |
| Admin | 5 |
| Büyüme | 1 |
| **Toplam** | **27** |

## Kritik İndeksler (§19.2)

Performans için oluşturulması gereken kritik indeksler:

### Kullanıcı & Auth

```sql
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_service_providers_status ON service_providers(status);
CREATE INDEX idx_service_providers_category ON service_providers(category_id);
```

### Talepler & Teklifler

```sql
CREATE INDEX idx_service_requests_status ON service_requests(status);
CREATE INDEX idx_service_requests_category ON service_requests(category_id);
CREATE INDEX idx_service_requests_location ON service_requests(district_id);
CREATE INDEX idx_service_requests_created ON service_requests(created_at);
CREATE INDEX idx_offers_request_id ON offers(request_id);
CREATE INDEX idx_offers_provider_id ON offers(provider_id);
CREATE INDEX idx_offers_status ON offers(status);
```

### Ödeme

```sql
CREATE INDEX idx_subscriptions_provider ON subscriptions(provider_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_payments_provider ON payments(provider_id);
CREATE INDEX idx_payments_created ON payments(created_at);
```

### Değerlendirme

```sql
CREATE INDEX idx_reviews_provider ON reviews(provider_id);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_nps_responses_created ON nps_responses(created_at);
```

### Admin & Loglama

```sql
CREATE INDEX idx_audit_logs_staff ON audit_logs(staff_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_notification_logs_user ON notification_logs(user_id);
```

## Redis Kullanım Alanları

| Anahtar Deseni | Açıklama | TTL |
|---|---|---|
| `session:{userId}` | Kullanıcı oturum bilgisi | 24 saat |
| `chat:{sessionId}` | AI chat konuşma durumu | 24 saat |
| `otp:{phone}` | OTP doğrulama kodu | 3 dakika |
| `rate:{ip}` | Rate limiting sayacı | 1 dakika |
| `quota:{providerId}:{month}` | HV aylık kota sayacı | 35 gün |
| `online:{userId}` | Çevrimiçi durum | 5 dakika |

## İlgili Sayfalar

- [[M7-Altyapı]] — Altyapı modülü
- [[Stack]] — Teknoloji yığını
- [[API-Genel]] — API genel bakış
- [[Admin-Roller-İzinler]] — staff, audit_logs tabloları
- [[M4-Ödeme-Kampanya]] — Ödeme tabloları
- [[M5-Puan-Şikayet-NPS]] — Değerlendirme tabloları
