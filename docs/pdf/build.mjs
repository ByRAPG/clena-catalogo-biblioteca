// Genera los PDF de docs/ a partir de las fuentes Markdown.
//   node build.mjs                      -> todos los documentos de documentos.json
//   node build.mjs arquitectura inception
//   node build.mjs --fuente x.md --salida x.pdf --titulo "Prueba"   (modo de prueba)
// Opciones: --fecha "6 de noviembre de 2026"  --version 1.2
// Entorno:  PDF_CHROME_PATH = ruta de un Chrome/Chromium/Edge (por defecto usa Edge instalado)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Marked } from 'marked';
import { chromium } from 'playwright-core';
import { PDFDocument } from 'pdf-lib';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.resolve(AQUI, '..');

class ErrorDoc extends Error {}

// ---------- Argumentos ----------
function leerArgs(argv) {
  const opts = {};
  const ids = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const clave = a.slice(2);
      const valor = argv[i + 1];
      if (valor === undefined || valor.startsWith('--')) throw new ErrorDoc(`Falta el valor de ${a}`);
      opts[clave] = valor;
      i++;
    } else ids.push(a);
  }
  return { opts, ids };
}

function fechaHoy() {
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
}

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function textoPlano(html) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------- Validación: prohibido Mermaid / PlantUML ----------
function validarSinDiagramasEnTexto(md, archivo) {
  const lineas = md.split(/\r?\n/);
  for (let i = 0; i < lineas.length; i++) {
    const l = lineas[i];
    let tipo = null;
    if (/^\s{0,3}(```+|~~~+)\s*(mermaid|plantuml|puml)\b/i.test(l)) tipo = l.match(/(mermaid|plantuml|puml)/i)[1];
    else if (/^\s*@startuml\b/i.test(l)) tipo = 'PlantUML (@startuml)';
    if (tipo) {
      throw new ErrorDoc(
        `${archivo}:${i + 1}: bloque ${tipo} no permitido. Los diagramas deben ser imágenes exportadas desde draw.io ` +
          `(fuente en docs/diagramas/*.drawio, imagen en docs/img/*.png) con leyenda "Figura N. Título".`,
      );
    }
  }
}

// ---------- Markdown -> HTML ----------
function mdAHtml(md, dirMd, archivo) {
  const encabezados = [];
  let figura = 0;
  let h1Omitido = false;

  const marked = new Marked({ gfm: true, breaks: false });

  const mimes = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
  function resolverImagen(href) {
    if (/^(https?:|data:)/i.test(href)) return href;
    const ruta = path.resolve(dirMd, decodeURI(href.replace(/^file:\/\/\/?/, '')));
    if (!fs.existsSync(ruta)) throw new ErrorDoc(`${archivo}: imagen no encontrada: ${href} (buscada en ${ruta})`);
    const mime = mimes[path.extname(ruta).toLowerCase()] ?? 'application/octet-stream';
    return `data:${mime};base64,${fs.readFileSync(ruta).toString('base64')}`;
  }

  function figuraHtml(tok) {
    const alt = (tok.text ?? '').trim();
    let leyenda;
    const m = alt.match(/^Figura\s+(\d+)\s*\./i);
    if (m) {
      figura = Number(m[1]);
      leyenda = alt;
    } else {
      figura += 1;
      leyenda = alt ? `Figura ${figura}. ${alt}` : `Figura ${figura}.`;
      console.warn(`  aviso: ${archivo}: la imagen ${tok.href} no tiene alt "Figura N. ..."; se numera como Figura ${figura}.`);
    }
    return `<figure><img src="${resolverImagen(tok.href)}" alt="${esc(leyenda)}"><figcaption>${esc(leyenda)}</figcaption></figure>\n`;
  }

  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens);
        if (depth === 1 && !h1Omitido) {
          h1Omitido = true;
          return '';
        }
        let marca = '';
        let id = '';
        if (depth === 2 || depth === 3) {
          const n = encabezados.length;
          id = ` id="h-${n}"`;
          marca = `<span class="marca">QXH${n}XQ</span>`;
          encabezados.push({ n, nivel: depth, texto: textoPlano(html) });
        }
        return `<h${depth}${id}>${marca}${html}</h${depth}>\n`;
      },
      paragraph({ tokens }) {
        const utiles = tokens.filter((t) => !(t.type === 'text' && !t.raw.trim()));
        if (utiles.length === 1 && utiles[0].type === 'image') return figuraHtml(utiles[0]);
        return `<p>${this.parser.parseInline(tokens)}</p>\n`;
      },
      image(tok) {
        // Imagen dentro de un texto (no sola en su párrafo): se incrusta sin leyenda.
        return `<img src="${resolverImagen(tok.href)}" alt="${esc(tok.text ?? '')}">`;
      },
    },
  });

  const html = marked.parse(md);
  return { html, encabezados };
}

// ---------- Plantillas ----------
function portadaHtml(proy, titulo, version, fecha) {
  const filas = proy.integrantes
    .map((p) => `<tr><td>${esc(p.nombre)}</td><td>${esc(p.rol)}</td></tr>`)
    .join('');
  return `<section class="portada">
  <div class="universidad">${esc(proy.universidad)}</div>
  <div class="barra"></div>
  <h1 class="doc-titulo">${esc(titulo)}</h1>
  <p class="proyecto">${esc(proy.proyecto)}</p>
  <p class="codigo">Proyecto ${esc(proy.codigo)}</p>
  <p class="curso">${esc(proy.curso)}</p>
  <p class="origen">Equipo de origen: ${esc(proy.equipoOrigen)}</p>
  <div class="sub">Integrantes</div>
  <table><thead><tr><th>Nombre</th><th>Rol</th></tr></thead><tbody>${filas}</tbody></table>
  <div class="pie-portada">
    <div class="dato">Docente<br><strong>${esc(proy.docente)}</strong></div>
    <div class="dato">${esc(proy.ciudad)}<br><strong>${esc(fecha)}</strong></div>
    <div class="dato" style="text-align:right">Versión<br><strong>${esc(version)}</strong></div>
  </div>
</section>`;
}

function indiceHtml(encabezados, paginas) {
  if (!encabezados.length) return '';
  const items = encabezados
    .map(
      (e) =>
        `<li class="n${e.nivel}"><a href="#h-${e.n}"><span class="txt">${esc(e.texto)}</span><span class="puntos"></span><span class="pag">${paginas[e.n] ?? '0'}</span></a></li>`,
    )
    .join('\n');
  return `<section class="indice"><h1 class="indice-titulo">Índice</h1><ul>\n${items}\n</ul></section>`;
}

function documentoHtml(css, cuerpo) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>${css}
.marca{color:#fff;font-size:1px;line-height:0;user-select:none}
.reserva{height:1px;break-after:page;page-break-after:always}
</style></head><body>${cuerpo}</body></html>`;
}

const MARGEN = { top: '2.2cm', bottom: '2.2cm', left: '2cm', right: '2cm' };

function plantillasPdf(proy, titulo) {
  const base = 'font-family:Segoe UI,Arial,sans-serif;font-size:8px;color:#7b8794;width:100%;padding:0 2cm;';
  return {
    header: `<div style="${base}display:flex;justify-content:space-between;border-bottom:0.5px solid #d9e2ec;padding-bottom:3px;"><span>${esc(proy.nombreCorto)}</span><span>${esc(titulo)}</span></div>`,
    footer: `<div style="${base}text-align:right;">Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>`,
  };
}

// ---------- Extracción de texto por página (pdfjs) ----------
async function textoPorPagina(buffer) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const tarea = pdfjs.getDocument({ data: new Uint8Array(buffer), verbosity: 0, useSystemFonts: true });
  const doc = await tarea.promise;
  const paginas = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const pag = await doc.getPage(i);
    const contenido = await pag.getTextContent();
    paginas.push(contenido.items.map((it) => it.str ?? '').join(''));
  }
  await tarea.destroy();
  return paginas;
}

function localizarEncabezados(textos, encabezados) {
  const res = {};
  for (const e of encabezados) {
    const marca = `QXH${e.n}XQ`;
    const idx = textos.findIndex((t) => t.replace(/\s+/g, '').includes(marca));
    if (idx >= 0) res[e.n] = idx + 1;
  }
  return res;
}

// ---------- Navegador ----------
let navegador = null;
async function obtenerNavegador() {
  if (navegador) return navegador;
  try {
    navegador = process.env.PDF_CHROME_PATH
      ? await chromium.launch({ executablePath: process.env.PDF_CHROME_PATH })
      : await chromium.launch({ channel: 'msedge' });
  } catch (e) {
    throw new ErrorDoc(
      `No se pudo abrir el navegador (${e.message.split('\n')[0]}). Instala Microsoft Edge o Chrome, ` +
        'o define PDF_CHROME_PATH con la ruta del ejecutable.',
    );
  }
  return navegador;
}

async function renderizar(html, opciones) {
  const nav = await obtenerNavegador();
  const page = await nav.newPage();
  try {
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    return await page.pdf({ format: 'Letter', margin: MARGEN, printBackground: true, ...opciones });
  } finally {
    await page.close();
  }
}

// ---------- Generación de un documento ----------
async function generar({ archivoMd, salida, titulo, version, fecha, proy, css, horizontal }) {
  const rel = path.relative(process.cwd(), archivoMd);
  const nombreMd = rel.startsWith('..') ? archivoMd : rel;
  const md = fs.readFileSync(archivoMd, 'utf8').replace(/^\uFEFF/, '');
  validarSinDiagramasEnTexto(md, nombreMd);
  const { html, encabezados } = mdAHtml(md, path.dirname(archivoMd), nombreMd);

  const meta = `Versión ${version} · ${fecha}`;
  const contenido = `<main class="contenido"><h1 class="titulo-doc">${esc(titulo)}</h1><div class="meta">${esc(meta)}</div>\n${html}</main>`;
  const { header, footer } = plantillasPdf(proy, titulo);

  // Portada aparte (sin encabezado ni pie).
  const portadaPdf = await renderizar(
    documentoHtml(css + '.portada{break-after:auto!important;page-break-after:auto!important}', portadaHtml(proy, titulo, version, fecha)),
    {},
  );

  // Cuerpo: una página reservada (se sustituye por la portada) + índice + contenido.
  let paginas = {};
  let cuerpoPdf;
  for (let pasada = 0; pasada < 4; pasada++) {
    const cuerpo = `<div class="reserva"></div>${indiceHtml(encabezados, paginas)}${contenido}`;
    cuerpoPdf = await renderizar(documentoHtml(css, cuerpo), {
      displayHeaderFooter: true,
      landscape: Boolean(horizontal),
      headerTemplate: header,
      footerTemplate: footer,
    });
    if (!encabezados.length) break;
    const encontradas = localizarEncabezados(await textoPorPagina(cuerpoPdf), encabezados);
    const estable = encabezados.every((e) => encontradas[e.n] === paginas[e.n]);
    paginas = encontradas;
    if (estable) break;
  }
  const faltan = encabezados.filter((e) => !paginas[e.n]);
  if (faltan.length) console.warn(`  aviso: no se localizó la página de: ${faltan.map((e) => e.texto).join('; ')}`);

  // Unir: portada (sin numerar) + cuerpo sin la página reservada.
  const final = await PDFDocument.load(cuerpoPdf);
  const portada = await PDFDocument.load(portadaPdf);
  final.removePage(0);
  const [pPortada] = await final.copyPages(portada, [0]);
  final.insertPage(0, pPortada);
  final.setTitle(`${titulo} — ${proy.proyecto}`);
  final.setAuthor(proy.integrantes.map((p) => p.nombre).join(', '));
  final.setSubject(`${proy.codigo} · ${proy.curso}`);
  final.setCreator('docs/pdf/build.mjs');
  fs.mkdirSync(path.dirname(salida), { recursive: true });
  fs.writeFileSync(salida, await final.save());
  console.log(`  ✔ ${path.relative(process.cwd(), salida)} (${final.getPageCount()} páginas)`);
}

// ---------- Principal ----------
async function main() {
  const { opts, ids } = leerArgs(process.argv.slice(2));
  const proy = JSON.parse(fs.readFileSync(path.join(AQUI, 'proyecto.json'), 'utf8'));
  const css = fs.readFileSync(path.join(AQUI, 'estilo.css'), 'utf8');
  const fecha = opts.fecha ?? fechaHoy();
  const trabajos = [];

  if (opts.fuente) {
    const archivoMd = path.resolve(opts.fuente);
    if (!fs.existsSync(archivoMd)) throw new ErrorDoc(`No existe el archivo ${archivoMd}`);
    trabajos.push({
      archivoMd,
      salida: path.resolve(opts.salida ?? archivoMd.replace(/\.md$/i, '.pdf')),
      titulo: opts.titulo ?? path.basename(archivoMd, '.md'),
      version: opts.version ?? '1.0',
      fecha,
      proy,
      css,
    });
  } else {
    const docs = JSON.parse(fs.readFileSync(path.join(AQUI, 'documentos.json'), 'utf8'));
    for (const id of ids) {
      if (!docs.some((d) => d.id === id)) {
        throw new ErrorDoc(`Documento desconocido "${id}". Disponibles: ${docs.map((d) => d.id).join(', ')}`);
      }
    }
    for (const d of docs) {
      if (ids.length && !ids.includes(d.id)) continue;
      const archivoMd = path.resolve(AQUI, d.fuente);
      if (!fs.existsSync(archivoMd)) {
        if (ids.length) throw new ErrorDoc(`No existe la fuente de "${d.id}": ${archivoMd}`);
        console.warn(`aviso: se omite "${d.id}" porque no existe ${path.relative(process.cwd(), archivoMd)}`);
        continue;
      }
      trabajos.push({
        archivoMd,
        salida: path.join(DOCS, `${d.id}.pdf`),
        titulo: opts.titulo ?? d.titulo,
        version: opts.version ?? d.version,
        horizontal: d.horizontal,
        fecha,
        proy,
        css,
      });
    }
  }

  let fallos = 0;
  for (const t of trabajos) {
    console.log(`Generando ${t.titulo}…`);
    try {
      await generar(t);
    } catch (e) {
      if (!(e instanceof ErrorDoc)) throw e;
      fallos++;
      console.error(`  ✖ ${e.message}`);
    }
  }
  if (navegador) await navegador.close();
  if (fallos) {
    console.error(`\n${fallos} documento(s) con errores.`);
    process.exit(1);
  }
}

main().catch(async (e) => {
  console.error(e instanceof ErrorDoc ? `Error: ${e.message}` : e);
  if (navegador) await navegador.close().catch(() => {});
  process.exit(1);
});
