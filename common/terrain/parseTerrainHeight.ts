import { ArrayCopy } from "../utils";
import { TERRAIN_SIZE } from "./consts";

const BMPHeader = new Uint8Array(1080);

export async function parseTerrainHeight(buffer: Uint8Array) {
  const Index: Int = BMPHeader.length;
  const factor = 1.5 / 100;

  const result = new Float32Array(TERRAIN_SIZE * TERRAIN_SIZE);

  ArrayCopy(buffer, 0, BMPHeader, 0, Index); //memcpy(BMPHeader, Buffer, Index);

  for (let i = 0; i < TERRAIN_SIZE; i++) {
    const offset = i * TERRAIN_SIZE;

    for (let j = 0; j < TERRAIN_SIZE; j++) {
      result[offset + j] = buffer[Index + offset + j] * factor;
    }
  }

  return result;
}
