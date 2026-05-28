---
title: Paketler
type: kavram
prd-refs: ["§6"]
related: ["[[Aylık-Kota-Sistemi]]", "[[Akıllı-Dağıtım-Algoritması]]", "[[M4-Ödeme-Kampanya]]"]
status: complete
updated: 2026-05-24
---

> Hizmet Verenlerin aylık iş kapasitesini ve dağıtım önceliğini belirleyen 4 kademeli paket sistemi.

## PRD Referansları

- [§6 – Paket ve Ödeme Sistemi](../../esnaaf-claude.md)

## Paket Kademeleri

| Paket | Aylık Ücret | Aylık İş Kotası | Dağıtım Önceliği |
|-------|------------|----------------|-------------------|
| **Basic** | 5.000 ₺ | 14 iş | 4. sıra (en düşük) |
| **Standart** | 10.000 ₺ | 30 iş | 3. sıra |
| **Premium** | 15.000 ₺ | 60 iş | 2. sıra |
| **VIP** | 20.000 ₺ | Sınırsız | 1. sıra (en yüksek) |

## Dağıtım Öncelik Sırası

Akıllı dağıtım algoritması, yeni bir hizmet talebi geldiğinde HV'lere şu öncelik sırasıyla iş dağıtır:

1. **VIP** → En önce iş görür
2. **Premium** → İkinci sırada
3. **Standart** → Üçüncü sırada
4. **Basic** → En son sırada

> [!IMPORTANT]
> Paket seviyesi, [[Akıllı-Dağıtım-Algoritması]]'ndaki ağırlık faktörlerinin **%35**'ini oluşturur — en büyük etken pakettir.

## VIP Paket Gereksinimleri

VIP pakete yükselmek için aşağıdaki koşullar sağlanmalıdır:

- **Minimum puan:** 4.5 / 5.0 ortalama
- Puan ortalaması 4.5'in altına düşerse VIP statüsü askıya alınabilir

## VIP Rozeti

- VIP rozetli HV'ler, **Hizmet Alanlar (HA)** tarafından görülebilir
- Rozet, HV profilinde ve teklif kartlarında gösterilir
- HA'ya güven sinyali verir

## Paket Seviyesi Gizliliği

> [!NOTE]
> Basic, Standart ve Premium gibi diğer paket seviyeleri kullanıcılara (HA veya HV) **gösterilmez**. Yalnızca VIP rozeti dışarıdan görünürdür. Bu tasarım, düşük paketli HV'lerin olumsuz algılanmasını önlemek içindir.

## İlişkili Sayfalar

- [[Aylık-Kota-Sistemi]] — Paketlere bağlı kota yönetimi
- [[Akıllı-Dağıtım-Algoritması]] — Paket ağırlığının dağıtıma etkisi
- [[M4-Ödeme-Kampanya]] — Ödeme ve kampanya modülü
