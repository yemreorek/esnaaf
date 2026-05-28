---
title: Admin Roller & İzinler
type: rol
prd-refs: ["§15.13"]
related: ["[[M6-Admin-Roller]]", "[[Hizmet-Veren]]"]
status: complete
updated: 2026-05-24
---

> 10 personel rolü ve 16 modüle yönelik detaylı erişim izin matrisi.

## PRD Bölümleri

- [§15.13 Roller & İzin Matrisi](../../esnaaf-claude.md)

## 10 Personel Rolü

| # | Rol Kodu | Rol Adı | Açıklama |
|---|---|---|---|
| 1 | `super_admin` | Süper Admin | Tüm sisteme tam erişim, rol atama yetkisi |
| 2 | `team_leader` | Takım Lideri | Ekip yönetimi, iş dağıtımı, performans takibi |
| 3 | `quality_staff` | Kalite Personeli | Yorum onay, şikayet yönetimi, NPS takibi |
| 4 | `ops_staff` | Operasyon Personeli | HV onay, talep takibi, günlük operasyon |
| 5 | `finance_staff` | Finans Personeli | Ödeme takibi, fatura, gelir raporları |
| 6 | `marketing_staff` | Pazarlama Personeli | Kampanya yönetimi, içerik, SEO |
| 7 | `sales_staff` | Satış Personeli | Yeni HV kazanımı, CRM, satış hunisi |
| 8 | `hr_staff` | İK Personeli | Personel yönetimi, izin, performans |
| 9 | `executive` | Yönetici | Üst düzey raporlar, stratejik kararlar |
| 10 | `rnd_staff` | Ar-Ge Personeli | A/B test, AI model ayarları, teknik optimizasyon |

## İzin Matrisi (16 Modül × 10 Rol)

Erişim seviyeleri: ✅ Tam erişim | 🔶 Kısıtlı erişim (salt okunur veya kendi kapsamı) | ❌ Erişim yok

| Modül | super_admin | team_leader | quality | ops | finance | marketing | sales | hr | executive | rnd |
|---|---|---|---|---|---|---|---|---|---|---|
| Kullanıcı Yönetimi | ✅ | 🔶 | 🔶 | ✅ | ❌ | ❌ | 🔶 | ❌ | 🔶 | ❌ |
| HV Onay & Yönetimi | ✅ | ✅ | 🔶 | ✅ | ❌ | ❌ | ✅ | ❌ | 🔶 | ❌ |
| Talep Yönetimi | ✅ | ✅ | 🔶 | ✅ | ❌ | ❌ | ❌ | ❌ | 🔶 | ❌ |
| Teklif Takibi | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | 🔶 | ❌ |
| Yorum Onay | ✅ | 🔶 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Şikayet Yönetimi | ✅ | ✅ | ✅ | 🔶 | ❌ | ❌ | ❌ | ❌ | 🔶 | ❌ |
| NPS Yönetimi | ✅ | 🔶 | ✅ | ❌ | ❌ | 🔶 | ❌ | ❌ | ✅ | 🔶 |
| Ödeme & Abonelik | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | 🔶 | ❌ | ✅ | ❌ |
| Kampanya Yönetimi | ✅ | ❌ | ❌ | ❌ | 🔶 | ✅ | 🔶 | ❌ | 🔶 | ❌ |
| Bildirim Yönetimi | ✅ | 🔶 | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Rol & İzin Yönetimi | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Denetim Kaydı | ✅ | 🔶 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Personel Yönetimi | ✅ | 🔶 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | 🔶 | ❌ |
| Raporlar & Dashboard | ✅ | ✅ | 🔶 | 🔶 | ✅ | 🔶 | 🔶 | ❌ | ✅ | 🔶 |
| AI & Sistem Ayarları | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| KVKK & Veri Yönetimi | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

## Rol Bazlı Dashboard'lar

### Kalite Dashboard'u (`quality_staff`)

| Widget | Açıklama |
|---|---|
| Bekleyen Yorumlar | Onay bekleyen yorum sayısı ve listesi |
| Açık Şikayetler | Çözülmemiş şikayet listesi |
| NPS Trendi | Son 30 günlük NPS grafiği |
| Çağrı Görevleri | Bugün aranması gereken HA listesi |
| Ceza Takibi | Uygulanmış ceza ve itiraz durumları |

### Satış Dashboard'u (`sales_staff`)

| Widget | Açıklama |
|---|---|
| Yeni HV Başvuruları | Onay bekleyen başvuru sayısı |
| Satış Hunisi | Lead → Trial → Ödeme dönüşüm oranları |
| Aktif Trial'lar | Deneme süresindeki HV'ler |
| Kampanya Performansı | Aktif kampanyaların dönüşüm metrikleri |
| Hedef Takibi | Aylık satış hedefi ve gerçekleşme |

### Executive Dashboard (`executive`)

| Widget | Açıklama |
|---|---|
| Toplam Gelir | Aylık / haftalık gelir grafiği |
| Aktif Kullanıcılar | HA ve HV aktif kullanıcı sayıları |
| NPS Skoru | Genel NPS ve trend |
| Tamamlanan İşler | Toplam ve büyüme oranı |
| Şehir Bazlı Metrikler | Her şehir için özet performans |
| Churn Oranı | HV abonelik iptalleri |

## Teknik Detaylar

### İzin Kontrolü

```typescript
// Her endpoint'te izin kontrolü
@Roles('super_admin', 'quality_staff')
@UseGuards(RolesGuard)
async approveReview(@Param('id') id: string) { ... }
```

### Denetim Kaydı

Her admin işlemi `audit_logs` tablosuna yazılır:

```typescript
{
  staff_id: "uuid",
  action: "review_approved",
  target_type: "review",
  target_id: "uuid",
  details: { ... },
  ip_address: "x.x.x.x",
  created_at: "timestamp"
}
```

## İlgili Sayfalar

- [[M6-Admin-Roller]] — Admin & Roller modülü
- [[Hizmet-Veren]] — HV onay ve yönetim süreçleri
- [[MVP-Faz-2]] — Roller ve izin sistemi Faz 2'de aktif
- [[Veritabanı-Genel]] — staff, audit_logs, teams tabloları
