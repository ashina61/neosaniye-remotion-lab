import {appendFile, readFile, writeFile} from 'node:fs/promises';
import {FactoryPlanSchema, type ScenePlan, type VisualKind} from '../../src/auto-factory/schema.js';

const planPath=process.env.PLAN_PATH||'public/auto-factory/plan.json';
const manifestPath=process.env.MANIFEST_PATH||'public/auto-factory/manifest.json';
const plan=JSON.parse(await readFile(planPath,'utf8')) as any;
const locale=plan.language==='tr'?'tr-TR':'en-US';
const normalize=(value:string)=>value.toLocaleLowerCase(locale).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9çğıöşü]+/gi,' ').replace(/\s+/g,' ').trim();
const tokens=(value:string)=>normalize(value).split(' ').filter((word)=>word.length>2);
const uniq=<T,>(values:T[])=>[...new Set(values)];
const overlap=(a:string[],b:string[])=>{const right=new Set(b);return a.length?uniq(a).filter((x)=>right.has(x)).length/uniq(a).length:0;};
const upper=(value:string)=>value.toLocaleUpperCase(locale);
const title=(value:string)=>upper(value.split(/\s+/).slice(0,5).join(' ')).slice(0,60);

const layouts=['hero','comparison','macro','process','dossier','overhead','split-left','evidence','split-right','cinematic-wide','diagonal','stacked'] as const;
const transitions=['match-zoom','object-match','paper-tear','diagram-morph','film-burn','dossier-slide','camera-whip','ink-wipe','split-shutter','paper-swipe'] as const;
const accents=['red','teal','gold','blue'] as const;

const profileDefinitions=[
  {
    id:'antibiotic-resistance',
    match:['antibiyotik direnci','antibiotic resistance'],
    forbidden:['aşı','antikor','bagisiklik hafizasi','vaccine','antibody'],
    scenes:[
      ['Antibiyotik bakterilerin hepsini öldürmez.','İLK TEMAS','antibiyotik kapsülü bakteri kolonisine iner',['antibiyotik kapsülü','bakteri kolonisi','petri kabı'],'microbe-field','macro','reveal'],
      ['Koloninin çoğu ilaç karşısında hızla ölür.','ÇOĞU ELENİR','solan ve parçalanarak kaybolan hassas bakteriler',['hassas bakteriler','ölüm halkası','azalan koloni'],'selection-process','comparison','eliminate'],
      ['Fakat birkaç dirençli bakteri hayatta kalır.','HAYATTA KALANLAR','ilaç halkasının ortasında kalan renkli dirençli bakteri',['dirençli bakteri','ilaç halkası','hayatta kalma'],'selection-process','hero','highlight'],
      ['Bunlar çoğaldıkça yeni koloni direnç kazanır.','DİRENÇ ÇOĞALIR','tek dirençli bakterinin çok sayıda kopyaya bölünmesi',['çoğalma','dirençli koloni','kopyalanma'],'microbe-field','process','multiply'],
      ['Direnç bazen mutasyonla tesadüfen ortaya çıkar.','MUTASYON','bakteri DNA zincirindeki tek değişen gen bölgesi',['DNA','mutasyon noktası','direnç geni'],'object-exploded','macro','focus'],
      ['Bazen bakteriler direnç genlerini birbirine aktarır.','GEN AKTARIMI','iki bakteri arasında taşınan plazmid halkası',['plazmid','gen köprüsü','alıcı bakteri'],'gene-transfer','profile','transfer'],
      ['Bu aktarım farklı türler arasında bile olabilir.','TÜRLER ARASI','farklı biçimli bakteriler arasında dolaşan gen halkası',['farklı bakteri türleri','plazmid','yatay aktarım'],'gene-transfer','wide','connect'],
      ['Yanlış antibiyotik seçimi hassasları gereksizce eler.','YANLIŞ İLAÇ','yanlış hedefe yönelen kapsül ve elenen hassas bakteriler',['yanlış antibiyotik','hassas bakteri','seçilim baskısı'],'cause-effect','comparison','eliminate'],
      ['Tedaviyi erken bırakmak dirençlilere zaman kazandırır.','ERKEN BIRAKMA','yarım kalan ilaç takvimi yanında yeniden büyüyen bakteriler',['yarım tedavi','takvim','yeniden çoğalma'],'before-after','dossier','swap'],
      ['Gereksiz kullanım hastanelerde seçilim baskısını büyütür.','SEÇİLİM BASKISI','hastane koridoru üzerinde giderek daralan ilaç filtresi',['hastane','antibiyotik kullanımı','seçilim filtresi'],'process-flow','cinematic-wide','connect'],
      ['Dirençli bakteriler insan ve çevre arasında yayılır.','YAYILMA','insan hastane hayvan ve su arasında bakteri rotaları',['insan','hastane','hayvan','su'],'map-evolution','wide','connect'],
      ['Sonra sıradan enfeksiyonların tedavisi zorlaşır.','TEDAVİ ZORLAŞIR','etkisiz kapsüllerin önünde büyüyen enfeksiyon kolonisi',['etkisiz ilaç','enfeksiyon','artan risk'],'before-after','comparison','highlight'],
      ['Çözüm doğru ilaç doğru doz ve doğru süredir.','DOĞRU KULLANIM','ilaç doz saat ve süreyi birleştiren üç parçalı protokol',['doğru ilaç','doğru doz','doğru süre'],'evidence-board','overhead','stamp'],
      ['Direnci yaratan bakteri değil yanlış seçilimdir.','ASIL MEKANİZMA','hassas bakteriden dirençli koloniye giden net seçilim şeması',['seçilim','hayatta kalan','dirençli koloni'],'process-flow','hero','connect']
    ]
  },
  {
    id:'vaccine-immunity',
    match:['aşılar bağışıklık','aşı bağışıklık','vaccine immunity'],
    forbidden:['antibiyotik direnci','plazmid','antibiotic resistance'],
    scenes:[
      ['Aşı hastalığı değil hedefin güvenli işaretini gösterir.','GÜVENLİ İŞARET','aşı içinden çıkan güvenli antijen parçası',['aşı','antijen','güvenli işaret'],'biology','macro','reveal'],
      ['Bağışıklık hücreleri bu işareti yakalayıp inceler.','İLK TANIŞMA','antijeni yakalayan bağışıklık hücresi',['antijen','sunucu hücre','tanıma'],'biology','hero','focus'],
      ['İşaret diğer savunma hücrelerine sunulur.','SİNYAL AKTARIMI','hücreler arasında taşınan antijen sinyali',['sunum','T hücresi','sinyal'],'gene-transfer','profile','transfer'],
      ['B hücreleri hedefe uygun antikor üretmeye başlar.','ANTİKOR ÜRETİMİ','B hücresinden çıkan hedefe uygun Y biçimli antikorlar',['B hücresi','antikor','hedef'],'process-flow','process','multiply'],
      ['Bazı hücreler uzun süreli hafıza hücresine dönüşür.','HAFIZA','aktif hücreden hafıza hücresine dönüşüm',['hafıza hücresi','dönüşüm','uzun süre'],'before-after','comparison','swap'],
      ['Gerçek mikrop geldiğinde işaret hemen tanınır.','İKİNCİ KARŞILAŞMA','mikrop üzerindeki aynı antijenin hızlı eşleşmesi',['mikrop','antijen','eşleşme'],'object-exploded','macro','highlight'],
      ['Hafıza hücreleri savunmayı çok daha hızlı başlatır.','HIZLI TEPKİ','hafıza hücresinden hızla yayılan savunma ağı',['hafıza hücresi','hızlı yanıt','savunma ağı'],'world-network','hero','connect'],
      ['Antikorlar hedefe bağlanıp hücrelere girişini engeller.','BLOKAJ','antikorların mikrobu hücre kapısından uzak tutması',['antikor','mikrop','hücre kapısı'],'cause-effect','comparison','eliminate'],
      ['T hücreleri enfekte hücreleri ayrıca temizleyebilir.','HÜCRESEL YANIT','T hücresinin enfekte hücreyi hedeflemesi',['T hücresi','enfekte hücre','temizleme'],'selection-process','profile','eliminate'],
      ['Bu yüzden hastalık daha hafif geçirilebilir.','DAHA HAFİF','ağır ve hafif hastalık sonuçlarının karşılaştırılması',['ağır hastalık','hafif hastalık','koruma'],'before-after','comparison','swap'],
      ['Koruma her aşıda aynı süre devam etmez.','SÜRE DEĞİŞİR','farklı hızlarda azalan bağışıklık zaman çizgileri',['zaman','koruma düzeyi','farklı aşılar'],'timeline','wide','trace'],
      ['Hatırlatma dozu hafıza yanıtını yeniden güçlendirir.','HATIRLATMA DOZU','azalan hafıza eğrisinin dozla tekrar yükselmesi',['hatırlatma dozu','hafıza','yükselen yanıt'],'timeline','process','highlight'],
      ['Toplumda yayılım azalınca kırılgan kişiler de korunur.','TOPLUMSAL ETKİ','bağlantılı insanlar arasında kesilen bulaşma zinciri',['toplum','bulaşma zinciri','koruma'],'world-network','wide','eliminate'],
      ['Aşının asıl gücü bağışıklığa önceden prova yaptırmasıdır.','ASIL GÜÇ','güvenli prova ile gerçek karşılaşmanın eşleşmesi',['prova','hafıza','hızlı yanıt'],'evidence-board','hero','connect']
    ]
  },
  {
    id:'dna-copy',
    match:['dna kendini nasıl kopyalıyor','dna replication','dna kopya'],
    forbidden:['antikor','aşı','bakteri direnci'],
    scenes:[
      ['DNA kopyalanmadan önce çift sarmal açılır.','SARMAL AÇILIR','fermuar gibi ayrılan DNA çift sarmalı',['çift sarmal','açılma noktası','helikaz'],'object-exploded','macro','reveal'],
      ['Helikaz iki zinciri birbirinden ayırır.','HELİKAZ','DNA üzerinde ilerleyen helikaz enzimi',['helikaz','iki zincir','replikasyon çatalı'],'mechanism','profile','trace'],
      ['Her eski zincir yeni kopyaya kalıp olur.','KALIP ZİNCİR','eski zincir yanında oluşacak boş eş zincir',['kalıp zincir','yeni zincir','eşleşme'],'before-after','comparison','swap'],
      ['Serbest nükleotitler uygun bazlarla eşleşir.','BAZ EŞLEŞMESİ','A T ve G C eşleşmelerinin yerine oturması',['A-T','G-C','nükleotit'],'process-flow','macro','connect'],
      ['Primaz başlangıç için kısa bir primer bırakır.','BAŞLANGIÇ PRİMERİ','DNA üzerine yerleşen kısa RNA primeri',['primaz','RNA primeri','başlangıç'],'document','macro','stamp'],
      ['DNA polimeraz yeni zinciri adım adım uzatır.','POLİMERAZ','nükleotit ekleyerek ilerleyen DNA polimeraz',['DNA polimeraz','yeni zincir','nükleotit'],'mechanism','profile','multiply'],
      ['Bir zincir kesintisiz biçimde ilerler.','ÖNCÜ ZİNCİR','tek yönde sürekli uzayan yeni DNA zinciri',['öncü zincir','sürekli sentez','ilerleme'],'timeline','wide','trace'],
      ['Diğer zincir küçük parçalar halinde üretilir.','GECİKEN ZİNCİR','ayrı Okazaki parçaları halinde oluşan zincir',['geciken zincir','Okazaki parçaları','aralıklar'],'object-exploded','comparison','reveal'],
      ['Ligaz bu parçaları tek zincirde birleştirir.','LİGAZ','Okazaki parçaları arasındaki boşlukları kapatan enzim',['ligaz','birleşme','tam zincir'],'gene-transfer','profile','connect'],
      ['Polimeraz yanlış eşleşmeleri ayrıca kontrol eder.','HATA KONTROLÜ','yanlış bazı geri çıkaran kontrol mekanizması',['yanlış baz','kontrol','düzeltme'],'evidence-board','overhead','focus'],
      ['Hataların çoğu kopya tamamlanmadan düzeltilir.','DÜZELTME','hatalı ve düzeltilmiş DNA bölümünün karşılaştırılması',['hata','düzeltme','doğru eşleşme'],'before-after','comparison','swap'],
      ['Sonuçta iki neredeyse aynı DNA molekülü oluşur.','İKİ KOPYA','bir sarmaldan ayrılan iki yeni DNA molekülü',['iki DNA','eski zincir','yeni zincir'],'process-flow','wide','multiply'],
      ['Her yeni DNA bir eski zincir taşır.','YARI KORUNUMLU','eski ve yeni renklerden oluşan iki çift sarmal',['eski zincir','yeni zincir','yarı korunum'],'comparison','comparison','highlight'],
      ['Böylece hücre bölünürken bilgi iki hücreye aktarılır.','BİLGİ AKTARIMI','iki yavru hücreye giden eş DNA kopyaları',['hücre bölünmesi','DNA kopyası','iki hücre'],'biology','hero','transfer']
    ]
  }
] as const;

const topicText=normalize(plan.topic);
const profile=profileDefinitions.find((candidate)=>candidate.match.some((term)=>topicText.includes(normalize(term))));

const kindFor=(text:string):VisualKind=>{
  const t=normalize(text);
  if(/bakter|mikrop|hücre|virus|antikor/.test(t))return 'biology';
  if(/gen|dna|plazmid|aktar/.test(t))return 'gene-transfer';
  if(/harita|rota|ülke|yayıl/.test(t))return 'map-evolution';
  if(/önce|sonra|değiş|karşılaştır/.test(t))return 'before-after';
  if(/belge|kanıt|rapor|protokol/.test(t))return 'evidence-board';
  if(/süreç|adım|mekanizma|oluş/.test(t))return 'process-flow';
  return 'object-exploded';
};

const concreteWords=(line:string)=>uniq(tokens(line).filter((word)=>!['önce','sonra','daha','çok','gibi','için','olan','olarak','şekilde','sistem'].includes(word))).slice(0,5);
const targetCount=plan.duration<=43?13:plan.duration<=47?14:15;
let sourceScenes=[...plan.scenes];

if(profile){
  sourceScenes=profile.scenes.slice(0,targetCount).map((entry,index)=>{
    const [voiceLine,kicker,hero,support,visualKind,shotType,beatAction]=entry;
    const existing=plan.scenes[index%plan.scenes.length]||{};
    return {
      ...existing,
      voiceLine,
      title:kicker,
      kicker:index===0?upper(plan.topic):upper(String(hero).split(' ').slice(0,4).join(' ')),
      heroVisual:hero,
      supportVisuals:support,
      props:support.map((value)=>upper(value)).slice(0,6),
      visualKind,
      shotType,
      beats:[
        {at:.14,label:hero,action:'reveal'},
        {at:.42,label:support[0],action:beatAction},
        {at:.68,label:support[1]||support[0],action:index%3===0?'focus':'connect'}
      ],
      forbiddenTags:profile.forbidden,
      conceptTags:uniq([...tokens(voiceLine),...support.flatMap((value)=>tokens(value))]).slice(0,10),
      sceneGoal:`Show exactly how: ${voiceLine}`,
      sourceNote:`V3 profile: ${profile.id}`,
      imagePrompt:`Vertical 9:16 premium editorial documentary collage. Main subject: ${hero}. Supporting details: ${support.join(', ')}. Concrete scientifically meaningful visual, layered paper cutouts, archival diagram, no readable text, no logo.`,
      visualSignature:`${profile.id}:${index}:${hero}`
    };
  });
}else{
  sourceScenes=plan.scenes.slice(0,targetCount).map((scene:any,index:number)=>{
    const concepts=concreteWords(scene.voiceLine||scene.title||plan.topic);
    const hero=concepts.slice(0,2).join(' ')||plan.topic;
    const support=uniq([...(scene.props||[]).map(String),...concepts.slice(1),...tokens(plan.topic).slice(0,2)]).slice(0,4);
    return {
      ...scene,
      heroVisual:hero,
      supportVisuals:support,
      props:support.map(upper).slice(0,6),
      visualKind:kindFor(`${scene.voiceLine} ${hero}`),
      shotType:(['macro','wide','overhead','profile','diagram','dossier','comparison'] as const)[index%7],
      sceneGoal:`Illustrate only this spoken claim: ${scene.voiceLine}`,
      conceptTags:uniq([...tokens(scene.voiceLine),...tokens(hero)]).slice(0,10),
      forbiddenTags:[],
      visualSignature:`generic:${index}:${hero}`,
      beats:[
        {at:.15,label:hero,action:'reveal'},
        {at:.43,label:support[0]||hero,action:'focus'},
        {at:.7,label:support[1]||hero,action:'connect'}
      ]
    };
  });
}

const duration=Number(plan.duration||46);
const hookDuration=2.75;
const finalDuration=4.0;
const middle=(duration-hookDuration-finalDuration)/Math.max(1,sourceScenes.length-2);
let cursor=0;
const usedSignatures=new Set<string>();
const scenes:ScenePlan[]=sourceScenes.map((raw:any,index:number)=>{
  const sceneDuration=index===0?hookDuration:index===sourceScenes.length-1?finalDuration:middle;
  const signature=usedSignatures.has(raw.visualSignature)?`${raw.visualSignature}:${index}`:raw.visualSignature;
  usedSignatures.add(signature);
  const lineTokens=tokens(raw.voiceLine||'');
  const visualTokens=uniq([...tokens(raw.heroVisual||''),...(raw.supportVisuals||[]).flatMap((value:string)=>tokens(value))]);
  const alignmentScore=Math.min(1,overlap(lineTokens,visualTokens)+.35);
  const result={
    ...raw,
    id:index+1,
    start:Number(cursor.toFixed(3)),
    duration:Number(sceneDuration.toFixed(3)),
    voiceStart:.04,
    voiceEndPadding:.06,
    title:title(raw.title||raw.heroVisual||`Sahne ${index+1}`),
    kicker:upper(raw.kicker||raw.sceneGoal||'').slice(0,80),
    layout:layouts[index%layouts.length],
    transition:transitions[index%transitions.length],
    motion:(raw.motion||(['push','compare','multiply','trace','transfer','draw'] as const)[index%6]),
    accent:accents[index%accents.length],
    sfx:index===0?'impact':index===5?'click':index===9?'paper':index===sourceScenes.length-1?'pulse':'none',
    visualSignature:signature,
    alignmentScore,
    continuityGroup:profile?.id||'topic-main',
    detailLevel:3
  };
  cursor+=sceneDuration;
  return result;
});
scenes[scenes.length-1].duration=Number((duration-scenes[scenes.length-1].start).toFixed(3));

const duplicateHeroes=scenes.filter((scene,index)=>scenes.findIndex((other)=>normalize(other.heroVisual)===normalize(scene.heroVisual))!==index);
if(duplicateHeroes.length)throw new Error(`V3 duplicate hero visuals: ${duplicateHeroes.map((scene)=>scene.heroVisual).join(', ')}`);
if(scenes.some((scene)=>scene.alignmentScore<.34))throw new Error('V3 scene-to-voice alignment score below threshold');

plan.version=3;
plan.scenes=scenes;
plan.narration=scenes.map((scene)=>scene.voiceLine).join(' ').replace(/\s+/g,' ').trim();
plan.v3={planner:'topic-locked',audioMode:'continuous-word-timed',maxSilenceGap:.32,repetitionThreshold:.72,profile:profile?.id||'generic-topic-locked'};
FactoryPlanSchema.parse(plan);
await writeFile(planPath,JSON.stringify(plan,null,2),'utf8');

try{
  const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
  manifest.factoryVersion=3;
  manifest.v3={profile:plan.v3.profile,sceneCount:scenes.length,duplicateHeroCount:0,minAlignmentScore:Math.min(...scenes.map((scene)=>scene.alignmentScore))};
  await writeFile(manifestPath,JSON.stringify(manifest,null,2),'utf8');
}catch{}
if(process.env.GITHUB_OUTPUT)await appendFile(process.env.GITHUB_OUTPUT,`scene_count=${scenes.length}\nprofile=${plan.v3.profile}\n`);
console.log(`V3 topic lock hazır: ${plan.v3.profile} | ${scenes.length} sahne | minimum alignment ${Math.min(...scenes.map((scene)=>scene.alignmentScore)).toFixed(2)}`);
