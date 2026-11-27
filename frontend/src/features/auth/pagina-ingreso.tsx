import { useEffect, useRef, useState, type FormEvent } from 'react'
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
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FranjaFoto } from '../../shared/ui/franja-foto'
import { IconoAlerta, IconoCandado } from '../../shared/ui/iconos'
import { ApiError } from '../../shared/api/client'
import { ejecutarConCortina } from '../intro/cortina'
import { useSesion } from './sesion-context'

type ErrorDeIngreso =
  | { tipo: 'general'; mensaje: string }
  | { tipo: 'bloqueo'; segundos: number }

/** Espera que se muestra si el 429 llega sin `Retry-After` (o con uno inútil). */
const ESPERA_POR_DEFECTO_SEGUNDOS = 60

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
  // Solo el ingreso con el formulario usa la cortina; recuperar la sesión no.
  const viaFormulario = useRef(false)

  useEffect(() => {
    if (error?.tipo !== 'bloqueo') return

    const temporizador = window.setTimeout(() => {
      setError((actual) => {
        if (actual?.tipo !== 'bloqueo') return actual
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
    const destino = destinoTrasIngresar(ubicacion.state, sesion.rol)
    const ir = () => navegar(destino, { replace: true })
    if (viaFormulario.current) {
      viaFormulario.current = false
      ejecutarConCortina(ir).catch(() => undefined)
      return
    }
    ir()
  }, [sesion, ubicacion.state, navegar])

  async function ingresar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (ocupado || error?.tipo === 'bloqueo') return

    setOcupado(true)
    setError(null)
    viaFormulario.current = true
    try {
      await iniciarSesion(correo, contrasena)
    } catch (causa: unknown) {
      viaFormulario.current = false
      if (causa instanceof ApiError && causa.statusCode === 401) {
        setError({
          tipo: 'general',
          mensaje:
            'Correo o contraseña incorrectos. Revisa tus datos y vuelve a intentarlo.',
        })
      } else if (causa instanceof ApiError && causa.statusCode === 429) {
        // Este 429 es el límite de peticiones por IP, no el bloqueo de la cuenta.
        const espera = causa.retryAfterSeconds
        setError({
          tipo: 'bloqueo',
          segundos:
            espera !== null && espera > 0 ? espera : ESPERA_POR_DEFECTO_SEGUNDOS,
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
      <Group gap="sm" aria-live="polite" className="estado-cargando">
        <Loader size="sm" />
        <Text>Comprobando su sesión…</Text>
      </Group>
    )
  }

  const bloqueado = error?.tipo === 'bloqueo'

  return (
    <FranjaFoto foto="interior" tono="marino" className="ingreso">
      <Card
        component="section"
        aria-labelledby="titulo-ingreso"
        padding="xl"
        className="ingreso-tarjeta"
      >
        <Stack gap="md">
          <div className="ingreso-cabecera">
            <span className="insignia-icono" aria-hidden="true">
              <IconoCandado />
            </span>
            <p className="rotulo">Busca Fácil · CLENA</p>
            <Title id="titulo-ingreso" order={1} size="h2">
              Iniciar sesión
            </Title>
            <Text c="dimmed" size="sm">
              Ingrese con su cuenta de lector o de personal.
            </Text>
          </div>

          {error && (
            <Alert
              role="alert"
              color="red"
              icon={<IconoAlerta />}
              title={
                error.tipo === 'bloqueo'
                  ? 'Demasiados intentos desde este equipo'
                  : 'No se pudo iniciar sesión'
              }
            >
              {error.tipo === 'bloqueo'
                ? 'Espere un momento e intente de nuevo.'
                : error.mensaje}
            </Alert>
          )}
          {/* La cuenta regresiva va fuera del aviso: dentro, el lector de
              pantalla volvería a leer el aviso completo cada segundo. */}
          {error?.tipo === 'bloqueo' && (
            <Text size="sm" aria-live="off">
              Puede volver a intentarlo en {formatearEspera(error.segundos)}.
            </Text>
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
                {bloqueado ? 'Espere un momento' : 'Iniciar sesión'}
              </Button>
            </Stack>
          </form>
          <Link to="/registro" className="enlace-centrado">
            Crear cuenta
          </Link>
          <Link to="/" className="enlace-centrado">
            Volver al catálogo
          </Link>
        </Stack>
      </Card>
    </FranjaFoto>
  )
}
