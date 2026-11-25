import { Text } from '@mantine/core'
import { CuadroMarca, RejillaCuadros } from '../../shared/ui/cuadro-marca'
import { FranjaFoto } from '../../shared/ui/franja-foto'
import { EncabezadoSeccion } from '../../shared/ui/encabezado-seccion'
import {
  IconoCatalogo,
  IconoLibroNuevo,
  IconoQr,
  IconoSubir,
} from '../../shared/ui/iconos'
import { useSesion } from '../auth/sesion-context'
import { SeccionCodigosQr } from '../qr/seccion-codigos-qr'

/** Pantalla del personal: alta y edición del catálogo (HU-10, HU-11, HU-19). */
export function PaginaGestion() {
  const { sesion } = useSesion()
  const esAdmin = sesion?.rol === 'ADMIN'
  return (
    <div className="pantalla-gestion pantalla-gestion-panel">
      <EncabezadoSeccion
        migas={[{ texto: 'Inicio', to: '/' }, { texto: 'Gestión' }]}
        volver={{ texto: 'Volver al catálogo', to: '/' }}
        rotulo={esAdmin ? 'Administración' : 'Personal'}
        titulo="Gestión del catálogo"
        descripcion="Solo visible para el personal del CLENA. Elija una tarea para empezar."
      />

      <FranjaFoto
        as="section"
        id="tareas-gestion"
        aria-label="Tareas de gestión"
        foto="interior"
        tono="granate"
        className="zona-accesos"
      >
        <div className="zona-accesos-fila">
      <RejillaCuadros etiqueta="Tareas de gestión">
        <CuadroMarca
          tono="azul"
          numero="01"
          icono={<IconoLibroNuevo />}
          titulo="Registrar libro"
          descripcion="Dar de alta un libro con sus autores, temas, categoría y año."
          to="/gestion/registrar-libro"
        />
        <CuadroMarca
          tono="granate"
          numero="02"
          icono={<IconoCatalogo />}
          titulo="Préstamos y devoluciones"
          descripcion="Registrar préstamos de ejemplares a lectores y marcar devoluciones."
          to="/gestion/prestamos"
        />
        {esAdmin && (
          <CuadroMarca
            tono="azul"
            numero="03"
            icono={<IconoSubir />}
            titulo="Importar catálogo"
            descripcion="Cargar muchos libros a la vez desde un archivo CSV."
            to="/gestion/importar"
          />
        )}
        <CuadroMarca
          tono={esAdmin ? 'granate' : 'azul'}
          numero={esAdmin ? '04' : '03'}
          icono={<IconoQr />}
          titulo="Códigos QR"
          descripcion="Descargar los códigos para imprimir en la entrada y en cada sala."
          href="#codigos-qr"
        />
        <CuadroMarca
          tono={esAdmin ? 'azul' : 'granate'}
          numero={esAdmin ? '05' : '04'}
          icono={<IconoCatalogo />}
          titulo="Ver el catálogo"
          descripcion="Revisar cómo ve el público las búsquedas y las fichas."
          to="/"
        />
      </RejillaCuadros>

      {!esAdmin && (
        <Text className="nota-rol" fz="sm">
          La importación por CSV es solo para administración.
        </Text>
      )}
        </div>
      </FranjaFoto>

      <SeccionCodigosQr />
    </div>
  )
}
