import { unlinkSync } from "node:fs";
import { Glob } from "bun";

const OZT_EXT = '.OZT';
const TGA_EXT = '.tga';

const DATA_FOLDER = __dirname + `/../public/data/`;

const glob = new Glob(`**/*{${OZT_EXT.toUpperCase()},${OZT_EXT.toLowerCase()}}`);

let counter = 0;
for (const oztFileName of glob.scanSync({ cwd: DATA_FOLDER, onlyFiles: true })) {
  console.log(`Processing ${oztFileName}`);

  const oztFilePath = DATA_FOLDER + oztFileName;

  const tgaFilePath = oztFilePath.substring(0, oztFilePath.length - 4) + TGA_EXT;

  const oztFile = Bun.file(oztFilePath);
  const buffer = new Uint8Array(await oztFile.arrayBuffer());
  const tgaBuffer = buffer.slice(4);

  try {
    //remove old file
    unlinkSync(tgaFilePath);
  } catch (e) { }

  const tgaFile = Bun.file(tgaFilePath);
  const writer = tgaFile.writer();
  writer.write(tgaBuffer);
  writer.end();
  counter++;
}

console.log(`Processed ${counter} files!`);
