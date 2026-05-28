---
title: HV Sağlık Skoru
type: kavram
prd-refs: []
related: ["[[Akıllı-Dağıtım-Algoritması]]", "[[NPS-Skoru]]", "[[M5-Puan-Şikayet-NPS]]"]
status: complete
updated: 2026-05-24
---

> HV'nin genel performansını ölçen, 4 bileşenden oluşan bileşik sağlık skoru.

## Sağlık Skoru Formülü

HV sağlık skoru, aşağıdaki 4 bileşenin ağırlıklı toplamıyla hesaplanır:

```
Sağlık Skoru = (Puan × 0.40) + (NPS × 0.30) + (Şikayet × 0.20) + (Aktiflik × 0.10)
```

| # | Bileşen | Ağırlık | Açıklama |
|---|---------|---------|----------|
| 1 | **Puan** | %40 | HA'ların verdiği ortalama puan (1-5) |
| 2 | **NPS** | %30 | Net Promoter Score ortalaması |
| 3 | **Şikayet** | %20 | Şikayet oranı (düşük = iyi) |
| 4 | **Aktiflik** | %10 | Platformdaki aktiflik düzeyi |

> [!NOTE]
> Şikayet bileşeni ters orantılıdır — şikayet sayısı arttıkça skor düşer. Diğer 3 bileşen doğru orantılıdır.

## Görünürlük Kademeleri

Sağlık skoru, HV'nin platformdaki görünürlüğünü doğrudan etkiler:

| Skor Aralığı | Kademe | Görünürlük | Etki |
|-------------|--------|------------|------|
| **4.5 – 5.0** | 🟢 Yüksek | Tam görünürlük | Maksimum iş dağıtımı, VIP adayı |
| **3.5 – 4.4** | 🟡 Orta | Normal görünürlük | Standart iş dağıtımı |
| **2.5 – 3.4** | 🟠 Düşük | Azaltılmış görünürlük | Daha az iş dağıtılır |
| **< 2.5** | 🔴 Admin Uyarısı | Minimum görünürlük | Admin incelemesi başlatılır |

### Admin Uyarı Süreci (< 2.5)

```
1. Sağlık skoru 2.5'in altına düşer
2. Sistem otomatik olarak admin uyarısı oluşturur
3. Admin, HV profilini ve geçmiş performansını inceler
4. Olası aksiyonlar:
   - İyileştirme planı sunma
   - Geçici askıya alma
   - Hesap kapatma (tekrarlayan durumlarda)
```

> [!WARNING]
> Sağlık skoru 2.5'in altında kalan HV'ler otomatik olarak admin incelemesine alınır. Sürekli düşük skor, hesap askıya alma ile sonuçlanabilir.

## Sağlık Skorunun Kullanım Alanları

| Alan | Kullanım |
|------|----------|
| [[Akıllı-Dağıtım-Algoritması]] | Puan faktörü olarak (%25 ağırlık) |
| VIP Uygunluk | 4.5+ skor gerekli |
| Admin Paneli | Performans raporları ve erken uyarı |
| HV Profili | HV'ye kendi skor detayları gösterilir |

## İlişkili Sayfalar

- [[Akıllı-Dağıtım-Algoritması]] — Sağlık skorunun dağıtım algoritmasına etkisi
- [[NPS-Skoru]] — NPS bileşeninin hesaplanması
- [[M5-Puan-Şikayet-NPS]] — Puan, şikayet ve NPS modülü
