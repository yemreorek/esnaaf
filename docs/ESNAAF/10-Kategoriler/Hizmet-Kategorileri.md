---
title: Hizmet Kategorileri
type: kavram
prd-refs: ["§3.3"]
related: ["[[Kategori-Bazlı-Soru-Akışı]]", "[[M2-AI-Chat-Talep]]", "[[MVP-Faz-1]]"]
status: complete
updated: 2026-05-24
---

> Esnaaf platformunda sunulan 20 hizmet kategorisi ve MVP fazlarına göre dağılımı.

## PRD Bölümleri

- [§3.3 Hizmet Kategorileri](../../esnaaf-claude.md)

## Kategoriler Tablosu

### Faz 1 — MVP Lansmanı (6 Kategori)

İlk fazda İstanbul'da başlayacak, en yüksek talep yoğunluğuna sahip 6 kategori:

| # | Kategori | Talep Yoğunluğu | MVP Fazı |
|---|---|---|---|
| 1 | Ev Temizliği | ⭐⭐⭐⭐⭐ | Faz 1 |
| 2 | Boya Badana | ⭐⭐⭐⭐⭐ | Faz 1 |
| 3 | Nakliyat | ⭐⭐⭐⭐⭐ | Faz 1 |
| 4 | Su Tesisatı | ⭐⭐⭐⭐ | Faz 1 |
| 5 | Elektrik Tesisatı | ⭐⭐⭐⭐ | Faz 1 |
| 6 | Ev Tadilat | ⭐⭐⭐⭐ | Faz 1 |

### Faz 2 — Kategori Genişlemesi (8 Kategori)

Faz 2'de eklenen kategoriler:

| # | Kategori | MVP Fazı |
|---|---|---|
| 7 | Halı & Koltuk Yıkama | Faz 2 |
| 8 | İnşaat/Tadilat Sonrası Temizlik | Faz 2 |
| 9 | Fayans & Parke Döşeme | Faz 2 |
| 10 | Haşere & Böcek İlaçlama | Faz 2 |
| 11 | Kombi & Klima Bakımı | Faz 2 |
| 12 | Mantolama & Dış Cephe | Faz 2 |
| 13 | Marangoz & Mobilya Montajı | Faz 2 |
| 14 | Özel Ders | Faz 2 |

### Faz 3 — Tam Genişleme (6 Kategori)

Faz 3'te eklenen kategoriler:

| # | Kategori | MVP Fazı |
|---|---|---|
| 15 | Cam Balkon & PVC Pencere | Faz 3 |
| 16 | Ofis & İş Yeri Temizliği | Faz 3 |
| 17 | Doğalgaz Tesisatı | Faz 3 |
| 18 | İç Mimar & Dekorasyon | Faz 3 |
| 19 | Fotoğrafçı | Faz 3 |
| 20 | Organizasyon & Etkinlik | Faz 3 |

## Kategori Seçim Kriterleri

- **Talep yoğunluğu:** Google Trends ve rakip platform verileri baz alınır
- **Hizmet veren arzı:** İlk fazda yeterli HV bulunabilirliği önceliklidir
- **Standartlaştırılabilirlik:** AI soru akışına uygunluk düzeyi değerlendirilir
- **Tekrar sıklığı:** Yüksek tekrar oranına sahip kategoriler (ör. temizlik) önceliklidir

## AI Kategori Tespiti

Kullanıcı doğal dilde yazdığında AI, mesaj içeriğinden kategoriyi otomatik tespit eder:

```
Kullanıcı: "Kombim su akıtıyor, acil usta lazım"
→ AI Tespit: Su Tesisatı (Aciliyet: Yüksek)

Kullanıcı: "3+1 daire boyatmak istiyorum"
→ AI Tespit: Boya Badana
```

Kategori tespit edilemezse kullanıcıya kategori listesi sunulur (fallback mekanizması).

## İlgili Sayfalar

- [[Kategori-Bazlı-Soru-Akışı]] — Her kategori için AI soru şablonları
- [[M2-AI-Chat-Talep]] — AI Chat & Talep modülü
- [[MVP-Faz-1]] — İlk fazda aktif 6 kategori detayları
- [[MVP-Faz-2]] — Faz 2 kategori genişlemesi
- [[MVP-Faz-3]] — Faz 3 tam genişleme
- [[Hizmet-Veren]] — Hizmet veren profili ve kategori seçimi
