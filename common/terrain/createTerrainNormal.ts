import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TERRAIN_SCALE, TERRAIN_SIZE } from "./consts";
import { TERRAIN_INDEX, TERRAIN_INDEX_REPEAT } from "./utils";

function Vector(a: number, b: number, c: number, result: Vector3) {
  result.set(a, b, c);
}

function FaceNormalize(v1: Vector3, v2: Vector3, v3: Vector3, Normal: Vector3) {
  const nx = (v2.y - v1.y) * (v3.z - v1.z) - (v3.y - v1.y) * (v2.z - v1.z);
  const ny = (v2.z - v1.z) * (v3.x - v1.x) - (v3.z - v1.z) * (v2.x - v1.x);
  const nz = (v2.x - v1.x) * (v3.y - v1.y) - (v3.x - v1.x) * (v2.y - v1.y);

  //if(nx==0.0 || ny==0.0 || nz==0.0) return;
  const dot = Math.sqrt(nx * nx + ny * ny + nz * nz);

  if (dot === 0) return;

  Normal.x = (nx / dot);
  Normal.y = (ny / dot);
  Normal.z = (nz / dot);
}

function VectorAdd(a: Vector3, b: Vector3, result: Vector3) {
  a.addToRef(b, result);
}

export function createTerrainNormal(heightBuffer: Float32Array) {
  const v1 = Vector3.Zero();
  const v2 = Vector3.Zero();
  const v3 = Vector3.Zero();
  const v4 = Vector3.Zero();
  const face_normal = Vector3.Zero();

  const result: Vector3[] = new Array(TERRAIN_SIZE * TERRAIN_SIZE);

  for (let y = 0; y < TERRAIN_SIZE; y++) {
    for (let x = 0; x < TERRAIN_SIZE; x++) {
      const Index = TERRAIN_INDEX(x, y);

      Vector((x * TERRAIN_SCALE), (y * TERRAIN_SCALE), heightBuffer[TERRAIN_INDEX_REPEAT(x, y)], v4);
      Vector(((x + 1) * TERRAIN_SCALE), (y * TERRAIN_SCALE), heightBuffer[TERRAIN_INDEX_REPEAT((x + 1), y)], v1);
      Vector(((x + 1) * TERRAIN_SCALE), ((y + 1) * TERRAIN_SCALE), heightBuffer[TERRAIN_INDEX_REPEAT((x + 1), (y + 1))], v2);
      Vector((x * TERRAIN_SCALE), ((y + 1) * TERRAIN_SCALE), heightBuffer[TERRAIN_INDEX_REPEAT(x, (y + 1))], v3);

      result[Index] = Vector3.Zero();

      FaceNormalize(v1, v2, v3, face_normal);
      VectorAdd(result[Index], face_normal, result[Index]);
      FaceNormalize(v3, v4, v1, face_normal);
      VectorAdd(result[Index], face_normal, result[Index]);
    }
  }

  return result;
}
