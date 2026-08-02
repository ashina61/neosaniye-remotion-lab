export const DB_COOPER_SCENES = [
  {id: 1, duration: 100, line: '1971’de takım elbiseli bir adam, Dan Cooper adıyla Portland’dan Seattle’a giden uçağa bindi.'},
  {id: 2, duration: 180, line: 'Hostese bir not uzattı ve çantasında bomba olduğunu söyledi.'},
  {id: 3, duration: 140, line: 'İki yüz bin dolar ve dört paraşüt istedi; talepleri yerine getirildi.'},
  {id: 4, duration: 160, line: 'Gece, fırtınanın içinde Boeing 727’nin arka merdivenini açtı ve uçaktan atladı.'},
  {id: 5, duration: 150, line: 'FBI yıllarca yüzlerce şüpheliyi araştırdı; sadece nehir kıyısında bir miktar fidye parası bulundu.'},
  {id: 6, duration: 170, line: 'Cooper’ın kimliği ve atlayıştan sağ çıkıp çıkmadığı hâlâ çözülemedi.'},
] as const;

export const DB_COOPER_TOTAL_FRAMES = DB_COOPER_SCENES.reduce((sum, scene) => sum + scene.duration, 0);
