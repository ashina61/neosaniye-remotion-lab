# NeoSaniye Remotion Lab

Konu bağımsız storyboard ve Remotion video deneyi.

## Çalışma mantığı

1. Konu ve anlatım metni girilir.
2. Storyboard motoru 30 saniye için 24-40 benzersiz plan üretir.
3. Her plan için kamera, hareket, duygu ve görsel prompt hazırlanır.
4. Üretilen görseller `public/shots` klasörüne konur.
5. Remotion `public/storyboard.json` dosyasını okuyup dikey MP4 render eder.

## Kullanım

```bash
npm install
npm run storyboard -- "Antikythera Mekanizması" input/script.txt
npm run studio
npm run render
```

Storyboard üretildikten sonra `public/storyboard.json` içindeki `imagePrompt` alanları görsel üretim servisine gönderilebilir. Çıktılar `asset` alanında belirtilen dosya yollarına kaydedilmelidir.

## GitHub Actions

Actions sekmesinden **Render Remotion Video** workflow'u manuel çalıştırıldığında `neosaniye-video` adlı MP4 artifact oluşturulur.

## Sıradaki aşama

- Gemini/OpenRouter ile gerçek LLM storyboard üretimi
- Görsel üretim API adaptörü
- TTS ses zamanlamasına göre plan süreleri
- Otomatik kalite kontrolü ve tekrar eden kompozisyon engeli
