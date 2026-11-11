import { Button, Group, Modal, Stack, Text } from '@mantine/core'
import { useState } from 'react'
import { PASOS_TUTORIAL } from './pasos'
import { marcarTutorialVisto, tutorialYaVisto } from './tutorial-visto'

/**
 * Botón «¿Cómo buscar?» y recorrido guiado. Se abre solo en la primera visita
 * del dispositivo. El Modal de Mantine atrapa el foco y cierra con Escape.
 */
export function TutorialBusqueda() {
  const [abierto, setAbierto] = useState(() => !tutorialYaVisto())
  const [indice, setIndice] = useState(0)

  const cerrar = () => {
    marcarTutorialVisto()
    setAbierto(false)
  }
  const abrir = () => {
    setIndice(0)
    setAbierto(true)
  }

  const total = PASOS_TUTORIAL.length
  const paso = PASOS_TUTORIAL[indice]
  const esUltimo = indice === total - 1

  return (
    <>
      <Button type="button" variant="light" onClick={abrir} style={{ minHeight: 44, alignSelf: 'flex-start' }}>
        ¿Cómo buscar?
      </Button>

      <Modal
        opened={abierto}
        onClose={cerrar}
        title="¿Cómo buscar un libro?"
        size="lg"
        centered
        closeButtonProps={{
          'aria-label': 'Cerrar el recorrido',
          className: 'tutorial-cerrar',
        }}
      >
        <Stack gap="md">
          <Text size="sm" fw={600}>
            Paso {indice + 1} de {total}
          </Text>
          <div aria-live="polite">
            <Text component="h3" fz="h3" fw={700} mb="xs">
              {paso.titulo}
            </Text>
            <Text fz="xl">{paso.texto}</Text>
          </div>
          <Group justify="space-between" wrap="wrap">
            <Button type="button" variant="subtle" onClick={cerrar} style={{ minHeight: 44 }}>
              Saltar
            </Button>
            <Group wrap="wrap">
              <Button
                type="button"
                variant="default"
                disabled={indice === 0}
                onClick={() => setIndice(indice - 1)}
                style={{ minHeight: 44 }}
              >
                Anterior
              </Button>
              {esUltimo ? (
                <Button type="button" onClick={cerrar} data-autofocus style={{ minHeight: 44 }}>
                  Terminar
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => setIndice(indice + 1)}
                  data-autofocus
                  style={{ minHeight: 44 }}
                >
                  Siguiente
                </Button>
              )}
            </Group>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
