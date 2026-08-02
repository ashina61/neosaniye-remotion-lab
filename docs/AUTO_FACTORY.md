# NeoSaniye Auto Factory

Bu workflow, GitHub Actions üzerinden konu seçip baştan sona otomatik dikey belgesel Shorts üretir.

## Kullanım

1. Repository içinde **Actions** sekmesine gir.
2. Soldan **NeoSaniye Auto Factory** workflow'unu aç.
3. **Run workflow** düğmesine bas.
4. Konu seçimini yap:
   - `random`: kategori havuzundan otomatik konu seçer.
   - `custom`: `topic` alanındaki özel konuyu kullanır.
5. Süre, ses ve görsel modunu seçip workflow'u başlat.
6. İş bitince run sayfasının altındaki **Artifacts** bölümünden `neosaniye-<konu-slug>` paketini indir.

## Workflow ne yapıyor?

1. Konu seçimi
2. Wikipedia özetleriyle hızlı araştırma
3. Pollinations metin modeliyle senaryo ve 14-18 sahnelik plan
4. Netflix/Wayfinder tarzı prosedürel SVG-kolaj çizimleri
5. İsteğe bağlı 4 veya 8 Pollinations AI görsel katmanı
6. Edge Neural TTS ile doğal Türkçe/İngilizce anlatım
7. Konuya ve sahne sınırlarına göre prosedürel belgesel müziği
8. Yalnızca anlamlı noktalarda 3-7 SFX
9. Remotion ile 1080x1920 Full HD render
10. 720x1280 mobil önizleme
11. Ses yüksekliği masterı, süre/çözünürlük/tempo/SFX kalite kontrolü
12. Full HD, mobil, plan, ses masterı, contact sheet ve üretim raporunu ZIP paketine koyma

## Gerekli ayar

Repository > **Settings > Secrets and variables > Actions > Secrets** bölümüne:

- `POLLINATIONS_API_KEY`: AI senaryo planı ve hibrit görseller için.

Anahtar yoksa workflow durmaz; deterministik güvenli plan ve tamamen prosedürel çizimlerle video üretir. `strict_ai=true` seçilirse AI planı üretilemediğinde workflow durur.

İsteğe bağlı repository variables:

- `POLLINATIONS_TEXT_MODEL` — varsayılan `openai-fast`
- `POLLINATIONS_IMAGE_MODEL` — varsayılan `zimage`

## Görsel modları

- `procedural`: yalnızca Remotion/SVG çizimleri; en hızlı ve en ucuz.
- `hybrid`: 4 AI görseli + prosedürel çizimler; varsayılan.
- `ai-heavy`: 8 AI görseli + prosedürel çizimler; daha yavaş.

## Kalite kuralları

- 38-55 saniye
- 14-18 sahne
- İlk hook en fazla 3 saniye
- Normal sahneler en fazla 3,35 saniye
- Final en az 3,6 saniye
- Kalıcı alt altyazı yok
- Ana obje orta/üst bölgede; alt alan rastgele ikonlarla doldurulmaz
- Konuşmada müzik otomatik kısılır
- Çıkış: H.264, 1080x1920 ve ayrıca mobil MP4

## Çıktı

Artifact içinde:

- `<slug>-fullhd.mp4`
- `<slug>-mobile.mp4`
- `production-report.json`
- `contact.jpg`
- `plan.json`
- `manifest.json`
- `audio-master.wav`
