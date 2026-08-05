import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {FilmLook} from '../db-cooper/engine';
import {MARY_CELESTE_SCENES} from './data';

const A = (name: string) => staticFile(`mary-celeste/${name}`);
const I = (f: number, a: number, b: number, c: number, d: number) =>
  interpolate(f, [a, b], [c, d], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

const Layer: React.FC<{src: string; style?: React.CSSProperties; fit?: React.CSSProperties['objectFit']}> = ({src, style, fit = 'cover'}) => (
  <Img src={A(src)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: fit, ...style}} />
);

const Shell: React.FC<React.PropsWithChildren<{duration: number; brightness?: number}>> = ({duration, brightness = .94, children}) => {
  const f = useCurrentFrame();
  const opacity = interpolate(f, [0, 8, duration - 8, duration - 1], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{opacity, overflow: 'hidden', background: '#070706'}}><FilmLook brightness={brightness} contrast={1.11} saturate={.82} sepia={.17}>{children}</FilmLook></AbsoluteFill>;
};

const Scene1: React.FC<{duration: number}> = ({duration}) => {
  const f = useCurrentFrame();
  const p = Easing.bezier(.72, 0, .88, .35)(I(f, 42, 82, 0, 1));
  const wallOpacity = I(f, 62, 84, 1, 0);
  const worldOpacity = I(f, 58, 82, 0, 1);
  const blur = f < 64 ? 0 : f < 72 ? I(f, 64, 72, 0, 9) : I(f, 72, 86, 9, 0);
  const bob = Math.sin(f * .04) * 7;
  return <Shell duration={duration}>
    <AbsoluteFill style={{opacity: worldOpacity}}>
      <Layer src="ocean.jpg" style={{transform: `scale(${1.02 + f / duration * .08}) translateY(${18 - f * .12}px)`}} />
      <Img src={A('ship.jpg')} style={{position: 'absolute', width: 900, left: '50%', top: '53%', mixBlendMode: 'screen', filter: 'contrast(1.16) brightness(.92)', transform: `translate(-50%,-50%) translate(${I(f, 70, duration, 28, -16)}px,${bob}px) scale(${I(f, 70, duration, .88, 1.08)}) rotate(${Math.sin(f * .035) * .55}deg)`}} />
    </AbsoluteFill>
    <AbsoluteFill style={{opacity: wallOpacity, transform: `scale(${1 + p * 5.8})`, filter: `blur(${blur}px)`, background: 'linear-gradient(115deg,#c9b98d,#8e7c56 48%,#b4a273)'}}>
      <AbsoluteFill style={{opacity: .24, backgroundImage: 'repeating-linear-gradient(0deg,rgba(35,28,18,.18) 0 1px,transparent 1px 8px),repeating-linear-gradient(90deg,rgba(35,28,18,.08) 0 1px,transparent 1px 11px)'}} />
      <div style={{position: 'absolute', left: 170, top: 295, width: 740, height: 1050, padding: 34, background: '#352717', border: '20px ridge #b69045', boxShadow: '0 35px 80px #0008'}}><Img src={A('ship.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', filter: `grayscale(${1 - p}) contrast(1.08)`}} /></div>
      <div style={{position: 'absolute', top: 1390, left: '50%', transform: 'translateX(-50%)', background: '#d8c89f', color: '#261d12', border: '2px solid #3218', padding: '14px 28px', fontFamily: 'Georgia,serif', fontSize: 38, fontWeight: 700, letterSpacing: 5}}>1872</div>
    </AbsoluteFill>
  </Shell>;
};

const Scene2: React.FC<{duration: number}> = ({duration}) => {
  const f = useCurrentFrame(); const p = I(f, 12, 92, 0, 1); const x = 155 + p * 610; const y = 1260 - p * 480 + Math.sin(p * Math.PI) * 80;
  return <Shell duration={duration} brightness={.98}>
    <Layer src="map.jpg" style={{transform: `scale(${1.04 + f / duration * .05}) translateX(${-25 + f * .18}px)`}} />
    <svg width="1080" height="1920" style={{position: 'absolute', inset: 0}}><path d="M155 1260 C340 1120 470 1240 590 980 S730 820 800 770" fill="none" stroke="#342112" strokeWidth="13" strokeLinecap="round" pathLength={1} style={{strokeDasharray: 1, strokeDashoffset: 1 - p}} /><circle cx="800" cy="770" r={68 * (1 + Math.sin(f * .22) * .08)} fill="none" stroke="#321a0f" strokeWidth="9" /><circle cx="800" cy="770" r="10" fill="#321a0f" /></svg>
    <Img src={A('ship.jpg')} style={{position: 'absolute', width: 230, left: x, top: y, mixBlendMode: 'multiply', filter: 'sepia(1) contrast(1.8) brightness(.58)', transform: `translate(-50%,-50%) rotate(${-13 + p * 9}deg)`}} />
    <div style={{position: 'absolute', left: 100, top: 210, color: '#24170d', fontFamily: 'Georgia,serif', fontSize: 54, fontWeight: 800, fontStyle: 'italic', transform: 'rotate(-2deg)'}}>New York → Cenova</div>
  </Shell>;
};

const Card: React.FC<{src: string; label: string; left?: number; right?: number; top: number; width: number; rotate: number; delay: number}> = ({src,label,left,right,top,width,rotate,delay}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const s = spring({frame:f-delay,fps,config:{damping:16,stiffness:95,mass:1.05}});
  return <div style={{position:'absolute',left,right,top,width,padding:18,background:'#d8c79d',border:'4px solid #2c2014',boxShadow:'0 28px 60px #0008',transform:`translateY(${interpolate(s,[0,1],[180,0])}px) scale(${interpolate(s,[0,1],[.78,1])}) rotate(${rotate}deg)`}}><Img src={A(src)} style={{display:'block',width:'100%',aspectRatio:'3/4',objectFit:'cover',filter:'sepia(.15) contrast(1.06)'}}/><div style={{padding:'14px 8px 5px',color:'#21170f',fontFamily:'Georgia,serif',fontSize:31,fontWeight:800,textAlign:'center'}}>{label}</div></div>;
};

const Scene3: React.FC<{duration:number}> = ({duration}) => {const f=useCurrentFrame();const crew=I(f,40,78,0,1);return <Shell duration={duration}><Layer src="map.jpg" style={{filter:'blur(5px) brightness(.42)',transform:`scale(${1.18+f/duration*.03})`}}/><Img src={A('crew.jpg')} style={{position:'absolute',left:'50%',bottom:-70,width:1010,mixBlendMode:'screen',opacity:crew*.66,filter:'contrast(1.1) brightness(.75)',transform:`translateX(-50%) translateY(${(1-crew)*120}px) scale(${.95+crew*.05})`}}/><Card src="captain.jpg" left={58} top={245} width={410} rotate={-4} delay={0} label="Kaptan Benjamin Briggs"/><Card src="family.jpg" right={55} top={290} width={430} rotate={4} delay={12} label="Sarah ve Sophia"/></Shell>;};

const Scene4: React.FC<{duration:number}> = ({duration}) => {const f=useCurrentFrame();const {fps}=useVideoConfig();const s=spring({frame:f-28,fps,config:{damping:15,stiffness:72,mass:1.15}});const x=I(f,65,150,240,690);const y=I(f,65,150,1040,760);return <Shell duration={duration} brightness={.92+Math.sin(f*.6)*.035+Math.cos(f*.21)*.02}><Layer src="deck.jpg" style={{transform:`scale(${1.03+f/duration*.07}) translateX(${-15+f*.08}px)`}}/><AbsoluteFill style={{background:'linear-gradient(120deg,transparent 40%,#0006 100%)'}}/><div style={{position:'absolute',right:55,bottom:180,width:630,height:760,background:'#dfcc9b',padding:18,border:'4px solid #24190e',boxShadow:'0 28px 60px #000a',transform:`translateY(${interpolate(s,[0,1],[360,0])}px) rotate(3deg) scale(${interpolate(s,[0,1],[.82,1])})`}}><Img src={A('desk.jpg')} style={{width:'100%',height:'100%',objectFit:'cover'}}/></div><div style={{position:'absolute',left:x,top:y,width:245,height:245,borderRadius:'50%',border:'13px solid #2a1c0f',boxShadow:'0 20px 35px #0009,inset 0 0 25px #0004',backgroundImage:`url(${A('desk.jpg')})`,backgroundSize:'980px 1470px',backgroundPosition:`${-x*.78}px ${-y*.56}px`,transform:'translate(-50%,-50%)'}}><div style={{position:'absolute',width:180,height:24,background:'#2a1c0f',right:-145,bottom:-72,transform:'rotate(43deg)',transformOrigin:'left center',borderRadius:16}}/></div></Shell>;};

const Scene5: React.FC<{duration:number}> = ({duration}) => {const f=useCurrentFrame();const rope=f<93?.7:I(f,93,103,.7,0);return <Shell duration={duration}><Layer src="ocean.jpg" style={{transform:`scale(${1.05+f/duration*.06}) translateX(${-18+f*.09}px)`}}/><Img src={A('ship.jpg')} style={{position:'absolute',width:340,left:770+I(f,0,duration,0,125),top:650,mixBlendMode:'screen',opacity:.34,filter:'contrast(1.1) brightness(.72)',transform:'translate(-50%,-50%)'}}/><div style={{position:'absolute',left:550,top:850+(f>=93?Math.sin((f-93)*1.6)*18:0),width:330,height:5,background:'#bca274',opacity:rope,transform:'rotate(-26deg)',transformOrigin:'left center'}}/><Img src={A('lifeboat.jpg')} style={{position:'absolute',width:860,left:'48%',top:'58%',mixBlendMode:'screen',filter:'contrast(1.18) brightness(.86)',transform:`translate(-50%,-50%) translate(${I(f,0,duration,38,-46)}px,${Math.sin(f*.055)*14}px) rotate(${Math.sin(f*.045)*1.2}deg)`}}/></Shell>;};

const Theory: React.FC<{src:string;label:string;left:number;top:number;rotate:number;delay:number;active?:boolean}> = ({src,label,left,top,rotate,delay,active=false}) => {const f=useCurrentFrame();const {fps}=useVideoConfig();const s=spring({frame:f-delay,fps,config:{damping:15,stiffness:85,mass:1.08}});const hi=active?I(f,115,145,0,1):0;return <div style={{position:'absolute',left,top,width:390,padding:14,background:hi?'#d8b357':'#d2c197',border:`${4+hi*5}px solid ${hi?'#6d2515':'#251b12'}`,boxShadow:`0 24px 55px #0009,0 0 ${hi*45}px #aa2f19cc`,opacity:active?1:1-I(f,120,150,0,.36),transform:`translate(${interpolate(s,[0,1],[left<300?-380:left>500?380:0,0])}px,${interpolate(s,[0,1],[top<500?-300:300,0])}px) rotate(${rotate}deg) scale(${.82+s*.18+hi*.04})`}}><Img src={A(src)} style={{display:'block',width:'100%',height:360,objectFit:'cover',filter:'sepia(.2) contrast(1.08)'}}/><div style={{padding:'14px 4px 5px',color:'#20140d',textAlign:'center',fontFamily:'Arial Black,Arial',fontSize:40,fontWeight:900}}>{label}</div></div>;};

const Scene6: React.FC<{duration:number}> = ({duration}) => {const f=useCurrentFrame();const t=I(f,78,142,0,1);return <Shell duration={duration} brightness={.91}><Layer src="map.jpg" style={{filter:'brightness(.38) blur(2px)',transform:'scale(1.16)'}}/><Theory src="crew.jpg" label="KORSANLIK" left={65} top={255} rotate={-5} delay={0}/><Theory src="ocean.jpg" label="FIRTINA" left={625} top={365} rotate={5} delay={14}/><Theory src="desk.jpg" label="ALKOL BUHARI" left={335} top={990} rotate={-2} delay={28} active/><svg width="1080" height="1920" style={{position:'absolute',inset:0}}><path d="M430 640 C520 700 545 930 530 1040" fill="none" stroke="#9b251b" strokeWidth="8" pathLength={1} style={{strokeDasharray:1,strokeDashoffset:1-t}}/><path d="M760 760 C720 850 640 950 590 1050" fill="none" stroke="#9b251b" strokeWidth="8" pathLength={1} style={{strokeDasharray:1,strokeDashoffset:1-t}}/></svg><div style={{position:'absolute',left:115,top:105,color:'#e9ddbf',fontFamily:'Georgia,serif',fontStyle:'italic',fontWeight:800,fontSize:52,textShadow:'0 6px 18px #000c'}}>Üç teori. Tek bir kesin cevap yok.</div></Shell>;};

const Scene7: React.FC<{duration:number}> = ({duration}) => {const f=useCurrentFrame();const ghost=I(f,10,48,0,.28)*I(f,100,140,1,0);return <Shell duration={duration} brightness={.93}><Layer src="desk.jpg" style={{filter:'brightness(.35) blur(2px)',transform:`scale(${1.14+f/duration*.04})`}}/><Img src={A('captain.jpg')} style={{position:'absolute',width:420,left:40,top:360,opacity:ghost,mixBlendMode:'screen',filter:'grayscale(1) contrast(1.15)'}}/><Img src={A('family.jpg')} style={{position:'absolute',width:430,right:25,top:420,opacity:ghost,mixBlendMode:'screen',filter:'grayscale(1) contrast(1.15)'}}/><Img src={A('clock.jpg')} style={{position:'absolute',width:900,left:'50%',top:'54%',mixBlendMode:'screen',filter:'contrast(1.2) brightness(.92)',transform:`translate(-50%,-50%) scale(${I(f,0,duration,.84,1.17)}) rotate(${I(f,0,duration,-7,4)}deg)`}}/><AbsoluteFill style={{background:f>112&&f<118?'#ffdc9670':'transparent',mixBlendMode:'screen'}}/></Shell>;};

const Scene8: React.FC<{duration:number}> = ({duration}) => {const f=useCurrentFrame();const fog=I(f,25,duration,.12,.76);const ghost=I(f,0,30,0,.2)*I(f,60,100,1,0);return <Shell duration={duration} brightness={.88}><Layer src="ocean.jpg" style={{transform:`scale(${1.04+f/duration*.07}) translateY(${-f*.11}px)`}}/><div style={{position:'absolute',left:'50%',top:'44%',transform:'translate(-50%,-50%)',fontFamily:'Georgia,serif',fontWeight:900,fontSize:760,color:'#d9c89e',opacity:I(f,95,150,0,.46),textShadow:'0 30px 70px #000c'}}>?</div><Img src={A('family.jpg')} style={{position:'absolute',width:360,left:45,top:620,opacity:ghost,mixBlendMode:'screen',filter:'grayscale(1)'}}/><Img src={A('captain.jpg')} style={{position:'absolute',width:330,right:55,top:640,opacity:ghost,mixBlendMode:'screen',filter:'grayscale(1)'}}/><Img src={A('ship.jpg')} style={{position:'absolute',width:920,left:'50%',top:'56%',mixBlendMode:'screen',opacity:.9,filter:'contrast(1.13) brightness(.82)',transform:`translate(-50%,-50%) translateY(${I(f,0,duration,0,-120)}px) scale(${I(f,0,duration,1.08,.68)}) rotate(${Math.sin(f*.025)*.45}deg)`}}/><AbsoluteFill style={{opacity:fog,background:'linear-gradient(180deg,#d2cdc00f,#d7d3c657 62%,#e1dccd94)',mixBlendMode:'screen'}}/><AbsoluteFill style={{opacity:fog*.52,background:'radial-gradient(ellipse 90% 45% at 50% 78%,#ffffff75,transparent 72%)',transform:`translateX(${Math.sin(f*.018)*70}px)`}}/></Shell>;};

const scenes = [Scene1,Scene2,Scene3,Scene4,Scene5,Scene6,Scene7,Scene8];

type Caption={from:number;duration:number;text:string;accent?:string};
const captions:Caption[]=[
  {from:8,duration:72,text:'GEMİ SAĞLAMDI',accent:'SAĞLAMDI'},{from:91,duration:76,text:'AMA HERKES KAYIPTI',accent:'KAYIPTI'},
  {from:194,duration:92,text:'NEW YORK → CENOVA',accent:'CENOVA'},{from:310,duration:112,text:'GEMİDE 10 KİŞİ VARDI',accent:'10 KİŞİ'},
  {from:462,duration:78,text:'EŞYALAR YERİNDEYDİ',accent:'YERİNDEYDİ'},{from:548,duration:72,text:'GEMİ HÂLÂ YÜZÜYORDU',accent:'YÜZÜYORDU'},
  {from:648,duration:110,text:'TEK FİLİKA KAYIPTI',accent:'KAYIPTI'},{from:794,duration:58,text:'KORSANLIK MI?',accent:'KORSANLIK'},
  {from:862,duration:58,text:'FIRTINA MI?',accent:'FIRTINA'},{from:930,duration:58,text:'ALKOL BUHARI MI?',accent:'ALKOL BUHARI'},
  {from:1005,duration:112,text:'ACELEYLE TERK ETTİLER',accent:'TERK ETTİLER'},{from:1154,duration:82,text:'ATLANTİK ONLARI YUTTU',accent:'YUTTU'},
  {from:1244,duration:96,text:'GERÇEK HÂLÂ BİLİNMİYOR',accent:'BİLİNMİYOR'},
];
const size=(t:string)=>t.length<=12?92:t.length<=18?80:t.length<=23?69:60;
const CaptionCard:React.FC<Caption>=({duration,text,accent})=>{const f=useCurrentFrame();const {fps}=useVideoConfig();const s=spring({frame:f,fps,config:{damping:15,stiffness:135,mass:.8}});const opacity=Math.min(I(f,0,6,0,1),I(f,duration-8,duration,1,0));const parts=accent&&text.includes(accent)?text.split(accent):[text];return <div style={{position:'absolute',left:58,right:58,bottom:205,display:'flex',justifyContent:'center',opacity,transform:`translateY(${interpolate(s,[0,1],[34,0])}px) scale(${interpolate(s,[0,1],[.92,1])})`,pointerEvents:'none'}}><div style={{maxWidth:964,padding:'18px 30px 22px',background:'linear-gradient(100deg,#090807e6,#1c150fc7)',borderLeft:'8px solid #d8a83a',boxShadow:'0 18px 48px #0008',color:'#f3ead8',fontFamily:'Arial Black,Arial',fontSize:size(text),lineHeight:1,letterSpacing:-2.2,fontWeight:900,whiteSpace:'nowrap',textAlign:'center',textShadow:'0 5px 16px #000e',transform:'rotate(-.55deg)'}}>{parts.length===2?<>{parts[0]}<span style={{color:'#e0ad3b'}}>{accent}</span>{parts[1]}</>:text}</div></div>;};

export const MaryCelesteShort:React.FC=()=>{let cursor=0;return <AbsoluteFill style={{background:'#060605'}}><Audio src={A('audio/ambience.wav')} volume={.16}/>{MARY_CELESTE_SCENES.map((scene,index)=>{const C=scenes[index];const from=cursor;cursor+=scene.duration;return <Sequence key={scene.id} from={from} durationInFrames={scene.duration} name={`Mary Celeste ${scene.id} · ${scene.name}`}><C duration={scene.duration}/><Audio src={A(`audio/scene-${String(scene.id).padStart(2,'0')}.mp3`)} volume={1}/></Sequence>;})}{captions.map((c,i)=><Sequence key={i} from={c.from} durationInFrames={c.duration} name={`Caption ${i+1}`}><CaptionCard {...c}/></Sequence>)}<AbsoluteFill style={{pointerEvents:'none',background:'linear-gradient(180deg,#0000000f,transparent 18%,transparent 76%,#00000038)'}}/></AbsoluteFill>;};
