import { CharacterClassNumber, SimpleModulusEncryptor, Xor32Encryptor, Xor3Byte } from "../common";
import { CreateCharacterPacket, FocusCharacterPacket, LoginShortPasswordPacket, RequestCharacterListPacket, SelectCharacterPacket } from "../common/packets/ClientToServerPackets";
import { ConnectionInfoRequestPacket, ServerListRequestPacket, ServerListResponsePacket } from "../common/packets/ConnectServerPackets";
import { CharacterListPacket } from "../common/packets/ServerToClientPackets";
import { stringToBytes } from "../common/utils";
import { CLIENT_VERSION, CS_HOST, CS_PORT, MAX_PASSWORD_LENGTH, MAX_USERNAME_LENGTH, WS_HOST, WS_PORT } from "./consts";
import { LocalStorage } from "./libs/localStorage";
import { createSocket } from "./libs/sockets/createSocket";
import { action, makeObservable, observable } from 'mobx';

const CONFIG_KEY = '_mu_key';

const xor32 = new Xor32Encryptor();

type ConfigType = {
  csIp?: string;
  csPort?: number;
  wsHost?: string;
  wsPort?: number;
  username?: string;
  password?: string;
};

export enum UIState {
  Servers,
  Login,
  Characters,
  LoadingWorld,
  World,
}

class PlayerData {
  money = 0;
  x = 0;
  y = 0;
  constructor() {
    makeObservable(this, {
      money: observable,
      x: observable,
      y: observable,
    });
  }
}

export const Store = new (class _Store {
  csSocket?: WebSocket;
  gsSocket?: WebSocket;

  private encryptor?: SimpleModulusEncryptor;

  username = '';
  password = '';
  serverList: ReturnType<ServerListResponsePacket['getServers']> = [];
  charactersList: ReturnType<CharacterListPacket['getCharacters']> = [];
  uiState = UIState.Servers;
  playerId?: number;

  loginProcessing = false;
  loginError?: string;

  loadingCharactersList = false;
  newCharName: string = '';
  newCharClass: CharacterClassNumber = CharacterClassNumber.DarkKnight;
  focusedChar: string = '';

  playerData = new PlayerData();

  config: ConfigType = {
    csIp: CS_HOST,
    csPort: CS_PORT,
    wsHost: WS_HOST,
    wsPort: WS_PORT,
  };

  constructor() {
    makeObservable(this, {
      username: observable,
      password: observable,
      serverList: observable,
      uiState: observable,
      playerId: observable,
      loginError: observable,
      loginProcessing: observable,
      charactersList: observable,
      loadingCharactersList: observable,
      newCharName: observable,
      newCharClass: observable,
      focusedChar: observable,
      playerData: observable,
    });
    this.loadConfig();
  }

  private loadConfig(): void {
    const data = JSON.parse(LocalStorage.load(CONFIG_KEY) ?? '{}') as ConfigType;
    if (data) {
      Object.assign(this.config, data);
    }

    this.username = this.config.username ?? '';
    this.password = this.config.password ?? '';
  }

  saveConfig(): void {
    LocalStorage.save(CONFIG_KEY, JSON.stringify(this.config));
  }

  saveLoginData(): void {
    const c = this.config;
    c.username = this.username;
    c.password = this.password;
    this.saveConfig();
  }

  sendToCS(buffer: DataView) {
    this.csSocket?.send(buffer);
  }

  sendToGS(buffer: DataView) {
    let packet = new Uint8Array(buffer.buffer);

    const header = packet[0];
    xor32.Encrypt(packet);
    if (this.encryptor && header >= 0xC3) {
      packet = this.encryptor.Encrypt(packet);
    }

    this.gsSocket?.send(packet);
  }

  async connectToConnectServer() {
    const config = this.config;

    const { socket } = createSocket({
      wsAddress: `${config.wsHost ?? WS_HOST}:${config.wsPort ?? WS_PORT}`,
      tcpIP: config.csIp ?? CS_HOST,
      tcpPort: config.csPort ?? CS_PORT
    });

    this.csSocket = socket;
  }

  async disconnectFromConnectServer() {
    this.csSocket?.close();
    this.csSocket = undefined;
  }

  async connectToGameServer(ip: string, port: number) {
    const config = this.config;

    const { socket } = createSocket({
      wsAddress: `${config.wsHost ?? WS_HOST}:${config.wsPort ?? WS_PORT}`,
      tcpIP: ip,
      tcpPort: port
    });

    this.gsSocket = socket;

    this.encryptor = new SimpleModulusEncryptor();
    this.encryptor.encryptionKeys = SimpleModulusEncryptor.DefaultClientKey;
  }

  async disconnectFromGameServer() {
    this.gsSocket?.close();
    this.gsSocket = undefined;
  }

  updateServerListRequest(): void {
    const buffer = ServerListRequestPacket.createPacket().buffer;
    this.sendToCS(buffer);
  }

  getConnectionInfoRequest(serverId: number): void {
    const connectionInfoRequestPacket =
      ConnectionInfoRequestPacket.createPacket();
    connectionInfoRequestPacket.ServerId = serverId;

    this.sendToCS(connectionInfoRequestPacket.buffer);
  }

  loginRequest(username: string, password: string) {
    const usernameBytes = stringToBytes(username, MAX_USERNAME_LENGTH);
    const passwordBytes = stringToBytes(password, MAX_PASSWORD_LENGTH);

    Xor3Byte(usernameBytes);
    Xor3Byte(passwordBytes);

    const loginShortPasswordPacket = LoginShortPasswordPacket.createPacket();
    loginShortPasswordPacket.setUsername(usernameBytes, usernameBytes.length);
    loginShortPasswordPacket.setPassword(passwordBytes, passwordBytes.length);
    loginShortPasswordPacket.setClientVersion(CLIENT_VERSION);

    console.log(`send login`);
    this.sendToGS(loginShortPasswordPacket.buffer);
  }

  refreshCharactersListRequest(): void {
    this.loadingCharactersList = true;
    const packet = RequestCharacterListPacket.createPacket();
    packet.Language = 0; // TODO
    this.sendToGS(packet.buffer);
  }

  focusCharacterRequest(name: string): void {
    const packet = FocusCharacterPacket.createPacket();
    packet.setName(name);
    this.sendToGS(packet.buffer);
  }

  selectCharacterRequest(name: string): void {
    const selectCharacterPacket = SelectCharacterPacket.createPacket();
    selectCharacterPacket.setName(name);

    console.log(`select character [${name}]`);
    this.sendToGS(selectCharacterPacket.buffer);
  }

  createCharacterRequest(name: string, charClass: CharacterClassNumber): void {
    const packet = CreateCharacterPacket.createPacket();
    packet.setName(name);
    packet.Class = charClass;

    this.sendToGS(packet.buffer);
  }
});
