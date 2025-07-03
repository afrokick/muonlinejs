import { CustomMaterial, type Scene } from '../libs/babylon/exports';

/**
 * Is used as mask for item options
 * low 4 bits - item lvl
 * 5th bit - is excellent
 */
const ITEM_OPTIONS_UNIFORM_NAME = `itemOptions`;

export function createItemMaterial(scene: Scene) {
  const simpleMaterial = new CustomMaterial('itemMaterial', scene);

  simpleMaterial.diffuseColor.setAll(1);

  simpleMaterial.specularColor.setAll(0);

  simpleMaterial.AddUniform(ITEM_OPTIONS_UNIFORM_NAME, 'float', 0);
  simpleMaterial.AddUniform('time', 'float', 0);

  simpleMaterial.Fragment_Definitions(`
    float noise2(vec2 coords){
      vec2 texSize = vec2(1.0);
      vec2 pc = coords * texSize;
      vec2 base = floor(pc);
      float s1 = getRand((base + vec2(0.0,0.0)) / texSize);
      float s2 = getRand((base + vec2(1.0,0.0)) / texSize);
      float s3 = getRand((base + vec2(0.0,1.0)) / texSize);
      float s4 = getRand((base + vec2(1.0,1.0)) / texSize);
      vec2 f = smoothstep(0.0, 1.0, fract(pc));
      float px1 = mix(s1,s2,f.x);
      float px2 = mix(s3,s4,f.x);
      float result = mix(px1,px2,f.y);
      return result;
    }
  `);

  simpleMaterial.Fragment_Before_FragColor(`
    int iItemOptions = int(${ITEM_OPTIONS_UNIFORM_NAME});
    int iItemLvl = iItemOptions & 0x0F;
    bool bIsExcellent = (iItemOptions & 0x10) != 0;
    vec3 vPartColor = vec3(1.0);

    float wave = float(int(time * 1000.0) % 10000) * 0.0001;

    vec3 view = normalize(vEyePosition.xyz-vPositionW) + vNormalW + vec3(10000.5);
    float mixAmount = (1.0 + sin(time * 4.0)) / 2.0;
    float lvl = float(iItemLvl);
    if (lvl < 1.5) { // 0,1

    }
    else if (lvl < 4.5) { // 2,3,4 (red)
      vec3 minColor = vec3(0.4,0.3,0.3);
      vec3 maxColor = vec3(0.7,0.5,0.5);
      vec3 vPartColor = mix(minColor, maxColor, mixAmount);
      color.rgb = color.rgb * vPartColor;
    }
    else if (lvl < 6.5) { // 5,6 (blue)
      vec3 minColor = vec3(0.3,0.4,0.4);
      vec3 maxColor = vec3(0.5,0.6,0.6);
      vec3 vPartColor = mix(minColor, maxColor, mixAmount);
      color.rgb = color.rgb * vPartColor;
    }
    else if (lvl < 8.5) { // 7,8 (gold)
      float n_second = normalW.z * 0.5 + wave;
      float n_first = normalW.y * 0.5 + wave * 2.0;

      uvOffset = vec2(n_first, n_second);
      vec4 texColor = texture2D(diffuseSampler, vDiffuseUV + uvOffset);

      color.rgb = color.rgb * 0.8 + texColor.rgb * color.rgb * .9;
    }
    else if (lvl < 9.5) { // 9, (more gold)
      float n_second = normalW.z * 0.5 + wave;
      float n_first = normalW.y * 0.5 + wave * 2.0;

      uvOffset = vec2(n_first, n_second);
      vec4 texColor = texture2D(diffuseSampler, vDiffuseUV + uvOffset);

      color.rgb = color.rgb * 0.8 + color.rgb * vec3(1.0,0.9,0.0) + texColor.rgb * vec3(.7,.6,.5) * .3;
    }
    else{
      color.rgb = color.rgb * 1.4 + color.rgb * 2.0 * noise2(view.xz + time);
    }
`);

  let time = 0;

  scene.onReadyObservable.addOnce(() => {
    scene.onBeforeRenderObservable.add(() => {
      time += scene.getEngine()!.getDeltaTime()! / 1000;
    });

    simpleMaterial.onBindObservable.add(mesh => {
      const effect = simpleMaterial.getEffect();
      if (!effect) return;
      effect.setFloat('time', time + (mesh.metadata?.timeOffset ?? 0));

      let itemOptions = 0;

      if (mesh.metadata?.itemLvl) {
        itemOptions = mesh.metadata.itemLvl;
      }

      if (mesh.metadata?.isExcellent) {
        itemOptions |= 0x10;
      }

      effect.setFloat(ITEM_OPTIONS_UNIFORM_NAME, itemOptions);

      effect.setTexture('diffuseSampler', mesh.metadata!.diffuseTexture);

      if (mesh.metadata?.diffuseColor) {
        effect.setColor4(
          'vDiffuseColor',
          mesh.metadata.diffuseColor,
          mesh.metadata.diffuseColor.a
        );
      }
    });
  });

  return simpleMaterial;
}
