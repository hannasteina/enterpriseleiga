/**
 * Remove backgrounds from car images using remove.bg API.
 * Run: npx ts-node --skip-project scripts/remove-bg.ts
 *
 * Requires REMOVE_BG_API_KEY in .env.local
 * Free tier: 50 images/month at remove.bg
 */

import fs from 'fs';
import path from 'path';
import https from 'https';

const CARS_DIR = path.join(__dirname, '..', 'public', 'cars');

function getApiKey(): string {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local not found — add REMOVE_BG_API_KEY');
  }
  const content = fs.readFileSync(envPath, 'utf-8');
  const match = content.match(/REMOVE_BG_API_KEY=(.+)/);
  if (!match) {
    throw new Error('REMOVE_BG_API_KEY not found in .env.local');
  }
  return match[1].trim();
}

function removeBg(inputPath: string, apiKey: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const imageData = fs.readFileSync(inputPath);
    const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);

    let body = '';
    body += `--${boundary}\r\n`;
    body += 'Content-Disposition: form-data; name="image_file"; filename="image.png"\r\n';
    body += 'Content-Type: image/png\r\n\r\n';

    const bodyStart = Buffer.from(body, 'utf-8');
    const bodyEnd = Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="size"\r\n\r\nauto\r\n--${boundary}--\r\n`, 'utf-8');
    const payload = Buffer.concat([bodyStart, imageData, bodyEnd]);

    const options = {
      hostname: 'api.remove.bg',
      path: '/v1.0/removebg',
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': payload.length,
      },
    };

    const req = https.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        const result = Buffer.concat(chunks);
        if (res.statusCode !== 200) {
          reject(new Error(`remove.bg API error ${res.statusCode}: ${result.toString('utf-8')}`));
          return;
        }
        resolve(result);
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  const apiKey = getApiKey();

  if (!fs.existsSync(CARS_DIR)) {
    console.error(`Directory not found: ${CARS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(CARS_DIR).filter((f) => f.endsWith('.png'));
  console.log(`Processing ${files.length} images from ${CARS_DIR}\n`);

  let success = 0;
  let failed = 0;

  for (const file of files) {
    const filePath = path.join(CARS_DIR, file);
    try {
      const result = await removeBg(filePath, apiKey);
      fs.writeFileSync(filePath, result);
      console.log(`  OK    ${file} (${(result.length / 1024).toFixed(0)} KB)`);
      success++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  FAIL  ${file} — ${msg}`);
      failed++;
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\nDone: ${success} ok, ${failed} failed`);
}

main();
