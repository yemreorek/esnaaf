---
title: M1 — Auth & Kullanıcı
type: modül
prd-refs: ["§2", "§12", "§16", "§17.1"]
related: ["[[M2-AI-Chat-Talep]]", "[[M3-Eşleştirme-Teklif]]", "[[M7-Altyapı]]", "[[Hizmet-Alan]]", "[[Hizmet-Veren]]"]
status: complete
updated: 2026-05-24
---

> Kullanıcı kayıt, giriş, profil yönetimi ve KVKK onay süreçlerinden sorumlu modül.

## PRD Bölümleri

- [§2 Üyelik Sistemi](../../esnaaf-claude.md)
- [§12 KVKK & Hukuki Uyumluluk](../../esnaaf-claude.md)
- [§16 Teknoloji Stack](../../esnaaf-claude.md)
- [§17.1 Hata Senaryoları](../../esnaaf-claude.md)

## Sorumluluk Alanı

- OTP ile hızlı kayıt (SMS — Netgsm)
- Anonim session yönetimi (Redis, TTL: 2 saat)
- Anonim session → kayıtlı kullanıcı geçişi
- JWT token üretimi ve doğrulaması
- Profil CRUD işlemleri (HA + HV)
- HV belge yükleme ve admin onay süreci
- KVKK & Açık Rıza Metni onay kaydı
- Şifre sıfırlama / telefon değişikliği
- Hesap silme (KVKK md. 7 — veri anonimleştirme)

## Bağımlılıklar

```
M1 → M2 (chat session'ı user'a bağlama)
M1 → M3 (teklif veren HV profil bilgisi)
M1 → M7 (JWT, rate limit, hata yönetimi)
```

## DB Tabloları

- [[users]] — tüm kullanıcılar (HA + HV ortak)
- [[service_providers]] — HV'ye özel profil bilgileri
- [[kvkk_consents]] — KVKK onay kayıtları
- [[otp_codes]] — OTP doğrulama kodları
- [[sessions]] — aktif oturumlar

## Endpoint'ler

- [[Auth-Endpoints]] — `/api/auth/*`

## İlgili Akışlar

- [[OTP-Kayıt-Akışı]]
- [[KVKK-Onay-Akışı]]
- [[Anonim-Chat-Akışı]] (session yönetimi)
- [[HV-Onay-Akışı]]

## İlgili Kavramlar

- [[Anonim-Session]]
- [[Telefon-Maskeleme]]
- [[JWT-Token]]

## Hata Senaryoları (§17.1)

| Senaryo | Davranış |
|---|---|
| OTP süresi doldu | "Kodun süresi doldu. Yeni kod gönderildi." |
| Yanlış OTP (3 kez) | Hesap 15 dk kilitli |
| Token süresi doldu | 401 → refresh token ile yenile |
| Geçersiz telefon formatı | 400 → "Geçerli bir telefon numarası girin" |
