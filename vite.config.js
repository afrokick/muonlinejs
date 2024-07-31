import { defineConfig } from 'vite';
import gltf from 'vite-plugin-gltf';
import { draco, resample, prune } from '@gltf-transform/functions';

export default defineConfig({
  base: './',
  plugins: [
    gltf({
      transforms: [resample(), prune(), draco()],
    }),
  ],
  build: {
    target: 'es6',
    assetsInlineLimit: 0, //disable
    cssTarget: 'chrome61',
  },
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
    APP_STAGE: JSON.stringify(process.env.APP_ENV || 'unk'),
    QA_ENABLED: JSON.stringify(process.env.QA ? 'true' : ''),
    'import.meta.env.QA_ENABLED': JSON.stringify(process.env.QA ? 'TEST MODE ENABLED' : ''),
  },
});
