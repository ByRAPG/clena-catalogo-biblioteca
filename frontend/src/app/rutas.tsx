import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { PaginaIngreso } from '../features/auth/pagina-ingreso'
import { PaginaDetalleObra } from '../features/catalog/pagina-detalle-obra'
import { PaginaPrivacidad } from '../features/privacy/pagina-privacidad'
import { PaginaBusqueda } from '../features/search/pagina-busqueda'
import { Layout } from './layout'
import { PaginaMensaje } from './pagina-mensaje'
import { RutaProtegida } from './ruta-protegida'

const PaginaImportacion = lazy(() =>
  import('../features/catalog/pagina-importacion').then((m) => ({ default: m.PaginaImportacion })),
)
const PaginaEditarEjemplar = lazy(() =>
  import('../features/catalog/pagina-editar-ejemplar').then((m) => ({ default: m.PaginaEditarEjemplar })),
)
const PaginaRegistrarLibro = lazy(() =>
  import('../features/catalog/pagina-registrar-libro').then((m) => ({ default: m.PaginaRegistrarLibro })),
)
const PaginaGestion = lazy(() =>
  import('../features/catalog/pagina-gestion').then((m) => ({ default: m.PaginaGestion })),
)
const PaginaPrestamos = lazy(() =>
  import('../features/loans/pagina-prestamos').then((m) => ({ default: m.PaginaPrestamos })),
)

/**
 * Mapa de rutas (T-03).
 * Públicas: búsqueda, detalle de la obra, ingreso y aviso de privacidad.
 * Protegidas: gestión del catálogo para ADMIN o STAFF; importación solo ADMIN.
 */
export function Rutas() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<PaginaBusqueda />} />
        <Route path="obras/:id" element={<PaginaDetalleObra />} />
        <Route path="ingresar" element={<PaginaIngreso />} />
        <Route path="privacidad" element={<PaginaPrivacidad />} />
        <Route
          path="gestion/importar"
          element={
            <RutaProtegida roles={['ADMIN']}>
              <PaginaImportacion />
            </RutaProtegida>
          }
        />
        <Route
          path="gestion/registrar-libro"
          element={
            <RutaProtegida roles={['ADMIN', 'STAFF']}>
              <PaginaRegistrarLibro />
            </RutaProtegida>
          }
        />
        <Route
          path="gestion/ejemplares"
          element={
            <RutaProtegida roles={['ADMIN', 'STAFF']}>
              <PaginaEditarEjemplar />
            </RutaProtegida>
          }
        />
        <Route
          path="gestion/prestamos"
          element={
            <RutaProtegida roles={['ADMIN', 'STAFF']}>
              <PaginaPrestamos />
            </RutaProtegida>
          }
        />
        <Route
          path="gestion"
          element={
            <RutaProtegida roles={['ADMIN', 'STAFF']}>
              <PaginaGestion />
            </RutaProtegida>
          }
        />
        <Route
          path="sin-permiso"
          element={
            <PaginaMensaje
              titulo="No tiene permiso"
              detalle="Su cuenta no puede abrir esta sección."
            />
          }
        />
        <Route
          path="*"
          element={
            <PaginaMensaje
              titulo="Página no encontrada"
              detalle="Revise la dirección o vuelva al catálogo."
            />
          }
        />
      </Route>
    </Routes>
  )
}
