import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';

async function main() {
  const transparentPath = 'public/assets/aistudio/lt_logo_transparent.png';
  const originalPath = 'public/assets/aistudio/image_dc5425df.png';
  const outDir = 'public/qr_badges';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. First, prepare the trimmed transparent logo (for badges)
  const trimmedBuffer = await sharp(transparentPath).trim().toBuffer();

  // 2. Prepare the high-contrast round emblem (from the original logo file, trimmed and circular masked)
  const origTrimmed = await sharp(originalPath).trim().toBuffer();
  const origMeta = await sharp(origTrimmed).metadata();
  const discSize = Math.min(origMeta.width, origMeta.height);

  // Circular mask for the original circular logo to make its boundary clean
  const discMaskSvg = Buffer.from(`
    <svg width="${discSize}" height="${discSize}">
      <circle cx="${discSize/2}" cy="${discSize/2}" r="${discSize/2 - 2}" fill="#ffffff" />
    </svg>
  `);
  const maskedDisc = await sharp(origTrimmed)
    .resize(discSize, discSize, { fit: 'cover' })
    .composite([{ input: discMaskSvg, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const BADGE_SIZE = 800;

  // BADGE 1: "lake_travis_qr_badge_round.png"
  // Purpose-built for QR code center overlay:
  // Solid white outer safety buffer + red accent ring + crisp high-contrast dark emblem inside
  {
    const innerEmblemSize = 580;
    const emblemResized = await sharp(maskedDisc)
      .resize(innerEmblemSize, innerEmblemSize)
      .toBuffer();

    const top = Math.round((BADGE_SIZE - innerEmblemSize) / 2);
    const left = Math.round((BADGE_SIZE - innerEmblemSize) / 2);

    const bgSvg = Buffer.from(`
      <svg width="${BADGE_SIZE}" height="${BADGE_SIZE}" viewBox="0 0 ${BADGE_SIZE} ${BADGE_SIZE}">
        <!-- Solid pure white circle for QR scanning safety quiet zone -->
        <circle cx="${BADGE_SIZE/2}" cy="${BADGE_SIZE/2}" r="${BADGE_SIZE/2 - 4}" fill="#ffffff" stroke="#e4e4e7" stroke-width="6"/>
        <!-- Red team accent ring -->
        <circle cx="${BADGE_SIZE/2}" cy="${BADGE_SIZE/2}" r="${innerEmblemSize/2 + 8}" fill="#18181b" stroke="#dc2626" stroke-width="8"/>
      </svg>
    `);

    await sharp({
      create: {
        width: BADGE_SIZE,
        height: BADGE_SIZE,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .composite([
      { input: bgSvg, top: 0, left: 0 },
      { input: emblemResized, top, left }
    ])
    .png()
    .toFile(path.join(outDir, 'lake_travis_qr_badge_round.png'));
    console.log('Badge 1 generated: lake_travis_qr_badge_round.png');
  }

  // BADGE 2: "lake_travis_qr_badge_squircle.png"
  // Modern rounded square with protective white frame + red accent + logo
  {
    const innerEmblemSize = 560;
    const emblemResized = await sharp(maskedDisc)
      .resize(innerEmblemSize, innerEmblemSize)
      .toBuffer();

    const top = Math.round((BADGE_SIZE - innerEmblemSize) / 2);
    const left = Math.round((BADGE_SIZE - innerEmblemSize) / 2);

    const squircleSvg = Buffer.from(`
      <svg width="${BADGE_SIZE}" height="${BADGE_SIZE}" viewBox="0 0 ${BADGE_SIZE} ${BADGE_SIZE}">
        <!-- Outer white rounded square -->
        <rect x="8" y="8" width="${BADGE_SIZE - 16}" height="${BADGE_SIZE - 16}" rx="160" ry="160" fill="#ffffff" stroke="#18181b" stroke-width="8"/>
        <!-- Red accent boundary -->
        <rect x="32" y="32" width="${BADGE_SIZE - 64}" height="${BADGE_SIZE - 64}" rx="136" ry="136" fill="#18181b" stroke="#dc2626" stroke-width="6"/>
      </svg>
    `);

    await sharp({
      create: {
        width: BADGE_SIZE,
        height: BADGE_SIZE,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .composite([
      { input: squircleSvg, top: 0, left: 0 },
      { input: emblemResized, top, left }
    ])
    .png()
    .toFile(path.join(outDir, 'lake_travis_qr_badge_squircle.png'));
    console.log('Badge 2 generated: lake_travis_qr_badge_squircle.png');
  }

  // BADGE 3: "lake_travis_qr_badge_dark_shield.png"
  // High-tech stealth black badge with dual crimson/silver ring
  {
    const innerEmblemSize = 600;
    const emblemResized = await sharp(maskedDisc)
      .resize(innerEmblemSize, innerEmblemSize)
      .toBuffer();

    const top = Math.round((BADGE_SIZE - innerEmblemSize) / 2);
    const left = Math.round((BADGE_SIZE - innerEmblemSize) / 2);

    const shieldSvg = Buffer.from(`
      <svg width="${BADGE_SIZE}" height="${BADGE_SIZE}" viewBox="0 0 ${BADGE_SIZE} ${BADGE_SIZE}">
        <circle cx="${BADGE_SIZE/2}" cy="${BADGE_SIZE/2}" r="${BADGE_SIZE/2 - 8}" fill="#09090b" stroke="#dc2626" stroke-width="12"/>
        <circle cx="${BADGE_SIZE/2}" cy="${BADGE_SIZE/2}" r="${innerEmblemSize/2 + 10}" fill="#18181b" stroke="#ffffff" stroke-width="4"/>
      </svg>
    `);

    await sharp({
      create: {
        width: BADGE_SIZE,
        height: BADGE_SIZE,
        channels: 4,
        background: { r: 9, g: 9, b: 11, alpha: 1 }
      }
    })
    .composite([
      { input: shieldSvg, top: 0, left: 0 },
      { input: emblemResized, top, left }
    ])
    .png()
    .toFile(path.join(outDir, 'lake_travis_qr_badge_dark_shield.png'));
    console.log('Badge 3 generated: lake_travis_qr_badge_dark_shield.png');
  }

  // BADGE 4: "lake_travis_qr_badge_white_contrast.png"
  // For light backgrounds: gear is clearly visible on white thanks to charcoal gear shading + red LT
  {
    // Render trimmed transparent logo over a light gray/carbon circle inside a white badge
    const innerSize = 580;
    const logoFit = await sharp(trimmedBuffer)
      .resize(innerSize, innerSize, { fit: 'inside' })
      .toBuffer();
    const lInfo = await sharp(logoFit).metadata();

    const top = Math.round((BADGE_SIZE - lInfo.height) / 2);
    const left = Math.round((BADGE_SIZE - lInfo.width) / 2);

    const contrastSvg = Buffer.from(`
      <svg width="${BADGE_SIZE}" height="${BADGE_SIZE}" viewBox="0 0 ${BADGE_SIZE} ${BADGE_SIZE}">
        <!-- White protective container -->
        <circle cx="${BADGE_SIZE/2}" cy="${BADGE_SIZE/2}" r="${BADGE_SIZE/2 - 6}" fill="#ffffff" stroke="#27272a" stroke-width="8"/>
        <!-- Soft silver-gray background disk so white gear has crisp edge contrast -->
        <circle cx="${BADGE_SIZE/2}" cy="${BADGE_SIZE/2}" r="${BADGE_SIZE/2 - 32}" fill="#27272a" stroke="#dc2626" stroke-width="6"/>
      </svg>
    `);

    await sharp({
      create: {
        width: BADGE_SIZE,
        height: BADGE_SIZE,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .composite([
      { input: contrastSvg, top: 0, left: 0 },
      { input: logoFit, top, left }
    ])
    .png()
    .toFile(path.join(outDir, 'lake_travis_qr_badge_white_contrast.png'));
    console.log('Badge 4 generated: lake_travis_qr_badge_white_contrast.png');
  }

  // 5. BONUS: Generate a complete, ready-to-scan sample custom QR code!
  // Uses QR Error Correction Level 'H' (30% redundancy) to allow center logo placement cleanly
  {
    const QR_SIZE = 1200;
    const qrBuffer = await QRCode.toBuffer('https://ais-pre-mk6wpxykq2dtarjfggpt3z-290302117400.us-west2.run.app', {
      errorCorrectionLevel: 'H',
      width: QR_SIZE,
      margin: 3,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    // Badge size on the QR code (approx 24-26% of QR size is optimal for Level H scanning)
    const qrBadgeSize = 310;
    const badgeOnQr = await sharp(path.join(outDir, 'lake_travis_qr_badge_round.png'))
      .resize(qrBadgeSize, qrBadgeSize)
      .toBuffer();

    const centerPos = Math.round((QR_SIZE - qrBadgeSize) / 2);

    await sharp(qrBuffer)
      .composite([{ input: badgeOnQr, top: centerPos, left: centerPos }])
      .png()
      .toFile(path.join(outDir, 'lake_travis_ready_to_use_qr_code.png'));
    console.log('Created full custom QR code: lake_travis_ready_to_use_qr_code.png');
  }

  // Copy all assets to /public root for clean download URLs
  const files = [
    'lake_travis_qr_badge_round.png',
    'lake_travis_qr_badge_squircle.png',
    'lake_travis_qr_badge_dark_shield.png',
    'lake_travis_qr_badge_white_contrast.png',
    'lake_travis_ready_to_use_qr_code.png'
  ];

  for (const f of files) {
    fs.copyFileSync(path.join(outDir, f), path.join('public', f));
  }

  console.log('All files copied to /public successfully!');
}

main().catch(console.error);
