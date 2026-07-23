# Esnaaf Geliştirme Yol Haritası ve Adımları

Bu doküman, Esnaaf platformunun geliştirme sürecindeki tüm adımları ve bunların tamamlanma durumlarını takip eder.

---

## 📅 Adımlar ve Durum Tablosu

| Adım | Sorumluluk | Açıklama | Durum |
|---|---|---|---|
| **Adım 0** | **Altyapı & DB** | NestJS scaffold, dependency yükleme, `.env.example`, `schema.prisma` (Faz 1 aktif), PostgreSQL migration ve Seeding | **✅ Tamamlandı** |
| **Adım 1** | **Ortak Yapı & Güvenlik** | Ortak Prisma Servisi/Modülü, JWT & Rol Yetkilendirme (RBAC) Guard'ları, Custom Dekoratörler, HttpExceptionFilter ve AES-256 Telefon Şifreleme/Maskeleme yardımcısı | **✅ Tamamlandı** |
| **Adım 2** | **Auth & Üyelik** | Netgsm OTP SMS entegrasyonu, Seeker/Provider kayıt/profil akışları | **✅ Tamamlandı** |
| **Adım 3** | **WebSocket Chat** | Gerçek zamanlı WebSocket chat odaları, HA-HV mesajlaşma altyapısı | **✅ Tamamlandı** |
| **Adım 4** | **Teklif & Dağıtım** | Canlı WebSocket teklif akışı, usta dağıtım mantığı (Faz 1) | **✅ Tamamlandı** |
| **Adım 5** | **Kabul & Maskeleme** | 2-HV teklif kabul limitleri, mutual reveal, telefon maskeleme ve KVKK logları | **✅ Tamamlandı** |
| **Adım 6** | **İş Bitiş & Teyit** | İş tamamlandı beyanı, ücret teyidi, bedel farkı alarm limitleri | **✅ Tamamlandı** |
| **Adım 7** | **Hizmet Veren Arayüzü & Kabul** | Usta gelen işler, teklif verme, teklif kabul etme (telefon açma) ve platform içi mesajlaşma | **✅ Tamamlandı** |
| **Adım 8** | **Admin Kontrolleri** | Usta onay ekranı, temel denetim dashboard'u | **✅ Tamamlandı** |
| **Adım 9** | **Abonelik & Ödeme** | iyzico ödeme entegrasyonu, kampanya kodları, 3 aşamalı retry, kotalar, admin trial yetkileri | **✅ Tamamlandı** |
| **Adım 10** | **NPS & Bildirim** | BullMQ NPS & dispute-alert kuyrukları, 0-10 NPS akışı (Detraktör / Pasif / Promoter), FCM push token tescili, HA-01'den HA-12'ye ve HV-01'den HV-21'e tüm transactional şablonlar | **✅ Tamamlandı** |
| **Adım 11** | **Admin Yetki & Uyuşmazlık** | 10 personel rolü + statik/dinamik yetki matrisi, admin kullanıcı & staff onboarding, Audit Log sistemi, FIFO SLA-uyumlu Call Tasks çağrı kuyruğu ve uyuşmazlık çözüm endpoint'leri | **✅ Tamamlandı** |
| **Adım 12** | **Faz 2 Kategori Genişlemesi** | 5 yeni kategorinin aktifleştirilmesi, kategoriye özel dinamik AI chat soru akışı, müşteri onay özet kartının dinamik hale getirilmesi, PostgreSQL WIN1254 encoding çözümü | **✅ Tamamlandı** |
| **Adım 13** | **React Native HA Mobil** | Esnaaf Seeker (HA) mobil uygulamasının Expo SDK 56 ile başlatılması, platform API yönlendiricisi, AsyncStorage session interceptor'ı ve AI Chat/WebSocket akış ekranı | **✅ Tamamlandı** |
| **Adım 14** | **React Native HV Mobil** | Esnaaf Partner (HV) mobil uygulamasının Expo SDK 56 ile başlatılması, AsyncStorage Bearer Token interceptor'ı, gelen işler/teklif modalı ve WebSocket canlı iş akışı | **✅ Tamamlandı** |
| **Adım 15** | **Kampanya & Referans** | Kampanya motorunun 4 tipe (İndirim, Ek Kota, Trial, Davet) genişletilmesi, deterministik davet kodları ve çift yönlü HA/HV referans ödüllendirme altyapısı | **✅ Tamamlandı** |
| **Adım 16** | **Çoklu Şehir & Kategori** | Ankara ve İzmir lansmanları, 14 aktif kategori genişlemesi, ilçe bazlı akıllı konum çözümleme ve bölge sınır dağıtımı | **✅ Tamamlandı** |
| **Adım 17** | **NPS & Analitik Paneller** | Net NPS hesaplama, detraktör alarmları, Executive/Quality/Sales role özel dashboard'lar ve Redis A/B test parametre yönetimi | **✅ Tamamlandı** |
| **Adım 18** | **Favori Usta Sistemi** | Seeker favori usta yönetimi, "Sadece Favori Ustalarıma Gönder" AI chat ve dağıtım entegrasyonu, HV favori müşteri rozeti | **✅ Tamamlandı** |
| **Adım 19** | **Yükleme & 20 Kategori** | S3/R2 presigned URL güvenli yükleme altyapısı, 20 kategori tam aktivasyonu ve AI Chat yeni kategoriler entegrasyonu | **✅ Tamamlandı** |
| **Adım 20** | **Docker & ECS Deployment** | Production multi-stage Dockerfile, local docker-compose.yml orkestrasyonu, AWS ECS Task Definition, deploy CI/CD pipeline ve DB/Redis /api/health kontrol sistemi | **✅ Tamamlandı** |
| **Adım 21** | **Gemini Active Agent** | Resmi Google Gen AI SDK (`@google/genai`) entegrasyonu, otonom 'detectCategory', 'sendOTP' ve 'createServiceRequest' araç çağırma (Function Calling) akışı, dinamik syncStep algoritması, üstel geri çekilme (exponential backoff) hata toleransı, coğrafi kısıtlayıcı kilitler ve parametre bozulmalarını önleyen akıllı filtreleme mimarisi | **✅ Tamamlandı** |
| **Adım 22** | **GCP & Canlı Dağıtım** | Google Cloud Platform (GCP) Canlı Ortam Kurulumu, Cloud Run API/Frontend Servisleri, Memorystore Redis VPC Egress, Firebase Hosting Özel Alan Adı (esnaaf.com) Entegrasyonu ve Otomatik GitHub Actions CI/CD Dağıtım Altyapısı | **✅ Tamamlandı** |
| **Adım 23** | **Altyapı & Caching** | Veritabanı indeks optimizasyonları, Redis `getOrSet`/`invalidatePattern` cache helper entegrasyonu, Kategori ve Profil caching/invalidation, AWS ECS healthcheck ve deploy pipeline | **✅ Tamamlandı** |
| **Adım 24** | **Canlı Entegrasyonlar** | Canlı iyzico, Netgsm SMS, Firebase FCM ve Gemini API çevre değişkenleri ve AWS ECS task secrets hazırlıkları | **✅ Tamamlandı** |
| **Adım 25** | **AI Öğretisi & Akıllı Sohbet** | Gemini system instruction genişletmesi: SSS bilgi bankası (iptal, ödeme, fatura, şikayet, garanti), 20 kategori bazlı uzmanlık rehberliği, few-shot ideal konuşma örnekleri, güvenlik/etik kuralları, cross-sell akıllı öneriler, bilgi sorgusu regex kalıpları genişletmesi | **✅ Tamamlandı** |
| **Adım 26** | **Sadık Müşteri & Doğrudan İş** | 5 haneli Esnaaf ID ve dinamik QR kod eşleşmesi, çift taraflı onay mekanizması, usta doğrudan iş kartı oluşturma ve müşteriye özel doğrudan iş ilanı akışları | **✅ Tamamlandı** |
| **Adım 27** | **Açık Kapı Komisyon Modeli** | Kendi müşterisiyle iş tamamlayan ustanın havuzdan kazanacağı ilk işin %0 komisyonlu olması ve tamamlanan iş kartlarında komisyon gösterimi | **✅ Tamamlandı** |
| **Adım 28** | **Aylık Komisyon Tahsilatı** | Birikmiş komisyon hesaplama, gelecek faturalama tarihi ve usta paneli abonelik sekmesi entegrasyonları | **✅ Tamamlandı** |
| **Adım 29** | **Ses Entegrasyonu (Speech-to-Text)** | Canlı chat ve landing sayfasında Web Speech API entegrasyonu, bouncing animasyonlu dalga efekti, klavyeyle elle düzeltme yapıldığı an dikteyi otomatik durdurma ve tampon bellek yarış durumu çözümleri | **✅ Tamamlandı** |
| **Adım 30** | **Dinamik Yönlendirme & Kesiciler** | Tek Ajan + Dinamik Prompt Değişimi (`sector-prompts.config.ts`), PII regex isim/telefon kesicileri ve Türkçe-locale duyarlı isim temizleme (`cleanName`) algoritması. Müşteri paneli süresi dolan işlerde `Teklifleri Gör (X)`, `Tekrar Yayınla` ve `İptal Et` butonları akışı | **✅ Tamamlandı** |
| **Adım 31** | **Yeni Abonelik & Sıralama** | Gecikme süreleri kaldırılmış yeni 1 Ücretsiz + 3 Ücretli (Basic, Standard, VIP) paket mimarisi, teklif önceliklendirme sıralama algoritması, ücretsiz esnaf aktif iş limit kilidi (State A/B) ve upsell uyarıları | **✅ Tamamlandı** |
| **Adım 32** | **Pasif Panel & Onay Otomasyonu** | Hizmet veren kayıt sonrası kısıtlı oturum (pasif panel modu), `active` hesap durum kısıtlayıcı koruyucu (`ActiveAccountGuard`), karşılama modalı, sabit top uyarı şeridi, aksiyon kesiciler ve 4'lü admin onay bildirim otomasyonu zinciri (FCM, SMS, Email) | **✅ Tamamlandı** |
| **Adım 33** | **Profil Resmi & Konum & Firma Adı** | Profil resmi yükleme altyapısı, sol menü ve üst bar avatar senkronizasyonu, Firma Adı belirteçli input, dinamik konum tercihleri (il ve çoklu ilçe seçimi) ve global usta avatar gösterimi (teklifler, favoriler, arama ve iş teyidi) | **✅ Tamamlandı** |
| **Adım 34** | **Hizmet Alan Profil Resmi & Initials** | Müşteri profil resmi yükleme & Canvas sıkıştırma altyapısı, veritabanı `profile_photo` sütun entegrasyonu, JWT payload/cookie senkronizasyonu, resim olmadığında dinamik isim baş harfleri (initials) avatar gösterim kuralları | **✅ Tamamlandı** |
| **Adım 35** | **Dinamik Adres Formatı Entegrasyonu** | Canlı sohbette seçilen Mahalle/Köy, İlçe, İl bilgilerini sıralı şekilde (`Mahalle, İlçe, İl`) birleştiren dinamik formatlama yapısı; hizmet veren fırsat, teklif, aktif/tamamlanmış iş listeleri ile hizmet alan "Tekliflerim" form detayları entegrasyonu | **✅ Tamamlandı** |
| **Adım 36** | **Canlı Sohbet Giriş Kilidi Düzeltmesi** | "Yeni Talep Oluştur" butonundan sohbet başlatıldığında metin giriş kutusunun ve mikrofon butonunun kilitlenmesini sağlayan hatalı `['greeting', 'category_detection']` kontrolünün düzeltilmesi ve dinamik seçenek varlığına duyarlı hale getirilmesi | **✅ Tamamlandı** |
| **Adım 37** | **Müsaitlik Durumu Otomatik Pasife Geçiş Düzeltmesi & Limit Artırımı** | Hizmet verenin "AKTİF YAP" butonuna bastıktan veya teklif verdikten hemen sonra geçmiş birikmiş bildirimler nedeniyle tekrar pasife düşme hatasının giderilmesi; tüm paketlerde cevapsız limitinin 10'a çıkarılması | **✅ Tamamlandı** |

---

## 🛠️ Adım 0 Geliştirme Detayları

### 1. NestJS Proje Yapısı
*   `backend-api/` altında NestJS projesi başarıyla kuruldu.

### 2. Yüklenen Paketler
*   **Prisma ve DB**: `@prisma/client@5.22.0`, `prisma@5.22.0` (LTS, `env()` destekli)
*   **Konfigürasyon**: `@nestjs/config`
*   **Auth**: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`
*   **Dev Dependencies**: `@types/passport-jwt`
*   **Kuyruk & Redis**: `@nestjs/bull`, `bull`, `ioredis`
*   **Zamanlanmış Görevler**: `@nestjs/schedule`
*   **Validation**: `class-validator`, `class-transformer`
*   **Güvenlik**: `helmet`
*   **AI & HTTP**: `openai`, `axios`

### 3. Environment Yapılandırması
*   [backend-api/.env.example](file:///c:/Users/HaTicEmRe/OneDrive/Masaüstü/esnaaf/backend-api/.env.example) ve [backend-api/.env](file:///c:/Users/HaTicEmRe/OneDrive/Masaüstü/esnaaf/backend-api/.env) dosyaları PRD §16.4'teki 35+ değişkenle oluşturuldu.

### 4. Veritabanı Şeması
*   [schema.prisma](file:///c:/Users/HaTicEmRe/OneDrive/Masaüstü/esnaaf/backend-api/prisma/schema.prisma) dosyası PRD §19'a uygun şekilde yazıldı.
*   **Oluşturulan Aktif Tablolar (11 adet)**:
    1.  `users` (User)
    2.  `service_providers` (ServiceProvider)
    3.  `categories` (Category)
    4.  `service_requests` (ServiceRequest)
    5.  `offers` (Offer)
    6.  `accepted_offers` (AcceptedOffer)
    7.  `phone_reveal_logs` (PhoneRevealLog)
    8.  `temp_sessions` (TempSession)
    9.  `messages` (Message)
    10. `job_completions` (JobCompletion)
    11. `staff` (Staff)
*   **Faz 2+ Tabloları**: Şema dosyasına yorum satırı olarak eklendi.
*   **İndeksler**: PRD §19.2 kritik indeksleri şemaya `@@index` ve `@@unique` olarak uygulandı.

### 5. Migration ve Tohumlama (Seeding)
*   `20260524202158_init` migration'ı başarıyla üretildi ve uygulandı.
*   [seed.ts](file:///c:/Users/HaTicEmRe/OneDrive/Masaüstü/esnaaf/backend-api/prisma/seed.ts) ile 20 kategori tohumlandı. Sadece "Ev Temizliği" aktif (`isActive: true`), diğerleri inaktif (`isActive: false`) olarak ayarlandı.

---

## 🛠️ Adım 1 Geliştirme Detayları

### 1. Ortak Altyapı Modülleri (src/common/)
*   **Prisma Entegrasyonu**: `@Global()` modülü olarak tanımlanan `PrismaModule` ve `PrismaService` yazıldı. Tüm veritabanı işlemlerinde tek elden bağlantı yönetimi sağlandı.
*   **Özel Dekoratörler**:
    *   `@Public()`: Global JWT guard'ının belirli rotalarda bypass edilmesini sağlar.
    *   `@Roles()`: Yetki bazlı (RBAC) güvenlik kontrollerinde allowed rolleri etiketler.
    *   `@CurrentUser()`: İstek parametresi (Context) içinden o an aktif olan kullanıcı profilini döndürür.
*   **Güvenlik & Auth Guard'ları**:
    *   `JwtAuthGuard`: Rotaları global seviyede JWT token ile korur (Public rotalar hariç).
    *   `RolesGuard`: `@Roles()` dekoratörüyle belirtilen izin kurallarını o anki kullanıcının rolüyle karşılaştırır (RBAC).
*   **HttpExceptionFilter**: Tüm uygulamanın hata çıktılarını yakalayıp PRD'ye uygun biçimde `{ error: { code, message, details } }` formatına standardize eder.

### 2. Telefon Maskeleme & AES-256 Şifreleme Yardımcısı
*   [phone.util.ts](file:///c:/Users/HaTicEmRe/OneDrive/Masaüstü/esnaaf/backend-api/src/common/utils/phone.util.ts) yardımcısı yazıldı:
    *   `encryptPhone()` & `decryptPhone()`: Çevre değişkenlerindeki `ENCRYPTION_KEY` ve `ENCRYPTION_IV` ile **AES-256-CBC** şifreleme ve çözme.
    *   `maskPhone()`: Telefon numaralarını maskeleyerek `0532 *** ** 78` formatına dönüştürme.
    *   `normalizePhone()`: Gelen tüm varyasyonları `+905321234567` uluslararası formatına normalleştirme.

### 3. Global Entegrasyonlar
*   **app.module.ts**: `ConfigModule` (global), `ThrottlerModule` (hız limitleme), `ScheduleModule` (cron işleri), `BullModule` (Redis BullMQ bağlantısı) ve `PrismaModule` entegre edildi.
*   **main.ts**: `helmet()` (güvenlik başlıkları), `ValidationPipe` (otomatik transform ve whitelist), global hata filtresi ve `/api` global prefix'i uygulandı.

### 4. Derleme & Doğrulama
*   `npm run build` komutu başarıyla çalıştırılarak projenin sıfır hata ile derlendiği doğrulanmıştır.

---

## 🛠️ Adım 2 Geliştirme Detayları

### 1. OTP (Tek Kullanımlık Şifre) Doğrulama Servisi
*   **Netgsm SMS Entegrasyonu**: PRD §17.1'e uygun şekilde Netgsm HTTP API üzerinden SMS gönderimi sağlandı (`NETGSM_USERCODE`, `NETGSM_PASSWORD`, `NETGSM_MSGHEADER`).
*   **Geliştirme Ortamı Simülasyonu**: `development` modunda veya kimlik bilgileri tanımlanmadığında gerçek SMS atılmadan console loguna yazdırılacak ve doğrulama kodu API çıktısında `devOtpCode` parametresi olarak dönecektir.
*   **Redis Caching**: Üretilen 6 haneli OTP kodu `otp:{phone}` anahtarında 300 saniye (5 dakika) TTL ile saklanır.
*   **Rate Limiting (Hız Sınırı)**: `otp_rate:{phone}` Redis sayacı ile her telefon numarası için 1 dakikada en fazla 3 OTP talebiyle sınırlandırıldı. 3 istek aşıldığında `429 Too Many Requests` (Çok fazla istek. 1 dakika bekleyin.) hatası döner.
*   **Hatalı Giriş Kilidi (Lockout)**: Ardışık 3 kez yanlış OTP kod doğrulamasında `otp_lock:{phone}` anahtarı üzerinden numara 5 dakika kilitlenir. Kilitli numaralar için `403 Forbidden` (Çok fazla hatalı deneme. 5 dakika bekleyin.) hatası verilir.
*   **Hata Mesajları Standartizasyonu**: PRD §17.1 uyumlu Türkçe hata mesajları kodlandı:
    *   *Süre aşımı*: `Kodun süresi doldu. Yeni kod isteyin.` (BadRequestException)
    *   *Hatalı deneme (1. ve 2. deneme)*: `Kod hatalı, tekrar deneyin.` (BadRequestException)
    *   *Kilitlenme (3. hatalı deneme veya kilitli istek)*: `Çok fazla hatalı deneme. 5 dakika bekleyin.` (ForbiddenException)

### 2. JWT (JSON Web Token) Yetkilendirme Servisi
*   **Token Süreleri**: PRD §17.1 uyumlu olarak Access Token ömrü **15 dakika**, Refresh Token ömrü **7 gün** olarak ayarlandı.
*   **JwtStrategy Entegrasyonu**: Passport.js uyumlu `JwtStrategy` yazılarak gelen tüm token'lar Prisma veritabanı üzerinden doğrulanır. Kullanıcının silinmiş (`deleted_at` dolu) veya pasif olması durumlarında yetkilendirme reddedilir.
*   **Otomatik Kayıt (Inline Registration)**: OTP başarıyla doğrulandığında, eğer telefon numarası veritabanında mevcut değilse, sistem otomatik olarak **AES-256** ile şifrelenmiş telefon numarası ve maskelenmiş numara (`0532 *** ** 78`) ile `service_seeker` rolünde yeni bir üye kaydı oluşturur.

### 3. Anonim Session (Geçici Oturum)
*   **Session Altyapısı**: PRD §13.0 ve §13.4 gereksinimlerine göre `temp_session:{uuid}` Redis anahtarı üzerinden 7200 saniye (2 saat) TTL süresiyle yönetilir.
*   **Header Desteği**: `POST /api/ortak/auth/anonim/baslat` endpoint'ine gelen isteklerde `X-Session-ID` başlığından UUID okunur; yoksa otomatik üretilir.

### 4. Geliştirilen Endpoint'ler
*   `POST /api/ortak/auth/otp/send` — Telefon numarasına doğrulama kodu gönderir.
*   `POST /api/ortak/auth/otp/verify` — Kodu doğrular. Doğruysa JWT Access/Refresh token'ları ile kullanıcı bilgilerini döner. Kullanıcı yoksa otomatik kaydını oluşturur.
*   `POST /api/ortak/auth/refresh-token` — Refresh token ile yeni Access/Refresh token çifti üretir.
*   `POST /api/ortak/auth/kvkk/accept` — Kullanıcının KVKK onayını günceller ve onay tarihini kaydeder. Global `JwtAuthGuard` ile korunur.
*   `POST /api/ortak/auth/anonim/baslat` — Anonim kullanıcı oturumu başlatır ve Redis'e 2 saatlik oturum yazar.

### 5. Çalışma Testi ve Doğrulama
*   Taşınabilir PostgreSQL ve Redis servisleri üzerinde NestJS backend uygulaması ayağa kaldırılarak `POST /api/ortak/auth/otp/send` endpoint'i test edilmiş ve aşağıdaki JSON çıktısı başarıyla elde edilmiştir:
    ```json
    {
        "success": true,
        "message": "Doğrulama kodu gönderildi.",
        "devOtpCode": "490904"
    }
    ```

---

## 🛠️ Adım 3 Geliştirme Detayları (Müşteri Arayüzü & İlk Kurulum)

### 1. Next.js & Tailwind CSS v4 Kurulumu
*   **Proje Kurulumu**: `app-musteri/` monorepo dizini altında **Next.js v16.2 (Turbopack)**, TypeScript, ESLint ve Tailwind CSS v4 entegrasyonlu modern web projesi `npmmirror.com` üzerinden sıfır hata ile kuruldu.
*   **Derleme ve Paketleme**: Projenin `npm run build` derleme ve paketleme aşamaları sıfır hata, sıfır uyarı ve sıfır TypeScript tipi uyuşmazlığıyla başarıyla tamamlanmıştır.

### 🎨 2. Tasarım Sistemi Entegrasyonu (Design Tokens)
*   **CSS Değişkenleri**: [globals.css](file:///c:/Users/HaTicEmRe/OneDrive/Masaüstü/esnaaf/app-musteri/app/globals.css) dosyası içine, Design Brief §11.1 standartları ve kullanıcının özel talepleri doğrultusunda şu CSS değişkenleri tanımlandı:
    *   `--color-primary: #232323` (Antrasit)
    *   `--color-accent: #D4F54E` (Neon Lime)
    *   `--color-accent-light: #F7FCD4` (Açık Lime)
    *   `--color-bg: #F5F5F5` (Açık Gri)
    *   `--color-surface: #FFFFFF` (Beyaz)
    *   `--radius-md: 12px` ve `--radius-lg: 16px`
*   **Tailwind v4 Entegrasyonu**: globals.css içerisindeki `@theme` bloğunda bu değişkenler sırasıyla `--color-primary`, `--color-accent`, `--color-accent-light`, `--radius-md`, `--radius-lg` vb. olarak Tailwind temasına doğrudan bağlandı.
*   **Plus Jakarta Sans Typography**: [layout.tsx](file:///c:/Users/HaTicEmRe/OneDrive/Masaüstü/esnaaf/app-musteri/app/layout.tsx) içinde Google Fonts'tan `Plus Jakarta Sans` fontu `next/font/google` modülüyle entegre edildi ve tüm web arayüzünün birincil yazı ailesi yapıldı.

### 📱 3. Chat-First Ana Sayfa Tasarımı (app/page.tsx)
*   **Minimalist ve Premium Arayüz**: Landing sayfasındaki tüm kalabalık menüler ve slider'lar elenerek PRD §1.4'e uygun **chat-first** odaklı saf bir ekran tasarlanmıştır.
*   **Esnaaf Pin Logo**: [logo.svg](file:///c:/Users/HaTicEmRe/OneDrive/Masaüstü/esnaaf/app-musteri/public/logo.svg) ile Design Brief §5 pin anatomisiyle uyumlu organik eğrilere sahip, modern antrasit ve neon lime vurgulu vektörel marka logosu sıfırdan oluşturuldu.
*   **Büyük Arama/Sohbet Alanı**: `max-width: 680px` genişliğinde, `rounded-[16px]` (border-radius: 16px) köşelere sahip ve focus durumunda `border 2px solid #D4F54E` ile neon lime halka alan şık bir beyaz textarea katmanı yerleştirildi.
*   **Kategori Chip'leri (§1.4.1)**: Chat kutusunun altında `bg: #F7FCD4`, `border: 1px solid #D4F54E` ve `rounded-[20px]` pill tasarımında `[🏠 Ev Temizliği]`, `[🎨 Boya]`, `[🔧 Tesisat]`, `[⚡ Elektrik]` ve `[➕]` butonları yerleştirildi. Chip'lere tıklandığında ilgili kategori adı textarea'ya yazılır ve otomatik focus/sohbet tetiklenir.
*   **Tüm Kategoriler Modalı**: `[➕]` butonuna tıklandığında, antrasit ve lime renk paletine sahip premium ve animasyonlu bir bottom-sheet modalı açılarak Faz 1, Faz 2 ve Faz 3 kapsamında yer alan **20 hizmet kategorisinin** tamamını şık kartlar halinde listeler.
*   **Mobil Klavye Algılama**: `window.visualViewport` API'sini dinleyen özel bir React kancası (hook) ile mobil cihazlarda klavye yükseldiğinde ekran alanını korumak amacıyla chip'ler otomatik olarak gizlenir.
*   **Neon Accent Gönder Butonu**: Input alanının altında sağ köşede Neon Lime (`#D4F54E`) arka planlı, antrasit metinli ve Lucide tabanlı modern bir sağ ok (`→`) ikonu barındıran primary CTA butonu konumlandırıldı.

### 🔑 4. Anonim Session Entegrasyonu (lib/session.ts)
*   **Güvenli UUID Yönetimi**: [session.ts](file:///c:/Users/HaTicEmRe/OneDrive/Masaüstü/esnaaf/app-musteri/lib/session.ts) dosyası aracılığıyla, tarayıcının `localStorage` katmanında `esnaaf_session_id` anahtarı altında kalıcı bir anonim UUID (Universal Unique Identifier) saklanması sağlandı. UUID yoksa `crypto.randomUUID()` ile anında üretilir.
*   **Fetch İstek Müdahalesi (Interceptor)**: `customFetch` adında global bir fetch sarmalayıcısı yazılarak, istemciden backend API sunucusuna giden tüm HTTP istek başlıklarına otomatik olarak `X-Session-ID: {uuid}` header'ı enjekte edilmesi sağlandı.

*   Next.js yerel geliştirme sunucusu (`npm run dev`) `3000` portu üzerinde başarıyla ayağa kaldırıldı.
*   Üretilen premium arayüz tasarımı `esnaaf_homepage_screenshot.png` adıyla doğrulanmıştır.

---

## 🛠️ Adım 4 Geliştirme Detayları (AI Chat & WebSocket Entegrasyonu)

### 1. AI Chat Step Machine Altyapısı
*   **Chat Servisi**: [chat.service.ts](file:///c:/Users/HaTicEmRe/OneDrive/Masaüstü/esnaaf/backend-api/src/ortak/chat/chat.service.ts) altında adımlı durum makinesi (state machine) sıfırdan yazıldı. Akış boyunca şu aşamalar takip edilir:
    `greeting` (karşılama) → `category_detection` (kategori tespiti) → `collecting_details` (detay toplama) → `ask_name` (isim sorma) → `ask_phone` (telefon sorma) → `otp_verification` (OTP doğrulama) → `confirm_form` (özet onaylama) → `completed` (tamamlandı)
*   **Kişisel Veri (PII) İzolasyonu**: Kullanıcıdan gelen mesajlardaki telefon numarası, T.C. Kimlik numarası ve ad-soyad gibi hassas kişisel veriler gelişmiş Regex filtreleriyle taranarak API'ye iletilmeden önce temizlenir. Kişisel veriler veri tabanına ve form özetine doğrudan backend tarafından enjekte edilir.
*   **Entegrasyon & Geliştirme Ortamı Simülatörü**: OpenAI GPT-4o API bağlantısı kuruldu. API anahtarı olmadığında veya geliştirme aşamasında sistemin kesintisiz çalışması için konum (Kadıköy, Şişli) ve kategori parametrelerini anlayan akıllı bir **GPT-4o Simülatörü (Mock AI Engine)** kodlandı.
*   **Inline Üye Kaydı & Session Taşıma (Migration)**: OTP doğrulama adımı tamamlandığında, kullanıcı veritabanında yoksa otomatik üye kaydı (`service_seeker` rolüyle) açılır. Redis'teki 2 saatlik geçici oturum verisi (`temp_session:{uuid}`), 24 saatlik kalıcı üye oturumuna (`ai_session:{userId}:{sessionId}`) otomatik olarak taşınır (migrate).

### 🏷️ 2. Kategori Tespiti & Token Sınırlandırması
*   **Kategori Sınıflandırma**: GPT-4o / Simülatör modülü, girdiyi analiz ederek `{detected, categorySlug, confidence}` formatında JSON yanıt döner. Güven oranı (`confidence < 0.7`) düşük olduğunda kullanıcıyı yönlendirmek için chip kategori listesi sunulur.
*   **Token Hız Sınırları**: `token_limit:{sessionKey}:{today}` Redis anahtarıyla günlük 50.000 token limiti konuldu. Aşıldığında `429 Too Many Requests` (Bugünlük mesaj limitinize ulaştınız. Yarın devam edebilirsiniz.) hatası fırlatılır.

### 🔄 3. BullMQ Hata Toleransı & Retry İşlemleri
*   **BullMQ Entegrasyonu**: [chat-retry.processor.ts](file:///c:/Users/HaTicEmRe/OneDrive/Masaüstü/esnaaf/backend-api/src/ortak/chat/chat-retry.processor.ts) yazıldı ve `chat-retry` kuyruğu `ChatModule` içinde tescil edildi.
*   **Timeout & 5xx Fallback**: OpenAI API timeout veya 5xx hatası verdiğinde, BullMQ üzerinden **3 kez, 30 saniye aralıklarla** arka planda retry job'ı tetiklenir ve kullanıcıya `Sistemimiz yoğun. Lütfen birkaç dakika sonra tekrar deneyin.` şeklinde oturumu ve mesajı koruyan hata mesajı döner.

### ⚡ 4. Socket.io Canlı Teklif Odaları
*   **WebSocket Gateway**: [chat.gateway.ts](file:///c:/Users/HaTicEmRe/OneDrive/Masaüstü/esnaaf/backend-api/src/ortak/chat/chat.gateway.ts) ile `@WebSocketGateway()` dekoratörlü Socket.io sunucusu `/chat` namespace'i ile ayağa kaldırıldı.
*   **Oda Yönetimi & Event**: Kullanıcılar ve esnaflar `job_{jobId}` odalarına (`join_job` event'iyle) bağlanır. Teklif oluşturulduğunda (`emitNewOffer`) gateway tüm odaya anlık `new_offer` event'i yayınlar.

### 🧪 5. Çalışma Testi ve API Doğrulaması
*   Yerel taşınabilir PostgreSQL ve Redis üzerinde NestJS backend API'si başarıyla derlendi ve test edildi.
*   `/api/ortak/chat/anonim/baslat` ile oturum başlatılıp `/api/musteri/chat/mesaj` endpoint'ine `"Ev temizliği lazım Kadıköy'de"` isteği atıldığında step machine'in başarıyla kategori tespit edip adım geçişi sağladığı doğrulanmıştır:
    ```json
    {
      "step": "collecting_details",
      "responseMessage": "Harika! Ev Temizliği talebiniz için yardımcı olayım. Hangi ilçede hizmet almak istersiniz?",
      "collected_data": {
        "categorySlug": "ev-temizligi"
      }
    }
    ```

---

## 🛠️ Adım 5 Geliştirme Detayları (Ön Yüz Chat Arayüzü & WebSocket Canlı Akış)

### 💬 1. Müşteri Chat Ekranı Bileşeni (ChatScreen.tsx)
*   **Gelişmiş Arayüz Bileşeni**: [ChatScreen.tsx](file:///c:/Users/HaTicEmRe/OneDrive/Masaüstü/esnaaf/app-musteri/components/ChatScreen.tsx) dosyasıyla anlık mesajlaşma ve durum takip arayüzü sıfırdan kodlandı.
*   **Balon Tasarımı & Avatarlar**:
    *   *Kullanıcı mesajı*: Sağda hizalı, antrasit (`#232323`) arka planlı ve beyaz metinli premium balonlar.
    *   *AI yanıtı*: Solda hizalı, beyaz arka planlı, ince gri çerçeveli ve yanlarında dairesel **Esnaaf Logo Avatarları** (`e.`) barındıran şık balonlar.
*   **Yazıyor Animasyonu**: AI yanıt üretirken sol köşede beliren, CSS `@keyframes bounce` tabanlı 3 noktalı pulse animasyonu entegre edildi.
*   **Özet Kartı**: Konuşma `confirm_form` (özet onaylama) adımına geldiğinde, `collected_data` parametrelerinden beslenen hizmet detaylarını listeleyen interaktif bir kart render edilir ve altında **`[✅ Onayla]`** ve **`[✏️ Düzelt]`** butonları sunulur. Onayla butonuna tıklandığında talep otomatik oluşturulur.

### ⚡ 2. Socket.io Client & Canlı Teklif Akışı
*   **Soket Bağlantısı**: Chat tamamlanıp `jobId` alındığı an, client `socket.io-client` aracılığıyla arka plandaki `http://localhost:3005/chat` WebSocket sunucusuna bağlanır.
*   **Oda Katılımı**: Bağlanan soket anında `join_job` event'i fırlatarak ilgili talebin `job_{jobId}` odasına katılır.
*   **Canlı Teklif Kartı**: Soketten `new_offer` event'i düştüğünde, sohbet akışına özel bir teklif kartı (`🔔 [Usta Adı] — [Fiyat] TL`) animasyonlu (`animate-scale-up`) olarak enjekte edilir. Kartın altında **`[Profili Gör]`**, **`[Mesaj Gönder]`** ve **`[Kabul Et]`** butonları interaktif olarak sunulur.
*   **Bekleme Ekranı**: Talep oluşturulduğunda ekranın altında Neon Lime (`#D4F54E`) renkli, premium dairesel dönme animasyonu (spinning loader) ve teklif bekleniyor uyarı metni beliriş yapar.

### 🌐 3. Arayüz Geçiş Entegrasyonu
*   **Görünüm Geçişi**: [page.tsx](file:///c:/Users/HaTicEmRe/OneDrive/Masaüstü/esnaaf/app-musteri/app/page.tsx) güncellenerek, kullanıcının ana sayfada girdiği ilk hizmet tanımıyla birlikte form submit edilerek `ChatScreen` bileşenine pürüzsüz geçiş sağlanması kodlandı.

### 🧪 4. Derleme ve Paketleme Doğrulaması
*   Ön yüz projesi Next.js Turbopack aracılığıyla `npm run build` edilerek sıfır TypeScript tipi uyuşmazlığı ve sıfır derleme hatasıyla paketlendi:
    ```bash
    ✓ Compiled successfully in 3.6s
    Running TypeScript ...
    Finished TypeScript in 2.8s ...
    Generating static pages ...
    ✓ Generating static pages using 5 workers (4/4) in 569ms
    ```

---

## 🛠️ Adım 6 Geliştirme Detayları (İş Bitiş & Karşılıklı Ücret Teyit Sistemi — Tamamlama Modülleri)

### 🖥️ 1. Backend İş Bitiş Modülü (src/ortak/job-completion/) & Tamamlama Modülleri
*   **Modüler Mimari**: `JobCompletionModule`, `JobCompletionService` ve `/api/...` endpoint'lerini sarmalayan controller/module yapıları kuruldu.
*   **Hizmet Veren Beyan Endpoint'i (`POST /api/hizmetveren/tamamlama/beyan`)**: Ustanın tamamladığı iş için aldığı ücreti beyan ettiği (`TamamlamaBeyanDto` ile validated) ve `JobCompletionStatus.pending_seeker` durumunu başlattığı endpoint.
*   **Müşteri Teyit/İtiraz Endpoint'i (`POST /api/musteri/tamamlama/onayla`)**: Müşterinin tutarı onayladığı veya itiraz ettiği (`TamamlamaOnayDto` ile validated) endpoint.
    *   *Tutar Sapma Formülü*: Sapma oranı $\frac{|HV - HA|}{HA} \times 100$ formülüyle hesaplanır.
    *   *Alarm Eşikleri & SLA Kuralları (§15.12.3)*:
        *   **%0 Sapma**: `AlarmLevel.none` -> İş `completed` (otomatik tamamlama) + 30 dakika gecikmeli NPS anket planlaması.
        *   **%1-15 Sapma**: `AlarmLevel.info` -> Bilgi logu olarak kayıt, otomatik tamamlanma.
        *   **%16-30 Sapma**: `AlarmLevel.yellow` (Sarı Alarm) -> Durum `disputed`, `dispute_status = open` ve **48 saat SLA** süreli `normal` öncelikli otomatik `CallTask` oluşturulması.
        *   **%31+ ve Hizmet Alınmadı**: `AlarmLevel.red` (Kırmızı Alarm) -> Durum `disputed`, `dispute_status = open` ve **24 saat SLA** süreli `urgent` öncelikli otomatik `CallTask` oluşturulması.
    *   *Transaction Bütünlüğü*: `JobCompletionService.confirmCompletion` içindeki tüm veritabanı kayıtları (`JobCompletion` güncelleme, `ServiceRequest` tamamlanma ve `CallTask` üretimi) tek bir `$transaction` bloğunda atomik olarak yürütülür.
    *   *WebSocket Olay Yayınlama*: `ChatGateway` üzerine `emitJobCompletedByProvider` ve `emitJobCompletionFinalized` metotları eklenerek, tarafların chat odasındaki durumları anlık WebSocket event'leriyle güncellendi.
*   **Geliştirici Test Simülasyonu (`POST /api/ortak/jobs/:id/simulate-provider-complete`)**: Geliştirme ortamında ustanın iş bitirme beyanını, usta, teklif ve kabul edilmiş teklif ilişkilerini otomatik olarak kurup simüle eden bir dev endpoint'i tasarlandı.
*   **Programatik E2E Entegrasyon Testi (`src/test-tamamlama-e2e.ts`)**: NestJS context'i programatik olarak başlatılarak; %0 sapma, %25 sarı alarm (48h SLA), %41 kırmızı alarm (24h SLA) ve HA komple reddetme (24h SLA) olmak üzere 4 ana uyuşmazlık senaryosunun tamamı veritabanı kayıtları, alarm seviyeleri ve CallTask üyelikleri üzerinden başarıyla uçtan uca doğrulanmıştır.


### 🎨 2. Müşteri Ön Yüz Geliştirmeleri (ChatScreen.tsx)
*   **WebSocket Canlı Dinleyiciler**: `job_completed_by_provider` ve `job_completion_finalized` event'leri soket katmanında dinlenerek, chat balonları arasına sistem bildirimleri anlık enjekte edildi.
*   **Premium İş Tamamlama Teyit Kartı**: Ustanın beyan ettiği tutarı gösteren ve **`[✓ Evet, doğru]`** ile **`[✗ Hayır, farklı]`** interaktif butonları içeren, neon lime çerçeveli şık kart tasarımı eklendi.
*   **İtiraz Formu ve İnceleme Paneli**: Tutar itirazı yapıldığında gerçek ödenen tutarın girildiği, uyuşmazlık durumunda ise kırmızı neon detaylı "İnceleme Başlatıldı" uyarı paneli entegre edildi.
*   **Usta Değerlendirme Yıldız Sistemi**: Başarılı eşleşen tamamlamalarda 5 yıldızlı usta puanlama arayüzü enjekte edildi.
*   **Görsel Geliştirici Simülasyon Paneli (DevTools Bar)**: Ekranın en üstünde, iş oluşturulduğu an beliren ve tek tıkla ustanın işi bitirdiği durumları (%0 fark, %20 sarı alarm, %41 kırmızı alarm) simüle eden premium kontrol barı eklendi.

### 🧪 3. Derleme ve Paketleme Doğrulamaları
*   **NestJS Backend**: `backend-api` projesinde `npm run build` edilerek sıfır hata ve sıfır TypeScript tipi uyuşmazlığıyla derleme doğrulandı.
*   **Next.js Müşteri Uygulaması**: `app-musteri` projesinde Turbopack derleyicisiyle `npm run build` edilerek 2.1 saniyede başarıyla statik sayfalar oluşturuldu (0 hata, 0 uyarı).

---

## 🛠️ Adım 7 Geliştirme Detayları (Hizmet Veren Paneli, Teklif Kabul, Telefon Açma & Canlı Mesajlaşma)

### 🖥️ 1. Backend Hizmet Veren & Mesajlaşma Modülleri
*   **Hizmet Veren Modülü (`src/hizmetveren/`)**:
    *   *Gelen İşler (`GET /api/hizmetveren/gelen-isler`):* Ustaya dağıtılmış aktif ve teklif verilmemiş talepleri `viewerCount` (bu işi gören toplam usta sayısı) bilgisiyle listeler.
    *   *Teklif Verme (`POST /api/hizmetveren/teklifler`):* Ustanın aylık kotasının dolmadığını, onay durumunu (`is_approved: true`) ve dağıtımı doğrulayarak teklif kaydeder. `responseTime` tablosunda `responded_at` ve cevap hızı (dakika cinsinden) güncellenir. `ChatGateway` ile müşteriye anlık teklif balonu fırlatılır.
    *   *Kota Bilgisi (`GET /api/hizmetveren/kota`):* Ustanın paket limitine göre bu ayki teklif kabul sayısını, kalan hakkını ve paket ismini döner.
*   **Teklif Kabul ve Telefon Açma (`POST /api/musteri/teklifler/:id/kabul`)**:
    *   Müşteri, ustanın teklifini `consent: true` ile kabul eder.
    *   `$transaction` yürütülerek:
        *   `AcceptedOffer` kaydı oluşturulur.
        *   Teklif durumu `accepted` yapılır.
        *   Talebe ait kabul sayısı kontrol edilir (Maksimum 3 kabul sınırı).
        *   Eğer bu 3. kabul ise, bu talebe gelen diğer tüm bekleyen (`pending`) teklifler otomatik olarak `rejected` statüsüne alınır.
        *   `phone_reveal_logs` tablosuna karşılıklı numara açılma kayıtları (Müşteri ustaya, usta müşteriye) kaydedilir.
    *   Müşterinin ve ustanın AES-256 ile şifreli olan telefon numaraları çözülerek karşılıklı olarak API yanıtında teslim edilir.
*   **Platform İçi Mesajlaşma (`src/ortak/mesajlar/`)**:
    *   `POST /api/ortak/mesajlar`: Yeni mesaj kaydeder ve `ChatGateway` üzerinden odadaki tarafa canlı soket mesajı fırlatır.
    *   `GET /api/ortak/mesajlar/:talepId/:teklifId`: Sohbet geçmişini tarihe göre sıralı olarak getirir.
    *   `PUT /api/ortak/mesajlar/:id/okundu`: Mesajı okundu işaretler.

### 🎨 2. Hizmet Veren Arayüzü (`app-hizmetveren/`)
*   **Next.js 15+ & Tailwind v4 Kurulumu**: `app-hizmetveren` monorepo klasöründe modern web projesi sıfırdan kuruldu.
*   **Gelen İşler Ekranı & Teklif Verme (`app/page.tsx`)**:
    *   *Geliştirici Hızlı Giriş:* Test kolaylığı için dropdown usta seçici entegre edildi. Seçilen ustanın JWT token'ı OTP endpoint'leri ile arka planda otomatik temin edilir.
    *   *Kota & Profil Kartı:* Ustanın aktif paket seviyesi, reytingi ve kalan teklif haklarını gösteren premium kart tasarımı ve kota kullanım barı yerleştirildi.
    *   *Viewer Sayacı ve Detaylar:* Her iş kartında o işin toplam kaç usta tarafından görüldüğü dinamik olarak yansıtıldı.
    *   *Teklif Verme Modalı:* Fiyat (`IsNumber` & `Min(1)`) ve teklif notu girilebilen, neon lime temalı modal kodlandı.
    *   *Socket.io Canlı Akış:* Usta `provider_{providerId}` odasına bağlanarak, sisteme yeni bir iş düştüğü an ekranı yenilemeden kartın anlık kayarak listenin tepesine yerleşmesi sağlandı.

### 🧪 3. Derleme ve Paketleme Doğrulamaları
*   **NestJS Backend**: `backend-api` projesinde `npm run build` edilerek sıfır hata ve sıfır TypeScript tipi uyuşmazlığıyla derleme doğrulandı.
*   **Next.js Hizmet Veren Uygulaması**: `app-hizmetveren` projesinde Turbopack derleyicisiyle `npm run build` edilerek sıfır hata, sıfır uyarı ve sıfır TypeScript uyuşmazlığıyla başarıyla derlendi.

---

## 🛠️ Adım 8 Geliştirme Detayları (Admin Kontrolleri, Dashboard, Kullanıcı Denetimi & Belge Onay Kuyruğu)

### 🖥️ 1. Backend Admin API Modülü (`backend-api/src/admin/`)
*   **Admin DTO Tanımları (`admin-users.dto.ts`)**: Kullanıcı sorguları, ban işlemleri (sebepli) ve usta reddetme akışları için class-validator destekli DTO yapıları oluşturuldu.
*   **Merkezi Admin Servisi (`admin.service.ts`)**:
    *   *Dashboard Stats:* Bugün oluşturulan yeni talepleri, yeni kullanıcı kayıtlarını, aktif uyuşmazlık şikayetlerini (disputed iş tamamlamaları) ve onay bekleyen hizmet veren sayılarını dinamik PostgreSQL sorgularıyla hesaplayan metrik motoru kodlandı.
    *   *Kullanıcı Arama ve Filtreleme:* İsim ve email bazlı case-insensitive arama, rol ve aktiflik durum filtrelemeli kullanıcı listeleme akışı yazıldı.
    *   *Sebepli Banlama Akışı:* Kullanıcıyı anında kilitli/inaktif hale getiren ve gerekçesini (`fake_profile`, `abuse`, `payment_issue`, `other`) denetçi notuyla loglayan banlama servisi kodlandı.
    *   *KVKK Zorla Anonimleştirme Süreci:* SLA 30 gün kurallarına uygun olarak kullanıcının adını `"Eski Kullanıcı"` yapan, şifreli telefon numarasını ve email adresini tamamen `null` çeken, `deleted_at = NOW` damgasını vurup hesabı pasifleştiren geri alınamaz anonimleştirme işlemi kodlandı.
    *   *Onay/Red Kuyruğu:* Onaylanmamış hizmet verenleri bağlı `User` verileriyle birlikte sıralayan, `HV-14` (onaylandı push/sms) ve `HV-15` (reddedildi mail) bildirim detaylarını loglayarak karar veren denetim fonksiyonları tamamlandı.
*   **Admin Kontrolcüsü (`admin.controller.ts`)**: Rotaları `/api/admin/...` prefix'i altında toplayıp global JWT ve RBAC `@Roles('admin')` guard koruması altına alan controller kodlandı.
*   **Database Seeding**: `Süper Admin` test kullanıcısı (`+905999999999` telefon numaralı) ve 2 adet onay bekleyen usta datası veritabanına otomatik tohumlandı.

### 🎨 2. Yönetici Arayüzü Portal Tasarımı (`app-hizmetveren/app/admin/`)
*   **Yönetici Arayüz Paneli (`app/admin/page.tsx`)**: Next.js App Router üzerinde, premium antrasit ve neon lime tasarım dillerine uygun interaktif master panel kodlandı.
*   **Tek Tıkla Geliştirici Hızlı Giriş**: Admin giriş butonu ile seeded yönetici hesabından simüle OTP doğrulayarak authentic admin JWT token temin eden akıllı login entegrasyonu yazıldı.
*   **Canlı Metrik Dashboard Sekmesi**: Bugün yeni talep, yeni kayıt ve aktif şikayetleri otomatik yenileyen sayaç kartları, ödeme durum dağılım tablosu ve hızlı operasyon butonları eklendi.
*   **Kullanıcı Arama ve Denetleme Sekmesi**: Canlı arama kutusu, rol ve durum seçicileri, kullanıcı listesi tablosu, interaktif `[Banla]` (neden popup'lı), `[Aktif/Pasif Yap]` ve `[Zorla Sil (KVKK)]` aksiyonları içeren detay panelleri entegre edildi.
*   **Belge İnceleme ve Onay Sekmesi**: Onay bekleyen usta kartları, **Belge Görüntüleme Modalı** (yüklenmiş kimlik ve vergi levhasını şık mockup sertifikalarla gösteren popup), usta onaylama ve sebepli (`R01` - `R05`) reddetme aksiyon modülleri tamamlandı.

### 🧪 3. Derleme ve E2E Entegrasyon Test Doğrulamaları
*   **Programatik Admin E2E Testi (`src/test-admin-e2e.ts`)**: NestJS context'i programatik olarak başlatılarak; stats okuma, onay bekleyenleri listeleme, usta onaylama (is_approved=true ve approved_at yazılması), usta reddetme (durumun unapproved kalması), maskeli telefonları admin için decrypt etme, sebepli banlama ve KVKK force-delete ile verilerin geri döndürülemez anonimleşmesinin kontrolü uçtan uca test edildi ve **100% başarıyla** tamamlandı.

---

## 🛠️ Adım 9 Geliştirme Detayları (Abonelik, iyzico Ödeme & Kampanya Sistemi)

### 🖥️ 1. Backend Abonelik & Ödeme API Modülü (`backend-api/src/hizmetveren/abonelik/`)
*   **iyzico Sandbox & Mock Servisi (`iyzico.service.ts`)**: iyzico REST API (initialize, retrieve, cancel) entegrasyonu kodlandı. Geliştirme ve test ortamlarında simüle HTML ödeme sayfaları döner. Webhook için **HMAC-SHA256 (X-IYZ-SIGNATURE-V3)** imza doğrulaması yapar.
*   **Merkezi Abonelik Servisi (`abonelik.service.ts`)**:
    *   *Abonelik Başlatma:* Paket kontrolü, VIP için rating >= 4.5 koşulu denetimi ve iyzico Checkout Form tetikleyicisi.
    *   *Kampanya Sistemi (6 Kural):* Aktiflik, geçerlilik tarihi, max kullanım, usta tekil kullanımı, paket uygunluğu ve yeni üye zorunluluğu doğrulamaları.
    *   *Trial Süreçleri:* Kart çekimi olmadan 14 günlük trial paketi oluşturma.
    *   *Yenileme & Başarısız Ödeme:* `payment-retry` kuyruğu üzerinden 3'er gün arayla asenkron deneme ve 3. başarısızlıkta askıya alma (`suspended`) yetenekleri.
    *   *Kota Sıfırlama Cron:* Her ayın 1'i 00:00 TR saatinde (`@Cron('0 21 1 * *')`) accepted_count sıfırlanıp limitlerin paket tipine göre güncellenmesi.
*   **Abonelik Kontrolcüsü (`abonelik.controller.ts`)**: Paket sorguları (`GET /api/ortak/paketler`), abonelik başlatma, iptal etme, kota sorguları ve kampanya doğrulama endpoint'leri.
*   **Webhook Kontrolcüsü (`webhook.controller.ts`)**: checkout-form callbacks ve resmi webhook olay (CHECKOUT_FORM_AUTH, SUBSCRIPTION_RENEW_SUCCESS, SUBSCRIPTION_ORDER_FAILURE) imza denetimli işleyicisi.
*   **Admin Trial Kontrolcüsü (`admin-trial.controller.ts`)**: Trial atama (`POST /api/admin/providers/:id/trial`) ve silme rotaları.
*   **BullMQ Failed Payment Retry Processor (`abonelik.processor.ts`)**: payment-retry kuyruğu asenkron işlemcisi.

### 🧪 E2E Entegrasyon Test Doğrulamaları
*   **Programatik E2E Testi (`src/test-payment-e2e.ts`)**: NestJS context'i programatik olarak başlatılarak; paket sorguları, kampanya 6 kural kontrolü, free trial denemesi, iyzico checkout form aktivasyonu, ödeme ve kampanya kullanım logları, asenkron renewal yenileme, başarısız ödemeler ve retry kuyruk planlamaları, admin trial ataması ve aylık kota sıfırlama cron akışlarının tamamı uçtan uca test edilmiş ve **100% başarıyla** tamamlanmıştır.

---

## 🛠️ Adım 10 Geliştirme Detayları (NPS & Bildirim Altyapısı)

### 🖥️ 1. Backend NPS & Bildirim API Modülü (`backend-api/src/ortak/bildirimler/`)
*   **Veritabanı Şeması (Phase 2+ Modelleri)**: `schema.prisma` dosyasındaki Phase 2+ bildirim ve NPS modelleri aktif hale getirilerek migrations başarıyla uygulandı:
    *   `NotificationLog` (in-app, sms, email, push şablon günlükleri)
    *   `NotificationPreference` (whatsapp, sms, push, e-posta onayları)
    *   `NpsResponse` (NPS Yanıtları: Detraktör, Pasif, Promoter grupları)
    *   `User.fcm_token` push token alanı.
*   **Merkezi Bildirim Kodları & Şablon Motoru (`bildirim-sablonlari.ts`)**: Müşteri (HA-01 → HA-12), Hizmet Veren (HV-01 → HV-21) ve Yönetici (AD-01 → AD-07) olmak üzere toplam **42 bildirim kodunun** tamamı merkezi şablon motoruna tescillendi.
*   **NPS & Bildirim Servisi (`bildirim.service.ts`)**:
    *   `sendNotification`: Şablonları formatlar, tercih durumuna göre loglar ve push simülasyonu yapar.
    *   `triggerNpsSurvey`: İş bitiminden 30 dakika sonra anket davetini delayed BullMQ job'ı olarak planlar.
    *   `recordNpsResponse`: Seeker puanını kaydeder, `detractor` (0-3), `passive` (4-6), `promoter` (7-10) akışlarını yönetir. Detraktör durumunda 10 dk gecikmeli `HA-09` planlanır ve anlık alarm fırlatılır. Promoter durumunda 2 saat gecikmeli `HA-10` planlanır.
    *   `AD-07 Çoklu Detraktör Eşik Alarmı`: Aynı HV son 30 günde 3+ detraktör puanı aldığında yöneticilere anlık `AD-07` email alarmı gönderir.
*   **Kuyruk İşleyicileri (`bildirim.processor.ts`)**:
    *   `NpsSurveyProcessor`: BullMQ `'nps-survey'` kuyruğundaki gecikmeli `survey-trigger` (HA-08), `follow-up-trigger` (HA-09) ve `review-invite-trigger` (HA-10) işlerini işler.
    *   `DisputeAlertProcessor`: Anlık `dispute-alert` kuyruğunu işleyerek kalite personeline uyarı atar. Tutar sapma alarm seviyelerine göre **24 saat SLA (Acil/Urgent)** veya **48 saat SLA (Normal)** süreli otomatik `CallTask` kayıtları üretir.
*   **API Kontrolcüsü (`bildirim.controller.ts`)**: FCM token tescili (`POST /api/ortak/bildirimler/fcm-token`), NPS puanlama (`POST /api/ortak/nps/respond`) ve geçmiş günlükler (`GET /api/ortak/bildirimler/gecmis`) endpoint'leri RBAC ile korumalı olarak sunuldu.
*   **JobCompletion Entegrasyonu**: `JobCompletionService` üzerinden onaylandığında %0 sapmada asenkron `triggerNpsSurvey` (30 dk gecikmeli), uyuşmazlıklarda ise `triggerDisputeAlert` kuyruk fırlatmaları transaction commit sonrası asenkron olarak tetiklenir.

### 🧪 E2E Entegrasyon Test Doğrulamaları
*   **Programatik E2E Testi (`src/test-notification-e2e.ts`)**: NestJS context'i programatik olarak başlatılarak; FCM token kaydı, tüm 42 şablonun tescili ve hatasız formatlanıp loglanması, 0-3 NPS detraktör ve BullMQ delayed follow-up planlamaları, son 30 günde 3+ detraktör alarm limitlerinin `AD-07` alarmını tetiklemesi, ve 7-10 promoter 2 saat delayed `HA-10` değerlendirme davetlerinin tescili uçtan uca test edilmiş ve **100% başarıyla** tamamlanmıştır.

---

## 🛠️ Adım 11 Geliştirme Detayları (Admin Yetki & Uyuşmazlık Yönetimi)

### 🖥️ 1. Backend Admin API Modülü (`backend-api/src/admin/`)
*   **10 Personel Rolü ve İzin Matrisi (`permissions.ts`)**: PRD §15.13 kapsamında tanımlanan 10 personel rolü (`super_admin`, `team_leader`, `quality_staff`, `ops_staff`, `finance_staff`, `marketing_staff`, `sales_staff`, `hr_staff`, `executive`, `rnd_staff`) için statik izin matrisi tescil edildi. `super_admin` tüm yetkilere tam erişim sağlar. Diğer roller için modül bazlı yetkiler (`read`, `write`, `none`) statik matris üzerinden ve veritabanı `Staff` eşleşmesi kontrol edilerek dinamik olarak doğrulanır.
*   **Admin & Staff Onboarding**:
    *   `POST /api/admin/staff`: Yeni personel ekleme işleminde, personel kaydı (`Staff` tablosu) oluşturulurken aynı email adresiyle otomatik olarak `admin` rolüne sahip bir `User` hesabı da tek bir `$transaction` bloğunda oluşturulur.
    *   `GET /api/admin/staff`: Yetkili personellerin listesini döndürür.
*   **Audit Logging (Denetim Günlüğü)**:
    *   Tüm admin yazma aksiyonları (`provider.approve`, `provider.reject`, `dispute.resolve`, `staff.create`, `call_task.process`, `user.ban` vb.) veritabanındaki `AuditLog` tablosuna `operator_email`, `action`, `target_id`, `old_value` ve `new_value` bilgileriyle kalıcı olarak kaydedilir.
*   **SLA-Uyumlu FIFO Çağrı Görevi Kuyruğu (Call Tasks)**:
    *   `GET /api/admin/call-tasks/fifo`: Kalite personeli (`quality_staff`) için atanmayı bekleyen ve uyuşmazlık sapma oranlarına göre üretilen `CallTask` kayıtlarını en eski tarihten başlayarak FIFO (First-In, First-Out) sırasıyla getirir.
    *   `POST /api/admin/call-tasks/:id/result`: Arama sonucunu (`reached`, `unreachable`, `callback`) işler. İletişim kurulamayan (`unreachable`) aramalarda deneme sayısı artırılarak 24 saat sonrasına asenkron planlama yapılır. 3. başarısız denemede görev otomatik olarak kapatılır (`status = done`).
*   **Dispute Çözüm ve İş Tamamlama Kapatma**:
    *   `PUT /api/admin/disputes/:id/resolve`: Uyuşmazlığı (`seeker_correct`, `provider_correct`, `split_50_50`, `split_custom`) karara bağlayarak ilgili `JobCompletion` kaydını `completed` ve uyuşmazlık durumunu `resolved` olarak günceller, audit log kaydını yazar.

### 🧪 E2E Entegrasyon Test Doğrulamaları
*   **Programatik E2E Testi (`src/test-admin-controls-e2e.ts`)**: NestJS context'i programatik olarak başlatılarak; rol bazlı yetkilendirme (Super Admin izinli, Quality Staff forbidden), sebeplerle usta reddetme (R01-R05) ve onaylama, audit log veri tescili, uyuşmazlık (dispute) çözme, en eski tarihe göre FIFO çağrı kuyruğu sıralama, aranamayan aramaların (unreachable) 3 denemeye kadar tekrarlanıp 3. denemede kapatılması, ve personel (staff) onboarding sırasında eşleşen admin kullanıcısının otomatik oluşturulması akışlarının tamamı uçtan uca test edilmiş ve **100% başarıyla** tamamlanmıştır.

---

## 🛠️ Adım 12 Geliştirme Detayları (Faz 2 Kategori Genişlemesi)

### 🖥️ 1. Veritabanı Aktivasyonu
*   **seed.ts Güncellemesi:** Faz 1 kapsamında yer alan kalan 5 kategorinin (`Boya Badana`, `Nakliyat / Ev Taşıma`, `Su Tesisatı`, `Elektrik Tesisatı`, `Ev Tadilat`) `isActive` bayrağı `true` olarak güncellendi.
*   **Database Seeding:** Seed işlemi portable PostgreSQL veri tabanı üzerinde yeniden yürütülerek tüm 6 kategorinin veritabanında aktif olduğu doğrulandı.

### 🔄 2. Backend Dinamik AI Chat Geliştirmeleri (`chat.service.ts`)
*   **Kategori slug/isim uyuşmazlıklarının giderilmesi:** `detectCategory` ve `getCategoryName` metodlarında `ev-tadilat` -> `Ev Tadilat` ve `nakliyat` -> `Nakliyat / Ev Taşıma` eşleşmeleri seed.ts ile tam uyumlu hale getirildi.
*   **Dinamik Soru Şablonları (`CATEGORY_QUESTIONS`):** 5 yeni kategorinin her biri için zorunlu sorular ve parse metotları tescil edildi:
    *   **Boya Badana:** `district` (Konum), `metrekare` (Metrekare), `tur` (İç/Dış Boya), `renkTip` (Renk/Boya Tipi)
    *   **Nakliyat / Ev Taşıma:** `district` (Çıkış Konumu), `destinationDistrict` (Varış Konumu), `daireTipi` (Daire Tipi), `katAsansor` (Kat & Asansör), `tarih` (Taşınma Tarihi)
    *   **Su Tesisatı:** `district` (Konum), `sorunTuru` (Sorun Türü), `aciliyet` (Aciliyet)
    *   **Elektrik Tesisatı:** `district` (Konum), `isTuru` (İş Türü), `aciliyet` (Aciliyet)
    *   **Ev Tadilat:** `district` (Konum), `kapsam` (Tadilat Kapsamı), `metrekare` (Metrekare), `butce` (Bütçe Aralığı)
*   **Parametre Ayrıştırma (Greedy Parsing):** Kullanıcı mesajlarından ilçe, metrekare, bütçe, daire tipi gibi bilgileri Regex ile akıllıca ayıklayan parse metotları (`parseMetrekare`, `parseAciliyet`, `parseButce`, `parseLocation` vb.) yazıldı.
*   **Adım Makinesi Entegrasyonu:** `collecting_details` adımı dinamik hale getirilerek kullanıcının eksik kalan ilk sorusunu sırayla soran ve tüm sorular bittiğinde otomatik `ask_name` adımına geçiren yapı kuruldu.
*   **PostgreSQL WIN1254 Encoding Çözümü:** PostgreSQL veritabanının Türkçe Windows encoding (WIN1254) ile çalışmasından ötürü `₺` simgesi kaydedilirken oluşan çökme sorunu, tüm bütçe aralıkları ve soru metinlerindeki `₺` simgesinin `TL` yapılarak veritabanına sadece UTF-8 ile uyumlu karakterlerin yazılmasıyla tamamen çözüldü.

### 🎨 3. Müşteri Ön Yüz Kart Güncellemesi (`ChatScreen.tsx`)
*   **Dinamik Özet Alanları:** `ChatScreen.tsx` onay formunda hardcoded "Ev Temizliği" metinleri ve statik alanlar kaldırıldı.
*   **Kategoriye Özel Kart Render Etme:** `collected_data.categorySlug` değerine göre dinamik özet alanları render eden şık kart yapısı entegre edildi:
    *   *Nakliyat:* Çıkış/Varış Konumları, Daire Tipi, Kat & Asansör ve Tarih detayları.
    *   *Boya:* Metrekare, Uygulama Alanı ve Renk/Boya Tipi detayları.
    *   *Tesisat:* İş/Sorun Türü ve Aciliyet detayları.
    *   *Tadilat:* Tadilat Kapsamı, Metrekare ve Bütçe Aralığı detayları.
*   Tüm bu alanlar antrasit (#232323) ve neon lime (#D4F54E) renk paletine sahip premium tasarım dilinde render edildi.

### 🧪 4. Programatik E2E Test Doğrulamaları (`src/test-categories-e2e.ts`)
*   NestJS context'i programatik olarak başlatılarak 5 yeni kategori için ayrı ayrı chat simülasyonları yapıldı:
    1.  **Boya Badana Flow:** Beşiktaş -> 120m2 -> İç mekan -> Beyaz saten boya -> Ali Müşteri -> OTP -> Onay -> Başarılı Tescil.
    2.  **Nakliyat Flow:** Kadıköy -> Ataşehir -> 2+1 -> 5. kat asansörsüz -> 1 Haziran -> Ahmet Taşımacı -> OTP -> Onay -> Başarılı Tescil.
    3.  **Su Tesisatı Smart Flow:** "Şişli'de kombi tesisatında acil su sızıntısı var musluk arızası" (tüm parametreler tek mesajda smart parse edildi) -> Ayşe Tesisatçı -> OTP -> Onay -> Başarılı Tescil.
    4.  **Elektrik Tesisatı Flow:** Bakırköy -> yeni priz ve sigorta onarımı -> acil hemen -> Mehmet Elektrik -> OTP -> Onay -> Başarılı Tescil.
    5.  **Ev Tadilatı Flow:** Üsküdar -> banyo yenileme fayans dahil -> 15 metrekare -> bütçe 50-100 bin arası -> Fatma Tadilat -> OTP -> Onay -> Başarılı Tescil (Bütçe "50.000–100.000 TL" olarak sıfır encoding hatasıyla veritabanına tescil edildi).
*   Testlerin tamamı **100% başarıyla** tamamlandı.

### 📦 5. Next.js Derleme Doğrulaması
*   `app-musteri` projesi `next build` ile Turbopack derleyicisi kullanılarak başarıyla derlendi ve TypeScript checks aşamasından sıfır hata ve sıfır uyarı ile geçerek statik sayfaları başarıyla üretti.

---

## 🛠️ Adım 13 Geliştirme Detayları (React Native HA Mobil Uygulaması)

### 1. Expo Monorepo Scaffold Kurulumu (`app-musteri-mobil/`)
*   **Proje Başlatma:** root workspace üzerinde `npx create-expo-app app-musteri-mobil -y --no-agents-md` komutu ile Expo Router destekli modern Expo SDK 56 projesi oluşturuldu.
*   **ETARGET Mismatch Çözümü:** Expo varsayılan şablonundaki `"expo-image": "~56.0.9"` paketinin npm havuzunda bulunmamasından ötürü oluşan `ETARGET` kurulum hatası giderilerek en kararlı sürüm olan `"expo-image": "~56.0.6"` sürümü tescillendi.
*   **Cihaz Kütüphaneleri Entegrasyonu:** Mobil standartlara uygun `@react-native-async-storage/async-storage` ve `socket.io-client` paketleri kuruldu.

### 2. Platform ve IP Yönlendirici (`src/config.ts`)
*   React Native emülatörlerinin ve gerçek test cihazlarının local backend API portlarına (REST `3000` ve WebSocket `3005`) doğrudan erişebilmesi için platform algılayıcı yönlendirme servisi yazıldı (Android emülatörleri için `10.0.2.2`, iOS simülatörü için `localhost`).

### 3. AsyncStorage Session Cache Interceptor (`src/lib/session.ts`)
*   AsyncStorage tabanlı, custom UUIDv4 üreteci içeren mobil uyumlu `customFetch` interceptor'ı yazıldı. İstek başlıklarına otomatik olarak `X-Session-ID` enjekte edilir.

### 4. Modüler Arayüz Bileşenleri (`src/components/`)
*   **`ChatBubble.tsx`:** Koyu antrasit (#232323) Seeker balonlarını ve logo avatar damgalı AI asistan balonlarını render eden premium mesaj bileşeni.
*   **`SummaryCard.tsx`:** Chat durum makinesinin `confirm_form` (onay formu) adımında dinamik detayları listeleyen ve interaktif `[Onayla] / [Düzelt]` butonlarını sunan bileşen.
*   **`LiveOfferCard.tsx`:** WebSocket odasından düşen usta tekliflerini detaylarıyla gösteren anlık kart bileşeni.

### 5. Expo Router Sayfa Navigasyon Yapısı (`app/`)
*   **`_layout.tsx` (Root Layout):** Stack navigasyonunu yönetir ve session başlatır.
*   **`index.tsx` (Ana Giriş Ekranı):** Plus Jakarta Sans tipografisi, neon lime renkli hızlı seçim kategorileri (Chips), Bottom-Sheet Tüm Kategoriler Paneli ve AI chat akışını başlatan büyük metin alanı.
*   **`chat.tsx` (AI Chat Akış Ekranı):** AI chat akışını, dinamik SummaryCard özetini ve WebSocket canlı usta tekliflerini FlatList/ScrollView yapısıyla birleştiren ana sohbet ekranı.

### 6. Doğrulama ve Derleme
*   `npx tsc --noEmit` tip kontrolünden sıfır hata ve sıfır uyarı ile geçerek **100% başarıyla** derlenmiştir.

---

## 🛠️ Adım 14 Geliştirme Detayları (React Native HV Mobil Uygulaması)

### 1. Expo Monorepo Scaffold Kurulumu (`app-hizmetveren-mobil/`)
*   **Proje Başlatma:** `app-hizmetveren-mobil` monorepo dizini altında modern Expo SDK 56 projesi kuruldu.
*   **Bağımlılık Paketleri:** Mobil standartlara uygun `@react-native-async-storage/async-storage` ve `socket.io-client` paketleri entegre edildi. `"expo-image": "~56.0.6"` sürümü tescillenerek paket kurulum çakışmaları tamamen çözüldü.

### 2. Platform ve Gateway Yönlendirici (`src/config.ts`)
*   Emülatörler ve test cihazları için platform bazlı gateway REST API (`http://10.0.2.2:3000` / `http://localhost:3000`) ve WebSocket (`http://10.0.2.2:3005` / `http://localhost:3005`) yönlendirmeleri yazıldı.

### 3. JWT Bearer Token ve customFetch Interceptor (`src/lib/auth.ts`)
*   AsyncStorage tabanlı `customFetch` interceptor'ı geliştirildi. Oturum açıldığında elde edilen JWT token otomatik olarak AsyncStorage'da saklanır ve tüm giden API isteklerinin `Authorization: Bearer <Token>` başlığına otomatik olarak enjekte edilir.

### 4. Modüler Arayüz Bileşenleri (`src/components/`)
*   **`JobCard.tsx`:** Esnaf partnerler için sisteme yeni düşen işleri, kategorisini, konumunu, talep detaylarını ve bu işe teklif veren/görüntüleyen usta sayısını (`viewerCount`) render eden premium koyu mod (#232323) kart bileşeni.
*   **`OfferModal.tsx`:** Hizmet verenlerin canlı teklif göndermesini sağlayan, fiyat ve açıklama girilebilen, neon lime temalı interaktif modal bileşeni.

### 5. Expo Router Sayfa Navigasyon Yapısı (`app/`)
*   **`_layout.tsx` (Root Layout):** Uygulamanın kimlik doğrulama context'ini ve Stack navigasyonunu yöneten ana layout yapısı.
*   **`index.tsx` (Landing & Giriş Ekranı):**
    *   *Usta Hızlı Giriş:* Geliştirme kolaylığı için seed edilmiş usta profillerini barındıran dropdown test giriş paneli.
    *   *Kota & Profil Paneli:* Aktif abonelik paket ismini, reytingini ve bu ayki teklif kota kullanım barını gösteren şık arayüz.
*   **`gelen-isler.tsx` (Canlı Dağıtılan İşler Paneli):**
    *   WebSocket odasına (`provider_{providerId}`) anlık bağlantı.
    *   Yeni bir iş dağıtıldığında WebSocket ile ekran yenilenmeden iş kartının anlık listeye düşmesini sağlayan canlı Socket.io akışı.

### 6. Doğrulama ve Derleme
*   `app-hizmetveren-mobil` projesinde `npx tsc --noEmit` tip kontrolü çalıştırılarak sıfır hata ve sıfır uyarı ile **%100 başarılı** derleme tescil edilmiştir.

---

## 🛠️ Adım 15 Geliştirme Detayları (Kampanya & Referans Davet Sistemi)

### 1. Veritabanı Şeması ve Migration
*   **Referral Tablosu:** Şemaya `Referral` modeli ve `ReferralType` enum'ı eklendi. `referee_id` alanına `@unique` index tanımlanarak bir kullanıcının yalnız tek sefer referans gösterilebilmesi sağlandı.
*   **User Balance:** Müşterilerin platform içi davet ödüllerini tutabilmek için `User` modeline `balance Decimal @default(0)` alanı eklendi.
*   **CampaignType Genişletme:** Enum'a `quota_bonus` (ek kota hediyesi) dahil edildi.
*   **Prisma Migration:** `20260525203338_add_referral_and_quota_bonus` migration'ı yerel veritabanına başarıyla uygulandı ve Prisma Client yeniden üretildi.

### 2. Backend Referans Modülü (`backend-api/src/ortak/referral/`)
*   **ReferralService:**
    - `getOrCreateReferralCode(userId)`: Deterministik davet kodu üreteci. Format: `[Kullanıcı isminin ilk 4 harfi][User UUID'nin ilk 4 karakteri]`.
    - `applyReferralCode(refereeUserId, code)`: Kodu çözerek UUID startsWith mantığıyla memory filtresiyle `referrer` kullanıcısını bulur, doğrular ve eşleme kaydı atar.
    - `triggerSeekerReward(refereeUserId)`: Davet edilen Seeker ilk işini bitirince davet eden HA'ya **100 TL balance** asenkron/senkron enjekte eder.
    - `triggerProviderReward(refereeProviderId)`: Davet edilen Provider ilk paket aboneliğini satın aldığında, davet eden HV adına **500 TL'lik** tek kullanımlık `REF-HV-{referrerId}-{refereeId}` indirim kampanyası otomatik üretir.
*   **ReferralController & Module:** Rotalar `/api/ortak/referral/kod-al` ve `/api/ortak/referral/kod-gir` olarak tescil edildi, JwtAuthGuard ile RBAC koruması sağlandı.

### 3. İş Akışı ve Kampanya Genişletmeleri
*   **Ek Kota (`quota_bonus`):** Abonelik başlatıldığında veya checkout başarısında, `quota_bonus` tipindeki kuponlar aylık kotayı (`ProviderMonthlyQuota.monthly_limit`) `campaign.value` kadar (örn: +15 hediye kota) doğrudan arttırır.
*   **Dinamik Free Trial:** Sabit 14 gün yerine kampanya değerine göre dinamik gün trial tanımlama yapısı kodlandı.
*   **Tetikleyici Entegrasyonları:**
    - `JobCompletionService.confirmCompletion` metodunun en sonuna `triggerSeekerReward` tetikleyicisi enjekte edildi.
    - `AbonelikService.handleCheckoutSuccess` metodunun en sonuna `triggerProviderReward` tetikleyicisi enjekte edildi.

### 4. Programatik E2E Entegrasyon Test Doğrulaması (`src/test-referral-campaign-e2e.ts`)
*   NestJS programatik context'i üzerinde; deterministik kod üretme, referans koduyla kaydolma, HA ilk iş bitiş ödüllendirmesi, HV ödeme tamamlanma 500 TL indirim kodu üretimi ve Ek Kota kampanya kodu tescili akışlarının tamamı yazılan E2E testiyle koşturulmuş ve **%100 başarıyla** tamamlanmıştır.

### 5. Arayüz ve Tip Kontrolleri
*   `app-hizmetveren-mobil`, `app-musteri-mobil`, `app-hizmetveren` ve `app-musteri` projelerinde `npx tsc --noEmit` ile tip doğrulamaları koşturulmuş ve sıfır hata ile tamamlandığı teyit edilmiştir.

---

## 🛠️ Adım 16 Geliştirme Detayları (Çoklu Şehir Lansmanı & Kategori Artışı Altyapısı)

### 1. Veritabanı Aktivasyonu & Kategori Artışı
*   **seed.ts Güncellemesi:** Platformdaki aktif kategori sayısı 14'e yükseltildi. `schema.prisma` üzerindeki diğer kategoriler aktifleştirildi.
*   **Seeding & Veritabanı Eşlemesi:** Veritabanına tüm yeni kategoriler (Boya Badana, Nakliyat, Tesisat vb.) başarıyla tohumlandı.

### 2. Akıllı Konum Çözümleme
*   AI chat asistanının müşteriden gelen ilçe isimlerini Ankara, İzmir ve İstanbul il sınırlarıyla otomatik eşleştiren akıllı konum çözümleyicisi kuruldu.
*   **Akıllı Sınır Dağıtımı:** Taleplerin şehir bazında sınırlandırılması kodlandı (Ankara'daki talepler Ankara ustalarına, İzmir'deki talepler İzmir ustalarına).

---

## 🛠️ Adım 17 Geliştirme Detayları (NPS Yönetim Paneli, Role Göre Özelleşen Personel Dashboard'ları & A/B Test Altyapısı)

### 1. DTO & Controller Geliştirmeleri
*   Tüm yönetim paneli endpoints `GET /api/admin/nps/stats`, `GET /api/admin/nps/alarms`, `GET /api/admin/dashboard/role/:role`, `GET /api/admin/ab-test/config` ve `POST /api/admin/ab-test/config` validated DTO şemalarıyla JwtAuthGuard ve `admin` rol koruması altında kodlandı.

### 2. NPS Analiz ve Alarm Motoru
*   **NPS Hesaplaması:** $NPS = \%Promoters - \%Detractors$ formülüyle net NPS skoru ve kategori bazlı ortalama memnuniyet oranları dinamik PostgreSQL sorgularıyla hesaplandı.
*   **3+ Detraktör Alarmı:** Son 30 günde 3 veya daha fazla detraktör puanı almış hizmet veren ustalar, acil operasyonel alarm listesi olarak sunuldu.

### 3. Role Göre Özelleşen Canlı Göstergeler (Dashboard'lar)
*   **Executive (Yönetici) Dashboard:** Canlı MRR (Aylık Tekrarlayan Gelir), net NPS skoru, aktif usta/müşteri oranları ve son 10 başarısız ödeme listesi.
*   **Quality Staff Dashboard:** FIFO uyumlu atanmış CallTask çağrı kuyruğu, bekleyen onay kuyrukları ve SLA aşımı yapan kalite aramaları listesi.
*   **Sales Staff Dashboard:** Net aktif abonelik sayıları, kotasını %85'ten fazla dolduran ustalar ve son 30 gündür teklif vermemiş churn riski yüksek ustaların aksiyon listesi.

### 4. A/B Test ve Ar-Ge Altyapısı
*   AI sohbet asistanının model, temperature ve split_ratio parametreleri Redis Cache katmanına (`ab_test:*` anahtarlarıyla) bağlandı ve yönetim panelinden dinamik güncelleme akışı kodlandı.

### 5. E2E Entegrasyon Testi & Tip Doğrulaması
*   `test-ab-nps-dashboards-e2e.ts` yazılıp koşturularak NPS hesaplamaları, alarm limitleri ve Redis entegrasyonu %100 doğrulanmıştır. Monorepo genelinde tip kontrolünden sıfır hata ile geçilmiştir.

---

## 🛠️ Adım 18 Geliştirme Detayları (Favori Hizmet Veren (Usta) Sistemi & Tekrar Çalışma Entegrasyonu)

### 1. Veritabanı Şeması
*   `FavoriteProvider` modelinin `schema.prisma` içerisine eklenmesi ve seeker_id, provider_id alanlarına unique index atanarak PostgreSQL migration'ın koşturulması.

### 2. API Endpoints & Validasyon Servisi
*   `/api/ortak/favoriler/*` rotaları ile usta favorileme, favoriden çıkarma ve aktif favorileri listeleme endpoint'lerinin JwtAuthGuard korumasında yazılması.
*   **Tamamlanmış İş & Puanlama Koşulları:** Ustanın favoriye eklenebilmesi için o müşteriyle en az 1 completed job'ı olması ve puanlanmış olması kuralının dinamik sorguyla API seviyesinde doğrulanması.

### 3. Akıllı Dağıtım Entegrasyonu (Smart Routing)
*   AI chat ve talep oluşturma akışına `sendToFavoritesOnly` parametresinin eklenerek dağıtım anında WebSocket yayınının sadece favori usta odalarına gitmesi, usta yanıt vermezse 10 dk sonra genel dağıtıma fallback aktarımının sağlanması.

### 4. Web & Mobil Ön Yüz Tasarımları
*   **Seeker:** Yıldız puanlaması sonrası favoriye ekleme butonu, talep özetinde "Sadece Favori Ustalarıma Gönder" opsiyonu ve mobil uygulamada "Favori Ustalarım" tabı.
*   **Provider:** Gelen iş kartlarında favori müşteriler için neon parlak **`❤️ Favori Müşteri`** rozet gösterimi.

### 5. E2E Test & Tip Doğrulama
*   `test-favorite-providers-e2e.ts` asenkron testinin yazılması, monorepo tip bütünlüğünün ve derlemenin doğrulanması.

---

## 🛠️ Adım 19 Geliştirme Detayları (S3/R2 Güvenli Yükleme Altyapısı & 20 Kategori Lansmanı)

### 1. Dosya Yükleme (Presigned URL) Altyapısı
*   **DTO Validasyonları:** `PresignedUrlDto` ile `fileName` ve safe MIME type limitleri (`image/png`, `image/jpeg`, `image/webp`, `application/pdf`) tescil edilerek tehlikeli dosya türlerinin (örn: `.exe`, `.html`, `.bat`) sisteme yüklenmesi API seviyesinde engellendi.
*   **S3/R2 Upload Entegrasyonu:** JwtAuthGuard ve genel kimlik yetkilendirmesi altında çalışacak `/api/ortak/upload/presigned-url` endpoint'i kodlandı.
*   **Mock S3 Fallback:** AWS ortam değişkenlerinin bulunmadığı lokal geliştirme ve E2E test sistemlerinde, asenkron testlerin ve entegrasyonların kesintisiz çalışabilmesi için `StorageService` mock handler'ı üzerinden mock pre-signed URL ve Mock Upload Put yolları tescil edildi.

### 2. 20 Kategori Aktivasyonu (Faz 3 Kategorileri)
*   **Seed Güncellemesi:** `prisma/seed.ts` dosyası güncellenerek Faz 3 lansmanında yer alan son 6 kategorinin `isActive` bayrağı `true` yapıldı. Seeding komutu PostgreSQL veritabanı üzerinde koşturularak 20 kategorinin tamamı aktif edildi.
*   **Dinamik AI Chat Soru Şablonları:** `chat.service.ts` dosyasındaki `CATEGORY_QUESTIONS` nesnesi güncellenerek son 6 kategori için dinamik soru akışları ve Türkçe alan etiketleri tescillendi:
    *   **Cam Balkon & PVC Pencere:** Konum, Adet (`parseAdet`), Cam Tipi.
    *   **Ofis & İş Yeri Temizliği:** Konum, Metrekare (`parseMetrekare`), Sıklık (`parseSiflik`).
    *   **Doğalgaz Tesisatı:** Konum, Daire Tipi (`parseDaireTipi`), Kombi Durumu.
    *   **İç Mimar & Dekorasyon:** Konum, Kapsam (`parseTadilatKapsam`), Bütçe (`parseButce`).
    *   **Fotoğrafçı:** Çekim Konumu, Etkinlik Türü, Çekim Tarihi.
    *   **Organizasyon & Etkinlik:** Etkinlik Konumu, Etkinlik Türü, Davetli Sayısı (`parseDavetliSayisi`), Tarih.

### 3. Programatik E2E Testi & Tip Doğrulama
*   **Programatik E2E Entegrasyon Testi (`test-upload-and-20-categories-e2e.ts`):** NestJS context'i programatik olarak başlatılarak; safe MIME type validasyonları, Mock S3 URL üretimi ve yeni 6 kategorinin tamamı için turn-by-turn AI chat konuşma simülasyonları ile DB tescilleri uçtan uca test edildi ve **100% başarıyla** tamamlandı.
*   **Derleme Kontrolü:** `npx tsc --noEmit` tip kontrolü çalıştırılarak tüm backend API modülünün sıfır hata ve sıfır uyarı ile tescil edildiği doğrulandı.

---

## 🛠️ Adım 20 Geliştirme Detayları (Production Docker Konteynerizasyonu, AWS ECS Deployment Konfigürasyonu & Sağlık İzleme (Health Check) Sistemi)

Faz 3 kapsamında planlanan canlıya geçiş altyapısı ve AWS ECS konteynerizasyon gereksinimleri doğrultusunda, Esnaaf backend API sisteminin Docker, AWS ve sağlık kontrolü altyapıları eksiksiz tamamlanmıştır:

### 🐳 1. Production Dockerization Altyapısı
*   **Multi-Stage Dockerfile (`backend-api/Dockerfile`):** Üretim ortamında minimum imaj boyutu ve yüksek güvenlik sağlamak amacıyla multi-stage (çok aşamalı) Docker mimarisi uygulandı:
    *   *Stage 1: Build:* Node 22.12.0 Alpine tabanında tüm bağımlılıklar yüklenip TypeScript uygulaması derlendi. `npm prune --production` ile geliştirme bağımlılıkları temizlendi.
    *   *Stage 2: Run:* Sadece derlenen `dist`, üretim `node_modules` ve `prisma` dosyaları kopyalandı. Konteyner güvenliğini artırmak için root yetkileri olmayan default `node` kullanıcısı ile çalışması (`USER node`) tescil edildi.
*   **Docker Ignore (`backend-api/.dockerignore`):** `node_modules`, `.env`, `dist`, `.git` gibi gereksiz dosya ve dizinlerin derleme bağlamına alınması engellendi.
*   **Yerel Orkestrasyon (`docker-compose.yml`):** Proje kök dizininde PostgreSQL 15, Redis 6 ve backend API servislerini birbirine bağlayan, ortam değişkenlerini otomatik enjekte eden yerel test orkestrasyon dosyası oluşturuldu.

### ☁️ 2. AWS ECS & GitHub Actions CI/CD Konfigürasyonları
*   **ECS Task Definition (`backend-api/ecs-task-def.json`):** AWS ECS Fargate üzerinde çalışacak konteynerlerin CPU (256), Bellek (512 MB), logConfiguration (awslogs) ve port mapping (3000 -> 3000) ayarlarını deklare eden üretim standartlarında şablon oluşturuldu.
*   **GitHub Actions CI/CD (`.github/workflows/deploy.yml`):** Ana repoya push yapıldığında AWS ECR login, imaj derleme, tag'leme, ECR'a push etme ve AWS ECS üzerindeki Task Definition ile servisi otomatik güncelleme adımlarını içeren deploy otomasyon YAML dosyası tescil edildi.

### 🩺 3. Sağlık İzleme (Health Check) Sistemi
*   **Dinamik Sağlık Servisi (`app.service.ts`):** AWS Application Load Balancer (ALB) ve ECS servisinin konteyner durumunu anlık izleyebilmesi için dinamik bir doğrulama servisi yazıldı:
    *   *Database:* Prisma üzerinden hızlı bir raw SQL `SELECT 1` sorgusu çalıştırılarak veritabanı bağlantısının anlık durumu sorgulanır.
    *   *Redis:* Redis istemcisi üzerinden ping/pong doğrulaması yapılır.
*   **Sağlık Rotaları (`app.controller.ts`):** `/api/health` rotası JwtAuthGuard'dan muaf (`@Public()`) kılınarak tescillendi. Bileşenlerden biri çevrimdışı olduğunda HTTP 503 (`ServiceUnavailableException`) fırlatılarak Load Balancer'ın konteynerin sağlıksız olduğunu algılaması sağlandı.

### 🧪 4. Programatik E2E Test & Tip Doğrulama (`src/test-health-check-e2e.ts`)
*   NestJS programatik uygulama bağlamında; standard sağlıklı durumu, veritabanı çöktüğü durum (Prisma `$queryRaw` metodunun deterministik olarak hata fırlatacak şekilde mock'lanması) ve bu durumda sistemin HTTP 503 fırlattığı senaryolar uçtan uca doğrulanmıştır.
*   E2E testlerin tamamı **%100 başarıyla** geçti.
*   Monorepo genelinde `npx tsc --noEmit` çalıştırılarak sıfır derleme ve tip hatası olduğu teyit edildi.

---

## 🛠️ Adım 21 Geliştirme Detayları (Gemini Flash & Google Gen AI SDK Aktif Ajan Entegrasyonu - Active Agent Architecture)

Yapay zeka tabanlı sohbet asistanı, statik ve katı durum makinelerinden kurtarılarak otonom çalışan, resmi **Google Gen AI SDK** entegrasyonlu ve **Function Calling (Araç/Alet Çağırma)** destekli modern bir **Aktif Ajan (Active Agent)** mimarisine dönüştürülmüştür:

### 1. Resmi `@google/genai` Entegrasyonu
*   Google'ın en yeni ve birleşik resmi istemci kütüphanesi olan **`@google/genai`** kuruldu.
*   Hem hızlı/uygun maliyetli Google AI Studio (`GEMINI_API_KEY`) hem de kurumsal Vertex AI servisleri ile çalışmaya hazır ortak bir arayüz kuruldu.
*   `process.env.GEMINI_MODEL` (varsayılan: `gemini-2.5-flash`) çevre değişkeni entegre edildi.
*   API anahtarının bulunmadığı durumlarda otomatik devreye giren **Mock AI Engine / Fallback State Machine** mekanizması geriye dönük uyumluluk (%100 retrocompatibility) adına korundu.

### 2. Ajan Araç Şemaları (Function Calling Tools)
Ajanın konuşmanın akışına göre otonom olarak veritabanı işlemlerini tetikleyebilmesi için 3 adet resmi araç şeması deklare edilmiştir:
1.  **`detectCategory(categorySlug)`**: Müşterinin talep ettiği hizmetin kategorisini (20 kategori arasından) otonom olarak tespit eder.
2.  **`sendOTP(phone, name)`**: Müşterinin Ad-Soyad ve Telefon bilgilerini doğrulayıp SMS ile 6 haneli doğrulama kodu gönderir ve oturumu `otp_verification` aşamasına geçirir.
3.  **`createServiceRequest(seekerName, phone, categorySlug, formData)`**: Nihai talep tescilini yapar.

### 3. Akıllı Parametre Ayrıştırma ve Hata Düzeltmeleri
*   **Çoklu Şehir ve Kategori Kilidi:** `systemInstruction` asistan promptuna platformdaki 20 resmi hizmet kategorisi ile **İstanbul, Ankara ve İzmir** coğrafi hizmet kısıtı eklendi. Müşteri bu üç il dışında bir yer (Mersin, Adana vb.) belirttiğinde asistanın akışı durdurması ve desteklenen illere yönlendirmesi sağlandı.
*   **Açgözlü (Greedy) Parametre Kilidi:** `tarih`, `renkTip`, `katAsansor` gibi serbest metin alanlarının, kullanıcı başka bir soruya cevap verirken (örneğin daire tipi veya konum) bu mesajları kapıp üzerine yazması engellendi. Bu alanlar artık sadece **aktif soru kendileriyse** veya **belirli anahtar kelimeleri (tarih, saat, renk, kat vb.) içeriyorsa** parse edilmektedir.
*   **Çıkış ve Varış Konumu Ayrışması:** Nakliyat kategorisindeki `district` (Çıkış) ve `destinationDistrict` (Varış) alanlarının tek bir konum mesajından aynı anda etkilenmesi engellendi. Varış konumu artık yalnızca aktif soru `destinationDistrict` iken doldurulmaktadır.

### 4. Gelişmiş Hata Toleransı & Yeniden Deneme (Retry backoff)
*   Google API transient (geçici) veya yoğunluk hatalarına (429, 503, RESOURCE_EXHAUSTED vb.) karşı **üçlü üstel geri çekilme (exponential backoff retry)** mekanizması geliştirildi. API hatası durumunda asistan 1s, 2s aralıklarla otomatik olarak yeniden deneme yaparak asistan akışını kusursuz şekilde korur.

### 5. E2E Test & Tip Doğrulama
*   `test-gemini-agent-e2e.ts` E2E entegrasyon testi gerçek Gemini Flash modeli ile programatik olarak test edilmiş ve **%100 başarıyla** geçmiştir.
*   Tüm monorepo genelinde `npx tsc --noEmit` çalıştırılarak sıfır derleme ve tip hatası ile doğrulandı.

---

## 🛠️ Adım 22 Geliştirme Detayları (Google Cloud Platform (GCP) Canlı Ortam Kurulumu, Firebase Hosting Özel Alan Adı (esnaaf.com) Entegrasyonu & Otomatik CI/CD Dağıtım Altyapısı)

Esnaaf platformunun Faz 3 hedefleri doğrultusunda canlıya geçiş, özel alan adı entegrasyonu ve tam otomatik GitHub Actions CI/CD dağıtım altyapısı tamamlanmıştır:

### 1. Git ve Güvenli Depolama Konfigürasyonu
*   Monorepo kök dizini için `.gitignore` dosyası oluşturularak; veritabanı şifreleri, `.env` dosyaları, devasa `node_modules` klasörleri ve bilgisayardaki portatif araçların (`node-portable`, `pg-portable`, `redis-portable` vb.) GitHub'a sızması tamamen engellendi.
*   Monorepo başarıyla GitHub deposuna (`https://github.com/yemreorek/esnaaf`) aktarılarak sürüm kontrolüne alındı.

### 2. Cloud Run & Memorystore Redis VPC Egress Mimarisi
*   `esnaaf-backend` API servisi GCP Cloud Run üzerinde pre-deploy edildi. Canlı PostgreSQL veritabanı bağlantısı, güvenli rastgele üretilen JWT Secret anahtarları ve Gemini API anahtarı enjekte edildi.
*   Servisin Memorystore Redis özel IP'sine (`10.126.134.147`) erişebilmesi için `default` VPC ağına Direct VPC Egress bağlantısı sağlandı.
*   Next.js frontend uygulamaları için build-time argümanları (`ARG NEXT_PUBLIC_API_URL` vb.) Dockerfile şablonlarına entegre edilerek derleme sırasında canlı API adresleri enjekte edildi.

### 3. Firebase Hosting & Özel Alan Adı (esnaaf.com) Entegrasyonu
*   Google Cloud'un pahalı ve karmaşık Load Balancer'ları yerine, tamamen ücretsiz ve CDN destekli **Firebase Hosting** köprüsü kuruldu.
*   `firebase.json` ve `.firebaserc` dosyaları kurgulanarak, gelen tüm web trafiğinin (`**`) `europe-west3` (Frankfurt) bölgesindeki `esnaaf-musteri` Cloud Run servisine yönlendirilmesi sağlandı.
*   **Wix DNS Ayarları:** `esnaaf.com` (yalın domain) için `199.36.158.100` A kaydı ve `hosting-site=esnaaf-prod-orek` TXT sahiplik doğrulaması Wix DNS üzerinde tamamlandı. `www.esnaaf.com` için eski Wix CNAME kaydı silinerek default Firebase Hosting domainine (`esnaaf-prod-orek.web.app`) yönlenen yeni CNAME kaydı başarıyla tescillendi.
*   **Firebase CDN Refresh & Re-deploy:** SSL sertifikası üretildikten sonra küresel Google CDN yönlendirme tablolarını güncel domain eşleşmesiyle yenilemek amacıyla `firebase deploy --only hosting` dağıtımı tetiklendi. Alan adları başarıyla yayına girdi.

### 4. Otomatik CI/CD Dağıtım Hattı
*   `.github/workflows/deploy-gcp.yml` boru hattı güncellenerek, ana depoya (main branch) push yapıldığında Google Cloud Platform üzerinde otomatik imaj derleme, GCP Artifact Registry tescili ve Cloud Run servislerinin güncel imajlarla otomatik dağıtılması sağlandı.

---

## 🛠️ Adım 23 Geliştirme Detayları (Altyapı Optimizasyonu & Caching)

Yüksek trafik ve ölçeklenme ihtiyaçları doğrultusunda veritabanı indeksleri optimize edilmiş, Redis caching katmanı güçlendirilmiş ve AWS ECS Fargate deploy hazırlıkları tamamlanmıştır:

### 1. Veritabanı İndeks Optimizasyonu
*   **Optimizasyon Yapılan Tablolar**: Sık sorgulanan ve filtrelenen `JobCompletion`, `CallTask` (FIFO kuyruğu), `PhoneRevealLog` ve `ServiceProvider` tablolarında kritik alanlar için indeks tanımları (`schema.prisma` şemasına) eklendi.
*   **Yerel DB Senkronizasyonu**: `prisma db push` komutu ile indeksler veritabanına uygulandı ve Prisma Client yeniden üretildi.
*   **Migration Dosyası**: Production geçişleri için `20260607000000_optimize_indexes` adında manuel SQL migration dosyası oluşturuldu.

### 2. Redis Caching Entegrasyonu
*   **Redis Helper**: `RedisService` sınıfına generic `getOrSet<T>` (sarmalayıcı cache metodu) ve regex tabanlı toplu silme yapabilen `invalidatePattern` metotları kazandırıldı.
*   **Kategori Cache**: `AuthService.getCategories` aktif kategorileri 1 saat (`3600s`) süreyle Redis'e bağlandı.
*   **Profil & Sağlık Skoru Cache**: `HizmetverenService.getProfile` (hesaplama maliyeti yüksek olan `calculateProviderHealthScore` dahil) 10 dakika (`600s`) süreyle cache'lendi.

### 3. Akıllı Cache Invalidation
*   Usta profil/evrak güncellemelerinde (`updateProfile`, `updateDocuments`), NPS anket yanıtı alındığında (`recordNpsResponse`) ve yönetici ban/onay/ret durumlarında (`banUser`, `approveProvider`, `rejectProvider`, `resolveDispute`) usta profil cache'lerinin otomatik temizlenmesi sağlandı.

### 4. AWS ECS Fargate & Pipeline Hazırlıkları
*   **Konteyner Sağlık Kontrolü**: `ecs-task-def.json` dosyasına, `/api/health` rotasını node http modülüyle sorgulayan container `healthCheck` bloğu eklendi.
*   **Secrets Manager**: DB url, Redis url ve Gemini API key gibi hassas verilerin Fargate konteynerlerine parameter store referansıyla enjekte edilmesi için `secrets` tanımları eklendi.
*   **CI/CD Pipeline**: Ana repoya push yapıldığında AWS ECS'e imaj derleyip pushlayacak ve servisi güncelleyecek `.github/workflows/deploy-aws.yml` pipeline workflow'u oluşturuldu.

### 5. E2E Test Doğrulaması
*   Yazılan `test-caching-e2e.ts` entegrasyon testi ile caching get/set, default TTL ve güncelleme anında cache invalidation süreçleri koşturuldu ve **100% başarıyla** tamamlandı.

## 🛠️ Adım 24 Geliştirme Detayları (Canlı Dış Servis Entegrasyonları & Altyapı Hazırlıkları)

Esnaaf platformunun canlı (production) ortama geçiş hazırlıkları kapsamında dış servis entegrasyonları için gerekli çevre değişkeni altyapısı ve AWS ECS secrets konfigürasyonları yapılmıştır:

### 1. Canlı iyzico Entegrasyonu Hazırlığı
*   `IyzicoService` (`iyzico.service.ts`) üzerinde üretim ortamı (`NODE_ENV === 'production'`) ve `IYZICO_API_KEY !== 'mock-api-key'` koşulları denetlendi. Bu koşullar sağlandığında sistem otomatik olarak canlı API'lere istek atmaktadır.
*   ECS Task Definition dosyasına `IYZICO_API_KEY`, `IYZICO_SECRET_KEY` ve `IYZICO_BASE_URL` parametreleri SSM Parameter Store üzerinden enjekte edilecek şekilde eklenmiştir.

### 2. Canlı Netgsm SMS Entegrasyonu Hazırlığı
*   `AuthService.sendSms` metodu, `NODE_ENV === 'production'` ve Netgsm kullanıcı kodu/şifresi tanımlı olduğunda doğrudan Netgsm HTTP API üzerinden gerçek SMS gönderimi yapacak şekilde yapılandırılmıştır.
*   ECS Task Definition dosyasına `NETGSM_USERCODE`, `NETGSM_PASSWORD` ve `NETGSM_MSGHEADER` parametreleri SSM Parameter Store gizli değişkenleri olarak tanımlanmıştır.

### 3. Canlı Firebase FCM Entegrasyonu Hazırlığı
*   `BildirimService` (`bildirim.service.ts`) üzerindeki Firebase Admin SDK entegrasyonu, `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL` ve `FCM_PRIVATE_KEY` parametreleri mevcut olduğunda canlı push notification gönderecek şekilde hazırlanmıştır.
*   Firebase özel anahtarındaki (`FCM_PRIVATE_KEY`) kaçış karakterlerinin (`\n`) doğru işlenmesi için dinamik regex parse mantığı doğrulanmıştır.
*   Task Definition dosyasına Firebase parametrelerinin tamamı eklenmiştir.

### 4. Gemini API & Genel Altyapı Hazırlıkları
*   Gemini Active Agent entegrasyonu için gerekli `GEMINI_API_KEY` değişkeni ile birlikte cryptographic ve oturum güvenliği için `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY`, `ENCRYPTION_IV` ve `WS_SECRET` gibi tüm kritik secrets bileşenleri ECS Task Definition (`ecs-task-def.json`) dosyasına işlenmiştir.

---

## 🛠️ Adım 25 Geliştirme Detayları (AI Öğretisi & Akıllı Sohbet)

Esnaaf platformunda canlı sohbet robotunun genel platform sorularına (ücretler, komisyonlar, platformun işleyişi, güvenilirlik vb.) ve il/kategori bazlı usta istatistik taleplerine doğru yanıtlar vermesini sağlamak amacıyla "Yapay Zeka Öğretisi" ve akıllı araç entegrasyonu tamamlanmıştır:

### 1. Genel Bilgi/Platform Soru Algılama Katmanı
*   `ChatService` (`chat.service.ts`) sınıfına regex tabanlı `isGeneralOrInformationalQuery` metodu kazandırılarak, kullanıcının mesajının işlem/talep tabanlı mı yoksa platform hakkında genel bilgi edinmeye yönelik mi olduğu ayırt edildi.
*   İlgili regex kalıpları ücret, komisyon, güvenlik, iletişim, sistem işleyişi ve usta adet sorgularını kapsayacak şekilde yapılandırıldı.

### 2. Kategori Failsafe Bypassı
*   Girilen ilk mesajda kategori kelimesi geçtiğinde Gemini devreye girmeden önce otomatik kategori tespiti yapan "Hybrid Deterministic Category Failsafe" mekanizması, eğer mesaj genel bilgi/sorgulama içeriyorsa bypass edilecek şekilde güncellendi.
*   Bu sayede kullanıcının genel bilgi ve usta sorguları doğrudan Gemini modeline aktarılarak yanıtlanması sağlandı.

### 3. Yapay Zeka Öğretisi & SSS Bilgi Bankası
*   Gemini modelinin `systemInstruction` talimat metni güncellendi:
    *   Platformun ücretsiz olduğu, komisyon alınmadığı, ustaların kimlik ve oda kaydı kontrollerinden geçmiş onaylı kişiler olduğu detaylarıyla AI'a öğretildi.
    *   Genel soruları yanıtladıktan sonra konuşmanın sonuna nazikçe hizmet talebi açma teklifi eklenmesi kurala bağlandı: *"Size bu konuda yardımcı olmak için ücretsiz bir hizmet talebi oluşturup en uygun ustalardan canlı teklifler toplamak ister misiniz?"*

### 4. Dinamik Veritabanı Usta Sorgulaması (`getPlatformStats`)
*   AI'ın şehir ve kategori bazlı usta sayısını sorgulaması için `getPlatformStats` fonksiyonu tool/araç olarak Gemini API şemasına eklendi.
*   `chat.service.ts` içinde tool call yakalanarak, Prisma veritabanındaki aktif/onaylı hizmet veren (`ServiceProvider`) sayısı dinamik olarak sorgulandı (`prisma.serviceProvider.count`) ve usta sayısı kullanıcıya canlı olarak bildirildi.

### 5. Tip Kontrolü ve Doğrulama
*   Backend projesinde tsc check komutu sıfır hatayla çalışmıştır.
*   `test-regex.js` çevrimdışı test betiği yazılarak regex eşleşmeleri test edildi ve doğrulandı.

---

## 🛠️ Adım 26 Geliştirme Detayları (Sadık Müşteri & Doğrudan İş Kartı Sistemi)

- **Esnaaf ID & QR Eşleşmesi:**
  - Alfanümerik 5 haneli benzersiz ID'ler (`User.esnaaf_id`) tescil edilerek tüm mevcut kullanıcılara veri tutarlılığı için kod atandı.
- **Çift Taraflı İzin & Güvenlik:**
  - `FavoriteProvider` modeline `approved` ve `created_by` alanları eklenerek onaylanmış usta-müşteri ilişkisi kuruldu.
- **Doğrudan Teklif & İş İlanı:**
  - Usta panelinden doğrudan iş kartı oluşturma modalı ve müşteri panelinde favori ustalara özel talep açma akışı tamamlandı.

## 🛠️ Adım 27 Geliştirme Detayları (Tekli "Açık Kapı" Komisyon Modeli)

- **Komisyonsuz Geçiş:**
  - Ustanın kendi müşterisiyle iş tamamladığında kazandığı `open_door_right` hakkı, ilk havuz işinde %0 komisyon uygulayarak hakkı sıfırlar.
- **Yatay Kart Tasarımı:**
  - "Tamamlanan İşler" sekmesinde komisyon oranları ve tutarları dinamik yansıtılacak şekilde yatay tasarım entegre edildi.

## 🛠️ Adım 28 Geliştirme Detayları (Aylık Toplu Komisyon Tahsilatı)

- **Birikmiş Bakiye Hesaplama:**
  - Ustanın henüz ödemediği komisyon tutarları (`unpaidCommission`) toplanarak bir sonraki ayın 1'i faturalama tarihiyle birlikte usta paneli abonelik sekmesinde gösterildi.

## 🛠️ Adım 29 Geliştirme Detayları (Ses Entegrasyonu)

- **Sesle Anlat (Speech-to-Text):**
  - Müşteri Canlı Sohbet (`ChatScreen.tsx`) ve ana sayfa arama kutusuna anlık ses tanıma (`SpeechRecognition`) entegre edildi. Dinleme sırasında pulse animasyonlu mikrofon ve 5 barlı bouncing "Ses Dalga Efekti" gösterildi.
  - Kullanıcı konuşma esnasında duraklayıp düşündüğünde veya klavyeyle elle düzenlemeye başladığı an dikteyi durdurarak metnin eski haline dönmesini / silinmesini önleyen asenkron koruma mekanizmaları uygulandı.

## 🛠️ Adım 30 Geliştirme Detayları (Dinamik Yönlendirme & Kesiciler)

- **Dinamik Prompt-Switching:**
  - Gemini'ye gönderilen kategori bazlı sistem talimatları modüler hale getirilerek `sector-prompts.config.ts` dosyasına taşındı. Aktif kategoriye göre promptlar dinamik olarak birleştirilip Gemini'ye iletildi.
- **İsim-Telefon Kesicileri (Interceptors):**
  - Kullanıcı konuşurken telefon numarası girdiğinde bunu yakalayan deterministik regex kesicileri eklendi. Böylece yapay zeka döngüye girmeden doğrudan OTP SMS'i tetiklenir.
  - `cleanName` fonksiyonu `tr-TR` locale duyarlı hale getirilerek cümlelerdeki gürültü kelimeleri ("İsmim", "Soyadım") başarıyla elendi ve özet tabloda temiz isimlerin görünmesi sağlandı.
- **Müşteri Paneli Buton Akışı:**
  - Süresi dolmuş işlerde en az 1 teklif varsa `Teklifleri Gör (X)`, `Tek Tekrar Yayınla` ve `İptal Et` butonlarının yan yana gösterilmesi sağlandı. Durum etiketine yeşil renkli "X Teklif Alındı" ibaresi yansıtıldı.

## 🛠️ Adım 31 Geliştirme Detayları (Yeni Abonelik & Teklif Önceliklendirme)

- **Yeni Paket Kuralları ve Komisyonlar:**
  - Tüm paketlerdeki ve ücretsiz üyelerdeki gecikme süreleri kaldırıldı (gecikme 0 dk).
  * 4. teklif slot kilidi tamamen yürürlükten kaldırıldı, herkes serbestçe 4. slot teklifi verebilir.
  * Paket yapıları güncellendi: Ücretsiz (%20 komisyon, 1 aktif kapasite), Basic (5.000 ₺, %10 komisyon, 3 aktif kapasite, VIP rozeti), Standard (10.000 ₺, %7 komisyon, 5 aktif kapasite, VIP rozeti), VIP (20.000 ₺, %5 komisyon, 7 aktif kapasite, VIP rozeti).
- **Müşteri Paneli Dinamik Teklif Sıralama:**
  - Gelen teklifler listelenirken ücretli pakete sahip esnaflar en üstte, ücretsiz esnaflar ise altta listelenecek şekilde sıralama algoritması yazıldı. Gruplar kendi içinde kronolojik sıralanır.
  * Ücretli üyelerin teklif kartlarında "VIP / Onaylı Üye ✔️" rozeti gösterildi.
- **Ücretsiz Üye Kapasite Kilitleri (State A/B):**
  - Ücretsiz esnaflar 1 aktif iş kazandığında backend `getGelenIsler` boş döner. Ön yüzde ise "Gelen Fırsatlar" sekmesinde kilit ekranı (State A) gösterilir. İş bittiğinde kilit kalkar ve canlı fırsat bandı (State B) gösterilir.
  * Teklif gönderildiğinde upsell showAlert bildirimi eklendi.
- **Test ve Canlıya Geçiş:**
  - NestJS backend ve her iki Next.js web arayüzünün build testleri sıfır hatayla doğrulandı, `main` branch'ine pushlanarak GCP Cloud Run üzerinde canlıya alındı. Simülatör testi için Adana konumunda 8 adet deneme esnaf hesabı (`+905550000001` - `+905550000008`) seed edildi.

---

## 🛠️ Adım 32 Geliştirme Detayları (Pasif Panel & Onay Otomasyonu)

- **Backend Yetki & DB Değişiklikleri:**
  * `schema.prisma` veritabanı şemasına `AccountStatus` enumu (`pending_approval`, `active`, `suspended`) ve esnaflar için `account_status` kolonu (varsayılan: `pending_approval`) eklendi.
  * Ustanın aktif/onaylı olmadığını denetleyen ve 403 hata kodu dönen `ActiveAccountGuard` yazıldı; `getGelenIsler`, `createOffer` ve `createMessage` API uçlarına uygulandı.
  * `JwtStrategy` ve `getProfile` geliştirilerek `accountStatus` claim ve veri akışına entegre edildi.
- **Admin Onay Otomasyon Zinciri:**
  * Admin panelinde esnaf onaylandığında durumunun `active` yapılması sağlandı.
  * Durum değiştiği an tetiklenen 4'lü transactional bildirim zinciri oluşturuldu: FCM push bildirimi (`HV-14`), onay SMS'i (`HV-14-SMS`) ve detaylı onay e-postası (`HV-14-EMAIL`).
- **Kayıt Sonrası Yönlendirme & Giriş Alert'ı:**
  * Seeker uygulaması başvuru ekranında kayıt tamamlandığında esnafın ana sayfaya fırlatılması akışı iptal edildi; doğrudan esnaf paneli kök dizinindeki `/?registered=true` adresine yönlendirilmesi sağlandı.
  * Giriş sayfasında `registered` parametresi algılandığında beliren turuncu bilgi paneli eklendi.
- **Kısıtlı Usta Paneli (Pasif Mod):**
  * **Welcoming Modal:** Esnaf pasif hesabı ile ilk defa giriş yaptığında beliren ve platformu tanıtan, kapatılabilir kurumsal Karşılama Modalı eklendi (`is_first_passive_login` ile sadece 1 kez gösterilir).
  * **Sticky Warning Banner:** Panelin en üstünde yer alan ve kullanıcı gezindikçe kaybolmayan sabit turuncu şerit eklendi.
  * **İşlevsel Kesiciler (Aksiyon Blokajı):** Pasif esnaf teklif vermeye veya doğrudan iş oluşturmaya çalıştığında ön yüzde işlem durdurulup uyarı alert'i gösterilmesi sağlandı.
- **Canlı Veritabanı Eşitleme (Migration):**
  * GCP Cloud SQL veritabanı dış ağ yetkilendirmesi güncellenerek `prisma db push` ile canlı veritabanı şeması sorunsuz eşitlendi.
  * Tüm uygulamalar hata vermeden derlendi ve test edildi.

## 🛠️ Adım 33 Geliştirme Detayları (Profil Resmi, Firma Adı, Dinamik Konum & Global Gösterim)

- **Profil Fotoğrafı & Firma Adı:**
  * Profil ayarlarında en üstte dairesel fotoğraf yükleme alanı ve altındaki tetikleyici "Fotoğrafı düzenle" butonu kodlandı.
  * Eklenen/güncellenen profil fotoğrafı, sol sidebar ve sağ üst header avatarlarını anlık olarak senkronize edecek şekilde bağlandı.
  * "Ad Soyad" alanının altına "Firma Adı / Şirket Adı" eklendi ve altına *"Müşterilerin profilinde bu adı görür."* bilgilendirme notu entegre edildi.
- **Dinamik Konum & Hizmet Profili:**
  * Konum tercihlerinde tek il seçilip bu ile ait ilçelerin çoklu checkbox ile seçilmesi sağlandı; konum listesi `/api/ortak/konumlar` üzerinden dinamikleştirildi.
- **Global Avatar Gösterimi (Müşteri Paneli):**
  * Usta profil resmi müşteri uygulaması genelindeki tüm arayüzlerde dinamikleştirildi:
    - **Taleplerim Listesi:** Masaüstü tablo satırlarındaki ve mobil kartlardaki teklif veren esnaf rozetleri usta profil resmi ile değiştirildi.
    - **Favori Esnaflar Listesi:** Favorilere eklenmiş esnaflar listelenirken sollarına dairesel usta profil resimleri eklendi.
    - **Esnaf Arama:** Esnaaf ID ile arama yapıldığında arama sonucunda ustanın profil resmi gösterildi.
    - **İş Teyit & Puanlama:** İş bittiğinde uyuşmazlık teyit kartlarında ve yorum yapma alanlarında dairesel usta profil resmi entegre edildi.
- **Test ve Canlıya Geçiş:**
  * `app-hizmetveren`, `app-musteri` ve `backend-api` derleme testleri sıfır hatayla doğrulandı, `main` branch'ine pushlanarak canlı sunuculara otomatik olarak dağıtıldı.

## 🛠️ Adım 34 Geliştirme Detayları (Hizmet Alan Profil Resmi & Initials Altyapısı)

- **Veritabanı Şeması & Model Değişiklikleri:**
  * `User` tablosuna `profile_photo` string kolonu eklendi ve `prisma db push` komutu ile PostgreSQL veritabanı şeması başarıyla güncellendi.
- **Backend API Geliştirmeleri:**
  * `JwtStrategy` update edilerek, doğrulanan kullanıcı payload'una `profile_photo` claim'i eklendi.
  * `AuthController` ve `AuthService` içine global `PUT /api/ortak/auth/profile/update` endpoint'i yazıldı. Bu endpoint üzerinden müşteri kendi adını, e-posta adresini ve profil fotoğraf URL'sini veritabanına kaydedebilir.
  * `verifyOtp` ve `providerLogin` yanıt nesnelerine kullanıcının güncel `profile_photo` verisi eklendi.
- **Önyüz Hizmet Alan Arayüzü Geliştirmeleri (app-musteri):**
  * `SeekerDashboard.tsx` profil düzenleme (Hesap Ayarları) formunun en üstüne dairesel fotoğraf yükleme bileşeni ve "Fotoğrafı düzenle" aksiyon tetikleyicisi entegre edildi.
  * Seçilen resimleri GCS yüklemesi öncesinde HTML5 Canvas ile sıkıştırarak 800x800 ve 70% JPEG kalitesine indiren `compressImage` yardımcı fonksiyonu yazıldı. Sıkıştırılmış resimlerin presigned URL altyapısıyla güvenli şekilde yüklenmesi sağlandı.
  * Güncellenen profil resmi, tarayıcı yerel depolama (`localStorage: esnaaf_user`) ile anlık eşitlenerek üst bar (header) üzerindeki profil resmiyle anlık senkronize edildi.
- **İsim Baş Harfleri (Initials) Avatar Kuralı:**
  * Kullanıcı profil fotoğrafı yüklemediğinde, ismine göre dinamik initials hesaplama kuralı yazıldı:
    - İsim ve Soyisim varsa (örn. "Ahmet Yılmaz"), baş harflerini alıp avatar yapar (örn. "AY").
    - Sadece tek isim varsa (örn. "yunus"), isminin ilk iki harfini alır (örn. "YU").
    - İsim boşsa fallback olarak "HA" (Hizmet Alan) gösterilir.
- **Derleme Doğrulama:**
  * Tüm uygulamalar sıfır hata ve sıfır TypeScript tipi uyuşmazlığıyla derlendi.

## 🛠️ Adım 35 Geliştirme Detayları (Dinamik Adres Formatı Entegrasyonu)

- **Backend API Geliştirmeleri:**
  * `hizmetveren.service.ts` içerisine `formatFullLocation(formData)` yardımcı fonksiyonu tanımlandı. Bu fonksiyon `form_data` JSON alanındaki `neighborhood`, `district` ve `city` alanlarını sırasıyla `Mahalle, İlçe, İl` biçiminde (örn. `Gürselpaşa Mah, Seyhan, Adana`) birleştirir.
  * Hizmet veren uygulaması tarafından çağrılan 6 API endpoint fonksiyonunun (`getGelenIsler`, `getOffers`, `getWonJobs`, `getCompletedJobs`, `getDisputes`, `getLostAndCancelledJobs`) kullanıcıya döndürdüğü `district` alanı bu yeni dinamik formatlama fonksiyonuyla güncellendi.
- **Hizmet Veren Arayüzü (app-hizmetveren & app-hizmetveren-mobil):**
  * `app-hizmetveren/app/page.tsx` üzerindeki gelen iş fırsatı kartında mükerrer şehir adı gösterimi olmaması için `{job.district}` alanı format-duyarlı hale getirildi (eğer virgül içeriyorsa olduğu gibi render edilir, içermiyorsa ilçe/il birleştirilir).
  * Mobil uygulama `JobCard.tsx` bileşenindeki "Çıkış", "Varış" ve "Konum" parametreleri de aynı şekilde format-duyarlı hale getirildi.
- **Hizmet Alan Arayüzü (app-musteri):**
  * `SeekerDashboard.tsx` dosyasında `formatSeekerLocation` yardımcı fonksiyonu yazıldı. "Tekliflerim" sekmesindeki talep özet chip'lerinde ve talep detay kartlarındaki konum kısımları `Mahalle, İlçe, İl` formatıyla güncellendi.
  * `ChatScreen.tsx` yapay zeka chat penceresinde birikmiş konuşma geçmişi (log) kartlarındaki adres gösterimleri (`Çıkış Konumu` ve genel `Konum`) de mahalle bilgisi varsa bunu en başa ekleyecek şekilde dinamikleştirildi.
- **Derleme Doğrulama:**
  * `app-hizmetveren`, `app-hizmetveren-mobil`, `app-musteri` ve `backend-api` uygulamaları derleme testinden sıfır hatayla geçti.

## 🛠️ Adım 36 Geliştirme Detayları (Canlı Sohbet Giriş Kilidi Düzeltmesi)

- **Kök Neden Tespiti:**
  * Hizmet alan panelinde "+ Yeni Talep Oluştur" butonuna basıldığında sohbet `initialMessage=""` ve `currentStep="greeting"` olarak açılmaktadır.
  * `ChatScreen.tsx` alt footer bileşenindeki `['greeting', 'category_detection'].includes(currentStep)` kontrolü nedeniyle, sohbet karşılamasında herhangi bir buton seçeneği olmamasına rağmen alt alan tamamen kilitleniyor ve *"Lütfen yukarıdaki seçeneklerden birini belirleyerek devam edin."* uyarısı gösterilerek metin kutusu ve mikrofon gizleniyordu.
- **Çözüm & Yeniden Yapılandırma:**
  * Hatalı statik adım adı kontrolü kaldırıldı; yerine asistanın son mesajında gerçekten seçenek butonları (`options`) bulunup bulunmadığını ve mesaj tipinin serbest metin (`text`/`textarea`) olmadığını denetleyen dinamik kontrol mantığı entegre edildi:
    ```typescript
    const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
    const hasOptions = lastMsg && lastMsg.role === 'assistant' && Array.isArray(lastMsg.options) && lastMsg.options.length > 0;
    const isTextInputType = lastMsg && (lastMsg.inputType === 'text' || lastMsg.inputType === 'textarea');
    return hasOptions && !isTextInputType;
    ```
  * Bu sayede "Size bugün hangi konuda yardımcı olabilirim?" karşılama mesajında metin yazma kutusu, mikrofon butonu ve gönder düğmesi aktif hale geldi.
- **Derleme Doğrulama:**
  * `app-musteri` uygulaması sıfır hatayla derlendi.

## 🛠️ Adım 37 Geliştirme Detayları (Müsaitlik Otomatik Pasife Geçiş Düzeltmesi & Limit Artırımı)

- **Kök Neden Tespiti:**
  * Hizmet veren panelden durumunu "AKTİF YAP" düğmesiyle açtığında veya yeni bir teklif sunduğunda `unanswered_lead_count` sıfırlanıyordu ancak geçmişte yanıtlanmamış eski `ResponseTime` kayıtlarının `unanswered_processed` bayrağı `false` kalıyordu.
  * Her dakika çalışan `@Cron(CronExpression.EVERY_MINUTE) checkUnansweredLeads` cron fonksiyonu bu birikmiş geçmiş bildirimleri tekrar işleyip sayacı hemen 5/10 seviyesine çıkararak hesabı anında yeniden "PASİF" moda düşürüyordu.
- **Çözüm & Limit Güncellemesi:**
  * `updateAvailability` ve `createOffer` metodlarında usta aktif konuma geçtiğinde veya teklif verdiğinde geçmişteki tüm işlenmemiş `ResponseTime` kayıtları `unanswered_processed = true` olarak güncellenerek geçmiş birikmeler temizlendi.
  * Teklif verme anında `is_available = true` ve `unanswered_lead_count = 0` güncellemeleri entegre edilip Redis profil önbelleği temizlendi.
  * Tüm abonelik paketlerinde (Ücretsiz, Basic, Standard, VIP) cevapsız kalma pasiflik limiti **10** ilana sabitlendi.
  * Veritabanındaki tüm birikmiş geçmiş kayıtlar temizlenerek ustaların profilleri yeniden aktif hale getirildi.
- **Derleme Doğrulama:**
  * `backend-api` NestJS uygulaması derleme testinden sıfır hatayla geçti.











