---
title: M6 — Admin & Roller
type: modül
prd-refs: ["§15"]
related: ["[[M1-Auth-Kullanıcı]]", "[[M4-Ödeme-Kampanya]]", "[[M5-Puan-Şikayet-NPS]]", "[[M7-Altyapı]]"]
status: complete
updated: 2026-05-24
---

> Admin paneli, personel rolleri, HV onay süreci, yorum/şikayet yönetimi ve KVKK taleplerinden sorumlu modül.

## PRD Bölümleri

- [§15 Admin Panel](../../esnaaf-claude.md)

## Sorumluluk Alanı

- Admin paneli (11 alt modül)
- Dashboard (gerçek zamanlı metrikler, 60 sn yenileme)
- Kullanıcı yönetimi (arama, filtreleme, banlama)
- HV onay kuyruğu (kimlik & belge kontrolü)
- Yorum onay kuyruğu (FIFO)
- Şikayet yönetimi (SLA: 24 saat ilk yanıt)
- Talep izleme ve müdahale
- Ödeme & abonelik yönetimi
- Performans & analitik
- KVKK talep yönetimi (SLA: 30 gün)
- Bildirim yönetimi (manuel gönderim)
- Rol & İzin yönetimi (§15.13)

## Bağımlılıklar

```
M6 → M1 (kullanıcı verileri, banlama)
M6 → M4 (ödeme/abonelik durumu, kampanya)
M6 → M5 (yorum onay, şikayet kararı)
M6 → M7 (loglama, audit trail)
```

## Admin Panel Modülleri

| # | Modül | Öncelik |
|---|---|---|
| 1 | Dashboard | Yüksek |
| 2 | Kullanıcı Yönetimi | Yüksek |
| 3 | Hizmet Veren Onay | Yüksek |
| 4 | Yorum Onay Kuyruğu | Yüksek |
| 5 | Şikayet Yönetimi | Yüksek |
| 6 | Talep İzleme | Orta |
| 7 | Ödeme & Abonelik | Orta |
| 8 | Paket Yönetimi | Orta |
| 9 | Performans & Analitik | Orta |
| 10 | KVKK Talepleri | Orta |
| 11 | Bildirim Yönetimi | Düşük |

## Personel Rolleri

| Rol | Yetkiler |
|---|---|
| Süper Admin | Tüm modüllere tam erişim |
| Ekip Lideri | Çoğu admin fonksiyonu, trial iptal |
| Operasyon Personeli | Şikayet yönetimi, talep izleme |
| Satış Personeli | Kampanya kodu üretme, trial verme |
| Pazarlama Personeli | Kampanya yönetimi |
| Kalite Personeli | NPS detractor takip, yorum doğrulama aramaları |
| Muhasebe Personeli | Ödeme raporları, fatura takibi |
| KVKK Sorumlusu | KVKK talep yönetimi |

## HV Red Şablonları

| Kod | Sebep |
|---|---|
| R01 | Eksik kimlik belgesi |
| R02 | Doğrulanamayan bilgiler |
| R03 | Yanlış kategori seçimi |
| R04 | Daha önce banlanan kullanıcı |
| R05 | Diğer |

## Yorum Red Şablonları

| Kod | Sebep |
|---|---|
| Y01 | Belge yok |
| Y02 | Tarih uyuşmazlığı |
| Y03 | Uygunsuz içerik |
| Y04 | Sahte şüphesi |
| Y05 | Müşteriye ulaşılamadı |

## DB Tabloları

- [[admin_users]] — admin personel kayıtları
- [[admin_roles]] — rol tanımları
- [[admin_permissions]] — izin matrisi
- [[activity_logs]] — admin aktivite logları
- [[audit_logs]] — denetim kayıtları

## Endpoint'ler

- [[Admin-Endpoints]] — `/api/admin/*`

## İlgili Akışlar

- [[HV-Onay-Akışı]]
- [[Yorum-Onay-Akışı]]
- [[Şikayet-Akışı]]
- [[KVKK-Talep-Akışı]]
- [[Kullanıcı-Banlama-Akışı]]

## İlgili Kavramlar

- [[Admin-Roller-İzinler]]
- [[SLA-Kuralları]]
