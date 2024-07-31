import { Engine, Scene, type Node, Animation, Color3, Vector3, Matrix, Quaternion, type Viewport } from './exports';

export function findInChildren(children: Node[], name: string): Node | null {
  for (const child of children) {
    if (child.name === name) return child;

    const res = findInChildren(child.getChildren(), name);

    if (res) return res;
  }

  return null;
}

export async function addInspectorForScene(scene: Scene) {
  const switchDebugLayer = () => {
    //@ts-ignore
    if (scene.debugLayer.isVisible()) {
      //@ts-ignore
      scene.debugLayer.hide();
    } else {
      //@ts-ignore
      scene.debugLayer.show({ overlay: true });
    }
  };

  // hide/show the Inspector
  window.addEventListener('keydown', async ev => {
    // Shift+Ctrl+Alt+I
    if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
      const debuggerScript = document.querySelector('script[inspector]');

      if (!debuggerScript) {
        console.log(`Start loading inspector...`);
        const s = document.createElement('script');
        s.setAttribute('inspector', 'true');
        s.src = 'https://cdn.babylonjs.com/inspector/babylon.inspector.bundle.js';

        s.onload = () => {
          console.log(`Inspector loaded!`);
          switchDebugLayer();
        };
        s.onerror = () => {
          console.log(`Inspector failed to load`);
        };
        document.body.appendChild(s);
        return;
      }

      switchDebugLayer();
    }
  });
}

function createCanvas() {
  const canvas = document.createElement('canvas');
  canvas.style.width = '400';
  canvas.style.height = '300';
  canvas.width = 400;
  canvas.height = 300;

  return canvas;
}

export function createEngine(baseCanvas?: HTMLCanvasElement, enableAntialiasing?: boolean) {
  // create the canvas html element and attach it to the webpage
  const canvas = baseCanvas || createCanvas();

  // initialize babylon scene and engine
  const shouldScale = true;
  const engine = new Engine(
    canvas,
    !!enableAntialiasing,
    {
      audioEngine: true,
      stencil: false,
      useHighPrecisionFloats: true,
      powerPreference: 'low-power',
      doNotHandleContextLost: false,
      limitDeviceRatio: enableAntialiasing ? undefined : 1,
      failIfMajorPerformanceCaveat: false,
      premultipliedAlpha: false,
      alpha: false,
      preserveDrawingBuffer: false,
    },
    shouldScale
  );
  if (Engine.audioEngine) {
    Engine.audioEngine.useCustomUnlockedButton = true;
  }

  return { engine, canvas };
}

export function animateInterpolate(scene: Scene, target: any, property: string, value: any, duration: number) {
  const keys = [
    {
      frame: 0,
      value: target[property],
    },
    {
      frame: 60,
      value,
    },
  ];

  let dataType: number;

  if (typeof value === 'number') {
    dataType = Animation.ANIMATIONTYPE_FLOAT;
  } else if (value instanceof Color3) {
    dataType = Animation.ANIMATIONTYPE_COLOR3;
  } else if (value instanceof Vector3) {
    dataType = Animation.ANIMATIONTYPE_VECTOR3;
  } else if (value instanceof Matrix) {
    dataType = Animation.ANIMATIONTYPE_MATRIX;
  } else if (value instanceof Quaternion) {
    dataType = Animation.ANIMATIONTYPE_QUATERNION;
  } else {
    throw new Error('no type');
  }

  const animation = new Animation(
    'InterpolateValueAction',
    property,
    60,
    dataType,
    Animation.ANIMATIONLOOPMODE_CONSTANT
  );

  animation.setKeys(keys);

  return scene.beginDirectAnimation(target, [animation], 0, 60, false, 1.0 / duration);
}

export const transformCoordinatesWithClippingToRef = (v: Vector3, transformation: Matrix, ref: Vector3) => {
  const m = transformation.m;
  let rx = v.x * m[0] + v.y * m[4] + v.z * m[8] + m[12];
  let ry = v.x * m[1] + v.y * m[5] + v.z * m[9] + m[13];
  let rz = v.x * m[2] + v.y * m[6] + v.z * m[10] + m[14];
  let rw = v.x * m[3] + v.y * m[7] + v.z * m[11] + m[15];

  if (rx < -rw) rx = -rw;
  if (rx > rw) rx = rw;
  if (ry < -rw) ry = -rw;
  if (ry > rw) ry = rw;
  if (rz < -rw) rz = -rw;
  if (rz > rw) rz = rw;
  if (rw < 0) {
    rw = 0;

  }

  ref.x = rx / rw;
  ref.y = ry / rw;
  ref.z = rz / rw;

  return ref;
};

const TmpMatrix = Matrix.Identity();

export function projectWorldPositionToScreenRef(scene: Scene, pos: Vector3, viewport: Viewport, ref: Vector3) {
  const projMatrix = scene.getTransformMatrix();
  const projected = transformCoordinatesWithClippingToRef(pos, projMatrix, ref);
  const viewportMatrix = TmpMatrix;

  Matrix.FromValuesToRef(
    viewport.width / 2.0,
    0,
    0,
    0,
    0,
    -viewport.height / 2.0,
    0,
    0,
    0,
    0,
    0.5,
    0,
    viewport.x + viewport.width / 2.0,
    viewport.height / 2.0 + viewport.y,
    0.5,
    1,
    viewportMatrix
  );

  Vector3.TransformCoordinatesToRef(projected, viewportMatrix, ref);

  return ref;
}