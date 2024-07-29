import './style.less';
import { observer } from 'mobx-react-lite';
import { Store } from '../../../store';
import {
  ConnectionInfoPacket,
  ConnectionInfoRequestPacket,
  ServerListResponsePacket,
} from '../../../../common/packets/ConnectServerPackets';
import { useEventBus } from '../../../hooks/useEventBus';
import { CS_HOST, MAX_USERNAME_LENGTH } from '../../../consts';
import { Fragment, useEffect } from 'react';
import {
  CharacterCreationFailedPacket,
  CharacterCreationSuccessfulPacket,
  CharacterFocusedPacket,
  CharacterListPacket,
} from '../../../../common/packets/ServerToClientPackets';
import { CharacterClassNumber } from '../../../../common';

export const CharactersPage = observer(() => {
  useEffect(() => {
    Store.refreshCharactersListRequest();
  }, [Store]);

  useEventBus('CharacterList', bytes => {
    Store.loadingCharactersList = false;
    const p = new CharacterListPacket(bytes);

    Store.charactersList = p.getCharacters();
  });

  useEventBus('CharacterCreationFailed', bytes => {
    const p = new CharacterCreationFailedPacket(bytes);
    console.log(p);
  });

  useEventBus('CharacterCreationSuccessful', bytes => {
    Store.newCharName = '';
    Store.newCharClass = CharacterClassNumber.DarkKnight;

    const p = new CharacterCreationSuccessfulPacket(bytes);
    console.log(p);

    Store.refreshCharactersListRequest();
  });

  useEventBus('CharacterFocused', bytes => {
    const p = new CharacterFocusedPacket(bytes);

    Store.focusedChar = p.CharacterName;
  });

  const onCharacterFocus = async (name: string) => {
    Store.focusCharacterRequest(name);
  };

  const onCreateClicked = () => {
    console.log(`create click`);
    Store.createCharacterRequest(Store.newCharName, Store.newCharClass);
  };

  const onCharacterSelect = async (name: string) => {
    Store.selectCharacterRequest(name);
  };

  return (
    <div className="characters-page">
      {Store.loadingCharactersList ? (
        <span>Loading...</span>
      ) : (
        <Fragment>
          <div className="list">
            {Store.charactersList.map(s => {
              const focused = s.Name === Store.focusedChar;
              const classNames = focused ? 'focused' : '';
              return (
                <div key={s.Name} className={classNames}>
                  <button onClick={() => onCharacterFocus(s.Name)}>
                    {s.Name} lv. {s.Level}
                  </button>

                  {focused && (
                    <button
                      onClick={() => {
                        onCharacterSelect(s.Name);
                      }}
                    >
                      Select
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="actions">
            <form action="POST">
              <h3>Create</h3>
              <label>
                Name:
                <input
                  type="text"
                  required
                  minLength={4}
                  maxLength={MAX_USERNAME_LENGTH}
                  value={Store.newCharName}
                  onChange={e => (Store.newCharName = e.target.value.trim())}
                ></input>
              </label>
              <select
                defaultValue={Store.newCharClass}
                required
                onChange={e => {
                  Store.newCharClass = +e.target.value;
                }}
              >
                {[
                  CharacterClassNumber.DarkKnight,
                  CharacterClassNumber.DarkWizard,
                  CharacterClassNumber.FairyElf,
                ].map(cls => {
                  return (
                    <option key={cls} value={cls}>
                      {CharacterClassNumber[cls]}
                    </option>
                  );
                })}
              </select>
              <button
                onClick={e => {
                  e.preventDefault();
                  onCreateClicked();
                }}
              >
                Create
              </button>
            </form>
          </div>
        </Fragment>
      )}
    </div>
  );
});
