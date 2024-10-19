import { downloadBytesBuffer } from "../utils";

const MAX_WIDTH = 1024;
const MAX_HEIGHT = 1024;

/**
 * TGA HEADER Structure
 * 
 typedef struct {
   char  idlength;
   char  colourmaptype;
   char  datatypecode;
   short int colourmaporigin;
   short int colourmaplength;
   char  colourmapdepth;
   short int x_origin;
   short int y_origin;
   short width;
   short height;
   char  bitsperpixel;
   char  imagedescriptor;
} HEADER;
 */


function parseOJT(bytes: Uint8Array) {
  const dv = new DataView(bytes.buffer);

  let index = 12;
  index += 4;

  const nx = dv.getUint16(index, true);
  index += 2;

  const ny = dv.getUint16(index, true);
  index += 2;

  const bit = dv.getUint8(index);
  index += 1;

  index += 1;

  const debugInfo = `bit: ${bit}, nx:${nx} ny: ${ny}`;
  if (bit !== 32 || nx > MAX_WIDTH || ny > MAX_HEIGHT) {
    throw new Error(debugInfo);
  }

  let Width = 0, Height = 0;
  for (let i = 1; i <= MAX_WIDTH; i <<= 1) {
    Width = i;
    if (i >= nx) break;
  }
  for (let i = 1; i <= MAX_HEIGHT; i <<= 1) {
    Height = i;
    if (i >= ny) break;
  }

  const rgbaBuffer = new Uint8Array(Width * Height * 4);

  for (let y = 0; y < ny; y++) {
    const dstOffset = (ny - 1 - y) * Width * 4;

    for (let x = 0; x < nx; x++) {
      const srcOffset = index + x * 4;

      rgbaBuffer[dstOffset + 0 + x * 4] = bytes[srcOffset + 2];
      rgbaBuffer[dstOffset + 1 + x * 4] = bytes[srcOffset + 1];
      rgbaBuffer[dstOffset + 2 + x * 4] = bytes[srcOffset + 0];
      rgbaBuffer[dstOffset + 3 + x * 4] = bytes[srcOffset + 3];
    }

    index += nx * 4;
  }

  return { rgbaBuffer, width: Width, height: Height } as const;
}

export async function OpenTga(filename: string) {
  const bytes = await downloadBytesBuffer(filename);

  return parseOJT(bytes);
}
