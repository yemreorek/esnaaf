---
title: M4 — Ödeme & Kampanya
type: modül
prd-refs: ["§6", "§7", "§7.6", "§17.1"]
related: ["[[M3-Eşleştirme-Teklif]]", "[[M5-Puan-Şikayet-NPS]]", "[[M6-Admin-Roller]]", "[[M7-Altyapı]]"]
status: complete
updated: 2026-05-24
---

> Paket abonelikleri, iyzico ödeme entegrasyonu, kampanya kodları ve kota yönetiminden sorumlu modül.

## PRD Bölümleri

- [§6 Paket Sistemi](../../esnaaf-claude.md)
- [§7 Ödeme Sistemi — iyzico Entegrasyonu](../../esnaaf-claude.md)
- [§7.6 Kampanya & İndirim Kodu Sistemi](../../esnaaf-claude.md)
- [§17.1 Hata Senaryoları](../../esnaaf-claude.md)

## Sorumluluk Alanı

- Paket yönetimi (Basic / Standart / Premium / VIP)
- Aylık kota sistemi (onaylanan iş sayısı)
- iyzico entegrasyonu (abonelik, tek çekim, recurring)
- Kart tokenizasyonu (iyzico tarafında — platform kart saklamaz)
- Kampanya kodu CRUD (%, TL, free trial, upgrade)
- Admin trial yönetimi (30 gün ücretsiz)
- Başarısız ödeme retry (3 deneme, 3'er gün arayla)
- Fatura yönetimi (e-fatura / e-arşiv)

## Bağımlılıklar

```
M4 → M3 (paket seviyesi → dağıtım önceliği)
M4 → M5 (VIP erişim için min. 4.5 puan)
M4 → M6 (admin kampanya/trial yönetimi)
M4 → M7 (webhook, cron, hata yönetimi)
```

## Paket Karşılaştırması

| Özellik | Basic | Standart | Premium | VIP |
|---|---|---|---|---|
| Aylık ücret | 5.000 ₺ | 10.000 ₺ | 15.000 ₺ | 20.000 ₺ |
| Onaylanan iş/ay | 14 | 30 | 60 | Sınırsız |
| Dağıtım önceliği | 4. sıra | 3. sıra | 2. sıra | 1. sıra |
| VIP rozeti | ✗ | ✗ | ✗ | ✓ |
| Profil öne çıkarma | ✗ | ✗ | ✗ | ✓ |

## Kota Kuralları

| Durum | Kota Etkisi |
|---|---|
| HA teklifi kabul etti | −1 kota |
| HA 2. kişiyi de kabul etti | Diğer HV'den de −1 |
| HA teklifi reddetti | Kota etkilenmez |
| HV teklif verdi ama seçilmedi | Kota etkilenmez |
| İş iptal edildi (kabul sonrası) | Kota **iade edilmez** |
| Ay başı | Otomatik sıfırlanır (UTC+3 00:00) |

## Kampanya Tipleri

| Tip | Kod | Açıklama |
|---|---|---|
| Yüzde İndirim | `PERCENT` | Paket fiyatından % indirim |
| Sabit İndirim | `FIXED` | Paket fiyatından TL indirim |
| Ücretsiz Deneme | `FREE_TRIAL` | X gün ücretsiz kullanım |
| Paket Yükseltme | `UPGRADE` | Düşük paketi üst pakete yükselt |

## DB Tabloları

- [[subscriptions]] — abonelikler
- [[payments]] — ödeme kayıtları
- [[payment_invoices]] — fatura bilgileri
- [[campaigns]] — kampanya tanımları
- [[campaign_usage]] — kampanya kullanım logları
- [[monthly_quotas]] — aylık kota takibi

## Endpoint'ler

- [[Payment-Endpoints]] — `/api/payment/*`
- [[Subscription-Endpoints]] — `/api/subscription/*`
- [[Campaign-Endpoints]] — `/api/campaigns/*`

## İlgili Akışlar

- [[Abonelik-Ödeme-Akışı]]
- [[Başarısız-Ödeme-Akışı]]
- [[Kampanya-Kodu-Akışı]]
- [[Admin-Trial-Akışı]]
- [[Free-Trial-Akışı]]

## İlgili Kavramlar

- [[Paketler]]
- [[Aylık-Kota-Sistemi]]
- [[Kampanya-Kodları]]
