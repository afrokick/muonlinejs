import { type Scene, ShaderMaterial, type Texture } from "../babylon/exports";

const FINAL_COLOR_VAR_NAME = `finalColor`;

export function createTerrainMaterial(scene: Scene, { name, }: { name: string; }, config: {
  texturesData: { texture: Texture; scale: number; }[];
  atlas: Texture;
  alphaMap: Texture;
}) {
  const finalColorStr = config.texturesData.map((_, i) => {
    const textureData = config.texturesData[i];
    return `
    if (m1 >= ${i}.0 && m1 < ${i}.1) {
      ${FINAL_COLOR_VAR_NAME} += texture2D(textures[${i}], vUV * ${textureData.scale.toFixed(1)}).rgb;
  }

  if (m2 >= ${i}.0 && m2 < ${i}.1) {
      ${FINAL_COLOR_VAR_NAME} += texture2D(textures[${i}], vUV * ${textureData.scale.toFixed(1)}).rgb * a;
  }
  `;
  }).join('');

  const terrainMaterial = new ShaderMaterial('SplatTerrainMaterial' + name, scene,
    {
      vertexSource: `
  precision highp float;
  attribute vec3 position;
  attribute vec2 uv;
  uniform mat4 viewProjection;
  uniform mat4 view;
  uniform mat4 world;
  varying vec2 vUV;


  void main() {
      vec4 p = vec4(position, 1.);
      vec4 worldPosition = world * p;
      vUV = uv;
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

  void main() 
  {
    vec4 mixColor = texture2D(texturesData,vUV).rgba;
    vec4 alpha = texture2D(alphaMap,vUV).rgba;
    float m1 = mixColor.r * 255.0;
    float m2 = mixColor.g * 255.0;
    float a = alpha.r;

    vec3 light = alpha.gba;
   
    vec3 ${FINAL_COLOR_VAR_NAME} = vec3(0.0);
    ${finalColorStr}

    ${FINAL_COLOR_VAR_NAME} = clamp(${FINAL_COLOR_VAR_NAME} * light, 0.0, 1.0);
  
    gl_FragColor = vec4(${FINAL_COLOR_VAR_NAME}, 1.0);
  }
  `
    }, {
    attributes: [
      "position",
      "normal",
      "uv",
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
    needAlphaTesting: false,
  }
  ) as ShaderMaterial;

  terrainMaterial.fogEnabled = false;
  terrainMaterial.backFaceCulling = true;
  terrainMaterial.transparencyMode = 0;

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
