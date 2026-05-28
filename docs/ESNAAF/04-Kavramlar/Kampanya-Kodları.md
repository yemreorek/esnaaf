---
title: Kampanya Kodları
type: kavram
prd-refs: ["§7.6"]
related: ["[[M4-Ödeme-Kampanya]]", "[[Admin-Trial-Akışı]]"]
status: complete
updated: 2026-05-24
---

> HV'lere indirim, ücretsiz deneme ve paket yükseltme imkânı sunan kampanya kodu sistemi.

## PRD Referansları

- [§7.6 – Kampanya Kodları](../../esnaaf-claude.md)

## Kampanya Kodu Türleri

| Tür | Açıklama | Örnek |
|-----|----------|-------|
| **PERCENT** | Yüzdelik indirim | %20 indirim → 10.000 ₺ yerine 8.000 ₺ |
| **FIXED** | Sabit tutar indirimi | 2.000 ₺ indirim → 10.000 ₺ yerine 8.000 ₺ |
| **FREE_TRIAL** | Ücretsiz deneme süresi | 14 gün ücretsiz Standart paket |
| **UPGRADE** | Paket yükseltme | Basic fiyatına Standart paket |

## Kampanya Kuralları

Kampanya kodlarının uygulanmasında **7 temel kural** geçerlidir:

| # | Kural | Açıklama |
|---|-------|----------|
| 1 | **Tek kullanım** | Her kod, her kullanıcı tarafından yalnızca bir kez kullanılabilir |
| 2 | **İlk ay** | Kampanya kodu yalnızca ilk ay için geçerlidir |
| 3 | **Paket kısıtlaması** | Bazı kodlar belirli paketlere özeldir (ör. yalnızca Standart) |
| 4 | **Yeni kullanıcı** | Bazı kodlar yalnızca yeni kayıt olan HV'ler için geçerlidir |
| 5 | **Son kullanma tarihi** | Her kodun bir geçerlilik süresi vardır |
| 6 | **Maksimum kullanım** | Bir kodun toplam kaç kez kullanılabileceği sınırlıdır |
| 7 | **Birleştirme yasağı** | Birden fazla kampanya kodu aynı anda kullanılamaz |

> [!WARNING]
> Kampanya kodları birleştirilemez. Bir HV aynı anda yalnızca bir kampanya kodundan faydalanabilir.

## Satış Personeli Kod Üretimi

Satış personeli, her HV'ye özel benzersiz kampanya kodları üretebilir:

```
Format:  STS-{İSİM}-{YIL}
Örnek:   STS-MEHMET-2025
         STS-AYSE-2025
         STS-ALI-2026
```

| Özellik | Açıklama |
|---------|----------|
| **Üretici** | Satış personeli (admin panelden) |
| **Format** | `STS-{İSİM}-{YIL}` |
| **Benzersizlik** | Her kod tekil, aynı isim varsa suffix eklenir |
| **Takip** | Hangi satışçının hangi kodu ürettiği loglanır |
| **Performans** | Satışçı bazında kod kullanım oranı raporlanır |

> [!TIP]
> Satışçıya özel kodlar, satış performansı takibi ve komisyon hesaplaması için kullanılabilir.

## İlişkili Sayfalar

- [[M4-Ödeme-Kampanya]] — Ödeme ve kampanya modülü
- [[Admin-Trial-Akışı]] — Yönetici tarafından deneme süresi tanımlama akışı
