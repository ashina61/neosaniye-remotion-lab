# NeoSaniye Remotion Lab — Kapsamlı Depo Analizi

**Tarih:** 2026-08-03 · **İncelenen commit:** `41a83f1` (V3.2) · **Kapsam:** tüm depo
**Not:** Bu analiz sırasında hiçbir kaynak dosya değiştirilmedi. Deponun bire bir kopyası
geçici bir dizine alınıp boru hattı orada çalıştırıldı; aşağıdaki "ölçüldü" işaretli
bulgular o çalıştırmalardan gelen gerçek çıktılardır.

---

## 1. Özet

Depo iki farklı şeyi bir arada barındırıyor:

1. **Elle üretilmiş 6 bölüm** (`db-cooper`, `first-university`, `istanbul-conquest`,
   `covid-pandemic`, `hormuz-crisis`, `dollar-v16`) — her biri kendi sahneleri, kendi
   film motoru ve kendi ses üretme scriptiyle. Bunlar iyi yapılandırılmış, katman
   bazlı ve gerçekten kaliteli animasyon üretiyor.
2. **Auto Factory V3.2** (`src/auto-factory` + `scripts/auto-factory` + tek workflow) —
   "konu gir, video çıksın" iddiasındaki otomatik hat.

Sistemin "aktif ve güzel animasyonlu video çıkarıyor" olması doğru, **ama bu yalnızca
tek bir konu için geçerli**: `antibiotic resistance` / `antibiyotik direnci`. Workflow'un
varsayılan konusu da tam olarak bu (`auto-short-factory.yml:84`). Başka bir konu
seçildiğinde hat teknik olarak sonuna kadar koşuyor, ~40 dakika render yapıyor ve
**en sonda QC'de düşüyor** — ya da düşmeden geçip alakasız görsel üretiyor (bakteri,
petri kabı, plazmid) çünkü çizim motorunun kendisi antibiyotik hikâyesi için yazılmış.

Aşağıdaki bulguların çoğu tek bir kök nedene çıkıyor: **jenerik boru hattı ile konuya
özel içerik aynı dosyalara karışmış durumda.**

---

## 2. Depo haritası

```
src/
  auto-factory/          V3.2 otomatik hat (aktif render hedefi: NeoSaniyeAuto)
    schema.ts            Zod plan şeması — tek gerçek sözleşme
    AutoShortV3.tsx      639 satır: 9 çizim ailesi + sahne düzeni + caption
    BrandedAutoShortV3.tsx / BrandWatermark.tsx / Root.tsx / index.ts
    AutoShort.tsx  AutoShortV2.tsx  FilmEngineV2.tsx      ← ÖLÜ KOD (hiç import edilmiyor)
  db-cooper/ first-university/ istanbul-conquest/
  covid-pandemic/ hormuz-crisis/ dollar-v16/              elle üretilmiş bölümler
  Video.tsx storyboard.ts Root.tsx index.ts               eski storyboard deneyi

scripts/auto-factory/
  generate-plan.ts             Wikipedia + Pollinations → 14-18 sahnelik taslak
  normalize-scene-density.ts   16 → 13-15 sahne, cümleleri ≤7 kelimeye kırpar
  v3-postprocess.ts            planı YENİDEN YAZAR (antibiyotik profili hardcoded)
  v3-diversify.ts              ardışık görsel tipi / tekrar eden hero düzeltir
  v3-sanitize-topic.ts         yasaklı kavram temizliği
  v3-readability.ts            14 → 10 sahne, cümleleri YENİDEN YAZAR
  localize-renderer.ts         AutoShortV3.tsx KAYNAK DOSYASINI DEĞİŞTİRİR
  generate-images.ts           opsiyonel Pollinations görsel katmanları
  generate-audio-v34.py → v33 → v32 → v31    monkey-patch zinciri
  generate-audio.py, generate-audio-v3.py    ← ÖLÜ KOD
  preflight-sync.py                          ← ÖLÜ KOD
  qc.py + qc-v31.py            33 + 6 kontrol

.github/workflows/auto-short-factory.yml     tek aktif workflow
config/auto-factory-topics{,.en}.json        konu havuzları (7 kategori × 8 konu)
public/auto-factory/plan.json                commit'li build artefaktı (bkz. Bulgu G)
```

Toplam ~12.800 satır. Bağımlılıklar sabitlenmiş (Remotion 4.0.365, React 18.3.1,
zod 3.24.2) — bu iyi.

---

## 3. Gerçek V3.2 akışı

Workflow'daki adım sırası ile dosyalar arasındaki veri akışı şu şekilde:

| # | Adım | Sahne sayısı | Anlatım metnine ne oluyor |
|---|------|--------------|---------------------------|
| 1 | `generate-plan.ts` | 16 | AI veya fallback şablonlardan üretilir |
| 2 | `normalize-scene-density.ts` | 16 → **14** | Cümleler ≤7 kelimeye **kırpılır** |
| 3 | `v3-postprocess.ts` | 14 | Antibiyotik ise **tamamen değiştirilir**; değilse kırpılmış hâli kalır |
| 4 | `v3-diversify.ts` | 14 | Görsel tipi/hero çakışmaları giderilir |
| 5 | `v3-sanitize-topic.ts` | 14 | Yasaklı kelimeler değiştirilir |
| 6 | `v3-readability.ts` | 14 → **10** | Antibiyotik ise **yine değiştirilir**; değilse 10'u örneklenir |
| 7 | `localize-renderer.ts` | — | **Renderer kaynak dosyası düzenlenir** |
| 8 | `generate-images.ts` | 10 | Opsiyonel AI görselleri |
| 9 | `generate-audio-v34.py` | 10 | TTS; **sahne süreleri ses ölçümünden yeniden hesaplanır** |
| 10 | `render:auto` | 10 | Remotion 1080×1920 |
| 11 | ffmpeg loudnorm + mobil + contact sheet | | |
| 12 | `qc.py` + `qc-v31.py` | 39 kontrol | Burada düşerse tüm iş boşa gider |

Buradaki en önemli yapısal gözlem: **plan dört kez baştan yazılıyor.** Adım 2'de
kırpılan cümle adım 3'te silinip yenisiyle değiştiriliyor, adım 4'ün verdiği garantiler
adım 6'daki yeniden örneklemede bozuluyor, adım 5'in temizliği adım 6'da çöpe gidiyor.
Adım 9 ise adım 6'nın hesapladığı bütün süreleri tekrar yazıyor.

---

## 4. Doğrulanmış bulgular

### A — [KRİTİK] Sistem konu bağımsız değil

İki dosyada tam metin, sahne sahne **antibiyotik direnci senaryosu gömülü**:

- `scripts/auto-factory/v3-postprocess.ts:33-66` — 14 sahnelik TR + EN dizisi
- `scripts/auto-factory/v3-readability.ts:74-99` — 10 sahnelik TR + EN dizisi

Profil seçimi tek bir string kontrolüne bağlı (`v3-postprocess.ts:69-71`):
konu `antibiotic resistance` / `antibiyotik direnci` içeriyorsa "topic-locked",
içermiyorsa "generic-topic-locked".

Daha derin sorun renderer'da: `AutoShortV3.tsx`'teki 9 çizim ailesinin **4'ü**
(`MicrobeField`, `SelectionProcess`, `GeneTransfer`, `CauseEffect`) `Bacterium`
bileşenini (satır 151-187) kullanıyor — yani çubuk bakteri, petri kabı, plazmid halkası.
Konu "İpek Yolu" olsa bile ekranda bakteri çizilir.

Ayrıca `v3-postprocess.ts:75-84` (`kindFrom`) AI planındaki görsel tipini **atıp**
7 değerden birine düşürüyor; bunlardan biri `biology`, biri `gene-transfer`.
Anahtar kelimeleri de biyoloji odaklı (`bacter|microbe|cell|virus|gene|dna|plasmid`).
`gene` kalıbı sınır işaretsiz olduğu için `oxygen`, `agent`, `genel`, `argentina`
gibi kelimeleri de yakalayıp alakasız sahneleri "gen aktarımı" görseline yönlendiriyor.

### B — [KRİTİK] Jenerik konularda QC iki kontrolde düşüyor (ölçüldü)

`How the Silk Road actually worked` konusu ile boru hattı (adım 1-7) çalıştırıldı.
Sonuç planı:

| QC kontrolü | Gereken | Ölçülen | Sonuç |
|---|---|---|---|
| `visual_kind_diversity` | ≥ 6 | **4** | ✗ FAIL |
| `no_consecutive_template_repeat` | 0 | **2** | ✗ FAIL |
| `layout_diversity` | ≥ 6 | 10 | ✓ |
| `transition_diversity` | ≥ 6 | 10 | ✓ |
| `unique_hero_visuals` | ≥ 0.90 | 1.00 | ✓ |

Nedeni iki katmanlı:
- `kindFrom` jenerik metinlerde neredeyse hep `object-exploded` döndürüyor;
  `v3-diversify` ardışık tekrarları sadece `mechanism` ile değiştirdiği için
  toplam çeşitlilik 2-4'te kalıyor.
- `v3-diversify` 14 sahnede "ardışık tekrar yok" garantisi veriyor, sonra
  `v3-readability` bu 14 sahneden 10'unu yeniden örnekliyor ve garanti bozuluyor.
  **Doğrulama, garantiyi bozan adımdan önce çalışıyor.**

Bu kontroller boru hattının **en sonunda**, Full HD render ve ffmpeg mastering
tamamlandıktan sonra çalışıyor. Yani ~40 dakikalık iş çöpe gidiyor.

### C — [KRİTİK] AI anahtarı yokken İngilizce seçilse bile anlatım Türkçe geliyor (ölçüldü)

`POLLINATIONS_API_KEY` tanımsızken `generate-plan.ts` fallback plana düşüyor.
`genericVoice()` (satır 188-249) **yalnızca Türkçe** şablonlar içeriyor ve kategori
başına yalnızca **6 cümle** var. `LANGUAGE=en` ile üretilen gerçek anlatım:

```
How the Silk Road actually worked.
How the Silk Road actually worked anlatısının.
Bir karar dengeleri değiştiren ilk açık kırılmayı.
Belgeler ve rotalar dönüşümün nasıl yayıldığını gösteriyor.
How the Silk Road actually worked anlatısının.      ← tekrar
Önce eski düzenin çatlakları yıllar boyunca büyüdü.
...
```

Üç ayrı sorun bir arada:
1. Dil karışımı (İngilizce seçildi, Türkçe cümle geldi).
2. `generate-plan.ts:303` `rawPlan.scenes[index % length]` ile sahneleri **döngüsel
   tekrar ediyor** — 6 cümle 14 sahneye yayılınca aynı cümle 2-3 kez okunuyor.
3. `normalize-scene-density.ts` cümleleri kelime sayısına göre kestiği için
   "...anlatısının." gibi **yarım cümleler** kalıyor.

Ayrıca fallback planda `heroVisual` hiç set edilmediği için şemanın varsayılanı
(`'main subject'`) devreye giriyor, `v3-diversify` de bunları benzersizleştirmeye
çalışınca ekranda görünen metinler şöyle oluyor:

```
main subject TARİH
KARAR DENGELERI DEĞIŞTIREN ILK main subject
ANSWER IS THIS CHAIN main subject
```

Bu değerler `AutoShortV3.tsx`'te satır 295, 320, 453, 472'de **ekrana basılıyor.**

### D — [KRİTİK] `language=tr` her zaman QC'de düşüyor (ölçüldü)

`v3-readability.ts:58` sahne hedefini dile göre yazıyor:

```ts
sceneGoal: language === 'en' ? `Show exactly how: ${voice}` : `Tam olarak şunu göster: ${voice}`
```

Ama `qc.py:63-67` (`displayed_claim`) yalnızca **İngilizce** önekleri soyuyor:

```python
claim = re.sub(r"^Show exactly how:\s*", "", claim, flags=re.I)
claim = re.sub(r"^Illustrate only this spoken claim:\s*", "", claim, flags=re.I)
```

Türkçe çalıştırma testi (`Antibiyotik direnci nasıl gelişir`, `LANGUAGE=tr`):

```
profile: antibiotic-resistance | lang: tr | scenes: 10
CAPTION ERRORS: 10  → ['scene-1', ... 'scene-10']
```

`caption_completeness` kontrolü **10/10 sahnede** düşüyor → QC FAIL.
Yani workflow'un `language: tr` seçeneği hiçbir konuda çalışmıyor.

**Aynı hata renderer'da da var** (`AutoShortV3.tsx:564-566`): alt caption kutusunda
Türkçe videoda ekranda şu görünür:

```
Tam olarak şunu göster: Antibiyotikler kolonideki bakterilerin hepsini bir anda öldürmez.
```

### E — [YÜKSEK] `visual_mode=hybrid` / `ai-heavy` seçmek QC'yi bozuyor (ölçüldü)

`scripts/auto-factory/generate-images.ts:9` planı `FactoryPlanSchema.parse()` ile
okuyup satır 59'da **parse edilmiş hâlini** geri yazıyor. Zod varsayılan olarak
şemada olmayan alanları siler. `v3-readability.ts`'in eklediği alanların hiçbiri
şemada yok. Doğrulama:

```
BEFORE parse:  v3.readability = slow-followable | scene[0].finalHoldRatio = 0.34
AFTER  parse:  v3.readability = undefined       | scene[0].finalHoldRatio = undefined
```

Sonuç: `qc.py`'deki `readability_planner` ve `final_visual_hold` kontrolleri düşer.

Şu an bu bomba patlamıyor çünkü script `procedural` modda (varsayılan) veya API
anahtarı yokken satır 15/19'da erken `process.exit(0)` yapıyor. **Anahtar tanımlanıp
`hybrid`/`ai-heavy` seçildiği anda patlar** — yani AI görsel özelliği fiilen kullanılamaz
durumda.

### F — [YÜKSEK] Build adımı kaynak dosyayı değiştiriyor

`scripts/auto-factory/localize-renderer.ts` doğrudan `src/auto-factory/AutoShortV3.tsx`
dosyasını okuyup üzerine yazıyor. Doğrulanan fark:

```diff
- <text ...>ÖNCE</text>
+ <text ...>{plan.language === 'en' ? 'BEFORE' : 'ÖNCE'}</text>
- {scene.heroVisual.slice(0, 32).toLocaleUpperCase('tr-TR')}
+ {scene.heroVisual.slice(0, 32).toLocaleUpperCase(plan.language === 'en' ? 'en-US' : 'tr-TR')}
```

CI'da zararsız (commit edilmiyor), ama:
- yerelde `npm run auto:v3` çalıştıran herkesin working tree'si kirleniyor,
- `.gitignore` olmadığı için bu kolayca yanlışlıkla commit'lenebilir,
- ikinci çalıştırmada `0 replacement groups applied` yazıyor (idempotent, ama sessizce
  hiçbir şey yapmıyor — bir sonraki geliştirici bunun bozuk olduğunu sanabilir).

Bu üç satırlık dil farkı zaten `plan.language` ile runtime'da çözülebilir; kod üretimine
gerek yok.

### G — [YÜKSEK] Commit'li `plan.json` şemayı geçmiyor — temiz checkout'ta studio açılmıyor

`public/auto-factory/plan.json` hâlâ eski **v1 Dolar planı**: 16 sahne, `voiceLine` yok,
`beats` yok, `heroVisual` yok. `AutoShortV3.tsx:16` bu dosyayı modül seviyesinde
`FactoryPlanSchema.parse()` ediyor. Doğrulama:

```
SUCCESS: false
scenes[0].beats: "Array must contain at least 2 element(s)"   (16 sahnenin hepsinde)
```

Yani `git clone && npm install && npm run studio:auto` → **anında ZodError**.
Auto Factory'de yerel geliştirme yapmak için önce tüm hattı (ağ + edge-tts dahil)
çalıştırmak gerekiyor. Build artefaktının depoda tutulması zaten tercih meselesi ama
tutuluyorsa en azından geçerli bir örnek plan olmalı.

### H — [ORTA] Süre seçenekleri anlatım uzunluğundan bağımsız

`v3-readability.ts` sahne sayısını **her zaman 10**'a sabitliyor (satır 103, 109),
süre seçiminden bağımsız. `generate-audio-v31.py:159-162` ise şunu istiyor:

```python
target_speech = DURATION - 0.20 - 0.55 - INTER_SCENE_PAUSE * 9
speed = trimmed_total / target_speech
if not 0.82 <= speed <= 1.18: raise RuntimeError(...)
```

`INTER_SCENE_PAUSE` İngilizcede 0.30 (`generate-audio-v34.py:22`), yani:

| duration | target_speech | gereken hız (S = toplam konuşma) |
|---|---|---|
| 42 s | 38.55 s | S / 38.55 |
| 46 s | 42.55 s | S / 42.55 |
| 50 s | 46.55 s | S / 46.55 |

42 ile 50 arası talep %21 kayıyor, kabul penceresi ise 0.82-1.18. Üç seçeneğin
**hepsinin** çalışması için toplam konuşma süresinin 38.2-45.5 s aralığında olması
gerekiyor — 10 cümle için sıkı bir bant (cümle başına 3.8-4.6 s). Pratikte muhtemelen
sadece bir veya iki süre seçeneği çalışıyor; diğerlerinde
`Narration density is outside V3.1 readability range` hatası bekleniyor.
Commit geçmişindeki uzun "pacing fix" serisi de bunu doğruluyor.

Benzer bir kırılganlık `qc.py:147`'de: `minimum_scene_duration >= 3.0`. Ama sahne
süreleri artık `generate-audio-v33.py`'de ölçülen TTS uzunluğundan türetiliyor
(`scene["duration"] = next_start - start`). Kısa bir cümle (< 2.7 s konuşma) bu kontrolü
düşürür ve bunu ancak render bittikten sonra öğrenirsiniz.

### I — [ORTA] `v3-sanitize-topic.ts` profili yanlış anahtardan okuyor

```ts
const profile = String(plan.v3Profile ?? plan.v3_profile ?? '');   // satır 25
```

Profil aslında `plan.v3.profile` içinde. Bu ifade her zaman `''` döner; sanitizer
yalnızca `topic` string eşleşmesiyle tetikleniyor. Ayrıca antibiyotik profilinde
sanitizer'ın yaptığı iş bir sonraki adımda (`v3-readability`) tamamen üzerine yazılıyor
— yani bu adım o profilde fiilen etkisiz.

### J — [ORTA] `topic_alignment` kontrolü fiilen boş

`v3-readability.ts:38`:

```ts
return Math.min(1, voice.filter(w => visual.has(w)).length / Math.max(1, voice.length) + 0.35);
```

Taban değer `+0.35`, QC eşiği ise `>= 0.34` (`qc.py:158`). Yani hiçbir örtüşme olmasa
bile kontrol geçer. Ölçülen jenerik planda `min align = 0.49` — ama bu değer sahne ile
metin arasında gerçek bir ilişki olduğunu göstermiyor.

### K — [DÜŞÜK] Renderer'da eşlenmemiş görsel tipleri

Şemada 25 `visualKind` var (`schema.ts:3-8`), `AutoShortV3.tsx:478-506` bunlardan
yalnızca 9'unu eşliyor. `currency`, `timeline`, `factory`, `treaty-table`, `commodity`,
`institution`, `link-break`, `crowd`, `portrait-dossier`, `microbe-field` dışındakiler
sessizce `ProcessFlow`'a düşüyor. AI planı bu tipleri üretse bile ekranda üç daire ve
iki ok görürsünüz.

### L — [DÜŞÜK] Workflow ve depo hijyeni

- `concurrency.group` içinde `${{ github.run_id }}` var (`auto-short-factory.yml:75`).
  Her çalıştırmanın run_id'si benzersiz olduğu için grup asla çakışmaz —
  `cancel-in-progress` ve eşzamanlılık kontrolü **fiilen ölü**.
- **`.gitignore` dosyası yok.** `node_modules/`, `out/`, üretilen ses/görsel dosyaları
  hiçbir şey yoksayılmıyor.
- `pull_request` tetikleyicisi her PR'da ~40 dakikalık tam üretim işini çalıştırıyor
  (`timeout-minutes: 55`). Ucuz bir "plan + typecheck" doğrulaması için oldukça pahalı.
- Ölü kod: `scripts/auto-factory/preflight-sync.py`, `generate-audio.py`,
  `generate-audio-v3.py`, `src/auto-factory/AutoShort.tsx`, `AutoShortV2.tsx`,
  `FilmEngineV2.tsx` — hiçbiri package.json'dan veya import'lardan erişilebilir değil.
- 6 bölüm kompozisyonunun hiçbirinin ses/görsel varlığı depoda yok (sadece
  `public/db-cooper/asset-manifest.json`). `npm run render:hormuz` vb. önce ilgili
  üretim scriptini çalıştırmadan patlar. Bu beklenen bir durum ama README'de yazmıyor.
- `generate-audio-v34.py → v33 → v32 → v31` zinciri `importlib` + monkey-patch ile
  kurulmuş. Çalışıyor, ama `INTER_SCENE_PAUSE`, `synthesize`, `main` gibi isimler dört
  dosyaya dağılmış durumda; hangi değerin nereden geldiğini takip etmek zor.

### M — [DÜŞÜK] Dokümantasyon sapması

`docs/AUTO_FACTORY.md` hâlâ **V2**'yi anlatıyor. Gerçekle çelişen noktalar:

| Doküman diyor ki | Kodda gerçek |
|---|---|
| "14-18 sahne" | 10 sahne (`v3-readability.ts`) |
| "Her sahne kendi TTS dosyasına çevrilir" | Tek sürekli master WAV |
| "Kalıcı alt altyazı yok" | `AutoShortV3.tsx:598-616` her sahnede kalıcı caption kutusu çiziyor |
| "İlk hook en fazla 3,05 sn" | Hook 4.0 sn (`v3-readability.ts:123`) |
| "TTS hızlandırma 1,42x'i geçmemeli" | Pencere 0.82-1.18 |
| Artifact adı `neosaniye-<slug>` | `neosaniye-v32-<slug>` |

`README.md` ise Auto Factory'den **hiç bahsetmiyor** — sadece eski storyboard deneyini
ve D.B. Cooper'ı anlatıyor. Deponun ana ürünü README'de yok.

---

## 5. Öncelikli düzeltme sırası (öneri — uygulanmadı)

**Hemen yapılabilecekler (küçük, riski düşük):**

1. `qc.py:63-67` ve `AutoShortV3.tsx:564-566` — Türkçe `sceneGoal` önekini de soy.
   Tek satırlık düzeltme, `language=tr` seçeneğini kullanılabilir hâle getirir. (Bulgu D)
2. `generate-images.ts:59` — parse edilmiş plan yerine ham JSON'a `asset` alanını ekleyip
   yaz, ya da şemayı `.passthrough()` yap. `hybrid`/`ai-heavy` modlarını açar. (Bulgu E)
3. `public/auto-factory/plan.json` — geçerli bir V3.2 örnek planıyla değiştir, böylece
   temiz checkout'ta studio açılır. (Bulgu G)
4. `.gitignore` ekle (`node_modules/`, `out/`, üretilen ses/görsel dizinleri).
5. `concurrency.group`'tan `github.run_id` çıkar. (Bulgu L)
6. Ölü dosyaları sil, `docs/AUTO_FACTORY.md`'yi V3.2'ye güncelle, README'ye Auto
   Factory bölümü ekle. (Bulgu L, M)

**Orta vadeli (yapısal):**

7. **QC'yi öne çek.** `visual_kind_diversity`, `no_consecutive_template_repeat`,
   `caption_completeness`, `minimum_scene_duration` gibi plan üzerinden hesaplanabilen
   kontroller ayrı bir "plan QC" adımında, `render:auto`'dan **önce** çalışmalı.
   Render sonrası QC yalnızca gerçekten dosya gerektiren kontrollere (çözünürlük, süre,
   loudness) kalmalı. Tek başına bu değişiklik boşa giden 40 dakikaları bitirir. (Bulgu B)
8. **`v3-diversify`'ı `v3-readability`'den sonraya al.** Şu an garanti veren adım,
   garantiyi bozan adımdan önce çalışıyor. (Bulgu B)
9. **Sahne sayısını süreye bağla.** 10 sabit yerine `duration`'a göre 9-12 arası seç,
   ya da hız penceresini genişlet. (Bulgu H)
10. **Boru hattını sadeleştir.** Planı dört kez yeniden yazmak yerine tek bir "planla →
    doğrula → kilitle" adımı olmalı. `normalize-scene-density` ile `v3-readability`
    aynı işi iki kez, farklı parametrelerle yapıyor.

**Asıl iş (konu bağımsızlığı):**

11. Antibiyotik senaryosunu koddan çıkarıp `config/profiles/antibiotic-resistance.json`
    gibi bir veri dosyasına taşı. Boru hattı profil dosyası varsa onu, yoksa AI/fallback
    planını kullansın. Bugün profil kodun içinde, kodun mantığına karışmış durumda.
12. **Çizim ailelerini konudan bağımsız hâle getir.** Şu anki 9 aileden 4'ü bakteri
    çiziyor. `db-cooper`, `hormuz-crisis`, `istanbul-conquest` klasörlerindeki çizim
    yaklaşımı (soyut katmanlar, harita, arşiv kartı, mekanizma) çok daha genel —
    Auto Factory'nin çizim motoru bunlardan beslenmeli. Şemadaki 25 `visualKind`'ın
    tamamı en azından anlamlı bir jenerik çizime düşmeli. (Bulgu A, K)
13. `kindFrom`'un anahtar kelime listesini biyoloji dışına genişlet ve `gene` gibi
    sınır işaretsiz kalıpları düzelt (`\bgene\b`). (Bulgu A)
14. Fallback plan üretimini iki dile ayır ve şablon sayısını sahne sayısının üstüne
    çıkar; sahneleri döngüsel tekrar etme (`generate-plan.ts:303`). (Bulgu C)

---

## 6. Kapanış değerlendirmesi

Kod kalitesi teknik olarak yüksek: şema tabanlı sözleşme, deterministik seed, örneklenmiş
QC, ffmpeg zinciri, milisaniye hassasiyetli zaman çizelgesi — bunların hepsi ciddi
mühendislik. Bölüm kompozisyonlarındaki katman ve animasyon işçiliği de gerçekten iyi.

Sorun kalitede değil, **kapsamda**: sistem "konu bağımsız otomatik fabrika" olarak
tasarlanmış ama tek bir konu için ince ayar yapılmış hâlde. Commit geçmişindeki
20+ ardışık düzeltme (`fix(v3): ...`) bunu iyi anlatıyor — her düzeltme antibiyotik
senaryosunun pacing'ini biraz daha iyileştirmiş, ama hiçbiri jenerik yolu test etmemiş.
QC'nin render'dan sonra çalışması da bu döngüyü pahalı hâle getirmiş.

En yüksek getirili tek hamle **7. madde**: plan seviyesindeki kontrolleri render'ın
önüne almak. Bundan sonra jenerik konularda ne kırıldığı 2 dakikada görünür hâle gelir
ve 11-14. maddeler üzerinde hızlı iterasyon mümkün olur.
