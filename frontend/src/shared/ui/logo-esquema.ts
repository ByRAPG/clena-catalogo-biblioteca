import { ESQUEMA_LOGO, type EsquemaLogo } from './logo-concepto'

const CLAVE = 'logo-esquema'

function esEsquema(valor: unknown): valor is EsquemaLogo {
  return valor === 1 || valor === 2 || valor === 3
}

/** Esquema de la sesión de vista previa: `?logo=` manda y se recuerda en `sessionStorage`. */
function esquemaDePrevia(): EsquemaLogo {
  try {
    const url = Number(new URLSearchParams(window.location.search).get('logo'))
    if (esEsquema(url)) {
      window.sessionStorage.setItem(CLAVE, String(url))
      return url
    }
    const guardado = Number(window.sessionStorage.getItem(CLAVE))
    if (esEsquema(guardado)) return guardado
  } catch {
    // sin almacenamiento: vale el de la constante
  }
  return ESQUEMA_LOGO
}

/**
 * Fija `data-logo` en <html> (lo leen las variables de `logo.css`). La rama de la
 * vista previa solo existe si el build lleva `VITE_PREVIEW_LOGOS=true`.
 */
export function aplicarEsquemaLogo(): void {
  let esquema: EsquemaLogo = ESQUEMA_LOGO
  if (import.meta.env.VITE_PREVIEW_LOGOS === 'true') esquema = esquemaDePrevia()
  document.documentElement.dataset.logo = String(esquema)
}
