import { TERRAIN_SIZE, TERRAIN_SIZE_MASK } from "./consts";

export function TERRAIN_INDEX(x: Int, y: Int): Int {
  return y * TERRAIN_SIZE + x;
}

export function TERRAIN_INDEX_REPEAT(x: Int, y: Int): Int {
  return ((y & TERRAIN_SIZE_MASK) * TERRAIN_SIZE) + (x & TERRAIN_SIZE_MASK);
}
