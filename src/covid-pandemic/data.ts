export const COVID_SCENES = [
  {
    id: 1,
    duration: 195,
    line: "2019'un sonunda, yeni bir solunum yolu hastalığı haberi kısa sürede dünyanın dikkatini çekti.",
  },
  {
    id: 2,
    duration: 210,
    line: "Virüs aylar içinde ülkeler arasında yayıldı. Dünya Sağlık Örgütü, 11 Mart 2020'de Covid-19'u pandemi olarak tanımladı.",
  },
  {
    id: 3,
    duration: 225,
    line: "Uçuşlar azaldı, okullar ve iş yerleri kapandı. Maske ve mesafe, günlük hayatın parçası oldu.",
  },
  {
    id: 4,
    duration: 240,
    line: "Hastanelerde en ağır yükü sağlık çalışanları taşıdı. Yoğun bakımlar, salgının görünmeyen cephesi haline geldi.",
  },
  {
    id: 5,
    duration: 240,
    line: "Araştırmacılar rekor hızda aşı geliştirdi. Aşılama, ağır hastalık riskini azaltan en önemli araçlardan biri oldu.",
  },
  {
    id: 6,
    duration: 390,
    line: "Pandemi, kayıpların yanında çalışma, eğitim ve sağlık sistemlerini de değiştirdi. Geriye bilim, hazırlık ve dayanışma dersi kaldı.",
  },
] as const;

export const COVID_TOTAL_FRAMES = COVID_SCENES.reduce(
  (total, scene) => total + scene.duration,
  0,
);
