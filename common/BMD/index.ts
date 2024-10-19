import {
  Quaternion,
  Vector3,
  Matrix as BJSMatrix,
  Matrix,
} from '@babylonjs/core/Maths/math.vector';
import { BaseReader } from '../baseReader';
import { MathUtils } from '../mathUtils';

const log = (...args: any[]) => console.log(`[BMD]`, ...args);

type Float = number;
type Int = number;
type Short = number;

const SIZE_OF_Normal_t = 20;
// [StructLayout(LayoutKind.Sequential, Pack = 4)]
class BMDTextureNormal {
  Node: Short = 0;
  Normal: Vector3;
  BindVertex: Short = 0;

  toString() {
    return `"Node: ${this.Node}, Normal: ${this.Normal}, BindVertex: ${this.BindVertex}"`;
  }
}

const SIZE_OF_Vertex_t = 16;
// [StructLayout(LayoutKind.Sequential, Pack = 4)]
class BMDTextureVertex {
  Node: Short = 0;
  Position: Vector3;

  toString() {
    return `Node: ${this.Node}, Position: ${this.Position}`;
  }
}

// [StructLayout(LayoutKind.Sequential, Pack = 4)]
class BMDBoneMatrix {
  Position: Vector3[] = [];
  Rotation: Vector3[] = [];
  Quaternion: Quaternion[] = [];
}

const SIZE_OF_TexCoord_t = 8;
// [StructLayout(LayoutKind.Sequential, Pack = 4)]
class BMDTexCoord {
  U: Float = 0.0;
  V: Float = 0.0;

  toString() {
    return `U: ${this.U}, V: ${this.V}`;
  }
}

class BMDTextureAction {
  NumAnimationKeys: Int = 0;
  LockPositions: boolean = false;
  Positions: Vector3[] = [];
}

export class BMDTextureBone {
  static readonly Dummy: BMDTextureBone = new BMDTextureBone('Dummy');

  Name: string = '';
  Parent: Short = 0;
  Matrixes: BMDBoneMatrix[] = [];

  constructor(name = '') {
    this.Name = name;
  }
}

const SIZE_OF_Triangle_t = 64;
// [StructLayout(LayoutKind.Sequential, Pack = 4)]
class BMDTriangle {
  Polygon: Byte;

  // [MarshalAs(UnmanagedType.ByValArray, SizeConst = 4)]
  VertexIndex: Short[] = [];

  // [MarshalAs(UnmanagedType.ByValArray, SizeConst = 4)]
  NormalIndex: Short[] = [];

  // [MarshalAs(UnmanagedType.ByValArray, SizeConst = 4)]
  TexCoordIndex: Short[] = [];

  // [MarshalAs(UnmanagedType.ByValArray, SizeConst = 4)]
  LightMapCoord: BMDTexCoord[] = [];

  LightMapIndexes: Short;
}

class BMDTextureMesh {
  Vertices: BMDTextureVertex[] = [];
  Normals: BMDTextureNormal[] = [];
  TexCoords: BMDTexCoord[] = [];
  Triangles: BMDTriangle[] = [];
  Texture: Short = 0;
  TexturePath = '';
}

export class BMD {
  Version: Byte = 0x0c;
  Name = '';

  Meshes: BMDTextureMesh[] = [];
  Bones: BMDTextureBone[] = [];
  Actions: BMDTextureAction[] = [];
}

function _readString(buffer: DataView, from: number, to: number): string {
  let val = '';
  for (let i = from; i < to; i++) {
    const ch = String.fromCharCode(buffer.getUint8(i));

    if (ch === '\0') break;

    val += ch;
  }

  return val;
}

export class BMDReader extends BaseReader<BMD> {
  read(buffer: Uint8Array): BMD {
    if (buffer.byteLength < 8) throw new Error('Invalid size.');

    const dv = new DataView(buffer.buffer);

    let Size;
    let DataPtr = 3;

    const fileType = _readString(dv, 0, 3);

    if (fileType != 'BMD')
      throw new Error(
        `Invalid file type. Expected BMD and Received ${fileType}.`
      );

    const version = buffer[3];

    log(`fileType: ${fileType}, version: ${version}`);

    // if (version == 12)
    // {
    //     var size = BitConverter.ToInt32(buffer, 4);
    //     var enc = new byte[size];
    //     Array.Copy(buffer, 8, enc, 0, size);
    //     var dec = FileCryptor.Decrypt(enc);
    //     Array.Copy(dec, 0, buffer, 4, size);
    // }
    // else if (version == 15)
    // {
    //     var size = BitConverter.ToInt32(buffer, 4);
    //     var enc = new byte[size];
    //     Array.Copy(buffer, 8, enc, 0, size);
    //     var dec = LEACrypto.Decrypt(enc);
    //     Array.Copy(dec, 0, buffer, 4, size);
    // }

    // using var ms = new MemoryStream(buffer);
    // using var br = new BinaryReader(ms);

    // ms.Seek(4, SeekOrigin.Begin);
    DataPtr = 4;

    // var name = br.ReadString(32);
    const name = _readString(dv, DataPtr, DataPtr + 32);
    DataPtr += 32;

    // var meshes = new BMDTextureMesh[br.ReadUInt16()];
    const meshes: BMDTextureMesh[] = new Array(dv.getUint16(DataPtr, true));
    DataPtr += 2;

    // var bones = new BMDTextureBone[br.ReadUInt16()];
    const bones: BMDTextureBone[] = new Array(dv.getUint16(DataPtr, true));
    DataPtr += 2;

    // var actions = new BMDTextureAction[br.ReadUInt16()];
    const actions: BMDTextureAction[] = new Array(dv.getUint16(DataPtr, true));
    DataPtr += 2;

    for (let i = 0; i < meshes.length; i++) {
      const mesh = (meshes[i] = new BMDTextureMesh());
      const numVertices = dv.getInt16(DataPtr, true);
      DataPtr += 2;
      const numNormals = dv.getInt16(DataPtr, true);
      DataPtr += 2;
      const numTexCoords = dv.getInt16(DataPtr, true);
      DataPtr += 2;
      const numTriangles = dv.getInt16(DataPtr, true);
      DataPtr += 2;
      const texture = dv.getInt16(DataPtr, true);
      DataPtr += 2;
      mesh.Texture = texture;

      mesh.Vertices = new Array(numVertices).fill(null);
      mesh.Normals = new Array(numNormals).fill(null);
      mesh.TexCoords = new Array(numTexCoords).fill(null);
      mesh.Triangles = new Array(numTriangles).fill(null);

      // const vertices = br.ReadStructArray<BMDTextureVertex>(numVertices);
      Size = numVertices * SIZE_OF_Vertex_t;

      mesh.Vertices.forEach((_, i) => {
        let offset = DataPtr + i * SIZE_OF_Vertex_t;
        const node = dv.getInt16(offset, true);
        offset += 4;
        const x = dv.getFloat32(offset, true);
        offset += 4;
        const y = dv.getFloat32(offset, true);
        offset += 4;
        const z = dv.getFloat32(offset, true);
        offset += 4;

        const position = new Vector3(x, y, z);
        const v = (mesh.Vertices[i] = new BMDTextureVertex());
        v.Node = node;
        v.Position = position;
      });
      DataPtr += Size;

      // const normals = br.ReadStructArray<BMDTextureNormal>(numNormals);
      Size = numNormals * SIZE_OF_Normal_t;

      mesh.Normals.forEach((_, i) => {
        let offset = DataPtr + i * SIZE_OF_Normal_t;
        const node = dv.getInt16(offset, true);
        offset += 4;
        const x = dv.getFloat32(offset, true);
        offset += 4;
        const y = dv.getFloat32(offset, true);
        offset += 4;
        const z = dv.getFloat32(offset, true);
        offset += 4;
        const bindVertex = dv.getInt16(offset, true);
        offset += 4;

        const normal = (mesh.Normals[i] = new BMDTextureNormal());
        normal.Node = node;
        normal.Normal = new Vector3(x, y, z);
        normal.BindVertex = bindVertex;
      });
      DataPtr += Size;

      // const textCoords = br.ReadStructArray<BMDTexCoord>(numTexCoords);
      Size = numTexCoords * SIZE_OF_TexCoord_t;

      mesh.TexCoords.forEach((_, i) => {
        let offset = DataPtr + i * SIZE_OF_TexCoord_t;
        const x = dv.getFloat32(offset, true);
        offset += 4;
        const y = dv.getFloat32(offset, true);
        offset += 4;

        const texCoord = (mesh.TexCoords[i] = new BMDTexCoord());
        texCoord.U = x;
        texCoord.V = y;
      });
      DataPtr += Size;

      // const triangles = br.ReadStructArray<BMDTriangle>(numTriangles);
      Size = SIZE_OF_Triangle_t;
      for (let j = 0; j < numTriangles; j++) {
        let offset = DataPtr;
        const Polygon = dv.getUint8(offset);
        offset += 2;
        const VertexIndex: [Short, Short, Short, Short] = [] as any;
        VertexIndex.push(dv.getInt16(offset, true));
        offset += 2;
        VertexIndex.push(dv.getInt16(offset, true));
        offset += 2;
        VertexIndex.push(dv.getInt16(offset, true));
        offset += 2;
        VertexIndex.push(dv.getInt16(offset, true));
        offset += 2;

        const NormalIndex: [Short, Short, Short, Short] = [] as any;
        NormalIndex.push(dv.getInt16(offset, true));
        offset += 2;
        NormalIndex.push(dv.getInt16(offset, true));
        offset += 2;
        NormalIndex.push(dv.getInt16(offset, true));
        offset += 2;
        NormalIndex.push(dv.getInt16(offset, true));
        offset += 2;

        const TexCoordIndex: [Short, Short, Short, Short] = [] as any;
        TexCoordIndex.push(dv.getInt16(offset, true));
        offset += 2;
        TexCoordIndex.push(dv.getInt16(offset, true));
        offset += 2;
        TexCoordIndex.push(dv.getInt16(offset, true));
        offset += 2;
        TexCoordIndex.push(dv.getInt16(offset, true));
        offset += 2;

        const LightMapCoord: BMDTexCoord[] = [new BMDTexCoord()];
        LightMapCoord[0].U = dv.getFloat32(offset, true);
        offset += 4;
        LightMapCoord[0].V = dv.getFloat32(offset, true);
        offset += 4;

        const Front = dv.getUint8(offset);
        offset += 2;

        const triangle = (mesh.Triangles[j] = new BMDTriangle());
        triangle.Polygon = Polygon;

        triangle.VertexIndex = VertexIndex;
        triangle.NormalIndex = NormalIndex;
        triangle.TexCoordIndex = TexCoordIndex;
        triangle.LightMapCoord = LightMapCoord;
        triangle.LightMapIndexes = Front;
        DataPtr += Size;
      }

      const texturePath = _readString(dv, DataPtr, DataPtr + 32);
      DataPtr += 32;

      mesh.TexturePath = texturePath;
    }

    for (let i = 0; i < actions.length; i++) {
      const action = (actions[i] = new BMDTextureAction());

      action.NumAnimationKeys = dv.getInt16(DataPtr, true);
      DataPtr += 2;
      action.LockPositions = dv.getUint8(DataPtr) === 1;
      DataPtr += 1;

      if (action.LockPositions) {
        // action.Positions = br.ReadStructArray<Vector3>(action.NumAnimationKeys);
        action.Positions = new Array(action.NumAnimationKeys).fill(null);

        Size = action.NumAnimationKeys * 12;

        action.Positions.forEach((_, i) => {
          let offset = DataPtr + i * 12;
          const x = dv.getFloat32(offset, true);
          offset += 4;
          const y = dv.getFloat32(offset, true);
          offset += 4;
          const z = dv.getFloat32(offset, true);
          offset += 4;

          action.Positions[i] = new Vector3(x, y, z);
        });
        DataPtr += Size;
      }
    }

    for (let i = 0; i < bones.length; i++) {
      const dummy = dv.getUint8(DataPtr) === 1;
      DataPtr += 1;

      if (dummy) {
        bones[i] = BMDTextureBone.Dummy;
      } else {
        const bone = (bones[i] = new BMDTextureBone());

        bone.Name = _readString(dv, DataPtr, DataPtr + 32);
        DataPtr += 32;
        bone.Parent = dv.getInt16(DataPtr, true);
        DataPtr += 2;

        bone.Matrixes = new Array(actions.length).fill(null);

        for (let m = 0; m < bone.Matrixes.length; m++) {
          const action = actions[m];
          const bm = (bone.Matrixes[m] = new BMDBoneMatrix());

          Size = action.NumAnimationKeys * 12;

          bm.Position = new Array(action.NumAnimationKeys).fill(null);

          bm.Position.forEach((_, i) => {
            let offset = DataPtr + i * 12;
            const x = dv.getFloat32(offset, true);
            offset += 4;
            const y = dv.getFloat32(offset, true);
            offset += 4;
            const z = dv.getFloat32(offset, true);
            offset += 4;

            bm.Position[i] = new Vector3(x, y, z);
          });

          DataPtr += Size;

          bm.Rotation = new Array(action.NumAnimationKeys).fill(null);

          bm.Rotation.forEach((_, i) => {
            let offset = DataPtr + i * 12;
            const x = dv.getFloat32(offset, true);
            offset += 4;
            const y = dv.getFloat32(offset, true);
            offset += 4;
            const z = dv.getFloat32(offset, true);
            offset += 4;

            bm.Rotation[i] = new Vector3(x, y, z);
          });

          DataPtr += Size;

          // precalculate quaternion
          bm.Quaternion = bm.Rotation.map(r => MathUtils.AngleQuaternion(r));
        }
      }
    }

    const bmd = new BMD();

    bmd.Version = version;
    bmd.Name = name;
    bmd.Meshes = meshes;
    bmd.Bones = bones;
    bmd.Actions = actions;

    return bmd;
  }
}
