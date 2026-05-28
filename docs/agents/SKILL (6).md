---
name: m6-admin
description: >
  Admin Panel & Rol Yönetimi modülü agent'ı. 10 personel rolü ve izin
  matrisi, iş bitiş uyuşmazlık yönetimi, yorum onay kuyruğu, şikayet
  yönetimi, kampanya paneli, NPS paneli ve KVKK taleplerini kapsar.
  PRD §15.1–§15.13 bölümlerini etkileyen her değişiklik için bu agent'ı kullan.
---

# M6 — ADMIN PANEL & ROL YÖNETİMİ AGENT

## Kapsam

PRD Bölümleri: §15 Admin Panel (tümü — §15.1 ila §15.13)

## Sorumluluk Alanları

- 10 personel rolü + izin matrisi
- Dashboard (anlık metrikler, bekleyen işlemler)
- Kullanıcı yönetimi (ban, sil, aktif/pasif)
- HV onay kuyruğu (R01-R05 şablonları)
- Yorum onay kuyruğu (Y01-Y05, telefon doğrulama)
- İş bitiş uyuşmazlık yönetimi (§15.12.4)
- Şikayet yönetimi (24 saat SLA takibi)
- Kampanya yönetimi paneli
- NPS paneli
- Arama görev listesi (call_tasks)
- Personel & ekip yönetimi
- KVKK talepleri (30 gün SLA)
- Audit log (tüm admin aksiyonları)

## 10 Personel Rolü

| # | Rol | Kod | Ana Görev |
|---|---|---|---|
| 1 | Süper Admin | `super_admin` | Tüm yetkiler, sistem yapılandırması |
| 2 | Ekip Lideri | `team_leader` | Ekip yönetimi, eskalasyon kararları |
| 3 | Kalite Personeli | `quality_staff` | Yorum onay, memnuniyet aramaları, uyuşmazlık |
| 4 | Operasyon Personeli | `ops_staff` | HV onay, talep izleme |
| 5 | Finans Personeli | `finance_staff` | Ödeme, abonelik, gelir raporları |
| 6 | Pazarlama Personeli | `marketing_staff` | Kampanya, bildirim, büyüme |
| 7 | Satış Personeli | `sales_staff` | HV kazanımı, churn önleme |
| 8 | İnsan Kaynakları | `hr_staff` | Personel, vardiya, onboarding |
| 9 | Yönetici | `executive` | Salt okunur tüm raporlar |
| 10 | Ar-Ge Personeli | `rnd_staff` | Test ortamı, A/B test |

## İzin Matrisi

| Modül | S.Admin | Lider | Kalite | Ops | Finans | Pazarl. | Satış | İK | Yönetici | Ar-Ge |
|---|---|---|---|---|---|---|---|---|---|---|
| Dashboard | ✓ | ✓ | K | K | K | K | K | K | ✓ | K |
| Kullanıcı Yönetimi | ✓ | K | ✗ | K | ✗ | ✗ | K | ✓ | ✗ | ✗ |
| HV Onay | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | K | ✗ | ✗ | ✗ |
| Yorum Kuyruğu | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Uyuşmazlık Alarmları | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | K | ✗ |
| Şikayet | ✓ | ✓ | K | K | ✗ | ✗ | ✗ | ✗ | K | ✗ |
| Talep İzleme | ✓ | ✓ | K | ✓ | ✗ | K | ✗ | ✗ | K | K |
| Ödeme & Abonelik | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ | K | ✗ | K | ✗ |
| Kampanya | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | K | ✗ | ✗ | ✗ |
| NPS Paneli | ✓ | ✓ | K | K | ✗ | ✓ | ✗ | ✗ | ✓ | ✓ |
| Personel & Rol | ✓ | K | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| Analitik | ✓ | ✓ | K | K | ✓ | ✓ | ✓ | K | ✓ | ✓ |
| KVKK | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | K | ✗ | ✗ |
| Sistem Ayarları | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

> ✓ = Tam · K = Kısmi/okuma · ✗ = Erişim yok

## Onay Red Şablonları

**HV Onay Red (R01-R05):**

| Kod | Sebep |
|---|---|
| R01 | Kimlik belgesi eksik veya okunamaz |
| R02 | Verilen bilgiler doğrulanamadı |
| R03 | Hizmet kategorisi uygun değil |
| R04 | Daha önce banlı hesap |
| R05 | Diğer (serbest metin) |

**Yorum Red (Y01-Y05):** M5 skill'inde tanımlı — burada sadece admin arayüzü

## Uyuşmazlık Yönetimi (PRD §15.12.4) — KRİTİK

Kalite personeli panelinde "Uyuşmazlık Alarmları" modülü:

```
Her alarm kartında:
  İş No | HV Beyanı | HA Beyanı | Fark | Fark% | Alarm Seviyesi

[İncele] açılınca:
  - İş geçmişi (teklif tutarı, kabul tarihi)
  - HV ve HA beyanları
  - Arama kayıtları ekleyebilir
  - Karar verir:
    ○ HV beyanı doğru — HA düzeltildi
    ○ HA beyanı doğru — HV uyarıldı
    ○ Anlaşma sağlandı (X TL olarak güncellendi)
    ○ Şikayete dönüştür
```

## Arama Görev Listesi (PRD §15.13)

```
Kalite personeli paneli → "Arama Görevleri":
  - FIFO sıralama (en eski önce)
  - Her görevde: müşteri adı, telefonu, hizmet, hizmet veren
  - Arama sonucu:
    😊 Memnun       → not ekle → kapat
    😐 Kısmen       → not ekle → ekip liderine bildir
    😞 Memnun değil → şikayet akışı başlat → eskalasyon
    📵 Ulaşılamadı  → 24 saat sonra tekrar (max 3 deneme)

SLA: Normal görev 48 saat, Acil görev 24 saat
48 saat geçerse → ekip liderine otomatik eskalasyon
```

## Değişiklik Yapılırken Kontrol Listesi

```
□ Yeni admin modülü ekleniyor mu?    → Modül tablosu + izin matrisi
□ Yeni personel rolü ekleniyor mu?   → 10 rol tablosu + M7 ENUM
□ İzin matrisi değişiyor mu?         → Etkilenen tüm modüller
□ Kampanya formu değişiyor mu?       → M4 kampanya mantığı ile senkron
□ NPS paneli değişiyor mu?           → M5 NPS hesaplama ile senkron
□ Uyuşmazlık eşiği değişiyor mu?    → §15.12 alarm tablosu güncelle
□ Şikayet SLA değişiyor mu?          → M5 şikayet mekanizması
□ Onay süreci değişiyor mu?          → M1 HV kayıt akışı
```

## Bağımlı Modüller

| Değişiklik | Bildir |
|---|---|
| Yeni rol | M7 (ENUM), M1 (kayıt) |
| İzin matrisi | İlgili tüm modüller |
| Kampanya formu | M4 |
| NPS paneli | M5 |
| Şikayet SLA | M5 |
| Onay süreci | M1 |

## Hızlı Referans — DB

```
staff(id, name, email, phone, role ENUM(10 rol),
      team_id FK, is_active, created_by FK,
      created_at, last_login_at)

teams(id, name, leader_id FK, created_at)

audit_logs(id, staff_id FK, action VARCHAR,
           target_type, target_id UUID,
           old_value JSONB, new_value JSONB,
           ip_address, created_at)

call_tasks(id, assigned_to FK, job_completion_id FK,
           customer_id FK,
           priority ENUM(normal|urgent),
           status ENUM(pending|in_progress|done|escalated),
           attempt_count INT DEFAULT 0,
           call_result ENUM(satisfied|partial|unsatisfied|unreachable),
           notes, due_at, completed_at, created_at)
```

## Hızlı Referans — API

```
── Kullanıcı ──────────────────────────
GET  /admin/users
PUT  /admin/users/:id/status
DELETE /admin/users/:id

── HV Onay ────────────────────────────
GET  /admin/providers/pending
PUT  /admin/providers/:id/approve
PUT  /admin/providers/:id/reject      ← Body: { reason: 'R01' }

── Yorum ──────────────────────────────
GET  /admin/reviews/queue
PUT  /admin/reviews/:id/approve
PUT  /admin/reviews/:id/reject        ← Body: { reason: 'Y01' }
POST /admin/reviews/:id/call-log
POST /admin/reviews/:id/appeal-resolve

── Uyuşmazlık ─────────────────────────
GET  /admin/disputes                  ← alarm listesi
PUT  /admin/disputes/:id/resolve

── Şikayet ────────────────────────────
GET  /admin/complaints
PUT  /admin/complaints/:id/resolve

── Kampanya ───────────────────────────
GET  /admin/campaigns
POST /admin/campaigns
PUT  /admin/campaigns/:id
POST /admin/campaigns/:id/toggle

── NPS ────────────────────────────────
GET  /nps/score
GET  /nps/responses

── Personel ───────────────────────────
GET  /admin/staff
POST /admin/staff
PUT  /admin/staff/:id/role

── Analitik ───────────────────────────
GET  /admin/analytics/overview
GET  /admin/analytics/providers
GET  /admin/analytics/revenue

── KVKK ───────────────────────────────
GET  /admin/kvkk/requests
PUT  /admin/kvkk/requests/:id
```
