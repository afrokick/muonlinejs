import { Document, Node, NodeIO, type Skin } from '@gltf-transform/core';
import { BMD, BMDReader, BMDTextureBone } from '../src/common/BMD';
import { Glob } from 'bun';
import { EXTTextureWebP } from '@gltf-transform/extensions';
import sharp from 'sharp';
import { decodeTga } from '@lunapaint/tga-codec';
import { PNG } from 'pngjs';
import { BMD_EXT, DATA_FOLDER, OUTPUT_FOLDER } from './shared';

async function tga2png(file: Buffer) {
  const tga = await decodeTga(new Uint8Array(file));
  const png = new PNG({
    width: tga.details.header.width,
    height: tga.details.header.height,
  });
  png.data = tga.image.data;

  return new Promise<Buffer>((resolve, reject) => {
    const bufs: Uint8Array[] = [];
    png
      .pack()
      .on('data', d => {
        bufs.push(d);
      })
      .on('end', () => {
        const buffer = Buffer.concat(bufs);

        resolve(buffer);
      })
      .on('error', reject);
  });
}

async function convertImageToWebP(image: Uint8Array): Promise<Uint8Array> {
  if (image.length > 0 && image[0] === 0x00 && image[1] === 0x00) {
    const inputBuffer = Buffer.from(image);
    const outputBuffer = await tga2png(inputBuffer);
    image = new Uint8Array(outputBuffer);
  }

  const buffer = await sharp(image).toFormat('webp').toBuffer();

  return new Uint8Array(buffer);
}

const SCALE_MULTIPLIER = 0.01;

const glob = new Glob(`**/*{${BMD_EXT.toUpperCase()},${BMD_EXT}}`);

const convertVec3 = (v: { x: number; y: number; z: number }) => v;
//  ({
//   x: -v.y, //  -Y  →  +X
//   y: v.z, //  +Z  →  +Y
//   z: v.x, //  +X  →  +Z
// });

type Quaternion = { x: number; y: number; z: number; w: number };

// Quaternion multiplication (a * b)
function quatMultiply(a: Quaternion, b: Quaternion): Quaternion {
  return {
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
  };
}

function quatInvert(q: Quaternion): Quaternion {
  // For a unit quaternion, inversion = conjugation
  return { x: -q.x, y: -q.y, z: -q.z, w: q.w };
}

const TRANSFORM_Q: Quaternion = { x: 0.5, y: -0.5, z: 0.5, w: -0.5 };
const TRANSFORM_Q_INV: Quaternion = quatInvert(TRANSFORM_Q);

function convertQuaternion(q: Quaternion): Quaternion {
  return q;
  // const tmp = quatMultiply(TRANSFORM_Q, q);
  // const res = quatMultiply(tmp, TRANSFORM_Q_INV);
  // return res;
}

const IGNORE_FILES = ['Minimap.bmd', 'skill.bmd', 'item.bmd', 'Itemtest.bmd'];

async function convertBMDToGLTF(bmd: BMD, outputFilename: string) {
  const fileName = outputFilename.split('/').at(-1)!.split('.')[0];

  const doc = new Document();
  // Create an Extension attached to the Document.
  const webpExtension = doc
    .createExtension(EXTTextureWebP as any)
    .setRequired(true);

  const buffer = doc.createBuffer();
  const scene = doc.createScene('mainScene');

  const modelRoot = doc.createNode(`model_${fileName}`);
  scene.addChild(modelRoot);

  const isSingleFrame =
    bmd.Bones.length === 1 &&
    bmd.Actions.length === 1 &&
    bmd.Actions[0].NumAnimationKeys === 1;

  let skin: Skin | undefined;

  const modelPos = { x: 0, y: 0, z: 0 };
  const modelRot = { x: 0, y: 0, z: 0, w: 1 };

  const allBonesWithoutParent = bmd.Bones.every(b => b.Parent === -1);
  if (bmd.Bones.length > 1 && allBonesWithoutParent) {
    // console.log(`${fileName} has multiple bones`);
  }

  if (!isSingleFrame) {
    const skinNodes: Node[] = [];

    const skinRoot = doc.createNode(`skin_${fileName}`);
    skin = doc.createSkin();
    skin.setSkeleton(skinRoot);
    skin.addJoint(skinRoot);

    scene.addChild(skinRoot);

    let boneIndex = 0;
    for (const bmdBone of bmd.Bones) {
      const node = doc.createNode(`bone_${boneIndex}_${bmdBone.Name}`);
      skin.addJoint(node);

      skinNodes.push(node);

      if (bmdBone.Parent === -1) {
        skinRoot.addChild(node);
      } else {
        const parentNode = skinNodes[bmdBone.Parent];
        parentNode.addChild(node);
      }

      boneIndex++;
    }

    // === Animations conversion ===
    const DEFAULT_FPS = 24;

    for (let actionIndex = 0; actionIndex < bmd.Actions.length; actionIndex++) {
      const action = bmd.Actions[actionIndex];

      if (action.NumAnimationKeys === 0) continue;

      const animation = doc.createAnimation(
        `${fileName}_action_${actionIndex}`
      );

      const times: number[] = [];
      const dt =
        1 /
        (action.PlaySpeed && action.PlaySpeed > 0
          ? action.PlaySpeed * DEFAULT_FPS
          : DEFAULT_FPS);

      for (let k = 0; k < action.NumAnimationKeys; k++) {
        times.push(k * dt);
      }

      const isLongAnimation = action.NumAnimationKeys > 1;

      if (isLongAnimation) {
        times.push(action.NumAnimationKeys * dt);
      }

      const inputAccessor = doc
        .createAccessor(`anim_${actionIndex}_input`)
        .setType('SCALAR')
        .setArray(new Float32Array(times))
        .setBuffer(buffer);

      const lockPositions = action.LockPositions;

      for (let boneIndex = 0; boneIndex < bmd.Bones.length; boneIndex++) {
        const bone = bmd.Bones[boneIndex];
        if (bone === BMDTextureBone.Dummy) continue;

        const boneMatrix = bone.Matrixes[actionIndex];

        // === Translation ===
        if (
          boneMatrix.Position &&
          boneMatrix.Position.length === action.NumAnimationKeys
        ) {
          const posArray: number[] = [];
          boneMatrix.Position.forEach(p => {
            const cp = convertVec3(p);
            posArray.push(
              cp.x * SCALE_MULTIPLIER,
              cp.y * SCALE_MULTIPLIER,
              cp.z * SCALE_MULTIPLIER
            );
          });

          if (boneIndex === 0 && lockPositions && posArray.length > 0) {
            for (let i = 3; i < posArray.length; i += 3) {
              posArray[i + 0] = posArray[0];
              posArray[i + 1] = posArray[1];
            }
          }

          if (isLongAnimation) {
            posArray.push(posArray[0], posArray[1], posArray[2]);
          }

          const posAccessor = doc
            .createAccessor(`anim_${actionIndex}_bone_${boneIndex}_T`)
            .setType('VEC3')
            .setArray(new Float32Array(posArray))
            .setBuffer(buffer);

          const sampler = doc
            .createAnimationSampler()
            .setInput(inputAccessor)
            .setOutput(posAccessor)
            .setInterpolation('LINEAR');

          const channel = doc
            .createAnimationChannel()
            .setTargetNode(skinNodes[boneIndex])
            .setTargetPath('translation')
            .setSampler(sampler);

          animation.addSampler(sampler).addChannel(channel);
        }

        // === Rotation ===
        if (
          boneMatrix.Quaternion &&
          boneMatrix.Quaternion.length === action.NumAnimationKeys
        ) {
          const rotArray: number[] = [];
          boneMatrix.Quaternion.forEach(q => {
            const cq = convertQuaternion(q);
            rotArray.push(cq.x, cq.y, cq.z, cq.w);
          });

          if (isLongAnimation) {
            rotArray.push(rotArray[0], rotArray[1], rotArray[2], rotArray[3]);
          }

          const rotAccessor = doc
            .createAccessor(`anim_${actionIndex}_bone_${boneIndex}_R`)
            .setType('VEC4')
            .setArray(new Float32Array(rotArray))
            .setBuffer(buffer);

          const samplerR = doc
            .createAnimationSampler()
            .setInput(inputAccessor)
            .setOutput(rotAccessor)
            .setInterpolation('LINEAR');

          const channelR = doc
            .createAnimationChannel()
            .setTargetNode(skinNodes[boneIndex])
            .setTargetPath('rotation')
            .setSampler(samplerR);

          animation.addSampler(samplerR).addChannel(channelR);
        }
      }
    }
  } else {
    const bone = bmd.Bones[0];

    const boneMatrix = bone.Matrixes[0];

    const pos = boneMatrix.Position[0];
    const rot = boneMatrix.Quaternion[0];

    modelPos.x = pos.x * SCALE_MULTIPLIER;
    modelPos.y = pos.y * SCALE_MULTIPLIER;
    modelPos.z = pos.z * SCALE_MULTIPLIER;

    modelRot.x = rot.x;
    modelRot.y = rot.y;
    modelRot.z = rot.z;
    modelRot.w = rot.w;
  }

  let meshIndex = 0;
  const uniqueBonesPerMesh = new Set<number>();
  for (const bmdMesh of bmd.Meshes) {
    uniqueBonesPerMesh.clear();

    const node = doc.createNode(`node_${meshIndex}`);
    meshIndex++;
    modelRoot.addChild(node);

    if (skin) {
      node.setSkin(skin);
    } else {
      node.setTranslation([modelPos.x, modelPos.y, modelPos.z]);
      node.setRotation([modelRot.x, modelRot.y, modelRot.z, modelRot.w]);
    }

    const positionArray: number[] = [];
    const indicesArray: number[] = [];
    const texcoordArray: number[] = [];
    const normalsArray: number[] = [];
    const colorsArray: number[] = [];
    const boneIndexArray: number[] = [];
    const weightsArray: number[] = [];

    let pi = 0;

    const mesh = doc.createMesh(`mesh_${meshIndex}`);
    node.setMesh(mesh);

    for (let i = 0; i < bmdMesh.Triangles.length; i++) {
      const triangle = bmdMesh.Triangles[i];

      if (triangle.Polygon !== 3) throw new Error('Triangle is not a triangle');

      for (let j = 0; j < triangle.Polygon; j++) {
        const vertexIndex = triangle.VertexIndex[j];
        const vertex = bmdMesh.Vertices[vertexIndex];

        const normalIndex = triangle.NormalIndex[j];
        const normal = bmdMesh.Normals[normalIndex].Normal;
        const coordIndex = triangle.TexCoordIndex[j];
        const texCoord = bmdMesh.TexCoords[coordIndex];

        const pos = vertex.Position;
        const convPos = convertVec3(pos);

        positionArray.push(
          convPos.x * SCALE_MULTIPLIER,
          convPos.y * SCALE_MULTIPLIER,
          convPos.z * SCALE_MULTIPLIER
        );
        const convNormal = convertVec3(normal);
        normalsArray.push(convNormal.x, convNormal.y, convNormal.z);
        texcoordArray.push(texCoord.U, texCoord.V);
        colorsArray.push(1, 1, 1, 1);

        uniqueBonesPerMesh.add(vertex.Node + 1);

        if (!isSingleFrame) {
          boneIndexArray.push(vertex.Node + 1, 0, 0, 0);
          weightsArray.push(1, 0, 0, 0);
        }
      }

      const vInd0 = pi++;
      const vInd1 = pi++;
      const vInd2 = pi++;

      // for bmd
      indicesArray.push(vInd0);
      indicesArray.push(vInd1);
      indicesArray.push(vInd2);

      // for GLTF, counter-clockwise
      // indicesArray.push(vInd0);
      // indicesArray.push(vInd2);
      // indicesArray.push(vInd1);
    }

    const indices = doc
      .createAccessor()
      .setArray(new Uint16Array(indicesArray))
      .setType('SCALAR')
      .setBuffer(buffer);
    const position = doc
      .createAccessor()
      .setArray(new Float32Array(positionArray))
      .setType('VEC3')
      .setBuffer(buffer);
    const texcoord = doc
      .createAccessor()
      .setArray(new Float32Array(texcoordArray))
      .setType('VEC2')
      .setBuffer(buffer);
    const normal = doc
      .createAccessor()
      .setArray(new Float32Array(normalsArray))
      .setType('VEC3')
      .setBuffer(buffer);
    const color = doc
      .createAccessor()
      .setArray(new Float32Array(colorsArray))
      .setType('VEC4')
      .setBuffer(buffer);

    const isTransparent = bmdMesh.TexturePath.endsWith('.tga');
    const texPath = DATA_FOLDER + bmd.Dir + bmdMesh.TexturePath;
    // const texFilePath = bmd.Dir + bmdMesh.TexturePath.split('.')[0] + '.webp';
    // const outputTexFilePath = OUTPUT_FOLDER + texFilePath;

    const texture = doc.createTexture(
      bmd.Dir + bmdMesh.TexturePath.split('.')[0]
    );
    let texSuccess = false;

    try {
      const bytes = await Bun.file(texPath).bytes();
      const webpBytes = await convertImageToWebP(bytes);
      // await Bun.write(outputTexFilePath, webpBytes, { createPath: true });
      texture.setImage(webpBytes);
      texture.setMimeType(`image/webp`);
      // texture.setURI(`./game-assets/${texFilePath}`);
      texSuccess = true;
    } catch (e) {
      // console.error(`Error converting ${texPath} to webp:`, e);
    }

    const material = doc
      .createMaterial()
      .setRoughnessFactor(1)
      .setMetallicFactor(0);

    material.setAlphaMode(isTransparent ? 'BLEND' : 'OPAQUE');

    if (texSuccess) {
      material.setBaseColorTexture(texture);
    }

    const prim = doc
      .createPrimitive()
      .setMaterial(material)
      .setIndices(indices)
      .setAttribute('POSITION', position)
      .setAttribute('TEXCOORD_0', texcoord)
      .setAttribute('NORMAL', normal)
      .setAttribute('COLOR_0', color);

    if (!isSingleFrame) {
      const boneIndex = doc
        .createAccessor()
        .setArray(new Uint8Array(boneIndexArray))
        .setType('VEC4')
        .setBuffer(buffer);
      const weights = doc
        .createAccessor()
        .setArray(new Float32Array(weightsArray))
        .setType('VEC4')
        .setBuffer(buffer);

      prim
        .setAttribute('JOINTS_0', boneIndex)
        .setAttribute('WEIGHTS_0', weights);
    }

    mesh.addPrimitive(prim);

    // if (allBonesWithoutParent && isSingleFrame) {
    //   if (uniqueBonesPerMesh.size > 1) {
    //     console.error(
    //       `${fileName} has multiple bones per mesh: ${Array.from(
    //         uniqueBonesPerMesh
    //       ).join(', ')}`
    //     );
    //   }
    // }
  }

  const io = new NodeIO();
  io.registerExtensions([EXTTextureWebP as any]);
  await Bun.write(outputFilename, '', { createPath: true });
  // await Bun.write(
  //   outputFilename.replace('.glb', '.json'),
  //   JSON.stringify(bmd, null, 2),
  //   {
  //     createPath: true,
  //   }
  // );
  await io.write(outputFilename, doc);
}

const reader = new BMDReader();

const files = [...glob.scanSync(DATA_FOLDER)];

// await Bun.write('files.txt', files.join('\n'));
// console.log(`${files.length} files to process`);

async function processFile(relInputFilePath: string) {
  const inputFileName = relInputFilePath.split('/').at(-1)!;

  const absInputFilePath = DATA_FOLDER + relInputFilePath;
  const inputFolder = relInputFilePath.replace(inputFileName, '');
  const outputFileName =
    OUTPUT_FOLDER + relInputFilePath.replace(BMD_EXT, '.glb');

  for (const ignoreFile of IGNORE_FILES) {
    if (ignoreFile === inputFileName) {
      return;
    }
  }

  const buffer = await Bun.file(absInputFilePath).bytes();

  try {
    const bmd = reader.read(buffer, inputFolder);

    await convertBMDToGLTF(bmd, outputFileName);
  } catch (e) {
    console.error(`Error converting ${absInputFilePath}:`, e);
  }
}

await Promise.all(files.map(processFile));

console.log(`Processed ${files.length} files!`);

// const folder = DATA_FOLDER + 'Object1/';
// const absFilePath = folder + 'HouseEtc03.bmd';

// const buffer = await Bun.file(absFilePath).bytes();

// try {
//   const bmd = reader.read(buffer, folder);

//   const outputFilename = `${folder}HouseEtc03.glb`;

//   await convertBMDToGLTF(bmd, outputFilename);
// } catch (e) {
//   console.error(`Error converting ${absFilePath}:`, e);
// }
