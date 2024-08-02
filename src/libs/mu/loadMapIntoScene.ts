import { ENUM_WORLD } from "../../../common";
import { Scene, SceneLoader } from "../babylon/exports";
import { getTerrainData } from "./getTerrainData";

const LOAD_MAP: ENUM_WORLD = ENUM_WORLD.WD_0LORENCIA;

async function loadObject(path: string, scene: Scene) {
  const objRes = await SceneLoader.ImportMeshAsync(null, path, undefined, scene);

  objRes.animationGroups.forEach(ag => {
    ag.stop();
    ag.dispose();
  });
  const root = objRes.meshes[0];
  // root.scaling = Vector3.One();
  // root.rotationQuaternion.set(0, 0, 0, 0);
  // root.position.setAll(0);


  return { root } as const;
}

function toRadians(angle: number) {
  return angle * (Math.PI / 180);
}

export async function loadMapIntoScene(scene: Scene) {
  await getTerrainData(scene, LOAD_MAP);

  //
  // TODO MAP OBJECTS
  //
  //

  // const allowed = [143, 146, 123, 125];
  // const objMap = new Map();
  // for (let obj of objects) {
  //   // if (obj.pos.x > 90 && obj.pos.x < 150 && obj.pos.z > 80 && obj.pos.z < 150)
  //   {
  //     console.log({ obj });
  //     let objRoot: Mesh;
  //     if (!objMap.has(obj.id)) {
  //       const { root } = await loadObject(`./data/Object1/Object${obj.id}.new.glb`,scene);

  //       root.name = `Object` + obj.id;

  //       root.scaling.setAll(0.5);
  //       objMap.set(obj.id, root);
  //       objRoot = root as Mesh;
  //     } else {
  //       objRoot = objMap.get(obj.id);
  //     }

  //     const inst = objRoot.clone(`Object${obj.id}`, undefined, false, false);
  //     inst.position.set(obj.pos.x, obj.pos.y - 1.2, obj.pos.z);
  //     inst.rotationQuaternion = Quaternion.FromEulerAngles(0, toRadians(obj.rot.y), 0);

  //   }
  // }
}
