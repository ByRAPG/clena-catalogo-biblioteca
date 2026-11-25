/**
 * «Ya visto» del tutorial (HU-15). Solo del dispositivo: `localStorage`,
 * sin enviar nada al servidor. La versión sube (v2) cuando el recorrido
 * cambia lo bastante como para volver a mostrarlo a quien ya lo vio.
 */
export const CLAVE_TUTORIAL_VISTO = 'clena.tutorial-busqueda-visto-v2'

/** Clave de `sessionStorage` con la que la intro anota que ya se mostró. */
export const CLAVE_INTRO_VISTA = 'clena:intro-vista'

/** Si el storage falla se considera no visto: mejor mostrar de más que ocultar la ayuda. */
export function tutorialYaVisto(): boolean {
  try {
    return localStorage.getItem(CLAVE_TUTORIAL_VISTO) === 'true'
  } catch {
    return false
  }
}

export function marcarTutorialVisto(): void {
  try {
    localStorage.setItem(CLAVE_TUTORIAL_VISTO, 'true')
  } catch {
    // Sin storage no se puede recordar; no es un error para la persona.
  }
}

/** True si la intro cinemática está activa y aún no se ha mostrado en esta sesión. */
export function introPendiente(): boolean {
  if (import.meta.env.VITE_INTRO_CINEMATICA !== 'true') return false
  if (window.location.pathname !== '/') return false
  try {
    return sessionStorage.getItem(CLAVE_INTRO_VISTA) === null
  } catch {
    return false
  }
}
