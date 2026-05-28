---
title: MVP Faz 3
type: mvp
prd-refs: ["§20"]
related: ["[[MVP-Faz-2]]", "[[Stack]]"]
status: complete
updated: 2026-05-24
---

> İki mobil uygulama, kampanya sistemi, çoklu şehir, ölçeklendirme.

## PRD Bölümleri

- [§20 MVP Fazları](../../esnaaf-claude.md)

## Hedef

**Faz 3'ün hedefi:** Mobil uygulamaların yayınlanması, kampanya ve satış motorunun devreye girmesi, çoklu şehir genişlemesi ve altyapının ölçeklendirmeye hazır hale getirilmesi.

## Haftalık Plan

### Hafta 17–18: Esnaaf (HA) Mobil Uygulaması

| Görev | Detay |
|---|---|
| Teknoloji | React Native + Expo |
| Platform | iOS + Android |
| Uygulama | **Esnaaf** — Hizmet alan uygulaması |
| Temel Özellikler | AI chat, talep oluşturma, teklif takibi, mesajlaşma |
| Push Notification | Firebase Cloud Messaging |
| Deep Link | Web'den mobil yönlendirme |

### Hafta 19–20: Esnaaf Partner (HV) Mobil Uygulaması

| Görev | Detay |
|---|---|
| Teknoloji | React Native + Expo |
| Platform | iOS + Android |
| Uygulama | **Esnaaf Partner** — Hizmet veren uygulaması |
| Temel Özellikler | Gelen işler, teklif verme, mesajlaşma, kazanç takibi |
| Konum Hizmetleri | Rota planlama, ilçe bazlı iş filtresi |
| Çevrimdışı Destek | Temel verilerin offline erişilebilirliği |

### Hafta 21–22: Kampanya & Satış

| Görev | Detay |
|---|---|
| Kampanya Motoru | 4 kampanya tipi desteği: |
| | 1. İndirimli paket |
| | 2. Ek kota hediyesi |
| | 3. Ücretsiz deneme süresi uzatma |
| | 4. Referans bonusu |
| Ücretsiz Deneme | Yeni HV'ler için free trial süresi |
| Satış CRM | Potansiyel HV takibi, satış hunisi |
| Analytics | Kullanıcı davranış analizi, conversion metrikleri |

### Hafta 23–24: Çoklu Şehir Genişlemesi

| Görev | Detay |
|---|---|
| Yeni Şehirler | **Ankara** ve **İzmir** lansmanı |
| Kategori Genişleme | 14 kategoriye çıkış |
| Referans Sistemi | HA → HA ve HV → HV referans mekanizması |
| Şehir Bazlı Config | İlçe listeleri, bölge bazlı ayarlar |

### Hafta 25–26: Optimizasyon & Ölçeklendirme

| Görev | Detay |
|---|---|
| NPS Paneli | Tam kapsamlı NPS yönetim paneli |
| Executive Dashboard | Üst yönetim için özet metrikleri |
| A/B Testing | Chat akışı ve teklif sunumu optimizasyonu |
| Redis Optimizasyonu | Cache stratejisi iyileştirme, TTL optimizasyonu |
| Altyapı Geçişi | **Railway → AWS ECS** (ölçeklendirme) |
| CDN | Statik dosyalar için CloudFront |

## Faz 3 Çıktıları

| Çıktı | Açıklama |
|---|---|
| 📱 Esnaaf App | HA mobil uygulaması (iOS + Android) |
| 📱 Esnaaf Partner App | HV mobil uygulaması (iOS + Android) |
| 🎯 Kampanya Motoru | 4 tip kampanya desteği |
| 🏙️ 3 Şehir | İstanbul + Ankara + İzmir |
| 📊 14 Kategori | Toplam 14 aktif kategori |
| 🔗 Referans Sistemi | Kullanıcıdan kullanıcıya büyüme |
| ☁️ AWS ECS | Ölçeklenebilir altyapı |

## Teknoloji Yığını (Faz 3 Sonrası)

```
Frontend Web:    Next.js
Mobil HA:        React Native + Expo (Esnaaf)
Mobil HV:        React Native + Expo (Esnaaf Partner)
Backend:         NestJS
DB:              PostgreSQL (AWS RDS)
Cache:           Redis (AWS ElastiCache)
Queue:           BullMQ
AI:              LangChain + GPT-4o
Realtime:        Socket.io
Storage:         AWS S3 + CloudFront
Deploy:          AWS ECS (Fargate)
Push:            Firebase Cloud Messaging
Analytics:       Mixpanel / Amplitude
```

## İlgili Sayfalar

- [[MVP-Faz-2]] — Gelir modeli, kalite sistemi, 6 kategori
- [[Stack]] — Teknoloji yığını detayları
- [[Hizmet-Kategorileri]] — 20 kategori ve faz dağılımı
- [[M4-Ödeme-Kampanya]] — Kampanya sistemi detayları
- [[Hizmet-Alan]] — HA mobil uygulama hedef kitlesi
- [[Hizmet-Veren]] — HV mobil uygulama hedef kitlesi
