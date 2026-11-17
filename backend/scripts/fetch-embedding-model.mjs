// Descarga multilingual-e5-small (q8) en una revisión fija y comprueba el
// SHA-256 de cada archivo. Se usa en la etapa `model` del Dockerfile; nunca
// en ejecución. Uso: node scripts/fetch-embedding-model.mjs <carpeta-destino>
import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const REPO = 'Xenova/multilingual-e5-small';
const REVISION = '761b726dd34fb83930e26aab4e9ac3899aa1fa78';

const FILES = {
  'config.json':
    'cb99455288675345e1a4f411438d5d0adbba5fbd3a67ea4fb03c015433b996c1',
  'tokenizer_config.json':
    'a1d6bc8734a6f635dc158508bef000f8e2e5a759c7d92f984b2c86e5ff53425b',
  'special_tokens_map.json':
    'd05497f1da52c5e09554c0cd874037a083e1dc1b9cfd48034d1c717f1afc07a7',
  'tokenizer.json':
    '0b44a9d7b51c3c62626640cda0e2c2f70fdacdc25bbbd68038369d14ebdf4c39',
  'onnx/model_quantized.onnx':
    'f80102d3f2a1229f387d3c81909990d8945513e347b0eab049f7de3c6f98c193',
};

const target = process.argv[2];
if (!target) {
  console.error('Uso: node scripts/fetch-embedding-model.mjs <carpeta-destino>');
  process.exit(2);
}

for (const [file, expected] of Object.entries(FILES)) {
  const destination = join(target, REPO, file);
  await mkdir(dirname(destination), { recursive: true });
  const response = await fetch(
    `https://huggingface.co/${REPO}/resolve/${REVISION}/${file}`,
  );
  if (!response.ok || !response.body) {
    throw new Error(`Descarga fallida de ${file}: HTTP ${response.status}`);
  }
  const hash = createHash('sha256');
  const source = Readable.fromWeb(response.body);
  source.on('data', (chunk) => hash.update(chunk));
  await pipeline(source, createWriteStream(destination));
  const actual = hash.digest('hex');
  if (actual !== expected) {
    await rm(destination, { force: true });
    throw new Error(`SHA-256 distinto en ${file}: ${actual} != ${expected}`);
  }
  console.log(`ok ${file} ${actual}`);
}
