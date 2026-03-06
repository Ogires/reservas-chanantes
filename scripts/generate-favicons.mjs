/**
 * Generate favicon files from SVG templates.
 * Run: node scripts/generate-favicons.mjs
 */
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// SVG with "RC" for larger icons
const svgRC = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <circle cx="256" cy="256" r="256" fill="#E86B50"/>
  <text x="256" y="310" font-size="240" font-weight="bold"
        text-anchor="middle" fill="#ffffff" font-family="Georgia, 'Times New Roman', serif"
        letter-spacing="-10">RC</text>
</svg>`;

// SVG with just "R" for small favicon
const svgR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="16" fill="#E86B50"/>
  <text x="16" y="23" font-size="22" font-weight="bold"
        text-anchor="middle" fill="#ffffff" font-family="Georgia, 'Times New Roman', serif">R</text>
</svg>`;

async function generatePNG(svg, size, outputPath) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(outputPath);
  console.log(`  Created ${outputPath} (${size}x${size})`);
}

// ICO generation: create a minimal ICO with 16x16 and 32x32 PNGs embedded
function createICO(pngBuffers) {
  // ICO header: 2 bytes reserved, 2 bytes type (1=ICO), 2 bytes count
  const numImages = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = dirEntrySize * numImages;

  let offset = headerSize + dirSize;
  const entries = [];

  for (const { data, size } of pngBuffers) {
    entries.push({ data, size, offset });
    offset += data.length;
  }

  const totalSize = offset;
  const buf = Buffer.alloc(totalSize);

  // Header
  buf.writeUInt16LE(0, 0);         // reserved
  buf.writeUInt16LE(1, 2);         // type = ICO
  buf.writeUInt16LE(numImages, 4); // count

  // Directory entries
  for (let i = 0; i < entries.length; i++) {
    const pos = headerSize + i * dirEntrySize;
    const e = entries[i];
    buf.writeUInt8(e.size === 256 ? 0 : e.size, pos);     // width
    buf.writeUInt8(e.size === 256 ? 0 : e.size, pos + 1); // height
    buf.writeUInt8(0, pos + 2);                             // color palette
    buf.writeUInt8(0, pos + 3);                             // reserved
    buf.writeUInt16LE(1, pos + 4);                          // color planes
    buf.writeUInt16LE(32, pos + 6);                         // bits per pixel
    buf.writeUInt32LE(e.data.length, pos + 8);              // size of image data
    buf.writeUInt32LE(e.offset, pos + 12);                  // offset to image data
  }

  // Image data
  for (const e of entries) {
    e.data.copy(buf, e.offset);
  }

  return buf;
}

async function main() {
  console.log('Generating favicons for Reservas Chanantes...\n');

  // Ensure directories exist
  mkdirSync(join(root, 'public'), { recursive: true });
  mkdirSync(join(root, 'src', 'app'), { recursive: true });

  // 1. apple-icon.png (180x180) - solid background, no transparency
  await generatePNG(svgRC, 180, join(root, 'src', 'app', 'apple-icon.png'));

  // 2. icon-192.png
  await generatePNG(svgRC, 192, join(root, 'public', 'icon-192.png'));

  // 3. icon-512.png
  await generatePNG(svgRC, 512, join(root, 'public', 'icon-512.png'));

  // 4. favicon.ico (16x16 + 32x32 using "R" only)
  const png16 = await sharp(Buffer.from(svgR)).resize(16, 16).png().toBuffer();
  const png32 = await sharp(Buffer.from(svgR)).resize(32, 32).png().toBuffer();

  const ico = createICO([
    { data: png16, size: 16 },
    { data: png32, size: 32 },
  ]);
  const icoPath = join(root, 'src', 'app', 'favicon.ico');
  writeFileSync(icoPath, ico);
  console.log(`  Created ${icoPath} (16x16 + 32x32)`);

  console.log('\nDone!');
}

main().catch(console.error);
