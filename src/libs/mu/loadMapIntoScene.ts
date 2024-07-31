import { MixMaterial } from "@babylonjs/materials/mix";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";

import { RawTexture, Scene, Texture, Vector3 } from "../babylon/exports";
import { Config } from "./config";
import { getTerrainData } from "./getTerrainData";
import { MapUtils, Location } from "./mapUtils";

export function TERRAIN_INDEX(x: number, y: number) {
  return y * Config.MapSize + x;
}

export async function loadMapIntoScene(scene: Scene) {
  const { groundMap, objects } = await getTerrainData();

  const rawPixels1: number[] = [];
  const rawPixels2: number[] = [];

  groundMap.forEach((y, x) => {
    y.forEach(({ id1, id2, alpha }, y) => {
      const pixels = [0, 0, 0, 255, 0, 0, 0, 255];

      if (id1 > 7) {

      } else {
        const isAlpha1 = id1 === 3 || id1 === 7;

        pixels[id1] = isAlpha1 ? 0 : 255;

        if (id2 < 8) {
          const isAlpha2 = id2 === 3 || id2 === 7;
          const val = 255 * (alpha);
          pixels[id2] = isAlpha2 ? 255 - val : val;
        }
      }

      rawPixels1.push(...pixels.slice(0, 4));
      rawPixels2.push(...pixels.slice(-4));
    });
  });

  const layer1 = RawTexture.CreateRGBATexture(Uint8Array.from(rawPixels1), Config.MapSize, Config.MapSize, scene);
  // layer1.uOffset = -2 / 100;
  // layer1.vOffset = -1.0/100;
  layer1.anisotropicFilteringLevel = 1;

  const layer2 = RawTexture.CreateRGBATexture(Uint8Array.from(rawPixels2), Config.MapSize, Config.MapSize, scene);
  layer2.anisotropicFilteringLevel = 1;

  const heightMapTexture = new Texture('./data/World1/TerrainHeight.png', scene, true, false);
  heightMapTexture.name = 'HeightMapTexture';

  heightMapTexture.onLoadObservable.addOnce(async () => {
    const MIN_HEIGHT = -500;
    const heightMapBuffer = await heightMapTexture.readPixels()!;

    const array = new Uint8Array(heightMapBuffer.buffer);

    const heightMap = [];
    for (let i = 0; i < array.byteLength; i += 4) {
      const r = array[i + 0];
      const g = array[i + 1];
      const b = array[i + 2];

      let height = r + g + b;
      // height += MIN_HEIGHT;
      heightMap.push(height);
    }

    function Vector(x: number, z: number, y: number, vert: Vector3) {
      vert.set(x, y, z);
    }

    // const indices = [];
    // const positions = [];
    // const normals = [];
    // const uvs = [];

    const testPoses: Vector3[] = [];

    const TERRAIN_SCALE = 100.0;
    for (let yi = 0; yi < 255; yi++) {
      for (let xi = 0; xi < 255; xi++) {
        const TerrainVertex: Vector3[] = [Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero()];

        const xf = xi * 1.0;
        const yf = yi * 1.0;
        let TerrainIndex1 = TERRAIN_INDEX(xi, yi);
        // if ((TerrainWall[TerrainIndex1] & TW_NOGROUND) == TW_NOGROUND && !Flag)
        //     return false;

        // let TerrainIndex2 = TERRAIN_INDEX(xi + 1, yi);
        // let TerrainIndex3 = TERRAIN_INDEX(xi + 1, yi + 1);
        // let TerrainIndex4 = TERRAIN_INDEX(xi, yi + 1);

        let sx = xf * TERRAIN_SCALE;
        let sy = yf * TERRAIN_SCALE;

        // Vector(sx, sy, heightMap[TerrainIndex1], TerrainVertex[0]);
        // Vector(sx + TERRAIN_SCALE, sy, heightMap[TerrainIndex2], TerrainVertex[1]);
        // Vector(sx + TERRAIN_SCALE, sy + TERRAIN_SCALE, heightMap[TerrainIndex3], TerrainVertex[2]);
        // Vector(sx, sy + TERRAIN_SCALE, heightMap[TerrainIndex4], TerrainVertex[3]);

        testPoses.push(new Vector3(sx, heightMap[TerrainIndex1], sy));
        // TerrainVertex.forEach(position => {
        //   testPoses.push(position);
        //   positions.push(position.x, position.y, position.z);
        // });
      }
    }

    console.log(testPoses);

    // for (let yi = 0; yi < 255; yi++) {
    //   for (let xi = 0; xi < 255; xi++) {
    //     const idx1 = xi + 1 + (yi + 1) * 256;
    //     const idx2 = xi + 1 + yi * 256;
    //     const idx3 = xi + yi * (256);
    //     const idx4 = xi + (yi + 1) * 256;

    //     // console.log(idx1,idx2,idx3,idx4);

    //     indices.push(idx1);
    //     indices.push(idx2);
    //     indices.push(idx3);

    //     indices.push(idx4);
    //     indices.push(idx1);
    //     indices.push(idx3);
    //   }
    // }

    // const vertexData = new VertexData();

    // vertexData.indices = indices;
    // vertexData.positions = positions;
    // vertexData.normals = normals;
    // vertexData.uvs = uvs;

    // const mesh = new GroundMesh('gggg', this);
    // mesh.scaling.setAll(0.0025);
    // mesh.position.set(128, 4, 128);
    // vertexData.applyToMesh(mesh, true);

    // const textCube = MeshBuilder.CreateBox('textBox');
    // textCube.position.set(0, -1, 0);
    // // textCube.scaling.setAll(1);
    // textCube.alwaysSelectAsActiveMesh = true;
    // const testScale = 0.01;
    // const scale = Vector3.One().scaleInPlace(0.9);
    // const tempRot = Quaternion.Identity();
    // testPoses.forEach(p => {
    //   textCube.thinInstanceAdd(Matrix.Compose(scale, tempRot, p.scaleInPlace(testScale)), false);
    // });
    // textCube.thinInstanceAddSelf(true);

    console.log(heightMapBuffer, heightMap);
  });

  const details = 128;
  const minHeight = 0;
  const maxHeight = 1.5;
  const ground = MeshBuilder.CreateGroundFromHeightMap("gdhm", './data/World1/TerrainHeight.png', {
    width: Config.MapSize,
    height: Config.MapSize,
    minHeight, maxHeight, subdivisions: details
  }, scene); //scene is optional and defaults to the current scene
  ground.position.set(Config.MapSize / 2, 0, Config.MapSize / 2);

  const textures = MapUtils.getTilesList(Location.Lorencia).map(t => `./data/World1/${t}.jpg`);
  const mix = createMixMaterial(textures, scene);
  mix.mixTexture1 = layer1;
  mix.mixTexture2 = layer2;

  ground.material = mix;

  // const allowed = [143, 146, 123, 125];
  // const objMap = new Map();
  // for (let obj of objects) {
  //   // if (obj.pos.x > 90 && obj.pos.x < 150 && obj.pos.z > 80 && obj.pos.z < 150)
  //   {
  //     console.log({ obj });
  //     let objRoot: Mesh;
  //     if (!objMap.has(obj.id)) {
  //       const { root } = await loadObject(`./data/Object1/Object${obj.id}.new.glb`, this);

  //       root.name = `Object` + obj.id;

  //       root.scaling.setAll(0.5);
  //       objMap.set(obj.id, root);
  //       objRoot = root as Mesh;
  //     } else {
  //       objRoot = objMap.get(obj.id);
  //     }

  //     const inst = objRoot.clone(`Object${obj.id}`, undefined, false, false);
  //     inst.position.set(obj.pos.x, obj.pos.y - 1.2, obj.pos.z);
  //     inst.rotationQuaternion = Quaternion.FromEulerAngles(0, toRadians(obj.rot.y), 0);

  //   }
  // }
}

function createMixMaterial(textures: string[], scene: Scene) {
  // Create the mix material
  const mix = new MixMaterial("mix", scene);

  // Mix texture 1 (RGBA) is required
  //     mix.mixTexture1 = new Texture("/playground/textures/mixMap.png", this);

  // Mix texture 2 (RGBA) is optional
  //     mix.mixTexture2 = new Texture("/playground/textures/mixMap_2.png", this);

  textures.slice(0, 8).forEach((texture, i) => {
    const t = new Texture(texture, scene, true);
    t.anisotropicFilteringLevel = 1;
    t.uScale = 128;
    t.vScale = 128;
    mix['diffuseTexture' + (i + 1)] = t;
  });
  return mix;
}