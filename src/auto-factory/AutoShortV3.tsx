import React from 'react';
import {
  AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig
} from 'remotion';
import planJson from '../../public/auto-factory/plan.json';
import {FactoryPlanSchema, type ScenePlan} from './schema';

const plan=FactoryPlanSchema.parse(planJson);
const P=plan.palette;
const clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,v));
const accent=(scene:ScenePlan)=>({red:P.red,teal:P.teal,gold:P.gold,blue:P.blue}[scene.accent]);
const enterAt=(progress:number,at:number,width=.16)=>clamp((progress-at)/width);

const Paper:React.FC<React.PropsWithChildren<{x:number;y:number;w:number;h:number;rotate?:number;dark?:boolean;opacity?:number}>>=({x,y,w,h,rotate=0,dark=false,opacity=1,children})=><div style={{
  position:'absolute',left:x,top:y,width:w,height:h,background:dark?P.ink:'#eee1c2',color:dark?'#fff5dd':P.ink,
  border:`7px solid ${P.ink}`,boxShadow:'15px 20px 0 rgba(30,22,16,.22),transform:`rotate(${rotate}deg)`,opacity,
  clipPath:'polygon(1% 2%,98% 0,100% 95%,96% 100%,3% 98%,0 8%)',overflow:'hidden'
}}>{children}</div>;

const Tag:React.FC<{text:string;x:number;y:number;color?:string;rotation?:number;opacity?:number}>=({text,x,y,color,rotation=0,opacity=1})=><div style={{
  position:'absolute',left:x,top:y,maxWidth:310,padding:'13px 19px 11px',background:color??'#f4e8c8',color:color?'#fff7e4':P.ink,
  border:`4px solid ${P.ink}`,borderRadius:10,fontFamily:'Arial',fontWeight:950,fontSize:25,lineHeight:1.02,
  transform:`rotate(${rotation}deg)`,boxShadow:'7px 9px 0 rgba(32,24,18,.2)',opacity
}}>{text}</div>;

const Texture:React.FC=()=>{
  const frame=useCurrentFrame();
  return <>
    <AbsoluteFill style={{pointerEvents:'none',opacity:.1,backgroundImage:'repeating-linear-gradient(0deg,transparent 0 6px,rgba(40,30,20,.2) 7px)'}}/>
    <AbsoluteFill style={{pointerEvents:'none',opacity:.15,backgroundImage:'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27140%27 height=%27140%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%27.8%27 numOctaves=%272%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27 opacity=%27.4%27/%3E%3C/svg%3E")',backgroundPosition:`${frame%21}px ${frame%17}px`}}/>
    <AbsoluteFill style={{pointerEvents:'none',background:'radial-gradient(circle at 50% 43%,transparent 50%,rgba(21,17,13,.38) 100%)'}}/>
  </>;
};

const Bacterium:React.FC<{x:number;y:number;scale?:number;color:string;resistant?:boolean;dead?:number;rotation?:number}>=({x,y,scale=1,color,resistant=false,dead=0,rotation=0})=><g transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`} opacity={1-dead*.72}>
  <rect x="-55" y="-28" width="110" height="56" rx="28" fill={dead?'#b4aa96':color} stroke={P.ink} strokeWidth="8"/>
  {resistant&&<path d="M-18 -42 L0 -68 L18 -42 M-18 42 L0 68 L18 42" fill="none" stroke={P.gold} strokeWidth="8" strokeLinecap="round"/>}
  {dead>0&&<path d="M-35 -20 L35 20 M35 -20 L-35 20" stroke={P.red} strokeWidth="9"/>}
</g>;

const MicrobeField:React.FC<{scene:ScenePlan;progress:number}>=({scene,progress})=>{
  const a=accent(scene); const kill=enterAt(progress,.38,.26); const survivor=enterAt(progress,.62,.18);
  const points=[[120,170,-10],[270,130,12],[430,180,-4],[580,125,9],[180,330,4],[350,320,-12],[530,330,7],[115,500,8],[290,510,-7],[475,490,13],[620,520,-3]];
  return <svg width="760" height="760" viewBox="0 0 760 760">
    <ellipse cx="380" cy="370" rx="320" ry="300" fill="#e8ddc1" stroke={P.ink} strokeWidth="12"/>
    <ellipse cx="380" cy="370" rx={70+progress*220} ry={65+progress*205} fill="none" stroke={P.red} strokeWidth="13" opacity={.25+progress*.35}/>
    {points.map(([x,y,r],i)=><Bacterium key={i} x={x} y={y} rotation={r} scale={i%3===0?.82:.7} color={i===6?a:i%2?P.teal:P.blue} resistant={i===6} dead={i===6?0:kill}/>) }
    <g transform={`translate(380 370) scale(${.5+survivor*.65})`} opacity={survivor}><circle r="80" fill="none" stroke={P.gold} strokeWidth="12" strokeDasharray="18 12"/><text y="12" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="25" fill={P.ink}>{scene.props[0]?.slice(0,18)}</text></g>
  </svg>;
};

const SelectionProcess:React.FC<{scene:ScenePlan;progress:number}>=({scene,progress})=>{
  const a=accent(scene); const eliminate=enterAt(progress,.32,.25); const grow=enterAt(progress,.62,.2);
  return <svg width="760" height="760" viewBox="0 0 760 760">
    <rect x="45" y="70" width="300" height="560" rx="20" fill="#e9ddbf" stroke={P.ink} strokeWidth="10"/>
    <rect x="415" y="70" width="300" height="560" rx="20" fill="#e9ddbf" stroke={P.ink} strokeWidth="10"/>
    <path d="M350 350 H410" stroke={P.red} strokeWidth="14"/><polygon points="410,350 375,325 375,375" fill={P.red}/>
    {[0,1,2,3,4,5].map(i=><Bacterium key={`l${i}`} x={120+(i%2)*140} y={170+Math.floor(i/2)*150} scale=.62 color={i===4?a:P.teal} resistant={i===4} dead={i===4?0:eliminate}/>) }
    {[0,1,2,3,4,5,6].map(i=><Bacterium key={`r${i}`} x={485+(i%2)*140} y={150+Math.floor(i/2)*120} scale={.42+grow*.2} color={a} resistant rotation={i%2?9:-7}/>) }
    <text x="195" y="690" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="30" fill={P.ink}>ÖNCE</text>
    <text x="565" y="690" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="30" fill={P.ink}>SONRA</text>
  </svg>;
};

const GeneTransfer:React.FC<{scene:ScenePlan;progress:number}>=({scene,progress})=>{
  const a=accent(scene); const transfer=enterAt(progress,.25,.5); const ringX=250+(510-250)*transfer;
  return <svg width="760" height="760" viewBox="0 0 760 760">
    <Bacterium x={210} y={360} scale={1.5} color={P.teal} resistant/>
    <Bacterium x={550} y={360} scale={1.5} color={a}/>
    <path d="M285 350 C360 260 440 260 500 350" fill="none" stroke={P.red} strokeWidth="10" strokeDasharray="18 12" pathLength="1" strokeDashoffset={1-transfer}/>
    <g transform={`translate(${ringX} ${305-Math.sin(transfer*Math.PI)*60})`}><circle r="44" fill="none" stroke={P.gold} strokeWidth="13"/><circle r="19" fill="none" stroke={P.ink} strokeWidth="6"/></g>
    <text x="380" y="585" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="32" fill={P.ink}>{scene.heroVisual.slice(0,32).toLocaleUpperCase('tr-TR')}</text>
  </svg>;
};

const BeforeAfter:React.FC<{scene:ScenePlan;progress:number}>=({scene,progress})=>{
  const reveal=enterAt(progress,.18,.25); const a=accent(scene);
  return <svg width="760" height="760" viewBox="0 0 760 760">
    <path d="M60 70 H700 V650 H60 Z" fill="#e9ddbf" stroke={P.ink} strokeWidth="11"/>
    <line x1="380" y1="70" x2="380" y2="650" stroke={P.ink} strokeWidth="10"/>
    <text x="210" y="130" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="30" fill={P.ink}>ÖNCE</text>
    <text x="550" y="130" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="30" fill={a}>SONRA</text>
    <g transform="translate(210 360)"><circle r="130" fill="#d6c8a9" stroke={P.ink} strokeWidth="9"/><path d="M-80 40 C-20 -60 55 -80 90 20" fill="none" stroke={P.teal} strokeWidth="16"/></g>
    <g transform={`translate(550 360) scale(${.5+reveal*.5})`} opacity={reveal}><circle r="130" fill="#d6c8a9" stroke={P.ink} strokeWidth="9"/><path d="M-90 50 C-35 -75 50 -90 95 35" fill="none" stroke={a} strokeWidth="18"/><path d="M-95 -25 L95 65" stroke={P.red} strokeWidth="12" strokeDasharray="18 11"/></g>
    <text x="380" y="710" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="27" fill={P.ink}>{scene.heroVisual.slice(0,38)}</text>
  </svg>;
};

const ProcessFlow:React.FC<{scene:ScenePlan;progress:number}>=({scene,progress})=>{
  const a=accent(scene); const labels=[scene.props[0],scene.props[1],scene.props[2]||scene.heroVisual];
  return <svg width="760" height="760" viewBox="0 0 760 760">
    {labels.map((label,i)=>{const p=enterAt(progress,.08+i*.22,.18);const x=155+i*225;return <g key={i} transform={`translate(${x} 350) scale(${.5+p*.5})`} opacity={p}><circle r="100" fill={i===1?a:i===2?P.gold:P.teal} stroke={P.ink} strokeWidth="10"/><text y="8" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="22" fill={i===1?'#fff6e1':P.ink}>{String(label||'ADIM').slice(0,14)}</text></g>})}
    {[0,1].map(i=>{const p=enterAt(progress,.28+i*.22,.2);const x1=255+i*225;return <g key={i}><line x1={x1} y1="350" x2={x1+125*p} y2="350" stroke={P.red} strokeWidth="13"/><polygon points={`${x1+125*p},350 ${x1+90*p},326 ${x1+90*p},374`} fill={P.red}/></g>})}
  </svg>;
};

const EvidenceBoard:React.FC<{scene:ScenePlan;progress:number}>=({scene,progress})=>{
  const a=accent(scene); const cards=[[75,100,-5],[315,70,4],[500,300,-3],[120,390,5]];
  return <svg width="760" height="760" viewBox="0 0 760 760">
    {cards.map(([x,y,r],i)=>{const p=enterAt(progress,.08+i*.13,.18);return <g key={i} transform={`translate(${x} ${y+(1-p)*100}) rotate(${r})`} opacity={p}><rect width="205" height="210" fill="#f0e3c3" stroke={P.ink} strokeWidth="8"/><rect x="20" y="20" width="165" height="95" fill={i%2?P.blue:P.teal} opacity=".55"/><path d="M25 145 H170 M25 175 H135" stroke="#8e7654" strokeWidth="7"/><circle cx="102" cy="8" r="13" fill={i===2?a:P.red} stroke={P.ink} strokeWidth="5"/></g>})}
    <path d="M177 108 C280 170 390 145 600 310 M220 500 C330 390 500 440 600 310" fill="none" stroke={P.red} strokeWidth="7" strokeDasharray="14 10" pathLength="1" strokeDashoffset={1-enterAt(progress,.32,.4)}/>
  </svg>;
};

const MapEvolution:React.FC<{scene:ScenePlan;progress:number}>=({scene,progress})=>{
  const a=accent(scene); const p=enterAt(progress,.12,.7);
  return <svg width="760" height="760" viewBox="0 0 760 760">
    <path d="M80 145 L250 80 L370 145 L520 95 L690 190 L635 340 L690 520 L535 650 L360 590 L210 660 L75 525 L120 350 Z" fill="#e7dbbc" stroke={P.ink} strokeWidth="11"/>
    <path d="M130 320 C250 190 355 290 430 360 C520 450 590 335 650 245" fill="none" stroke={a} strokeWidth="14" pathLength="1" strokeDasharray="1" strokeDashoffset={1-p}/>
    <path d="M150 500 C260 420 350 470 445 530 C535 585 600 530 650 475" fill="none" stroke={P.red} strokeWidth="10" strokeDasharray="18 12" pathLength="1" strokeDashoffset={1-p}/>
    {[[130,320],[430,360],[650,245],[150,500],[445,530],[650,475]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r={12+enterAt(progress,.18+i*.07,.15)*13} fill={i%2?a:P.gold} stroke={P.ink} strokeWidth="6"/>)}
  </svg>;
};

const GenericDrawing:React.FC<{scene:ScenePlan;progress:number}>=({scene,progress})=>{
  if(scene.visualKind==='microbe-field'||scene.visualKind==='biology')return <MicrobeField scene={scene} progress={progress}/>;
  if(scene.visualKind==='selection-process')return <SelectionProcess scene={scene} progress={progress}/>;
  if(scene.visualKind==='gene-transfer')return <GeneTransfer scene={scene} progress={progress}/>;
  if(scene.visualKind==='before-after'||scene.visualKind==='comparison')return <BeforeAfter scene={scene} progress={progress}/>;
  if(scene.visualKind==='evidence-board'||scene.visualKind==='document'||scene.visualKind==='archive-wall')return <EvidenceBoard scene={scene} progress={progress}/>;
  if(scene.visualKind==='map-evolution'||scene.visualKind==='map-route'||scene.visualKind==='world-network')return <MapEvolution scene={scene} progress={progress}/>;
  return <ProcessFlow scene={scene} progress={progress}/>;
};

const SceneTransition:React.FC<{scene:ScenePlan;frame:number}>=({scene,frame})=>{
  const p=interpolate(frame,[0,8],[0,1],{extrapolateRight:'clamp'});
  if(scene.transition==='film-burn')return <AbsoluteFill style={{background:'#fff3c8',opacity:interpolate(frame,[0,2,8],[.92,.3,0],{extrapolateRight:'clamp'}),mixBlendMode:'screen'}}/>;
  if(scene.transition==='split-shutter')return <><div style={{position:'absolute',inset:0,bottom:'50%',background:P.ink,transform:`translateY(${p*-105}%)`}}/><div style={{position:'absolute',inset:0,top:'50%',background:P.ink,transform:`translateY(${p*105}%)`}}/></>;
  return <div style={{position:'absolute',inset:-100,background:'#efe2c3',clipPath:`polygon(0 0,${105-p*115}% 0,${88-p*115}% 100%,0 100%)`,borderRight:`18px solid ${accent(scene)}`}}/>;
};

const Scene:React.FC<{scene:ScenePlan}>=({scene})=>{
  const frame=useCurrentFrame(); const {fps}=useVideoConfig(); const total=Math.max(1,Math.round(scene.duration*fps));
  const progress=clamp(frame/Math.max(1,total-1)); const intro=spring({frame,fps,config:{damping:16,stiffness:115,mass:.75}});
  const beat1=enterAt(progress,scene.beats[0]?.at??.16,.13); const beat2=enterAt(progress,scene.beats[1]?.at??.48,.13);
  const zoom=interpolate(progress,[0,1],[1,1.055]); const a=accent(scene);
  return <AbsoluteFill style={{background:P.paper,overflow:'hidden'}}>
    {scene.asset&&<Img src={staticFile(scene.asset)} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:.2,filter:'sepia(.45) contrast(1.08)',transform:`scale(${1.08+progress*.06})`}}/>}
    <AbsoluteFill style={{background:'linear-gradient(145deg,rgba(255,249,227,.72),rgba(147,119,80,.12))'}}/>
    <Tag text={scene.title} x={70} y={82} color={a} rotation={-1.2} opacity={intro}/>
    <Tag text={scene.kicker.slice(0,46)} x={90} y={175} rotation={1} opacity={intro}/>
    <div style={{position:'absolute',left:80,top:275,fontFamily:'monospace',fontWeight:800,fontSize:18,letterSpacing:2,color:P.ink,opacity:.52}}>NEO/V3 · {String(scene.id).padStart(2,'0')} · {scene.shotType.toUpperCase()}</div>
    <Paper x={125} y={330} w={830} h={850} rotate={scene.id%2?-.8:.8} opacity={intro}>
      <div style={{position:'absolute',left:34,top:34,width:760,height:760,transform:`scale(${zoom})`,transformOrigin:'50% 52%'}}><GenericDrawing scene={scene} progress={progress}/></div>
    </Paper>
    <Tag text={scene.supportVisuals[0]||scene.props[0]} x={65} y={1220} color={P.teal} rotation={-3} opacity={beat1}/>
    <Tag text={scene.supportVisuals[1]||scene.props[1]} x={650} y={1310} color={P.gold} rotation={3} opacity={beat2}/>
    <div style={{position:'absolute',left:90,right:90,top:1460,minHeight:165,padding:'28px 32px',background:'rgba(239,226,193,.9)',border:`5px solid ${P.ink}`,fontFamily:'Georgia,serif',fontSize:30,lineHeight:1.18,color:P.ink,boxShadow:'12px 16px 0 rgba(30,22,16,.18)'}}>{scene.sceneGoal.replace(/^Show exactly how:\s*/,'').replace(/^Illustrate only this spoken claim:\s*/,'')}</div>
    <Texture/>
    <SceneTransition scene={scene} frame={frame}/>
  </AbsoluteFill>;
};

export const AutoShortV3:React.FC=()=> <AbsoluteFill style={{background:P.paper}}>
  <Audio src={staticFile('auto-factory/audio/final.wav')}/>
  {plan.scenes.map((scene)=><Sequence key={scene.id} from={Math.round(scene.start*plan.fps)} durationInFrames={Math.max(1,Math.round(scene.duration*plan.fps))}><Scene scene={scene}/></Sequence>)}
  <AbsoluteFill style={{pointerEvents:'none',background:'radial-gradient(circle at center,transparent 58%,rgba(20,16,12,.3) 100%)'}}/>
</AbsoluteFill>;

export const AUTO_FACTORY_V3_FRAMES=Math.round(plan.duration*plan.fps);
