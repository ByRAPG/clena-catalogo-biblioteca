import { useState, type FormEvent } from 'react'
import {
  Alert,
  Button,
  Card,
  Checkbox,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { Link, useNavigate } from 'react-router-dom'
import { FranjaFoto } from '../../shared/ui/franja-foto'
import { useSesion } from '../auth/sesion-context'
import { registrarCuenta } from './cuenta.api'

/** HU-16: registro público de lectores con aceptación expresa del aviso. */
export function PaginaRegistro() {
  const { iniciarSesion } = useSesion()
  const navegar = useNavigate()
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [acepta, setAcepta] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creada, setCreada] = useState(false)

  async function registrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (ocupado) return
    setOcupado(true)
    setError(null)
    try {
      await registrarCuenta({
        fullName: nombre,
        email: correo,
        password: contrasena,
        acceptPrivacy: acepta,
      })
    } catch (causa) {
      setError(
        causa instanceof Error ? causa.message : 'No se pudo crear la cuenta.',
      )
      setOcupado(false)
      return
    }
    try {
      await iniciarSesion(correo, contrasena)
      navegar('/mi-cuenta', { replace: true })
    } catch {
      // Si el correo ya tenía cuenta con otra contraseña, el ingreso falla:
      // se explica sin confirmar ni negar que la cuenta existía.
      setCreada(true)
      setOcupado(false)
    }
  }

  if (creada) {
    return (
      <FranjaFoto foto="interior" tono="marino" className="ingreso">
        <Card padding="xl" className="ingreso-tarjeta">
          <Stack gap="md">
            <Title order={1} size="h2">
              Solicitud recibida
            </Title>
            <Text role="status">
              Si el correo era nuevo, su cuenta ya está creada. Ingrese con su
              correo y su contraseña.
            </Text>
            <Button component={Link} to="/ingresar">
              Ir a ingresar
            </Button>
          </Stack>
        </Card>
      </FranjaFoto>
    )
  }

  return (
    <FranjaFoto foto="interior" tono="marino" className="ingreso">
      <Card
        component="section"
        aria-labelledby="titulo-registro"
        padding="xl"
        className="ingreso-tarjeta"
      >
        <Stack gap="md">
          <Title id="titulo-registro" order={1} size="h2">
            Crear cuenta
          </Title>
          <Text c="dimmed" size="sm">
            Con una cuenta puede reservar libros disponibles. Consultar el
            catálogo no la requiere.
          </Text>
          {error && (
            <Alert role="alert" color="red" title="No se pudo crear la cuenta">
              {error}
            </Alert>
          )}
          <form onSubmit={registrar}>
            <Stack gap="md">
              <TextInput
                label="Nombre completo"
                required
                maxLength={120}
                autoComplete="name"
                value={nombre}
                onChange={(e) => setNombre(e.currentTarget.value)}
              />
              <TextInput
                label="Correo"
                type="email"
                required
                maxLength={254}
                autoComplete="username"
                value={correo}
                onChange={(e) => setCorreo(e.currentTarget.value)}
              />
              <PasswordInput
                label="Contraseña"
                description="Entre 12 y 128 caracteres."
                required
                maxLength={128}
                autoComplete="new-password"
                value={contrasena}
                onChange={(e) => setContrasena(e.currentTarget.value)}
              />
              <Checkbox
                label="Acepto el tratamiento de mis datos"
                description={
                  <>
                    Guardamos su nombre, correo y la fecha de aceptación.{' '}
                    <Link to="/privacidad">Leer el aviso de privacidad</Link>
                  </>
                }
                checked={acepta}
                onChange={(e) => setAcepta(e.currentTarget.checked)}
              />
              <Button type="submit" loading={ocupado} disabled={!acepta} fullWidth>
                Crear cuenta
              </Button>
            </Stack>
          </form>
          <Link to="/ingresar" className="enlace-centrado">
            Ya tengo cuenta
          </Link>
        </Stack>
      </Card>
    </FranjaFoto>
  )
}
