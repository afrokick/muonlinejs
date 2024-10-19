import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './style.less';
import './logic';
import { Store } from './store';
import { Engine } from './libs/babylon/exports';
import { createEngine } from './libs/babylon/utils';
import { TestScene } from './scenes/testScene';
import { loadMapIntoScene } from './libs/mu/loadMapIntoScene';

if (APP_STAGE === 'dev' || QA_ENABLED) {
  import('@babylonjs/core/Legacy/legacy');
}

const canvas = document.querySelector('canvas')!;

let useAntialiaing = false;

let engine: Engine;
try {
  const result = createEngine(canvas, useAntialiaing);
  engine = result.engine;
  engine.hideLoadingUI();
} catch (e) {
  console.error(e);
  throw e;
}

//some tricks for scrolling
window.addEventListener('keydown', ev => {
  if (['ArrowDown', 'ArrowUp', ' '].includes(ev.key)) {
    ev.preventDefault();
  }
});
const ignoredIds = ['scene-explorer-host', 'inspector-host'];
window.addEventListener(
  'wheel',
  ev => {
    let p = ev.target as HTMLElement;
    while (p) {
      if (
        p.classList &&
        (p.classList.contains('scrollable') || ignoredIds.includes(p.id))
      )
        return;

      p = p.parentElement as any;
    }

    ev.preventDefault();
  },
  { passive: false }
);

Store.connectToConnectServer();

const scene = new TestScene(engine);
(window as any).__scene = scene;
loadMapIntoScene(scene);

engine.runRenderLoop(() => {
  scene.render();
});

const onResize = () => {
  engine.resize();
};

window.addEventListener('resize', onResize);
onResize();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
