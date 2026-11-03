/**
 * Si-MAKO — build frontend untuk Vercel (tanpa dependensi).
 *   node build.js
 * Env:
 *   SIMAKO_API_URL  URL Web App Apps Script (berakhiran /exec) milik klien
 *   SIMAKO_APP_NAME (opsional) bawaan "Si-MAKO"
 * Hasil di dist/:
 *   - config.js ditulis dari env (satu repo dipakai banyak klien)
 *   - ?v= di index.html & sw.js serta VER service worker diberi stempel versi
 *     unik per commit → HP klien otomatis memuat versi baru
 */
const fs = require('fs');
const path = require('path');

const SRC = __dirname, OUT = path.join(SRC, 'dist');
const SKIP = new Set(['build.js', 'dist', 'node_modules', 'vercel.json']);

function copyDir(from, to) {
  let n = 0;
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from, { withFileTypes: true }).forEach(e => {
    if (from === SRC && SKIP.has(e.name)) return;
    if (e.name.startsWith('.git')) return;
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) n += copyDir(a, b);
    else { fs.copyFileSync(a, b); n++; }
  });
  return n;
}

const warn = msg => console.warn('⚠️  ' + msg);

// 1. salin
fs.rmSync(OUT, { recursive: true, force: true });
const count = copyDir(SRC, OUT);

// 2. stempel versi
const indexPath = path.join(OUT, 'index.html'), swPath = path.join(OUT, 'sw.js');
let html = fs.readFileSync(indexPath, 'utf8'), sw = fs.readFileSync(swPath, 'utf8');
const base = (html.match(/\?v=([\w.]+?)(?:-[\w]+)?["']/) || [])[1] || '0.0.0';
const sha = (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7) || Date.now().toString(36);
const stamp = base + '-' + sha;
html = html.replace(/\?v=[\w.-]+/g, '?v=' + stamp);
sw = sw.replace(/\?v=[\w.-]+/g, '?v=' + stamp).replace(/const VER = '[^']*'/, "const VER = 'simako-" + stamp + "'");
fs.writeFileSync(indexPath, html);
fs.writeFileSync(swPath, sw);

// 3. config.js dari env
const apiUrl = String(process.env.SIMAKO_API_URL || '').trim();
const appName = String(process.env.SIMAKO_APP_NAME || '').trim() || 'Si-MAKO';
if (!apiUrl) warn('SIMAKO_API_URL kosong — deploy tetap jalan, layar login menampilkan petunjuk pengisian.');
else if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(apiUrl)) warn('SIMAKO_API_URL tidak berpola https://script.google.com/macros/s/…/exec — pastikan alamatnya benar.');
fs.writeFileSync(path.join(OUT, 'config.js'),
  '/* Dibuat otomatis oleh build.js — ubah lewat Environment Variable SIMAKO_API_URL di Vercel, lalu Redeploy. */\n' +
  'window.SIMAKO_CONFIG = ' + JSON.stringify({ API_URL: apiUrl, APP_NAME: appName, BUILD: stamp }, null, 2) + ';\n');

// 4. ringkasan
const shown = apiUrl.length > 60 ? apiUrl.slice(0, 45) + '…' + apiUrl.slice(-10) : (apiUrl || '(kosong)');
console.log('✅ Si-MAKO build ' + stamp + ' · ' + count + ' file → dist/');
console.log('   API_URL : ' + shown);
console.log('   APP_NAME: ' + appName);
