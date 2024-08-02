import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { ArcRotateCamera, Color3, Color4, CreateBox, DirectionalLight, Engine, HemisphericLight, Scene, TransformNode, Vector3 } from "../libs/babylon/exports";
import { addInspectorForScene } from "../libs/babylon/utils";

export class TestScene extends Scene {
  defaultCamera: UniversalCamera;

  readonly transformedRoot: TransformNode;

  constructor(engine: Engine) {
    super(engine);

    // const camera = new ArcRotateCamera(
    //   'Camera',
    //   Math.PI * 0.5,
    //   Math.PI / 2.5,
    //   10,
    //   Vector3.Zero(),
    //   this
    // );
    // camera.maxZ = 100;
    // camera.minZ = 0.1;
    // camera.position.set(135, 50, 130);

    const camera = new UniversalCamera('UniversalCamera', new Vector3(0, 10, 0), this);

    camera.rotation.y = -Math.PI / 2;
    camera.rotation.x = Math.PI / 4;
    camera.speed = 0.2;
    camera.angularSensibility = 4000;
    camera.minZ = 0.01;
    camera.maxZ = 1000;
    camera.position.set(135, 20, 130);

    camera.attachControl();

    camera.keysUp.push(87);
    camera.keysLeft.push(65);
    camera.keysDown.push(83);
    camera.keysRight.push(68);

    CreateBox('0_0',{size:20},this).position.setAll(0);
    CreateBox('0_0',{size:20},this).position.set(50,0,0);


    this.defaultCamera = camera;

    this.skipFrustumClipping = true;
    this.autoClearDepthAndStencil = true;
    this.autoClear = true;

    this.clearColor = new Color4(0.95, 0.95, 1, 1);
    this.ambientColor = new Color3(1, 1, 1);

    addInspectorForScene(this);

    this.transformedRoot = new TransformNode("_gltf_root", this);
    this.transformedRoot.scaling.z = -1;
    this.transformedRoot.rotation.y = Math.PI;

    const light2 = new DirectionalLight('DirectionalLight2', new Vector3(0, 1, -2), this);
    light2.intensity = 3;
  
    const light3 = new HemisphericLight('light', new Vector3(0, 1, 0), this);
    light3.intensity = 1;
  }
}