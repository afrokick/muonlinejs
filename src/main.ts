import { CharacterClassNumber, } from "../common";
import { CreateCharacterPacket, FocusCharacterPacket, LoginShortPasswordPacket, RequestCharacterListPacket, SelectCharacterPacket } from "../common/packets/ClientToServerPackets";
import { ConnectionInfoPacket, ConnectionInfoRequestPacket, HelloPacket, ServerListRequestPacket, ServerListResponsePacket } from "../common/packets/ConnectServerPackets";
import { AddCharactersToScopePacket, AddNpcsToScopePacket, CharacterCreationFailedPacket, CharacterCreationSuccessfulPacket, CharacterFocusedPacket, CharacterInformationPacket, CharacterListPacket, CharacterStatusEnum, CurrentHealthAndShieldPacket, CurrentManaAndAbilityPacket, GameServerEnteredPacket, LoginResponseLoginResultEnum, LoginResponsePacket, MessengerInitializationPacket, ServerMessagePacket, WeatherStatusUpdatePacket } from "../common/packets/ServerToClientPackets";
import { createSocket } from "./libs/sockets/createSocket";
import { EventBus } from "./libs/eventBus";
import { stringToBytes } from "../common/utils";
import { CLIENT_VERSION, MAX_PASSWORD_LENGTH, MAX_USERNAME_LENGTH } from "./consts";
import { Xor3Byte, Xor32Encryptor, SimpleModulusDecryptor, SimpleModulusEncryptor } from '../common';

const CS_HOST = "127.0.0.1";
const CS_PORT = 44405;

const WS_HOST = 'ws://localhost';
const WS_PORT = 3000;

const { socket: csSocket } = createSocket({
  wsAddress: `${WS_HOST}:${WS_PORT}`,
  tcpIP: CS_HOST,
  tcpPort: CS_PORT
});

let serverListRequested = false;
EventBus.on('Hello', packet => {
  const p = new HelloPacket(packet);
  if (serverListRequested) return;
  serverListRequested = true;
  const buffer = ServerListRequestPacket.createPacket().buffer;
  csSocket.send(buffer);
});

EventBus.on('ServerListResponse', packet => {
  const p = new ServerListResponsePacket(packet);
  console.log(`servers(${p.ServerCount}):`, p.getServers(p.ServerCount));

  const connectionInfoRequestPacket = ConnectionInfoRequestPacket.createPacket();
  connectionInfoRequestPacket.ServerId = 0;

  csSocket.send(connectionInfoRequestPacket.buffer);
});

const USERNAME = 'test0';
const PASSWORD = 'test0';

let _gsSocket: WebSocket;

EventBus.on('ConnectionInfo', packet => {
  const p = new ConnectionInfoPacket(packet);
  const address = CS_HOST;//use local host

  console.log(`connection info: ${address}:${p.Port}`);


  const { socket: gsSocket } = createSocket({
    wsAddress: `${WS_HOST}:${WS_PORT}`,
    tcpIP: address,
    tcpPort: p.Port
  });

  _gsSocket = gsSocket;
});

const xor32 = new Xor32Encryptor();
const encryptor = new SimpleModulusEncryptor();
encryptor.encryptionKeys = SimpleModulusEncryptor.DefaultClientKey;

const decryptor = new SimpleModulusDecryptor();
decryptor.decryptionKeys = SimpleModulusDecryptor.DefaultClientKey;

function sendToGS(dataView: DataView) {
  let packet = new Uint8Array(dataView.buffer);

  const header = packet[0];
  xor32.Encrypt(packet);
  if (header >= 0xc3) {
    packet = encryptor.Encrypt(packet);
  }

  _gsSocket.send(packet);
}

EventBus.on('GameServerEntered', packet => {
  const p = new GameServerEnteredPacket(packet);
  console.log(p);

  const username = stringToBytes(USERNAME, MAX_USERNAME_LENGTH);
  const password = stringToBytes(PASSWORD, MAX_PASSWORD_LENGTH);

  Xor3Byte(username);
  Xor3Byte(password);

  const loginShortPasswordPacket = LoginShortPasswordPacket.createPacket();
  loginShortPasswordPacket.setUsername(username, username.length);
  loginShortPasswordPacket.setPassword(password, password.length);
  loginShortPasswordPacket.setClientVersion(CLIENT_VERSION);

  console.log(`send login`);
  sendToGS(loginShortPasswordPacket.buffer);
});

EventBus.on('LoginResponse', packet => {
  csSocket.close();

  const p = new LoginResponsePacket(packet);
  console.log(p);
  console.log(`login result: ${p.Success === LoginResponseLoginResultEnum.Okay}`);

  const requestCharacterListPacket = RequestCharacterListPacket.createPacket();
  requestCharacterListPacket.Language = 0; // ?
  sendToGS(requestCharacterListPacket.buffer);
});

EventBus.on('CharacterList', packet => {
  const p = new CharacterListPacket(packet);
  console.log(p);

  console.log(p.getCharacters());

  const c = p.getCharacters()[0];

  if (c) {
    const focusCharacterPacket = FocusCharacterPacket.createPacket();
    focusCharacterPacket.setName(c.Name);
    sendToGS(focusCharacterPacket.buffer);
  } else {
    console.warn('no characters!');
  }
});

function createCharacter(name: string) {
  const packet = CreateCharacterPacket.createPacket();
  packet.setName(name);
  packet.Class = CharacterClassNumber.DarkKnight;

  console.log(`creating character [${name}][${CharacterClassNumber[packet.Class]}]`);
  sendToGS(packet.buffer);
}
(window as any).createCharacter = createCharacter;

EventBus.on('CharacterFocused', packet => {
  const p = new CharacterFocusedPacket(packet);
  console.log(p);

  if (p.CharacterName) {
    const selectCharacterPacket = SelectCharacterPacket.createPacket();
    selectCharacterPacket.setName(p.CharacterName);

    console.log(`select character [${p.CharacterName}]`);
    sendToGS(selectCharacterPacket.buffer);
  }
});

EventBus.on('CharacterCreationFailed', packet => {
  const p = new CharacterCreationFailedPacket(packet);
  console.log(p);
});

EventBus.on('CharacterCreationSuccessful', packet => {
  const p = new CharacterCreationSuccessfulPacket(packet);
  console.log(p);
});

EventBus.on('ServerMessage', packet => {
  const p = new ServerMessagePacket(packet);
  console.log(p);
});
EventBus.on('CharacterInformation', packet => {
  const p = new CharacterInformationPacket(packet);
  console.log(p);
});
EventBus.on('WeatherStatusUpdate', packet => {
  const p = new WeatherStatusUpdatePacket(packet);
  console.log(p);
});
EventBus.on('MessengerInitialization', packet => {
  const p = new MessengerInitializationPacket(packet);
  console.log(`MessengerInitialization, friends: ${p.FriendCount} letters: ${p.LetterCount}/${p.MaximumLetterCount}`);
});
EventBus.on('CurrentHealthAndShield', packet => {
  const p = new CurrentHealthAndShieldPacket(packet);
  console.log(`CurrentHealthAndShield, health: ${p.Health}, shield: ${p.Shield}`);
});
EventBus.on('CurrentManaAndAbility', packet => {
  const p = new CurrentManaAndAbilityPacket(packet);
  console.log(`CurrentManaAndAbility, mana: ${p.Mana}, ability: ${p.Ability}`);
});

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