---
title: AD Bildirimleri
type: bildirim
prd-refs: ["§14"]
related: ["[[M6-Admin-Roller]]", "[[NPS-Skoru]]"]
status: complete
updated: 2026-05-24
---

> Admin kullanıcılarına gönderilen tüm bildirim kodlarının tanımı, kanalları ve zamanlama kuralları.

## PRD Referansları

- [§14 — Bildirim Matrisi](../../esnaaf-claude.md) — Bildirim kodları ve kanal tanımları

## Bildirim Tablosu

| Kod | Olay | Kanal | Zamanlama | Açıklama |
|------|------|-------|-----------|----------|
| **AD-01** | Yeni HV kaydı | Email | Anında (instant) | Yeni bir Hizmet Veren kayıt olduğunda admin ekibine bildirim gönderilir. Onay sürecini başlatır. |
| **AD-02** | Bekleyen değerlendirmeler | Email | Günlük 09:00 | Moderasyon bekleyen değerlendirmelerin günlük özet raporu. Sayı ve kategorilere göre dağılım içerir. |
| **AD-03** | Yeni şikâyet | Email | Anında (instant) | HA tarafından yeni bir şikâyet açıldığında anında bildirim. Şikâyet detayları ve ilgili HV bilgisi içerir. |
| **AD-04** | Başarısız ödemeler toplu raporu | Email | Günlük 08:00 | Son 24 saatteki tüm başarısız ödeme denemelerinin toplu raporu. HV listesi, deneme sayısı ve tutar bilgisi içerir. |
| **AD-05** | HV puanı eşik altında | Email | Anında (instant) | Bir HV'nin ortalama puanı belirlenen eşik değerin altına düştüğünde tetiklenir. Kalite kontrol aksiyonu gerektirir. |
| **AD-06** | NPS 7 günlük ortalama düşüşü | Email | Pazartesi 08:00 | Haftalık NPS ortalamasının önceki haftaya göre düşüş gösterdiği durumlarda tetiklenir. Trend analizi içerir. |
| **AD-07** | Detractor alarmı (aynı HV 3+) | Email | Anında (instant) | Aynı HV için 3 veya daha fazla detractor (NPS ≤ 6) puanı verildiğinde acil alarm. Kalite müdahalesi gerektirir. |

## Zamanlama Detayları

### Anlık (Instant) Bildirimler
| Kod | Tetikleyici |
|------|------------|
| AD-01 | HV kayıt işlemi tamamlandığında |
| AD-03 | Şikâyet formu gönderildiğinde |
| AD-05 | Yeni değerlendirme sonrası ortalama hesaplandığında |
| AD-07 | 3. detractor puanı kaydedildiğinde |

### Zamanlanmış Bildirimler
| Kod | Cron İfadesi | Açıklama |
|------|-------------|----------|
| AD-02 | `0 9 * * *` | Her gün saat 09:00 |
| AD-04 | `0 8 * * *` | Her gün saat 08:00 |
| AD-06 | `0 8 * * 1` | Her Pazartesi saat 08:00 |

## Alıcı Kuralları

- **AD-01, AD-02, AD-03**: Tüm admin kullanıcılarına gönderilir
- **AD-04**: Finans rolüne sahip admin kullanıcılarına gönderilir
- **AD-05, AD-06, AD-07**: Kalite kontrol rolüne sahip admin kullanıcılarına gönderilir
- Admin rolleri hakkında detay: [[M6-Admin-Roller]]

## Teknik Notlar

- Admin bildirimleri yalnızca **Email** kanalı üzerinden gönderilir (admin panelinde In-App bildirim merkezi MVP kapsamında yok)
- Zamanlanmış bildirimler **BullMQ** cron jobs ile yönetilir
- **AD-07** alarmı kritik öncelikli — e-posta konusu `[ACİL]` prefiksi ile gönderilir
- Tüm admin bildirimleri `admin_notifications` tablosunda loglanır

## İlgili Sayfalar

- [[M6-Admin-Roller]] — Admin rol ve yetki tanımları
- [[NPS-Skoru]] — NPS skoru hesaplama ve kategorileri
- [[HA-Bildirimleri]] — Hizmet alan bildirimleri
- [[HV-Bildirimleri]] — Hizmet veren bildirimleri
