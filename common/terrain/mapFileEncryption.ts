import { castToByte } from "../utils";

const XOR_KEY = new Uint8Array([0xD1, 0x73, 0x52, 0xF6, 0xD2, 0x9A, 0xCB, 0x27, 0x3E, 0xAF, 0x59, 0x31, 0x37, 0xB3, 0xE7, 0xA2]);
const BUX_CODE = new Uint8Array([0xFC, 0xCF, 0xAB]);

export function encryptMapFile(pbyDst: Uint8Array | null, pbySrc: Uint8Array, iSize: Int): Int {
  if (!pbyDst) return iSize;

  let wMapKey = 0x5E;//WORD

  for (let i = 0; i < iSize; ++i) {
    pbyDst[i] = (pbySrc[i] + castToByte(wMapKey)) ^ XOR_KEY[i % 16];

    wMapKey = castToByte(pbyDst[i] + 0x3D);
  }

  return iSize;
}

export function decryptMapFile(pbyDst: Uint8Array, pbySrc: Uint8Array, iSize: Int): Int {
  let wMapKey = 0x5E;

  for (let i = 0; i < iSize; ++i) {
    pbyDst[i] = (pbySrc[i] ^ XOR_KEY[i % 16]) - castToByte(wMapKey);

    wMapKey = castToByte(pbySrc[i] + 0x3D);
  }

  return iSize;
}

export function convertBux(Buffer: Uint8Array, Size: Int): void {
  for (let i = 0; i < Size; ++i) {
    Buffer[i] ^= BUX_CODE[i % 3];
  }
}
