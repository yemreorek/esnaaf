---
title: M3 — Eşleştirme & Teklif
type: modül
prd-refs: ["§5", "§8", "§11"]
related: ["[[M2-AI-Chat-Talep]]", "[[M4-Ödeme-Kampanya]]", "[[M5-Puan-Şikayet-NPS]]", "[[M7-Altyapı]]"]
status: complete
updated: 2026-05-24
---

> Taleplerin hizmet verenlere dağıtılması, tekliflerin yönetilmesi, kabul/red akışı ve iletişim süreçlerinden sorumlu modül.

## PRD Bölümleri

- [§5 Hizmet Veren Paneli](../../esnaaf-claude.md)
- [§8 İletişim & Telefon Maskeleme Sistemi](../../esnaaf-claude.md)
- [§11 Akıllı Dağıtım Algoritması](../../esnaaf-claude.md)

## Sorumluluk Alanı

- Akıllı dağıtım algoritması (ağırlıklı puanlama)
- Talep → HV eşleştirme (maks. 5–7 HV)
- Teklif CRUD (fiyat + mesaj, maks. 3 güncelleme)
- Kabul akışı (maks. 3 kabul / talep)
- Telefon maskeleme ve açma (AES-256)
- Platform içi mesajlaşma (metin, fotoğraf, sesli not)
- İçerik filtreleme (kişisel bilgi paylaşım engeli)

## Bağımlılıklar

```
M3 → M2 (talep verisi)
M3 → M4 (paket seviyesi → dağıtım ağırlığı)
M3 → M5 (puan → dağıtım ağırlığı)
M3 → M7 (WebSocket, Redis, şifreleme)
```

## Akıllı Dağıtım Ağırlıkları

| Faktör | Ağırlık |
|---|---|
| Paket seviyesi (VIP > Premium > Standart > Basic) | %35 |
| Ortalama kullanıcı puanı | %25 |
| Yanıt hızı (30 günlük ortalama) | %20 |
| Konum yakınlığı | %15 |
| Platform kıdemi | %5 |

## Kabul Kuralları

- Maks. **3 kabul** / talep
- Her kabul → telefon numaraları karşılıklı açılır
- 3. kabul sonrası bekleyen teklifler → "Değerlendirilmedi"
- Kabul edilmiş teklif güncellenemez

## Mesajlaşma Kuralları

- Mesajlaşma ücretsiz ve sınırsız
- Telefon / e-posta / sosyal medya paylaşımı **yasak** (içerik filtresi)
- HV 2 saat içinde yanıt vermeli (sistem uyarısı)
- Mesaj geçmişi **90 gün** saklanır

## DB Tabloları

- [[offers]] — teklifler
- [[accepted_offers]] — kabul edilen teklifler
- [[messages]] — platform içi mesajlar
- [[phone_reveal_logs]] — numara açma logları (KVKK)
- [[activity_logs]] — HV aktivite logları
- [[response_times]] — yanıt süreleri

## Endpoint'ler

- [[Offer-Endpoints]] — `/api/offers/*`
- [[Message-Endpoints]] — `/api/messages/*`
- [[Distribution-Endpoints]] — `/api/distribution/*`

## İlgili Akışlar

- [[Teklif-Kabul-Akışı]]
- [[Telefon-Açma-Akışı]]
- [[Platform-Mesajlaşma-Akışı]]

## İlgili Kavramlar

- [[Akıllı-Dağıtım-Algoritması]]
- [[Telefon-Maskeleme]]
- [[Favori-HV]]
