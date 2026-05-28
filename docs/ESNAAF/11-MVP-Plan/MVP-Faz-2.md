---
title: MVP Faz 2
type: mvp
prd-refs: ["§20"]
related: ["[[MVP-Faz-1]]", "[[MVP-Faz-3]]"]
status: complete
updated: 2026-05-24
---

> Gelir modeli aktif, kalite sistemi çalışıyor, 6 kategoriye genişleme.

## PRD Bölümleri

- [§20 MVP Fazları](../../esnaaf-claude.md)

## Hedef

**Faz 2'nin hedefi:** Ödeme altyapısının aktif olması, hizmet kalitesinin ölçülüp yönetilmesi, platform kategori kapsamının 6'ya genişlemesi ve akıllı dağıtım algoritmasının devreye girmesi.

## Haftalık Plan

### Hafta 9–10: Ödeme Sistemi

| Görev | Detay |
|---|---|
| iyzico Entegrasyonu | Ödeme altyapısı kurulumu |
| 4 Paket | Starter, Growth, Premium, VIP paket tanımları |
| Abonelik Sistemi | Aylık otomatik yenileme |
| Kota Yönetimi | Paket bazlı aylık kota takibi |
| Başarısız Ödeme | Retry mekanizması (3 deneme + askıya alma) |
| Admin Deneme | Admin tarafından trial süresi tanımlama |

### Hafta 11: Akıllı Dağıtım

| Görev | Detay |
|---|---|
| Dağıtım Algoritması | 5 faktörlü akıllı dağıtım: |
| | 1. Konum yakınlığı |
| | 2. Kategori uzmanlığı |
| | 3. Mevcut iş yoğunluğu |
| | 4. Müşteri puanı |
| | 5. Paket seviyesi (VIP öncelik) |

### Hafta 12–13: Değerlendirme & NPS

| Görev | Detay |
|---|---|
| Yorum Sistemi | HA → HV yorum yazma + 1-5 yıldız |
| S3 Upload | Fotoğraflı yorum desteği |
| Admin Yorum Kuyruğu | Yayınlanmadan önce admin onayı |
| NPS Anketi | Net Promoter Score ölçümü |
| Çağrı Görevleri | Kalite ekibinin HA'ları araması |
| Puan Hesaplama | Ortalama puan + güvenilirlik skoru |

### Hafta 14: Şikayet & Roller

| Görev | Detay |
|---|---|
| Şikayet Sistemi | Detaylı şikayet formu + takip numarası |
| 4 Seviyeli Ceza | Uyarı → Kota azaltma → Askıya alma → Kalıcı ban |
| İtiraz Mekanizması | HV'nin cezaya itiraz edebilmesi |
| 10 Personel Rolü | super_admin, team_leader, quality_staff, ops_staff, finance_staff, marketing_staff, sales_staff, hr_staff, executive, rnd_staff |
| İzin Matrisi | 16 modül × 10 rol erişim tanımları |
| Denetim Kaydı | audit_logs tablosu ile tüm admin işlemlerinin loglanması |

### Hafta 15–16: Kategori Genişlemesi & Dashboard

| Görev | Detay |
|---|---|
| 6 Kategori | Ev Temizliği + 5 yeni kategori aktifleştirme |
| AI Şablonları | Her kategori için soru akışı şablonları |
| Admin Dashboard | Tam kapsamlı admin paneli |
| KVKK Yönetimi | Veri silme talepleri, onay yönetimi |
| Tüm Bildirimler | HA ve HV tüm bildirim kodları aktif |
| Sağlık Skoru | HV sağlık skoru hesaplama |

## Faz 2 Hedefleri Özeti

| Hedef | Durum |
|---|---|
| Ödeme sistemi aktif | ✅ |
| 6 kategori | ✅ |
| NPS aktif | ✅ |
| Kalite ekibi çalışıyor | ✅ |
| Akıllı dağıtım | ✅ |
| 10 personel rolü | ✅ |

## Geçiş Kriterleri (Faz 2 → Faz 3)

| Kriter | Hedef |
|---|---|
| Tamamlanan iş sayısı | ≥ 300 |
| Aktif HV sayısı | ≥ 100 |
| NPS skoru | ≥ 30 |
| Ödeme sistemi | Aktif & çalışır durumda |

## İlgili Sayfalar

- [[MVP-Faz-1]] — Uçtan uca çalışan temel sistem
- [[MVP-Faz-3]] — Mobil uygulamalar, kampanya, çoklu şehir
- [[Paketler]] — 4 paket detayları
- [[Akıllı-Dağıtım-Algoritması]] — 5 faktörlü dağıtım detayları
- [[M4-Ödeme-Kampanya]] — Ödeme & kampanya modülü
- [[M5-Puan-Şikayet-NPS]] — Puan, şikayet ve NPS modülü
- [[Admin-Roller-İzinler]] — 10 rol ve izin matrisi
