---
title: Aylık Kota Sistemi
type: kavram
prd-refs: ["§6"]
related: ["[[Paketler]]", "[[M4-Ödeme-Kampanya]]"]
status: complete
updated: 2026-05-24
---

> Her HV'nin paketine göre belirlenen aylık iş limitini yöneten kota mekanizması.

## PRD Referansları

- [§6 – Paket ve Ödeme Sistemi](../../esnaaf-claude.md)

## Kota Düşme Kuralı

> [!IMPORTANT]
> Kota, **HV teklif verdiğinde değil**, **HA teklifi kabul ettiğinde** düşer. Bu tasarım, HV'nin teklif verme özgürlüğünü kısıtlamadan sadece gerçekleşen eşleşmeleri sayar.

## Kota Etki Tablosu

| Durum | Kota Etkisi | Açıklama |
|-------|-------------|----------|
| HA teklifi **kabul eder** | **−1** | Kota 1 azalır |
| HA teklifi **reddeder** | Etkisiz | Kota değişmez |
| HA hiçbir teklifi **seçmez** | Etkisiz | Kota değişmez |
| Kabul sonrası **iptal** | **İade yok** | Kota geri verilmez |

## Kota Sıfırlama

- **Tarih:** Her ayın **1'i**
- **Saat:** **UTC+3 00:00** (Türkiye saati gece yarısı)
- Kota, paketin tanımlı limitine sıfırlanır (Basic → 14, Standart → 30, Premium → 60, VIP → sınırsız)

## Kota Dolduğunda

Aylık kotası tükenen HV için aşağıdaki kısıtlamalar devreye girer:

| Kısıtlama | Açıklama |
|-----------|----------|
| **Görünmezlik** | HV, yeni hizmet taleplerine dağıtılmaz |
| **Teklif yasağı** | HV, yeni tekliflerde bulunamaz |
| **Mevcut teklifler** | Daha önce verilen açık teklifler geçerliliğini korur |

> [!NOTE]
> VIP paketinde kota sınırsız olduğundan bu kısıtlamalar VIP HV'ler için geçerli değildir.

## İlişkili Sayfalar

- [[Paketler]] — Paket kademelerine göre kota limitleri
- [[M4-Ödeme-Kampanya]] — Ödeme ve kampanya modülü
