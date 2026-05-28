---
name: m4-payment
description: >
  Ödeme & Paket & Kampanya modülü agent'ı. iyzico abonelik entegrasyonu,
  aylık yenileme, başarısız ödeme yönetimi, kampanya/indirim kodu sistemi,
  ücretsiz deneme (trial) akışı, aylık kota sıfırlama cron'u ve ödeme
  hata senaryolarını kapsar. PRD §6, §7, §17.1 bölümlerini etkileyen
  her değişiklik için bu agent'ı kullan.
---

# M4 — ÖDEME & PAKET & KAMPANYA AGENT

## Kapsam

PRD Bölümleri: §6 Paket Sistemi · §7 Ödeme · §7.6 Kampanya · §17.1 Ödeme Hata Senaryoları

## Sorumluluk Alanları

- iyzico recurring payment entegrasyonu (sandbox + production)
- 4 paket seviyesi ve aylık kota sistemi
- Abonelik oluştur → checkout → webhook → aktive et akışı
- Başarısız ödeme 3 aşamalı retry + askıya alma
- İptal: dönem sonuna kadar aktif
- Kampanya: 4 tip, 6 kural kontrolü
- Free trial: 14 gün, kart alınır çekim yapılmaz
- Aylık kota sıfırlama cron
- Ödeme hata senaryoları (PRD §17.1)

## Paket Sistemi (PRD §6)

| Paket | Fiyat | Aylık Kota | Kullanıcıya Görünür? |
|---|---|---|---|
| Basic | 5.000 ₺/ay | 14 iş | Hayır |
| Standart | 10.000 ₺/ay | 30 iş | Hayır |
| Premium | 15.000 ₺/ay | 60 iş | Hayır |
| VIP | 20.000 ₺/ay | Sınırsız | Evet (rozet) |

**VIP için minimum puan:** 4.5 yıldız

## Abonelik Akışı (PRD §7.2)

```
HV paket seçer
  → Kampanya kodu varsa → 6 kural kontrol
  → Trial ise → trial akışı (iyzico çağrılmaz)
  → Normal ise → iyzico checkout form aç
        ↓
Kullanıcı ödeme yapar
        ↓
iyzico webhook → CHECKOUT_FORM_AUTH event
  → Abonelik 'active' güncelle
  → Ödeme kaydı oluştur
  → Kampanya kullanımı kaydet
  → Kota tablosunu güncelle (monthly_limit)
```

## Başarısız Ödeme (PRD §7.5)

```
1. başarısız → bildirim (HV-08) + 3 gün sonra retry kuyruğu
2. başarısız → bildirim (HV-09) + 3 gün sonra retry kuyruğu
3. başarısız → abonelik 'suspended' + bildirim (HV-10)
```

## İptal Kuralları (PRD §7.3)

```
İptal → expiresAt'e kadar aktif
Aktif teklifler → seeker görmeye devam eder
Yeni iş → göremez
Yeni teklif → veremez
Yeniden abone → paket aktivasyonu
```

## Kampanya Sistemi (PRD §7.6)

**4 tip:**

| Tip | Açıklama | Kural |
|---|---|---|
| `percent` | % indirim | Yalnızca ilk ay |
| `fixed` | TL indirim | Yalnızca ilk ay |
| `free_trial` | X gün ücretsiz | Kart alınır, çekim yapılmaz |
| `upgrade` | Paket yükseltme | Belirtilen pakete |

**6 kural kontrolü (sırayla):**
```
1. Kod aktif mi? (is_active)
2. valid_until geçmemiş mi?
3. max_uses dolmamış mı?
4. Bu HV daha önce kullandı mı? (tek kullanım)
5. Seçilen paket için geçerli mi? (applicable_packages)
6. new_users_only ise HV daha önce abone olmuş mu?
```

## Free Trial Akışı (PRD §7.6.4)

```
Trial başlar → status='trial' → kota aktif
13. gün → SMS hatırlatma (HV-18): "Yarın bitiyor"
14. gün:
  İptal ettiyse → status='expired', ücret yok
  Etmediyse   → iyzico ilk ödeme çekilir → 'active'
Aynı HV ikinci kez trial kodu kullanamaz
```

## Kota Sıfırlama Cron (PRD §6)

```
Cron: Her ayın 1'i 21:00 UTC (= 00:00 UTC+3)
  → provider_monthly_quota.accepted_count = 0
  → monthly_limit pakete göre güncellenir
  → Aboneliği olmayana: monthly_limit = 0
```

## Ödeme Hata Senaryoları (PRD §17.1) — KRİTİK

```
Checkout form açılamadı  → "Ödeme sayfası açılamadı. Tekrar deneyin."
                            Abonelik 'suspended' kalır
iyzico timeout (>15s)    → Aynı mesaj + manuel retry
Yetersiz bakiye          → iyzico hata kodu → "Yeterli bakiye yok."
Kart bilgisi hatalı      → "Kart bilgilerinizi kontrol edin."
3D Secure başarısız      → "3D Secure doğrulama başarısız."
Webhook imzası geçersiz  → 400 Bad Request, log yaz, işlem yapma
Webhook duplicate        → payment_id kontrolü, duplicate ignore et
```

## Değişiklik Yapılırken Kontrol Listesi

```
□ Paket fiyatı değişiyor mu?      → iyzico planı güncelle (admin)
□ Kota limiti değişiyor mu?       → M3 dağıtım kota kontrolü
□ VIP puan eşiği değişiyor mu?    → M5 puan sistemi
□ Yeni paket ekleniyor mu?        → M3 ağırlık + M7 ENUM
□ Kampanya tipi ekleniyor mu?     → M6 admin form + M7 ENUM
□ Trial süresi değişiyor mu?      → HV-18 bildirim zamanlaması
□ Retry süresi değişiyor mu?      → Bildirim zamanlaması
□ Webhook endpoint değişiyor mu?  → M7 API listesi
```

## Bağımlı Modüller

| Değişiklik | Bildir |
|---|---|
| Kota limiti | M3 (dağıtım filtresi) |
| VIP koşulu | M5 (puan eşiği) |
| Yeni paket | M3 (ağırlık), M7 (ENUM) |
| Kampanya tipi | M6 (admin form), M7 (ENUM) |
| Webhook endpoint | M7 (API listesi) |

## Hızlı Referans — DB

```
subscriptions(id, provider_id FK UNIQUE, package_type ENUM,
              status ENUM(trial|active|cancelled|suspended|expired),
              started_at, expires_at, cancelled_at,
              iyzico_subscription_ref)

payments(id, subscription_id FK, amount DECIMAL,
         status ENUM(success|failed|refunded),
         iyzico_payment_id, attempt_count, paid_at)

campaigns(id, name, code UNIQUE, type ENUM, value DECIMAL,
          upgrade_to, applicable_packages[], new_users_only,
          max_uses, used_count, valid_from, valid_until,
          is_active, created_by FK)

campaign_usage(id, campaign_id FK, provider_id FK,
               subscription_id FK UNIQUE, discount_amount,
               used_at, created_by_staff FK)

provider_monthly_quota(id, provider_id FK, month_year VARCHAR(7),
                       accepted_count INT DEFAULT 0,
                       monthly_limit INT,  -- NULL = VIP sınırsız
                       reset_at, updated_at)
  UNIQUE(provider_id, month_year)
```

## Hızlı Referans — API

```
GET  /subscriptions/packages       ← paket listesi (PUBLIC)
POST /subscriptions/create         ← abonelik başlat
POST /subscriptions/cancel         ← iptal et
GET  /subscriptions/me             ← aktif abonelik + kota
GET  /subscriptions/me/history     ← ödeme geçmişi

POST /campaigns/validate           ← kod doğrula (HV)
GET  /admin/campaigns              ← tüm kampanyalar (admin)
POST /admin/campaigns              ← yeni kampanya
POST /admin/campaigns/:id/toggle   ← aktif/pasif

POST /webhooks/iyzico              ← iyzico webhook (PUBLIC, imzalı)
```
