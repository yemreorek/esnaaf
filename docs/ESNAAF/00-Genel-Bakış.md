---
title: Esnaaf — Genel Bakış
type: genel
prd-refs: ["§1"]
related: ["[[M1-Auth-Kullanıcı]]", "[[M2-AI-Chat-Talep]]", "[[Hizmet-Alan]]", "[[Hizmet-Veren]]"]
status: complete
updated: 2026-05-24
---

> Türkiye'nin ilk "Conversational Commerce" hizmet eşleştirme platformu.

## PRD Bölümleri

- [§1 Sistem Özeti](../esnaaf-claude.md)

## Vizyon & Value Proposition

**Slogan:** *"Form doldurmayı bırak. Ne istediğini yaz, ustası saniyeler içinde teklif versin."*

Geleneksel platformların kategori menüleri, onlarca adımlı form ve buton labirentleri yerine Esnaaf kullanıcıya tek bir şey sorar: **"Bana neye ihtiyacın olduğunu söyle."**

Kullanıcı doğal dilde yazar → Yapay zeka anlar → Talebi ustalarına iletir → Teklifler canlı olarak chat ekranına düşer.

## Kullanıcı Tipleri

| Tip | Uygulama | Açıklama |
|---|---|---|
| [[Hizmet-Alan]] | **Esnaaf** (Web + Mobil) | Chat ile talep oluşturur, teklifleri chat ekranında canlı takip eder |
| [[Hizmet-Veren]] | **Esnaaf Partner** (Mobil) | Aylık paket aboneliği ile gelen işleri görür, teklif verir, mesajlaşır |

## Ana Kullanıcı Akışı

```
Kullanıcı siteye girer
        ↓
Ekranda tek şey var: Logo + büyük chat kutusu
"Bana neye ihtiyacın olduğunu söyle..."
        ↓
Kullanıcı yazar: "Kombim su akıtıyor, acil usta lazım, Şişli"
        ↓
AI saniyeler içinde analiz eder:
  Kategori → Kombi Bakım / Su Tesisatı
  Aciliyet → Yüksek
  Konum    → Şişli
        ↓
Eksik bilgi varsa AI doğal dilde sorar
        ↓
Bilgiler tamamlanır → Kullanıcı onaylar
        ↓
"Talebinizi Şişli'deki en iyi 5 ustaya ilettik."
        ↓
[WebSocket] — Canlı teklif akışı aynı chat ekranında
```

## Karşılama Ekranı Tasarım Kuralı

```
✓ Logo (üstte ortalı)
✓ Büyük chat input alanı (sayfanın merkezinde)
✓ Placeholder: "Bana neye ihtiyacın olduğunu söyle..."
✓ Chat inputunun altında küçük hızlı seçim chip'leri
✓ Kayıt olmadan chat AÇIK

✗ Kategori menüsü yok
✗ "Hemen Başla" butonu yok
✗ Açılır menü yok
✗ Slider/banner yok
```

## Teknik Temel

| Bileşen | Teknoloji |
|---|---|
| AI | LangChain + GPT-4o (Türkçe doğal dil anlama) |
| Canlı Teklif | WebSocket (Socket.io) — gerçek zamanlı push |
| OTP | SMS (Netgsm) — %99.9 delivery garantisi |
| Kanallar | Web (chat-first) · Esnaaf mobil · Esnaaf Partner (HV) |

## Modül Mimarisi

| Modül | Sorumluluk | PRD Bölümleri |
|---|---|---|
| [[M1-Auth-Kullanıcı]] | Auth & Kullanıcı | §2, §12, §16, §17.1 |
| [[M2-AI-Chat-Talep]] | AI Chat & Talep | §3, §4, §13, §17.1 |
| [[M3-Eşleştirme-Teklif]] | Eşleştirme & Teklif | §5, §8, §11 |
| [[M4-Ödeme-Kampanya]] | Ödeme & Kampanya | §6, §7, §7.6, §17.1 |
| [[M5-Puan-Şikayet-NPS]] | Puan & Şikayet & NPS | §9, §10, §14.7 |
| [[M6-Admin-Roller]] | Admin & Roller | §15 |
| [[M7-Altyapı]] | Altyapı | §16, §17, §18, §19, §20 |

## İlgili Sayfalar

- [[AI-Chat-Akışı]]
- [[Anonim-Chat-Akışı]]
- [[Paketler]]
- [[Akıllı-Dağıtım-Algoritması]]
- [[MVP-Faz-1]]
