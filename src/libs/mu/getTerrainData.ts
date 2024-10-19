import {
  RawTexture,
  Scene,
  StandardMaterial,
  Texture,
  Vector3,
} from '../babylon/exports';
import { CreateGroundFromHeightMap } from './customGroundMesh';
import { createTerrainMaterial } from './terrainMaterial';
import { ENUM_WORLD } from '../../../common';
import {
  downloadBytesBuffer,
  readOJZBufferAsJPEGBuffer,
  toRadians,
} from '../../../common/utils';
import { parseTerrainAttribute } from '../../../common/terrain/parseTerrainAttribute';
import { parseTerrainHeight } from '../../../common/terrain/parseTerrainHeight';
import { parseTerrainMapping } from '../../../common/terrain/parseTerrainMapping';
import { parseTerrainLight } from '../../../common/terrain/parseTerrainLight';
import { getTilesList } from '../../../common/terrain/getTilesList';
import { TERRAIN_SIZE } from '../../../common/terrain/consts';
import { parseTerrainObjects } from '../../../common/terrain/parseTerrainObjects';
import { ENUM_OBJECTS } from '../../../common/objects/enum';
import { CMapManager_Load } from '../../../common/zzzMapManagerLoad';

function createTexturesAtlasFromRects(
  scene: Scene,
  data: { map1: Uint8Array; map2: Uint8Array }
) {
  const count = data.map1.length;

  const rectsArray = new Uint8Array(TERRAIN_SIZE * TERRAIN_SIZE * 4);
  data.map1.forEach((m1, i) => {
    const m2 = data.map2[i];

    rectsArray[i * 4 + 0] = m1;
    rectsArray[i * 4 + 1] = m2;
    rectsArray[i * 4 + 2] = 255;
    rectsArray[i * 4 + 3] = 255;
  });

  const size = Math.round(Math.sqrt(count));

  const rectsTexture = RawTexture.CreateRGBATexture(
    rectsArray,
    size,
    size,
    scene,
    false,
    false,
    Texture.NEAREST_NEAREST
  );
  rectsTexture.isBlocking = false;
  rectsTexture.name = '_AtlasTexture';
  rectsTexture.anisotropicFilteringLevel = 1;

  return rectsTexture;
}

function createAlphaMapTexture(
  scene: Scene,
  data: { alpha: Float32Array; lights: Vector3[] }
) {
  const count = data.alpha.length;

  const rectsArray = new Uint8Array(TERRAIN_SIZE * TERRAIN_SIZE * 4);
  data.alpha.forEach((a, i) => {
    const l = data.lights[i];
    rectsArray[i * 4 + 0] = a * 255;
    rectsArray[i * 4 + 1] = l.x * 255;
    rectsArray[i * 4 + 2] = l.y * 255;
    rectsArray[i * 4 + 3] = l.z * 255;
  });

  const size = Math.round(Math.sqrt(count));

  const rectsTexture = RawTexture.CreateRGBATexture(
    rectsArray,
    size,
    size,
    scene,
    false,
    false,
    Texture.LINEAR_LINEAR
  );
  rectsTexture.isBlocking = false;
  rectsTexture.name = '_AlphaMap';
  rectsTexture.anisotropicFilteringLevel = 1;

  return rectsTexture;
}

export async function getTerrainData(scene: Scene, map: ENUM_WORLD) {
  const worldNum = map + 1;
  const worldFolder = `./data/World${worldNum}/`;

  const terrainAttributeBytes = await downloadBytesBuffer(
    `${worldFolder}EncTerrain${worldNum}.att`
  );
  const terrainHeightBytes = await downloadBytesBuffer(
    `${worldFolder}TerrainHeight.OZB`
  );
  const terrainMappingBytes = await downloadBytesBuffer(
    `${worldFolder}EncTerrain${worldNum}.map`
  );
  const terrainLightBytes = await downloadBytesBuffer(
    `${worldFolder}TerrainLight.OZJ`
  );

  const terrainHeight = await parseTerrainHeight(terrainHeightBytes);
  const terrainAttrs = await parseTerrainAttribute(terrainAttributeBytes, map);
  const terrainMapping = await parseTerrainMapping(terrainMappingBytes);

  const lightTextureData = await readOJZBufferAsJPEGBuffer(
    scene,
    `${worldFolder}TerrainLight.OZJ`,
    terrainLightBytes
  );

  const terrainLight = await parseTerrainLight(
    lightTextureData.BufferFloat,
    terrainHeight
  );

  const textures = await Promise.all(
    getTilesList(map).map(async t => {
      const filePath = `./data/World${worldNum}/${t}.OZJ`;
      const ozjBytes = await downloadBytesBuffer(filePath);

      return readOJZBufferAsJPEGBuffer(scene, filePath, ozjBytes);
    })
  );

  const lightTexture = lightTextureData.Texture.clone();
  // const lightData = terrainLight.Lights;
  console.log({ terrainAttrs, terrainMapping, terrainHeight });

  // const texturesBuffer = await downloadBuffer(`./data/World1_new/EncTerrain.map`);
  // const groundMap = MapUtils.parseGround([...texturesBuffer.values()]);

  const objsBuffer = await downloadBytesBuffer(
    `./data/World${worldNum}/EncTerrain${worldNum}.obj`
  );
  const objects = parseTerrainObjects(objsBuffer);

  await CMapManager_Load(map);

  // console.log({  objects:objects.map(o=>{
  //   o.Name = ENUM_OBJECTS[o.id];
  //   return o;
  // }) });

  const terrain = CreateGroundFromHeightMap(
    '_abc',
    terrainHeight,
    { width: TERRAIN_SIZE, height: TERRAIN_SIZE, subdivisions: TERRAIN_SIZE },
    scene
  );
  // const tm = new StandardMaterial('ground_mm', scene);
  // tm.disableLighting = true;
  // tm.emissiveColor.setAll(1);
  // terrain.material = tm;
  // if (tileGrass) {
  //   const t = tileGrass.Texture.clone();
  //   tm.diffuseTexture = t;
  //   t.updateSamplingMode(Texture.LINEAR_LINEAR);
  // }

  const texturesData = textures.map(texture => {
    const t = texture.Texture.clone();
    t.updateSamplingMode(Texture.LINEAR_LINEAR);
    t.anisotropicFilteringLevel = 1;

    const size = t.getSize().height;
    let scale = size;
    if (scale === 256) {
      scale /= 4;
    }
    return { texture: t, scale };
  });
  // tm.diffuseTexture = texturesData[0].texture;

  terrain.material = createTerrainMaterial(
    scene,
    { name: 'TerrainMaterial' },
    {
      texturesData,
      atlas: createTexturesAtlasFromRects(scene, {
        map1: terrainMapping.layer1,
        map2: terrainMapping.layer2,
      }),
      alphaMap: createAlphaMapTexture(scene, {
        alpha: terrainMapping.alpha,
        lights: terrainLight,
      }),
    }
  );

  //TODO why?
  terrain.position.x -= 4;
  terrain.position.y = 256;
  terrain.rotationQuaternion = null;
  terrain.rotation.x = toRadians(90);

  return { objects };
}
