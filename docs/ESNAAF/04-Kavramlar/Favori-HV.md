---
title: Favori HV
type: kavram
prd-refs: ["§2.2"]
related: ["[[Hizmet-Alan]]", "[[Hizmet-Veren]]"]
status: complete
updated: 2026-05-24
---

> Hizmet Alanların memnun kaldıkları HV'leri favorilere ekleyerek sonraki taleplerinde öncelikli eşleştirme yapabilmesini sağlayan sistem.

## PRD Referansları

- [§2.2 – Favori HV Sistemi](../../esnaaf-claude.md)

## Favoriye Ekleme Koşulları

Bir HA, bir HV'yi favorilere ekleyebilmek için:

| Koşul | Açıklama |
|-------|----------|
| **Tamamlanmış iş** | HA ile HV arasında en az bir tamamlanmış iş olmalıdır |
| **Puan verilmiş** | İş tamamlandıktan sonra puanlama yapılmış olmalıdır |

> [!NOTE]
> Henüz iş yapılmamış veya devam eden bir iş varken HV favorilere eklenemez. Bu kural, favori sisteminin gerçek deneyime dayalı olmasını sağlar.

## Favori HV Kullanımı

HA yeni bir hizmet talebi oluşturduğunda:

```
1. HA, hizmet talebini oluşturur
2. Sistem "Favori HV'lerime Gönder" seçeneğini sunar
3. HA bu seçeneği işaretlerse:
   a. Talep önce favori HV'lere yönlendirilir
   b. Favori HV kabul etmezse → normal dağıtım başlar
4. HA işaretlemezse → doğrudan normal dağıtım
```

## Öncelik Kuralları

Favori HV sistemi, mevcut kota ve paket kurallarına **bağlıdır**:

| Kural | Uygulanır mı? | Açıklama |
|-------|:-------------:|----------|
| **Kota kontrolü** | ✅ | Favori HV'nin kotası dolmuşsa talep gönderilemez |
| **Paket kontrolü** | ✅ | Paket kuralları geçerli kalır |
| **Favori önceliği** | ✅ | Diğer HV'lerden önce talep alır |
| **Zorunlu kabul** | ❌ | Favori HV teklifi reddetme hakkına sahiptir |

> [!IMPORTANT]
> Favori HV'ye öncelik tanınsa da kota ve paket kuralları esnetilmez. Favori HV'nin kotası dolmuşsa veya paket kurallarına uymuyorsa talep normal dağıtıma yönlendirilir.

## Favori Listesi Yönetimi

| İşlem | Açıklama |
|-------|----------|
| **Ekleme** | Tamamlanmış iş sonrası HV profilinden |
| **Çıkarma** | HA istediği zaman favori listesinden kaldırabilir |
| **Limit** | Favori listesi sınırı platform tarafından belirlenir |
| **Görüntüleme** | HA profili → "Favori Ustalarım" sekmesi |

## İlişkili Sayfalar

- [[Hizmet-Alan]] — Hizmet Alan rolü ve özellikleri
- [[Hizmet-Veren]] — Hizmet Veren rolü ve özellikleri
