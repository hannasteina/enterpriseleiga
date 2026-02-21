import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const raw = readFileSync(join(root, 'bílaflottinn.csv'), 'utf-8');
const lines = raw.replace(/\r/g, '').split('\n').filter(Boolean);
const header = lines[0].split(';');
console.log('Header:', header);
console.log('Total lines:', lines.length);

const companies = new Map();

for (let i = 1; i < lines.length; i++) {
  const cols = lines[i].split(';');
  if (cols[1] !== 'Fyrirtæki') continue;

  const nafn = cols[2]?.trim();
  if (!nafn) continue;

  const key = nafn.toLowerCase();
  if (!companies.has(key)) {
    companies.set(key, {
      nafn,
      heimilisfang: cols[3]?.trim() || '',
      postnumer: cols[4]?.trim() || '',
      bilar: 0,
      bilaflokkar: {},
      nyjastaDagsetning: '',
    });
  }

  const c = companies.get(key);
  c.bilar++;

  const flokkur = cols[6]?.trim() || 'Annað';
  c.bilaflokkar[flokkur] = (c.bilaflokkar[flokkur] || 0) + 1;

  const dags = cols[0]?.trim() || '';
  if (dags > c.nyjastaDagsetning) {
    c.nyjastaDagsetning = dags;
    c.heimilisfang = cols[3]?.trim() || c.heimilisfang;
    c.postnumer = cols[4]?.trim() || c.postnumer;
  }
}

console.log('Unique companies:', companies.size);

const result = Array.from(companies.values())
  .map(c => ({
    n: c.nafn,
    h: c.heimilisfang,
    p: c.postnumer,
    b: c.bilar,
    f: c.bilaflokkar,
    d: c.nyjastaDagsetning,
  }))
  .sort((a, b) => b.b - a.b);

const output = JSON.stringify(result);
const outPath = join(root, 'public', 'bilaflottinn-companies.json');
writeFileSync(outPath, output, 'utf-8');

console.log(`Written ${result.length} companies to ${outPath}`);
console.log(`File size: ${(Buffer.byteLength(output) / 1024).toFixed(1)} KB`);
console.log('Top 10 by fleet size:');
result.slice(0, 10).forEach(c => {
  console.log(`  ${c.n}: ${c.b} bílar`);
});
