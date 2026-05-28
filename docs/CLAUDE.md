# Esnaaf Wiki — Schema & Çalışma Rehberi

> Bu dosya, `ESNAAF/` Obsidian vault'undaki bilgi tabanının nasıl
> yapılandırıldığını ve nasıl sürdürüleceğini tanımlar.
> Yeni bir Claude oturumu açıldığında **ilk önce bu dosyayı okur**,
> sonra göreve göre ilgili wiki sayfalarına gider.

---

## 1. Amaç

Esnaaf platformunun tüm bilgi ve gereksinimleri, **3824 satırlık tek bir PRD dosyasında**
(`esnaaf-claude.md`) bulunuyor. Bu dosya bir referans olarak güçlü ama:

- Soru sorulduğunda her seferinde baştan taranıyor
- Çapraz bağlantılar yok (bir kavram 5 farklı yerde geçebiliyor)
- Yeni bilgi geldiğinde nereye ekleneceği belirsiz
- Token maliyeti yüksek

**Wiki bu sorunu çözer:** PRD'yi modüler, çapraz referanslı, güncellenebilir
markdown sayfalarına böler. LLM yazar ve sürdürür; insan okur ve yönlendirir.

---

## 2. Üç Katmanlı Mimari

### Katman 1 — Ham Kaynaklar (immutable)

Hiçbir zaman LLM tarafından değiştirilmez. Tek doğru kaynaktırlar.

| Dosya | İçerik |
|---|---|
| `esnaaf-claude.md` | PRD — 21 bölüm, 3824 satır |
| `esnaaf-design-brief.docx` | Tasarım brief'i |
| `agents/SKILL.md` + 7 modül SKILL'i | Mevcut modül agent tanımları |

Bunlara dokunulmaz. Wiki bu kaynaklardan **sentezler üretir** — orijinali
değiştirmez, ama içeriği yapılandırılmış bir biçimde yansıtır.

### Katman 2 — Wiki (`ESNAAF/` Obsidian vault)

LLM tarafından üretilir ve sürdürülür. Sen Obsidian'da okursun, grafiği gezersin,
linklere tıklarsın.

### Katman 3 — Schema (bu dosya)

Wiki'nin nasıl yapılandırıldığını ve yeni içerik gelince ne yapılacağını söyler.

---

## 3. Klasör Yapısı

```
docs/
├── CLAUDE.md                    ← bu dosya (schema)
├── esnaaf-claude.md             ← ham PRD
├── esnaaf-design-brief.docx     ← ham brief
├── agents/                      ← mevcut agent SKILL dosyaları
├── gunluk/                      ← (kullanıcının günlük notları)
│
└── ESNAAF/                      ← WIKI (Obsidian vault)
    ├── index.md                 ← tüm sayfaların kataloğu
    ├── log.md                   ← kronolojik aktivite kaydı
    ├── 00-Genel-Bakış.md        ← giriş sayfası (vizyon, akış özeti)
    │
    ├── 01-Modüller/             ← M1…M7 (mevcut agent haritasıyla hizalı)
    ├── 02-Roller-Aktörler/      ← HA, HV, 10 personel rolü
    ├── 03-Akışlar/              ← süreç akışları (chat, kabul, NPS, KVKK…)
    ├── 04-Kavramlar/            ← domain konseptleri (paket, kota, dağıtım…)
    ├── 05-Veritabanı/           ← tablolar + index stratejisi
    ├── 06-API/                  ← prefix bazlı endpoint sayfaları
    ├── 07-Bildirimler/          ← HA-/HV-/AD- kodları + şablonlar
    ├── 08-Teknoloji/            ← stack, ENV, monorepo, entegrasyonlar
    ├── 09-Güvenlik/             ← JWT, rate limit, hata senaryoları
    ├── 10-Kategoriler/          ← 20 hizmet kategorisi + soru şablonları
    └── 11-MVP-Plan/             ← Faz 1/2/3, geçiş kriterleri
```

---

## 4. Sayfa Konvansiyonları

### Frontmatter

Her sayfa şu YAML frontmatter ile başlar:

```yaml
---
title: Sayfa Adı
type: modül | rol | akış | kavram | tablo | endpoint | bildirim | teknoloji | mvp
prd-refs: ["§3.1", "§3.4"]
related: ["[[M2-AI-Chat-Talep]]", "[[Talep-Yaşam-Döngüsü]]"]
status: stub | draft | complete
updated: 2026-04-29
---
```

| Alan | Açıklama |
|---|---|
| `title` | Sayfanın görünen adı |
| `type` | İçerik tipi (filtreleme/Dataview için) |
| `prd-refs` | PRD'deki bölüm referansları (§X.Y formatında) |
| `related` | Bağlı diğer wiki sayfaları ([[Wikilink]] formatında) |
| `status` | `stub` (boş iskelet) → `draft` (içerik var, eksik) → `complete` |
| `updated` | Son güncelleme tarihi (YYYY-MM-DD) |

### Gövde Yapısı

Sayfa türüne göre değişir, ama her sayfa şu sırayı takip eder:

1. **Bir cümle özet** (frontmatter sonrası — sayfa açılır açılmaz "bu nedir?")
2. **PRD Referansları** (kaynak gösterimi — `esnaaf-claude.md §3.1` linkleri)
3. **Ana içerik** (sayfa türüne göre — aşağıda şablonlar)
4. **Bağlantılar** (ilgili sayfalara `[[wikilink]]` listesi)

### Şablon: Modül Sayfası (örn. `M1-Auth-Kullanıcı.md`)

```markdown
---
title: M1 — Auth & Kullanıcı
type: modül
prd-refs: ["§2", "§12", "§16", "§17.1"]
related: [...]
---

> Tek cümle özet.

## PRD Bölümleri
- [§2 Üyelik Sistemi](../esnaaf-claude.md)
- [§12 KVKK]
- ...

## Sorumluluk Alanı
...

## Bağımlılıklar
- M2, M3, M7 (token yapısı, kullanıcı alanı)

## DB Tabloları
- [[users]]
- [[service_providers]]

## Endpoint'ler
- [[Auth-Endpoints]]

## İlgili Akışlar
- [[OTP-Kayıt-Akışı]]
- [[KVKK-Onay-Akışı]]

## İlgili Kavramlar
- [[Telefon-Maskeleme]]
- [[Anonim-Session]]
```

### Şablon: Akış Sayfası (örn. `AI-Chat-Akışı.md`)

```markdown
---
title: AI Chat Akışı
type: akış
prd-refs: ["§3.1"]
---

> Kullanıcının ana sayfada chat'i başlattığı andan talep oluşana kadar.

## Aktörler
- [[Hizmet-Alan]]
- [[AI-Chat-Servisi]] (backend)

## Tetikleyici
Kullanıcı ana sayfaya girer → chat input'a yazar.

## Adımlar
1. ...
2. ...

## Hata Yolları
- AI yanıt vermez → ...
- Kategori tespit edilemez → ...

## İlgili Sayfalar
- [[M2-AI-Chat-Talep]]
- [[PII-İzolasyonu]]
- [[Anonim-Chat-Akışı]]
```

### Şablon: Kavram Sayfası (örn. `Paketler.md`)

```markdown
---
title: Paketler — Basic / Standart / Premium / VIP
type: kavram
prd-refs: ["§6"]
---

> Hizmet verenin aldığı 4 abonelik tipi.

## Tanım
...

## Karşılaştırma Tablosu
| Paket | Fiyat | Kota | ... |

## Kurallar
- ...

## Bağlı Sistemler
- [[Aylık-Kota-Sistemi]]
- [[Akıllı-Dağıtım-Algoritması]]
- [[Abonelik-Ödeme]] (akış)
```

---

## 5. Çapraz Referans Kuralları

- **Wiki içi link:** `[[Sayfa-Adı]]` (Obsidian wikilink — uzantı yok)
- **PRD'ye link:** `esnaaf-claude.md §3.4` (tam dosya yolu + bölüm numarası)
- **Tablo/endpoint:** Kendi sayfası varsa link, yoksa inline kod (`users` tablosu)

Bir kavram **2+ sayfada** geçiyorsa kendi sayfası olmalı. Bu, fan wiki mantığı:
"Gandalf" The Hobbit ve LOTR'da geçtiği için kendi sayfası vardır.

---

## 6. İş Akışları

### A. Yeni özellik PRD'ye eklendiğinde

1. PRD'deki ilgili bölümü oku
2. `index.md`'den hangi sayfaların etkilendiğini bul
3. Etkilenen her sayfayı güncelle:
   - `prd-refs` listesini güncelle
   - İçeriği gözden geçir, çelişki varsa flag at
4. Yeni kavram doğdu mu? → Yeni sayfa aç + `index.md`'ye ekle
5. Cross-reference'ları gözden geçir
6. `log.md`'ye giriş ekle: `## [TARİH] update | başlık` formatında

### B. Soru sorulduğunda

1. **Önce `index.md`'yi oku** — wiki'de cevap var mı?
2. İlgili 1-3 sayfayı oku, sentezle, **kaynak göster** (sayfa adı + PRD §)
3. Wiki'de yoksa → PRD'yi tara, cevabı oluştur, **sonra wiki'ye filele**
   (yeni sayfa veya mevcut sayfaya ekle)
4. Cevap PRD'den de gelmiyorsa → açıkça "wiki'de yok, PRD'de yok, tahmin"
   olarak işaretle

### C. Yeni sayfa oluşturulduğunda

1. Frontmatter'ı doldur (özellikle `status: stub` veya `draft`)
2. PRD §X referanslarını link olarak ekle
3. `[[Wikilinks]]` ile ilgili sayfalara bağla (2 yönlü düşün — diğer sayfada da
   bu sayfaya link olmalı)
4. `index.md`'ye ekle
5. `log.md`'ye `create` girdisi at

### D. Periyodik bakım (lint)

Kullanıcı "wiki'yi gözden geçir" derse:

- Stale claim: PRD güncellenmiş ama sayfa eski mi?
- Orphan: Hiçbir yerden link almayan sayfa var mı?
- Eksik kavram: PRD'de geçen ama sayfası olmayan kavram var mı?
- Çelişki: İki sayfa aynı şey hakkında farklı mı diyor?

---

## 7. Modül Haritası — Mevcut Agent Sistemi ile Uyum

`agents/` klasörü zaten 7 modüllük bir agent sistemi tanımlamış. Wiki bu yapıyı
**aynalar** — her modül agent'ın bir wiki sayfası vardır:

| Modül | Wiki Sayfası | PRD Bölümleri | Agent Skill |
|---|---|---|---|
| M1 — Auth & Kullanıcı | [[M1-Auth-Kullanıcı]] | §2, §12, §16, §17.1 | `agents/SKILL (1).md` |
| M2 — AI Chat & Talep | [[M2-AI-Chat-Talep]] | §3, §4, §13, §17.1 | `agents/SKILL (2).md` |
| M3 — Eşleştirme & Teklif | [[M3-Eşleştirme-Teklif]] | §5, §8, §11 | `agents/SKILL (3).md` |
| M4 — Ödeme & Kampanya | [[M4-Ödeme-Kampanya]] | §6, §7, §7.6, §17.1 | `agents/SKILL (4).md` |
| M5 — Puan & Şikayet & NPS | [[M5-Puan-Şikayet-NPS]] | §9, §10, §14.7 | `agents/SKILL (5).md` |
| M6 — Admin & Roller | [[M6-Admin-Roller]] | §15 | `agents/SKILL (6).md` |
| M7 — Altyapı | [[M7-Altyapı]] | §16, §17, §18, §19, §20 | `agents/SKILL (7).md` |

Bağımlılık matrisi (agents/SKILL.md'den):
```
M1 → M2, M3, M7
M2 → M3, M7
M3 → M4, M5, M7
M4 → M3, M5, M6, M7
M5 → M3, M6, M7
M6 → M1, M4, M5, M7
M7 → Tümü
```

---

## 8. Dil

Tüm wiki **Türkçe** yazılır — PRD Türkçe olduğu için sentezler de Türkçe olmalı.
Kod örneklerinde değişken/fonksiyon adları İngilizce kalabilir (kodda
nasılsalar öyle).

Sayfa adlarında Türkçe karakterler kullanılır (`İş-Bitiş-Akışı.md`).
Obsidian bunu destekler.

---

## 9. Token & Maliyet Disiplini

Mevcut agent sistemi (`agents/SKILL.md`) token tasarrufu kuralları getirmiş:

- "Asla komple PRD'yi context'e alma"
- "Sadece ilgili §X bölümünü kopyala"
- "Değişiklik = diff formatı"

Wiki bu disipline **destek olur**: PRD'yi açmaya gerek kalmadan, kendi
sayfaları üzerinden çalışılır. Sadece detay PRD'de geçiyorsa o §X bölümü
açılır.

---

## 10. Bu Wiki'yi Güncellemek İçin

Bu `CLAUDE.md` dosyası da yaşayan bir doküman. Format değişirse, yeni klasör
eklenirse, yeni şablon icat edilirse — burayı güncelle.

Schema kararları için `log.md`'ye `## [TARİH] schema | ...` girdisi at ki
geçmiş kararlar takip edilebilsin.
