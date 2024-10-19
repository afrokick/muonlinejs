import { ENUM_WORLD } from '../../../common';
import { ENUM_OBJECTS } from '../../../common/objects/enum';
import { OpenTga } from '../../../common/textures/test';
import {
  Mesh,
  RawTexture,
  Scalar,
  Scene,
  SceneLoader,
  StandardMaterial,
  Texture,
  TransformNode,
  Vector3,
  VertexData,
} from '../babylon/exports';
import { getTerrainData } from './getTerrainData';
import { downloadBytesBuffer, toRadians } from '../../../common/utils';
import { BMD, BMDReader } from '../../../common/BMD';
import { ModelObject } from '../../../common/modelObject';

const APPLY_TO_SUBMESH = false;

const LOAD_MAP: ENUM_WORLD = ENUM_WORLD.WD_0LORENCIA;

async function loadObject(path: string, scene: Scene) {
  const objRes = await SceneLoader.ImportMeshAsync(
    null,
    path,
    undefined,
    scene
  );

  objRes.animationGroups.forEach(ag => {
    ag.stop();
    ag.dispose();
  });
  const root = objRes.meshes[0];
  // root.scaling = Vector3.One();
  // root.rotationQuaternion.set(0, 0, 0, 0);
  // root.position.setAll(0);

  return { root } as const;
}

function createBMDVertexData(
  bmd: BMD,
  bmdMesh: BMD['Meshs'][number]
): VertexData {
  const indices: number[] = [];
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const weights: number[] = [];
  const bones: number[] = [];

  const p = Vector3.Zero();

  let c = 0;
  bmdMesh.Triangles.forEach(t => {
    for (let k = 0; k < 3; k++) {
      const vIndex = t.VertexIndex[k];
      const normalIndex = t.NormalIndex[k];
      const uvIndex = t.TexCoordIndex[k];

      const v = bmdMesh.Vertices[vIndex].Position;
      const normal = bmdMesh.Normals[normalIndex].Normal;
      const uv = bmdMesh.TexCoords[uvIndex];

      bones.push(bmdMesh.Vertices[vIndex].Node);
      bones.push(bmdMesh.Vertices[vIndex].Node);
      bones.push(bmdMesh.Vertices[vIndex].Node);
      bones.push(bmdMesh.Vertices[vIndex].Node);
      weights.push(1, 1, 1, 1);

      // const boneVertex = bmd.BoneFixup[bmdMesh.Vertices[vIndex].Node];

      // v.subtractToRef(boneVertex.WorldOrg, p);
      // VectorTransform(p, boneVertex.im, v);

      // p.copyFrom(normal);
      // VectorTransform(p, boneVertex.im, normal);
      // normal.normalize();

      positions.push(v.x, v.y, v.z);
      normals.push(normal.x, normal.y, normal.z);
      uvs.push(uv.TexCoordU, uv.TexCoordV);
    }
    indices.push(c++, c++, c++);
  });

  // Result
  const vertexData = new VertexData();

  vertexData.matricesIndices = bones;
  vertexData.matricesWeights = weights;
  vertexData.indices = indices;
  vertexData.positions = positions;
  vertexData.normals = normals;
  vertexData.uvs = uvs;

  return vertexData;
}

async function loadOZTTexture(
  filePath: string,
  scene: Scene,
  invertY: boolean
) {
  const tga = await OpenTga(filePath);

  const t = RawTexture.CreateRGBATexture(
    tga.rgbaBuffer,
    tga.width,
    tga.height,
    scene,
    false,
    invertY,
    Texture.LINEAR_LINEAR
  );
  t.name = filePath;
  return t;
}

function createMesh(
  bmd: BMD,
  scene: Scene,
  pos: Vector3,
  scale: Float,
  angles: Vector3
) {
  const worldNum = LOAD_MAP + 1;

  const USE_SKELETON = true;
  if (USE_SKELETON) {
    bmd.buildSkeleton(scene);

    const skeleton = bmd.skeleton!;
    skeleton.useTextureToStoreBoneMatrices = false;
  }

  const parent = new TransformNode(bmd.Name, scene);
  parent.position.copyFrom(pos);
  parent.rotationQuaternion = null;

  parent.rotation.x = angles.x;
  parent.rotation.y = angles.y;
  parent.rotation.z = angles.z;

  bmd.Meshs.forEach(async (mesh, meshIndex) => {
    const vertexData = createBMDVertexData(bmd, mesh);

    const customMesh = new Mesh('custom', scene);
    vertexData.applyToMesh(customMesh);

    customMesh.showBoundingBox = true;

    const m = new StandardMaterial('abc', scene);
    m.specularColor.setAll(0);
    customMesh.scaling.scaleInPlace(scale);
    customMesh.numBoneInfluencers = 1;
    if (USE_SKELETON) {
      customMesh.applySkeleton(bmd.skeleton!);
      customMesh.skeleton = bmd.skeleton;
    }

    customMesh.computeBonesUsingShaders = true;
    customMesh.material = m;

    customMesh.setParent(parent);
    customMesh.position.setAll(0);

    customMesh.rotationQuaternion = null;
    customMesh.rotation.setAll(0);

    if (APPLY_TO_SUBMESH) {
      const bone = bmd.Bones[meshIndex];

      const matrix = bone.BoneMatrixes[0];

      customMesh.position.set(
        matrix.Position[0].x,
        matrix.Position[0].z,
        matrix.Position[0].y
      );

      customMesh.position.scaleInPlace(scale);

      const rot = matrix.Rotation[0];
      customMesh.rotation.x = rot.x;
      customMesh.rotation.y = rot.z;
      customMesh.rotation.z = rot.y;
    }

    const textureName = bmd.Textures[mesh.Texture].FileName;
    const objectsFolder = `./data/Object${worldNum}/`;

    if (textureName.toLowerCase().endsWith('.tga')) {
      const textureFilePath =
        objectsFolder + textureName.replace('.tga', '.OZT');
      const t = await loadOZTTexture(textureFilePath, scene, true);
      t.hasAlpha = true;
      m.diffuseTexture = t;
      m.transparencyMode = 2;
      m.useAlphaFromDiffuseTexture = true;
    } else {
      const textureFilePath = objectsFolder + textureName;

      const t = new Texture(textureFilePath, scene, false, false);
      m.diffuseTexture = t;
    }
  });

  return parent;
}

function padZero(num: number) {
  return num.toString().padStart(2, '0');
}

async function getObjects() {
  const reader = new BMDReader();
  const Models: Record<number, BMD> = {};
  // for (const [id, path] of Object.entries(paths)) {
  //   const bmd = reader.read(await downloadBytesBuffer(path));
  //   Models[+id] = bmd;
  // }

  const gLoadData = {
    AccessModel: async (
      Type: number,
      Dir: string,
      FileName: string,
      i: Int
    ) => {
      let Name = '';
      if (i === -1) Name = `${FileName}.bmd`;
      else Name = `${FileName}${padZero(i)}.bmd`;

      const filePath = Dir + Name;

      console.log(`Try to load file: ${filePath}`);

      if (!Models[Type]) {
        const bmd = reader.read(await downloadBytesBuffer(filePath));
        Models[Type] = bmd;
      }
    },
  };

  let i = 0;

  for (i = 0; i < 13; i++)
    await gLoadData.AccessModel(
      ENUM_OBJECTS.MODEL_TREE01 + i,
      './data/Object1/',
      'Tree',
      i + 1
    );
  for (i = 0; i < 8; i++)
    await gLoadData.AccessModel(
      ENUM_OBJECTS.MODEL_GRASS01 + i,
      './data/Object1/',
      'Grass',
      i + 1
    );
  for (i = 0; i < 5; i++)
    await gLoadData.AccessModel(
      ENUM_OBJECTS.MODEL_STONE01 + i,
      './data/Object1/',
      'Stone',
      i + 1
    );

  for (i = 0; i < 3; i++)
    await gLoadData.AccessModel(
      ENUM_OBJECTS.MODEL_STONE_STATUE01 + i,
      './data/Object1/',
      'StoneStatue',
      i + 1
    );
  await gLoadData.AccessModel(
    ENUM_OBJECTS.MODEL_STEEL_STATUE,
    './data/Object1/',
    'SteelStatue',
    1
  );
  for (i = 0; i < 3; i++)
    await gLoadData.AccessModel(
      ENUM_OBJECTS.MODEL_TOMB01 + i,
      './data/Object1/',
      'Tomb',
      i + 1
    );
  for (i = 0; i < 2; i++)
    await gLoadData.AccessModel(
      ENUM_OBJECTS.MODEL_FIRE_LIGHT01 + i,
      './data/Object1/',
      'FireLight',
      i + 1
    );
  await gLoadData.AccessModel(
    ENUM_OBJECTS.MODEL_BONFIRE,
    './data/Object1/',
    'Bonfire',
    1
  );
  await gLoadData.AccessModel(
    ENUM_OBJECTS.MODEL_DUNGEON_GATE,
    './data/Object1/',
    'DoungeonGate',
    1
  );
  await gLoadData.AccessModel(
    ENUM_OBJECTS.MODEL_TREASURE_DRUM,
    './data/Object1/',
    'TreasureDrum',
    1
  );
  await gLoadData.AccessModel(
    ENUM_OBJECTS.MODEL_TREASURE_CHEST,
    './data/Object1/',
    'TreasureChest',
    1
  );
  await gLoadData.AccessModel(
    ENUM_OBJECTS.MODEL_SHIP,
    './data/Object1/',
    'Ship',
    1
  );

  for (i = 0; i < 6; i++)
    await gLoadData.AccessModel(
      ENUM_OBJECTS.MODEL_STONE_WALL01 + i,
      './data/Object1/',
      'StoneWall',
      i + 1
    );
  for (i = 0; i < 4; i++)
    await gLoadData.AccessModel(
      ENUM_OBJECTS.MODEL_MU_WALL01 + i,
      './data/Object1/',
      'StoneMuWall',
      i + 1
    );
  for (i = 0; i < 3; i++)
    await gLoadData.AccessModel(
      ENUM_OBJECTS.MODEL_STEEL_WALL01 + i,
      './data/Object1/',
      'SteelWall',
      i + 1
    );
  await gLoadData.AccessModel(
    ENUM_OBJECTS.MODEL_STEEL_DOOR,
    './data/Object1/',
    'SteelDoor',
    1
  );
  for (i = 0; i < 3; i++)
    await gLoadData.AccessModel(
      ENUM_OBJECTS.MODEL_CANNON01 + i,
      './data/Object1/',
      'Cannon',
      i + 1
    );
  await gLoadData.AccessModel(
    ENUM_OBJECTS.MODEL_BRIDGE,
    './data/Object1/',
    'Bridge',
    1
  );
  for (i = 0; i < 4; i++)
    await gLoadData.AccessModel(
      ENUM_OBJECTS.MODEL_FENCE01 + i,
      './data/Object1/',
      'Fence',
      i + 1
    );
  await gLoadData.AccessModel(
    ENUM_OBJECTS.MODEL_BRIDGE_STONE,
    './data/Object1/',
    'BridgeStone',
    1
  );

  await gLoadData.AccessModel(
    ENUM_OBJECTS.MODEL_STREET_LIGHT,
    './data/Object1/',
    'StreetLight',
    1
  );
  await gLoadData.AccessModel(
    ENUM_OBJECTS.MODEL_CURTAIN,
    './data/Object1/',
    'Curtain',
    1
  );
  for (i = 0; i < 4; i++)
    await gLoadData.AccessModel(
      ENUM_OBJECTS.MODEL_CARRIAGE01 + i,
      './data/Object1/',
      'Carriage',
      i + 1
    );
  for (i = 0; i < 2; i++)
    await gLoadData.AccessModel(
      ENUM_OBJECTS.MODEL_STRAW01 + i,
      './data/Object1/',
      'Straw',
      i + 1
    );
  for (i = 0; i < 2; i++)
    await gLoadData.AccessModel(
      ENUM_OBJECTS.MODEL_SIGN01 + i,
      './data/Object1/',
      'Sign',
      i + 1
    );
  for (i = 0; i < 2; i++)
    await gLoadData.AccessModel(
      ENUM_OBJECTS.MODEL_MERCHANT_ANIMAL01 + i,
      './data/Object1/',
      'MerchantAnimal',
      i + 1
    );
  await gLoadData.AccessModel(
    ENUM_OBJECTS.MODEL_WATERSPOUT,
    './data/Object1/',
    'Waterspout',
    1
  );
  for (i = 0; i < 4; i++)
    await gLoadData.AccessModel(
      ENUM_OBJECTS.MODEL_WELL01 + i,
      './data/Object1/',
      'Well',
      i + 1
    );
  await gLoadData.AccessModel(
    ENUM_OBJECTS.MODEL_HANGING,
    './data/Object1/',
    'Hanging',
    1
  );

  for (i = 0; i < 5; i++)
    await gLoadData.AccessModel(
      ENUM_OBJECTS.MODEL_HOUSE01 + i,
      './data/Object1/',
      'House',
      i + 1
    );
  await gLoadData.AccessModel(
    ENUM_OBJECTS.MODEL_TENT,
    './data/Object1/',
    'Tent',
    1
  );
  await gLoadData.AccessModel(
    ENUM_OBJECTS.MODEL_STAIR,
    './data/Object1/',
    'Stair',
    1
  );

  for (i = 0; i < 6; i++)
    await gLoadData.AccessModel(
      ENUM_OBJECTS.MODEL_HOUSE_WALL01 + i,
      './data/Object1/',
      'HouseWall',
      i + 1
    );
  for (i = 0; i < 3; i++)
    await gLoadData.AccessModel(
      ENUM_OBJECTS.MODEL_HOUSE_ETC01 + i,
      './data/Object1/',
      'HouseEtc',
      i + 1
    );
  for (i = 0; i < 3; i++)
    await gLoadData.AccessModel(
      ENUM_OBJECTS.MODEL_LIGHT01 + i,
      './data/Object1/',
      'Light',
      i + 1
    );
  await gLoadData.AccessModel(
    ENUM_OBJECTS.MODEL_POSE_BOX,
    './data/Object1/',
    'PoseBox',
    1
  );

  for (i = 0; i < 7; i++)
    await gLoadData.AccessModel(
      ENUM_OBJECTS.MODEL_FURNITURE01 + i,
      './data/Object1/',
      'Furniture',
      i + 1
    );
  await gLoadData.AccessModel(
    ENUM_OBJECTS.MODEL_CANDLE,
    './data/Object1/',
    'Candle',
    1
  );
  for (i = 0; i < 3; i++)
    await gLoadData.AccessModel(
      ENUM_OBJECTS.MODEL_BEER01 + i,
      './data/Object1/',
      'Beer',
      i + 1
    );

  return Models;
}

export async function loadMapIntoScene(scene: Scene) {
  const { objects } = await getTerrainData(scene, LOAD_MAP);

  const worldNum = LOAD_MAP + 1;
  const objectsFolder = `./data/Object${worldNum}/`;

  //
  // TODO MAP OBJECTS
  //

  const gameTime = { TotalGameTime: { TotalSeconds: 0.1 } };

  const SCALE = 0.01;

  const Models = await getObjects();

  // const modelObject = new ModelObject(bmdWater, scene, worldNum);
  // modelObject.load();
  // modelObject.Update(gameTime);
  // modelObject.updateLocation(
  //   new Vector3(129, 129.5, 6),
  //   SCALE,
  //   new Vector3(toRadians(0), toRadians(0), toRadians(0))
  // );
  // modelObject.Draw(gameTime);

  // console.log(modelObject);

  scene.onBeforeRenderObservable.add(() => {
    gameTime.TotalGameTime.TotalSeconds += (scene.deltaTime || 0) / 1000;
  });

  // console.log(bmdBridge);

  const TYPES = [
    ENUM_OBJECTS.MODEL_BRIDGE,
    ENUM_OBJECTS.MODEL_WATERSPOUT,
    ENUM_OBJECTS.MODEL_WELL01,
    ENUM_OBJECTS.MODEL_WELL02,
    ENUM_OBJECTS.MODEL_STAIR,
    ENUM_OBJECTS.MODEL_HANGING,
    ENUM_OBJECTS.MODEL_WELL03,
    ENUM_OBJECTS.MODEL_WELL04,
    ENUM_OBJECTS.MODEL_HOUSE01,
    ENUM_OBJECTS.MODEL_HOUSE_WALL01,
    ENUM_OBJECTS.MODEL_HOUSE_WALL02,
    ENUM_OBJECTS.MODEL_HOUSE_WALL03,
  ];

  const filteredObjects = objects;//.filter(o => TYPES.includes(o.id));

  const mapParent = new TransformNode('mapParent', scene);

  filteredObjects.forEach(data => {
    const bmd = Models[data.id];
    const pos = new Vector3(data.pos.x, data.pos.y, data.pos.z);

    const scale = data.scale;
    const angles = new Vector3(
      toRadians(data.rot.x),
      toRadians(data.rot.y),
      toRadians(data.rot.z)
    );

    if (!bmd) {
      console.error(`no bmd for ${ENUM_OBJECTS[data.id]}(${data.id})`);
      return;
    }

    const modelObject = new ModelObject(bmd, scene, worldNum);
    modelObject.load();
    modelObject.Update(gameTime);
    modelObject.updateLocation(pos, scale, angles);
    modelObject.Draw(gameTime);

    modelObject._node.name = bmd.Name + `(${data.id})`;
    // console.log(modelObject);

    modelObject._node.setParent(mapParent);

    scene.onBeforeRenderObservable.add(() => {
      modelObject.Update(gameTime);
      modelObject.Draw(gameTime);
    });
  });

  mapParent.scaling.setAll(SCALE);
  mapParent.scaling.y *= -1;
  mapParent.position.y = 256;
}
