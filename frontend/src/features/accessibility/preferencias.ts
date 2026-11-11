/**
 * Preferencias de accesibilidad (HU-04). Son del dispositivo: se guardan en
 * `localStorage` y nunca viajan al servidor ni son datos personales.
 */
export interface Preferencias {
  letraGrande: boolean
  altoContraste: boolean
}

export const CLAVE_PREFERENCIAS = 'clena.accesibilidad'

export const PREFERENCIAS_POR_DEFECTO: Preferencias = {
  letraGrande: false,
  altoContraste: false,
}

/** Lee las preferencias; ante falta de storage o datos corruptos usa los valores por defecto. */
export function leerPreferencias(): Preferencias {
  try {
    const guardado = localStorage.getItem(CLAVE_PREFERENCIAS)
    if (guardado === null) return { ...PREFERENCIAS_POR_DEFECTO }
    const dato: unknown = JSON.parse(guardado)
    if (typeof dato !== 'object' || dato === null) {
      return { ...PREFERENCIAS_POR_DEFECTO }
    }
    const { letraGrande, altoContraste } = dato as Record<string, unknown>
    return {
      letraGrande: letraGrande === true,
      altoContraste: altoContraste === true,
    }
  } catch {
    return { ...PREFERENCIAS_POR_DEFECTO }
  }
}

/** Guarda las preferencias. Devuelve false si el storage no está disponible. */
export function guardarPreferencias(preferencias: Preferencias): boolean {
  try {
    localStorage.setItem(CLAVE_PREFERENCIAS, JSON.stringify(preferencias))
    return true
  } catch {
    return false
  }
}

/** Refleja las preferencias en atributos de <html>; el CSS hace el resto. */
export function aplicarPreferencias(
  preferencias: Preferencias,
  raiz: HTMLElement = document.documentElement,
): void {
  raiz.setAttribute('data-letra-grande', String(preferencias.letraGrande))
  raiz.setAttribute('data-alto-contraste', String(preferencias.altoContraste))
}
