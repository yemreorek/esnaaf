---
title: Kategori Bazlı Soru Akışı
type: akış
prd-refs: ["§3.4"]
related: ["[[Hizmet-Kategorileri]]", "[[AI-Chat-Akışı]]", "[[M2-AI-Chat-Talep]]"]
status: complete
updated: 2026-05-24
---

> AI chat motoru, tespit ettiği kategoriye göre zorunlu ve opsiyonel soruları doğal dilde sorar ve talep formunu oluşturur.

## PRD Bölümleri

- [§3.4 Kategori Bazlı Soru Akışı](../../esnaaf-claude.md)

## Genel Akış Mantığı

```
Kategori tespit edildi
        ↓
Zorunlu sorular sırayla sorulur (doğal dilde)
        ↓
Tüm zorunlu bilgiler tamamlandı mı?
    Hayır → Eksik soruyu sor
    Evet → Opsiyonel soruları sun (isteğe bağlı)
        ↓
Form özeti oluştur → Kullanıcı onayı iste
        ↓
Onay → Talep oluştur & HV'lere dağıt
```

> **Kural:** AI soruları birer birer, doğal bir sohbet akışı içinde sorar. Tüm soruları tek seferde listelemez.

---

## 1. Ev Temizliği 🏠

### Zorunlu Sorular

| Sıra | Soru | Veri Tipi | Örnek |
|---|---|---|---|
| 1 | Konum (ilçe) | Seçim / Metin | Kadıköy |
| 2 | Tarih & saat | Tarih + Saat | 28 Mayıs, 10:00 |
| 3 | Daire tipi | Seçim | 2+1, 3+1, 4+1, villa |
| 4 | Temizlik sıklığı | Seçim | Tek seferlik / Haftalık / Aylık |

### Opsiyonel Sorular

| Soru | Açıklama |
|---|---|
| Evcil hayvan var mı? | Alerji / özel temizlik ürünü gerekliliği |
| Özel temizlik alanı | Banyo, mutfak, cam silme vb. özelleştirme |
| Temizlik ürünleri | Müşteri mi sağlayacak, temizlikçi mi getirsin? |

---

## 2. Boya Badana 🎨

### Zorunlu Sorular

| Sıra | Soru | Veri Tipi | Örnek |
|---|---|---|---|
| 1 | Konum (ilçe) | Seçim / Metin | Beşiktaş |
| 2 | Metrekare | Sayısal | 120 m² |
| 3 | İç / dış boya | Seçim | İç mekan / Dış cephe / Her ikisi |
| 4 | Renk / boya tipi | Metin / Seçim | Beyaz, saten boya |

### Opsiyonel Sorular

| Soru | Açıklama |
|---|---|
| Mevcut boya durumu | Dökülme, kabuklanma, leke var mı? |
| Alçı / sıva ihtiyacı | Duvar yüzeyi onarımı gerekli mi? |
| Tarih esnekliği | Kesin tarih mi, esnek mi? |

---

## 3. Nakliyat 🚚

### Zorunlu Sorular

| Sıra | Soru | Veri Tipi | Örnek |
|---|---|---|---|
| 1 | Çıkış adresi | Adres | Kadıköy, Caferağa Mah. |
| 2 | Varış adresi | Adres | Ataşehir, İçerenköy Mah. |
| 3 | Tarih | Tarih | 1 Haziran |
| 4 | Daire tipi | Seçim | 2+1, 3+1, stüdyo |
| 5 | Kat & asansör bilgisi | Sayısal + Evet/Hayır | 5. kat, asansörsüz |

### Opsiyonel Sorular

| Soru | Açıklama |
|---|---|
| Özel eşya | Piyano, akvaryum, antika mobilya vb. |
| Paketleme hizmeti | Eşya paketleme gerekli mi? |

---

## 4. Su Tesisatı 🔧

### Zorunlu Sorular

| Sıra | Soru | Veri Tipi | Örnek |
|---|---|---|---|
| 1 | Konum (ilçe) | Seçim / Metin | Şişli |
| 2 | Sorun türü | Seçim / Metin | Sızıntı, tıkanıklık, musluk arızası |
| 3 | Aciliyet | Seçim | Acil (bugün) / Normal (bu hafta) / Esnek |

### Opsiyonel Sorular

| Soru | Açıklama |
|---|---|
| Bina yaşı | Tesisat altyapısını anlamak için |
| Önceki müdahale | Daha önce müdahale yapıldı mı? Ne yapıldı? |

---

## 5. Elektrik Tesisatı ⚡

### Zorunlu Sorular

| Sıra | Soru | Veri Tipi | Örnek |
|---|---|---|---|
| 1 | Konum (ilçe) | Seçim / Metin | Bakırköy |
| 2 | İş türü | Seçim / Metin | Arıza onarım, yeni tesisat, priz/anahtar |
| 3 | Aciliyet | Seçim | Acil / Normal / Esnek |

### Opsiyonel Sorular

| Soru | Açıklama |
|---|---|
| Bina tipi | Konut / ofis / dükkan |
| Sigorta atıyor mu? | Kısa devre / aşırı yük tespiti |

---

## 6. Ev Tadilat 🏗️

### Zorunlu Sorular

| Sıra | Soru | Veri Tipi | Örnek |
|---|---|---|---|
| 1 | Konum (ilçe) | Seçim / Metin | Üsküdar |
| 2 | Tadilat kapsamı | Metin / Seçim | Komple tadilat, banyo yenileme, mutfak |
| 3 | Metrekare | Sayısal | 85 m² |
| 4 | Bütçe aralığı | Seçim | 50.000–100.000₺ / 100.000–200.000₺ / 200.000₺+ |

### Opsiyonel Sorular

| Soru | Açıklama |
|---|---|
| Malzeme temin | Müşteri mi sağlayacak, usta mı alacak? |
| Hedef bitiş tarihi | Tadilat ne zamana kadar bitmeli? |

---

## Form Özeti Örneği

AI tüm soruları tamamladıktan sonra aşağıdaki gibi bir özet sunar:

```
📋 Talep Özeti:

🏷️ Kategori: Ev Temizliği
📍 Konum: Kadıköy
📅 Tarih: 28 Mayıs, 10:00
🏠 Daire: 3+1
🔄 Sıklık: Tek seferlik
🐾 Evcil hayvan: Var (kedi)

Bu bilgiler doğru mu? ✅ Onayla / ✏️ Düzenle
```

## İlgili Sayfalar

- [[Hizmet-Kategorileri]] — 20 kategori listesi ve faz dağılımı
- [[AI-Chat-Akışı]] — AI chat motor akışı
- [[M2-AI-Chat-Talep]] — AI Chat & Talep modülü
- [[Form-Özeti-Akışı]] — Form özeti oluşturma detayları
- [[Anonim-Chat-Akışı]] — Kayıt olmadan chat deneyimi
