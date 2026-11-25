// Aplica un concepto de logo de Busca Fácil: node scripts/aplicar-logo.mjs c|a|b|bf
// - Actualiza CONCEPTO_LOGO en src/shared/ui/logo-concepto.ts.
// - Copia el símbolo del concepto a public/favicon.svg.
// - Genera los PNG (favicon-32, apple-touch-icon, icon-192, icon-512) con Chrome o
//   Edge sin interfaz si hay uno instalado (sin dependencias de npm); si no, los
//   PNG se quedan como están y se avisa.
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const concepto = process.argv[2]
const simbolos = { a: 'busca-a-mini.svg', b: 'busca-b-mini.svg', c: 'busca-c-mini.svg', bf: 'bf-oscuro.svg' }
if (!simbolos[concepto]) {
  console.error('Uso: node scripts/aplicar-logo.mjs c|a|b|bf')
  process.exit(1)
}

const archivoConcepto = join(raiz, 'src/shared/ui/logo-concepto.ts')
const codigo = readFileSync(archivoConcepto, 'utf8')
writeFileSync(
  archivoConcepto,
  codigo.replace(/CONCEPTO_LOGO: ConceptoLogo = '[a-z]+'/, `CONCEPTO_LOGO: ConceptoLogo = '${concepto}'`),
)

const svg = join(raiz, 'public/logos-alt', simbolos[concepto])
copyFileSync(svg, join(raiz, 'public/favicon.svg'))
console.log(`Concepto ${concepto}: CONCEPTO_LOGO y public/favicon.svg actualizados.`)

const navegadores = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
]
const navegador = navegadores.find((ruta) => existsSync(ruta))
if (!navegador) {
  console.warn('Sin Chrome ni Edge: los PNG (favicon-32, apple-touch-icon, icon-192, icon-512) no se regeneraron.')
  process.exit(0)
}

const tmp = mkdtempSync(join(tmpdir(), 'logo-'))
const iconos = { 'favicon-32.png': 32, 'apple-touch-icon.png': 180, 'icon-192.png': 192, 'icon-512.png': 512 }
const contenido = readFileSync(svg, 'utf8')
for (const [nombre, lado] of Object.entries(iconos)) {
  const html = join(tmp, `${lado}.html`)
  writeFileSync(
    html,
    `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:transparent}svg{display:block;width:${lado}px;height:${lado}px}</style>${contenido}`,
  )
  execFileSync(navegador, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    `--user-data-dir=${join(tmp, 'perfil')}`,
    '--default-background-color=00000000',
    `--window-size=${lado},${lado}`,
    `--screenshot=${join(raiz, 'public', nombre)}`,
    pathToFileURL(html).href,
  ], { stdio: 'ignore' })
}
console.log('PNG regenerados: ' + Object.keys(iconos).join(', '))
