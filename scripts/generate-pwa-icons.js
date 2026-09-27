import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generateIcons() {
  const publicDir = path.resolve('public');
  const svgPath = path.join(publicDir, 'logo.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  console.log('Generating PWA icons from logo.svg...');

  // 1. Standard 512x512 icon (purpose: any)
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Created pwa-512x512.png');

  // 2. Standard 192x192 icon (purpose: any)
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Created pwa-192x192.png');

  // 3. Apple Touch Icon 180x180 (iPhone & iPad Safari Home Screen)
  // Apple automatically applies squircle rounding, so a solid rich green/dark background is optimal
  const appleSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180">
      <rect width="180" height="180" fill="#0f172a" rx="36"/>
      <g transform="translate(18, 18) scale(0.288)">
        ${svgBuffer.toString().replace(/<\?xml.*?\?>/, '').replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')}
      </g>
    </svg>
  `;
  await sharp(Buffer.from(appleSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png (180x180 for iOS)');

  // 4. Maskable 512x512 icon (purpose: maskable)
  // Android launcher crops to circles or squircles within the safe zone (central 80%).
  // We place a rich solid background and scale the inner logo to ~370px inside the 512x512 canvas.
  const innerLogoBuffer = await sharp(svgBuffer)
    .resize(380, 380, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 15, g: 23, b: 42, alpha: 1 } // #0f172a dark slate brand background
    }
  })
    .composite([
      {
        input: innerLogoBuffer,
        top: 66,
        left: 66
      }
    ])
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Created pwa-maskable-512x512.png (512x512 with safe zone)');

  // 5. Favicon 64x64 & 32x32
  await sharp(svgBuffer)
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Created favicon.png');

  // Copy favicon.png to favicon.ico as PNG-encoded favicon fallback
  fs.copyFileSync(path.join(publicDir, 'favicon.png'), path.join(publicDir, 'favicon.ico'));
  console.log('Created favicon.ico');

  console.log('All PWA and mobile launcher icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
