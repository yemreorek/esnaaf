---
name: m2-ai-chat
description: >
  AI Chat & Talep modülü agent'ı. Web chat, mobil chat, OpenAI
  entegrasyonu, talep oluşturma, 48 saat otomatik kapanma cron'u ve AI
  hata senaryolarını kapsar. PRD §3, §4, §13, §17.1 bölümlerini etkileyen
  her değişiklik için bu agent'ı kullan.
---

# M2 — AI CHAT & TALEP AGENT

## Kapsam

PRD Bölümleri: §3 AI Chat · §4 Talep Sistemi · §13 AI Güvenlik · §17.1 AI Hata Senaryoları

## Sorumluluk Alanları

- Web + Mobil chat arayüzü (WebSocket)
- Web chat endpoint
- OpenAI GPT-4o entegrasyonu + LangChain structured output
- 7 adımlı step machine (greeting → completed)
- PII izolasyonu — kişisel veri AI'ya gitmez
- Redis session yönetimi (TTL: 24 saat)
- Token limit kontrolü
- Talep 48 saat otomatik kapanma cron'u
- HV banlama sonrası aktif teklif akışı

## AI Chat Step Machine

```
greeting → category_detection → collecting_details
→ ask_name → ask_phone → otp_verification
→ confirm_form → completed
```

## AI Hata Senaryoları (PRD §17.1) — KRİTİK

```
OpenAI timeout         → "Sistemimiz yoğun. Birkaç dakika sonra tekrar deneyin."
                          Session korunur, BullMQ'ya retry (3 deneme, 30s)
OpenAI 5xx hatası      → Aynı mesaj + retry kuyruğu
Kategori tespit edilemez → Kullanıcıya liste göster
Günlük token aşıldı    → "Bugünlük mesaj limitinize ulaştınız."
Session doldu (24s)    → Yeni session başlat + kullanıcıya bilgi ver
```

## Token Limitleri (PRD §17.1)

```
Kullanıcı başına günlük:  50.000 token
Oturum başına maks mesaj: 30 mesaj
Tek mesaj maks uzunluk:   500 karakter
System prompt maks:       1.000 token (sabit)
```

## Talep 48 Saat Kuralı (PRD §4.3)

```
Talep oluşturuldu
  → 24. saat: hiç teklif yoksa HA-06 bildirimi
  → 46. saat: 2 kabul yoksa HA-07 bildirimi ("yarın kapanacak")
  → 48. saat: cron çalışır
    - 2 kabul yapılmışsa → dokunma
    - Kabul yoksa → status='cancelled', bekleyen teklifler iptal
    - HA'ya bildirim: "Süresi dolduğu için kapatıldı."
    - Panel'de [Yeniden Oluştur] butonu

SQL cron (saatlik):
UPDATE service_requests SET status='cancelled'
WHERE status IN ('pending','distributed')
  AND created_at < NOW() - INTERVAL '48 hours'
  AND id NOT IN (SELECT job_id FROM accepted_offers);
```

## HV Banlama Sonrası Aktif Teklif (PRD §4.3)

```
HV banlanır/silinirse:
  → Kabul edilmemiş teklifleri → otomatik iptal
  → Kabul edilmiş aktif teklifi varsa:
    - HA'ya bildirim gönder
    - HA'ya alternatif HV seçme hakkı ver (yeni kabul slotu açılır)
  → Açılmış telefon numarası: HA elinde kalır (KVKK gereği silinemez)
```

## PII İzolasyonu (PRD §13.2)

```
Kullanıcı mesajı → Backend PII temizler (regex)
  Temizlenenler: ad/soyad, telefon (11 hane), TC kimlik, adres
  Sadece hizmet içeriği AI'ya gönderilir
  Kişisel bilgiler form tamamlanınca backend ekler
```

## Kategori Soru Şablonları (PRD §3.4)

| Kategori | İlk Soru |
|---|---|
| Ev Temizliği | "Hangi ilçede temizlik yaptırmak istiyorsunuz?" |
| Boya Badana | "Boyatmak istediğiniz alan ve yaklaşık metrekaresi?" |
| Nakliyat | "Taşınma adresi ve varış adresiniz nedir?" |
| Su Tesisatı | "Sorun nerede ve ne tür? (kaçak/tıkanıklık/yeni tesisat)" |
| Elektrik | "Ne tür bir elektrik işi? (arıza/yeni tesisat/priz)" |
| Ev Tadilat | "Hangi bölge? (banyo/mutfak/tüm ev)" |

## Değişiklik Yapılırken Kontrol Listesi

```
□ Yeni kategori ekleniyor mu?       → M3 dağıtım + soru şablonu ekle
□ Form alanı değişiyor mu?          → M7 service_requests.form_data
□ LLM modeli değişiyor mu?          → Token limit + maliyet güncelle
□ Token limiti değişiyor mu?        → §17.1 güncelle
□ 48 saat kuralı değişiyor mu?      → Cron + bildirim zamanlaması
□ PII kuralı değişiyor mu?          → §13.2 güncelle
□ Session TTL değişiyor mu?         → Redis config
```

## Bağımlı Modüller

| Değişiklik | Bildir |
|---|---|
| Yeni kategori | M3 (dağıtım coğrafi kapsam) |
| Form alanı | M7 (DB şeması) |
| Session yapısı | M7 (Redis config) |
| 48s cron değişikliği | §14 bildirim (HA-06, HA-07) |

## Hızlı Referans — DB

```
service_requests(id, seeker_id FK, category_id FK,
                 form_data JSONB, status ENUM, city, district,
                 created_at, updated_at)

Redis: ai_session:{phone}:{session_id}  TTL: 86400s
Steps: greeting|category_detection|collecting_details|
       ask_name|ask_phone|otp_verification|confirm_form|completed
```

## Hızlı Referans — API

```
POST /chat/message           ← web chat mesajı
GET  /chat/session/:id       ← session durumu
DELETE /chat/session/:id     ← session kapat


POST /jobs                   ← talep oluştur
GET  /jobs                   ← kullanıcının talepleri (?status=)
GET  /jobs/:id               ← talep detayı + teklifler
DELETE /jobs/:id             ← iptal et

GET  /categories             ← aktif kategoriler (PUBLIC)
GET  /categories/:id/questions ← soru şablonu
```
