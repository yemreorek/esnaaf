---
title: HV Bildirimleri
type: bildirim
prd-refs: ["§14"]
related: ["[[Hizmet-Veren]]", "[[M4-Ödeme-Kampanya]]", "[[M5-Puan-Şikayet-NPS]]"]
status: complete
updated: 2026-05-24
---

> Hizmet Veren (usta/iş sahibi) kullanıcılarına gönderilen tüm bildirim kodlarının tanımı, kanalları ve mesaj şablonları.

## PRD Referansları

- [§14 — Bildirim Matrisi](../../esnaaf-claude.md) — Bildirim kodları ve kanal tanımları

## Bildirim Tablosu

| Kod | Olay | Kanal | Zamanlama |
|------|------|-------|-----------|
| **HV-01** | Yeni iş ilanı (eşleşen talep) | In-App + Push | Anında |
| **HV-02** | Teklif kabul edildi | In-App + Push | Anında |
| **HV-02b** | HA'dan yeni mesaj | In-App + Push | Anında |
| **HV-03** | Teklif reddedildi | In-App | Anında |
| **HV-04** | Kota %80 doldu | In-App + Push | Anında |
| **HV-05** | Kota tamamen doldu | In-App + Push | Anında |
| **HV-06** | Kota sıfırlandı | In-App | Aylık dönem başı |
| **HV-07** | Abonelik yenilendi | Email | Yenileme anında |
| **HV-08** | Ödeme başarısız | In-App + Push + Email | Anında |
| **HV-09** | 2. ödeme başarısız | In-App + Push + Email | İlk denemeden 3 gün sonra |
| **HV-10** | Abonelik askıya alındı | In-App + Push + Email | Anında |
| **HV-11** | Yeni değerlendirme alındı | In-App + Email | Anında |
| **HV-12** | Değerlendirme onaylandı/reddedildi | Email + In-App | Moderasyon sonrası |
| **HV-13** | Şikâyet açıldı | Email + In-App | Anında |
| **HV-14** | Admin onayı tamamlandı | In-App + Push + Email | Anında |
| **HV-15** | Admin onayı reddedildi | Email | Anında |
| **HV-16** | Puan uyarısı | Email | Anında |
| **HV-17** | Kampanya kodu uygulandı | Email | Anında |
| **HV-18** | Ücretsiz deneme bitiyor | In-App + Push + Email | Bitiş tarihinden önce |
| **HV-19** | Admin deneme süresi verdi | In-App + Push | Anında |
| **HV-20** | Admin deneme süresi iptal etti | In-App + Push | Anında |
| **HV-21** | Admin deneme süresi 3 gün kaldı | In-App + Push | Bitiş tarihinden 3 gün önce |

## Kategori Bazlı Gruplandırma

### İş & Teklif Bildirimleri
| Kod | Açıklama |
|------|----------|
| HV-01 | Yeni eşleşen iş talebi geldiğinde, HV'nin hizmet verdiği kategori ve ilçe filtrelerine göre gönderilir |
| HV-02 | HA, HV'nin teklifini kabul ettiğinde — telefon ifşa edilir, mesajlaşma açılır |
| HV-02b | Kabul sonrası HA'dan gelen mesajlarda gerçek zamanlı bildirim |
| HV-03 | HA, HV'nin teklifini reddettiğinde — yalnızca In-App (Push gereksiz) |

### Kota Bildirimleri
| Kod | Açıklama |
|------|----------|
| HV-04 | Aylık teklif kotasının %80'ine ulaşıldığında uyarı |
| HV-05 | Kota tamamen dolduğunda — yeni teklif gönderemez |
| HV-06 | Yeni ay başında kota sıfırlandığında bilgilendirme |

### Abonelik & Ödeme Bildirimleri
| Kod | Açıklama |
|------|----------|
| HV-07 | Aylık abonelik otomatik yenilendiğinde onay e-postası |
| HV-08 | İlk ödeme denemesi başarısız — kart güncelleme çağrısı |
| HV-09 | 2. deneme de başarısız — acil kart güncelleme uyarısı |
| HV-10 | 3. deneme sonrası abonelik askıya alınır — tüm işlevler dondurulur |

### Değerlendirme & Şikâyet Bildirimleri
| Kod | Açıklama |
|------|----------|
| HV-11 | HA tarafından yeni bir değerlendirme yazıldığında |
| HV-12 | Moderasyon sonrası değerlendirme onay/ret durumu |
| HV-13 | HA tarafından şikâyet açıldığında |
| HV-16 | Ortalama puan eşik değerin altına düştüğünde uyarı |

### Admin & Onay Bildirimleri
| Kod | Açıklama |
|------|----------|
| HV-14 | Admin tarafından HV profil/belge onayı tamamlandığında |
| HV-15 | Admin tarafından onay reddedildiğinde — ret gerekçesi ile birlikte |

### Kampanya & Deneme Bildirimleri
| Kod | Açıklama |
|------|----------|
| HV-17 | Kampanya kodu başarıyla uygulandığında — indirim detayları ile |
| HV-18 | Ücretsiz deneme süresi dolmak üzere — ödeme yöntemine yönlendirme |
| HV-19 | Admin panelinden manuel deneme süresi verildiğinde |
| HV-20 | Admin panelinden deneme süresi iptal edildiğinde |
| HV-21 | Admin tarafından verilen deneme süresinin bitmesine 3 gün kala hatırlatma |

## Kanal Açıklamaları

| Kanal | Açıklama |
|-------|----------|
| **In-App** | Uygulama içi bildirim merkezi (okundu/okunmadı durumu ile) |
| **Push** | Firebase Cloud Messaging (FCM) üzerinden cihaz push bildirimi |
| **Email** | Transactional e-posta (SendGrid / SES) |

## Teknik Notlar

- **HV-01** eşleştirme mantığı: HV'nin aktif aboneliği + hizmet kategorisi + ilçe filtresi ile talep eşleştirilir
- **HV-03** yalnızca In-App — ret bildirimi Push ile gönderilmez (kullanıcı deneyimi kararı)
- **HV-08 → HV-09 → HV-10** zinciri: 3 günlük aralıklarla retry, 3. başarısız denemede askıya alma
- **HV-21** yalnızca admin tarafından verilen deneme süreleri için geçerlidir
- Tüm zamanlanmış bildirimler **BullMQ delayed jobs** ile yönetilir

## İlgili Sayfalar

- [[Hizmet-Veren]] — Hizmet veren kullanıcı rolü
- [[M4-Ödeme-Kampanya]] — Ödeme ve kampanya modülü
- [[M5-Puan-Şikayet-NPS]] — Puan, şikâyet ve NPS modülü
- [[HA-Bildirimleri]] — Hizmet alan bildirimleri
- [[AD-Bildirimleri]] — Admin bildirimleri
