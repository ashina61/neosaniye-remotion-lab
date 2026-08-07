import React from 'react';
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type {ScenePlan, SceneSpec} from './types';

const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

const MediaLayer: React.FC<{src?: string; opacity?: number; scale?: number}> = ({src, opacity = 1, scale = 1}) => {
  if (!src) return null;
  return <Img src={staticFile(src)} style={{position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity, transform:`scale(${scale})`}} />;
};

const Treatment: React.FC = () => (
  <AbsoluteFill style={{pointerEvents:'none'}}>
    <AbsoluteFill style={{background:'radial-gradient(circle, transparent 40%, rgba(0,0,0,.7) 100%)'}} />
    <AbsoluteFill style={{opacity:.13, backgroundImage:'repeating-linear-gradient(0deg,rgba(255,255,255,.12) 0 1px,transparent 1px 5px)'}} />
  </AbsoluteFill>
);

const SceneText: React.FC<{scene: SceneSpec}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config:{damping:14, stiffness:150}});
  return <>
    {scene.eyebrow ? <div style={{position:'absolute', top:100, left:70, padding:'12px 20px', background:scene.accent ?? '#f6b72c', color:'#15100b', fontFamily:'Arial Black', fontSize:34, transform:`translateX(${interpolate(enter,[0,1],[-90,0])}px)`}}>{scene.eyebrow}</div> : null}
    <div style={{position:'absolute', left:70, right:70, bottom:300, fontFamily:'Arial Black', fontSize:86, lineHeight:.94, color:'#fff6dd', textShadow:'0 10px 0 rgba(0,0,0,.35)', transform:`translateY(${interpolate(enter,[0,1],[90,0])}px)`, opacity:enter}}>{scene.headline}</div>
    <div style={{position:'absolute', left:70, right:70, bottom:135, fontFamily:'Arial', fontWeight:800, fontSize:42, lineHeight:1.1, color:'#fff', borderLeft:`12px solid ${scene.accent ?? '#f6b72c'}`, paddingLeft:24}}>{scene.caption}</div>
  </>;
};

const SceneVisual: React.FC<{scene: SceneSpec}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const push = interpolate(frame,[0,durationInFrames],[1,1.12],clamp);
  const accent = scene.accent ?? '#f6b72c';

  if (scene.background || scene.subject) {
    return <AbsoluteFill style={{overflow:'hidden', background:'#1b1410'}}>
      <MediaLayer src={scene.background} scale={push} />
      <MediaLayer src={scene.subject} scale={interpolate(frame,[0,durationInFrames],[1.05,1.16],clamp)} />
      {(scene.objects ?? []).map((src,index)=><Img key={src} src={staticFile(src)} style={{position:'absolute', width:260, left:70 + index*250, top:350 + (index%2)*150, transform:`rotate(${index%2 ? 8 : -8}deg) translateY(${interpolate(frame,[0,20+index*8],[100,0],clamp)}px)`}} />)}
    </AbsoluteFill>;
  }

  switch (scene.template) {
    case 'big-number':
      return <AbsoluteFill style={{background:`repeating-conic-gradient(${accent} 0 12deg,#24130d 12deg 24deg)`}}><div style={{position:'absolute', inset:0, display:'grid', placeItems:'center', fontFamily:'Arial Black', fontSize:150, color:'#fff6d6', WebkitTextStroke:'8px #1a0f09', transform:`scale(${interpolate(frame,[0,26],[.3,1],clamp)}) rotate(${interpolate(frame,[0,24],[-12,0],clamp)}deg)`}}>{scene.headline}</div></AbsoluteFill>;
    case 'newspaper-stack':
      return <AbsoluteFill style={{background:'#6f1517'}}>{[0,1,2,3].map((n)=><div key={n} style={{position:'absolute', left:100+n*130, top:280+n*170, width:620, height:250, background:'#ead9b5', border:'7px solid #21140d', transform:`translateY(${interpolate(frame,[n*8,n*8+20],[-500,0],clamp)}px) rotate(${n%2 ? 6 : -6}deg)`, boxShadow:'18px 22px 0 rgba(0,0,0,.25)'}} />)}</AbsoluteFill>;
    case 'character-shadow':
      return <AbsoluteFill style={{background:'linear-gradient(#19110e,#6f201b)'}}><div style={{position:'absolute', left:410, top:560, width:260, height:650, borderRadius:'48% 48% 20% 20%', background:'#130d0a', transform:`scale(${push})`}}/><div style={{position:'absolute', left:515, top:470, width:160, height:160, borderRadius:'50%', background:'#b97852'}}/><div style={{position:'absolute', left:520, top:1120, width:620, height:180, background:'rgba(0,0,0,.45)', transform:'skewX(-50deg) rotate(8deg)', transformOrigin:'left center'}}/></AbsoluteFill>;
    case 'final-verdict':
      return <AbsoluteFill style={{background:'#120d0b'}}><div style={{position:'absolute', left:70, right:70, top:380, height:520, border:`10px solid ${accent}`, transform:`rotate(${interpolate(frame,[0,18],[-5,0],clamp)}deg) scale(${interpolate(frame,[0,18],[.7,1],clamp)})`}}/><div style={{position:'absolute', left:140, top:530, fontSize:260}}>☝</div></AbsoluteFill>;
    default:
      return <AbsoluteFill style={{background:'linear-gradient(145deg,#d8c79d,#3b2416)'}}><div style={{position:'absolute', left:170, right:170, top:260, height:900, border:'28px solid #9f6518', background:'#24130d', transform:`scale(${push})`}}/></AbsoluteFill>;
  }
};

const PlannedScene: React.FC<{scene: SceneSpec}> = ({scene}) => <AbsoluteFill style={{overflow:'hidden'}}><SceneVisual scene={scene}/><SceneText scene={scene}/><Treatment/></AbsoluteFill>;

export const SceneEngineVideo: React.FC<{plan: ScenePlan}> = ({plan}) => {
  let cursor = 0;
  return <AbsoluteFill style={{background:'#000'}}>{plan.scenes.map((scene)=>{
    const from = cursor;
    cursor += scene.duration;
    return <Sequence key={scene.id} from={from} durationInFrames={scene.duration}><PlannedScene scene={scene}/></Sequence>;
  })}</AbsoluteFill>;
};
