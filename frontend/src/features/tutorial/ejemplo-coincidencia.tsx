import { VisuallyHidden } from '@mantine/core'
import { Resaltado } from '../../shared/ui/resaltado'
import { textoDeLaCoincidencia } from '../search/textos'
import type { MuestraCoincidencia } from './pasos'

/**
 * Ejemplo ilustrativo del paso «Entienda por qué aparece un libro»: mini
 * tarjetas ficticias hechas con los mismos elementos que `TarjetaResultado`
 * (término resaltado, «Coincide en …» con el campo subrayado e insignia
 * «Relacionado por tema»). Es decoración: se oculta a los lectores de
 * pantalla y se sustituye por un texto equivalente. No toca la búsqueda real.
 */
export function EjemploCoincidencia({ muestras }: { muestras: readonly MuestraCoincidencia[] }) {
  const equivalente = muestras
    .map(
      (m) =>
        `Si busca «${m.consulta}», aparece «${m.titulo}» con la nota ${
          m.donde !== undefined ? textoDeLaCoincidencia(m.donde) : 'Relacionado por tema'
        }.`,
    )
    .join(' ')

  return (
    <>
      <div className="tutorial-muestras" aria-hidden="true">
        {muestras.map((m) => (
          <div key={m.consulta} className="tutorial-muestra">
            <p className="tutorial-muestra-consulta">
              Búsqueda: <strong>{m.consulta}</strong>
            </p>
            <p className="tutorial-muestra-titulo">
              <Resaltado texto={m.titulo} consulta={m.donde !== undefined ? m.consulta : ''} />
            </p>
            {m.donde !== undefined ? (
              <p className="coincidencia">
                Coincide en{' '}
                <span className="coincidencia-campo">
                  {textoDeLaCoincidencia(m.donde).replace('Coincide en ', '')}
                </span>
              </p>
            ) : (
              <span className="insignia-significado">Relacionado por tema</span>
            )}
          </div>
        ))}
      </div>
      <VisuallyHidden>{`Ejemplo ilustrativo. ${equivalente}`}</VisuallyHidden>
    </>
  )
}
