---
title: PII İzolasyonu
type: kavram
prd-refs: ["§13.2"]
related: ["[[AI-Chat-Akışı]]", "[[M2-AI-Chat-Talep]]", "[[KVKK-Veri-Saklama]]"]
status: complete
updated: 2026-05-24
---

> Kişisel verilerin (PII) AI modeline asla gönderilmemesini sağlayan izolasyon mekanizması.

## PRD Referansları

- [§13.2 – PII İzolasyonu](../../esnaaf-claude.md)

## Temel Prensip

> [!CAUTION]
> **Ad, telefon numarası, TC kimlik numarası ve adres** bilgileri **HİÇBİR ZAMAN** AI modeline (OpenAI) gönderilmez. Bu kural istisnasızdır.

## Korunan PII Alanları

| PII Türü | Örnek | AI'ya Gider mi? |
|----------|-------|-----------------|
| **Ad Soyad** | Mehmet Yılmaz | ❌ Hayır |
| **Telefon** | 0532 123 45 67 | ❌ Hayır |
| **TC Kimlik No** | 12345678901 | ❌ Hayır |
| **Adres** | Kadıköy, İstanbul... | ❌ Hayır |
| **Hizmet içeriği** | "Mutfak dolabı montajı" | ✅ Evet |
| **Kategori bilgisi** | Tadilat / Mobilya | ✅ Evet |

## İzolasyon Akışı

```
1. Kullanıcı mesajı backend'e gelir
2. Backend, regex ile PII tespit eder:
   - Telefon: /(\+?90|0)\s*[0-9]{3}\s*[0-9]{3}\s*[0-9]{2}\s*[0-9]{2}/
   - TC No:   /[1-9][0-9]{10}/
   - Ad:      Kullanıcı profil verisinden eşleştirme
   - Adres:   Kayıtlı adres verisinden eşleştirme
3. PII alanları placeholder ile değiştirilir: [AD], [TELEFON], [ADRES]
4. Temizlenmiş mesaj OpenAI API'ye gönderilir
5. AI yalnızca hizmet içeriğiyle çalışır
```

## AI Form Doldurma ve PII Yeniden Ekleme

AI chat sonucunda hizmet talep formu oluşturulduğunda:

```
1. AI, hizmet detaylarını çıkarır (kategori, açıklama, tarih vb.)
2. AI, formu PII olmadan doldurur
3. Backend, kullanıcı profilinden PII'yi çeker
4. Backend, PII'yi forma yeniden ekler (re-attach)
5. Tam form veritabanına kaydedilir
```

> [!IMPORTANT]
> AI hiçbir zaman kişisel veri üretmez veya görmez. PII yalnızca backend tarafında, güvenli ortamda form ile birleştirilir.

## Teknik Detaylar

| Bileşen | Açıklama |
|---------|----------|
| **PII Stripping** | Backend middleware — her AI çağrısından önce çalışır |
| **Regex Engine** | Türkiye'ye özel telefon ve TC kimlik formatları |
| **Re-attachment** | AI yanıtı döndükten sonra backend tarafında yapılır |
| **Loglama** | PII içeren loglar ayrı, şifreli log deposuna yazılır |

## İlişkili Sayfalar

- [[AI-Chat-Akışı]] — AI chat sürecinde PII izolasyonunun uygulanması
- [[M2-AI-Chat-Talep]] — AI chat ve talep oluşturma modülü
- [[KVKK-Veri-Saklama]] — KVKK uyumlu veri saklama politikaları
