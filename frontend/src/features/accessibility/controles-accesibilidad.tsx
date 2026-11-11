import { Button, Group } from '@mantine/core'
import { useAccesibilidad } from './preferencias-context'

/**
 * Dos botones conmutables (`aria-pressed`) para agrandar la letra y subir el
 * contraste. Objetivo táctil de al menos 44 px y salto de línea en pantallas
 * angostas (360 px) para que nada se corte.
 */
export function ControlesAccesibilidad() {
  const { preferencias, alternarLetraGrande, alternarAltoContraste } =
    useAccesibilidad()

  return (
    <Group
      role="group"
      aria-label="Opciones de accesibilidad"
      gap="xs"
      wrap="wrap"
    >
      <BotonConmutable
        activo={preferencias.letraGrande}
        alAlternar={alternarLetraGrande}
      >
        Letra más grande
      </BotonConmutable>
      <BotonConmutable
        activo={preferencias.altoContraste}
        alAlternar={alternarAltoContraste}
      >
        Alto contraste
      </BotonConmutable>
    </Group>
  )
}

function BotonConmutable({
  activo,
  alAlternar,
  children,
}: {
  activo: boolean
  alAlternar: () => void
  children: string
}) {
  return (
    <Button
      type="button"
      variant={activo ? 'filled' : 'outline'}
      aria-pressed={activo}
      onClick={alAlternar}
      style={{
        minHeight: 44,
        minWidth: 44,
        height: 'auto',
        whiteSpace: 'normal',
      }}
      leftSection={activo ? <span aria-hidden="true">✓</span> : undefined}
    >
      {children}
    </Button>
  )
}
