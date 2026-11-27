import { useEffect, useState, type FormEvent } from 'react'
import {
  Alert,
  Button,
  Group,
  Loader,
  PasswordInput,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { useNavigate } from 'react-router-dom'
import { EncabezadoSeccion } from '../../shared/ui/encabezado-seccion'
import { useSesion } from '../auth/sesion-context'
import { MisReservas } from '../reservations/mis-reservas'
import { eliminarMiCuenta, obtenerMiCuenta, type MiCuenta } from './cuenta.api'

function formatearFecha(iso: string | null): string {
  if (iso === null) return 'Sin registro'
  return new Date(iso).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** HU-16 y HU-17: datos de la cuenta del lector y eliminación con contraseña. */
export function PaginaMiCuenta() {
  const { sesion, cerrarSesion } = useSesion()
  const navegar = useNavigate()
  const token = sesion?.token ?? ''
  const [cuenta, setCuenta] = useState<MiCuenta | null>(null)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [contrasena, setContrasena] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    const control = new AbortController()
    obtenerMiCuenta(token, control.signal)
      .then(setCuenta)
      .catch((causa: unknown) => {
        if (control.signal.aborted) return
        setErrorCarga(
          causa instanceof Error ? causa.message : 'No se pudo cargar su cuenta.',
        )
      })
    return () => control.abort()
  }, [token])

  async function eliminar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (ocupado) return
    setOcupado(true)
    setErrorEliminar(null)
    try {
      await eliminarMiCuenta(contrasena, token)
    } catch (causa) {
      setErrorEliminar(
        causa instanceof Error ? causa.message : 'No se pudo eliminar la cuenta.',
      )
      setOcupado(false)
      return
    }
    try {
      await cerrarSesion()
    } catch {
      // La cuenta ya no existe; cerrar sesión localmente es suficiente.
    }
    navegar('/', { replace: true })
  }

  return (
    <Stack gap="lg">
      <EncabezadoSeccion
        migas={[{ texto: 'Inicio', to: '/' }, { texto: 'Mi cuenta' }]}
        volver={{ texto: 'Volver al catálogo', to: '/' }}
        rotulo="Cuenta"
        titulo="Mi cuenta"
        descripcion="Sus datos y las opciones de su cuenta."
      />

      {errorCarga && (
        <Alert role="alert" color="red" title="No se pudo cargar">
          {errorCarga}
        </Alert>
      )}
      {cuenta === null && !errorCarga && <Loader size="sm" />}
      {cuenta && (
        <dl aria-label="Datos de la cuenta">
          <Text component="dt" fw={600}>
            Nombre
          </Text>
          <Text component="dd">{cuenta.nombre}</Text>
          <Text component="dt" fw={600}>
            Correo
          </Text>
          <Text component="dd">{cuenta.correo}</Text>
          <Text component="dt" fw={600}>
            Aviso de privacidad aceptado el
          </Text>
          <Text component="dd">
            {formatearFecha(cuenta.consentimientoEn)}
            {cuenta.versionAviso ? ` (versión ${cuenta.versionAviso})` : ''}
          </Text>
        </dl>
      )}

      <MisReservas token={token} />

      <Stack gap="sm">
        <Title order={2} size="h4">
          Eliminar mi cuenta
        </Title>
        {!confirmando ? (
          <>
            <Text size="sm">
              Se borrarán sus datos personales. El historial de préstamos se
              conserva sin su nombre. Si tiene un libro prestado, devuélvalo
              primero.
            </Text>
            <Group>
              <Button color="red" variant="outline" onClick={() => setConfirmando(true)}>
                Eliminar mi cuenta
              </Button>
            </Group>
          </>
        ) : (
          <form onSubmit={eliminar} aria-label="Confirmar eliminación de la cuenta">
            <Stack gap="sm">
              {errorEliminar && (
                <Alert role="alert" color="red" title="No se pudo eliminar">
                  {errorEliminar}
                </Alert>
              )}
              <PasswordInput
                label="Escriba su contraseña para confirmar"
                required
                maxLength={200}
                autoComplete="current-password"
                value={contrasena}
                onChange={(e) => setContrasena(e.currentTarget.value)}
              />
              <Group>
                <Button type="submit" color="red" loading={ocupado}>
                  Confirmar eliminación
                </Button>
                <Button
                  variant="default"
                  disabled={ocupado}
                  onClick={() => {
                    setConfirmando(false)
                    setContrasena('')
                    setErrorEliminar(null)
                  }}
                >
                  Cancelar
                </Button>
              </Group>
            </Stack>
          </form>
        )}
      </Stack>
    </Stack>
  )
}
