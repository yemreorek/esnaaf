---
name: m3-matching
description: >
  Eşleştirme & Teklif modülü agent'ı. Akıllı dağıtım algoritması (5 faktör),
  teklif akışı, telefon maskeleme sistemi, max 3 kabul kuralı ve aylık kota
  sistemini kapsar. PRD §5, §8, §11 bölümlerini etkileyen her değişiklik
  için bu agent'ı kullan.
---

# M3 — EŞLEŞTİRME & TEKLİF AGENT

## Kapsam

PRD Bölümleri: §5 HV Paneli · §8 Telefon Maskeleme · §11 Dağıtım Algoritması

## Sorumluluk Alanları

- Dağıtım algoritması (5 faktör, ağırlıklı skor)
- HV gelen işler listesi — "kaç kişi görüyor?" (§5.1)
- Teklif ver / güncelle / iptal akışı
- Telefon maskeleme / açılma (AES-256 + KVKK log)
- Maksimum 2 kabul kuralı
- Onay popup zorunluluğu (consent=false → hata)
- Aylık kota kontrolü + düşürme
- Response time ölçümü (dağıtımdan teklif verilene kadar)

## Dağıtım Algoritması (PRD §11)

| Faktör | Ağırlık |
|---|---|
| Paket seviyesi (VIP=100, Premium=75, Standart=50, Basic=25) | %35 |
| Ortalama puan (0-5 → 0-1 normalize) | %25 |
| Cevap hızı (son 30 gün ortalaması, düşük = iyi) | %20 |
| Lokasyon yakınlığı | %15 |
| Aktiflik süresi (platformdaki toplam süre) | %5 |
| Yeni üye bonusu (ilk 30 gün) | +bonus |

**Dağıtım kuralları:**
- Her talep 5–7 HV'ye gönderilir
- Kotası dolan HV listeden çıkar (VIP hariç)
- Aynı iş aynı HV'ye iki kez gösterilmez

## Kota Sistemi (PRD §6)

```
Teklif kabul edilince → accepted_count +1
accepted_count >= monthly_limit → dağıtımdan çıkar

Paket limitleri:
  Basic:    14/ay
  Standart: 30/ay
  Premium:  60/ay
  VIP:      sınırsız (NULL)

Cron: Her ayın 1'i 00:00 UTC+3 → accepted_count = 0
```

## Telefon Açılma Kuralları (PRD §8)

```
HA → "Kabul Et" tıklar
  → consent zorunlu (consent=false → BadRequest)
  → accepted_offers kaydı ($transaction)
  → accepted_count >= 3 → BadRequest (max kural)
  → 2. kabul → diğer pending teklifler "rejected"
  → HA: 2 HV'nin gerçek numarasını görür
  → HV: müşteri numarasını görür
  → Her açılmada phone_reveal_logs kaydı (KVKK)
```

## Response Time Ölçümü

```
Dağıtım anında: response_times.notified_at = NOW()
HV teklif verince: response_times.responded_at = NOW()
duration_minutes = responded_at - notified_at
→ Bu veri dağıtım skorunu (hız %20) etkiler
```

## Değişiklik Yapılırken Kontrol Listesi

```
□ Ağırlıklar değişiyor mu?        → Toplam %100 tutmalı
□ Max kabul sayısı değişiyor mu?  → Frontend popup metni + DB kural
□ Kota limitleri değişiyor mu?    → M4 paket tablosu ile senkron
□ Maskeleme formatı değişiyor mu? → Frontend + DB
□ Dağıtım 5-7 limiti değişiyor mu?→ Skor tablosu etkilenir
□ Yeni faktör ekleniyor mu?       → M7 DB alanı gerekebilir
```

## Bağımlı Modüller

| Değişiklik | Bildir |
|---|---|
| Ağırlık tablosu | M5 (puan skoru değişimi) |
| Kota limiti | M4 (paket tanımı) |
| Max kabul sayısı | M1 (panel açıklaması), M6 (admin) |
| Yeni dağıtım faktörü | M7 (DB alan) |

## Hızlı Referans — DB

```
offers(id, job_id FK, provider_id FK, price DECIMAL,
       message, status ENUM(pending|accepted|rejected|cancelled),
       accepted_at, created_at)

messages(id, job_id FK, offer_id FK, sender_id FK, receiver_id FK,
         content TEXT, content_type ENUM, is_read BOOL,
         flagged BOOL, created_at)

accepted_offers(id, job_id FK, offer_id FK UNIQUE,
                seeker_id FK, provider_id FK,
                accepted_at, seeker_consent BOOL, seeker_consent_at)

phone_reveal_logs(id, requester_id FK, revealed_user_id FK,
                  provider_id FK, job_id FK, revealed_at)

provider_monthly_quota(id, provider_id FK, month_year VARCHAR(7),
                       accepted_count INT DEFAULT 0,
                       monthly_limit INT,  -- NULL = VIP
                       reset_at TIMESTAMP, updated_at)
  UNIQUE(provider_id, month_year)

response_times(id, provider_id FK, job_id FK,
               notified_at, responded_at, response_duration_minutes)
```

## Hızlı Referans — API

```
POST /messages                  ← mesaj gönder
GET  /messages/:jobId/:offerId  ← sohbet geçmişi
PUT  /messages/:id/read         ← okundu işaretle

POST /offers                    ← teklif ver (HV)
GET  /offers/inbox              ← gelen işler + viewer_count (HV)
GET  /offers/quota              ← kota durumu (HV)
GET  /offers/sent               ← verilen teklifler (HV)
POST /offers/:id/accept         ← kabul et, consent zorunlu (HA)
POST /offers/:id/reject         ← reddet (HA)
GET  /offers/:id/reveal-phone   ← telefon aç (yetki kontrolü)
```
