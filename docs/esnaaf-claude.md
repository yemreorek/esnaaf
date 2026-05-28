# Hizmet Eşleştirme Platformu — Ürün Gereksinimleri Dokümanı (PRD)

> Yapay zeka destekli hizmet eşleştirme platformu.
> Web + Mobil. Hızlı, modüler, ölçeklenebilir.

---

## İÇİNDEKİLER

1. [Sistem Özeti](#1-sistem-özeti)
2. [Üyelik Sistemi](#2-üyelik-sistemi)
3. [Gelişmiş AI Chat Akışı](#3-gelişmiş-ai-chat-akışı)
4. [Talep (Job) Sistemi](#4-talep-job-sistemi)
5. [Hizmet Veren Paneli](#5-hizmet-veren-paneli)
6. [Paket Sistemi](#6-paket-sistemi)
7. [Ödeme Sistemi — iyzico Entegrasyonu](#7-ödeme-sistemi--iyzico-entegrasyonu)
8. [İletişim & Telefon Maskeleme Sistemi](#8-iletişim--telefon-maskeleme-sistemi)
9. [Puan & Güven Sistemi](#9-puan--güven-sistemi)
10. [Anlaşmazlık & Şikayet Mekanizması](#10-anlaşmazlık--şikayet-mekanizması)
11. [Akıllı Dağıtım Algoritması](#11-akıllı-dağıtım-algoritması)
12. [KVKK & Hukuki Uyumluluk](#12-kvkk--hukuki-uyumluluk)
13. [AI Chat Güvenliği](#13-ai-chat-güvenliği)
14. [Bildirim Sistemi](#14-bildirim-sistemi)
15. [Admin Panel](#15-admin-panel) *(§15.12 İş Bitiş Teyit · §15.13 Rol & İzin Yönetimi)*
16. [Teknoloji Stack](#16-teknoloji-stack) *(§16.4 ENV Değişkenleri)*
17. [Güvenlik](#17-güvenlik) *(§17.1 Hata Senaryoları · §17.2 Monitoring · §17.3 Dosya Yükleme)*
18. [API Yapısı](#18-api-yapısı)
19. [Veritabanı Şeması](#19-veritabanı-şeması) *(§19.2 Index Stratejisi)*
20. [MVP Planı](#20-mvp-planı)

---

## 1. SİSTEM ÖZETİ

### 1.1 Vizyon & Value Proposition

**Esnaaf, Türkiye'nin ilk "Conversational Commerce" hizmet platformudur.**

> **Slogan:** *"Form doldurmayı bırak. Ne istediğini yaz, ustası saniyeler içinde teklif versin."*

Geleneksel platformların kategori menüleri, onlarca adımlı form ve buton labirentleri yerine
Esnaaf kullanıcıya tek bir şey sorar: **"Bana neye ihtiyacın olduğunu söyle."**

Kullanıcı doğal dilde yazar → Yapay zeka anlar → Talebi ustalarına iletir → Teklifler canlı olarak chat ekranına düşer.

### 1.2 Kullanıcı Tipleri

- **Hizmet Alan:** Chat ile talep oluşturur, teklifleri chat ekranında canlı takip eder.
- **Hizmet Veren:** Aylık paket aboneliği ile gelen işleri görür, platform içi mesajlaşır, teklif verir.

### 1.3 Ana Kullanıcı Akışı

```
Kullanıcı siteye girer
        ↓
Ekranda tek şey var: Logo + büyük chat kutusu
"Bana neye ihtiyacın olduğunu söyle..."
        ↓
Kullanıcı yazar: "Kombim su akıtıyor, acil usta lazım, Şişli"
        ↓
AI saniyeler içinde analiz eder:
  Kategori → Kombi Bakım / Su Tesisatı
  Aciliyet → Yüksek
  Konum    → Şişli
        ↓
Eksik bilgi varsa AI doğal dilde sorar:
  "Hangi mahallede olduğunuzu söyler misiniz?"
        ↓
Bilgiler tamamlanır → Kullanıcı onaylar
        ↓
"Talebinizi Şişli'deki en iyi 5 ustaya ilettik.
 Teklifler bu ekranda belirmeye başlayacak..."
        ↓
[WebSocket] — Canlı teklif akışı:
🔔 "Ahmet Usta — Kombi tamiri — 800 TL"  [Profili Gör] [Kabul Et]
🔔 "Mehmet Usta — Kombi tamiri — 750 TL" [Profili Gör] [Kabul Et]
```

### 1.4 Karşılama Ekranı Tasarım Kuralı

```
✓ Logo (üstte ortalı)
✓ Büyük chat input alanı (sayfanın merkezinde)
✓ Placeholder: "Bana neye ihtiyacın olduğunu söyle..."
✓ Chat inputunun altında küçük hızlı seçim chip'leri
✓ Kayıt olmadan chat AÇIK

✗ Kategori menüsü yok
✗ "Hemen Başla" butonu yok
✗ Açılır menü yok
✗ Slider/banner yok
```

#### 1.4.1 Eklenti 1 — Hızlı Seçim Chip'leri

Saf boş sayfa bazı kullanıcıları "Ne yazacağımı bilmiyorum" hissine sürükler.
Chip'ler bu engeli kaldırır — yazan yazsın, seçen seçsin, ikisi de mutlu olur.

```
Chip tasarımı (chat input'unun altında, küçük ve sade):
┌──────────────────────────────────────────────────────┐
│  Bana neye ihtiyacın olduğunu söyle...               │
│                                                      │  ← textarea
└──────────────────────────────────────────────────────┘
  [🏠 Ev Temizliği] [🎨 Boya] [🔧 Tesisat] [⚡ Elektrik] [➕]

Davranış kuralları:
  → Chip'e tıklanınca kategori adı textarea'ya yazılır
  → Otomatik focus + submit tetiklenir (kullanıcı onaylamak zorunda değil)
  → AI "Ev temizliği" yazısını alır, ilk soruya geçer: "Hangi ilçedesiniz?"
  → Mobil klavye açılınca chip'ler gizlenir (daha fazla alan)
  → [➕] tıklanınca tüm kategoriler açılır (bottom sheet / modal)

Stil:
  → Arka plan: #F7FCD4 (açık lime)
  → Metin: #232323 (antrasit)
  → Border: 1px solid #D4F54E
  → Border-radius: 20px (pill şekli)
  → Font: 13px, medium
```

#### 1.4.2 Eklenti 2 — Anonymous Chat (Kayıtsız Başlangıç)

Kullanıcı kayıt olmadan chat'i başlatabilir. Kayıt, talep onaylanmak üzereyken istenir.
**"Önce değer göster, sonra bilgi iste"** — bu conversion'ı dramatik artırır.

```
Akış:
Kullanıcı yazar → AI sorular sorar → bilgiler toplanır
        ↓
Talep özet kartı gösterilir:
  "Talebinizi göndermeden önce kısa kayıt gerekiyor."
        ↓
Chat içinde inline kayıt formu:
  📱 Telefon numaranız: [___________]
  [Kod Gönder]
        ↓
OTP SMS ile gelir → doğrulanır → talep sisteme kaydedilir
        ↓
Kullanıcı artık kayıtlı → sonraki ziyarette direkt devam

Teknik detay:
  → Anonim session: Redis'te temp_session:{uuid} (TTL: 2 saat)
  → Chat geçmişi session'da saklanır
  → Kayıt tamamlanınca session → user_id'ye bağlanır
  → Kullanıcı kayıt yarıda bırakırsa chat verisi 2 saat korunur
  → Kayıtlı kullanıcı gelince: direkt chat, kayıt yok
```

**Neden önemli:**
Rakiplerde ilk adım kayıt formu → yüksek terk oranı.
Esnaaf'ta ilk adım değer (AI sizi anladı, talep hazır) → kayıt motivasyonu yüksek.

### 1.5 Teknik Temel

- **AI:** LangChain + GPT-4o (Türkçe doğal dil anlama)
- **Canlı Teklif Akışı:** WebSocket (Socket.io) — push notification değil, gerçek zamanlı
- **OTP:** SMS (Netgsm) — %99.9 delivery garantisi, push notification ile değil
- **Kullanıcı Kanalları:** Web (chat-first) · **Esnaaf** mobil uygulaması · **Esnaaf Partner** (HV)

---

## 2. ÜYELİK SİSTEMİ

### 2.1 Hizmet Alan — Esnaaf Uygulaması

> **Uygulama Adı:** Esnaaf
> **App Store Kategorisi:** Yaşam / Ev Hizmetleri
> **ASO:** "ev temizliği bul", "usta bul", "boya ustası", "nakliyat"

- Telefon numarası ile hızlı kayıt (OTP doğrulama — SMS ile gönderilir)
- Web sitesi veya **Esnaaf** mobil uygulaması üzerinden AI chat ile talep başlatma
- **Kayıt/giriş sonrasında KVKK & Açık Rıza Metni onayı zorunludur** (bkz. Bölüm 12)
- AI sohbet ile talep oluşturma

**Panel Ekranları:**

| Ekran | Açıklama |
|---|---|
| Aktif Talepler | Devam eden, teklif beklenen talepler |
| Gelen Teklifler | Hizmet verenlerden gelen teklifler (maskelenmiş numara) |
| Kabul Edilenler | Onaylanan 2 hizmet veren — numara görünür |
| Geçmiş Talepler | Tamamlanan işler |
| İptal Edilenler | İptal edilen talepler |

### 2.2 Hizmet Veren — Esnaaf Partner Uygulaması

> **Uygulama Adı:** Esnaaf Partner
> **App Store Kategorisi:** İş / Araçlar
> **ASO Anahtar Kelimeler:** "iş bul", "müşteri kazan", "ek gelir", "usta uygulaması"
> **Fark:** Günlük CRM aracı — iş takibi, kazanç analizi, müşteri mesajlaşma, rota planlama

- Kayıt + kategori seçimi
- Admin onayı (kimlik & belge kontrolü)
- **Kayıt sonrasında KVKK & Açık Rıza Metni onayı zorunludur** (bkz. Bölüm 12)

**Hizmet Veren Profil Sayfası (Hizmet Alan tarafından görülen):**

| Alan | Zorunlu | Açıklama |
|---|---|---|
| Profil fotoğrafı | Opsiyonel | Yüz fotoğrafı veya logo |
| Ad Soyad / İşletme Adı | Zorunlu | Admin onayında doğrulanır |
| Hizmet kategorileri | Zorunlu | Çalıştığı tüm kategoriler |
| Hizmet verdiği ilçeler | Zorunlu | Seçilebilir ilçe listesi |
| Kısa biyografi | Opsiyonel | Maks. 300 karakter |
| Portföy fotoğrafları | Opsiyonel | Maks. 6 fotoğraf (önceki işlerden) |
| Ortalama puan | Otomatik | Onaylı yorumlardan hesaplanır |
| Toplam tamamlanan iş | Otomatik | Platform verisi |
| Üyelik süresi | Otomatik | "X yıldır platformda" rozeti |
| VIP rozeti | Otomatik | Yalnızca VIP pakette gösterilir |
| Yanıt süresi | Otomatik | Son 30 gün ortalaması |

**Teklif Güncelleme Kuralları:**
- Hizmet veren **kabul edilmemiş** teklifini güncelleyebilir (fiyat + mesaj)
- Güncelleme yapılınca HA'ya bildirim gider: "Teklifiniz güncellendi"
- **Kabul edilmiş** teklif güncellenemez
- Güncelleme sayısı maks. **3** ile sınırlıdır (spam önleme)

**Tekrar Çalışma (Favori HV):**
- Hizmet alan tamamlanan bir işten HV'yi "Favorilerime Ekle" ile kaydedebilir
- Yeni talep oluştururken "Favori HV'lerime gönder" seçeneği sunulur
- Favori HV'ye teklif verme önceliği verilir (kota ve paket şartı yine geçerli)

**Panel Ekranları:**

| Ekran | Açıklama |
|---|---|
| Gelen İşler | Sisteme düşen yeni talepler |
| Teklif Verilenler | Teklif verilmiş, sonuç beklenen işler |
| Kazanılan İşler | Hizmet alanın kabul ettiği işler — müşteri iletişim bilgisi görünür |
| Tamamlanan İşler | Bitirilen işler |
| İptal Edilenler | İptal edilen işler |
| Yorumlar & Puanlar | Gelen değerlendirmeler |
| Paket Bilgisi | Aktif paket ve yenileme tarihi |
| Ödeme Geçmişi | iyzico üzerinden geçmiş ödemeler |
| Kazanç Analizi | Aylık/haftalık gelir, tamamlanan iş grafiği |
| Rota Planlama | Günün kabul edilen işleri haritada görünür |

---

## 3. GELİŞMİŞ AI CHAT AKIŞI

### 3.1 Akış Adımları

Tüm iletişim **platform içinde** (web veya mobil) gerçekleşir. Chat-first tasarım — form yok, menü yok.

```
1. Kullanıcı ana sayfayı açar
   → Ekranda sadece logo ve büyük chat kutusu görünür
   → Kayıt gerekmeden yazabilir (anonymous chat başlar)
         ↓
2. Kullanıcı doğal dilde yazar:
   "Kombim su akıtıyor acil usta lazım Şişli"
         ↓
3. AI tek cümlede kategoriyi, konumu, aciliyeti çıkarır
   → Eksik bilgi varsa doğal dilde sorar (1-2 soru max)
   → Yeterli bilgi varsa doğrudan bir sonraki adıma geçer
         ↓
4. Kayıt kontrolü:
   → Kullanıcı kayıtlı değilse: OTP ile hızlı kayıt (chat içinde)
   → Kayıtlıysa: devam et
         ↓
5. AI özet kartı gösterir — onay istenir:
   ┌────────────────────────────────────┐
   │ Kombi Bakım · Şişli · Acil        │
   │ [✅ Evet, doğru] [✏️ Düzelt]      │
   └────────────────────────────────────┘
         ↓
6. Onay sonrası talep sisteme kaydedilir
   → Chat ekranı "bekleme moduna" geçer:
   "Talebinizi Şişli'deki en iyi 5 ustaya ilettik.
    Teklifler bu ekranda belirmeye başlayacak..."
         ↓
7. [WebSocket] — Teklifler canlı olarak chat balonları olarak düşer:
   🔔 Ahmet Usta — Kombi tamiri — 800 TL
      [Profili Gör] [Mesaj Gönder] [Kabul Et]
   🔔 Mehmet Usta — Kombi tamiri — 750 TL
      [Profili Gör] [Mesaj Gönder] [Kabul Et]
         ↓
8. Kullanıcı kabul edince telefon numaraları açılır
   (onay popup → §8.3 akışı)
```

**Mobil Deneyim Notu:**
Chat-first tasarım mobil ekranlar için ideal — mesaj yazar gibi talep oluşturma.
Klavye açıldığında chip'ler kaybolur, sadece input ve gönder butonu kalır.

### 3.2 Form Özeti Ekranı (Web & Mobil)

AI sohbet tamamlandığında kullanıcıya platform içinde form özeti gösterilir.
Kullanıcı onaylarsa talep panele kaydedilir ve hizmet verenlere dağıtılır.

```
┌─────────────────────────────────────┐
│  📋 TALEBİNİZ ÖZETİ                │
├─────────────────────────────────────┤
│  Hizmet Türü : Ev Temizliği        │
│  Ad Soyad    : Ahmet Yılmaz        │
│  Konum       : Kadıköy, İstanbul   │
│  Tarih       : 15 Ocak 2025, 10:00 │
│  Oda Sayısı  : 3+1                 │
│  Özel Not    : Evcil hayvan var    │
├─────────────────────────────────────┤
│  [✅ Onayla]    [✏️ Düzenle]       │
└─────────────────────────────────────┘
         ↓ Onay sonrası
┌─────────────────────────────────────┐
│  🎉 Talebiniz oluşturuldu!         │
│  Hizmet verenler size teklif        │
│  gönderecek. Panele gitmek için:   │
│  [Panele Git →]                    │
└─────────────────────────────────────┘
```

### 3.3 Desteklenen Hizmet Kategorileri (MVP — İlk 20)

Türkiye'de en yüksek talep ve kayıt hacmine sahip kategoriler:

| # | Kategori | Talep Yoğunluğu | MVP Fazı |
|---|---|---|---|
| 1 | Ev Temizliği | ⭐⭐⭐⭐⭐ En yüksek | Faz 1 |
| 2 | Boya Badana | ⭐⭐⭐⭐⭐ | Faz 1 |
| 3 | Nakliyat / Ev Taşıma | ⭐⭐⭐⭐⭐ | Faz 1 |
| 4 | Su Tesisatı | ⭐⭐⭐⭐ | Faz 1 |
| 5 | Elektrik Tesisatı | ⭐⭐⭐⭐ | Faz 1 |
| 6 | Ev Tadilat | ⭐⭐⭐⭐ | Faz 1 |
| 7 | Halı & Koltuk Yıkama | ⭐⭐⭐⭐ | Faz 2 |
| 8 | İnşaat / Tadilat Sonrası Temizlik | ⭐⭐⭐⭐ | Faz 2 |
| 9 | Fayans & Parke Döşeme | ⭐⭐⭐ | Faz 2 |
| 10 | Haşere & Böcek İlaçlama | ⭐⭐⭐ | Faz 2 |
| 11 | Kombi & Klima Bakımı | ⭐⭐⭐ | Faz 2 |
| 12 | Mantolama & Dış Cephe | ⭐⭐⭐ | Faz 2 |
| 13 | Marangoz & Mobilya Montajı | ⭐⭐⭐ | Faz 2 |
| 14 | Özel Ders | ⭐⭐⭐ | Faz 2 |
| 15 | Cam Balkon & PVC Pencere | ⭐⭐⭐ | Faz 3 |
| 16 | Ofis & İş Yeri Temizliği | ⭐⭐⭐ | Faz 3 |
| 17 | Doğalgaz Tesisatı | ⭐⭐ | Faz 3 |
| 18 | İç Mimar & Dekorasyon | ⭐⭐ | Faz 3 |
| 19 | Fotoğrafçı | ⭐⭐ | Faz 3 |
| 20 | Organizasyon & Etkinlik | ⭐⭐ | Faz 3 |

> **Faz 1 başlangıcı:** Yalnızca ilk 6 kategori ile başlanır. Her yeni faz ile kategoriler genişletilir.

### 3.4 Kategori Bazlı AI Soru Akışı

Her kategori için AI'ın sorması gereken zorunlu ve opsiyonel sorular:

**Ev Temizliği**
```
Zorunlu: Konum | Tarih & saat | Daire tipi (1+1, 2+1...) | Temizlik sıklığı (tek/düzenli)
Opsiyonel: Evcil hayvan var mı? | Özel temizlik alanı var mı? | Ürünler sende mi olsun?
```

**Boya Badana**
```
Zorunlu: Konum | Metrekare (yaklaşık) | Sadece iç mi dış da dahil mi? | İstenen renk/tip
Opsiyonel: Mevcut boya durumu | Alçı/sıva ihtiyacı var mı? | Tarih esnekliği
```

**Nakliyat / Ev Taşıma**
```
Zorunlu: Çıkış adresi | Varış adresi | Taşınma tarihi | Daire tipi | Kat & asansör durumu
Opsiyonel: Piyano/kasa gibi özel eşya var mı? | Paketleme hizmeti istiyor mu?
```

**Su Tesisatı**
```
Zorunlu: Konum | Sorun türü (su kaçağı/tıkanıklık/yeni tesisat) | Aciliyet durumu
Opsiyonel: Bina yaşı | Daha önce müdahale edildi mi?
```

**Elektrik Tesisatı**
```
Zorunlu: Konum | İş türü (arıza/yeni tesisat/priz-sigorta) | Aciliyet
Opsiyonel: Bina tipi (konut/işyeri) | Sigorta atıyor mu?
```

**Ev Tadilat**
```
Zorunlu: Konum | Tadilat kapsamı (banyo/mutfak/genel) | Metrekare | Bütçe aralığı
Opsiyonel: Malzeme temin edilecek mi? | Hedef bitiş tarihi
```

### 3.5 AI Sohbet Teknik Yapısı

- LLM: **OpenAI GPT-4o** (veya GPT-4o Mini — maliyet optimizasyonu için)
- Konuşma state: **Redis** (session bazlı, TTL: 24 saat)
- Structured output: **LangChain** ile JSON schema zorunlu
- Her konuşma oturumu izole — bir oturumdan diğerine veri sızması yok
- Kategori tespiti başarısız olursa → kullanıcıya kategori listesi sunulur

---

## 4. TALEP (JOB) SİSTEMİ

### 4.1 Talep Statüleri

```
Bekliyor → Firmalara Gönderildi → Tamamlandı
                                → İptal Edildi
```

### 4.2 Kurallar

- Her talep maksimum **5–7 hizmet verene** gösterilir
- Dağıtım algoritması paket seviyesi, puan, aktiflik ve lokasyona göre çalışır (bkz. Bölüm 11)
- Aynı talep için bir hizmet veren yalnızca **1 teklif** verebilir

### 4.3 Talep Süresi & Otomatik Kapanma

Her talep oluşturulduğunda **48 saatlik yaşam süresi** başlar.

```
Talep oluşturuldu
        ↓
24. saat → Hiç teklif gelmemişse:
  → HA-06 bildirimi: "Talebinize henüz teklif gelmedi."
  → Admin'e otomatik bildirim (AD operasyon)
        ↓
46. saat → 2 kabul tamamlanmamışsa:
  → HA-07 bildirimi: "Talebiniz yarın kapanacak."
        ↓
48. saat → Otomatik kapanma cron'u çalışır:
  → 3 kabul yapılmışsa → Durum değişmez (zaten işlemde)
  → Kabul yapılmamışsa → Statü "İptal Edildi" olur
  → Bekleyen tüm teklifler "İptal" olur
  → HA'ya bildirim: "Talebiniz süresi dolduğu için kapatıldı."
```

**Hizmet Alan Talebi Yenileme:**
İptal edilen talep için HA yeni talep oluşturabilir (aynı form verisiyle).
Panel'de iptal edilen talebin yanında **[Yeniden Oluştur]** butonu görünür.

**HV Banlama / Silme Sonrası Aktif Teklif:**

| Durum | Aksiyon |
|---|---|
| HV banlı / siliniyorsa | Kabul edilmemiş teklifleri otomatik iptal |
| HV'nin kabul edilmiş aktif teklifi varsa | HA'ya bildirim + alternatif HV seçme hakkı |
| Açılmış telefon numarası | HA'nın elinde kalır (silinemez, KVKK gereği log tutulur) |
| İş tamamlama bekliyorsa | Admin manuel karar verir |

**DB Cron:**
```
-- Her saat çalışır, süresi dolan talepleri kapatır
UPDATE service_requests
SET status = 'cancelled'
WHERE status IN ('pending', 'distributed')
  AND created_at < NOW() - INTERVAL '48 hours'
  AND (SELECT COUNT(*) FROM accepted_offers WHERE job_id = service_requests.id) < 3;
```

---

## 5. HİZMET VEREN PANELİ — GELİŞMİŞ ÖZELLİKLER

### 5.1 Gelen İşler Ekranı

- Her iş kartında **"Bu işi şu an kaç kişi görüyor?"** bilgisi görünür
- Teklif verme süresi kısıtlı gösterilebilir (opsiyonel — rekabeti artırır)

### 5.2 Performans Analizi

| Metrik | Etki |
|---|---|
| Aktiflik süresi | Sıralama puanını artırır |
| Cevap verme hızı | İş dağıtım önceliğini artırır |
| Kabul oranı | Görünürlüğü etkiler |
| Ortalama puan | VIP erişim şartı |

Bu veriler gerçek zamanlı hesaplanır ve `activity_logs` + `response_times` tablolarında tutulur.

---

## 6. PAKET SİSTEMİ

| Paket | Aylık Ücret | Görünürlük | Aylık İş Limiti | Özellik |
|---|---|---|---|---|
| Basic | 5.000 ₺/ay | Düşük | 10 iş/ay | — |
| Standart | 10.000 ₺/ay | Orta | 25 iş/ay | — |
| Premium | 15.000 ₺/ay | Yüksek | 50 iş/ay | — |
| VIP | 20.000 ₺/ay | En üst | Sınırsız | Özel rozet, öncelikli dağıtım, öne çıkarma |

### Paket Detayları

| Özellik | Basic | Standart | Premium | VIP |
|---|---|---|---|---|
| Aylık ücret | 5.000 ₺ | 10.000 ₺ | 15.000 ₺ | 20.000 ₺ |
| Onaylanan / Kabul Edilen İş/ay | 14 | 30 | 60 | Sınırsız |
| Dağıtım önceliği | 4. sıra | 3. sıra | 2. sıra | 1. sıra |
| Teklif verme hakkı | Sınırsız | Sınırsız | Sınırsız | Sınırsız |
| VIP rozeti | ✗ | ✗ | ✗ | ✓ |
| Hizmet alan'a rozet görünümü | ✗ | ✗ | ✗ | ✓ |
| Profil öne çıkarma | ✗ | ✗ | ✗ | ✓ |

### Onaylanan İş Kotası — Çalışma Mantığı

Kota, **hizmet alan tarafından onaylanma** sayısına göre düşer — hizmet verenin teklif vermesine göre değil.

```
Hizmet alan → Gelen teklifleri inceler
           → "Kabul Et" ile 2 hizmet veren seçer
                    ↓
Seçilen HER hizmet verenin aylık kotasından 1 adet düşer

Örnek:
  Mehmet Usta (Basic paket, 14 hakkı var)
  → Bu ay 10 farklı işte hizmet alan tarafından seçildi
  → Kalan hak: 4
  → 4 hak dolunca bu ay yeni işlerde görünmez
  → Ay başında kota sıfırlanır
```

**Kota düşme kuralları:**

| Durum | Kota Etkisi |
|---|---|
| Hizmet alan teklifi kabul etti | **−1 kota** düşer |
| Hizmet alan 2. kişiyi de kabul etti | Diğer hizmet verenden de **−1 kota** düşer |
| Hizmet alan teklifi reddetti | Kota etkilenmez |
| Hizmet veren teklif verdi ama seçilmedi | Kota etkilenmez |
| İş iptal edildi (kabul sonrası) | Kota **iade edilmez** |
| Kota sıfırlandı (ay başı) | Her ayın 1'inde otomatik sıfırlanır |

### Kurallar

- Yalnızca **VIP rozeti** hizmet alan kullanıcıya görünür
- Diğer paket seviyeleri kullanıcı arayüzünden gizlidir
- VIP olmak için minimum **4.5 puan** eşiği gereklidir
- Aylık kota dolunca hizmet veren yeni işlerde **görünmez ve teklif veremez**
- Kota her ayın 1'inde UTC+3 00:00'da otomatik sıfırlanır
- Paketler **aylık abonelik** modeliyle satılır (bkz. Bölüm 7)
- Kampanya kodu uygulanırsa normal fiyat üzerinden indirim veya ücretsiz deneme süresi tanımlanır (bkz. §7.6)

---

## 7. ÖDEME SİSTEMİ — iyzico Entegrasyonu

### 7.1 Abonelik Modeli

- Tüm paketler **aylık yenilenen abonelik** olarak çalışır
- Ödeme sağlayıcı: **iyzico** (Türkiye'de yaygın, PCI-DSS uyumlu)
- Abonelik başlangıcında kart bilgileri iyzico'da tokenize edilir — platform kart numarası saklamaz

### 7.2 Ödeme Akışı

```
Hizmet Veren → Paket Seçer
      ↓
iyzico Checkout Form açılır (iframe/redirect)
      ↓
Kart bilgileri iyzico'ya iletilir
      ↓
İlk ödeme başarılıysa:
  - Abonelik aktif edilir
  - Kart token'ı saklanır (iyzico tarafında)
  - Fatura kesilir (e-fatura veya e-arşiv)
      ↓
Her ay otomatik ödeme çekilir (iyzico recurring payment)
      ↓
Ödeme başarılıysa → Abonelik 1 ay uzatılır
Ödeme başarısızsa → 3 gün içinde 2 deneme daha yapılır
                  → Hâlâ başarısız ise abonelik askıya alınır
                  → Kullanıcıya bildirim gönderilir (Platform içi + E-posta)
```

### 7.3 Abonelik İptal Senaryosu

| Durum | Sonuç |
|---|---|
| Hizmet veren iptal eder | Dönem sonuna kadar paket aktif kalır |
| İptal sonrası aktif teklifler | Teklifler **sistemde kalır**, hizmet alan görebilir |
| İptal sonrası yeni işler | **Hizmet veren yeni iş göremez** |
| İptal sonrası yeni teklif | **Verilmez** |
| Yeniden abone olursa | Pakete uygun görünürlük geri gelir |

> **Not:** İptal olan hizmet verenin daha önce verdiği teklifler hizmet alan tarafından hâlâ değerlendirilebilir. Bu, hizmet alan deneyimini korumak için tasarlanmıştır.

### 7.4 iyzico Teknik Entegrasyon Noktaları

```
POST /payment/subscription/create     → İlk abonelik başlatma
POST /payment/subscription/cancel     → İptal
GET  /payment/subscription/status     → Durum sorgulama
POST /payment/webhook/iyzico          → iyzico'dan gelen bildirimler (ödeme başarı/hata)
GET  /payment/history                 → Ödeme geçmişi
```

- Webhook'lar imzalanmış olmalı (`iyzico-signature` header doğrulaması)
- Her ödeme eventi `payments` tablosuna loglanır
- Fatura bilgileri `payment_invoices` tablosunda tutulur

### 7.5 Başarısız Ödeme Bildirimleri

```
Ödeme başarısız → Anında bildirim (Platform içi + E-posta)
3 gün sonra tekrar deneme → Başarısızsa 2. bildirim
6 gün sonra son deneme → Başarısızsa 3. bildirim + abonelik askıya alma
```

---

### 7.6 Kampanya & İndirim Kodu Sistemi

#### 7.6.1 Kampanya Tipleri

| Tip | Kod | Açıklama | Örnek |
|---|---|---|---|
| Yüzde İndirim | `PERCENT` | Paket fiyatından % indirim | İlk ay %50 indirim |
| Sabit İndirim | `FIXED` | Paket fiyatından TL indirim | 2.000 ₺ indirim |
| Ücretsiz Deneme | `FREE_TRIAL` | X gün ücretsiz kullanım | 14 gün ücretsiz |
| Paket Yükseltme | `UPGRADE` | Düşük paketi üst pakete yükselt | Basic alan Standart alır |

#### 7.6.2 Kampanya Kodu Uygulama Akışı

```
Hizmet veren → Paket seçim ekranında
               "Kampanya kodunuz var mı?" alanı görür
        ↓
Kodu girer: HOSGELDIN50
        ↓
Backend kontrol eder:
  □ Kod var mı?
  □ Süresi dolmamış mı?  (valid_until)
  □ Kullanım limiti dolmamış mı?  (max_uses)
  □ Bu kullanıcı daha önce kullandı mı?  (tek kullanım ise)
  □ Hangi paket(ler) için geçerli?
  □ Sadece yeni üye mi, herkes mi?
        ↓
Geçerliyse → Ekranda indirimli fiyat gösterilir:
  ┌────────────────────────────────────┐
  │ Standart Paket                     │
  │ Normal fiyat:  10.000 ₺/ay        │
  │ Kampanya kodu: HOSGELDIN50  ✓      │
  │ İndirim:       -5.000 ₺           │
  │ ─────────────────────────          │
  │ Ödenecek tutar: 5.000 ₺/ay        │
  │ (Sonraki aydan 10.000 ₺)          │
  │ [Ödemeye Geç]                      │
  └────────────────────────────────────┘
        ↓
Ödeme tamamlanır → kampanya kaydı oluşur
→ campaigns_usage tablosuna log düşer
→ campaign.used_count +1 artar
```

#### 7.6.3 Kampanya Kuralları

| Kural | Açıklama |
|---|---|
| Tek kullanım | Bir hizmet veren aynı kodu sadece 1 kez kullanabilir |
| Yalnızca ilk ay | İndirim sadece aboneliğin ilk ayına uygulanır — sonraki aylar normal fiyat |
| Paket kısıtı | Kampanya belirli paketlere özel olabilir (örn. sadece VIP için) |
| Yeni üye kısıtı | `new_only: true` ise daha önce abone olmamış HV'lere geçerli |
| Geçerlilik süresi | `valid_until` tarihi geçmişse kod kabul edilmez |
| Maksimum kullanım | `max_uses` dolunca kod otomatik devre dışı |
| Birleştirme yasağı | Aynı anda birden fazla kampanya kodu uygulanamaz |

#### 7.6.4 Ücretsiz Deneme (Free Trial) Akışı

```
HV → "14 Gün Ücretsiz Dene" seçer
        ↓
Kart bilgisi alınır (iyzico — ama çekim yapılmaz)
        ↓
Abonelik "trial" statüsünde başlar
        ↓
14 gün boyunca seçilen paketin tam özellikleri açık
        ↓
13. gün → Hatırlatma bildirimi:
  "Deneme süreniz yarın bitiyor.
   İptal etmezseniz 10.000 ₺ ücret alınacak."
        ↓
14. gün:
  HV iptal ettiyse → Abonelik biter, ücret alınmaz
  HV iptal etmediyse → İlk ödeme otomatik çekilir
        ↓
Aynı HV ikinci kez trial kodu kullanamaz
```

#### 7.6.5 Admin Tarafından Verilen Panel Deneme Yetkisi

Admin, HV'ye kampanya kodu gerektirmeksizin doğrudan **1 aylık ücretsiz panel erişimi** verebilir.
Bu özellik özellikle yeni kayıt olan veya satış ekibi tarafından ikna edilen HV'lere hızlıca
panel deneyimi yaşatmak için tasarlanmıştır.

```
Admin / Satış Personeli → HV profil sayfasını açar
                                ↓
                   [Panel Denemesi Ver] butonuna tıklar
                                ↓
Paket seçilir (varsayılan: Standart)
Süre: 30 gün
Not: Opsiyonel dahili not (örn: "Satış görüşmesi sonrası verildi")
[Onayla]
                                ↓
Sistem işlemleri:
  → subscriptions tablosunda status='admin_trial' kaydı oluşur
  → expires_at = şimdiki zaman + 30 gün
  → Kota monthly_limit = seçilen pakete göre set edilir
  → HV'ye platform içi bildirim: "Panel deneme yetkiniz açıldı. 30 gün boyunca ücretsiz kullanabilirsiniz."
  → audit_logs'a kaydedilir: kim verdi, ne zaman, hangi pakete
                                ↓
30 gün sonra:
  → Otomatik cron → status='expired'
  → HV'ye platform içi bildirim: "Deneme süreniz sona erdi. Devam etmek için abone olun."
  → Panelde ödeme ekranı gösterilir
```

**Admin Tarafından Erken İptal:**

```
Admin → HV profil sayfası → "Aktif Deneme" bölümü
                    ↓
[Denemeyi İptal Et] tıklanır
                    ↓
Onay popup: "Bu HV'nin deneme yetkisini iptal etmek istiyor musunuz?"
                    ↓
Onaylanırsa:
  → status='cancelled' → HV anında panele erişemez
  → HV'ye platform içi bildirim: "Panel deneme yetkiniz iptal edildi."
  → audit_logs'a kaydedilir
```

**Kurallar:**

| Kural | Detay |
|---|---|
| Kart bilgisi gerekmez | Admin trial'da ödeme bilgisi alınmaz |
| Süre | 30 gün sabit (uzatma sadece admin yapabilir) |
| Uzatma | Aynı HV'ye tekrar admin trial verilebilir (audit'e kayıt düşer) |
| Yetki | Süper Admin, Ekip Lideri, Satış Personeli verebilir |
| İptal yetkisi | Süper Admin ve Ekip Lideri iptal edebilir |
| Trial → Abonelik | Trial sona erince HV normal paket satın alabilir |
| Kampanya kodu ile çakışma | Admin trial aktifken kampanya kodu uygulanamaz |

**Admin Paneli Görünümü (§15.8 Ödeme & Abonelik):**

```
── Aktif Admin Deneme Listesi ─────────────────────────
  HV Adı | Paket | Başlangıç | Bitiş | Veren Personel | [İptal]
  ──────────────────────────────────────────────────────
  Mehmet Usta | Standart | 01.02.2025 | 03.03.2025 | Ahmet (Satış) | [İptal]
  Fatma Hanım | Basic    | 15.02.2025 | 17.03.2025 | Süper Admin   | [İptal]
```

#### 7.6.6 Admin & Pazarlama — Kampanya Yönetimi

```
Pazarlama Personeli / Süper Admin paneli:

── Kampanya Oluştur ─────────────────────────────
  Kampanya Adı    : [Hoşgeldin Kampanyası        ]
  Kod             : [HOSGELDIN50                 ]
                    [Otomatik Üret]
  Tip             : ○ % İndirim  ○ TL İndirim
                    ○ Ücretsiz Deneme  ○ Paket Yükseltme
  Değer           : [50] %   (veya [2000] ₺ veya [14] gün)
  Geçerli Paketler: ☑ Basic  ☑ Standart  ☐ Premium  ☐ VIP
  Sadece Yeni Üye : ○ Evet  ○ Hayır
  Maksimum Kullanım: [500] (boş = sınırsız)
  Başlangıç Tarihi: [01.02.2025]
  Bitiş Tarihi    : [28.02.2025]
  Durum           : ○ Aktif  ○ Pasif
  [Kaydet]

── Kampanya Listesi ─────────────────────────────
  Kod | Tip | İndirim | Kullanım | Limit | Bitiş | Durum
  HOSGELDIN50 | %50 | 127/500 | 28.02 | Aktif | [Durdur]
  VIPDENEME   | 14 gün | 43/100 | 15.02 | Aktif | [Durdur]
  SUBAT2025   | 2000₺ | 500/500 | 28.02 | Doldu | —

── Kampanya Analitik ────────────────────────────
  En çok kullanılan kod | Dönüşüm oranı (kullanan/abone kalan)
  Churn oranı (trial sonrası iptal edenler)
  Kampanya başına gelir etkisi
```

#### 7.6.6 Satış Ekibi — Özel Kod Üretimi

Satış personeli hizmet verene özel, tek kullanımlık kod üretebilir:

```
Satış Personeli → CRM görünümünde HV profilini açar
               → [Özel Kod Üret] tıklar
               → Tip ve değer seçer
               → Sistem benzersiz kod üretir: STS-MEHMET-2025
               → Satış personeli telefon/e-posta ile HV'ye iletir
               → Kullanıldığında satış personelinin adına loglanır
```

Bu sayede satış personelinin performansı ölçülebilir:
kaç özel kod gönderildi → kaçı kullanıldı → kaçı abone kaldı.

#### 7.6.7 DB Tabloları

```sql
-- Kampanyalar
campaigns (
  id UUID PK,
  name VARCHAR,
  code VARCHAR(50) UNIQUE,
  type ENUM('percent','fixed','free_trial','upgrade'),
  value DECIMAL,               -- % veya TL veya gün sayısı
  upgrade_to ENUM('basic','standard','premium','vip') NULL,
  applicable_packages VARCHAR[], -- hangi paketlere uygulanır
  new_users_only BOOLEAN DEFAULT false,
  max_uses INT NULL,           -- NULL = sınırsız
  used_count INT DEFAULT 0,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_by UUID FK,          -- pazarlama veya satış personeli
  created_at TIMESTAMP
)

-- Kampanya Kullanım Logu
campaign_usage (
  id UUID PK,
  campaign_id UUID FK REFERENCES campaigns(id),
  provider_id UUID FK,         -- kullanan hizmet veren
  subscription_id UUID FK,     -- oluşturulan abonelik
  discount_amount DECIMAL,     -- uygulanan indirim tutarı (TL)
  used_at TIMESTAMP,
  created_by_staff UUID FK NULL -- satış personeli oluşturduysa
)
```

---

## 8. İLETİŞİM & MESAJLAŞMA SİSTEMİ

### 8.1 Genel Kural

Telefon numaraları varsayılan olarak **maskelenmiş** görünür.
Hizmet alan, telefon numarasını paylaşmadan önce platform içi mesajlaşma ile
hizmet verenlerle görüşür ve doğru kişiyi seçer. Numara yalnızca hizmet alan
**bilinçli olarak "Onaylıyorum"** dediğinde açılır.

### 8.2 Platform İçi Mesajlaşma (Yeni)

Hizmet alan, teklif veren hizmet verenlerle **telefon numarası açılmadan önce**
platform içinde mesajlaşabilir. Bu sayede:
- Fiyat müzakeresi yapabilir
- Tarih/saat netleştirebilir
- Hizmet kapsamını sorabilir
- Birden fazla HV'yi karşılaştırabilir

```
Hizmet Alan → Teklif listesini görür
                   ↓
           Her teklifte 2 buton:
           [💬 Mesaj Gönder]   [✅ Kabul Et]
                   ↓
[💬 Mesaj Gönder] seçilirse:
  → Platform içi sohbet penceresi açılır
  → Telefon numaraları hâlâ maskelenmiş
  → Metin mesajı, fotoğraf, ses notu gönderilebilir
  → Mesajlar panel bildirim olarak gelir
  → 5 HV ile aynı anda konuşulabilir
                   ↓
Uygun HV bulununca → [✅ Kabul Et] tıklanır
  → Onay popup'ı açılır (numara açılma bildirimi)
  → Telefon numaraları karşılıklı açılır
```

**Mesajlaşma Kuralları:**
- Mesajlaşma ücretsiz, limit yok
- Telefon numarası, e-posta, sosyal medya paylaşımı yasak (içerik filtresi)
- HV mesaja 2 saat içinde yanıt vermezse sistem uyarı gönderir
- Mesaj geçmişi taleple birlikte saklanır (90 gün)

### 8.3 Kabul Akışı (Güncellenmiş)

```
Hizmet alan → [✅ Kabul Et] tıklar
        ↓
ONAY POPUP'I:
┌──────────────────────────────────────────┐
│  ⚠️ Telefon Numarası Paylaşılacak       │
│                                          │
│  Mehmet Usta'yı kabul ettiğinizde        │
│  telefon numaranız karşılıklı olarak     │
│  açılacaktır.                            │
│                                          │
│  [Evet, Kabul Et]     [Vazgeç]          │
└──────────────────────────────────────────┘
        ↓
Onay verilirse:
  → accepted_offers kaydı oluşur
  → Telefon numaraları karşılıklı açılır
  → HV "Kazanılan İşler" ekranına taşınır
  → Her iki tarafa bildirim gider
```

**Kaç HV kabul edilebilir?**

| Durum | Kural |
|---|---|
| 1. kabul | Teklif accepted, numara açılır. Diğer teklifler hâlâ kabul edilebilir. |
| 2. kabul | Teklif accepted, numara açılır. Diğer teklifler hâlâ kabul edilebilir. |
| 3. kabul | Teklif accepted, numara açılır. Artık yeni kabul yapılamaz. |
| 3 kabul sonrası | İş "doldu" statüsüne girer. Diğer pending teklifler "Değerlendirilmedi" olur. |

> **Neden 3?** 2 HV'den biri uygunsuz çıkarsa (tarih doldu, fiyat yanlış anlaşıldı)
> hizmet alanın elinde hâlâ 1 yedek olur. Mesajlaşma ile önceden eleme yapılmışsa
> genellikle 1 kabul yeterli olacaktır.

### 8.4 Hizmet Veren Perspektifi

```
HV teklif verir
  → Hizmet alanın telefonu MASKELENMIŞ
  → HA mesaj gönderirse → platform bildirim gelir → yanıt verebilir
  → HA kabul ederse:
    - "Kazanılan İşler" ekranına taşınır
    - Müşterinin gerçek telefonu ve adı görünür
    - Bildirim: "Teklifiniz kabul edildi!" (Platform içi + E-posta)
  → HA kabul etmezse (mesajlaştı ama seçmedi):
    - Sohbet geçmişi kalır
    - Puan etkilenmez
    - İş kapanınca bildirim: "Bu iş için başka bir hizmet veren seçildi."
```

### 8.5 Telefon Maskeleme Teknik Yapısı

- Telefon numaraları veritabanında **şifrelenmiş** saklanır (AES-256)
- Frontend'e maskelenmiş format gönderilir: `0532 *** ** 78`
- Numara açma yetkisi backend'de kontrol edilir:
  - Hizmet alan: `accepted_offers` tablosunda kayıt var mı?
  - Hizmet veren: `offer_status = accepted` mı?
- Numara açma işlemleri `phone_reveal_logs` tablosuna loglanır (KVKK gereği)

---

### 8.7 DB Tabloları (Mesajlaşma)

```sql
-- Platform içi mesajlar
messages (
  id UUID PK,
  job_id UUID FK REFERENCES service_requests(id),
  offer_id UUID FK REFERENCES offers(id),
  sender_id UUID FK REFERENCES users(id),
  receiver_id UUID FK REFERENCES users(id),
  content TEXT,
  content_type ENUM('text','image','audio') DEFAULT 'text',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP
)
```

---

## 9. PUAN & GÜVEN SİSTEMİ

### 9.1 Değerlendirme

- Hizmet tamamlandıktan sonra hizmet alan puan verir ve yorum bırakır
- Yorumlar **admin onayına** tabidir — yayınlanmadan önce incelenir (bkz. Bölüm 10)
- Puan: 1–5 yıldız

### 9.2 Görünürlük Kuralları

| Puan Aralığı | Sonuç |
|---|---|
| 4.5 – 5.0 | Normal/yüksek görünürlük |
| 3.5 – 4.4 | Orta görünürlük |
| 2.5 – 3.4 | Düşük görünürlük |
| 2.4 ve altı | Admin uyarı süreci başlar |
| Sürekli düşük puan | Sistemden kaldırma |

### 9.3 Profil Kartında Gösterilenler

- Ortalama puan (yıldız)
- Toplam tamamlanan iş sayısı
- Kalite puanı rozeti (admin tanımlı)
- Garanti durumu (varsa)
- Onaylı yorumlar

---

## 10. ANLAŞMAZLIK & ŞİKÂYET MEKANİZMASI

### 10.1 Yorum Doğrulama Süreci

Sahte yorum ve manipülasyonu önlemek için **üç katmanlı doğrulama** uygulanır:

#### Adım 1 — Belge Zorunluluğu

Hizmet tamamlandığında yorum yapabilmek için:

- **Zorunlu:** Hizmet bedeline ait **fatura veya fiş fotoğrafı** yüklenmesi gerekir
- Desteklenen formatlar: JPG, PNG, PDF
- Belge olmadan yorum formu gösterilmez

#### Adım 2 — Admin İncelemesi

```
Kullanıcı yorum + belge gönderir
        ↓
Yorum "İncelemede" statüsüne girer (yayınlanmaz)
        ↓
Admin panel → Yorum Onay Kuyruğu'na düşer
        ↓
Admin: Belgeyi inceler → Tutarlılığı kontrol eder
        ↓
Onaylarsa → Yorum yayınlanır
Reddederse → Kullanıcıya bildirim (sebep belirtilerek)
```

#### Adım 3 — Müşteri Arama Doğrulaması

- Admin veya operatör ekibi yorum yapan kullanıcıyı **telefonla arar**
- Hizmet gerçekten alındı mı? Memnuniyetsizlik nedeni nedir?
- Arama kaydı `review_verifications` tablosuna loglanır
- Arama yapılamazsa (3 deneme) → Belge yeterliyse yorum onaylanabilir

### 10.2 Şikayet Akışı

```
Kullanıcı → Panel üzerinden şikayet oluşturur
         → Şikayet kategorisi seçer:
           · Hizmet yapılmadı
           · Kalitesiz hizmet
           · Fiyat anlaşmazlığı
           · Diğer
        ↓
Şikayet admin paneline düşer
        ↓
Admin → 24 saat içinde inceleme başlatır
      → Gerekirse her iki tarafı da arar
      → Karar verir:
          · Hizmet veren uyarılır
          · Hizmet veren askıya alınır
          · Şikayet reddedilir (gerekçesiyle)
        ↓
Her iki taraf platform içi bildirim ve e-posta ile bilgilendirilir
```

### 10.3 Haksız Kaldırma Senaryolarına Karşı Koruma

| Senaryo | Önlem |
|---|---|
| Rakip yorum bombardımanı | Belge zorunluluğu + telefon doğrulaması |
| Sahte fatura yükleme | Admin fatura tutarlılık kontrolü |
| Kullanıcı hizmet aldı ama olumsuz yorum bıraktı | Telefon görüşmesi ile doğrulama |
| Hizmet veren haksız kaldırılma talep eder | Admin inceleme süreci (itiraz hakkı) |

Hizmet veren, kendine yapılan yoruma **itiraz** edebilir. İtiraz admin kuyruğuna girer, inceleme sonucu her iki taraf bilgilendirilir.

### 10.4 Şikayet Tabloları

```sql
complaints (id, job_id, reporter_id, reported_id, category, description, status, created_at)
review_verifications (id, review_id, verified_by, call_attempt, call_result, verified_at)
```

---

## 11. AKILLI DAĞITIM ALGORİTMASI

İş dağıtımında kullanılan faktörler ve ağırlıkları:

| Faktör | Ağırlık |
|---|---|
| Paket seviyesi (VIP > Premium > Standart > Basic) | %35 |
| Ortalama kullanıcı puanı | %25 |
| Cevap verme hızı (son 30 gün ortalaması) | %20 |
| Lokasyon yakınlığı | %15 |
| Aktiflik süresi (platformdaki toplam süre) | %5 |

### Dağıtım Kuralları

- Her talep maksimum **5–7 hizmet verene** gösterilir
- Aynı iş aynı hizmet verene iki kez gösterilmez
- Düşük puanlı hizmet verenler bazı kategorilerde hiç iş almayabilir
- Yeni kayıtlı hizmet verenler ilk 30 gün "yeni üye" bonusu ile başlangıç işleri alır

---

## 12. KVKK & HUKUKİ UYUMLULUK

### 12.1 Açık Rıza & KVKK Onay Akışı

Web veya mobil uygulama üzerinden platforma ilk girişte kullanıcıya aşağıdaki metinler sunulur. **Onay vermeden platform kullanılamaz.**

---

### AÇIK RIZA METNİ

**[Platform Adı] Kişisel Veri İşleme Açık Rızası**

**Veri Sorumlusu:** [Şirket Adı] — [Adres] — [E-posta]

Aşağıda belirtilen kişisel verileriniz, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında açık rızanıza dayanılarak işlenecektir:

**İşlenen Kişisel Veriler:**
- Kimlik bilgileri (ad, soyad)
- İletişim bilgileri (telefon numarası, e-posta adresi)
- Konum bilgisi (hizmet bölgesi)
- İşlem geçmişi (talepler, teklifler, ödemeler)
- Değerlendirme ve yorumlar

**İşleme Amaçları:**
- Hizmet eşleştirme platformunun işletilmesi
- Hizmet veren ile hizmet alan arasında iletişimin sağlanması
- Ödeme süreçlerinin yürütülmesi
- Platform güvenliğinin sağlanması
- Yasal yükümlülüklerin yerine getirilmesi

**Veri Saklama Süreleri:**

| Veri Türü | Saklama Süresi |
|---|---|
| Hesap bilgileri | Üyelik süresince + 3 yıl |
| İşlem ve ödeme kayıtları | 10 yıl (Türk Ticaret Kanunu gereği) |
| İletişim logları | 2 yıl |
| Yorum ve değerlendirmeler | Üyelik süresince |
| Telefon açılma logları | 2 yıl |

**Yurt Dışı Veri Aktarımı:**
Yapay zeka hizmetleri kapsamında kişisel olmayan/anonimleştirilmiş veriler OpenAI altyapısına aktarılabilir. Kişisel verileriniz (ad, telefon, adres) AI sistemine **gönderilmez**.

**KVKK Kapsamındaki Haklarınız (Madde 11):**
Kişisel verilerinize ilişkin; bilgi alma, düzeltme, silme, işlemeye itiraz etme ve taşınabilirlik haklarını [kvkk@platformadi.com] adresine yazılı başvuru ile kullanabilirsiniz.

☐ Kişisel verilerimin yukarıda belirtilen amaçlarla işlenmesine **açık rıza veriyorum**.

☐ Ticari elektronik ileti (e-posta) gönderilmesine onay veriyorum. *(İsteğe bağlı)*

**[Onayla ve Devam Et]**

---

### 12.2 Veri Silme Süreci

Kullanıcı "Hesabımı Sil" talebinde bulunduğunda:

```
Kullanıcı silme talebi oluşturur (Panel → Ayarlar → Hesabı Sil)
        ↓
Uygulama içi OTP ile doğrulama kodu gönderilir
        ↓
Kullanıcı doğrular
        ↓
Sistem kontrol eder:
  - Aktif abonelik var mı? → Bilgilendirme yapılır
  - Devam eden iş/teklif var mı? → Tamamlanması beklenir veya iptal onayı istenir
        ↓
Silme işlemi başlar:
  - Kişisel veriler anonimleştirilir (ad → "Eski Kullanıcı", telefon → null)
  - Yasal saklama süresi olan kayıtlar (ödeme/fatura) silinmez, anonimleştirilir
  - 30 gün içinde fiziksel silme tamamlanır
        ↓
Kullanıcıya silme teyit e-postası gönderilir
```

> **Not:** Türk Ticaret Kanunu gereği ödeme ve fatura kayıtları 10 yıl saklanmak zorundadır. Bu kayıtlar anonimleştirilir ancak tamamen silinemez. Kullanıcı bu konuda bilgilendirilir.

### 12.3 Teknik KVKK Önlemleri

- Telefon numaraları AES-256 ile şifrelenmiş saklanır
- Her telefon açılma işlemi loglanır (kim, ne zaman, hangi talep için)
- Veri erişim logları 2 yıl tutulur
- Platform içi veri transferleri SSL/TLS ile şifrelenir
- Veritabanı yedeği Türkiye'deki sunucularda tutulur (KVKK Madde 9 uyumu)

---

## 13. AI CHAT GÜVENLİĞİ

### 13.1 LLM Entegrasyonu

- **Model:** OpenAI GPT-4o (birincil) / GPT-4o Mini (maliyet optimizasyonu)
- **Erişim:** OpenAI API (Cloud) — özel deployment değil
- **Kişisel veri izolasyonu:** Kullanıcının adı, telefonu, adresi **sistem promptuna veya API'ye gönderilmez**

### 13.2 Kişisel Veri Koruması

```
Kullanıcı mesajı gelir
        ↓
Backend PII (Personally Identifiable Information) tespiti yapar
  → Ad, telefon, TC kimlik, adres → AI'ya GÖNDERİLMEZ
  → Sadece hizmet içeriği (ne yapılsın, nerede, ne zaman) AI'ya iletilir
        ↓
AI yalnızca hizmet formunu doldurmak için çalışır
        ↓
Form tamamlanınca backend kişisel bilgileri forma ekler
        ↓
Kullanıcıya onay için gönderilir
```

### 13.3 Güvenlik Önlemleri

| Risk | Önlem |
|---|---|
| Prompt injection | Kullanıcı girdisi her zaman "user" rolünde, sistem promptu ayrı tutulur |
| Jailbreak | System prompt'ta kısıtlayıcı kurallar + output moderasyon |
| Veri sızıntısı | Conversation log'ları şifrelenmiş saklanır, 30 gün sonra temizlenir |
| Maliyet kontrolü | Her konuşma için max_tokens sınırı, günlük kullanıcı başına token limiti |
| API key güvenliği | Key backend'de, environment variable olarak saklanır — frontend'e expose edilmez |

### 13.4 AI Konuşma State Yönetimi

```
Redis Key: ai_session:{user_id}:{session_id}
TTL: 86400 saniye (24 saat)
İçerik: {messages: [], collected_data: {}, step: "service_type|details|name|otp|confirm"}
```

- Kullanıcı 24 saat sonra dönerse yeni oturum başlar
- Tamamlanmış oturumlar Redis'ten silinir, yalnızca form verisi PostgreSQL'e yazılır

---

## 13.5 Canlı Teklif Akışı (WebSocket)

Chat ekranında tekliflerin gerçek zamanlı düşmesi için WebSocket (Socket.io) kullanılır.

```
Hizmet veren teklif verir
        ↓
Backend: offer.created event tetiklenir
        ↓
Socket.io → ilgili kullanıcının room'una emit eder
  room: "job_{jobId}"
        ↓
Kullanıcının açık chat ekranına:
  { type: "new_offer", provider: {...}, price: 800, offerId: "..." }
        ↓
Frontend: Chat balonuna render eder
  🔔 Ahmet Usta — 800 TL [Profili Gör] [Kabul Et]

Kullanıcı sayfada değilse (tab kapalı):
  → Push notification gönderilir (FCM): "Yeni teklif geldi!"
  → Bildirime tıklayınca doğrudan chat ekranına döner
```

**Room Yapısı:**
```
job_{jobId}   → İlgili talep odası (kullanıcı + sistem)
user_{userId} → Kullanıcıya özel bildirimler
admin_{staffId} → Admin panel anlık uyarılar
```

---

## 14. BİLDİRİM SİSTEMİ

### 14.1 Genel Mimari

Tüm bildirimler merkezi bir **Notification Service** üzerinden iletilir.
Bu servis BullMQ kuyruğuna iş yazar, consumer'lar kanalları tetikler.

```
Tetikleyici Event (backend)
        ↓
Notification Queue (BullMQ / Redis)
        ↓
Consumer → Kanal seçimi (kullanıcı tercihi + olay tipi)
        ↓
Platform İçi │ E-posta │ Push (mobil)
        ↓
notification_logs tablosuna kayıt
```

**Kanal Öncelik Sırası:**

| Kullanıcı Tipi | Birincil | İkincil | Üçüncül |
|---|---|---|---|
| Hizmet Alan | Platform İçi (In-App) | SMS (yalnızca OTP) | Push (mobil) | E-posta |
| Hizmet Veren | Platform İçi (In-App) | SMS (yalnızca OTP) | Push (mobil) | E-posta |
| Admin | E-posta | — | — |

> **WhatsApp entegrasyonu yoktur.** SMS yalnızca OTP doğrulama için kullanılır (Netgsm). Diğer tüm bildirimler platform içi, push notification veya e-posta üzerinden iletilir.
> Platform İçi bildirimleri web ve mobil uygulamada anlık olarak gösterilir (WebSocket + Push).

---

### 14.2 Hizmet Alan — Bildirim Tablosu

| # | Olay | Kanal | Zamanlama | Mesaj Özeti |
|---|---|---|---|---|
| HA-01 | Talep oluşturuldu | Platform İçi + Push | Anında | "Talebiniz alındı, hizmet verenler aranıyor." |
| HA-02 | İlk teklif geldi | Platform İçi + Push | Anında | "Talebinize ilk teklif geldi! Panelden inceleyin." |
| HA-03 | Yeni teklif geldi (2+) | Platform İçi + Push | Her 3 teklifte bir | "X yeni teklif daha geldi." |
| HA-04 | Teklif kabul onayı | Platform İçi + Push | Anında (onay popup sonrası) | "Hizmet veren seçildi. İletişim bilgileri açıldı." |
| HA-05 | 3. kabul tamamlandı (iş doldu) | Platform İçi + Push | Anında | "3 hizmet vereninizi seçtiniz. Artık sizi arayabilirler." |
| HA-05b | HV'den yeni mesaj geldi | Platform İçi + Push | Anında | "Mehmet Usta size mesaj gönderdi." |
| HA-06 | Talep 24 saat içinde teklif almadı | Platform İçi + Push | 24. saatte | "Talebinize henüz teklif gelmedi. Güncelleme ister misiniz?" |
| HA-07 | Talep 48 saat sonra kapanıyor | Platform İçi + Push | 46. saatte | "Talebiniz yarın kapanacak." |
| HA-08 | İş tamamlandı — NPS anketi | Platform İçi + Push | İş onayından 30 dakika sonra | "0-10 arası puan verir misiniz?" |
| HA-09 | NPS takip — düşük puan (0-6) | Platform İçi + Push | HA-08'den 10 dk sonra (puan ≤6 ise) | "Yaşadığınız sorunu öğrenebilir miyiz?" |
| HA-10 | İş tamamlandı — yorum daveti | Platform İçi + Push + E-posta | İş onayından 2 saat sonra | "Hizmetinizi değerlendirin, fatura yükleyin." |
| HA-11 | Şikayet durumu güncellendi | Platform İçi + E-posta | Karar sonrası | "Şikayetiniz hakkında karar verildi." |
| HA-12 | KVKK / Hesap silme teyidi | E-posta | Talep anında | "Hesap silme talebiniz alındı." |

---

### 14.3 Hizmet Veren — Bildirim Tablosu

| # | Olay | Kanal | Zamanlama | Mesaj Özeti |
|---|---|---|---|---|
| HV-01 | Yeni iş düştü | Platform İçi + Push | Anında | "Yeni iş: [Kategori] — [İlçe]. Hemen incele!" |
| HV-02 | Teklifiniz kabul edildi | Platform İçi + Push | Anında | "Tebrikler! Müşteri sizi seçti. İletişim bilgileri açıldı." |
| HV-02b | Hizmet alandan yeni mesaj | Platform İçi + Push | Anında | "Müşteri size mesaj gönderdi." |
| HV-03 | Teklifiniz reddedildi | Platform İçi | Anında | "Bu iş için başka bir hizmet veren seçildi." |
| HV-04 | Aylık kota %80 doldu | Platform İçi + Push | Eşik aşılınca | "Bu ay kabul kotanızın %80'ini kullandınız. (X/Y)" |
| HV-05 | Aylık kota doldu | Platform İçi + Push | Anında | "Bu ay kotanız doldu. Yeni paket için tıklayın." |
| HV-06 | Kota yeni ay başında sıfırlandı | Platform İçi | Her ayın 1'i | "Yeni ay, yeni kota! Bu ay X iş alabilirsiniz." |
| HV-07 | Abonelik yenilendi | E-posta | Ödeme sonrası | "Aboneliğiniz yenilendi. Fatura ekte." |
| HV-08 | Ödeme başarısız | Platform İçi + Push + E-posta | Anında | "Ödemeniz alınamadı. Kartınızı güncelleyin." |
| HV-09 | 2. ödeme denemesi başarısız | Platform İçi + Push + E-posta | 3. gün | "Son uyarı: Aboneliğiniz askıya alınabilir." |
| HV-10 | Abonelik askıya alındı | Platform İçi + Push + E-posta | Anında | "Aboneliğiniz askıya alındı. Yeniden aktifleştirin." |
| HV-11 | Yeni yorum geldi | Platform İçi + E-posta | Anında | "Yeni bir değerlendirme aldınız: X yıldız." |
| HV-12 | Yorum onaylandı / reddedildi | E-posta + Platform İçi | Admin kararı sonrası | "Yorumunuz hakkında karar verildi." |
| HV-13 | Şikayet açıldı (hakkında) | E-posta + Platform İçi | Anında | "Hakkınızda bir şikayet açıldı. İnceleniyor." |
| HV-14 | Admin onayı tamamlandı (yeni kayıt) | Platform İçi + Push + E-posta | Onay sonrası | "Hesabınız onaylandı! Artık teklif verebilirsiniz." |
| HV-15 | Admin onayı reddedildi | E-posta | Red sonrası | "Başvurunuz reddedildi. Detaylar için iletişime geçin." |
| HV-16 | Puan uyarısı (eşik altına düştü) | E-posta | Otomatik | "Puanınız kritik eşiğin altına düştü." |
| HV-17 | Kampanya kodu başarıyla uygulandı | E-posta | Ödeme sonrası | "Kampanya kodunuz uygulandı. [X] indirim kazandınız." |
| HV-18 | Ücretsiz deneme bitiyor (1 gün kaldı) | Platform İçi + Push + E-posta | 13. gün | "Deneme süreniz yarın bitiyor." |
| HV-19 | Admin panel denemesi verildi | Platform İçi + Push | Anında | "30 günlük panel deneme yetkiniz açıldı." |
| HV-20 | Admin panel denemesi iptal edildi | Platform İçi + Push | Anında | "Panel deneme yetkiniz iptal edildi." |
| HV-21 | Admin panel denemesi bitiyor (3 gün kaldı) | Platform İçi + Push | 27. gün | "Deneme süreniz 3 gün içinde dolacak." |

---

### 14.4 Admin — Bildirim Tablosu

| # | Olay | Kanal | Zamanlama |
|---|---|---|---|
| AD-01 | Yeni hizmet veren kayıt oldu | E-posta | Anında |
| AD-02 | Yorum onay bekliyor | E-posta (özet) | Günde 1 (09:00) |
| AD-03 | Yeni şikayet açıldı | E-posta | Anında |
| AD-04 | Ödeme başarısız (toplu) | E-posta (özet) | Günde 1 (08:00) |
| AD-05 | Hizmet veren puan kritik eşik altı | E-posta | Anında |
| AD-06 | NPS skoru 7 günlük ortalama düşüşü | E-posta (özet) | Pazartesi 08:00 |
| AD-07 | Detraktör alarmı (0-3 puan) — 3+ aynı HV | E-posta | Anında |

---

### 14.5 Push Notification Başlık Şablonları

Mobil uygulama push bildirimleri için başlık/içerik şablonları (Firebase FCM):

**SMS Şablonları (Netgsm — yalnızca OTP):**

| Şablon | İçerik | Kullanım |
|---|---|---|
| `sms_otp_kayit` | "Esnaaf kayıt kodunuz: {code}. 5 dakika geçerlidir." | Yeni kayıt |
| `sms_otp_giris` | "Esnaaf giriş kodunuz: {code}. 5 dakika geçerlidir." | Mevcut kullanıcı girişi |
| `sms_otp_anonim` | "Esnaaf doğrulama kodunuz: {code}." | Anonim chat sonrası kayıt |

**Push Bildirim Şablonları (FCM):**

| Şablon Kodu | Başlık | Kullanım |
|---|---|---|
| `push_talep_olusturuldu` | "Talebiniz alındı 🎉" | HA-01 |
| `push_teklif_geldi` | "Yeni teklif var!" | HA-02 |
| `push_teklif_kabul` | "Hizmet veren seçildi ✅" | HA-04 |
| `push_yeni_mesaj_ha` | "Ustanızdan mesaj var 💬" | HA-05b |
| `push_talep_kapaniyor` | "Talebiniz kapanmak üzere ⏰" | HA-07 |
| `push_nps_anketi` | "Hizmetinizi değerlendirin ⭐" | HA-08 |
| `push_yeni_is` | "Yeni iş talebi! 🔔" | HV-01 |
| `push_teklif_kabul_hv` | "Müşteri sizi seçti! 🎯" | HV-02 |
| `push_yeni_mesaj_hv` | "Müşteriden mesaj var 💬" | HV-02b |
| `push_kota_dolmak_uzere` | "Kota %80 doldu" | HV-04 |
| `push_kota_doldu` | "Aylık kotanız doldu" | HV-05 |
| `push_odeme_basarisiz` | "Ödeme alınamadı ⚠️" | HV-08 |
| `push_abonelik_askida` | "Aboneliğiniz askıya alındı" | HV-10 |
| `push_hesap_onaylandi` | "Hesabınız onaylandı! 🎉" | HV-14 |
| `push_trial_bitiyor` | "Deneme süreniz bitiyor ⏳" | HV-18 |

---

### 14.6 Bildirim Tercihleri

Kullanıcı panel üzerinden kanal tercihini yönetebilir:

```
Panel → Ayarlar → Bildirim Tercihleri

Hizmet Alan:
  ☑ Platform içi bildirimler
  ☑ Push bildirimleri (mobil uygulama)
  ☐ E-posta bildirimleri (pazarlama)
  ☑ E-posta bildirimleri (işlem)  ← devre dışı bırakılamaz

Hizmet Veren:
  ☑ Platform içi bildirimler
  ☑ Push bildirimleri (mobil)
  ☑ E-posta bildirimleri (işlem)  ← devre dışı bırakılamaz
  ☐ E-posta bildirimleri (pazarlama)
```

> **Kural:** İşlem bildirimleri (ödeme, kabul, güvenlik) hiçbir zaman devre dışı bırakılamaz.
> Pazarlama bildirimleri KVKK kapsamında opsiyonel onaya tabidir.

---

### 14.7 NPS Sistemi — Detaylı Akış

#### Adım 1 — Otomatik NPS Anketi (HA-08)

İş tamamlama onayı tamamlandıktan 30 dakika sonra sistem otomatik tetikler.
Anket **platform içi** olarak gösterilir (web ve mobil uygulama popup'ı).
Kullanıcı o an platformda değilse **push notification** ile bildirim gönderilir: "Hizmetinizi değerlendirmek için giriş yapın."

```
┌──────────────────────────────────────────┐
│  ⭐ Hizmet Değerlendirmesi               │
├──────────────────────────────────────────┤
│  Merhaba [Ad],                           │
│                                          │
│  [Hizmet Kategorisi] hizmetiniz          │
│  tamamlandı.                             │
│                                          │
│  Mehmet Usta ile yaşadığınız deneyimi    │
│  0 ile 10 arasında puanlar mısınız?      │
│                                          │
│  [0][1][2][3][4][5][6][7][8][9][10]     │
└──────────────────────────────────────────┘
```

#### Adım 2 — Kullanıcı Yanıtı İşleme

```
Kullanıcı rakam yazar (0-10)
        ↓
Platform içi mesaj → backend'e iletir
        ↓
nps_responses tablosuna kaydedilir
        ↓
Puan grubuna göre aksiyon:

  0–3  → Detraktör  🔴
    → Teşekkür mesajı + "Ne oldu?" sorusu
    → Kalite personeline ANLIK alarm (call_tasks)
    → Hizmet veren sağlık skoru düşer

  4–6  → Pasif      🟡
    → Teşekkür mesajı + "Nasıl daha iyi olabilirdik?" sorusu
    → Kalite personeline NORMAL öncelik görevi

  7–10 → Promoter   🟢
    → Teşekkür mesajı + yorum daveti linki
    → Hizmet veren sağlık skoru artar
```

#### Adım 3 — Düşük Puan Takip (HA-09, puan ≤ 6 ise)

Platform içi olarak gösterilir — NPS popup'ı kapandıktan sonra metin kutusu açılır:

```
┌──────────────────────────────────────────┐
│  Geri bildiriminiz için teşekkürler.     │
│                                          │
│  Yaşadığınız sorunu kısaca anlatır       │
│  mısınız? Ekibimiz sizi arayacak.        │
│                                          │
│  [______________________________]        │
│  [Gönder]          [Şimdi Değil]        │
└──────────────────────────────────────────┘
```

Kullanıcı gönderirse → metin `call_tasks` notuna eklenir
Kullanıcı "Şimdi Değil" seçerse veya 24 saat geçerse → görev kapatılır

#### Adım 4 — NPS Skoru Hesaplama

Standart NPS formülü:

```
NPS = (Promoter % ) − (Detraktör %)

Örnek:
  100 yanıt:
    Promoter (7-10): 60 kişi = %60
    Pasif    (4-6):  25 kişi = %25
    Detraktör(0-3):  15 kişi = %15

  NPS = 60 - 15 = 45  (İyi)

Skalası:
  -100 — 0   : Kötü
     0 — 30  : Geliştirilmeli
    30 — 70  : İyi
    70 — 100 : Mükemmel
```

#### Adım 5 — NPS Paneli (Admin & Yönetici)

```
── Platform Geneli ──────────────────────────────
  NPS Skoru: 54  (Son 30 gün)
  Yanıt Sayısı: 1.240 / 1.890 (%65 yanıt oranı)
  Promoter: %62  Pasif: %30  Detraktör: %8

── Trend Grafiği ────────────────────────────────
  Son 12 hafta NPS değişimi (çizgi grafik)

── Kategori Bazlı NPS ───────────────────────────
  Ev Temizliği : 61
  Boya Badana  : 48
  Nakliyat     : 52
  Su Tesisatı  : 44

── En Düşük Puanlı Hizmet Verenler ─────────────
  Ad | Ortalama NPS | Toplam Yanıt | Detraktör %
  (Ekip lideri buradan direkt uyarı gönderebilir)

── Detraktör Alarmları ──────────────────────────
  Aynı hizmet verenden 3+ detraktör (son 30 gün)
  → Otomatik ekip lideri bildirimi
```

---

### 14.8 Teknik Yapı

**API Endpoints:**

```
POST /notifications/send          → Manuel bildirim tetikleme (admin)
GET  /notifications/preferences   → Kullanıcı tercihleri
PUT  /notifications/preferences   → Tercih güncelle
GET  /notifications/history       → Bildirim geçmişi

── NPS ───────────────────────────────────────────────
POST /nps/respond                 → NPS puanı kaydet (platform içi)
GET  /nps/score                   → Platform geneli NPS skoru
GET  /nps/responses               → NPS yanıt listesi (admin)
GET  /nps/provider/:id            → Hizmet veren bazlı NPS
```

**DB Tablosu:**

```sql
notification_logs (
  id UUID PK,
  user_id UUID FK,
  event_code VARCHAR(10),     -- örn: HA-01, HV-02
  channel ENUM('in_app','sms','email','push'),
  status ENUM('sent','delivered','failed','pending'),
  message_id VARCHAR,         -- Push/E-posta sağlayıcı mesaj ID
  payload JSONB,              -- gönderilen mesaj içeriği
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP
)

notification_preferences (
  id UUID PK,
  user_id UUID FK UNIQUE,
  whatsapp_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  marketing_email BOOLEAN DEFAULT false,
  updated_at TIMESTAMP
)

nps_responses (
  id UUID PK,
  job_completion_id UUID FK,      -- hangi iş tamamlamasına ait
  seeker_id UUID FK,              -- puan veren hizmet alan
  provider_id UUID FK,            -- puan alan hizmet veren
  category_id UUID FK,            -- hizmet kategorisi
  score INT CHECK (score >= 0 AND score <= 10),
  group ENUM('promoter','passive','detractor'),
  follow_up_text TEXT,            -- kullanıcının yazdığı açıklama
  channel ENUM('whatsapp','web'), -- hangi kanaldan geldi
  responded_at TIMESTAMP,
  created_at TIMESTAMP            -- mesaj gönderilme zamanı
)
```

---

## 15. ADMIN PANEL

### 15.1 Modül Haritası

| # | Modül | Kaynak Modül | Öncelik |
|---|---|---|---|
| 1 | Dashboard | Tümü | Yüksek |
| 2 | Kullanıcı Yönetimi | M1 | Yüksek |
| 3 | Hizmet Veren Onay | M1 | Yüksek |
| 4 | Yorum Onay Kuyruğu | M5 | Yüksek |
| 5 | Şikayet Yönetimi | M5 | Yüksek |
| 6 | Talep İzleme | M2 | Orta |
| 7 | Ödeme & Abonelik | M4 | Orta |
| 8 | Paket Yönetimi | M4 | Orta |
| 9 | Performans & Analitik | Tümü | Orta |
| 10 | KVKK Talepleri | M1 | Orta |
| 11 | Bildirim Yönetimi | M-Notification | Düşük |

---

### 15.2 Dashboard (Ana Ekran)

Admin panele giriş yapıldığında gösterilen özet ekranı.

**Anlık Metrikler (otomatik yenilenir — 60 sn):**

```
┌─────────────────────────────────────────────────────┐
│  Bugün                                              │
│  Yeni Talep: 47    Yeni Kayıt: 12    Açık Şikayet: 3│
├─────────────────────────────────────────────────────┤
│  Bekleyen İşlemler                                  │
│  Onay Bekleyen Hizmet Veren: 8                      │
│  Onay Bekleyen Yorum: 23                            │
│  Çözüm Bekleyen Şikayet: 5                          │
│  KVKK Talebi: 2                                     │
├─────────────────────────────────────────────────────┤
│  Ödeme Durumu (Son 24 Saat)                         │
│  Başarılı: 34    Başarısız: 3    Bekleyen: 1        │
└─────────────────────────────────────────────────────┘
```

**Hızlı Erişim Butonları:**

- [Onay Kuyruğu] → Hizmet veren onay listesi
- [Yorum Kuyruğu] → İncelemede olan yorumlar
- [Açık Şikayetler] → Çözüm bekleyen şikayetler
- [Başarısız Ödemeler] → Manuel müdahale gereken ödemeler

---

### 15.3 Kullanıcı Yönetimi

**Liste Ekranı — Filtreler:**

```
Arama: [ isim / telefon / e-posta ]
Rol:   [ Tümü | Hizmet Alan | Hizmet Veren | Admin ]
Durum: [ Tümü | Aktif | Pasif | Banlı ]
Tarih: [ Kayıt tarihi aralığı ]
```

**Her kullanıcı satırında:**

```
Ad Soyad | Telefon (maskelenmiş) | Rol | Kayıt Tarihi | Durum | [Detay]
```

**Kullanıcı Detay Sayfası:**

```
── Kişisel Bilgiler ─────────────────────────────────
  Ad, telefon (tam), e-posta, kayıt tarihi
  KVKK onay tarihi, pazarlama onayı

── Aktivite Özeti ───────────────────────────────────
  Toplam talep sayısı (hizmet alan için)
  Toplam teklif / kazanılan iş (hizmet veren için)
  Son giriş tarihi

── İşlemler ─────────────────────────────────────────
  [Aktif/Pasif Yap]  [Banla]  [Zorla Sil (KVKK)]
  [Şifremi Sıfırla]  [Notlar Ekle]
```

**Ban İşlemi Akışı:**

```
Admin [Banla] tıklar
        ↓
Sebep seçilir: Sahte profil / Kötüye kullanım / Ödeme sorunu / Diğer
        ↓
Onay popup: "Bu kullanıcı banlanacak, onaylıyor musunuz?"
        ↓
Ban uygulanır → Kullanıcıya bildirim (e-posta)
        ↓
Ban kaydı activity_logs'a düşer
```

---

### 15.4 Hizmet Veren Onay

**Liste Ekranı:**

```
Filtre: [ Bekleyen | Onaylı | Reddedilen ]
Sıralama: [ En yeni | En eski ]

Her satır:
Ad Soyad | Kategori | Başvuru Tarihi | Belge Durumu | [İncele]
```

**Detay & Onay Akışı:**

```
Admin [İncele] tıklar
        ↓
Detay sayfası açılır:
  ── Kişisel Bilgiler ─────────────────────────
    Ad, telefon, e-posta, adres
  ── Seçilen Kategoriler ──────────────────────
    [ Ev Temizliği ] [ Boya Badana ] ...
  ── Yüklenen Belgeler ────────────────────────
    Kimlik: [Görüntüle]
    Vergi/Ticaret Sicil: [Görüntüle]  (opsiyonel)
  ── Admin Notu ───────────────────────────────
    [ Notlar alanı ]
        ↓
[Onayla] veya [Reddet + Sebep Yaz]
        ↓
Onayla → HV-14 bildirimi (Platform içi + Push + E-posta)
Reddet → HV-15 bildirimi (e-posta) + sebep iletilir
```

**Red Sebep Şablonları:**

| Kod | Sebep |
|---|---|
| R01 | Kimlik belgesi eksik veya okunamaz |
| R02 | Verilen bilgiler doğrulanamadı |
| R03 | Hizmet kategorisi uygun değil |
| R04 | Daha önce banlı hesap |
| R05 | Diğer (serbest metin) |

---

### 15.5 Yorum Onay Kuyruğu

**Liste Ekranı:**

```
Sıralama: Tarih (en eski önce — FIFO)
Filtre: [ Bekleyen | Onaylı | Reddedilen | İtiraz Var ]

Her satır:
Müşteri Adı | Hizmet Veren | Puan ★ | Yorum (kısa) | Belge | Tarih | [İncele]
```

**Detay & Onay Akışı:**

```
Admin [İncele] tıklar
        ↓
┌─────────────────────────────────────────────────┐
│ Yorum Detayı                                    │
│ Müşteri: Ahmet Y.   Hizmet Veren: Mehmet Usta  │
│ Hizmet: Ev Temizliği   Tarih: 15.01.2025       │
│ Puan: ★★★★☆ (4/5)                              │
│ Yorum: "Zamanında geldi, temiz iş yaptı..."    │
├─────────────────────────────────────────────────┤
│ Yüklenen Belge                                  │
│ [Fatura/Fiş Görüntüle →]                       │
│ Belge tipi: Fatura  Tarih: 15.01.2025          │
│ Tutar: 850 TL  (hizmet fiyatıyla tutarlı mı?)  │
├─────────────────────────────────────────────────┤
│ Telefon Doğrulama                               │
│ Durum: Henüz aranmadı                          │
│ [Arama Kaydı Ekle ▼]                           │
│   Sonuç: ○ Ulaşıldı  ○ Ulaşılamadı  ○ Mesaj   │
│   Not: [____________]                           │
├─────────────────────────────────────────────────┤
│ [✓ Onayla]   [✗ Reddet]   [⚑ Daha Sonra]      │
└─────────────────────────────────────────────────┘
        ↓
Onayla → Yorum yayınlanır, hizmet veren ortalama puanı güncellenir
Reddet → Sebep seçilir, kullanıcıya bildirim gönderilir
```

**Red Sebep Şablonları:**

| Kod | Sebep |
|---|---|
| Y01 | Belge yüklenmemiş veya geçersiz |
| Y02 | Belge ile yorum tarihi uyuşmuyor |
| Y03 | Yorum içeriği uygunsuz |
| Y04 | Sahte yorum şüphesi |
| Y05 | Müşteriye ulaşılamadı (3 deneme) |

**İtiraz Akışı:**

```
Hizmet veren yoruma itiraz eder (POST /reviews/:id/appeal)
        ↓
Yorum "İtiraz Var" statüsüne geçer
        ↓
Admin kuyruğunda [İtiraz Var] filtresiyle görünür
        ↓
Admin her iki tarafın bilgisini inceler
        ↓
Karar: [Yorumu Kaldır] veya [İtirazı Reddet]
        ↓
Her iki tarafa bildirim gönderilir
```

---

### 15.6 Şikayet Yönetimi

**Liste Ekranı:**

```
Filtre: [ Açık | İncelemede | Çözüldü | Reddedildi ]
Sıralama: Tarih (en eski açık önce)
SLA: 24 saat içinde ilk yanıt — geçen süreler kırmızıyla işaretlenir

Her satır:
Şikayet No | Şikayetçi | Şikayet Edilen | Kategori | Durum | Geçen Süre | [İncele]
```

**Detay & Karar Akışı:**

```
Admin [İncele] tıklar
        ↓
┌─────────────────────────────────────────────────┐
│ Şikayet #1042                                   │
│ Şikayetçi: Ali K. (Hizmet Alan)                │
│ Hakkında: Mehmet Usta (Hizmet Veren)            │
│ Kategori: Hizmet yapılmadı                      │
│ Açıklama: "Belirlenen saatte gelmedi..."        │
│ İlgili İş: #JOB-887 — Ev Temizliği 20.01.2025  │
├─────────────────────────────────────────────────┤
│ İlgili İş Geçmişi                              │
│ Teklif: 850 TL  Kabul: 20.01.2025              │
│ Tamamlandı mı: Hayır                           │
├─────────────────────────────────────────────────┤
│ Admin Notu                                      │
│ [Her iki taraf da arandı / aranmadı]           │
│ [Notlar alanı]                                  │
├─────────────────────────────────────────────────┤
│ Karar                                           │
│ ○ Hizmet veren uyarıldı                        │
│ ○ Hizmet veren askıya alındı (X gün)           │
│ ○ Hizmet veren kalıcı kaldırıldı               │
│ ○ Şikayet reddedildi (gerekçe yaz)             │
│ [Kaydet ve Bildir]                              │
└─────────────────────────────────────────────────┘
        ↓
Her iki tarafa karar bildirimi gönderilir (e-posta)
```

**Hizmet Veren Ceza Skalası:**

| Şikayet Sayısı | Otomatik Aksiyon |
|---|---|
| 1. şikayet | Sadece kayıt — otomatik aksiyon yok |
| 2. şikayet (30 gün içinde) | Admin uyarı e-postası |
| 3. şikayet (60 gün içinde) | 7 gün otomatik askı + admin bildirimi |
| 4+ şikayet | Admin kararı zorunlu — kalıcı kaldırma riski |

---

### 15.7 Talep İzleme

**Liste Ekranı:**

```
Filtre: [ Tümü | Bekliyor | Dağıtıldı | Tamamlandı | İptal ]
Filtre: [ Kategori seç ] [ Şehir seç ] [ Tarih aralığı ]
Arama: [ Talep No / Müşteri adı ]

Her satır:
Talep No | Müşteri | Kategori | Şehir | Durum | Teklif Sayısı | Tarih | [Detay]
```

**Detay Sayfası:**

```
── Talep Bilgisi ────────────────────────────────────
  Kategori, lokasyon, tarih, form detayları

── Dağıtım Bilgisi ──────────────────────────────────
  Gönderildiği hizmet verenler: [liste]
  Teklif veren sayısı: X
  Kabul edilen: X

── Aksiyon ──────────────────────────────────────────
  [Zorla İptal Et]  [Not Ekle]
```

---

### 15.8 Ödeme & Abonelik Yönetimi

**Başarısız Ödemeler Ekranı:**

```
Filtre: [ 1. deneme başarısız | 2. deneme | Askıya alındı ]

Her satır:
Hizmet Veren | Paket | Tutar | Başarısız Tarih | Deneme # | [Detay]

Aksiyonlar:
[Manuel Yeniden Dene]  [Kullanıcıyı Ara (not ekle)]  [Aboneliği Sonlandır]
```

**Abonelik Listesi:**

```
Filtre: [ Aktif | İptal | Askıda | Süresi Dolmuş ]
Filtre: [ Paket tipi ]

Her satır:
Hizmet Veren | Paket | Başlangıç | Bitiş | Durum | [Detay]
```

---

### 15.9 Performans & Analitik

**Platform Özeti (tarih aralığı seçilebilir):**

```
── Talep Metrikleri ─────────────────────────────────
  Toplam talep | Tamamlanan | İptal | Ortalama teklif sayısı/talep

── Hizmet Veren Metrikleri ──────────────────────────
  Aktif hizmet veren | Ortalama puan | Ortalama yanıt süresi

── Gelir Metrikleri ─────────────────────────────────
  Aylık MRR (Monthly Recurring Revenue)
  Paket dağılımı: Basic X% | Standart X% | Premium X% | VIP X%
  Churn oranı (iptal eden / toplam)

── Kategori Performansı ─────────────────────────────
  En çok talep alan kategoriler (sıralı)
  En az talep alan kategoriler
```

**Hizmet Veren Performans Raporu:**

```
Sıralama: [ Puana göre | Yanıt hızına göre | İş sayısına göre ]

Her satır:
Hizmet Veren | Paket | Puan | Yanıt Süresi | Kabul Edilen İş | Şikayet Sayısı
```

---

### 15.10 KVKK Talepleri

**Liste Ekranı:**

```
Filtre: [ Bekleyen | İşleniyor | Tamamlandı ]
SLA: 30 gün — geçen süreler kırmızıyla işaretlenir

Her satır:
Başvuru No | Kullanıcı | Talep Tipi | Başvuru Tarihi | Durum | [İşle]
```

**Talep Tipleri:**

| Tip | Açıklama | İşlem |
|---|---|---|
| Bilgi Al | "Hakkımda ne var?" | Veri dışa aktarım dosyası hazırla |
| Düzelt | "Adım yanlış" | İlgili alanı güncelle |
| Sil | "Hesabımı sil" | Anonimleştirme akışını başlat |
| İtiraz | "Verilerimi işleme" | Pazarlama onayını kaldır |

**Veri Silme İşlem Akışı:**

```
Admin [Sil] aksiyonunu seçer
        ↓
Sistem kontrol eder:
  - Aktif abonelik? → Admin bilgilendirilir, iptale yönlendirilir
  - Devam eden iş?  → Tamamlanması beklenir veya iptal edilir
        ↓
Admin onaylar → Anonimleştirme job kuyruğa girer
        ↓
30 gün içinde fiziksel silme tamamlanır
        ↓
Kullanıcıya teyit e-postası gönderilir
        ↓
KVKK talebi "Tamamlandı" olarak kapatılır
```

---

### 15.11 Bildirim Yönetimi

```
── Manuel Bildirim Gönder ───────────────────────────
  Alıcı: [ Tek kullanıcı | Tüm hizmet verenler | Tüm hizmet alanlar ]
  Kanal: [ E-posta | Platform İçi | Push ]
  Mesaj: [ Serbest metin ]
  [Gönder]

── Bildirim Geçmişi ─────────────────────────────────
  Filtre: [ Kanal | Başarılı/Başarısız | Tarih ]
  Her satır: Alıcı | Kanal | Olay | Durum | Tarih
```

---

### 15.12 İş Bitiş & Karşılıklı Ücret Teyit Sistemi

#### 15.12.1 Genel Mantık

İş tamamlandığında her iki taraf ayrı ayrı ücret beyanı yapar ve onay verir.
Sistem beyanları karşılaştırır — uyuşmazlık varsa alarm tetiklenir.

```
HİZMET VEREN (adım 1 — önce girer)
        ↓
Kendi panelinde "İşi Tamamla" formunu açar:
  ┌─────────────────────────────────────────┐
  │ İş Tamamlama Bildirimi                  │
  │                                         │
  │ Hizmet: Ev Temizliği                    │
  │ Müşteri: Ahmet Y.                       │
  │                                         │
  │ Bu iş karşılığında aldığım ücret:       │
  │ [ 850 ] TL                              │
  │                                         │
  │ ☐ İşi eksiksiz tamamladım              │
  │ ☐ Müşteri hizmetten memnun kaldı        │
  │                                         │
  │ [Tamamla ve Gönder]                     │
  └─────────────────────────────────────────┘
        ↓
Hizmet alana bildirim gider:
"Hizmet vereniniz işi tamamladı. Lütfen onaylayın."
        ↓
HİZMET ALAN (adım 2)
        ↓
Kendi panelinde onay formunu açar:
  ┌─────────────────────────────────────────┐
  │ İş Onayı                                │
  │                                         │
  │ Hizmet: Ev Temizliği                    │
  │ Hizmet Veren: Mehmet Usta               │
  │                                         │
  │ Hizmet veren beyan ettiği ücret: 850 TL │
  │                                         │
  │ Gerçekte ödediğim ücret:                │
  │ [ 850 ] TL  ← önceden doldurulmuş      │
  │              (değiştirebilir)           │
  │                                         │
  │ ○ Ödediğim ücret doğru                 │
  │ ○ Farklı bir ücret ödedim → [düzelt]   │
  │                                         │
  │ ☐ Hizmeti aldım ve onaylıyorum         │
  │                                         │
  │ [Onayla]                                │
  └─────────────────────────────────────────┘
```

#### 15.12.2 Uyuşmazlık Senaryoları & Alarm Sistemi

```
Senaryo A — Ücretler Eşleşiyor (Normal Akış)
─────────────────────────────────────────────
HV beyanı: 850 TL  ==  HA beyanı: 850 TL
        ↓
İş "Tamamlandı" statüsüne geçer
Yorum daveti gönderilir
Kalite personeline arama görevi atanır
job_completions tablosuna kayıt düşer


Senaryo B — Ücret Fazla Beyan (HV fazla yazmış)
────────────────────────────────────────────────
HV beyanı: 1.200 TL  ≠  HA beyanı: 850 TL
Fark: +350 TL (%41 sapma)
        ↓
🔴 ALARM TETİKLENİR
  → Kalite personeline anlık bildirim (panel + push)
  → İş "Uyuşmazlık İnceleniyor" statüsüne girer
  → Her iki tarafa bildirim: "Ücret beyanınız inceleniyor"
  → Kalite personeli her iki tarafı arar
  → Karar: HV uyarılır / düzeltilir


Senaryo C — Ücret Eksik Beyan (HV az yazmış)
─────────────────────────────────────────────
HV beyanı: 500 TL  ≠  HA beyanı: 850 TL
Fark: -350 TL (%41 sapma)
        ↓
🟡 UYARI TETİKLENİR (daha düşük öncelik)
  → Kalite personeline bildirim
  → Nedenini anlamak için her iki taraf aranır
  → Olası neden: indirim yapıldı / iş yarım kaldı


Senaryo D — Hizmet Alan Onaylamıyor
────────────────────────────────────
HA: "Hizmeti almadım / Eksik yapıldı" seçer
        ↓
🔴 ŞİKÂYET AKIŞI otomatik başlar
  → Ekip liderine eskalasyon bildirimi
  → İş "Şikayet Açıldı" statüsüne girer
  → §10 Şikayet mekanizması devreye girer
```

#### 15.12.3 Alarm Eşikleri

| Sapma | Seviye | Aksiyon |
|---|---|---|
| %0 — Eşleşme | Normal | Otomatik tamamlama |
| %1–%15 | Bilgi | Kayıt altına alınır, alarm yok |
| %16–%30 | Sarı Alarm | Kalite personeline bildirim |
| %31 ve üzeri | Kırmızı Alarm | Kalite personeli + Ekip lideri bildirimi |
| HA onaylamıyor | Kırmızı Alarm | Ekip liderine anlık eskalasyon |

#### 15.12.4 Kalite Personeli — Uyuşmazlık Yönetimi

```
Kalite personeli panelinde "Uyuşmazlık Alarmları" bölümü açar
        ↓
Her alarm kartında:
  İş No | HV Beyanı | HA Beyanı | Fark | Fark % | Statü | [İncele]
        ↓
[İncele] tıklanır:
  ── İş Geçmişi ──────────────────────────
    Talep detayı, teklif tutarı, kabul tarihi

  ── Taraf Beyanları ─────────────────────
    HV'nin girdiği: 1.200 TL
    HA'nın girdiği: 850 TL
    Fark: 350 TL (%41)

  ── Arama Kayıtları ─────────────────────
    HV Arama: [Sonuç ekle ▼]
    HA Arama: [Sonuç ekle ▼]

  ── Karar ───────────────────────────────
    ○ HV beyanı doğru — HA düzeltildi
    ○ HA beyanı doğru — HV uyarıldı
    ○ Anlaşma sağlandı (X TL olarak güncellendi)
    ○ Şikayete dönüştür
    [Kaydet]
```

#### 15.12.5 Hizmet Alan — Platform İçi Tamamlama Onayı

Tamamlama onayı yalnızca **platform üzerinden** (web veya mobil) yapılır.
HV beyan eklediğinde HA'ya push bildirim gider: "Hizmet vereniniz işi tamamladı. Panelden onaylayın."

```
HA panele girer:
┌──────────────────────────────────────────┐
│  İş Onayı                               │
├──────────────────────────────────────────┤
│  Hizmet: Ev Temizliği                   │
│  Hizmet Veren: Mehmet Usta              │
│  Beyan edilen ücret: 850 TL             │
│                                          │
│  Gerçekte ödediğiniz ücret:             │
│  [850] TL  ← düzenleyebilirsiniz        │
│                                          │
│  ○ Ödediğim ücret doğru                │
│  ○ Farklı ücret ödedim                 │
│  ○ Hizmeti almadım / sorun var         │
│                                          │
│  [Onayla]                               │
└──────────────────────────────────────────┘
```

#### 15.12.6 DB Tablosu

```sql
job_completions (
  id UUID PK,
  job_id UUID FK REFERENCES service_requests(id),
  offer_id UUID FK REFERENCES offers(id),
  provider_id UUID FK,
  seeker_id UUID FK,

  -- Hizmet veren beyanı (adım 1)
  provider_declared_amount DECIMAL,
  provider_confirmed BOOLEAN DEFAULT false,
  provider_confirmed_at TIMESTAMP,

  -- Hizmet alan beyanı (adım 2)
  seeker_declared_amount DECIMAL,
  seeker_confirmed BOOLEAN DEFAULT false,
  seeker_confirmed_at TIMESTAMP,

  -- Uyuşmazlık
  amount_diff DECIMAL,              -- fark (TL)
  amount_diff_pct DECIMAL,          -- fark yüzdesi
  alarm_level ENUM('none','info','yellow','red'),
  dispute_status ENUM('none','open','resolved'),
  resolved_by UUID FK,              -- kalite personeli
  resolved_at TIMESTAMP,
  resolution_note TEXT,

  -- Genel
  status ENUM('pending_provider','pending_seeker',
              'completed','disputed','cancelled'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

---

### 15.13 Rol & İzin Yönetimi

#### 15.13.1 Tanımlı Roller

Sistemde 10 adet sabit rol bulunur. Her personele bir rol atanır.

| # | Rol | Kod | Açıklama |
|---|---|---|---|
| 1 | Süper Admin | `super_admin` | Tüm yetkiler, sistem yapılandırması |
| 2 | Ekip Lideri | `team_leader` | Ekip yönetimi, kalite kararları |
| 3 | Kalite Personeli | `quality_staff` | Yorum onay, memnuniyet aramaları, uyuşmazlık |
| 4 | Operasyon Personeli | `ops_staff` | HV onay, talep izleme |
| 5 | Finans Personeli | `finance_staff` | Ödeme, abonelik, gelir raporları |
| 6 | Pazarlama Personeli | `marketing_staff` | Kampanya, büyüme, bildirim |
| 7 | Satış Ekibi Personeli | `sales_staff` | HV kazanımı, churn önleme, CRM |
| 8 | İnsan Kaynakları | `hr_staff` | Personel yönetimi, vardiya, performans |
| 9 | Yönetici Paneli | `executive` | Salt okunur, tüm raporlar |
| 10 | Ar-Ge Personeli | `rnd_staff` | Test ortamı, analitik, A/B test |

#### 15.13.2 Modül Bazlı İzin Matrisi

| Modül | S.Admin | Ekip L. | Kalite | Operas. | Finans | Pazarl. | Satış | İK | Yönetici | Ar-Ge |
|---|---|---|---|---|---|---|---|---|---|---|
| Dashboard | ✓ Tam | ✓ Tam | K Özet | K Özet | K Özet | K Özet | K Özet | K Özet | ✓ Tam | K Özet |
| Kullanıcı Yönetimi | ✓ Tam | K Okuma | ✗ | K Okuma | ✗ | ✗ | K Okuma | ✓ Tam | ✗ | ✗ |
| Hizmet Veren Onay | ✓ Tam | ✓ Tam | ✗ | ✓ Tam | ✗ | ✗ | K Okuma | ✗ | ✗ | ✗ |
| Yorum Onay Kuyruğu | ✓ Tam | ✓ Tam | ✓ Tam | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Uyuşmazlık Alarmları | ✓ Tam | ✓ Tam | ✓ Tam | ✗ | ✗ | ✗ | ✗ | ✗ | K Okuma | ✗ |
| Şikayet Yönetimi | ✓ Tam | ✓ Tam | K Okuma | K Okuma | ✗ | ✗ | ✗ | ✗ | K Özet | ✗ |
| Talep İzleme | ✓ Tam | ✓ Tam | K Okuma | ✓ Tam | ✗ | K Okuma | ✗ | ✗ | K Özet | K Okuma |
| Ödeme & Abonelik | ✓ Tam | ✗ | ✗ | ✗ | ✓ Tam | ✗ | K Okuma | ✗ | K Özet | ✗ |
| Paket Yönetimi | ✓ Tam | ✗ | ✗ | ✗ | ✓ Tam | K Okuma | ✓ Tam | ✗ | K Özet | ✗ |
| Analitik & Raporlar | ✓ Tam | ✓ Tam | K Özet | K Özet | ✓ Tam | ✓ Tam | ✓ Tam | K Özet | ✓ Tam | ✓ Tam |
| KVKK Talepleri | ✓ Tam | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | K Okuma | ✗ | ✗ |
| Personel Yönetimi | ✓ Tam | K Ekip | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ Tam | ✗ | ✗ |
| Bildirim Yönetimi | ✓ Tam | K Okuma | ✗ | ✗ | ✗ | ✓ Tam | ✗ | ✗ | ✗ | ✗ |
| Kampanya Yönetimi | ✓ Tam | ✗ | ✗ | ✗ | ✗ | ✓ Tam | K Okuma | ✗ | ✗ | ✗ |
| A/B Test & Ar-Ge | ✓ Tam | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ Tam |
| Sistem Ayarları | ✓ Tam | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

> **K = Kısmi:** Modülü görebilir ama tüm işlemleri yapamaz. "K Özet" = sadece sayısal özetler. "K Okuma" = liste ve detay görüntüleme, yazma/karar yok.

#### 15.13.3 Personel Yönetimi Akışı

```
Süper Admin veya İK → "Personel Ekle" tıklar
        ↓
Ad Soyad | E-posta | Telefon | Rol seç (dropdown)
        ↓
Sisteme davet e-postası gönderilir
        ↓
Personel şifresini oluşturur → giriş yapar
        ↓
Atanan role göre panel menüsü otomatik şekillenir
(Görmediği modüller menüde bile görünmez)
```

**Rol Değişikliği:**
```
Admin/İK → Personel listesi → [Rol Değiştir]
        ↓
Yeni rol seçilir → Onay popup
        ↓
Değişiklik anında geçerli olur
        ↓
Audit log'a düşer: "Kim, kimin rolünü, ne zaman değiştirdi"
```

#### 15.13.4 Personel Dashboard'u (Role Göre Özelleşen)

Her personel giriş yaptığında kendi rolüne özel dashboard görür:

**Kalite Personeli Dashboard:**
```
┌──────────────────────────────────────────┐
│ Bugünkü Görevlerim                       │
│ Bekleyen Yorum: 8   Arama Görevi: 5      │
│ Uyuşmazlık Alarmı: 2                     │
├──────────────────────────────────────────┤
│ Öncelikli Aramalar (48 saat SLA geçmiş) │
│ • Ahmet Y. — Ev Temizliği — 2 gün geçti │
│ • Fatma K. — Boya Badana — 1 gün geçti  │
└──────────────────────────────────────────┘
```

**Satış Personeli Dashboard:**
```
┌──────────────────────────────────────────┐
│ Bu Ay                                    │
│ Yeni Abone: 12   Churn: 3   Net: +9     │
├──────────────────────────────────────────┤
│ Takip Listesi                            │
│ Kota Dolmak Üzere (5 HV) → Paket öner  │
│ Churn Riski (3 HV) → Geri kazan        │
└──────────────────────────────────────────┘
```

**Yönetici Dashboard:**
```
┌──────────────────────────────────────────┐
│ Platform Sağlığı — Bu Ay                │
│ MRR: 485.000 ₺  (+12% geçen ay)        │
│ NPS: 67  Aktif HV: 1.240  Talep: 3.890 │
├──────────────────────────────────────────┤
│ Dikkat Gerektiren                        │
│ Açık Şikayet: 5   Başarısız Ödeme: 3   │
└──────────────────────────────────────────┘
```

#### 15.13.5 DB Tabloları

```sql
-- Personel
staff (
  id UUID PK,
  name VARCHAR,
  email VARCHAR UNIQUE,
  phone VARCHAR,
  role ENUM('super_admin','team_leader','quality_staff','ops_staff',
            'finance_staff','marketing_staff','sales_staff',
            'hr_staff','executive','rnd_staff'),
  team_id UUID FK,               -- hangi ekipte
  is_active BOOLEAN DEFAULT true,
  created_by UUID FK,            -- kim ekledi
  created_at TIMESTAMP,
  last_login_at TIMESTAMP
)

-- Ekipler
teams (
  id UUID PK,
  name VARCHAR,                  -- örn: "Kalite Ekibi A"
  leader_id UUID FK REFERENCES staff(id),
  created_at TIMESTAMP
)

-- Audit Log (tüm admin aksiyonları)
audit_logs (
  id UUID PK,
  staff_id UUID FK,
  action VARCHAR,                -- örn: "review.approve", "user.ban"
  target_type VARCHAR,           -- örn: "review", "user", "offer"
  target_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address VARCHAR,
  created_at TIMESTAMP
)

-- Arama Görevleri (kalite personeli)
call_tasks (
  id UUID PK,
  assigned_to UUID FK REFERENCES staff(id),
  job_completion_id UUID FK,
  customer_id UUID FK,
  priority ENUM('normal','urgent'),
  status ENUM('pending','in_progress','done','escalated'),
  attempt_count INT DEFAULT 0,
  call_result ENUM('satisfied','partial','unsatisfied','unreachable'),
  notes TEXT,
  due_at TIMESTAMP,              -- 48 saat SLA
  completed_at TIMESTAMP,
  created_at TIMESTAMP
)
```

---

## 16. TEKNOLOJİ STACK

### 16.0 Proje Klasör Yapısı (Monorepo)

```
esnaaf/
├── backend-api/              ← Ortak backend — her iki uygulamanın tek API'si
│   ├── src/
│   │   ├── musteri/          ← /api/musteri/* prefix'li tüm endpointler
│   │   ├── hizmetveren/      ← /api/hizmetveren/* prefix'li tüm endpointler
│   │   ├── ortak/            ← auth, kategori, bildirim (her ikisi de kullanır)
│   │   ├── admin/            ← /api/admin/* prefix'li admin endpointleri
│   │   └── common/           ← guard, filter, util, prisma, queue
│   ├── prisma/               ← Tek veritabanı şeması (ortak)
│   └── .env
│
├── app-musteri/              ← Esnaaf — Hizmet Alan uygulaması
│   ├── src/
│   │   ├── screens/          ← Ekranlar (Chat, Talepler, Teklifler, Profil)
│   │   ├── components/       ← UI bileşenleri
│   │   └── api/              ← api.esnaaf.com/api/musteri/* çağrıları
│   └── app.json              ← name: "Esnaaf"
│
└── app-hizmetveren/          ← Esnaaf Partner — Hizmet Veren uygulaması
    ├── src/
    │   ├── screens/          ← Ekranlar (Gelen İşler, Teklif, CRM, Kota)
    │   ├── components/       ← UI bileşenleri
    │   └── api/              ← api.esnaaf.com/api/hizmetveren/* çağrıları
    └── app.json              ← name: "Esnaaf Partner"
```

**Neden monorepo?**
- Ortak design token'lar ve utility fonksiyonlar tek yerden yönetilir
- Backend değişikliği her iki uygulamayı otomatik etkiler
- Claude Code oturumlarında "sadece app-hizmetveren klasörüne gir" denilebilir
- İki uygulama birbirinin kodunu asla bozamaz

**Claude Code kullanım kuralı:**
```
❌ Yanlış: "Gelen işler ekranını yap"
✅ Doğru:  "app-hizmetveren/src/screens/ klasörüne gir,
            gelen işler ekranını yap, başka klasöre dokunma"
```

### 16.1 Backend

| Bileşen | Teknoloji |
|---|---|
| Framework | Node.js + NestJS |
| ORM | Prisma |
| Queue | BullMQ (Redis tabanlı) |
| AI Entegrasyon | LangChain + OpenAI API |
| Bildirim (In-App) | WebSocket (Socket.io) |
| Ödeme | iyzico SDK |
| OTP | SMS — Netgsm (birincil) · İleTiMer (yedek) |
| Depolama | AWS S3 veya Cloudflare R2 (belge/fatura) |

### 16.2 Frontend

| Bileşen | Teknoloji |
|---|---|
| Web | Next.js 14 (App Router) |
| Esnaaf (HA uygulaması) | React Native (Expo) |
| Esnaaf Partner (HV uygulaması) | React Native (Expo) |
| State Yönetimi | Zustand veya Redux Toolkit |

### 16.3 Altyapı

| Bileşen | Teknoloji |
|---|---|
| Veritabanı | PostgreSQL |
| Cache / Queue | Redis (Upstash önerilir — yönetilen servis) |
| Deploy (MVP) | Railway veya Render |
| Deploy (Prod) | AWS ECS veya DigitalOcean App Platform |

### 16.4 Environment Değişkenleri Listesi

```bash
# ── Uygulama ──────────────────────────────────────────
NODE_ENV=development|production|test
PORT=3000
API_PREFIX=v1
FRONTEND_URL=https://esnaaf.com
PARTNER_APP_URL=https://partner.esnaaf.com
API_URL=https://api.esnaaf.com

# ── Veritabanı ────────────────────────────────────────
DATABASE_URL=postgresql://USER:PASS@HOST:5432/platform_db

# ── Redis ─────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ── JWT ───────────────────────────────────────────────
JWT_ACCESS_SECRET=           # min 32 karakter
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=          # min 32 karakter (farklı olmalı)
JWT_REFRESH_EXPIRES_IN=7d

# ── Telefon Şifreleme ─────────────────────────────────
ENCRYPTION_KEY=              # tam 32 karakter
ENCRYPTION_IV=               # tam 16 karakter

# ── OTP / SMS (Netgsm) ─────────────────────────────────
NETGSM_USERCODE=
NETGSM_PASSWORD=
NETGSM_MSGHEADER=            # maks 11 karakter
# ── OTP ────────────────────────────────────────────────
OTP_EXPIRES_IN_MINUTES=5
OTP_LENGTH=6

# ── Firebase FCM (Push Notification) ─────────────────
FCM_PROJECT_ID=
FCM_CLIENT_EMAIL=
FCM_PRIVATE_KEY=

# ── Platform İçi Bildirim (WebSocket) ────────────────
WS_SECRET=                   # WebSocket auth token

# ── OpenAI ────────────────────────────────────────────
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o
OPENAI_MAX_TOKENS=1000
OPENAI_DAILY_TOKEN_LIMIT=500000
OPENAI_MAX_MESSAGES_PER_SESSION=30

# ── iyzico ────────────────────────────────────────────
IYZICO_API_KEY=
IYZICO_SECRET_KEY=
IYZICO_BASE_URL=https://sandbox.iyzipay.com   # prod: https://api.iyzipay.com

# ── AWS S3 / Cloudflare R2 ────────────────────────────
STORAGE_PROVIDER=s3
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=platform-documents
S3_PRESIGNED_URL_EXPIRES=900  # 15 dakika (saniye)

# ── Rate Limiting ─────────────────────────────────────
THROTTLE_TTL=60000            # ms
THROTTLE_LIMIT=100
THROTTLE_OTP_LIMIT=3          # dakikada max 3 OTP isteği

# ── Monitoring ────────────────────────────────────────
SENTRY_DSN=
```

---

## 17. GÜVENLİK

- **JWT Authentication** — access token (15 dk) + refresh token (7 gün)
- **OTP Doğrulama** — kayıt, giriş ve hassas işlemler için
- **Rate Limiting** — API endpoint başına istek sınırı
- **Rol Bazlı Yetkilendirme (RBAC)** — service_seeker | service_provider | admin | staff rolleri
- **Telefon Şifreleme** — AES-256, veritabanında şifreli
- **Webhook Doğrulama** — iyzico webhook imzası kontrol edilir
- **HTTPS** — tüm trafik SSL/TLS
- **Input Sanitization** — XSS ve SQL injection önleme

### 17.1 Hata Senaryoları & Fallback Akışları

#### OTP Hataları

| Senaryo | Davranış |
|---|---|
| OTP yanlış (1-2. deneme) | "Kod hatalı, tekrar deneyin" mesajı |
| OTP yanlış (3. deneme) | "Çok fazla hatalı deneme. 5 dakika bekleyin." — Redis'e 5 dk kilit |
| OTP süresi dolmuş | "Kodun süresi doldu. Yeni kod isteyin." |
| Push gönderilemedi | "Bildirim alınamadı. Lütfen uygulamayı açın." |
| Rate limit (1 dk'da 3+ istek) | "Çok fazla istek. 1 dakika bekleyin." — 429 Too Many Requests |

#### AI Chat Hataları

| Senaryo | Davranış |
|---|---|
| OpenAI API yanıt vermez (timeout) | "Sistemimiz yoğun. Lütfen birkaç dakika sonra tekrar deneyin." — session korunur |
| OpenAI API hatası (5xx) | Aynı mesaj — BullMQ'ya retry job atılır (3 deneme, 30s aralık) |
| Kategori tespit edilemez | Liste gösterilir: "Hangi hizmete ihtiyacınız var? Seçin:" |
| Günlük token limiti aşıldı | "Bugünlük mesaj limitinize ulaştınız. Yarın devam edebilirsiniz." |
| Session süresi dolmuş (24 saat) | Yeni session başlatılır, kullanıcıya bilgi verilir |

**AI Token Limitleri:**
```
Kullanıcı başına günlük:     50.000 token  (yaklaşık 15-20 konuşma)
Konuşma başına maks mesaj:   30 mesaj
Tek mesaj maks uzunluk:      500 karakter
System prompt maks:          1.000 token (sabit)
```

#### iyzico / Ödeme Hataları

| Senaryo | Davranış |
|---|---|
| Checkout form açılamadı | "Ödeme sayfası açılamadı. Lütfen tekrar deneyin." — abonelik `suspended` kalır |
| iyzico timeout (>15s) | Aynı hata mesajı — abonelik `suspended`, manuel retry |
| Kart yetersiz bakiye | iyzico hata kodu → "Kartınızda yeterli bakiye yok." |
| Kart bilgisi hatalı | "Kart bilgilerinizi kontrol edin." |
| 3D Secure başarısız | "3D Secure doğrulama başarısız. Bankanızla iletişime geçin." |
| Webhook imzası geçersiz | 400 Bad Request — log'a yaz, işlem yapma |
| Webhook duplicate (idempotency) | İkinci gelende ödeme ID kontrolü yap, duplicate'i ignore et |

#### OTP SMS Hataları

| Senaryo | Davranış |
|---|---|
| Netgsm erişilemiyor | İleTiMer yedek gateway'e geç (otomatik failover) |
| Telefon numarası geçersiz | "Geçerli bir telefon numarası girin." hatası |
| SMS gönderilemedi (3 retry) | Log'a `failed` — kullanıcıya "Tekrar deneyin" göster |
| Aynı numaraya 1dk'da 3+ istek | Rate limit → "1 dakika bekleyin" |

#### Push Notification Hataları

| Senaryo | Davranış |
|---|---|
| FCM erişilemiyor | Mesaj BullMQ'da bekler (3 retry, 5 dk aralık) — log'a yaz |
| Cihaz token geçersiz (uygulama kaldırıldı) | Token yenilenmesini bekle, bildirim platform içi göster |
| Push gönderilemedi (3 retry sonrası) | Bildirim log'a `failed` olarak işlenir — e-posta fallback |

### 17.2 Monitoring & Logging

**Kullanılan Araçlar:**

| Araç | Amaç |
|---|---|
| **Sentry** | Uygulama hata takibi (exception, stack trace) |
| **Grafana + Prometheus** | Sistem metrikleri (API yanıt süresi, CPU, bellek) |
| **BullMQ Dashboard** | Queue doluluk, başarısız job'lar |
| **Railway / AWS CloudWatch** | Altyapı logları |

**Kritik Alarm Eşikleri (admin'e anlık bildirim):**

| Metrik | Eşik | Aksiyon |
|---|---|---|
| API hata oranı | >%5 (5 dk içinde) | PagerDuty / Slack alarm |
| Queue birikimi | >500 bekleyen job | Slack alarm |
| DB yanıt süresi | >2 saniye | Slack alarm |
| SMS delivery oranı  | <%95 | Netgsm → İleTiMer failover tetikle |
| Push delivery oranı | <%80 | FCM yapılandırması kontrol et |
| OpenAI hata oranı | >%10 | GPT-4o Mini'ye geç |
| Disk doluluk (S3 log) | >%85 | Uyarı |

**Log Saklama Süreleri:**

| Log Tipi | Süre | Yer |
|---|---|---|
| API access logları | 90 gün | CloudWatch / Railway |
| Hata logları (Sentry) | 1 yıl | Sentry |
| Ödeme logları | 10 yıl | DB (KVKK / TTK) |
| AI session logları | 30 gün | Redis → arşivleme yok |
| Bildirim logları | 2 yıl | DB |
| Audit logları | 5 yıl | DB |

### 17.3 Dosya Yükleme Akışı (S3)

Yorum belgesi, HV kimlik, fatura fotoğrafı için:

```
Frontend → POST /upload/presigned-url  (hangi dosya tipi + uzantı)
                ↓
Backend → S3'e presigned URL üretir (15 dk geçerli)
                ↓
Frontend → Doğrudan S3'e yükler (backend proxy YOK — bant genişliği tasarrufu)
                ↓
Frontend → Backend'e URL'i bildirir: { documentUrl: "https://s3.../..." }
                ↓
Backend → URL'i DB'ye kaydeder
```

**Dosya Kısıtları:**

| Alan | İzin Verilen Format | Maks Boyut |
|---|---|---|
| Yorum belgesi (fatura/fiş) | JPG, PNG, PDF | 5 MB |
| HV kimlik belgesi | JPG, PNG, PDF | 5 MB |
| HV profil fotoğrafı | JPG, PNG | 2 MB |
| HV portföy fotoğrafı | JPG, PNG | 5 MB (x6) |
| İş bitiş fatura | JPG, PNG, PDF | 5 MB |

**Saklama & Güvenlik:**
- Tüm belgeler **private** bucket'ta — public URL yok
- Erişim presigned URL ile (15 dk geçerli)
- Dosya adı: `{tip}/{year}/{month}/{uuid}.{ext}` (tahmin edilemez)
- Yorum belgesi saklama: yorum silinse bile **2 yıl** saklanır (KVKK/hukuki)
- HV kimlik belgesi: HV silinse bile **5 yıl** saklanır (hukuki)
- Virüs tarama: S3 Lambda trigger ile ClamAV (Faz 3, MVP'de manuel kontrol)

---

## 18. API YAPISI

### 18.1 Genel Kurallar

**Tek backend, iki prefix sistemi:**

```
api.esnaaf.com/api/musteri/      ← Esnaaf (HA) uygulamasının kullandığı endpointler
api.esnaaf.com/api/hizmetveren/  ← Esnaaf Partner (HV) uygulamasının kullandığı endpointler
api.esnaaf.com/api/ortak/        ← Her iki uygulamanın kullandığı (auth, kategori)
api.esnaaf.com/api/admin/        ← Admin panel endpointleri
api.esnaaf.com/api/webhooks/     ← iyzico, FCM callback (public, imzalı)
```

| Kural | Değer |
|---|---|
| Base URL | `https://api.esnaaf.com/api` |
| Müşteri Prefix | `/api/musteri/` |
| HV Prefix | `/api/hizmetveren/` |
| Ortak Prefix | `/api/ortak/` |
| Admin Prefix | `/api/admin/` |
| Auth | `Authorization: Bearer {access_token}` |
| Rate limit | 100 istek/dakika (genel), 10 istek/dakika (OTP) |
| Versiyon | Prefix içinde — breaking change'de `/api/v2/musteri/` |
| Content-Type | `application/json` (dosya yükleme: `multipart/form-data`) |
| Hata formatı | `{ error: { code, message, details } }` |
| App tanımlama | `X-App-Client: esnaaf` veya `esnaaf-partner` header'ı |

### 18.2 Auth & Kullanıcı (M1)

```
── ORTAK AUTH (her iki uygulama kullanır) ────────────────────────
POST   /api/ortak/auth/register         → Telefon ile kayıt başlat
POST   /api/ortak/auth/otp/send         → OTP gönder (push notification)
POST   /api/ortak/auth/otp/verify       → OTP doğrula → token döner
POST   /api/ortak/auth/refresh-token    → Access token yenile
POST   /api/ortak/auth/logout           → Refresh token iptal et
POST   /api/ortak/auth/kvkk/accept      → KVKK onayını kaydet (zorunlu)

── MÜŞTERİ PROFİL (Esnaaf — HA) ─────────────────────────────────
GET    /api/musteri/profil              → Profil bilgileri
PUT    /api/musteri/profil              → Profil güncelle
PUT    /api/musteri/profil/tercihler    → Bildirim tercihleri

── HİZMET VEREN PROFİL (Esnaaf Partner — HV) ────────────────────
GET    /api/hizmetveren/profil          → Profil + kategori + ilçe bilgileri
PUT    /api/hizmetveren/profil          → Profil güncelle
POST   /api/hizmetveren/profil/portfolyo → Portföy fotoğrafı yükle
```

### 18.3 AI Chat & Talep (M2)

```
── CHAT (Esnaaf — HA kullanır) ───────────────────────────────────
POST   /api/ortak/chat/anonim/baslat    → Anonim session başlat (kayıt gerektirmez)
                                          Header: X-Session-ID (frontend üretir)
POST   /api/musteri/chat/mesaj          → AI'ya mesaj gönder, yanıt al
GET    /api/musteri/chat/oturum/:id     → Aktif oturum durumu
DELETE /api/musteri/chat/oturum/:id     → Oturumu sonlandır

── TALEPler (Esnaaf — HA kullanır) ──────────────────────────────
POST   /api/musteri/talepler            → Yeni talep oluştur
GET    /api/musteri/talepler            → Kullanıcının talepleri (?durum=)
GET    /api/musteri/talepler/:id        → Talep detayı + gelen teklifler
PUT    /api/musteri/talepler/:id/iptal  → Talebi iptal et

── KATEGORİLER (ortak — her iki uygulama) ────────────────────────
GET    /api/ortak/kategoriler           → Aktif kategoriler
GET    /api/ortak/kategoriler/:id/sorular → Kategori AI soru şablonu

── FCM CALLBACK (webhook — public) ──────────────────────────────
POST   /api/webhooks/fcm-callback       ⚠ İmza doğrulaması zorunlu
```

### 18.4 Eşleştirme & Teklif (M3)

```
── TEKLİFLER — MÜŞTERİ (Esnaaf — HA) ────────────────────────────
GET    /api/musteri/teklifler/:talepId       → Talebe gelen teklifler
POST   /api/musteri/teklifler/:id/kabul      → Kabul et (consent: true zorunlu)
POST   /api/musteri/teklifler/:id/reddet     → Reddet
GET    /api/musteri/teklifler/:id/iletisim   → Telefon numarası aç

── TEKLİFLER — HİZMET VEREN (Esnaaf Partner — HV) ───────────────
POST   /api/hizmetveren/teklifler            → Teklif ver (job_id, fiyat, mesaj)
GET    /api/hizmetveren/gelen-isler          → Dağıtılan işler (viewer sayısı)
GET    /api/hizmetveren/teklifler            → Verilen teklifler listesi
GET    /api/hizmetveren/kota                 → Aylık kota durumu
GET    /api/hizmetveren/teklifler/:id/musteri-iletisim → Müşteri telefonu aç

── MESAJLAŞMA (ortak) ────────────────────────────────────────────
POST   /api/ortak/mesajlar                   → Mesaj gönder
GET    /api/ortak/mesajlar/:talepId/:teklifId → Sohbet geçmişi
PUT    /api/ortak/mesajlar/:id/okundu        → Okundu işaretle
```

### 18.5 Ödeme & Paket (M4)

```
── PAKETLER (ortak — HA da görebilir) ────────────────────────────
GET    /api/ortak/paketler                   → Paket listesi ve fiyatlar

── ABONELİK — HİZMET VEREN (Esnaaf Partner — HV) ────────────────
POST   /api/hizmetveren/abonelik/baslat      → Abonelik başlat (iyzico checkout)
POST   /api/hizmetveren/abonelik/iptal       → İptal et (dönem sonunda biter)
GET    /api/hizmetveren/abonelik             → Aktif abonelik + kota
GET    /api/hizmetveren/abonelik/gecmis      → Ödeme geçmişi
GET    /api/hizmetveren/abonelik/fatura/:id  → Fatura PDF

── KAMPANYA ──────────────────────────────────────────────────────
POST   /api/hizmetveren/kampanya/dogrula     → Kampanya kodu doğrula

── WEBHOOK (public) ──────────────────────────────────────────────
POST   /api/webhooks/iyzico                  ⚠ iyzico-signature zorunlu
```

### 18.6 Puan & Şikayet (M5)

```
── YORUMLAR — MÜŞTERİ (Esnaaf — HA) ─────────────────────────────
POST   /api/musteri/yorumlar                 → Yorum + belge yükle
GET    /api/ortak/yorumlar/:hvId             → HV'nin onaylı yorumları (public)

── YORUMLAR — HİZMET VEREN (Esnaaf Partner — HV) ────────────────
GET    /api/hizmetveren/yorumlar             → Kendi yorumları
POST   /api/hizmetveren/yorumlar/:id/itiraz  → Yoruma itiraz et

── ŞİKÂYETLER ────────────────────────────────────────────────────
POST   /api/musteri/sikayetler               → Şikayet oluştur
GET    /api/musteri/sikayetler/:id           → Şikayet durumu
```

### 18.7 Bildirimler (M-Notification)

```
── BİLDİRİM (ortak) ──────────────────────────────────────────────
GET    /api/ortak/bildirimler/tercihler      → Kanal tercihleri
PUT    /api/ortak/bildirimler/tercihler      → Güncelle
GET    /api/ortak/bildirimler/gecmis         → Bildirim geçmişi
POST   /api/ortak/bildirimler/fcm-token      → Cihaz FCM token'ı kaydet/güncelle
```

### 18.8 Admin (M6)

```
── KULLANICI YÖNETİMİ ────────────────────────────────────────────
GET    /api/admin/kullanicilar                → Kullanıcı listesi (filtreli)
                                         Query: ?role=&status=&search=
GET    /admin/users/:id                → Kullanıcı detayı
PUT    /admin/users/:id/status         → Aktif/pasif/ban
DELETE /admin/users/:id                → Hesabı zorla sil (KVKK)

── HİZMET VEREN ONAY ─────────────────────────────────────────────
GET    /admin/providers/pending        → Onay bekleyen hizmet verenler
PUT    /admin/providers/:id/approve    → Onayla
PUT    /admin/providers/:id/reject     → Reddet + sebep
POST   /admin/providers/:id/trial     → Admin panel denemesi ver (30 gün)
DELETE /admin/providers/:id/trial     → Admin panel denemesini iptal et
GET    /admin/providers/trials        → Aktif deneme listesi
                                         Body: { reason }

── YORUM ONAY KUYRUĞU ────────────────────────────────────────────
GET    /admin/reviews/queue            → İncelemede olan yorumlar
PUT    /admin/reviews/:id/approve      → Yorumu onayla
PUT    /admin/reviews/:id/reject       → Yorumu reddet + sebep
POST   /admin/reviews/:id/call-log    → Telefon doğrulama kaydı ekle
                                         Body: { call_result, notes }

── ŞİKÂYET YÖNETİMİ ─────────────────────────────────────────────
GET    /admin/complaints               → Tüm şikayetler (filtreli)
GET    /admin/complaints/:id           → Şikayet detayı
PUT    /admin/complaints/:id/resolve   → Karar ver
                                         Body: { decision, note }

── PAKET & ÖDEME ─────────────────────────────────────────────────
GET    /admin/subscriptions            → Tüm abonelikler
GET    /admin/payments/failed          → Başarısız ödemeler
POST   /admin/notifications/send       → Manuel bildirim gönder

── ANALİTİK ──────────────────────────────────────────────────────
GET    /admin/analytics/overview       → Özet dashboard metrikleri
GET    /admin/analytics/jobs           → Talep istatistikleri
GET    /admin/analytics/providers      → Hizmet veren performans raporu
GET    /admin/analytics/revenue        → Gelir raporu

── KVKK ──────────────────────────────────────────────────────────
GET    /admin/kvkk/requests            → Veri silme talepleri
PUT    /admin/kvkk/requests/:id        → Talebi işle (sil / reddet)
```

### 18.9 Webhook & Sistem (M7)

```
── WEBHOOK'LAR ───────────────────────────────────────────────────
POST   /notifications/fcm-callback → FCM push callback
GET    /webhooks/whatsapp          → Meta challenge (ilk kurulum)
POST   /webhooks/iyzico            → iyzico ödeme eventleri
POST   /webhooks/fcm               → FCM push durum bildirimi

── SİSTEM ────────────────────────────────────────────────────────
GET    /health                     → Servis sağlık kontrolü
GET    /health/detailed            → DB, Redis, queue durumu (sadece internal)
```

### 18.10 Endpoint Güvenlik Seviyeleri

| Seviye | Kimler Erişebilir | Örnek |
|---|---|---|
| **Public** | Herkes, token gerekmez | `GET /health`, `POST /webhooks/*`, `GET /webhooks/whatsapp` |
| **Auth** | Geçerli JWT token | `GET /users/me`, `POST /jobs` |
| **Provider** | Hizmet veren rolü | `/api/hizmetveren/*` endpointleri |
| **Seeker** | Hizmet alan rolü | `/api/musteri/*` endpointleri |
| **Admin** | Admin rolü | `GET /admin/*` tümü |
| **Internal** | Sadece servis içi | `GET /health/detailed` |

---

## 19. VERİTABANI ŞEMASI

```sql
-- Kullanıcılar
users (
  id UUID PK,
  phone VARCHAR ENCRYPTED,
  phone_masked VARCHAR,
  name VARCHAR,
  email VARCHAR,
  role ENUM('service_seeker','service_provider','admin'),
  kvkk_consent BOOLEAN,
  kvkk_consent_date TIMESTAMP,
  marketing_consent BOOLEAN,
  is_active BOOLEAN,
  created_at TIMESTAMP,
  deleted_at TIMESTAMP  -- soft delete
)

-- Hizmet Verenler (Profil Detayları)
service_providers (
  id UUID PK,
  user_id UUID FK,
  category_ids UUID[],
  description TEXT,
  avg_rating DECIMAL(3,2),
  total_jobs INT,
  response_time_avg INT,  -- dakika cinsinden
  is_approved BOOLEAN,
  approved_at TIMESTAMP,
  subscription_id UUID FK
)

-- Talepler
service_requests (
  id UUID PK,
  seeker_id UUID FK,
  category_id UUID FK,
  form_data JSONB,
  status ENUM('pending','distributed','completed','cancelled'),
  created_at TIMESTAMP
)

-- Teklifler
offers (
  id UUID PK,
  job_id UUID FK,
  provider_id UUID FK,
  price DECIMAL,
  message TEXT,
  status ENUM('pending','accepted','rejected','cancelled'),
  accepted_at TIMESTAMP,
  created_at TIMESTAMP
)

-- Kabul Edilen Teklifler (Telefon Açılma Takibi)
accepted_offers (
  id UUID PK,
  job_id UUID FK,
  offer_id UUID FK,
  seeker_id UUID FK,
  provider_id UUID FK,
  accepted_at TIMESTAMP,
  seeker_consent BOOLEAN,  -- onay popup'ı onaylandı mı?
  seeker_consent_at TIMESTAMP
)

-- Telefon Açılma Logları (KVKK)
phone_reveal_logs (
  id UUID PK,
  requester_id UUID FK,
  revealed_user_id UUID FK,
  job_id UUID FK,
  revealed_at TIMESTAMP
)

-- Yorumlar
reviews (
  id UUID PK,
  job_id UUID FK,
  reviewer_id UUID FK,
  provider_id UUID FK,
  rating INT,
  comment TEXT,
  document_url VARCHAR,  -- fatura/fiş
  status ENUM('pending','approved','rejected'),
  approved_by UUID FK,
  approved_at TIMESTAMP,
  created_at TIMESTAMP
)

-- Yorum Doğrulama Kayıtları
review_verifications (
  id UUID PK,
  review_id UUID FK,
  verified_by UUID FK,
  call_attempt INT,
  call_result ENUM('reached','unreachable','voicemail'),
  notes TEXT,
  verified_at TIMESTAMP
)

-- Şikayetler
complaints (
  id UUID PK,
  job_id UUID FK,
  reporter_id UUID FK,
  reported_id UUID FK,
  category ENUM('service_not_done','poor_quality','price_dispute','other'),
  description TEXT,
  status ENUM('open','investigating','resolved','rejected'),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP
)

-- Abonelikler
subscriptions (
  id UUID PK,
  provider_id UUID FK,
  package_type ENUM('basic','standard','premium','vip'),
  status ENUM('trial','admin_trial','active','cancelled','suspended','expired'),
  started_at TIMESTAMP,
  expires_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  iyzico_subscription_ref VARCHAR,
  admin_granted_by UUID FK,         -- Admin trial: veren personel
  admin_trial_note VARCHAR           -- Admin trial: dahili not
)

-- Ödemeler
payments (
  id UUID PK,
  subscription_id UUID FK,
  amount DECIMAL,
  status ENUM('success','failed','refunded'),
  iyzico_payment_id VARCHAR,
  attempt_count INT,
  paid_at TIMESTAMP,
  created_at TIMESTAMP
)

-- Aktivite Logları
activity_logs (
  id UUID PK,
  user_id UUID FK,
  action VARCHAR,
  metadata JSONB,
  created_at TIMESTAMP
)

-- Anonim Chat Sessionları (Redis'te tutulur ama DB'de de izlenir)
temp_sessions (
  id UUID PK,
  session_uuid VARCHAR UNIQUE,     -- frontend'in ürettiği UUID
  collected_data JSONB,            -- toplanan form verisi
  chat_step VARCHAR,               -- hangi adımda kaldı
  converted_to_user_id UUID FK,    -- kayıt olunca dolar
  expires_at TIMESTAMP,            -- 2 saat TTL
  created_at TIMESTAMP
)

-- Platform İçi Mesajlaşma
messages (
  id UUID PK,
  job_id UUID FK REFERENCES service_requests(id),
  offer_id UUID FK REFERENCES offers(id),
  sender_id UUID FK REFERENCES users(id),
  receiver_id UUID FK REFERENCES users(id),
  content TEXT,
  content_type ENUM('text','image','audio') DEFAULT 'text',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP
)

-- Cevap Süreleri
response_times (
  id UUID PK,
  provider_id UUID FK,
  job_id UUID FK,
  notified_at TIMESTAMP,
  responded_at TIMESTAMP,
  response_duration_minutes INT
)

-- İş Tamamlama & Ücret Teyit
job_completions (
  id UUID PK,
  job_id UUID FK,
  offer_id UUID FK,
  provider_id UUID FK,
  seeker_id UUID FK,
  provider_declared_amount DECIMAL,
  provider_confirmed BOOLEAN DEFAULT false,
  provider_confirmed_at TIMESTAMP,
  seeker_declared_amount DECIMAL,
  seeker_confirmed BOOLEAN DEFAULT false,
  seeker_confirmed_at TIMESTAMP,
  amount_diff DECIMAL,
  amount_diff_pct DECIMAL,
  alarm_level ENUM('none','info','yellow','red'),
  dispute_status ENUM('none','open','resolved'),
  resolved_by UUID FK,
  resolved_at TIMESTAMP,
  resolution_note TEXT,
  status ENUM('pending_provider','pending_seeker',
              'completed','disputed','cancelled'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Personel
staff (
  id UUID PK,
  name VARCHAR,
  email VARCHAR UNIQUE,
  phone VARCHAR,
  role ENUM('super_admin','team_leader','quality_staff','ops_staff',
            'finance_staff','marketing_staff','sales_staff',
            'hr_staff','executive','rnd_staff'),
  team_id UUID FK,
  is_active BOOLEAN DEFAULT true,
  created_by UUID FK,
  created_at TIMESTAMP,
  last_login_at TIMESTAMP
)

-- Ekipler
teams (
  id UUID PK,
  name VARCHAR,
  leader_id UUID FK,
  created_at TIMESTAMP
)

-- Audit Log
audit_logs (
  id UUID PK,
  staff_id UUID FK,
  action VARCHAR,
  target_type VARCHAR,
  target_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address VARCHAR,
  created_at TIMESTAMP
)

-- Arama Görevleri
call_tasks (
  id UUID PK,
  assigned_to UUID FK,
  job_completion_id UUID FK,
  customer_id UUID FK,
  priority ENUM('normal','urgent'),
  status ENUM('pending','in_progress','done','escalated'),
  attempt_count INT DEFAULT 0,
  call_result ENUM('satisfied','partial','unsatisfied','unreachable'),
  notes TEXT,
  due_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP
)

-- Kampanyalar
campaigns (
  id UUID PK,
  name VARCHAR,
  code VARCHAR(50) UNIQUE,
  type ENUM('percent','fixed','free_trial','upgrade'),
  value DECIMAL,
  upgrade_to ENUM('basic','standard','premium','vip') NULL,
  applicable_packages VARCHAR[],
  new_users_only BOOLEAN DEFAULT false,
  max_uses INT NULL,
  used_count INT DEFAULT 0,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_by UUID FK,
  created_at TIMESTAMP
)

-- Kampanya Kullanım Logu
campaign_usage (
  id UUID PK,
  campaign_id UUID FK,
  provider_id UUID FK,
  subscription_id UUID FK,
  discount_amount DECIMAL,
  used_at TIMESTAMP,
  created_by_staff UUID FK NULL
)

-- Hizmet Veren Aylık Kota Takibi
provider_monthly_quota (
  id UUID PK,
  provider_id UUID FK REFERENCES service_providers(id),
  month_year VARCHAR(7),        -- örn: "2025-01"
  accepted_count INT DEFAULT 0, -- hizmet alan tarafından kaç kez onaylandı
  monthly_limit INT,            -- pakete göre: 14/30/60/NULL(VIP)
  reset_at TIMESTAMP,           -- ayın 1'i UTC+3 00:00
  updated_at TIMESTAMP
  -- UNIQUE(provider_id, month_year)
)
```

### 19.2 Kritik Index Listesi

Performans için zorunlu index'ler — migration'larda oluşturulmalı:

```sql
-- Auth & Kullanıcı
CREATE UNIQUE INDEX idx_users_phone        ON users(phone);
CREATE INDEX        idx_users_role         ON users(role) WHERE deleted_at IS NULL;

-- Talepler (en çok sorgulanan tablo)
CREATE INDEX idx_sr_seeker_status   ON service_requests(seeker_id, status);
CREATE INDEX idx_sr_status_created  ON service_requests(status, created_at DESC);
CREATE INDEX idx_sr_category_status ON service_requests(category_id, status);

-- Teklifler
CREATE UNIQUE INDEX idx_offers_job_provider ON offers(job_id, provider_id);
CREATE INDEX        idx_offers_provider     ON offers(provider_id, status);
CREATE INDEX        idx_offers_job          ON offers(job_id, status);

-- Kabul edilenler
CREATE INDEX idx_accepted_job      ON accepted_offers(job_id);
CREATE INDEX idx_accepted_provider ON accepted_offers(provider_id);

-- Kota (her dağıtımda sorgulanır)
CREATE UNIQUE INDEX idx_quota_provider_month
  ON provider_monthly_quota(provider_id, month_year);

-- Response time (cevap hızı skoru)
CREATE INDEX idx_rt_provider_date
  ON response_times(provider_id, notified_at DESC);

-- Yorumlar
CREATE INDEX idx_reviews_provider ON reviews(provider_id, status);

-- NPS
CREATE INDEX idx_nps_provider ON nps_responses(provider_id, created_at DESC);
CREATE INDEX idx_nps_seeker   ON nps_responses(seeker_id, created_at DESC);

-- Şikayetler
CREATE INDEX idx_complaints_reported ON complaints(reported_id, status);

-- Abonelikler
CREATE UNIQUE INDEX idx_subscriptions_provider ON subscriptions(provider_id);
CREATE INDEX        idx_subscriptions_status   ON subscriptions(status, expires_at);

-- Ödemeler
CREATE INDEX idx_payments_subscription ON payments(subscription_id, created_at DESC);

-- Kampanya kullanımı
CREATE INDEX idx_campaign_usage_provider ON campaign_usage(provider_id);

-- Audit log
CREATE INDEX idx_messages_job       ON messages(job_id, created_at DESC);
CREATE INDEX idx_messages_receiver  ON messages(receiver_id, is_read);
CREATE INDEX idx_audit_staff_date   ON audit_logs(staff_id, created_at DESC);

-- Bildirim logları
CREATE INDEX idx_notif_user_date ON notification_logs(user_id, sent_at DESC);
```

> **Kural:** Tüm `FK` kolonları otomatik index almaz. Yukarıdaki liste Prisma migration'larına `@@index` direktifleriyle eklenmeli.

---

## 20. MVP PLANI

### Özellik → Faz Referans Kartı

Tüm PRD özelliklerinin hangi fazda geliştirileceği tek tabloda:

| Özellik | Faz | Hafta | PRD Ref |
|---|---|---|---|
| **TEMEL ALTYAPI** | | | |
| PostgreSQL + Redis + BullMQ kurulumu | Faz 1 | 1–2 | §15, §19 |
| NestJS proje yapısı, CI/CD | Faz 1 | 1–2 | §15 |
| Railway deploy ortamı | Faz 1 | 1–2 | §15 |
| **AUTH & KVKK** | | | |
| Telefon + OTP kaydı (push/uygulama içi) | Faz 1 | 1–2 | §2, §16 |
| JWT access + refresh token | Faz 1 | 1–2 | §16 |
| KVKK açık rıza onay akışı | Faz 1 | 1–2 | §12 |
| Hesap silme (veri anonimleştirme) | Faz 2 | 15–16 | §12.2 |
| **AI CHAT & TALEP** | | | |
| Platform içi chat (WebSocket) | Faz 1 | 3–4 | §3 |
| OpenAI GPT-4o + LangChain entegrasyonu | Faz 1 | 3–4 | §3, §13 |
| AI soru akışı (Ev Temizliği) | Faz 1 | 3–4 | §3.4 |
| Form oluşturma + platform içi onay | Faz 1 | 3–4 | §3.1 |
| Web chat + mobil chat | Faz 1 | 3–4 | §3 |
| AI soru akışları (5 ek kategori) | Faz 2 | 15–16 | §3.4 |
| PII izolasyonu (kişisel veri AI'ya gitmiyor) | Faz 1 | 3–4 | §13.2 |
| **EŞLEŞTİRME & TEKLİF** | | | |
| Hizmet veren paneli (gelen işler, teklif ver) | Faz 1 | 5–6 | §5 |
| "Kaç kişi görüyor?" bilgisi | Faz 1 | 5–6 | §5.1 |
| Telefon maskeleme (AES-256) | Faz 1 | 7–8 | §8 |
| 2 HV seçimi + onay popup | Faz 1 | 7–8 | §8.2 |
| Numara açılma + phone_reveal_logs | Faz 1 | 7–8 | §8.4 |
| Akıllı dağıtım algoritması (5 faktör) | Faz 2 | 11 | §11 |
| Aylık kota sistemi (14/30/60/sınırsız) | Faz 2 | 9–10 | §6 |
| **İŞ BİTİŞ & ÜCRET TEYİT** | | | |
| HV ücret beyanı formu | Faz 1 | 7–8 | §15.12 |
| HA karşılıklı onay — platform içi | Faz 1 | 7–8 | §15.12 |
| Uyuşmazlık alarm sistemi (%16/%31 eşikleri) | Faz 1 | 7–8 | §15.12.2 |
| Kalite personeli uyuşmazlık yönetimi | Faz 2 | 14 | §15.12.4 |
| **ÖDEME & PAKET** | | | |
| iyzico recurring payment | Faz 2 | 9–10 | §7 |
| Basic/Standart/Premium/VIP paketler | Faz 2 | 9–10 | §6 |
| Abonelik oluştur/iptal/askı akışları | Faz 2 | 9–10 | §7.2, §7.3 |
| Admin panel deneme yetkisi | Faz 2 | 9–10 | §7.6.5 |
| Başarısız ödeme 3 aşamalı retry | Faz 2 | 9–10 | §7.5 |
| E-arşiv fatura | Faz 2 | 9–10 | §7.2 |
| Kampanya & indirim kodu sistemi | Faz 3 | 21–22 | §7.6 |
| Ücretsiz deneme (free trial) akışı | Faz 3 | 21–22 | §7.6.4 |
| **PUAN & YORUM & NPS** | | | |
| Yorum formu + belge yükleme (S3) | Faz 2 | 12–13 | §9 |
| Admin yorum onay kuyruğu | Faz 2 | 12–13 | §15.5 |
| Telefon doğrulama kaydı (yorum için) | Faz 2 | 12–13 | §15.5 |
| Hizmet veren ortalama puan hesabı | Faz 2 | 12–13 | §9.2 |
| Görünürlük puan eşikleri | Faz 2 | 12–13 | §9.2 |
| NPS otomatik anketi — platform içi (30 dk) | Faz 2 | 12–13 | §14.7 |
| NPS puan grupları (Promoter/Pasif/Detraktör) | Faz 2 | 12–13 | §14.7 |
| NPS admin paneli (trend, kategori, alarm) | Faz 3 | 25–26 | §14.7 |
| **ŞİKÂYET & ANLAŞMAZLIK** | | | |
| Şikayet oluşturma (4 kategori) | Faz 2 | 14 | §10 |
| Admin şikayet karar akışı | Faz 2 | 14 | §15.6 |
| 4 kademeli ceza skalası | Faz 2 | 14 | §15.6 |
| Yorum itiraz akışı | Faz 2 | 14 | §10 |
| **BİLDİRİM SİSTEMİ** | | | |
| Temel bildirimler: Platform içi + Push (HA-01…05, HV-01…02) | Faz 1 | 7–8 | §14 |
| Tüm bildirim kodları (HA/HV/AD tam liste) | Faz 2 | 15–16 | §14 |
| Push notification (mobil FCM) | Faz 3 | 17–20 | §14 |
| NPS bildirim akışı (HA-08, HA-09) | Faz 2 | 12–13 | §14.7 |
| Kampanya bildirimleri (HV-17, HV-18) | Faz 3 | 21–22 | §14 |
| **ADMIN PANEL & PERSONEL** | | | |
| **CHAT-FIRST ARAYÜZ** | | | |
| Ana sayfa chat ekranı (karşılama) | Faz 1 | 7–8 | §1.4, §3.1 |
| Canlı teklif akışı (WebSocket) | Faz 1 | 7–8 | §13.5 |
| Hızlı seçim chip'leri (kategori kısayolları) | Faz 1 | 7–8 | §1.4 |
| Temel admin (kullanıcı listesi, talep izleme) | Faz 1 | 7–8 | §15.2, §15.3 |
| HV onay akışı (admin) | Faz 1 | 5–6 | §15.4 |
| Yorum onay kuyruğu + red şablonları | Faz 2 | 12–13 | §15.5 |
| Şikayet yönetimi + SLA takibi | Faz 2 | 14 | §15.6 |
| 10 personel rolü + izin matrisi | Faz 2 | 14 | §15.13 |
| Audit log (tüm admin aksiyonları) | Faz 2 | 14 | §15.13.5 |
| Arama görev listesi (call_tasks) | Faz 2 | 12–13 | §15.13 |
| Role özel dashboard (kalite/satış/yönetici) | Faz 2 | 14 | §15.13.4 |
| KVKK talep yönetimi | Faz 2 | 15–16 | §15.10 |
| Ödeme & abonelik yönetimi | Faz 2 | 9–10 | §15.8 |
| Performans & analitik dashboard | Faz 2 | 15–16 | §15.9 |
| Kampanya yönetimi paneli | Faz 3 | 21–22 | §15 |
| Executive (yönetici) dashboard | Faz 3 | 25–26 | §15.13.4 |
| A/B test & Ar-Ge paneli | Faz 3 | 25–26 | §15.13 |
| **MOBİL UYGULAMA — Esnaaf (HA)** | | | |
| React Native (Expo) — Esnaaf kurulumu | Faz 3 | 17–18 | §2.1 |
| Hizmet alan chat, teklif, kabul ekranları | Faz 3 | 17–18 | §2.1 |
| App Store + Play Store — Esnaaf yayını | Faz 3 | 17–18 | — |
| **MOBİL UYGULAMA — Esnaaf Partner (HV)** | | | |
| React Native (Expo) — Esnaaf Partner kurulumu | Faz 3 | 19–20 | §2.2 |
| HV gelen işler, teklif, mesajlaşma ekranları | Faz 3 | 19–20 | §2.2 |
| HV CRM: kazanç analizi, rota, kota ekranları | Faz 3 | 19–20 | §2.2 |
| App Store + Play Store — Esnaaf Partner yayını | Faz 3 | 19–20 | — |
| **BÜYÜME** | | | |
| 6 kategori (Faz 2 ekleri) | Faz 2 | 15–16 | §3.3 |
| 14 kategori (Faz 3 ekleri) | Faz 3 | 23–24 | §3.3 |
| Ankara + İzmir açılışı | Faz 3 | 23–24 | — |
| Satış CRM görünümü + özel kod | Faz 3 | 21–22 | §7.6.6 |
| Hizmet veren sağlık skoru | Faz 2 | 15–16 | §15.13 |
| Railway → AWS ECS geçişi | Faz 3 | 25–26 | §15 |

---

### Genel Strateji

| Strateji | Karar |
|---|---|
| Başlangıç kategorisi | Sadece **Ev Temizliği** (Faz 1), 6 kategori (Faz 2) |
| İlk pazar | Tek şehir — İstanbul (Kadıköy, Beşiktaş, Şişli pilot) |
| Önce kim gelir? | **Hizmet verenler** — 30 HV manuel topla, sonra talep aç |
| İlk ay HV ücreti? | **Ücretsiz** — free trial ile büyü, Faz 2'de ödeme aç |
| Esnaaf (HA) ne zaman? | **Faz 3 Hafta 17–18** — web kanıtlandıktan sonra |
| Esnaaf Partner (HV) ne zaman? | **Faz 3 Hafta 19–20** — HA app'i sonra, HV ayrı uygulaması |
| Hedef: Faz 1 bitişinde | 30 HV · 50 tamamlanmış iş · %70+ memnuniyet |

---

### FAZ 1 — Çekirdek Akış (Hafta 1–8)

**Amaç:** Tek kategoride (Ev Temizliği), tek şehirde (İstanbul) uçtan uca çalışan sistem.
**Ekip:** 1 backend, 1 frontend, 1 ürün/test

#### Hafta 1–2 — Temel Altyapı

| Alan | Yapılacak | PRD Ref |
|---|---|---|
| DB | PostgreSQL şema kurulumu (temel tablolar) | §19 |
| Auth | Kullanıcı kaydı, OTP (push), JWT | §2, §16 |
| KVKK | Açık rıza onay akışı — kayıt zorunlu | §12 |
| Roller | `service_seeker` ve `service_provider` rolleri | §16 |
| Altyapı | NestJS proje yapısı, Redis, BullMQ kurulumu | §15 |
| Deploy | Railway (MVP ortamı), environment değişkenleri | §15 |

**Bu hafta çalışır olması gereken:** Telefon ile kayıt ol → OTP doğrula → KVKK onayla → giriş yap.

---

#### Hafta 3–4 — AI Chat & Talep Sistemi

| Alan | Yapılacak | PRD Ref |
|---|---|---|
| Platform Chat | WebSocket kurulumu, chat arayüzü | §3 |
| AI Chat | OpenAI GPT-4o entegrasyonu, LangChain kurulumu | §3, §13 |
| Chat akışı | Kategori tespiti → soru akışı → form oluşturma | §3.3, §3.4 |
| OTP (chat) | Chat içi uygulama push doğrulama | §3 |
| Form onayı | Platform içi form göster → kullanıcı onayı | §3.1 |
| Talep kaydı | `service_requests` tablosuna yazma | §4 |
| Web & Mobil Chat | Web ve mobil uygulamada AI chat | §3 |

**Bu hafta çalışır olması gereken:** Web/mobil chat açılır → AI sorularla veri toplar → form oluşturur → kullanıcı onaylar → sisteme kayıt düşer.

---

#### Hafta 5–6 — Hizmet Veren & Eşleştirme

| Alan | Yapılacak | PRD Ref |
|---|---|---|
| HV Paneli | Kayıt, kategori seçimi, admin onay akışı | §2.2 |
| Gelen işler | HV'nin talep listesini görmesi | §5 |
| Teklif ver | Fiyat + mesaj ile teklif oluşturma | §18.4 |
| Dağıtım (basit) | Lokasyon bazlı manuel dağıtım (algoritma Faz 2'de) | §11 |
| "Kaç kişi görüyor?" | Gelen iş kartında rakip sayısı | §5.1 |
| Admin onay | Admin panelinde HV başvuru onaylama | §15.4 |

**Bu hafta çalışır olması gereken:** Admin HV'yi onayla → HV panelde iş görsün → teklif versin.

---

#### Hafta 7–8 — Hizmet Alan Paneli & İş Bitiş

| Alan | Yapılacak | PRD Ref |
|---|---|---|
| HA Paneli | Aktif talepler, gelen teklifler ekranı | §2.1 |
| Maskeleme | Teklif listesinde telefon maskeleme | §8 |
| Kabul akışı | Onay popup → 2 HV seçimi → numara açılma | §8.2 |
| İş bitiş | HV ücret beyanı → HA onayı → tamamlama | §15.12 |
| Uyuşmazlık | Ücret farkı alarm sistemi (temel) | §15.12.2 |
| Bildirimler | Temel bildirimler: Platform içi + Push (HA-01…05, HV-01…02) | §14.2, §14.3 |
| Admin temel | Kullanıcı listesi, talep izleme, basit dashboard | §15.2, §15.3 |

**Bu hafta çalışır olması gereken:** Uçtan uca iş akışı — talep → teklif → kabul → iş bitişi → ücret teyiti.

---

**Faz 1 Bitişinde Olmayan Özellikler:**

```
✗ Ödeme / paket sistemi (HV ilk ay ücretsiz)
✗ NPS & yorum sistemi
✗ Akıllı dağıtım algoritması
✗ Mobil uygulama
✗ Kampanya sistemi
✗ Rol yönetimi (sadece super_admin aktif)
✗ 6 kategoriden fazlası
✗ İstanbul dışı şehirler
```

---

### FAZ 2 — Para Kazanma (Hafta 9–16)

**Amaç:** Gelir modeli aktif, kalite sistemi çalışır, 6 kategoride büyüme.

#### Hafta 9–10 — Ödeme & Paket Sistemi

| Alan | Yapılacak | PRD Ref |
|---|---|---|
| iyzico | Recurring payment entegrasyonu | §7 |
| Paket sistemi | Basic/Standart/Premium/VIP tanımları | §6 |
| Abonelik akışı | Oluştur → ödeme → aktifleştir | §7.2 |
| Kota sistemi | Aylık kabul kotası takibi | §6 Kota |
| İptal senaryosu | Dönem sonu aktif, yeni iş göremez | §7.3 |
| Başarısız ödeme | 3 aşamalı retry + bildirim | §7.5 |
| Fatura | E-arşiv fatura kesimi | §7.2 |

---

#### Hafta 11 — Akıllı Dağıtım Algoritması

| Alan | Yapılacak | PRD Ref |
|---|---|---|
| Skor hesabı | Paket(%35) + Puan(%25) + Hız(%20) + Lokasyon(%15) + Aktiflik(%5) | §11 |
| Kota kontrolü | Dağıtımda kota doluysa listeden çıkar | §6 Kota |
| Response time | `response_times` tablosuna veri yazmaya başla | §19 DB |
| Yeni üye bonusu | İlk 30 gün bonus iş dağıtımı | §11 |

---

#### Hafta 12–13 — Yorum & NPS & Kalite Sistemi

| Alan | Yapılacak | PRD Ref |
|---|---|---|
| Yorum sistemi | Belge yükleme + yorum formu | §9 |
| Yorum onay | Admin onay kuyruğu + telefon doğrulama kaydı | §15.5 |
| NPS | Otomatik platform içi anketi (30 dk sonra) | §14.7 |
| NPS takip | Düşük puan → kalite personeli alarmı | §14.7 |
| Arama görevleri | `call_tasks` tablosu + kalite personeli dashboard | §15.13 |
| Puan skoru | Hizmet veren ortalama puan hesabı | §9.2 |

---

#### Hafta 14 — Şikayet & Rol Sistemi

| Alan | Yapılacak | PRD Ref |
|---|---|---|
| Şikayet | Kategori seçimi → admin kuyruğu → karar | §10 |
| Ceza skalası | 1-2-3-4 şikayet kuralları | §15.6 |
| İtiraz | Hizmet veren yorum itiraz akışı | §10 |
| 10 Rol | Tüm personel rolleri ve izin matrisi | §15.13 |
| Personel paneli | Role göre özelleşen dashboard | §15.13.4 |
| Audit log | Tüm admin aksiyonları loglanır | §15.13.5 |

---

#### Hafta 15–16 — Kategoriler & Admin Tamamlama

| Alan | Yapılacak | PRD Ref |
|---|---|---|
| 6 kategori | Boya Badana, Nakliyat, Su Tesisatı, Elektrik, Ev Tadilat | §3.3 |
| AI soru şablonları | Her kategori için soru akışı | §3.4 |
| Admin dashboard | Anlık metrikler, bekleyen işlemler | §15.2 |
| KVKK yönetimi | Veri silme talebi işleme akışı | §15.10 |
| Bildirim sistemi | Tüm bildirim kodları (HA/HV/AD) | §14 |
| Hizmet sağlık skoru | Puan + NPS + şikayet birleşik skor | §15.13 |

---

**Faz 2 Bitişinde Hedefler:**

```
✓ Ödeme sistemi aktif — ilk gelir
✓ 6 kategori çalışır
✓ NPS sistemi aktif — ilk ölçümler
✓ Kalite ekibi çalışmaya başlar
✓ Akıllı dağıtım algoritması devrede
✓ 10 personel rolü aktif
```

---

### FAZ 3 — Büyüme (Hafta 17–26)

**Amaç:** İki ayrı mobil uygulama (Esnaaf + Esnaaf Partner), kampanya sistemi, çoklu şehir, ölçeklenme.

#### Hafta 17–18 — Esnaaf (Hizmet Alan Uygulaması)

**App Store / Play Store:** "Ev temizliği, boya ustası bul, hizmet al"
**Hedef kitle:** Hizmet aramak isteyen bireysel kullanıcılar

| Alan | Yapılacak | PRD Ref |
|---|---|---|
| React Native (Expo) | Esnaaf proje kurulumu, temel navigasyon | §2.1 |
| AI Chat ekranı | Talep oluşturma sohbet arayüzü | §3 |
| Teklif listesi | Gelen teklifler, HV profil kartları | §2.1 |
| Mesajlaşma | HV ile platform içi sohbet | §8.2 |
| Kabul & numara açılma | Onay popup, iletişim ekranı | §8.3 |
| İş bitiş onayı | Ücret beyanı onay ekranı | §15.12 |
| Push FCM | Firebase entegrasyonu — HA bildirimleri | §14 |
| App Store + Play Store | Esnaaf yayını | — |

---

#### Hafta 19–20 — Esnaaf Partner (Hizmet Veren Uygulaması)

**App Store / Play Store:** "İş bul, müşteri kazan, ek gelir — Esnaaf Partner"
**Hedef kitle:** Usta, serbest çalışan, küçük işletme

| Alan | Yapılacak | PRD Ref |
|---|---|---|
| React Native (Expo) | Esnaaf Partner proje kurulumu | §2.2 |
| Gelen işler (Inbox) | Yeni talepler, viewer sayısı | §5 |
| Teklif verme | Fiyat + mesaj formu | §5 |
| Mesajlaşma | Müşteriyle platform içi sohbet | §8.2 |
| Kazanılan işler | Kabul edilen talepler, müşteri bilgisi | §2.2 |
| İş tamamlama | Ücret beyanı formu | §15.12 |
| CRM Dashboard | Aylık kazanç, tamamlanan iş grafiği | §2.2 |
| Rota görünümü | Günün işleri harita üzerinde | §2.2 |
| Kota durumu | Aylık kota ve paket bilgisi | §6 |
| Push FCM | Firebase entegrasyonu — HV bildirimleri (ayrı kanal) | §14 |
| App Store + Play Store | Esnaaf Partner yayını | — |

---

#### Hafta 21–22 — Kampanya & Satış Sistemi

| Alan | Yapılacak | PRD Ref |
|---|---|---|
| Kampanya motoru | 4 tip kampanya: %, TL, trial, upgrade | §7.6 |
| Kod doğrulama | 6 kurallı doğrulama akışı | §7.6.2 |
| Free trial akışı | 14 gün ücretsiz, 13. gün uyarı | §7.6.4 |
| Satış CRM görünümü | Özel kod üretimi, churn listesi | §7.6.6 |
| Kampanya analitik | Dönüşüm oranı, gelir etkisi | §7.6.5 |

---

#### Hafta 23–24 — Çoklu Şehir, Kategori & Referans Sistemi

| Alan | Yapılacak | PRD Ref |
|---|---|---|
| Ankara & İzmir | İkinci ve üçüncü şehir açılışı | — |
| 14 kategori | Faz 3 kategorileri (§3.3 tablosu) | §3.3 |
| Lokasyon servisi | İlçe bazlı dağıtım hassasiyeti | §11 |
| Çoklu dil hazırlığı | i18n altyapısı (ilerisi için) | — |
| **Referans sistemi** | Kullanıcı referans kodu üretir → arkadaşına gönderir → kayıt olunca ödül | — |

**Referans Sistemi Detayı:**

```
Kullanıcı (HA veya HV) → Panel'den referans kodu alır (örn: AHMET42)
        ↓
Linki / kodu arkadaşına gönderir
        ↓
Arkadaş kayıt olurken kodu girer
        ↓
Doğrulanır:
  - Kod geçerli mi?
  - Bu kişi daha önce kayıtlı mıydı?
        ↓
Ödül sistemi:
  - HA referansı → 1. iş tamamlandığında referans veren HA'ya 100 TL kredi (platform içi)
  - HV referansı → Referee HV ilk aboneliğini alınca referans veren HV'ye 500 TL indirim
        ↓
Kredi platform içi ödemelerde veya abonelik indiriminde kullanılır
```

**DB Tablosu:**
```sql
referrals (
  id UUID PK,
  referrer_id UUID FK REFERENCES users(id),
  referee_id  UUID FK REFERENCES users(id),
  code        VARCHAR(12) UNIQUE,
  type        ENUM('seeker_credit','provider_discount'),
  reward_amount DECIMAL,
  rewarded    BOOLEAN DEFAULT false,
  rewarded_at TIMESTAMP,
  created_at  TIMESTAMP
)
```

---

#### Hafta 25–26 — İleri Analitik & Ölçekleme

| Alan | Yapılacak | PRD Ref |
|---|---|---|
| NPS paneli tam | 12 hafta trend, kategori bazlı, detraktör alarm | §14.7 |
| Yönetici dashboard | Executive görünümü, MRR, büyüme grafikleri | §15.13.4 |
| Ar-Ge paneli | A/B test altyapısı, funnel analizi | §15.13 |
| Performans | Redis cache optimizasyonu, DB index'leri | §15 |
| Ölçekleme | Railway → AWS ECS geçişi (trafik eşiğine göre) | §15 |

---

### Teknoloji Kurulum Sırası (Faz 1 — Hafta 1)

Geliştirmeye başlamadan önce kurulması gereken servisler:

```
Gün 1:
  □ Railway hesabı + proje oluştur
  □ PostgreSQL instance aç
  □ Redis (Upstash) bağla
  □ NestJS proje scaffolding

Gün 2:
  □ E-posta servisi kurulumu (Sendgrid veya Amazon SES)
    □ Firebase projesi + FCM kurulumu
    □ Netgsm SMS hesabı + test OTP SMS
  □ OpenAI API key al
  □ Firebase projesi + FCM kurulumu
    □ Netgsm SMS hesabı + test OTP SMS

Gün 3:
  □ GitHub repo + CI/CD (GitHub Actions → Railway)
  □ Environment değişkenleri (.env yapısı)
  □ Prisma schema başlangıç migration

Gün 4-5:
  □ Auth modülü (OTP + JWT)
  □ İlk endpoint testleri
```

> ⚠️ **Kritik:** Firebase FCM entegrasyonunu geliştirmeye başlamadan kurun.
> OTP push notification testlerini geliştirme ortamında doğrulayın.

---

### Faz Geçiş Kriterleri

Bir sonraki faza geçmek için bu eşikler sağlanmalı:

| Kriter | Faz 1 → 2 | Faz 2 → 3 |
|---|---|---|
| Tamamlanan iş | 50 iş | 300 iş |
| Aktif HV sayısı | 30 HV | 100 HV |
| Memnuniyet (NPS) | — | NPS ≥ 30 |
| Ödeme sistemi | Hazır değil | Aktif, ilk gelir alındı |
| Esnaaf uygulaması | Hazır değil | Yayında (App Store + Play Store) |
| Esnaaf Partner | Hazır değil | Yayında (App Store + Play Store) |
| Kritik bug | Sıfır P0 bug | Sıfır P0 bug |
| Ortalama yanıt süresi | < 2 saat | < 1 saat |

---

### Geliştirme Önceliklendirme Kuralı

Her sprint'te şu sırayla önceliklendir:

```
1. P0 — Sistemin çalışmasını engelleyen her şey (anında)
2. P1 — Para kazanmayı engelleyen her şey (bu sprint)
3. P2 — Kullanıcı deneyimini bozan her şey (gelecek sprint)
4. P3 — Nice-to-have özellikler (backlog)
```

---

---

## 21. CLAUDE CODE BAŞLANGIÇ PROMPTLARI

Geliştirmeye başlarken her adımda kullanılacak hazır promptlar.
Her prompt öncesinde ilgili agent SKILL.md dosyasını context'e ekleyin.

### Adım 0 — Proje Kurulumu

```
esnaaf-claude.md dosyasının §16.0 klasör yapısını ve §19 DB şemasını oku.
docs/agents_v2/m7-infra/SKILL.md dosyasını oku.

Şunları yap:
1. esnaaf/ monorepo yapısını oluştur:
   backend-api/ · app-musteri/ · app-hizmetveren/
2. backend-api/ için NestJS projesi kur
3. prisma/schema.prisma dosyasını §19 DB şemasına göre yaz
4. §19.2 kritik indexleri @@index direktifleriyle ekle
5. .env.example dosyasını §16.4'teki listeyle oluştur
6. İlk migration'ı çalıştır
7. prisma/seed.ts dosyasını §3.3 kategori listesiyle yaz
```

### Adım 1 — Auth (backend-api/)

```
backend-api/ klasöründe çalış. Başka klasöre dokunma.
esnaaf-claude.md §2, §12, §17.1 bölümlerini oku.
docs/agents_v2/m1-auth/SKILL.md dosyasını oku.

/api/ortak/auth/* endpoint'lerini yaz:
- OTP üret ve push notification ile gönder
- JWT access (15dk) + refresh (7gün) token
- Telefon AES-256 şifrele, maskeli format sakla
- KVKK onay endpoint'i
- OTP'yi SMS ile gönder (Netgsm) — push ile değil
- §17.1 hata senaryolarını uygula (3 yanlış → 5dk kilit)
```

### Adım 2 — Chat-First Ana Sayfa (app-musteri/)

```
app-musteri/ klasörüne gir. Başka klasöre dokunma.
esnaaf-claude.md §1.4 ve §3.1 bölümlerini oku.
esnaaf-design-brief.docx §11 bölümünü oku.

Next.js (App Router) ile ana sayfa yap:
- Arka plan: #F5F5F5 (tam ekran)
- Ortada logo (esnaaf logosunu /public/logo.svg olarak yerleştir)
- Logo altında büyük textarea:
    placeholder: "Bana neye ihtiyacın olduğunu söyle..."
    max-width: 680px, border-radius: 16px
    focus: border 2px solid #D4F54E
- Textarea altında chip'ler:
    [🏠 Ev Temizliği] [🎨 Boya] [🔧 Tesisat] [⚡ Elektrik] [➕ Diğer]
    Chip tıklanınca textarea'ya yazılır ve submit tetiklenir
- Gönder butonu: #D4F54E arka plan, #232323 metin, ikon: →
- Mobil: chip'ler klavye açılınca gizlenir (visualViewport API)
- Başka hiçbir element yok (nav, header, footer, banner)
- Sayfa adı: "Esnaaf — Ne istediğini yaz, ustası gelsin"
```

### Adım 3 — AI Chat & Canlı Teklif Akışı (backend-api/ + app-musteri/)

```
Önce backend-api/ klasöründe:
esnaaf-claude.md §3, §13, §13.5 bölümlerini oku.
docs/agents_v2/m2-ai-chat/SKILL.md dosyasını oku.

1. /api/musteri/chat/mesaj endpoint'ini yaz:
   - LangChain + GPT-4o ile kategori tespiti
   - §13.2 PII izolasyonu (kişisel veri AI'ya gitmesin)
   - Redis session yönetimi (TTL: 24 saat)
2. Socket.io kurulumu:
   - room: "job_{jobId}"
   - offer.created event → ilgili odaya emit et

Sonra app-musteri/ klasörüne geç:
3. Chat ekranı bileşeni:
   - Kullanıcı mesajı → sağda balon
   - AI yanıtı → solda balon (Esnaaf ikonu ile)
   - Teklif balonu özel tasarım:
     🔔 [HV adı] — [Fiyat] TL
     [Profili Gör] [Mesaj Gönder] [Kabul Et]
   - Socket.io client bağlantısı (canlı teklif için)
```

### Adım 4 — Gelen İşler Ekranı (app-hizmetveren/)

```
app-hizmetveren/ klasörüne gir. Başka klasöre dokunma.
esnaaf-claude.md §5 bölümünü oku.
docs/agents_v2/m3-matching/SKILL.md dosyasını oku.

Esnaaf Partner — Gelen İşler ekranını yap:
- Her iş kartında: kategori, ilçe, özet, kaç kişi görüyor
- [Teklif Ver] ve [Detay] butonları
- Teklif verme formu: fiyat input + mesaj textarea
- Socket.io: yeni iş düşünce kart canlı eklenir
- Boş state: "Henüz iş talebi yok, birazdan gelecek"
```

### Adım 5 ve sonrası

```
Her adımda:
1. İlgili SKILL.md dosyasını oku
2. Sadece o klasörde çalış
3. Başka klasöre dokunma
4. Değişiklik sonrası: "Bu adımda sadece X klasöründe Y değişikliği yaptım"

Sıra: Auth → Chat Ana Sayfa → Gelen İşler →
      Teklif Akışı → İş Bitiş → Ödeme → Admin
```

---

*Son güncelleme: 2025 | Versiyon: 3.0*
