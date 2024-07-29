import { ServersPage } from './ui/pages/serversPage';
import { observer } from 'mobx-react-lite';
import { Store, UIState } from './store';
import { LoginPage } from './ui/pages/loginPage';
import { CharactersPage } from './ui/pages/charactersPage';
import { WorldPage } from './ui/pages/worldPage';

export const App = observer(() => {
  const state = Store.uiState;

  switch (state) {
    case UIState.Servers:
      return <ServersPage />;
    case UIState.Login:
      return <LoginPage />;
    case UIState.Characters:
      return <CharactersPage />;
    case UIState.LoadingWorld:
    case UIState.World:
      return <WorldPage />;
    default:
      return <div>No Page</div>;
  }
});
