# D.B. Cooper Layered Reel V2

Netflix Reel Practice Kit yaklaşımına göre hazırlanmış 45,5 saniyelik dikey belgesel kompozisyonu.

## Üretim sırası

```bash
npm install
npm run db:assets
python -m pip install edge-tts
npm run db:voice
npm run studio:db
npm run render:db
```

## Çıktı

- Video: `out/db-cooper-v2.mp4`
- Süre: 45,5 saniye
- Format: 1080x1920, H.264, CRF 14, 192 kbps ses
- Ses: `tr-TR-AhmetNeural`, sahne bazlı zamanlanmış 6 anlatım kaydı
- Ambiyans: düşük frekanslı uçak/gerilim yatağı

## Zamanlama

Her sahne, orijinal 30 saniyelik animasyon hareketini `SceneTimeProvider` üzerinden kendi yeni süresine ölçekler. Böylece katman girişleri ve efektler ilk saniyelerde bitip uzun süre donmak yerine, 45,5 saniyelik akışa yayılır.

## Görsel sistem

- 12 FPS posterize kolaj hareketi
- 30 FPS video çıkışı
- ayrı arka plan, karakter, nesne ve ön plan katmanları
- hareketli grain, grunge, dust, scanline, vignette ve gate-weave
- sahneler arasında kısa siyaha çözülme
- sahne bazlı TTS, yüksek geçiren/alçak geçiren filtre ve loudness normalizasyonu
