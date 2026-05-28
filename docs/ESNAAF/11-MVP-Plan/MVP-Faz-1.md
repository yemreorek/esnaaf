---
title: MVP Faz 1
type: mvp
prd-refs: ["§20"]
related: ["[[MVP-Faz-2]]", "[[00-Genel-Bakış]]"]
status: complete
updated: 2026-05-24
---

> Uçtan uca çalışan sistem: 1 kategori (Ev Temizliği), 1 şehir (İstanbul), temel akışın tamamı.

## PRD Bölümleri

- [§20 MVP Fazları](../../esnaaf-claude.md)

## Hedef

**Faz 1'in tek hedefi:** Ev Temizliği kategorisinde, İstanbul'da, bir hizmet alanın AI chat ile talep oluşturup, hizmet verenin teklif verip, işin tamamlanmasına kadar olan uçtan uca akışın çalışır durumda olması.

## Ekip

| Rol | Kişi Sayısı |
|---|---|
| Backend Geliştirici | 1 |
| Frontend Geliştirici | 1 |
| Product / Test | 1 |
| **Toplam** | **3** |

## Haftalık Plan

### Hafta 1–2: Altyapı & Auth

| Görev | Detay |
|---|---|
| Veritabanı | PostgreSQL + Redis + BullMQ kurulumu |
| Backend | NestJS scaffold (modüler mimari) |
| Auth | OTP (SMS) + JWT token sistemi |
| KVKK | Zorunlu onay akışı |
| Deploy | Railway üzerine ilk deploy |

### Hafta 3–4: AI Chat & Talep

| Görev | Detay |
|---|---|
| WebSocket | Socket.io ile gerçek zamanlı chat altyapısı |
| AI Motor | OpenAI GPT-4o + LangChain entegrasyonu |
| Soru Akışı | Ev Temizliği kategorisi için AI soru şablonu |
| PII İzolasyonu | Kişisel veri chat'ten ayrı saklanır |
| Form Oluşturma | AI'ın topladığı bilgilerden form özeti + kullanıcı onayı |

### Hafta 5–6: HV Paneli & Eşleştirme

| Görev | Detay |
|---|---|
| HV Paneli | Gelen işler ekranı |
| Teklif Sistemi | HV'nin fiyat + mesaj ile teklif vermesi |
| Konum Dağıtımı | Temel ilçe bazlı dağıtım (akıllı dağıtım değil) |
| Admin Onayı | HV başvuru onay ekranı (kimlik + belge kontrolü) |

### Hafta 7–8: HA Paneli & Temel İşleyiş

| Görev | Detay |
|---|---|
| HA Paneli | Gelen teklifleri chat ekranında görme |
| Telefon Maskeleme | HV numarasının maskelenerek gösterilmesi |
| 2-HV Kabulü | HA'nın maks. 2 HV kabul etmesi + onay popup'ı |
| İş Tamamlama | İşin tamamlandı olarak işaretlenmesi + ücret doğrulama |
| Şikayet Alarmı | Temel şikayet alarm mekanizması (otomatik çözüm yok) |
| Bildirimler | Temel bildirimler: HA-01–05, HV-01–02 |
| Admin Paneli | Temel admin: kullanıcı listesi, talep takibi |
| UI | Chat-first arayüz (logo + büyük chat kutusu) |

## Faz 1'de OLMAYAN Özellikler

| Özellik | Hangi Fazda |
|---|---|
| Ödeme sistemi (iyzico) | Faz 2 |
| NPS anketi | Faz 2 |
| Akıllı dağıtım algoritması | Faz 2 |
| Mobil uygulamalar | Faz 3 |
| Kampanya sistemi | Faz 3 |
| Rol yönetimi (10 staff rolü) | Faz 2 |
| 6+ kategori | Faz 2 |
| İstanbul dışı şehirler | Faz 3 |

## Geçiş Kriterleri (Faz 1 → Faz 2)

Faz 2'ye geçmek için aşağıdaki koşulların tamamı sağlanmalıdır:

| Kriter | Hedef |
|---|---|
| Tamamlanan iş sayısı | ≥ 50 |
| Aktif HV sayısı | ≥ 30 |
| P0 bug sayısı | 0 (sıfır) |

## Teknik Altyapı Özeti

```
Frontend: Next.js (chat-first UI)
Backend:  NestJS (modüler)
DB:       PostgreSQL
Cache:    Redis
Queue:    BullMQ
AI:       LangChain + GPT-4o
Realtime: Socket.io (WebSocket)
Auth:     OTP + JWT
OTP:      Netgsm SMS
Deploy:   Railway
```

## İlgili Sayfalar

- [[MVP-Faz-2]] — Gelir modeli, kalite sistemi, 6 kategori
- [[MVP-Faz-3]] — Mobil uygulamalar, kampanya, çoklu şehir
- [[00-Genel-Bakış]] — Platform genel bakış
- [[Hizmet-Kategorileri]] — 20 kategori ve faz dağılımı
- [[M1-Auth-Kullanıcı]] — Auth & kullanıcı modülü
- [[M2-AI-Chat-Talep]] — AI Chat & Talep modülü
