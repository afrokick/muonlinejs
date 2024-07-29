import { castToByte, getPacketHeaderSize } from "../utils";
import { DefaultKeys } from "./keys";

export class Xor32Decryptor {
  xor32Key: Uint8Array = DefaultKeys.Xor32Key;

  Decrypt(packet: Uint8Array): [boolean, Uint8Array] {
    const headerSize = getPacketHeaderSize(packet);
    for (let i = packet.length - 1; i > headerSize; i--) {
      packet[i] = castToByte(packet[i] ^ packet[i - 1] ^ this.xor32Key[i % 32]);
    }

    return [true, packet];
  }
}

export class Xor32Encryptor {
  xor32Key: Uint8Array = DefaultKeys.Xor32Key;

  Encrypt(packet: Uint8Array): Uint8Array {
    const headerSize = getPacketHeaderSize(packet);
    for (let i = headerSize + 1; i < packet.length; i++) {
      packet[i] = castToByte(packet[i] ^ packet[i - 1] ^ this.xor32Key[i % 32]);
    }

    return packet;
  }
}
