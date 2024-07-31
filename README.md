# MU Online with TypeScript

Worked with [OpenMU](https://github.com/MUnique/OpenMU) server!

LIVE DEMO: https://mujs.pages.dev

### How to run

0. You need to have [Bun](https://bun.sh) installed.
1. Run OpenMU server.
2. Install dependencies: `bun install`
3. Run `bun run proxy` to start proxy.
4. Run `bun run dev` to start demo client.
5. Open http://localhost:5173/ in the browser.

You should see log messages from OpenMU in your browser's console.

### What we have

#### /proxy

The WebSocket <-> TCP proxy based on [Bun](https://bun.sh) for exchange packets between browser and MUOnline's server(only tested with OpenMU).

#### /common/packets

Class-based packets(protocol) for communication with a server.

#### /common/encryption

SimpleModulus, Xor32, Xor3 algorithms based on **OpenMU** implementation.

Read more: https://github.com/MUnique/OpenMU/tree/2532fab17a350faa275c0974c3d8a7b960c80914/src/Network#encryption

### Need your help!

If you find any bug or error please report it via [Issues](https://github.com/afrokick/muonlinejs/issues)!
