import { ENUM_WORLD } from "../types";

export function getTilesList(map: ENUM_WORLD) {
  switch (map) {
    case ENUM_WORLD.WD_0LORENCIA:
      return ["TileGrass01", "TileGrass02", "TileGround01", "TileGround02", "TileGround03", "TileWater01", "TileWood01", "TileRock01", "TileRock02"];
    case ENUM_WORLD.WD_1DUNGEON:
      return ["TileGrass01", "TileGrass02", "TileGround01", "TileGround02", "TileGround03", "TileWater01", "TileWood01", "TileRock01", "TileRock02"];
    case ENUM_WORLD.WD_2DEVIAS:
      return ["TileGrass01", "TileGrass02", "TileGround01", "TileGround02", "TileGround03", "TileWater01", "TileWood01", "TileRock01", "TileRock02", "TileRock03", "TileRock04", "TileRock05", "TileRock06", "TileRock07"];
    case ENUM_WORLD.WD_3NORIA:
      return ["TileGrass01", "TileGrass01", "TileGround01", "TileGround01", "TileGround03", "TileWater01", "TileWood01", "TileRock01", "TileRock02", "TileRock03", "TileRock04"];
    // case Util.Map.Location.LostTower:	textures	= new string[]{ "TileGrass01", "TileGrass02", "TileGround01", "TileGround02", "TileGround03", "TileWater01", "TileWood01", "TileRock01", "TileRock02", "TileRock03", "TileRock04" }; break;
    // case Util.Map.Location.DareDevil:	textures	= new string[]{ "TileGrass01", "TileGrass02", "TileGround01", "TileGround02", "TileGround03", "TileWater01", "TileWood01", "TileRock01", "TileRock02", "TileRock03", "TileRock04", "TileRock05", "TileRock06", "TileRock07" }; break;
    // case Util.Map.Location.Stadium:		textures	= new string[]{ "TileGrass01", "TileGrass02", "TileGround01", "TileGround02", "TileGround03", "TileWater01", "TileWood01", "TileRock01", "TileRock02", "TileRock03", "TileRock04" }; break;
    // case Util.Map.Location.Atlans:		textures	= new string[]{ "TileGrass01", "TileGrass02", "TileGround01", "TileGround01", "TileGround03", "TileGrass01", "TileWood01", "TileRock01", "TileRock02", "TileRock03", "TileRock04" }; break;
    // case Util.Map.Location.Tarcan:		textures	= new string[]{ "TileGrass01", "TileGrass02", "TileGround01", "TileGround02", "TileGround03", "TileWater01", "TileWood01", "TileRock01", "TileRock02", "TileRock03", "TileRock04" }; break;
    // case Util.Map.Location.DevilSquare:	textures	= new string[]{ "TileGrass01", "TileGrass02", "TileGround01", "TileGround01", "TileGround03", "TileGrass01", "TileWood01", "TileRock01", "TileRock02", "TileRock03", "TileRock04" }; break;
    // case Util.Map.Location.BloodCastle:	textures	= new string[]{ "TileGrass01", "TileGrass02", "TileGround02", "TileGround02", "TileGround03", "TileWater01", "TileWood01", "TileRock01", "TileRock02", "TileRock03", "TileRock04" }; break;
    // case Util.Map.Location.Icarus:		textures	= new string[]{ "TileGrass01", "TileGrass01", "TileGrass01", "TileGrass01", "TileGrass01", "TileGrass01", "TileGrass01", "TileGrass01", "TileGrass01", "TileGrass01", "TileRock04" }; break;
  }

  throw new Error(`Not implemented for ${ENUM_WORLD[map]}`);
}
