export const DB_COOPER_SCENES = [
  {
    id: 1,
    duration: 180,
    sourceDuration: 100,
    audio: 'db-cooper/audio/scene-01.mp3',
    line: "24 Kasım 1971'de takım elbiseli bir adam, Dan Cooper adıyla Portland'dan Seattle'a giden 305 seferine bindi.",
  },
  {
    id: 2,
    duration: 210,
    sourceDuration: 180,
    audio: 'db-cooper/audio/scene-02.mp3',
    line: 'Kalkıştan sonra hostese bir not verdi. Çantasında bomba olduğunu gösterip sakin kalmasını söyledi.',
  },
  {
    id: 3,
    duration: 210,
    sourceDuration: 140,
    audio: 'db-cooper/audio/scene-03.mp3',
    line: 'İsteği netti: iki yüz bin dolar ve dört paraşüt. Seattle’da otuz altı yolcu serbest bırakıldı.',
  },
  {
    id: 4,
    duration: 240,
    sourceDuration: 160,
    audio: 'db-cooper/audio/scene-04.mp3',
    line: "Uçak yeniden havalandı. Gece sekizi geçerken, yağmur ve sert rüzgârın içinde Boeing 727'nin arka merdiveninden atladı.",
  },
  {
    id: 5,
    duration: 240,
    sourceDuration: 150,
    audio: 'db-cooper/audio/scene-05.mp3',
    line: 'FBI, NORJAK soruşturmasında yüzlerce kişiyi inceledi. 1980’de nehir kıyısında fidyenin yalnızca beş bin sekiz yüz doları bulundu.',
  },
  {
    id: 6,
    duration: 285,
    sourceDuration: 170,
    audio: 'db-cooper/audio/scene-06.mp3',
    line: 'Gerçek adı neydi? Atlayıştan sağ çıktı mı? Para nereye gitti? FBI aktif soruşturmayı 2016’da bıraktı. D. B. Cooper gizemi hâlâ çözülmedi.',
  },
] as const;

export const DB_COOPER_TOTAL_FRAMES = DB_COOPER_SCENES.reduce((sum, scene) => sum + scene.duration, 0);
export const DB_COOPER_DURATION_SECONDS = DB_COOPER_TOTAL_FRAMES / 30;
