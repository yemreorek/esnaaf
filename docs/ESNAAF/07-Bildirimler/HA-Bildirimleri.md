---
title: HA Bildirimleri
type: bildirim
prd-refs: ["§14"]
related: ["[[Hizmet-Alan]]", "[[M2-AI-Chat-Talep]]", "[[M5-Puan-Şikayet-NPS]]"]
status: complete
updated: 2026-05-24
---

> Hizmet Alan (müşteri) kullanıcılarına gönderilen tüm bildirim kodlarının tanımı, kanalları ve mesaj şablonları.

## PRD Referansları

- [§14 — Bildirim Matrisi](../../esnaaf-claude.md) — Bildirim kodları ve kanal tanımları

## Bildirim Tablosu

| Kod | Olay | Kanal | Zamanlama | Mesaj Şablonu |
|------|------|-------|-----------|---------------|
| **HA-01** | Talep oluşturuldu | In-App + Push | Anında | `"Talebiniz başarıyla oluşturuldu. Teklifler gelmeye başladığında sizi bilgilendireceğiz."` |
| **HA-02** | İlk teklif geldi | In-App + Push | Anında | `"İlk teklifiniz geldi! Hemen inceleyin."` |
| **HA-03** | Yeni teklifler (2+) | In-App + Push | Her 3 teklifte bir | `"3 yeni teklif daha geldi. Toplam {count} teklifiniz var."` |
| **HA-04** | Teklif kabul edildi | In-App + Push | Anında | `"Teklifi kabul ettiniz. {hv_name} ile iletişime geçebilirsiniz."` |
| **HA-05** | 3. kabul tamamlandı | In-App + Push | Anında | `"Maksimum 3 teklif kabul hakkınızı kullandınız. Talep artık yeni teklif almayacak."` |
| **HA-05b** | HV'den yeni mesaj | In-App + Push | Anında | `"{hv_name} size yeni bir mesaj gönderdi."` |
| **HA-06** | 24 saatte teklif yok | In-App + Push | 24 saat sonra | `"Talebinize henüz teklif gelmedi. Talep detaylarınızı güncellemek ister misiniz?"` |
| **HA-07** | Talep 48 saat sonra kapanacak | In-App + Push | Kapanıştan 48 saat önce | `"Talebiniz 48 saat içinde kapanacak. Gelen teklifleri değerlendirin."` |
| **HA-08** | İş tamamlandı — NPS anketi | In-App + Push | İş bitiminden 30 dk sonra | `"Hizmet deneyiminizi 0-10 arasında puanlayın."` |
| **HA-09** | NPS takip (skor ≤ 6) | In-App + Push | HA-08'den 10 dk sonra | `"Deneyiminizi iyileştirmemize yardımcı olun. Neyi daha iyi yapabilirdik?"` |
| **HA-10** | Değerlendirme daveti | In-App + Push + Email | İş bitiminden 2 saat sonra | `"{hv_name} için değerlendirme yazın ve diğer kullanıcılara yardımcı olun."` |
| **HA-11** | Şikâyet durumu güncellendi | In-App + Email | Anında | `"Şikâyetinizin durumu güncellendi: {status}. Detaylar için tıklayın."` |
| **HA-12** | KVKK / Hesap silme | Email | Anında | `"Hesap silme talebiniz alınmıştır. 30 gün içinde tüm verileriniz kalıcı olarak silinecektir."` |

## Kanal Açıklamaları

| Kanal | Açıklama |
|-------|----------|
| **In-App** | Uygulama içi bildirim merkezi (okundu/okunmadı durumu ile) |
| **Push** | Firebase Cloud Messaging (FCM) üzerinden cihaz push bildirimi |
| **Email** | Transactional e-posta (SendGrid / SES) |

## Zamanlama Kuralları

- **HA-03**: Toplu bildirim — her 3 yeni teklifte bir bildirim gönderilir (spam önleme)
- **HA-06**: 24 saat sonra otomatik tetiklenir (BullMQ delayed job)
- **HA-07**: Talep bitiş tarihinden 48 saat önce tetiklenir
- **HA-08**: İş tamamlandı olarak işaretlendikten 30 dakika sonra
- **HA-09**: Yalnızca NPS skoru ≤ 6 ise, HA-08'den 10 dakika sonra tetiklenir
- **HA-10**: İş tamamlandıktan 2 saat sonra (henüz değerlendirme yapılmamışsa)

## Teknik Notlar

- Tüm zamanlanmış bildirimler **BullMQ delayed jobs** ile yönetilir
- Push bildirimleri **Firebase Cloud Messaging (FCM)** üzerinden gönderilir
- Kullanıcı bildirim tercihlerini kapatabilir (Push kapatılabilir, In-App her zaman aktif)
- HA-12 yalnızca e-posta ile gönderilir (hesap silme sonrası uygulama erişimi kalmaz)

## İlgili Sayfalar

- [[Hizmet-Alan]] — Hizmet alan kullanıcı rolü
- [[M2-AI-Chat-Talep]] — Talep oluşturma modülü
- [[M5-Puan-Şikayet-NPS]] — Puan, şikâyet ve NPS modülü
- [[HV-Bildirimleri]] — Hizmet veren bildirimleri
- [[AD-Bildirimleri]] — Admin bildirimleri
