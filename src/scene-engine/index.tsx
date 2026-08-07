import React from 'react';
import {Composition, registerRoot} from 'remotion';
import rawPlan from '../../public/scene-plan.json';
import {SceneEngineVideo} from './SceneEngine';
import {parseScenePlan, totalFrames} from './types';

const plan = parseScenePlan(rawPlan);

const SceneEngineRoot: React.FC = () => (
  <Composition
    id="SceneEngineDemo"
    component={SceneEngineVideo}
    durationInFrames={totalFrames(plan)}
    fps={plan.fps}
    width={plan.width}
    height={plan.height}
    defaultProps={{plan}}
  />
);

registerRoot(SceneEngineRoot);
