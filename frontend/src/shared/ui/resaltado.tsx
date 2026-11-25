import { Fragment } from 'react'
import { trocear } from '../texto/resaltar'

/**
 * Texto con las coincidencias de la consulta en <mark>. Ámbar con texto marino
 * (8,03:1) para una palabra suelta; granate con texto blanco (13,21:1) cuando
 * coincide la frase completa.
 */
export function Resaltado({
  texto,
  consulta,
}: {
  texto: string
  consulta: string
}) {
  if (consulta.trim() === '') return <>{texto}</>
  return (
    <>
      {trocear(texto, consulta).map((trozo, i) =>
        trozo.tipo === 'normal' ? (
          <Fragment key={i}>{trozo.texto}</Fragment>
        ) : (
          <mark
            key={i}
            className={trozo.tipo === 'frase' ? 'marca-frase' : 'marca-termino'}
          >
            {trozo.texto}
          </mark>
        ),
      )}
    </>
  )
}
