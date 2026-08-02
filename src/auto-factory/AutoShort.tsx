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
import {FactoryPlanSchema, type ScenePlan, type VisualKind} from './schema';

const plan = FactoryPlanSchema.parse(planJson);
const P = plan.palette;

const accentColor = (accent: ScenePlan['accent']) => ({
  red: P.red,
  teal: P.teal,
  gold: P.gold,
  blue: P.blue
}[accent]);

const PaperCard: React.FC<React.PropsWithChildren<{style?: React.CSSProperties; dark?: boolean}>> = ({children, style, dark}) => (
  <div style={{
    position: 'absolute',
    background: dark ? P.ink : '#f0e6ca',
    color: dark ? '#f7efd9' : P.ink,
    border: `5px solid ${P.ink}`,
    borderRadius: 24,
    boxShadow: '12px 16px 0 rgba(39,34,29,.24), 0 24px 60px rgba(26,20,14,.24)',
    overflow: 'hidden',
    ...style
  }}>{children}</div>
);

const Label: React.FC<React.PropsWithChildren<{style?: React.CSSProperties; accent?: string; dark?: boolean}>> = ({children, style, accent, dark}) => (
  <div style={{
    position: 'absolute',
    padding: '15px 24px 13px',
    borderRadius: 13,
    border: `4px solid ${P.ink}`,
    background: accent ?? (dark ? P.ink : '#f2e8cc'),
    color: accent || dark ? '#fff7e7' : P.ink,
    fontFamily: 'Arial, sans-serif',
    fontWeight: 950,
    letterSpacing: 1,
    boxShadow: '7px 9px 0 rgba(38,31,24,.22)',
    ...style
  }}>{children}</div>
);

const Arrow: React.FC<{x1:number;y1:number;x2:number;y2:number;color:string;progress:number;width?:number}> = ({x1,y1,x2,y2,color,progress,width=10}) => {
  const x = x1 + (x2 - x1) * progress;
  const y = y1 + (y2 - y1) * progress;
  const angle = Math.atan2(y2-y1, x2-x1);
  return <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute', inset:0, pointerEvents:'none'}}>
    <line x1={x1} y1={y1} x2={x} y2={y} stroke={color} strokeWidth={width} strokeLinecap="round" />
    {progress > .78 && <polygon points={`${x},${y} ${x-Math.cos(angle-.7)*34},${y-Math.sin(angle-.7)*34} ${x-Math.cos(angle+.7)*34},${y-Math.sin(angle+.7)*34}`} fill={color} />}
  </svg>;
};

const MiniProp: React.FC<{text:string; index:number; enter:number; accent:string; side:'left'|'right'}> = ({text,index,enter,accent,side}) => {
  const y = 1080 + index * 118;
  return <PaperCard style={{
    width: 250,
    minHeight: 82,
    [side]: 46 + (index % 2) * 20,
    top: y,
    padding: '20px 18px',
    transform: `translateX(${(1-enter) * (side === 'left' ? -330 : 330)}px) rotate(${side === 'left' ? -3 + index : 3-index}deg)`,
    opacity: enter
  }}>
    <div style={{fontFamily:'Arial', fontWeight:950, fontSize:27, lineHeight:1.05}}>{text}</div>
    <div style={{height:8, width:`${58 + index*12}%`, background:accent, marginTop:14, borderRadius:8}} />
  </PaperCard>;
};

const WorldNetwork: React.FC<{progress:number; pulse:number; accent:string}> = ({progress,pulse,accent}) => (
  <svg width="760" height="700" viewBox="0 0 760 700">
    <ellipse cx="380" cy="345" rx="266" ry="245" fill="#526f9d33" stroke={P.ink} strokeWidth="10" />
    {[95,175].map(r => <ellipse key={r} cx="380" cy="345" rx={r*1.45} ry={r} fill="none" stroke={P.teal} strokeWidth="6" strokeDasharray="16 13" opacity=".72" />)}
    <path d="M125 290 C210 240 300 230 380 260 C470 292 550 270 640 225 M118 420 C225 470 328 454 406 424 C510 385 586 405 650 462" fill="none" stroke={P.gold} strokeWidth="12" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1-progress} />
    {[[190,270],[300,210],[470,235],[580,310],[225,430],[410,450],[560,410]].map(([x,y],i)=><g key={i} transform={`translate(${x} ${y}) scale(${.7 + pulse*.18})`}>
      <circle r="19" fill={i%2?accent:P.red} stroke={P.ink} strokeWidth="6" />
      <circle r={34+i%3*5} fill="none" stroke={accent} strokeWidth="4" opacity={.35+pulse*.35} />
    </g>)}
    <g transform={`translate(380 345) scale(${1+pulse*.05})`}>
      <circle r="92" fill="#f0e6ca" stroke={P.ink} strokeWidth="10" />
      <text x="0" y="31" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="96" fill={accent}>$</text>
    </g>
  </svg>
);

const CurrencyMachine: React.FC<{progress:number; spin:number; accent:string}> = ({progress,spin,accent}) => (
  <svg width="760" height="700" viewBox="0 0 760 700">
    <g transform={`translate(80 ${150-progress*45}) rotate(-7)`}>
      <rect width="360" height="210" rx="24" fill="#d7ddb7" stroke={P.ink} strokeWidth="10" />
      <rect x="28" y="28" width="304" height="154" rx="18" fill="none" stroke={P.teal} strokeWidth="6" />
      <circle cx="180" cy="105" r="58" fill="#f3ead0" stroke={P.ink} strokeWidth="7" />
      <text x="180" y="135" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="90" fill={accent}>$</text>
    </g>
    <g transform={`translate(470 145) rotate(${spin*2})`}>
      <circle cx="100" cy="100" r="94" fill={P.gold} stroke={P.ink} strokeWidth="10" />
      <circle cx="100" cy="100" r="62" fill="none" stroke="#fff2b5" strokeWidth="7" strokeDasharray="11 9" />
      <text x="100" y="123" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="66" fill={P.ink}>AU</text>
    </g>
    {[0,1,2,3].map(i=><g key={i} transform={`translate(${120+i*135} ${470+i%2*18})`}>
      <rect width="116" height="88" rx="11" fill={i%2?P.blue:P.gold} stroke={P.ink} strokeWidth="7" />
      <path d="M18 44 H98" stroke="#fff4d7" strokeWidth="6" />
    </g>)}
    <path d="M390 290 C420 350 480 370 545 350" fill="none" stroke={accent} strokeWidth="12" strokeDasharray="18 12" pathLength="1" strokeDashoffset={1-progress} />
  </svg>
);

const Timeline: React.FC<{progress:number; accent:string}> = ({progress,accent}) => (
  <svg width="760" height="700" viewBox="0 0 760 700">
    <path d="M90 350 H670" stroke={P.ink} strokeWidth="16" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1-progress} />
    {[0,1,2,3,4].map((i)=>{
      const x=110+i*135; const up=i%2===0;
      return <g key={i} opacity={interpolate(progress,[i*.12,i*.12+.18],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}>
        <circle cx={x} cy="350" r="24" fill={i===4?accent:P.gold} stroke={P.ink} strokeWidth="8" />
        <line x1={x} y1="350" x2={x} y2={up?190:520} stroke={P.red} strokeWidth="7" />
        <rect x={x-72} y={up?94:520} width="144" height="92" rx="15" fill="#f0e6ca" stroke={P.ink} strokeWidth="7" />
        <text x={x} y={up?150:575} textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="28" fill={P.ink}>{['BAŞLANGIÇ','KIRILMA','YAYILMA','KRİZ','BUGÜN'][i]}</text>
      </g>;
    })}
  </svg>
);

const MapRoute: React.FC<{progress:number; accent:string; pulse:number}> = ({progress,accent,pulse}) => (
  <svg width="760" height="700" viewBox="0 0 760 700">
    <path d="M70 128 L204 72 L336 102 L430 72 L690 155 L650 330 L690 480 L524 610 L320 570 L188 620 L64 510 L98 360 Z" fill="#efe4c6" stroke={P.ink} strokeWidth="10" />
    <path d="M120 300 C210 210 305 250 378 315 C470 395 530 290 638 235" fill="none" stroke={accent} strokeWidth="15" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1-progress} />
    <path d="M150 470 C250 390 360 450 430 500 C510 560 590 520 642 455" fill="none" stroke={P.gold} strokeWidth="10" strokeDasharray="20 14" pathLength="1" strokeDashoffset={1-progress} />
    {[[120,300],[378,315],[638,235],[150,470],[430,500],[642,455]].map(([x,y],i)=><g key={i} transform={`translate(${x} ${y}) scale(${.8+pulse*.2})`}><circle r="20" fill={i%2?P.red:accent} stroke={P.ink} strokeWidth="7" /></g>)}
    <g transform={`translate(${interpolate(progress,[0,1],[100,610])} ${interpolate(progress,[0,1],[300,240])}) rotate(-8)`}>
      <path d="M-48 8 H42 L68 20 L42 33 H-48 Z" fill={P.blue} stroke={P.ink} strokeWidth="6" />
      <rect x="-15" y="-18" width="36" height="28" fill="#f0e6ca" stroke={P.ink} strokeWidth="5" />
    </g>
  </svg>
);

const Factory: React.FC<{progress:number; pulse:number; accent:string}> = ({progress,pulse,accent}) => (
  <svg width="760" height="700" viewBox="0 0 760 700">
    <path d="M75 565 V260 L220 335 V240 L365 330 V285 L520 360 V565 Z" fill="#718388" stroke={P.ink} strokeWidth="10" />
    <rect x="520" y="165" width="88" height="400" fill="#8d6955" stroke={P.ink} strokeWidth="10" />
    <rect x="628" y="105" width="62" height="460" fill="#66534b" stroke={P.ink} strokeWidth="10" />
    {[0,1,2,3].map(i=><rect key={i} x={120+i*100} y="420" width="62" height="72" fill={i%2?P.gold:P.blue} stroke={P.ink} strokeWidth="6" />)}
    {[0,1,2].map(i=><ellipse key={i} cx={560+i*70} cy={130-i*26-progress*20} rx={44+i*8} ry={27+i*5} fill="#4b5558" opacity={.28+pulse*.18} />)}
    <path d="M80 610 H680" stroke={accent} strokeWidth="14" strokeDasharray="24 16" pathLength="1" strokeDashoffset={1-progress} />
  </svg>
);

const Document: React.FC<{progress:number; stamp:number; accent:string}> = ({progress,stamp,accent}) => (
  <svg width="760" height="700" viewBox="0 0 760 700">
    <g transform={`translate(${95-(1-progress)*130} 85) rotate(-4)`}>
      <path d="M0 0 H420 L500 80 V560 H0 Z" fill="#f2e8cc" stroke={P.ink} strokeWidth="10" />
      <path d="M420 0 V80 H500" fill="#dbc89e" stroke={P.ink} strokeWidth="10" />
      {[0,1,2,3,4,5].map(i=><line key={i} x1="55" y1={130+i*58} x2={390-i%2*55} y2={130+i*58} stroke="#8e7a5b" strokeWidth="8" />)}
    </g>
    <g transform={`translate(455 360) scale(${.2+stamp*.8}) rotate(${20-stamp*16})`}>
      <circle r="106" fill="none" stroke={accent} strokeWidth="15" />
      <circle r="76" fill="none" stroke={accent} strokeWidth="6" strokeDasharray="12 8" />
      <text x="0" y="13" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="34" fill={accent}>ONAY</text>
    </g>
  </svg>
);

const TreatyTable: React.FC<{progress:number; accent:string; pulse:number}> = ({progress,accent,pulse}) => (
  <svg width="760" height="700" viewBox="0 0 760 700">
    <ellipse cx="380" cy="370" rx="290" ry="160" fill="#7a573c" stroke={P.ink} strokeWidth="12" />
    <ellipse cx="380" cy="355" rx="210" ry="105" fill="#f0e6ca" stroke={P.ink} strokeWidth="8" />
    {[0,1,2,3,4,5].map(i=>{const a=i*Math.PI/3; const x=380+Math.cos(a)*275; const y=355+Math.sin(a)*190; return <g key={i} transform={`translate(${x} ${y}) scale(${.8+pulse*.08})`}><circle cy="-42" r="28" fill="#d7b79a" stroke={P.ink} strokeWidth="6"/><rect x="-34" y="-10" width="68" height="92" rx="22" fill={i%2?P.blue:P.teal} stroke={P.ink} strokeWidth="6"/></g>})}
    <path d="M260 325 H500 M260 360 H470 M260 395 H445" stroke="#8d795b" strokeWidth="7" pathLength="1" strokeDasharray="1" strokeDashoffset={1-progress} />
    <circle cx="520" cy="420" r="62" fill="none" stroke={accent} strokeWidth="10" opacity={progress} />
  </svg>
);

const Commodity: React.FC<{progress:number; spin:number; accent:string}> = ({progress,spin,accent}) => (
  <svg width="760" height="700" viewBox="0 0 760 700">
    {[0,1,2].map(i=><g key={i} transform={`translate(${90+i*165} ${350+i%2*35}) rotate(${(i-1)*7+spin*.4})`}>
      <ellipse cx="80" cy="35" rx="75" ry="28" fill="#404e51" stroke={P.ink} strokeWidth="8" />
      <rect x="5" y="35" width="150" height="220" fill={i===1?P.red:P.teal} stroke={P.ink} strokeWidth="8" />
      <ellipse cx="80" cy="255" rx="75" ry="28" fill="#354144" stroke={P.ink} strokeWidth="8" />
      <path d="M20 105 H140 M20 185 H140" stroke="#f0e6ca" strokeWidth="9" />
      <text x="80" y="165" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="54" fill="#fff2d2">OIL</text>
    </g>)}
    <path d="M60 300 C210 135 430 140 690 270" fill="none" stroke={accent} strokeWidth="14" pathLength="1" strokeDasharray="1" strokeDashoffset={1-progress} />
    <g transform={`translate(${interpolate(progress,[0,1],[60,650])} ${interpolate(progress,[0,1],[300,270])})`}><circle r="24" fill={P.gold} stroke={P.ink} strokeWidth="7"/></g>
  </svg>
);

const Institution: React.FC<{progress:number; pulse:number; accent:string}> = ({progress,pulse,accent}) => (
  <svg width="760" height="700" viewBox="0 0 760 700">
    <path d="M120 250 L380 90 L640 250 Z" fill={P.gold} stroke={P.ink} strokeWidth="11" />
    <rect x="120" y="250" width="520" height="330" fill="#f0e6ca" stroke={P.ink} strokeWidth="11" />
    {[0,1,2,3,4].map(i=><rect key={i} x={160+i*100} y="280" width="58" height="245" fill={i%2?P.blue:P.teal} stroke={P.ink} strokeWidth="7" />)}
    <rect x="90" y="570" width="580" height="55" fill={P.ink} />
    {[[105,170],[655,170],[80,430],[680,430]].map(([x,y],i)=><g key={i} transform={`translate(${x} ${y}) scale(${.75+pulse*.18})`}><circle r="25" fill={i%2?accent:P.red} stroke={P.ink} strokeWidth="7"/><circle r="43" fill="none" stroke={accent} strokeWidth="4" opacity={progress}/></g>)}
    <path d="M105 170 C210 215 260 230 380 250 C500 230 560 210 655 170 M80 430 C210 400 290 390 380 420 C470 390 560 405 680 430" fill="none" stroke={accent} strokeWidth="8" strokeDasharray="16 12" pathLength="1" strokeDashoffset={1-progress} />
  </svg>
);

const LinkBreak: React.FC<{progress:number; shake:number; accent:string}> = ({progress,shake,accent}) => (
  <svg width="760" height="700" viewBox="0 0 760 700">
    <g transform={`translate(${80-shake} 250) rotate(-8)`}><rect width="250" height="150" rx="22" fill="#d7ddb7" stroke={P.ink} strokeWidth="10"/><text x="125" y="110" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="90" fill={accent}>$</text></g>
    <g transform={`translate(${435+shake} 240) rotate(7)`}><rect width="240" height="160" rx="22" fill={P.gold} stroke={P.ink} strokeWidth="10"/><text x="120" y="105" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="52" fill={P.ink}>ALTIN</text></g>
    {[0,1,2,3].map(i=><g key={i} transform={`translate(${300+i*48+(i>1?progress*65:-progress*65)} ${330+(i%2)*7}) rotate(${i%2?12:-12})`}><rect x="-36" y="-22" width="72" height="44" rx="20" fill="none" stroke={P.ink} strokeWidth="13"/></g>)}
    <path d="M365 265 L395 315 L370 340 L410 390 L378 430" fill="none" stroke={P.red} strokeWidth={8+progress*12} opacity={progress} />
    {[0,1,2,3,4,5].map(i=><line key={i} x1="385" y1="345" x2={385+Math.cos(i*Math.PI/3)*progress*150} y2={345+Math.sin(i*Math.PI/3)*progress*150} stroke={accent} strokeWidth="7" opacity={progress}/>) }
  </svg>
);

const Mechanism: React.FC<{progress:number; spin:number; accent:string}> = ({progress,spin,accent}) => (
  <svg width="760" height="700" viewBox="0 0 760 700">
    {[[250,280,128],[475,350,98],[300,500,76]].map(([x,y,r],i)=><g key={i} transform={`translate(${x} ${y}) rotate(${spin*(i%2? -2.2:1.7)})`}>
      <circle r={r} fill={i===0?'#f0e6ca':i===1?P.gold:P.blue} stroke={P.ink} strokeWidth="10" />
      <circle r={r*.52} fill="none" stroke={accent} strokeWidth="9" strokeDasharray="18 13" />
      {Array.from({length:10},(_,j)=><rect key={j} x={r-8} y="-12" width="35" height="24" rx="6" fill={P.ink} transform={`rotate(${j*36})`} />)}
    </g>)}
    <path d="M90 180 C230 100 430 90 670 190 M90 610 C270 650 480 630 680 520" fill="none" stroke={accent} strokeWidth="10" strokeDasharray="20 15" pathLength="1" strokeDashoffset={1-progress} />
  </svg>
);

const Crowd: React.FC<{progress:number; pulse:number; accent:string}> = ({progress,pulse,accent}) => (
  <svg width="760" height="700" viewBox="0 0 760 700">
    {Array.from({length:18},(_,i)=>{const x=80+(i%6)*120; const y=210+Math.floor(i/6)*155+(i%2)*18; const s=.75+(i%3)*.12; return <g key={i} transform={`translate(${x} ${y-(1-progress)*120}) scale(${s+pulse*.025})`} opacity={Math.min(1,progress*2-i*.015)}><circle cy="-42" r="32" fill="#d9b89b" stroke={P.ink} strokeWidth="6"/><rect x="-38" y="-10" width="76" height="110" rx="28" fill={i%3===0?accent:i%3===1?P.teal:P.blue} stroke={P.ink} strokeWidth="6"/></g>})}
    <path d="M70 620 H690" stroke={P.red} strokeWidth="13" pathLength="1" strokeDasharray="1" strokeDashoffset={1-progress} />
  </svg>
);

const Illustration: React.FC<{kind:VisualKind; progress:number; pulse:number; spin:number; accent:string}> = ({kind,progress,pulse,spin,accent}) => {
  switch(kind){
    case 'world-network': return <WorldNetwork progress={progress} pulse={pulse} accent={accent}/>;
    case 'currency': return <CurrencyMachine progress={progress} spin={spin} accent={accent}/>;
    case 'timeline': return <Timeline progress={progress} accent={accent}/>;
    case 'map-route': return <MapRoute progress={progress} pulse={pulse} accent={accent}/>;
    case 'factory': return <Factory progress={progress} pulse={pulse} accent={accent}/>;
    case 'document': return <Document progress={progress} stamp={pulse} accent={accent}/>;
    case 'treaty-table': return <TreatyTable progress={progress} pulse={pulse} accent={accent}/>;
    case 'commodity': return <Commodity progress={progress} spin={spin} accent={accent}/>;
    case 'institution': return <Institution progress={progress} pulse={pulse} accent={accent}/>;
    case 'link-break': return <LinkBreak progress={progress} shake={Math.sin(spin*.08)*progress*22} accent={accent}/>;
    case 'mechanism': return <Mechanism progress={progress} spin={spin} accent={accent}/>;
    case 'crowd': return <Crowd progress={progress} pulse={pulse} accent={accent}/>;
  }
};

const layoutStyle = (layout: ScenePlan['layout']): React.CSSProperties => {
  switch(layout){
    case 'split-left': return {left:32, top:335, transform:'rotate(-2deg) scale(.92)'};
    case 'split-right': return {right:25, top:340, transform:'rotate(2deg) scale(.92)'};
    case 'diagonal': return {left:130, top:340, transform:'rotate(-5deg) scale(.9)'};
    case 'overhead': return {left:155, top:325, transform:'rotate(1deg) scale(.88)'};
    case 'stacked': return {left:150, top:365, transform:'scale(.88)'};
    default: return {left:155, top:340, transform:'scale(.9)'};
  }
};

const Transition: React.FC<{type:ScenePlan['transition']; frame:number; accent:string}> = ({type,frame,accent}) => {
  const p = interpolate(frame,[0,8],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  if(type==='flash-cut') return <AbsoluteFill style={{background:'#fff9e8', opacity:interpolate(frame,[0,2,7],[.9,.35,0],{extrapolateRight:'clamp'})}}/>;
  if(type==='paper-swipe') return <div style={{position:'absolute',inset:-80,background:'#f0e6ca',clipPath:`polygon(0 0, ${100-p*110}% 0, ${88-p*110}% 100%, 0 100%)`,borderRight:`18px solid ${P.ink}`}}/>;
  if(type==='zoom-through') return <AbsoluteFill style={{background:`radial-gradient(circle, transparent ${p*60}%, ${accent} ${p*60+2}%, ${P.ink} ${p*80+4}%)`,opacity:1-p*.9}}/>;
  return <AbsoluteFill style={{background:P.ink,clipPath:`circle(${p*95}% at ${25+p*45}% ${35+p*20}%)`,opacity:1-p}}/>;
};

const Scene: React.FC<{scene:ScenePlan}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const frames = Math.max(1,Math.round(scene.duration*fps));
  const enter = spring({frame,fps,config:{damping:16,stiffness:115,mass:.72}});
  const progress = interpolate(frame,[0,Math.max(1,frames-10)],[0,1],{extrapolateRight:'clamp'});
  const stepped = Math.floor(frame/2)*2;
  const pulse = (Math.sin(stepped*.16)+1)/2;
  const spin = stepped*1.35;
  const accent = accentColor(scene.accent);
  const cameraScale = interpolate(progress,[0,1],[1.0,1.055]);
  const cameraX = scene.motion==='drift'?interpolate(progress,[0,1],[-18,18]):0;
  const cameraY = scene.motion==='push'?interpolate(progress,[0,1],[22,-12]):0;
  const titleIn = spring({frame:frame-2,fps,config:{damping:15,stiffness:145}});
  const propIn = scene.props.map((_,i)=>spring({frame:frame-(12+i*5),fps,config:{damping:16,stiffness:125}}));

  return <AbsoluteFill style={{background:P.paper,overflow:'hidden'}}>
    {scene.asset && <Img src={staticFile(scene.asset)} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',filter:'sepia(.25) contrast(1.05) saturate(.7)',opacity:.3,transform:`scale(${1.08+progress*.06}) translateX(${cameraX*.25}px)`}}/>}
    <AbsoluteFill style={{background:'radial-gradient(circle at 50% 42%, rgba(255,248,222,.56), rgba(116,93,61,.12) 58%, rgba(31,26,21,.32) 100%)'}}/>
    <div style={{position:'absolute',inset:0,transform:`translate(${cameraX}px,${cameraY}px) scale(${cameraScale})`,transformOrigin:'50% 48%'}}>
      <PaperCard style={{...layoutStyle(scene.layout),width:760,height:710,opacity:enter,transform:`${layoutStyle(scene.layout).transform ?? ''} translateY(${(1-enter)*150}px)`}}>
        <Illustration kind={scene.visualKind} progress={progress} pulse={pulse} spin={spin} accent={accent}/>
      </PaperCard>
      <Arrow x1={180} y1={1035} x2={440} y2={910} color={accent} progress={Math.max(0,(progress-.18)/.55)} />
      {scene.props.slice(0,4).map((prop,i)=><MiniProp key={prop+i} text={prop} index={i%2} enter={propIn[i] ?? 0} accent={accent} side={i%2===0?'left':'right'} />)}
    </div>
    <Label accent={accent} style={{left:78,top:96,fontSize:scene.title.length>26?44:56,transform:`translateY(${(1-titleIn)*-120}px) rotate(-1.4deg)`,opacity:titleIn,maxWidth:900}}>{scene.title}</Label>
    <Label style={{left:100,top:205,fontSize:29,transform:`translateX(${(1-titleIn)*-180}px) rotate(1deg)`,opacity:titleIn*.96,maxWidth:850}}>{scene.kicker}</Label>
    <div style={{position:'absolute',left:0,right:0,bottom:0,height:175,background:'linear-gradient(transparent,rgba(34,27,20,.23))'}}/>
    <Transition type={scene.transition} frame={frame} accent={accent}/>
  </AbsoluteFill>;
};

const FilmLook: React.FC = () => {
  const frame = useCurrentFrame();
  const jitter = ((frame*17)%9)-4;
  return <AbsoluteFill style={{pointerEvents:'none'}}>
    <AbsoluteFill style={{opacity:.11,backgroundImage:'repeating-linear-gradient(0deg,transparent 0 5px,rgba(55,42,28,.2) 6px)',transform:`translateY(${jitter}px)`}}/>
    <AbsoluteFill style={{background:'radial-gradient(circle at center,transparent 52%,rgba(28,22,17,.36) 100%)'}}/>
    <AbsoluteFill style={{opacity:.06,backgroundImage:'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27140%27 height=%27140%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%27.85%27 numOctaves=%272%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27 opacity=%27.5%27/%3E%3C/svg%3E")'}}/>
  </AbsoluteFill>;
};

const EndFade: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  return <AbsoluteFill style={{background:'#111615',opacity:interpolate(frame,[durationInFrames-42,durationInFrames-1],[0,1],{extrapolateLeft:'clamp'})}}/>;
};

export const AutoShort: React.FC = () => <AbsoluteFill style={{background:P.paper}}>
  <Audio src={staticFile('auto-factory/audio/final.wav')} />
  {plan.scenes.map(scene=><Sequence key={scene.id} from={Math.round(scene.start*plan.fps)} durationInFrames={Math.max(1,Math.round(scene.duration*plan.fps))}><Scene scene={scene}/></Sequence>)}
  <FilmLook/>
  <EndFade/>
</AbsoluteFill>;

export const AUTO_FACTORY_FRAMES = Math.round(plan.duration*plan.fps);
