export interface PasoTutorial {
  titulo: string
  texto: string
}

/** Recorrido de la primera búsqueda (HU-15). Máximo 4 pasos. */
export const PASOS_TUTORIAL: readonly PasoTutorial[] = [
  {
    titulo: 'Escriba lo que sabe',
    texto:
      'Escriba una parte del título, el autor o el tema del libro. No hace falta que esté completo.',
  },
  {
    titulo: 'Lea los resultados',
    texto:
      'Debajo del campo aparece la lista de libros que coinciden con lo que escribió.',
  },
  {
    titulo: 'Vea dónde está',
    texto:
      'Cada libro indica la sala, la sección y el estante donde lo encuentra.',
  },
  {
    titulo: 'Vea si está disponible',
    texto:
      'Junto a cada libro se indica si hay un ejemplar disponible para usted.',
  },
]
