// Evalúa la búsqueda contra una API en marcha con la semilla ficticia.
// Uso: pnpm search:eval [--base-url http://localhost:3000/api/v1] [--verbose]
// Por modo (lexical, semantic, hybrid) calcula sobre test/fixtures/search-eval.json:
// recall@10, nDCG@10 y MRR (consultas con respuesta), precisión de lo devuelto
// y tasa de falsos positivos (consultas sin respuesta que devuelven algo).
// Con pocas obras las cifras son orientativas. Los umbrales se recalibran
// con esto cada vez que cambian el modelo o el texto de las obras.
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const base = opt(
  '--base-url',
  process.env.SEARCH_EVAL_BASE_URL ?? 'http://localhost:3000/api/v1',
);
const verbose = args.includes('--verbose');
const fixture = JSON.parse(
  readFileSync(
    new URL('../test/fixtures/search-eval.json', import.meta.url),
    'utf8',
  ),
);
const MODES = ['lexical', 'semantic', 'hybrid'];

async function search(q, mode) {
  const url = `${base}/search/works?q=${encodeURIComponent(q)}&mode=${mode}&pageSize=50`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} en ${url}`);
  const body = await res.json();
  return { titles: body.data.map((w) => w.title), meta: body.meta };
}

const log2 = (i) => 1 / Math.log2(i + 2);
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const mean = (xs) => (xs.length ? sum(xs) / xs.length : NaN);
const f = (n) => (Number.isNaN(n) ? '  -  ' : n.toFixed(3));

function score(titles, relevant) {
  const rel = new Set(relevant);
  const top = titles.slice(0, 10);
  const first = titles.findIndex((t) => rel.has(t));
  const ideal = sum(
    Array.from({ length: Math.min(rel.size, 10) }, (_, i) => log2(i)),
  );
  return {
    recall: top.filter((t) => rel.has(t)).length / Math.min(rel.size, 10),
    ndcg: sum(top.map((t, i) => (rel.has(t) ? log2(i) : 0))) / ideal,
    mrr: first < 0 ? 0 : 1 / (first + 1),
    precision:
      titles.length === 0
        ? 1
        : titles.filter((t) => rel.has(t)).length / titles.length,
    returned: titles.length,
  };
}

const rows = [];
for (const mode of MODES) {
  const pos = [];
  const neg = [];
  for (const { q, type, relevant } of fixture.queries) {
    const { titles, meta } = await search(q, mode);
    if (relevant.length === 0) {
      neg.push(titles.length > 0 ? 1 : 0);
      if (verbose && titles.length > 0) {
        console.log(
          `[${mode}] falso positivo «${q}» (${meta.total}): ${titles.slice(0, 3).join(' | ')}`,
        );
      }
    } else {
      const s = score(titles, relevant);
      pos.push(s);
      if (verbose && s.recall < 1) {
        console.log(
          `[${mode}] ${type} «${q}» recall ${f(s.recall)}: ${titles.slice(0, 3).join(' | ')}`,
        );
      }
    }
  }
  rows.push({
    mode,
    recall: mean(pos.map((s) => s.recall)),
    ndcg: mean(pos.map((s) => s.ndcg)),
    mrr: mean(pos.map((s) => s.mrr)),
    precision: mean(pos.map((s) => s.precision)),
    returned: mean(pos.map((s) => s.returned)),
    fpr: mean(neg),
  });
}
const none = fixture.queries.filter((x) => x.relevant.length === 0).length;
console.log(`Consultas: ${fixture.queries.length} (${none} sin respuesta)`);
console.log('modo      recall@10  nDCG@10  MRR    precisión  devueltas  falsos+');
for (const r of rows) {
  console.log(
    `${r.mode.padEnd(9)} ${f(r.recall)}      ${f(r.ndcg)}    ${f(r.mrr)}  ${f(r.precision)}      ${r.returned.toFixed(1).padStart(5)}      ${f(r.fpr)}`,
  );
}
