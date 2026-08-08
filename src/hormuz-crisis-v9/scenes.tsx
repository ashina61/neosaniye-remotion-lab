import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {ASSETS} from './data';
import {BottomRule, Flash, FullAsset, Grain, RedWash, Shake, Title, Vignette, ease, p} from './components';

const bg = '#071014';

export const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  const zoom = interpolate(ease(p(f, 0, 145)), [0, 1], [1.0, 1.13]);
  const route = p(f, 18, 85);
  const reticle = p(f, 104, 129);
  return (
    <AbsoluteFill style={{backgroundColor: bg}}>
      <FullAsset src={ASSETS[1]} scale={zoom} x={-20 * p(f, 30, 145)} brightness={0.78} contrast={1.1} />
      <FullAsset src={ASSETS[3]} opacity={route * 0.7} scale={1.12} mixBlendMode="screen" />
      <FullAsset src={ASSETS[4]} opacity={p(f, 38, 58) * 0.8} scale={1.16 - p(f, 38, 120) * 0.08} x={50 - p(f, 38, 120) * 84} y={290} />
      <FullAsset src={ASSETS[2]} opacity={reticle * 0.84} scale={1.38 - reticle * 0.38} mixBlendMode="screen" />
      <Title text="DÜNYA PETROLÜNÜN" inFrame={12} outFrame={45} size={48} top={1090} />
      <Title text="BEŞTE BİRİ" inFrame={28} outFrame={74} size={104} top={1170} accent />
      <Title text="DAR GEÇİT" inFrame={62} outFrame={105} size={70} top={1250} />
      <Title text={'HÜRMÜZ\nBOĞAZI'} inFrame={125} outFrame={150} size={112} top={1130} accent />
      <BottomRule label="STRAIT OF HORMUZ / ENERGY CHOKEPOINT" />
      <RedWash opacity={reticle * 0.22} />
      <Vignette />
      <Grain />
    </AbsoluteFill>
  );
};

export const Scene2: React.FC = () => {
  const f = useCurrentFrame();
  const tension = p(f, 35, 130);
  const crisis = p(f, 68, 82) * (1 - p(f, 89, 99));
  return (
    <AbsoluteFill style={{backgroundColor: '#080d12'}}>
      <FullAsset src={ASSETS[6]} scale={1.04 + tension * 0.04} brightness={0.68} contrast={1.15} />
      <FullAsset src={ASSETS[7]} opacity={p(f, 10, 35) * 0.78} scale={1.2} x={-120 + p(f, 10, 60) * 90} y={280} />
      <FullAsset src={ASSETS[8]} opacity={p(f, 20, 45) * 0.72} scale={1.28} x={120 - p(f, 20, 70) * 100} y={500} />
      <FullAsset src={ASSETS[9]} opacity={p(f, 35, 50) * 0.45} scale={1.2} x={380 - p(f, 35, 115) * 720} y={-350} mixBlendMode="screen" />
      <FullAsset src={ASSETS[10]} opacity={crisis * 0.75} scale={1.08} mixBlendMode="screen" />
      <Title text="ABD" inFrame={18} outFrame={70} size={86} top={1120} align="left" />
      <Title text="İRAN" inFrame={26} outFrame={70} size={86} top={1240} align="left" accent />
      <Title text="YENİDEN ALEVLENDİ" inFrame={73} outFrame={125} size={71} top={1200} accent />
      <Title text="CEPHE HATTI" inFrame={128} outFrame={150} size={102} top={1180} accent />
      <Flash at={74} color="#ff3a20" length={8} />
      <BottomRule label="U.S. / IRAN / ESCALATION" />
      <RedWash opacity={0.26 + tension * 0.1} />
      <Vignette amount={0.82} />
      <Grain />
    </AbsoluteFill>
  );
};

export const Scene3: React.FC = () => {
  const f = useCurrentFrame();
  const stop = p(f, 55, 88);
  return (
    <AbsoluteFill style={{backgroundColor: '#071013'}}>
      <FullAsset src={ASSETS[11]} scale={1.08 - p(f, 0, 70) * 0.07} brightness={0.65} />
      <FullAsset src={ASSETS[13]} opacity={p(f, 18, 40) * 0.7} scale={1.03} />
      <FullAsset src={ASSETS[12]} opacity={stop * 0.58} scale={1.12 - stop * 0.12} mixBlendMode="screen" />
      <FullAsset src={ASSETS[14]} opacity={p(f, 88, 105) * 0.85} scale={1.02} />
      <Title text="GEÇİŞLER" inFrame={22} outFrame={56} size={70} top={1110} />
      <Title text="KISITLANDI" inFrame={38} outFrame={94} size={98} top={1200} accent />
      <Title text="SALDIRI TEHDİDİ" inFrame={80} outFrame={122} size={64} top={1220} />
      <Shake from={126} to={145} power={9}>
        <FullAsset src={ASSETS[15]} opacity={p(f, 126, 133)} scale={1.02} />
      </Shake>
      <BottomRule label="MARITIME TRAFFIC / BLOCKED" />
      <RedWash opacity={0.22 + stop * 0.18} />
      <Vignette amount={0.84} />
      <Grain />
    </AbsoluteFill>
  );
};

export const Scene4: React.FC = () => {
  const f = useCurrentFrame();
  const tactical = p(f, 42, 70);
  const clash = p(f, 96, 126);
  return (
    <AbsoluteFill style={{backgroundColor: '#061016'}}>
      <FullAsset src={ASSETS[16]} scale={1 + p(f, 0, 60) * 0.07} brightness={0.72} />
      <FullAsset src={ASSETS[18]} opacity={tactical * (1 - p(f, 88, 105))} scale={1.04} />
      <FullAsset src={ASSETS[17]} opacity={p(f, 72, 92) * 0.76} scale={1.08} x={70 - p(f, 72, 118) * 90} />
      <FullAsset src={ASSETS[19]} opacity={clash * 0.9} scale={1.04 + clash * 0.03} mixBlendMode="screen" />
      <Title text={'SEYRÜSEFER\nÖZGÜRLÜĞÜ'} inFrame={14} outFrame={62} size={70} top={1100} />
      <Title text="DONANMA BÖLGEDE" inFrame={58} outFrame={108} size={68} top={1220} />
      <Title text="KARŞI ÇIKIYOR" inFrame={112} outFrame={148} size={87} top={1210} accent />
      <Flash at={145} color="#e8f5ff" length={5} />
      <BottomRule label="NAVAL STANDOFF / FREEDOM OF NAVIGATION" color="#4da3ff" />
      <Vignette amount={0.78} />
      <Grain />
    </AbsoluteFill>
  );
};

export const Scene5: React.FC = () => {
  const f = useCurrentFrame();
  const mapIn = p(f, 38, 62);
  const traffic = p(f, 66, 88);
  const doubt = p(f, 108, 140);
  return (
    <AbsoluteFill style={{backgroundColor: '#0a1213'}}>
      <FullAsset src={ASSETS[21]} scale={1 + p(f, 0, 45) * 0.03} brightness={0.82} />
      <FullAsset src={ASSETS[20]} opacity={mapIn * (1 - p(f, 66, 78))} scale={1.04} />
      <FullAsset src={ASSETS[23]} opacity={p(f, 52, 75) * (1 - p(f, 94, 108))} scale={1.02} />
      <FullAsset src={ASSETS[22]} opacity={traffic * 0.82} scale={1.03 + p(f, 70, 145) * 0.03} brightness={0.86 - doubt * 0.17} />
      <Title text="UMMAN ARABULUCULUĞUNDA" inFrame={20} outFrame={68} size={58} top={1160} />
      <Title text="YENİ GEÇİŞ DÜZENİ" inFrame={57} outFrame={106} size={67} top={1200} />
      <Title text="ESKİ NORMALİNE" inFrame={112} outFrame={139} size={61} top={1150} />
      <Title text="DÖNMÜŞ DEĞİL" inFrame={132} outFrame={150} size={90} top={1240} accent />
      <RedWash opacity={doubt * 0.24} />
      <BottomRule label="OMAN MEDIATION / FRAGILE NORMALIZATION" color="#c5a35c" />
      <Vignette amount={0.76} />
      <Grain />
    </AbsoluteFill>
  );
};

export const Scene6: React.FC = () => {
  const f = useCurrentFrame();
  const shock = p(f, 102, 132);
  const final = p(f, 132, 145);
  return (
    <AbsoluteFill style={{backgroundColor: '#05080c'}}>
      <FullAsset src={ASSETS[24]} scale={1.03 + p(f, 0, 65) * 0.06} brightness={0.73} />
      <FullAsset src={ASSETS[25]} opacity={p(f, 50, 66) * (1 - p(f, 76, 84))} scale={1.02} />
      <FullAsset src={ASSETS[26]} opacity={p(f, 75, 85) * (1 - p(f, 96, 104))} scale={1.05} />
      <FullAsset src={ASSETS[27]} opacity={p(f, 92, 102) * (1 - p(f, 108, 116))} scale={1.02} />
      <FullAsset src={ASSETS[28]} opacity={shock * 0.75} scale={1.08 - shock * 0.08} mixBlendMode="screen" />
      <FullAsset src={ASSETS[29]} opacity={p(f, 118, 130) * (1 - p(f, 140, 149) * 0.25)} scale={1.12 - final * 0.08} />
      <FullAsset src={ASSETS[31]} opacity={shock * 0.5} scale={1.12} mixBlendMode="screen" />
      <Title text="TEK BİR" inFrame={16} outFrame={42} size={63} top={1130} />
      <Title text="YANLIŞ HESAP" inFrame={31} outFrame={70} size={96} top={1210} accent />
      <Title text="PETROL FİYATLARI" inFrame={63} outFrame={84} size={66} top={1200} />
      <Title text="KÜRESEL TİCARET" inFrame={88} outFrame={116} size={68} top={1200} />
      <Shake from={137} to={149} power={10}>
        <FullAsset src={ASSETS[30]} opacity={p(f, 137, 143) * 0.82} scale={1.03} />
        <Title text={'BÜTÜN DÜNYAYI\nSARSABİLİR'} inFrame={137} outFrame={150} size={86} top={1120} accent />
      </Shake>
      <BottomRule label="GLOBAL ENERGY / TRADE SHOCK" />
      <Vignette amount={0.9} />
      <Grain />
    </AbsoluteFill>
  );
};
