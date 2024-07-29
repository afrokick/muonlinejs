import { DefaultKeys } from "./keys";

export function Xor3Byte(buffer: Uint8Array, len: number = buffer.length) {
  for (let i = 0; i < len; ++i) {
    buffer[i] ^= DefaultKeys.Xor3Keys[i % 3];
  }
}
