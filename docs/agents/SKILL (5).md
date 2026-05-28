---
name: m5-review
description: >
  Puan & Şikayet & NPS modülü agent'ı. Üç katmanlı yorum doğrulama,
  admin onay kuyruğu, şikayet mekanizması (4 kademeli ceza), NPS otomatik
  anket sistemi, hizmet veren sağlık skoru ve itiraz mekanizmasını kapsar.
  PRD §9, §10, §14.7 bölümlerini etkileyen her değişiklik için bu agent'ı kullan.
---

# M5 — PUAN & ŞİKÂYET & NPS AGENT

## Kapsam

PRD Bölümleri: §9 Puan & Güven · §10 Şikayet · §14.7 NPS Sistemi

## Sorumluluk Alanları

- 1–5 yıldız puan sistemi
- Üç katmanlı yorum doğrulama (belge → admin → telefon)
- Admin onay kuyruğu + Y01-Y05 red şablonları
- Görünürlük puan eşikleri
- Şikayet kategorileri + 4 kademeli ceza skalası
- Yorum itiraz mekanizması
- Hizmet veren sağlık skoru
- NPS otomatik platform içi anketi (30 dk sonra)
- Promoter / Pasif / Detraktör gruplama ve aksiyonlar
- Detraktör alarm sistemi

## Yorum Doğrulama Akışı (PRD §9, §15.5)

```
Kullanıcı yorum yazar
  → Fatura/fiş yükleme ZORUNLU (belge olmadan form gösterilmez)
  → "İncelemede" statüsüne girer
  → Admin kuyruğuna düşer
        ↓
Admin: Belge kontrolü (fatura tutarlılığı, tarih)
  → Telefon araması (max 3 deneme)
  → Onayla veya Y01-Y05 şablonuyla reddet
```

**Red Şablonları:**

| Kod | Sebep |
|---|---|
| Y01 | Belge yüklenmemiş veya geçersiz |
| Y02 | Belge ile yorum tarihi uyuşmuyor |
| Y03 | Yorum içeriği uygunsuz |
| Y04 | Sahte yorum şüphesi |
| Y05 | Müşteriye ulaşılamadı (3 deneme) |

## Görünürlük Puan Eşikleri (PRD §9.2)

| Puan | Görünürlük | Aksiyon |
|---|---|---|
| 4.5–5.0 | Yüksek | Normal |
| 3.5–4.4 | Orta | Normal |
| 2.5–3.4 | Düşük | İzleme |
| < 2.5 | Yok | Admin uyarı süreci |

## Şikayet 4 Kademeli Ceza Skalası (PRD §15.6)

```
1. şikayet            → Kayıt, otomatik aksiyon yok
2. şikayet (30 gün)   → Admin uyarı e-postası
3. şikayet (60 gün)   → 7 gün otomatik askı + admin bildirimi
4+ şikayet            → Admin kararı zorunlu (kalıcı kaldırma riski)
```

## İtiraz Mekanizması (PRD §10)

```
HV yoruma itiraz eder → "İtiraz Var" statüsüne geçer
  → Admin kuyruğunda filtreli görünür
  → Admin her iki tarafı inceler
  → Karar: [Yorumu Kaldır] veya [İtirazı Reddet]
  → Her iki tarafa bildirim
```

## NPS Sistemi (PRD §14.7)

```
İş onayından 30 dk sonra → HA'ya platform içi anket (push bildirimi):
"0-10 arası puan verir misiniz?"
        ↓
Kullanıcı yanıtlar:
  0–3  → Detraktör → kalite personeline ANLIK alarm + "Ne oldu?" sorusu
  4–6  → Pasif     → normal görev + "Nasıl daha iyi?" sorusu
  7–10 → Promoter  → teşekkür + yorum daveti linki
```

**NPS Formülü:**
```
NPS = Promoter% − Detraktör%
0-30: Geliştirilmeli | 30-70: İyi | 70-100: Mükemmel
```

**Detraktör Alarm:** Aynı HV'den 30 günde 3+ detraktör → ekip liderine otomatik bildirim (AD-07)

## Sağlık Skoru Hesaplama

```
Sağlık Skoru (0-100):
  Puan bileşeni    (%40): avg_rating / 5 × 40
  NPS bileşeni     (%30): son 30 gün NPS / 100 × 30
  Şikayet bileşeni (%20): şikayet yoksa 20, her şikayette -5
  Aktiflik bileşeni(%10): son 7 günde giriş varsa 10

Düşük skor → dağıtım algoritmasına negatif etki
Çok düşük skor → admin uyarı
```

## Değişiklik Yapılırken Kontrol Listesi

```
□ Puan eşiği değişiyor mu?          → M3 dağıtım + M4 VIP koşulu
□ NPS anket zamanı değişiyor mu?    → §14 bildirim HA-08 güncelle
□ Detraktör eşiği değişiyor mu?    → §14 bildirim AD-07 güncelle
□ Şikayet kategorisi ekleniyor mu?  → M6 admin + M7 ENUM
□ Ceza skalası değişiyor mu?        → M6 admin panel süreci
□ Belge tipi değişiyor mu?          → M7 storage yapılandırması
□ Sağlık skoru formülü değişiyor mu?→ M3 dağıtım filtresi
```

## Bağımlı Modüller

| Değişiklik | Bildir |
|---|---|
| Puan eşiği | M3 (dağıtım), M4 (VIP koşulu) |
| NPS zamanı | §14 bildirim HA-08 |
| Detraktör alarm | §14 bildirim AD-07 |
| Şikayet kategorisi | M6 (admin form), M7 (ENUM) |
| Sağlık skoru | M3 (dağıtım filtresi) |
| Belge tipi | M7 (storage) |

## Hızlı Referans — DB

```
reviews(id, job_id FK, reviewer_id FK, provider_id FK,
        rating INT(1-5), comment, document_url,
        status ENUM(pending|approved|rejected),
        approved_by FK, approved_at, created_at)

review_verifications(id, review_id FK, verified_by FK,
                     call_attempt INT, call_result ENUM,
                     notes, verified_at)

complaints(id, job_id FK, reporter_id FK, reported_id FK,
           category ENUM(service_not_done|poor_quality|
                         price_dispute|other),
           description, status ENUM(open|investigating|
                                    resolved|rejected),
           resolved_at, created_at)

nps_responses(id, job_completion_id FK, seeker_id FK,
              provider_id FK, category_id FK,
              score INT(0-10), group ENUM(promoter|passive|detractor),
              follow_up_text, channel ENUM(whatsapp|web),
              responded_at, created_at)
```

## Hızlı Referans — API

```
POST /reviews                  ← yorum + belge (multipart)
GET  /reviews/provider/:id     ← onaylı yorumlar
POST /reviews/:id/appeal       ← itiraz

POST /complaints
GET  /complaints/:id

POST /nps/respond              ← puan kaydet (webhook'tan)
GET  /nps/score                ← platform geneli NPS
GET  /nps/responses            ← yanıt listesi (admin)
GET  /nps/provider/:id         ← HV bazlı NPS
```
