import { Route, Routes } from 'react-router-dom'
import { PaginaIngreso } from '../features/auth/pagina-ingreso'
import { PaginaDetalleObra } from '../features/catalog/pagina-detalle-obra'
import { PaginaGestion } from '../features/catalog/pagina-gestion'
import { PaginaImportacion } from '../features/catalog/pagina-importacion'
import { PaginaPrivacidad } from '../features/privacy/pagina-privacidad'
import { PaginaBusqueda } from '../features/search/pagina-busqueda'
import { Layout } from './layout'
import { PaginaMensaje } from './pagina-mensaje'
import { RutaProtegida } from './ruta-protegida'

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
