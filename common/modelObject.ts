import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { BMD, BMDTextureBone } from './BMD';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import {
  Color3,
  Mesh,
  RawTexture,
  StandardMaterial,
  Texture,
  TransformNode,
  VertexBuffer,
  type Scene,
} from '@babylonjs/core';
import { OpenTga } from './textures/test';
import { CustomMaterial } from '../src/libs/babylon/exports';
import { getEmptyTexture } from '../src/libs/babylon/emptyTexture';

const MAX_BONES = 32;
export function createCustomMaterial(
  scene: Scene,
  opts: { withTint?: boolean }
) {
  const mat = new CustomMaterial('TexturesAtlasMaterial', scene);
  mat.fogEnabled = true;
  mat.backFaceCulling = false;
  mat.transparencyMode = 1;
  mat.useAlphaFromDiffuseTexture = true;
  mat.specularColor = Color3.Black();

  mat.AddAttribute(VertexBuffer.UV2Kind);
  mat.AddUniform(`bonesArray[${MAX_BONES}]`, 'mat4', undefined);

  mat.Vertex_After_WorldPosComputed(`
    float boneIndexFloat = uv2.x;
    int boneIndex = int(boneIndexFloat);
    finalWorld = world * bonesArray[boneIndex];
     worldPos = finalWorld*vec4(positionUpdated, 1.0);
     normalWorld = mat3(finalWorld);
    // vNormalW = normalize(normalWorld*normalUpdated);
    vNormalW = normalize(normalWorld*vec3(0.0,0.0,0.5));
  `);

  // let time = 0;
  scene.onReadyObservable.addOnce(() => {
    // scene.onBeforeRenderObservable.add(() => {
    //   time += scene.getEngine()!.getDeltaTime()! / 1000;
    // });

    mat.onBindObservable.add(ev => {
      const effect = mat.getEffect();
      if (!effect) return;
      // effect.setFloat('time', time);
      const array = ev.metadata?.array;
      if (!array) return;
      effect.setMatrices('bonesArray', array);
    });
  });

  mat.unfreeze();

  return mat;
}

const textureCache: Record<string, RawTexture> = {};
async function loadOZTTexture(
  filePath: string,
  scene: Scene,
  invertY: boolean
) {
  if (textureCache[filePath]) return textureCache[filePath];

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
  t.anisotropicFilteringLevel = 1;
  t.name = filePath;

  textureCache[filePath] = t;
  return t;
}

type Int = number;

type GameTime = {
  TotalGameTime: {
    TotalSeconds: number;
  };
};

const materialCache: Record<string, StandardMaterial> = {};

function getMaterial(
  bmd: BMD,
  meshIndex: number,
  scene: Scene,
  worldNum: number,
  mesh: BMD['Meshes'][number]
) {
  const uniqName = bmd.Name + '_mesh' + meshIndex;
  // const uniqName = '_mat_';

  if (materialCache[uniqName]) return materialCache[uniqName];

  const m = createCustomMaterial(scene, {});
  m.name = uniqName;
  m.backFaceCulling = false;
  m.diffuseTexture = getEmptyTexture(scene);
  m.emissiveTexture = getEmptyTexture(scene);

  const textureName = mesh.TexturePath;

  const objectsFolder = `./data/Object${worldNum}/`;

  if (textureName.toLowerCase().endsWith('.tga')) {
    const textureFilePath = objectsFolder + textureName.replace('.tga', '.OZT');

    loadOZTTexture(textureFilePath, scene, true).then(t => {
      t.hasAlpha = true;
      m.diffuseTexture = t;
    });

    m.transparencyMode = 2;
    m.useAlphaFromDiffuseTexture = true;
  } else {
    const textureFilePath = objectsFolder + textureName;

    const t = new Texture(textureFilePath, scene, false, false);
    m.diffuseTexture = t;
  }

  materialCache[uniqName] = m;

  return m;
}

const EmptyBone = Matrix.Identity();

function createMeshesForBMD(
  scene: Scene,
  bmd: BMD,
  worldNum: number,
  parent: TransformNode
) {
  return bmd.Meshes.map((mesh, meshIndex) => {
    const customMesh = new Mesh(bmd.Name + '_mesh' + meshIndex, scene);
    // customMesh.showBoundingBox = true;

    customMesh.scaling.setAll(1);

    customMesh.setParent(parent);
    customMesh.position.setAll(0);
    customMesh.rotationQuaternion = null;
    customMesh.rotation.setAll(0);
    customMesh.metadata = {
      array: [],
    };

    const positions: number[] = []; //vec3
    const indices: number[] = []; //float
    const uvs: number[] = []; //vec2
    const normals: number[] = []; //vec3
    const colors: number[] = []; //vec4
    const boneIndex: number[] = [];

    let pi = 0;

    for (let i = 0; i < mesh.Triangles.length; i++) {
      const triangle = mesh.Triangles[i];

      for (let j = 0; j < triangle.Polygon; j++) {
        const vertexIndex = triangle.VertexIndex[j];
        const vertex = mesh.Vertices[vertexIndex];

        const normalIndex = triangle.NormalIndex[j];
        const normal = mesh.Normals[normalIndex].Normal;
        const coordIndex = triangle.TexCoordIndex[j];
        const texCoord = mesh.TexCoords[coordIndex];

        const pos = vertex.Position;

        indices.push(pi);
        positions.push(pos.x, pos.y, pos.z);
        normals.push(normal.x, normal.y, normal.z);
        uvs.push(texCoord.U, texCoord.V);
        colors.push(1, 1, 1, 1);

        boneIndex.push(vertex.Node, 0);

        pi++;
      }
    }

    const vertexData = new VertexData();

    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    vertexData.uvs = uvs;
    vertexData.uvs2 = boneIndex;
    vertexData.colors = colors;

    vertexData.applyToMesh(customMesh, false);

    customMesh.material = getMaterial(bmd, meshIndex, scene, worldNum, mesh);

    return customMesh;
  });
}

const tmpMatrix = Matrix.Identity();
const tmpQ = Quaternion.Identity();
const tmpVec3 = Vector3.Zero();

export class ModelObject {
  HiddenMesh = -1;
  AnimationSpeed = 4.0;
  BoneTransform: Matrix[];
  BodyHeight: Float = 0;
  CurrentAction: Int = 0;
  LinkParent = false;
  Ready = true;
  OutOfView = false;
  Visible = true;

  _invalidatedBuffers = true;
  // _meshesVertexData: VertexData[];
  _meshesBonesData: Float32Array[];
  private _dataTextures: any[] = [];
  private _priorAction: Int = 0;
  Light = new Vector3(0, 0, 0);

  private _node: TransformNode;
  private _meshes: Mesh[] = [];

  get Model() {
    return this.bmd;
  }

  constructor(
    readonly bmd: BMD,
    private readonly scene: Scene,
    worldNum: number
  ) {
    this._node = new TransformNode(bmd.Name, this.scene);
    this._node.rotationQuaternion = null;

    this._meshes = createMeshesForBMD(scene, bmd, worldNum, this._node);

    this.BoneTransform = new Array(this.Model.Bones.length).fill(null);
    this.BoneTransform.forEach((_, i) => {
      this.BoneTransform[i] = Matrix.Identity();
    });

    // this._meshesVertexData = new Array(bmd.Meshes.length).fill(null);
    this._meshesBonesData = new Array(bmd.Meshes.length)
      .fill(null)
      .map(i => new Float32Array(MAX_BONES * 16));
  }

  load() {
    this.generateBoneMatrix(0, 0, 0, 0);
  }

  Update(gameTime: GameTime): void {
    // base.Update(gameTime);

    if (!this.Ready || this.OutOfView) return;

    // if (_effect != null)
    // {
    //     if (_effect is IEffectMatrices effectMatrices)
    //     {
    //         effectMatrices.View = Camera.Instance.View;
    //         effectMatrices.Projection = Camera.Instance.Projection;
    //     }
    //     else
    //     {
    //         _effect.Parameters["View"]?.SetValue(Camera.Instance.View);
    //         _effect.Parameters["Projection"]?.SetValue(Camera.Instance.Projection);
    //     }
    // }

    this.RunAnimation(gameTime);
    this.SetDynamicBuffers();
  }

  Draw(gameTime: GameTime): void {
    if (!this.Visible) return;
    // GraphicsDevice.DepthStencilState = DepthStencilState.Default;
    this.DrawModel(false);
    // base.Draw(gameTime);
  }

  DrawModel(isAfterDraw: boolean): void {
    const meshCount = this.Model.Meshes.length; // Cache mesh count

    for (let i = 0; i < meshCount; i++) {
      // if (this._dataTextures[i] == null) continue;
      // bool isRGBA = _dataTextures[i].Components === 4;
      // bool isBlendMesh = BlendMesh == i;
      // bool draw = isAfterDraw
      //     ? isRGBA || isBlendMesh
      //     : !isRGBA && !isBlendMesh;

      // if (!isAfterDraw && RenderShadow)
      // {
      //     GraphicsDevice.DepthStencilState = MuGame.Instance.DisableDepthMask;
      //     DrawShadowMesh(i);
      // }

      // if (!draw) continue;

      // GraphicsDevice.DepthStencilState = isAfterDraw
      //     ? MuGame.Instance.DisableDepthMask
      //     : DepthStencilState.Default;

      this.DrawMesh(i);
    }
  }

  DrawMesh(mesh: Int): void {
    if (this.HiddenMesh === mesh) return;

    // const texture = this._boneTextures[mesh];
    // const vertexBuffer: VertexBuffer = this._boneVertexBuffers[mesh];
    // const indexBuffer: IndexBuffer = this._boneIndexBuffers[mesh];
    // const primitiveCount = indexBuffer.IndexCount / 3;

    // const vertexData = this._meshesVertexData[mesh];

    // if (vertexData == null) return;

    // const primitiveCount = vertexData.indices!.length / 3;

    // this._effect.Parameters["Texture"]?.SetValue(texture);

    // GraphicsDevice.BlendState = BlendMesh == mesh ? BlendMeshState : BlendState;
    // if (_effect is AlphaTestEffect alphaTestEffect)
    //     alphaTestEffect.Alpha = TotalAlpha;

    // foreach (EffectPass pass in _effect.CurrentTechnique.Passes)
    // {
    //     pass.Apply();

    //     GraphicsDevice.SetVertexBuffer(vertexBuffer);
    //     GraphicsDevice.Indices = indexBuffer;
    //     GraphicsDevice.DrawIndexedPrimitives(PrimitiveType.TriangleList, 0, 0, primitiveCount);
    // }

    // vertexData.applyToMesh(this._meshes[mesh], true);
    // vertexData.updateMesh(this._meshes[mesh]);
    this._meshes[mesh].metadata.array = this._meshesBonesData[mesh];
  }

  // DrawShadowMesh( mesh:Int):void{
  //     if (HiddenMesh === mesh || _boneVertexBuffers == null)
  //         return;

  //     Texture2D texture = _boneTextures[mesh];
  //     VertexBuffer vertexBuffer = _boneVertexBuffers[mesh];
  //     IndexBuffer indexBuffer = _boneIndexBuffers[mesh];
  //     int primitiveCount = indexBuffer.IndexCount / 3;

  //     _effect.Parameters["Texture"]?.SetValue(texture);

  //     VertexPositionColorNormalTexture[] shadowVertices = new VertexPositionColorNormalTexture[vertexBuffer.VertexCount];

  //     // Ensure alpha blending is enabled
  //     GraphicsDevice.BlendState = BlendState.AlphaBlend;

  //     if (_effect is AlphaTestEffect effect)
  //     {
  //         vertexBuffer.GetData(shadowVertices);

  //         // Clamp ShadowOpacity to a valid range (0 to 1)
  //         float clampedShadowOpacity = MathHelper.Clamp(ShadowOpacity, 0f, 1f);

  //         // Ensure that ShadowOpacity is being applied to each vertex color
  //         for (int i = 0; i < shadowVertices.Length; i++)
  //         {
  //             // Apply shadow opacity to the alpha channel, ensuring the value is between 0 and 255
  //             byte shadowAlpha = (byte)(255 * clampedShadowOpacity);
  //             shadowVertices[i].Color = new Color((byte)0, (byte)0, (byte)0, shadowAlpha);  // Apply shadow with calculated alpha
  //         }

  //         Matrix originalWorld = effect.World;
  //         Matrix originalView = effect.View;
  //         Matrix originalProjection = effect.Projection;

  //         // Get the model's rotation from the original world matrix
  //         Vector3 scale, translation;
  //         Quaternion rotation;
  //         originalWorld.Decompose(out scale, out rotation, out translation);

  //         // Create a world matrix for the shadow with the model's rotation
  //         Matrix world = Matrix.CreateFromQuaternion(rotation) *
  //                        Matrix.CreateRotationX(MathHelper.ToRadians(-20)) *
  //                        Matrix.CreateScale(0.8f, 1.0f, 0.8f) *
  //                        Matrix.CreateTranslation(translation);

  //         // Add light and shadow offset
  //         Vector3 lightDirection = new Vector3(-1, 0, 1);
  //         Vector3 shadowOffset = new Vector3(0.05f, 0, 0.1f);
  //         world.Translation += lightDirection * 0.3f + shadowOffset;

  //         effect.World = world;

  //         foreach (EffectPass pass in effect.CurrentTechnique.Passes)
  //         {
  //             pass.Apply();
  //             GraphicsDevice.DrawUserPrimitives(PrimitiveType.TriangleList, shadowVertices, 0, primitiveCount);
  //         }

  //         // Restore original matrices
  //         effect.World = originalWorld;
  //         effect.View = originalView;
  //         effect.Projection = originalProjection;
  //     }
  // }

  DrawAfter(gameTime: GameTime): void {
    if (!this.Visible) return;
    this.DrawModel(true);
    // base.DrawAfter(gameTime);
  }

  private RunAnimation(gameTime: GameTime): void {
    if (this.LinkParent || this.Model.Actions.length < 1) return;

    const currentActionData = this.Model.Actions[this.CurrentAction];

    if (currentActionData.NumAnimationKeys <= 1) {
      if (this._priorAction != this.CurrentAction) {
        this.generateBoneMatrix(this.CurrentAction, 0, 0, 0);
        this._priorAction = this.CurrentAction;
      }
      return;
    }

    let currentFrame =
      gameTime.TotalGameTime.TotalSeconds * this.AnimationSpeed;
    const totalFrames = currentActionData.NumAnimationKeys - 1;
    currentFrame %= totalFrames;

    this.Animation(currentFrame);

    this._priorAction = this.CurrentAction;
  }

  private Animation(currentFrame: Float): void {
    if (this.LinkParent || this.Model == null || this.Model.Actions.length < 1)
      return;

    if (this.CurrentAction >= this.Model.Actions.length) this.CurrentAction = 0;

    const currentAnimationFrame: Int = ~~Math.floor(currentFrame);
    const interpolationFactor = currentFrame - currentAnimationFrame;

    const currentActionData = this.Model.Actions[this.CurrentAction];
    const totalFrames = currentActionData.NumAnimationKeys - 1;
    const nextAnimationFrame = (currentAnimationFrame + 1) % totalFrames;

    this.generateBoneMatrix(
      this.CurrentAction,
      currentAnimationFrame,
      nextAnimationFrame,
      interpolationFactor
    );
  }

  generateBoneMatrix(
    currentAction: Int,
    currentAnimationFrame: Int,
    nextAnimationFrame: Int,
    interpolationFactor: Float
  ): void {
    const currentActionData = this.Model.Actions[currentAction];
    let changed = false;

    const boneTransforms = this.BoneTransform; // Cache BoneTransform
    const modelBones = this.Model.Bones; // Cache Model.Bones

    for (let i = 0; i < modelBones.length; i++) {
      const bone = modelBones[i];

      if (bone === BMDTextureBone.Dummy) continue;

      const bm = bone.Matrixes[currentAction];

      const q1 = bm.Quaternion[currentAnimationFrame];
      const q2 = bm.Quaternion[nextAnimationFrame];

      const boneQuaternion = Quaternion.SlerpToRef(
        q1,
        q2,
        interpolationFactor,
        tmpQ
      );
      tmpMatrix.copyFrom(Matrix.IdentityReadOnly);
      let matrix = tmpMatrix;

      Matrix.FromQuaternionToRef(boneQuaternion, matrix);

      const position1 = bm.Position[currentAnimationFrame];
      const position2 = bm.Position[nextAnimationFrame];
      const interpolatedPosition = Vector3.LerpToRef(
        position1,
        position2,
        interpolationFactor,
        tmpVec3
      );

      if (i === 0 && currentActionData.LockPositions) {
        const row = matrix.getRow(3);
        if (row) {
          row.x = bm.Position[0].x;
          row.z = bm.Position[0].z;
          row.y =
            position1.y * (1 - interpolationFactor) +
            position2.y * interpolationFactor +
            this.BodyHeight;
          matrix.setRow(3, row);
        }
      } else {
        matrix.setTranslation(interpolatedPosition);
      }

      if (bone.Parent !== -1) {
        const parentMatrix = boneTransforms[bone.Parent];
        matrix.multiplyToRef(parentMatrix, matrix); //TODO check it
      }

      if (!changed && !boneTransforms[i].equalsWithEpsilon(matrix))
        changed = true;

      boneTransforms[i].copyFrom(matrix);
    }

    if (changed) {
      this._invalidatedBuffers = true;
      // this.InvalidateBuffers();
      // this.UpdateBoundings();
    }
  }

  private SetDynamicBuffers(): void {
    if (!this._invalidatedBuffers) return;

    const meshCount = this.Model.Meshes.length; // Cache mesh count

    // this._boneVertexBuffers ??= new VertexBuffer[meshCount];
    // this._boneIndexBuffers ??= new IndexBuffer[meshCount];
    // this._boneTextures ??= new Texture2D[meshCount];
    // this._scriptTextures ??= new TextureScript[meshCount];
    // this._dataTextures ??= new TextureData[meshCount];

    for (let meshIndex = 0; meshIndex < meshCount; meshIndex++) {
      const mesh = this.Model.Meshes[meshIndex];

      // Resolve the body light conflict
      let bodyLight = Vector3.ZeroReadOnly;

      // if (this.LightEnabled && this.World.Terrain != null)
      // {
      //     Vector3 terrainLight = World.Terrain.RequestTerrainLight(WorldPosition.Translation.X, WorldPosition.Translation.Y);
      //     terrainLight += Light;
      //     bodyLight = terrainLight;
      // }
      // else
      // {
      bodyLight = this.Light;
      // }

      // bodyLight = meshIndex == BlendMesh
      //     ? bodyLight * BlendMeshLight
      //     : bodyLight * TotalAlpha;

      // _boneVertexBuffers[meshIndex]?.Dispose();
      // _boneIndexBuffers[meshIndex]?.Dispose();

      // Matrix[] bones = (this.LinkParent && this.Parent is ModelObject parentModel) ? parentModel.BoneTransform : this.BoneTransform;
      const bones = this.BoneTransform;

      // Use the updated color calculation method from the improvements branch
      // byte r = Color.R;
      // byte g = Color.G;
      // byte b = Color.B;

      // Calculate color components considering lighting and clamping values
      // byte bodyR = (byte)Math.Min(r * bodyLight.X, 255);
      // byte bodyG = (byte)Math.Min(g * bodyLight.Y, 255);
      // byte bodyB = (byte)Math.Min(b * bodyLight.Z, 255);

      // Color bodyColor = new Color(bodyR, bodyG, bodyB);

      for (let b = 0; b < MAX_BONES; b++)
        for (let c = 0; c < 16; c++)
          this._meshesBonesData[meshIndex][b * 16 + c] = (
            bones[b] ?? EmptyBone
          ).m[c];

      // this._meshesVertexData[meshIndex] = newVertexData;
      // _boneVertexBuffers[meshIndex] = vertexBuffer;
      // _boneIndexBuffers[meshIndex] = indexBuffer;

      // if (_boneTextures[meshIndex] == null)
      // {
      //     string texturePath = BMDLoader.Instance.GetTexturePath(Model, mesh.TexturePath);
      //     _boneTextures[meshIndex] = TextureLoader.Instance.GetTexture2D(texturePath);
      //     _scriptTextures[meshIndex] = TextureLoader.Instance.GetScript(texturePath);
      //     _dataTextures[meshIndex] = TextureLoader.Instance.Get(texturePath);

      //     var script = _scriptTextures[meshIndex];

      //     if (script != null)
      //     {
      //         if (script.HiddenMesh)
      //             HiddenMesh = meshIndex;

      //         if (script.Bright)
      //             BlendMesh = meshIndex;
      //     }
      // }
    }

    this._invalidatedBuffers = false;
  }

  updateLocation(pos: Vector3, scale: Float, angles: Vector3) {
    this._node.position.copyFrom(pos);
    this._node.rotation.x = angles.x;
    this._node.rotation.y = angles.y;
    this._node.rotation.z = angles.z;
    this._node.scaling.setAll(scale);
  }
}

// function TransformCoordinatesFromFloatsToRef<T extends Vector3>(
//   x: number,
//   y: number,
//   z: number,
//   transformation: Matrix,
//   result: T
// ): T {
//   const m = transformation.m;
//   const rx = x * m[0] + y * m[4] + z * m[8] + m[12];
//   const ry = x * m[1] + y * m[5] + z * m[9] + m[13];
//   const rz = x * m[2] + y * m[6] + z * m[10] + m[14];
//   //const rw = 1 / (x * m[3] + y * m[7] + z * m[11] + m[15]);

//   result.x = rx;
//   result.y = ry;
//   result.z = rz;
//   return result;
// }
