/**
 * Créditos institucionales del pie. ÚNICO punto donde sustituir el texto por
 * las imágenes oficiales cuando existan (ver «Logos esperados» en
 * docs/guia-visual.md): public/logos/clena.svg y public/logos/uninorte.svg
 * (o PNG de al menos 2x), con su versión para fondo oscuro
 * (clena-oscuro.svg, uninorte-oscuro.svg). El texto alternativo es el nombre.
 */
const CREDITOS = {
  clena: 'Corporación Luis Eduardo Nieto Arteta (CLENA)',
  proyecto: 'Proyecto académico · Universidad del Norte',
} as const

export function CreditosInstitucionales() {
  return (
    <div className="creditos">
      <p className="creditos-linea">{CREDITOS.clena}</p>
      <p className="creditos-linea">{CREDITOS.proyecto}</p>
    </div>
  )
}
