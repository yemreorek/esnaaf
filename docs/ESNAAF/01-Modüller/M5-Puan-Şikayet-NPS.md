---
title: M5 — Puan & Şikayet & NPS
type: modül
prd-refs: ["§9", "§10", "§14.7"]
related: ["[[M3-Eşleştirme-Teklif]]", "[[M6-Admin-Roller]]", "[[M7-Altyapı]]"]
status: complete
updated: 2026-05-24
---

> Puan/yorum sistemi, şikayet mekanizması ve NPS ölçümünden sorumlu modül.

## PRD Bölümleri

- [§9 Puan & Güven Sistemi](../../esnaaf-claude.md)
- [§10 Anlaşmazlık & Şikayet Mekanizması](../../esnaaf-claude.md)
- [§14.7 NPS Sistemi](../../esnaaf-claude.md)

## Sorumluluk Alanı

- 1–5 yıldız puan sistemi
- Yorum oluşturma, admin onay kuyruğu
- Üç katmanlı yorum doğrulama (belge + admin + telefon)
- Şikayet açma, takip, çözüm
- HV itiraz süreci
- NPS anketi (0–10 skala, iş tamamlandıktan 30 dk sonra)
- HV sağlık skoru ve görünürlük etkisi

## Bağımlılıklar

```
M5 → M3 (iş tamamlama verisi → puan tetikleme)
M5 → M6 (admin onay/red, yorum kuyruğu)
M5 → M7 (BullMQ kuyruk, bildirim)
```

## Puan & Görünürlük

| Puan Aralığı | Etki |
|---|---|
| 4.5–5.0 | Normal/yüksek görünürlük |
| 3.5–4.4 | Orta görünürlük |
| 2.5–3.4 | Düşük görünürlük |
| ≤2.4 | Admin uyarı süreci başlar |
| Sürekli düşük | Sistemden çıkarılma |

## Üç Katmanlı Yorum Doğrulama

1. **Belge zorunluluğu** — Fatura/makbuz fotoğrafı (JPG, PNG, PDF)
2. **Admin incelemesi** — Yorum "İncelemede" → admin kuyruğu → onayla/reddet
3. **Telefon doğrulaması** — Admin yorum yazanı arar; maks. 3 deneme

## Şikayet Kategorileri

- Hizmet yapılmadı
- Kalitesiz hizmet
- Fiyat anlaşmazlığı
- Diğer

## Şikayet Ceza Skalası

| Şikayet # | Sonuç |
|---|---|
| 1. | Sadece kayıt |
| 2. (30 gün içinde) | Admin uyarı e-postası |
| 3. (60 gün içinde) | 7 gün otomatik askıya alma |
| 4.+ | Admin kararı — kalıcı çıkarma riski |

## NPS Sistemi

| Skor | Grup | Aksiyon |
|---|---|---|
| 0–3 | Detractor 🔴 | Anında alarm → kalite personeli, HV sağlık skoru düşer |
| 4–6 | Passive 🟡 | Normal öncelikli görev |
| 7–10 | Promoter 🟢 | Yorum daveti, HV sağlık skoru yükselir |

**NPS Formülü:** `NPS = Promoter% − Detractor%` (−100 ile 100 arası)

## DB Tabloları

- [[reviews]] — yorumlar
- [[review_verifications]] — yorum doğrulama logları
- [[complaints]] — şikayetler
- [[nps_responses]] — NPS yanıtları

## Endpoint'ler

- [[Review-Endpoints]] — `/api/reviews/*`
- [[Complaint-Endpoints]] — `/api/complaints/*`
- [[NPS-Endpoints]] — `/api/nps/*`

## İlgili Akışlar

- [[Puan-Verme-Akışı]]
- [[Yorum-Onay-Akışı]]
- [[Şikayet-Akışı]]
- [[NPS-Anket-Akışı]]
- [[HV-İtiraz-Akışı]]

## İlgili Kavramlar

- [[Yorum-Doğrulama]]
- [[NPS-Skoru]]
- [[HV-Sağlık-Skoru]]
