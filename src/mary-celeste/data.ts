export const FPS = 30;

export const MARY_CELESTE_SCENES = [
  {
    id: 1,
    name: 'Hayalet gemi',
    duration: 180,
    audio: 'mary-celeste/audio/scene-01.mp3',
    line: "1872'de Atlantik'te sürüklenen Mary Celeste bulundu. Gemi sağlamdı, ama güverte tamamen sessizdi.",
  },
  {
    id: 2,
    name: 'Rota',
    duration: 120,
    audio: 'mary-celeste/audio/scene-02.mp3',
    line: "New York'tan Cenova'ya gidiyordu. Azorlar yakınında başıboş kalmıştı.",
  },
  {
    id: 3,
    name: 'Gemidekiler',
    duration: 150,
    audio: 'mary-celeste/audio/scene-03.mp3',
    line: 'Kaptan Benjamin Briggs, eşi Sarah, küçük kızı Sophia ve yedi denizci gemideydi.',
  },
  {
    id: 4,
    name: 'Boş güverte',
    duration: 180,
    audio: 'mary-celeste/audio/scene-04.mp3',
    line: 'Yiyecekler, eşyalar ve yük yerindeydi. Ambarında su vardı, fakat gemi hâlâ yüzebiliyordu.',
  },
  {
    id: 5,
    name: 'Kayıp filika',
    duration: 150,
    audio: 'mary-celeste/audio/scene-05.mp3',
    line: 'Tek filika ve bazı seyir araçları kayıptı. On kişiden hiçbir iz bulunamadı.',
  },
  {
    id: 6,
    name: 'Teoriler',
    duration: 210,
    audio: 'mary-celeste/audio/scene-06.mp3',
    line: 'Korsanlık, isyan ve deniz canavarı hikâyeleri anlatıldı. Ama en güçlü teori, alkol buharının mürettebatı korkutmasıydı.',
  },
  {
    id: 7,
    name: 'Terk ediş',
    duration: 150,
    audio: 'mary-celeste/audio/scene-07.mp3',
    line: 'Belki de kaptan, patlama olacağını düşünüp herkesi aceleyle filikaya bindirdi.',
  },
  {
    id: 8,
    name: 'Final',
    duration: 210,
    audio: 'mary-celeste/audio/scene-08.mp3',
    line: "Bağlantı ipi koptuysa, gemi uzaklaştı ve filika Atlantik'te kayboldu. Gerçek cevap ise hâlâ bilinmiyor.",
  },
] as const;

export const MARY_CELESTE_TOTAL_FRAMES = MARY_CELESTE_SCENES.reduce(
  (total, scene) => total + scene.duration,
  0,
);
