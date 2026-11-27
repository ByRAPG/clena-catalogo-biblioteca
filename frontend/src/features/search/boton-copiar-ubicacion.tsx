import { Button } from '@mantine/core'
import { useState } from 'react'

/**
 * Copia al portapapeles «Sala › Sección › Estante» para pegarlo en un mensaje
 * o llevarlo anotado. Si el navegador no permite copiar, lo dice.
 */
export function BotonCopiarUbicacion({
  texto,
  etiqueta = 'Copiar ubicación',
}: {
  texto: string
  etiqueta?: string
}) {
  const [aviso, setAviso] = useState('')

  async function copiar() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('sin portapapeles')
      await navigator.clipboard.writeText(texto)
      setAviso('Ubicación copiada')
    } catch {
      setAviso('No se pudo copiar')
    }
  }

  return (
    <span className="copiar-ubicacion no-imprimir">
      <Button
        type="button"
        variant="default"
        size="sm"
        style={{ minHeight: 44 }}
        onClick={copiar}
      >
        {etiqueta}
      </Button>
      <span role="status" className="copiar-ubicacion-aviso">
        {aviso}
      </span>
    </span>
  )
}
