export const ROANOKE_SCENES = [
  {
    id: 1,
    duration: 165,
    audio: 'roanoke-netflix/audio/scene-01.mp3',
    line: "1587'de, 115 İngiliz kolonist Roanoke Adası'nda yeni bir hayat kurdu.",
  },
  {
    id: 2,
    duration: 210,
    audio: 'roanoke-netflix/audio/scene-02.mp3',
    line: 'Üç yıl sonra yardım gemisi geri döndüğünde, yerleşim tamamen boştu. Ne ceset vardı, ne de çatışma izi.',
  },
  {
    id: 3,
    duration: 210,
    audio: 'roanoke-netflix/audio/scene-03.mp3',
    line: 'Geride yalnızca iki işaret kalmıştı: Bir ağaca kazınmış CRO ve bir direğe yazılmış CROATOAN.',
  },
  {
    id: 4,
    duration: 240,
    audio: 'roanoke-netflix/audio/scene-04.mp3',
    line: "Vali John White bunun yakındaki Croatoan Adası'na bir mesaj olduğunu düşündü; ancak fırtına aramayı durdurdu.",
  },
  {
    id: 5,
    duration: 240,
    audio: 'roanoke-netflix/audio/scene-05.mp3',
    line: 'Katliam, açlık, İspanyollar ya da yerli halka karışmaları... Her teori bir parçayı açıklıyor, hiçbiri bütününü değil.',
  },
  {
    id: 6,
    duration: 270,
    audio: 'roanoke-netflix/audio/scene-06.mp3',
    line: '115 kişi nereye gitti? Dört yüz yıldan uzun süre geçti. Roanoke Kayıp Kolonisi hâlâ cevap vermiyor.',
  },
] as const;

export const ROANOKE_TOTAL_FRAMES = ROANOKE_SCENES.reduce((sum, scene) => sum + scene.duration, 0);
export const ROANOKE_DURATION_SECONDS = ROANOKE_TOTAL_FRAMES / 30;
