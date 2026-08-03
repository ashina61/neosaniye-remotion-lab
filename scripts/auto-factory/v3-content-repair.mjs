import {readFile, writeFile} from 'node:fs/promises';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const plan = JSON.parse(await readFile(planPath, 'utf8'));

const language = plan.language === 'tr' ? 'tr' : 'en';
const locale = language === 'tr' ? 'tr-TR' : 'en-US';
const tokenPattern = /[0-9A-Za-zÇĞİÖŞÜçğıöşü']+/g;
const words = (value) => String(value || '').match(tokenPattern) || [];
const normalize = (value) => String(value || '')
  .toLocaleLowerCase(locale)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9çğıöşü]+/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();
const sentence = (value) => {
  let clean = String(value || '')
    .replace(/\[[^\]]*]/g, '')
    .replace(/\([^)]{0,100}\)/g, '')
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
  if (clean.split('"').length % 2 === 0) clean = clean.replace(/"/g, '');
  clean = clean.replace(/\s+([,.!?;:])/g, '$1');
  return clean && !/[.!?]$/.test(clean) ? `${clean}.` : clean;
};
const unique = (items) => [...new Set(items.filter(Boolean))];

const STOP = new Set(language === 'tr'
  ? ['nasıl','neden','nedir','ne','ve','ile','için','bir','bu','şu','olan','olarak','daha','çok','the']
  : ['how','why','what','does','do','did','is','are','was','were','the','a','an','of','to','and','for','with','from','into','really']);
const DANGLING_END = new Set(language === 'tr'
  ? ['ve','ile','için','gibi','olarak','bir','bu','şu','olan','ise','de','da','ki']
  : ['a','an','the','of','to','and','or','but','with','from','into','by','for','as','that','which','is','are','was','were']);
const DEPENDENT_START = new Set(language === 'tr'
  ? ['ve','ama','fakat','çünkü','iken','olan','olarak']
  : ['and','but','because','which','while','although','however','whose','whereas']);

const topicTokens = unique(words(plan.topic).map((word) => normalize(word)).filter((word) => word.length > 2 && !STOP.has(word)));
const topicKey = normalize(plan.topic);
const scenes = Array.isArray(plan.scenes) ? plan.scenes : [];
if (!scenes.length) throw new Error('Content repair received no scenes');

const curated = [
  {
    match: /black hole|kara delik|event horizon|time dilation/,
    en: [
      'Near a black hole, gravity warps space and changes how fast time passes.',
      'Einstein showed that stronger gravity makes every nearby clock run more slowly.',
      'A black hole concentrates enormous mass inside an extremely small region of space.',
      'That concentration curves spacetime far more sharply than an ordinary star can.',
      'To a distant observer, a falling clock appears to slow near the event horizon.',
      'Light climbing away also loses energy and shifts toward redder wavelengths.',
      'The falling traveler still experiences local time normally while crossing the horizon.',
      'The difference comes from observers following very different paths through curved spacetime.',
      'Closer to the horizon, the disagreement between their clocks grows dramatically larger.',
      'Black holes bend time because mass reshapes the geometry that all clocks follow.',
    ],
    tr: [
      'Bir kara deliğin yakınında kütleçekim uzayı büker ve zamanın akışını değiştirir.',
      'Einstein güçlü kütleçekim alanlarında saatlerin daha yavaş çalıştığını gösterdi.',
      'Kara delik çok büyük bir kütleyi son derece küçük bir bölgede toplar.',
      'Bu yoğunluk uzay-zamanı sıradan bir yıldızdan çok daha sert büker.',
      'Uzaktaki gözlemci düşen saatin olay ufkunda yavaşladığını görür.',
      'Dışarı tırmanan ışık enerji kaybeder ve daha kırmızı görünür.',
      'Düşen yolcu kendi yerel zamanını geçerken normal biçimde deneyimler.',
      'Fark gözlemcilerin eğri uzay-zamanda farklı yollar izlemesinden doğar.',
      'Olay ufkuna yaklaştıkça iki saatin ölçümleri arasındaki fark büyür.',
      'Kara delikler zamanı büker çünkü kütle bütün saatlerin izlediği geometriyi değiştirir.',
    ],
  },
  {
    match: /antibiotic resistance|antimicrobial resistance|antibiyotik direnci/,
    en: [
      'Antibiotics kill susceptible bacteria, but rare resistant cells can survive treatment.',
      'Resistance may begin with a random mutation or an acquired resistance gene.',
      'The medicine removes competitors and leaves surviving bacteria with more resources.',
      'Those survivors reproduce and pass their protective traits to later generations.',
      'Bacteria can also exchange resistance genes through small DNA rings called plasmids.',
      'Incorrect doses expose microbes without reliably eliminating the entire infection.',
      'Repeated exposure therefore increases selection pressure across the bacterial population.',
      'Resistant strains can then spread between people, animals, food, and water.',
      'New antibiotics help temporarily, but evolution begins selecting survivors again.',
      'Resistance develops through natural selection, not because bacteria consciously adapt.',
    ],
    tr: [
      'Antibiyotikler duyarlı bakterileri öldürürken dirençli birkaç hücre hayatta kalabilir.',
      'Direnç rastgele bir mutasyonla veya kazanılan bir direnç geniyle başlayabilir.',
      'İlaç rakipleri ortadan kaldırır ve kalan bakterilere daha fazla kaynak bırakır.',
      'Hayatta kalanlar çoğalır ve koruyucu özelliklerini sonraki nesillere aktarır.',
      'Bakteriler plazmid denilen küçük DNA halkalarıyla direnç genlerini paylaşabilir.',
      'Yanlış dozlar enfeksiyonun tamamını yok etmeden mikropları ilaca maruz bırakır.',
      'Tekrarlanan maruziyet bakteri topluluğu üzerindeki seçilim baskısını artırır.',
      'Dirençli suşlar insanlar, hayvanlar, gıdalar ve su arasında yayılabilir.',
      'Yeni antibiyotikler geçici yarar sağlar fakat seçilim yeniden başlar.',
      'Direnç bakterilerin bilinçli uyumuyla değil doğal seçilimle gelişir.',
    ],
  },
  {
    match: /artificial intelligence generates images|ai generates images|text to image|yapay zeka.*görsel/,
    en: [
      'An image model first converts the written prompt into numerical language tokens.',
      'Training links those tokens with visual patterns learned from many example images.',
      'Generation often begins with a canvas filled by apparently random digital noise.',
      'A neural network predicts which parts of that noise do not match the prompt.',
      'The system removes unwanted noise through many small denoising steps.',
      'Attention layers connect important words with shapes, objects, colors, and positions.',
      'Early steps establish composition while later steps refine texture and small details.',
      'Different random seeds produce new images from the same written instruction.',
      'The model does not retrieve one picture; it calculates a new pixel arrangement.',
      'The final image emerges when learned visual probabilities converge on the prompt.',
    ],
    tr: [
      'Görsel modeli önce yazılı komutu sayısal dil parçalarına dönüştürür.',
      'Eğitim bu parçaları çok sayıdaki örnekten öğrenilen görsel desenlerle bağlar.',
      'Üretim çoğu zaman rastgele görünen dijital gürültüyle dolu bir tuvalde başlar.',
      'Sinir ağı gürültünün hangi bölümlerinin komutla uyuşmadığını tahmin eder.',
      'Sistem çok sayıdaki küçük adımla istenmeyen gürültüyü azaltır.',
      'Dikkat katmanları önemli kelimeleri şekiller, nesneler, renkler ve konumlarla eşleştirir.',
      'İlk adımlar kompozisyonu kurarken son adımlar küçük ayrıntıları geliştirir.',
      'Farklı rastgele tohumlar aynı komuttan yeni görüntüler oluşturur.',
      'Model tek bir resmi bulmaz, yeni bir piksel düzeni hesaplar.',
      'Öğrenilmiş görsel olasılıklar komut üzerinde birleşince son görüntü ortaya çıkar.',
    ],
  },
  {
    match: /silk road|ipek yolu/,
    en: [
      'The Silk Road was a network of routes rather than one continuous road.',
      'Merchants usually carried goods across only one section of the enormous network.',
      'Cargo changed hands repeatedly at oasis towns, mountain passes, and major markets.',
      'Silk moved west while horses, glass, metals, and spices traveled both directions.',
      'Empires protected profitable corridors and collected taxes at strategic checkpoints.',
      'Ships connected overland routes with ports across the Indian Ocean and Mediterranean.',
      'Translators and local brokers made trade possible across many languages and currencies.',
      'Ideas, religions, technologies, and diseases moved alongside valuable commercial goods.',
      'Political stability could accelerate traffic, while warfare quickly redirected entire routes.',
      'The Silk Road worked because many regional systems connected through repeated exchanges.',
    ],
    tr: [
      'İpek Yolu tek bir kesintisiz yol değil, birbirine bağlı rotalar ağıydı.',
      'Tüccarlar genellikle dev ağın yalnızca bir bölümünde yük taşıyordu.',
      'Mallar vaha kentlerinde, dağ geçitlerinde ve büyük pazarlarda el değiştiriyordu.',
      'İpek batıya giderken atlar, cam, metaller ve baharatlar iki yönde taşınıyordu.',
      'İmparatorluklar kârlı koridorları koruyor ve stratejik geçitlerden vergi topluyordu.',
      'Gemiler kara rotalarını Hint Okyanusu ve Akdeniz limanlarına bağlıyordu.',
      'Tercümanlar ve yerel aracılar farklı dillerle para birimlerini birbirine bağlıyordu.',
      'Fikirler, dinler, teknolojiler ve hastalıklar ticari mallarla birlikte yayılıyordu.',
      'Siyasi istikrar trafiği artırırken savaşlar rotaları hızla değiştirebiliyordu.',
      'İpek Yolu birçok bölgesel sistemin tekrarlanan alışverişlerle bağlanması sayesinde çalıştı.',
    ],
  },
];

const curatedMatch = curated.find((item) => item.match.test(topicKey));
const curatedLines = curatedMatch ? (language === 'tr' ? curatedMatch.tr || [] : curatedMatch.en) : [];

const isComplete = (value) => {
  const clean = sentence(value);
  const list = words(clean);
  if (list.length < 7 || list.length > 19) return false;
  const first = normalize(list[0]);
  const last = normalize(list[list.length - 1]);
  if (DEPENDENT_START.has(first) || DANGLING_END.has(last)) return false;
  if (/[,;:]\s*[.!?]$/.test(clean)) return false;
  if ((clean.match(/"/g) || []).length % 2) return false;
  return true;
};

const extractClauses = (value) => {
  const clean = String(value || '')
    .replace(/\[[^\]]*]/g, '')
    .replace(/\([^)]{0,120}\)/g, '')
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
  const results = [];
  for (const full of clean.split(/(?<=[.!?])\s+/)) {
    const normalizedFull = sentence(full);
    if (isComplete(normalizedFull)) results.push(normalizedFull);
    const pieces = full.split(/\s*(?:;|—|–|:\s+|,\s+(?:but|and|while|although|which|who|where|because)\s+)\s*/i);
    for (const piece of pieces) {
      const candidate = sentence(piece.replace(/^[,;:\-–—]+|[,;:\-–—]+$/g, ''));
      if (isComplete(candidate)) results.push(candidate);
    }
  }
  return unique(results);
};

const researchItems = Array.isArray(plan.research) ? plan.research : [];
const scoredResearch = researchItems
  .map((item) => {
    const titleTokens = words(item.title || '').map(normalize);
    const overlap = titleTokens.filter((token) => topicTokens.includes(token)).length;
    return {item, overlap};
  })
  .sort((a, b) => b.overlap - a.overlap);

const researchCandidates = scoredResearch
  .flatMap(({item, overlap}) => extractClauses(item.excerpt || '').map((line) => ({line, source: item.title || '', overlap})))
  .map((candidate) => {
    const lineTokens = words(candidate.line).map(normalize);
    const topicOverlap = lineTokens.filter((token) => topicTokens.includes(token)).length;
    const score = topicOverlap * 5 + candidate.overlap * 3 + Math.max(0, 16 - Math.abs(12 - lineTokens.length));
    return {...candidate, score};
  })
  .filter((candidate) => candidate.overlap > 0 || candidate.score >= 15)
  .sort((a, b) => b.score - a.score);

const genericByCategory = {
  science: {
    en: [
      'The mechanism begins when a measurable condition changes inside the system.',
      'That change affects one component before spreading through connected parts.',
      'Researchers compare the altered state with a controlled reference state.',
      'The strongest evidence comes from repeated measurements under the same conditions.',
      'A visible result appears only after several smaller interactions accumulate.',
      'Changing one variable reveals which step actually drives the observed effect.',
      'The process follows physical rules even when the outcome looks surprising.',
      'Limits in measurement explain why some details remain uncertain or debated.',
      'Independent experiments test whether the same relationship appears again.',
      'The final explanation connects the cause, mechanism, evidence, and observed result.',
    ],
    tr: [
      'Mekanizma sistemin içindeki ölçülebilir bir koşul değiştiğinde başlar.',
      'Bu değişim bağlantılı parçalara yayılmadan önce bir bileşeni etkiler.',
      'Araştırmacılar değişen durumu kontrollü bir referans durumuyla karşılaştırır.',
      'En güçlü kanıt aynı koşullarda tekrarlanan ölçümlerden gelir.',
      'Görünen sonuç birkaç küçük etkileşim biriktikten sonra ortaya çıkar.',
      'Tek değişkeni değiştirmek hangi adımın sonucu yönettiğini gösterir.',
      'Sonuç şaşırtıcı görünse bile süreç fiziksel kuralları izler.',
      'Ölçüm sınırları bazı ayrıntıların neden belirsiz kaldığını açıklar.',
      'Bağımsız deneyler aynı ilişkinin yeniden oluşup oluşmadığını sınar.',
      'Son açıklama nedeni, mekanizmayı, kanıtı ve gözlenen sonucu birbirine bağlar.',
    ],
  },
  history: {
    en: [
      'The story began before the famous event, while older pressures were already building.',
      'Geography shaped which people, goods, and armies could move through the region.',
      'Institutions turned local decisions into effects that reached far beyond one city.',
      'Documents reveal how leaders understood the risks at that particular moment.',
      'A critical decision changed the balance and opened opportunities for new actors.',
      'Trade routes carried both resources and information between distant communities.',
      'Resistance redirected the process but could not restore the earlier arrangement.',
      'Later accounts simplified a transformation that actually unfolded in several stages.',
      'The consequences continued after the main event disappeared from public attention.',
      'The outcome came from connected pressures rather than one isolated decision.',
    ],
    tr: [
      'Hikâye ünlü olaydan önce, eski baskılar büyürken başlamıştı.',
      'Coğrafya insanların, malların ve orduların hangi rotaları kullanacağını belirledi.',
      'Kurumlar yerel kararların etkisini tek bir kentin ötesine taşıdı.',
      'Belgeler yöneticilerin o andaki riskleri nasıl değerlendirdiğini gösterir.',
      'Kritik bir karar dengeyi değiştirerek yeni aktörlere alan açtı.',
      'Ticaret yolları uzak topluluklar arasında kaynak ve bilgi taşıdı.',
      'Direniş süreci yönlendirdi fakat önceki düzeni geri getiremedi.',
      'Sonraki anlatılar birkaç aşamada gerçekleşen dönüşümü basitleştirdi.',
      'Sonuçlar ana olay kamuoyundan kaybolduktan sonra da devam etti.',
      'Sonuç tek karardan değil, birbirine bağlanan baskılardan doğdu.',
    ],
  },
  technology: {
    en: [
      'The system begins by converting an outside input into machine-readable information.',
      'A processing layer separates useful signals from noise and incomplete data.',
      'Small components perform specialized tasks before passing results to the next stage.',
      'Shared rules keep those components synchronized while the workload changes.',
      'Memory stores intermediate states so the process can continue without restarting.',
      'A bottleneck appears when one stage receives information faster than it can respond.',
      'Error checks prevent a damaged signal from silently spreading through the system.',
      'The output emerges only after several layers combine their partial results.',
      'Efficiency depends on coordination, not simply on the speed of one component.',
      'The technology works because every layer transforms and verifies the same information.',
    ],
    tr: [
      'Sistem dışarıdan gelen girdiyi makinenin okuyabileceği bilgiye dönüştürerek başlar.',
      'İşleme katmanı yararlı sinyalleri gürültüden ve eksik veriden ayırır.',
      'Küçük bileşenler sonuçları sonraki aşamaya aktarmadan önce özel görevler yapar.',
      'Ortak kurallar iş yükü değişirken bileşenleri eşzamanlı tutar.',
      'Bellek ara durumları saklayarak sürecin yeniden başlamadan ilerlemesini sağlar.',
      'Bir aşama işleyebileceğinden hızlı veri aldığında darboğaz oluşur.',
      'Hata denetimleri bozuk sinyalin sistemde sessizce yayılmasını engeller.',
      'Çıktı birkaç katman kısmi sonuçlarını birleştirdikten sonra ortaya çıkar.',
      'Verim tek bileşenin hızından çok koordinasyona bağlıdır.',
      'Teknoloji her katman aynı bilgiyi dönüştürüp doğruladığı için çalışır.',
    ],
  },
};

const categoryFallback = genericByCategory[String(plan.category || 'science')] || genericByCategory.science;
const fallbackLines = language === 'tr' ? categoryFallback.tr : categoryFallback.en;
const candidateLines = unique([
  ...curatedLines.map(sentence),
  ...researchCandidates.map((candidate) => sentence(candidate.line)),
  ...fallbackLines.map(sentence),
]);

const selected = [];
for (const line of candidateLines) {
  if (!isComplete(line)) continue;
  const key = normalize(line);
  if (selected.some((existing) => normalize(existing) === key)) continue;
  selected.push(line);
  if (selected.length >= scenes.length) break;
}
if (selected.length < scenes.length) {
  throw new Error(`Content repair found only ${selected.length} complete lines for ${scenes.length} scenes`);
}

for (const [index, scene] of scenes.entries()) {
  const line = selected[index];
  scene.voiceLine = line;
  scene.title = words(line).slice(0, 4).join(' ').toLocaleUpperCase(locale).slice(0, 60);
  scene.kicker = words(line).slice(4, 10).join(' ').toLocaleUpperCase(locale).slice(0, 80);
  scene.sceneGoal = `Illustrate only this spoken claim: ${line}`;
  scene.contentRepairSource = curatedLines.length ? 'curated-topic-script' : index < researchCandidates.length ? 'ranked-complete-research' : 'category-fallback';
}

const totalWords = scenes.reduce((sum, scene) => sum + words(scene.voiceLine).length, 0);
const incomplete = scenes
  .map((scene, index) => ({index: index + 1, line: String(scene.voiceLine)}))
  .filter(({line}) => !isComplete(line));
const topicMentions = scenes.filter((scene) => {
  const lineTokens = words(scene.voiceLine).map(normalize);
  return lineTokens.some((token) => topicTokens.includes(token));
}).length;
if (incomplete.length || totalWords < 95 || totalWords > 150) {
  throw new Error(
    `Content repair QC failed: words=${totalWords}, incomplete=${incomplete.map((item) => item.index).join(',') || 'none'}`,
  );
}

plan.hook = scenes[0].voiceLine;
plan.narration = scenes.map((scene) => scene.voiceLine).join(' ');
plan.v3 = {
  ...(plan.v3 || {}),
  contentRepair: curatedLines.length ? 'curated-topic-script' : 'ranked-complete-research',
  contentRepairVersion: 1,
  contentRepairWordCount: totalWords,
  contentRepairTopicMentions: topicMentions,
  rejectedTruncatedResearch: researchCandidates.length < researchItems.length,
};
await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
console.log(
  `V3 content repair ready: source=${plan.v3.contentRepair}, scenes=${scenes.length}, ` +
  `words=${totalWords}, topicMentions=${topicMentions}`,
);
