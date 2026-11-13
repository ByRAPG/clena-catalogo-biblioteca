import { useEffect, useState, type FormEvent } from 'react'
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Group,
  Loader,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../../shared/api/client'
import { useSesion } from './sesion-context'

type ErrorDeIngreso =
  | { tipo: 'general'; mensaje: string }
  | { tipo: 'bloqueo'; segundos: number | null }

function formatearEspera(segundos: number): string {
  const minutos = Math.floor(segundos / 60)
  const segundosRestantes = segundos % 60
  const partes: string[] = []

  if (minutos > 0) {
    partes.push(`${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`)
  }
  if (segundosRestantes > 0 || partes.length === 0) {
    partes.push(
      `${segundosRestantes} ${segundosRestantes === 1 ? 'segundo' : 'segundos'}`,
    )
  }
  return partes.join(' y ')
}

/**
 * A dónde ir con la sesión abierta: la ruta desde la que se pidió ingresar,
 * si es interna, o el inicio según el rol. Se rechazan las que empiezan con
 * `//`, que el navegador leería como otro sitio.
 */
function destinoTrasIngresar(estado: unknown, rol: string): string {
  const desde = (estado as { desde?: unknown } | null)?.desde
  if (
    typeof desde === 'string' &&
    desde.startsWith('/') &&
    !desde.startsWith('//')
  ) {
    return desde
  }
  return rol === 'READER' ? '/' : '/gestion'
}

export function PaginaIngreso() {
  const { sesion, recuperando, iniciarSesion } = useSesion()
  const ubicacion = useLocation()
  const navegar = useNavigate()
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [mostrarContrasena, setMostrarContrasena] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<ErrorDeIngreso | null>(null)

  useEffect(() => {
    if (error?.tipo !== 'bloqueo' || error.segundos === null) return

    const temporizador = window.setTimeout(() => {
      setError((actual) => {
        if (actual?.tipo !== 'bloqueo' || actual.segundos === null) {
          return actual
        }
        return actual.segundos <= 1
          ? null
          : { ...actual, segundos: actual.segundos - 1 }
      })
    }, 1000)

    return () => window.clearTimeout(temporizador)
  }, [error])

  // Con sesión (recién iniciada o recuperada con la cookie) no hay nada que
  // hacer en esta pantalla: se va al destino.
  useEffect(() => {
    if (sesion === null) return
    navegar(destinoTrasIngresar(ubicacion.state, sesion.rol), { replace: true })
  }, [sesion, ubicacion.state, navegar])

  async function ingresar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (ocupado || error?.tipo === 'bloqueo') return

    setOcupado(true)
    setError(null)
    try {
      await iniciarSesion(correo, contrasena)
    } catch (causa: unknown) {
      if (causa instanceof ApiError && causa.statusCode === 401) {
        setError({
          tipo: 'general',
          mensaje:
            'Correo o contraseña incorrectos. Revisa tus datos y vuelve a intentarlo.',
        })
      } else if (causa instanceof ApiError && causa.statusCode === 429) {
        setError({
          tipo: 'bloqueo',
          segundos: causa.retryAfterSeconds,
        })
      } else {
        setError({
          tipo: 'general',
          mensaje:
            causa instanceof Error
              ? causa.message
              : 'No se pudo iniciar sesión. Inténtalo de nuevo.',
        })
      }
    } finally {
      setOcupado(false)
    }
  }

  // Al cargar la página se intenta recuperar la sesión con la cookie: hasta
  // saber el resultado no se muestra el formulario.
  if (recuperando) {
    return (
      <Group gap="sm" aria-live="polite">
        <Loader size="sm" />
        <Text>Comprobando su sesión…</Text>
      </Group>
    )
  }

  const bloqueado = error?.tipo === 'bloqueo'

  return (
    <Card
      component="section"
      aria-labelledby="titulo-ingreso"
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      maw={448}
      mx="auto"
    >
      <Stack gap="md">
        <div>
          <Title id="titulo-ingreso" order={2}>
            Iniciar sesión
          </Title>
          <Text c="dimmed" size="sm">
            Acceso exclusivo para el personal bibliotecario.
          </Text>
        </div>

        {error && (
          <Alert
            role="alert"
            color="red"
            title={
              error.tipo === 'bloqueo'
                ? 'Acceso bloqueado tras 5 intentos'
                : 'No se pudo iniciar sesión'
            }
          >
            {error.tipo === 'bloqueo'
              ? error.segundos === null
                ? 'Vuelve a intentarlo más tarde o contacta a la administración de la biblioteca.'
                : `Espera ${formatearEspera(error.segundos)} antes de volver a intentarlo.`
              : error.mensaje}
          </Alert>
        )}

        <form onSubmit={ingresar}>
          <Stack gap="md">
            <TextInput
              label="Correo institucional"
              type="email"
              autoComplete="username"
              required
              value={correo}
              disabled={ocupado}
              onChange={(evento) => {
                setCorreo(evento.currentTarget.value)
                if (!bloqueado) setError(null)
              }}
            />
            <TextInput
              label="Contraseña"
              type={mostrarContrasena ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={contrasena}
              disabled={ocupado}
              onChange={(evento) => {
                setContrasena(evento.currentTarget.value)
                if (!bloqueado) setError(null)
              }}
            />
            <Checkbox
              label="Mostrar contraseña"
              checked={mostrarContrasena}
              onChange={(evento) =>
                setMostrarContrasena(evento.currentTarget.checked)
              }
            />
            <Button
              type="submit"
              loading={ocupado}
              disabled={bloqueado}
              fullWidth
            >
              {bloqueado ? 'Acceso bloqueado' : 'Iniciar sesión'}
            </Button>
          </Stack>
        </form>
      </Stack>
    </Card>
  )
}
