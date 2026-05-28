---
title: Rate Limit
type: kavram
prd-refs: ["§17"]
related: ["[[JWT-Token]]", "[[M7-Altyapı]]"]
status: complete
updated: 2026-05-24
---

> API rate limiting kuralları — genel limitler, OTP özel limitleri ve endpoint bazlı kısıtlamalar.

## PRD Referansları

- [§17 — Güvenlik & Uyumluluk](../../esnaaf-claude.md) — Rate limiting yapılandırması

## Genel Limitler

| Kural | Değer | Açıklama |
|-------|-------|----------|
| **Genel limit** | 100 istek / dakika | Tüm endpoint'ler için varsayılan limit (IP bazlı) |
| **OTP istek limiti** | 10 istek / dakika | `/auth/otp` endpoint'i için |
| **OTP gönderim limiti** | 3 OTP / dakika | Aynı telefon numarasına gönderilecek maksimum OTP |

## Endpoint Bazlı Limitler

| Endpoint | Limit | Pencere | Açıklama |
|----------|-------|---------|----------|
| `POST /auth/otp/send` | 3 istek | 1 dakika | OTP gönderim (telefon bazlı) |
| `POST /auth/otp/verify` | 10 istek | 1 dakika | OTP doğrulama (IP bazlı) |
| `POST /auth/refresh` | 10 istek | 1 dakika | Token yenileme |
| `POST /requests` | 5 istek | 1 dakika | Talep oluşturma |
| `POST /offers` | 10 istek | 1 dakika | Teklif gönderme |
| `POST /reviews` | 5 istek | 1 dakika | Değerlendirme yazma |
| `POST /complaints` | 3 istek | 1 dakika | Şikâyet oluşturma |
| `GET /*/list` | 60 istek | 1 dakika | Liste endpoint'leri |
| `POST /upload/presign` | 10 istek | 1 dakika | Dosya yükleme URL'si |
| `POST /chat/message` | 30 istek | 1 dakika | AI sohbet mesajı |

## Rate Limit Stratejisi

### Pencere Türü
- **Fixed Window**: Sabit zaman penceresi (1 dakika) — basit ve öngörülebilir
- Her pencerenin başlangıcında sayaç sıfırlanır

### Tanımlama Anahtarları

| Anahtar | Kullanım | Örnek |
|---------|----------|-------|
| **IP adresi** | Genel limit, doğrulama endpoint'leri | `rate:ip:192.168.1.1` |
| **Kullanıcı ID** | Authenticated endpoint'ler | `rate:user:usr_abc123` |
| **Telefon numarası** | OTP gönderim limiti | `rate:phone:+905551234567` |

## HTTP Yanıtları

### Başarılı İstek Header'ları
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1716581760
```

### Limit Aşıldığında
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 45
Content-Type: application/json

{
  "statusCode": 429,
  "message": "Çok fazla istek gönderdiniz. Lütfen biraz bekleyin.",
  "error": "Too Many Requests",
  "retryAfter": 45
}
```

## NestJS Implementasyonu

```typescript
// Genel rate limit (app.module.ts)
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,       // 1 dakika pencere
      limit: 100,    // 100 istek / dakika
      storage: new ThrottlerStorageRedisService(redis),
    }),
  ],
})
export class AppModule {}

// Endpoint bazlı özel limit
@Throttle({ default: { ttl: 60, limit: 3 } })
@Post('otp/send')
async sendOtp(@Body() dto: SendOtpDto) { ... }

// Rate limit devre dışı bırakma (admin endpoint'ler)
@SkipThrottle()
@Get('admin/dashboard')
async getDashboard() { ... }
```

## Redis Yapısı

Rate limit sayaçları **Redis** üzerinde tutulur:

```
rate_limit:{endpoint}:{key} → counter (TTL: 60s)
```

| Avantaj | Açıklama |
|---------|----------|
| **Hız** | In-memory sayaç — çok düşük latency |
| **Dağıtık** | Birden fazla API instance arasında paylaşılır |
| **Otomatik temizlik** | TTL ile süresi dolan anahtarlar otomatik silinir |

## OTP Özel Kuralları

| Kural | Değer | Açıklama |
|-------|-------|----------|
| OTP gönderim limiti | 3 / dakika / telefon | Aynı numaraya spam önleme |
| OTP doğrulama denemesi | 5 deneme / OTP | Yanlış kod girişi limiti |
| OTP geçerlilik süresi | 5 dakika | Süre aşımında yeni OTP gerekir |
| Günlük OTP limiti | 10 / gün / telefon | Günlük toplam OTP gönderim limiti |

## Brute Force Koruması

- **5 başarısız OTP denemesi** → OTP geçersiz kılınır, yeni OTP gerekir
- **10 günlük OTP limiti aşıldığında** → Telefon numarası 24 saat bloklanır
- **Sürekli 429 alan IP** → Geçici IP bloklama (15 dakika)

## İlgili Sayfalar

- [[JWT-Token]] — JWT token güvenlik yapılandırması
- [[M7-Altyapı]] — Altyapı modülü detayları
- [[M1-Auth-Kullanıcı]] — Kimlik doğrulama modülü
- [[Stack]] — Teknoloji yığını (Redis)
