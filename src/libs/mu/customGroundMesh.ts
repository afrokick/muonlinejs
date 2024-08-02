import { TERRAIN_SCALE, TERRAIN_SIZE } from "../../../common/terrain/consts";
import { TERRAIN_INDEX } from "../../../common/terrain/utils";
import { GroundMesh, type Scene, VertexData, Vector3 } from "../babylon/exports";

export class CustomGroundMesh extends GroundMesh {

  constructor(name: string, scene: Scene) {
    super(name, scene);
  }

  getHeightAtPosition(pos: Vector3) {
    return this.getHeightAtCoordinates(pos.x, pos.z);
  }
}

function CreateGroundFromHeightMapVertexData(buffer: Float32Array): VertexData {
  const indices = [];
  const positions = [];
  const normals = [];
  const uvs = [];
  const ids = [];
  let y, x;

  const sub = 256;

  // Vertices
  for (y = 0; y <= sub; y++) {
    for (x = 0; x <= sub; x++) {
      const position = new Vector3(
        (x) * TERRAIN_SCALE,
        0,
        (sub - y) * TERRAIN_SCALE
      );

      const pos = TERRAIN_INDEX(x >= TERRAIN_SIZE ? TERRAIN_SIZE - 1 : x, (sub - y) >= TERRAIN_SIZE ? TERRAIN_SIZE - 1 : sub - y);

      const r = buffer[pos];

      position.y = r * 1;

      // Add  vertex
      positions.push(position.x, position.y, position.z);
      normals.push(0, 0, 0);
      uvs.push((x - 4) / (sub), 1 - y / sub);
      ids.push(x, y);
    }
  }

  // Indices
  for (y = 0; y < TERRAIN_SIZE; y++) {
    for (x = 0; x < TERRAIN_SIZE; x++) {
      // Calculate Indices
      const s = sub + 1;

      const idx1 = x + 1 + (y + 1) * s;
      const idx2 = x + 1 + y * s;
      const idx3 = x + y * s;
      const idx4 = x + (y + 1) * s;

      // const idx1 = x + 1 + ((TERRAIN_SIZE - y - 1) + 1) * s;
      // const idx2 = x + 1 + (TERRAIN_SIZE - y - 1) * s;
      // const idx3 = x + (TERRAIN_SIZE - y - 1) * s;
      // const idx4 = x + ((TERRAIN_SIZE - y - 1) + 1) * s;


      // if ((y) % 2 !== (x) % 2) {

      //   indices.push(idx2);
      //   indices.push(idx3);
      //   indices.push(idx4);

      //   indices.push(idx1);
      //   indices.push(idx2);
      //   indices.push(idx4);
      // } else {

      indices.push(idx1);
      indices.push(idx2);
      indices.push(idx3);

      indices.push(idx4);
      indices.push(idx1);
      indices.push(idx3);
      // }
    }
  }

  // Normals
  VertexData.ComputeNormals(positions, indices, normals);

  // Result
  const vertexData = new VertexData();

  vertexData.indices = indices;
  vertexData.positions = positions;
  vertexData.normals = normals;
  vertexData.uvs = uvs;
  vertexData.uvs2 = ids;

  return vertexData;
}

export function CreateGroundFromHeightMap(
  name: string,
  heights: Float32Array,
  options: {
    width?: number;
    height?: number;
    subdivisions?: number;
    minHeight?: number;
    maxHeight?: number;
  } = {},
  scene: Scene
): CustomGroundMesh {

  const subdivisions = options.subdivisions || 1 | 0;
  const minHeight = options.minHeight || 0.0;
  const maxHeight = options.maxHeight || 1.0;

  const ground = new CustomGroundMesh(name, scene);
  ground._subdivisionsX = subdivisions;
  ground._subdivisionsY = subdivisions;
  ground._width = TERRAIN_SIZE;
  ground._height = TERRAIN_SIZE;
  ground._maxX = ground._width / 2.0;
  ground._maxZ = ground._height / 2.0;
  ground._minX = -ground._maxX;
  ground._minZ = -ground._maxZ;

  ground._setReady(false);


  const vertexData = CreateGroundFromHeightMapVertexData(heights);

  vertexData.applyToMesh(ground, false);

  ground._setReady(true);

  return ground;
}
