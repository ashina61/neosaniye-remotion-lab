# NeoSaniye Auto Factory V2

GitHub Actions üzerinden konu seçip baştan sona otomatik dikey belgesel Shorts üretir. Repo içinde aktif üretim workflow'u yalnızca `.github/workflows/auto-short-factory.yml` dosyasıdır.

## Kullanım

1. Repository içinde **Actions** sekmesine gir.
2. Soldan **NeoSaniye Auto Factory V2** workflow'unu aç.
3. **Run workflow** düğmesine bas.
4. `random` ile kategori havuzundan konu seçtir veya `custom` ile özel konu yaz.
5. Süre, ses, görsel ve arka plan modunu seç.
6. Run tamamlanınca **Artifacts** bölümünden `neosaniye-<konu-slug>` paketini indir.

## V2'de değişenler

### Sahne kilitli ses

Artık tek uzun anlatım sesi kullanılmaz. Her sahne kendi `voiceLine` metnine sahiptir:

1. Her `voiceLine` ayrı Edge Neural TTS dosyasına çevrilir.
2. TTS, yalnızca ait olduğu sahnenin ses penceresine sığdırılır.
3. Ses sahne başlangıcına milisaniye hassasiyetinde yerleştirilir.
4. `scene-timing.json` gerçek TTS süresini, hız oranını ve sahnedeki konumunu kaydeder.
5. QC, sesin sahne sınırını aşması veya aşırı hızlandırılması durumunda üretimi durdurur.

### Arka plan sesi

Eski sürekli synth/pad müzik motoru kaldırıldı.

- `off`: varsayılan; arka plan müziği yoktur.
- `soft-documentary`: melodisiz, çok düşük seviyeli kağıt/oda dokusu kullanır.

SFX yalnızca 2-6 anlamlı sahnede kullanılır. Anlatıcı her zaman ön plandadır.

### Belgesel kolaj motoru

V2 sahneleri şu detayları kullanır:

- yırtık kağıt ve arşiv kartları
- halftone ve film dokusu
- bant, raptiye ve kırmızı bağlantı ipleri
- dossier etiketleri ve kaynak şeritleri
- sahneye bağlı 2-5 görsel beat
- harita çizimi, mekanizma, biyoloji, portre dosyası, arşiv duvarı gibi konuya özel çizim aileleri
- paper tear, dossier slide, film burn, split shutter, match zoom ve ink wipe geçişleri
- ana obje orta/üst bölgede; alt alan rastgele ikonlarla doldurulmaz

## Workflow ne yapıyor?

1. Konu seçimi
2. Wikipedia özetleriyle araştırma
3. Konuya özel hook ve 14-18 sahne
4. Her sahne için `voiceLine`, somut objeler ve görsel beat üretimi
5. Prosedürel SVG-kolaj çizimleri
6. İsteğe bağlı AI görsel katmanları
7. Sahne bazlı doğal Neural TTS
8. Kontrollü SFX ve isteğe bağlı soft ambience
9. Remotion ile 1080x1920 render
10. 720x1280 mobil önizleme
11. Ses/görsel senkronu, süre, loudness, geçiş ve çizim çeşitliliği QC
12. Full HD, mobil, ses masterı, scene timing, contact sheet ve rapor içeren ZIP

## Gerekli ayar

Repository > **Settings > Secrets and variables > Actions > Secrets** bölümüne:

- `POLLINATIONS_API_KEY`: konuya özel AI planı ve hibrit görseller için.

Anahtar yoksa sistem kategori ve Wikipedia verisine göre konu uyumlu fallback üretir. `strict_ai=true` seçilirse AI planı üretilemediğinde workflow durur.

İsteğe bağlı repository variables:

- `POLLINATIONS_TEXT_MODEL` — varsayılan `openai-fast`
- `POLLINATIONS_IMAGE_MODEL` — varsayılan `zimage`

## Görsel modları

- `procedural`: yalnızca Remotion/SVG çizimleri.
- `hybrid`: 4 AI katmanı + prosedürel çizimler.
- `ai-heavy`: 8 AI katmanı + prosedürel çizimler.

## Kalite kuralları

- 38-55 saniye
- 14-18 sahne
- İlk hook en fazla 3,05 saniye
- Normal sahneler en fazla 3,55 saniye
- Final en az 3,65 saniye
- Her sahnede ayrı voiceLine
- Her sahnede 2-5 görsel beat
- Ses sahne sınırları içinde kalmalı
- TTS gerekli hızlandırma oranı 1,42x üzerine çıkmamalı
- En az 4 geçiş, 5 çizim ailesi ve 4 yerleşim tipi
- Kalıcı alt altyazı yok
- Full HD ve mobil çıkış süreleri hedefle kilitli

## Çıktı

Artifact içinde:

- `<slug>-fullhd.mp4`
- `<slug>-mobile.mp4`
- `production-report.json`
- `contact.jpg`
- `plan.json`
- `manifest.json`
- `audio-master.wav`
- `scene-timing.json`
