export const FPS = 30;

export const CONQUEST_SCENES = [
  {
    id: 1,
    duration: 180,
    narration:
      'Yirmi dokuz Mayıs bin dört yüz elli üç sabahı, yalnız bir şehir değil, Akdeniz dünyasının dengesi değişmek üzereydi.',
  },
  {
    id: 2,
    duration: 195,
    narration:
      'Genç Sultan İkinci Mehmet, aylar süren hazırlığın ardından dev topları İstanbul surlarının karşısına yerleştirdi.',
  },
  {
    id: 3,
    duration: 180,
    narration:
      'Theodosius surları yüzyıllardır orduları durdurmuştu. Bu kez sürekli top ateşi, taş duvarları parça parça zayıflatıyordu.',
  },
  {
    id: 4,
    duration: 210,
    narration:
      'Haliç zincirle kapatılınca Osmanlı gemileri karadan yürütüldü. Bir gecede savunmanın arkasında yeni bir cephe açıldı.',
  },
  {
    id: 5,
    duration: 195,
    narration:
      'Son hücum şafaktan önce başladı. Dalgalar hâlinde ilerleyen birlikler, açılan gediklere ve sur kapılarına yöneldi.',
  },
  {
    id: 6,
    duration: 180,
    narration:
      'Şehir düştüğünde İkinci Mehmet artık Fatih diye anılacaktı. İstanbul, Osmanlı başkentinin yeni merkezi oldu.',
  },
  {
    id: 7,
    duration: 210,
    narration:
      'Fetih bir çağın tek cümlelik sonu değildi; ticaret yollarını, siyaseti ve imparatorlukların geleceğini değiştiren büyük bir dönüm noktasıydı.',
  },
] as const;

export const TOTAL_FRAMES = CONQUEST_SCENES.reduce(
  (sum, scene) => sum + scene.duration,
  0,
);

export const DURATION_SECONDS = TOTAL_FRAMES / FPS;
