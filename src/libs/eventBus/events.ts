import type { ConnectServerPackets, ServerToClientPackets } from "../../../common";

type CSPacketKeys = (typeof ConnectServerPackets[number])['Name'];
type GSPacketKeys = (typeof ServerToClientPackets[number])['Name'];

export type CSEvents = Record<CSPacketKeys, DataView>;
export type GSEvents = Record<GSPacketKeys, DataView>;

export type Events = CSEvents & GSEvents & {
  'wsOpened': { socket: WebSocket; };
  'wsClosed': { socket: WebSocket; };
  'wsError': { socket: WebSocket, error: any; };
};
