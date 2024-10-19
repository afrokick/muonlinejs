import { type Scene, ShaderMaterial, type Texture } from "../babylon/exports";

const FINAL_COLOR_VAR_NAME = `finalColor`;

export function createTerrainMaterial(scene: Scene, { name, }: { name: string; }, config: {
  texturesData: { texture: Texture; scale: number; }[];
  atlas: Texture;
  alphaMap: Texture;
}) {
  const finalColorStr = config.texturesData.map((_, i) => {
    const textureData = config.texturesData[i];
    const isWater = i === 5;// || (Texture == 11 && (gMapManager.IsPKField() || IsDoppelGanger2()) //TODO
    return `
    if (m1 >= ${i}.0 && m1 < ${i}.1) {
      ${FINAL_COLOR_VAR_NAME} += texture2D(textures[${i}], vUV * ${textureData.scale.toFixed(1)}${isWater ? ` + vec2(WaterMove,GrassWind)` : ''}).rgb;
  }
  if (m2 >= ${i}.0 && m2 < ${i}.1) {
      ${FINAL_COLOR_VAR_NAME} += texture2D(textures[${i}], vUV * ${textureData.scale.toFixed(1)}${isWater ? ` + vec2(WaterMove,GrassWind)` : ''}).rgb * a;
  }
  `;
  }).join('');

  const terrainMaterial = new ShaderMaterial('SplatTerrainMaterial' + name, scene,
    {
      vertexSource: `
  precision highp float;
  attribute vec3 position;
  attribute vec2 uv;
  attribute vec2 uv2;
  uniform mat4 viewProjection;
  uniform mat4 view;
  uniform mat4 world;
  varying vec2 vUV;
  varying float vXf;
  varying float vYf;

  void main() {
      vec4 p = vec4(position, 1.);
      vec4 worldPosition = world * p;
      vUV = uv;
      vXf = uv2.x;
      vYf = uv2.y;
      gl_Position = viewProjection * worldPosition;
  }
  `,
      fragmentSource: `
  precision highp float;
  uniform float time;
  uniform sampler2D texturesData;
  uniform sampler2D alphaMap;
  uniform sampler2D textures[${config.texturesData.length}];
  varying vec2 vUV;
  varying float vXf;
  varying float vYf;

  void main() 
  {
    vec4 mixColor = texture2D(texturesData,vUV).rgba;
    vec4 alpha = texture2D(alphaMap,vUV).rgba;
    float m1 = mixColor.r * 255.0;
    float m2 = mixColor.g * 255.0;
    float a = alpha.r;

    vec3 light = vec3(1.0);

    float WaterMove = 0.0;//float(int(time*1000.0) % 20000) * 0.0005;
    float WindSpeed = float(int(time*1000.0) % 72000) * 0.004;
    float GrassWind = sin(WindSpeed + vXf * 2.0) * 0.1;
  
    vec3 ${FINAL_COLOR_VAR_NAME} = vec3(0.0);
    ${finalColorStr}

    ${FINAL_COLOR_VAR_NAME} = ${FINAL_COLOR_VAR_NAME} * light;
    ${FINAL_COLOR_VAR_NAME} = clamp(${FINAL_COLOR_VAR_NAME}, 0.0, 1.0);
  
    gl_FragColor = vec4(${FINAL_COLOR_VAR_NAME}, 1.0);
  }
  `
    }, {
    attributes: [
      "position",
      "normal",
      "uv",
      "uv2",
    ],
    uniforms: [
      "view",
      "world",
      "viewProjection",
      "time",

    ],
    samplers: [
      "texturesData",
      "alphaMap",
      "textures",
    ],
    defines: [],
    needAlphaBlending: false,
    needAlphaTesting: true,
  }
  ) as ShaderMaterial;

  terrainMaterial.fogEnabled = false;
  terrainMaterial.backFaceCulling = true;
  terrainMaterial.transparencyMode = 1;

  const st = Date.now();

  const textures = config.texturesData.map(t => t.texture);

  terrainMaterial.onBindObservable.add(() => {
    const et = (Date.now() - st) / 1000;
    terrainMaterial.setFloat('time', et);
    terrainMaterial.setTextureArray('textures', textures);
    terrainMaterial.setTexture('texturesData', config.atlas);
    terrainMaterial.setTexture('alphaMap', config.alphaMap);
  });

  return terrainMaterial;
}
