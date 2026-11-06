// Exporta docs/diagramas/*.drawio a docs/img/<nombre>.png con el CLI de draw.io Desktop.
// Entorno: DRAWIO_PATH = ruta del ejecutable (si no, se autodetecta).

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const DIR_DIAGRAMAS = path.resolve(AQUI, '..', 'diagramas');
const DIR_IMG = path.resolve(AQUI, '..', 'img');

function buscarDrawio() {
  if (process.env.DRAWIO_PATH) {
    if (!fs.existsSync(process.env.DRAWIO_PATH)) {
      throw new Error(`DRAWIO_PATH no existe: ${process.env.DRAWIO_PATH}`);
    }
    return process.env.DRAWIO_PATH;
  }
  if (process.platform === 'win32') {
    const candidatos = [
      path.join(process.env.LOCALAPPDATA ?? '', 'Programs', 'draw.io', 'draw.io.exe'),
      path.join(process.env.ProgramFiles ?? 'C:\\Program Files', 'draw.io', 'draw.io.exe'),
      path.join(process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)', 'draw.io', 'draw.io.exe'),
    ];
    const hallado = candidatos.find((c) => fs.existsSync(c));
    if (hallado) return hallado;
    throw new Error('No se encontró draw.io Desktop. Instálalo (winget install JGraph.Draw) o define DRAWIO_PATH.');
  }
  if (process.platform === 'darwin') {
    const mac = '/Applications/draw.io.app/Contents/MacOS/draw.io';
    if (fs.existsSync(mac)) return mac;
  }
  return 'drawio';
}

if (!fs.existsSync(DIR_DIAGRAMAS)) {
  console.log('No existe docs/diagramas/; no hay nada que exportar.');
  process.exit(0);
}
const fuentes = fs.readdirSync(DIR_DIAGRAMAS).filter((f) => f.toLowerCase().endsWith('.drawio')).sort();
if (!fuentes.length) {
  console.log('No hay archivos .drawio en docs/diagramas/.');
  process.exit(0);
}

let drawio;
try {
  drawio = buscarDrawio();
} catch (e) {
  console.error(`Error: ${e.message}`);
  process.exit(1);
}
fs.mkdirSync(DIR_IMG, { recursive: true });

// En Linux sin pantalla (CI) draw.io necesita un servidor X virtual y --no-sandbox.
const extra = [];
let comando = drawio;
let argsPrevios = [];
if (process.platform === 'linux') {
  extra.push('--no-sandbox');
  if (!process.env.DISPLAY && spawnSync('which', ['xvfb-run']).status === 0) {
    comando = 'xvfb-run';
    argsPrevios = ['-a', drawio];
  }
}

let fallos = 0;
for (const f of fuentes) {
  const entrada = path.join(DIR_DIAGRAMAS, f);
  const salida = path.join(DIR_IMG, f.replace(/\.drawio$/i, '.png'));
  const r = spawnSync(
    comando,
    [...argsPrevios, '--export', '--format', 'png', '--scale', '2', '--border', '20', '--output', salida, entrada, ...extra],
    { encoding: 'utf8', timeout: 120000 },
  );
  if (r.status === 0 && fs.existsSync(salida)) {
    console.log(`✔ ${path.relative(process.cwd(), salida)}`);
  } else {
    fallos++;
    console.error(`✖ ${f}: ${(r.stderr || r.error?.message || 'error desconocido').trim()}`);
  }
}
if (fallos) process.exit(1);
