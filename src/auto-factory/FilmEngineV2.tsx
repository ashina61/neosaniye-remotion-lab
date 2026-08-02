import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig
} from 'remotion';
import planJson from '../../public/auto-factory/plan.json';
import {FactoryPlanSchema, type ScenePlan} from './schema';
import {AutoShortV2, AUTO_FACTORY_V2_FRAMES} from './AutoShortV2';

const plan=FactoryPlanSchema.parse(planJson);
const P=plan.palette;
const accent=(scene:ScenePlan)=>({red:P.red,teal:P.teal,gold:P.gold,blue:P.blue}[scene.accent]);
const clamp=(value:number,min=0,max=1)=>Math.max(min,Math.min(max,value));
const steppedFrame=(frame:number,fps:number,target=12)=>Math.floor(frame*target/fps)*fps/target;

const FilmTreatment:React.FC=()=>{
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  const stepped=steppedFrame(frame,fps);
  const x=Math.sin(stepped*.61)*3.4+Math.sin(stepped*.17)*1.3;
  const y=Math.cos(stepped*.53)*2.8+Math.sin(stepped*.21)*1.1;
  const rotate=Math.sin(stepped*.27)*.055;
  return <>
    <AbsoluteFill style={{pointerEvents:'none',opacity:.16,filter:'blur(.7px)',backgroundImage:'repeating-linear-gradient(90deg,rgba(0,0,0,.62) 0 1.6px,transparent 1.6px 8px)',transform:`translate(${x*.3}px,${y*.2}px)`}}/>
    <AbsoluteFill style={{pointerEvents:'none',opacity:.55,mixBlendMode:'multiply',filter:'invert(1) brightness(1.35) contrast(1.02)',backgroundImage:'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27180%27 height=%27180%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%27.82%27 numOctaves=%273%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27 opacity=%27.62%27/%3E%3C/svg%3E")',backgroundPosition:`${x*4}px ${y*4}px`}}/>
    <AbsoluteFill style={{pointerEvents:'none',opacity:.16,mixBlendMode:'color-burn',backgroundImage:'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27320%27 height=%27320%27%3E%3Cfilter id=%27g%27%3E%3CfeTurbulence type=%27turbulence%27 baseFrequency=%27.018 .09%27 numOctaves=%274%27 seed=%278%27/%3E%3CfeColorMatrix values=%271 0 0 0 -.2 0 1 0 0 -.2 0 0 1 0 -.2 0 0 0 1 0%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23g)%27/%3E%3C/svg%3E")'}}/>
    <AbsoluteFill style={{pointerEvents:'none',background:'radial-gradient(ellipse 92% 82% at 50% 48%,transparent 0 55%,rgba(0,0,0,.5) 100%)'}}/>
    <AbsoluteFill style={{pointerEvents:'none',border:'1px solid rgba(255,248,220,.08)',transform:`translate(${x}px,${y}px) rotate(${rotate}deg) scale(1.012)`}}/>
  </>;
};

const DrawDiamond:React.FC<{x:number;y:number;size:number;progress:number;color:string;rotation?:number}>=({x,y,size,progress,color,rotation=0})=><svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0,pointerEvents:'none'}}>
  <g transform={`translate(${x} ${y}) rotate(${rotation})`}>
    <path d={`M0 ${-size} L${size} 0 L0 ${size} L${-size} 0 Z`} fill="none" stroke="rgba(255,244,212,.7)" strokeWidth="7" strokeDasharray="18 12" pathLength="1" strokeDashoffset={1-progress}/>
    <path d={`M0 ${-size} L${size} 0 L0 ${size} L${-size} 0 Z`} fill="none" stroke={color} strokeWidth="3" strokeDasharray="12 14" pathLength="1" strokeDashoffset={1-progress}/>
  </g>
</svg>;

const FramePortal:React.FC<{scene:ScenePlan;frame:number;duration:number}>=({scene,frame,duration})=>{
  const {fps}=useVideoConfig();
  const stepped=steppedFrame(frame,fps);
  const slow=interpolate(stepped,[0,duration*.56],[1,1.15],{extrapolateRight:'clamp'});
  const rush=interpolate(stepped,[duration*.56,duration*.88],[1,6.2],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const scale=frame<duration*.56?slow:rush;
  const blur=interpolate(frame,[duration*.56,duration*.67,duration*.86],[0,8.5,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const fade=interpolate(frame,[duration*.65,duration*.9],[.8,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return <AbsoluteFill style={{pointerEvents:'none',opacity:fade,filter:`blur(${blur}px)`,transform:`scale(${scale})`}}>
    <div style={{position:'absolute',left:145,top:300,width:790,height:1010,border:'30px double #b99a55',boxShadow:`0 0 0 12px ${P.ink},0 30px 80px rgba(0,0,0,.4)`,background:'transparent'}}/>
    <div style={{position:'absolute',left:390,top:1320,padding:'12px 28px',background:'#e9dcc0',border:`4px solid ${P.ink}`,fontFamily:'Georgia,serif',fontSize:28,fontStyle:'italic',color:P.ink}}>{scene.kicker.slice(0,34)}</div>
  </AbsoluteFill>;
};

const OpposingProps:React.FC<{scene:ScenePlan;frame:number;duration:number}>=({scene,frame,duration})=>{
  const {fps}=useVideoConfig(); const stepped=steppedFrame(frame,fps,8);
  const left=spring({frame:stepped-5,fps,config:{damping:17,stiffness:95,mass:.8}});
  const right=spring({frame:stepped-18,fps,config:{damping:17,stiffness:95,mass:.8}});
  const boss=spring({frame:stepped-duration*.44,fps,config:{damping:13,stiffness:120,mass:.72}});
  const draw=clamp(frame/(duration*.4)); const color=accent(scene);
  return <AbsoluteFill style={{pointerEvents:'none'}}>
    <DrawDiamond x={230} y={1040} size={128} progress={draw} color={color} rotation={-6+Math.sin(stepped*.4)*2}/>
    <DrawDiamond x={850} y={1040} size={128} progress={draw} color={P.gold} rotation={6-Math.sin(stepped*.4)*2}/>
    <div style={{position:'absolute',left:interpolate(left,[0,1],[-340,70]),top:960,width:300,height:150,background:'#eee1c4',border:`7px solid ${P.ink}`,transform:'rotate(-7deg)',boxShadow:'12px 18px 0 rgba(0,0,0,.2)',display:'grid',placeItems:'center',fontFamily:'Arial',fontWeight:950,fontSize:30,color}}>{scene.props[0]}</div>
    <div style={{position:'absolute',right:interpolate(right,[0,1],[-340,70]),top:960,width:300,height:150,background:P.gold,border:`7px solid ${P.ink}`,transform:'rotate(7deg)',boxShadow:'12px 18px 0 rgba(0,0,0,.2)',display:'grid',placeItems:'center',fontFamily:'Arial',fontWeight:950,fontSize:30,color:P.ink}}>{scene.props[1]}</div>
    <div style={{position:'absolute',left:410,top:700,width:260,height:260,borderRadius:'50%',border:`10px solid ${P.ink}`,background:'rgba(45,32,25,.18)',transform:`scale(${.2+boss*.8})`,opacity:boss*.26}}/>
  </AbsoluteFill>;
};

const PaperDrops:React.FC<{scene:ScenePlan;frame:number}>=({scene,frame})=>{
  const {fps}=useVideoConfig(); const stepped=steppedFrame(frame,fps,12);
  const starts=[8,22,36]; const positions=[[100,760,-8],[470,810,7],[250,1030,-3]];
  return <AbsoluteFill style={{pointerEvents:'none'}}>{starts.map((start,index)=>{
    const p=spring({frame:stepped-start,fps,config:{damping:13,stiffness:42,mass:1.1}});
    const [x,y,r]=positions[index]; const fromX=index===0?-560:index===1?600:0; const fromY=index===2?700:120;
    return <div key={start} style={{position:'absolute',left:x+fromX*(1-p),top:y+fromY*(1-p),width:430,height:235,background:'#e9dcc0',border:`7px solid ${P.ink}`,boxShadow:'15px 20px 0 rgba(0,0,0,.2)',transform:`rotate(${r+(1-p)*(index===1?22:-22)}deg) scale(${1.1-p*.1})`,opacity:clamp(p),padding:'34px 32px',fontFamily:'Georgia,serif',fontWeight:800,fontSize:36,color:index===1?accent(scene):P.ink}}>{scene.props[index%scene.props.length]}</div>;
  })}</AbsoluteFill>;
};

const GroundedParallax:React.FC<{scene:ScenePlan;frame:number;duration:number}>=({scene,frame,duration})=>{
  const push=interpolate(frame,[0,duration*.68],[.72,1.52],{extrapolateRight:'clamp'});
  const shift=interpolate(frame,[duration*.58,duration*.75],[0,-190],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const blur=interpolate(frame,[duration*.58,duration*.66,duration*.75],[0,8,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return <AbsoluteFill style={{pointerEvents:'none'}}>
    <div style={{position:'absolute',left:450+shift,top:930,width:210,height:420,transformOrigin:'50% 100%',transform:`scale(${push})`,filter:`blur(${blur}px)`,opacity:.16,background:P.ink,clipPath:'polygon(38% 0,62% 0,72% 23%,85% 100%,15% 100%,28% 23%)'}}/>
    <div style={{position:'absolute',left:515+shift,top:1270,width:170,height:540,transformOrigin:'50% 0%',transform:`skewX(-53deg) scaleY(.55)`,filter:'blur(7px)',opacity:.22,background:'#000',clipPath:'polygon(38% 0,62% 0,72% 23%,85% 100%,15% 100%,28% 23%)'}}/>
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0}}><path d="M690 1050 C790 1020 865 1035 955 1008" stroke={P.gold} strokeWidth="10" fill="none" pathLength="1" strokeDasharray="1" strokeDashoffset={1-clamp((frame-duration*.62)/(duration*.16))}/></svg>
  </AbsoluteFill>;
};

const FocusBloom:React.FC<{scene:ScenePlan;frame:number;duration:number}>=({scene,frame,duration})=>{
  const {fps}=useVideoConfig(); const stepped=steppedFrame(frame,fps);
  const focus=interpolate(stepped,[0,duration*.18,duration*.45,duration*.62,duration],[10,0,0,7,1],{extrapolateRight:'clamp'});
  const bloom=interpolate(stepped,[0,duration*.2,duration*.48,duration*.62,duration],[2.2,1,1,2.35,1.1],{extrapolateRight:'clamp'});
  const swing=Math.sin(stepped*.045)*3;
  const flicker=([23,24,25,26,27,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,64,65,66,67,68,69,70].includes(Math.floor(frame)))?.52:0;
  return <AbsoluteFill style={{pointerEvents:'none',filter:`blur(${focus}px)`}}>
    <div style={{position:'absolute',left:470,top:250,width:150,height:170,transformOrigin:'50% 0%',transform:`rotate(${swing}deg)`}}>
      <div style={{position:'absolute',left:52,top:68,width:46,height:46,borderRadius:'50%',background:'#fff6d3',boxShadow:`0 0 ${55*bloom}px ${24*bloom}px rgba(255,218,125,.38),0 0 ${150*bloom}px ${62*bloom}px rgba(255,186,75,.17)`,transform:`scale(${bloom})`}}/>
      <div style={{position:'absolute',left:-140,top:110,width:430,height:750,clipPath:'polygon(45% 0,55% 0,100% 100%,0 100%)',background:'linear-gradient(rgba(255,222,145,.18),transparent 78%)',filter:'blur(28px)'}}/>
    </div>
    <div style={{position:'absolute',left:150,top:980,width:780,height:300,background:accent(scene),opacity:flicker,mixBlendMode:'screen',clipPath:'polygon(2% 20%,96% 0,100% 78%,8% 100%)'}}/>
  </AbsoluteFill>;
};

const GestureWag:React.FC<{scene:ScenePlan;frame:number;duration:number}>=({scene,frame,duration})=>{
  const t=Math.max(0,frame-duration*.22); const enter=clamp(t/12); const angle=28*Math.cos(t*.52)*Math.exp(-.042*t);
  return <AbsoluteFill style={{pointerEvents:'none'}}>
    <div style={{position:'absolute',right:110,bottom:290,width:250,height:360,transformOrigin:'55% 92%',transform:`translateY(${(1-enter)*430}px) scale(${.72+enter*.28}) rotate(${angle}deg)`,opacity:enter}}>
      <svg width="250" height="360" viewBox="0 0 250 360"><path d="M110 335 C65 302 58 250 74 214 L93 168 L73 92 C66 61 82 37 108 42 C130 46 137 64 139 86 L142 117 L154 48 C160 17 187 13 200 35 C207 47 203 67 199 83 L185 158 L213 126 C232 105 255 119 248 145 C244 160 226 177 214 191 L184 233 C171 253 166 286 171 319 Z" fill={P.red} stroke={P.ink} strokeWidth="10"/><text x="126" y="230" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="40" fill="#fff1d1">{scene.props[0]?.slice(0,4)}</text></svg>
    </div>
  </AbsoluteFill>;
};

const SignatureLayer:React.FC<{scene:ScenePlan}>=({scene})=>{
  const frame=useCurrentFrame(); const {fps}=useVideoConfig(); const duration=Math.round(scene.duration*fps);
  const signature=(scene.id-1)%6;
  if(signature===0)return <FramePortal scene={scene} frame={frame} duration={duration}/>;
  if(signature===1)return <OpposingProps scene={scene} frame={frame} duration={duration}/>;
  if(signature===2)return <PaperDrops scene={scene} frame={frame}/>;
  if(signature===3)return <GroundedParallax scene={scene} frame={frame} duration={duration}/>;
  if(signature===4)return <FocusBloom scene={scene} frame={frame} duration={duration}/>;
  return <GestureWag scene={scene} frame={frame} duration={duration}/>;
};

export const AutoShortV2Enhanced:React.FC=()=>{
  const frame=useCurrentFrame(); const {fps}=useVideoConfig(); const stepped=steppedFrame(frame,fps);
  const x=Math.sin(stepped*.61)*3.4+Math.sin(stepped*.17)*1.3;
  const y=Math.cos(stepped*.53)*2.8+Math.sin(stepped*.21)*1.1;
  const rotation=Math.sin(stepped*.27)*.055;
  return <AbsoluteFill style={{background:P.ink,overflow:'hidden'}}>
    <div style={{position:'absolute',inset:-12,transform:`translate(${x}px,${y}px) rotate(${rotation}deg) scale(1.012)`,filter:'saturate(.86) contrast(1.08) sepia(.16) brightness(.95)'}}>
      <AutoShortV2/>
    </div>
    {plan.scenes.map(scene=><Sequence key={`signature-${scene.id}`} from={Math.round(scene.start*plan.fps)} durationInFrames={Math.round(scene.duration*plan.fps)}><SignatureLayer scene={scene}/></Sequence>)}
    <FilmTreatment/>
  </AbsoluteFill>;
};

export const AUTO_FACTORY_V2_ENHANCED_FRAMES=AUTO_FACTORY_V2_FRAMES;
