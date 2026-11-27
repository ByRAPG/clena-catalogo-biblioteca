import { useEffect } from 'react'
import { matchPath, useLocation } from 'react-router-dom'

const SUFIJO = 'Busca Fácil'

/** Título por ruta, de la más específica a la más general. */
const TITULOS: ReadonlyArray<readonly [string, string]> = [
  ['/', 'Buscar libros'],
  ['/obras/:id', 'Detalle de la obra'],
  ['/ingresar', 'Ingresar'],
  ['/privacidad', 'Aviso de privacidad'],
  ['/gestion/importar', 'Importar catálogo'],
  ['/gestion/registrar-libro', 'Registrar libro'],
  ['/gestion/prestamos', 'Préstamos y devoluciones'],
  ['/gestion/ejemplares', 'Ejemplares'],
  ['/gestion/usuarios', 'Cuentas del personal'],
  ['/gestion', 'Gestión del catálogo'],
  ['/sin-permiso', 'Sin permiso'],
  ['/registro', 'Crear cuenta'],
  ['/mi-cuenta', 'Mi cuenta'],
]

export function tituloDeRuta(ruta: string): string {
  const pagina =
    TITULOS.find(([patron]) => matchPath({ path: patron, end: true }, ruta))?.[1] ??
    'Página no encontrada'
  return `${pagina} · ${SUFIJO}`
}

/** Mantiene `document.title` con el patrón «Página · Busca Fácil». */
export function useTituloPagina() {
  const { pathname } = useLocation()
  useEffect(() => {
    document.title = tituloDeRuta(pathname)
  }, [pathname])
}
