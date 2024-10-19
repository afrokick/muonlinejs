import { ENUM_WORLD } from '../../../common';
import { ENUM_OBJECTS } from '../../../common/objects/enum';
import { BMD, BMD_Open } from '../../../common/objects/zzzBMD';
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
import { Models } from '../../../common/zzzMapManagerLoad';
import { downloadBytesBuffer, toRadians } from '../../../common/utils';
import { BMDReader } from '../../../common/BMD';
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

export async function loadMapIntoScene(scene: Scene) {
  const { objects } = await getTerrainData(scene, LOAD_MAP);

  const worldNum = LOAD_MAP + 1;
  const objectsFolder = `./data/Object${worldNum}/`;

  //
  // TODO MAP OBJECTS
  //

  const SCALE = 0.01;

  // const bmdBridge = await BMD_Open(objectsFolder, `Bridge01.bmd`);
  // const bmdBridge = await BMD_Open(objectsFolder, `Waterspout01.bmd`);
  const reader = new BMDReader();
  const gameTime = { TotalGameTime: { TotalSeconds: 0.1 } };
  const bmd = reader.read(
    await downloadBytesBuffer(objectsFolder + `Bridge01.bmd`)
  );
  const bmdWater = reader.read(
    await downloadBytesBuffer(objectsFolder + `Waterspout01.bmd`)
  );

  const modelObject = new ModelObject(bmdWater, scene, worldNum);
  modelObject.load();
  modelObject.Update(gameTime);
  modelObject.updateLocation(
    new Vector3(133, 11, 129.5),
    SCALE,
    new Vector3(0, toRadians(-60), 0)
  );
  modelObject.Draw(gameTime);

  console.log(modelObject);

  scene.onBeforeRenderObservable.add(() => {
    gameTime.TotalGameTime.TotalSeconds += (scene.deltaTime || 0) / 1000;
    modelObject.Update(gameTime);
    modelObject.Draw(gameTime);
  });

  // console.log(bmdBridge);

  const TYPES = [
    ENUM_OBJECTS.MODEL_BRIDGE,
    // ENUM_OBJECTS.MODEL_WATERSPOUT,
    //   // ENUM_OBJECTS.MODEL_WELL01,
    //   // ENUM_OBJECTS.MODEL_WELL02,
    //   // ENUM_OBJECTS.MODEL_STAIR,
    //   // ENUM_OBJECTS.MODEL_HANGING,
    //   // ENUM_OBJECTS.MODEL_WELL03,
    //   // ENUM_OBJECTS.MODEL_WELL04,
    //   // ENUM_OBJECTS.MODEL_HOUSE01,
    //   // ENUM_OBJECTS.MODEL_HOUSE_WALL01,
    //   // ENUM_OBJECTS.MODEL_HOUSE_WALL02,
    //   // ENUM_OBJECTS.MODEL_HOUSE_WALL03,
  ];

  const filteredObjects = objects.filter(o => TYPES.includes(o.id));

  const mapParent = new TransformNode('mapParent', scene);

  filteredObjects.forEach(data => {
    // const bmd = Models[data.id];
    const pos = new Vector3(data.pos.x, data.pos.z, data.pos.y);

    const scale = data.scale;
    const angles = new Vector3(
      toRadians(data.rot.x),
      toRadians(data.rot.z),
      toRadians(data.rot.y)
    );

    if (!bmd) {
      console.error(`no bmd for ${ENUM_OBJECTS[data.id]}(${data.id})`);
    }

    const modelObject = new ModelObject(bmd, scene, worldNum);
    modelObject.load();
    modelObject.Update(gameTime);
    modelObject.updateLocation(pos, scale, angles);
    modelObject.Draw(gameTime);

    modelObject._node.name = bmd.Name + `(${data.id})`;
    // console.log(modelObject);

    modelObject._node.setParent(mapParent);
  });

  mapParent.scaling.setAll(SCALE);
}
