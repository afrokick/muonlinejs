import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TERRAIN_SIZE } from "./consts";
import { createTerrainNormal } from "./createTerrainNormal";
import { TERRAIN_INDEX } from "./utils";
import { Scalar } from "@babylonjs/core/Maths/math.scalar";

function createTerrainLight(normals: Vector3[], lightMap: Vector3[]) {
  const Light = Vector3.Zero();

  // if (gMapManager.InBattleCastle()) {
  //   Light.set(0.5, -1.0, 1.0);
  // }
  // else {
  Light.set(0.5, -0.5, 0.5);
  // }

  const result: Vector3[] = new Array(TERRAIN_SIZE * TERRAIN_SIZE);

  for (let y = 0; y < TERRAIN_SIZE; y++) {
    for (let x = 0; x < TERRAIN_SIZE; x++) {
      const Index = TERRAIN_INDEX(x, y);
      let Luminosity = Vector3.Dot(normals[Index], Light) + 0.5;
      Luminosity = Scalar.Clamp(Luminosity, 0, 1);

      result[Index] = lightMap[Index].scale(Luminosity);
    }
  }

  return result;
}

export async function parseTerrainLight(lightBuffer: Float32Array, heightData: Float32Array) {
  const lightMap: Vector3[] = new Array(TERRAIN_SIZE * TERRAIN_SIZE);

  for (let i = 0; i < TERRAIN_SIZE * TERRAIN_SIZE; i++) {
    lightMap[i] = new Vector3(lightBuffer[i * 3 + 0], lightBuffer[i * 3 + 1], lightBuffer[i * 3 + 2]);

    Vector3.ClampToRef(lightMap[i], Vector3.ZeroReadOnly, Vector3.OneReadOnly, lightMap[i]);
  }

  const normals = createTerrainNormal(heightData);

  return createTerrainLight(normals, lightMap);
}
