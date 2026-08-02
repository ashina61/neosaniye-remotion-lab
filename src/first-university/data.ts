export const FIRST_UNIVERSITY_SCENES = [
  {
    id: 1,
    duration: 165,
    line: 'Dünyanın ilk üniversitesi denince, çoğu kaynak Fas’ın Fes kentindeki Karaviyyin’i gösteriyor.',
  },
  {
    id: 2,
    duration: 180,
    line: 'Fes, dokuzuncu yüzyılda ticaretin, zanaatın ve bilginin kesiştiği canlı bir şehirdi.',
  },
  {
    id: 3,
    duration: 195,
    line: 'Karaviyyin’in temeli, sekiz yüz elli dokuz yılında bir cami ve öğrenim merkezi olarak atıldı.',
  },
  {
    id: 4,
    duration: 180,
    line: 'Kuruluşu, mirasını toplum için kullanan Fatıma el Fihri’ye atfediliyor.',
  },
  {
    id: 5,
    duration: 210,
    line: 'Burada din, hukuk, dil ve zamanla başka ilim alanlarında dersler verildi.',
  },
  {
    id: 6,
    duration: 225,
    line: 'Kurum yüzyıllar boyunca öğretim geleneğini sürdürdü ve Fes’in kültürel kimliğinin merkezinde kaldı.',
  },
  {
    id: 7,
    duration: 210,
    line: 'Üniversite tanımı tarihçilere göre değişse de, Guinness onu dünyanın en eski sürekli eğitim kurumu olarak kaydediyor.',
  },
] as const;

export const FIRST_UNIVERSITY_TOTAL_FRAMES = FIRST_UNIVERSITY_SCENES.reduce(
  (sum, scene) => sum + scene.duration,
  0,
);

export const FIRST_UNIVERSITY_DURATION_SECONDS = FIRST_UNIVERSITY_TOTAL_FRAMES / 30;
