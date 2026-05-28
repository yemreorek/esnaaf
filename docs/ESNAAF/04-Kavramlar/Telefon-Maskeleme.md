---
title: Telefon Maskeleme
type: kavram
prd-refs: ["§8"]
related: ["[[Teklif-Kabul-Akışı]]", "[[M3-Eşleştirme-Teklif]]"]
status: complete
updated: 2026-05-24
---

> Kullanıcı telefon numaralarının varsayılan olarak maskelenmesi ve yalnızca teklif kabul edildiğinde karşılıklı açılması mekanizması.

## PRD Referansları

- [§8 – Telefon Maskeleme ve Gizlilik](../../esnaaf-claude.md)

## Varsayılan Maskeleme

Tüm telefon numaraları sistemde **varsayılan olarak maskelidir**.

| Özellik | Değer |
|---------|-------|
| **Şifreleme** | AES-256 |
| **Görüntü formatı** | `0532 *** ** 78` |
| **Maskeleme alanı** | Orta haneler gizlenir, ilk 4 ve son 2 hane görünür |

> [!NOTE]
> Maskeleme hem HA hem de HV tarafında uygulanır. Hiçbir taraf diğerinin tam numarasını teklif kabul edilmeden göremez.

## Telefon Açılma Koşulu

Telefon numaraları yalnızca aşağıdaki koşulda açılır:

> **HA, bir HV'nin teklifini kabul ettiğinde** → her iki tarafın telefon numarası karşılıklı olarak açılır.

### Açılma Akışı

```
1. HA teklifi kabul eder
2. Sistem her iki tarafın numarasını decrypt eder
3. HA → HV numarasını görür
4. HV → HA numarasını görür
5. Açılma olayı loglanır
```

## KVKK Uyumluluk Logu

Tüm telefon açılma olayları `phone_reveal_logs` tablosuna kaydedilir.

| Alan | Açıklama |
|------|----------|
| `reveal_id` | Benzersiz log kimliği |
| `ha_user_id` | Hizmet Alan kullanıcı ID |
| `hv_user_id` | Hizmet Veren kullanıcı ID |
| `offer_id` | İlgili teklif ID |
| `revealed_at` | Açılma zaman damgası |
| `ip_address` | İşlemi tetikleyen IP |

> [!IMPORTANT]
> KVKK (Kişisel Verilerin Korunması Kanunu) gereği her telefon açılma işlemi kayıt altına alınmalıdır. Bu loglar denetim ve kullanıcı talepleri için saklanır.

## İlişkili Sayfalar

- [[Teklif-Kabul-Akışı]] — Teklif kabul sürecinde telefon açılması
- [[M3-Eşleştirme-Teklif]] — Eşleştirme ve teklif modülü
