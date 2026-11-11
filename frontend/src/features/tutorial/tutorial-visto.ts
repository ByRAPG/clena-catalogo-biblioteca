/**
 * «Ya visto» del tutorial (HU-15). Solo del dispositivo: `localStorage`,
 * sin enviar nada al servidor.
 */
export const CLAVE_TUTORIAL_VISTO = 'clena.tutorial-busqueda-visto'

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
