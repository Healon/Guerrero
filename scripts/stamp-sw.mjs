// ============================================================
// build 後把部署版號蓋進 dist/sw.js 的 cache 名
// （防歷代 hashed 資產永留快取 → Cache Storage 無限膨脹）
// ============================================================
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'sw.js');
if (!existsSync(dist)) {
  console.error('stamp-sw: dist/sw.js 不存在（build 是否失敗？）');
  process.exit(1);
}
const src = readFileSync(dist, 'utf8');
if (!src.includes('__GG_BUILD__')) {
  console.error('stamp-sw: 找不到 __GG_BUILD__ 佔位符，sw.js 可能已被改壞');
  process.exit(1);
}
const version = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
writeFileSync(dist, src.replaceAll('__GG_BUILD__', version));
console.log(`✓ sw.js 版號蓋章：${version}`);
