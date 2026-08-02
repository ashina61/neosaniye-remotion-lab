# NeoSaniye Remotion Lab

Konu bağımsız storyboard deneyi ve katmanlı belgesel reel motoru.

## Genel V3 akışı

1. Konu ve anlatım metni girilir.
2. Storyboard motoru 30 saniye için planlar üretir.
3. Her plan için kamera, hareket, duygu ve görsel prompt hazırlanır.
4. Üretilen görseller `public/shots` klasörüne konur.
5. Remotion `public/storyboard.json` dosyasını okuyup dikey MP4 render eder.

```bash
npm install
npm run storyboard -- "Antikythera Mekanizması" input/script.txt
npm run studio
npm run render
```

## D.B. Cooper — Netflix Practice Kit yöntemi

Bu kompozisyon düz görsel + zoom kullanmaz. Altı sahnenin tamamı ayrı katmanlarla kurulur ve Netflix/Blockbuster practice kitindeki sistem birebir temel alınır:

- voiceover önce kilitlenir; sahne süreleri kelimelerden çıkarılır,
- 30 FPS kompozisyonun hareketleri 12 FPS adımlarına posterize edilir,
- ortak film motoru scanline + grain + grunge + vignette + gate-weave uygular,
- her sahne ayrı dosyadır,
- sahnelerde zoom-through, karşılıklı prop girişleri, gazete drop, grounded parallax, focus-hunt, çizilmiş lamba ışığı ve hold-keyframe para parlaması kullanılır,
- her görsel öğe bağımsız dosyadır; tüm sahneyi tek görsel olarak üretmek yasaktır.

### Çalıştırma

```bash
npm install
npm run db:assets
npm run studio
npm run render:db
```

Çıktı: `out/db-cooper.mp4`

`npm run db:assets`, gerçek PNG katmanları henüz yoksa 29 ayrı SVG katmanı üretir. Sonradan aynı dosya yollarına şeffaf PNG yerleştirildiğinde animasyon kodu değişmeden gerçek görseller kullanılır. Katman listesi `public/db-cooper/asset-manifest.json` içindedir.

GitHub Actions içinde **Render D.B. Cooper Layered Reel** workflow'u manuel çalıştırılabilir ve `db-cooper-layered-reel` artifact'i üretir.

## Mevcut kompozisyonlar

- `NeoSaniyeShort`: V3 storyboard sistemi
- `DBCooperShort`: altı sahneli, 1080×1920, 30 saniyelik katmanlı D.B. Cooper belgeseli
