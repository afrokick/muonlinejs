import { ArrayCopy } from "../utils";
import { TERRAIN_SIZE } from "./consts";
import { decryptMapFile } from "./mapFileEncryption";

function createArrays() {
  const layer1 = new Uint8Array(TERRAIN_SIZE * TERRAIN_SIZE);
  const layer2 = new Uint8Array(TERRAIN_SIZE * TERRAIN_SIZE);
  const alpha = new Float32Array(TERRAIN_SIZE * TERRAIN_SIZE);

  for (let i = 0; i < TERRAIN_SIZE * TERRAIN_SIZE; ++i) {
    layer1[i] = 0;
    layer2[i] = 255;
    alpha[i] = 0.0;
    // TerrainGrassTexture[i] = (rand() % 4) / 4.0;
    // #ifdef ASG_ADD_MAP_KARUTAN;
    // g_fTerrainGrassWind1[i] = 0;
    // #endif;
  }

  return { layer1, layer2, alpha } as const;
}

export async function parseTerrainMapping(encodedData: Uint8Array) {
  const result = createArrays();

  const DataBytes = encodedData.length;
  const decodedData = new Uint8Array(DataBytes);
  decryptMapFile(decodedData, encodedData, DataBytes);

  let DataPtr = 0;
  DataPtr += 1;

  const iMapNumber = decodedData[DataPtr];
  DataPtr += 1;

  ArrayCopy(decodedData, DataPtr, result.layer1, 0, TERRAIN_SIZE * TERRAIN_SIZE);
  DataPtr += TERRAIN_SIZE * TERRAIN_SIZE;

  ArrayCopy(decodedData, DataPtr, result.layer2, 0, TERRAIN_SIZE * TERRAIN_SIZE);
  DataPtr += TERRAIN_SIZE * TERRAIN_SIZE;

  for (let i = 0; i < TERRAIN_SIZE * TERRAIN_SIZE; i++) {
    const alpha: Byte = decodedData[DataPtr];
    DataPtr += 1;
    result.alpha[i] = alpha / 255.0;
  }

  // TerrainGrassEnable = true;

  //TODO
  // if (gMapManager.InChaosCastle() || gMapManager.InBattleCastle()) {
  //   TerrainGrassEnable = false;
  // }

  return result;
}