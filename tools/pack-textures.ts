#!/usr/bin/env bun

import json from './image_cache.json' assert { type: 'json' };

function getAvailableFolders() {
  const folders = new Set<string>();
  
  Object.keys(json).forEach(path => {
    const folder = path.split('/')[0];
    folders.add(folder);
  });
  
  return Array.from(folders).sort();
}

function getFolderStats(folder: string) {
  const images = Object.entries(json)
    .filter(([key]) => key.startsWith(folder + '/'))
    .map(([_key, l]) => ({ filePath: _key, ...l[0] }));
  
  const totalArea = images.reduce((sum, img) => sum + img.width * img.height, 0);
  const estimatedAtlasSize = Math.ceil(Math.sqrt(totalArea * 1.1));
  
  return {
    count: images.length,
    estimatedSize: `${estimatedAtlasSize}x${estimatedAtlasSize}`,
    totalPixels: totalArea
  };
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Texture Packer Tool

Usage:
  bun run tools/texturePacker.ts [folder]     Pack textures from specific folder
  bun run tools/pack-textures.ts --list      List available folders
  bun run tools/pack-textures.ts --stats     Show statistics for all folders
  bun run tools/pack-textures.ts --help      Show this help

Examples:
  bun run tools/texturePacker.ts Item         Pack all Item textures
  bun run tools/texturePacker.ts Skill        Pack all Skill textures
  bun run tools/texturePacker.ts              Pack ALL textures (warning: very large!)

Output:
  Atlases are saved to: public/game-assets/atlases/
  Format: [folder]_atlas.webp + [folder]_atlas.json
    `);
    return;
  }
  
  if (args.includes('--list')) {
    console.log('\nAvailable folders:');
    const folders = getAvailableFolders();
    folders.forEach(folder => {
      console.log(`  ${folder}`);
    });
    console.log(`\nTotal: ${folders.length} folders`);
    return;
  }
  
  if (args.includes('--stats')) {
    console.log('\nFolder Statistics:');
    console.log('================');
    const folders = getAvailableFolders();
    
    folders.forEach(folder => {
      const stats = getFolderStats(folder);
      console.log(`${folder.padEnd(12)} : ${stats.count.toString().padStart(4)} images, ~${stats.estimatedSize.padEnd(12)} atlas`);
    });
    
    const totalImages = folders.reduce((sum, folder) => sum + getFolderStats(folder).count, 0);
    console.log(`\nTotal images: ${totalImages}`);
    return;
  }
  
  console.log('Use --help for usage information');
}

main(); 