---
title: Wiki Aktivite Logu
type: log
updated: 2026-05-24
---

# Wiki Aktivite Logu

Kronolojik sırayla wiki üzerinde yapılan tüm değişikliklerin kaydı.

---

## 2026-05-26 build | Adım 20 tamamlandı

- **Production Dockerization Mimarisi**: Minimal boyut ve maksimum güvenlik için multi-stage `Dockerfile` (Builder -> Runner) kurgulandı. Root yetkileri bulunmayan default `node` kullanıcısı ile çalışması (`USER node`) tescil edildi. Kök dizinde PostgreSQL 15, Redis 6 ve backend API servislerinin orkestrasyonu için `docker-compose.yml` yerel yapılandırması tamamlandı.
- **AWS ECS & CI/CD Pipeline Konfigürasyonu**: AWS ECS Fargate üzerinde CPU, bellek, port mapping ve logConfiguration (awslogs) ayarlarını yöneten `ecs-task-def.json` task definition dosyası oluşturuldu. Ana repoya push yapıldığında derlemeyi otomatik tetikleyen, ECR'a push eden ve ECS servisini güncelleyen GitHub Actions pipeline workflow'u (`.github/workflows/deploy.yml`) entegre edildi.
- **Sağlık İzleme (Health Check) Sistemi**: `/api/health` sağlık endpoint'i JwtAuthGuard'dan muaf (`@Public()`) olarak kodlandı. Prisma raw SQL `SELECT 1` ve Redis ping-pong canlılık kontrollerini yapan `AppService` yapısı kuruldu. Herhangi bir bileşen çevrimdışı olduğunda Load Balancer'ın durumu algılaması için HTTP 503 (`ServiceUnavailableException`) hata fırlatması sağlandı.
- **E2E Entegrasyon Test Doğrulamaları**: NestJS context'i programatik başlatılarak sağlıklı durum, DB çökme durumu (mock queryRaw) ve bu durumdaki HTTP 503 fırlatma davranışlarının tamamı `test-health-check-e2e.ts` dosyası ile %100 başarıyla test edilerek onaylandı.

## 2026-05-26 build | Adım 19 tamamlandı

- **Dosya Yükleme (Presigned URL) Altyapısı**: `PresignedUrlDto` DTO validasyonlarıyla sadece güvenli MIME tiplerinin (`image/png`, `image/jpeg`, `image/webp`, `application/pdf`) tescil edilmesine izin veren, tehlikeli dosya türlerini (örn: `.exe`) API düzeyinde engelleyen ve JwtAuthGuard korumalı `/api/ortak/upload/presigned-url` endpoint'i kodlandı.
- **Mock S3 Fallback Desteği**: AWS ortam değişkenleri girilmemiş dev/test ortamlarında entegrasyon testlerinin kesintisiz çalışabilmesi için `StorageService` mock handler'ı üzerinden Mock S3 pre-signed URL ve Mock Upload Put yolları tescillendi.
- **20 Kategori Lansmanı**: `seed.ts` dosyası güncellenerek Faz 3 kapsamında yer alan son 6 kategori (`Cam Balkon & PVC Pencere`, `Ofis & İş Yeri Temizliği`, `Doğalgaz Tesisatı`, `İç Mimar & Dekorasyon`, `Fotoğrafçı`, `Organizasyon & Etkinlik`) aktifleştirildi ve seeding komutu çalıştırılarak tüm 20 kategorinin veri tabanında aktif olması sağlandı.
- **AI Chat Yeni Kategoriler Entegrasyonu**: `chat.service.ts` içindeki adımlı AI Chat step machine soru akışına ve `CATEGORY_QUESTIONS` nesnesine yeni 6 kategori için dinamik sorular, parsers (`parseDavetliSayisi` vb.) ve alan etiketleri entegre edildi.
- **E2E Entegrasyon Testi**: Tüm presigned URL üretme validasyonları ve 6 yeni kategorinin tamamı için turn-by-turn AI chat konuşma/form onay ve DB tescil akışlarını doğrulayan `test-upload-and-20-categories-e2e.ts` E2E testi başarıyla tamamlandı.

## 2026-05-26 build | Adım 18 tamamlandı

- **Veritabanı Modeli & Migration (`FavoriteProvider`)**: `schema.prisma` şemasına seeker_id, provider_id alanlarına unique constraint barındıran `FavoriteProvider` modeli eklenerek veritabanı migration'ı (`add_favorite_providers`) başarıyla koşturuldu.
- **Backend API Modülü (`POST /api/ortak/favoriler/ekle`, `DELETE /api/ortak/favoriler/sil/:providerId`, `GET /api/ortak/favoriler`)**: JwtAuthGuard ve `service_seeker` RBAC koruması altında, tamamlanmış iş ve usta puanlaması kural denetimlerini koşturan favori usta API endpoint'leri ve business logic'i kodlandı.
- **Smart Routing & Fallback Kuyruk Dağıtımı**: Müşteri chat ekranında veya talep oluştururken "Sadece Favori Ustalarıma Gönder" (`sendToFavoritesOnly: true`) seçeneğini aktif ettiğinde, dağıtım anında talebin sadece favori ustaların odalarına yayınlanması ve 10 dakikalık BullMQ fallback gecikmeli job'ı ile yanıt gelmemesi halinde genel usta havuzuna otomatik dağıtılması sağlandı.
- **Müşteri Chat & Mobil Ön Yüz Entegrasyonu**: Puanlama kartı yanına `[❤️ Ustayı Favorilerime Ekle]` butonu, talep özet onayına checkbox entegrasyonu ve mobil HA uygulamasında favoriler tab ekranı tasarlandı.
- **Hizmet Veren Arayüz Rozet Gösterimi**: Usta gelen işler listesinde favori müşterilerin taleplerine neon lime renkli `❤️ Favori Müşteri` rozeti eklendi.
- **E2E Entegrasyon Testi**: Tüm favoriye ekleme kısıtları, mükerrer kontrol, smart routing dağıtımı ve 10-dakikalık general fallback senaryolarının tamamı `test-favorite-providers-e2e.ts` dosyası ile %100 başarıyla test edilerek onaylandı.

## 2026-05-25 build | Adım 6 tamamlandı

- NestJS backend modüler yapısı kuruldu; `src/ortak/job-completion` modülü altındaki service, controller, DTO'lar (`declare-completion`, `confirm-completion`) tescil edilerek `AppModule` içerisine dahil edildi.
- **Hizmet Veren İş Bitirme Beyanı (`POST /api/hizmetveren/jobs/:id/complete`)**: Ustanın işi bitirirken aldığı ücreti beyan ettiği akış ve ilişkili `AcceptedOffer` kontrolleri kodlandı.
- **Hizmet Alan Ücret Teyidi (`POST /api/musteri/jobs/:id/complete`)**: Müşterinin tutarı onayladığı veya itiraz ettiği akış yazıldı.
    - *Sapma Formülü*: Sapma oranı $\frac{|HV - HA|}{HA} \times 100$ formülüyle hesaplanır.
    - *Alarm Eşikleri*: %0 (Normal), %1-15 (Bilgi), %16-30 (Sarı Alarm), %31+ ve Hizmeti almadım durumları (Kırmızı Alarm + `disputed` statüsü + otomatik şikayet eskalasyonu).
- **WebSocket Gateway Entegrasyonu**: `ChatGateway` üzerine `emitJobCompletedByProvider` ve `emitJobCompletionFinalized` metotları eklenerek, chat odasındaki tarafların anlık WebSocket durum güncellemelerini anında alması sağlandı.
- **Geliştirici Test Simülasyonu (`POST /api/ortak/jobs/:id/simulate-provider-complete`)**: Geliştirme ortamında ustanın iş bitirme beyanını, usta, teklif ve kabul edilmiş teklif ilişkilerini otomatik olarak kurup simüle eden bir dev endpoint'i tasarlandı.
- **Müşteri Chat Arayüzü (ChatScreen.tsx)**:
    - **WebSocket Dinleyiciler**: Canlı tamamlandı beyanlarını (`job_completed_by_provider`) ve onay teyitlerini (`job_completion_finalized`) dinleyen anlık Socket.io olay dinleyicileri eklendi.
    - **Premium İş Tamamlama Teyit Kartı**: Ustanın beyan ettiği tutarı gösteren ve **`[✓ Evet, doğru]`** ile **`[✗ Hayır, farklı]`** interaktif butonları içeren, neon lime çerçeveli şık kart tasarımı enjekte edildi.
    - **İtiraz Formu ve İnceleme Paneli**: Tutar itirazı yapıldığında gerçek ödenen tutarın girildiği, uyuşmazlık durumunda ise kırmızı neon detaylı "İnceleme Başlatıldı" uyarı paneli entegre edildi.
    - **Usta Değerlendirme Yıldız Sistemi**: Başarılı eşleşen tamamlamalarda 5 yıldızlı usta puanlama arayüzü enjekte edildi.
    - **DevTools Simülasyon Paneli**: Ekranın en üstünde, iş oluşturulduğu an beliren ve tek tıkla ustanın işi bitirdiği durumları (%0 fark, %20 sarı alarm, %41 kırmızı alarm) simüle eden premium kontrol barı eklendi.
- NestJS backend projesinde `npm run build` edilerek sıfır hata ile derleme doğrulandı.
- Next.js müşteri ön yüz projesinde Turbopack derleyicisiyle `npm run build` edilerek 2.1 saniyede başarıyla statik sayfalar oluşturuldu (0 hata, 0 uyarı).

## 2026-05-24 build | Adım 5 tamamlandı

- Müşteri uygulaması ön yüz projesinde WebSocket haberleşmesini sağlamak amacıyla `socket.io-client` kütüphanesi `npmmirror.com` üzerinden yüklendi.
- [ChatScreen.tsx](file:///c:/Users/HaTicEmRe/OneDrive/Masaüstü/esnaaf/app-musteri/components/ChatScreen.tsx) React bileşeni sıfırdan oluşturularak dairesel logo avatarları, antrasit (#232323) ve beyaz chat balonları, ve pulse tabanlı akıcı 3 noktalı yazıyor animasyonu kodlandı.
- Konuşmanın onay (`confirm_form`) adımında `collected_data` nesnesindeki hizmet bilgilerini derleyerek interaktif `[✅ Onayla]` ve `[✏️ Düzelt]` butonlarıyla gösteren form özet kartı entegre edildi.
- Talep tescil edildikten sonra (completed adımı) bekleme ekranında Neon Lime (`#D4F54E`) renkli, premium dairesel yükleme animasyonu (spinning loader) ve teklif bekleme paneli kodlandı.
- Socket.io istemci entegrasyonu tamamlanarak, talep UUID'si alındığı an arka plandaki `http://localhost:3005/chat` sunucusuna bağlanıp `job_{jobId}` odasına katılan (join_job) akış yazıldı.
- Soketten `new_offer` event'i düşüldüğünde, sohbet akışına `🔔 [Usta Adı] — [Fiyat] TL` formatında animasyonlu teklif balonları enjekte edilmesi sağlandı; balonların altına `[Profili Gör]`, `[Mesaj Gönder]` ve `[Kabul Et]` interaktif butonları entegre edildi.
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

## 2026-05-24 update | Wiki Sayfalarının Doldurulması ve Katalog Oluşturma

- Alt araştırmacı ajanlar (subagents) tarafından ham PRD (`esnaaf-claude.md`) ve modül yetenekleri (`SKILL` dosyaları) taranarak tüm sayfalar detaylıca dolduruldu.
- `index.md` ana kataloğu oluşturuldu ve Obsidian wikilink çapraz bağlantıları yapıldı.
- Wiki iskelet yapısından tamamen doldurulmuş ve birbirine bağlı bir bilgi tabanına (Knowledge Base) dönüştürüldü.

## 2026-05-24 create | Wiki ilk oluşturma — iskelet yapı


- **CLAUDE.md** şemasına göre klasör yapısı oluşturuldu
- `index.md`, `log.md`, `00-Genel-Bakış.md` oluşturuldu
- `01-Modüller/` altında M1–M7 modül sayfaları oluşturuldu
- `02-Roller-Aktörler/` altında HA ve HV sayfaları oluşturuldu
- `03-Akışlar/` altında temel akış sayfaları oluşturuldu
- `04-Kavramlar/` altında domain kavram sayfaları oluşturuldu
- `05-Veritabanı/` altında tablo sayfaları oluşturuldu
- `06-API/` altında endpoint sayfaları oluşturuldu
- `07-Bildirimler/` altında bildirim şablonları oluşturuldu
- `08-Teknoloji/` altında stack sayfaları oluşturuldu
- `09-Güvenlik/` altında güvenlik sayfaları oluşturuldu
- `10-Kategoriler/` altında hizmet kategorileri oluşturuldu
- `11-MVP-Plan/` altında faz sayfaları oluşturuldu
- Kaynak: `esnaaf-claude.md` (PRD), `agents/SKILL*.md`
