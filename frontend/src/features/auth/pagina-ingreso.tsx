import { useEffect, useState, type FormEvent } from 'react'
import {
  Alert,
  Button,
  Checkbox,
  Card,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useLocation, useNavigate } from 'react-router-dom'
import { ApiError, peticion } from '../../shared/api/client'
import { useSesion, type Rol } from './sesion-context'

interface RespuestaDeIngreso {
  accessToken: string
  usuario: { nombre: string; rol: Rol }
}

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

export function PaginaIngreso() {
  const { iniciarSesion } = useSesion()
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

  async function ingresar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (ocupado || error?.tipo === 'bloqueo') return

    setOcupado(true)
    setError(null)
    try {
      const respuesta = await peticion<RespuestaDeIngreso>('/auth/login', {
        metodo: 'POST',
        cuerpo: { email: correo, password: contrasena },
      })

      iniciarSesion({
        token: respuesta.accessToken,
        nombre: respuesta.usuario.nombre,
        rol: respuesta.usuario.rol,
      })

      const estado = ubicacion.state as { desde?: unknown } | null
      const destinoRecordado =
        typeof estado?.desde === 'string' &&
        estado.desde.startsWith('/') &&
        !estado.desde.startsWith('//')
          ? estado.desde
          : null
      navegar(
        destinoRecordado ??
          (respuesta.usuario.rol === 'READER' ? '/' : '/gestion'),
        { replace: true },
      )
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
