# Esnaaf Geliştirme Günlüğü (log.md)
 
Kronolojik sırayla Esnaaf platformu üzerinde yapılan tüm geliştirme ve altyapı çalışmalarının kaydı.

## 2026-07-20 feat | Dinamik Adres Formatı (`Mahalle, İlçe, İl`) Entegrasyonu

- **Backend API Geliştirmeleri:**
  - `hizmetveren.service.ts` içerisine `formatFullLocation(formData)` yardımcı fonksiyonu tanımlandı. Bu fonksiyon `form_data` JSON alanındaki `neighborhood`, `district` ve `city` alanlarını sırasıyla `Mahalle, İlçe, İl` biçiminde (örn. `Gürselpaşa Mah, Seyhan, Adana`) birleştirir.
  - Hizmet veren uygulaması tarafından çağrılan 6 API endpoint fonksiyonunun (`getGelenIsler`, `getOffers`, `getWonJobs`, `getCompletedJobs`, `getDisputes`, `getLostAndCancelledJobs`) kullanıcıya döndürdüğü `district` alanı bu yeni dinamik formatlama fonksiyonuyla güncellendi.
- **Hizmet Veren Arayüzü (app-hizmetveren & app-hizmetveren-mobil):**
  - `app-hizmetveren/app/page.tsx` üzerindeki gelen iş fırsatı kartında mükerrer şehir adı gösterimi olmaması için `{job.district}` alanı format-duyarlı hale getirildi (eğer virgül içeriyorsa olduğu gibi render edilir, içermiyorsa ilçe/il birleştirilir).
  - Mobil uygulama `JobCard.tsx` bileşenindeki "Çıkış", "Varış" ve "Konum" parametreleri de aynı şekilde format-duyarlı hale getirildi.
- **Hizmet Alan Arayüzü (app-musteri):**
  - `SeekerDashboard.tsx` dosyasında `formatSeekerLocation` yardımcı fonksiyonu yazıldı. "Tekliflerim" sekmesindeki talep özet chip'lerinde ve talep detay kartlarındaki konum kısımları `Mahalle, İlçe, İl` formatıyla güncellendi.
  - `ChatScreen.tsx` yapay zeka chat penceresinde birikmiş konuşma geçmişi (log) kartlarındaki adres gösterimleri (`Çıkış Konumu` ve genel `Konum`) de mahalle bilgisi varsa bunu en başa ekleyecek şekilde dinamikleştirildi.
- **Derleme Doğrulama:**
  - `app-hizmetveren`, `app-hizmetveren-mobil`, `app-musteri` ve `backend-api` uygulamaları derleme testinden sıfır hatayla geçti.

## 2026-07-20 feat | Hizmet Alan Profil Fotoğrafı Yükleme, Initials Avatar ve Backend Profil Düzenleme Entegrasyonu

- **Veritabanı Şeması & Model Değişiklikleri:**
  - `User` tablosuna `profile_photo` string kolonu eklendi ve `prisma db push` komutu ile PostgreSQL veritabanı şeması başarıyla güncellendi.
- **Backend API Geliştirmeleri:**
  - `JwtStrategy` update edilerek, doğrulanan kullanıcı payload'una `profile_photo` claim'i eklendi.
  - `AuthController` ve `AuthService` içine global `PUT /api/ortak/auth/profile/update` endpoint'i yazıldı. Bu endpoint üzerinden müşteri kendi adını, e-posta adresini ve profil fotoğraf URL'sini veritabanına kaydedebilir.
  - `verifyOtp` ve `providerLogin` yanıt nesnelerine kullanıcının güncel `profile_photo` verisi eklendi.
- **Önyüz Hizmet Alan Arayüzü Geliştirmeleri (app-musteri):**
  - `SeekerDashboard.tsx` profil düzenleme (Hesap Ayarları) formunun en üstüne dairesel fotoğraf yükleme bileşeni ve "Fotoğrafı düzenle" aksiyon tetikleyicisi entegre edildi.
  - Seçilen resimleri GCS yüklemesi öncesinde HTML5 Canvas ile sıkıştırarak 800x800 ve 70% JPEG kalitesine indiren `compressImage` yardımcı fonksiyonu yazıldı. Sıkıştırılmış resimlerin presigned URL altyapısıyla güvenli şekilde yüklenmesi sağlandı.
  - Güncellenen profil resmi, tarayıcı yerel depolama (`localStorage: esnaaf_user`) ile anlık eşitlenerek üst bar (header) üzerindeki profil resmiyle anlık senkronize edildi.
- **İsim Baş Harfleri (Initials) Avatar Kuralı:**
  - Kullanıcı profil fotoğrafı yüklemediğinde, ismine göre dinamik initials hesaplama kuralı yazıldı:
    - İsim ve Soyisim varsa (örn. "Ahmet Yılmaz"), baş harflerini alıp avatar yapar (örn. "AY").
    - Sadece tek isim varsa (örn. "yunus"), isminin ilk iki harfini alır (örn. "YU").
    - İsim boşsa fallback olarak "HA" (Hizmet Alan) gösterilir.
- **Derleme Doğrulama:**
  - `app-musteri` ve `backend-api` build testleri sıfır hatayla doğrulandı, `main` branch'ine pushlanarak canlı sunuculara otomatik olarak dağıtıldı.

## 2026-07-19 feat | Profil Resmi Yükleme, Firma Adı & Konum Tercihleri ve Global Arayüz Gösterimi

- **Profil Fotoğrafı & Firma Adı:**
  - Hizmet veren profil ekranına dairesel fotoğraf alanı ve tetikleyici "Fotoğrafı düzenle" butonu eklendi. Yüklenen resimlerin sol menü (sidebar) ve üst bar (header) üzerindeki profil resimleriyle anlık senkronize olması sağlandı.
  - "Ad Soyad" alanının altına "Firma Adı / Şirket Adı" giriş alanı eklenerek müşterilerin göreceği adı temsil ettiğine dair açıklayıcı not yerleştirildi.
- **Dinamik İl ve İlçe Konum Tercihleri:**
  - Konum tercihlerinde tek il ve çoklu ilçe seçimi `/api/ortak/konumlar` dinamik endpoint'i üzerinden çekilecek şekilde bağlandı.
- **Global Usta Avatar Gösterimi:**
  - Ustanın profil resmi müşteri paneli genelinde; teklif kartlarında, teklif detay pencerelerinde, favori usta listesinde, Esnaaf ID arama sonuçlarında ve iş teyidi/değerlendirme onay pencerelerinde dairesel görsel formatında dinamik gösterilecek şekilde entegre edildi.
  - `/api/ortak/favoriler` ve `/api/musteri/teklifler` API endpoint'lerinde, veritabanından çekilen usta nesnelerine `profilePhoto` ve `companyName` alanları otomatik parse edilerek enjekte edildi.
- **Derleme ve Dağıtım:**
  - `app-hizmetveren`, `app-musteri` ve `backend-api` build testleri sıfır hatayla doğrulandı, `main` branch'ine pushlanarak otomatik olarak canlıya dağıtıldı.

## 2026-07-08 feat | Hizmet Veren Kayıt Pasif Modu & Admin Onay Otomasyonu & Görsel Yükleme Base64 Sıkıştırması

- **Fotoğraf Yükleme EROFS & Kırık Görsel Çözümü:**
  - Cloud Run'ın durumsuz ve geçici `/tmp` dosya sistemi kısıtlamalarını çözmek için yerel disk yüklemesi kaldırıldı.
  * Müşteri uygulamasında (`app-musteri`) seçilen profil ve çalışma resimlerini HTML5 Canvas kullanarak 800x800 çözünürlüğe ve %70 JPEG kalitesine sıkıştıran `compressImage` aracı geliştirildi. Resimler doğrudan base64 formatında (`data:image/jpeg;base64,...`) veritabanına kaydedildi.
  * NestJS backend-api `main.ts` içinde JSON ve urlencoded istek boyutu limiti **10MB** seviyesine çıkartılarak büyük base64 isteklerinin alınması sağlandı.
- **Veritabanı Hesap Durum Yönetimi:**
  - `schema.prisma` veritabanı şemasına `AccountStatus` enumu (`pending_approval`, `active`, `suspended`) ve esnaflar için `account_status` kolonu eklendi.
  * `prisma db push` komutu ile canlı GCP Cloud SQL veritabanı şeması sorunsuz eşitlendi.
- **Kısıtlı Auth Middleware (Guard):**
  - Pasif durumdaki (`pending_approval`) esnafların canlı ilanları çekmesini, teklif vermesini ve mesaj atmasını engelleyen `ActiveAccountGuard` yazıldı ve ilgili controller uçlarına uygulandı.
  * `JwtStrategy` ve `getProfile` servisleri güncellenerek esnafın onay/pasif durum bilgisi JWT payload ve profil akışına eklendi.
- **Admin Onay Otomasyon Zinciri:**
  - Admin esnafı onayladığı an durumunun `active` yapılması sağlandı.
  * FCM Push Bildirimi (`HV-14`), Onay SMS'i (`HV-14-SMS`) ve Onay E-postası (`HV-14-EMAIL`) otomatik tetiklenen zincir olarak kurgulandı.
- **Kayıt Sonrası Yönlendirme ve Giriş Alert'ı:**
  - Esnaf kaydı bittiğinde ana sayfaya fırlatılma akışı iptal edildi; esnaf panelinin kök dizinine (`/?registered=true`) yönlendirildi.
  * Giriş sayfasında `registered` parametresini algılayıp gösteren turuncu bilgi paneli eklendi.
- **Hizmet Veren Paneli Pasif Mod Geliştirmeleri:**
  - **Component A (Karşılama Modalı):** Pasif esnafın ilk girişinde açılan ve kısıtlamaları/paneli gezip öğrenebileceğini bildiren kurumsal Karşılama Modalı eklendi (`is_first_passive_login` flag ile sadece 1 kez açılır).
  - **Component B (Sabit Durum Şeridi):** Panelde gezinirken kaybolmayan sabit turuncu uyarı şeridi eklendi.
  - **Component C (İşlevsel Kısıtlamalar):** Pasif esnaf teklif vermeye veya doğrudan iş kartı oluşturmaya çalıştığında işlem ön yüzde kesilerek uyarı fırlatılması sağlandı.
- **Derleme ve Canlıya Geçiş:**
  - NestJS backend ve her iki Next.js web arayüzünün build testleri sıfır hatayla doğrulandı, `main` branch'ine pushlanarak GCP Cloud Run üzerinde canlıya alındı.

## 2026-07-03 feat | Canlı Sohbet Dinamik Yönlendirme & Güvenli İsim/Telefon Kesicileri & Müşteri Paneli Buton Revizyonu
 
- **Tek Ajan + Dinamik Yönlendirme (Prompt-Switching) Mimarı:**
  - `chat.service.ts` dosyasındaki devasa statik kategori uzmanlık yönergeleri kaldırıldı ve yeni oluşturulan [sector-prompts.config.ts](file:///c:/Users/HaTicEmRe/OneDrive/Masaüstü/esnaaf/backend-api/src/ortak/chat/sector-prompts.config.ts) dosyasına taşındı.
  - Gemini çağrısı öncesinde tespit edilen aktif kategori slug'ına göre ilgili sektör SOP/yönergesi dinamik olarak yüklenip `systemInstruction` ile birleştirilecek şekilde dinamik prompt motoru entegre edildi.
  - Sektör tespiti yapılmadığı durumlarda, genel bilgi/SSS tespiti ve kategori belirlemeye yönelik dinamik kılavuz devreye alındı.
- **Güvenli İsim/Telefon Kesicileri (Interceptors) ve Gelişmiş Türkçe İsim Temizleyici:**
  - Kullanıcı isim ve telefon adımlarında numarasını yazdığında veya iki bilgiyi beraber girdiğinde (Örn: *"Ben Hakan, numaram 508555..."*), backend tarafında regex ile telefon yakalanıp otomatik OTP doğrulamasına geçilmesi ve SMS gönderilmesi sağlandı. Bu sayede Gemini'ın numara formatı nedeniyle şaşırması/döngüye girmesi engellendi.
  - `cleanName` metodu tamamen Türkçe karakter setine (`tr-TR` locale) duyarlı hale getirildi. Cümle içindeki tüm giriş kalıpları (`benim`, `ben`, `ismim`, `adım`, `adı`) ve soyad kalıpları (`soyadım`, `soyadı`, `soyisim`) elenerek isim-soyadın talep özetinde düzgün (Örn: `Hakan Tarlan`) listelenmesi garanti altına alındı.
- **Müşteri Paneli Süresi Dolan İşlerde Üçlü Buton Akışı & Etiket İyileştirmesi:**
  - Süresi dolmuş aktif iş kartlarında eğer en az 1 teklif varsa, sadece "Tekrar Yayınla" butonu yerine yan yana **`Teklifleri Gör (X)`**, **`Tekrar Yayınla`** ve **`İptal Et`** butonları listelenmeye başlandı. Böylece kullanıcının teklifleri görmeden kazayla tekrar yayınlaması engellendi.
  - Süresi dolan iş kartında teklif varsa kırmızı renkli `TEKLİFE KAPATILDI (SÜRE DOLANLAR)` etiketi yerine, yeşil renkli **`X Teklif Alındı`** etiketi gösterildi. Teklif yoksa eski kırmızı etiket korundu.
- **Derleme & Entegrasyon Testleri:**
  - `backend-api` NestJS derlemesi ve `app-musteri` Next.js derlemesi sıfır hata ile tamamlandı.
  - `test-gemini-agent-e2e.ts` entegrasyon testlerinin tamamı başarıyla yeşil sonuçlandı ve kodlar `main` branch'ine pushlanarak otomatik olarak canlıya dağıtıldı.
 
## 2026-07-02 feat | Canlı Sohbet AI Sohbet Modülüne Ses Entegrasyonu (Speech-to-Text)

- **Ses Kaydı / Speech-to-Text (`ChatScreen.tsx` & `page.tsx`):**
  - Chat mesaj yazma barının sağ tarafına, gönder butonunun yanına entegre **Mikrofon** butonu eklendi.
  - Mikrofon aktif olduğunda seslerin gerçek zamanlı metne dönüştürülmesi sağlandı ve mikrofonun yanına **bouncing animasyonlu 5 barlı "Ses Dalga Göstergesi"** eklenerek dinleme yapıldığı görselleştirildi.
  - **Duraklama ve Düşünme Düzeltmesi:** Konuşma esnasında kullanıcının duraklayıp düşünmesi durumunda, önceki konuşulan cümlelerin silinmesi/üzerine yazılması sorunu giderildi. SpeechRecognition döngüsü `event.resultIndex` yerine `0` başlangıç indeksiyle çalıştırılarak tüm kayıt oturumu boyunca ses geçmişinin kümülatif olarak biriktirilmesi sağlandı.
  - **Mesaj Gönderiminde Ses Geçmişini Sıfırlama (Speech Reset on Send):** Kullanıcı mesajı gönderdiğinde (veya Enter'a bastığında) SpeechRecognition otomatik olarak durdurulup `baseTextRef` sıfırlanacak şekilde yapılandırıldı.
  - **Asenkron Yarış Durumu (Race Condition) Çözümü:** `isListeningRef` referans değişkeni eklenerek SpeechRecognition asenkron çalışma akışındaki yarış durumu (race condition) çözüldü. Mesaj gönderildiğinde veya klavyeyle düzenleme yapıldığında mikrofon kapatılırken, tarayıcının asenkron olarak sonradan tetiklediği `onresult` olayının input alanını temizlenmiş durumdan eski haline geri döndürmesi (temizlenen mesajın kutuda kalmaya devam etmesi) engellendi. Bu düzeltme hem ana sayfa hem canlı chat ekranındaki tüm ses girişlerinde aktiftir.
  - **Klavyeyle Düzeltme Anında Otomatik Durdurma (Speech Auto-Stop on Keyboard Edit):** Kullanıcı ses kaydı devam ederken klavyeden metin silmeye veya elle düzeltmeye başladığı an (onChange tetiklendiğinde) SpeechRecognition'ın otomatik olarak durdurulması sağlandı. Bu sayede, Google Gboard ve iOS dikte klavyelerinde olduğu gibi, manuel müdahale anında ses tampon belleği kilitlenerek silinen eski kelimelerin ses akışıyla tekrar geri gelmesi hatası %100 çözüldü. Bu özellik hem ana sayfa hem canlı chat giriş alanlarında aktiftir.
- **Dinamik Yükselen ve Otomatik Kayan Mesaj Giriş Alanı (Auto-Grow & Auto-Scroll Textarea):**
  - Canlı sohbet (`ChatScreen.tsx`) mesaj yazma alanındaki tek satır sınırlaması kaldırıldı. Kullanıcı klavyeyle yazdıkça veya sesle konuştukça metin kutusunun **yukarıya doğru otomatik olarak genişlemesi (auto-grow)** sağlandı.
  - Yükseklik değeri `scrollHeight` ile dinamik hesaplanıp maksimum **`200px`** sınırına (yaklaşık 8-10 satır) kadar genişletildi.
  - **Otomatik Aşağı Kaydırma (Auto-Scroll):** Metin uzadıkça veya sesle konuşmaya devam ettikçe, en son söylenen kelimelerin daima görünür kalması için textarea scroll barı **otomatik olarak en aşağıya (`scrollTop = scrollHeight`) kaydırılacak** şekilde güncellendi.
  - Giriş barı esnek hizalama düzeni (`items-end`) olarak güncellenerek, metin yükseldikçe butonların (Mikrofon ve Gönder) en altta sabit kalması ve arayüz estetiğinin bozulmaması sağlandı.
- **Yapay Zeka Yanıtlarını Seslendirme (Text-to-Speech) Kaldırılması:**
  - Kullanıcı talebi doğrultusunda yapay zeka yanıtlarının yanında yer alan sesli okuma ("Seslendir / Durdur") düğmesi ve Text-to-Speech kütüphane bağlantıları temizlendi.
- **Derleme & Dağıtım:** TypeScript ve Next.js production build (`npm run build`) kontrolleri tamamlanarak kodlar GitHub `main` branch'ine gönderildi.

## 2026-07-02 fix | Onayla Sonsuz Döngü Düzeltmesi & Canlı DB Şema Senkronizasyonu

- **Sorun:** Kullanıcı "Onayla" butonuna bastığında talep tamamlanmıyor, aynı onay paneli sürekli tekrar gösteriliyordu.
- **Kök Nedenler:**
  1. Gemini AI hata verdiğinde catch bloğundaki deterministic fallback, `confirm_form` adımı için sadece "Onayla butonuna basın" mesajı döndürüyordu — **veritabanında job oluşturMUYORDU**. Bu nedenle kullanıcı her "Onayla" dediğinde aynı paneli görüyordu (sonsuz döngü).
  2. Son güncellemelerle eklenen `republished_from_id` kolonu ve `SavedCard` tablosu canlı veritabanında (GCP Cloud SQL) senkronize edilmemişti. Bu nedenle `prisma.serviceRequest.create()` çağrısı veritabanı seviyesinde hata fırlatarak çökmeye neden oluyordu.
- **Çözüm:**
  - `confirm_form` fallback case'ine **gerçek `serviceRequest.create()` mantığı** eklendi.
  - Canlı GCP Cloud SQL (`esnaaf-db-prod`) IP yetkilendirmesi güncellenerek `prisma db push` komutu yerel olarak çalıştırıldı. Canlı veritabanı şeması ve tabloları güncel Prisma şemasıyla **%100 eşitlendi.**
  - Fallback'te de distribution queue'ya ekleme ve hata durumunda console.error loglaması var.
- **Build:** Backend `nest build` ✅ sıfır hata.

## 2026-07-02 feat | Landing Page Premium AI Sohbet Kutusu ve Sesli Komut (Speech Recognition)

- **AI Sohbet Arayüzü & Tipografi Tasarımı (`app-musteri/app/page.tsx`):**
  - Eski tek satırlı arama kutusu kaldırıldı; yerine Claude/ChatGPT arayüzünü anımsatan çok satırlı (`textarea`) geniş ve modern bir **AI Sohbet Kutusu** yerleştirildi.
  - İçerik placeholder metni: *"Esnaafa sorun. Hangi hizmete ihtiyacınız var ? (Örn: Ev Temizliği, Boya Badana...)"* olarak güncellendi.
  - Mobil cihazlarda çok büyük durmasını engellemek amacıyla placeholder yazı boyutu **mobile için `11px` (`text-[11px]`)**, masaüstü için **`13px`** olarak duyarlı (responsive) hale getirildi. 
  - Yazı estetiğini artırmak için kalın (`font-semibold`) olan varsayılan stil placeholder için daha ince ve modern **`font-medium`** ve yumuşak gri **`text-slate-400/80`** rengiyle güncellendi. Giriş yapılan normal yazı ise kalın (`font-semibold`) ve responsive (`text-[13px]` -> `sm:text-sm`) olarak korundu.
  - Alt satıra ek seçenekler için sol tarafa `+` (Kategorileri Gör) butonu ve sağ tarafa AI sürüm etiketi (`Esnaaf AI v2.5`), **Sesle Anlat (Mikrofon)** butonu ve modern **Talebi Gönder** butonu yerleştirildi.
- **Sesli Komut Entegrasyonu & Anlık Geri Bildirim (Speech to Text):**
  - HTML5 native **Web Speech API** (`SpeechRecognition`) entegre edildi. `interimResults = true` ve `continuous = true` parametreleri etkinleştirilerek kullanıcının konuştuğu kelimeler **anlık olarak, gerçek zamanlı şekilde** metin kutusuna yazılmaya başlandı.
  - Mikrofon butonuna tıklandığında ses kaydı başlatılır, tarayıcıda kırmızı/rose renkte pulse animasyonlu dinleme efekti gösterilir.
  - Sistemin dinleme yaptığını ve ses algıladığını görsel olarak hissettirmek için mikrofonun hemen yanına **bouncing animasyonlu 5 barlı "Ses Dalga Efekti" (Sound Waveform Visualizer)** entegre edildi. Dinleme bittiğinde animasyon ve mikrofon aktif durumu otomatik olarak kapanmaktadır.
- **Build & Deploy:** Frontend `npm run build` ve TypeScript doğrulaması tamamlanarak değişiklikler GitHub `main` branch'ine pushlandı.

## 2026-07-02 fix | "Sistemimiz Yoğun" Hatası Kesin Çözüm — 3 Katmanlı Dayanıklılık

- **Sorun:** Canlı sohbette kullanıcılar "Sistemimiz yoğun. Lütfen birkaç dakika sonra tekrar deneyin." hatası alıyordu. Gemini AI timeout/rate-limit durumlarında sohbet akışı tamamen kesiliyordu.

- **Katman 1 — Gemini Servisi Güçlendirmesi (`gemini.service.ts`):**
  - Timeout 12s → **20s** artırıldı (Gemini Flash function calling sürelerine uyum).
  - Geçersiz fallback model `gemini-pro-latest` kaldırıldı, yerine **`gemini-2.0-flash`** eklendi.
  - Retry sayısı model başına 2 → **3** çıkarıldı.
  - Lineer backoff (1s, 2s) → **Exponential backoff (2s, 4s, 8s)** geçildi.
  - Tüm denemeler için **45 saniye global timeout** eklendi.
  - Transient hata tespitine `500/INTERNAL/Timeout` eklendi.

- **Katman 2 — Chat Servisi Deterministic Fallback (`chat.service.ts`) [KRİTİK]:**
  - `catch` bloğundaki `throw new HttpException('Sistemimiz yoğun...')` **tamamen kaldırıldı**.
  - Gemini başarısız olduğunda, mevcut adıma (`state.step`) göre **deterministic fallback yanıtlar** üretiliyor:
    - `greeting/category_detection` → Deterministik kategori tespiti + soru
    - `collecting_details` → Mevcut soruya cevap kaydet + sonraki soru
    - `ask_name/ask_phone/otp_verification/confirm_form` → Uygun deterministic yanıt
  - Fallback'in kendisi bile başarısız olursa son çare olarak "Talebinizi işliyoruz. Lütfen mesajınızı tekrar gönderiniz." dönüyor.
  - **Sonuç: Kullanıcıya ASLA hata gösterilmiyor.**

- **Katman 3 — Frontend Otomatik Retry (`ChatScreen.tsx`):**
  - 503/502/504 hatalarında **3 saniye arayla max 2 kez otomatik retry** eklendi.
  - Network hatalarında da aynı mekanizma aktif.
  - Retry sırasında kullanıcıya "Yanıt hazırlanıyor, lütfen bekleyin..." mesajı gösteriliyor.
  - "Sistemimiz şu an yoğun" hata mesajı frontend'den de kaldırıldı.
  - Başarılı retry sonrası bekleme mesajları otomatik temizleniyor.

- **Build & Deploy:** Backend `nest build` ✅ | Frontend `next build` ✅ | Git push ✅

## 2026-07-01 feat | Hizmet Alan Portalı - Esnaaf ID & QR Eşleşme Kartı

- **Arayüz Geliştirmesi (app-musteri):**
  - Müşterinin (Hizmet Alan) kendi Esnaaf ID'sini görebilmesi ve usta uygulamasına QR/ID ile eşleşebilmesi için Favoriler sekmesinin sol sütununa lüks antrasit renkli **Esnaaf ID & QR Kod Eşleşme Kartı** entegre edildi.
  - Kart üzerinde `esnaafId` dinamik olarak listelenecek şekilde bağlandı ve açıklama metni usta tarafındaki sadık müşteri eşleşme süreciyle uyumlu hale getirildi.
  - Proje derleme (`npx tsc --noEmit`) testi sıfır hata ile tamamlandı.

## 2026-07-01 feat | Tekrar Yayınla — Temiz Sayfa + Öncelikli Bildirim

- **Arşivleme Sistemi (Backend):**
  - `OfferStatus` enum'una `archived` durumu eklendi. Tekrar yayınlama sırasında eski talebin tüm teklifleri (pending, accepted, rejected) `archived` statüsüne alınıyor.
  - `ServiceRequest` modeline `republished_from_id` (UUID, nullable) alanı eklendi — yeniden yayınlanan taleplerin orijinal taleple ilişkilendirilmesi sağlandı.
  - Migration SQL oluşturuldu: `20260701000000_add_archived_status_and_republished_from_id`.
- **Akıllı Bildirim (Backend):**
  - `HV-TEKRAR` bildirim şablonu eklendi. Daha önce teklif veren ustalara "Daha önce teklif verdiğiniz iş yeniden yayınlandı" bildirimi gönderiliyor.
  - `BildirimService` entegrasyonu ile `republish()` metodu, eski teklif veren her ustanın `user.id`'sine `HV-TEKRAR` bildirimi gönderiyor.
- **Dağıtım Algoritması Önceliklendirmesi (Backend):**
  - `talepler.processor.ts`'de `previousProviderIds` desteği eklendi. Tekrar yayınlanan işlerde önceki ustalar +30 puan bonus ve 0 dakika gecikme (anında bildirim) ile önceliklendirildi.
- **Frontend (SeekerDashboard.tsx):**
  - `Offer` interface'ine `archived` status eklendi.
  - `RequestItem` interface'ine `republished_from_id` alanı eklendi.
  - Republish sonrası `showConfirm` ile kullanıcıya "Eski teklifler arşivlendi ve önceki ustalara bildirim gönderildi" bilgisi gösteriliyor.
  - Tekrar yayınlanan talepler için teklifler bekleniyor ekranında amber renkli "yeniden yayınlandı" bilgi notu eklendi.

## 2026-06-28 feat | Admin Paneli - "Kullanıcı Paneli Ön İzleme ve Taklit Etme (Impersonation)" Sistemi

- **Güvenlik Altyapısı (Backend):**
  - JWT token payload'una `isImpersonated` bayrağı eklendi ve `JwtStrategy` ile `req.user`'a bağlandı.
  - Global `JwtAuthGuard` içerisinde `handleRequest` ezilerek taklit modundaki kullanıcıların yazma istekleri (`POST`, `PUT`, `DELETE`, `PATCH`) `403 Forbidden` ile tamamen engellendi (Read-Only koruması).
  - `@Public()` chat mesaj gönderim endpoint'inde taklit token'ları kontrol edilerek adminlerin taklit modunda AI ile sohbet etmesi de engellendi.
  - `POST /api/admin/users/:id/impersonate` endpoint'i ve `impersonateUser` metodu eklendi. Yetkisiz erişimler engellendi ve taklit eylemi güvenlik denetimi için `AuditLog` tablosuna staff UUID'siyle birlikte kaydedildi.
- **Arayüz Entegrasyonu (Frontend):**
  - Müşteri (`app-musteri`) ve Hizmet Veren (`app-hizmetveren`) uygulamalarında mount sırasında query parametrelerinde (`token`, `impersonate=true`) gelen taklit token'ları yakalanıp local storage'a otomatik oturum açtırılarak URL temizlendi.
  - Her iki dashboard'un en üstüne, ön izleme modunda olunduğunu belirten, yanıp sönen uyarı noktalı kırmızı **"Ön İzleme Modu"** uyarı şeritleri entegre edildi.
  - Şeritteki "Ön İzlemeyi Kapat" butonuyla oturumların temizlenip sekmenin kapatılması sağlandı.
  - Admin paneli Kullanıcı Detay kartına Lucide `Eye` ikonlu **"Ön İzle"** butonu eklenerek hedef portal sekmelerinin otomatik olarak taklit token'ıyla açılması tetiklendi.

## 2026-06-28 fix | Canlı Sohbet AI Bağlantı Hataları ve "Failed to fetch" Maskeleme

- **Ön Yüz Hata Maskelemesi (`ChatScreen.tsx`):**
  - Müşteri chat ekranında ağ kopması, yavaşlık veya sunucu hatası durumlarında sohbet balonunda ham `"Failed to fetch"` teknik hata mesajının görünmesi engellendi.
  - Bu tür ağ hataları yakalanarak son kullanıcıya kibar ve açıklayıcı bir Türkçe yardım metni sunulması sağlandı.
- **Backend Zaman Aşımı & Fail-Fast Optimizasyonu (`gemini.service.ts`):**
  - Gemini API generateContent isteklerine `Promise.race` ile **12 saniyelik zaman aşımı (timeout)** kuralı entegre edildi.
  - Böylece sunucunun aşırı yavaş API yanıtları nedeniyle Cloud Run/Load Balancer zaman aşımına girip bağlantıyı koparması önlendi. Sunucu 12 saniyede kontrollü bir biçimde diğer yedek modellere geçecek veya kontrollü 503 hatası dönerek ön yüzün bunu işlemesini sağlayacaktır.

## 2026-06-28 feat | Talep Otomatik Uzatma, Tekrar Yayınlama ve Anonim Rakip Teklif Analizi Entegrasyonu

- **Talep Süresini Otomatik Uzatma:**
  - Gündüz taleplerinde (10:00 - 18:00) ilk 30 dakikada, gece taleplerinde (18:00 - 10:00) sabah 10:00 limitinde hiç teklif gelmediyse, ihale süresi otomatik olarak 15 dakika daha uzatılacak şekilde backend `getRequestExpiryInfo` mantığı güncellendi.
- **Süre Dolan Talepleri Tekrar Yayınlama:**
  - Teklif alım süresi dolmuş veya iptal edilmiş talepler için müşteri panelinde belirgin bir **"Tekrar Yayınla"** butonu entegre edildi.
  - Tıklandığında eski talebi iptal eden ve aynı bilgilerle yeni bir talep açarak esnaf havuzuna ve dağıtım sırasına ileten `POST /api/musteri/talepler/:id/tekrar-yayinla` endpoint'i ve arayüz fonksiyonu yazıldı.
- **Anonim Rakip Teklif Analizi Modülü:**
  - Süresi dolan veya başka bir usta tarafından kazanılan (teklife kapanan) işler için teklif vermiş olan tüm ustaların "Kaybedilen ve İptal Edilenler" sekmesindeki iş kartlarında **"Rakiplerin Verdiği Teklifler"** paneli açıldı.
  - Rakip ustaların tüm profil bilgileri maskelendi (API sadece `{ price, isMe }` dönecek şekilde sınırlandırıldı).
  - Teklif fiyatları en düşükten en yükseğe doğru sıralanarak listelendi. Ustanın kendi teklifi **"Sizin Teklifiniz: ₺X.XXX"** şeklinde mavi etiket ile belirginleştirildi.

## 2026-06-24 feat | İş Tamamlama Beyanı Bildirim Akışının Entegrasyonu

- **Yeni Bildirim Şablonu Oluşturuldu (`HA-IS-BEYAN`):** Hizmet Veren işi tamamladığında Hizmet Alan'a (Müşteri) gönderilecek yeni bildirim şablonu backend tarafında `bildirim-sablonlari.ts` içine tanımlandı. Bu şablon in-app (uygulama içi), push ve SMS kanallarını desteklemektedir.
- **Backend Tetikleyici Entegre Edildi (`job-completion.service.ts`):** Hizmet veren "İşi Tamamla" beyanında bulunduğunda (`declareCompletion`), müşteriye hem anlık WebSocket olayı ile hem de veritabanına kaydedilen kalıcı bildirim kaydıyla `HA-IS-BEYAN` bildirimi gönderilmesi sağlandı. Böylece müşteri offline (uygulamada değil) olsa bile FCM push / SMS üzerinden de uyarılacaktır.
- **Müşteri Paneli Teyit Yönlendirmesi (`SeekerDashboard.tsx`):** Bildirim zili dropdown listesindeki iş tamamlama bildirimi öne çıkarıldı (yeşil pulse noktası ve sol kenarlık ile görselleştirildi) ve tıklandığında müşteriyi doğrudan ilgili işi teyit edebileceği / puanlayabileceği "İş Teyit & Puanlama" sekmesine yönlendirecek şekilde interaktif hale getirildi.

## 2026-06-24 feat | Özel Onay (Confirm) ve Uyarı (Alert) Tasarımlarının Entegrasyonu

- **İşe Başla Butonu Onay Ekranı Güncellendi:** "Kazanılan İşler" sayfasındaki işe başlama butonuna tıklandığında çıkan eski tarayıcı onay kutusu (`window.confirm`) kaldırılarak, platform tasarım diline (glassmorphic arka plan, yumuşak kenarlar, yeşil tonlu butonlar ve pürüzsüz animasyonlar) uygun özel `showConfirm` modalı ile değiştirildi.
- **Yerel Uyarılar Kaldırıldı:** Sadık müşteri daveti, doğrudan iş teklifi gönderme ve iş iptal ekranlarındaki tüm `alert(...)` diyalogları, platform genelinde tutarlı bir deneyim için `showAlert` modal yapısı ile uyumlu hale getirildi.

## 2026-06-24 feat | "Açık Kapı" Terminolojisinin "Sadık Müşteri" Olarak Güncellenmesi

- **Arayüz Terminolojisi Güncellendi:** Hizmet Veren panelinde yer alan "Açık Kapı Avantajı Raporu" ve tamamlanan iş kartlarındaki "Açık Kapı Hediyesi (%0 Komisyon)" ifadeleri, kullanıcılar tarafından daha kolay anlaşılması amacıyla "Sadık Müşteri Avantajı Raporu" ve "Sadık Müşteri Hediyesi (%0 Komisyon)" olarak güncellendi.
- **Backend Kod/Yorum Uyumlaştırılması:** Backend tarafında `talepler.service.ts` ve `job-completion.service.ts` dosyalarındaki ilgili komisyon ve hak tanımlama yorum satırları yeni "Sadık Müşteri" terminolojisi ile uyumlu hale getirildi.

## 2026-06-24 feat | Canlı iyzico Ödeme Entegrasyonunun Tamamlanması

- **Çevre Değişkenleri Güncellemesi:** Google Cloud CLI aracılığıyla canlı `esnaaf-backend` Cloud Run servisine `IYZICO_API_KEY`, `IYZICO_SECRET_KEY` ve `IYZICO_BASE_URL=https://api.iyzipay.com` değerleri başarıyla tanımlandı ve yeni sürüm sorunsuz yayına alındı.
- **Sağlık Testleri:** API sunucusu üzerinde sağlık durum sorgulamaları gerçekleştirilerek veritabanı, Redis ve iyzico bağlantılarının tam olarak `UP` durumda olduğu teyit edildi.

## 2026-06-24 perf | Ana Sayfa Görsel Optimizasyonu ve WebP Dönüşümü

- **Görsel Boyutlarının Azaltılması:** Ana sayfada kullanılan yapay zeka üretimi `esnaaf_cleaners.png` (646KB) ve `esnaaf_van_driver.png` (691KB) görselleri WebP formatına dönüştürüldü.
- **Dosya Boyutu Küçülmesi:** WebP dönüşümü sayesinde dosya boyutları sırasıyla `80.7KB` (%87.5 küçülme) ve `100.9KB` (%85.4 küçülme) seviyelerine çekilerek toplam **1.16 MB** tasarruf sağlandı ve ilk sayfa yükleme performansı artırıldı.
- **Next.js Image Entegrasyonu:** Standart `<img>` etiketleri Next.js'in `<Image>` bileşeni ile değiştirildi. `fill` ve `sizes` özellikleri eklenerek görselin ekran boyutuna göre optimize edilmiş olarak indirilmesi, lazy loading ve preloading (`priority`) yetenekleriyle LCP (Largest Contentful Paint) değerlerinin iyileşmesi sağlandı.

## 2026-06-24 feat | Adım 26: Sadık Müşteri & Doğrudan İş Kartı Sistemi

- **Esnaaf ID & QR Kod Eşleşmesi:**
  - `User` modeline 5 haneli benzersiz `esnaaf_id` alanı eklendi (Örn: `ESN-K3T9X`).
  - Alfanümerik kod üretici ve boot sırasında eksik ID'leri dolduran `populateEsnaafIds` metodu entegre edildi.
  - Canlı veritabanındaki tüm mevcut kullanıcılara benzersiz Esnaaf ID'leri tanımlandı.
- **Çift Taraflı İzin & Güvenlik:**
  - `FavoriteProvider` modeline `approved` ve `created_by` alanları eklenerek usta-müşteri eşleşmesinin onay mekanizmasına bağlanması sağlandı.
  - Müşteri onay modalı, usta arama ve WebSocket bildirim tetikleyicileri (`new_loyalty_request`) entegre edildi.
- **Doğrudan İş Kartı ve İlanı:**
  - Usta tarafından sadık müşteriye doğrudan teklifli iş kartı göndermeyi sağlayan `POST /api/hizmetveren/dogrudan-is-karti` endpoint'i yazıldı.
  - Müşterinin sadece seçtiği favori ustasına özel talep açması sağlandı (havuza düşmeden usta panelinde `🌟 Sadık Müşterinizden Özel Talep` etiketiyle listelenir).

## 2026-06-24 feat | Adım 27: Tekli "Açık Kapı" Komisyon Modeli

- **Komisyonsuz İlk İş Hakkı:**
  - Usta kendi müşterisiyle iş tamamladığında (`is_direct = true`), veritabanında `open_door_right = true` olarak set edilir.
  - Usta havuzdan ilk işini kazandığı anda, eğer bu hak aktifse teklifine **%0 komisyon** mühürlenir (`commission_rate = 0`) ve hakkı sıfırlanır.
- **Arayüz Kart Güncellemesi:**
  - Usta paneli "Tamamlanan İşler" sekmesi, komisyon detaylarını net gösteren yatay kart tasarımına geçirildi. Kartlarda komisyon oranı ve tutarı dinamik hesaplanmaktadır.

## 2026-06-24 feat | Adım 28: Aylık Toplu Komisyon Tahsilatı

- **Tahsilat Altyapısı:**
  - `Offer` tablosuna `commission_paid` alanı eklenerek ödenmemiş komisyonlar (`unpaidCommission`) ve gelecek faturalama tarihi (`nextBillingDate`) API üzerinden dinamik olarak hesaplandı.
  - Usta paneli abonelik sekmesine "Birikmiş Komisyon Bilgisi" kartı eklenerek ödeme döngüleri şeffaflaştırıldı.

## 2026-06-23 feat | Adım 25: AI Öğretisi & Akıllı Sohbet (Yapay Zeka Öğretisi)

- **Genel Soru Algılama & Failsafe Bypass:**
  - Canlı sohbet robotunda kullanıcıların platform ücretleri, komisyon oranları, platformun çalışma şekli ve güvenlik kontrolleri gibi sorular sorduğunda doğrudan konum ve telefon sorma adımlarına zorlanmasını engellemek için `isGeneralOrInformationalQuery` metodu eklendi.
  - İlk mesajda boyacı gibi kategori kelimeleri geçtiğinde doğrudan talep formuna yönlendiren "Hybrid Deterministic Category Failsafe" mekanizması, eğer mesaj genel bilgi/sorgulama içeriyorsa bypass edilecek şekilde güncellendi.
- **Yapay Zeka Öğretisi Sistem Talimatı:**
  - Gemini modelinin `systemInstruction` metni güncellendi. Platformun tamamen ücretsiz olduğu, hiçbir komisyon veya ücret alınmadığı, ustaların onaylı ve kimlik kontrollerinden geçmiş olduğu detayları AI'a öğretildi.
  - Soruyu yanıtladıktan sonra konuşmanın sonuna nazikçe hizmet talebi açma teklifi eklenmesi kurala bağlandı: *"Size bu konuda yardımcı olmak için ücretsiz bir hizmet talebi oluşturup en uygun ustalardan canlı teklifler toplamak ister misiniz?"*
- **Dinamik Veritabanı Usta Sorgulaması (`getPlatformStats` Tool):**
  - AI modelinin belirli bir ilçe/şehir ve kategorideki onaylı usta sayılarını sorgulayabilmesi için `getPlatformStats` aracı tanımlandı.
  - Model bu aracı tetiklediğinde Prisma veritabanından onaylı usta sayısı (`prisma.serviceProvider.count`) çekilerek kullanıcıya dinamik ve güncel usta adet bilgisi verilmesi ve ardından talep açmaya davet edilmesi sağlandı.
- **Entegrasyon ve Regex Testleri:**
  - Yapılan regex geliştirmelerini test etmek için `test-regex.js` test betiği yazıldı ve doğrulandı.
  - Backend API tip kontrolü (tsc) sıfır hatayla doğrulandı ve `main` branch'ine pushlanarak canlıya dağıtıldı.

## 2026-06-20 fix | Canlı Sohbet Remount Boş Ekran Hatası ve Oturum Yönetimi Güvenlik Düzeltmeleri

- **ChatScreen Remount Boş Ekran Çözümü:**
  - Canlı sohbet kapatılıp tekrar açıldığında chat ekranının bomboş/tepkisiz görünmesi hatası, React Strict Mode çift tetiklenmesini engellemek için kullanılan ancak SPA içi geçişlerde oturum ID'sini kalıcı olarak kilitleyen küresel `initializedSessions` Set yapısı tamamen kaldırılarak çözüldü. Artık chat modalı her açıldığında yeni bir oturum ID'si ile temiz bir şekilde açılıyor.
- **Oturum Yönetimi & LocalStorage Hardening:**
  - `app-musteri/lib/session.ts` altındaki `getSessionId()`, `isLoggedIn()` ve `getAuthUser()` fonksiyonları, localStorage üzerinde yanlışlıkla `"undefined"` veya `"null"` (string olarak) yazılmış eski oturum ve token değerlerini tespit edip otomatik olarak temizleyecek ve yeni bir UUID ile iyileştirecek şekilde sertleştirildi.
  - Canlı sohbet başlangıcında (`initializeChat`) oluşabilecek herhangi bir sunucu veya ağ bağlantı hatası durumunda, sessizce konsola log yazıp kalmak yerine, müşteriye hata detayını gösteren kullanıcı dostu bir sohbet balonu gösterilmesi sağlandı.

## 2026-06-20 fix | Favicon İkonlarının Kırpılması ve Canlı API Proxy/Ortam Değişkeni Düzeltmeleri


- **Favicon Kırpma & Ölçekleme:**
  - Tarayıcı sekmelerinde çok küçük görünen yeşil "e" ikonu (`logo-icon.png`, `icon.png`, `favicon.ico`) etrafındaki gereksiz saydam boşluklar (padding) `scratch/crop_icons.ps1` scripti kullanılarak kırpıldı. Görselin kapladığı alan optimize edilerek ikonun sekmede daha büyük ve görünür olması sağlandı.
  - Müşteri ve hizmet veren uygulamalarındaki ikonlar güncellenerek üretim derlemeleri test edildi.
  - Footer ve header üzerindeki logo metinlerindeki boşluklar giderilip ölçeklemeleri artırıldı.
- **Next.js Production API Proxy & Canlı Sohbet Düzeltmesi:**
  - `app-musteri` ve `app-hizmetveren` üzerindeki `next.config.ts` rewrite kuralları güncellendi. Ortam değişkeni `process.env.NEXT_PUBLIC_API_URL` tanımlı olmadığında doğrudan canlı backend url fallback'ine (`https://esnaaf-backend-339090537138.europe-west3.run.app`) yönlendirilecek şekilde yapılandırıldı.
  - Canlı sohbetin çalışmama sorunu olan server-side rewrite ve client-side WebSocket URL uyuşmazlıkları, Cloud Run üzerinde `NEXT_PUBLIC_API_URL` ve `NEXT_PUBLIC_WS_URL` env variable'larının GitHub Actions workflow'u (`.github/workflows/deploy-gcp.yml`) aracılığıyla enjekte edilmesiyle tamamen çözüldü.
- **Hata ve Çökme Düzeltmeleri:**
  - `ChatScreen` bileşeninde `next/image` kaynaklı çökme riskleri giderildi, daktilo efekti (typewriter) veri güvenliği artırıldı.

## 2026-06-19 style | Ana Sayfa Tasarımının Wix Mockup ve Logolarıyla Yenilenmesi

- **Ana Sayfa Görsel Yenilemesi (`app-musteri/app/page.tsx`):**
  - Wix/Stitch mockup tasarımı (`https://orbitdijital.wixstudio.com/esnaaf`) referans alınarak anasayfa modern, şık ve premium bir tasarım diline uyarlandı.
  - Kahraman (Hero) başlığı, açıklama metni ve yapay zeka arama kutusu yatay olarak ortalandı; altına bouncy kaydırma ok butonu entegre edildi.
  - Kategoriler alanı mockup'taki gibi yeşil yuvarlak butonlar ve altındaki isim etiketleriyle dairesel olarak dizildi.
  - Her trend hizmet kartına esnaaf'ın özel yeşil 'e' logo pini (logo-icon.png) ve puan/lokasyon bilgisi overlay olarak yerleştirildi.
  - "3 Kolay Adımla" süreci yan yana 3 kolonlu modern bir yapıya kavuşturuldu.
  - Mahallendeki ve illerdeki tercih edilen esnaflar link listeleri ikiye ayrıldı. Araya custom yapay zekayla üretilmiş `/esnaaf_cleaners.png` ve `/esnaaf_van_driver.png` görsellerini barındıran "Komşu Esnaflarla Hayatını Kolaylaştır" ve "Mahallede Komşu Esnaf Garantisi" banner'ları yerleştirildi.
  - `activeView === "dashboard"` durumunda oluşan çift return derleme hatası giderilerek `SeekerDashboard` props'larıyla sağlıklı şekilde entegre edildi. next/link importu eklendi.
- **Resmi Logo & İkon Güncellemeleri (`app-musteri/public/`):**
  - Gönderilen resmi esnaaf logoları ve ikonları (`media__1781882872176.png`, `media__1781882872180.png`, `media__1781882872231.png`) sisteme dahil edildi.
  - `logo.png` (resmi yazılı logo), `logo-icon.png` (yeşil zemin üzerine koyu 'e' pin ikonu) ve `logo-icon-dark.png` (koyu zemin üzerine yeşil 'e' pin ikonu) olarak kaydedilip sayfa üzerinde menü, footer ve kart pinlerinde doğru şekilde kullanıldı.
- Müşteri uygulaması Next.js production build ile derlenerek kodun sorunsuz çalıştığı doğrulandı ve `main` branch'ine push edilerek GCP deployment tetiklendi.

## 2026-06-18 cache | Firebase CDN ve Cloud Run Cache-Control Güncellemesi

- **Cache-Control Header Ayarlamaları (`app-musteri/next.config.ts`, `app-hizmetveren/next.config.ts`):**
  - Next.js statik olarak derlenen sayfaların (özellikle ana sayfa `/` rotasının) Firebase Hosting / Google Frontend CDN tarafından 1 yıl boyunca önbelleğe alınmasını (`s-maxage=31536000`) engellemek amacıyla `next.config.ts` dosyalarındaki route header kuralları güncellendi.
  - Dinamik/HTML sayfaları için `Cache-Control: public, max-age=0, must-revalidate` kuralları getirilerek, yeni container sürümleri canlıya çıktığında sitenin anında güncellenmesi sağlandı.
  - Statik varlıklar (JS, CSS, görsel vb.) için tarayıcı ve CDN tarafında uzun vadeli önbellekleme (`max-age=31536000, immutable`) kuralları aynen korunarak performans korundu.

## 2026-06-18 style | Müşteri Paneli Teklif Kartları İkon Modernizasyonu & Aktif Teklifler Başlık Revizyonu

- **Teklif Kartları Metadata İkon Modernizasyonu (`app-musteri/components/SeekerDashboard.tsx`):**
  - Emojilerden kalma veya basit kalan `MapPin` (Konum) ve `Calendar` (Tarih) ikonları ile bütçe detayları, modern ve göze hoş gelen gri/soft renkli badge-pills (çip/rozet) düzenine geçirildi.
  - Konum ikonu indigo rengiyle, tarih ikonu kehribar (amber) rengiyle ve bütçe ikonu zümrüt yeşiliyle (emerald) premium hissi verecek şekilde zenginleştirildi.
- **Aktif Teklifler Başlığı ve Filtreleme Kaldırılması:**
  - "Aktif Teklifler" başlığının soluna neon-lime renginde kurumsal dikey hizalama barı yerleştirildi, yazı boyutu büyütülüp kalınlaştırıldı (`font-black text-slate-900`) ve altına `TALEP VE SÜREÇ YÖNETİMİ` alt başlığı eklenerek görsel belirginliği artırıldı.
  - Herhangi bir işlevi bulunmayan ve ekranı kalabalık gösteren sıralama, filtreleme ve görünüm değiştirme barı tamamen kaldırıldı.
- Müşteri uygulaması Next.js production build ile derlenerek kodun sorunsuz çalıştığı doğrulandı.

## 2026-06-18 style | Tarayıcı Sekme Favicon İkonlarının Marka Pin Logosu ile Güncellenmesi

- **Sekme İkonlarının Güncellenmesi (`app-musteri`, `app-hizmetveren`):**
  - Next.js varsayılan Vercel logolu `favicon.ico` dosyaları kaldırılarak/güncellenerek yerlerine kullanıcının ilettiği kurumsal neon yeşil Esnaaf pin logosu yerleştirildi.
  - Hem müşteri hem de hizmet veren/admin portalları için `app/icon.png` ve `app/favicon.ico` dosyaları bu kurumsal logo ile güncellendi.
  - Projelerin üretim ortamı Next.js derlemeleri başarıyla doğrulanarak `icon.png` rotasının otomatik kilitlendiği teyit edildi.

## 2026-06-18 feat | Teklif Kabulü Öncesi Mesajlaşma ve Canlı Bildirim Entegrasyonu

- **Backend Değişiklikleri (`backend-api/`):**
  - `getOffers` metodu güncellenerek teklif kartlarının müşteriden gelen mesaj durumunu taşıması sağlandı (`hasMessages` alanı).
  - `getUnreadMessages` metodu yazıldı ve `GET /api/hizmetveren/okunmamis-mesajlar` endpoint'ine bağlandı.
  - `createMessage` metodu güncellenerek alıcı usta için `new_message_notification` WebSocket canlı bildirimi eklendi.
- **Hizmet Veren Arayüzü (`app-hizmetveren/`):**
  - Sağ üst köşeye Bell ve MessageSquare simgelerine bağlı okunmamış mesaj rozeti (`badge`) ve açılır dropdown eklendi. Dropdown üzerinden mesaja tıklayarak doğrudan sohbete geçme ve okundu işaretleme sağlandı.
  - "Teklif Verilenler" sekmesinde `off.hasMessages` ise "Mesaj Gönder" butonu eklendi.

## 2026-06-15 style | Canlı Sohbet Kategoriye Özel Hizmet Veren Meslek Unvanı Dinamikleştirilmesi

- **Kategoriye Özel Hizmet Veren İsimlendirmesi (`backend-api/src/ortak/chat/chat.service.ts`)**:
  - Canlı sohbet üzerinden talep oluşturulurken, 2. adımda gelen ek detay/not rehberi sorusundaki `"ustalarımızın"` ibaresi kategoriye göre dinamikleştirildi.
  - Yeni eklenen `getProviderNounForCategory` yardımcı yöntemiyle, seçilen hizmete uygun olarak meslek unvanları şu şekilde Türkçe çoğul ekleriyle birlikte eşlendi:
    - `ozel-ders` -> `"öğretmenlerimizin"`
    - `ic-mimar-dekorasyon` -> `"iç mimarlarımızın"`
    - `fotografci` -> `"fotoğrafçılarımızın"`
    - `organizasyon-etkinlik` -> `"organizatörlerimizin"`
    - `ev-temizligi` / `ofis-temizligi` / `insaat-sonrasi-temizlik` / `hali-koltuk-yikama` -> `"temizlik profesyonellerimizin"`
    - `hasere-ilaclama` -> `"ilaçlama uzmanlarımızın"`
    - `nakliyat` -> `"nakliyecilerimizin"`
    - Diğer teknik servis, usta ve el becerisi kategorilerinde ise standart `"ustalarımızın"` ifadesi korunarak dil bütünlüğü sağlandı.
- `backend-api` projesi taşınabilir Node v22.12 ortamında `nest build` ile başarıyla derlenerek sıfır TypeScript ve derleme hatasıyla doğrulandı.

## 2026-06-15 style | Kazanç Trendi Grafiği Modernizasyonu & Milimetrik Hizalama

- **Kazanç Trendi Grafiği UI Modernizasyonu (`app-hizmetveren/app/page.tsx`)**:
  - **Dikey Grid Hizalaması:** Y-ekseni fiyat etiketleri (₺0, ₺max/2, ₺max) absolute konumlandırma ile SVG'nin grid çizgileriyle (y=10, 65, 120) dikeyde %100 uyumlu (%92.3, %50.0, %7.69) olacak şekilde dikeyde mükemmel ortalandı (`translateY(50%)`).
  - **HTML Dots Dikey Hizalaması:** SVG dikey esnemelerine bağlı kaymaları gidermek için dairesel grafik noktaları dikey yüzde (`bottomPct`) koordinatlarıyla SVG eğrisiyle milimetrik olarak kilitlendi. Hover tooltip'i de buna uygun olarak `calc(y% + 16px)` ile dairesel noktanın tam üzerinde konumlandırıldı.
  - **Yatay Eksen Hizalaması (X-Axis):** X-ekseni zaman etiketleri flex grid yerine absolute yüzdesel `leftPct` ve `translateX(-50%)` ile tam dairesel grafik noktalarının hizasına ortalandı.
  - **Grafik Çizgisi Gölge Filtresi:** SVG ana Bezier çizgisine drop-shadow filtresi (`feDropShadow`) tanımlanarak çizginin gridlerin üzerinde üç boyutlu, premium durması sağlandı.
  - **Minimum Y-Axis Eşiği:** Grafik verisi bulunmadığında veya düşük olduğunda çizginin en tepede düzleşmesini önlemek için minimum `maxVal` değeri 1000 TL olarak sınırlandırıldı.
- `app-hizmetveren` monoreposu taşınabilir Node v22.12 ortamında `npm run build` ile başarıyla derlenerek sıfır TypeScript ve derleme hatasıyla doğrulandı.

## 2026-06-12 fix | Usta Gönderilen Mesaj Arayüz Hizalama Hatası Giderilmesi

- **Usta Gönderilen Mesajın Sol Taraf Hizalanma Sorunu (Frontend):** Usta tarafından yeni yazılıp gönderilen mesajların, usta sohbet kutusunda (pelin ile Sohbet) gitgide biriken bir akışta, anlık olarak sol tarafta (sanki müşteriden gelmiş gibi) beyaz renk şemasıyla hizalanması ve müşteri mesajıyla bitişik/alt alta görünmesi hatası çözüldü.
  - **Güvenli JWT Base64URL Çözümleme:** Tarayıcılarda varsayılan `window.atob` fonksiyonunun, JWT payload'larındaki base64url karakterlerini (tire `-` ve alt çizgi `_`) ve dolgu eksikliğini (`=`) çözememesi sebebiyle hata fırlatıp sessizce yakalandığı (`catch`), dolayısıyla `myUserId` değişkenini tanımsız (`undefined`) bıraktığı tespit edildi. JWT payload çözücü kuralı, base64 url karakterlerini doğru eşleyen ve eksik dolgu (padding) karaterlerini tamamlayan bir algoritmaya dönüştürüldü.
  - **Çift Yönlü Key Desteği (sender_id / senderId):** HTTP API post yanıtlarında gelen nesne ile WebSocket üzerinden dinlenen nesne arasındaki key uyumsuzluklarına karşı (`sender_id` vs `senderId`) `const msgSenderId = msg.sender_id || msg.senderId;` yapısı entegre edilerek uyuşma denetimleri kusursuzlaştırıldı.
  - **Tarayıcı Diagnostic Log Desteği:** Testlerin tarayıcı tarafında doğrulanması ve `msgSenderId` / `myUserId` değerlerinin canlı olarak izlenebilmesi amacıyla mesaj render haritalama döngüsüne konsol günlüğü (`console.log`) eklendi.


## 2026-06-11 fix | Usta Paneli Canlı Sohbet Mesaj Hizalama Düzeltmesi


- **Sohbet Balonlarının Karşılıklı Hizalanması (Frontend & Backend):** Usta panelindeki canlı sohbet modalında ("pelin ile Sohbet"), hem müşteriden gelen hem de ustanın kendisinin attığı mesajların hepsinin yanlışlıkla sağ tarafta (ve aynı siyah/antrasit renk şemasıyla) hizalanması hatası çözüldü.
  - **isMe Koşulunun Güncellenmesi:** Önceden `isMe` koşulu `activeChat.seekerUserId` (ki bu alan activeChat state'inde tanımsızdı) üzerinden denetleniyordu ve bu durum tüm mesajların `isMe = true` olarak değerlendirilmesine yol açıyordu. Yeni yapıda, giriş yapan ustanın `userId` değeri `profile.userId` veya fallback olarak JWT erişim jetonu (access token) çözümlenerek (`window.atob(token.split('.')[1]).sub`) elde edilir. Mesajlar, `msg.sender_id === myUserId` kontrolüyle karşılaştırılıp doğru tarafa (giden mesajlar sağa, gelen mesajlar sola) ve doğru renklere (gidenler antrasit/siyah, gelenler beyaz) yerleştirilir.
  - **Profil Servisi userId Desteği (Backend):** `hizmetveren.service.ts` dosyasındaki `getProfile` metodunda dönülen nesneye `userId: provider.user_id` alanı eklendi.
  - **Redis Profil Önbellek Yenilenmesi:** Önceki cached verilerde `userId` alanı eksik kalmasın diye profil Redis önbellek anahtarının sürümü `provider:profile:v2:` olarak güncellendi ve admin/hizmetveren servislerindeki tüm invalidation (`redis.del`) kodları bu yeni anahtarla senkronize edildi.

## 2026-06-11 fix | Canlı Tekliflerin Anlık Düşmeme Race Condition Düzeltmesi & Çakışma Düzeltmeleri


- **Kazanılan İşler Listesinden Tamamlananların Filtrelenmesi (Backend):** Müşteri (hizmet alan) iş tamamlanma teyidi verdiğinde, bu işin usta panelindeki "Kazanılan İşler (Aktif)" sekmesinde kalmaya devam etmesi sorunu çözüldü.
  - **getWonJobs Sorgu Güncellemesi:** `hizmetveren.service.ts` dosyasındaki `getWonJobs` metodunda yapılan Prisma `acceptedOffer.findMany` sorgusuna `job: { status: { notIn: ['completed', 'cancelled'] } }` filtresi eklendi.
  - Bu sayede tamamlanan veya iptal edilen işler sadece ilgili sekmelerde görünecek, "Kazanılan İşler" sekmesinden otomatik olarak temizlenecektir.

- **Hizmet Veren Paneli "Gelen İşler (Fırsatlar)" Müşteri Kartı Tasarımı İyileştirmesi (Frontend):** Usta gelen işler kartlarındaki isim ve adres satırının çok sönük kalması sorunu giderildi ve gerçek kişi algısını güçlendirecek şekilde yeniden tasarlandı.
  - **Profil Snippet Kartı Tasarımı:** İlgili satır, hafif gölgeli ve gri arka planlı (`bg-slate-50/60 border border-slate-100/80`) ayrı bir profil alanına dönüştürüldü. Sol tarafına müşterinin isminin ilk harfini içeren neon lime renk şemalı dairesel bir kullanıcı avatarı eklenirken, sağ tarafına isim kalınlaştırılmış ve konum detayları Lucide `MapPin` ikonu ile yerleştirilmiştir. Hem veritabanından gelen gerçek işler hem de mockup kartlar bu tasarımla eşitlenmiştir.

- **Canlı Sohbet Deterministik Açık Uçlu Detay Sorma Geçişi (Backend - ChatService):** Kategoriye ait teknik parametreler girildikten sonra sorulan ek detay/not sorusunun ("Harika, teknik detayları kaydettim...") Gemini'nin bazen tool çağırması veya yönlendirmeyi atlaması nedeniyle sorulmaması sorunu çözüldü.
  - **Deterministik Araya Girme (B1 sonu):** `chat.service.ts` dosyasında, kullanıcıdan gelen parametreler ayrıştırıldıktan hemen sonra eğer tüm zorunlu teknik sorular tamamlanmışsa ve henüz detay sorulmamışsa, Gemini'ye istek atılmadan doğrudan ve deterministik olarak ilgili detay sorusu (`ask_details` adımı) dönülecek şekilde akış kesildi.
  - **detectCategory Desteği:** Kullanıcı ilk mesajında kategoriyi ve tüm detayları aynı anda girdiğinde `detectCategory` tool call handler'ından da doğrudan `ask_details` adımına yönlendirilmesi sağlandı.

- **Müşteri Paneli Canlı Tekliflerin Anlık Yansımama Sorunu (Frontend - SeekerDashboard):** Chat bitiminde müşterinin panele yönlendirilmesi sırasında, API'den taleplerin çekilmesi (`fetchRequests`) ile WebSocket bağlantısının kurulması (`io`) arasındaki yarış durumu (race condition) çözüldü.
  - **Stale Closure ve Race Condition Giderilmesi:** `SeekerDashboard.tsx` içinde `requests` listesi için bir React Ref (`requestsRef`) tanımlandı ve her `requests` değişiminde güncellendi.
  - Soket ilk bağlandığında tetiklenen `connect` event listener'ı, artık stale `requests` state'i yerine `requestsRef.current` üzerinden güncel talep listesini okuyup `join_job` yayını yapmaktadır. Bu sayede ilk bağlantıda WebSocket odalarına katılım kesinleşerek yeni usta tekliflerinin anında (sayfa yenilemeye gerek kalmadan) ekrana düşmesi sağlandı.
- **Teklif Verilenler Listesinden Kabul Edilenlerin Filtrelenmesi (Backend):** Müşteri (hizmet alan) ustanın teklifini kabul ettiğinde, bu teklifin usta panelindeki "Teklif Verilenler" sekmesinde kalmaya devam etmesi sorunu çözüldü.
  - **getOffers Sorgu Güncellemesi:** `hizmetveren.service.ts` dosyasındaki `getOffers` metodunda yapılan Prisma `offer.findMany` sorgusuna `status: { not: 'accepted' }` filtresi eklendi.
  - Bu sayede kabul edilen teklifler sadece "Kazanılan İşler" sekmesinde listelenecek, "Teklif Verilenler" sekmesinde yinelenmeyecektir.

## 2026-06-10 fix | Hizmet Veren Paneli "Gelen İşler" Detay Özeti Düzeltmesi

- **Gelen İş Detaylarının Maddeler Halinde Listelenmesi (Backend & Frontend):** Hizmet verilecek alanla ilgili toplanan form verilerinin usta gelen işler panelindeki iş kartlarında "Detay girilmedi." olarak görünmesi sorunu çözüldü.
  - **Zengin Talep Özeti Helper Metodu (generateRequestSummary):** `chat.service.ts` dosyasının sonuna `generateRequestSummary` helper metodu eklendi. Bu metot, Gemini sohbette müşteriden kategoriye özel topladığı tüm teknik parametreleri (`daireTipi`, `metrekare`, `aciliyet`, `sorunTuru`, `sinifSeviyesi`, `tarih` vb.) Türkçe etiketleriyle maddeler halinde bir listeye dönüştürür. Müşterinin ek olarak girdiği serbest açıklama detayını da listenin altına ekler.
  - **Veritabanı ve WS Dağıtım Güncellemesi:** Talep oluşturulduğunda (`ServiceRequest.create`) `form_data.details` alanına ve usta WebSocket dağıtım payload'una (`emitNewJobToProvider`) bu zengin detay metni otomatik atandı.
  - **Yapay Zeka Prompt/Instruction Güncellemesi:** Gemini asistan promptuna (`systemInstruction`) 6. kural eklenerek, `createServiceRequest` araç çağrısında müşterinin yazdığı ana problemi veya ihtiyacı `formData.details` parametresine eksiksiz ve uydurmadan özetlemesi talimatı eklendi.
  - **Usta Arayüzü Satır Atlama Desteği (pre-line):** `app-hizmetveren/app/page.tsx` arayüzündeki tüm `details` render edilen p tagleri ve container'lar `whitespace-pre-line` Tailwind sınıfıyla güncellendi. Böylece alt alta olan bullet listelerin usta panelinde okunabilir bir hiyerarşide listelenmesi sağlandı.

## 2026-06-10 fix | Müşteri Paneli Canlı Teklif Düşmeme Sorunu Düzeltmesi

- **Müşteri Paneli Canlı Teklif Akışı (WebSocket):** Müşteri paneli ("Tekliflerim" sekmesi) açıkken, ustaların verdiği yeni tekliflerin sayfayı yenilemeden veya çıkış yapıp girmeden anlık olarak ekrana düşmemesi sorunu çözüldü. 
  - **Namespace ve URL Düzeltmesi:** `SeekerDashboard.tsx` içinde WebSocket sunucusuna bağlanırken `.env.local` dosyasındaki `NEXT_PUBLIC_WS_URL` (örn: `http://localhost:3005`) tanımlı olduğunda `/chat` namespace'inin URL sonuna eklenmemesi (ve varsayılan `/` namespace'ine bağlanması) hatası giderilerek, socket.io adresi `${process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3005"}/chat` şeklinde düzeltildi.
  - **Sürekli Reconnect Önleme (Refs & Lifecycle):** Müşteri detay sekmelerinde gezindikçe veya mesaj attıkça socket bağlantısının sürekli kapatılıp yeniden açılmasına (disconnect/reconnect) neden olan useEffect dependency dizisi sadeleştirilerek bağlantının ömrü boyunca açık kalması sağlandı. `selectedRequest` ve `activeChat` state'leri için React Ref'leri (`selectedRequestRef`, `activeChatRef`) kullanılarak stale closure (eski referans) hatası engellendi.
  - **Oda Katılım Ayrışması:** WebSocket bağlantısının kurulması ile odalara katılma (`join_job`) mantığı birbirinden ayrıldı. Sunucuyla bağlantı bir kez kurulduktan sonra, talepler listesi her yüklendiğinde veya güncellendiğinde açık olan soket üzerinden odalara katılım event'leri asenkron olarak gönderildi.

## 2026-06-09 fix | Canlı Sohbet Hata & Model Eşleme Hızlandırma Düzeltmesi

- **Canlı Chat Akan Yazı (Typewriter) Efekti:** Canlı sohbette AI asistanın (Gemini) verdiği cevapların aniden kutuda belirmesi yerine, tıpkı ChatGPT ve Gemini arayüzlerindeki gibi karakter karakter akarak (typewriter animation) gelmesi sağlandı. Bu amaçla `TypewriterText` adında yeni bir bileşen kodlandı, mesaj nesnelerine `isStreaming` özelliği eklendi ve akan yazı sırasında sohbet ekranının otomatik olarak en alta kaydırılması (auto scroll to bottom) sağlandı. Oturum başlangıcındaki selamlama mesajı ve turn-by-turn diyalogların tamamı bu akan yazı efektiyle zenginleştirildi.
- **Alt Bilgi Logo Boyutu Büyütme (Home Page):** Ana sayfanın en altında (Footer alanında) bulunan ve küçük görünen Esnaaf logosunun boyutu `80px`'ten `120px`'e yükseltilerek daha belirgin ve üst menü logosuyla uyumlu hale getirildi.
- **Teklif Fiyatı Binlik Ayracı (Müşteri Paneli):** Müşteri uygulamasında gelen tekliflerin fiyatlarının düz metin olarak (örn. "3000") görünmesi sorunu çözüldü. Prisma Decimal tipindeki fiyat verisinin JSON'da dize (string) olarak gelmesinden dolayı `toLocaleString` formatlamasının çalışmaması durumu giderilerek, tüm fiyat alanları `Number(offer.price).toLocaleString("tr-TR")` şeklinde güvenli bir şekilde sayıya çevrilip Türkçe binlik ayraçlı formatta (örn. "3.000 ₺") gösterilmesi sağlandı.
- **Teklif Detay Açıklaması Gösterimi (Müşteri Paneli):** Müşteri panelinde (Seeker Dashboard "Tekliflerim" sekmesi, detay pencereleri, en ucuz/en iyi karşılaştırma kartları) ve canlı sohbet ekranındaki WebSocket teklif balonlarında usta tekliflerinin altında yer alan detay açıklamalarının görüntülenmeme sorunu çözüldü. Veritabanındaki `offers` tablosunda `message` sütununda tutulan teklif detay yazısının, frontend tarafında `offer.description` beklentisinden dolayı boş görünmesi engellenerek dynamic model fallbacks (`offer.description || offer.message`) ile hem WS anlık olayları hem de HTTP API verilerinde detayların eksiksiz gösterilmesi sağlandı.
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
