---
title: NPS Skoru
type: kavram
prd-refs: ["§14.7"]
related: ["[[M5-Puan-Şikayet-NPS]]", "[[HV-Sağlık-Skoru]]"]
status: complete
updated: 2026-05-24
---

> Hizmet memnuniyetini ölçen Net Promoter Score (NPS) sistemi.

## PRD Referansları

- [§14.7 – NPS Skoru](../../esnaaf-claude.md)

## NPS Ölçek ve Tetiklenme

| Özellik | Değer |
|---------|-------|
| **Ölçek** | 0 – 10 |
| **Tetiklenme** | İş tamamlandıktan **30 dakika** sonra otomatik |
| **Hedef** | Hizmet Alan (HA) |
| **Soru** | "Bu hizmeti bir yakınınıza tavsiye eder misiniz?" |

## NPS Grupları

| Puan Aralığı | Grup | Emoji | Açıklama |
|-------------|------|-------|----------|
| **0 – 3** | Detractor (Kötüleyen) | 🔴 | Memnuniyetsiz, olumsuz yayılım riski |
| **4 – 6** | Passive (Pasif) | 🟡 | Nötr, tavsiye etmez ama kötülemez |
| **7 – 10** | Promoter (Destekçi) | 🟢 | Memnun, aktif tavsiye eder |

## NPS Formülü

```
NPS = Promoter% − Detractor%
```

**Örnek hesaplama:**
- 100 yanıt: 60 Promoter, 20 Passive, 20 Detractor
- Promoter% = 60%, Detractor% = 20%
- **NPS = 60% − 20% = 40**

## NPS Değerlendirme Skalası

| NPS Aralığı | Değerlendirme | Emoji |
|-------------|---------------|-------|
| **< 0** | Kötü | ❌ |
| **0 – 30** | İyileştirme Gerekli | ⚠️ |
| **30 – 70** | İyi | ✅ |
| **70 – 100** | Mükemmel | 🌟 |

## Detractor Alarm Sistemi

> [!CAUTION]
> Aynı HV'den **30 gün** içinde **3 veya daha fazla** Detractor (0-3 puan) geldiğinde **AD-07 alarmı** tetiklenir.

| Alarm | Koşul | Aksiyon |
|-------|-------|---------|
| **AD-07** | 30 gün içinde 3+ Detractor | Admin panelde uyarı, HV hesabı incelemeye alınır |

### AD-07 Alarm Akışı

```
1. HA, HV'ye 0-3 arası NPS puanı verir
2. Sistem, son 30 gündeki Detractor sayısını kontrol eder
3. Sayı ≥ 3 ise → AD-07 alarmı oluşturulur
4. Admin panelde bildirim gösterilir
5. Admin, HV profilini inceleyerek aksiyon alır
   - Uyarı gönderme
   - Geçici askıya alma
   - Kalıcı engelleme
```

## İlişkili Sayfalar

- [[M5-Puan-Şikayet-NPS]] — Puan, şikayet ve NPS modülü
- [[HV-Sağlık-Skoru]] — NPS'in sağlık skoruna etkisi (%30)
