import { Config } from "./config";

export enum Location {
  Lorencia
}

export class MapUtils {
  static readonly xor_tab_file = [
    0xd1, 0x73, 0x52, 0xf6,
    0xd2, 0x9a, 0xcb, 0x27,
    0x3e, 0xaf, 0x59, 0x31,
    0x37, 0xb3, 0xe7, 0xa2
  ];

  parse(bytes: number[]) {
    let pos = 1082;

    const data: (number[])[] = [];

    for (let x = 0; x < Config.MapSize; ++x) {
      data[x] = [];
      pos += 2;
      for (let y = 0; y < Config.MapSize - 2; ++y) {
        data[x][y] = ((bytes[pos] / 255.0) *
          (1.0 - Config.HoleHeight) + Config.HoleHeight
        );

        pos++;
      }
    }

    return data;
  }

  static muXorFile(buffer: number[], len: number): number[] {
    let key = 0x5E;//94?

    return buffer.slice(0, len).map((b, i) => {
      let val = (b ^ MapUtils.xor_tab_file[i % 16]);
      val -= key;
      val < 0 ? (val += 256) : 0;
      key = b + 0x3d;
      if (key > 255) key -= 256;
      return val;
    });
  }

  static parseGround(buffer: number[]) {
    const bytes = this.muXorFile(buffer, buffer.length);
    let DataPtr = 0;
    DataPtr += 1;

    const iMapNumber = bytes[DataPtr];
    DataPtr += 1;

    console.log({ bytes, iMapNumber });

    const data: ({ id1: number, id2: number, alpha: number; }[])[] = [];
    for (let x = 0; x < Config.MapSize; ++x) {
      data[x] = [];
      for (let y = 0; y < Config.MapSize; ++y) {
        data[x][y] = { id1: bytes[DataPtr], id2: 0, alpha: 0 };
        DataPtr++;
      }
    }

    for (let x = 0; x < Config.MapSize; ++x) {
      for (let y = 0; y < Config.MapSize; ++y) {
        data[x][y].id2 = bytes[DataPtr];
        DataPtr++;
      }
    }

    for (let x = 0; x < Config.MapSize; ++x) {
      for (let y = 0; y < Config.MapSize; ++y) {
        data[x][y].alpha = bytes[DataPtr] / 255.0;
        DataPtr++;
      }
    }

    return data;
  }

  static parseObjects(bytes: number[]) {
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

  static getTilesList(map: Location): string[] {
    switch (map) {
      case Location.Lorencia:
        return ["TileGrass01", "TileGrass02", "TileGround01", "TileGround02", "TileGround03", "TileWater01", "TileWood01", "TileRock01", "TileRock02", "TileRock03", "TileRock04"];
      // case Util.Map.Location.Dungeun:		textures	= new string[]{ "TileGrass01", "TileGrass02", "TileGround01", "TileGround02", "TileGround03", "TileWater01", "TileWood01", "TileRock01", "TileRock02" }; break;
      // case Util.Map.Location.Devias:		textures	= new string[]{ "TileGrass01", "TileGrass02", "TileGround01", "TileGround02", "TileGround03", "TileWater01", "TileWood01", "TileRock01", "TileRock02", "TileRock03", "TileRock04", "TileRock05", "TileRock06", "TileRock07" }; break;
      // case Util.Map.Location.Noria:		textures	= new string[]{ "TileGrass01", "TileGrass01", "TileGround01", "TileGround01", "TileGround03", "TileWater01", "TileWood01", "TileRock01", "TileRock02", "TileRock03", "TileRock04" }; break;
      // case Util.Map.Location.LostTower:	textures	= new string[]{ "TileGrass01", "TileGrass02", "TileGround01", "TileGround02", "TileGround03", "TileWater01", "TileWood01", "TileRock01", "TileRock02", "TileRock03", "TileRock04" }; break;
      // case Util.Map.Location.DareDevil:	textures	= new string[]{ "TileGrass01", "TileGrass02", "TileGround01", "TileGround02", "TileGround03", "TileWater01", "TileWood01", "TileRock01", "TileRock02", "TileRock03", "TileRock04", "TileRock05", "TileRock06", "TileRock07" }; break;
      // case Util.Map.Location.Stadium:		textures	= new string[]{ "TileGrass01", "TileGrass02", "TileGround01", "TileGround02", "TileGround03", "TileWater01", "TileWood01", "TileRock01", "TileRock02", "TileRock03", "TileRock04" }; break;
      // case Util.Map.Location.Atlans:		textures	= new string[]{ "TileGrass01", "TileGrass02", "TileGround01", "TileGround01", "TileGround03", "TileGrass01", "TileWood01", "TileRock01", "TileRock02", "TileRock03", "TileRock04" }; break;
      // case Util.Map.Location.Tarcan:		textures	= new string[]{ "TileGrass01", "TileGrass02", "TileGround01", "TileGround02", "TileGround03", "TileWater01", "TileWood01", "TileRock01", "TileRock02", "TileRock03", "TileRock04" }; break;
      // case Util.Map.Location.DevilSquare:	textures	= new string[]{ "TileGrass01", "TileGrass02", "TileGround01", "TileGround01", "TileGround03", "TileGrass01", "TileWood01", "TileRock01", "TileRock02", "TileRock03", "TileRock04" }; break;
      // case Util.Map.Location.BloodCastle:	textures	= new string[]{ "TileGrass01", "TileGrass02", "TileGround02", "TileGround02", "TileGround03", "TileWater01", "TileWood01", "TileRock01", "TileRock02", "TileRock03", "TileRock04" }; break;
      // case Util.Map.Location.Icarus:		textures	= new string[]{ "TileGrass01", "TileGrass01", "TileGrass01", "TileGrass01", "TileGrass01", "TileGrass01", "TileGrass01", "TileGrass01", "TileGrass01", "TileGrass01", "TileRock04" }; break;
    }

    return [];
  }
}
