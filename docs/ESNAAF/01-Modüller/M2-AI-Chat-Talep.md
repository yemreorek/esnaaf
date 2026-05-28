---
title: M2 — AI Chat & Talep
type: modül
prd-refs: ["§3", "§4", "§13", "§17.1"]
related: ["[[M1-Auth-Kullanıcı]]", "[[M3-Eşleştirme-Teklif]]", "[[M7-Altyapı]]", "[[AI-Chat-Akışı]]"]
status: complete
updated: 2026-05-24
---

> AI destekli chat ile talep oluşturma, kategori tespiti, form özeti ve talep yaşam döngüsünden sorumlu modül.

## PRD Bölümleri

- [§3 Gelişmiş AI Chat Akışı](../../esnaaf-claude.md)
- [§4 Talep (Job) Sistemi](../../esnaaf-claude.md)
- [§13 AI Chat Güvenliği](../../esnaaf-claude.md)
- [§17.1 Hata Senaryoları](../../esnaaf-claude.md)

## Sorumluluk Alanı

- AI chat motor yönetimi (LangChain + GPT-4o)
- Doğal dil → yapılandırılmış talep dönüşümü
- Kategori tespiti (20 hizmet kategorisi)
- Kategori bazlı soru akışı (zorunlu + opsiyonel sorular)
- Form özeti oluşturma ve kullanıcı onayı
- Talep (job) CRUD işlemleri
- Talep statü yönetimi: `Bekliyor → Firmalara Gönderildi → Tamamlandı / İptal Edildi`
- 48 saatlik talep yaşam süresi + otomatik kapanma
- WebSocket ile canlı teklif akışı
- PII izolasyonu (kişisel veri chat'ten ayrı saklanır)

## Bağımlılıklar

```
M2 → M1 (kullanıcı kimlik doğrulama, anonim session)
M2 → M3 (talep → eşleştirme → dağıtım)
M2 → M7 (Redis, WebSocket, rate limit)
```

## AI Teknik Yapı

| Bileşen | Değer |
|---|---|
| LLM | OpenAI GPT-4o (veya GPT-4o Mini) |
| Konuşma State | Redis (session bazlı, TTL: 24 saat) |
| Structured Output | LangChain ile JSON schema zorunlu |
| Oturum İzolasyonu | Her konuşma izole — veri sızması yok |
| Fallback | Kategori tespit edilemezse → liste gösterilir |

## Talep Kuralları

- Her talep maks. **5–7 hizmet verene** gösterilir
- Aynı talep için HV yalnızca **1 teklif** verebilir
- 48 saat sonra teklif gelmemişse otomatik kapanma
- HA iptal edilen talebi **[Yeniden Oluştur]** ile tekrar açabilir

## DB Tabloları

- [[service_requests]] — talepler
- [[chat_sessions]] — AI chat oturumları
- [[chat_messages]] — chat mesajları
- [[ai_analysis_logs]] — AI analiz logları

## Endpoint'ler

- [[Chat-Endpoints]] — `/api/chat/*`
- [[Job-Endpoints]] — `/api/jobs/*`

## İlgili Akışlar

- [[AI-Chat-Akışı]]
- [[Anonim-Chat-Akışı]]
- [[Talep-Yaşam-Döngüsü]]
- [[Form-Özeti-Akışı]]

## İlgili Kavramlar

- [[Anonim-Session]]
- [[PII-İzolasyonu]]
- [[Hızlı-Seçim-Chipleri]]
- [[Kategori-Bazlı-Soru-Akışı]]

## Hata Senaryoları (§17.1)

| Senaryo | Davranış |
|---|---|
| AI yanıt vermez | "Şu anda yanıt veremiyorum. Lütfen tekrar deneyin." |
| Kategori tespit edilemez | Kullanıcıya kategori listesi sunulur |
| Chat session timeout | Redis TTL: 24 saat — session sonrası yeni chat başlar |
| Rate limit aşıldı | 429 → "Çok fazla istek. Lütfen biraz bekleyin." |
