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
import { createWorld } from './ecs/createWorld';
import { ENUM_WORLD } from './common';
import { EventBus } from './libs/eventBus';
import { SoundsManager } from './libs/soundsManager';

import('@babylonjs/core/Legacy/legacy');

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

let _hiddenAttr = '';
const onVisibilityChanged = () => {
  const hidden = !!document[_hiddenAttr as 'hidden'];

  EventBus.emit('pageVisibilityChanged', !hidden);
};

if (document.hidden !== undefined) {
  _hiddenAttr = 'hidden';
  document.addEventListener('visibilitychange', onVisibilityChanged, false);
}
//@ts-ignore
else if (document.mozHidden !== undefined) {
  _hiddenAttr = 'mozHidden';
  document.addEventListener('mozvisibilitychange', onVisibilityChanged, false);
}
//@ts-ignore
else if (document.msHidden !== undefined) {
  _hiddenAttr = 'msHidden';
  document.addEventListener('msvisibilitychange', onVisibilityChanged, false);
}
//@ts-ignore
else if (document.webkitHidden !== undefined) {
  _hiddenAttr = 'webkitHidden';
  document.addEventListener(
    'webkitvisibilitychange',
    onVisibilityChanged,
    false
  );
}

const scene = new TestScene(engine);

SoundsManager.initializeSounds(scene);

const { world, updateSystems } = createWorld(scene);
Store.world = world;

(window as any).__scene = scene;
(window as any).__world = world;

let lastTime = performance.now();
engine.runRenderLoop(() => {
  const now = performance.now();

  const deltaTime = (now - lastTime) / 1000; // Convert to seconds
  world.gameTime.TotalGameTime.TotalSeconds += deltaTime;

  updateSystems(deltaTime);

  scene.render();

  lastTime = now;
});

const onResize = () => engine.resize();

window.addEventListener('resize', onResize);

onResize();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if (!Store.isOffline) {
  Store.connectToConnectServer();
}

EventBus.on('requestWarp', ({ map }) => {
  loadMapIntoScene(world, map);
});

EventBus.emit('requestWarp', { map: ENUM_WORLD.WD_0LORENCIA });
