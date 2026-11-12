import { Alert, Anchor, List, Stack, Text, Title } from '@mantine/core'

export const VERSION_AVISO_PRIVACIDAD = '2026-11-11'

export const TEXTO_CONSENTIMIENTO =
  'He leído el aviso de privacidad y autorizo el tratamiento de mis datos para gestionar mi cuenta y los servicios de biblioteca que solicite.'

export function PaginaPrivacidad() {
  return (
    <Stack gap="lg">
      <Title order={2}>Aviso de privacidad</Title>
      <Text>Consulta Fácil · Versión {VERSION_AVISO_PRIVACIDAD}</Text>
      <Alert title="Prototipo académico" color="yellow">
        Este aviso es provisional. Antes de usar datos reales deben confirmarse
        con el CLENA el responsable del tratamiento, sus datos de contacto y la
        política institucional. Las demostraciones utilizan datos ficticios.
      </Alert>
      <Title order={3}>Finalidades y datos mínimos</Title>
      <Text>
        La consulta pública del catálogo no requiere crear una cuenta. Para
        gestionar cuentas se prevén nombre, correo y credenciales protegidas.
        Los préstamos y las reservas requieren identificar al lector; los datos
        de contacto solo deben solicitarse cuando sean necesarios para el
        servicio.
      </Text>
      <Text>
        La importación CSV recibe datos bibliográficos y registra la cuenta del
        administrador, el nombre del archivo, la fecha, los totales y los
        errores de las filas. No incluya información personal de lectores en el
        archivo.
      </Text>
      <Title order={3}>Sus derechos</Title>
      <List>
        <List.Item>
          Conocer, actualizar y rectificar sus datos personales.
        </List.Item>
        <List.Item>
          Solicitar prueba de su autorización y conocer el uso dado a sus datos.
        </List.Item>
        <List.Item>
          Solicitar la supresión de sus datos o revocar la autorización cuando
          proceda, teniendo en cuenta las obligaciones legales o contractuales
          de conservación.
        </List.Item>
        <List.Item>
          Acceder gratuitamente a sus datos personales y presentar quejas ante
          la Superintendencia de Industria y Comercio conforme al procedimiento
          aplicable.
        </List.Item>
      </List>
      <Title order={3}>Solicitudes y eliminación de cuenta</Title>
      <Text>
        En este prototipo, solicite al equipo del proyecto la consulta,
        corrección o eliminación de los datos ficticios. El canal institucional
        y la eliminación de cuentas desde la aplicación están pendientes de
        habilitación. Este aviso no activa esas funciones.
      </Text>
      <Title order={3}>Consentimiento para el registro</Title>
      <Text>{TEXTO_CONSENTIMIENTO}</Text>
      <Text>
        El formulario de registro deberá solicitar aceptación expresa y guardar
        la versión del aviso y la fecha de autorización. Leer esta página no
        registra consentimiento.
      </Text>
      <Anchor
        href="https://normograma.dian.gov.co/dian/compilacion/docs/ley_1581_2012.htm"
        target="_blank"
        rel="noreferrer"
      >
        Consultar la Ley 1581 de 2012
      </Anchor>
    </Stack>
  )
}
