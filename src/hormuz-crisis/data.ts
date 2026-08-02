export const HORMUZ_SCENES = [
  {
    id: 1,
    duration: 225,
    line: "12 Temmuz'da İran Devrim Muhafızları, Hürmüz Boğazı'nı ikinci bir duyuruya kadar kapattığını açıkladı.",
  },
  {
    id: 2,
    duration: 225,
    line: "İran ile Umman arasındaki bu dar geçit, Basra Körfezi'ni Umman Körfezi ve açık denizlere bağlar.",
  },
  {
    id: 3,
    duration: 240,
    line: "Normal akışta boğazdan günde yaklaşık yirmi milyon varil petrol geçer; bu, dünya tüketiminin yaklaşık beşte biridir.",
  },
  {
    id: 4,
    duration: 240,
    line: "31 Temmuz'da İran, iki gemiyi durdurduğunu ve dört gemiyi geri çevirdiğini söyledi. Geçiş fiilen ağır biçimde kısıtlandı.",
  },
  {
    id: 5,
    duration: 240,
    line: "Tankerler beklerken petrol fiyatı yükseldi. Alternatif boru hatları, kaybolan akışın yalnızca küçük bir bölümünü telafi edebiliyor.",
  },
  {
    id: 6,
    duration: 330,
    line: "2 Ağustos itibarıyla boğazı yeniden açmak için görüşmeler sürüyor. Hürmüz'deki tek bir kriz, bütün dünyanın enerji hesabını değiştirebiliyor.",
  },
] as const;

export const HORMUZ_TOTAL_FRAMES = HORMUZ_SCENES.reduce(
  (total, scene) => total + scene.duration,
  0,
);
