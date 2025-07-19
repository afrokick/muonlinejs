import './style.less';
import { observer } from 'mobx-react-lite';
import { Store } from '../../../../../store';
import { playFlame } from '../../../../../effects/flame';
import { useEffect, useState } from 'react';
import { Vector3 } from '../../../../../libs/babylon/exports';
import { playEnergyBall } from '../../../../../effects/energyBall';
import { Rand } from '../../../../../common/rand';

export const Skills = observer(() => {
  const [flame, setFlame] = useState<{ stop: () => void } | null>(null);

  const world = Store.world;
  if (!world) return null;
  const scene = world.scene;

  const getPlayerPos = () => {
    const playerPos = world.playerEntity.transform.pos;
    const pos = new Vector3().copyFrom(playerPos as any);
    pos.x += 0.5;
    pos.z += 0.5;

    return pos;
  };

  // useEffect(() => {
  //   if (!world) return;

  //   setInterval(() => {
  //     const from = getPlayerPos().addInPlaceFromFloats(0, 1, 0);
  //     const to = from
  //       .clone()
  //       .addInPlaceFromFloats(
  //         Rand.nextFloat(1, 4) * Rand.nextSign(),
  //         0,
  //         Rand.nextFloat(1, 4) * Rand.nextSign()
  //       );

  //     //offset towards the target
  //     const dir = to.subtract(from).normalize();
  //     from.addInPlace(dir.scaleInPlace(0.5));

  //     playEnergyBall(scene, from, to);
  //   }, 1000);
  // }, [world]);

  return (
    <div className="test-skills">
      <button
        onPointerDown={() => {
          setFlame(playFlame(scene, getPlayerPos()));
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
        Flame
      </button>
      <button
        onPointerDown={() => {
          const from = getPlayerPos().addInPlaceFromFloats(0, 1.25, 0);
          const to = from
            .clone()
            .addInPlaceFromFloats(
              Rand.nextFloat(1, 4) * Rand.nextSign(),
              0,
              Rand.nextFloat(1, 4) * Rand.nextSign()
            );

          //offset towards the target
          const dir = to.subtract(from).normalize();
          from.addInPlace(dir.scaleInPlace(0.5));

          playEnergyBall(scene, from, to);
        }}
      >
        Energy Ball
      </button>
    </div>
  );
});
