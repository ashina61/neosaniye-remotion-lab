import React from 'react';
import {AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import storyboardData from '../public/storyboard.json';
import {StoryboardSchema, type Shot} from './storyboard';

const storyboard = StoryboardSchema.parse(storyboardData);

const palettes = [
  ['#090b10','#24344a','#d29a45'],
  ['#100b09','#5a241b','#e5b75d'],
  ['#07110f','#1d5548','#76c7a5'],
  ['#0d0a13','#49305f','#d18ee8'],
  ['#111009','#665323','#e7d076'],
  ['#081019','#174c72','#74b9dd']
];

const transformFor = (shot: Shot, progress: number) => {
  const zoomIn = interpolate(progress, [0,1], [1.03,1.16]);
  const zoomOut = interpolate(progress, [0,1], [1.16,1.03]);
  const drift = interpolate(progress, [0,1], [-4,4]);
  switch (shot.movement) {
    case 'zoom-in':
    case 'push-in': return `scale(${zoomIn})`;
    case 'zoom-out':
    case 'pull-out': return `scale(${zoomOut})`;
    case 'pan-left': return `scale(1.12) translateX(${-drift}%)`;
    case 'pan-right': return `scale(1.12) translateX(${drift}%)`;
    case 'drift-up': return `scale(1.1) translateY(${-drift}%)`;
    case 'drift-down': return `scale(1.1) translateY(${drift}%)`;
    default: return 'scale(1.07)';
  }
};

const ProceduralScene: React.FC<{shot: Shot; progress: number}> = ({shot, progress}) => {
  const [dark, mid, accent] = palettes[(shot.id - 1) % palettes.length];
  const rotation = interpolate(progress, [0,1], [-3,3]);
  const x = shot.cropX;
  const y = shot.cropY;
  const common = {position: 'absolute' as const, boxShadow: '0 28px 80px rgba(0,0,0,.42)'};

  return <AbsoluteFill style={{background: `radial-gradient(circle at ${x}% ${y}%, ${mid}, ${dark} 72%)`, transform: transformFor(shot, progress), overflow: 'hidden'}}>
    <div style={{...common, width: 760, height: 760, borderRadius: shot.sceneKind === 'architecture' ? 40 : '50%', left: x * 2 - 100, top: y * 7 - 220, background: `linear-gradient(145deg, ${accent}55, ${mid}22)`, border: `3px solid ${accent}55`, transform: `rotate(${rotation}deg)`}} />
    <div style={{...common, width: 420, height: 980, left: 100 + (shot.id % 4) * 150, top: 180, borderRadius: shot.sceneKind === 'document' ? 24 : 220, background: `linear-gradient(180deg, ${accent}33, transparent)`, border: `2px solid ${accent}44`, transform: `rotate(${rotation * -1.7}deg)`}} />
    {shot.sceneKind === 'mechanism' && Array.from({length: 7}, (_, i) => <div key={i} style={{position:'absolute', width:180+i*34, height:180+i*34, borderRadius:'50%', border:`8px dashed ${accent}${i % 2 ? '55' : '88'}`, left:80+i*70, top:300+i*90, transform:`rotate(${rotation*12+i*17}deg)`}} />)}
    {shot.sceneKind === 'crowd' && Array.from({length: 18}, (_, i) => <div key={i} style={{position:'absolute', width:70+(i%3)*18, height:170+(i%4)*26, borderRadius:'50% 50% 18px 18px', background:`${i%2?accent:mid}88`, left:(i%6)*180-20, top:760+Math.floor(i/6)*190}} />)}
    {shot.sceneKind === 'map' && <div style={{position:'absolute', inset:120, border:`4px solid ${accent}66`, borderRadius:80, background:`repeating-linear-gradient(25deg, transparent 0 55px, ${accent}18 56px 62px)`, transform:`rotate(${rotation}deg)`}} />}
    {shot.sceneKind === 'explosion' && Array.from({length: 16}, (_, i) => <div key={i} style={{position:'absolute', width:18, height:360, background:`linear-gradient(${accent}, transparent)`, left:520, top:520, transformOrigin:'50% 100%', transform:`rotate(${i*22.5}deg) translateY(-220px)`}} />)}
    <AbsoluteFill style={{background:'repeating-linear-gradient(0deg, transparent 0 5px, rgba(255,255,255,.018) 6px)'}} />
  </AbsoluteFill>;
};

const ShotView: React.FC<{shot: Shot}> = ({shot}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const frames = Math.max(1, Math.round(shot.duration * fps));
  const progress = Math.min(1, frame / Math.max(1, frames - 1));
  const fade = Math.min(4, Math.max(1, Math.floor(frames / 6)));
  const opacity = interpolate(frame, [0,fade,frames-fade,frames-1], [1,1,1,0], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
  const captionY = interpolate(frame, [0,Math.min(7,frames-1)], [28,0], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
  const captionOpacity = interpolate(frame, [0,Math.min(5,frames-1)], [0,1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});

  return <AbsoluteFill style={{backgroundColor:'#080706', overflow:'hidden', opacity}}>
    {shot.asset ? <Img src={staticFile(shot.asset)} style={{width:'100%', height:'100%', objectFit:'cover', objectPosition:`${shot.cropX}% ${shot.cropY}%`, transform:transformFor(shot, progress)}} /> : <ProceduralScene shot={shot} progress={progress} />}
    <AbsoluteFill style={{background:'linear-gradient(180deg, rgba(0,0,0,.08), rgba(0,0,0,.02) 48%, rgba(0,0,0,.86))'}} />
    <div style={{position:'absolute', left:72, right:72, bottom:210, color:'white', fontFamily:'Arial, sans-serif', fontWeight:900, fontSize:70, lineHeight:1.02, textAlign:'center', letterSpacing:-1.5, textShadow:'0 5px 22px rgba(0,0,0,.95)', transform:`translateY(${captionY}px)`, opacity:captionOpacity}}>{shot.caption}</div>
  </AbsoluteFill>;
};

export const Video: React.FC = () => <AbsoluteFill style={{backgroundColor:'#080706'}}>
  {storyboard.shots.map((shot) => <Sequence key={shot.id} from={Math.round(shot.start*storyboard.fps)} durationInFrames={Math.max(1,Math.round(shot.duration*storyboard.fps))}><ShotView shot={shot}/></Sequence>)}
</AbsoluteFill>;
