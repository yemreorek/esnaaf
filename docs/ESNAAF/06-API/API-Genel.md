---
title: API — Genel Bakış
type: endpoint
prd-refs: ["§18"]
related: ["[[M7-Altyapı]]", "[[JWT-Token]]", "[[Rate-Limit]]"]
status: complete
updated: 2026-05-24
---

> Esnaaf platformu REST API genel yapısı, güvenlik seviyeleri ve endpoint grupları.

## PRD Bölümleri

- [§18 API Endpoint Listesi](../../esnaaf-claude.md)

## Temel Bilgiler

| Alan | Değer |
|---|---|
| Base URL | `https://api.esnaaf.com/api` |
| Protokol | HTTPS (TLS 1.3) |
| Format | JSON |
| Auth | Bearer Token (JWT) |
| Versiyon | URL'de yok (ilk sürüm) |

## API Prefix'leri

| Prefix | Hedef Kullanıcı | Açıklama |
|---|---|---|
| `/api/musteri/` | Hizmet Alan (HA) | Talep oluşturma, teklif takibi, mesajlaşma |
| `/api/hizmetveren/` | Hizmet Veren (HV) | İş görme, teklif verme, panel işlemleri |
| `/api/ortak/` | Her iki taraf | Auth, profil, bildirimler, ortak endpointler |
| `/api/admin/` | Admin Personel | Yönetim paneli, raporlar, onay işlemleri |
| `/api/webhooks/` | Harici Servisler | iyzico ödeme, Netgsm SMS callback |

## Kimlik Doğrulama

### Bearer Token

```http
GET /api/musteri/requests
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Uygulama Tanımlama

Her istek `X-App-Client` header'ı ile hangi istemciden geldiğini belirtir:

```http
X-App-Client: web        // Web uygulaması
X-App-Client: ios-ha     // iOS Hizmet Alan
X-App-Client: android-ha // Android Hizmet Alan
X-App-Client: ios-hv     // iOS Hizmet Veren
X-App-Client: android-hv // Android Hizmet Veren
```

## Rate Limiting

| Limit Tipi | Değer | Açıklama |
|---|---|---|
| Genel | 100 req/min | Tüm endpointler için varsayılan |
| OTP | 10 req/min | SMS OTP gönderimi (kötüye kullanım önleme) |
| AI Chat | 30 req/min | AI chat mesajları |
| Webhook | 500 req/min | Harici servis callback'leri |

Rate limit aşıldığında:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
```

## Hata Formatı

Tüm hatalar aşağıdaki standart formatta döner:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Geçersiz telefon numarası formatı",
    "details": {
      "field": "phone",
      "expected": "+90XXXXXXXXXX"
    }
  }
}
```

### HTTP Durum Kodları

| Kod | Anlamı | Kullanım |
|---|---|---|
| 200 | OK | Başarılı GET/PUT |
| 201 | Created | Başarılı POST (kaynak oluşturma) |
| 400 | Bad Request | Geçersiz istek verisi |
| 401 | Unauthorized | Token eksik veya geçersiz |
| 403 | Forbidden | Yetkisiz erişim |
| 404 | Not Found | Kaynak bulunamadı |
| 409 | Conflict | Çakışma (ör. mükerrer teklif) |
| 429 | Too Many Requests | Rate limit aşıldı |
| 500 | Internal Server Error | Sunucu hatası |

## Güvenlik Seviyeleri

| Seviye | Açıklama | Örnek Endpoint |
|---|---|---|
| **Public** | Token gerektirmez | `POST /api/ortak/auth/send-otp` |
| **Auth** | Geçerli JWT yeterli | `GET /api/ortak/profile` |
| **Provider** | HV rolüne sahip kullanıcı | `GET /api/hizmetveren/jobs` |
| **Seeker** | HA rolüne sahip kullanıcı | `POST /api/musteri/requests` |
| **Admin** | Admin personel + rol izni | `GET /api/admin/users` |
| **Internal** | Yalnızca sunucu içi (webhook) | `POST /api/webhooks/iyzico` |

## Endpoint Grupları (Modül Bazlı)

### Auth & Kullanıcı — [[M1-Auth-Kullanıcı]]

```
POST   /api/ortak/auth/send-otp          [Public]
POST   /api/ortak/auth/verify-otp        [Public]
POST   /api/ortak/auth/refresh-token     [Auth]
GET    /api/ortak/profile                 [Auth]
PUT    /api/ortak/profile                 [Auth]
DELETE /api/ortak/account                 [Auth]    // KVKK silme
```

### AI Chat & Talep — [[M2-AI-Chat-Talep]]

```
POST   /api/musteri/chat/message          [Auth/Public*]
GET    /api/musteri/chat/history           [Auth]
POST   /api/musteri/requests              [Auth]
GET    /api/musteri/requests              [Auth]
GET    /api/musteri/requests/:id          [Auth]
PUT    /api/musteri/requests/:id/cancel   [Auth]
```

> *Anonim chat için `temp_session_id` ile Public erişim mümkündür.

### Eşleştirme & Teklif — [[M3-Eşleştirme-Teklif]]

```
GET    /api/hizmetveren/jobs              [Provider]
POST   /api/hizmetveren/offers            [Provider]
PUT    /api/hizmetveren/offers/:id        [Provider]
GET    /api/musteri/offers                [Seeker]
POST   /api/musteri/offers/:id/accept     [Seeker]
POST   /api/musteri/offers/:id/reject     [Seeker]
POST   /api/ortak/jobs/:id/complete       [Auth]
GET    /api/ortak/messages/:jobId         [Auth]
POST   /api/ortak/messages/:jobId         [Auth]
```

### Ödeme & Kampanya — [[M4-Ödeme-Kampanya]]

```
GET    /api/hizmetveren/packages          [Provider]
POST   /api/hizmetveren/subscribe         [Provider]
GET    /api/hizmetveren/subscription      [Provider]
PUT    /api/hizmetveren/subscription/cancel [Provider]
GET    /api/hizmetveren/quota             [Provider]
GET    /api/ortak/campaigns               [Auth]
POST   /api/ortak/campaigns/:id/apply     [Auth]
POST   /api/webhooks/iyzico              [Internal]
```

### Puan & Şikayet & NPS — [[M5-Puan-Şikayet-NPS]]

```
POST   /api/musteri/reviews               [Seeker]
GET    /api/hizmetveren/reviews           [Provider]
POST   /api/musteri/complaints            [Seeker]
GET    /api/musteri/complaints            [Seeker]
POST   /api/ortak/nps                     [Auth]
```

### Admin — [[M6-Admin-Roller]]

```
GET    /api/admin/users                   [Admin]
GET    /api/admin/providers               [Admin]
PUT    /api/admin/providers/:id/approve   [Admin]
GET    /api/admin/requests                [Admin]
GET    /api/admin/reviews/pending         [Admin]
PUT    /api/admin/reviews/:id/approve     [Admin]
GET    /api/admin/complaints              [Admin]
PUT    /api/admin/complaints/:id/resolve  [Admin]
GET    /api/admin/dashboard               [Admin]
GET    /api/admin/audit-logs              [Admin]
GET    /api/admin/reports/:type           [Admin]
```

## WebSocket Endpointleri

```
wss://api.esnaaf.com/ws

Events:
  → offer:new          // Yeni teklif geldi (HA'ya)
  → offer:updated      // Teklif güncellendi
  → message:new        // Yeni mesaj
  → job:status_changed // İş durumu değişti
  → notification:new   // Yeni bildirim
```

## İlgili Sayfalar

- [[M7-Altyapı]] — Altyapı modülü
- [[JWT-Token]] — Token yapısı ve yenileme
- [[Rate-Limit]] — Rate limiting detayları
- [[Veritabanı-Genel]] — Veritabanı tabloları
- [[M1-Auth-Kullanıcı]] — Auth endpointleri
- [[M2-AI-Chat-Talep]] — Chat endpointleri
- [[M3-Eşleştirme-Teklif]] — Teklif endpointleri
- [[M4-Ödeme-Kampanya]] — Ödeme endpointleri
- [[M5-Puan-Şikayet-NPS]] — Değerlendirme endpointleri
- [[M6-Admin-Roller]] — Admin endpointleri
