---
title: Anonim Session
type: kavram
prd-refs: ["§1.4.2", "§13.4"]
related: ["[[Anonim-Chat-Akışı]]", "[[M1-Auth-Kullanıcı]]"]
status: complete
updated: 2026-05-24
---

> Kayıtsız kullanıcıların AI chat ile etkileşimini sağlayan geçici oturum mekanizması.

## PRD Referansları

- [§1.4.2 – Anonim Kullanıcı Akışı](../../esnaaf-claude.md)
- [§13.4 – Anonim Session Yönetimi](../../esnaaf-claude.md)

## Redis Yapısı

Anonim oturumlar Redis üzerinde geçici anahtar olarak saklanır.

| Özellik | Değer |
|---------|-------|
| **Redis Key** | `temp_session:{uuid}` |
| **TTL** | 2 saat |
| **Veri Formatı** | JSON |

```
Key:   temp_session:a3f8b2c1-4d5e-6f7a-8b9c-0d1e2f3a4b5c
TTL:   7200 (saniye)
Value: {
  "session_id": "a3f8b2c1-...",
  "created_at": "2026-05-24T10:30:00Z",
  "chat_history": [...],
  "extracted_data": {...}
}
```

## Saklanan Veriler

| Veri | Açıklama |
|------|----------|
| `chat_history` | AI ile yapılan tüm mesajlaşma geçmişi |
| `extracted_data` | Chat'ten çıkarılan hizmet bilgileri (kategori, detaylar vb.) |
| `created_at` | Oturum oluşturma zamanı |

## Kayıt Dönüşümü

Anonim kullanıcı kayıt olduğunda:

```
1. Kullanıcı kayıt formunu tamamlar
2. Sistem user_id oluşturur
3. temp_session:{uuid} → user_id ile eşleştirilir
4. Chat geçmişi kalıcı veritabanına taşınır
5. Anonim oturumdaki hizmet talebi kullanıcıya bağlanır
6. Redis key silinir
```

> [!IMPORTANT]
> Dönüşüm sayesinde kullanıcı, kayıt öncesi AI ile konuşarak oluşturduğu hizmet talebini kaybetmez. Kayıt sonrası her şey otomatik olarak hesabına aktarılır.

## Terk Edilen Oturumlar

| Durum | Davranış |
|-------|----------|
| Kullanıcı 2 saat içinde geri dönerse | Oturum devam eder |
| 2 saat içinde kayıt olmazsa | Oturum otomatik silinir (TTL sona erer) |
| Tarayıcı kapatılırsa | Oturum Redis'te 2 saat daha korunur |

> [!NOTE]
> Terk edilen oturumlar 2 saat boyunca saklanır. Bu süre zarfında kullanıcı aynı cihaz ve tarayıcıdan geri dönerse oturumunu kaldığı yerden sürdürebilir.

## İlişkili Sayfalar

- [[Anonim-Chat-Akışı]] — Anonim kullanıcının AI chat akış diyagramı
- [[M1-Auth-Kullanıcı]] — Kimlik doğrulama ve kullanıcı yönetimi modülü
