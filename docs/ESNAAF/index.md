---
title: Esnaaf Wiki — Ana Sayfa & Katalog
type: genel
prd-refs: ["§1", "§2", "§3", "§4", "§5", "§6", "§7", "§8", "§9", "§10", "§11", "§12", "§13", "§14", "§15", "§16", "§17", "§18", "§19", "§20"]
related: ["[[00-Genel-Bakış]]", "[[log]]"]
status: complete
updated: 2026-05-24
---

# 🗺️ Esnaaf Wiki Bilgi Deposu & Katalog

> Türkiye'nin ilk **"Conversational Commerce"** hizmet eşleştirme platformu olan **Esnaaf** projesinin tüm analiz, tasarım, veritabanı, API, akış ve MVP planlama belgelerinin ana kataloğu.

Bu bilgi tabanı, 3824 satırlık ham ürün gereksinim dokümanının (PRD) ve mevcut modül ajanslarının yetenek setlerinin (SKILL dosyaları) Obsidian uyumlu, çapraz bağlantılı ve modüler bir şekilde yapılandırılmış halidir.

---

## 🚀 Giriş
*   **[[00-Genel-Bakış]]** — Esnaaf vizyonu, ana kullanıcı akışı, karşılama ekranı tasarım kuralları ve modül mimarisi.

---

## 🧩 Modüller (M1 — M7)
*   **[[M1-Auth-Kullanıcı]]** — Üyelik sistemi, OTP doğrulama, bireysel/kurumsal profil ve KVKK onayları.
*   **[[M2-AI-Chat-Talep]]** — OpenAI + LangChain ile doğal dil işleme, kategori tespiti, akıllı form oluşturma.
*   **[[M3-Eşleştirme-Teklif]]** — Akıllı usta dağıtımı, canlı WebSocket teklif akışı, maskelenmiş telefon yönetimi.
*   **[[M4-Ödeme-Kampanya]]** — iyzico entegrasyonu, abonelik paketleri, aylık limit/kota ve kampanya kodları.
*   **[[M5-Puan-Şikayet-NPS]]** — Puanlama, usta değerlendirme, şikayet akışları ve 4 aşamalı ceza algoritması.
*   **[[M6-Admin-Roller]]** — Personel rolleri, çağrı görev yönetimi, denetim (audit) logları ve çağrı merkezi akışları.
*   **[[M7-Altyapı]]** — Monorepo, veritabanı şeması, API mimarisi, ENV değişkenleri ve izleme/alarm limitleri.

---

## 👥 Roller & Aktörler
*   **[[Hizmet-Alan]]** — Bireysel ve kurumsal müşteriler, talep oluşturma limitleri ve panel detayları.
*   **[[Hizmet-Veren]]** — Bireysel ve kurumsal ustalar/firmalar, abonelik paketleri, teklif limitleri ve sağlık skoru.
*   **[[Admin-Roller-İzinler]]** — Platformdaki 10 farklı personel rolü ve bu rollerin 16 modül üzerindeki yetki matrisi.

---

## 🔄 Süreç Akışları
*   **[[AI-Chat-Akışı]]** — Karşılama ekranından başlayıp onaylı iş talebi oluşturmaya kadar giden 8 adımlı akış.
*   **[[Anonim-Chat-Akışı]]** — Giriş yapmadan chat başlatma, Redis session yönetimi ve inline kayıt dönüşümü.
*   **[[OTP-Kayıt-Akışı]]** — SMS ile OTP doğrulama kuralları, hız limitleri ve yanlış deneme kilitleri.
*   **[[Talep-Yaşam-Döngüsü]]** — İş taleplerinin 48 saatlik ömrü, otomatik kapanma, iptal ve yeniden oluşturma.
*   **[[Teklif-Kabul-Akışı]]** — Maksimum 3 teklif kabulü, telefonların karşılıklı açılması ve onay pencereleri.
*   **[[Abonelik-Ödeme-Akışı]]** — Kart tokenizasyonu, otomatik tahsilat denemeleri ve başarısız ödeme aksiyonları.
*   **[[KVKK-Onay-Akışı]]** — İlk girişte zorunlu yasal onaylar ve ticari elektronik ileti izinleri.
*   **[[İş-Bitiş-Teyit-Akışı]]** — Hizmet bedeli beyanı, müşteri teyidi ve bedel farkı alarm limitleri.

---

## 💡 Kavramlar & Algoritmalar
*   **[[Paketler]]** — Basic, Standart, Premium ve VIP abonelik seviyeleri, dağıtım öncelikleri ve VIP rozeti kuralları.
*   **[[Aylık-Kota-Sistemi]]** — Paket limitlerine bağlı teklif kabul kotasının düşme, sıfırlanma ve aşım kuralları.
*   **[[Telefon-Maskeleme]]** — AES-256 telefon şifreleme ve teklif kabulüne bağlı karşılıklı açılma kuralları.
*   **[[Akıllı-Dağıtım-Algoritması]]** — Taleplerin paket, puan, yanıt hızı, konum ve süreye göre usta ile eşleşme formülü.
*   **[[Anonim-Session]]** — Redis UUID temp_session yönetimi ve chat geçmişini saklama.
*   **[[PII-İzolasyonu]]** — Kişisel verilerin regex ile temizlenmesi ve OpenAI güvenliği.
*   **[[Kampanya-Kodları]]** — İndirim kodlarının (PERCENT, FIXED, vb.) kuralları ve uygulanma koşulları.
*   **[[NPS-Skoru]]** — NPS skorunun hesaplanması, promoter/detractor alarmları ve otomatik anket tetikleyicileri.
*   **[[HV-Sağlık-Skoru]]** — Hizmet verenlerin performans puanlama formülü ve görünürlük katmanları.
*   **[[Hızlı-Seçim-Chipleri]]** — Karşılama ekranındaki hızlı kategori seçim tasarımı ve mobil UI kuralları.
*   **[[Favori-HV]]** — Kullanıcının favori ustalarını kaydetme ve iş gönderme önceliği.

---

## 🗄️ Veritabanı & API
*   **[[Veritabanı-Genel]]** — 33 tablonun listesi, modüllere göre gruplama ve kritik indeksler.
*   **[[API-Genel]]** — Base URL, prefix yapıları, header bilgileri ve hata formatları.

---

## 🔔 Bildirim Sistemleri
*   **[[HA-Bildirimleri]]** — Hizmet Alanlara giden HA-01'den HA-12'ye kadar bildirim şablonları.
*   **[[HV-Bildirimleri]]** — Hizmet Verenlere giden HV-01'den HV-21'ye kadar bildirim şablonları.
*   **[[AD-Bildirimleri]]** — Adminlere giden AD-01'den AD-07'ye kadar sistem alarmları.

---

## 💻 Teknoloji & Mimari
*   **[[Stack]]** — NestJS, Prisma, Next.js, React Native Expo, Redis ve S3 yapılandırması.
*   **[[Monorepo-Yapısı]]** — backend-api, app-musteri, app-hizmetveren klasör düzeni.

---

## 🛡️ Güvenlik & KVKK
*   **[[JWT-Token]]** — Access Token, Refresh Token süreleri ve rol yönetimi.
*   **[[Rate-Limit]]** — IP ve Endpoint bazlı istek limitleme kuralları.
*   **[[KVKK-Veri-Saklama]]** — Veri türlerine göre saklama süreleri ve hesap silme.
*   **[[Dosya-Yükleme]]** — S3 Presigned URL ile frontend'den güvenli dosya yükleme.

---

## 🗂️ Hizmet Kategorileri
*   **[[Hizmet-Kategorileri]]** — Platformdaki 20 hizmet kategorisi ve fazları.
*   **[[Kategori-Bazlı-Soru-Akışı]]** — Faz-1 kategorilerine özel AI soru şablonları.

---

## 📅 MVP Yol Haritası
*   **[[MVP-Faz-1]]** — Hafta 1-8: Tek kategori (Ev Temizliği) ve tek şehirde canlı akış.
*   **[[MVP-Faz-2]]** — Hafta 9-16: Ödeme, kalite sistemleri, 6 kategori ve smart distribution.
*   **[[MVP-Faz-3]]** — Hafta 17-26: Mobil uygulamalar, kampanya yönetimi ve ölçekleme.

---

## 📝 Sistem Dosyaları
*   **[[log]]** — Wiki üzerindeki tüm yapısal ve içerik değişikliklerinin kronolojik kaydı.
