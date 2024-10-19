import { ArrayCopy, castToByte, integerDevision } from "../utils";
import { Scalar, Scene, Texture, Vector2, Vector3 } from "../../src/libs/babylon/exports";
import { TERRAIN_SCALE, TERRAIN_SIZE, TERRAIN_SIZE_MASK } from "./consts";
import { ENUM_WORLD } from "../types";
import { TERRAIN_INDEX, TERRAIN_INDEX_REPEAT } from "./utils";

function EnableAlphaTest(DepthMask?: boolean): void { }
function EnableAlphaBlend(): void { }
function DisableAlphaBlend(): void { }

//TODO replace
const gMapManager = {
  InBattleCastle: () => false,
  InBloodCastle: () => false,
  IsPKField: () => false,
} as const;

function IsDoppelGanger2() { return false; }
function IsDoppelGanger3() { return false; }

// C++ rand function
const rand = (): UInt => Math.floor(Math.random() * 32767);

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

function DotProduct(x: Vector3, y: Vector3): Float {
  return Vector3.Dot(x, y);
}

function VectorCopy(a: Vector3, b: Vector3) {
  b.copyFrom(a);
}

let TerrainFlag: Int;
let ActiveTerrain = false;
let TerrainGrassEnable = true;
let DetailLowEnable = false;
let WorldTime = 0;

const createArrayOfVector3 = (count: number): Vector3[] => {
  const array = new Array(TERRAIN_SIZE * TERRAIN_SIZE);
  for (let i = 0; i < count; i++) {
    array[i] = Vector3.Zero();
  }
  return array;
};

const LodBuffer = new Uint8Array(64 * 64);
const TerrainNormal: Vector3[] = createArrayOfVector3(TERRAIN_SIZE * TERRAIN_SIZE);
const PrimaryTerrainLight: Vector3[] = createArrayOfVector3(TERRAIN_SIZE * TERRAIN_SIZE);
const BackTerrainLight: Vector3[] = createArrayOfVector3(TERRAIN_SIZE * TERRAIN_SIZE);
const TerrainLight: Vector3[] = createArrayOfVector3(TERRAIN_SIZE * TERRAIN_SIZE);
const PrimaryTerrainHeight: Float[] = new Array(TERRAIN_SIZE * TERRAIN_SIZE);
const BackTerrainHeight: Float[] = new Array(TERRAIN_SIZE * TERRAIN_SIZE);

const TerrainMappingLayer1 = new Uint8Array(TERRAIN_SIZE * TERRAIN_SIZE);
const TerrainMappingLayer2 = new Uint8Array(TERRAIN_SIZE * TERRAIN_SIZE);

const TerrainMappingAlpha = new Float32Array(TERRAIN_SIZE * TERRAIN_SIZE);
const TerrainGrassTexture = new Float32Array(TERRAIN_SIZE * TERRAIN_SIZE);
const TerrainGrassWind = new Float32Array(TERRAIN_SIZE * TERRAIN_SIZE);

function TEXCOORD(c: Vector2, u: Float, v: Float): void {
  c.x = u;
  c.y = v;
}

// #ifdef ASG_ADD_MAP_KARUTAN
// float			g_fTerrainGrassWind1[TERRAIN_SIZE * TERRAIN_SIZE];
// #endif	// ASG_ADD_MAP_KARUTAN

const TerrainWall = new Uint16Array(TERRAIN_SIZE * TERRAIN_SIZE);//WORD

let SelectXF: Float;
let SelectYF: Float;
let WaterMove: Float;
let CurrentLayer: Int;

const g_fSpecialHeight: Float = 1200;

// #ifdef DYNAMIC_FRUSTRUM
// FrustrumMap_t	g_FrustrumMap;
// #endif //DYNAMIC_FRUSTRUM

const g_fMinHeight: Float = -500.0;
const g_fMaxHeight: Float = 1000.0;

let g_shCameraLevel: number;
let CameraDistanceTarget: Float;
let CameraDistance: Float;

let g_fFrustumRange: Float = -40.0;

function TERRAIN_ATTRIBUTE(x: Float, y: Float): Byte {
  const xf = integerDevision(x / TERRAIN_SCALE + 0.5);
  const yf = integerDevision(y / TERRAIN_SCALE + 0.5);
  return TerrainWall[yf * TERRAIN_SIZE + xf];
}

function InitTerrainMappingLayer(): void {
  for (let i = 0; i < TERRAIN_SIZE * TERRAIN_SIZE; ++i) {
    TerrainMappingLayer1[i] = 0;
    TerrainMappingLayer2[i] = 255;
    TerrainMappingAlpha[i] = 0.0;
    TerrainGrassTexture[i] = (rand() % 4) / 4.0;
    // #ifdef ASG_ADD_MAP_KARUTAN;
    // g_fTerrainGrassWind1[i] = 0;
    // #endif;
  }
}

//TODO
function SaveTerrainAttribute(FileName: String, iMap: Int): boolean {
  // FILE * fp = _wfopen(FileName, L"wb");
  // if (fp == NULL) {
  //       wchar_t Text[256];
  //   swprintf_s(Text, sizeof(Text), L"%s file not found.", FileName);
  //   g_ErrorReport.Write(Text);
  //   g_ErrorReport.Write(L"\r\n");
  //   MessageBox(g_hWnd, Text, NULL, MB_OK);
  //   SendMessage(g_hWnd, WM_DESTROY, 0, 0);
  //   return false;
  // }
  // const BYTE Version = 0;
  // const BYTE Width = 255;
  // const BYTE Height = 255;

  // fwrite(& Version, sizeof(Version), 1, fp);
  // fwrite(& iMap, sizeof(iMap), 1, fp);
  // fwrite(& Width, sizeof(Width), 1, fp);
  // fwrite(& Height, sizeof(Height), 1, fp);

  // // Add Frustum Culling here

  // fwrite(TerrainWall, TERRAIN_SIZE * TERRAIN_SIZE * sizeof(WORD), 1, fp);

  // fclose(fp);
  return true;
}

function AddTerrainAttribute(x: Int, y: Int, att: Byte): void {
  const iIndex = TERRAIN_INDEX(x, y);
  TerrainWall[iIndex] |= att;
}

function SubTerrainAttribute(x: Int, y: Int, att: Byte): void {
  const iIndex = TERRAIN_INDEX(x, y);
  TerrainWall[iIndex] ^= (TerrainWall[iIndex] & att);
}

function AddTerrainAttributeRange(x: Int, y: Int, dx: Int, dy: Int, att: Byte, Add: Byte): void {
  for (let j = 0; j < dy; ++j) {
    for (let i = 0; i < dx; ++i) {
      if (Add) {
        AddTerrainAttribute(x + i, y + j, att);
      }
      else {
        SubTerrainAttribute(x + i, y + j, att);
      }
    }
  }
}

function SetTerrainWaterState(terrainIndex: Int[], state: Int): void {
  if (state === 0) {
    terrainIndex.length = 0;
    for (let i = 0; i < TERRAIN_SIZE * TERRAIN_SIZE; ++i) {
      if ((TerrainWall[i] & TW_WATER) === TW_WATER) {
        TerrainWall[i] = 0;
        terrainIndex.push(i);
      }
    }
  }
  else {
    terrainIndex.forEach(i => (TerrainWall[i] = TW_WATER));
  }
}

function SaveTerrainMapping(FileName: string, iMapNumber: Int): boolean {
  //   FILE * fp = _wfopen(FileName, L"wb");
  //     BYTE Version = 0;
  //   fwrite(& Version, 1, 1, fp);
  //   fwrite(& iMapNumber, 1, 1, fp);
  //   fwrite(TerrainMappingLayer1, TERRAIN_SIZE * TERRAIN_SIZE, 1, fp);
  //   fwrite(TerrainMappingLayer2, TERRAIN_SIZE * TERRAIN_SIZE, 1, fp);
  //   for (let i = 0; i < TERRAIN_SIZE * TERRAIN_SIZE; i++)
  //   {
  //         auto Alpha = (unsigned char) (TerrainMappingAlpha[i] * 255.f);
  //     fwrite(& Alpha, 1, 1, fp);
  //   }
  //   /*
  // #ifndef BATTLE_CASTLE
  //   for(i=0;i<MAX_GROUNDS;i++)
  //   {
  //       GROUND *o = &Grounds[i];
  //       if(o->Live)
  //       {
  //           fwrite(&o->Type ,2,1,fp);
  //           fwrite(&o->x    ,1,1,fp);
  //           fwrite(&o->y    ,1,1,fp);
  //           fwrite(&o->Angle,1,1,fp);
  //       }
  //   }
  // #endif// BATTLE_CASTLE
  // */
  //   fclose(fp);

  //   {
  //     fp = _wfopen(FileName, L"rb");
  //     if (fp == NULL) {
  //       return (false);
  //     }
  //     fseek(fp, 0, SEEK_END);
  //         int EncBytes = ftell(fp);
  //     fseek(fp, 0, SEEK_SET);
  //     auto * EncData = new unsigned char[EncBytes];
  //     fread(EncData, 1, EncBytes, fp);
  //     fclose(fp);

  //         int DataBytes = MapFileEncrypt(NULL, EncData, EncBytes);
  //     auto * Data = new unsigned char[DataBytes];
  //     MapFileEncrypt(Data, EncData, EncBytes);
  //     delete [] EncData;

  //     fp = _wfopen(FileName, L"wb");
  //     fwrite(Data, DataBytes, 1, fp);
  //     fclose(fp);
  //     delete [] Data;
  //   }
  return true;
}

// function CreateTerrainNormal(): void {
//   const v1 = Vector3.Zero();
//   const v2 = Vector3.Zero();
//   const v3 = Vector3.Zero();
//   const v4 = Vector3.Zero();
//   const face_normal = Vector3.Zero();

//   for (let y = 0; y < TERRAIN_SIZE; y++) {
//     for (let x = 0; x < TERRAIN_SIZE; x++) {
//       const Index = TERRAIN_INDEX(x, y);

//       Vector((x * TERRAIN_SCALE), (y * TERRAIN_SCALE), BackTerrainHeight[TERRAIN_INDEX_REPEAT(x, y)], v4);
//       Vector(((x + 1) * TERRAIN_SCALE), (y * TERRAIN_SCALE), BackTerrainHeight[TERRAIN_INDEX_REPEAT((x + 1), y)], v1);
//       Vector(((x + 1) * TERRAIN_SCALE), ((y + 1) * TERRAIN_SCALE), BackTerrainHeight[TERRAIN_INDEX_REPEAT((x + 1), (y + 1))], v2);
//       Vector((x * TERRAIN_SCALE), ((y + 1) * TERRAIN_SCALE), BackTerrainHeight[TERRAIN_INDEX_REPEAT(x, (y + 1))], v3);



//       FaceNormalize(v1, v2, v3, face_normal);
//       VectorAdd(TerrainNormal[Index], face_normal, TerrainNormal[Index]);
//       FaceNormalize(v3, v4, v1, face_normal);
//       VectorAdd(TerrainNormal[Index], face_normal, TerrainNormal[Index]);
//     }
//   }
// }

function CreateTerrainNormal_Part(xi: Int, yi: Int): void {
  // Clamp xi and yi to ensure they are within valid range
  xi = (xi > TERRAIN_SIZE - 4) ? TERRAIN_SIZE - 4 : ((xi < 4) ? 4 : xi);
  yi = (yi > TERRAIN_SIZE - 4) ? TERRAIN_SIZE - 4 : ((yi < 4) ? 4 : yi);

  const v1 = Vector3.Zero();
  const v2 = Vector3.Zero();
  const v3 = Vector3.Zero();
  const v4 = Vector3.Zero();

  for (let y = yi - 4; y < yi + 4; y++) {
    for (let x = xi - 4; x < xi + 4; x++) {
      const Index = TERRAIN_INDEX(x, y);

      Vector((x * TERRAIN_SCALE), (y * TERRAIN_SCALE), BackTerrainHeight[TERRAIN_INDEX_REPEAT(x, y)], v4);
      Vector(((x + 1) * TERRAIN_SCALE), (y * TERRAIN_SCALE), BackTerrainHeight[TERRAIN_INDEX_REPEAT((x + 1), y)], v1);
      Vector(((x + 1) * TERRAIN_SCALE), ((y + 1) * TERRAIN_SCALE), BackTerrainHeight[TERRAIN_INDEX_REPEAT((x + 1), (y + 1))], v2);
      Vector((x * TERRAIN_SCALE), ((y + 1) * TERRAIN_SCALE), BackTerrainHeight[TERRAIN_INDEX_REPEAT(x, (y + 1))], v3);

      const face_normal = Vector3.Zero();

      FaceNormalize(v1, v2, v3, face_normal);
      VectorAdd(TerrainNormal[Index], face_normal, TerrainNormal[Index]);
      FaceNormalize(v3, v4, v1, face_normal);
      VectorAdd(TerrainNormal[Index], face_normal, TerrainNormal[Index]);
    }
  }
}

function CreateTerrainLight(): void {
  const Light = Vector3.Zero();

  if (gMapManager.InBattleCastle()) {
    Vector(0.5, -1.0, 1.0, Light);
  }
  else {
    Vector(0.5, -0.5, 0.5, Light);
  }

  for (let y = 0; y < TERRAIN_SIZE; y++) {
    for (let x = 0; x < TERRAIN_SIZE; x++) {
      const Index = TERRAIN_INDEX(x, y);
      let Luminosity = DotProduct(TerrainNormal[Index], Light) + 0.5;
      Luminosity = Scalar.Clamp(Luminosity, 0, 1);

      TerrainLight[Index].scaleToRef(Luminosity, BackTerrainLight[Index]);
    }
  }
}

// function CreateTerrainLight_Part(xi: Int, yi: Int): void {
//   if (xi > TERRAIN_SIZE - 4) xi = TERRAIN_SIZE - 4;
//   else if (xi < 4) xi = 4;

//   if (yi > TERRAIN_SIZE - 4) yi = TERRAIN_SIZE - 4;
//   else if (yi < 4) yi = 4;

//   const Light = Vector3.Zero();

//   Vector(0.5, -0.5, 0.5, Light);

//   for (let y = yi - 4; y < yi + 4; y++) {
//     for (let x = xi - 4; x < xi + 4; x++) {
//       const Index = TERRAIN_INDEX(x, y);
//       let Luminosity = DotProduct(TerrainNormal[Index], Light) + 0.5;
//       Luminosity = Scalar.Clamp(Luminosity, 0, 1);

//       TerrainLight[Index].scaleToRef(Luminosity, BackTerrainLight[Index]);
//     }
//   }
// }



export async function OpenTerrainLight(scene: Scene, FileName: string) {
  //TODO
  const texture = await OpenJpegBuffer(scene, FileName);

  if (!texture) throw new Error(`no texture: ${FileName}`);

  // Apply corrections to the loaded terrain light
  for (let i = 0; i < TERRAIN_SIZE * TERRAIN_SIZE; i++) {
    TerrainLight[i].set(texture.BufferFloat[i * 3 + 0], texture.BufferFloat[i * 3 + 1], texture.BufferFloat[i * 3 + 2]);

    // TerrainLight[i][2] -= 0.0; // < - Add/Color
    // TerrainLight[i][1] -= 0.0;

    Vector3.ClampToRef(TerrainLight[i], Vector3.ZeroReadOnly, Vector3.OneReadOnly, TerrainLight[i]);
  }

  CreateTerrainNormal();
  CreateTerrainLight();

  return { texture: texture.Texture, Lights: BackTerrainLight };
}

// TODO
function SaveTerrainLight(FileName: string): void {
  const Buffer = new Uint8Array(TERRAIN_SIZE * TERRAIN_SIZE * 3);
  const MAX = new Vector3(255, 255, 255);

  for (let i = 0; i < TERRAIN_SIZE * TERRAIN_SIZE; ++i) {
    const newLight = TerrainLight[i].scale(255);
    Vector3.ClampToRef(newLight, Vector3.ZeroReadOnly, MAX, newLight);

    Buffer[i * 3 + 0] = castToByte(newLight.x);
    Buffer[i * 3 + 1] = castToByte(newLight.y);
    Buffer[i * 3 + 2] = castToByte(newLight.z);
  }

  //TODO
  WriteJpeg(FileName, TERRAIN_SIZE, TERRAIN_SIZE, Buffer, 100);
}

function CreateTerrain(FileName: string, bNew: boolean): void {
  ActiveTerrain = true;
  if (bNew) {
    OpenTerrainHeightNew(FileName);
  }
  else {
    OpenTerrainHeight(FileName);
  }

  // CreateSun();
}

// const BMPHeader = new Uint8Array(1080);

// function IsTerrainHeightExtMap(iWorld: Int): boolean {
//   return (iWorld === ENUM_WORLD.WD_42CHANGEUP3RD_2ND || gMapManager.IsPKField() || iWorld === ENUM_WORLD.WD_66DOPPLEGANGER2);
// }

// export async function OpenTerrainHeight(FileName: string): Promise<number[]> {
//   const Index: Int = 1080;
//   const factor = 1.5;

//   const Buffer = await fread(FileName);

//   ArrayCopy(Buffer, 0, BMPHeader, 0, Index); //memcpy(BMPHeader, Buffer, Index);

//   for (let i = 0; i < TERRAIN_SIZE; i++) {
//     const offset = i * TERRAIN_SIZE;

//     for (let j = 0; j < TERRAIN_SIZE; j++) {
//       BackTerrainHeight[offset + j] = Buffer[Index + offset + j] * factor / 100;
//     }
//   }

//   return BackTerrainHeight;
// }

// function SaveTerrainHeight(name: string): void {
  // const Buffer = new Uint8Array(TERRAIN_SIZE * TERRAIN_SIZE);
  // const factor = (gMapManager.WorldActive === ENUM_WORLD.WD_55LOGINSCENE) ? 3.0 : 1.5;

  //TODO

  // for (let i = 0; i < TERRAIN_SIZE; i++) {
  //   float *src = &BackTerrainHeight[i * TERRAIN_SIZE];
  //       unsigned char *dst = &Buffer[(255 - i) * TERRAIN_SIZE];

  //   for (let j = 0; j < TERRAIN_SIZE; j++) {
  //           float Height = *src / factor;
  //     if (Height < 0.0) Height = 0.0;
  //     else if (Height > 255.f) Height = 255.f;
  //           * dst = (unsigned char) (Height);
  //     src++;
  //     dst++;
  //   }
  // }
  // FILE * fp = _wfopen(name, L"wb");
  // fwrite(BMPHeader, 1080, 1, fp);

  // for (let i = 0; i < 256; i++) fwrite(Buffer + (255 - i) * 256, 256, 1, fp);

// }

// async function OpenTerrainHeightNew(strFilename: string): Promise<boolean> {
//   let NewFileName = '';

//   for (let i = 0; i < strFilename.length; i++) {
//     NewFileName += strFilename[i];
//     if (strFilename[i] == '.') break;
//   }

//   //TODO
//   const FileName = `data/${NewFileName}OZB`;

//   const Buffer = await fread(FileName);

//   //TODO
//   // let dwCurPos = 0;//DWORD
//   // dwCurPos += 4;

//   //   BITMAPINFOHEADER bmiHeader;
//   //   BITMAPFILEHEADER header;

//   // memcpy(& header, & pbyData[dwCurPos], sizeof(BITMAPFILEHEADER));
//   // dwCurPos += sizeof(BITMAPFILEHEADER);

//   // memcpy(& bmiHeader, & pbyData[dwCurPos], sizeof(BITMAPINFOHEADER));
//   // dwCurPos += sizeof(BITMAPINFOHEADER);

//   // for (let i = 0; i < TERRAIN_SIZE * TERRAIN_SIZE; ++i) {
//   //   BYTE * pbysrc = & pbyData[dwCurPos + i * 3];

//   //       DWORD dwHeight = 0;
//   //   BYTE * pbyHeight = (BYTE *) & dwHeight;

//   //   pbyHeight[0] = pbysrc[2];
//   //   pbyHeight[1] = pbysrc[1];
//   //   pbyHeight[2] = pbysrc[0];

//   //   BackTerrainHeight[i] = (float)dwHeight;
//   //   BackTerrainHeight[i] += g_fMinHeight;
//   // }

//   return true;
// }

let SceneFlag: Int;

function RequestTerrainHeight(xf: Float, yf: Float): Float {
  if (SceneFlag === SERVER_LIST_SCENE || SceneFlag === WEBZEN_SCENE || SceneFlag === LOADING_SCENE)
    return 0;
  if (xf < 0 || yf < 0)
    return 0;

  xf /= TERRAIN_SCALE;
  yf /= TERRAIN_SCALE;

  const Index = TERRAIN_INDEX(xf, yf);

  if (Index >= TERRAIN_SIZE * TERRAIN_SIZE)
    return g_fSpecialHeight;

  if ((TerrainWall[Index] & TW_HEIGHT) === TW_HEIGHT)
    return g_fSpecialHeight;

  const xi = integerDevision(xf);
  const yi = integerDevision(yf);
  const xd = xf - xi;
  const yd = yf - yi;

  const Index1 = TERRAIN_INDEX_REPEAT(xi, yi);
  const Index2 = TERRAIN_INDEX_REPEAT(xi, yi + 1);
  const Index3 = TERRAIN_INDEX_REPEAT(xi + 1, yi);
  const Index4 = TERRAIN_INDEX_REPEAT(xi + 1, yi + 1);

  if (Index1 >= TERRAIN_SIZE * TERRAIN_SIZE || Index2 >= TERRAIN_SIZE * TERRAIN_SIZE ||
    Index3 >= TERRAIN_SIZE * TERRAIN_SIZE || Index4 >= TERRAIN_SIZE * TERRAIN_SIZE)
    return g_fSpecialHeight;

  const left = BackTerrainHeight[Index1] + (BackTerrainHeight[Index2] - BackTerrainHeight[Index1]) * yd;
  const right = BackTerrainHeight[Index3] + (BackTerrainHeight[Index4] - BackTerrainHeight[Index3]) * yd;

  return left + (right - left) * xd;
}

function RequestTerrainNormal(xf: Float, yf: Float, Normal: Vector3): void {
  xf = xf / TERRAIN_SCALE;
  yf = yf / TERRAIN_SCALE;
  const xi = Math.floor(xf); // TODO check that (int)xf was correct
  const yi = Math.floor(yf); // TODO check that (int)yf was correct
  Normal.copyFrom(TerrainNormal[TERRAIN_INDEX_REPEAT(xi, yi)]);
}

function AddTerrainHeight(xf: Float, yf: Float, Height: Float, Range: Int, Buffer: Float32Array): void {
  const rf: Float = Range;

  xf = xf / TERRAIN_SCALE;
  yf = yf / TERRAIN_SCALE;

  const xi = Math.floor(xf);
  const yi = Math.floor(yf);
  let syi = yi - Range;
  const eyi = yi + Range;
  let syf: Float = syi;

  for (; syi <= eyi; syi++, syf += 1.0) {
    let sxi = xi - Range;
    const exi = xi + Range;
    let sxf = sxi;

    for (; sxi <= exi; sxi++, sxf += 1.0) {
      const xd = xf - sxf;
      const yd = yf - syf;
      const lf = (rf - Math.sqrt(xd * xd + yd * yd)) / rf;
      if (lf > 0) {
        Buffer[TERRAIN_INDEX_REPEAT(sxi, syi)] += Height * lf;
      }
    }
  }
}

function SetTerrainLight(xf: Float, yf: Float, Light: Vector3, Range: Int, Buffer: Vector3[]): void {
  const rf = Range;

  xf = (xf / TERRAIN_SCALE);
  yf = (yf / TERRAIN_SCALE);

  const xi = integerDevision(xf);
  const yi = integerDevision(yf);
  let syi = yi - Range;
  const eyi = yi + Range;
  let syf = syi;

  const tmp = Vector3.Zero();

  for (; syi <= eyi; syi++, syf += 1.0) {
    let sxi = xi - Range;
    const exi = xi + Range;
    let sxf = sxi;

    for (; sxi <= exi; sxi++, sxf += 1.0) {
      const xd = xf - sxf;
      const yd = yf - syf;
      const lf = (rf - Math.sqrt(xd * xd + yd * yd)) / rf;
      if (lf > 0) {
        const b = Buffer[TERRAIN_INDEX_REPEAT(sxi, syi)];
        Light.scaleToRef(lf, tmp);
        b.addInPlace(tmp);
      }
    }
  }
}

function AddTerrainLight(xf: Float, yf: Float, Light: Vector3, Range: Int, Buffer: Vector3[]): void {
  const rf = Range;

  xf = (xf / TERRAIN_SCALE);
  yf = (yf / TERRAIN_SCALE);

  const xi = integerDevision(xf);
  const yi = integerDevision(yf);
  let syi = yi - Range;
  const eyi = yi + Range;
  let syf = syi;

  const tmp = Vector3.Zero();


  for (; syi <= eyi; syi++, syf += 1.0) {
    let sxi = xi - Range;
    const exi = xi + Range;
    let sxf = sxi;
    for (; sxi <= exi; sxi++, sxf += 1.0) {
      const xd = xf - sxf;
      const yd = yf - syf;
      const lf = (rf - Math.sqrt(xd * xd + yd * yd)) / rf;

      if (lf > 0) {
        const b = Buffer[TERRAIN_INDEX_REPEAT(sxi, syi)];
        Light.scaleToRef(lf, tmp);
        b.addInPlace(tmp);

        if (b.x < 0) b.x = 0;
        if (b.y < 0) b.y = 0;
        if (b.z < 0) b.z = 0;
      }
    }
  }
}

//TODO
function AddTerrainLightClip(xf: Float, yf: Float, Light: Vector3, Range: Int, Buffer: Vector3[]): void {
  //   const rf = Range;

  // xf = (xf / TERRAIN_SCALE);
  // yf = (yf / TERRAIN_SCALE);

  //   int   xi = (int)xf;
  //   int   yi = (int)yf;
  //   int   syi = yi - Range;
  //   int   eyi = yi + Range;
  //   auto syf = (float)(syi);
  // for (; syi <= eyi; syi++, syf += 1.0) {
  //       int   sxi = xi - Range;
  //       int   exi = xi + Range;
  //       auto sxf = (float)(sxi);
  //   for (; sxi <= exi; sxi++, sxf += 1.0) {
  //           float xd = xf - sxf;
  //           float yd = yf - syf;
  //           float lf = (rf - sqrtf(xd * xd + yd * yd)) / rf;
  //     if (lf > 0.0) {
  //       float * b = & Buffer[TERRAIN_INDEX_REPEAT(sxi, syi)][0];
  //       for (let i = 0; i < 3; i++) {
  //         b[i] += Light[i] * lf;
  //         if (b[i] < 0.0) b[i] = 0.0;
  //         else if (b[i] > 1.0) b[i] = 1.0;
  //       }
  //     }
  //   }
  // }
}

function RequestTerrainLight(xf: Float, yf: Float, Light: Vector3): void {
  if (SceneFlag == SERVER_LIST_SCENE
    || SceneFlag == WEBZEN_SCENE
    || SceneFlag == LOADING_SCENE
    || ActiveTerrain == false) {
    Vector(0, 0, 0, Light);
    return;
  }

  xf = xf / TERRAIN_SCALE;
  yf = yf / TERRAIN_SCALE;

  const xi = integerDevision(xf);
  const yi = integerDevision(yf);

  if (xi < 0 || yi < 0 || xi > TERRAIN_SIZE_MASK - 1 || yi > TERRAIN_SIZE_MASK - 1) {
    Vector(0, 0, 0, Light);
    return;
  }

  const Index1 = ((xi) + (yi) * TERRAIN_SIZE);
  const Index2 = ((xi + 1) + (yi) * TERRAIN_SIZE);
  const Index3 = ((xi + 1) + (yi + 1) * TERRAIN_SIZE);
  const Index4 = ((xi) + (yi + 1) * TERRAIN_SIZE);
  const xd = xf - xi;
  const yd = yf - yi;

  //TODO optimize performance
  const left = PrimaryTerrainLight[Index1].add(PrimaryTerrainLight[Index4].subtract(PrimaryTerrainLight[Index1]).scale(yd));
  const right = PrimaryTerrainLight[Index2].add(PrimaryTerrainLight[Index3].subtract(PrimaryTerrainLight[Index2]).scale(yd));
  Light.copyFrom(left.add(right.subtract(left).scale(xd)));

  // for (let i = 0; i < 3; i++) {
  // const left = PrimaryTerrainLight[Index1][i] + (PrimaryTerrainLight[Index4][i] - PrimaryTerrainLight[Index1][i]) * yd;
  // const right = PrimaryTerrainLight[Index2][i] + (PrimaryTerrainLight[Index3][i] - PrimaryTerrainLight[Index2][i]) * yd;
  // Light[i] = (left + (right - left) * xd);
  // }
}

function CreateLodBuffer(): void {
  const NormalMin = Vector3.Zero();
  const NormalMax = Vector3.Zero();

  const v1 = Vector3.Zero();
  const v2 = Vector3.Zero();
  const v3 = Vector3.Zero();
  const v4 = Vector3.Zero();

  for (let y = 0; y < TERRAIN_SIZE; y += 4) {
    for (let x = 0; x < TERRAIN_SIZE; x += 4) {
      NormalMin.setAll(1);
      NormalMax.setAll(-1);

      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          Vector((x + j) * TERRAIN_SCALE, (y + i) * TERRAIN_SCALE, BackTerrainHeight[TERRAIN_INDEX_REPEAT(x + j, y + i)], v1);
          Vector((x + j + 1) * TERRAIN_SCALE, (y + i) * TERRAIN_SCALE, BackTerrainHeight[TERRAIN_INDEX_REPEAT(x + j + 1, y + i)], v2);
          Vector((x + j + 1) * TERRAIN_SCALE, (y + i + 1) * TERRAIN_SCALE, BackTerrainHeight[TERRAIN_INDEX_REPEAT(x + j + 1, y + i + 1)], v3);
          Vector((x + j) * TERRAIN_SCALE, (y + i + 1) * TERRAIN_SCALE, BackTerrainHeight[TERRAIN_INDEX_REPEAT(x + j, y + i + 1)], v4);

          const Index = TERRAIN_INDEX(x + j, y + i);
          FaceNormalize(v1, v2, v3, TerrainNormal[Index]);

          const Normal = TerrainNormal[Index];
          NormalMin.minimizeInPlace(Normal);
          NormalMax.maximizeInPlace(Normal);
        }
      }

      const Delta = Math.max(Math.abs(NormalMax.x - NormalMin.x), Math.abs(NormalMax.y - NormalMin.y), Math.abs(NormalMax.z - NormalMin.z));

      if (DetailLowEnable == true) {
        LodBuffer[y / 4 * 64 + x / 4] = 4;
      } else {
        if (Delta >= 1.0) {
          LodBuffer[y / 4 * 64 + x / 4] = 1;
        } else if (Delta >= 0.5) {
          LodBuffer[y / 4 * 64 + x / 4] = 2;
        }
        else {
          LodBuffer[y / 4 * 64 + x / 4] = 4;
        }
        //TODO bug?
        LodBuffer[y / 4 * 64 + x / 4] = 1;
      }
    }
  }
}

function InterpolationHeight(lod: Int, x: Int, y: Int, xd: Int, TerrainHeight: number[]): void {
  if (lod >= 4) {
    TerrainHeight[TERRAIN_INDEX_REPEAT(x + xd, y + 2)] = (
      TerrainHeight[TERRAIN_INDEX_REPEAT(x + xd, y)] +
      TerrainHeight[TERRAIN_INDEX_REPEAT(x + xd, y + 4)]) * 0.5;
  }

  if (lod >= 2) {
    TerrainHeight[TERRAIN_INDEX_REPEAT(x + xd, y + 1)] = (
      TerrainHeight[TERRAIN_INDEX_REPEAT(x + xd, y)] +
      TerrainHeight[TERRAIN_INDEX_REPEAT(x + xd, y + 2)]) * 0.5;
    TerrainHeight[TERRAIN_INDEX_REPEAT(x + xd, y + 3)] = (
      TerrainHeight[TERRAIN_INDEX_REPEAT(x + xd, y + 2)] +
      TerrainHeight[TERRAIN_INDEX_REPEAT(x + xd, y + 4)]) * 0.5;
  }
}

function InterpolationWidth(lod: Int, x: Int, y: Int, yd: Int, TerrainHeight: number[]): void {
  if (lod >= 4) {
    TerrainHeight[TERRAIN_INDEX_REPEAT(x + 2, y + yd)] = (
      TerrainHeight[TERRAIN_INDEX_REPEAT(x, y + yd)] +
      TerrainHeight[TERRAIN_INDEX_REPEAT(x + 4, y + yd)]) * 0.5;
  }

  if (lod >= 2) {
    TerrainHeight[TERRAIN_INDEX_REPEAT(x + 1, y + yd)] = (
      TerrainHeight[TERRAIN_INDEX_REPEAT(x, y + yd)] +
      TerrainHeight[TERRAIN_INDEX_REPEAT(x + 2, y + yd)]) * 0.5;
    TerrainHeight[TERRAIN_INDEX_REPEAT(x + 3, y + yd)] = (
      TerrainHeight[TERRAIN_INDEX_REPEAT(x + 2, y + yd)] +
      TerrainHeight[TERRAIN_INDEX_REPEAT(x + 4, y + yd)]) * 0.5;
  }
}

function InterpolationCross(lod: Int, x: Int, y: Int): void {
  BackTerrainHeight[TERRAIN_INDEX_REPEAT(x, y)] = (
    BackTerrainHeight[TERRAIN_INDEX_REPEAT(x - lod, y)] +
    BackTerrainHeight[TERRAIN_INDEX_REPEAT(x + lod, y)] +
    BackTerrainHeight[TERRAIN_INDEX_REPEAT(x, y - lod)] +
    BackTerrainHeight[TERRAIN_INDEX_REPEAT(x, y + lod)]) * 0.25;
}

function PrefixTerrainHeightEdge(x: Int, y: Int, lod: Int, TerrainHeight: number[]): void {
  if (lod >= LodBuffer[((y) & 63) * 64 + ((x - 1) & 63)]) InterpolationHeight(lod, x * 4, y * 4, 0, TerrainHeight);
  if (lod >= LodBuffer[((y) & 63) * 64 + ((x + 1) & 63)]) InterpolationHeight(lod, x * 4, y * 4, 4, TerrainHeight);
  if (lod >= LodBuffer[((y - 1) & 63) * 64 + ((x) & 63)]) InterpolationWidth(lod, x * 4, y * 4, 0, TerrainHeight);
  if (lod >= LodBuffer[((y + 1) & 63) * 64 + ((x) & 63)]) InterpolationWidth(lod, x * 4, y * 4, 4, TerrainHeight);
}

function PrefixTerrainHeight(): void {
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const lod = LodBuffer[((y) & 63) * 64 + ((x) & 63)];
      PrefixTerrainHeightEdge(x, y, lod, BackTerrainHeight);
      if (lod >= 2) {
        if (lod >= 4) {
          InterpolationHeight(lod, x * 4, y * 4, 2, BackTerrainHeight);
          InterpolationWidth(lod, x * 4, y * 4, 2, BackTerrainHeight);
        }
        if (lod >= 2) {
          InterpolationHeight(lod, x * 4, y * 4, 1, BackTerrainHeight);
          InterpolationWidth(lod, x * 4, y * 4, 1, BackTerrainHeight);
          InterpolationHeight(lod, x * 4, y * 4, 3, BackTerrainHeight);
          InterpolationWidth(lod, x * 4, y * 4, 3, BackTerrainHeight);
          /*InterpolationCross(1,x*4+1,y*4+1);
          InterpolationCross(1,x*4+1,y*4+3);
          InterpolationCross(1,x*4+3,y*4+1);
          InterpolationCross(1,x*4+3,y*4+3);*/
        }
      }
    }
  }
}

let SelectFlag = false;

let TerrainIndex1: Int;
let TerrainIndex2: Int;
let TerrainIndex3: Int;
let TerrainIndex4: Int;
let Index0;
let Index1;
let Index2;
let Index3;
let Index01: Int;
let Index12: Int;
let Index23: Int;
let Index30: Int;
let Index02: Int;
const TerrainVertex: [Vector3, Vector3, Vector3, Vector3] = [Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero()];
const TerrainVertex01 = Vector3.Zero();
const TerrainVertex12 = Vector3.Zero();
const TerrainVertex23 = Vector3.Zero();
const TerrainVertex30 = Vector3.Zero();
const TerrainVertex02 = Vector3.Zero();

const TerrainTextureCoord: [Vector2, Vector2, Vector2, Vector2] = [Vector2.Zero(), Vector2.Zero(), Vector2.Zero(), Vector2.Zero()];

const TerrainTextureCoord01 = Vector2.Zero();
const TerrainTextureCoord12 = Vector2.Zero();
const TerrainTextureCoord23 = Vector2.Zero();
const TerrainTextureCoord30 = Vector2.Zero();
const TerrainTextureCoord02 = Vector2.Zero();

let TerrainMappingAlpha01: Float;
let TerrainMappingAlpha12: Float;
let TerrainMappingAlpha23: Float;
let TerrainMappingAlpha30: Float;
let TerrainMappingAlpha02: Float;

const tmpV3 = Vector3.Zero();

function Interpolation(mx: Int, my: Int): void {
  Index01 = (my * 2) * 512 + (mx * 2 + 1);
  Index12 = (my * 2 + 1) * 512 + (mx * 2 + 2);
  Index23 = (my * 2 + 2) * 512 + (mx * 2 + 1);
  Index30 = (my * 2 + 1) * 512 + (mx * 2);
  Index02 = (my * 2 + 1) * 512 + (mx * 2 + 1);

  TerrainVertex[0].addToRef(TerrainVertex[1], TerrainVertex01).scaleInPlace(0.5);
  TerrainVertex[1].addToRef(TerrainVertex[2], TerrainVertex12).scaleInPlace(0.5);
  TerrainVertex[2].addToRef(TerrainVertex[3], TerrainVertex23).scaleInPlace(0.5);
  TerrainVertex[3].addToRef(TerrainVertex[0], TerrainVertex30).scaleInPlace(0.5);
  TerrainVertex[0].addToRef(TerrainVertex[2], TerrainVertex02).scaleInPlace(0.5);

  TerrainTextureCoord[0].addToRef(TerrainTextureCoord[1], TerrainTextureCoord01).scaleInPlace(0.5);
  TerrainTextureCoord[1].addToRef(TerrainTextureCoord[2], TerrainTextureCoord12).scaleInPlace(0.5);
  TerrainTextureCoord[2].addToRef(TerrainTextureCoord[3], TerrainTextureCoord23).scaleInPlace(0.5);
  TerrainTextureCoord[3].addToRef(TerrainTextureCoord[0], TerrainTextureCoord30).scaleInPlace(0.5);
  TerrainTextureCoord[0].addToRef(TerrainTextureCoord[2], TerrainTextureCoord02).scaleInPlace(0.5);
}

const GL_TRIANGLE_FAN = 1;
function BindTexture(tIndex: number): void { }
function glBegin(opt: number): void { }
function glEnd(): void { }
function glTexCoord2f(x: number, y: number): void { }
function glColor3fv(c: Vector3): void { }
function glVertex3fv(v: Vector3): void { }
function glColor3f(r: number, g: number, b: number): void { }
function glColor4f(r: number, g: number, b: number, a: number): void { }

function Vertex0(): void {
  glTexCoord2f(TerrainTextureCoord[0].x, TerrainTextureCoord[0].y);
  glColor3fv(PrimaryTerrainLight[TerrainIndex1]);
  glVertex3fv(TerrainVertex[0]);
}

function Vertex1(): void {
  glTexCoord2f(TerrainTextureCoord[1].x, TerrainTextureCoord[1].y);
  glColor3fv(PrimaryTerrainLight[TerrainIndex2]);
  glVertex3fv(TerrainVertex[1]);
}

function Vertex2(): void {
  glTexCoord2f(TerrainTextureCoord[2].x, TerrainTextureCoord[2].y);
  glColor3fv(PrimaryTerrainLight[TerrainIndex3]);
  glVertex3fv(TerrainVertex[2]);
}

function Vertex3(): void {
  glTexCoord2f(TerrainTextureCoord[3].x, TerrainTextureCoord[3].y);
  glColor3fv(PrimaryTerrainLight[TerrainIndex4]);
  glVertex3fv(TerrainVertex[3]);
}

function Vertex01(): void {
  glTexCoord2f(TerrainTextureCoord01.x, TerrainTextureCoord01.y);
  glColor3fv(PrimaryTerrainLight[Index01]);
  glVertex3fv(TerrainVertex01);
}

function Vertex12(): void {
  glTexCoord2f(TerrainTextureCoord12.x, TerrainTextureCoord12.y);
  glColor3fv(PrimaryTerrainLight[Index12]);
  glVertex3fv(TerrainVertex12);
}

function Vertex23(): void {
  glTexCoord2f(TerrainTextureCoord23.x, TerrainTextureCoord23.y);
  glColor3fv(PrimaryTerrainLight[Index23]);
  glVertex3fv(TerrainVertex23);
}

function Vertex30(): void {
  glTexCoord2f(TerrainTextureCoord30.x, TerrainTextureCoord30.y);
  glColor3fv(PrimaryTerrainLight[Index30]);
  glVertex3fv(TerrainVertex30);
}

function Vertex02(): void {
  glTexCoord2f(TerrainTextureCoord02.x, TerrainTextureCoord02.y);
  glColor3fv(PrimaryTerrainLight[Index02]);
  glVertex3fv(TerrainVertex02);
}

function VertexAlpha0(): void {
  glTexCoord2f(TerrainTextureCoord[0].x, TerrainTextureCoord[0].y);
  const Light = PrimaryTerrainLight[TerrainIndex1];
  glColor4f(Light.x, Light.y, Light.z, TerrainMappingAlpha[TerrainIndex1]);
  glVertex3fv(TerrainVertex[0]);
}

function VertexAlpha1(): void {
  glTexCoord2f(TerrainTextureCoord[1].x, TerrainTextureCoord[1].y);
  const Light = PrimaryTerrainLight[TerrainIndex2];
  glColor4f(Light.x, Light.y, Light.z, TerrainMappingAlpha[TerrainIndex2]);
  glVertex3fv(TerrainVertex[1]);
}

function VertexAlpha2(): void {
  glTexCoord2f(TerrainTextureCoord[2].x, TerrainTextureCoord[2].y);
  const Light = PrimaryTerrainLight[TerrainIndex3];
  glColor4f(Light.x, Light.y, Light.z, TerrainMappingAlpha[TerrainIndex3]);
  glVertex3fv(TerrainVertex[2]);
}

function VertexAlpha3(): void {
  glTexCoord2f(TerrainTextureCoord[3].x, TerrainTextureCoord[3].y);
  const Light = PrimaryTerrainLight[TerrainIndex4];
  glColor4f(Light.x, Light.y, Light.z, TerrainMappingAlpha[TerrainIndex4]);
  glVertex3fv(TerrainVertex[3]);
}

function VertexAlpha01(): void {
  glTexCoord2f(TerrainTextureCoord01.x, TerrainTextureCoord01.y);
  const Light = PrimaryTerrainLight[Index01];
  glColor4f(Light.x, Light.y, Light.z, TerrainMappingAlpha01);
  glVertex3fv(TerrainVertex01);
}

function VertexAlpha12(): void {
  glTexCoord2f(TerrainTextureCoord12.x, TerrainTextureCoord12.y);
  const Light = PrimaryTerrainLight[Index12];
  glColor4f(Light.x, Light.y, Light.z, TerrainMappingAlpha12);
  glVertex3fv(TerrainVertex12);
}

function VertexAlpha23(): void {
  glTexCoord2f(TerrainTextureCoord23.x, TerrainTextureCoord23.y);
  const Light = PrimaryTerrainLight[Index23];
  glColor4f(Light.x, Light.y, Light.z, TerrainMappingAlpha23);
  glVertex3fv(TerrainVertex23);
}

function VertexAlpha30(): void {
  glTexCoord2f(TerrainTextureCoord30.x, TerrainTextureCoord30.y);
  const Light = PrimaryTerrainLight[Index30];
  glColor4f(Light.x, Light.y, Light.z, TerrainMappingAlpha30);
  glVertex3fv(TerrainVertex30);
}

function VertexAlpha02(): void {
  glTexCoord2f(TerrainTextureCoord02.x, TerrainTextureCoord02.y);
  const Light = PrimaryTerrainLight[Index02];
  glColor4f(Light.x, Light.y, Light.z, TerrainMappingAlpha02);
  glVertex3fv(TerrainVertex02);
}

function VertexBlend0(): void {
  glTexCoord2f(TerrainTextureCoord[0].x, TerrainTextureCoord[0].y);
  const Light = TerrainMappingAlpha[TerrainIndex1];
  glColor3f(Light, Light, Light);
  glVertex3fv(TerrainVertex[0]);
}

function VertexBlend1(): void {
  glTexCoord2f(TerrainTextureCoord[1].x, TerrainTextureCoord[1].y);
  const Light = TerrainMappingAlpha[TerrainIndex2];
  glColor3f(Light, Light, Light);
  glVertex3fv(TerrainVertex[1]);
}

function VertexBlend2(): void {
  glTexCoord2f(TerrainTextureCoord[2].x, TerrainTextureCoord[2].y);
  const Light = TerrainMappingAlpha[TerrainIndex3];
  glColor3f(Light, Light, Light);
  glVertex3fv(TerrainVertex[2]);
}

function VertexBlend3(): void {
  glTexCoord2f(TerrainTextureCoord[3].x, TerrainTextureCoord[3].y);
  const Light = TerrainMappingAlpha[TerrainIndex4];
  glColor3f(Light, Light, Light);
  glVertex3fv(TerrainVertex[3]);
}

function RenderFace(Texture: Int): void {
  if (gMapManager.WorldActive === ENUM_WORLD.WD_39KANTURU_3RD) {
    if (Texture == 3) EnableAlphaTest();
    else if (Texture == 100) return;
    else DisableAlphaBlend();
  }
  else if (gMapManager.WorldActive >= ENUM_WORLD.WD_45CURSEDTEMPLE_LV1 && gMapManager.WorldActive <= ENUM_WORLD.WD_45CURSEDTEMPLE_LV6) {
    if (Texture == 4) EnableAlphaTest();
    else DisableAlphaBlend();
  }
  else if (gMapManager.WorldActive === ENUM_WORLD.WD_51HOME_6TH_CHAR
    // #ifndef PJH_NEW_SERVER_SELECT_MAP
    //     || World == WD_77NEW_LOGIN_SCENE
    //     || World == WD_78NEW_CHARACTER_SCENE;
    //   #endif; //PJH_NEW_SERVER_SELECT_MAP
  ) {
    if (Texture === 2) EnableAlphaTest();
    else DisableAlphaBlend();

  }
  else if (gMapManager.WorldActive === ENUM_WORLD.WD_69EMPIREGUARDIAN1 || gMapManager.WorldActive === ENUM_WORLD.WD_70EMPIREGUARDIAN2 || gMapManager.WorldActive === ENUM_WORLD.WD_71EMPIREGUARDIAN3 || gMapManager.WorldActive === ENUM_WORLD.WD_72EMPIREGUARDIAN4
    // #ifdef PJH_NEW_SERVER_SELECT_MAP
    //     || gMapManager.WorldActive === ENUM_WORLD.WD_73NEW_LOGIN_SCENE || gMapManager.WorldActive === ENUM_WORLD.WD_74NEW_CHARACTER_SCENE;
    //   #endif; //PJH_NEW_SERVER_SELECT_MAP
  ) {
    if (Texture === 10) {
      EnableAlphaTest();
    }
    else {
      DisableAlphaBlend();
    }
  }
  // #ifdef ASG_ADD_MAP_KARUTAN
  //   else if (IsKarutanMap()) {
  //   if (Texture == 12)
  //     EnableAlphaTest();
  //   else
  //     DisableAlphaBlend();
  // }
  // #endif;	// ASG_ADD_MAP_KARUTAN
  else DisableAlphaBlend();

  BindTexture(BITMAP_MAPTILE + Texture);

  glBegin(GL_TRIANGLE_FAN);
  Vertex0();
  Vertex1();
  Vertex2();
  Vertex3();
  glEnd();
}

function RenderFace_After(Texture: Int): void {
  if (Texture === 100) EnableAlphaTest();
  else if (Texture === 101) EnableAlphaBlend();
  else return;

  BindTexture(BITMAP_MAPTILE + Texture);

  glBegin(GL_TRIANGLE_FAN);
  Vertex0();
  Vertex1();
  Vertex2();
  Vertex3();
  glEnd();
}

function RenderFaceAlpha(Texture: Int): void {
  EnableAlphaTest();
  BindTexture(BITMAP_MAPTILE + Texture);
  glBegin(GL_TRIANGLE_FAN);
  VertexAlpha0();
  VertexAlpha1();
  VertexAlpha2();
  VertexAlpha3();
  glEnd();
}

function RenderFaceBlend(Texture: Int): void {
  EnableAlphaBlend();
  BindTexture(BITMAP_MAPTILE + Texture);
  glBegin(GL_TRIANGLE_FAN);
  VertexBlend0();
  VertexBlend1();
  VertexBlend2();
  VertexBlend3();
  glEnd();
}

function FaceTexture(Texture: Int, xf: Float, yf: Float, isWater: boolean, Scale: boolean): void {
  const Light = Vector3.Zero();
  const Pos = Vector3.Zero();
  Vector(0.30, 0.40, 0.20, Light);

  const b = Bitmaps[BITMAP_MAPTILE + Texture];
  let Width: Float;
  let Height: Float;
  if (Scale) {
    Width = 16. / b.Width;
    Height = 16. / b.Height;
  }
  else {
    Width = 64. / b.Width;
    Height = 64. / b.Height;
  }

  let suf = xf * Width;
  const svf = yf * Height;

  if (!isWater) {
    TEXCOORD(TerrainTextureCoord[0], suf, svf);
    TEXCOORD(TerrainTextureCoord[1], suf + Width, svf);
    TEXCOORD(TerrainTextureCoord[2], suf + Width, svf + Height);
    TEXCOORD(TerrainTextureCoord[3], suf, svf + Height);
  }
  else {
    let Water1 = 0.0;
    let Water2 = 0.0;
    let Water3 = 0.0;
    let Water4 = 0.0;

    if (gMapManager.WorldActive === ENUM_WORLD.WD_34CRYWOLF_1ST && Texture == 5) {
      //   if (rand_fps_check(50)) {
      //             const sx = xf * TERRAIN_SCALE + ((rand() % 100 + 1) * 1.0);
      //             const sy = yf * TERRAIN_SCALE + ((rand() % 100 + 1) * 1.0);
      //     Vector(sx, sy, Hero -> Object.Position[2] + 10.0, Pos);
      //     CreateParticle(BITMAP_SPOT_WATER, Pos, Hero -> Object.Angle, Light, 0);
      //   }
    }

    if (gMapManager.WorldActive === ENUM_WORLD.WD_30BATTLECASTLE && Texture == 5)
      suf -= WaterMove;
    else
      suf += WaterMove;

    if (Scale) {
      Water3 = TerrainGrassWind[TerrainIndex1] * 0.008;
      Water4 = TerrainGrassWind[TerrainIndex2] * 0.008;
    }
    else {
      Water3 = TerrainGrassWind[TerrainIndex1] * 0.002;
      Water4 = TerrainGrassWind[TerrainIndex2] * 0.002;
    }

    TEXCOORD(TerrainTextureCoord[0], suf + Water1, svf + Water3);
    TEXCOORD(TerrainTextureCoord[1], suf + Width + Water2, svf + Water4);
    TEXCOORD(TerrainTextureCoord[2], suf + Width + Water2, svf + Height + Water4);
    TEXCOORD(TerrainTextureCoord[3], suf + Water1, svf + Height + Water3);
  }
}

let WaterTextureNumber: Int = 0;

function RenderTerrainFace(xf: Float, yf: Float): void {
  // RenderTerrainVisual(xi, yi);

  if (TerrainFlag != TERRAIN_MAP_GRASS) {
    let Texture: Int;
    let Alpha = false;
    let Water = false;

    if (TerrainMappingAlpha[TerrainIndex1] >= 1.0 && TerrainMappingAlpha[TerrainIndex2] >= 1.0 && TerrainMappingAlpha[TerrainIndex3] >= 1.0 && TerrainMappingAlpha[TerrainIndex4] >= 1.0) {
      Texture = TerrainMappingLayer2[TerrainIndex1];
      Alpha = false;
    }
    else {
      Texture = TerrainMappingLayer1[TerrainIndex1];
      Alpha = true;
      if (Texture == 5) {
        Water = true;
      } else if (Texture == 11 && (gMapManager.IsPKField() || IsDoppelGanger2())) {
        Water = true;
      }
    }
    FaceTexture(Texture, xf, yf, Water, false);
    RenderFace(Texture);

    if (TerrainMappingAlpha[TerrainIndex1] > 0.0
      || TerrainMappingAlpha[TerrainIndex2] > 0.0
      || TerrainMappingAlpha[TerrainIndex3] > 0.0
      || TerrainMappingAlpha[TerrainIndex4] > 0.0) {
      //TODO skip this case for now
      // if ((gMapManager.WorldActive === ENUM_WORLD.WD_7ATLANSE || IsDoppelGanger3()) && TerrainMappingLayer2[TerrainIndex1] == 5) {
      //   Texture = BITMAP_WATER - BITMAP_MAPTILE + WaterTextureNumber;
      //   FaceTexture(Texture, xf, yf, false, true);
      //   RenderFaceBlend(Texture);
      // }
      // else
      if (Alpha) {
        Texture = TerrainMappingLayer2[TerrainIndex1];
        if (Texture != 5) {
          Water = false;
        }
        if (Texture != 255) {
          FaceTexture(Texture, xf, yf, Water, false);
          RenderFaceAlpha(Texture);
        }
      }
    }
  }
  //rendering grass
  //TODO
  else {
    // if (TerrainMappingAlpha[TerrainIndex1] > 0.0 || TerrainMappingAlpha[TerrainIndex2] > 0.0 || TerrainMappingAlpha[TerrainIndex3] > 0.0 || TerrainMappingAlpha[TerrainIndex4] > 0.0) {
    //   return;
    // }
    // if (
    //   CurrentLayer == 0 && (gMapManager.InBloodCastle() == false)
    // ) {
    //   const Texture = BITMAP_MAPGRASS + TerrainMappingLayer1[TerrainIndex1];

    //   const pBitmap = Bitmaps.FindTexture(Texture);
    //   if (pBitmap) {
    //     const Height = pBitmap.Height * 2.;
    //     BindTexture(Texture);

    //     if (gMapManager.IsPKField() || IsDoppelGanger2())
    //       EnableAlphaBlend();

    //     const Width = 64 / 256;
    //     let su = xf * Width;
    //     su += TerrainGrassTexture[yi & TERRAIN_SIZE_MASK];
    //     TEXCOORD(TerrainTextureCoord[0], su, 0.0);
    //     TEXCOORD(TerrainTextureCoord[1], su + Width, 0.0);
    //     TEXCOORD(TerrainTextureCoord[2], su + Width, 1.0);
    //     TEXCOORD(TerrainTextureCoord[3], su, 1.0);
    //     VectorCopy(TerrainVertex[0], TerrainVertex[3]);
    //     VectorCopy(TerrainVertex[2], TerrainVertex[1]);
    //     TerrainVertex[0].z += Height;
    //     TerrainVertex[1].z += Height;
    //     TerrainVertex[0].x += -50.0;
    //     TerrainVertex[1].x += -50.0;
    //     // #ifdef ASG_ADD_MAP_KARUTAN;
    //     // if (IsKarutanMap()) {
    //     //   TerrainVertex[0][1] += g_fTerrainGrassWind1[TerrainIndex1];
    //     //   TerrainVertex[1][1] += g_fTerrainGrassWind1[TerrainIndex2];
    //     // }
    //     // else {
    //     //   #endif;	// ASG_ADD_MAP_KARUTAN
    //     TerrainVertex[0].x += TerrainGrassWind[TerrainIndex1];
    //     TerrainVertex[1].y += TerrainGrassWind[TerrainIndex2];
    //     //   #ifdef ASG_ADD_MAP_KARUTAN;
    //     // }
    //     // #endif;	// ASG_ADD_MAP_KARUTAN
    //     glBegin(GL_QUADS);
    //     glTexCoord2f(TerrainTextureCoord[0].x, TerrainTextureCoord[0].y);
    //     glColor3fv(PrimaryTerrainLight[TerrainIndex1]);
    //     glVertex3fv(TerrainVertex[0]);
    //     glTexCoord2f(TerrainTextureCoord[1].x, TerrainTextureCoord[1].y);
    //     glColor3fv(PrimaryTerrainLight[TerrainIndex2]);
    //     glVertex3fv(TerrainVertex[1]);
    //     glTexCoord2f(TerrainTextureCoord[2].x, TerrainTextureCoord[2].y);
    //     glColor3fv(PrimaryTerrainLight[TerrainIndex3]);
    //     glVertex3fv(TerrainVertex[2]);
    //     glTexCoord2f(TerrainTextureCoord[3].x, TerrainTextureCoord[3].y);
    //     glColor3fv(PrimaryTerrainLight[TerrainIndex4]);
    //     glVertex3fv(TerrainVertex[3]);
    //     glEnd();

    //     if (gMapManager.IsPKField() || IsDoppelGanger2())
    //       DisableAlphaBlend();
    //   }
    // }
  }
}

function RenderTerrainFace_After(xf: Float, yf: Float): void {
  if (TerrainFlag != TERRAIN_MAP_GRASS) {
    let Texture: Byte;
    let Water = false;
    if (TerrainMappingAlpha[TerrainIndex1] >= 1.0 && TerrainMappingAlpha[TerrainIndex2] >= 1.0 && TerrainMappingAlpha[TerrainIndex3] >= 1.0 && TerrainMappingAlpha[TerrainIndex4] >= 1.0) {
      Texture = TerrainMappingLayer2[TerrainIndex1];
    }
    else {
      Texture = TerrainMappingLayer1[TerrainIndex1];
      if (TerrainMappingLayer1[TerrainIndex1] == 5)
        Water = true;
    }

    FaceTexture(Texture, xf, yf, Water, false);
    RenderFace_After(Texture);
  }
}

let path: any;
let SelectWall: Int;

function RenderTerrainTile(xf: Float, yf: Float, xi: Int, yi: Int, Flag: boolean): boolean {
  TerrainIndex1 = TERRAIN_INDEX(xi, yi);

  if ((TerrainWall[TerrainIndex1] & TW_NOGROUND) === TW_NOGROUND && !Flag) return false;

  TerrainIndex2 = TERRAIN_INDEX(xi + 1, yi);
  TerrainIndex3 = TERRAIN_INDEX(xi + 1, yi + 1);
  TerrainIndex4 = TERRAIN_INDEX(xi, yi + 1);

  const sx = xf * TERRAIN_SCALE;
  const sy = yf * TERRAIN_SCALE;

  Vector(sx, sy, BackTerrainHeight[TerrainIndex1], TerrainVertex[0]);
  Vector(sx + TERRAIN_SCALE, sy, BackTerrainHeight[TerrainIndex2], TerrainVertex[1]);
  Vector(sx + TERRAIN_SCALE, sy + TERRAIN_SCALE, BackTerrainHeight[TerrainIndex3], TerrainVertex[2]);
  Vector(sx, sy + TERRAIN_SCALE, BackTerrainHeight[TerrainIndex4], TerrainVertex[3]);

  if ((TerrainWall[TerrainIndex1] & TW_HEIGHT) == TW_HEIGHT) TerrainVertex[0].z = g_fSpecialHeight;
  if ((TerrainWall[TerrainIndex2] & TW_HEIGHT) == TW_HEIGHT) TerrainVertex[1].z = g_fSpecialHeight;
  if ((TerrainWall[TerrainIndex3] & TW_HEIGHT) == TW_HEIGHT) TerrainVertex[2].z = g_fSpecialHeight;
  if ((TerrainWall[TerrainIndex4] & TW_HEIGHT) == TW_HEIGHT) TerrainVertex[3].z = g_fSpecialHeight;

  if (!Flag) {
    RenderTerrainFace(xf, yf);
    // #ifdef SHOW_PATH_INFO;
    // #ifdef CSK_DEBUG_MAP_PATHFINDING;
    // if (g_bShowPath == true)
    //   #endif; // CSK_DEBUG_MAP_PATHFINDING
    // {
    //   if (2 <= path -> GetClosedStatus(TerrainIndex1)) {
    //     EnableAlphaTest();
    //     DisableTexture();
    //     glBegin(GL_TRIANGLE_FAN);
    //     if (4 <= path -> GetClosedStatus(TerrainIndex1)) {
    //       glColor4f(0.3f, 0.3f, 1.0, 0.5f);
    //     }
    //     else {
    //       glColor4f(1.0, 1.0, 1.0, 0.3f);
    //     }
    //     for (let i = 0; i < 4; i++) {
    //       glVertex3fv(TerrainVertex[i]);
    //     }
    //     glEnd();
    //     DisableAlphaBlend();
    //   }
    // }
    // #endif; // SHOW_PATH_INFO
  }
  else {
    // #ifdef _DEBUG;
    // if (EditFlag != EDIT_LIGHT) {
    //   DisableTexture();
    //   glColor3f(0.5, 0.5, 0.5);
    //   glBegin(GL_LINE_STRIP);
    //   for (let i = 0; i < 4; i++) {
    //     glVertex3fv(TerrainVertex[i]);
    //   }
    //   glEnd();
    //   DisableAlphaBlend();
    // }
    // #endif;// _DEBUG

    const Normal = Vector3.Zero();
    FaceNormalize(TerrainVertex[0], TerrainVertex[1], TerrainVertex[2], Normal);
    let Success = CollisionDetectLineToFace(MousePosition, MouseTarget, 3, TerrainVertex[0], TerrainVertex[1], TerrainVertex[2], TerrainVertex[3], Normal);
    if (Success == false) {
      FaceNormalize(TerrainVertex[0], TerrainVertex[2], TerrainVertex[3], Normal);
      Success = CollisionDetectLineToFace(MousePosition, MouseTarget, 3, TerrainVertex[0], TerrainVertex[2], TerrainVertex[3], TerrainVertex[1], Normal);
    }
    if (Success == true) {
      SelectFlag = true;
      SelectXF = xf;
      SelectYF = yf;
    }
    // #ifdef CSK_DEBUG_MAP_ATTRIBUTE;
    // if (EditFlag == EDIT_WALL &&
    //   ((SelectWall == 0 && (TerrainWall[TerrainIndex1] & TW_NOMOVE) == TW_NOMOVE)
    //     || (SelectWall == 2 && (TerrainWall[TerrainIndex1] & TW_SAFEZONE) == TW_SAFEZONE)
    //     || (SelectWall == 6 && (TerrainWall[TerrainIndex1] & TW_CAMERA_UP) == TW_CAMERA_UP)
    //     || (SelectWall == 7 && (TerrainWall[TerrainIndex1] & TW_NOATTACKZONE) == TW_NOATTACKZONE)
    //     || (SelectWall == 8 && (TerrainWall[TerrainIndex1] & TW_ATT1) == TW_ATT1)
    //     || (SelectWall == 9 && (TerrainWall[TerrainIndex1] & TW_ATT2) == TW_ATT2)
    //     || (SelectWall == 10 && (TerrainWall[TerrainIndex1] & TW_ATT3) == TW_ATT3)
    //     || (SelectWall == 11 && (TerrainWall[TerrainIndex1] & TW_ATT4) == TW_ATT4)
    //     || (SelectWall == 12 && (TerrainWall[TerrainIndex1] & TW_ATT5) == TW_ATT5)
    //     || (SelectWall == 13 && (TerrainWall[TerrainIndex1] & TW_ATT6) == TW_ATT6)
    //     || (SelectWall == 14 && (TerrainWall[TerrainIndex1] & TW_ATT7) == TW_ATT7)
    //   )) {
    //   DisableDepthTest();
    //   EnableAlphaTest();
    //   DisableTexture();

    //   glBegin(GL_TRIANGLE_FAN);
    //   glColor4f(1.0, 0.5, 0.5, 0.3);
    //   for (let i = 0; i < 4; i++) {
    //     glVertex3fv(TerrainVertex[i]);
    //   }
    //   glEnd();

    //   DisableAlphaBlend();
    // }
    // #endif; // CSK_DEBUG_MAP_ATTRIBUTE

    return Success;
  }
  return false;
}

function RenderTerrainTile_After(xf: Float, yf: Float, xi: Int, yi: Int, lodi: Int, Flag: boolean): void {
  TerrainIndex1 = TERRAIN_INDEX(xi, yi);
  TerrainIndex2 = TERRAIN_INDEX(xi + lodi, yi);
  TerrainIndex3 = TERRAIN_INDEX(xi + lodi, yi + lodi);
  TerrainIndex4 = TERRAIN_INDEX(xi, yi + lodi);

  const sx = xf * TERRAIN_SCALE;
  const sy = yf * TERRAIN_SCALE;

  Vector(sx, sy, BackTerrainHeight[TerrainIndex1], TerrainVertex[0]);
  Vector(sx + TERRAIN_SCALE, sy, BackTerrainHeight[TerrainIndex2], TerrainVertex[1]);
  Vector(sx + TERRAIN_SCALE, sy + TERRAIN_SCALE, BackTerrainHeight[TerrainIndex3], TerrainVertex[2]);
  Vector(sx, sy + TERRAIN_SCALE, BackTerrainHeight[TerrainIndex4], TerrainVertex[3]);

  if ((TerrainWall[TerrainIndex1] & TW_HEIGHT) == TW_HEIGHT) TerrainVertex[0].z = g_fSpecialHeight;
  if ((TerrainWall[TerrainIndex2] & TW_HEIGHT) == TW_HEIGHT) TerrainVertex[1].z = g_fSpecialHeight;
  if ((TerrainWall[TerrainIndex3] & TW_HEIGHT) == TW_HEIGHT) TerrainVertex[2].z = g_fSpecialHeight;
  if ((TerrainWall[TerrainIndex4] & TW_HEIGHT) == TW_HEIGHT) TerrainVertex[3].z = g_fSpecialHeight;

  if (!Flag) {
    if ((TerrainWall[TerrainIndex1] & TW_NOGROUND) != TW_NOGROUND)
      RenderTerrainFace_After(xf, yf);
  }
}

function RenderTerrainBitmapTile(xf: Float, yf: Float, lodf: Float, lodi: Int, c: [Vector3, Vector3, Vector3, Vector3], LightEnable: boolean, Alpha: Float, Height: Float = 0.0): void {
  const xi: Int = Math.floor(xf);
  const yi: Int = Math.floor(yf);

  if (xi < 0 || yi < 0 || xi >= TERRAIN_SIZE_MASK || yi >= TERRAIN_SIZE_MASK) return;

  const TileScale = TERRAIN_SCALE * lodf;
  const sx = xf * TERRAIN_SCALE;
  const sy = yf * TERRAIN_SCALE;
  TerrainIndex1 = TERRAIN_INDEX(xi, yi);
  TerrainIndex2 = TERRAIN_INDEX(xi + lodi, yi);
  TerrainIndex3 = TERRAIN_INDEX(xi + lodi, yi + lodi);
  TerrainIndex4 = TERRAIN_INDEX(xi, yi + lodi);
  Vector(sx, sy, BackTerrainHeight[TerrainIndex1] + Height, TerrainVertex[0]);
  Vector(sx + TileScale, sy, BackTerrainHeight[TerrainIndex2] + Height, TerrainVertex[1]);
  Vector(sx + TileScale, sy + TileScale, BackTerrainHeight[TerrainIndex3] + Height, TerrainVertex[2]);
  Vector(sx, sy + TileScale, BackTerrainHeight[TerrainIndex4] + Height, TerrainVertex[3]);

  const Light: [Vector3, Vector3, Vector3, Vector3] = [Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero()];

  if (LightEnable) {
    VectorCopy(PrimaryTerrainLight[TerrainIndex1], Light[0]);
    VectorCopy(PrimaryTerrainLight[TerrainIndex2], Light[1]);
    VectorCopy(PrimaryTerrainLight[TerrainIndex3], Light[2]);
    VectorCopy(PrimaryTerrainLight[TerrainIndex4], Light[3]);
  }

  glBegin(GL_TRIANGLE_FAN);
  for (let i = 0; i < 4; i++) {
    if (LightEnable) {
      if (Alpha == 1.0)
        glColor3fv(Light[i]);
      else
        glColor4f(Light[i].x, Light[i].y, Light[i].z, Alpha);
    }
    glTexCoord2f(c[i].x, c[i].y);
    glVertex3fv(TerrainVertex[i]);
  }
  glEnd();
}

function RenderTerrainBitmap(Texture: Int, mxi: Int, myi: Int, Rotation: Float): void {
  glColor3f(1.0, 1.0, 1.0);

  const Angle = Vector3.Zero();
  Vector(0.0, 0.0, Rotation, Angle);

  // TODO matrix
  //   float Matrix[3][4];
  // AngleMatrix(Angle, Matrix);

  BindTexture(Texture);
  const b = Bitmaps[Texture];
  const TexScaleU = 64. / b.Width;
  const TexScaleV = 64. / b.Height;

  const p1: [Vector3, Vector3, Vector3, Vector3] = [Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero()];
  const p2: [Vector3, Vector3, Vector3, Vector3] = [Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero()];

  for (let y = 0.0; y < b.Height / 64; y += 1.0) {
    for (let x = 0.0; x < b.Width / 64; x += 1.0) {
      Vector((x) * TexScaleU, (y) * TexScaleV, 0.0, p1[0]);
      Vector((x + 1.0) * TexScaleU, (y) * TexScaleV, 0.0, p1[1]);
      Vector((x + 1.0) * TexScaleU, (y + 1.0) * TexScaleV, 0.0, p1[2]);
      Vector((x) * TexScaleU, (y + 1.0) * TexScaleV, 0.0, p1[3]);
      for (let i = 0; i < 4; i++) {
        p1[i].x -= 0.5;
        p1[i].y -= 0.5;
        //TODO rotation
        // VectorRotate(p1[i], Matrix, p2[i]);
        p2[i].x += 0.5;
        p2[i].z += 0.5;
      }
      RenderTerrainBitmapTile(mxi + x, myi + y, 1.0, 1, p2, true, 1.0);
    }
  }
}

// function RenderTerrainAlphaBitmap(Texture: Int, xf: Float, yf: Float, SizeX: Float, SizeY: Float, Light: Vector3, Rotation: Float, Alpha: Float, Height: Float): void {
//   if (Alpha == 1.0)
//     glColor3fv(Light);
//   else
//     glColor4f(Light.x, Light.y, Light.z, Alpha);

//   const Angle = Vector3.Zero();
//   Vector(0.0, 0.0, Rotation, Angle);

//   // TODO matrix
//   //   float Matrix[3][4];
//   // AngleMatrix(Angle, Matrix);

//   BindTexture(Texture);
//   const mxf = (xf / TERRAIN_SCALE);
//   const myf = (yf / TERRAIN_SCALE);
//     int   mxi = (int)(mxf);
//     int   myi = (int)(myf);

//   let Size;
//   if (SizeX >= SizeY)
//     Size = SizeX;
//   else
//     Size = SizeY;
//     float TexU = ((mxi - mxf) + 0.5 * Size);
//     float TexV = ((myi - myf) + 0.5 * Size);
//     float TexScaleU = 1.0 / Size;
//     float TexScaleV = 1.0 / Size;
//   Size = ((int)Size + 1);
//     float Aspect = SizeX / SizeY;
//   for (let y = -Size; y <= Size; y += 1.0) {
//     for (let x = -Size; x <= Size; x += 1.0) {
//             vec3_t p1[4], p2[4];
//       Vector((TexU + x) * TexScaleU, (TexV + y) * TexScaleV, 0.0, p1[0]);
//       Vector((TexU + x + 1.0) * TexScaleU, (TexV + y) * TexScaleV, 0.0, p1[1]);
//       Vector((TexU + x + 1.0) * TexScaleU, (TexV + y + 1.0) * TexScaleV, 0.0, p1[2]);
//       Vector((TexU + x) * TexScaleU, (TexV + y + 1.0) * TexScaleV, 0.0, p1[3]);
//       for (let i = 0; i < 4; i++) {
//         p1[i][0] -= 0.5;
//         p1[i][1] -= 0.5;
//         VectorRotate(p1[i], Matrix, p2[i]);
//         p2[i][0] *= Aspect;
//         p2[i][0] += 0.5;
//         p2[i][1] += 0.5;
//         //if((p2[i][0]>=0.0 && p2[i][0]<=1.0) || (p2[i][1]>=0.0 && p2[i][1]<=1.0)) Clip = true;
//       }
//       RenderTerrainBitmapTile(mxi + x, myi + y, 1.0, 1, p2, false, Alpha, Height);
//     }
//   }
// }

const FrustrumVertex: [Vector3, Vector3, Vector3, Vector3, Vector3] = [Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero()];
const FrustrumFaceNormal: [Vector3, Vector3, Vector3, Vector3, Vector3] = [Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero()];
const FrustrumFaceD: [Float, Float, Float, Float, Float] = [0, 0, 0, 0, 0];
const FrustrumBoundMinX = 0;
const FrustrumBoundMinY = 0;
const FrustrumBoundMaxX = TERRAIN_SIZE_MASK;
const FrustrumBoundMaxY = TERRAIN_SIZE_MASK;
const CameraTopViewEnable = true;
const FrustrumX: [Float, Float, Float, Float] = [0, 0, 0, 0];
const FrustrumY: [Float, Float, Float, Float] = [0, 0, 0, 0];

function GetScreenWidth(): Int {
  return 1024;
}

// function CreateFrustrum2D(Position: Vector3): void {
//   let Width = 0.0, CameraViewFar = 0.0, CameraViewNear = 0.0, CameraViewTarget = 0.0;
//   let WidthFar = 0.0, WidthNear = 0.0;

//   if (gMapManager.InBattleCastle() && SceneFlag == MAIN_SCENE) {
//     Width = GetScreenWidth() / 480.0;// * 0.1f;
//     if (battleCastle:: InBattleCastle2(Hero -> Object.Position) && (Hero -> Object.Position[0] < 17100.0 || Hero -> Object.Position[0] > 18300.0))
//     {
//       CameraViewFar = 5100.0;// * 0.1f;
//       CameraViewNear = CameraViewFar * 0.19;//0.22
//       CameraViewTarget = CameraViewFar * 0.47;//0.47
//       WidthFar = 2250.0 * Width; // 1140.0
//       WidthNear = 540.0 * Width; // 540.0
//     }
//         else
//     {
//       CameraViewFar = 3300.0;// * 0.1f;
//       CameraViewNear = CameraViewFar * 0.19;//0.22
//       CameraViewTarget = CameraViewFar * 0.47;//0.47
//       WidthFar = 1300.0 * Width; // 1140.0
//       WidthNear = 580.0 * Width; // 540.0
//     }
//   }
//   else if (gMapManager.WorldActive === ENUM_WORLD.WD_62SANTA_TOWN) {
//     Width = GetScreenWidth() / 450.0 * 1.0;
//     CameraViewFar = 2400.0;
//     CameraViewNear = CameraViewFar * 0.19;
//     CameraViewTarget = CameraViewFar * 0.47;
//     CameraViewFar = 2650.0;
//     WidthFar = 1250.0 * Width;
//     WidthNear = 540.0 * Width;
//   }
//   else if (gMapManager.IsPKField() || IsDoppelGanger2()) {
//     Width = GetScreenWidth() / 500.0;
//     CameraViewFar = 1700.0;
//     CameraViewNear = 55.0;
//     CameraViewTarget = 830.0;
//     CameraViewFar = 3300.0;
//     WidthFar = 1900.0 * Width;
//     WidthNear = 600.0 * Width;
//   }
//   else {
//         static  int CameraLevel;

//     if ((int)CameraDistanceTarget >= (int)CameraDistance)
//     CameraLevel = g_shCameraLevel;

//     switch (CameraLevel) {
//       case 0:
//         if (SceneFlag == LOG_IN_SCENE) {
//         }
//         else if (SceneFlag == CHARACTER_SCENE) {
//           Width = GetScreenWidth() / 640.0 * 9.1 * 0.404998;
//         }
//         else if (g_Direction.m_CKanturu.IsMayaScene()) {
//           Width = GetScreenWidth() / 640.0 * 10.0 * 0.115;
//         }
//         else {
//           Width = GetScreenWidth() / 640.0 * 1.1;
//         }

//         if (SceneFlag == LOG_IN_SCENE) {
//         }
//         else if (SceneFlag == CHARACTER_SCENE) {
//           CameraViewFar = 2000.0 * 9.1 * 0.404998;
//         }
//         else if (gMapManager.WorldActive === ENUM_WORLD.WD_39KANTURU_3RD) {
//           CameraViewFar = 2000.0 * 10.0 * 0.115;
//         }
//         else {
//           CameraViewFar = 2400.0;
//         }

//         if (SceneFlag == LOG_IN_SCENE) {
//           Width = GetScreenWidth() / 640.0;
//           CameraViewFar = 2400.0 * 17.0 * 13.0;
//           CameraViewNear = 2400.0 * 17.0 * 0.5;
//           CameraViewTarget = 2400.0 * 17.0 * 0.5;
//           WidthFar = 5000.0 * Width;
//           WidthNear = 300.0 * Width;
//         }
//         else {
//           CameraViewNear = CameraViewFar * 0.19;//0.22
//           CameraViewTarget = CameraViewFar * 0.47;//0.47
//           WidthFar = 1190.0 * Width * sqrtf(CameraFOV / 33.); // 1140.0
//           WidthNear = 540.0 * Width * sqrtf(CameraFOV / 33.); // 540.0
//         }
//         break;
//       case 1:
//         Width = GetScreenWidth() / 500.0 + 0.1;// * 0.1f;
//         CameraViewFar = 2700.0;// * 0.1f;
//         CameraViewNear = CameraViewFar * 0.19;//0.22
//         CameraViewTarget = CameraViewFar * 0.47;//0.47
//         WidthFar = 1200.0 * Width; // 1140.0
//         WidthNear = 540.0 * Width; // 540.0
//         break;
//       case 2:
//         Width = GetScreenWidth() / 500.0 + 0.1;// * 0.1f;
//         CameraViewFar = 3000.0;// * 0.1f;
//         CameraViewNear = CameraViewFar * 0.19;//0.22
//         CameraViewTarget = CameraViewFar * 0.47;//0.47
//         WidthFar = 1300.0 * Width; // 1140.0
//         WidthNear = 540.0 * Width; // 540.0
//         break;
//       case 3:
//         Width = GetScreenWidth() / 500.0 + 0.1;// * 0.1f;
//         CameraViewFar = 3300.0;// * 0.1f;
//         CameraViewNear = CameraViewFar * 0.19;//0.22
//         CameraViewTarget = CameraViewFar * 0.47;//0.47
//         WidthFar = 1500.0 * Width; // 1140.0
//         WidthNear = 580.0 * Width; // 540.0
//         break;
//       case 4:
//         Width = GetScreenWidth() / 500.0 + 0.1f;// * 0.1f;
//         CameraViewFar = 5100.0;// * 0.1f;
//         CameraViewNear = CameraViewFar * 0.19f;//0.22
//         CameraViewTarget = CameraViewFar * 0.47f;//0.47
//         WidthFar = 2250.0 * Width; // 1140.0
//         WidthNear = 540.0 * Width; // 540.0
//         break;
//       case 5:
//         Width = GetScreenWidth() / 500.0 + 0.1f;// * 0.1f;
//         CameraViewFar = 3400.0;// * 0.1f;
//         CameraViewNear = CameraViewFar * 0.19f;//0.22
//         CameraViewTarget = CameraViewFar * 0.47f;//0.47
//         WidthFar = 1600.0 * Width; // 1140.0
//         WidthNear = 660.0 * Width; // 540.0
//         break;
//     }
//   }

//     vec3_t p[4];
//   Vector(-WidthFar, CameraViewFar - CameraViewTarget, 0.0, p[0]);
//   Vector(WidthFar, CameraViewFar - CameraViewTarget, 0.0, p[1]);
//   Vector(WidthNear, CameraViewNear - CameraViewTarget, 0.0, p[2]);
//   Vector(-WidthNear, CameraViewNear - CameraViewTarget, 0.0, p[3]);
//     vec3_t Angle;
//     float Matrix[3][4];

//   if (gMapManager.WorldActive === ENUM_WORLD.WD_73NEW_LOGIN_SCENE) {
//     VectorScale(CameraAngle, -1.0, Angle);
//     CCameraMove:: GetInstancePtr() -> SetFrustumAngle(89.5);
//         vec3_t _Temp = { CCameraMove:: GetInstancePtr()-> GetFrustumAngle(), 0, 0;
//   };
//   VectorAdd(Angle, _Temp, Angle);
// }
//     else
// {
//   Vector(0.0, 0.0, 45., Angle);
// }

// AngleMatrix(Angle, Matrix);
//     vec3_t Frustrum[4];
// for (let i = 0; i < 4; i++) {
//   VectorRotate(p[i], Matrix, Frustrum[i]);
//   VectorAdd(Frustrum[i], Position, Frustrum[i]);
//   FrustrumX[i] = Frustrum[i][0] * 0.01f;
//   FrustrumY[i] = Frustrum[i][1] * 0.01f;
// }
// }

function TestFrustrum2D(x: Float, y: Float, Range: Float): boolean {
  if (SceneFlag == SERVER_LIST_SCENE || SceneFlag == WEBZEN_SCENE || SceneFlag == LOADING_SCENE) return true;

  let j = 3;
  for (let i = 0; i < 4; j = i, i++) {
    const d = (FrustrumX[i] - x) * (FrustrumY[j] - y) -
      (FrustrumX[j] - x) * (FrustrumY[i] - y);
    if (d <= Range) return false;

  }
  return true;
}

const Temp = [Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero(), Vector3.Zero()];

// function CreateFrustrum(Aspect: Float, position: Vector3): void {
//   const Distance = CameraViewFar * 0.9;
//   const Width = Math.tan(CameraFOV * 0.5 * Math.PI / 180.0) * Distance * Aspect + 100.0;
//   const Height = Width * 3. / 4.;

//   Vector(0.0, 0.0, 0.0, Temp[0]);
//   Vector(-Width, Height, -Distance, Temp[1]);
//   Vector(Width, Height, -Distance, Temp[2]);
//   Vector(Width, -Height, -Distance, Temp[3]);
//   Vector(-Width, -Height, -Distance, Temp[4]);

//   let FrustrumMinX = TERRAIN_SIZE * TERRAIN_SCALE;
//   let FrustrumMinY = TERRAIN_SIZE * TERRAIN_SCALE;
//   let FrustrumMaxX = 0.0;
//   let FrustrumMaxY = 0.0;

//     float Matrix[3][4];
//   GetOpenGLMatrix(Matrix);

//   for (let i = 0; i < 5; i++) {
//         vec3_t t;
//     VectorIRotate(Temp[i], Matrix, t);
//     VectorAdd(t, CameraPosition, FrustrumVertex[i]);
//     if (FrustrumMinX > FrustrumVertex[i][0]) FrustrumMinX = FrustrumVertex[i][0];
//     if (FrustrumMinY > FrustrumVertex[i][1]) FrustrumMinY = FrustrumVertex[i][1];
//     if (FrustrumMaxX < FrustrumVertex[i][0]) FrustrumMaxX = FrustrumVertex[i][0];
//     if (FrustrumMaxY < FrustrumVertex[i][1]) FrustrumMaxY = FrustrumVertex[i][1];
//   }

//     int tileWidth = 4;

//   FrustrumBoundMinX = (int)(FrustrumMinX / TERRAIN_SCALE) / tileWidth * tileWidth - tileWidth;
//   FrustrumBoundMinY = (int)(FrustrumMinY / TERRAIN_SCALE) / tileWidth * tileWidth - tileWidth;
//   FrustrumBoundMaxX = (int)(FrustrumMaxX / TERRAIN_SCALE) / tileWidth * tileWidth + tileWidth;
//   FrustrumBoundMaxY = (int)(FrustrumMaxY / TERRAIN_SCALE) / tileWidth * tileWidth + tileWidth;
//   FrustrumBoundMinX = FrustrumBoundMinX < 0 ? 0 : FrustrumBoundMinX;
//   FrustrumBoundMinY = FrustrumBoundMinY < 0 ? 0 : FrustrumBoundMinY;
//   FrustrumBoundMaxX = FrustrumBoundMaxX > TERRAIN_SIZE_MASK - tileWidth ? TERRAIN_SIZE_MASK - tileWidth : FrustrumBoundMaxX;
//   FrustrumBoundMaxY = FrustrumBoundMaxY > TERRAIN_SIZE_MASK - tileWidth ? TERRAIN_SIZE_MASK - tileWidth : FrustrumBoundMaxY;

//   FaceNormalize(FrustrumVertex[0], FrustrumVertex[1], FrustrumVertex[2], FrustrumFaceNormal[0]);
//   FaceNormalize(FrustrumVertex[0], FrustrumVertex[2], FrustrumVertex[3], FrustrumFaceNormal[1]);
//   FaceNormalize(FrustrumVertex[0], FrustrumVertex[3], FrustrumVertex[4], FrustrumFaceNormal[2]);
//   FaceNormalize(FrustrumVertex[0], FrustrumVertex[4], FrustrumVertex[1], FrustrumFaceNormal[3]);
//   FaceNormalize(FrustrumVertex[3], FrustrumVertex[2], FrustrumVertex[1], FrustrumFaceNormal[4]);
//   FrustrumFaceD[0] = -DotProduct(FrustrumVertex[0], FrustrumFaceNormal[0]);
//   FrustrumFaceD[1] = -DotProduct(FrustrumVertex[0], FrustrumFaceNormal[1]);
//   FrustrumFaceD[2] = -DotProduct(FrustrumVertex[0], FrustrumFaceNormal[2]);
//   FrustrumFaceD[3] = -DotProduct(FrustrumVertex[0], FrustrumFaceNormal[3]);
//   FrustrumFaceD[4] = -DotProduct(FrustrumVertex[1], FrustrumFaceNormal[4]);

//   CreateFrustrum2D(position);
// }

function TestFrustrum(Position: Vector3, Range: Float): boolean {
  for (let i = 0; i < 5; i++) {
    const Value = FrustrumFaceD[i] + DotProduct(Position, FrustrumFaceNormal[i]);
    if (Value < -Range) return false;
  }
  return true;
}

// #ifdef DYNAMIC_FRUSTRUM;

// void CFrustrum:: Make(vec3_t vEye, float fFov, float fAspect, float fDist);
// {
//     float Width = tanf(fFov * 0.5f * Math.PI / 180.0) * fDist * fAspect + 100.0;
//     float Height = Width * 3.f / 4.f;
//     vec3_t Temp[5];
//     vec3_t FrustrumVertex[5];
//   Vector(0.0, 0.0, 0.0, Temp[0]);
//   Vector(-Width, Height, -fDist, Temp[1]);
//   Vector(Width, Height, -fDist, Temp[2]);
//   Vector(Width, -Height, -fDist, Temp[3]);
//   Vector(-Width, -Height, -fDist, Temp[4]);

//     float Matrix[3][4];
//   GetOpenGLMatrix(Matrix);
//   for (let i = 0; i < 5; i++) {
//         vec3_t t;
//     VectorIRotate(Temp[i], Matrix, t);
//     VectorAdd(t, vEye, FrustrumVertex[i]);
//   }

//   FaceNormalize(FrustrumVertex[0], FrustrumVertex[1], FrustrumVertex[2], m_FrustrumNorm[0]);
//   FaceNormalize(FrustrumVertex[0], FrustrumVertex[2], FrustrumVertex[3], m_FrustrumNorm[1]);
//   FaceNormalize(FrustrumVertex[0], FrustrumVertex[3], FrustrumVertex[4], m_FrustrumNorm[2]);
//   FaceNormalize(FrustrumVertex[0], FrustrumVertex[4], FrustrumVertex[1], m_FrustrumNorm[3]);
//   FaceNormalize(FrustrumVertex[3], FrustrumVertex[2], FrustrumVertex[1], m_FrustrumNorm[4]);
//   m_FrustrumD[0] = -DotProduct(FrustrumVertex[0], m_FrustrumNorm[0]);
//   m_FrustrumD[1] = -DotProduct(FrustrumVertex[0], m_FrustrumNorm[1]);
//   m_FrustrumD[2] = -DotProduct(FrustrumVertex[0], m_FrustrumNorm[2]);
//   m_FrustrumD[3] = -DotProduct(FrustrumVertex[0], m_FrustrumNorm[3]);
//   m_FrustrumD[4] = -DotProduct(FrustrumVertex[1], m_FrustrumNorm[4]);
// }

// void CFrustrum:: Create(vec3_t vEye, float fFov, float fAspect, float fDist);
// {
//   Make(vEye, fFov, fAspect, fDist);

//   SetEye(vEye);
//   SetFOV(fFov);
//   SetAspect(fAspect);
//   SetDist(fDist);
// }

// bool CFrustrum:: Test(vec3_t vPos, float fRange);
// {
//   for (let i = 0; i < 5; ++i) {
//         float fValue;
//     fValue = m_FrustrumD[i] + DotProduct(vPos, m_FrustrumNorm[i]);
//     if (fValue < -fRange) return false;
//   }
//   return true;
// }

// void CFrustrum:: Reset();
// {
//   Make(m_vEye, m_fFov, m_fAspect, m_fDist);
// }

// void ResetAllFrustrum();
// {
//   FrustrumMap_t::iterator iter = g_FrustrumMap.begin();
//   for (; iter != g_FrustrumMap.end(); ++iter) {
//     CFrustrum * pData = iter -> second;
//     if (!pData) continue;
//     pData -> SetEye(CameraPosition);
//     pData -> Reset();
//   }
// }

// CFrustrum * FindFrustrum(unsigned int iID);
// {
//   FrustrumMap_t::iterator iter = g_FrustrumMap.find(iID);
//   if (iter != g_FrustrumMap.end()) return (CFrustrum *)iter -> second;
//   return NULL;
// }

// function DeleteAllFrustrum():void
// {
//   FrustrumMap_t::iterator iter = g_FrustrumMap.begin();
//   for (; iter != g_FrustrumMap.end(); ++iter) {
//     CFrustrum * pData = iter -> second;
//     SAFE_DELETE(pData);
//   }
//   g_FrustrumMap.clear();
// }

// #endif;// DYNAMIC_FRUSTRUM

/*bool TestFrustrum(vec3_t Position,float Range)
{
    int j = 3;
    for(let i=0;i<4;j=i,i++)
    {
        float d = (Frustrum[i][0]-Position[0]) * (Frustrum[j][1]-Position[1]) -
                  (Frustrum[j][0]-Position[0]) * (Frustrum[i][1]-Position[1]);
        if(d < 0.0) return false;
    }
    return true;
}*/

let RainCurrent: Float;
let EnableEvent: Int;

function InitTerrainLight(): void {
  let xi: Int;
  let yi: Int;

  yi = FrustrumBoundMinY;
  for (; yi <= FrustrumBoundMaxY + 3; yi += 1) {
    xi = FrustrumBoundMinX;
    for (; xi <= FrustrumBoundMaxX + 3; xi += 1) {
      const Index = TERRAIN_INDEX_REPEAT(xi, yi);
      VectorCopy(BackTerrainLight[Index], PrimaryTerrainLight[Index]);
    }
  }
  let WindScale;
  let WindSpeed;

  if (EnableEvent == 0) {
    WindScale = 10.0;
    WindSpeed = Math.floor(WorldTime) % (360000 * 2) * 0.002;
  }
  else {
    WindScale = 10.0;
    WindSpeed = Math.floor(WorldTime) % 36000 * (0.01);
  }

  // #ifdef ASG_ADD_MAP_KARUTAN
  //   let WindScale1 = 0.0;
  //   let WindSpeed1 = 0.0;
  // if (IsKarutanMap()) {
  //   WindScale1 = 15.0;
  //   WindSpeed1 = Math.floor(WorldTime) % 36000 * (0.008);
  // }
  // #endif;	// ASG_ADD_MAP_KARUTAN

  yi = FrustrumBoundMinY;

  for (; yi <= Math.min(FrustrumBoundMaxY + 3, TERRAIN_SIZE_MASK); yi += 1) {
    xi = FrustrumBoundMinX;
    let xf = xi;

    for (; xi <= Math.min(FrustrumBoundMaxX + 3, TERRAIN_SIZE_MASK); xi += 1, xf += 1.0) {
      const Index = TERRAIN_INDEX(xi, yi);
      if (gMapManager.WorldActive === ENUM_WORLD.WD_8TARKAN) {
        TerrainGrassWind[Index] = Math.sin(WindSpeed + xf * 50.0) * WindScale;
      }
      // #ifdef ASG_ADD_MAP_KARUTAN
      //       else if (IsKarutanMap()) {
      //   TerrainGrassWind[Index] = Math.sin(WindSpeed + xf * 50) * WindScale;
      //   g_fTerrainGrassWind1[Index] = Math.sin(WindSpeed1 + xf * 50) * WindScale1;
      // }
      // #endif;	// ASG_ADD_MAP_KARUTAN
      else if (gMapManager.WorldActive === ENUM_WORLD.WD_57ICECITY || gMapManager.WorldActive === ENUM_WORLD.WD_58ICECITY_BOSS) {
        WindScale = 60.0;
        TerrainGrassWind[Index] = Math.sin(WindSpeed + xf * 50) * WindScale;
      }
      else {
        TerrainGrassWind[Index] = Math.sin(WindSpeed + xf * 5) * WindScale;
      }
    }
  }
}

function InitTerrainShadow(): void {
  /*xi: Int,yi;
  yi = FrustrumBoundMinY*2;
  for(;yi<=FrustrumBoundMaxY*2;yi+=2)
  {
      xi = FrustrumBoundMinX*2;
      for(;xi<=FrustrumBoundMaxX*2;xi+=2)
      {
          int Index1 = (yi  )*512+(xi  );
          int Index2 = (yi  )*512+(xi+1);
          int Index3 = (yi+1)*512+(xi+1);
          int Index4 = (yi+1)*512+(xi  );
          if(TerrainShadow[Index1] >= 1.0)
          {
              Vector(0.0,0.0,0.0,PrimaryTerrainLight[Index1]);
              Vector(0.0,0.0,0.0,PrimaryTerrainLight[Index2]);
              Vector(0.0,0.0,0.0,PrimaryTerrainLight[Index3]);
              Vector(0.0,0.0,0.0,PrimaryTerrainLight[Index4]);
          }
      }
  }*/
}

function Ray(sx1: Int, sy1: Int, sx2: Int, sy2: Int): void {
  /*int ShadowIndex = (sy1*TERRAIN_SIZE*2+sx1);
  if(TerrainShadow[ShadowIndex]==1.0) return;

  int nx1,ny1,d1,d2,len1,len2;
  int px1 = sx2-sx1;
  int py1 = sy2-sy1;
  if(px1 < 0  ) {px1 = -px1;nx1 =-1             ;} else nx1 = 1;
  if(py1 < 0  ) {py1 = -py1;ny1 =-TERRAIN_SIZE*2;} else ny1 = TERRAIN_SIZE*2;
  if(px1 > py1) {len1 = px1;len2 = py1;d1 = ny1;d2 = nx1;}
  else          {len1 = py1;len2 = px1;d1 = nx1;d2 = ny1;}

  int error = 0,count = 0;
  float Shadow = 0.0;
  do{
      TerrainShadow[ShadowIndex] = Shadow;
      int x = ShadowIndex%(TERRAIN_SIZE*2)/2;
      int y = ShadowIndex/(TERRAIN_SIZE*2)/2;
      if(TerrainWall[TERRAIN_INDEX(x,y)] >= 5) Shadow = 1.0;
      error += len2;
      if(error > len1/2)
      {
          ShadowIndex += d1;
          error -= len1;
      }
      ShadowIndex += d2;
  } while(++count <= len1);*/
}

function InitTerrainRay(HeroX: Int, HeroY: Int): void {
  /*TerrainShadow[HeroY*512+HeroX] = 0.0;

  xi: Int,yi;
  yi = FrustrumBoundMinY*2;
  for(;yi<=FrustrumBoundMaxY*2;yi++)
  {
      xi = FrustrumBoundMinX*2;
      for(;xi<=FrustrumBoundMaxX*2;xi++)
      {
          TerrainShadow[(yi*TERRAIN_SIZE*2+xi)] = -1.0;
      }
  }
  yi = FrustrumBoundMinY*2;
  for(;yi<=FrustrumBoundMaxY*2;yi++)
  {
      xi = FrustrumBoundMinX*2;
      for(;xi<=FrustrumBoundMaxX*2;xi++)
      {
          Ray(HeroX,HeroY,xi,yi);
      }
  }*/
}

// render terrain block 4x4
function RenderTerrainBlock(xf: Float, yf: Float, xi: Int, yi: Int, EditFlag: boolean): void {
  for (let i = 0; i < 4; i++) {
    const temp = xf;
    for (let j = 0; j < 4; j++) {
      if (TestFrustrum2D(xf + 0.5, yf + 0.5, 0.0) || CameraTopViewEnable) {
        RenderTerrainTile(xf, yf, xi + j, yi + i, EditFlag);
      }
      xf += 1;
    }
    xf = temp;
    yf += 1;
  }
}

function RenderTerrainFrustrum(EditFlag: boolean): void {
  let xi: Int;
  let yi: Int = FrustrumBoundMinY;
  let xf: Float;
  let yf = yi;

  for (; yi <= FrustrumBoundMaxY; yi += 4, yf += 4) {
    xi = FrustrumBoundMinX;
    xf = xi;

    for (; xi <= FrustrumBoundMaxX; xi += 4, xf += 4) {
      if (TestFrustrum2D(xf + 2, yf + 2, g_fFrustumRange) || CameraTopViewEnable) {
        // #ifdef PJH_NEW_SERVER_SELECT_MAP;
        // if (gMapManager.WorldActive === ENUM_WORLD.WD_73NEW_LOGIN_SCENE)
        //   #else;
        // if (World == WD_77NEW_LOGIN_SCENE)
        //   #endif; //PJH_NEW_SERVER_SELECT_MAP
        // {
        //             const fDistance_x = CameraPosition.x - xf / 0.01;
        //             const fDistance_y = CameraPosition.y - yf / 0.01;
        //             const fDistance = Math.sqrt(fDistance_x * fDistance_x + fDistance_y * fDistance_y);

        //   if (fDistance > 5200.0)
        //     continue;
        // }
        RenderTerrainBlock(xf, yf, xi, yi, EditFlag);
      }
    }
  }
}

function RenderTerrainBlock_After(xf: Float, yf: Float, xi: Int, yi: Int, EditFlag: boolean): void {
  const lodi = 1;
  const lodf = lodi;

  for (let i = 0; i < 4; i += lodi) {
    const temp = xf;
    for (let j = 0; j < 4; j += lodi) {
      if (TestFrustrum2D(xf + 0.5, yf + 0.5, 0.0) || CameraTopViewEnable) {
        RenderTerrainTile_After(xf, yf, xi + j, yi + i, lodi, EditFlag);
      }
      xf += lodf;
    }
    xf = temp;
    yf += lodf;
  }
}

function RenderTerrainFrustrum_After(EditFlag: boolean): void {
  let xi: Int;
  let yi: Int;

  let xf: Float;
  let yf: Float;

  yi = FrustrumBoundMinY;
  yf = yi;

  for (; yi <= FrustrumBoundMaxY; yi += 4, yf += 4) {
    xi = FrustrumBoundMinX;
    xf = xi;
    for (; xi <= FrustrumBoundMaxX; xi += 4, xf += 4) {
      if (TestFrustrum2D(xf + 2, yf + 2, -80.0) || CameraTopViewEnable) {
        RenderTerrainBlock_After(xf, yf, xi, yi, EditFlag);
      }
    }
  }
}

let SelectMapping: Int;

//extern  void RenderCharactersClient();

function RenderTerrain(EditFlag: boolean): void {
  if (!EditFlag) {
    if (gMapManager.WorldActive === ENUM_WORLD.WD_8TARKAN) {
      WaterMove = (Math.floor(WorldTime) % 40000) * 0.000025;
    }
    else if (gMapManager.WorldActive === ENUM_WORLD.WD_42CHANGEUP3RD_2ND) {
      const iWorldTime = Math.floor(WorldTime);
      const iRemainder = iWorldTime % 50000;
      WaterMove = iRemainder * 0.00002;
    }
    else {
      WaterMove = (Math.floor(WorldTime) % 20000) * 0.00005;
    }
  }

  if (!EditFlag) {
    DisableAlphaBlend();
  }
  else {
    SelectFlag = false;
    InitCollisionDetectLineToFace();
  }

  TerrainFlag = TERRAIN_MAP_NORMAL;
  RenderTerrainFrustrum(EditFlag);
  //
  if (EditFlag && SelectFlag) {
    RenderTerrainTile(SelectXF, SelectYF, Math.floor(SelectXF), Math.floor(SelectYF), 1, EditFlag);
  }
  if (!EditFlag) {
    EnableAlphaTest();
    if (TerrainGrassEnable && gMapManager.WorldActive !== ENUM_WORLD.WD_7ATLANSE && !IsDoppelGanger3()) {
      TerrainFlag = TERRAIN_MAP_GRASS;
      RenderTerrainFrustrum(EditFlag);
    }
    DisableDepthTest();
    EnableCullFace();
    RenderPointers();
    EnableDepthTest();
  }
}

// function RenderTerrain_After(EditFlag: boolean): void {
//   if (gMapManager.WorldActive !== ENUM_WORLD.WD_39KANTURU_3RD)
//     return;

//   TerrainFlag = TERRAIN_MAP_NORMAL;
//   RenderTerrainFrustrum_After(EditFlag);
// }

// OBJECT Sun;

// function CreateSun():void{
//   //Sun.Type = BITMAP_LIGHT;
//   Sun.Scale = 8.f;
//   Sun.AnimationFrame = 1.0;
// }

// function RenderSun(): void {
//   EnableAlphaBlend();
//     vec3_t Angle;
//     float Matrix[3][4];
//   Angle[0] = 0.0;
//   Angle[1] = 0.0;
//   Angle[2] = CameraAngle[2];
//   AngleIMatrix(Angle, Matrix);
//     vec3_t p, Position;
//   Vector(-900.0, CameraViewFar * 0.9f, 0.0, p);
//   VectorRotate(p, Matrix, Position);
//   VectorAdd(CameraPosition, Position, Sun.Position);
//   Sun.Position[2] = 550.0;
//   Sun.Visible = TestDepthBuffer(Sun.Position);
//   BeginSprite();
//   //RenderSprite(&Sun);
//   EndSprite();
//   DisableAlphaBlend();
// }

// function RenderSky(): void {
//     vec3_t Angle;
//     float Matrix[3][4];
//   Angle[0] = 0.0;
//   Angle[1] = 0.0;
//   Angle[2] = CameraAngle[2];
//   AngleIMatrix(Angle, Matrix);
//     float Aspect = (float)(WindowWidth) / (float)(WindowWidth);
//     float Width = 1780.0 * Aspect;

//   BeginSprite();
//     vec3_t p, Position;
//     float Num = 20.0;
//     vec3_t LightTable[21];

//   for (let i = 0; i <= Num; i++) {
//     Vector(((float)i - Num * 0.5) * (Width / Num), CameraViewFar * 0.99f, 0.0, p);
//     VectorRotate(p, Matrix, Position);
//     VectorAdd(CameraPosition, Position, Position);
//     RequestTerrainLight(Position[0], Position[1], LightTable[i]);
//   }

//   for (let i = 1; i <= (int)Num; i++)
//   {
//     if (LightTable[i][0] <= 0.0) {
//       Vector(0.0, 0.0, 0.0, LightTable[i - 1]);
//     }
//   }

//   for (let i = (int)Num - 1; i >= 0; i--)
//   {
//     if (LightTable[i][0] <= 0.0) {
//       Vector(0.0, 0.0, 0.0, LightTable[i + 1]);
//     }
//   }
//   for (let x = 0; x < Num; x += 1) {
//         float UV[4][2];
//     TEXCOORD(UV[0], (x) * (1.0 / Num), 1.0);
//     TEXCOORD(UV[1], (x + 1.0) * (1.0 / Num), 1.0);
//     TEXCOORD(UV[2], (x + 1.0) * (1.0 / Num), 0.0);
//     TEXCOORD(UV[3], (x) * (1.0 / Num), 0.0);

//         vec3_t Light[4];
//     VectorCopy(LightTable[(int)x], Light[0]);
//     VectorCopy(LightTable[(int)x + 1], Light[1]);
//     //VectorCopy(LightTable[(int)x+1],Light[2]);
//     //VectorCopy(LightTable[(int)x  ],Light[3]);
//     Vector(1.0, 1.0, 1.0, Light[2]);
//     Vector(1.0, 1.0, 1.0, Light[3]);

//     Vector((x - Num * 0.5 + 0.5) * (Width / Num), CameraViewFar * 0.9, 0.0, p);
//     VectorRotate(p, Matrix, Position);
//     VectorAdd(CameraPosition, Position, Position);
//     Position[2] = 400.0;
//     //RenderSpriteUV(BITMAP_SKY,Position,Width/Num,Height,UV,Light);
//   }
//   EndSprite();
// }
