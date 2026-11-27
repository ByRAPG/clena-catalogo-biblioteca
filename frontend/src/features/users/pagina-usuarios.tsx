import { useEffect, useState, type FormEvent } from 'react'
import {
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  PasswordInput,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { EncabezadoSeccion } from '../../shared/ui/encabezado-seccion'
import { useSesion } from '../auth/sesion-context'
import {
  cambiarEstadoCuenta,
  crearCuenta,
  listarCuentas,
  type CuentaPersonal,
} from './usuarios.api'

function mensajeDe(causa: unknown): string {
  return causa instanceof Error ? causa.message : 'No se pudo completar la acción.'
}

/** HU-18: el administrador crea y activa o desactiva cuentas del personal. */
export function PaginaUsuarios() {
  const { sesion } = useSesion()
  const token = sesion?.token ?? ''
  const [cuentas, setCuentas] = useState<CuentaPersonal[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const [refresco, setRefresco] = useState(0)
  const cargar = () => setRefresco((n) => n + 1)

  useEffect(() => {
    let cancelado = false
    listarCuentas(token)
      .then((lista) => {
        if (!cancelado) setCuentas(lista)
      })
      .catch((causa: unknown) => {
        if (!cancelado) setError(mensajeDe(causa))
      })
    return () => {
      cancelado = true
    }
  }, [token, refresco])

  async function crear(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (ocupado) return
    setOcupado(true)
    setError(null)
    setAviso(null)
    try {
      await crearCuenta(
        { fullName: nombre, email: correo, password: contrasena },
        token,
      )
      setAviso(`Cuenta creada para ${correo}.`)
      setNombre('')
      setCorreo('')
      setContrasena('')
      cargar()
    } catch (causa) {
      setError(mensajeDe(causa))
    } finally {
      setOcupado(false)
    }
  }

  async function cambiar(cuenta: CuentaPersonal) {
    setError(null)
    setAviso(null)
    try {
      await cambiarEstadoCuenta(cuenta.id, !cuenta.active, token)
      cargar()
    } catch (causa) {
      setError(mensajeDe(causa))
    }
  }

  return (
    <Stack gap="lg">
      <EncabezadoSeccion
        migas={[
          { texto: 'Inicio', to: '/' },
          { texto: 'Gestión', to: '/gestion' },
          { texto: 'Cuentas del personal' },
        ]}
        volver={{ texto: 'Volver a gestión', to: '/gestion' }}
        rotulo="Administración"
        titulo="Cuentas del personal"
        descripcion="Cree cuentas para el personal y active o desactive las existentes."
      />

      {error && (
        <Alert role="alert" color="red" title="No se pudo completar">
          {error}
        </Alert>
      )}
      {aviso && (
        <Alert role="status" color="green" title="Listo">
          {aviso}
        </Alert>
      )}

      <form onSubmit={crear} aria-label="Crear cuenta de personal">
        <Stack gap="sm">
          <Title order={2} size="h4">
            Nueva cuenta de personal
          </Title>
          <TextInput
            label="Nombre completo"
            required
            maxLength={120}
            value={nombre}
            onChange={(e) => setNombre(e.currentTarget.value)}
          />
          <TextInput
            label="Correo"
            type="email"
            required
            maxLength={254}
            value={correo}
            onChange={(e) => setCorreo(e.currentTarget.value)}
          />
          <PasswordInput
            label="Contraseña inicial"
            description="Entre 12 y 128 caracteres."
            required
            maxLength={128}
            autoComplete="new-password"
            value={contrasena}
            onChange={(e) => setContrasena(e.currentTarget.value)}
          />
          <Group>
            <Button type="submit" loading={ocupado}>
              Crear cuenta
            </Button>
          </Group>
        </Stack>
      </form>

      <Title order={2} size="h4">
        Cuentas existentes
      </Title>
      {cuentas === null && !error && <Loader size="sm" />}
      {cuentas !== null && cuentas.length === 0 && (
        <Text>No hay cuentas registradas.</Text>
      )}
      {cuentas !== null && cuentas.length > 0 && (
        <Table.ScrollContainer minWidth={560}>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nombre</Table.Th>
                <Table.Th>Correo</Table.Th>
                <Table.Th>Rol</Table.Th>
                <Table.Th>Estado</Table.Th>
                <Table.Th>Acción</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {cuentas.map((cuenta) => (
                <Table.Tr key={cuenta.id}>
                  <Table.Td>{cuenta.fullName}</Table.Td>
                  <Table.Td>{cuenta.email}</Table.Td>
                  <Table.Td>
                    {cuenta.role === 'ADMIN' ? 'Administración' : 'Personal'}
                  </Table.Td>
                  <Table.Td>
                    <Badge color={cuenta.active ? 'green' : 'gray'}>
                      {cuenta.active ? 'Activa' : 'Desactivada'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Button
                      size="xs"
                      variant="default"
                      onClick={() => void cambiar(cuenta)}
                      aria-label={`${cuenta.active ? 'Desactivar' : 'Activar'} la cuenta de ${cuenta.fullName}`}
                    >
                      {cuenta.active ? 'Desactivar' : 'Activar'}
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </Stack>
  )
}
