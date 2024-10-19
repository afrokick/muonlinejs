import { decryptMapFile } from './mapFileEncryption';

export function parseTerrainObjects(encodedData: Uint8Array) {
  const DataBytes = encodedData.length;
  const decodedData = new Uint8Array(DataBytes);

  decryptMapFile(decodedData, encodedData, DataBytes);

  const dv = new DataView(decodedData.buffer);

  let DataPtr = 0;
  const version = dv.getUint8(DataPtr);
  DataPtr += 1;
  console.log(`parseTerrainObjects version: ${version}`);

  const MapNum = dv.getUint8(DataPtr);
  DataPtr += 1;

  const Count = dv.getInt16(DataPtr, true);
  DataPtr += 2;

  console.log({ MapNum, Count, size: dv.byteLength });

  const objs: {
    id: number;
    pos: { x: number; y: number; z: number };
    rot: { x: number; y: number; z: number };
    scale: number;
  }[] = [];

  let i = 0;
  for (let j = 0; j < Count; j++) {
    i = DataPtr + j * 30;
    const id = dv.getInt16(i, true);
    i += 2;

    const x = dv.getFloat32(i, true);
    i += 4;
    const y = dv.getFloat32(i, true);
    i += 4;
    const z = dv.getFloat32(i, true);
    i += 4;

    const rotateX = dv.getFloat32(i, true);
    i += 4;
    const rotateY = dv.getFloat32(i, true);
    i += 4;
    const rotateZ = dv.getFloat32(i, true);
    i += 4;

    const scale = dv.getFloat32(i, true);
    i += 4;

    //если объект выходит за пределами карты пропускаем его
    // if (coord.x<0 || coord.x>=Config.MapLength || coord.y<0 || coord.y>=Config.MapLength) continue;

    // obj.id = id;
    // obj.position = position;
    // obj.rotate = rotate;
    // obj.scale = scale;
    // obj.isSpecial = isSpecial(obj.id);
    // obj.num = j;
    // j++;

    objs.push({
      id,
      pos: { x, y, z },
      rot: { x: rotateX, y: rotateY, z: rotateZ },
      scale,
    });
  }

  return objs;
}
