export function parseTerrainObjects(bytes: number[]) {
  //int count = (bytes.Length-3)/30;
  console.log({ bytes });
  const dv = new DataView(new Uint8Array(bytes).buffer);
  const posScale = 100;
  const objs: { id: number, pos: { x: number, y: number, z: number; }, rot: { x: number, y: number, z: number; }, scale: number; }[] = [];
  let j = 0;
  for (let i = 3; i < bytes.length; i += 30) {
    const id = dv.getUint16(i, true) + 1;


    const x = dv.getFloat32(i + 2, true) / posScale;
    const y = dv.getFloat32(i + 10, true) / posScale;
    const z = dv.getFloat32(i + 6, true) / posScale;

    const rotateX = dv.getFloat32(i + 14, true);
    const rotateY = 180.0 - dv.getFloat32(i + 22, true);
    const rotateZ = dv.getFloat32(i + 18, true);

    const scale = dv.getFloat32(i + 26, true);

    if (id === 143) {
      console.log(`pos(${x} ${y} ${z}) rotate(${rotateX} ${rotateY} ${rotateZ}) scale:${scale}`);
    }

    //если объект выходит за пределами карты пропускаем его
    // if (coord.x<0 || coord.x>=Config.MapLength || coord.y<0 || coord.y>=Config.MapLength) continue;

    // obj.id = id;
    // obj.position = position;
    // obj.rotate = rotate;
    // obj.scale = scale;
    // obj.isSpecial = isSpecial(obj.id);
    // obj.num = j;
    // j++;

    objs.push({ id, pos: { x, y, z }, rot: { x: rotateX, y: rotateY, z: rotateX }, scale });
  }

  return objs;
}
