import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

const scenes = [
  {from:0,dur:180,img:'scene-1.jpg',cap:'YANMIŞ BİR KADIN',sub:'1970 · ISDALEN'},
  {from:180,dur:180,img:'scene-2.jpg',cap:'ETİKETLER KESİLMİŞTİ',sub:'KİMLİĞİ SİLİNMİŞTİ'},
  {from:360,dur:210,img:'scene-3.jpg',cap:'ŞİFRELİ NOTLAR',sub:'İKİ VALİZ · PERUKLAR · PARA'},
  {from:570,dur:240,img:'scene-4.jpg',cap:'HER OTELDE BAŞKA BİR İSİM',sub:'SAHTE KİMLİKLER · GİZEMLİ ROTA'},
  {from:810,dur:210,img:'scene-5.jpg',cap:'MUHTEMEL İNTİHAR',sub:'DOSYA KAPATILDI'},
  {from:1020,dur:180,img:'scene-6.jpg',cap:'CASUS MUYDU?',sub:'GERÇEK ADI HÂLÂ BİLİNMİYOR'},
];

const Grain: React.FC = () => {
  const f=useCurrentFrame();
  return <AbsoluteFill style={{pointerEvents:'none',opacity:.17,mixBlendMode:'overlay',backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${.72+(f%4)*.03}' numOctaves='2' seed='${f%9}'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`}}/>;
};

const Caption: React.FC<{main:string;sub:string;local:number;dur:number}> = ({main,sub,local,dur}) => {
  const {fps}=useVideoConfig();
  const p=spring({frame:local-10,fps,config:{damping:15,stiffness:180,mass:.7}});
  const out=interpolate(local,[dur-18,dur],[1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return <div style={{position:'absolute',left:66,right:66,bottom:170,opacity:out,transform:`translateY(${(1-p)*50}px) rotate(${(1-p)*-1.5}deg)`}}>
    <div style={{display:'inline-block',background:'#e3422b',color:'#fff7dc',fontFamily:'Arial Black, sans-serif',fontSize:78,lineHeight:1.02,padding:'18px 26px 14px',boxShadow:'10px 12px 0 #15100c',letterSpacing:-3}}>{main}</div>
    <div style={{marginTop:20,display:'inline-block',background:'#f0dfb7',color:'#17110d',fontFamily:'monospace',fontSize:28,fontWeight:800,letterSpacing:3,padding:'10px 18px',border:'3px solid #17110d'}}>{sub}</div>
  </div>;
};

const Scene: React.FC<{idx:number;dur:number;img:string;cap:string;sub:string}> = ({idx,dur,img,cap,sub}) => {
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  const stepped=Math.floor(frame/(fps/12))*(fps/12);
  const zoom=interpolate(stepped,[0,dur],[1.04,1.18],{extrapolateRight:'clamp'});
  const x=(idx%2===0?1:-1)*interpolate(stepped,[0,dur],[18,-22],{extrapolateRight:'clamp'});
  const reveal=spring({frame:frame-3,fps,config:{damping:18,stiffness:120}});
  const flash=idx===4?interpolate(frame,[115,120,126],[0,.85,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}):0;
  return <AbsoluteFill style={{background:'#11100e',overflow:'hidden'}}>
    <Img src={staticFile(`isdal/${img}`)} style={{width:'100%',height:'100%',objectFit:'cover',transform:`translateX(${x}px) scale(${zoom})`,filter:'sepia(.18) saturate(.78) contrast(1.12) brightness(.82)'}}/>
    <AbsoluteFill style={{background:'radial-gradient(ellipse at 50% 43%, transparent 28%, rgba(0,0,0,.72) 100%)'}}/>
    <AbsoluteFill style={{opacity:.13,background:'repeating-linear-gradient(90deg,rgba(255,255,255,.12) 0 1px,transparent 1px 5px)'}}/>
    <div style={{position:'absolute',top:105,left:58,fontFamily:'monospace',fontSize:25,fontWeight:900,color:'#f2dfb8',letterSpacing:4,background:'#17110d',padding:'10px 16px',border:'2px solid #d99e25',transform:`scale(${.92+.08*reveal})`}}>DOSYA 1970–11–29 / 0{idx+1}</div>
    {idx===0 && <div style={{position:'absolute',left:520,top:990,width:110,height:140,border:'7px solid #d83b28',transform:`scale(${spring({frame:frame-72,fps,config:{damping:9,stiffness:210}})}) rotate(-8deg)`,color:'#f2dfb8',fontSize:70,fontWeight:900,textAlign:'center',lineHeight:'125px',background:'rgba(120,10,5,.35)'}}>1</div>}
    {idx===2 && <div style={{position:'absolute',right:70,top:430,width:530,height:670,border:'5px solid #e0b64b',background:'rgba(18,12,8,.35)',transform:`translateY(${(1-spring({frame:frame-70,fps,config:{damping:12}}))*500}px) rotate(-5deg)`,boxShadow:'15px 20px 0 rgba(0,0,0,.6)'}}/>}
    {idx===3 && <div style={{position:'absolute',inset:'320px 80px 480px',border:'5px solid rgba(208,45,32,.75)',transform:`rotate(${interpolate(stepped,[0,dur],[-2,2])}deg)`}}/>}
    {idx===5 && <div style={{position:'absolute',left:160,right:160,top:540,height:120,background:'#080808',transform:`translateX(${interpolate(frame,[25,65],[-1200,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}px) rotate(-2deg)`,boxShadow:'0 0 45px #000'}}/>}
    <Caption main={cap} sub={sub} local={frame} dur={dur}/>
    <AbsoluteFill style={{background:`rgba(255,245,220,${flash})`,mixBlendMode:'screen'}}/>
    <Grain/>
  </AbsoluteFill>;
};

export const IsdalWoman: React.FC = () => (
  <AbsoluteFill style={{background:'#000'}}>
    <Audio src={staticFile('isdal/audio/narration.mp3')}/>
    <Audio src={staticFile('isdal/audio/ambience.wav')} volume={0.12}/>
    {scenes.map((s,i)=><Sequence key={s.from} from={s.from} durationInFrames={s.dur}><Scene idx={i} dur={s.dur} img={s.img} cap={s.cap} sub={s.sub}/></Sequence>)}
  </AbsoluteFill>
);
