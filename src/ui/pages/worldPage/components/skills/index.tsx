import './style.less';
import { observer } from 'mobx-react-lite';
import { Store } from '../../../../../store';
import { playFlame } from '../../../../../effects/flame';
import { useState } from 'react';
import { Vector3 } from '../../../../../libs/babylon/exports';

export const Skills = observer(() => {
  const [flame, setFlame] = useState<{ stop: () => void } | null>(null);

  const world = Store.world;
  if (!world) return null;
  const scene = world.scene;

  return (
    <div className="skills">
      <button
        onPointerDown={() => {
          const playerPos = world.playerEntity.transform.pos;
          const pos = new Vector3().copyFrom(playerPos as any);
          pos.x += 0.5;
          pos.z += 0.5;

          setFlame(playFlame(scene, pos));
        }}
        onPointerCancel={() => {
          flame?.stop();
          setFlame(null);
        }}
        onPointerUp={() => {
          flame?.stop();
          setFlame(null);
        }}
      >
        SKILL
      </button>
    </div>
  );
});
