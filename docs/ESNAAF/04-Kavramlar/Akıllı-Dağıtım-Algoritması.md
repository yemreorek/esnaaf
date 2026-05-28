---
title: Akıllı Dağıtım Algoritması
type: kavram
prd-refs: ["§11"]
related: ["[[Paketler]]", "[[M3-Eşleştirme-Teklif]]", "[[HV-Sağlık-Skoru]]"]
status: complete
updated: 2026-05-24
---

> Hizmet taleplerini en uygun HV'lere yönlendiren, 5 ağırlıklı faktöre dayalı akıllı dağıtım algoritması.

## PRD Referansları

- [§11 – Akıllı Dağıtım Algoritması](../../esnaaf-claude.md)

## Ağırlıklı Faktörler

Algoritma, her HV için bir **dağıtım skoru** hesaplar. Bu skor 5 faktörün ağırlıklı toplamıdır:

| # | Faktör | Ağırlık | Açıklama |
|---|--------|---------|----------|
| 1 | **Paket** | %35 | VIP > Premium > Standart > Basic |
| 2 | **Puan** | %25 | Ortalama kullanıcı puanı (1-5 arası) |
| 3 | **Yanıt Hızı** | %20 | Teklif verme süresinin ortalaması |
| 4 | **Konum** | %15 | Talep konumuna yakınlık |
| 5 | **Kıdem** | %5 | Platformdaki süre |

```
Dağıtım Skoru = (Paket × 0.35) + (Puan × 0.25) + (Yanıt Hızı × 0.20) 
              + (Konum × 0.15) + (Kıdem × 0.05)
```

## Dağıtım Kuralları

### Maksimum HV Sayısı

Her hizmet talebi, en fazla **5-7 HV**'ye dağıtılır. Bu sayı:
- Rekabeti yeterli düzeyde tutar
- HA'nın seçim yapmasını kolaylaştırır
- HV'lerin gereksiz yere kota harcamasını önler

### Tekrar Gösterim Yasağı

> [!IMPORTANT]
> Aynı iş, aynı HV'ye **asla iki kez gösterilmez**. Bir kez reddedilen veya süre dolmuş talepler, o HV'ye tekrar yönlendirilmez.

### Düşük Puanlı HV Kısıtlaması

Puan ortalaması düşük olan HV'ler algoritmadan **sıfır iş** alabilir. Algoritma, kalitesiz hizmet veren HV'leri doğal olarak dışlar.

| Puan Aralığı | Etki |
|--------------|------|
| 4.5 – 5.0 | Yüksek öncelik |
| 3.5 – 4.4 | Normal dağıtım |
| 2.5 – 3.4 | Azaltılmış dağıtım |
| < 2.5 | Neredeyse sıfır iş |

## Yeni HV Bonusu

> [!TIP]
> Yeni kayıt olan HV'ler, ilk **30 gün** boyunca bir bonus alır. Bu bonus:
> - Yeni HV'nin henüz puan/değerlendirme geçmişi olmaması dezavantajını telafi eder
> - Platforma yeni katılan ustaların ilk işlerini almalarını kolaylaştırır
> - 30 gün sonra bonus kalkar, normal algoritma kuralları geçerli olur

## İlişkili Sayfalar

- [[Paketler]] — Paket seviyelerinin algoritma ağırlığı
- [[M3-Eşleştirme-Teklif]] — Eşleştirme ve teklif modülü
- [[HV-Sağlık-Skoru]] — Puan ve sağlık skoru hesaplaması
