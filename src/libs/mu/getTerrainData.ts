import { downloadBuffer } from "../utils";
import { MapUtils } from "./mapUtils";

export async function getTerrainData() {
  const texturesBuffer = await downloadBuffer(`./data/World1/EncTerrain.map`);
  const groundMap = MapUtils.parseGround([...texturesBuffer.values()]);

  const objsBuffer = await downloadBuffer(`./data/World1/Terrain.obj`);
  const objects = MapUtils.parseObjects([...objsBuffer.values()]);

  console.log({ groundMap, objects });

  return { groundMap, objects };
}