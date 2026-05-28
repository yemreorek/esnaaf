---
name: m1-auth
description: >
  Auth & Kullanıcı modülü agent'ı. Kayıt, OTP doğrulama, KVKK onay akışı,
  kullanıcı rolleri, JWT token yönetimi, hata senaryoları ve HV profil
  sayfası içeriğini kapsar. PRD §2, §12, §16, §17.1 bölümlerini etkileyen
  her değişiklik için bu agent'ı kullan.
---

# M1 — AUTH & KULLANICI AGENT

## Kapsam

PRD Bölümleri: §2 Üyelik · §12 KVKK · §16 Güvenlik · §17.1 Hata Senaryoları

## Sorumluluk Alanları

- Kullanıcı kayıt / giriş (telefon + OTP)
- OTP doğrulama — SMS (Netgsm birincil / İleTiMer yedek)
- KVKK açık rıza onay akışı (kayıt sonrası zorunlu)
- Rol sistemi: `service_seeker` | `service_provider` | `admin`
- JWT access (15dk) + refresh (7gün) token
- Telefon AES-256 şifreleme + maskeleme
- Veri silme süreci (30 gün + KVKK)
- HV profil sayfası içeriği (§2.2)
- Favori HV sistemi
- Teklif güncelleme kuralları (§2.2)

## OTP Kanalı

SMS (Netgsm) ile gönderilir — push notification ile değil.
Yedek: İleTiMer (Netgsm erişilemiyor ise otomatik failover)

## OTP Hata Senaryoları (PRD §17.1) — KRİTİK

```
OTP yanlış (1-2. deneme)  → "Kod hatalı, tekrar deneyin."
OTP yanlış (3. deneme)    → "Çok fazla hatalı deneme. 5 dakika bekleyin."
                             Redis'e 5 dk kilit yaz
OTP süresi dolmuş         → "Kodun süresi doldu. Yeni kod isteyin."
SMS gönderilemedi         → "SMS gönderilemedi. Lütfen tekrar deneyin."
Rate limit (1dk'da 3+)    → 429 Too Many Requests
```

## HV Profil Sayfası İçeriği (PRD §2.2)

Hizmet alanın göreceği HV profil kartında şu alanlar olmalı:

| Alan | Zorunlu | Kaynak |
|---|---|---|
| Profil fotoğrafı | Opsiyonel | HV yükler |
| Ad / İşletme adı | Zorunlu | Admin onayında doğrulanır |
| Hizmet kategorileri | Zorunlu | Seçimli |
| Hizmet verilen ilçeler | Zorunlu | Seçimli |
| Kısa biyografi | Opsiyonel | Maks 300 karakter |
| Portföy fotoğrafları | Opsiyonel | Maks 6 fotoğraf |
| Ortalama puan | Otomatik | Onaylı yorumlardan |
| Toplam tamamlanan iş | Otomatik | Platform verisi |
| Üyelik süresi rozeti | Otomatik | "X yıldır platformda" |
| VIP rozeti | Otomatik | Yalnızca VIP pakette |
| Yanıt süresi | Otomatik | Son 30 gün ortalaması |

## Teklif Güncelleme Kuralları

- Kabul edilmemiş teklif güncellenebilir (fiyat + mesaj)
- Güncelleme → HA'ya bildirim gider
- Kabul edilmiş teklif güncellenemez
- Maks 3 güncelleme hakkı (spam önleme)

## Değişiklik Yapılırken Kontrol Listesi

```
□ Token yapısı değişiyor mu?        → M2, M3'e bildir
□ Yeni kullanıcı alanı ekleniyor mu? → M7 DB şeması güncelle
□ OTP hata mesajı değişiyor mu?     → §17.1 güncelle
□ KVKK metni değişiyor mu?          → Hukuki onay gerekir
□ Rol sistemi değişiyor mu?         → M6 izin matrisi etkilenir
□ HV profil alanı ekleniyor mu?     → M7 DB + M6 admin onay
```

## Bağımlı Modüller

| Değişiklik | Bildir |
|---|---|
| Token yapısı | M2, M3, M7 |
| Yeni kullanıcı alanı | M7 |
| KVKK güncellemesi | M6 |
| Rol ekleme/çıkarma | M3, M6 |
| HV profil alanı | M7 (DB), M6 (admin onay formu) |

## Hızlı Referans — DB

```
users(id, phone ENC, phone_masked, name, email, role,
      kvkk_consent, kvkk_consent_date, marketing_consent,
      is_active, created_at, deleted_at)

service_providers(id, user_id FK, description, avg_rating,
                  total_jobs, response_time_avg, is_approved,
                  health_score, created_at)

-- HV Profil ek alanlar (Faz 2):
provider_profiles(id, provider_id FK, bio VARCHAR(300),
                  portfolio_urls TEXT[], service_districts TEXT[],
                  created_at, updated_at)
```

## Hızlı Referans — API

```
POST /auth/otp/send          ← rate limit: 1dk'da max 3
POST /auth/otp/verify        ← 3 yanlış → 5dk kilit
POST /auth/refresh-token
POST /auth/kvkk/accept       ← kayıt sonrası zorunlu
GET  /users/me
PUT  /users/me
PUT  /users/me/preferences
POST /users/me/delete-request
GET  /providers/:id/profile  ← HV profil sayfası (public)
```
