import { unlinkSync } from 'node:fs';
import { Glob } from 'bun';
import { DATA_FOLDER, JPG_EXT, OZJ_EXT } from './shared';

const glob = new Glob(`**/*{${OZJ_EXT.toUpperCase()},${OZJ_EXT}}`);

let counter = 0;
for (const ozjFileName of glob.scanSync(DATA_FOLDER)) {
  console.log(`Processing ${ozjFileName}`);

  const ozjFilePath = DATA_FOLDER + ozjFileName;

  const jpgFilePath =
    ozjFilePath.substring(0, ozjFilePath.length - 4) + JPG_EXT;

  const ozjFile = Bun.file(ozjFilePath);
  const buffer = new Uint8Array(await ozjFile.arrayBuffer());
  const jpegBuffer = buffer.slice(24); // remove first 24 bytes as it is a OZJ header

  try {
    //remove old file
    unlinkSync(jpgFilePath);
  } catch (e) {}

  const jpgFile = Bun.file(jpgFilePath);
  const writer = jpgFile.writer();
  writer.write(jpegBuffer);
  writer.end();
  counter++;
}

console.log(`Processed ${counter} files!`);
