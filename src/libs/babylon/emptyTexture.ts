import { RawTexture, type Scene, type Texture } from './exports';

let _cachedTexture: Texture | null = null;

export function getEmptyTexture(scene: Scene): Texture {
  if (!_cachedTexture) {
    const r = 209;
    const g = 209;
    const b = 209;
    const tempTexture = RawTexture.CreateRGBATexture(
      new Uint8Array([r, g, b, 255, r, g, b, 255, r, g, b, 255, r, g, b, 255]),
      2,
      2,
      scene,
      true,
      false
    );
    tempTexture.name = '_emptyTexture';
    tempTexture.hasAlpha = true;
    tempTexture.isBlocking = false;
    tempTexture.anisotropicFilteringLevel = 1;
    tempTexture.coordinatesIndex = 1;
    _cachedTexture = tempTexture;
  }

  return _cachedTexture;
}
