---
title: Hizmet Veren (HV)
type: rol
prd-refs: ["§1.2", "§2.2", "§5", "§6"]
related: ["[[Hizmet-Alan]]", "[[Paketler]]", "[[M3-Eşleştirme-Teklif]]", "[[M4-Ödeme-Kampanya]]"]
status: complete
updated: 2026-05-24
---

> Esnaaf platformunda hizmet sunan kullanıcı. "Esnaaf Partner" uygulaması üzerinden iş alır, teklif verir, müşterilerle iletişim kurar.

## PRD Bölümleri

- [§1.2 Kullanıcı Tipleri](../../esnaaf-claude.md)
- [§2.2 Hizmet Veren — Esnaaf Partner Uygulaması](../../esnaaf-claude.md)
- [§5 Hizmet Veren Paneli](../../esnaaf-claude.md)
- [§6 Paket Sistemi](../../esnaaf-claude.md)

## Uygulama Bilgisi

| Alan | Değer |
|---|---|
| Uygulama Adı | **Esnaaf Partner** |
| App Store Kategorisi | İş / Araçlar |
| ASO Anahtar Kelimeler | "iş bul", "müşteri kazan", "ek gelir", "usta uygulaması" |
| Kayıt Yöntemi | Kayıt + kategori seçimi + admin onayı (kimlik & belge kontrolü) |
| KVKK | Kayıt sonrasında zorunlu onay (§12) |
| Fark | Günlük CRM aracı — iş takibi, kazanç analizi, müşteri mesajlaşma, rota planlama |

## Profil Sayfası (HA Tarafından Görülen)

| Alan | Zorunlu | Açıklama |
|---|---|---|
| Profil fotoğrafı | Opsiyonel | Yüz fotoğrafı veya logo |
| Ad Soyad / İşletme Adı | Zorunlu | Admin onayında doğrulanır |
| Hizmet kategorileri | Zorunlu | Çalıştığı tüm kategoriler |
| Hizmet verdiği ilçeler | Zorunlu | Seçilebilir ilçe listesi |
| Kısa biyografi | Opsiyonel | Maks. 300 karakter |
| Portföy fotoğrafları | Opsiyonel | Maks. 6 fotoğraf |
| Ortalama puan | Otomatik | Onaylı yorumlardan hesaplanır |
| Toplam tamamlanan iş | Otomatik | Platform verisi |
| Üyelik süresi | Otomatik | "X yıldır platformda" rozeti |
| VIP rozeti | Otomatik | Yalnızca VIP pakette görünür |
| Yanıt süresi | Otomatik | Son 30 gün ortalaması |

## Teklif Güncelleme Kuralları

- Kabul edilmemiş teklifi güncelleyebilir (fiyat + mesaj)
- Güncelleme yapılınca HA'ya bildirim gider
- **Kabul edilmiş** teklif güncellenemez
- Güncelleme sayısı maks. **3** (spam önleme)

## Tekrar Çalışma (Favori HV)

- HA tamamlanan işten HV'yi "Favorilerime Ekle" ile kaydedebilir
- Yeni talep oluştururken "Favori HV'lerime gönder" seçeneği sunulur
- Favori HV'ye teklif verme önceliği verilir (kota ve paket şartı geçerli)

## Panel Ekranları

| Ekran | Açıklama |
|---|---|
| Gelen İşler | Sisteme düşen yeni talepler |
| Teklif Verilenler | Teklif verilmiş, sonuç beklenen işler |
| Kazanılan İşler | HA'nın kabul ettiği işler — iletişim bilgisi görünür |
| Tamamlanan İşler | Bitirilen işler |
| İptal Edilenler | İptal edilen işler |
| Yorumlar & Puanlar | Gelen değerlendirmeler |
| Paket Bilgisi | Aktif paket ve yenileme tarihi |
| Ödeme Geçmişi | iyzico üzerinden geçmiş ödemeler |
| Kazanç Analizi | Aylık/haftalık gelir, tamamlanan iş grafiği |
| Rota Planlama | Günün kabul edilen işleri haritada |

## Performans Metrikleri

| Metrik | Etki |
|---|---|
| Aktiflik süresi | Sıralama puanını artırır |
| Cevap verme hızı | İş dağıtım önceliğini artırır |
| Kabul oranı | Görünürlüğü etkiler |
| Ortalama puan | VIP erişim şartı (min 4.5) |

## İlgili Kavramlar

- [[Paketler]]
- [[Aylık-Kota-Sistemi]]
- [[Telefon-Maskeleme]]
- [[Favori-HV]]
- [[Akıllı-Dağıtım-Algoritması]]

## İlgili Bildirimler

- HV-01 … HV-10 kodları → [[HV-Bildirimleri]]
