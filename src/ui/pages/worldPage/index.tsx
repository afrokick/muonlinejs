import './style.less';
import { observer } from 'mobx-react-lite';
import { Store } from '../../../store';

const HUD = observer(() => {
  const playerData = Store.playerData;

  return (
    <div className="hud">
      <span className="money">Zen: {playerData.money}</span>
      <span className="coords">
        XY: {playerData.x} {playerData.y}
      </span>
    </div>
  );
});

export const WorldPage = observer(() => {
  return (
    <div className="world-page">
      <HUD />
    </div>
  );
});
