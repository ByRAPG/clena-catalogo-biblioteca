import { useEffect, useState } from 'react'
import { Alert, Button, Group, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router-dom'
import {
  cancelarReserva,
  listarMisReservas,
  type Reserva,
} from './reservas.api'

function formatearPlazo(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
}

/** HU-14: reservas activas del lector, con su plazo y el botón «Cancelar». */
export function MisReservas({ token }: { token: string }) {
  const [reservas, setReservas] = useState<Reserva[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refresco, setRefresco] = useState(0)

  useEffect(() => {
    if (!token) return
    const control = new AbortController()
    listarMisReservas(token, control.signal)
      .then(setReservas)
      .catch((causa: unknown) => {
        if (control.signal.aborted) return
        setError(
          causa instanceof Error
            ? causa.message
            : 'No se pudieron cargar sus reservas.',
        )
      })
    return () => control.abort()
  }, [token, refresco])

  async function cancelar(reserva: Reserva) {
    setError(null)
    try {
      await cancelarReserva(reserva.id, token)
      setRefresco((n) => n + 1)
    } catch (causa) {
      setError(
        causa instanceof Error ? causa.message : 'No se pudo cancelar la reserva.',
      )
    }
  }

  return (
    <Stack gap="sm" aria-labelledby="titulo-reservas" component="section">
      <Title id="titulo-reservas" order={2} size="h4">
        Mis reservas
      </Title>
      {error && (
        <Alert role="alert" color="red" title="No se pudo completar">
          {error}
        </Alert>
      )}
      {reservas !== null && reservas.length === 0 && (
        <Text>
          No tiene reservas activas. Busque un libro disponible en el{' '}
          <Link to="/">catálogo</Link> y pulse «Reservar».
        </Text>
      )}
      {reservas !== null && reservas.length > 0 && (
        <Stack component="ul" gap="sm" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {reservas.map((reserva) => (
            <li key={reserva.id}>
              <Group justify="space-between" align="center">
                <Stack gap={2}>
                  <Text fw={700}>{reserva.workTitle}</Text>
                  <Text size="sm">
                    Ejemplar {reserva.inventoryCode} · recoger antes del{' '}
                    {formatearPlazo(reserva.expiresAt)}
                  </Text>
                </Stack>
                <Button
                  variant="default"
                  onClick={() => void cancelar(reserva)}
                  aria-label={`Cancelar la reserva de ${reserva.workTitle}`}
                >
                  Cancelar
                </Button>
              </Group>
            </li>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
