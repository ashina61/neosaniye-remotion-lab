import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import planJson from '../../public/auto-factory/plan.json';

type Scene = {
  id: number;
  start: number;
  duration: number;
  voiceLine?: string;
  v9Blueprint?: {
    sceneFamily?: string;
    sceneArchetype?: string;
    worldEntities?: string[];
  };
};

type Plan = {fps: number; scenes: Scene[]};
const plan = planJson as unknown as Plan;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => {const x = clamp(v); return x * x * (3 - 2 * x);};
const alpha = (hex: string, opacity: number) => `${hex}${Math.round(clamp(opacity) * 255).toString(16).padStart(2, '0')}`;

const C = {bg:'#080a0d', paper:'#eadfc7', ink:'#17191d', red:'#b64a3a', teal:'#247c7a', gold:'#d9ae4a', blue:'#415a73'};

const Frame: React.FC<{children: React.ReactNode; progress: number}> = ({children, progress}) => (
  <div style={{position:'absolute',left:24,right:24,top:278,bottom:205,overflow:'hidden',background:C.bg,border:`2px solid ${alpha(C.paper,.22)}`,boxShadow:'0 24px 65px rgba(0,0,0,.65)'}}>
    {children}
    <AbsoluteFill style={{pointerEvents:'none',opacity:.18,backgroundImage:`radial-gradient(circle, ${alpha(C.paper,.16)} 0 1px, transparent 1.3px)`,backgroundSize:'14px 14px',transform:`translate(${Math.sin(progress*6.28)*3}px,${Math.cos(progress*5.1)*3}px)`}}/>
  </div>
);

const Label: React.FC<{children: React.ReactNode; dark?: boolean}> = ({children,dark}) => (
  <div style={{position:'absolute',left:38,top:34,padding:'10px 14px',fontFamily:'Arial Black, Arial',fontSize:24,letterSpacing:.5,color:dark?C.ink:C.paper,background:dark?alpha(C.paper,.78):alpha(C.bg,.7),borderLeft:`7px solid ${C.red}`}}>{children}</div>
);

const RouteOverview: React.FC<{p:number}> = ({p}) => (
  <>
    <Label dark>CHINA → HUBS → EUROPE</Label>
    <svg viewBox="0 0 1000 900" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}>
      <path d="M40 180 C160 65 310 80 420 190 C535 305 650 185 795 150 C910 125 985 235 955 350 C920 485 760 505 650 560 C525 625 430 720 290 680 C140 640 45 500 25 345 Z" fill={alpha(C.teal,.28)} stroke={C.ink} strokeWidth="8"/>
      <path d="M900 610 C760 520 640 525 520 455 S315 360 115 305" fill="none" stroke={alpha(C.ink,.25)} strokeWidth="32" strokeLinecap="round"/>
      <path d="M900 610 C760 520 640 525 520 455 S315 360 115 305" fill="none" stroke={C.red} strokeWidth="12" strokeLinecap="round" strokeDasharray="18 14" strokeDashoffset={950*(1-p)}/>
      {[[900,610],[720,525],[520,455],[330,375],[115,305]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i===0||i===4?25:17} fill={i%2?C.teal:C.gold} stroke={C.ink} strokeWidth="7" opacity={ease(p*1.4-i*.08)}/>) }
      <g transform={`translate(${900-785*p} ${610-305*p})`}><path d="M-28 4 L18 -17 L42 0 L18 17 Z" fill={C.red} stroke={C.ink} strokeWidth="6"/></g>
    </svg>
  </>
);

const CaravanJourney: React.FC<{p:number}> = ({p}) => (
  <>
    <Label>CARAVAN JOURNEY</Label>
    <svg viewBox="0 0 1000 900" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}>
      <path d="M0 620 L120 430 L245 580 L390 330 L545 570 L690 410 L850 575 L1000 390 L1000 900 L0 900 Z" fill={C.blue} opacity=".8"/>
      <path d="M0 715 C170 625 350 770 520 675 S820 620 1000 690 L1000 900 L0 900 Z" fill={C.gold}/>
      {[0,1,2].map((i)=><g key={i} transform={`translate(${90+i*270+p*65} ${525+i%2*30}) scale(${.85+i*.08})`} opacity={ease(p*2-i*.18)}>
        <path d="M35 95 C55 55 90 50 112 86 C135 48 175 50 197 90 L215 120 L70 125 Z" fill={C.gold} stroke={C.ink} strokeWidth="8"/>
        <path d="M185 88 C210 48 235 42 248 56 C260 70 247 92 225 110" fill="none" stroke={C.ink} strokeWidth="14" strokeLinecap="round"/>
        <path d="M85 120 L78 180 M125 120 L120 180 M175 120 L184 180 M205 116 L220 174" stroke={C.ink} strokeWidth="10"/>
        <rect x="112" y="70" width="62" height="38" fill={C.red} stroke={C.ink} strokeWidth="6"/>
      </g>)}
    </svg>
  </>
);

const OasisRelayCity: React.FC<{p:number}> = ({p}) => (
  <>
    <Label dark>OASIS RELAY CITY</Label>
    <svg viewBox="0 0 1000 900" style={{position:'absolute',inset:0,width:'100%',height:'100%',background:C.paper}}>
      <path d="M70 745 C260 650 370 765 520 690 S760 610 930 655" fill="none" stroke={C.gold} strokeWidth="12" strokeDasharray="20 16" strokeDashoffset={850*(1-p)}/>
      {[120,315,520,735].map((x,i)=><g key={i} transform={`translate(${x} ${560-(i%2)*55})`} opacity={ease(p*1.7-i*.12)}>
        <path d="M0 165 L0 55 L42 55 L55 0 L105 0 L118 55 L160 55 L160 165 Z" fill={i%2?C.teal:C.red} stroke={C.ink} strokeWidth="8"/>
        <path d="M55 165 L55 105 Q80 70 105 105 L105 165" fill={C.bg}/>
      </g>)}
      {[205,520,835].map((x,i)=><circle key={x} cx={x} cy={700-i*18} r="22" fill={i===1?C.red:C.teal} stroke={C.ink} strokeWidth="7" opacity={ease(p*1.8-i*.1)}/>) }
    </svg>
  </>
);

const MarketHandoff: React.FC<{p:number}> = ({p}) => (
  <>
    <Label dark>GOODS CHANGE HANDS</Label>
    <svg viewBox="0 0 1000 900" style={{position:'absolute',inset:0,width:'100%',height:'100%',background:C.paper}}>
      {[90,680].map((x,i)=><g key={x} transform={`translate(${x} 300)`}>
        <path d="M0 130 L45 0 L225 0 L270 130 Z" fill={i?C.teal:C.red} stroke={C.ink} strokeWidth="8"/>
        <rect x="20" y="130" width="230" height="330" fill={alpha(i?C.teal:C.red,.5)} stroke={C.ink} strokeWidth="8"/>
        {[0,1,2].map((j)=><rect key={j} x={45+j*58} y={250+(j%2)*28} width="50" height="50" fill={C.gold} stroke={C.ink} strokeWidth="6"/>)}
      </g>)}
      <g transform="translate(360 350)"><circle cx="70" cy="55" r="38" fill={C.gold} stroke={C.ink} strokeWidth="8"/><path d="M25 105 L115 105 L140 310 L0 310 Z" fill={C.red} stroke={C.ink} strokeWidth="8"/></g>
      <g transform="translate(520 350)"><circle cx="70" cy="55" r="38" fill={C.gold} stroke={C.ink} strokeWidth="8"/><path d="M25 105 L115 105 L140 310 L0 310 Z" fill={C.teal} stroke={C.ink} strokeWidth="8"/></g>
      <rect x={420+120*p} y="520" width="84" height="70" rx="8" fill={C.gold} stroke={C.ink} strokeWidth="8"/>
      <path d={`M415 555 L${520+120*p} 555`} stroke={C.ink} strokeWidth="12" strokeLinecap="round"/>
    </svg>
  </>
);

const TerrainConstraint: React.FC<{p:number}> = ({p}) => (
  <>
    <Label dark>TERRAIN DECIDES THE PATH</Label>
    <svg viewBox="0 0 1000 900" style={{position:'absolute',inset:0,width:'100%',height:'100%',background:`linear-gradient(${C.teal},${C.paper})`}}>
      <path d="M0 590 L150 390 L290 565 L455 300 L620 570 L790 380 L1000 610 L1000 900 L0 900 Z" fill={C.blue} stroke={alpha(C.paper,.5)} strokeWidth="8"/>
      <path d="M20 760 C210 665 330 790 490 680 S740 610 930 665" fill="none" stroke={alpha(C.ink,.28)} strokeWidth="30"/>
      <path d="M20 760 C210 665 330 790 490 680 S740 610 930 665" fill="none" stroke={C.red} strokeWidth="10" strokeDasharray="18 14" strokeDashoffset={900*(1-p)}/>
      <circle cx="790" cy="655" r="92" fill={C.teal} stroke={C.paper} strokeWidth="20"/>
      <circle cx="790" cy="655" r="38" fill={C.gold}/>
    </svg>
  </>
);

const KnowledgeTransfer: React.FC<{p:number}> = ({p}) => (
  <>
    <Label dark>IDEAS TRAVEL WITH GOODS</Label>
    <svg viewBox="0 0 1000 900" style={{position:'absolute',inset:0,width:'100%',height:'100%',background:C.paper}}>
      {[80,365,650].map((x,i)=><g key={x} transform={`translate(${x} ${120+i%2*45}) rotate(${i===0?-7:i===1?4:-2})`} opacity={ease(p*1.8-i*.12)}>
        <rect width="270" height="540" fill={C.paper} stroke={C.ink} strokeWidth="8"/>
        <rect x="28" y="35" width={145+i*30} height="28" fill={i%2?C.teal:C.red}/>
        {Array.from({length:8}).map((_,j)=><rect key={j} x="28" y={105+j*42} width={205-(j%3)*24} height="9" fill={C.ink} opacity=".42"/>)}
        {i===1?<path d="M35 455 C80 365 145 365 230 455" fill="none" stroke={C.red} strokeWidth="8"/>:null}
      </g>)}
      <path d="M160 730 C360 620 570 770 840 635" fill="none" stroke={C.teal} strokeWidth="12" strokeDasharray="20 15" strokeDashoffset={800*(1-p)}/>
    </svg>
  </>
);

const StateControl: React.FC<{p:number}> = ({p}) => (
  <>
    <Label dark>CHECKPOINT • TAX • CONTROL</Label>
    <svg viewBox="0 0 1000 900" style={{position:'absolute',inset:0,width:'100%',height:'100%',background:C.paper}}>
      <g transform={`translate(185 ${120+(1-ease(p))*70})`}>
        <rect x="0" y="180" width="210" height="360" fill={C.red} stroke={C.ink} strokeWidth="10"/>
        <rect x="420" y="180" width="210" height="360" fill={C.red} stroke={C.ink} strokeWidth="10"/>
        <path d="M170 210 L170 80 L250 80 L280 15 L350 15 L380 80 L460 80 L460 210 Z" fill={C.gold} stroke={C.ink} strokeWidth="10"/>
        <path d="M220 540 L220 365 Q315 240 410 365 L410 540" fill={C.bg} stroke={C.ink} strokeWidth="10"/>
      </g>
      <rect x="405" y="690" width="190" height="90" fill={C.paper} stroke={C.ink} strokeWidth="7" transform={`rotate(${-7+p*4} 500 735)`}/>
      <text x="500" y="747" textAnchor="middle" fontFamily="Arial Black" fontSize="28" fill={C.red}>TAX</text>
    </svg>
  </>
);

const MaritimeLogistics: React.FC<{p:number}> = ({p}) => (
  <>
    <Label>SHIP + PORT + LAND ROUTE</Label>
    <svg viewBox="0 0 1000 900" style={{position:'absolute',inset:0,width:'100%',height:'100%',background:C.blue}}>
      <path d="M0 390 C160 330 300 420 470 360 S770 320 1000 405 L1000 900 L0 900 Z" fill={C.teal}/>
      <g transform={`translate(${70+420*p} 250)`}>
        <path d="M0 190 L420 190 L500 250 L450 335 L80 335 L20 285 Z" fill={C.paper} stroke={C.ink} strokeWidth="10"/>
        <rect x="170" y="95" width="160" height="100" fill={C.paper} stroke={C.ink} strokeWidth="8"/>
        <path d="M250 95 L250 -40" stroke={C.ink} strokeWidth="12"/><path d="M250 -30 L390 85 L250 85 Z" fill={C.gold} stroke={C.ink} strokeWidth="7"/>
      </g>
      <path d="M130 690 C320 590 510 735 850 590" fill="none" stroke={C.gold} strokeWidth="11" strokeDasharray="20 15" strokeDashoffset={780*(1-p)}/>
      <rect x="780" y="430" width="150" height="280" fill={C.paper} stroke={C.ink} strokeWidth="8"/>
      <path d="M805 710 L805 560 Q855 490 905 560 L905 710" fill={C.bg}/>
    </svg>
  </>
);

const Disruption: React.FC<{p:number}> = ({p}) => (
  <>
    <Label>BROKEN LINK → ALTERNATE ROUTE</Label>
    <svg viewBox="0 0 1000 900" style={{position:'absolute',inset:0,width:'100%',height:'100%',background:C.bg}}>
      <path d="M60 610 C230 460 360 640 510 500 S760 420 940 520" fill="none" stroke={alpha(C.paper,.3)} strokeWidth="34"/>
      <path d="M60 610 C230 460 360 640 510 500 S760 420 940 520" fill="none" stroke={C.gold} strokeWidth="11" strokeDasharray="18 14"/>
      <path d="M470 420 L550 580 M550 420 L470 580" stroke={C.red} strokeWidth="30" strokeLinecap="round" opacity={ease(p*1.8)}/>
      <path d="M375 500 C360 285 620 255 770 405 C830 465 885 430 940 370" fill="none" stroke={C.teal} strokeWidth="13" strokeDasharray="20 15" strokeDashoffset={720*(1-ease((p-.35)/.65))}/>
    </svg>
  </>
);

const MicroScene: React.FC<{p:number; kind:string}> = ({p,kind}) => {
  const survivor = kind==='resistant-survivors' || kind==='survivor-reproduction';
  return <>
    <Label>{kind.replaceAll('-',' ').toUpperCase()}</Label>
    <svg viewBox="0 0 1000 900" style={{position:'absolute',inset:0,width:'100%',height:'100%',background:C.bg}}>
      {Array.from({length:14}).map((_,i)=>{
        const x=80+(i%5)*185+(i%2)*30; const y=170+Math.floor(i/5)*220; const resistant=i%6===0;
        const vanish=kind==='antibiotic-attack'&&!resistant?1-ease(p*1.4-i*.025):1;
        return <g key={i} transform={`translate(${x} ${y}) rotate(${i*23}) scale(${survivor&&resistant?1+p*.25:1})`} opacity={vanish}>
          <rect x="-58" y="-30" width="116" height="60" rx="30" fill={resistant?C.red:C.teal} stroke={C.paper} strokeWidth="7"/>
          <path d="M-45 0 L45 0" stroke={C.gold} strokeWidth="7" strokeDasharray="12 8"/>
        </g>;
      })}
      {kind==='antibiotic-attack'?Array.from({length:9}).map((_,i)=><circle key={i} cx={80+i*105} cy={80+560*p+(i%2)*40} r="18" fill={C.gold} stroke={C.paper} strokeWidth="5"/>):null}
      {kind==='survivor-reproduction'?<g opacity={ease((p-.35)/.65)} transform={`translate(${760-180*p} 650)`}><rect x="-58" y="-30" width="116" height="60" rx="30" fill={C.red} stroke={C.paper} strokeWidth="7"/></g>:null}
    </svg>
  </>;
};

const GeneTransfer: React.FC<{p:number}> = ({p}) => (
  <>
    <Label>GENE TRANSFER CUTAWAY</Label>
    <svg viewBox="0 0 1000 900" style={{position:'absolute',inset:0,width:'100%',height:'100%',background:C.bg}}>
      {[260,740].map((x,i)=><g key={x} transform={`translate(${x} 470)`}><ellipse rx="155" ry="95" fill={i?C.red:C.teal} stroke={C.paper} strokeWidth="10"/><circle r="52" fill="none" stroke={C.gold} strokeWidth="12" strokeDasharray="18 12"/></g>)}
      <path d="M390 470 C490 350 610 350 710 470" fill="none" stroke={C.gold} strokeWidth="18" strokeDasharray="22 16" strokeDashoffset={420*(1-p)}/>
      <circle cx={390+320*p} cy={470-120*Math.sin(Math.PI*p)} r="30" fill={C.paper} stroke={C.ink} strokeWidth="7"/>
    </svg>
  </>
);

const FabScene: React.FC<{p:number;kind:string}> = ({p,kind}) => (
  <>
    <Label>{kind.replaceAll('-',' ').toUpperCase()}</Label>
    <svg viewBox="0 0 1000 900" style={{position:'absolute',inset:0,width:'100%',height:'100%',background:C.paper}}>
      <rect x="80" y="160" width="840" height="560" fill={alpha(C.blue,.25)} stroke={C.ink} strokeWidth="10"/>
      {[150,390,630].map((x,i)=><g key={x} transform={`translate(${x} ${250+(i%2)*60})`} opacity={ease(p*1.5-i*.12)}><rect width="210" height="290" rx="18" fill={i%2?C.teal:C.red} stroke={C.ink} strokeWidth="9"/><circle cx="105" cy="100" r="62" fill={C.bg} stroke={C.gold} strokeWidth="12"/><rect x="50" y="205" width="110" height="34" fill={C.paper} stroke={C.ink} strokeWidth="6"/></g>)}
      <path d="M90 655 L900 655" stroke={C.ink} strokeWidth="18"/><circle cx={130+700*p} cy="655" r="54" fill={C.gold} stroke={C.ink} strokeWidth="8"/>
      {kind==='lithography-cutaway'?<><path d="M500 110 L500 430" stroke={C.red} strokeWidth="18"/><path d="M430 430 L570 430 L620 560 L380 560 Z" fill={alpha(C.red,.3)} stroke={C.ink} strokeWidth="8"/></>:null}
    </svg>
  </>
);

const NetworkScene: React.FC<{p:number;kind:string}> = ({p,kind}) => (
  <>
    <Label>{kind.replaceAll('-',' ').toUpperCase()}</Label>
    <svg viewBox="0 0 1000 900" style={{position:'absolute',inset:0,width:'100%',height:'100%',background:C.bg}}>
      {[[500,440],[170,220],[820,210],[190,700],[820,690],[500,130],[500,760]].map(([x,y],i)=><g key={i} opacity={ease(p*1.6-i*.08)}><path d={`M500 440 L${x} ${y}`} stroke={i%2?C.teal:C.gold} strokeWidth="10" strokeDasharray="18 13"/><circle cx={x} cy={y} r={i===0?78:42} fill={i===0?C.red:i%2?C.teal:C.gold} stroke={C.paper} strokeWidth="8"/></g>)}
    </svg>
  </>
);

const ComparisonScene: React.FC<{p:number}> = ({p}) => (
  <>
    <Label dark>CAPACITY COMPARISON</Label>
    <svg viewBox="0 0 1000 900" style={{position:'absolute',inset:0,width:'100%',height:'100%',background:C.paper}}>
      <line x1="500" y1="90" x2="500" y2="820" stroke={C.ink} strokeWidth="10"/>
      {[210,650].map((x,i)=><g key={x} transform={`translate(${x} ${240+i*40}) scale(${.78+i*.22*ease(p)})`}><rect width="250" height="360" fill={i?C.teal:C.red} stroke={C.ink} strokeWidth="10"/><circle cx="125" cy="100" r="68" fill={C.bg} stroke={C.gold} strokeWidth="12"/><rect x="45" y="235" width="160" height="52" fill={C.paper} stroke={C.ink} strokeWidth="7"/></g>)}
    </svg>
  </>
);

const Consequence: React.FC<{p:number}> = ({p}) => (
  <>
    <Label>SYSTEM CONSEQUENCE</Label>
    <svg viewBox="0 0 1000 900" style={{position:'absolute',inset:0,width:'100%',height:'100%',background:C.bg}}>
      <circle cx="500" cy="450" r={260+40*ease(p)} fill={alpha(C.teal,.3)} stroke={C.paper} strokeWidth="12"/>
      <path d="M280 360 C360 250 470 250 560 340 C650 430 730 420 785 330 M240 520 C360 610 470 620 560 540 C650 460 750 500 810 600" fill="none" stroke={C.gold} strokeWidth="12"/>
      {[[500,450],[290,350],[720,330],[300,590],[720,580]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i===0?50:28} fill={i===0?C.red:C.teal} stroke={C.paper} strokeWidth="7" opacity={ease(p*1.5-i*.1)}/>) }
    </svg>
  </>
);

const ArchetypeScene: React.FC<{scene:Scene}> = ({scene}) => {
  const frame=useCurrentFrame(); const {fps}=useVideoConfig();
  const p=clamp(frame/Math.max(1,Math.round(scene.duration*fps)-1));
  const kind=scene.v9Blueprint?.sceneArchetype ?? 'causal-progression';
  let visual: React.ReactNode;
  switch(kind){
    case 'route-overview': visual=<RouteOverview p={p}/>; break;
    case 'caravan-journey': visual=<CaravanJourney p={p}/>; break;
    case 'oasis-relay-city': visual=<OasisRelayCity p={p}/>; break;
    case 'market-handoff': visual=<MarketHandoff p={p}/>; break;
    case 'terrain-constraint': visual=<TerrainConstraint p={p}/>; break;
    case 'knowledge-transfer': visual=<KnowledgeTransfer p={p}/>; break;
    case 'state-control-conflict': visual=<StateControl p={p}/>; break;
    case 'maritime-air-logistics': visual=<MaritimeLogistics p={p}/>; break;
    case 'route-or-system-disruption': case 'treatment-failure': visual=<Disruption p={p}/>; break;
    case 'micro-population-variation': case 'antibiotic-attack': case 'resistant-survivors': case 'survivor-reproduction': case 'selection-shift': case 'selection-pressure': visual=<MicroScene p={p} kind={kind}/>; break;
    case 'gene-transfer-cutaway': visual=<GeneTransfer p={p}/>; break;
    case 'industrial-ecosystem': case 'fab-production': case 'capital-equipment-cycle': case 'lithography-cutaway': case 'human-expertise-cluster': visual=<FabScene p={p} kind={kind}/>; break;
    case 'global-dependency-network': case 'host-environment-spread': visual=<NetworkScene p={p} kind={kind}/>; break;
    case 'capacity-comparison': visual=<ComparisonScene p={p}/>; break;
    case 'system-consequence': visual=<Consequence p={p}/>; break;
    default: visual=<NetworkScene p={p} kind={kind}/>;
  }
  return <Frame progress={p}>{visual}</Frame>;
};

export const V9ArchetypeOverlay: React.FC = () => (
  <AbsoluteFill style={{pointerEvents:'none'}}>
    {plan.scenes.map((scene)=><Sequence key={scene.id} from={Math.round(scene.start*plan.fps)} durationInFrames={Math.max(1,Math.round(scene.duration*plan.fps))} premountFor={20}><ArchetypeScene scene={scene}/></Sequence>)}
  </AbsoluteFill>
);
