import { unlinkSync } from "node:fs";
import { Glob } from "bun";

const OZJ_EXT = '.OZJ';
const JPG_EXT = '.jpg';

const DATA_FOLDER = __dirname + `/../public/data/`;

const glob = new Glob(`**/*${OZJ_EXT}`);

let counter = 0;
for (const ozjFileName of glob.scanSync(DATA_FOLDER)) {
  console.log(`Processing ${ozjFileName}`);

  const ozjFilePath = DATA_FOLDER + ozjFileName;

  const jpgFilePath = ozjFilePath.replace(OZJ_EXT, JPG_EXT);

  const ozjFile = Bun.file(ozjFilePath);
  const buffer = new Uint8Array(await ozjFile.arrayBuffer());
  const jpegBuffer = buffer.slice(24);

  try {
    //remove old file
    unlinkSync(jpgFilePath);
  } catch (e) { }

  const jpgFile = Bun.file(jpgFilePath);
  const writer = jpgFile.writer();
  writer.write(jpegBuffer);
  writer.end();
  counter++;
}

console.log(`Processed ${counter} files!`);
