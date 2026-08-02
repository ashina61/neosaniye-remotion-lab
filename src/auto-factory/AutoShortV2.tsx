import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig
} from 'remotion';
import planJson from '../../public/auto-factory/plan.json';
import {FactoryPlanSchema, type ScenePlan, type VisualBeat, type VisualKind} from './schema';

const plan = FactoryPlanSchema.parse(planJson);
const P = plan.palette;

const accentColor = (accent:ScenePlan['accent']) => ({red:P.red,teal:P.teal,gold:P.gold,blue:P.blue}[accent]);
const clamp = (value:number,min=0,max=1) => Math.max(min,Math.min(max,value));
const reveal = (progress:number,at:number,width=.16) => clamp((progress-at)/width);
const roughPolygon = (seed:number) => {
  const a=2+(seed%4); const b=97-(seed%3); const c=3+((seed*3)%5); const d=98-((seed*5)%4);
  return `polygon(${a}% 1%, ${b}% ${c}%, 99% ${d}%, ${96-(seed%4)}% 99%, ${c}% ${97-(seed%2)}%, 1% ${d-3}%)`;
};

const PaperTexture:React.FC<{opacity?:number}> = ({opacity=.12}) => (
  <AbsoluteFill style={{pointerEvents:'none',opacity,backgroundImage:
    'radial-gradient(circle at 22% 18%,rgba(55,43,31,.35) 0 1px,transparent 1.5px),'+
    'radial-gradient(circle at 68% 63%,rgba(55,43,31,.28) 0 1px,transparent 1.6px),'+
    'repeating-linear-gradient(5deg,transparent 0 9px,rgba(79,58,37,.08) 10px 11px)',
    backgroundSize:'34px 34px,47px 47px,100% 100%'}}/>
);

const Tape:React.FC<{x:number;y:number;rotation?:number;width?:number}> = ({x,y,rotation=0,width=150}) => (
  <div style={{position:'absolute',left:x,top:y,width,height:48,transform:`rotate(${rotation}deg)`,background:'rgba(239,225,174,.67)',boxShadow:'inset 0 0 12px rgba(104,77,43,.22)',clipPath:'polygon(3% 5%,98% 0,95% 100%,0 92%)'}}/>
);

const Pin:React.FC<{x:number;y:number;color:string;scale?:number}> = ({x,y,color,scale=1}) => (
  <div style={{position:'absolute',left:x-16*scale,top:y-16*scale,width:32*scale,height:32*scale,borderRadius:'50%',background:color,border:`5px solid ${P.ink}`,boxShadow:'4px 7px 8px rgba(25,18,12,.28)'}}/>
);

const RedString:React.FC<{x1:number;y1:number;x2:number;y2:number;progress:number;color?:string}> = ({x1,y1,x2,y2,progress,color=P.red}) => {
  const x=x1+(x2-x1)*progress; const y=y1+(y2-y1)*progress;
  return <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0,pointerEvents:'none'}}>
    <line x1={x1} y1={y1} x2={x} y2={y} stroke="rgba(38,26,18,.25)" strokeWidth="12" strokeLinecap="round"/>
    <line x1={x1} y1={y1} x2={x} y2={y} stroke={color} strokeWidth="6" strokeLinecap="round"/>
  </svg>;
};

const LabelCard:React.FC<React.PropsWithChildren<{x:number;y:number;accent?:string;rotation?:number;fontSize?:number;dark?:boolean;opacity?:number;maxWidth?:number}>> = ({children,x,y,accent,rotation=0,fontSize=34,dark=false,opacity=1,maxWidth=820}) => (
  <div style={{position:'absolute',left:x,top:y,maxWidth,padding:'15px 24px 13px',fontFamily:'Arial,Helvetica,sans-serif',fontWeight:950,fontSize,lineHeight:1.02,letterSpacing:.5,
    color:accent||dark?'#fff8e8':P.ink,background:accent??(dark?P.ink:'#f0e5c9'),border:`4px solid ${P.ink}`,borderRadius:12,
    boxShadow:'8px 10px 0 rgba(36,28,20,.2)',transform:`rotate(${rotation}deg)`,opacity}}>{children}</div>
);

const ArchiveMeta:React.FC<{scene:ScenePlan;opacity:number}> = ({scene,opacity}) => (
  <>
    <div style={{position:'absolute',left:68,top:284,fontFamily:'monospace',fontWeight:800,fontSize:21,letterSpacing:2,color:P.ink,opacity:.58*opacity}}>
      NEO/{String(scene.id).padStart(2,'0')} · DOSYA {plan.seed}
    </div>
    <div style={{position:'absolute',right:68,top:284,fontFamily:'monospace',fontWeight:800,fontSize:20,color:P.ink,opacity:.52*opacity}}>
      {scene.sourceNote?.slice(0,34) || plan.category.toLocaleUpperCase('tr-TR')}
    </div>
  </>
);

const SvgFrame:React.FC<React.PropsWithChildren<{seed:number}>> = ({seed,children}) => (
  <svg width="780" height="820" viewBox="0 0 780 820" style={{display:'block'}}>
    <defs>
      <filter id={`shadow-${seed}`} x="-30%" y="-30%" width="160%" height="170%">
        <feDropShadow dx="10" dy="15" stdDeviation="8" floodColor="#1d1712" floodOpacity=".28"/>
      </filter>
      <pattern id={`dots-${seed}`} width="12" height="12" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="3" r="1.6" fill={P.ink} opacity=".18"/>
      </pattern>
    </defs>
    <g filter={`url(#shadow-${seed})`}>
      <path d="M32 24 L748 16 L766 778 L720 804 L54 796 L18 742 Z" fill="#efe3c4" stroke={P.ink} strokeWidth="9"/>
    </g>
    <rect x="38" y="40" width="704" height="718" fill={`url(#dots-${seed})`} opacity=".32"/>
    {children}
  </svg>
);

const propText = (scene:ScenePlan,index:number,fallback:string) => scene.props[index] || fallback;

const VisualDrawing:React.FC<{scene:ScenePlan;progress:number;pulse:number}> = ({scene,progress,pulse}) => {
  const accent=accentColor(scene.accent);
  const p1=reveal(progress,.08,.22); const p2=reveal(progress,.28,.22); const p3=reveal(progress,.52,.2); const p4=reveal(progress,.72,.16);
  const common=(content:React.ReactNode)=><SvgFrame seed={scene.id}>{content}</SvgFrame>;
  const label=(x:number,y:number,text:string,color=accent,size=24)=><g transform={`translate(${x} ${y})`} opacity={p3}><rect x="-8" y="-31" width={Math.max(120,text.length*15)} height="46" rx="7" fill="#f7ecd0" stroke={P.ink} strokeWidth="4"/><text x="8" y="1" fontFamily="Arial" fontWeight="900" fontSize={size} fill={color}>{text.slice(0,24)}</text></g>;

  switch(scene.visualKind as VisualKind){
    case 'biology': return common(<>
      <g transform={`translate(385 388) scale(${.78+p1*.22})`}>
        <circle r="222" fill="#e0d3b3" stroke={P.ink} strokeWidth="10"/>
        <circle r="108" fill={P.blue} opacity=".65" stroke={P.ink} strokeWidth="8"/>
        {[0,1,2,3,4,5,6,7].map(i=>{const a=i*Math.PI/4+pulse*.08;return <g key={i} transform={`translate(${Math.cos(a)*170} ${Math.sin(a)*170}) rotate(${i*45})`}><path d="M-12 -34 L12 -34 L22 3 L0 28 L-22 3 Z" fill={i%2?accent:P.gold} stroke={P.ink} strokeWidth="6"/></g>})}
      </g>
      <path d="M118 165 C230 205 250 260 290 315" fill="none" stroke={P.red} strokeWidth="9" strokeDasharray="18 12" pathLength="1" strokeDashoffset={1-p2}/>
      <g opacity={p2} transform="translate(92 122)"><path d="M0 0 L38 65 L76 0 M38 65 V132" fill="none" stroke={P.teal} strokeWidth="15" strokeLinecap="round"/></g>
      {label(74,690,propText(scene,0,'HÜCRE'))}{label(500,170,propText(scene,1,'SİNYAL'),P.red)}
    </>);
    case 'portrait-dossier': return common(<>
      <g opacity={p1} transform={`translate(382 ${350-(1-p1)*70})`}>
        <ellipse cx="0" cy="-90" rx="105" ry="126" fill="#c8a98d" stroke={P.ink} strokeWidth="10"/>
        <path d="M-210 290 C-180 55 180 55 210 290 Z" fill={P.blue} stroke={P.ink} strokeWidth="11"/>
        <path d="M-92 -155 C-5 -218 98 -174 115 -82 C58 -122 -30 -125 -92 -76 Z" fill={P.ink}/>
      </g>
      <g opacity={p2}><rect x="55" y="90" width="210" height="122" rx="10" fill="#f5e9ca" stroke={P.ink} strokeWidth="7"/><path d="M78 130 H235 M78 164 H202" stroke="#8f7756" strokeWidth="8"/></g>
      <circle cx="608" cy="176" r={58+pulse*8} fill="none" stroke={accent} strokeWidth="10" opacity={p3}/>
      {label(55,690,propText(scene,0,'DOSYA'))}{label(505,650,propText(scene,1,'KANIT'),P.red)}
    </>);
    case 'object-exploded': return common(<>
      <g transform="translate(390 385)">
        <rect x="-112" y="-92" width="224" height="184" rx="38" fill={P.blue} stroke={P.ink} strokeWidth="11" opacity={p1}/>
        {[[-250,-170],[-260,120],[245,-155],[260,120],[0,-265],[0,260]].map(([x,y],i)=><g key={i} transform={`translate(${x*p2} ${y*p2}) rotate(${i*27})`} opacity={p2}><rect x="-52" y="-38" width="104" height="76" rx="16" fill={i%2?P.gold:accent} stroke={P.ink} strokeWidth="8"/><line x1={x>0?-52:52} y1="0" x2={x>0?-118:118} y2={-y*.18} stroke={P.red} strokeWidth="7" strokeDasharray="13 9"/></g>)}
      </g>
      {label(60,680,propText(scene,0,'PARÇA'))}{label(510,680,propText(scene,1,'SİSTEM'),P.teal)}
    </>);
    case 'archive-wall': return common(<>
      {[[75,95,-5],[300,80,3],[520,130,-4],[130,390,4],[405,405,-3]].map(([x,y,r],i)=><g key={i} transform={`translate(${x} ${y-(1-p1)*(i+1)*34}) rotate(${r})`} opacity={clamp(p1-i*.07)}><rect width="190" height="220" fill="#eee0bd" stroke={P.ink} strokeWidth="7"/><rect x="18" y="18" width="154" height="126" fill={i%2?'#8a9695':'#a9957a'}/><path d="M28 169 H160 M28 192 H126" stroke="#8d7555" strokeWidth="6"/></g>)}
      <path d="M170 180 C270 230 350 180 408 170 C500 156 570 240 620 260 M220 500 C340 430 430 520 520 500" fill="none" stroke={P.red} strokeWidth="7" strokeDasharray="14 10" pathLength="1" strokeDashoffset={1-p2}/>
      {[ [170,180],[408,170],[620,260],[220,500],[520,500] ].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="13" fill={i%2?accent:P.red} stroke={P.ink} strokeWidth="5" opacity={p3}/>)}
      {label(68,690,propText(scene,0,'ARŞİV'))}
    </>);
    case 'world-network': return common(<>
      <ellipse cx="390" cy="390" rx="275" ry="245" fill="#d7d6c4" stroke={P.ink} strokeWidth="10" opacity={p1}/>
      {[95,175].map(radius=><ellipse key={radius} cx="390" cy="390" rx={radius*1.45} ry={radius} fill="none" stroke={P.teal} strokeWidth="6" strokeDasharray="15 12" opacity={p2*.75}/>)}
      <path d="M120 340 C220 245 310 290 390 335 C490 395 555 280 665 245 M105 490 C220 540 330 500 410 475 C530 435 590 490 665 548" fill="none" stroke={accent} strokeWidth="12" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1-p2}/>
      {[[170,320],[300,270],[480,315],[610,265],[220,505],[430,470],[610,530]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r={15+pulse*5} fill={i%2?P.red:P.gold} stroke={P.ink} strokeWidth="6" opacity={p3}/>)}
      {label(270,700,propText(scene,0,'AĞ'))}
    </>);
    case 'currency': return common(<>
      {[0,1,2].map(i=><g key={i} transform={`translate(${90+i*165} ${190+i*105-(1-p1)*90}) rotate(${-8+i*7})`} opacity={p1}><rect width="330" height="180" rx="20" fill={i%2?'#d4dbb5':'#e4d6b3'} stroke={P.ink} strokeWidth="9"/><circle cx="165" cy="90" r="54" fill="#f4e9c9" stroke={P.ink} strokeWidth="7"/><text x="165" y="119" textAnchor="middle" fontFamily="Arial" fontSize="82" fontWeight="900" fill={accent}>$</text></g>)}
      {[0,1,2,3].map(i=><circle key={i} cx={180+i*116} cy={620-(i%2)*26} r="54" fill={P.gold} stroke={P.ink} strokeWidth="8" opacity={p2}/>) }
      <path d="M135 675 C290 590 440 660 640 560" fill="none" stroke={P.red} strokeWidth="9" strokeDasharray="16 11" pathLength="1" strokeDashoffset={1-p3}/>
      {label(60,100,propText(scene,0,'PARA'))}
    </>);
    case 'timeline': return common(<>
      <path d="M85 410 H690" stroke={P.ink} strokeWidth="16" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1-p1}/>
      {[0,1,2,3,4].map(i=>{const x=115+i*140;const up=i%2===0;const rp=reveal(progress,.16+i*.12,.15);return <g key={i} opacity={rp}><circle cx={x} cy="410" r="25" fill={i===4?accent:P.gold} stroke={P.ink} strokeWidth="8"/><line x1={x} y1="410" x2={x} y2={up?215:590} stroke={P.red} strokeWidth="7"/><rect x={x-75} y={up?125:590} width="150" height="84" rx="12" fill="#f1e5c7" stroke={P.ink} strokeWidth="6"/><text x={x} y={up?176:642} textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="20" fill={P.ink}>{scene.props[i%scene.props.length]?.slice(0,12)}</text></g>})}
    </>);
    case 'map-route': return common(<>
      <path d="M75 135 L210 75 L340 112 L445 72 L690 165 L650 335 L700 505 L525 650 L330 602 L180 650 L55 525 L95 365 Z" fill="#e9dec1" stroke={P.ink} strokeWidth="10" opacity={p1}/>
      <path d="M118 330 C225 220 300 280 390 345 C495 420 540 300 650 240" fill="none" stroke={accent} strokeWidth="15" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1-p2}/>
      <path d="M145 520 C250 420 355 485 435 535 C520 590 595 540 650 485" fill="none" stroke={P.gold} strokeWidth="10" strokeDasharray="19 13" pathLength="1" strokeDashoffset={1-p3}/>
      {[[118,330],[390,345],[650,240],[145,520],[435,535],[650,485]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r={17+pulse*3} fill={i%2?P.red:accent} stroke={P.ink} strokeWidth="6" opacity={p3}/>)}
      {label(70,690,propText(scene,0,'ROTA'))}
    </>);
    case 'factory': return common(<>
      <path d="M72 610 V290 L220 370 V260 L365 360 V310 L520 392 V610 Z" fill="#77878a" stroke={P.ink} strokeWidth="11" opacity={p1}/>
      <rect x="520" y="170" width="88" height="440" fill="#88654f" stroke={P.ink} strokeWidth="10" opacity={p1}/><rect x="630" y="112" width="62" height="498" fill="#66534a" stroke={P.ink} strokeWidth="10" opacity={p1}/>
      {[0,1,2,3].map(i=><rect key={i} x={115+i*100} y="460" width="62" height="75" fill={i%2?P.gold:P.blue} stroke={P.ink} strokeWidth="6" opacity={p2}/>) }
      {[0,1,2].map(i=><ellipse key={i} cx={555+i*66} cy={135-i*23-pulse*18} rx={38+i*7} ry={23+i*4} fill="#465154" opacity={.16+p3*.24}/>) }
      {label(65,680,propText(scene,0,'ÜRETİM'))}
    </>);
    case 'document': return common(<>
      <g transform={`translate(${105-(1-p1)*130} 88) rotate(-4)`}><path d="M0 0 H430 L510 80 V590 H0 Z" fill="#f2e6c8" stroke={P.ink} strokeWidth="10"/><path d="M430 0 V80 H510" fill="#d7c395" stroke={P.ink} strokeWidth="10"/>{[0,1,2,3,4,5,6].map(i=><line key={i} x1="56" y1={145+i*54} x2={405-i%2*62} y2={145+i*54} stroke="#8d7758" strokeWidth="8" opacity={p2}/>)}</g>
      <g transform={`translate(540 465) scale(${.2+p3*.8}) rotate(${18-p3*15})`}><circle r="105" fill="none" stroke={accent} strokeWidth="15"/><circle r="73" fill="none" stroke={accent} strokeWidth="6" strokeDasharray="12 8"/><text x="0" y="12" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="29" fill={accent}>{propText(scene,0,'BELGE').slice(0,12)}</text></g>
    </>);
    case 'treaty-table': return common(<>
      <ellipse cx="390" cy="430" rx="300" ry="165" fill="#76533b" stroke={P.ink} strokeWidth="12" opacity={p1}/><ellipse cx="390" cy="415" rx="215" ry="110" fill="#efe3c4" stroke={P.ink} strokeWidth="8" opacity={p1}/>
      {[0,1,2,3,4,5].map(i=>{const a=i*Math.PI/3;const x=390+Math.cos(a)*282;const y=415+Math.sin(a)*200;return <g key={i} transform={`translate(${x} ${y}) scale(${.72+p2*.28})`}><circle cy="-40" r="28" fill="#d1ad8e" stroke={P.ink} strokeWidth="6"/><rect x="-34" y="-8" width="68" height="94" rx="22" fill={i%2?P.blue:P.teal} stroke={P.ink} strokeWidth="6"/></g>})}
      <path d="M270 380 H510 M270 420 H480 M270 460 H450" stroke="#8e795a" strokeWidth="7" pathLength="1" strokeDasharray="1" strokeDashoffset={1-p3}/>
      {label(258,110,propText(scene,0,'ANLAŞMA'))}
    </>);
    case 'commodity': return common(<>
      {[0,1,2].map(i=><g key={i} transform={`translate(${80+i*190} ${330+i%2*45}) rotate(${-7+i*7})`} opacity={p1}><ellipse cx="82" cy="35" rx="78" ry="29" fill="#3f4c4e" stroke={P.ink} strokeWidth="8"/><rect x="4" y="35" width="156" height="250" fill={i===1?P.red:P.teal} stroke={P.ink} strokeWidth="8"/><ellipse cx="82" cy="285" rx="78" ry="29" fill="#354042" stroke={P.ink} strokeWidth="8"/><path d="M20 112 H144 M20 205 H144" stroke="#f3e7c7" strokeWidth="9"/></g>)}
      <path d="M65 280 C230 115 450 130 700 260" fill="none" stroke={accent} strokeWidth="14" pathLength="1" strokeDasharray="1" strokeDashoffset={1-p2}/>
      {label(75,665,propText(scene,0,'HAMMADDE'))}
    </>);
    case 'institution': return common(<>
      <path d="M115 282 L390 92 L665 282 Z" fill={P.gold} stroke={P.ink} strokeWidth="11" opacity={p1}/><rect x="115" y="282" width="550" height="345" fill="#efe3c4" stroke={P.ink} strokeWidth="11" opacity={p1}/>
      {[0,1,2,3,4].map(i=><rect key={i} x={160+i*105} y="315" width="62" height="250" fill={i%2?P.blue:P.teal} stroke={P.ink} strokeWidth="7" opacity={p2}/>) }
      <rect x="85" y="610" width="610" height="55" fill={P.ink} opacity={p3}/>
      <path d="M95 185 C220 235 290 255 390 280 C500 255 560 225 680 180" fill="none" stroke={accent} strokeWidth="8" strokeDasharray="16 12" pathLength="1" strokeDashoffset={1-p3}/>
      {label(80,690,propText(scene,0,'KURUM'))}
    </>);
    case 'link-break': return common(<>
      <g transform={`translate(${70-(1-p1)*80} 295) rotate(-7)`}><rect width="255" height="160" rx="22" fill="#d5dcb7" stroke={P.ink} strokeWidth="10"/><text x="127" y="105" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="48" fill={accent}>{propText(scene,0,'A').slice(0,8)}</text></g>
      <g transform={`translate(${450+(1-p1)*80} 290) rotate(7)`}><rect width="245" height="170" rx="22" fill={P.gold} stroke={P.ink} strokeWidth="10"/><text x="122" y="108" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="40" fill={P.ink}>{propText(scene,1,'B').slice(0,8)}</text></g>
      {[0,1,2,3].map(i=><g key={i} transform={`translate(${305+i*50+(i>1?p2*72:-p2*72)} ${380+(i%2)*8}) rotate(${i%2?12:-12})`}><rect x="-38" y="-24" width="76" height="48" rx="22" fill="none" stroke={P.ink} strokeWidth="13"/></g>)}
      <path d="M382 300 L415 350 L386 378 L430 430 L397 478" fill="none" stroke={P.red} strokeWidth={8+p3*11} opacity={p3}/>
    </>);
    case 'mechanism': return common(<>
      {[[250,300,130],[500,375,102],[315,555,78]].map(([x,y,r],i)=><g key={i} transform={`translate(${x} ${y}) rotate(${progress*(i%2?-145:120)})`} opacity={p1}><circle r={r} fill={i===0?'#eee2c4':i===1?P.gold:P.blue} stroke={P.ink} strokeWidth="10"/><circle r={r*.52} fill="none" stroke={accent} strokeWidth="9" strokeDasharray="18 13"/>{Array.from({length:10},(_,j)=><rect key={j} x={r-8} y="-12" width="36" height="24" rx="6" fill={P.ink} transform={`rotate(${j*36})`}/>)}</g>)}
      <path d="M80 175 C235 100 455 105 690 205 M80 690 C280 730 500 690 700 575" fill="none" stroke={accent} strokeWidth="10" strokeDasharray="20 15" pathLength="1" strokeDashoffset={1-p2}/>
      {label(70,660,propText(scene,0,'MEKANİZMA'))}
    </>);
    case 'crowd': return common(<>
      {Array.from({length:18},(_,i)=>{const x=82+(i%6)*122;const y=245+Math.floor(i/6)*165+(i%2)*18;const rp=clamp(p1-i*.025);return <g key={i} transform={`translate(${x} ${y-(1-rp)*105}) scale(${.76+(i%3)*.1})`} opacity={rp}><circle cy="-42" r="32" fill="#d4b393" stroke={P.ink} strokeWidth="6"/><rect x="-38" y="-10" width="76" height="112" rx="28" fill={i%3===0?accent:i%3===1?P.teal:P.blue} stroke={P.ink} strokeWidth="6"/></g>})}
      <path d="M70 700 H705" stroke={P.red} strokeWidth="13" pathLength="1" strokeDasharray="1" strokeDashoffset={1-p3}/>
      {label(70,100,propText(scene,0,'KALABALIK'))}
    </>);
    default: return common(<><circle cx="390" cy="390" r="230" fill="#e2d6b8" stroke={P.ink} strokeWidth="10"/><text x="390" y="405" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="42" fill={accent}>{propText(scene,0,'KONU')}</text></>);
  }
};

const BeatAnnotations:React.FC<{scene:ScenePlan;progress:number}> = ({scene,progress}) => {
  const accent=accentColor(scene.accent);
  const positions=[[70,1040],[704,970],[90,1195],[700,1165],[315,1320]];
  return <>
    {(scene.beats.length?scene.beats:[{at:.2,label:scene.props[0],action:'reveal'},{at:.55,label:scene.props[1],action:'connect'}] as VisualBeat[]).map((beat,index)=>{
      const amount=reveal(progress,beat.at,.12); const [x,y]=positions[index%positions.length];
      return <React.Fragment key={`${beat.label}-${index}`}>
        <LabelCard x={x} y={y} rotation={index%2===0?-2.2:2.4} fontSize={24} accent={index===0?accent:undefined} opacity={amount} maxWidth={285}>{beat.label.toLocaleUpperCase('tr-TR')}</LabelCard>
        {index<3 && <RedString x1={x+(index%2?30:205)} y1={y+18} x2={360+index*120} y2={810+index*55} progress={amount} color={index===1?P.gold:accent}/>} 
        <Pin x={x+(index%2?22:210)} y={y+18} color={index===1?P.gold:accent} scale={amount}/>
      </React.Fragment>;
    })}
  </>;
};

const TransitionOverlay:React.FC<{scene:ScenePlan;frame:number}> = ({scene,frame}) => {
  const accent=accentColor(scene.accent);
  const p=interpolate(frame,[0,10],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  switch(scene.transition){
    case 'film-burn': return <AbsoluteFill style={{pointerEvents:'none',opacity:1-p,background:`radial-gradient(circle at ${25+scene.id*9%65}% ${35+scene.id*7%45}%,#fff4c7 0 10%,${accent} 24%,#21160e 67%)`,mixBlendMode:'screen'}}/>;
    case 'paper-tear': return <div style={{position:'absolute',inset:-100,background:'#f1e5c7',clipPath:`polygon(0 0,${105-p*112}% 0,${92-p*112}% 20%,${100-p*112}% 43%,${89-p*112}% 66%,${98-p*112}% 100%,0 100%)`,borderRight:`16px solid ${P.ink}`,zIndex:40}}/>;
    case 'dossier-slide': return <AbsoluteFill style={{background:P.ink,transform:`translateX(${p*112}%) rotate(${(1-p)*-2}deg)`,boxShadow:'-30px 0 60px rgba(0,0,0,.45)',zIndex:40}}/>;
    case 'split-shutter': return <><div style={{position:'absolute',left:0,top:0,bottom:0,width:'50%',background:P.ink,transform:`translateX(${-p*104}%)`,zIndex:40}}/><div style={{position:'absolute',right:0,top:0,bottom:0,width:'50%',background:P.ink,transform:`translateX(${p*104}%)`,zIndex:40}}/></>;
    case 'match-zoom': return <AbsoluteFill style={{background:`radial-gradient(circle,transparent ${p*78}%,${accent} ${p*78+1}%,${P.ink} ${p*93+2}%)`,opacity:1-p*.95,zIndex:40}}/>;
    default: return <AbsoluteFill style={{background:P.ink,clipPath:`circle(${p*115}% at ${20+scene.id*13%65}% ${30+scene.id*11%55}%)`,opacity:1-p,zIndex:40}}/>;
  }
};

const Scene:React.FC<{scene:ScenePlan}> = ({scene}) => {
  const frame=useCurrentFrame(); const {fps}=useVideoConfig(); const frames=Math.round(scene.duration*fps);
  const progress=clamp(frame/Math.max(1,frames-1));
  const enter=spring({frame,fps,config:{damping:17,stiffness:120,mass:.72}});
  const pulse=(Math.sin(Math.floor(frame/2)*.18)+1)/2;
  const titleIn=spring({frame:frame-2,fps,config:{damping:15,stiffness:155,mass:.7}});
  const accent=accentColor(scene.accent);
  const cameraX=scene.motion==='drift'?interpolate(progress,[0,1],[-18,18]):scene.motion==='parallax'?interpolate(progress,[0,1],[-26,22]):0;
  const cameraY=scene.motion==='push'?interpolate(progress,[0,1],[18,-18]):0;
  const zoom=scene.motion==='rack-focus'?1.035+Math.sin(progress*Math.PI)*.022:1.0+progress*.052;
  const assetBlur=scene.motion==='rack-focus'?interpolate(progress,[0,.35,.65,1],[4,0,0,3]):0;
  const mainLeft=scene.layout==='split-left'?30:scene.layout==='split-right'?270:scene.layout==='diagonal'?150:scene.layout==='dossier'?80:150;
  const mainTop=scene.layout==='macro'?330:340;
  const mainScale=scene.layout==='macro'?1.08:scene.layout==='overhead'?.92:.98;

  return <AbsoluteFill style={{background:P.paper,overflow:'hidden'}}>
    <AbsoluteFill style={{background:'linear-gradient(132deg,rgba(255,248,222,.52),rgba(139,104,64,.10) 52%,rgba(36,28,21,.17))'}}/>
    <PaperTexture opacity={.16}/>
    <ArchiveMeta scene={scene} opacity={enter}/>
    <div style={{position:'absolute',left:mainLeft,top:mainTop,width:780,height:820,transform:`translate(${cameraX}px,${cameraY}px) scale(${mainScale*zoom}) rotate(${scene.layout==='diagonal'?-3:scene.layout==='split-right'?2:-.6}deg)`,transformOrigin:'50% 45%',opacity:enter}}>
      {scene.asset && <Img src={staticFile(scene.asset)} style={{position:'absolute',left:24,top:22,width:732,height:756,objectFit:'cover',clipPath:roughPolygon(scene.id),filter:`sepia(.25) saturate(.72) contrast(1.08) blur(${assetBlur}px)`,opacity:.34}}/>}
      <VisualDrawing scene={scene} progress={progress} pulse={pulse}/>
      <Tape x={80} y={-18} rotation={-5+scene.id%5} width={160}/><Tape x={565} y={760} rotation={3-scene.id%4} width={145}/>
    </div>
    <BeatAnnotations scene={scene} progress={progress}/>
    {scene.id===1 ? <>
      <LabelCard x={70} y={74} accent={accent} rotation={-2} fontSize={scene.title.length>30?43:54} opacity={titleIn} maxWidth={920}>{scene.title}</LabelCard>
      <LabelCard x={105} y={185} rotation={1.6} fontSize={31} opacity={titleIn} maxWidth={830}>{scene.kicker}</LabelCard>
      <div style={{position:'absolute',left:760,top:84,width:190,height:190,border:`10px solid ${accent}`,borderRadius:'50%',transform:`scale(${.55+titleIn*.45}) rotate(${progress*10}deg)`,opacity:titleIn*.78}}/>
    </> : <>
      <LabelCard x={72} y={82} accent={accent} rotation={scene.id%2?-1.5:1.2} fontSize={scene.title.length>28?42:50} opacity={titleIn} maxWidth={880}>{scene.title}</LabelCard>
      <LabelCard x={102} y={184} rotation={scene.id%2?1.2:-1} fontSize={27} opacity={titleIn*.96} maxWidth={800}>{scene.kicker}</LabelCard>
    </>}
    <div style={{position:'absolute',left:54,right:54,bottom:72,height:110,borderTop:`2px solid rgba(39,34,29,.26)`,opacity:.55}}>
      <div style={{position:'absolute',left:0,top:24,fontFamily:'monospace',fontSize:18,fontWeight:800,color:P.ink}}>ARCHIVE / {String(scene.id).padStart(2,'0')}</div>
      <div style={{position:'absolute',right:0,top:24,fontFamily:'monospace',fontSize:18,fontWeight:800,color:P.ink}}>{Math.round(scene.start*10)/10}s — {Math.round((scene.start+scene.duration)*10)/10}s</div>
    </div>
    <TransitionOverlay scene={scene} frame={frame}/>
  </AbsoluteFill>;
};

const GlobalFilm:React.FC = () => {
  const frame=useCurrentFrame(); const jitter=((frame*19)%11)-5;
  return <AbsoluteFill style={{pointerEvents:'none'}}>
    <AbsoluteFill style={{opacity:.055,backgroundImage:'repeating-linear-gradient(0deg,transparent 0 5px,rgba(42,31,22,.22) 6px)',transform:`translateY(${jitter}px)`}}/>
    <AbsoluteFill style={{background:'radial-gradient(circle at 50% 43%,transparent 48%,rgba(29,22,16,.32) 100%)'}}/>
    <AbsoluteFill style={{opacity:.05,backgroundImage:'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27150%27 height=%27150%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%27.8%27 numOctaves=%272%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27 opacity=%27.55%27/%3E%3C/svg%3E")'}}/>
  </AbsoluteFill>;
};

const FinalFade:React.FC = () => {
  const frame=useCurrentFrame(); const {durationInFrames}=useVideoConfig();
  return <AbsoluteFill style={{background:'#111615',opacity:interpolate(frame,[durationInFrames-34,durationInFrames-1],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}}/>;
};

export const AutoShortV2:React.FC = () => <AbsoluteFill style={{background:P.paper}}>
  <Audio src={staticFile('auto-factory/audio/final.wav')}/>
  {plan.scenes.map(scene=><Sequence key={scene.id} from={Math.round(scene.start*plan.fps)} durationInFrames={Math.round(scene.duration*plan.fps)}><Scene scene={scene}/></Sequence>)}
  <GlobalFilm/>
  <FinalFade/>
</AbsoluteFill>;

export const AUTO_FACTORY_V2_FRAMES=Math.round(plan.duration*plan.fps);
