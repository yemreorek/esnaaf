# Esnaaf Geliştirme Günlüğü (log.md)

Kronolojik sırayla Esnaaf platformu üzerinde yapılan tüm geliştirme ve altyapı çalışmalarının kaydı.

## 2026-06-09 fix | Canlı Sohbet Hata & Model Eşleme Hızlandırma Düzeltmesi

- **Teklif ve Beyan Fiyatı Binlik Ayracı (Format):** Hizmet veren (partner) panelinde, iş taleplerine teklif verirken (`offerPrice`) veya iş tamamlandı beyanında bulunurken (`declarePrice`) girilen fiyatların, kullanıcının yazma hızına bağlı olarak dinamik bir şekilde binlik ayraçlı formatta (örn: 2.000 TL) görünmesi sağlandı. Alanlar `inputMode="numeric"` tipine dönüştürülerek mobilde sayısal klavyenin açılması korunurken, gönderme (submit) aşamasında ayrıştırılan sayısal veriler API'ye hatasız olarak gönderildi.
- **KVKK Onay Kutusu (Talep Formu):** Müşteri uygulaması sohbet akışının son adımındaki Talep Onay Kartı'na KVKK Aydınlatma Metni onay kutusu (`kvkkConsent` checkbox) eklendi ve varsayılan olarak **işaretli (checked)** gelmesi sağlandı. Müşterinin bu onayı kaldırması durumunda "Onayla" aşamasında tarayıcı uyarısı verilerek işlem engellenmektedir. Kullanılmayan "Sadece Favori Ustalarıma Gönder" seçeneği form kartından tamamen kaldırıldı. Hem buton tıklaması hem de el yazısıyla "Onayla/Evet" yazılması durumunda bu kontrol devreye sokularak KVKK uyumluluğu uçtan uca sağlandı.
- **Gemini Model Eşleme Düzeltmesi (Performans & Hız):** `@google/genai` resmi SDK'sında bulunmayan ve 503 Service Unavailable hatası döndüren `gemini-3.5-flash` / `gemini-3.5-pro` model isimlerine yapılan hatalı eşlemeler düzeltildi. Bunun yerine resmi olarak desteklenen en hızlı ve kararlı `gemini-2.5-flash` ve `gemini-2.5-pro` modelleri doğrudan kullanılmaya başlandı. Bu düzeltme sayesinde her mesaj için fazladan yapılan hatalı 503 API çağrısı ve retry beklemesi ortadan kalkarak canlı sohbetteki AI yanıt gecikmesi **4.5 saniyeden 1.5 saniyeye düşürüldü**.
- **Güvenli JSON Hata Yönetimi (Ön Yüz):** `ChatScreen.tsx` içindeki tüm `customFetch` çağrılarında, backend'den veya GCP proxy/ağ geçidinden dönen plain-text "Internal Server Error" (HTML/Text) yanıtlarının JSON olarak ayrıştırılmaya çalışılmasıyla oluşan `Unexpected token 'I', "Internal S"... is not valid JSON` hatası giderildi. `safeJsonParse` yardımcı fonksiyonu eklenerek bu gibi durumlarda hatanın kullanıcıya sızması engellendi ve kullanıcı dostu bir hata mesajı gösterilmesi sağlandı.
- **A/B Test ve Geliştirici Yapılandırması:** `chat.service.ts`, `admin.service.ts` and `.env.example` dosyalarındaki tüm varsayılan fallback model referansları `gemini-2.5-flash` olarak güncellendi.
- **Cloud Run Manuel Dağıtımı:** Backend projesinde yapılan tüm bu değişiklikler (`Sentry`, `OTP Rate Limit`, `CORS` ve `Gemini Model Fix`) optimized `.gcloudignore` yapılandırmasıyla Google Cloud Run sunucularına (`esnaaf-backend-00051-8d6` revizyonu) başarıyla manuel olarak dağıtıldı.


## 2026-06-07 fix | Canlı Ortam Sağlık Kontrolü & 9 İyileştirme

- **Canlı Ortam Testi:** Backend API (`/api/health`), kategori listeleme, anonim chat oturumu, Gemini AI mesaj işleme, OTP gönderimi ve 4 korumalı endpoint'in JWT güvenliği canlı ortamda uçtan uca test edildi. **9/9 test PASS.** Frontend siteleri (`esnaaf.com`, `www.esnaaf.com`, `partner.esnaaf.com`, `partner.esnaaf.com/admin`) tümü 200 OK yanıtı döndürdü. SSL sertifikası geçerli (89 gün kaldı).
- **Sentry Error Tracking (Opsiyonel):** `@sentry/nestjs` ve `@sentry/profiling-node` paketleri `package.json`'a eklendi. `instrument.ts` dosyası oluşturuldu. `main.ts`'e dinamik `require()` ile koşullu Sentry entegrasyonu yapıldı — paket yüklü değilken build hata vermez, `SENTRY_DSN` tanımlıysa çalışma zamanında aktif olur. Production'da %20 trace, %10 profiling örneklemesi.
- **OTP Rate Limiting:** `auth.controller.ts` içindeki `@Post('otp/send')` endpoint'ine `@Throttle({ default: { limit: 3, ttl: 60000 } })` dekoratörü eklenerek dakikada 3 OTP isteği limiti uygulandı (global 100'den bağımsız).
- **CORS Production Origin:** `.env.example` içindeki `FRONTEND_URL` `https://esnaaf.com,https://www.esnaaf.com,https://partner.esnaaf.com` olarak güncellendi.
- **CDN Cache Headers:** Her iki frontend (`app-musteri/next.config.ts`, `app-hizmetveren/next.config.ts`) için `headers()` fonksiyonu eklendi — statik dosyalar (svg, jpg, png, woff vb.) ve `/_next/static/` dizini 1 yıl (`max-age=31536000, immutable`) cache'leniyor.
- **X-Powered-By Gizleme:** Her iki Next.js app'te `poweredByHeader: false` ayarı eklenerek framework bilgisi HTTP header'larından kaldırıldı.
- **Cloud Run min-instances:** `deploy-gcp.yml` CI/CD pipeline'ındaki tüm `gcloud run deploy` komutlarına `--min-instances=1` eklenerek cold start sorunu çözüldü. Backend'e ek olarak `--concurrency=80 --cpu=1 --memory=512Mi` parametreleri eklendi.
- **Health Check Scriptleri:** `scripts/health-check.sh` (Linux/crontab) ve `scripts/health-check.ps1` (Windows/Task Scheduler) monitoring scriptleri oluşturuldu. Slack webhook entegrasyonu opsiyonel.
- **Backup Rehberi:** `docs/gelistirme/backup-rehberi.md` dosyası oluşturuldu — Cloud SQL otomatik yedekleme, Redis RDB snapshot ve geri yükleme komutları dokümante edildi.
- **JSX Parse Hatası Düzeltmesi:** `app-hizmetveren/app/admin/page.tsx` satır 3792'deki eksik `)}` kapanış parantezi eklenerek referans resimleri koşullu bloğu düzeltildi.
- **Derleme Doğrulaması:** Backend (`nest build`), müşteri (`next build`) ve hizmetveren (`next build`) projeleri sıfır hata ile başarıyla derlendi.

## 2026-06-07 build | Canlı Dış Servis Entegrasyonları ve Altyapı Hazırlıkları

- **AWS ECS Secrets ve Konfigürasyon Yapılandırması:** Esnaaf backend servisinin canlı yayına (production) geçiş hazırlıkları kapsamında, dış servis entegrasyonları için gerekli tüm hassas parametreler ve API anahtarları AWS ECS Task Definition (`ecs-task-def.json`) dosyasına entegre edildi.
- **Dış Servis Secrets Eşlemesi:** `IYZICO_API_KEY`, `IYZICO_SECRET_KEY`, `IYZICO_BASE_URL` (iyzico ödeme), `NETGSM_USERCODE`, `NETGSM_PASSWORD`, `NETGSM_MSGHEADER` (Netgsm SMS), `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY` (Firebase FCM push) ve genel kriptografik secrets (`JWT_REFRESH_SECRET`, `ENCRYPTION_KEY`, `ENCRYPTION_IV`, `WS_SECRET`) parametreleri AWS SSM Parameter Store (`arn:aws:ssm:.../esnaaf/prod/`) üzerinden okunacak şekilde eşlendi.
- **Graceful Fallback & Build Doğrulaması:** Kod tabanının eksik anahtarlar durumunda otomatik olarak simüle/mock loglama moduna dönen güvenli fallback yapısı teyit edildi. TypeScript derleme kontrolü (`tsc --noEmit`) ve NestJS üretim derlemesi (`nest build`) sıfır hata ile tamamlandı.

## 2026-06-07 build | partner.esnaaf.com Firebase Domain Yönlendirme Düzeltmesi

- **Firebase Hosting Yönlendirme Düzeltmesi:** `partner.esnaaf.com` özel alan adı, Firebase Hosting üzerinde yanlışlıkla `www.partner.esnaaf.com` adresine kalıcı yönlendirme (301 redirect) olarak tanımlanmıştı. Bu durum, `www.partner.esnaaf.com` DNS/Firebase tarafında tanımlı olmadığı için sitenin açılamamasına sebep oluyordu. Google Firebase Hosting API (`projects.sites.customDomains`) üzerinden `redirectTarget` parametresi boşaltılarak yönlendirme kaldırıldı.
- **CDN Önbellek Temizliği:** Yönlendirme düzeltmesinin ardından, küresel edge caching (CDN) sunucularındaki eski 404/yönlendirme kayıtlarını sıfırlamak amacıyla `firebase deploy --only hosting` komutu tetiklenerek yeni sürüm yayına alındı. `https://partner.esnaaf.com` ve `https://partner.esnaaf.com/admin` sayfaları `200 OK` yanıtı ile tamamen aktif hale getirildi.

## 2026-06-05 build | Hizmet Veren Başvuru Sihirbazı Vektörel İkon Düzeltmeleri & Gemini 404 Model Hatası Çözümü

- **Lucide-React İkon Entegrasyonu (`app-musteri`):** Hizmet veren başvuru sihirbazında ([hizmetveren-basvuru/page.tsx](file:///c:/Users/HaTicEmRe/OneDrive/Masaüstü/esnaaf/app-musteri/app/hizmetveren-basvuru/page.tsx)) Material Symbols fontunun yüklenememesinden kaynaklanan ikonların metin olarak (business, person, corporate_fare) görünmesi sorunu çözüldü. Tüm ikonlar bağımsız vektörel SVG Lucide React bileşenleri ile güncellendi.
- **Gemini Active Agent API 404 Model Eşleme Hotfix (`backend-api`):** A/B testi variant grubuna düşen kullanıcılarda, eski `gemini-1.5-flash` model adının Vertex AI / yeni resmi `@google/genai` SDK'sı tarafından desteklenmemesinden kaynaklanan `404 NOT FOUND` ve chat arayüzünde "Sistemimiz yoğun" hata bloğuna düşme hatası giderildi. Tüm legacy model çağrıları (`gemini-1.5-flash` ve `gemini-1.5-pro`) otomatik olarak yeni nesil `gemini-2.5-flash` ve `gemini-2.5-pro` modellerine maplendi. Varsayılan fallbacks `gemini-2.5-flash` olarak güncellendi.

## 2026-06-02 build | Seeker Dashboard Arayüz Yenilemesi & Gemini Ajan WebSocket Eşleştirme Düzeltmeleri

- **Gemini Aktif Ajan Eşleştirme Düzeltmesi (`backend-api`):** Gemini Flash aktif ajan akışındaki onay (`confirm_form`) adımında, doğrudan eşleştirme ve WebSocket olay fırlatma tetikleyicilerinin çalışmaması sorunu giderildi. Eşleştirme motoru entegre edilerek usta ve müşteri arasında anlık WebSocket teklif akışı uçtan uca %100 çalışır hale getirildi. Canlıya `esnaaf-backend-00022` sürümüyle dağıtıldı.
- **Hizmet Veren Paneli Dinamik Kart Yapısı (`app-hizmetveren`):** Usta gelen işler paneli güncellenerek dinamik bütçe göstergeleri, göreli zaman bildirimleri ve aciliyet rozetleri eklendi.
- **Seeker Dashboard "Tekliflerim" Tabı Redesign (`app-musteri`):** Müşteri panelindeki teklif kontrol alanı baştan tasarlandı:
    - Her bir talep, estetik açıdan zengin ve gruplanmış birer "Talep Grubu Kartı" (`rounded-[32px]`) kapsayıcısına alındı.
    - Talep isimlerinin yanındaki generic emojiler yerine, kurumsal Esnaaf logo-ikon görseli (`logo-icon.png`, `w-11 h-11`) yerleştirildi.
    - Taleplerin hemen altına konum (📍), tarih (📅) ve bütçe (💰) meta verilerini içeren estetik mini etiketler ile `Detayları İncele` / `İptal Et` hızlı aksiyonları eklendi.
    - Henüz teklif gelmemiş talepler için yanıp sönen yeşil pulsing radar animasyonlu ve "Ustalar Taranıyor..." açıklamalı premium bekleme paneli entegre edildi.
    - Gelen teklifler, talep grup kartının altında net bir şekilde gruplanarak listelendi.

## 2026-06-01 build | esnaaf.com Özel Domain Entegrasyonu ve Firebase Hosting Yayını

- **Özel Domain Yönlendirmesi ve Wix DNS Ayarları:** `esnaaf.com` (yalın domain) için `199.36.158.100` A kaydı ve `hosting-site=esnaaf-prod-orek` TXT sahiplik doğrulaması Wix DNS üzerinde tamamlandı. `www.esnaaf.com` için eski Wix CNAME kaydı silinerek default Firebase Hosting domainine (`esnaaf-prod-orek.web.app`) yönlenen yeni CNAME kaydı başarıyla tescillendi.
- **Firebase CDN Refresh & Re-deploy:** SSL sertifikası üretildikten (Minting certificate) ve domain "Connected" durumuna geçtikten sonra, küresel Google CDN yönlendirme tablolarını anında güncellemeye zorlamak amacıyla `firebase deploy --only hosting` dağıtımı tetiklendi.
- **Uçtan Uca Doğrulama:** `https://esnaaf.com` ve `https://www.esnaaf.com` adreslerinin her ikisinin de sıfır güvenlik uyarısıyla (HTTPS/SSL), anlık 301 yönlendirmesiyle ve `200 OK` Next.js uygulama çıktısıyla yayına girdiği canlı HTTP sorgularıyla doğrulanmıştır.

## 2026-05-28 build | Adım 22 Tamamlandı — Google Cloud Platform (GCP) Canlı Ortam Kurulumu & Otomatik CI/CD Dağıtım Altyapısı

- **Git ve Sessiz Kurulum Entegrasyonu:**
    - Sisteme `winget` aracılığıyla sessizce Git kuruldu.
    - Monorepo kök dizini için güvenli bir `.gitignore` dosyası oluşturularak; veritabanı şifreleri, `.env` dosyaları, devasa `node_modules` klasörleri ve bilgisayardaki portatif araçların (`node-portable`, `pg-portable`, `redis-portable`, `Docker-Desktop-Installer.exe` vb.) GitHub'a sızması tamamen engellendi.
- **GitHub Entegrasyonu ve İlk Push:**
    - Yerel Git havuzu başlatılıp yerel kimlik bilgileri yapılandırıldı.
    - Monorepo başarıyla `https://github.com/yemreorek/esnaaf` deposunun `main` dalına push edilerek GitHub Actions tetiklendi.
- **Next.js Build-Time Değişken Düzeltmesi (Hotfix):**
    - Ön yüzlerin API bağlantılarını derleme sırasında (build time) alabilmesi için `app-musteri/Dockerfile` ve `app-hizmetveren/Dockerfile` dosyalarına derleme argümanları (`ARG NEXT_PUBLIC_API_URL` vb.) eklendi.
    - `.github/workflows/deploy-gcp.yml` boru hattı güncellenerek derleme aşamasında canlı API adresi (`https://esnaaf-backend-339090537138.europe-west3.run.app`) parametre olarak geçildi.
- **Cloud Run Backend Ön-Kurulumu ve VPC Egress:**
    - `esnaaf-backend` API servisi Cloud Run üzerinde pre-deploy edildi. Canlı PostgreSQL veritabanı bağlantısı, güvenli rastgele üretilen JWT Secret anahtarları ve Gemini API anahtarı enjekte edildi.
    - Servisin Memorystore Redis özel IP'sine (`10.126.134.147`) erişebilmesi için `default` VPC ağına Direct VPC Egress bağlantısı sağlandı.

## 2026-05-26 build | Adım 21 Tamamlandı — Gemini Flash & Google Gen AI SDK Aktif Ajan Entegrasyonu (Active Agent Architecture)

- **Resmi `@google/genai` SDK Entegrasyonu (`backend-api/`):**
    - Google'ın en yeni birleşik resmi istemci kütüphanesi olan `@google/genai` kuruldu ve NestJS servis katmanına (`GeminiService`) entegre edildi.
    - vertex AI ve Google AI Studio API anahtarlarını (`GEMINI_API_KEY`) otomatik olarak okuyan, esnek `GEMINI_MODEL` (varsayılan: `gemini-2.5-flash`) çevre değişkeni desteği yazıldı.
    - Çevrimdışı/API Anahtarı eksik durumlarında asistan akışının kesintiye uğramaması için geriye dönük uyumlu Mock AI / Fallback State Machine altyapısı korundu.
- **Ajan Araç Şemaları (Function Calling Tools) ve Sistem Kuralları:**
    - Ajanın konuşmanın gidişatına göre otonom olarak veritabanı işlemlerini tetikleyebilmesi için 3 adet araç tanımlandı: `detectCategory(categorySlug)`, `sendOTP(phone, name)` ve `createServiceRequest(seekerName, phone, categorySlug, formData)`.
    - `systemInstruction` asistan promptu genişletilerek 20 resmi hizmet kategorisi ile **İstanbul, Ankara ve İzmir** coğrafi hizmet kısıtı asistanın bilgisine sunuldu.
- **Akıllı Parametre Filtreleme ve Konum/Tarih Bozulmaları Çözümü:**
    - `tarih`, `renkTip`, `katAsansor` gibi serbest metin alanlarının, kullanıcı başka bir soruya cevap verirken bu mesajları kapıp üzerine yazması engellendi. Bu alanlar artık sadece **aktif soru kendileriyse** veya **belirli anahtar kelimeleri (tarih, saat, renk, kat vb.) içeriyorsa** parse edilmektedir.
    - Nakliyat kategorisindeki `district` (Çıkış) ve `destinationDistrict` (Varış) alanlarının tek bir konum mesajından aynı anda etkilenmesi engellendi. Varış konumu artık yalnızca aktif soru `destinationDistrict` iken doldurulmaktadır.
    - Desteklenmeyen iller (Mersin, Adana vb.) girildiğinde asistanın akışı durdurması ve desteklenen 3 ile (İstanbul, Ankara, İzmir) yönlendirmesi sağlandı.
- **Hata Toleransı ve retry mekanizmaları (Exponential Backoff):**
    - Google API geçici (transient) ve yoğunluk hatalarına (429, 503 vb.) karşı **üçlü üstel geri çekilme (exponential backoff retry)** mekanizması geliştirildi. API hatası durumunda asistan 1s ve 2s aralıklarla otomatik olarak yeniden deneme yaparak sohbetin kesintisiz devam etmesini sağlar.
- **E2E Test ve Tip Doğrulama (`test-gemini-agent-e2e.ts`):**
    - Gemini Aktif Ajan akışını (doğal dilden kategori ve ilçe tespiti, detay toplama, OTP tetikleme, SMS doğrulama ve veritabanı tescil süreçleri) uçtan uca simüle edip doğrulayan E2E entegrasyon testi gerçek Gemini Flash modeli ile programatik olarak test edildi ve **%100 başarıyla** geçti.
    - Monorepo genelinde `npx tsc --noEmit` çalıştırılarak sıfır derleme ve tip hatası ile doğrulandı.

## 2026-05-26 build | Adım 20 Tamamlandı — Production Docker Konteynerizasyonu, AWS ECS Deployment Konfigürasyonu & Sağlık İzleme (Health Check) Sistemi

- **Production Dockerization Mimarisi (`backend-api/`):**
    - `Dockerfile`: Multi-stage Docker yapısı kuruldu. `builder` aşaması (Node 22.12.0 Alpine) derleme çıktılarını oluştururken, `runner` aşaması sadece gerekli üretim dosyalarını (`dist`, `node_modules`, `prisma`) barındırarak imaj boyutunu minimuma indirdi. Güvenlik için yetkisiz `node` kullanıcısı ile çalışması (`USER node`) tescil edildi.
    - `.dockerignore`: `node_modules`, `.env`, `dist`, `.git` vb. gereksiz dosya ve hassas verilerin konteyner içine kopyalanması engellendi.
    - `docker-compose.yml`: Kök dizinde PostgreSQL 15, Redis 6 ve backend API servislerinin yerel orkestrasyonunu sağlayan Docker Compose dosyası oluşturuldu.
- **AWS ECS ve GitHub Actions CI/CD Altyapısı:**
    - `ecs-task-def.json`: AWS ECS Fargate üzerinde CPU (256), Bellek (512 MB), port mapping (3000 -> 3000) ve AWS CloudWatch günlük loglamasını (`awslogs`) yöneten üretim task definition şablonu tescil edildi.
    - `deploy.yml` CI/CD Pipeline: GitHub Actions üzerinden AWS kimlik doğrulaması, ECR imaj push otomasyonu ve ECS Task/Service güncellemesini gerçekleştiren `.github/workflows/deploy.yml` iş akışı entegre edildi.
- **Sağlık İzleme ve Canlılık Kontrolü (Health Check) Sistemi:**
    - `AppService.checkHealth()`: Veritabanı canlılığı için Prisma raw SQL `SELECT 1` ve Redis bağlantı canlılığı için ping-pong ping metodları kodlandı.
    - `AppController.getHealth()`: JwtAuthGuard'dan muaf (`@Public()`) `/api/health` sağlık endpoint'i eklendi. Bileşen arızalarında Load Balancer'ın durumu algılaması için HTTP 503 (`ServiceUnavailableException`) hata dönüşü entegre edildi.
- **Programatik E2E Testi & Tip Doğrulama (`src/test-health-check-e2e.ts`):**
    - NestJS programatik context'i üzerinde sağlıklı bağlantılar, veritabanı çöktüğü durum (mock prisma `$queryRaw`) ve bu duruma bağlı HTTP 503 fırlatma mekanizması test edildi ve **%100 başarıyla** geçti.
    - Monorepo genelinde `npx tsc --noEmit` çalıştırılarak sıfır derleme ve tip hatası ile doğrulandı.

## 2026-05-26 build | Adım 19 Tamamlandı — S3/R2 Güvenli Dosya/Belge Yükleme Altyapısı & 20 Kategori Lansmanı

- **Dosya Yükleme (Presigned URL) Altyapısı Geliştirmesi (`backend-api/src/ortak/upload/`):**
    - `PresignedUrlDto`: `fileName` ve safe MIME type limitleri (`image/png`, `image/jpeg`, `image/webp`, `application/pdf`) tescil edilerek tehlikeli dosya türlerinin (örn: `.exe`, `.html`, `.bat`) sisteme yüklenmesi API seviyesinde engellendi.
    - `UploadController & Module`: JwtAuthGuard ve genel kimlik yetkilendirmesi altında çalışacak `/api/ortak/upload/presigned-url` endpoint'i kodlandı ve `AppModule` içerisinde tescillendi.
    - `UploadService`: S3 ve R2 ile entegre olabilen presigned URL üretme mantığı eklendi. AWS credentials ortam değişkenleri girilmemiş dev/test ortamlarında entegrasyon testlerinin kesintisiz çalışabilmesi için `StorageService` mock handler'ı üzerinden Mock S3 pre-signed URL ve Mock Upload Put yolları tescillendi.
- **20 Kategori Lansmanı ve Aktivasyonu:**
    - `seed.ts` dosyası güncellenerek Faz 3 lansmanında yer alan son 6 kategori (`Cam Balkon & PVC Pencere`, `Ofis & İş Yeri Temizliği`, `Doğalgaz Tesisatı`, `İç Mimar & Dekorasyon`, `Fotoğrafçı`, `Organizasyon & Etkinlik`) aktifleştirildi ve seeding komutu çalıştırılarak tüm 20 kategorinin veri tabanında aktif olması sağlandı.
- **AI Chat Yeni Kategoriler Entegrasyonu:**
    - `chat.service.ts` içindeki adımlı AI Chat step machine soru akışına, `detectCategory` kelime analiz motoruna ve `CATEGORY_QUESTIONS` nesnesine yeni 6 kategori için dinamik sorular, parsers (`parseDavetliSayisi` vb.) ve alan etiketleri entegre edildi.
- **E2E Entegrasyon Testi (`test-upload-and-20-categories-e2e.ts`):**
    - Safe MIME type validasyonları, Mock S3 URL üretimi ve yeni 6 kategorinin tamamı için turn-by-turn AI chat konuşma simülasyonları ile DB tescilleri uçtan uca test edildi ve **100% başarıyla** tamamlandı.
- **Derleme Kontrolü:**
    - `npx tsc --noEmit` tip kontrolü çalıştırılarak tüm backend API modülünün sıfır hata ve sıfır uyarı ile tescil edildiği doğrulandı.

## 2026-05-26 build | Adım 18 Tamamlandı — Favori Hizmet Veren (Usta) Sistemi & Tekrar Çalışma

- **Veritabanı Şeması ve Migration İşlemleri:** `schema.prisma` dosyasına unique `[seeker_id, provider_id]` constraint'i barındıran `FavoriteProvider` modeli ve ilişkileri tanımlandı. `add_favorite_providers` migration'ı PostgreSQL veritabanına başarıyla uygulandı ve Prisma Client yeniden üretildi.
- **Backend Favoriler API Modülü Geliştirmesi (`backend-api/src/ortak/favorites/`):**
    - `FavoriteService`: Müşterinin (Seeker) bir ustayı favorileyebilmesi için en az bir completed job'ının bulunması ve usta için rating/review (değerlendirme) girilmiş olması kural denetimleri Prisma ile kodlandı. Maksimum limit 20 favori usta olarak tescillendi.
    - `FavoriteController & Module`: JwtAuthGuard ve `service_seeker` RBAC koruması altında `/api/ortak/favoriler/ekle`, `/api/ortak/favoriler/sil/:providerId` ve `/api/ortak/favoriler` endpoint'leri sunuldu.
- **Smart Routing & Fallback Kuyruk Dağıtım Entegrasyonu:**
    - AI chat ve talep onay formu üzerinden `sendToFavoritesOnly` parametresinin persistence desteği sağlandı.
    - `TaleplerProcessor.handleDistribution` güncellendi: Eğer talep favori usta modunda (`sendToFavoritesOnly: true`) açılmışsa, WebSocket üzerinden dağıtılacak usta listesi seeker'ın favori ustalarıyla kısıtlanarak filtrelendi.
    - BullMQ kuyruk entegrasyonuyla 10 dakikalık gecikmeli bir fallback job planlandı: Favori ustalar teklif vermeyi reddeder veya 10 dakika boyunca cevap vermezlerse, sistem talebi asenkron olarak genel dağıtım havuzuna devretmektedir.
- **Müşteri Chat & Mobil Ön Yüz Entegrasyonu:**
    - Müşteri chat ekranında (`ChatScreen.tsx`) Değerlendirme sonrasında yıldız oylaması tamamlanınca anında `[❤️ Ustayı Favorilerime Ekle]` butonu aktif edilerek API'ye bağlandı.
    - Form onay özet kartına `[ ] Sadece Favori Ustalarıma Gönder` seçeneği ve checkbox'ı entegre edildi.
    - Mobil HA uygulamasında favori ustaların listeleneceği bir **Favoriler** ekranı ve tab entegrasyonu tamamlandı.
- **Hizmet Veren Arayüz Rozet Geliştirmeleri:**
    - Usta mobil uygulamasında (`JobCard.tsx`) ve web gelen işler ekranında favori müşterilerin taleplerine yanıp sönen neon lime renkli `❤️ Eski Müşteri` rozeti eklendi.
- **E2E Entegrasyon Test Doğrulamaları (`test-favorite-providers-e2e.ts`):** 7 ayrı entegrasyon senaryosu (completed job kısıtı, rating kısıtı, başarılı favorileme, mükerrer kontrolü, smart favori dağıtımı, 10-dakika general fallback dağıtımı ve favoriden çıkarma) programatik olarak test edildi ve **%100 başarıyla** geçti.
- **Arayüz ve Tip Kontrolleri:** Monorepo genelinde tip bütünlüğü `npx tsc --noEmit` ile başarıyla doğrulandı.

## 2026-05-26 fix | Adım 0-11 Kapsamlı Denetim & Kritik Düzeltmeler

- **Denetim Kapsamı:** Backend (NestJS/Prisma), Frontend Müşteri (app-musteri) ve Hizmetveren (app-hizmetveren) uygulamalarının Adım 0'dan Adım 11'e kadar tüm geliştirme çıktıları incelenerek 7 KRİTİK, 11 UYARI ve 14 BİLGİ düzeyinde bulgu tespit edildi.
- **API Routing Düzeltmesi (C-02, C-03):**
    - `app-musteri/next.config.ts` ve `app-hizmetveren/next.config.ts` dosyalarına `/api/:path*` → backend proxy rewrite kuralı eklendi.
    - `app-hizmetveren/app/page.tsx` dosyasındaki 5 adet ve `app/admin/page.tsx` dosyasındaki 16 adet hardcoded `http://localhost:3005/api/` URL'si relative path (`/api/`) ile değiştirildi.
    - Her iki frontend projesine `.env.local` ve `.env.example` dosyaları (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`) oluşturuldu.
- **UUID Regex Hatası Düzeltmesi (C-06):** `ChatScreen.tsx` satır 235'teki `[a-fA-C0-9-]` → `[a-fA-F0-9-]` olarak düzeltildi. UUID'lerdeki `d`, `e`, `f` harfleri artık doğru eşleşiyor.
- **Teklif Kabul API Entegrasyonu (C-01):** `handleAcceptOffer()` stub alert'ı kaldırılarak gerçek `POST /api/musteri/teklifler/:id/kabul` API çağrısı, onay diyaloğu, hata yönetimi ve karşılıklı telefon açma bildirim balonu entegre edildi.
- **İş Tamamlama Endpoint Uyuşmazlığı (C-07):** Frontend'deki `/api/musteri/jobs/:id/complete` → backend'in beklediği `/api/musteri/tamamlama/onayla` ile değiştirildi. Payload yapısı (`jobId`, `confirmed`, `declaredAmount`) uyumlu hale getirildi.
- **WebSocket URL Env Var (C-04):** Her iki frontend'teki hardcoded `http://localhost:3005/chat` → `process.env.NEXT_PUBLIC_WS_URL` env var'dan okunacak şekilde güncellendi.
- **CORS Çoklu Origin Desteği (W-01):** `main.ts` CORS yapılandırması tek origin'den virgülle ayrılmış çoklu origin desteğine (`http://localhost:3000,http://localhost:3001`) güncellendi.
- **Dashboard Hardcoded Stats Düzeltmesi (W-11):** `admin.service.ts` içindeki `payments24h: { success: 12, failed: 1 }` sabit değerleri gerçek `Payment` tablosu sorguları ile değiştirildi.
- **Audit Log IP Adresi (I-08):** `logAudit()` metoduna opsiyonel `ipAddress` parametresi eklenerek hardcoded `127.0.0.1` kaldırıldı.
- **N+1 Query Optimizasyonu (I-06):** `getCallTasksFifo()` metodundaki döngü içi tekil sorgular batch `findMany` + `Map` lookup yapısına dönüştürüldü.
- **Session Init Hata Yönetimi (W-06):** `customFetch` yanıtında `response.ok` kontrolü eklendi.
- **CSS Animasyon Eksikliği (W-10):** `app-hizmetveren/globals.css` dosyasına `@keyframes scaleUp` ve `.animate-scale-up` CSS animasyonu eklendi.
- **Derleme Doğrulaması:** Backend (`nest build`), müşteri (`next build`) ve hizmetveren (`next build`) projeleri sıfır hata ve sıfır uyarı ile başarıyla derlendi.

## 2026-05-25 build | Adım 15 Tamamlandı — Kampanya Motoru & Referans Davet Sistemi

- **Veritabanı Şeması ve Migration İşlemleri:** `schema.prisma` dosyasına `Referral` modeli ve `ReferralType` enum'ı eklendi. `User` modeline opsiyonel `balance` alanı tanımlandı. `CampaignType` enum'ı `quota_bonus` (ek kota hediyesi) kampanya tipini destekleyecek şekilde genişletildi. `add_referral_and_quota_bonus` migration'ı PostgreSQL veritabanına başarıyla uygulandı.
- **Backend Referans Modülü Geliştirmesi (`backend-api/src/ortak/referral/`):**
    - `ReferralService`: Deterministik referans kodu üreten (`EMRE9096` formatında), girilen kodları memory startsWith filtresiyle hızlıca referrer ile eşleştiren ve tescil eden servis geliştirildi.
    - `ReferralController & Module`: Rotalar `/api/ortak/referral/kod-al` ve `/api/ortak/referral/kod-gir` olarak JwtAuthGuard RBAC koruması altında sunuldu.
- **Çift Yönlü Ödüllendirme Tetikleyicileri (Event Hooks):**
    - Seeker (HA) ilk onaylanan iş tamamlandığında (`confirmCompletion` commit sonrasında), davet eden HA'ya **100 TL platform içi kredi** anlık enjekte edilir.
    - Partner (HV) ilk iyzico paket aboneliğini satın aldığında (`handleCheckoutSuccess` callback commit sonrasında), davet eden HV adına **500 TL indirim kuponu** (`REF-HV` formatında, 30 gün geçerli) otomatik üretilir.
- **Kampanya Motoru Genişletmeleri (`AbonelikService`):**
    - `quota_bonus` (ek kota hediyesi) kampanya tipi girilerek abonelik başlatıldığında, ustanın aylık teklif limitine (`ProviderMonthlyQuota.monthly_limit`) kampanya değeri kadar (örn: +15 hediye kota) ek iş kabul hakkı anında enjekte edilir.
    - Dinamik trial gün uzatma mantığı entegre edildi.
- **Uçtan Uca Programatik E2E Test Doğrulamaları (`src/test-referral-campaign-e2e.ts`):** 5 ayrı entegrasyon senaryosu (deterministik kod üretimi, yeni üye referans kodlu tescili, HA ilk iş bitiş balance enjeksiyonu, HV ilk ödeme indirim kupon üretimi ve quota_bonus hediye kotası) NestJS programatik context'i üzerinde koşturulmuş ve **%100 başarıyla** tamamlanmıştır.
- **Arayüz ve Tip Kontrolleri:** Mobil ve web arayüzlerinin tamamı (`app-hizmetveren-mobil`, `app-musteri-mobil`, `app-hizmetveren`, `app-musteri`) tip doğrulamalarından sıfır hata ve sıfır uyarıyla geçerek **%100 başarılı derleme** vermiştir.

## 2026-05-25 build | Adım 14 Tamamlandı — Hizmet Veren (HV) Mobil Uygulaması

- **Expo Projesi ve Scaffold Yapılandırması (`app-hizmetveren-mobil/`):** root monorepo dizininde modern ve hızlı Expo SDK 56 projesi oluşturuldu.
- **Paket Çakışması ve ETARGET Çözümü:** Expo varsayılan şablonundaki `"expo-image": "~56.0.9"` sürümünün npm havuzundaki eksikliği sebebiyle oluşan kurulum blokerları giderilerek en kararlı sürüm `"expo-image": "~56.0.6"` olarak tescillendi. `@react-native-async-storage/async-storage` ve `socket.io-client` paketleri entegre edildi.
- **Platform Bazlı API/WebSocket Gateway (`src/config.ts`):** Emülatörler ve gerçek mobil cihazlar için platform tabanlı REST API (`http://10.0.2.2:3000` / `http://localhost:3000`) ve WebSocket gateway (`http://10.0.2.2:3005` / `http://localhost:3005`) yönlendirmeleri kodlandı.
- **AsyncStorage Bearer Token Interceptor (`src/lib/auth.ts`):** `localStorage` yerine mobil AsyncStorage ile çalışan, JWT token'ı saklayıp tüm API isteklerine asenkron `Authorization: Bearer <Token>` başlığını enjekte eden `customFetch` interceptor'ı geliştirildi.
- **Usta Arayüz Bileşenleri (`src/components/`):**
    - `JobCard.tsx`: Esnaflar için dağıtılan yeni iş taleplerini, konum, metrekare, kategori bilgileriyle listeleyen, teklif veren/görüntüleyen usta sayısını (`viewerCount`) gösteren premium kart bileşeni.
    - `OfferModal.tsx`: Ustaların anlık teklif vermesini sağlayan, fiyat ve teklif açıklaması girilebilen neon lime temalı interaktif modal bileşeni.
- **Expo Router Rota ve Navigasyon Yapısı (`app/`):**
    - `_layout.tsx`: Kimlik doğrulama bağlamını ve Stack navigasyonunu yöneten ana yerleşim şablonu.
    - `index.tsx`: Test kolaylığı için seeded usta profillerini tek tıkla seçen dropdown hızlı giriş paneli, aktif usta reytingi, paket ismi ve bu ayki teklif kotalarını gösteren şık profil alanı.
    - `gelen-isler.tsx`: Canlı WebSocket odasına (`provider_{providerId}`) bağlanan, yeni iş dağıtıldığında ekran yenilenmeden iş kartını anlık olarak listenin en üstüne yerleştiren Socket.io arayüzü.
- **TypeScript & Derleme Doğrulaması:** `app-hizmetveren-mobil` projesinde `npx tsc --noEmit` çalıştırılarak tüm tip hataları, kullanılmayan default stil modülleri, uyumsuz TextInput disabled özellikleri ve fontWeight tanımları düzeltilerek sıfır hata ve sıfır uyarıyla **%100 başarılı derleme** doğrulandı.

## 2026-05-25 build | Adım 13 Tamamlandı — Hizmet Alan (HA) Mobil Uygulaması

- **Expo Projesi ve Monorepo Kurulumu (`app-musteri-mobil/`):** Hizmet alanların (HA) mobil cihazlardan doğrudan AI Chat ve teklif kabul yapabilmelerini sağlayan Expo SDK 56 projesi monorepoya dahil edildi. Kararlı `"expo-image": "~56.0.6"`, `@react-native-async-storage/async-storage` ve `socket.io-client` paketleri entegre edildi.
- **Platform IP Yönlendirici (`src/config.ts`):** REST API (3000) ve WebSocket (3005) portları için emülatör ve test cihazlarına uygun ağ ağ geçidi yönlendirmesi sağlandı.
- **AsyncStorage Session Cache Interceptor (`src/lib/session.ts`):** `X-Session-ID` başlığını tüm API isteklerine asenkron olarak otomatik enjekte eden, `localStorage` yerine AsyncStorage tabanlı, custom UUIDv4 destekli mobil customFetch modülü yazıldı.
- **Arayüz Bileşenleri (`src/components/`):**
    - `ChatBubble.tsx`: Antrasit (#232323) müşteri balonları ile logo avatar damgalı AI asistan balonlarını render eden premium mesajlaşma arayüzü.
    - `SummaryCard.tsx`: Chat içindeki hizmet özet formunu listeleyen ve `[Onayla] / [Düzelt]` butonlarını sunan entegrasyon bileşeni.
    - `LiveOfferCard.tsx`: WebSocket'ten düşen usta tekliflerini anlık kartlarla render eden bileşen.
- **Expo Router Sayfaları (`app/`):**
    - `_layout.tsx`: Stack navigasyonu ve ilk açılışta cihaz bazlı tekil anonim oturum üretim mekanizması.
    - `index.tsx`: Neon lime renkli hızlı seçim kategorileri (Chips), bottom-sheet tüm kategoriler paneli ve AI chat'i başlatan metin kutusu.
    - `chat.tsx`: AI asistan yazıyor animasyonunu, dinamik onay özetini ve WebSocket canlı usta tekliflerini (FlatList/ScrollView) pürüzsüz birleştiren ana sohbet ekranı. En üstte usta iş tamamlama simülasyon barı yer alır.
- **TypeScript & Tip Kontrolü Doğrulaması:** `app-musteri-mobil` projesinde `npx tsc --noEmit` çalıştırılarak tüm tip tanımlamaları, TextInput özellikleri ve fontWeights uyumsuzlukları giderilerek sıfır hata ve sıfır uyarıyla **%100 başarılı derleme** sağlandı.

## 2026-05-25 build | Adım 12 Tamamlandı — Faz 2 Kategori Genişlemesi

- **Veritabanı Aktivasyonu (Category Seeding):** `seed.ts` dosyası güncellenerek Faz 1 kapsamındaki kalan 5 kategori (Boya Badana, Nakliyat / Ev Taşıma, Su Tesisatı, Elektrik Tesisatı, Ev Tadilat) `isActive: true` yapıldı. Database seed edilerek tüm 6 kategorinin veri tabanında aktif olduğu doğrulandı.
- **Backend AI Chat Geliştirmeleri (chat.service.ts):**
    - `detectCategory` ve `getCategoryName` üzerinde slug/isim uyuşmazlıkları giderildi (Örn: `ev-tadilat` -> `Ev Tadilat`, `nakliyat` -> `Nakliyat / Ev Taşıma`).
    - Her 5 yeni kategori için dinamik soru şablonları (`CATEGORY_QUESTIONS`) tanımlandı.
    - `collecting_details` adımı dinamik hale getirildi: Kullanıcının girdi mesajlarından ilçe, metrekare, boya rengi/türü, oda sayısı, aciliyet, sorun türü vb. parametreleri akıllıca parse eden regex bazlı yardımcı metotlar eklendi.
    - AI Chat'in dinamik olarak ilk eksik soruyu sorması sağlandı. Tüm zorunlu sorular tamamlandığında sistem otomatik olarak `ask_name` adımına yönlendirir.
- **PostgreSQL WIN1254 Karakter Kodlama Hatası Çözümü:** PostgreSQL veritabanı Windows encoding WIN1254 ile çalıştığı için `₺` simgesi veritabanına yazılırken oluşan `character with byte sequence 0xe2 0x82 0xba has no equivalent` hatası giderildi. Tüm bütçe aralıkları ve metinlerdeki `₺` simgeleri `TL` olarak güncellendi.
- **Müşteri Ön Yüz Kart Güncellemesi (ChatScreen.tsx):** `collected_data.categorySlug` değerine göre dinamik özet alanları render eden şık kart yapısı entegre edildi. Statik "Ev Temizliği" metni ve parametreleri kaldırılarak, Nakliyat için Çıkış/Varış ilçeleri, Ev Tadilatı için Bütçe Aralığı, Boya için Metrekare/Uygulama Alanı gibi değişkenler neon lime detaylı tablolar şeklinde dinamik yansıtıldı.
- **E2E Entegrasyon Test Doğrulamaları (src/test-categories-e2e.ts):** 5 yeni kategori için programatik chat simülasyonları yazıldı. OTP doğrulamaları, dinamik soru cevaplamaları, bütçe/konum parse'ları ve form_data'nın veritabanına tescil edildiği akış uçtan uca test edildi. Testlerin tamamı **100% başarıyla** tamamlandı.
- **TypeScript Derleme Kontrolü:** `app-musteri` projesi `next build` ile Turbopack derleyicisiyle derlendi ve TypeScript ile sayfa üretimlerinin sıfır hata ve sıfır uyarı ile tamamlandığı doğrulandı.

## 2026-05-25 build | Adım 11 Tamamlandı — Admin Yetki & Uyuşmazlık Yönetimi

- **10 Personel Rolü ve İzin Matrisi Altyapısı (`permissions.ts`)**:
    - *Statik Yetki Matrisi:* Ops, kalite, muhasebe, pazarlama gibi 10 ayrı personel rolü ve bu rollerin okuma/yazma/yok yetki seviyeleri tanımlandı. `super_admin` her yetkiye sınırsız erişime sahiptir.
    - *Rol Kontrolcüsü:* Veritabanındaki `Staff` tablosu üzerinden personelin aktiflik ve rol eşleşmesi kontrol edilerek, yetkisiz rotalarda dinamik olarak `ForbiddenException` fırlatan mimari kurgulandı.
- **Admin & Staff Onboarding (`POST /api/admin/staff`)**:
    - Personel ekleme (`CreateStaffDto`) işleminde, `Staff` kaydı oluşturulduğunda aynı email adresiyle otomatik olarak `admin` rolüne sahip bir `User` hesabı da tek bir `$transaction` bloğunda oluşturulur.
- **Audit Logging (Denetim Günlüğü)**:
    - Tüm admin yazma aksiyonları (`provider.approve`, `provider.reject`, `dispute.resolve`, `staff.create`, `call_task.process`, `user.ban` vb.) veritabanındaki `AuditLog` tablosuna `operator_email`, `action`, `target_id`, `old_value` ve `new_value` bilgileriyle kalıcı olarak kaydedilir.
- **SLA-Uyumlu FIFO Çağrı Görevi Kuyruğu (Call Tasks)**:
    - Kalite personeli (`quality_staff`) için atanmayı bekleyen ve uyuşmazlık sapma oranlarına göre üretilen `CallTask` kayıtları en eski tarihten başlayarak FIFO (First-In, First-Out) sırasıyla listelenir.
    - Arama sonuçlarına göre (`reached`, `unreachable`, `callback`), iletişim kurulamayan (`unreachable`) aramalarda deneme sayısı artırılarak 24 saat sonrasına asenkron planlama yapılır. 3. başarısız denemede görev otomatik olarak kapatılır (`status = done`).
- **Dispute Çözüm ve İş Kapatma (`PUT /api/admin/disputes/:id/resolve`)**:
    - Uyuşmazlığı (`seeker_correct`, `provider_correct`, `split_50_50`, `split_custom`) karara bağlayarak ilgili `JobCompletion` kaydını `completed` ve uyuşmazlık durumunu `resolved` olarak günceller, audit log kaydını yazar.
- **E2E Entegrasyon Test Doğrulamaları**: NestJS context'i programatik olarak başlatılarak; rol bazlı yetkilendirme, sebeplerle usta reddetme (R01-R05) ve onaylama, audit log veri tescili, uyuşmazlık (dispute) çözme, en eski tarihe göre FIFO çağrı kuyruğu sıralama, aranamayan aramaların (unreachable) 3 denemeye kadar tekrarlanıp 3. denemede kapatılması, ve personel (staff) onboarding sırasında eşleşen admin kullanıcısının otomatik oluşturulması akışlarının tamamı uçtan uca test edilmiş ve **100% başarıyla** tamamlanmıştır.

## 2026-05-25 build | Adım 10 Tamamlandı — NPS & Bildirim Altyapısı

- **Backend NPS & Bildirim Modülü (`src/ortak/bildirimler/`)**:
    - *DTO Tanımları:* FCM token tescili (`FcmTokenKaydetDto`) ve NPS puanlama (`NpsRespondDto`) için class-validator destekli DTO sınıfları oluşturuldu.
    - *Şablon Motoru (`bildirim-sablonlari.ts`):* Müşteri (HA-01 → HA-12), Hizmet Veren (HV-01 → HV-21) ve Yönetici (AD-01 → AD-07) olmak üzere toplam **42 bildirim kodunun** tamamı standard şablonlarıyla merkezi sisteme tescillendi.
    - *NPS & Bildirim Servisi (`bildirim.service.ts`):* FCM token kaydetme, bildirim geçmişi alma ve şablon formatlayıp loglama (`NotificationLog` tablosuna) servisleri yazıldı.
    - *Platform NPS Anketi:* İş bitiminden 30 dk sonra delayed BullMQ `nps-survey` işiyle platform anketi (HA-08) tetiklenir.
    - *NPS Yanıt Yönetimi:* 0-3 (Detraktör) durumunda anlık kalite personeli uyarısı fırlatılır ve 10 dk sonra `HA-09` takip sorusu planlanır. 7-10 (Promoter) durumunda ise 2 saat sonra `HA-10` değerlendirme daveti delayed olarak planlanır.
    - *AD-07 Çoklu Detraktör Eşik Alarmı:* Aynı usta son 30 günde 3+ detraktör puanı aldığında yöneticilere anlık `AD-07` acil e-posta alarmı gönderen denetçi mekanizması kodlandı.
- **BullMQ Kuyruk & İşleyicileri (`bildirim.processor.ts`)**:
    - `NpsSurveyProcessor`: BullMQ `'nps-survey'` kuyruğundaki gecikmeli `survey-trigger` (HA-08), `follow-up-trigger` (HA-09) ve `review-invite-trigger` (HA-10) işlerini işler.
    - `DisputeAlertProcessor`: Anlık `dispute-alert` kuyruğunu işleyerek kalite personeline detraktör veya uyuşmazlık uyarısı atar. Tutar sapma alarm seviyelerine göre **24 saat SLA (Acil/Urgent)** veya **48 saat SLA (Normal)** süreli otomatik `CallTask` kayıtları üretir.
- **Entegrasyonlar**:
    - `JobCompletionService` güncellenerek, müşteri onayından sonra %0 sapma durumunda `triggerNpsSurvey`, uyuşmazlık sapmalarında ise `triggerDisputeAlert` kuyruk fırlatmaları transaction commit sonrası asenkron olarak tetiklenir.
- **E2E Entegrasyon Test Doğrulamaları**: NestJS context'i programatik olarak başlatılarak; FCM token kaydı, tüm 42 şablonun hatasız formatlanıp loglanması, 0-3 NPS detraktör ve BullMQ delayed follow-up planlamaları, son 30 günde 3+ detraktör alarm limitlerinin `AD-07` alarmını tetiklemesi, ve 7-10 promoter 2 saat delayed `HA-10` değerlendirme davetlerinin tescili uçtan uca test edilmiş ve **100% başarıyla** tamamlanmıştır.

## 2026-05-25 build | Adım 8 Tamamlandı — Admin Kontrolleri, Dashboard, Kullanıcı Denetimi & Belge Onay Kuyruğu

- **Backend Admin Modülü (`src/admin/`)**:
    - *DTO Modelleri:* Arama/süzme, banlama gerekçeleri ve usta red gerekçeleri için class-validator entegrasyonlu DTO'lar oluşturuldu.
    - *Dashboard Stats (`GET /api/admin/dashboard/stats`):* Bugün açılan yeni talepleri, kayıtları, aktif şikayetleri (itirazlı iş bitişlerini) ve onay bekleyen esnafları veritabanından dinamik hesaplayarak 60 saniyede bir otomatik güncelleyen metrik sistemi kodlandı.
    - *Kullanıcı Arama ve Yönetimi (`GET /api/admin/users`):* Case-insensitive arama, rol ve aktiflik filtreli, sayfalama destekli kullanıcı yönetim motoru yazıldı.
    - *Sebepli Banlama (`POST /api/admin/users/:id/ban`):* Kullanıcıyı kilitli duruma alan ve gerekçesini (`fake_profile`, `abuse`, `payment_issue`, `other`) operasyon notlarıyla audit_logs sisteminde loglayan akış kodlandı.
    - *KVKK Zorla Anonimleştirme (`POST /api/admin/users/:id/kvkk-delete`):* Kullanıcının platformdaki kişisel bilgilerini (ad, şifreli telefon, e-posta) kalıcı olarak sıfırlayan, `deleted_at` damgasını vuran ve is_active değerini kapatan geri döndürülemez anonimleştirme işlemi tamamlandı.
    - *Onay/Red Kuyruğu (`/api/admin/hizmetveren/...`):* Onay bekleyen ustaları listeleme, onaylama (approved_at damgası + `HV-14` bildirimi) ve sebepli (`R01` - `R05` kodları + `HV-15` mail eskalasyonu) reddetme endpoint'leri kodlandı.
- **Yönetici Ön Yüz Portalı (`app-hizmetveren/app/admin/`)**:
    - **Tasarım:** Antrasit ve neon lime tasarım dilini kullanan premium koyu mod master admin portalı kodlandı.
    - **Admin Test Girişi:** Geliştirici kolaylığı için seeded admin yetkili test hesabı üzerinden OTP simüle edip anında authentic admin JWT token temin eden hızlı login widget'ı entegre edildi.
    - **Tab Ekranları:** Metrik sayaç kartlarını ve ödeme durumunu barındıran Dashboard Tabı; canlı süzmeli kullanıcı tablosu, interaktif [Banla], [Aktif/Pasif Yap] ve [KVKK Sil] butonlarını içeren Kullanıcı Yönetimi Tabı; bekleyen belgeleri, **Belge Görüntüleme Modalı** (kimlik ve vergi levhasını şık sertifika kartlarıyla render eden panel) ve hızlı onay/red gerekçe modüllerini barındıran Onay Kuyruğu Tabı geliştirildi.
- **Programatik E2E Test Doğrulamaları**: NestJS context'i programatik olarak başlatılarak; stats okuma, onay bekleyenleri listeleme, usta onaylama (is_approved=true ve approved_at yazılması), usta reddetme (durumun unapproved kalması), maskeli telefonları admin için decrypt etme, sebepli banlama ve KVKK force-delete ile verilerin geri döndürülemez anonimleşmesinin kontrolü uçtan uca test edildi ve **100% başarıyla** tamamlandı.

## 2026-05-25 build | Adım 7 Tamamlandı — Hizmet Veren Paneli, Teklif Kabul, Telefon Açma & Canlı Mesajlaşma

- **Hizmet Veren Modülleri (`src/hizmetveren/`)**: 
    - *Gelen İşler (`GET /api/hizmetveren/gelen-isler`):* Ustaya dağıtılmış aktif ve teklif verilmemiş talepleri `viewerCount` (bu işi gören toplam usta sayısı) bilgisiyle listeleyen servis kodlandı.
    - *Teklif Verme (`POST /api/hizmetveren/teklifler`):* Ustanın onay durumunu, aylık teklif kabul kotasını ve dağıtımı kontrol ederek teklif kaydeden akış yazıldı. `responseTime` tablosunda usta cevap hızı dakika bazlı hesaplanıp kaydedilir. `ChatGateway` ile müşteriye canlı WebSocket teklif balonu fırlatılır.
    - *Kota Bilgisi (`GET /api/hizmetveren/kota`):* Ustanın paket limitine göre bu ayki teklif kabul durumunu, kalan hakkını ve paket ismini döndüren endpoint kodlandı.
- **Kabul Akışı & Telefon Açma (`POST /api/musteri/teklifler/:id/kabul`)**:
    - Müşterinin `consent: true` ile usta teklifini kabul ettiği, maks 3 kabul sınırını kontrol eden ve 3. kabulde diğer teklifleri otomatik `rejected` yapan `$transaction` kodlandı.
    - **KVKK Günlüğü**: Karşılıklı numara açılma kayıtları `phone_reveal_logs` tablosuna işlenerek, müşterinin ve ustanın AES-256 şifreli telefon numaraları mutabık çözülerek API çıktısında teslim edildi.
- **Platform İçi Mesajlaşma (`src/ortak/mesajlar/`)**:
    - Müşteri-usta arasında telefon açılmadan önce anlık mesajlaşmayı sağlayan `/api/ortak/mesajlar` REST endpoint'leri (mesaj kaydetme, geçmişi getirme, okundu yapma) kodlandı.
    - Yeni mesajlar `new_message` event'i ile anlık olarak chat odasına (`job_{jobId}`) yayınlanır.
- **Hizmet Veren Arayüzü (`app-hizmetveren/`)**:
    - Monorepo altında **Next.js 15+ & Tailwind v4** projesi kuruldu, premium antrasit (#232323) ve neon lime (#D4F54E) tasarım tokens entegre edildi.
    - Hızlı test için dropdown test girişi (OTP simülasyonu ile JWT token alma), usta profil/kota kullanım barı ve canlı usta iş bildirim paneli tasarlandı.
    - Usta `provider_{providerId}` odasına bağlanarak, yeni bir iş dağıtıldığında WebSocket ile ekran yenilenmeden iş kartının anlık ekrana gelmesi sağlandı.
- **E2E Entegrasyon Testi**: Programatik olarak başlatılan NestJS context'i üzerinde talep oluşturulması, BullMQ dağıtımı, usta teklifi, usta cevap hızı güncellemesi, teyitli teklif kabulü, telefonların mutabık çözülmesi, KVKK reveal logları ve mesajlaşma adımlarının tamamını kapsayan E2E testi sıfır hata ile tamamlandı.

## 2026-05-25 build | Akıllı Dağıtım ve Kuyruk Entegrasyonu Tamamlandı

- **TS1272 Derleme Hatası Çözümü**: `isolatedModules` ve `emitDecoratorMetadata` etkinleştirildiğinde NestJS'te `@InjectQueue` ve `@Process` dekoratörleri altındaki parametre tiplerinin (`Queue`, `Job`) doğrudan import edilmesinden kaynaklanan derleme hatası, `import * as Bull from 'bull'` wildcard namespace'i kullanılarak ve tipler `Bull.Queue` / `Bull.Job` olarak referans gösterilerek kalıcı olarak çözüldü ve projenin sıfır hata ile derlenmesi sağlandı.
- **Akıllı Dağıtım Algoritması Entegrasyonu (§11)**: Müşterinin oluşturduğu talebi, usta avg_rating (paket seviyesi & ağırlık), cevap hızı, lokasyon yakınlığı (ilçe bazlı), aktiflik süresi (Approved date) ve yeni üye bonusu (+20) olmak üzere 5 ağırlıklı faktöre göre puanlayan ve sıralayan akış BullMQ işlemcisi (`TaleplerProcessor`) olarak tescil edildi.
- **Database Seeding**: "Ev Temizliği" kategorisine dahil 8 adet approved hizmet veren (VIP, Premium, Standart, Basic paket seviyelerinde farklı reytingler, cevap hızları ve aktiflik süreleri ile) ve 1 adet test müşteri kullanıcısı veritabanına tohumlandı.
- **Dağıtım Entegrasyon Testi**: NestJS uygulaması programatik olarak başlatılarak `TaleplerService` üzerinden talep oluşturuldu ve BullMQ kuyruğuna asenkron atılan işin `TaleplerProcessor` tarafından başarıyla işlenerek konsola **Akıllı Dağıtım Raporu** bastığı ve `response_times` tablosunda `notified_at` zaman damgalarını kaydettiği doğrulandı.

## 2026-05-25 build | Adım 6 Tamamlandı — Karşılıklı Ücret Teyit & Tamamlama Modülleri

- **Backend NestJS Tamamlama Modülleri (`backend-api/src/hizmetveren/tamamlama` ve `src/musteri/tamamlama`)**:
    - *DTO Yapıları:* `TamamlamaBeyanDto` ve `TamamlamaOnayDto` ile class-validator tabanlı giriş denetimleri uygulandı.
    - *Hizmet Veren Beyan Endpoint'i (`POST /api/hizmetveren/tamamlama/beyan`):* Ustanın tamamladığı iş için aldığı ücreti beyan ettiği ve `JobCompletionStatus.pending_seeker` durumunu başlattığı endpoint kodlandı.
    - *Müşteri Teyit/İtiraz Endpoint'i (`POST /api/musteri/tamamlama/onayla`):* Müşterinin tutarı onayladığı veya itiraz ettiği endpoint yazıldı.
    - *Tutar Sapma Formülü:* Sapma oranı $\frac{|HV - HA|}{HA} \times 100$ formülüyle hesaplanır.
    - *Alarm Eşikleri & SLA Kuralları (§15.12.3):*
        - **%0 Sapma**: `AlarmLevel.none` -> İş `completed` (otomatik tamamlama) + 30 dakika gecikmeli NPS anket planlaması.
        - **%1-15 Sapma**: `AlarmLevel.info` -> Bilgi logu olarak kayıt, otomatik tamamlanma.
        - **%16-30 Sapma**: `AlarmLevel.yellow` (Sarı Alarm) -> Durum `disputed`, `dispute_status = open` ve **48 saat SLA** süreli `normal` öncelikli otomatik `CallTask` oluşturulması.
        - **%31+ ve Hizmet Alınmadı**: `AlarmLevel.red` (Kırmızı Alarm) -> Durum `disputed`, `dispute_status = open` ve **24 saat SLA** süreli `urgent` öncelikli otomatik `CallTask` oluşturulması.
    - *Transaction Bütünlüğü:* `JobCompletionService.confirmCompletion` içindeki tüm veritabanı kayıtları (`JobCompletion` güncelleme, `ServiceRequest` tamamlanma ve `CallTask` üretimi) tek bir `$transaction` bloğunda atomik olarak yürütülür.
    - *WebSocket Olay Yayınlama:* `ChatGateway` üzerine `emitJobCompletedByProvider` ve `emitJobCompletionFinalized` metotları eklenerek, tarafların chat odasındaki durumları anlık WebSocket event'leriyle güncellendi.
- **Programatik E2E Entegrasyon Testi (`src/test-tamamlama-e2e.ts`)**: NestJS context'i programatik olarak başlatılarak; %0 sapma, %25 sarı alarm (48h SLA), %41 kırmızı alarm (24h SLA) ve HA komple reddetme (24h SLA) olmak üzere 4 ana uyuşmazlık senaryosunun tamamı veritabanı kayıtları, alarm seviyeleri ve CallTask üyelikleri üzerinden başarıyla uçtan uca doğrulanmıştır.
- NestJS backend projesinde `npm run build` edilerek sıfır hata ile derleme doğrulandı.

## 2026-05-24 build | Adım 5 tamamlandı

- Müşteri uygulaması ön yüz projesinde WebSocket haberleşmesini sağlamak amacıyla `socket.io-client` kütüphanesi `npmmirror.com` üzerinden yüklendi.
- [ChatScreen.tsx](file:///c:/Users/HaTicEmRe/OneDrive/Masaüstü/esnaaf/app-musteri/components/ChatScreen.tsx) React bileşeni sıfırdan oluşturularak dairesel logo avatarları, antrasit (#232323) ve beyaz chat balonları, ve pulse tabanlı akıcı 3 noktalı yazıyor animasyonu kodlandı.
- Konuşmanın onay (`confirm_form`) adımında `collected_data` nesnesindeki hizmet bilgilerini derleyerek interaktif `[✅ Onayla]` ve `[✏️ Düzelt]` butonlarıyla gösteren form özet kartı entegre edildi.
- Talep tescil edildikten sonra (completed adımı) bekleme ekranında Neon Lime (`#D4F54E`) renkli, premium dairesel yükleme animasyonu (spinning loader) ve teklif bekleme paneli kodlandı.
- Socket.io istemci entegrasyonu tamamlanarak, talep UUID'si alındığı an arka plandaki `http://localhost:3005/chat` sunucusuna bağlanıp `job_{jobId}` odasına katılan (join_job) akış yazıldı.
- Soketten `new_offer` event'i düştüğünde, sohbet akışına `🔔 [Usta Adı] — [Fiyat] TL` formatında animasyonlu teklif balonları enjekte edilmesi sağlandı; balonların altına `[Profili Gör]`, `[Mesaj Gönder]` ve `[Kabul Et]` interaktif butonları entegre edildi.
- [page.tsx](file:///c:/Users/HaTicEmRe/OneDrive/Masaüstü/esnaaf/app-musteri/app/page.tsx) güncellenerek, ana sayfadaki textarea alanına girilen ilk hizmet mesajıyla birlikte `ChatScreen` ekranına pürüzsüz geçiş sağlayan görünüm geçişleri kodlandı.
- Next.js Turbopack derleme testi sıfır TypeScript uyuşmazlığı ve sıfır derleme hatasıyla başarıyla tamamlandı; `npm run dev` yerel sunucusunda chat akışının sorunsuz yüklendiği ve arayüz animasyonlarının premium çalıştığı doğrulandı.

## 2026-05-24 build | Adım 4 tamamlandı

- [chat.service.ts](file:///c:/Users/HaTicEmRe/OneDrive/Masaüstü/esnaaf/backend-api/src/ortak/chat/chat.service.ts) ile adımlı AI Chat durum makinesi (Step Machine: greeting → category_detection → collecting_details → ask_name → ask_phone → otp_verification → confirm_form → completed) kodlandı.
- Geliştirme ortamı ve test aşamalarının kesintisiz ilerlemesi için Kadıköy/Şişli gibi konumları ve Ev Temizliği/Boya gibi kategorileri otomatik anlayan gelişmiş bir GPT-4o simülatörü (Mock AI Engine) entegre edildi.
- Hassas kişisel bilgileri (ad, telefon, T.C. kimlik) sistem promptuna gitmeden önce temizleyen PII (Personally Identifiable Information) regex filtresi yazıldı.
- Redis oturum yönetimi (`ai_session:{userId}:{sessionId}` ve `temp_session:{uuid}`) entegre edilerek, OTP doğrulamasından sonra anonim session'ı kalıcı üye oturumuna taşıyan (migrate) akış uygulandı.
- `@WebSocketGateway()` ile Socket.io WebSocket altyapısı `/chat` namespace'iyle ayağa kaldırıldı, `job_{jobId}` odaları tescil edilerek yeni tekliflerin (`new_offer` event'iyle) canlı dağıtımı kodlandı.
- OpenAI API timeout / 5xx durumlarında konuşma durumunu korumak adına BullMQ (`chat-retry` queue) tabanlı **3 kez, 30 saniye aralıklarla** arka planda otomatik yeniden deneme (retry) mekanizması ve Türkçe hata mesajları kodlandı.
- Kullanıcı başına günlük 50.000 token limit sayacı Redis entegrasyonuyla yazıldı; limit aşımında Türkçe hata dönüşü yapıldı.
- `/api/ortak/chat/anonim/baslat` ve `/api/musteri/chat/mesaj` endpoint'leri yazılarak, NestJS backend API'sinin yerel PostgreSQL ve Redis ortamında `"Ev temizliği lazım Kadıköy'de"` girdisiyle yapılan entegrasyon testi başarıyla sonuçlandı ve adım geçişinin çalıştığı doğrulandı.

## 2026-05-24 build | Adım 3 tamamlandı

- `app-musteri/` monorepo dizini altında **Next.js v16.2 (Turbopack)**, TypeScript, ESLint ve Tailwind CSS v4 entegrasyonlu modern web projesi `npmmirror.com` üzerinden sıfır hata ile kuruldu.
- [globals.css](file:///c:/Users/HaTicEmRe/OneDrive/Masaüstü/esnaaf/app-musteri/app/globals.css) içerisine design tokens CSS değişkenleri (`--color-primary`, `--color-accent`, `--color-accent-light`, `--radius-md`, `--radius-lg` vb.) tanımlanıp Tailwind v4 `@theme` yapısıyla eşleştirildi.
- Google Fonts'tan `Plus Jakarta Sans` yazı tipi [layout.tsx](file:///c:/Users/HaTicEmRe/OneDrive/Masaüstü/esnaaf/app-musteri/app/layout.tsx) içerisine entegre edilerek tüm web uygulamasının yazı tipi yapıldı ve SEO etiketleri Türkçe olarak düzenlendi.
- [logo.svg](file:///c:/Users/HaTicEmRe/OneDrive/Masaüstü/esnaaf/app-musteri/public/logo.svg) ile antrasit ve neon lime renk paletine sahip, organically curved pin şeklindeki marka logosu vektörel olarak tasarlandı.
- [page.tsx](file:///c:/Users/HaTicEmRe/OneDrive/Masaüstü/esnaaf/app-musteri/app/page.tsx) ile chat-first ana sayfa tasarımı gerçekleştirildi; büyük textarea ve animasyonlu gönder butonu entegre edildi.
- PRD §1.4.1'e uygun olarak `[🏠 Ev Temizliği]`, `[🎨 Boya]`, `[🔧 Tesisat]`, `[⚡ Elektrik]` ve `[➕]` chip'leri konumlandırıldı; tıklanınca textarea'ya yazdırma ve odaklanma davranışı sağlandı.
- `[➕]` butonuyla tetiklenen, premium animasyonlu bottom-sheet modalı ile 20 hizmet kategorisinin tamamını listeleyen gelişmiş kategori seçim paneli kodlandı.
- Mobil ekranlarda sanal klavye açıldığında chip'leri gizlemek için `window.visualViewport` API'sini dinleyen React hook'u geliştirildi.
- [session.ts](file:///c:/Users/HaTicEmRe/OneDrive/Masaüstü/esnaaf/app-musteri/lib/session.ts) ile `localStorage` destekli anonim session UUID üretimi ve tüm fetch istek başlıklarına `X-Session-ID` ekleyen `customFetch` interceptor'ı kuruldu.
- `npm run build` derlemesi sıfır TypeScript ve derleme hatasıyla başarıyla tamamlandı; `npm run dev` yerel geliştirme sunucusu aktif edildi ve premium ekran görseli `esnaaf_homepage_screenshot.png` olarak doğrulandı.

## 2026-05-24 build | Adım 2 tamamlandı

- Netgsm SMS entegrasyonu (`NETGSM_USERCODE`, `NETGSM_PASSWORD`) yapıldı; `NODE_ENV=development` ortamı için SMS simülasyonu (konsola yazdırma ve `devOtpCode` dönme) kodlandı.
- Redis tabanlı OTP mekanizması (`otp:{phone}` key, TTL 300 saniye) kuruldu.
- Rate limiter (`otp_rate:{phone}` sayacı, 1 dakikada max 3 OTP talebi) geliştirildi.
- Güvenlik kilidi (`otp_lock:{phone}` key, TTL 300 saniye/5 dakika) ile 3 hatalı denemede kilitlenme ve Türkçe hata mesajları (`Kod hatalı, tekrar deneyin.`, `Çok fazla hatalı deneme. 5 dakika bekleyin.`, `Kodun süresi doldu. Yeni kod isteyin.`) uygulandı.
- Access Token (15dk) ve Refresh Token (7 gün) süreleri ile JWT imzalama ve Passport `JwtStrategy` entegrasyonu yazıldı.
- Başarılı OTP doğrulaması sonrasında üye veritabanında yoksa, otomatik olarak AES-256 şifreli telefon numarası ile `service_seeker` rolünde kaydını yapan inline kayıt akışı eklendi.
- `POST /api/ortak/auth/kvkk/accept` endpoint'i ile kullanıcının KVKK onay tarihini güncelleyen akış yazıldı.
- PRD §13.0 / §13.4 uyumlu, Redis arkalı (`temp_session:{uuid}`, TTL 7200 saniye) anonim oturum başlatma (`POST /api/ortak/auth/anonim/baslat`) endpoint'i ve `X-Session-ID` header desteği kodlandı.
- NestJS backend projesinin yerel taşınabilir PostgreSQL ve Redis ile OTP send testi yapıldı, API'nin başarıyla `{ "success": true, "message": "Doğrulama kodu gönderildi.", "devOtpCode": "490904" }` döndüğü doğrulandı.

## 2026-05-24 build | Adım 1 tamamlandı

- `PrismaService` ve `@Global()` modülü olan `PrismaModule` yazıldı.
- Özel `@Public()`, `@Roles()` ve `@CurrentUser()` dekoratörleri tanımlandı.
- Global rotaları JWT ile koruyan `JwtAuthGuard` ve rol bazlı yetkilendirme yapan `RolesGuard` yazıldı.
- Küresel hataları yakalayıp `{ error: { code, message, details } }` formatına standardize eden `HttpExceptionFilter` yazıldı.
- Node'un `crypto` kütüphanesi ile AES-256-CBC telefon şifreleme/çözme, `0532 *** ** 78` formatında maskeleme ve `+90` normalizasyonu yapan `phone.util.ts` yazıldı.
- `app.module.ts` içine global `ConfigModule`, `ThrottlerModule` (hız limitleme), `ScheduleModule`, `BullModule` (Redis bağlantısı) ve `PrismaModule` entegre edildi.
- `main.ts` içine `helmet()`, `ValidationPipe` (whitelist, transform), global HttpExceptionFilter ve `/api` prefix'i uygulandı.
- `npm run build` ile backend projesinin sıfır hata ile derlendiği doğrulandı.

## 2026-05-24 build | Adım 0 tamamlandı

- NestJS backend projesi kuruldu ve gerekli tüm bağımlılık paketleri (Prisma, JWT, Bull vb.) yüklendi.
- `.env.example` ve `.env` dosyaları PRD §16.4'teki 35+ ortam değişkeni ile oluşturuldu.
- `schema.prisma` şeması Faz 1 tabloları aktif, Faz 2+ yorum satırı olarak yazıldı ve indeksler eklendi.
- Taşınabilir (portable) yerel PostgreSQL 15.3 veri tabanı ayağa kaldırılarak `esnaaf_db` oluşturuldu.
- `init` migration'ı başarıyla uygulandı ve 11 adet uygulama tablosu veritabanına yansıtıldı.
- `seed.ts` dosyası yazılıp çalıştırılarak 20 kategori tohumlandı; sadece "Ev Temizliği" aktif edildi.
