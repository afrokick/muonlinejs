import { Engine, type Scene, Texture } from '../libs/babylon/exports';
import { resolveUrlToDataFolder } from './resolveUrlToDataFolder';

// like 'C1 04 00 01'
export function stringifyPacket(buffer: Buffer) {
  return Array.from(new Uint8Array(buffer)).map(byteToString).join(' ');
}

export function byteToString(i: number) {
  return i.toString(16).padStart(2, '0').toUpperCase();
}

export function getSizeOfPacketType(packetType: number) {
  switch (packetType) {
    case 0xc1:
    case 0xc3:
      return 2;
    case 0xc2:
    case 0xc4:
      return 3;
    default:
      return 0;
  }
}

export function getPacketHeaderSize(packet: Uint8Array) {
  const t = packet[0];

  return getSizeOfPacketType(t);
}

export function getPacketSize(packet: Uint8Array) {
  switch (packet[0]) {
    case 0xc1:
    case 0xc3:
      return packet[1];
    case 0xc2:
    case 0xc4:
      return (packet[1] << 8) | packet[2];
    default:
      return 0;
  }
}

export function setPacketSize(packet: Uint8Array) {
  const size = packet.byteLength;
  switch (packet[0]) {
    case 0xc1:
    case 0xc3:
      packet[1] = castToByte(size);
      break;
    case 0xc2:
    case 0xc4:
      packet[1] = castToByte((size & 0xff00) >> 8);
      packet[2] = castToByte(size & 0x00ff);
      break;
    default:
      throw new Error(`Unknown packet type 0x${byteToString(packet[0])}`);
  }
}

export function stringToBytes(str: string, count = str.length) {
  const bytes = new Uint8Array(count);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes;
}

export function castToByte(n: number): Byte {
  return n & 0xff;
}

export function castToUInt(n: number): UInt {
  return n; //TODO
}

export function castToUShort(n: number): UShort {
  return n; //TODO
}

export function integerDevision(n: number) {
  return Math.floor(n);
}

export function GetByteValue(byte: Byte, bits: Int, leftShifted: Int): Byte {
  const andMask = castToByte(Math.pow(2, bits) - 1);
  const numericalValue = castToByte((byte >> leftShifted) & andMask);

  return numericalValue;
}

export function SetByteValue(
  oldValue: Byte,
  value: Byte,
  bits: Int,
  leftShifted: Int
): Byte {
  const bitMask = castToByte(Math.pow(2, bits) - 1) << leftShifted;
  const clearMask = castToByte(0xff - bitMask);

  oldValue &= clearMask;

  const numericalValue = castToByte(value); //Convert.ToByte check?
  oldValue |= castToByte((numericalValue << leftShifted) & bitMask);

  return oldValue;
}

export function GetBoolean(byte: Byte, leftShifted: Int): boolean {
  return ((byte >> leftShifted) & 1) === 1;
}

export function SetBoolean(
  oldValue: Byte,
  value: Boolean,
  leftShifted: Int
): Byte {
  const mask = castToByte(1 << leftShifted);
  const clearMask = castToByte(0xff - (1 << leftShifted));
  oldValue &= clearMask;
  if (value) {
    oldValue |= mask;
  }

  return oldValue;
}

// More permormance
// export function SetBoolean(oldValue: Byte, value: Boolean): Byte {
//   const clearMask = 0b1111_1110;
//   oldValue &= clearMask;
//   if (value) {
//     oldValue |= 1;
//   }
//   return oldValue;
// }

export function ArrayCopy<TArray extends Uint8Array | Uint16Array>(
  buffer: TArray,
  srcOffset: Int,
  dst: TArray,
  dstOffset: Int,
  count: Int
): void {
  for (let i = 0; i < count; i++) {
    dst[dstOffset + i] = buffer[srcOffset + i];
  }
}

export async function downloadBytesBuffer(url: string) {
  const req = await fetch(url);
  const ab = await req.arrayBuffer();
  const buffer = new Uint8Array(ab);

  return buffer;
}

export async function downloadDataBytesBuffer(url: string) {
  return downloadBytesBuffer(resolveUrlToDataFolder(url));
}

// TODO we only need bytes buffer? Try to omit bjs dependency...
export async function readOJZBufferAsJPEGBuffer(
  scene: Scene,
  filename: string,
  ozjBuffer: Uint8Array
) {
  const fileSize = ozjBuffer.length;
  if (fileSize < 24) {
    throw new Error(`The file ${filename} is too small to be as a OZJ`);
  }

  // Skip first 24 bytes, because these are added by the OZJ format
  // const jpegSize = fileSize - 24;

  // let jpegSubsamp = TJSAMP_444;
  // let jpegColorspace = TJCS_RGB;

  filename.split('/').slice(0, -1).join('_');
  const fName = filename.split('/').at(-1)?.split('.')[0];
  const tName = filename.split('/').slice(0, -1).join('_') + '-' + fName;

  const texture = new Texture(
    `data:${tName}.jpg`,
    scene.getEngine()!,
    true,
    false,
    Texture.NEAREST_NEAREST,
    null,
    null,
    ozjBuffer.slice(24),
    false,
    Engine.TEXTUREFORMAT_RGB
  );
  texture.anisotropicFilteringLevel = 0;
  texture.isBlocking = false;
  texture.name = tName;

  return new Promise<{ BufferFloat: Float32Array; Texture: Texture }>(r => {
    texture.onLoadObservable.addOnce(async texture => {
      const size = texture.getSize();
      let jpegWidth = size.width;
      let jpegHeight = size.height;

      const pixels = new Uint8Array((await texture.readPixels()!).buffer);

      const bufferSize = jpegWidth * jpegHeight * 3;
      const BufferFloat = new Float32Array(bufferSize);

      let j = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        BufferFloat[j++] = pixels[i] / 255;
        BufferFloat[j++] = pixels[i + 1] / 255;
        BufferFloat[j++] = pixels[i + 2] / 255;
      }

      r({ BufferFloat, Texture: texture });
    });
  });
  // decompress into the buffer
  // result = tjDecompress2(tjhandle, jpegBuf, jpegSize, buffer, jpegWidth, 0, jpegHeight, TJPF_RGB, TJFLAG_BOTTOMUP);
}

export function toRadians(angle: number) {
  return angle * (Math.PI / 180);
}

type Bitmask = number;

export const createBinaryMask = (...flags: number[]) =>
  flags.reduce((mask, flag) => mask | flag, 0);

export const isFlagInBinaryMask = (mask: Bitmask, flag: number) =>
  (mask & flag) === flag;

export const isMasksIntersect = (maskA: Bitmask, maskB: Bitmask) =>
  (maskA & maskB) !== 0;

export const addFlagToMask = (mask: Bitmask, flag: number) => mask | flag;

export const removeFlagFromMask = (mask: Bitmask, flag: number) =>
  mask - (mask & flag);

export const toggleFlagInMask = (mask: Bitmask, flag: number) => mask ^ flag;

export const mapNumber = (
  value: number,
  min: number,
  max: number,
  minOut: number,
  maxOut: number
) => {
  return ((value - min) / (max - min)) * (maxOut - minOut) + minOut;
};
