---
title: Hızlı Seçim Chipleri
type: kavram
prd-refs: ["§1.4.1"]
related: ["[[AI-Chat-Akışı]]", "[[00-Genel-Bakış]]"]
status: complete
updated: 2026-05-24
---

> Chat giriş alanının altında yer alan, kullanıcının hızlıca hizmet kategorisi seçmesini sağlayan chip bileşenleri.

## PRD Referansları

- [§1.4.1 – Hızlı Seçim Chipleri](../../esnaaf-claude.md)

## Chip Listesi

Chat input alanının hemen altında aşağıdaki chipler gösterilir:

| Chip | Emoji | Kategori |
|------|-------|----------|
| 🏠 Ev Temizliği | 🏠 | Temizlik |
| 🎨 Boya | 🎨 | Boya/Badana |
| 🔧 Tesisat | 🔧 | Tesisat |
| ⚡ Elektrik | ⚡ | Elektrik |
| ➕ | ➕ | Tüm kategoriler |

```
┌─────────────────────────────────────────────┐
│  Nasıl yardımcı olabilirim?                 │
│                                             │
│  [🏠 Ev Temizliği] [🎨 Boya] [🔧 Tesisat]  │
│  [⚡ Elektrik] [➕]                          │
│                                             │
│  ┌─────────────────────────────────┐        │
│  │ Mesajınızı yazın...            │  ➤     │
│  └─────────────────────────────────┘        │
└─────────────────────────────────────────────┘
```

## Tıklama Davranışı

Bir chip'e tıklandığında:

```
1. Kategori adı textarea'ya yazılır (ör. "Ev Temizliği")
2. Textarea otomatik olarak focus alır
3. Mesaj otomatik olarak gönderilir (auto-submit)
4. AI, seçilen kategori üzerinden sohbete başlar
```

> [!NOTE]
> Chip tıklaması, kullanıcının manuel yazmasına gerek kalmadan kategori seçimini hızlandırır. Tıkla → yaz → gönder akışı otomatiktir.

## [➕] Butonu

`[➕]` butonuna tıklandığında:

| Platform | Davranış |
|----------|----------|
| **Mobil** | Bottom sheet açılır (tam kategori listesi) |
| **Desktop** | Modal pencere açılır (tam kategori listesi) |

Tam kategori listesinden seçim yapıldığında aynı tıklama davranışı uygulanır.

## Mobil Davranış

> [!IMPORTANT]
> Mobil cihazlarda klavye açıldığında chipler **gizlenir**. Bu, ekran alanını korumak ve kullanıcının yazdığı mesajı görebilmesini sağlamak içindir.

| Durum | Chipler |
|-------|---------|
| Klavye kapalı | ✅ Görünür |
| Klavye açık | ❌ Gizli |
| Klavye kapandığında | ✅ Tekrar görünür |

## Tasarım Özellikleri

| Özellik | Değer |
|---------|-------|
| **Arka plan rengi** | `#F7FCD4` |
| **Yazı rengi** | `#232323` |
| **Kenarlık** | `1px solid #D4F54E` |
| **Köşe yuvarlaklığı** | `border-radius: 20px` |
| **Yazı boyutu** | `13px` |

```css
.quick-chip {
  background: #F7FCD4;
  color: #232323;
  border: 1px solid #D4F54E;
  border-radius: 20px;
  font-size: 13px;
  padding: 6px 14px;
  cursor: pointer;
}
```

## İlişkili Sayfalar

- [[AI-Chat-Akışı]] — Chat akışında chip'lerin rolü
- [[00-Genel-Bakış]] — Platform genel bakış
