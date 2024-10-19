import {
  Quaternion,
  Vector3,
  Matrix as BJSMatrix,
  Matrix,
} from '@babylonjs/core/Maths/math.vector';
import { downloadBytesBuffer } from '../utils';
import type { Scene } from '@babylonjs/core';
import { Bone, Skeleton } from '@babylonjs/core/Bones';
import { BMDReader } from '../BMD';
import { ModelObject } from '../modelObject';

// function AngleQuaternion(angles: Vector3, quaternion: Quaternion): void {
//   let angle;
//   let sr, sp, sy, cr, cp, cy;

//   tmp2.copyFrom(angles);
//   tmp2.x = angles.z;
//   tmp2.y = angles.y;
//   tmp2.z = angles.x;

//   // FIXME: rescale the inputs to 1/2 angle
//   angle = tmp2.z * 0.5;
//   sy = Math.sin(angle);
//   cy = Math.cos(angle);

//   angle = tmp2.y * 0.5;
//   sp = Math.sin(angle);
//   cp = Math.cos(angle);

//   angle = tmp2.x * 0.5;
//   sr = Math.sin(angle);
//   cr = Math.cos(angle);

//   quaternion.x = sr * cp * cy - cr * sp * sy; // X
//   quaternion.y = cr * sp * cy + sr * cp * sy; // Y
//   quaternion.z = cr * cp * sy - sr * sp * cy; // Z
//   quaternion.w = cr * cp * cy + sr * sp * sy; // W
// }

// function AngleIMatrix(angles: Vector3, matrix: Matrix) {
//   let angle;
//   let sr, sp, sy, cr, cp, cy;

//   angle = angles.z * (Math.PI / 180);
//   sy = Math.sin(angle);
//   cy = Math.cos(angle);
//   angle = angles.y * (Math.PI / 180);
//   sp = Math.sin(angle);
//   cp = Math.cos(angle);
//   angle = angles.z * (Math.PI / 180);
//   sr = Math.sin(angle);
//   cr = Math.cos(angle);

//   // matrix = (Z * Y) * X
//   matrix[0][0] = cp * cy;
//   matrix[0][1] = cp * sy;
//   matrix[0][2] = -sp;
//   matrix[1][0] = sr * sp * cy + cr * -sy;
//   matrix[1][1] = sr * sp * sy + cr * cy;
//   matrix[1][2] = sr * cp;
//   matrix[2][0] = (cr * sp * cy + -sr * -sy);
//   matrix[2][1] = (cr * sp * sy + -sr * cy);
//   matrix[2][2] = cr * cp;
//   matrix[0][3] = 0.0;
//   matrix[1][3] = 0.0;
//   matrix[2][3] = 0.0;
// }

// function AngleMatrix(angles: Vector3, matrix: Matrix) {
//   let angle;
//   let sr, sp, sy, cr, cp, cy;

//   angle = angles.z * (Math.PI / 180);
//   sy = Math.sin(angle);
//   cy = Math.cos(angle);
//   angle = angles.y * (Math.PI / 180);
//   sp = Math.sin(angle);
//   cp = Math.cos(angle);
//   angle = angles.z * (Math.PI / 180);
//   sr = Math.sin(angle);
//   cr = Math.cos(angle);

//   // matrix = (Z * Y) * X
//   matrix[0][0] = cp * cy;
//   matrix[1][0] = cp * sy;
//   matrix[2][0] = -sp;
//   matrix[0][1] = sr * sp * cy + cr * -sy;
//   matrix[1][1] = sr * sp * sy + cr * cy;
//   matrix[2][1] = sr * cp;
//   matrix[0][2] = (cr * sp * cy + -sr * -sy);
//   matrix[1][2] = (cr * sp * sy + -sr * cy);
//   matrix[2][2] = cr * cp;
//   matrix[0][3] = 0.0;
//   matrix[1][3] = 0.0;
//   matrix[2][3] = 0.0;
// }

// function R_ConcatTransforms(in1: Matrix, in2: Matrix, out: Matrix): void {
//   out[0][0] = in1[0][0] * in2[0][0] + in1[0][1] * in2[1][0] +
//     in1[0][2] * in2[2][0];
//   out[0][1] = in1[0][0] * in2[0][1] + in1[0][1] * in2[1][1] +
//     in1[0][2] * in2[2][1];
//   out[0][2] = in1[0][0] * in2[0][2] + in1[0][1] * in2[1][2] +
//     in1[0][2] * in2[2][2];
//   out[0][3] = in1[0][0] * in2[0][3] + in1[0][1] * in2[1][3] +
//     in1[0][2] * in2[2][3] + in1[0][3];
//   out[1][0] = in1[1][0] * in2[0][0] + in1[1][1] * in2[1][0] +
//     in1[1][2] * in2[2][0];
//   out[1][1] = in1[1][0] * in2[0][1] + in1[1][1] * in2[1][1] +
//     in1[1][2] * in2[2][1];
//   out[1][2] = in1[1][0] * in2[0][2] + in1[1][1] * in2[1][2] +
//     in1[1][2] * in2[2][2];
//   out[1][3] = in1[1][0] * in2[0][3] + in1[1][1] * in2[1][3] +
//     in1[1][2] * in2[2][3] + in1[1][3];
//   out[2][0] = in1[2][0] * in2[0][0] + in1[2][1] * in2[1][0] +
//     in1[2][2] * in2[2][0];
//   out[2][1] = in1[2][0] * in2[0][1] + in1[2][1] * in2[1][1] +
//     in1[2][2] * in2[2][1];
//   out[2][2] = in1[2][0] * in2[0][2] + in1[2][1] * in2[1][2] +
//     in1[2][2] * in2[2][2];
//   out[2][3] = in1[2][0] * in2[0][3] + in1[2][1] * in2[1][3] +
//     in1[2][2] * in2[2][3] + in1[2][3];
// }

// const tmp = Vector3.Zero();
// export function VectorTransform(in1: Vector3, in2: Matrix, out: Vector3): void {
//   tmp.set(in2[0][0], in2[0][1], in2[0][2]);
//   out.x = Vector3.Dot(in1, tmp) + in2[0][3];

//   tmp.set(in2[1][0], in2[1][1], in2[1][2]);
//   out.y = Vector3.Dot(in1, tmp) + in2[1][3];

//   tmp.set(in2[2][0], in2[2][1], in2[2][2]);
//   out.z = Vector3.Dot(in1, tmp) + in2[2][3];
// }

const MAX_BONES = 200;
const MAX_MESH = 50;
const MAX_VERTICES = 15000;

type Short = number;

const RENDER_COLOR = 0x00000001;
const RENDER_TEXTURE = 0x00000002;
const RENDER_CHROME = 0x00000004;
const RENDER_METAL = 0x00000008;
const RENDER_LIGHTMAP = 0x00000010;
const RENDER_SHADOWMAP = 0x00000020;
const RENDER_BRIGHT = 0x00000040;
const RENDER_DARK = 0x00000080;
const RENDER_EXTRA = 0x00000100;
const RENDER_CHROME2 = 0x00000200;
const RENDER_WAVE = 0x00000400;
const RENDER_CHROME3 = 0x00000800;
const RENDER_CHROME4 = 0x00001000;
const RENDER_NODEPTH = 0x00002000;
const RENDER_CHROME5 = 0x00004000;
const RENDER_OIL = 0x00008000;
const RENDER_CHROME6 = 0x00010000;
const RENDER_CHROME7 = 0x00020000;
const RENDER_DOPPELGANGER = 0x00040000;
const RENDER_WAVE_EXT = 0x10000000;
const RENDER_BYSCRIPT = 0x80000000;
const RNDEXT_WAVE = 1;
const RNDEXT_OIL = 2;
const RNDEXT_RISE = 4;

const MAX_MONSTER_SOUND = 10;

type Light_t = {
  Position: Vector3;
  Color: Vector3;
  Range: Float;
};

type BoneMatrix_t = {
  Position: Vector3[];
  Rotation: Vector3[];
  Quaternion: Quaternion[];
};

type Bone_t = {
  Name: string; // max 32
  Parent: Short;
  Dummy: boolean;
  BoneMatrixes: BoneMatrix_t[];
  BoundingBox: Byte;
  BoundingVertices: [
    Vector3,
    Vector3,
    Vector3,
    Vector3,
    Vector3,
    Vector3,
    Vector3,
    Vector3
  ]; //8
};

type Texture_t = {
  FileName: string; // max 32
};

type Bitmap_t = {
  Width: Byte;
  Height: Byte;
  Buffer: Uint8Array;
};

type Vertex_t = {
  Node: Short;
  // 2 bytes padding
  Position: Vector3;
};
const SIZE_OF_Vertex_t = 16;

type Normal_t = {
  Node: Short;
  // 2 bytes padding
  Normal: Vector3;
  BindVertex: Short;
  // 2 bytes padding
};
const SIZE_OF_Normal_t = 20;

type TexCoord_t = {
  TexCoordU: Float;
  TexCoordV: Float;
};
const SIZE_OF_TexCoord_t = 8;

type VertexColor_t = {
  m_Colors: [Byte, Byte, Byte]; //0~255 RGB ?TODO padding?
};
const SIZE_OF_VertexColor_t = 3;

type Triangle_t = {
  Polygon: Byte;
  // 1 byte padding
  VertexIndex: [Short, Short, Short, Short];
  NormalIndex: [Short, Short, Short, Short];
  TexCoordIndex: [Short, Short, Short, Short];
  EdgeTriangleIndex: [Short, Short, Short, Short];
  Front: boolean;
  // 1 byte padding

  //...
  // 28 bytes
  //TexCoord_t LightMapCoord[4]; //ver1.2
  //short      LightMapIndexes; //ver1.2
};
const SIZE_OF_Triangle_t = 64;

// type Triangle_t2 = {
//   Polygon: Byte;
//   // 1 byte padding
//   VertexIndex: [Short, Short, Short, Short];
//   NormalIndex: [Short, Short, Short, Short];
//   TexCoordIndex: [Short, Short, Short, Short];
//   LightMapCoord: [TexCoord_t, TexCoord_t, TexCoord_t, TexCoord_t]; //ver1.2
//   LightMapIndexes: Short; //ver1.2
// };
// const SIZE_OF_Triangle_t2 = 64;

type Action_t = {
  Loop: boolean;
  PlaySpeed: Float;
  NumAnimationKeys: Short;
  LockPositions: boolean;
  Positions: Vector3[]; // vec3 *
};

// type Triangle_t3 = Triangle_t & {
//   m_ivIndexAdditional: [Short, Short, Short, Short];
// };

class Mesh_t {
  NoneBlendMesh: boolean;
  Texture: Short;
  NumVertices: Short;
  NumNormals: Short;
  NumTexCoords: Short;
  NumVertexColors: Short; //ver1.3
  NumTriangles: Short;
  NumCommandBytes: Int; //ver1.1

  Vertices: Vertex_t[] = [];
  Normals: Normal_t[] = [];
  TexCoords: TexCoord_t[] = [];
  VertexColors: VertexColor_t[] = []; //ver1.3
  Triangles: Triangle_t[] = [];
  Commands: string = ''; //ver1.1

  m_csTScript: TextureScript[] = [];

  constructor() {
    this.NumVertices =
      this.NumNormals =
      this.NumTexCoords =
      this.NumVertexColors =
      this.NumTriangles =
        0;
  }
}

export class BMD {
  Name: string = '';
  Version: Byte = -1;
  NumBones = 0;
  NumMeshs = 0;
  NumActions = 0;
  Meshs: Mesh_t[] = [];
  Bones: Bone_t[] = [];
  Actions: Action_t[] = [];
  Textures: Texture_t[] = [];
  BoneFixup: BoneFixup[] = new Array(MAX_BONES).fill(null);

  skeleton: Skeleton | null = null;
  constructor() {
    this.BoneFixup.forEach((_, i, array) => {
      array[i] = {
        m: Matrix.Identity(),
        im: Matrix.Identity(),
        WorldOrg: Vector3.Zero(),
      };
    });
  }

  buildSkeleton(scene: Scene) {
    const s = new Skeleton(this.Name + 'Skeleton', this.Name, scene);

    const _bones: Bone[] = [];
    this.Bones.forEach((b, i) => {
      const m = b.BoneMatrixes[0];

      const parentBone = this.Bones[b.Parent];

      const mPos = m.Position[0];
      const mRot = m.Quaternion[0];

      const localPos = mPos.clone();
      const localRot = mRot.clone();
      // localRot.y = Math.PI-localRot.y;

      // const localRot = Vector3.Zero();

      const localMatrix = this.BoneFixup[i].m;
      // Matrix.FromQuaternionToRef(Quaternion.FromEulerAngles(mRot.x,mRot.y,mRot.z),localMatrix);

      // const worldMatrix = BJSMatrix.Compose(
      //   Vector3.OneReadOnly,
      //   mRot,
      //   localPos);

      // const localMatrix = worldMatrix;

      // if (parentBone) {
      //   const parentM = parentBone.BoneMatrixes[0];
      //   const parentPos = parentM.Position[0];
      //   const parentRot = parentM.Quaternion[0];

      //   localMatrix.copyFrom(Matrix.Compose(Vector3.OneReadOnly,
      //     localRot.subtract(parentRot),
      //     localPos.subtract(parentPos),
      //   ));
      // }

      const bone = new Bone(
        b.Name,
        s,
        null,
        localMatrix,
        null,
        Matrix.Identity()
      );

      _bones.push(bone);
    });

    _bones.forEach((b, i) => {
      const smdBone = this.Bones[i];
      if (smdBone.Parent < 0) return;

      b.setParent(_bones[smdBone.Parent]);
    });

    this.skeleton = s;
  }
}

type BoneFixup = {
  m: Matrix;
  im: Matrix;
  WorldOrg: Vector3;
};

/**
 *
 * BODY
 *
 */

// BMD * Models;
// BMD * ModelsDump;

// vec4_t BoneQuaternion[MAX_BONES];
// short  BoundingVertices[MAX_BONES];
// vec3_t BoundingMin[MAX_BONES];
// vec3_t BoundingMax[MAX_BONES];

// float  BoneTransform[MAX_BONES][3][4];

// vec3_t VertexTransform[MAX_MESH][MAX_VERTICES];
// vec3_t NormalTransform[MAX_MESH][MAX_VERTICES];
// float  IntensityTransform[MAX_MESH][MAX_VERTICES];
// vec3_t LightTransform[MAX_MESH][MAX_VERTICES];

// vec3_t RenderArrayVertices[MAX_VERTICES * 3];
// vec4_t RenderArrayColors[MAX_VERTICES * 3];
// vec2_t RenderArrayTexCoords[MAX_VERTICES * 3];

// const ShadowBuffer= new Uint8Array(256 * 256);
// const           ShadowBufferWidth = 256;
// const           ShadowBufferHeight = 256;

// // extern int  MouseX;
// // extern int  MouseY;
// // extern bool MouseLButton;

// // extern double FPS;
// extern float FPS_ANIMATION_FACTOR;

// const  StopMotion = false;
// float ParentMatrix[3][4];

// const  LightVector = new Vector3( 0, - 0.1, -0.8 );
// const  LightVector2 = new Vector3( 0, - 0.5, -0.8 );

// // function BMD_Animation(float(* BoneMatrix)[3][4], float AnimationFrame, float PriorFrame, unsigned short PriorAction, vec3_t Angle, vec3_t HeadAngle, bool Parent, bool Translate):void{
// //   if (NumActions <= 0) return;

// //   if (PriorAction >= NumActions) PriorAction = 0;
// //   if (CurrentAction >= NumActions) CurrentAction = 0;
// //   VectorCopy(Angle, BodyAngle);

// //   CurrentAnimation = AnimationFrame;
// //   CurrentAnimationFrame = (int)AnimationFrame;
// //     float s1 = (CurrentAnimation - CurrentAnimationFrame);
// //     //if(StopMotion)
// //     //	s1 = (int)(s1*4)/4;
// //     float s2 = 1.f - s1;
// //     int PriorAnimationFrame = (int)PriorFrame;
// //   if (NumActions > 0) {
// //     if (PriorAnimationFrame < 0)
// //       PriorAnimationFrame = 0;
// //     if (CurrentAnimationFrame < 0)
// //       CurrentAnimationFrame = 0;
// //     if (PriorAnimationFrame >= Actions[PriorAction].NumAnimationKeys)
// //       PriorAnimationFrame = 0;
// //     if (CurrentAnimationFrame >= Actions[CurrentAction].NumAnimationKeys)
// //       CurrentAnimationFrame = 0;
// //   }

// //   // bones
// //   for (let i = 0; i < NumBones; i++)
// //   {
// //     Bone_t * b = & Bones[i];
// //     if (b.Dummy) {
// //       continue;
// //     }
// //     BoneMatrix_t * bm1 = & b.BoneMatrixes[PriorAction];
// //     BoneMatrix_t * bm2 = & b.BoneMatrixes[CurrentAction];
// //         vec4_t q1, q2;

// //     if (i == BoneHead) {
// //             vec3_t Angle1, Angle2;
// //       VectorCopy(bm1 -> Rotation[PriorAnimationFrame], Angle1);
// //       VectorCopy(bm2 -> Rotation[CurrentAnimationFrame], Angle2);

// //             float HeadAngleX = HeadAngle[0] / (180.f / Math.PI);
// //             float HeadAngleY = HeadAngle[1] / (180.f / Math.PI);
// //       Angle1[0] -= HeadAngleX;
// //       Angle2[0] -= HeadAngleX;
// //       Angle1[2] -= HeadAngleY;
// //       Angle2[2] -= HeadAngleY;
// //       AngleQuaternion(Angle1, q1);
// //       AngleQuaternion(Angle2, q2);
// //     }
// //     else {
// //       QuaternionCopy(bm1 -> Quaternion[PriorAnimationFrame], q1);
// //       QuaternionCopy(bm2 -> Quaternion[CurrentAnimationFrame], q2);
// //     }
// //     if (!QuaternionCompare(q1, q2)) {
// //       QuaternionSlerp(q1, q2, s1, BoneQuaternion[i]);
// //     }
// //     else {
// //       QuaternionCopy(q1, BoneQuaternion[i]);
// //     }

// //         float Matrix[3][4];
// //     QuaternionMatrix(BoneQuaternion[i], Matrix);
// //     float * Position1 = bm1 -> Position[PriorAnimationFrame];
// //     float * Position2 = bm2 -> Position[CurrentAnimationFrame];

// //     if (i == 0 && (Actions[PriorAction].LockPositions || Actions[CurrentAction].LockPositions)) {
// //       Matrix[0][3] = bm2 -> Position[0][0];
// //       Matrix[1][3] = bm2 -> Position[0][1];
// //       Matrix[2][3] = Position1[2] * s2 + Position2[2] * s1 + BodyHeight;
// //     }
// //     else {
// //       Matrix[0][3] = Position1[0] * s2 + Position2[0] * s1;
// //       Matrix[1][3] = Position1[1] * s2 + Position2[1] * s1;
// //       Matrix[2][3] = Position1[2] * s2 + Position2[2] * s1;
// //     }

// //     if (b.Parent == -1) {
// //       if (!Parent) {
// //         //memcpy(BoneMatrix[i],BoneMatrix,sizeof(float)*12);
// //         AngleMatrix(BodyAngle, ParentMatrix);
// //         if (Translate) {
// //           //ParentMatrix[0][0] *= BodyScale;
// //           //ParentMatrix[1][1] *= BodyScale;
// //           //ParentMatrix[2][2] *= BodyScale;
// //           for (int y = 0; y < 3; ++y)
// //           {
// //             for (int x = 0; x < 3; ++x)
// //             {
// //               ParentMatrix[y][x] *= BodyScale;
// //             }
// //           }

// //           ParentMatrix[0][3] = BodyOrigin[0];
// //           ParentMatrix[1][3] = BodyOrigin[1];
// //           ParentMatrix[2][3] = BodyOrigin[2];
// //         }
// //       }
// //       R_ConcatTransforms(ParentMatrix, Matrix, BoneMatrix[i]);
// //     }
// //     else {
// //       R_ConcatTransforms(BoneMatrix[b.Parent], Matrix, BoneMatrix[i]);
// //     }
// //   }
// // }

// const  SceneFlag:Int;
// const  EditFlag:Int;

// const HighLight = true;
// const BoneScale:Float = 1.0;

// void BMD_Transform(float(* BoneMatrix)[3][4], vec3_t BoundingBoxMin, vec3_t BoundingBoxMax, OBB_t * OBB, bool Translate, float _Scale);
// {
//     // transform
//     vec3_t LightPosition;

//   if (LightEnable) {
//         vec3_t Position;

//         float Matrix[3][4];
//     if (HighLight) {
//       Vector(1.3f, 0.f, 2.f, Position);
//     }
//     else if (gMapManager.InBattleCastle()) {
//       Vector(0.5f, -1.f, 1.f, Position);
//       Vector(0.f, 0.f, -45.f, ShadowAngle);
//     }
//     else {
//       Vector(0.f, -1.5f, 0.f, Position);
//     }

//     AngleMatrix(ShadowAngle, Matrix);
//     VectorIRotate(Position, Matrix, LightPosition);
//   }
//     vec3_t BoundingMin;
//     vec3_t BoundingMax;
//   #ifdef _DEBUG;
//   #else;
//   if (EditFlag == 2)
//     #endif;
//   {
//     Vector(999999.f, 999999.f, 999999.f, BoundingMin);
//     Vector(-999999.f, -999999.f, -999999.f, BoundingMax);
//   }
//   for (let i = 0; i < NumMeshs; i++)
//   {
//     Mesh_t * m = & Meshs[i];
//     for (int j = 0; j < m -> NumVertices; j++)
//     {
//       Vertex_t * v = & m -> Vertices[j];
//       float * vp = VertexTransform[i][j];

//       if (BoneScale == 1.f)
//       {
//         if (_Scale) {
//                     vec3_t Position;
//           VectorCopy(v -> Position, Position);
//           VectorScale(Position, _Scale, Position);
//           VectorTransform(Position, BoneMatrix[v -> Node], vp);
//         }
//         else
//           VectorTransform(v -> Position, BoneMatrix[v -> Node], vp);
//         if (Translate)
//           VectorScale(vp, BodyScale, vp);
//       }
//             else
//       {
//         VectorRotate(v -> Position, BoneMatrix[v -> Node], vp);
//         vp[0] = vp[0] * BoneScale + BoneMatrix[v -> Node][0][3];
//         vp[1] = vp[1] * BoneScale + BoneMatrix[v -> Node][1][3];
//         vp[2] = vp[2] * BoneScale + BoneMatrix[v -> Node][2][3];
//         if (Translate)
//           VectorScale(vp, BodyScale, vp);
//       }
//       #ifdef _DEBUG;
//       #else;
//       if (EditFlag == 2)
//         #endif;
//       {
//         for (int k = 0; k < 3; k++)
//         {
//           if (vp[k] < BoundingMin[k]) BoundingMin[k] = vp[k];
//           if (vp[k] > BoundingMax[k]) BoundingMax[k] = vp[k];
//         }
//       }
//       if (Translate)
//         VectorAdd(vp, BodyOrigin, vp);
//     }

//     for (int j = 0; j < m -> NumNormals; j++)
//     {
//       Normal_t * sn = & m -> Normals[j];
//       float * tn = NormalTransform[i][j];
//       VectorRotate(sn -> Normal, BoneMatrix[sn -> Node], tn);
//       if (LightEnable) {
//                 float Luminosity;
//         Luminosity = DotProduct(tn, LightPosition) * 0.8f + 0.4f;

//         if (Luminosity < 0.2f) Luminosity = 0.2f;
//         IntensityTransform[i][j] = Luminosity;
//       }
//     }
//   }
//   if (EditFlag == 2) {
//     VectorCopy(BoundingMin, OBB -> StartPos);
//     OBB -> XAxis[0] = (BoundingMax[0] - BoundingMin[0]);
//     OBB -> YAxis[1] = (BoundingMax[1] - BoundingMin[1]);
//     OBB -> ZAxis[2] = (BoundingMax[2] - BoundingMin[2]);
//   }
//   else {
//     VectorCopy(BoundingBoxMin, OBB -> StartPos);
//     OBB -> XAxis[0] = (BoundingBoxMax[0] - BoundingBoxMin[0]);
//     OBB -> YAxis[1] = (BoundingBoxMax[1] - BoundingBoxMin[1]);
//     OBB -> ZAxis[2] = (BoundingBoxMax[2] - BoundingBoxMin[2]);
//   }
//   fTransformedSize = max(max(BoundingMax[0] - BoundingMin[0], BoundingMax[1] - BoundingMin[1]),
//     BoundingMax[2] - BoundingMin[2]);
//   //fTransformedSize *= 0.3f;
//   VectorAdd(OBB -> StartPos, BodyOrigin, OBB -> StartPos);
//   OBB -> XAxis[1] = 0.f;
//   OBB -> XAxis[2] = 0.f;
//   OBB -> YAxis[0] = 0.f;
//   OBB -> YAxis[2] = 0.f;
//   OBB -> ZAxis[0] = 0.f;
//   OBB -> ZAxis[1] = 0.f;
// }

// void BMD_TransformByObjectBone(vec3_t vResultPosition, OBJECT * pObject, int iBoneNumber, vec3_t vRelativePosition);
// {
//   if (iBoneNumber < 0 || iBoneNumber >= NumBones) {
//     assert(!"Bone number error");
//     return;
//   }
//   if (pObject == NULL) {
//     assert(!"Empty Bone");
//     return;
//   }

//   float(* TransformMatrix)[4];
//   if (pObject -> BoneTransform != NULL) {
//     TransformMatrix = pObject -> BoneTransform[iBoneNumber];
//   }
//   else {
//     TransformMatrix = BoneTransform[iBoneNumber];
//   }

//     vec3_t vTemp;
//   if (vRelativePosition == NULL) {
//     vTemp[0] = TransformMatrix[0][3];
//     vTemp[1] = TransformMatrix[1][3];
//     vTemp[2] = TransformMatrix[2][3];
//   }
//   else {
//     VectorTransform(vRelativePosition, TransformMatrix, vTemp);
//   }
//   VectorScale(vTemp, BodyScale, vTemp);
//   VectorAdd(vTemp, pObject -> Position, vResultPosition);
// }

// void BMD_TransformByBoneMatrix(vec3_t vResultPosition, float(* BoneMatrix)[4], vec3_t vWorldPosition, vec3_t vRelativePosition);
// {
//   if (BoneMatrix == NULL) {
//     assert(!"Empty Matrix");
//     return;
//   }

//     vec3_t vTemp;
//   if (vRelativePosition == NULL) {
//     vTemp[0] = BoneMatrix[0][3];
//     vTemp[1] = BoneMatrix[1][3];
//     vTemp[2] = BoneMatrix[2][3];
//   }
//   else {
//     VectorTransform(vRelativePosition, BoneMatrix, vTemp);
//   }
//   if (vWorldPosition != NULL) {
//     VectorScale(vTemp, BodyScale, vTemp);
//     VectorAdd(vTemp, vWorldPosition, vResultPosition);
//   }
//   else {
//     VectorScale(vTemp, BodyScale, vResultPosition);
//   }
// }

// void BMD_TransformPosition(float(* Matrix)[4], vec3_t Position, vec3_t WorldPosition, bool Translate);
// {
//   if (Translate) {
//         vec3_t p;
//     VectorTransform(Position, Matrix, p);
//     VectorScale(p, BodyScale, p);
//     VectorAdd(p, BodyOrigin, WorldPosition);
//   }
//   else
//     VectorTransform(Position, Matrix, WorldPosition);
// }

// void BMD_RotationPosition(float(* Matrix)[4], vec3_t Position, vec3_t WorldPosition);
// {
//     vec3_t p;
//   VectorRotate(Position, Matrix, p);
//   VectorScale(p, BodyScale, WorldPosition);
//   for (let i = 0; i < 3; i++)
//   {
//     for (int j = 0; j < 4; j++)
//     {
//       ParentMatrix[i][j] = Matrix[i][j];
//     }
//   }
// }

// bool BMD_PlayAnimation(float * AnimationFrame, float * PriorAnimationFrame, unsigned short * PriorAction, float Speed, vec3_t Origin, vec3_t Angle);
// {
//     bool Loop = true;

//   if (AnimationFrame == nullptr || PriorAnimationFrame == nullptr || PriorAction == nullptr || (NumActions > 0 && CurrentAction >= NumActions)) {
//     return Loop;
//   }

//   if (NumActions == 0 || Actions[CurrentAction].NumAnimationKeys <= 1) {
//     return Loop;
//   }

//   const int priorAnimationFrame = (int) * AnimationFrame;
//     * AnimationFrame += Speed * FPS_ANIMATION_FACTOR;
//   if (priorAnimationFrame != (int) * AnimationFrame) {
//         * PriorAction = CurrentAction;
//         * PriorAnimationFrame = (float)priorAnimationFrame;
//   }
//   if (* AnimationFrame <= 0.f)
//   {
//         * AnimationFrame += (float)Actions[CurrentAction].NumAnimationKeys - 1.f;
//   }

//   if (Actions[CurrentAction].Loop) {
//     if (* AnimationFrame >= (float)Actions[CurrentAction].NumAnimationKeys)
//     {
//             * AnimationFrame = (float)Actions[CurrentAction].NumAnimationKeys - 0.01f;
//       Loop = false;
//     }
//   }
//   else {
//         int Key;
//     if (Actions[CurrentAction].LockPositions)
//       Key = Actions[CurrentAction].NumAnimationKeys - 1;
//     else
//       Key = Actions[CurrentAction].NumAnimationKeys;

//         float fTemp;

//     if (SceneFlag == 4) {
//       fTemp = * AnimationFrame + 2;
//     }
//     else if (gMapManager.WorldActive == WD_39KANTURU_3RD && CurrentAction == MONSTER01_APEAR) {
//       fTemp = * AnimationFrame + 1;
//     }
//     else {
//       fTemp = * AnimationFrame;
//     }

//     if (fTemp >= (int)Key)
//     {
//             int Frame = (int) * AnimationFrame;
//             * AnimationFrame = (float)(Frame % (Key)) + (* AnimationFrame - (float)Frame);
//       Loop = false;
//     }
//   }
//   CurrentAnimation = * AnimationFrame;
//   CurrentAnimationFrame = (int)maxf(0, CurrentAnimation);

//   return Loop;
// }
// void BMD_AnimationTransformWithAttachHighModel_usingGlobalTM(OBJECT * oHighHierarchyModel, BMD * bmdHighHierarchyModel, int iBoneNumberHighHierarchyModel, vec3_t & vOutPosHighHiearachyModelBone, vec3_t * arrOutSetfAllBonePositions, bool bApplyTMtoVertices);
// {
//   if (NumBones < 1) return;
//   if (NumBones > MAX_BONES) return;

//   vec34_t * arrBonesTMLocal;

//     vec34_t		tmBoneHierarchicalObject;

//     vec3_t		Temp, v3Position;
//     OBB_t		OBB;

//   arrBonesTMLocal = new vec34_t[NumBones];
//   Vector(0, 0, 0, Temp);

//   memset(arrBonesTMLocal, 0, sizeof(vec34_t) * NumBones);
//   memset(tmBoneHierarchicalObject, 0, sizeof(vec34_t));

//   memcpy(tmBoneHierarchicalObject, oHighHierarchyModel -> BoneTransform[iBoneNumberHighHierarchyModel], sizeof(vec34_t));
//   BodyScale = oHighHierarchyModel -> Scale;

//   tmBoneHierarchicalObject[0][3] = tmBoneHierarchicalObject[0][3] * BodyScale;
//   tmBoneHierarchicalObject[1][3] = tmBoneHierarchicalObject[1][3] * BodyScale;
//   tmBoneHierarchicalObject[2][3] = tmBoneHierarchicalObject[2][3] * BodyScale;

//   if (NULL != vOutPosHighHiearachyModelBone) {
//     Vector(tmBoneHierarchicalObject[0][3], tmBoneHierarchicalObject[1][3], tmBoneHierarchicalObject[2][3],
//       vOutPosHighHiearachyModelBone);
//   }

//   VectorCopy(oHighHierarchyModel -> Position, v3Position);

//   Animation(arrBonesTMLocal, 0, 0, 0, Temp, Temp, false, false);

//   for (let i_ = 0; i_ < NumBones; ++i_)
//   {
//     R_ConcatTransforms(tmBoneHierarchicalObject, arrBonesTMLocal[i_], BoneTransform[i_]);
//     BoneTransform[i_][0][3] = BoneTransform[i_][0][3] + v3Position[0];
//     BoneTransform[i_][1][3] = BoneTransform[i_][1][3] + v3Position[1];
//     BoneTransform[i_][2][3] = BoneTransform[i_][2][3] + v3Position[2];

//     Vector(BoneTransform[i_][0][3],
//       BoneTransform[i_][1][3],
//       BoneTransform[i_][2][3],
//       arrOutSetfAllBonePositions[i_]);
//   }

//   if (true == bApplyTMtoVertices) {
//     Transform(BoneTransform, Temp, Temp, & OBB, false);
//   }

//   delete [] arrBonesTMLocal;
// }

// void BMD_AnimationTransformWithAttachHighModel(OBJECT * oHighHierarchyModel, BMD * bmdHighHierarchyModel, int iBoneNumberHighHierarchyModel, vec3_t & vOutPosHighHiearachyModelBone, vec3_t * arrOutSetfAllBonePositions);
// {
//   if (NumBones < 1) return;
//   if (NumBones > MAX_BONES) return;

//   vec34_t * arrBonesTMLocal;
//   vec34_t * arrBonesTMLocalResult;
//     vec34_t		tmBoneHierarchicalObject;
//     vec3_t		Temp, v3Position;

//   arrBonesTMLocal = new vec34_t[NumBones];
//   Vector(0, 0, 0, Temp);

//   arrBonesTMLocalResult = new vec34_t[NumBones];

//   memset(arrBonesTMLocalResult, 0, sizeof(vec34_t) * NumBones);
//   memset(arrBonesTMLocal, 0, sizeof(vec34_t) * NumBones);

//   memset(tmBoneHierarchicalObject, 0, sizeof(vec34_t));

//   memcpy(tmBoneHierarchicalObject, oHighHierarchyModel -> BoneTransform[iBoneNumberHighHierarchyModel], sizeof(vec34_t));

//   BodyScale = oHighHierarchyModel -> Scale;

//   tmBoneHierarchicalObject[0][3] = tmBoneHierarchicalObject[0][3] * BodyScale;
//   tmBoneHierarchicalObject[1][3] = tmBoneHierarchicalObject[1][3] * BodyScale;
//   tmBoneHierarchicalObject[2][3] = tmBoneHierarchicalObject[2][3] * BodyScale;

//   if (NULL != vOutPosHighHiearachyModelBone) {
//     Vector(tmBoneHierarchicalObject[0][3], tmBoneHierarchicalObject[1][3], tmBoneHierarchicalObject[2][3],
//       vOutPosHighHiearachyModelBone);
//   }

//   VectorCopy(oHighHierarchyModel -> Position, v3Position);

//   Animation(arrBonesTMLocal, 0, 0, 0, Temp, Temp, false, false);
//   for (let i_ = 0; i_ < NumBones; ++i_)
//   {
//     R_ConcatTransforms(tmBoneHierarchicalObject, arrBonesTMLocal[i_], arrBonesTMLocalResult[i_]);
//     arrBonesTMLocalResult[i_][0][3] = arrBonesTMLocalResult[i_][0][3] + v3Position[0];
//     arrBonesTMLocalResult[i_][1][3] = arrBonesTMLocalResult[i_][1][3] + v3Position[1];
//     arrBonesTMLocalResult[i_][2][3] = arrBonesTMLocalResult[i_][2][3] + v3Position[2];

//     Vector(arrBonesTMLocalResult[i_][0][3], arrBonesTMLocalResult[i_][1][3], arrBonesTMLocalResult[i_][2][3], arrOutSetfAllBonePositions[i_]);
//   }

//   delete [] arrBonesTMLocalResult;
//   delete [] arrBonesTMLocal;
// }

// void BMD_AnimationTransformOnlySelf(vec3_t * arrOutSetfAllBonePositions, const OBJECT* oSelf)
// {
//   if (NumBones < 1) return;
//   if (NumBones > MAX_BONES) return;

//   vec34_t * arrBonesTMLocal;

//     vec3_t		Temp;

//   arrBonesTMLocal = new vec34_t[NumBones];
//   Vector(0, 0, 0, Temp);

//   memset(arrBonesTMLocal, 0, sizeof(vec34_t) * NumBones);

//   Animation(arrBonesTMLocal, oSelf -> AnimationFrame, oSelf -> PriorAnimationFrame, oSelf -> PriorAction, (const_cast < OBJECT *> (oSelf)) -> Angle, Temp, false, true);

//   for (let i_ = 0; i_ < NumBones; ++i_)
//   {
//     Vector(arrBonesTMLocal[i_][0][3], arrBonesTMLocal[i_][1][3], arrBonesTMLocal[i_][2][3], arrOutSetfAllBonePositions[i_]);
//   }
//   delete [] arrBonesTMLocal;
// }

// void BMD_AnimationTransformOnlySelf(vec3_t * arrOutSetfAllBonePositions,
//     const vec3_t& v3Angle,
//     const vec3_t& v3Position,
//     const float& fScale,
//   OBJECT * oRefAnimation,
//     const float fFrameArea, ;
// const float fWeight)
//   {
//     if (NumBones < 1) return;
// if (NumBones > MAX_BONES) return;

// vec34_t * arrBonesTMLocal;
//     vec3_t		v3RootAngle, v3RootPosition;
//     float		fRootScale;
//     vec3_t		Temp;

// fRootScale = const_cast<float &>(fScale);

// v3RootAngle[0] = v3Angle[0];
// v3RootAngle[1] = v3Angle[1];
// v3RootAngle[2] = v3Angle[2];

// v3RootPosition[0] = v3Position[0];
// v3RootPosition[1] = v3Position[1];
// v3RootPosition[2] = v3Position[2];

// arrBonesTMLocal = new vec34_t[NumBones];
// Vector(0, 0, 0, Temp);

// memset(arrBonesTMLocal, 0, sizeof(vec34_t) * NumBones);

// if (NULL == oRefAnimation) {
//   Animation(arrBonesTMLocal, 0, 0, 0, v3RootAngle, Temp, false, true);
// }
// else {
//         float			fAnimationFrame = oRefAnimation -> AnimationFrame,
//     fPiriorAnimationFrame = oRefAnimation -> PriorAnimationFrame;
//         unsigned short	iPiriorAction = oRefAnimation -> PriorAction;

//   if (fWeight >= 0 && fFrameArea > 0)
//   {
//             float fAnimationFrameStart = fAnimationFrame - fFrameArea;
//             float fAnimationFrameEnd = fAnimationFrame;
//     LInterpolationF(fAnimationFrame, fAnimationFrameStart, fAnimationFrameEnd, fWeight);
//   }

//   Animation(arrBonesTMLocal,
//     fAnimationFrame,
//     fPiriorAnimationFrame,
//     iPiriorAction,
//     v3RootAngle, Temp, false, true);
// }

//     vec3_t	v3RelatePos;
// Vector(1.0, 1.0, 1.0, v3RelatePos);
// for (let i_ = 0; i_ < NumBones; ++i_)
// {
//   Vector(arrBonesTMLocal[i_][0][3],
//     arrBonesTMLocal[i_][1][3],
//     arrBonesTMLocal[i_][2][3],
//     arrOutSetfAllBonePositions[i_]);
// }

// delete [] arrBonesTMLocal;
// }

// vec3_t		g_vright;		// needs to be set to viewer's right in order for chrome to work
// int			g_smodels_total = 1;				// cookie
// float		g_chrome[MAX_VERTICES][2];	// texture coords for surface normals
// int			g_chromeage[MAX_BONES];	// last time chrome vectors were updated
// vec3_t		g_chromeup[MAX_BONES];		// chrome vector "up" in bone reference frames
// vec3_t		g_chromeright[MAX_BONES];	// chrome vector "right" in bone reference frames

// void BMD_Chrome(float * pchrome, int bone, vec3_t normal);
// {
//   Vector(0.f, 0.f, 1.f, g_vright);

//     float n;

//   //if (g_chromeage[bone] != g_smodels_total)
//   {
//         // calculate vectors from the viewer to the bone. This roughly adjusts for position
//         vec3_t chromeupvec;		// g_chrome t vector in world reference frame
//         vec3_t chromerightvec;	// g_chrome s vector in world reference frame
//         vec3_t tmp;				// vector pointing at bone in world reference frame
//     VectorScale(BodyOrigin, -1, tmp);
//     //tmp[0] += BoneMatrix[bone][0][3];
//     //tmp[1] += BoneMatrix[bone][1][3];
//     //tmp[2] += BoneMatrix[bone][2][3];
//     //tmp[0] += LinkBoneMatrix[0][3];
//     //tmp[1] += LinkBoneMatrix[1][3];
//     //tmp[2] += LinkBoneMatrix[2][3];
//     VectorNormalize(tmp);
//     CrossProduct(tmp, g_vright, chromeupvec);
//     VectorNormalize(chromeupvec);
//     CrossProduct(tmp, chromeupvec, chromerightvec);
//     VectorNormalize(chromerightvec);

//     //VectorIRotate( chromeupvec, BoneMatrix[bone], g_chromeup[bone] );
//     //VectorIRotate( chromerightvec, BoneMatrix[bone], g_chromeright[bone] );
//     //VectorIRotate( chromeupvec, LinkBoneMatrix, g_chromeup[bone] );
//     //VectorIRotate( chromerightvec, LinkBoneMatrix, g_chromeright[bone] );

//     g_chromeage[bone] = g_smodels_total;
//   }

//   // calc s coord
//   n = DotProduct(normal, g_chromeright[bone]);
//   pchrome[0] = (n + 1.f); // FIX: make this a float

//   // calc t coord
//   n = DotProduct(normal, g_chromeup[bone]);
//   pchrome[1] = (n + 1.f); // FIX: make this a float
// }

// void BMD_Lighting(float * pLight, Light_t * lp, vec3_t Position, vec3_t Normal);
// {
//     vec3_t Light;
//   VectorSubtract(lp -> Position, Position, Light);
//     float Length = sqrtf(Light[0] * Light[0] + Light[1] * Light[1] + Light[2] * Light[2]);

//     float LightCos = (DotProduct(Normal, Light) / Length) * 0.8f + 0.3f;
//   if (Length > lp -> Range) LightCos -= (Length - lp -> Range) * 0.01f;
//   if (LightCos < 0.f) LightCos = 0.f;
//   pLight[0] += LightCos * lp -> Color[0];
//   pLight[1] += LightCos * lp -> Color[1];
//   pLight[2] += LightCos * lp -> Color[2];
// }

// ///////////////////////////////////////////////////////////////////////////////
// // light map
// ///////////////////////////////////////////////////////////////////////////////

// const AXIS_X  0;
// const AXIS_Y  1;
// const AXIS_Z  2

// float SubPixel = 16.f;

// void SmoothBitmap(int Width, int Height, unsigned char * Buffer);
// {
//     int RowStride = Width * 3;
//   for (let i = 1; i < Height - 1; i++)
//   {
//     for (int j = 1; j < Width - 1; j++)
//     {
//             int Index = (i * Width + j) * 3;
//       for (int k = 0; k < 3; k++)
//       {
//         Buffer[Index] = (Buffer[Index - RowStride - 3] + Buffer[Index - RowStride] + Buffer[Index - RowStride + 3] +
//           Buffer[Index - 3] + Buffer[Index + 3] +
//           Buffer[Index + RowStride - 3] + Buffer[Index + RowStride] + Buffer[Index + RowStride + 3]) / 8;
//         Index++;
//       }
//     }
//   }
// }

// bool BMD_CollisionDetectLineToMesh(vec3_t Position, vec3_t Target, bool Collision, int Mesh, int Triangle);
// {
//     int i, j;
//   for (i = 0; i < NumMeshs; i++) {
//     Mesh_t * m = & Meshs[i];

//     for (j = 0; j < m -> NumTriangles; j++) {
//       if (i == Mesh && j == Triangle) continue;
//       Triangle_t * tp = & m -> Triangles[j];
//       float * vp1 = VertexTransform[i][tp -> VertexIndex[0]];
//       float * vp2 = VertexTransform[i][tp -> VertexIndex[1]];
//       float * vp3 = VertexTransform[i][tp -> VertexIndex[2]];
//       float * vp4 = VertexTransform[i][tp -> VertexIndex[3]];

//             vec3_t Normal;
//       FaceNormalize(vp1, vp2, vp3, Normal);
//             bool success = CollisionDetectLineToFace(Position, Target, tp -> Polygon, vp1, vp2, vp3, vp4, Normal, Collision);
//       if (success == true) return true;
//     }
//   }
//   return false;
// }

// void BMD_CreateLightMapSurface(Light_t * lp, Mesh_t * m, int i, int j, int MapWidth, int MapHeight, int MapWidthMax, int MapHeightMax, vec3_t BoundingMin, vec3_t BoundingMax, int Axis);
// {
//     int k, l;
//   Triangle_t * tp = & m -> Triangles[j];
//   float * np = NormalTransform[i][tp -> NormalIndex[0]];
//   float * vp = VertexTransform[i][tp -> VertexIndex[0]];
//     float d = -DotProduct(vp, np);

//   Bitmap_t * lmp = & LightMaps[NumLightMaps];
//   if (lmp -> Buffer == NULL) {
//     lmp -> Width = MapWidthMax;
//     lmp -> Height = MapHeightMax;
//         int BufferBytes = lmp -> Width * lmp -> Height * 3;
//     lmp -> Buffer = new unsigned char[BufferBytes];
//     memset(lmp -> Buffer, 0, BufferBytes);
//   }

//   for (k = 0; k < MapHeight; k++) {
//     for (l = 0; l < MapWidth; l++) {
//             vec3_t p;
//       Vector(0.f, 0.f, 0.f, p);
//       switch (Axis) {
//         case AXIS_Z:
//           p[0] = BoundingMin[0] + l * SubPixel;
//           p[1] = BoundingMin[1] + k * SubPixel;
//           if (p[0] >= BoundingMax[0]) p[0] = BoundingMax[0];
//           if (p[1] >= BoundingMax[1]) p[1] = BoundingMax[1];
//           p[2] = (np[0] * p[0] + np[1] * p[1] + d) / -np[2];
//           break;
//         case AXIS_Y:
//           p[0] = BoundingMin[0] + (float)l * SubPixel;
//           p[2] = BoundingMin[2] + (float)k * SubPixel;
//           if (p[0] >= BoundingMax[0]) p[0] = BoundingMax[0];
//           if (p[2] >= BoundingMax[2]) p[2] = BoundingMax[2];
//           p[1] = (np[0] * p[0] + np[2] * p[2] + d) / -np[1];
//           break;
//         case AXIS_X:
//           p[2] = BoundingMin[2] + l * SubPixel;
//           p[1] = BoundingMin[1] + k * SubPixel;
//           if (p[2] >= BoundingMax[2]) p[2] = BoundingMax[2];
//           if (p[1] >= BoundingMax[1]) p[1] = BoundingMax[1];
//           p[0] = (np[2] * p[2] + np[1] * p[1] + d) / -np[0];
//           break;
//       }
//             vec3_t Direction;
//       VectorSubtract(p, lp -> Position, Direction);
//       VectorNormalize(Direction);
//       VectorSubtract(p, Direction, p);
//             bool success = CollisionDetectLineToMesh(lp -> Position, p, true, i, j);

//       if (success == false) {
//                 unsigned char * Bitmap = & lmp -> Buffer[(k * MapWidthMax + l) * 3];
//                 vec3_t Light;
//         Vector(0.f, 0.f, 0.f, Light);
//         Lighting(Light, lp, p, np);
//         for (int c = 0; c < 3; c++)
//         {
//                     int color = Bitmap[c];
//           color += (unsigned char) (Light[c] * 255.f);
//           if (color > 255) color = 255;
//           Bitmap[c] = color;
//         }
//       }
//     }
//   }
// }

// void BMD_CreateLightMaps();
// {
// }

// void BMD_BindLightMaps();
// {
//   if (LightMapEnable == true) return;

//   for (let i = 0; i < NumLightMaps; i++)
//   {
//     Bitmap_t * lmp = & LightMaps[i];
//     if (lmp -> Buffer != NULL) {
//       SmoothBitmap(lmp -> Width, lmp -> Height, lmp -> Buffer);
//       SmoothBitmap(lmp -> Width, lmp -> Height, lmp -> Buffer);

//       glBindTexture(GL_TEXTURE_2D, i + IndexLightMap);
//       glTexEnvf(GL_TEXTURE_ENV, GL_TEXTURE_ENV_MODE, GL_MODULATE);
//       glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
//       glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
//       glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
//       glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
//       glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, lmp -> Width, lmp -> Height, 0, GL_RGB, GL_UNSIGNED_BYTE, lmp -> Buffer);
//     }
//   }
//   LightMapEnable = true;
// }

// void BMD_ReleaseLightMaps();
// {
//   if (LightMapEnable == false) return;
//   for (let i = 0; i < NumLightMaps; i++)
//   {
//     Bitmap_t * lmp = & LightMaps[i];
//     if (lmp -> Buffer != NULL) {
//       delete lmp -> Buffer;
//       lmp -> Buffer = NULL;
//     }
//   }
//   LightMapEnable = false;
// }

// function BMD_BeginRender( Alpha:Float):void{
//   glPushMatrix();
// }

// function BMD_EndRender():void{
//   glPopMatrix();
// }

// const WorldTime=0;
// const WaterTextureNumber=0;

// void BMD_RenderMesh(int meshIndex, int renderFlags, float alpha, int blendMeshIndex, float blendMeshAlpha, float blendMeshTextureCoordU, float blendMeshTextureCoordV, int explicitTextureIndex);
// {
//   if (meshIndex >= NumMeshs || meshIndex < 0) return;

//   Mesh_t * m = & Meshs[meshIndex];
//   if (m -> NumTriangles == 0) return;

//     float wave = static_cast<long>(WorldTime) % 10000 * 0.0001f;

//     int textureIndex = IndexTexture[m -> Texture];
//   if (textureIndex == BITMAP_HIDE)
//     return;

//   if (textureIndex == BITMAP_SKIN) {
//     if (HideSkin) {
//       return;
//     }

//     textureIndex = BITMAP_SKIN + Skin;
//   }
//   else if (textureIndex == BITMAP_WATER) {
//     textureIndex = BITMAP_WATER + WaterTextureNumber;
//   }
//   else if (textureIndex == BITMAP_HAIR) {
//     if (HideSkin) return;
//     textureIndex = BITMAP_HAIR + (Skin - 8);
//   }

//   if (explicitTextureIndex != -1) {
//     textureIndex = explicitTextureIndex;
//   }

//   const auto texture = Bitmaps.GetTexture(textureIndex);

//     bool EnableWave = false;
//     int streamMesh = static_cast<u_char>(this -> StreamMesh);
//   if (m -> m_csTScript != nullptr) {
//     if (m -> m_csTScript -> getStreamMesh()) {
//       streamMesh = meshIndex;
//     }
//   }

//   if ((meshIndex == blendMeshIndex || meshIndex == streamMesh)
//     && (blendMeshTextureCoordU != 0.f || blendMeshTextureCoordV != 0.f))
//   {
//     EnableWave = true;
//   }

//     bool enableLight = LightEnable;
//   if (meshIndex == StreamMesh) {
//     glColor3fv(BodyLight);
//     enableLight = false;
//   }
//   else if (enableLight) {
//     for (int j = 0; j < m -> NumNormals; j++)
//     {
//       VectorScale(BodyLight, IntensityTransform[meshIndex][j], LightTransform[meshIndex][j]);
//     }
//   }

//     int finalRenderFlags = renderFlags;
//   if ((renderFlags & RENDER_COLOR) == RENDER_COLOR) {
//     finalRenderFlags = RENDER_COLOR;
//     if ((renderFlags & RENDER_BRIGHT) == RENDER_BRIGHT) {
//       EnableAlphaBlend();
//     }
//     else if ((renderFlags & RENDER_DARK) == RENDER_DARK) {
//       EnableAlphaBlendMinus();
//     }
//     else {
//       DisableAlphaBlend();
//     }

//     if ((renderFlags & RENDER_NODEPTH) == RENDER_NODEPTH) {
//       DisableDepthTest();
//     }

//     DisableTexture();
//     if (alpha >= 0.99f)
//     {
//       glColor3fv(BodyLight);
//     }
//         else
//     {
//       EnableAlphaTest();
//       glColor4f(BodyLight[0], BodyLight[1], BodyLight[2], alpha);
//     }
//   }
//   else if ((renderFlags & RENDER_CHROME) == RENDER_CHROME ||
//     (renderFlags & RENDER_CHROME2) == RENDER_CHROME2 ||
//     (renderFlags & RENDER_CHROME3) == RENDER_CHROME3 ||
//     (renderFlags & RENDER_CHROME4) == RENDER_CHROME4 ||
//     (renderFlags & RENDER_CHROME5) == RENDER_CHROME5 ||
//     (renderFlags & RENDER_CHROME6) == RENDER_CHROME6 ||
//     (renderFlags & RENDER_CHROME7) == RENDER_CHROME7 ||
//     (renderFlags & RENDER_METAL) == RENDER_METAL ||
//     (renderFlags & RENDER_OIL) == RENDER_OIL
//   ) {
//     if (m -> m_csTScript != nullptr) {
//       if (m -> m_csTScript -> getNoneBlendMesh()) return;
//     }

//     if (m -> NoneBlendMesh)
//       return;

//     finalRenderFlags = RENDER_CHROME;
//     if ((renderFlags & RENDER_CHROME4) == RENDER_CHROME4) {
//       finalRenderFlags = RENDER_CHROME4;
//     }
//     if ((renderFlags & RENDER_OIL) == RENDER_OIL) {
//       finalRenderFlags = RENDER_OIL;
//     }

//         float Wave2 = (int)WorldTime % 5000 * 0.00024f - 0.4f;

//         vec3_t L = { (float)(cos(WorldTime * 0.001f)), (float)(sin(WorldTime * 0.002f)), 1.f;
//   };
//   for (int j = 0; j < m -> NumNormals; j++)
//   {
//     if (j > MAX_VERTICES) break;
//     const auto normal = NormalTransform[meshIndex][j];

//     if ((renderFlags & RENDER_CHROME2) == RENDER_CHROME2) {
//       g_chrome[j][0] = (normal[2] + normal[0]) * 0.8f + Wave2 * 2.f;
//       g_chrome[j][1] = (normal[1] + normal[0]) * 1.0 + Wave2 * 3.f;
//     }
//     else if ((renderFlags & RENDER_CHROME3) == RENDER_CHROME3) {
//       g_chrome[j][0] = DotProduct(normal, LightVector);
//       g_chrome[j][1] = 1.f - DotProduct(normal, LightVector);
//     }
//     else if ((renderFlags & RENDER_CHROME4) == RENDER_CHROME4) {
//       g_chrome[j][0] = DotProduct(normal, L);
//       g_chrome[j][1] = 1.f - DotProduct(normal, L);
//       g_chrome[j][1] -= normal[2] * 0.5f + wave * 3.f;
//       g_chrome[j][0] += normal[1] * 0.5f + L[1] * 3.f;
//     }
//     else if ((renderFlags & RENDER_CHROME5) == RENDER_CHROME5) {
//       g_chrome[j][0] = DotProduct(normal, L);
//       g_chrome[j][1] = 1.f - DotProduct(normal, L);
//       g_chrome[j][1] -= normal[2] * 2.5f + wave * 1.f;
//       g_chrome[j][0] += normal[1] * 3.f + L[1] * 5.f;
//     }
//     else if ((renderFlags & RENDER_CHROME6) == RENDER_CHROME6) {
//       g_chrome[j][0] = (normal[2] + normal[0]) * 0.8f + Wave2 * 2.f;
//       g_chrome[j][1] = (normal[2] + normal[0]) * 0.8f + Wave2 * 2.f;
//     }
//     else if ((renderFlags & RENDER_CHROME7) == RENDER_CHROME7) {
//       g_chrome[j][0] = (normal[2] + normal[0]) * 0.8f + static_cast<float>(WorldTime) * 0.00006f;
//       g_chrome[j][1] = (normal[2] + normal[0]) * 0.8f + static_cast<float>(WorldTime) * 0.00006f;
//     }
//     else if ((renderFlags & RENDER_OIL) == RENDER_OIL) {
//       g_chrome[j][0] = normal[0];
//       g_chrome[j][1] = normal[1];
//     }
//     else if ((renderFlags & RENDER_CHROME) == RENDER_CHROME) {
//       g_chrome[j][0] = normal[2] * 0.5f + wave;
//       g_chrome[j][1] = normal[1] * 0.5f + wave * 2.f;
//     }
//     else {
//       g_chrome[j][0] = normal[2] * 0.5f + 0.2f;
//       g_chrome[j][1] = normal[1] * 0.5f + 0.5f;
//     }
//   }

//   if ((renderFlags & RENDER_CHROME3) == RENDER_CHROME3
//     || (renderFlags & RENDER_CHROME4) == RENDER_CHROME4
//     || (renderFlags & RENDER_CHROME5) == RENDER_CHROME5
//     || (renderFlags & RENDER_CHROME7) == RENDER_CHROME7
//     || (renderFlags & RENDER_BRIGHT) == RENDER_BRIGHT
//   ) {
//     if (alpha < 0.99f)
//     {
//       BodyLight[0] *= alpha;
//       BodyLight[1] *= alpha;
//       BodyLight[2] *= alpha;
//     }

//     EnableAlphaBlend();
//   }
//   else if ((renderFlags & RENDER_DARK) == RENDER_DARK)
//     EnableAlphaBlendMinus();
//   else if ((renderFlags & RENDER_LIGHTMAP) == RENDER_LIGHTMAP)
//     EnableLightMap();
//   else if (alpha >= 0.99f)
//   {
//     DisableAlphaBlend();
//   }
//         else
//   {
//     EnableAlphaTest();
//   }

//   if ((renderFlags & RENDER_NODEPTH) == RENDER_NODEPTH) {
//     DisableDepthTest();
//   }

//   if (explicitTextureIndex == -1) {
//     if ((renderFlags & RENDER_CHROME2) == RENDER_CHROME2) {
//       BindTexture(BITMAP_CHROME2);
//     }
//     else if ((renderFlags & RENDER_CHROME3) == RENDER_CHROME3) {
//       BindTexture(BITMAP_CHROME2);
//     }
//     else if ((renderFlags & RENDER_CHROME4) == RENDER_CHROME4) {
//       BindTexture(BITMAP_CHROME2);
//     }
//     else if ((renderFlags & RENDER_CHROME6) == RENDER_CHROME6) {
//       BindTexture(BITMAP_CHROME6);
//     }
//     else if ((renderFlags & RENDER_CHROME) == RENDER_CHROME) {
//       BindTexture(BITMAP_CHROME);
//     }
//     else if ((renderFlags & RENDER_METAL) == RENDER_METAL) {
//       BindTexture(BITMAP_SHINY);
//     }
//   }
//   else {
//     BindTexture(textureIndex);
//   }
// }
//     else if (blendMeshIndex <= -2 || m -> Texture == blendMeshIndex) {
//   finalRenderFlags = RENDER_TEXTURE;
//   BindTexture(textureIndex);
//   if ((renderFlags & RENDER_DARK) == RENDER_DARK)
//     EnableAlphaBlendMinus();
//   else
//     EnableAlphaBlend();

//   if ((renderFlags & RENDER_NODEPTH) == RENDER_NODEPTH) {
//     DisableDepthTest();
//   }

//   glColor3f(BodyLight[0] * blendMeshAlpha,
//     BodyLight[1] * blendMeshAlpha,
//     BodyLight[2] * blendMeshAlpha);
//   //glColor3f(BlendMeshLight,BlendMeshLight,BlendMeshLight);
//   enableLight = false;
// }
// else if ((renderFlags & RENDER_TEXTURE) == RENDER_TEXTURE) {
//   finalRenderFlags = RENDER_TEXTURE;
//   BindTexture(textureIndex);
//   if ((renderFlags & RENDER_BRIGHT) == RENDER_BRIGHT) {
//     EnableAlphaBlend();
//   }
//   else if ((renderFlags & RENDER_DARK) == RENDER_DARK) {
//     EnableAlphaBlendMinus();
//   }
//   else if (alpha < 0.99f || texture -> Components == 4)
//   {
//     EnableAlphaTest();
//   }
//         else
//   {
//     DisableAlphaBlend();
//   }

//   if ((renderFlags & RENDER_NODEPTH) == RENDER_NODEPTH) {
//     DisableDepthTest();
//   }
// }
// else if ((renderFlags & RENDER_BRIGHT) == RENDER_BRIGHT) {
//   if (texture -> Components == 4 || m -> Texture == blendMeshIndex) {
//     return;
//   }

//   finalRenderFlags = RENDER_BRIGHT;
//   EnableAlphaBlend();
//   DisableTexture();
//   DisableDepthMask();

//   if ((renderFlags & RENDER_NODEPTH) == RENDER_NODEPTH) {
//     DisableDepthTest();
//   }
// }
// else {
//   finalRenderFlags = RENDER_TEXTURE;
// }
// if (renderFlags & RENDER_DOPPELGANGER) {
//   if (texture -> Components != 4) {
//     EnableCullFace();
//     EnableDepthMask();
//   }
// }

//     bool enableColor = (enableLight && finalRenderFlags == RENDER_TEXTURE)
//   || finalRenderFlags == RENDER_CHROME
//   || finalRenderFlags == RENDER_CHROME4
//   || finalRenderFlags == RENDER_OIL;

// glEnableClientState(GL_VERTEX_ARRAY);
// if (enableColor) glEnableClientState(GL_COLOR_ARRAY);
// glEnableClientState(GL_TEXTURE_COORD_ARRAY);

//     auto vertices = RenderArrayVertices;
//     auto colors = RenderArrayColors;
//     auto texCoords = RenderArrayTexCoords;

//     int target_vertex_index = -1;
// for (let j = 0; j < m -> NumTriangles; j++)
// {
//   const auto triangle = & m -> Triangles[j];
//   for (int k = 0; k < triangle -> Polygon; k++)
//   {
//     const int source_vertex_index = triangle -> VertexIndex[k];
//     target_vertex_index++;

//     VectorCopy(VertexTransform[meshIndex][source_vertex_index], vertices[target_vertex_index]);

//     Vector4(BodyLight[0], BodyLight[1], BodyLight[2], alpha, colors[target_vertex_index]);

//             auto texco = m -> TexCoords[triangle -> TexCoordIndex[k]];
//     texCoords[target_vertex_index][0] = texco.TexCoordU;
//     texCoords[target_vertex_index][1] = texco.TexCoordV;

//             int normalIndex = triangle -> NormalIndex[k];
//     switch (finalRenderFlags) {
//       case RENDER_TEXTURE:
//         {
//           if (EnableWave) {
//             texCoords[target_vertex_index][0] += blendMeshTextureCoordU;
//             texCoords[target_vertex_index][1] += blendMeshTextureCoordV;
//           }

//           if (enableLight) {
//                         auto light = LightTransform[meshIndex][normalIndex];
//             Vector4(light[0], light[1], light[2], alpha, colors[target_vertex_index]);
//           }

//           break;
//         }
//       case RENDER_CHROME:
//         {
//           texCoords[target_vertex_index][0] = g_chrome[normalIndex][0];
//           texCoords[target_vertex_index][1] = g_chrome[normalIndex][1];
//           break;
//         }
//       case RENDER_CHROME4:
//         {
//           texCoords[target_vertex_index][0] = g_chrome[normalIndex][0] + blendMeshTextureCoordU;
//           texCoords[target_vertex_index][1] = g_chrome[normalIndex][1] + blendMeshTextureCoordV;
//           break;
//         }
//       case RENDER_OIL:
//         {
//           texCoords[target_vertex_index][0] = g_chrome[normalIndex][0] * texCoords[target_vertex_index][0] + blendMeshTextureCoordU;
//           texCoords[target_vertex_index][1] = g_chrome[normalIndex][1] * texCoords[target_vertex_index][1] + blendMeshTextureCoordV;
//           break;
//         }
//     }

//     if ((renderFlags & RENDER_SHADOWMAP) == RENDER_SHADOWMAP) {
//                 vec3_t pos;
//       VectorSubtract(vertices[target_vertex_index], BodyOrigin, pos);

//       pos[0] += pos[2] * (pos[0] + 2000.f) / (pos[2] - 4000.f);
//       pos[2] = 5.f;

//       VectorAdd(pos, BodyOrigin, pos);
//     }
//     else if ((renderFlags & RENDER_WAVE) == RENDER_WAVE) {
//                 float time_sin = Math.sin((float)((int)WorldTime + source_vertex_index * 931) * 0.007f) * 28.0f;
//       float * normal = NormalTransform[meshIndex][normalIndex];
//       for (let iCoord = 0; iCoord < 3; ++iCoord)
//       {
//         vertices[target_vertex_index][iCoord] += normal[iCoord] * time_sin;
//       }
//     }
//   }
// }

// glVertexPointer(3, GL_FLOAT, 0, vertices);
// if (enableColor) glColorPointer(4, GL_FLOAT, 0, colors);
// glTexCoordPointer(2, GL_FLOAT, 0, texCoords);

// glDrawArrays(GL_TRIANGLES, 0, m -> NumTriangles * 3);

// glDisableClientState(GL_TEXTURE_COORD_ARRAY);
// if (enableColor) glDisableClientState(GL_COLOR_ARRAY);
// glDisableClientState(GL_VERTEX_ARRAY);
// }

// void BMD_RenderMeshAlternative(let iRndExtFlag, int iParam, int i, int RenderFlag, float Alpha, int BlendMesh, float BlendMeshLight, float BlendMeshTexCoordU, float BlendMeshTexCoordV, int MeshTexture);
// {
//   if (i >= NumMeshs || i < 0) return;

//   Mesh_t * m = & Meshs[i];
//   if (m -> NumTriangles == 0) return;
//     float Wave = (int)WorldTime % 10000 * 0.0001f;

//     int Texture = IndexTexture[m -> Texture];
//   if (Texture == BITMAP_HIDE)
//     return;
//   if (MeshTexture != -1)
//     Texture = MeshTexture;

//   BITMAP_t * pBitmap = Bitmaps.GetTexture(Texture);

//     bool EnableWave = false;
//     int streamMesh = StreamMesh;
//   if (m -> m_csTScript != NULL) {
//     if (m -> m_csTScript -> getStreamMesh()) {
//       streamMesh = i;
//     }
//   }
//   if ((i == BlendMesh || i == streamMesh) && (BlendMeshTexCoordU != 0.f || BlendMeshTexCoordV != 0.f))
//   EnableWave = true;

//     bool EnableLight = LightEnable;
//   if (i == StreamMesh) {
//     //vec3_t Light;
//     //Vector(1.f,1.f,1.f,Light);
//     glColor3fv(BodyLight);
//     EnableLight = false;
//   }
//   else if (EnableLight) {
//     for (int j = 0; j < m -> NumNormals; j++)
//     {
//       VectorScale(BodyLight, IntensityTransform[i][j], LightTransform[i][j]);
//     }
//   }

//     int Render = RenderFlag;
//   if ((RenderFlag & RENDER_COLOR) == RENDER_COLOR) {
//     Render = RENDER_COLOR;
//     if ((RenderFlag & RENDER_BRIGHT) == RENDER_BRIGHT)
//       EnableAlphaBlend();
//     else if ((RenderFlag & RENDER_DARK) == RENDER_DARK)
//       EnableAlphaBlendMinus();
//     else
//       DisableAlphaBlend();

//     if ((RenderFlag & RENDER_NODEPTH) == RENDER_NODEPTH) {
//       DisableDepthTest();
//     }

//     DisableTexture();
//     if (Alpha >= 0.99f)
//     {
//       glColor3fv(BodyLight);
//     }
//         else
//     {
//       EnableAlphaTest();
//       glColor4f(BodyLight[0], BodyLight[1], BodyLight[2], Alpha);
//     }
//   }
//   else if ((RenderFlag & RENDER_CHROME) == RENDER_CHROME ||
//     (RenderFlag & RENDER_CHROME2) == RENDER_CHROME2 ||
//     (RenderFlag & RENDER_CHROME3) == RENDER_CHROME3 ||
//     (RenderFlag & RENDER_CHROME4) == RENDER_CHROME4 ||
//     (RenderFlag & RENDER_CHROME5) == RENDER_CHROME5 ||
//     (RenderFlag & RENDER_CHROME7) == RENDER_CHROME7 ||
//     (RenderFlag & RENDER_METAL) == RENDER_METAL ||
//     (RenderFlag & RENDER_OIL) == RENDER_OIL
//   ) {
//     if (m -> m_csTScript != NULL) {
//       if (m -> m_csTScript -> getNoneBlendMesh()) return;
//     }
//     if (m -> NoneBlendMesh)
//       return;
//     Render = RENDER_CHROME;
//     if ((RenderFlag & RENDER_CHROME4) == RENDER_CHROME4) {
//       Render = RENDER_CHROME4;
//     }
//         float Wave2 = (int)WorldTime % 5000 * 0.00024f - 0.4f;

//         vec3_t L = { (float)(cos(WorldTime * 0.001f)), (float)(sin(WorldTime * 0.002f)), 1.f;
//   };
//   for (int j = 0; j < m -> NumNormals; j++)
//   {
//     if (j > MAX_VERTICES) break;
//     float * Normal = NormalTransform[i][j];

//     if ((RenderFlag & RENDER_CHROME2) == RENDER_CHROME2) {
//       g_chrome[j][0] = (Normal[2] + Normal[0]) * 0.8f + Wave2 * 2.f;
//       g_chrome[j][1] = (Normal[1] + Normal[0]) * 1.0 + Wave2 * 3.f;
//     }
//     else if ((RenderFlag & RENDER_CHROME3) == RENDER_CHROME3) {
//       g_chrome[j][0] = DotProduct(Normal, LightVector);
//       g_chrome[j][1] = 1.f - DotProduct(Normal, LightVector);
//     }
//     else if ((RenderFlag & RENDER_CHROME4) == RENDER_CHROME4) {
//       g_chrome[j][0] = DotProduct(Normal, L);
//       g_chrome[j][1] = 1.f - DotProduct(Normal, L);
//       g_chrome[j][1] -= Normal[2] * 0.5f + Wave * 3.f;
//       g_chrome[j][0] += Normal[1] * 0.5f + L[1] * 3.f;
//     }
//     else if ((RenderFlag & RENDER_CHROME5) == RENDER_CHROME5) {
//       Vector(0.1f, -0.23f, 0.22f, LightVector2);

//       g_chrome[j][0] = (DotProduct(Normal, LightVector2) /*+ Normal[1] + LightVector2[1]*3.f */) / 1.08f;
//       g_chrome[j][1] = (1.f - DotProduct(Normal, LightVector2) /*- Normal[2]*0.5f + 3.f */) / 1.08f;
//     }
//     else if ((RenderFlag & RENDER_CHROME6) == RENDER_CHROME6) {
//       g_chrome[j][0] = (Normal[2] + Normal[0]) * 0.8f + Wave2 * 2.f;
//       g_chrome[j][1] = (Normal[1] + Normal[0]) * 1.0 + Wave2 * 3.f;
//     }
//     else if ((RenderFlag & RENDER_CHROME7) == RENDER_CHROME7) {
//       Vector(0.1f, -0.23f, 0.22f, LightVector2);

//       g_chrome[j][0] = (DotProduct(Normal, LightVector2)) / 1.08f;
//       g_chrome[j][1] = (1.f - DotProduct(Normal, LightVector2)) / 1.08f;
//     }
//     else if ((RenderFlag & RENDER_CHROME) == RENDER_CHROME) {
//       g_chrome[j][0] = Normal[2] * 0.5f + Wave;
//       g_chrome[j][1] = Normal[1] * 0.5f + Wave * 2.f;
//     }
//     else {
//       g_chrome[j][0] = Normal[2] * 0.5f + 0.2f;
//       g_chrome[j][1] = Normal[1] * 0.5f + 0.5f;
//     }
//   }

//   if ((RenderFlag & RENDER_CHROME3) == RENDER_CHROME3
//     || (RenderFlag & RENDER_CHROME4) == RENDER_CHROME4
//     || (RenderFlag & RENDER_CHROME5) == RENDER_CHROME5
//     || (RenderFlag & RENDER_CHROME7) == RENDER_CHROME7
//   ) {
//     if (Alpha < 0.99f)
//     {
//       BodyLight[0] *= Alpha; BodyLight[1] *= Alpha; BodyLight[2] *= Alpha;
//     }
//     EnableAlphaBlend();
//   }
//   else if ((RenderFlag & RENDER_BRIGHT) == RENDER_BRIGHT) {
//     if (Alpha < 0.99f)
//     {
//       BodyLight[0] *= Alpha; BodyLight[1] *= Alpha; BodyLight[2] *= Alpha;
//     }
//     EnableAlphaBlend();
//   }
//   else if ((RenderFlag & RENDER_DARK) == RENDER_DARK)
//     EnableAlphaBlendMinus();
//   else if ((RenderFlag & RENDER_LIGHTMAP) == RENDER_LIGHTMAP)
//     EnableLightMap();
//   else if (Alpha >= 0.99f)
//   {
//     DisableAlphaBlend();
//   }
//         else
//   {
//     EnableAlphaTest();
//   }

//   if ((RenderFlag & RENDER_NODEPTH) == RENDER_NODEPTH) {
//     DisableDepthTest();
//   }

//   if ((RenderFlag & RENDER_CHROME2) == RENDER_CHROME2 && MeshTexture == -1) {
//     BindTexture(BITMAP_CHROME2);
//   }
//   else if ((RenderFlag & RENDER_CHROME3) == RENDER_CHROME3 && MeshTexture == -1) {
//     BindTexture(BITMAP_CHROME2);
//   }
//   else if ((RenderFlag & RENDER_CHROME4) == RENDER_CHROME4 && MeshTexture == -1) {
//     BindTexture(BITMAP_CHROME2);
//   }
//   else if ((RenderFlag & RENDER_CHROME) == RENDER_CHROME && MeshTexture == -1)
//     BindTexture(BITMAP_CHROME);
//   else if ((RenderFlag & RENDER_METAL) == RENDER_METAL && MeshTexture == -1)
//     BindTexture(BITMAP_SHINY);
//   else
//     BindTexture(Texture);
// }
//     else if (BlendMesh <= -2 || m -> Texture == BlendMesh) {
//   Render = RENDER_TEXTURE;
//   BindTexture(Texture);
//   if ((RenderFlag & RENDER_DARK) == RENDER_DARK)
//     EnableAlphaBlendMinus();
//   else
//     EnableAlphaBlend();

//   if ((RenderFlag & RENDER_NODEPTH) == RENDER_NODEPTH) {
//     DisableDepthTest();
//   }

//   glColor3f(BodyLight[0] * BlendMeshLight, BodyLight[1] * BlendMeshLight, BodyLight[2] * BlendMeshLight);
//   //glColor3f(BlendMeshLight,BlendMeshLight,BlendMeshLight);
//   EnableLight = false;
// }
// else if ((RenderFlag & RENDER_TEXTURE) == RENDER_TEXTURE) {
//   Render = RENDER_TEXTURE;
//   BindTexture(Texture);
//   if ((RenderFlag & RENDER_BRIGHT) == RENDER_BRIGHT) {
//     EnableAlphaBlend();
//   }
//   else if ((RenderFlag & RENDER_DARK) == RENDER_DARK) {
//     EnableAlphaBlendMinus();
//   }
//   else if (Alpha < 0.99f || pBitmap -> Components == 4)
//   {
//     EnableAlphaTest();
//   }
//         else
//   {
//     DisableAlphaBlend();
//   }

//   if ((RenderFlag & RENDER_NODEPTH) == RENDER_NODEPTH) {
//     DisableDepthTest();
//   }
// }
// else if ((RenderFlag & RENDER_BRIGHT) == RENDER_BRIGHT) {
//   if (pBitmap -> Components == 4 || m -> Texture == BlendMesh) {
//     return;
//   }
//   Render = RENDER_BRIGHT;
//   EnableAlphaBlend();
//   DisableTexture();
//   DisableDepthMask();

//   if ((RenderFlag & RENDER_NODEPTH) == RENDER_NODEPTH) {
//     DisableDepthTest();
//   }
// }
// else {
//   Render = RENDER_TEXTURE;
// }

// // ver 1.0 (triangle)
// glBegin(GL_TRIANGLES);
// for (int j = 0; j < m -> NumTriangles; j++)
// {
//   Triangle_t * tp = & m -> Triangles[j];
//   for (int k = 0; k < tp -> Polygon; k++)
//   {
//             int vi = tp -> VertexIndex[k];
//     switch (Render) {
//       case RENDER_TEXTURE:
//         {
//           TexCoord_t * texp = & m -> TexCoords[tp -> TexCoordIndex[k]];
//           if (EnableWave)
//             glTexCoord2f(texp -> TexCoordU + BlendMeshTexCoordU, texp -> TexCoordV + BlendMeshTexCoordV);
//           else
//             glTexCoord2f(texp -> TexCoordU, texp -> TexCoordV);
//           if (EnableLight) {
//                     int ni = tp -> NormalIndex[k];
//             if (Alpha >= 0.99f)
//             {
//               glColor3fv(LightTransform[i][ni]);
//             }
//                     else
//             {
//               float * Light = LightTransform[i][ni];
//               glColor4f(Light[0], Light[1], Light[2], Alpha);
//             }
//           }
//           break;
//         }
//       case RENDER_CHROME:
//         {
//           if (Alpha >= 0.99f)
//           glColor3fv(BodyLight);
//                 else
//           glColor4f(BodyLight[0], BodyLight[1], BodyLight[2], Alpha);
//                 int ni = tp -> NormalIndex[k];
//           glTexCoord2f(g_chrome[ni][0], g_chrome[ni][1]);
//           break;
//         }
//     }
//     if ((iRndExtFlag & RNDEXT_WAVE)) {
//                 float vPos[3];
//                 float fParam = (float)((int)WorldTime + vi * 931) * 0.007f;
//                 float fSin = Math.sin(fParam);
//                 int ni = tp -> NormalIndex[k];
//       float * Normal = NormalTransform[i][ni];
//       for (let iCoord = 0; iCoord < 3; ++iCoord)
//       {
//         vPos[iCoord] = VertexTransform[i][vi][iCoord] + Normal[iCoord] * fSin * 28.0f;
//       }
//       glVertex3fv(vPos);
//     }
//     else {
//       glVertex3fv(VertexTransform[i][vi]);
//     }
//   }
// }
// glEnd();
// }

// void BMD_RenderMeshEffect(let i, int iType, int iSubType, vec3_t Angle, VOID * obj);
// {
//   if (i >= NumMeshs || i < 0) return;

//   Mesh_t * m = & Meshs[i];
//   if (m -> NumTriangles <= 0) return;

//     vec3_t angle, Light;
//     int iEffectCount = 0;

//   Vector(0.f, 0.f, 0.f, angle);
//   Vector(1.f, 1.f, 1.f, Light);
//   for (int j = 0; j < m -> NumTriangles; j++)
//   {
//     Triangle_t * tp = & m -> Triangles[j];
//     for (int k = 0; k < tp -> Polygon; k++)
//     {
//             int vi = tp -> VertexIndex[k];

//       switch (iType) {
//         case MODEL_STONE_COFFIN:
//           if (iSubType == 0) {
//             if (rand_fps_check(2)) {
//               CreateEffect(MODEL_STONE_COFFIN + 1, VertexTransform[i][vi], angle, Light);
//             }
//             if (rand_fps_check(10)) {
//               CreateEffect(MODEL_STONE_COFFIN, VertexTransform[i][vi], angle, Light);
//             }
//           }
//           else if (iSubType == 1) {
//             CreateEffect(MODEL_STONE_COFFIN + 1, VertexTransform[i][vi], angle, Light, 2);
//           }
//           else if (iSubType == 2) {
//             CreateEffect(MODEL_STONE_COFFIN + 1, VertexTransform[i][vi], angle, Light, 3);
//           }
//           else if (iSubType == 3) {
//             CreateEffect(MODEL_STONE_COFFIN + rand() % 2, VertexTransform[i][vi], angle, Light, 4);
//           }
//           break;
//         case MODEL_GATE:
//           if (iSubType == 1) {
//             Vector(0.2f, 0.2f, 0.2f, Light);
//             if (rand_fps_check(5)) {
//               CreateEffect(MODEL_GATE + 1, VertexTransform[i][vi], angle, Light, 2);
//             }
//             if (rand_fps_check(10)) {
//               CreateEffect(MODEL_GATE, VertexTransform[i][vi], angle, Light, 2);
//             }
//           }
//           else if (iSubType == 0) {
//             Vector(0.2f, 0.2f, 0.2f, Light);
//             if (rand_fps_check(12)) {
//               CreateEffect(MODEL_GATE + 1, VertexTransform[i][vi], angle, Light);
//             }
//             if (rand_fps_check(50)) {
//               CreateEffect(MODEL_GATE, VertexTransform[i][vi], angle, Light);
//             }
//           }
//           break;
//         case MODEL_BIG_STONE_PART1:
//           if (rand_fps_check(3)) {
//             CreateEffect(MODEL_BIG_STONE_PART1 + rand() % 2, VertexTransform[i][vi], angle, Light, 1);
//           }
//           break;

//         case MODEL_BIG_STONE_PART2:
//           if (rand_fps_check(3)) {
//             CreateEffect(MODEL_BIG_STONE_PART1 + rand() % 2, VertexTransform[i][vi], angle, Light);
//           }
//           break;

//         case MODEL_WALL_PART1:
//           if (rand_fps_check(3)) {
//             CreateEffect(MODEL_WALL_PART1 + rand() % 2, VertexTransform[i][vi], angle, Light);
//           }
//           break;

//         case MODEL_GATE_PART1:
//           Vector(0.2f, 0.2f, 0.2f, Light);
//           if (rand_fps_check(12)) {
//             CreateEffect(MODEL_GATE_PART1 + 1, VertexTransform[i][vi], angle, Light);
//           }
//           if (rand_fps_check(40)) {
//             CreateEffect(MODEL_GATE_PART1, VertexTransform[i][vi], angle, Light);
//           }
//           if (rand_fps_check(40)) {
//             CreateEffect(MODEL_GATE_PART1 + 2, VertexTransform[i][vi], angle, Light);
//           }
//           break;
//         case MODEL_GOLEM_STONE:
//           if (rand_fps_check(45) && iEffectCount < 20) {
//             if (iSubType == 0) {	//. �Ұ�
//               CreateEffect(MODEL_GOLEM_STONE, VertexTransform[i][vi], angle, Light);
//             }
//             else if (iSubType == 1) {	//. ����
//               CreateEffect(MODEL_BIG_STONE_PART1, VertexTransform[i][vi], angle, Light, 2);
//               CreateEffect(MODEL_BIG_STONE_PART2, VertexTransform[i][vi], angle, Light, 2);
//             }
//             iEffectCount++;
//           }
//           break;
//         case MODEL_SKIN_SHELL:
//           if (rand_fps_check(8)) {
//             CreateEffect(MODEL_SKIN_SHELL, VertexTransform[i][vi], angle, Light, iSubType);
//           }
//           break;
//         case BITMAP_LIGHT:
//           Vector(0.08f, 0.08f, 0.08f, Light);
//           if (iSubType == 0) {
//             CreateSprite(BITMAP_LIGHT, VertexTransform[i][vi], BodyScale, Light, NULL);
//           }
//           else if (iSubType == 1) {
//             Vector(1.f, 0.8f, 0.2f, Light);
//             if ((j % 22) == 0) {
//               auto * o = (OBJECT *)obj;

//               angle[0] = -(float)(rand() % 90);
//               angle[1] = 0.f;
//               angle[2] = Angle[2] + (float)(rand() % 120 - 60);
//               CreateJoint(BITMAP_JOINT_SPIRIT, VertexTransform[i][vi], o -> Position, angle, 13, o, 20.f, 0, 0);
//             }
//           }
//           break;
//         case BITMAP_BUBBLE:
//           Vector(1.f, 1.f, 1.f, Light);
//           if (rand_fps_check(30)) {
//             CreateParticle(BITMAP_BUBBLE, VertexTransform[i][vi], angle, Light, 2);
//           }
//           break;
//       }
//     }
//   }
// }

// void BMD_RenderBody(int Flag, float Alpha, int BlendMesh, float BlendMeshLight, float BlendMeshTexCoordU, float BlendMeshTexCoordV, int HiddenMesh, int Texture);
// {
//   if (NumMeshs == 0) return;

//     int iBlendMesh = BlendMesh;
//   BeginRender(Alpha);
//   if (!LightEnable) {
//     if (Alpha >= 0.99f)
//     glColor3fv(BodyLight);
//         else
//     glColor4f(BodyLight[0], BodyLight[1], BodyLight[2], Alpha);
//   }
//   for (let i = 0; i < NumMeshs; i++)
//   {
//     iBlendMesh = BlendMesh;

//     Mesh_t * m = & Meshs[i];
//     if (m -> m_csTScript != NULL) {
//       if (m -> m_csTScript -> getHiddenMesh() == false && i != HiddenMesh) {
//         if (m -> m_csTScript -> getBright()) {
//           iBlendMesh = i;
//         }
//         RenderMesh(i, Flag, Alpha, iBlendMesh, BlendMeshLight, BlendMeshTexCoordU, BlendMeshTexCoordV, Texture);

//                 BYTE shadowType = m -> m_csTScript -> getShadowMesh();
//         if (shadowType == SHADOW_RENDER_COLOR) {
//           DisableAlphaBlend();
//           if (Alpha >= 0.99f)
//           glColor3f(0.f, 0.f, 0.f);
//                     else
//           glColor4f(0.f, 0.f, 0.f, Alpha);

//           RenderMesh(i, RENDER_COLOR | RENDER_SHADOWMAP, Alpha, iBlendMesh, BlendMeshLight, BlendMeshTexCoordU, BlendMeshTexCoordV);
//           glColor3f(1.f, 1.f, 1.f);
//         }
//         else if (shadowType == SHADOW_RENDER_TEXTURE) {
//           DisableAlphaBlend();
//           if (Alpha >= 0.99f)
//           glColor3f(0.f, 0.f, 0.f);
//                     else
//           glColor4f(0.f, 0.f, 0.f, Alpha);

//           RenderMesh(i, RENDER_TEXTURE | RENDER_SHADOWMAP, Alpha, iBlendMesh, BlendMeshLight, BlendMeshTexCoordU, BlendMeshTexCoordV);
//           glColor3f(1.f, 1.f, 1.f);
//         }
//       }
//     }
//     else {
//       if (i != HiddenMesh) {
//         RenderMesh(i, Flag, Alpha, iBlendMesh, BlendMeshLight, BlendMeshTexCoordU, BlendMeshTexCoordV, Texture);
//       }
//     }
//   }
//   EndRender();
// }

// void BMD_RenderBodyAlternative(let iRndExtFlag, int iParam, int Flag, float Alpha, int BlendMesh, float BlendMeshLight, float BlendMeshTexCoordU, float BlendMeshTexCoordV, int HiddenMesh, int Texture);
// {
//   if (NumMeshs == 0) return;

//   BeginRender(Alpha);
//   if (!LightEnable) {
//     if (Alpha >= 0.99f)
//     glColor3fv(BodyLight);
//         else
//     glColor4f(BodyLight[0], BodyLight[1], BodyLight[2], Alpha);
//   }
//   for (let i = 0; i < NumMeshs; i++)
//   {
//     if (i != HiddenMesh) {
//       RenderMeshAlternative(iRndExtFlag, iParam, i, Flag, Alpha, BlendMesh, BlendMeshLight, BlendMeshTexCoordU, BlendMeshTexCoordV, Texture);
//     }
//   }
//   EndRender();
// }

// void BMD_RenderMeshTranslate(let i, int RenderFlag, float Alpha, int BlendMesh, float BlendMeshLight, float BlendMeshTexCoordU, float BlendMeshTexCoordV, int MeshTexture);
// {
//   if (i >= NumMeshs || i < 0) return;

//   Mesh_t * m = & Meshs[i];
//   if (m -> NumTriangles == 0) return;
//     float Wave = (int)WorldTime % 10000 * 0.0001f;

//     int Texture = IndexTexture[m -> Texture];
//   if (Texture == BITMAP_HIDE)
//     return;
//   else if (Texture == BITMAP_SKIN) {
//     if (HideSkin) return;
//     Texture = BITMAP_SKIN + Skin;
//   }
//   else if (Texture == BITMAP_WATER) {
//     Texture = BITMAP_WATER + WaterTextureNumber;
//   }
//   if (MeshTexture != -1)
//     Texture = MeshTexture;

//   BITMAP_t * pBitmap = Bitmaps.GetTexture(Texture);

//     bool EnableWave = false;
//     int streamMesh = StreamMesh;
//   if (m -> m_csTScript != NULL) {
//     if (m -> m_csTScript -> getStreamMesh()) {
//       streamMesh = i;
//     }
//   }
//   if ((i == BlendMesh || i == streamMesh) && (BlendMeshTexCoordU != 0.f || BlendMeshTexCoordV != 0.f))
//   EnableWave = true;

//     bool EnableLight = LightEnable;
//   if (i == StreamMesh) {
//     //vec3_t Light;
//     //Vector(1.f,1.f,1.f,Light);
//     glColor3fv(BodyLight);
//     EnableLight = false;
//   }
//   else if (EnableLight) {
//     for (int j = 0; j < m -> NumNormals; j++)
//     {
//       VectorScale(BodyLight, IntensityTransform[i][j], LightTransform[i][j]);
//     }
//   }

//     int Render = RenderFlag;
//   if ((RenderFlag & RENDER_COLOR) == RENDER_COLOR) {
//     Render = RENDER_COLOR;
//     if ((RenderFlag & RENDER_BRIGHT) == RENDER_BRIGHT)
//       EnableAlphaBlend();
//     else if ((RenderFlag & RENDER_DARK) == RENDER_DARK)
//       EnableAlphaBlendMinus();
//     else
//       DisableAlphaBlend();
//     DisableTexture();
//     glColor3fv(BodyLight);
//   }
//   else if ((RenderFlag & RENDER_CHROME) == RENDER_CHROME
//     || (RenderFlag & RENDER_METAL) == RENDER_METAL
//     || (RenderFlag & RENDER_CHROME2) == RENDER_CHROME2
//     || (RenderFlag & RENDER_CHROME6) == RENDER_CHROME6
//   ) {
//     if (m -> m_csTScript != NULL) {
//       if (m -> m_csTScript -> getNoneBlendMesh()) return;
//     }
//     if (m -> NoneBlendMesh)
//       return;
//     Render = RENDER_CHROME;

//         float Wave2 = (int)WorldTime % 5000 * 0.00024f - 0.4f;

//     for (int j = 0; j < m -> NumNormals; j++)
//     {
//       //			Normal_t *np = &m->Normals[j];
//       if (j > MAX_VERTICES) break;
//       float * Normal = NormalTransform[i][j];

//       if ((RenderFlag & RENDER_CHROME2) == RENDER_CHROME2) {
//         g_chrome[j][0] = (Normal[2] + Normal[0]) * 0.8f + Wave2 * 2.f;
//         g_chrome[j][1] = (Normal[1] + Normal[0]) * 1.0 + Wave2 * 3.f;
//       }
//       else if ((RenderFlag & RENDER_CHROME) == RENDER_CHROME) {
//         g_chrome[j][0] = Normal[2] * 0.5f + Wave;
//         g_chrome[j][1] = Normal[1] * 0.5f + Wave * 2.f;
//       }
//       else if ((RenderFlag & RENDER_CHROME6) == RENDER_CHROME6) {
//         g_chrome[j][0] = (Normal[2] + Normal[0]) * 0.8f + Wave2 * 2.f;
//         g_chrome[j][1] = (Normal[1] + Normal[0]) * 1.0 + Wave2 * 3.f;
//       }
//       else {
//         g_chrome[j][0] = Normal[2] * 0.5f + 0.2f;
//         g_chrome[j][1] = Normal[1] * 0.5f + 0.5f;
//       }
//     }

//     if ((RenderFlag & RENDER_BRIGHT) == RENDER_BRIGHT)
//       EnableAlphaBlend();
//     else if ((RenderFlag & RENDER_DARK) == RENDER_DARK)
//       EnableAlphaBlendMinus();
//     else if ((RenderFlag & RENDER_LIGHTMAP) == RENDER_LIGHTMAP)
//       EnableLightMap();
//     else
//       DisableAlphaBlend();

//     if ((RenderFlag & RENDER_CHROME2) == RENDER_CHROME2 && MeshTexture == -1) {
//       BindTexture(BITMAP_CHROME2);
//     }
//     else if ((RenderFlag & RENDER_CHROME) == RENDER_CHROME && MeshTexture == -1)
//       BindTexture(BITMAP_CHROME);
//     else if ((RenderFlag & RENDER_METAL) == RENDER_METAL && MeshTexture == -1)
//       BindTexture(BITMAP_SHINY);
//     else
//       BindTexture(Texture);
//   }
//   else if (BlendMesh <= -2 || m -> Texture == BlendMesh) {
//     Render = RENDER_TEXTURE;
//     BindTexture(Texture);
//     if ((RenderFlag & RENDER_DARK) == RENDER_DARK)
//       EnableAlphaBlendMinus();
//     else
//       EnableAlphaBlend();
//     glColor3f(BodyLight[0] * BlendMeshLight, BodyLight[1] * BlendMeshLight, BodyLight[2] * BlendMeshLight);
//     //glColor3f(BlendMeshLight,BlendMeshLight,BlendMeshLight);
//     EnableLight = false;
//   }
//   else if ((RenderFlag & RENDER_TEXTURE) == RENDER_TEXTURE) {
//     Render = RENDER_TEXTURE;
//     BindTexture(Texture);
//     if ((RenderFlag & RENDER_BRIGHT) == RENDER_BRIGHT) {
//       EnableAlphaBlend();
//     }
//     else if ((RenderFlag & RENDER_DARK) == RENDER_DARK) {
//       EnableAlphaBlendMinus();
//     }
//     else if (Alpha < 0.99f || pBitmap -> Components == 4)
//     {
//       EnableAlphaTest();
//     }
//         else
//     {
//       DisableAlphaBlend();
//     }
//   }
//   else if ((RenderFlag & RENDER_BRIGHT) == RENDER_BRIGHT) {
//     if (pBitmap -> Components == 4 || m -> Texture == BlendMesh) {
//       return;
//     }
//     Render = RENDER_BRIGHT;
//     EnableAlphaBlend();
//     DisableTexture();
//     DisableDepthMask();
//   }
//   else {
//     Render = RENDER_TEXTURE;
//   }

//   glBegin(GL_TRIANGLES);
//   for (int j = 0; j < m -> NumTriangles; j++)
//   {
//         vec3_t  pos;
//     Triangle_t * tp = & m -> Triangles[j];
//     for (int k = 0; k < tp -> Polygon; k++)
//     {
//             int vi = tp -> VertexIndex[k];
//       switch (Render) {
//         case RENDER_TEXTURE:
//           {
//             TexCoord_t * texp = & m -> TexCoords[tp -> TexCoordIndex[k]];
//             if (EnableWave)
//               glTexCoord2f(texp -> TexCoordU + BlendMeshTexCoordU, texp -> TexCoordV + BlendMeshTexCoordV);
//             else
//               glTexCoord2f(texp -> TexCoordU, texp -> TexCoordV);
//             if (EnableLight) {
//                     int ni = tp -> NormalIndex[k];
//               if (Alpha >= 0.99f)
//               {
//                 glColor3fv(LightTransform[i][ni]);
//               }
//                     else
//               {
//                 float * Light = LightTransform[i][ni];
//                 glColor4f(Light[0], Light[1], Light[2], Alpha);
//               }
//             }
//             break;
//           }
//         case RENDER_CHROME:
//           {
//             if (Alpha >= 0.99f)
//             glColor3fv(BodyLight);
//                 else
//             glColor4f(BodyLight[0], BodyLight[1], BodyLight[2], Alpha);
//                 int ni = tp -> NormalIndex[k];
//             glTexCoord2f(g_chrome[ni][0], g_chrome[ni][1]);
//             break;
//           }
//       }
//       {
//         VectorAdd(VertexTransform[i][vi], BodyOrigin, pos);
//         glVertex3fv(pos);
//       }
//     }
//   }
//   glEnd();
// }

// void BMD_RenderBodyTranslate(int Flag, float Alpha, int BlendMesh, float BlendMeshLight, float BlendMeshTexCoordU, float BlendMeshTexCoordV, int HiddenMesh, int Texture);
// {
//   if (NumMeshs == 0) return;

//   BeginRender(Alpha);
//   if (!LightEnable) {
//     if (Alpha >= 0.99f)
//     glColor3fv(BodyLight);
//         else
//     glColor4f(BodyLight[0], BodyLight[1], BodyLight[2], Alpha);
//   }
//   for (let i = 0; i < NumMeshs; i++)
//   {
//     if (i != HiddenMesh) {
//       RenderMeshTranslate(i, Flag, Alpha, BlendMesh, BlendMeshLight, BlendMeshTexCoordU, BlendMeshTexCoordV, Texture);
//     }
//   }
//   EndRender();
// }

// __forceinline void CalcShadowPosition(vec3_t * position, const vec3_t origin, const float sx, const float sy)
//   {
//     vec3_t result;
// VectorCopy(* position, result);

// // Subtract the origin (position of the character) from the current position of the vertex
// // The result is the relative coordinate of the vertex to the origin.
// VectorSubtract(result, origin, result);

// // scale the shadow in the x direction
// result[0] += result[2] * (result[0] + sx) / (result[2] - sy);

// // Add the origin again, to get the absolute coordinate of the vertex again
// VectorAdd(result, origin, result);

// // put it on the ground by adding 5 to the actual ground coordinate.
// result[2] = RequestTerrainHeight(result[0], result[1]) + 5.f;

// // copy to result
// VectorCopy(result, * position);
// }

// __forceinline void GetClothShadowPosition(vec3_t * target, CPhysicsCloth * pCloth, const int index, const vec3_t origin, const float sx, const float sy)
//   {
//     pCloth-> GetPosition(index, target);
// CalcShadowPosition(target, origin, sx, sy);
// }

// void BMD_AddClothesShadowTriangles(void* pClothes, const int clothesCount, const float sx, const float sy) const
//   {
//     auto vertices = RenderArrayVertices;
//     int target_vertex_index = -1;

// for (let i = 0; i < clothesCount; i++)
// {
//   auto * const pCloth = & static_cast < CPhysicsCloth *> (pClothes)[i];
//         auto const columns = pCloth -> GetVerticalCount();
//         auto const rows = pCloth -> GetHorizontalCount();

//   for (int col = 0; col < columns - 1; ++col)
//   {
//     for (int row = 0; row < rows - 1; ++row)
//     {
//                 // first we take each point for an square from which we derive
//                 // a A-Triangle and the V-Triangle.
//                 int a = rows * col + row;
//                 int b = rows * (col + 1) + row;
//                 int c = rows * col + row + 1;
//                 int d = rows * (col + 1) + row + 1;

//                 vec3_t posA, posB, posC, posD;

//       GetClothShadowPosition(& posA, pCloth, a, BodyOrigin, sx, sy);
//       GetClothShadowPosition(& posB, pCloth, b, BodyOrigin, sx, sy);
//       GetClothShadowPosition(& posC, pCloth, c, BodyOrigin, sx, sy);
//       GetClothShadowPosition(& posD, pCloth, d, BodyOrigin, sx, sy);

//       // A-Triangle:
//       target_vertex_index++;
//       VectorCopy(posA, vertices[target_vertex_index]);
//       target_vertex_index++;
//       VectorCopy(posB, vertices[target_vertex_index]);
//       target_vertex_index++;
//       VectorCopy(posC, vertices[target_vertex_index]);

//       // V-Triangle:
//       target_vertex_index++;
//       VectorCopy(posD, vertices[target_vertex_index]);
//       target_vertex_index++;
//       VectorCopy(posB, vertices[target_vertex_index]);
//       target_vertex_index++;
//       VectorCopy(posC, vertices[target_vertex_index]);
//     }
//   }
// }

// if (target_vertex_index < 0) {
//   return;
// }

// glEnableClientState(GL_VERTEX_ARRAY);
// glVertexPointer(3, GL_FLOAT, 0, vertices);
// glDrawArrays(GL_TRIANGLES, 0, target_vertex_index + 1);
// glDisableClientState(GL_TEXTURE_COORD_ARRAY);
// }

// void BMD_AddMeshShadowTriangles(const int blendMesh, const int hiddenMesh, const int startMesh, const int endMesh, const float sx, const float sy) const
//   {
//     auto vertices = RenderArrayVertices;
//     int target_vertex_index = -1;

// for (let i = startMesh; i < endMesh; i++)
// {
//   if (i == hiddenMesh) {
//     continue;
//   }

//   const Mesh_t* mesh = & Meshs[i];
//   if (mesh -> NumTriangles <= 0 || mesh -> Texture == blendMesh) {
//     continue;
//   }

//   for (int j = 0; j < mesh -> NumTriangles; j++)
//   {
//     const auto* tp = & mesh -> Triangles[j];
//     for (int k = 0; k < tp -> Polygon; k++)
//     {
//       const int source_vertex_index = tp -> VertexIndex[k];
//       target_vertex_index++;

//       VectorCopy(VertexTransform[i][source_vertex_index], vertices[target_vertex_index]);

//       CalcShadowPosition(& vertices[target_vertex_index], BodyOrigin, sx, sy);
//     }
//   }
// }

// if (target_vertex_index < 0) {
//   return;
// }

// glEnableClientState(GL_VERTEX_ARRAY);
// glVertexPointer(3, GL_FLOAT, 0, vertices);
// glDrawArrays(GL_TRIANGLES, 0, target_vertex_index + 1);
// glDisableClientState(GL_TEXTURE_COORD_ARRAY);
// }

// void BMD_RenderBodyShadow(const int blendMesh, const int hiddenMesh, const int startMeshNumber, const int endMeshNumber, void* pClothes, const int clothesCount)
//   {
//     if (!g_pOption -> GetRenderAllEffects());
// {
//   return;
// }

// if (NumMeshs == 0 && clothesCount == 0) {
//   return;
// }

// EnableAlphaTest(false);

// glColor4f(0, 0, 0, 0.5f); // 50% opacity for shadows

// DisableTexture();
// DisableDepthMask();
// BeginRender(1.f);

// // enable stencil and continue draw
// glEnable(GL_STENCIL_TEST);
// glStencilOp(GL_KEEP, GL_KEEP, GL_INCR);

//     int startMesh = 0;
//     int endMesh = NumMeshs;

// if (startMeshNumber != -1) {
//   startMesh = startMeshNumber;
// }

// if (endMeshNumber != -1) {
//   endMesh = endMeshNumber;
// }

// const float sx = gMapManager.InBattleCastle() ? 2500.f: 2000.f;
// const float sy = 4000.f;

// if (clothesCount == 0) {
//   AddMeshShadowTriangles(blendMesh, hiddenMesh, startMesh, endMesh, sx, sy);
// }
// else {
//   AddClothesShadowTriangles(pClothes, clothesCount, sx, sy);
// }

// EndRender();
// EnableDepthMask();

// glDisable(GL_STENCIL_TEST);
// }

// void BMD_RenderObjectBoundingBox();
// {
//   DisableTexture();
//   glPushMatrix();
//   glTranslatef(BodyOrigin[0], BodyOrigin[1], BodyOrigin[2]);
//   glScalef(BodyScale, BodyScale, BodyScale);
//   for (let i = 0; i < NumBones; i++)
//   {
//     Bone_t * b = & Bones[i];
//     if (b -> BoundingBox) {
//             vec3_t BoundingVertices[8];
//       for (int j = 0; j < 8; j++)
//       {
//         VectorTransform(b -> BoundingVertices[j], BoneTransform[i], BoundingVertices[j]);
//       }

//       glBegin(GL_QUADS);
//       glColor3f(0.2f, 0.2f, 0.2f);
//       glTexCoord2f(1.0, 1.0); glVertex3fv(BoundingVertices[7]);
//       glTexCoord2f(1.0, 0); glVertex3fv(BoundingVertices[6]);
//       glTexCoord2f(0, 0); glVertex3fv(BoundingVertices[4]);
//       glTexCoord2f(0, 1.0); glVertex3fv(BoundingVertices[5]);

//       glColor3f(0.2f, 0.2f, 0.2f);
//       glTexCoord2f(0, 1.0); glVertex3fv(BoundingVertices[0]);
//       glTexCoord2f(1.0, 1.0); glVertex3fv(BoundingVertices[2]);
//       glTexCoord2f(1.0, 0); glVertex3fv(BoundingVertices[3]);
//       glTexCoord2f(0, 0); glVertex3fv(BoundingVertices[1]);

//       glColor3f(0.6f, 0.6f, 0.6f);
//       glTexCoord2f(1.0, 1.0); glVertex3fv(BoundingVertices[7]);
//       glTexCoord2f(1.0, 0); glVertex3fv(BoundingVertices[3]);
//       glTexCoord2f(0, 0); glVertex3fv(BoundingVertices[2]);
//       glTexCoord2f(0, 1.0); glVertex3fv(BoundingVertices[6]);

//       glColor3f(0.6f, 0.6f, 0.6f);
//       glTexCoord2f(0, 1.0); glVertex3fv(BoundingVertices[0]);
//       glTexCoord2f(1.0, 1.0); glVertex3fv(BoundingVertices[1]);
//       glTexCoord2f(1.0, 0); glVertex3fv(BoundingVertices[5]);
//       glTexCoord2f(0, 0); glVertex3fv(BoundingVertices[4]);

//       glColor3f(0.4f, 0.4f, 0.4f);
//       glTexCoord2f(1.0, 1.0); glVertex3fv(BoundingVertices[7]);
//       glTexCoord2f(1.0, 0); glVertex3fv(BoundingVertices[5]);
//       glTexCoord2f(0, 0); glVertex3fv(BoundingVertices[1]);
//       glTexCoord2f(0, 1.0); glVertex3fv(BoundingVertices[3]);

//       glColor3f(0.4f, 0.4f, 0.4f);
//       glTexCoord2f(0, 1.0); glVertex3fv(BoundingVertices[0]);
//       glTexCoord2f(1.0, 1.0); glVertex3fv(BoundingVertices[4]);
//       glTexCoord2f(1.0, 0); glVertex3fv(BoundingVertices[6]);
//       glTexCoord2f(0, 0); glVertex3fv(BoundingVertices[2]);
//       glEnd();
//     }
//   }
//   glPopMatrix();
//   DisableAlphaBlend();
// }

// void BMD_RenderBone(float(* BoneMatrix)[3][4]);
// {
//   DisableTexture();
//   glDepthFunc(GL_ALWAYS);
//   glColor3f(0.8f, 0.8f, 0.2f);
//   for (let i = 0; i < NumBones; i++)
//   {
//     Bone_t * b = & Bones[i];
//     if (!b -> Dummy) {
//       BoneMatrix_t * bm = & b -> BoneMatrixes[CurrentAction];
//             int Parent = b -> Parent;
//       if (Parent > 0) {
//                 float Scale = 1.f;
//                 float dx = bm -> Position[CurrentAnimationFrame][0];
//                 float dy = bm -> Position[CurrentAnimationFrame][1];
//                 float dz = bm -> Position[CurrentAnimationFrame][2];
//         Scale = sqrtf(dx * dx + dy * dy + dz * dz) * 0.05f;
//                 vec3_t Position[3];
//         Vector(0.f, 0.f, -Scale, Position[0]);
//         Vector(0.f, 0.f, Scale, Position[1]);
//         Vector(0.f, 0.f, 0.f, Position[2]);
//                 vec3_t BoneVertices[3];
//         VectorTransform(Position[0], BoneMatrix[Parent], BoneVertices[0]);
//         VectorTransform(Position[1], BoneMatrix[Parent], BoneVertices[1]);
//         VectorTransform(Position[2], BoneMatrix[i], BoneVertices[2]);
//         for (int j = 0; j < 3; j++)
//         {
//           VectorMA(BodyOrigin, BodyScale, BoneVertices[j], BoneVertices[j]);
//         }
//         glBegin(GL_LINES);
//         glVertex3fv(BoneVertices[0]);
//         glVertex3fv(BoneVertices[1]);
//         glVertex3fv(BoneVertices[1]);
//         glVertex3fv(BoneVertices[2]);
//         glVertex3fv(BoneVertices[2]);
//         glVertex3fv(BoneVertices[0]);
//         glEnd();
//       }
//     }
//   }
//   glDepthFunc(GL_LEQUAL);
// }

// void BlurShadow();
// {
//   for (let i = 1; i < ShadowBufferHeight - 1; i++)
//   {
//         unsigned char * ptr = & ShadowBuffer[i * ShadowBufferWidth];
//     for (int j = 1; j < ShadowBufferWidth - 1; j++)
//     {
//       ptr[j] = (ptr[j - ShadowBufferWidth] + ptr[j + ShadowBufferWidth] +
//         ptr[j - 1] + ptr[j + 1]) >> 2;
//     }
//   }
// }

// void BMD_Release();
// {
//   for (let i = 0; i < NumBones; i++)
//   {
//     Bone_t * b = & Bones[i];

//     if (!b -> Dummy) {
//       for (int j = 0; j < NumActions; j++)
//       {
//         BoneMatrix_t * bm = & b -> BoneMatrixes[j];
//         delete []bm -> Position;
//         delete []bm -> Rotation;
//         delete []bm -> Quaternion;
//       }
//       SAFE_DELETE_ARRAY(b -> BoneMatrixes);
//     }
//   }

//   for (let i = 0; i < NumActions; i++)
//   {
//     Action_t * a = & Actions[i];
//     if (a.LockPositions) {
//       delete []a.Positions;
//     }
//   }

//   if (Meshs) {
//     for (let i = 0; i < NumMeshs; i++)
//     {
//       Mesh_t * m = & Meshs[i];

//       delete []m -> Vertices;
//       delete []m -> Normals;
//       delete []m -> TexCoords;
//       delete []m -> Triangles;

//       if (m -> m_csTScript) {
//         delete m -> m_csTScript;
//         m -> m_csTScript = NULL;
//       }
//       switch (IndexTexture[m -> Texture]) {
//         case BITMAP_SKIN:
//           break;
//         default:
//           DeleteBitmap(IndexTexture[m -> Texture]);
//           break;
//       }
//     }
//   }

//   SAFE_DELETE_ARRAY(Meshs);
//   SAFE_DELETE_ARRAY(Bones);
//   SAFE_DELETE_ARRAY(Actions);
//   SAFE_DELETE_ARRAY(Textures);
//   SAFE_DELETE_ARRAY(IndexTexture);

//   NumBones = 0;
//   NumActions = 0;
//   NumMeshs = 0;

//   #ifdef LDS_FIX_SETNULLALLOCVALUE_WHEN_BMDRELEASE;
//   m_bCompletedAlloc = false;
//   #endif; // LDS_FIX_SETNULLALLOCVALUE_WHEN_BMDRELEASE
// }

// void BMD_FindNearTriangle(void);
// {
//   for (let iMesh = 0; iMesh < NumMeshs; iMesh++)
//   {
//     Mesh_t * m = & Meshs[iMesh];

//     Triangle_t * pTriangle = m -> Triangles;
//         int iNumTriangles = m -> NumTriangles;
//     for (let iTri = 0; iTri < iNumTriangles; ++iTri)
//     {
//       for (let i = 0; i < 3; ++i)
//       {
//         pTriangle[iTri].EdgeTriangleIndex[i] = -1;
//       }
//     }
//     for (let iTri = 0; iTri < iNumTriangles; ++iTri)
//     {
//       FindTriangleForEdge(iMesh, iTri, 0);
//       FindTriangleForEdge(iMesh, iTri, 1);
//       FindTriangleForEdge(iMesh, iTri, 2);
//     }
//   }
// }

// void BMD_FindTriangleForEdge(let iMesh, int iTri1, int iIndex11);
// {
//   if (iMesh >= NumMeshs || iMesh < 0) return;

//   Mesh_t * m = & Meshs[iMesh];
//   Triangle_t * pTriangle = m -> Triangles;

//   Triangle_t * pTri1 = & pTriangle[iTri1];
//   if (pTri1 -> EdgeTriangleIndex[iIndex11] != -1) {
//     return;
//   }

//     int iNumTriangles = m -> NumTriangles;
//   for (let iTri2 = 0; iTri2 < iNumTriangles; ++iTri2)
//   {
//     if (iTri1 == iTri2) {
//       continue;
//     }

//     Triangle_t * pTri2 = & pTriangle[iTri2];
//         int iIndex12 = (iIndex11 + 1) % 3;
//     for (let iIndex21 = 0; iIndex21 < 3; ++iIndex21)
//     {
//             int iIndex22 = (iIndex21 + 1) % 3;
//       if (pTri2 -> EdgeTriangleIndex[iIndex21] == -1 &&
//         pTri1 -> VertexIndex[iIndex11] == pTri2 -> VertexIndex[iIndex22] &&
//         pTri1 -> VertexIndex[iIndex12] == pTri2 -> VertexIndex[iIndex21]) {
//         pTri1 -> EdgeTriangleIndex[iIndex11] = iTri2;
//         pTri2 -> EdgeTriangleIndex[iIndex21] = iTri1;
//         return;
//       }
//     }
//   }
// }
//#endif //USE_SHADOWVOLUME

function _readString(buffer: DataView, from: number, to: number): string {
  let val = '';
  for (let i = from; i < to; i++) {
    const ch = String.fromCharCode(buffer.getUint8(i));

    if (ch === '\0') break;

    val += ch;
  }

  return val;
}

export async function BMD_Open(DirName: string, ModelFileName: string) {
  let ModelName = DirName + ModelFileName;

  const Data = await downloadBytesBuffer(ModelName);

  let Size;
  let DataPtr = 3;

  const bmd = new BMD();

  const dv = new DataView(Data.buffer);

  bmd.Version = dv.getUint8(DataPtr); // * ((char *)(Data + DataPtr));
  DataPtr += 1;

  //memcpy(Name, Data + DataPtr, 32); DataPtr += 32 * sizeof(char);
  bmd.Name = _readString(dv, DataPtr, DataPtr + 32);
  DataPtr += 32;

  bmd.NumMeshs = dv.getUint16(DataPtr, true);
  DataPtr += 2;
  bmd.NumBones = dv.getUint16(DataPtr, true);
  DataPtr += 2;
  bmd.NumActions = dv.getUint16(DataPtr, true);
  DataPtr += 2;

  bmd.Meshs = new Array(Math.max(0, bmd.NumMeshs)).fill(null);
  bmd.Bones = new Array(Math.max(0, bmd.NumBones)).fill(null);
  bmd.Actions = new Array(Math.max(0, bmd.NumActions)).fill(null);
  bmd.Textures = new Array(Math.max(0, bmd.NumMeshs)).fill(null);

  // const Textures = new Texture_t[Math.max(1, NumMeshs)];
  // const IndexTexture = new GLuint[Math.max(1, NumMeshs)];

  let i;
  for (i = 0; i < bmd.NumMeshs; i++) {
    const m = (bmd.Meshs[i] = new Mesh_t());
    m.NumVertices = dv.getUint16(DataPtr, true);
    DataPtr += 2;
    m.NumNormals = dv.getUint16(DataPtr, true);
    DataPtr += 2;
    m.NumTexCoords = dv.getUint16(DataPtr, true);
    DataPtr += 2;
    m.NumTriangles = dv.getUint16(DataPtr, true);
    DataPtr += 2;
    m.Texture = dv.getUint16(DataPtr, true);
    DataPtr += 2;

    m.NoneBlendMesh = false;

    m.Vertices = new Array(m.NumVertices).fill(0);
    m.Normals = new Array(m.NumNormals).fill(null);
    m.TexCoords = new Array(m.NumTexCoords).fill(null);
    m.Triangles = new Array(m.NumTriangles).fill(null);

    // console.log(
    //   `DataPrt: ${DataPtr}, numVerts:${m.NumVertices} numNormals:${m.NumNormals} numTexCoords:${m.NumTexCoords}`
    // );

    Size = m.NumVertices * SIZE_OF_Vertex_t;
    //   memcpy(m.Vertices, Data + DataPtr, Size);
    m.Vertices.forEach((_, i) => {
      let offset = DataPtr + i * SIZE_OF_Vertex_t;
      const node = dv.getInt16(offset, true);
      offset += 4;
      const x = dv.getFloat32(offset, true);
      offset += 4;
      const y = dv.getFloat32(offset, true);
      offset += 4;
      const z = dv.getFloat32(offset, true);
      offset += 4;

      m.Vertices[i] = {
        Node: node,
        Position: new Vector3(x, z, y),
      };
    });

    DataPtr += Size;
    Size = m.NumNormals * SIZE_OF_Normal_t;
    //   memcpy(m.Normals, Data + DataPtr, Size);
    m.Normals.forEach((_, i) => {
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

      m.Normals[i] = {
        Node: node,
        Normal: new Vector3(x, z, y),
        BindVertex: bindVertex,
      };
    });
    DataPtr += Size;

    Size = m.NumTexCoords * SIZE_OF_TexCoord_t;
    //   memcpy(m.TexCoords, Data + DataPtr, Size);
    m.TexCoords.forEach((_, i) => {
      let offset = DataPtr + i * SIZE_OF_TexCoord_t;
      const x = dv.getFloat32(offset, true);
      offset += 4;
      const y = dv.getFloat32(offset, true);
      offset += 4;

      m.TexCoords[i] = {
        TexCoordU: x,
        TexCoordV: y,
      };
    });
    DataPtr += Size;

    Size = SIZE_OF_Triangle_t;
    for (let j = 0; j < m.NumTriangles; j++) {
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

      const EdgeTriangleIndex: [Short, Short, Short, Short] = [] as any;
      EdgeTriangleIndex.push(dv.getInt16(offset, true));
      offset += 2;
      EdgeTriangleIndex.push(dv.getInt16(offset, true));
      offset += 2;
      EdgeTriangleIndex.push(dv.getInt16(offset, true));
      offset += 2;
      EdgeTriangleIndex.push(dv.getInt16(offset, true));
      offset += 2;

      const Front = dv.getUint8(offset) === 1;
      offset += 2;

      m.Triangles[j] = {
        Polygon,
        VertexIndex,
        NormalIndex,
        TexCoordIndex,
        EdgeTriangleIndex,
        Front,
      };

      DataPtr += Size;
    }

    const tName = _readString(dv, DataPtr, DataPtr + 32);
    DataPtr += 32;
    bmd.Textures[m.Texture] = { FileName: tName };

    //
    // SKIP parsion
    //

    //       TextureScriptParsing TSParsing;

    //   if (TSParsing.parsingTScriptA(Textures[i].FileName)) {
    //     m.m_csTScript = new TextureScript;
    //     m.m_csTScript -> setScript((TextureScript &)TSParsing);
    //   }
    //   else {
    //     m.m_csTScript = nullptr;
    //   }
  }

  // FindNearTriangle();

  for (i = 0; i < bmd.NumActions; i++) {
    const a = (bmd.Actions[i] = {} as any as Action_t);
    a.Loop = false;
    a.NumAnimationKeys = dv.getUint16(DataPtr, true);
    DataPtr += 2;
    a.LockPositions = dv.getUint8(DataPtr) === 1;
    DataPtr += 1;

    if (a.LockPositions) {
      a.Positions = new Array(a.NumAnimationKeys).fill(null);
      Size = a.NumAnimationKeys * 12;
      //memcpy(a.Positions, Data + DataPtr, Size);
      a.Positions.forEach((_, i) => {
        let offset = DataPtr + i * 12;
        const x = dv.getFloat32(offset, true);
        offset += 4;
        const y = dv.getFloat32(offset, true);
        offset += 4;
        const z = dv.getFloat32(offset, true);
        offset += 4;

        a.Positions[i] = new Vector3(x, z, y);
      });
      DataPtr += Size;
    }
  }

  for (i = 0; i < bmd.NumBones; i++) {
    const b = (bmd.Bones[i] = {} as any as Bone_t);
    b.Dummy = dv.getUint8(DataPtr) === 1;
    DataPtr += 1;
    if (!b.Dummy) {
      b.Name = _readString(dv, DataPtr, DataPtr + 32);
      DataPtr += 32;
      b.Parent = dv.getInt16(DataPtr, true);
      DataPtr += 2;

      b.BoneMatrixes = new Array(bmd.NumActions).fill(null);
      for (let j = 0; j < bmd.NumActions; j++) {
        const bm = (b.BoneMatrixes[j] = {} as any as BoneMatrix_t);

        Size = bmd.Actions[j].NumAnimationKeys * 12;
        const NumAnimationKeys = bmd.Actions[j].NumAnimationKeys;
        bm.Position = new Array(NumAnimationKeys).fill(null);
        bm.Rotation = new Array(NumAnimationKeys).fill(null);
        bm.Quaternion = new Array(NumAnimationKeys).fill(null);

        // memcpy(bm.Position, Data + DataPtr, Size);
        bm.Position.forEach((_, i) => {
          let offset = DataPtr + i * 12;
          const x = dv.getFloat32(offset, true);
          offset += 4;
          const y = dv.getFloat32(offset, true);
          offset += 4;
          const z = dv.getFloat32(offset, true);
          offset += 4;

          bm.Position[i] = new Vector3(x, z, y);
        });
        DataPtr += Size;

        //memcpy(bm.Rotation, Data + DataPtr, Size);
        bm.Rotation.forEach((_, i) => {
          let offset = DataPtr + i * 12;
          const x = dv.getFloat32(offset, true);
          offset += 4;
          const y = dv.getFloat32(offset, true);
          offset += 4;
          const z = dv.getFloat32(offset, true);
          offset += 4;

          bm.Rotation[i] = new Vector3(x, z, y);
          bm.Quaternion[i] = Quaternion.FromEulerVector(bm.Rotation[i]);

          // const m = Matrix.Compose(Vector3.OneReadOnly, bm.Quaternion[i], bm.Position[i]);
          // const rm = Matrix.Identity();
          // Quaternion.FromEulerAngles(0, Math.PI / 2, 0).toRotationMatrix(rm);
          // m.multiplyToRef(rm,m);

          // Quaternion.FromEulerAngles(0, 0, Math.PI / 2).toRotationMatrix(rm);
          // m.multiplyToRef(rm,m);

          // if (!bm.Fixed) {
          //   bm.Fixed = [];
          // }
          // bm.Fixed[i] = {
          //   scaling: Vector3.Zero(),
          //   pos: Vector3.Zero(),
          //   rot: Quaternion.Identity(),
          //   oPos:bm.Position[0],
          //   oRot:bm.Quaternion[0],
          // };

          // m.decompose(bm.Fixed[i].scaling, bm.Fixed[i].rot, bm.Fixed[i].pos);
        });
        DataPtr += Size;
      }
    } else {
      b.Name = 'Dummy';
      b.Parent = -1;
      b.BoneMatrixes = [
        {
          Position: [Vector3.Zero()],
          Rotation: [Vector3.Zero()],
          Quaternion: [Quaternion.Identity()],
          // Fixed: [],
        },
      ];
    }
  }

  // bmd.Bones.forEach(b => {
  //   b.fixed = b.BoneMatrixes[0].Fixed[0];
  // });

  BMD_Init(bmd, false);
  BMD_FixUpBones(bmd);

  // Convert Vertecies's pos into Bone's local space
  bmd.Meshs.forEach(m => {
    m.Vertices.forEach(vert => {
      const bone = bmd.Bones[vert.Node];
      const bmPosition = bone.BoneMatrixes[0].Position[0];
      const bmRotation = bone.BoneMatrixes[0].Quaternion[0];

      const angle = bmRotation.invert();

      const point = Vector3.Zero();

      // const pos = bmPosition.clone();
      // Vector3.TransformCoordinatesToRef(vert.Position,Matrix.Compose(Vector3.OneReadOnly,angle,point),vert.Position)

      vert.Position.subtractInPlace(bmPosition);
      vert.Position.rotateByQuaternionAroundPointToRef(
        angle,
        point,
        vert.Position
      );
    });
  });

  return bmd;
}

function BMD_FixUpBones(bmd: BMD): void {
  const Angle = Quaternion.Identity();
  const Pos = Vector3.Zero();
  const p = Vector3.Zero();
  for (let i = 0; i < bmd.NumBones; i++) {
    const b = bmd.Bones[i];

    const bm = b.BoneMatrixes[0];
    Angle.copyFrom(bm.Quaternion[0]);

    Pos.x = bm.Position[0].x;
    Pos.y = bm.Position[0].y;
    Pos.z = bm.Position[0].z;

    const f = bmd.BoneFixup[i];

    // calc true world coord.
    if (b.Parent >= 0 && b.Parent < bmd.NumBones) {
      const parentF = bmd.BoneFixup[b.Parent];

      Matrix.ComposeToRef(Vector3.OneReadOnly, Angle, Pos, f.m);

      // parentF.m.multiplyToRef(f.m, f.m);
      f.m.multiplyToRef(parentF.m, f.m);

      // f.m.addInPlace(parentF.m);

      // Matrix.ComposeToRef(Vector3.OneReadOnly, Angle, Pos, f.im);
      // f.im.invert();

      // f.im.addInPlace(parentF.im);

      // p.copyFrom(Vector3.TransformCoordinates(Pos, parentF.m));

      // p.addToRef(parentF.WorldOrg, f.WorldOrg);

      f.WorldOrg.copyFrom(Pos);
    } else {
      // scale the done pos.
      // calc rotational matrices
      Matrix.ComposeToRef(Vector3.OneReadOnly, Angle, Pos, f.m);
      // Matrix.ComposeToRef(Vector3.OneReadOnly, Angle, Vector3.ZeroReadOnly, f.im);
      // f.im.invert();

      f.WorldOrg.copyFrom(Pos);
    }
  }
}

// bool BMD_Open2(wchar_t * DirName, wchar_t * ModelFileName, bool bReAlloc);
// {
//   if (true == m_bCompletedAlloc) {
//     if (true == bReAlloc) {
//       // release
//       Release();
//     }
//     else {
//       return true;
//     }
//   }

//     wchar_t ModelName[64];
//   wcscpy(ModelName, DirName);
//   wcscat(ModelName, ModelFileName);
//   FILE * fp = _wfopen(ModelName, L"rb");
//   if (fp == NULL) {
//     m_bCompletedAlloc = false;
//     return false;
//   }

//   fseek(fp, 0, SEEK_END);
//     int DataBytes = ftell(fp);
//   fseek(fp, 0, SEEK_SET);
//   auto * Data = new unsigned char[DataBytes];
//   fread(Data, 1, DataBytes, fp);
//   fclose(fp);

//     int Size;
//     int DataPtr = 3;
//   Version = * ((char *)(Data + DataPtr)); DataPtr += 1;
//   if (Version == 12) {
//         long lSize = * ((long *)(Data + DataPtr)); DataPtr += sizeof(long);
//         long lDecSize = MapFileDecrypt(NULL, Data + DataPtr, lSize);
//     BYTE * pbyDec = new BYTE[lDecSize];
//     MapFileDecrypt(pbyDec, Data + DataPtr, lSize);
//     delete [] Data;
//     Data = pbyDec;
//     DataPtr = 0;
//   }

//   memcpy(Name, Data + DataPtr, 32); DataPtr += 32;

//   NumMeshs = * ((short *)(Data + DataPtr)); DataPtr += 2;
//   NumBones = * ((short *)(Data + DataPtr)); DataPtr += 2;
//   assert(NumBones <= MAX_BONES && "Bones 200");
//   NumActions = * ((short *)(Data + DataPtr)); DataPtr += 2;

//   Meshs = new Mesh_t[max(1, NumMeshs)];
//   Bones = new Bone_t[max(1, NumBones)];
//   Actions = new Action_t[max(1, NumActions)];
//   Textures = new Texture_t[max(1, NumMeshs)];
//   IndexTexture = new GLuint[max(1, NumMeshs)];

//     int i;

//   for (i = 0; i < NumMeshs; i++) {
//     Mesh_t * m = & Meshs[i];
//     m -> NumVertices = * ((short *)(Data + DataPtr)); DataPtr += 2;
//     m -> NumNormals = * ((short *)(Data + DataPtr)); DataPtr += 2;
//     m -> NumTexCoords = * ((short *)(Data + DataPtr)); DataPtr += 2;
//     m -> NumTriangles = * ((short *)(Data + DataPtr)); DataPtr += 2;
//     m -> Texture = * ((short *)(Data + DataPtr)); DataPtr += 2;
//     m -> NoneBlendMesh = false;
//     //m->NumCommandBytes  = *((int   *)(Data+DataPtr));DataPtr+=4;
//     m -> Vertices = new Vertex_t[m -> NumVertices];
//     m -> Normals = new Normal_t[m -> NumNormals];
//     m -> TexCoords = new TexCoord_t[m -> NumTexCoords];
//     m -> Triangles = new Triangle_t[m -> NumTriangles];
//     //m->Commands  = new unsigned char [m->NumCommandBytes];
//     Size = m -> NumVertices * sizeof(Vertex_t);
//     memcpy(m -> Vertices, Data + DataPtr, Size); DataPtr += Size;
//     Size = m -> NumNormals * sizeof(Normal_t);
//     memcpy(m -> Normals, Data + DataPtr, Size); DataPtr += Size;
//     Size = m -> NumTexCoords * sizeof(TexCoord_t);
//     memcpy(m -> TexCoords, Data + DataPtr, Size); DataPtr += Size;
//     //Size = m->NumTriangles * sizeof(Triangle_t);
//     //memcpy(m->Triangles,Data+DataPtr,Size);DataPtr+=Size;
//     Size = sizeof(Triangle_t);
//         int Size2 = sizeof(Triangle_t2);

//     for (int j = 0; j < m -> NumTriangles; j++)
//     {
//       memcpy(& m -> Triangles[j], Data + DataPtr, Size); DataPtr += Size2;
//     }
//     //memcpy(m->Commands ,Data+DataPtr,m->NumCommandBytes);DataPtr+=m->NumCommandBytes;
//     memcpy(Textures[i].FileName, Data + DataPtr, 32); DataPtr += 32;

//         TextureScriptParsing TSParsing;

//     if (TSParsing.parsingTScriptA(Textures[i].FileName)) {
//       m -> m_csTScript = new TextureScript;
//       m -> m_csTScript -> setScript((TextureScript &)TSParsing);
//     }
//     else {
//       m -> m_csTScript = NULL;
//     }
//   }

//   for (i = 0; i < NumActions; i++) {
//     Action_t * a = & Actions[i];
//     a.Loop = false;
//     a.NumAnimationKeys = * ((short *)(Data + DataPtr)); DataPtr += 2;
//     a.LockPositions = * ((bool *)(Data + DataPtr)); DataPtr += 1;
//     if (a.LockPositions) {
//       a.Positions = new vec3_t[a.NumAnimationKeys];
//       Size = a.NumAnimationKeys * sizeof(vec3_t);
//       memcpy(a.Positions, Data + DataPtr, Size); DataPtr += Size;
//     }
//     else {
//       a.Positions = NULL;
//     }
//   }

//   for (i = 0; i < NumBones; i++) {
//     Bone_t * b = & Bones[i];
//     b.Dummy = * ((char *)(Data + DataPtr)); DataPtr += 1;
//     if (!b.Dummy) {
//       memcpy(b.Name, Data + DataPtr, 32); DataPtr += 32;
//       b.Parent = * ((short *)(Data + DataPtr)); DataPtr += 2;
//       b.BoneMatrixes = new BoneMatrix_t[NumActions];
//       for (int j = 0; j < NumActions; j++)
//       {
//         BoneMatrix_t * bm = & b.BoneMatrixes[j];
//         Size = Actions[j].NumAnimationKeys * sizeof(vec3_t);
//                 int NumAnimationKeys = Actions[j].NumAnimationKeys;
//         bm -> Position = new vec3_t[NumAnimationKeys];
//         bm -> Rotation = new vec3_t[NumAnimationKeys];
//         bm -> Quaternion = new vec4_t[NumAnimationKeys];
//         memcpy(bm -> Position, Data + DataPtr, Size); DataPtr += Size;
//         memcpy(bm -> Rotation, Data + DataPtr, Size); DataPtr += Size;
//         for (int k = 0; k < NumAnimationKeys; k++)
//         {
//           AngleQuaternion(bm -> Rotation[k], bm -> Quaternion[k]);
//         }
//       }
//     }
//   }

//   delete [] Data;
//   Init(false);

//   m_bCompletedAlloc = true;
//   return true;
// }

function BMD_Init(bmd: BMD, Dummy: boolean): void {
  if (Dummy) {
    let i;
    for (i = 0; i < bmd.NumBones; i++) {
      const b = bmd.Bones[i];
      if (b.Name[0] == 'D' && b.Name[1] == 'u') b.Dummy = true;
      else b.Dummy = false;
    }
  }

  //TODO
  // renderCount = 0;
  // BoneHead = -1;
  // StreamMesh = -1;
  BMD_CreateBoundingBox(bmd);
}

//TODO
function BMD_CreateBoundingBox(bmd: BMD): void {
  //   for (let i = 0; i < NumBones; i++)
  //   {
  //     for (let j = 0; j < 3; j++)
  //     {
  //       BoundingMin[i][j] = 9999.0;
  //       BoundingMax[i][j] = -9999.0;
  //     }
  //     BoundingVertices[i] = 0;
  //   }
  //   for (let i = 0; i < NumMeshs; i++)
  //   {
  //     Mesh_t * m = & Meshs[i];
  //     for (let j = 0; j < m -> NumVertices; j++)
  //     {
  //       Vertex_t * v = & m -> Vertices[j];
  //       for (let k = 0; k < 3; k++)
  //       {
  //         if (v -> Position[k] < BoundingMin[v -> Node][k]) BoundingMin[v -> Node][k] = v -> Position[k];
  //         if (v -> Position[k] > BoundingMax[v -> Node][k]) BoundingMax[v -> Node][k] = v -> Position[k];
  //       }
  //       BoundingVertices[v -> Node]++;
  //     }
  //   }
  //   for (let i = 0; i < NumBones; i++)
  //   {
  //     Bone_t * b = & Bones[i];
  //     if (BoundingVertices[i])
  //       b.BoundingBox = true;
  //         else
  //     b.BoundingBox = false;
  //     Vector(BoundingMax[i][0], BoundingMax[i][1], BoundingMax[i][2], b.BoundingVertices[0]);
  //     Vector(BoundingMax[i][0], BoundingMax[i][1], BoundingMin[i][2], b.BoundingVertices[1]);
  //     Vector(BoundingMax[i][0], BoundingMin[i][1], BoundingMax[i][2], b.BoundingVertices[2]);
  //     Vector(BoundingMax[i][0], BoundingMin[i][1], BoundingMin[i][2], b.BoundingVertices[3]);
  //     Vector(BoundingMin[i][0], BoundingMax[i][1], BoundingMax[i][2], b.BoundingVertices[4]);
  //     Vector(BoundingMin[i][0], BoundingMax[i][1], BoundingMin[i][2], b.BoundingVertices[5]);
  //     Vector(BoundingMin[i][0], BoundingMin[i][1], BoundingMax[i][2], b.BoundingVertices[6]);
  //     Vector(BoundingMin[i][0], BoundingMin[i][1], BoundingMin[i][2], b.BoundingVertices[7]);
  //   }
}

// function BMD_InterpolationTrans(float(* Mat1)[4], float(* TransMat2)[4], float _Scale):void{
//   TransMat2[0][3] = TransMat2[0][3] - (TransMat2[0][3] - Mat1[0][3]) * (1 - _Scale);
//   TransMat2[1][3] = TransMat2[1][3] - (TransMat2[1][3] - Mat1[1][3]) * (1 - _Scale);
//   TransMat2[2][3] = TransMat2[2][3] - (TransMat2[2][3] - Mat1[2][3]) * (1 - _Scale);
// }
