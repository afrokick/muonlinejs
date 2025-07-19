import './style.less';
import { observer } from 'mobx-react-lite';
import { WorldObjects } from '../../components/worldObjects';
import { MapsList } from './components/mapsList';
import { BottomBar } from './components/bottomBar';
import { CharacterInfo } from './components/characterInfo';
import { Inventory } from './components/inventory';
import { Skills } from './components/skills';

const HUD = observer(() => {
  return (
    <div className="hud">
      <BottomBar />
      <div className="panels-stack">
        <Inventory />
        <CharacterInfo />
      </div>
      <Skills />
      <MapsList />
    </div>
  );
});

export const WorldPage = observer(() => {
  return (
    <div className="world-page">
      <WorldObjects />
      <HUD />
    </div>
  );
});
