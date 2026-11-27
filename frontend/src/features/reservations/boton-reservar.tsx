import { useContext, useState } from 'react'
import { Alert, Button, Stack, Text } from '@mantine/core'
import { Link } from 'react-router-dom'
import { SesionContext } from '../auth/sesion-context'
import { reservarObra, type Reserva } from './reservas.api'

function formatearPlazo(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * HU-14: «Reservar» en el detalle de una obra con ejemplares disponibles. Solo
 * se ofrece a un lector con sesión; sin sesión invita a ingresar. Usa el
 * contexto directamente para no fallar donde no hay proveedor de sesión.
 */
export function BotonReservar({
  workId,
  disponibles,
}: {
  workId: string
  disponibles: number
}) {
  const contexto = useContext(SesionContext)
  const [ocupado, setOcupado] = useState(false)
  const [reserva, setReserva] = useState<Reserva | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (contexto === null || contexto.recuperando || disponibles <= 0) return null
  const { sesion } = contexto

  if (sesion === null) {
    return (
      <Text>
        Para reservar este libro <Link to="/ingresar">ingrese</Link> o{' '}
        <Link to="/registro">cree una cuenta</Link>.
      </Text>
    )
  }
  if (sesion.rol !== 'READER') return null

  async function reservar() {
    if (ocupado || sesion === null) return
    setOcupado(true)
    setError(null)
    try {
      setReserva(await reservarObra(workId, sesion.token))
    } catch (causa) {
      setError(
        causa instanceof Error ? causa.message : 'No se pudo reservar el libro.',
      )
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Stack gap="xs" align="flex-start">
      {reserva === null && (
        <Button
          onClick={() => void reservar()}
          loading={ocupado}
          style={{ minHeight: 44 }}
        >
          Reservar
        </Button>
      )}
      {reserva && (
        <Alert color="green" title="Reserva hecha" role="status">
          Reservamos el ejemplar {reserva.inventoryCode}. Recójalo antes del{' '}
          {formatearPlazo(reserva.expiresAt)}. La verá en{' '}
          <Link to="/mi-cuenta">Mi cuenta</Link>.
        </Alert>
      )}
      {error && (
        <Alert color="red" title="No se pudo reservar" role="alert">
          {error}
        </Alert>
      )}
    </Stack>
  )
}
