/**
 * Fetch car images from imagin.studio API.
 * Run: node scripts/fetch-car-images.mjs
 *
 * imagin.studio provides free car visualization images with transparent
 * backgrounds — ideal for car rental / fleet management apps.
 */

import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CARS = [
  { file: 'kia-picanto.png', make: 'kia', model: 'picanto', year: 2024 },
  { file: 'toyota-aygo.png', make: 'toyota', model: 'aygo', year: 2023 },
  { file: 'opel-corsa.png', make: 'opel', model: 'corsa', year: 2024 },
  { file: 'hyundai-i30-wagon.png', make: 'hyundai', model: 'i30+wagon', year: 2023 },
  { file: 'hyundai-i20.png', make: 'hyundai', model: 'i20', year: 2024 },
  { file: 'hyundai-i30.png', make: 'hyundai', model: 'i30', year: 2023 },
  { file: 'kia-ceed-sw.png', make: 'kia', model: 'ceed+sw', year: 2024 },
  { file: 'skoda-octavia-wagon.png', make: 'skoda', model: 'octavia+combi', year: 2024 },
  { file: 'kia-stonic.png', make: 'kia', model: 'stonic', year: 2024 },
  { file: 'hyundai-bayon.png', make: 'hyundai', model: 'bayon', year: 2024 },
  { file: 'dacia-duster.png', make: 'dacia', model: 'duster', year: 2023 },
  { file: 'kia-sportage.png', make: 'kia', model: 'sportage', year: 2024 },
  { file: 'hyundai-tucson.png', make: 'hyundai', model: 'tucson', year: 2024 },
  { file: 'skoda-kodiaq.png', make: 'skoda', model: 'kodiaq', year: 2024 },
  { file: 'kia-sorento.png', make: 'kia', model: 'sorento', year: 2024 },
  { file: 'bmw-x5.png', make: 'bmw', model: 'x5', year: 2023 },
  { file: 'volvo-xc90.png', make: 'volvo', model: 'xc90', year: 2024 },
  { file: 'toyota-land-cruiser.png', make: 'toyota', model: 'land+cruiser', year: 2023 },
  { file: 'jeep-compass.png', make: 'jeep', model: 'compass', year: 2023 },
  { file: 'jeep-renegade.png', make: 'jeep', model: 'renegade', year: 2023 },
  { file: 'kia-niro.png', make: 'kia', model: 'niro', year: 2024 },
  { file: 'vw-id5.png', make: 'volkswagen', model: 'id.5', year: 2023 },
  { file: 'tesla-model-y.png', make: 'tesla', model: 'model+y', year: 2023 },
  { file: 'vw-transporter.png', make: 'volkswagen', model: 'transporter', year: 2024 },
  { file: 'mercedes-sprinter.png', make: 'mercedes-benz', model: 'sprinter', year: 2024 },
  { file: 'ford-transit.png', make: 'ford', model: 'transit', year: 2023 },
];

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'cars');

function buildUrl(car) {
  const angle = car.angle ?? '29';
  return `https://cdn.imagin.studio/getimage?customer=img&make=${car.make}&modelFamily=${car.model}&modelYear=${car.year}&angle=${angle}&width=800`;
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close();
          fs.unlinkSync(dest);
          download(res.headers.location, dest).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          file.close();
          fs.unlinkSync(dest);
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', (err) => {
        file.close();
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`Fetching ${CARS.length} car images to ${OUTPUT_DIR}\n`);

  let success = 0;
  let failed = 0;

  for (const car of CARS) {
    const dest = path.join(OUTPUT_DIR, car.file);

    if (fs.existsSync(dest)) {
      const stats = fs.statSync(dest);
      if (stats.size > 1000) {
        console.log(`  SKIP  ${car.file} (already exists, ${(stats.size / 1024).toFixed(0)} KB)`);
        success++;
        continue;
      }
    }

    const url = buildUrl(car);
    try {
      await download(url, dest);
      const size = fs.statSync(dest).size;
      console.log(`  OK    ${car.file} (${(size / 1024).toFixed(0)} KB)`);
      success++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  FAIL  ${car.file} — ${msg}`);
      failed++;
    }

    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\nDone: ${success} ok, ${failed} failed`);
}

main();
