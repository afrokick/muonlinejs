import { type Scene, ShaderMaterial, type Texture } from '../babylon/exports';

const FINAL_COLOR_VAR_NAME = `finalColor`;

export function createTerrainMaterial(
  scene: Scene,
  { name }: { name: string },
  config: {
    texturesData: { texture: Texture; scale: number }[];
  }
) {
  const finalColorStr = config.texturesData
    .map((_, i) => {
      const textureData = config.texturesData[i];
      const isWater = i === 5; // || (Texture == 11 && (gMapManager.IsPKField() || IsDoppelGanger2()) //TODO
      return `
  if (m1 >= ${i}.0 && m1 < ${i}.1) {
      opaqueColor = texture2D(textures[${i}], vUV * ${textureData.scale.toFixed(
        1
      )}${isWater ? ` + vec2(WaterMove,GrassWind)` : ''}).rgb;
  }
  if (m2 >= ${i}.0 && m2 < ${i}.1) {
      alphaColor = texture2D(textures[${i}], vUV * ${textureData.scale.toFixed(
        1
      )}${isWater ? ` + vec2(WaterMove,GrassWind)` : ''}).rgb;
      alphaRendered = true;
  }
  `;
    })
    .join('');

  const terrainMaterial = new ShaderMaterial(
    'SplatTerrainMaterial' + name,
    scene,
    {
      vertexSource: `
  precision highp float;
  attribute vec3 position;
  attribute vec2 uv;
  attribute vec2 uv2;
  attribute vec4 color;
  attribute vec4 matricesWeights; // used for alpha blending
  uniform mat4 viewProjection;
  uniform mat4 view;
  uniform mat4 world;
  varying vec2 vUV;
  varying float vOpaqueTexture;
  varying float vAlphaTexture;
  varying vec4 vColor;
  varying vec4 vAlphaColor;

  void main() {
      vec4 p = vec4(position, 1.);
      vec4 worldPosition = world * p;
      vUV = uv;
      vOpaqueTexture = uv2.x;
      vAlphaTexture = uv2.y;
      vColor = color;
      vAlphaColor = matricesWeights;
      gl_Position = viewProjection * worldPosition;
  }
  `,
      fragmentSource: `
  precision highp float;
  uniform float time;
  uniform sampler2D textures[${config.texturesData.length}];
  varying vec2 vUV;
  varying float vOpaqueTexture;
  varying float vAlphaTexture;
  varying vec4 vColor;
  varying vec4 vAlphaColor;

  void main() 
  {
    float m1 = vOpaqueTexture;
    float m2 = vAlphaTexture;
    bool alphaRendered = false;

    float WaterMove = float(int(time*50.0) % 20000) * 0.0005;
    float WindSpeed = float(int(time*200.0) % 72000) * 0.004;
    float GrassWind = 0.0;
  
    vec4 ${FINAL_COLOR_VAR_NAME} = vec4(0.0);

    vec3 opaqueColor = vec3(0.0);
    vec3 alphaColor = vec3(0.0);

    ${finalColorStr}

    ${FINAL_COLOR_VAR_NAME} = vec4(opaqueColor, 1.0);

    if(alphaRendered){
      ${FINAL_COLOR_VAR_NAME} *= (1.0 - vAlphaColor.a);
      ${FINAL_COLOR_VAR_NAME} += vec4(alphaColor, 1.0) * vAlphaColor.a;
    }

    ${FINAL_COLOR_VAR_NAME} *= vColor.rgba;
    ${FINAL_COLOR_VAR_NAME}.a = 1.0;

    opaqueColor = texture(textures[0], vUV * 64.0).rgb;
  
    // gl_FragColor = clamp(${FINAL_COLOR_VAR_NAME}, 0.0, 1.0);
    gl_FragColor = vec4(opaqueColor, 1.0);
  }
  `,
    },
    {
      attributes: [
        'position',
        'normal',
        'uv',
        'uv2',
        'color',
        'matricesWeights',
      ],
      uniforms: ['view', 'world', 'viewProjection', 'time'],
      samplers: ['textures'],
      defines: [],
      needAlphaBlending: false,
      needAlphaTesting: true,
    }
  ) as ShaderMaterial;

  terrainMaterial.fogEnabled = false;
  terrainMaterial.backFaceCulling = true;
  terrainMaterial.transparencyMode = 0;

  const st = Date.now();

  const textures = config.texturesData.map(t => t.texture);

  terrainMaterial.onBindObservable.add(m => {
    const effect = m.material?.getEffect();

    if (!effect) return;

    const et = (Date.now() - st) / 1000;
    effect.setFloat('time', et);
    effect.setTextureArray('textures', textures);
  });

  // terrainMaterial.freeze();

  terrainMaterial.onDisposeObservable.addOnce(() => {
    textures.forEach(t => {
      t.dispose();
    });
  });

  return terrainMaterial;
}
