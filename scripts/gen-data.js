// Генерирует old/data.js из public/data_seva_updated1.csv
// Запускается из rsbuild.config.ts (onAfterBuild) при `pnpm build`.
// Формат 1:1 с исходным data.js: lat/lon = repr(float), pop = float(.0),
// порядок = регионы по алфавиту + «г. *» в конце, внутри — исходный порядок CSV.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function num(x) {
  x = (x || '').trim();
  if (!x) return 0;
  return Number.parseFloat(x.replace(',', '.')) || 0;
}

function readCsv(path) {
  const text = readFileSync(path, 'utf8');
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field); field = '';
        if (row.some((f) => f !== '')) rows.push(row);
        row = [];
      } else field += c;
    }
  }
  if (field !== '' || row.length) { row.push(field); if (row.some((f) => f !== '')) rows.push(row); }
  const header = rows.shift();
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])));
}

function main() {
  const csvPath = join(root, 'public', 'data_seva_updated1.csv');
  const rows = readCsv(csvPath).filter((r) => r['ID'] && r['ID'].trim());

  const lat = [], lon = [], names = [], regions = [], pop02 = [], pop10 = [], pop21 = [];
  for (const r of rows) {
    lat.push(num(r['Широта']));
    lon.push(num(r['Долгота']));
    names.push(r['Населенный пункт']);
    regions.push(r['Регион']);
    pop02.push(num(r['ВПН-2002']));
    pop10.push(num(r['ВПН-2010']));
    pop21.push(num(r['ВПН-2021']));
  }

  // порядок регионов: алфавит + «г. *» в конце
  const allRegs = [...new Set(regions)].filter(Boolean);
  const alpha = allRegs.filter((r) => !r.startsWith('г. ')).sort();
  const gor = allRegs.filter((r) => r.startsWith('г. ')).sort();
  const regOrder = [...alpha, ...gor];

  // регион -> список индексов (в исходном порядке)
  const byRegion = new Map(regOrder.map((r) => [r, []]));
  regions.forEach((r, i) => { if (byRegion.has(r)) byRegion.get(r).push(i); });

  // region_stats: count + sum pop
  const regionStats = {};
  for (const r of regOrder) {
    const idxs = byRegion.get(r) || [];
    const c = { count: idxs.length, pop_2002: 0, pop_2010: 0, pop_2021: 0 };
    for (const i of idxs) {
      c.pop_2002 += pop02[i]; c.pop_2010 += pop10[i]; c.pop_2021 += pop21[i];
    }
    regionStats[r] = c;
  }

  // geojson_regions: имена из old/regions.js (89)
  let geoRegions = [], geoNames = {};
  try {
    const rs = readFileSync(join(root, 'old', 'regions.js'), 'utf8');
    const m = rs.match(/window\.__REGIONS_GEO\s*=\s*(\{[\s\S]*\})\s*;?\s*$/);
    if (m) {
      const geo = JSON.parse(m[1]);
      geoRegions = geo.features.map((f) => f.properties.name_rus);
      geoNames = Object.fromEntries(geo.features.map((f) => [f.properties.name_rus, f.properties.name_rus]));
    }
  } catch { /* regions.js может отсутствовать в dev — пустые массивы */ }

  // переставить точки в порядок регOrder
  const order = [];
  for (const r of regOrder) order.push(...(byRegion.get(r) || []));
  const pick = (arr) => order.map((i) => arr[i]);

  const data = {
    lat: pick(lat), lon: pick(lon), names: pick(names), regions: pick(regions),
    pop_2002: pick(pop02), pop_2010: pick(pop10), pop_2021: pick(pop21),
    meta_regs: regOrder,
    region_stats: regionStats,
    geojson_regions: geoRegions,
    geojson_russian_names: geoNames,
  };

  // целевой каталог: argv[2] (абсолютный путь) или по умолчанию root/old
  const outDir = process.argv[2] ? process.argv[2] : join(root, 'old');
  const out = join(outDir, 'data.js');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(
    out,
    '// Данные для старой (plotly) версии карты.\n' +
    '// Сгенерировано из public/data_seva_updated1.csv (не коммитить).\n' +
    'const data = ' + JSON.stringify(data) + ';\n',
    'utf8'
  );
  console.log(`[gen-data] ${out}: ${data.lat.length} точек, ${regOrder.length} регионов`);
}

main();
