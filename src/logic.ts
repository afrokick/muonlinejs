import { HelloPacket } from "../common/packets/ConnectServerPackets";
import { AddCharactersToScopePacket, AddNpcsToScopePacket, CharacterInformationPacket, ChatMessagePacket, GameServerEnteredPacket, ObjectWalkedPacket } from "../common/packets/ServerToClientPackets";
import { EventBus } from "./libs/eventBus";
import { Store, UIState } from "./store";

let serverListRequested = false;
EventBus.on('Hello', packet => {
  const p = new HelloPacket(packet);
  if (serverListRequested) return;
  serverListRequested = true;
  Store.updateServerListRequest();
});

EventBus.on('GameServerEntered', bytes => {
  const p = new GameServerEnteredPacket(bytes);
  console.log(p);
  Store.playerId = p.PlayerId;
  console.log(`PlayerID: ${Store.playerId}`);

  Store.uiState = UIState.Login;
});

EventBus.on('CharacterInformation', packet => {
  const p = new CharacterInformationPacket(packet);

  const playerData = Store.playerData;
  playerData.money = p.Money;
  playerData.x = p.X;
  playerData.y = p.Y;

  Store.uiState = UIState.World;
});

// EventBus.on('ServerMessage', packet => {
//   const p = new ServerMessagePacket(packet);
//   console.log(p);
// });

// EventBus.on('WeatherStatusUpdate', packet => {
//   const p = new WeatherStatusUpdatePacket(packet);
//   console.log(p);
// });
// EventBus.on('MessengerInitialization', packet => {
//   const p = new MessengerInitializationPacket(packet);
//   console.log(`MessengerInitialization, friends: ${p.FriendCount} letters: ${p.LetterCount}/${p.MaximumLetterCount}`);
// });
// EventBus.on('CurrentHealthAndShield', packet => {
//   const p = new CurrentHealthAndShieldPacket(packet);
//   console.log(`CurrentHealthAndShield, health: ${p.Health}, shield: ${p.Shield}`);
// });
// EventBus.on('CurrentManaAndAbility', packet => {
//   const p = new CurrentManaAndAbilityPacket(packet);
//   console.log(`CurrentManaAndAbility, mana: ${p.Mana}, ability: ${p.Ability}`);
// });

EventBus.on('AddNpcsToScope', packet => {
  const p = new AddNpcsToScopePacket(packet);
  const npcs = p.getNPCs();
  console.log(p, npcs);
});

EventBus.on('AddCharactersToScope', packet => {
  const p = new AddCharactersToScopePacket(packet);
  const chars = p.getCharacters();
  console.log(p, chars);
});

EventBus.on('ObjectWalked', packet => {
  const p = new ObjectWalkedPacket(packet);
  console.log(p);
});

EventBus.on('ChatMessage', packet => {
  const p = new ChatMessagePacket(packet);
  console.log(p);
});