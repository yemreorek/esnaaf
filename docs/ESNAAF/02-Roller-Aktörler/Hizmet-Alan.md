---
title: Hizmet Alan (HA)
type: rol
prd-refs: ["§1.2", "§2.1", "§3.1"]
related: ["[[Hizmet-Veren]]", "[[AI-Chat-Akışı]]", "[[Anonim-Chat-Akışı]]", "[[OTP-Kayıt-Akışı]]"]
status: complete
updated: 2026-05-24
---

> Esnaaf platformunda hizmet talep eden kullanıcı. "Esnaaf" uygulaması üzerinden AI chat ile talep oluşturur.

## PRD Bölümleri

- [§1.2 Kullanıcı Tipleri](../../esnaaf-claude.md)
- [§2.1 Hizmet Alan — Esnaaf Uygulaması](../../esnaaf-claude.md)
- [§3 AI Chat Akışı](../../esnaaf-claude.md)

## Uygulama Bilgisi

| Alan | Değer |
|---|---|
| Uygulama Adı | **Esnaaf** |
| App Store Kategorisi | Yaşam / Ev Hizmetleri |
| ASO Anahtar Kelimeler | "ev temizliği bul", "usta bul", "boya ustası", "nakliyat" |
| Kayıt Yöntemi | Telefon numarası + OTP (SMS) |
| KVKK | Kayıt/giriş sonrasında zorunlu onay (§12) |

## Temel Yetenekler

- Kayıt olmadan AI chat başlatabilir ([[Anonim-Chat-Akışı]])
- Chat ile talep oluşturma (doğal dilde)
- Gelen teklifleri canlı takip (WebSocket)
- Maksimum **2 hizmet vereni** kabul edebilir
- Kabul sonrası telefon numaraları açılır ([[Telefon-Maskeleme]])
- Favori HV kaydı ve tekrar çalışma

## Panel Ekranları

| Ekran | Açıklama |
|---|---|
| Aktif Talepler | Devam eden, teklif beklenen talepler |
| Gelen Teklifler | Hizmet verenlerden gelen teklifler (maskelenmiş numara) |
| Kabul Edilenler | Onaylanan 2 hizmet veren — numara görünür |
| Geçmiş Talepler | Tamamlanan işler |
| İptal Edilenler | İptal edilen talepler |

## İlgili Akışlar

- [[AI-Chat-Akışı]]
- [[Anonim-Chat-Akışı]]
- [[OTP-Kayıt-Akışı]]
- [[Talep-Yaşam-Döngüsü]]
- [[Teklif-Kabul-Akışı]]
- [[İş-Bitiş-Teyit-Akışı]]
- [[Puan-Verme-Akışı]]

## İlgili Kavramlar

- [[Anonim-Session]]
- [[Telefon-Maskeleme]]
- [[Favori-HV]]

## İlgili Bildirimler

- HA-01 … HA-10 kodları → [[HA-Bildirimleri]]
