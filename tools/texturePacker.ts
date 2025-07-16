import json from './image_cache.json' assert { type: 'json' };
import sharp from 'sharp';
import { decodeTga } from '@lunapaint/tga-codec';
import { PNG } from 'pngjs';
import { DATA_FOLDER, OUTPUT_FOLDER } from './shared';

const DEFAULT_QUALITY = 90;

async function tga2png(file: Buffer) {
  const tga = await decodeTga(new Uint8Array(file));
  const png = new PNG({
    width: tga.details.header.width,
    height: tga.details.header.height,
  });
  png.data = tga.image.data;

  return new Promise<Buffer>((resolve, reject) => {
    const bufs: Uint8Array[] = [];
    png
      .pack()
      .on('data', (d: Buffer) => {
        bufs.push(new Uint8Array(d));
      })
      .on('end', () => {
        const buffer = Buffer.concat(bufs);
        resolve(buffer);
      })
      .on('error', reject);
  });
}

async function convertImageToWebP(image: Uint8Array): Promise<Uint8Array> {
  if (image.length > 0 && image[0] === 0x00 && image[1] === 0x00) {
    const inputBuffer = Buffer.from(image);
    const outputBuffer = await tga2png(inputBuffer);
    image = new Uint8Array(outputBuffer);
  }

  const buffer = await sharp(image).toFormat('webp').toBuffer();

  return new Uint8Array(buffer);
}

const folder = process.argv[2] ?? '';

if (!folder) {
  console.log('Usage: bun texturePacker.ts <folder>');
  process.exit(1);
}

const images = Object.entries(json)
  .filter(([key]) => key.startsWith(folder + '/'))
  .map(([_key, l]) => ({ filePath: _key, ...l[0] }));

const OFFSET = 2;

function createAtlasData(
  images: { filePath: string; width: number; height: number }[]
) {
  const atlasData: {
    filePath: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }[] = [];

  if (images.length === 0) {
    return { width: 0, height: 0, atlasData };
  }

  // Sort images by area (descending) for better packing
  const sortedImages = [...images].sort(
    (a, b) => b.width * b.height - a.width * a.height
  );

  // Estimate initial atlas width based on total area
  const totalArea = sortedImages.reduce(
    (sum, img) => sum + img.width * img.height,
    0
  );

  const inefficiencyFactor = 1.1; // Factor to account for packing inefficiency
  const estimatedWidth = Math.ceil(Math.sqrt(totalArea * inefficiencyFactor));

  let maxWidth = estimatedWidth;
  let currentX = 0;
  let currentY = 0;
  let currentRowHeight = 0;
  let totalHeight = 0;

  for (const image of sortedImages) {
    // Check if image fits in current row
    if (currentX + image.width > maxWidth && currentX > 0) {
      // Move to new row
      currentX = 0;
      currentY += currentRowHeight + OFFSET;
      currentRowHeight = 0;
    }

    // Place image
    atlasData.push({
      filePath: image.filePath,
      x: currentX,
      y: currentY,
      width: image.width,
      height: image.height,
    });

    currentX += image.width + OFFSET;
    currentRowHeight = Math.max(currentRowHeight, image.height);

    // Update maximum width if needed
    maxWidth = Math.max(maxWidth, currentX);
  }

  // Add height of last row
  totalHeight = currentY + currentRowHeight;

  // Remove last offset from width
  const finalWidth = maxWidth > 0 ? maxWidth - OFFSET : 0;

  return { width: finalWidth, height: totalHeight, atlasData };
}

const atlas = createAtlasData(images);

async function packTextures(data: ReturnType<typeof createAtlasData>) {
  if (data.width === 0 || data.height === 0 || data.atlasData.length === 0) {
    console.log('No images to pack:', data);
    return;
  }

  console.log(
    `Creating atlas: ${data.width}x${data.height} with ${data.atlasData.length} images`
  );

  // Create base atlas image
  const atlasImage = sharp({
    create: {
      width: data.width,
      height: data.height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });

  // Prepare composite operations
  const compositeOperations: sharp.OverlayOptions[] = [];

  for (const image of data.atlasData) {
    try {
      const bytes = await Bun.file(DATA_FOLDER + image.filePath).bytes();
      const webpBytes = await convertImageToWebP(bytes);

      compositeOperations.push({
        input: Buffer.from(webpBytes),
        left: image.x,
        top: image.y,
      });
    } catch (error) {
      console.error(`Failed to process image ${image.filePath}:`, error);
    }
  }

  // Composite all images at once
  const finalAtlas = atlasImage.composite(compositeOperations);

  // Generate output paths
  const outputDir = OUTPUT_FOLDER + 'atlases/';
  const atlasPath = outputDir + `${folder}_atlas.webp`;
  const jsonPath = outputDir + `${folder}_atlas.json`;

  // Save atlas metadata
  const atlasMetadata = {
    width: data.width,
    height: data.height,
    images: data.atlasData.map(img => ({
      path: img.filePath,
      x: img.x,
      y: img.y,
      width: img.width,
      height: img.height,
    })),
  };

  await Bun.write(jsonPath, JSON.stringify(atlasMetadata, null, 2), {
    createPath: true,
  });

  // Save atlas image
  await finalAtlas.webp({ quality: DEFAULT_QUALITY }).toFile(atlasPath);

  console.log(`Atlas saved to: ${atlasPath}`);
  console.log(`Metadata saved to: ${jsonPath}`);
  console.log(`Total images packed: ${data.atlasData.length}`);
}

// Execute the packing
await packTextures(atlas);


// sizes: 2 4 8 16 32 64 128 256 512 1024
//
// Shader
// w/h - 4bits(16) - 8bits
// x/y - 12bits(4096) - 24bits
// total: 8+24 = 32bits