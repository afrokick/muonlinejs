import './style.less';
import { observer } from 'mobx-react-lite';
import { Store, UIState } from '../../../store';
import { useEventBus } from '../../../hooks/useEventBus';
import {
  LoginResponseLoginResultEnum,
  LoginResponsePacket,
} from '../../../../common/packets/ServerToClientPackets';
import { MAX_PASSWORD_LENGTH, MAX_USERNAME_LENGTH } from '../../../consts';
import { RequestCharacterListPacket } from '../../../../common/packets/ClientToServerPackets';

export const LoginPage = observer(() => {
  useEventBus('LoginResponse', async bytes => {
    Store.loginProcessing = false;

    const p = new LoginResponsePacket(bytes);

    switch (p.Success) {
      case LoginResponseLoginResultEnum.Okay: {
       Store.saveLoginData();
        await Store.disconnectFromConnectServer();
        Store.uiState = UIState.Characters;
      }

      case LoginResponseLoginResultEnum.InvalidPassword:
      case LoginResponseLoginResultEnum.AccountInvalid:
      case LoginResponseLoginResultEnum.AccountAlreadyConnected:
      case LoginResponseLoginResultEnum.ServerIsFull:
      case LoginResponseLoginResultEnum.AccountBlocked:
      case LoginResponseLoginResultEnum.WrongVersion:
      case LoginResponseLoginResultEnum.ConnectionError:
      case LoginResponseLoginResultEnum.ConnectionClosed3Fails:
      case LoginResponseLoginResultEnum.NoChargeInfo:
      case LoginResponseLoginResultEnum.SubscriptionTermOver:
      case LoginResponseLoginResultEnum.SubscriptionTimeOver:
      case LoginResponseLoginResultEnum.TemporaryBlocked:
      case LoginResponseLoginResultEnum.OnlyPlayersOver15Yrs:
      case LoginResponseLoginResultEnum.BadCountry:
      default: {
        Store.loginError = 'Error:' + LoginResponseLoginResultEnum[p.Success];
      }
    }
  });

  const onLoginClicked = () => {
    Store.loginError = undefined;
    Store.loginProcessing = true;
    const username = Store.username;
    const password = Store.password;

    Store.loginRequest(username, password);
  };

  return (
    <div className="login-page">
      {!!Store.loginError && <p className="login-error">{Store.loginError}</p>}
      <form action="POST">
        <label>
          Username:
          <input
            type="text"
            value={Store.username}
            onChange={e => {
              Store.username = e.target.value;
            }}
            maxLength={MAX_USERNAME_LENGTH}
          ></input>
        </label>
        <label>
          Password:
          <input
            type="text"
            value={Store.password}
            onChange={e => {
              Store.password = e.target.value;
            }}
            maxLength={MAX_PASSWORD_LENGTH}
          ></input>
        </label>

        <button
          onClick={e => {
            e.preventDefault();
            onLoginClicked();
          }}
        >
          Login
        </button>
      </form>
    </div>
  );
});
