export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const TOTAL_FRAMES = 900;

export const ASSETS = Object.fromEntries(
  Array.from({length: 32}, (_, index) => {
    const id = index + 1;
    return [id, id];
  }),
) as Record<number, number>;

export const SCENES = [
  {id: 1, from: 0, duration: 150, vo: 'Dünya petrolünün yaklaşık beşte biri, İran ile Umman arasındaki bu dar geçitten akıyor: Hürmüz Boğazı.'},
  {id: 2, from: 150, duration: 150, vo: '2026’da ABD ve İran arasındaki savaş yeniden alevlenince, bu ticaret yolu bir anda cephe hattına dönüştü.'},
  {id: 3, from: 300, duration: 150, vo: 'İran’ın gemi geçişlerini kısıtlaması ve saldırı tehdidi, dünyanın en önemli enerji rotalarından birini felç etti.'},
  {id: 4, from: 450, duration: 150, vo: 'Washington ise seyrüsefer özgürlüğünü savunarak donanmasını bölgede tutuyor ve İran’ın kontrol taleplerine karşı çıkıyor.'},
  {id: 5, from: 600, duration: 150, vo: 'Şimdi Umman arabuluculuğunda yeni bir geçiş düzeni konuşuluyor; fakat Hürmüz hâlâ eski normaline dönmüş değil.'},
  {id: 6, from: 750, duration: 150, vo: 'Çünkü burada yapılacak tek bir yanlış hesap, petrol fiyatlarından küresel ticarete kadar bütün dünyayı sarsabilir.'},
] as const;

export const AUDIO = {
  enabled: false,
  narration: 'hormuz-crisis-v9/audio/narration-master-v9.wav',
  score: 'hormuz-crisis-v9/audio/score-v9.wav',
} as const;
