import type { Socket } from "bun";

const PORT = process.env.PORT || "3000";
const HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

function byteToString(i: number) {
  return i.toString(16).padStart(2, "0").toUpperCase();
}

// like 'C1 04 00 01'
function stringifyPacket(buffer: Buffer) {
  return Array.from(new Uint8Array(buffer)).map(byteToString).join(" ");
}

type WebSocketData = {
  targetHost: string;
  targetPort: number;
  tcpSocket?: Socket;
};

Bun.serve<WebSocketData>({
  port: PORT,
  hostname: HOSTNAME,
  fetch(req, server) {
    const searchParams = new URL(req.url).searchParams;
    const targetHost = searchParams.get("host");
    const targetPort = parseInt(searchParams.get("port") ?? "0");

    // upgrade the request to a WebSocket
    if (
      server.upgrade(req, {
        data: {
          targetHost,
          targetPort,
        },
      })
    ) {
      return; // do not return a Response
    }
    return new Response("Upgrade failed :(", { status: 500 });
  },
  websocket: {
    sendPings: false,
    open(ws) {
      console.log(`client connected, target port: ${ws.data.targetPort}`);

      // Connect to TCP server
      Bun.connect({
        hostname: ws.data.targetHost,
        port: ws.data.targetPort,
        socket: {
          data(socket, data) {
            console.log("data from tcp:", stringifyPacket(data));
            ws.send(data);
          },
          open(socket) {
            ws.data.tcpSocket = socket;
          },
          close(socket) { },
          drain(socket) { },
          error(socket, error) {
            console.log(`tcp error:`, error);
            ws.data.tcpSocket = undefined;
            ws.close();
          },

          // client-specific handlers
          connectError(socket, error) {
            console.log(`tcp connect error(${ws.data.targetHost}:${ws.data.targetPort}):`, error);
          }, // connection failed
          end(socket) {
            ws.data.tcpSocket = undefined;
            ws.close();
          }, // connection closed by server
          timeout(socket) { }, // connection timed out
        },
      });
    },
    message(ws, message) {
      const socket = ws.data.tcpSocket;
      if (socket) {
        console.log("data from ws:", stringifyPacket(message));

        socket.write(message);
        socket.flush();
      }
    },
    close(ws, code, message) {
      const socket = ws.data.tcpSocket;
      if (socket) {
        socket.flush();
        socket.end();
        ws.data.tcpSocket = undefined;
      }
    },
  },
});

console.log(`Listening...`);
