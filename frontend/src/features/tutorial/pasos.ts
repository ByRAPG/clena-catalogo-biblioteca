/**
 * Pasos del recorrido guiado. ESTE ES EL ÚNICO ARCHIVO QUE SE EDITA para
 * cambiar el contenido: añada, quite o reordene objetos de `PASOS_TUTORIAL`.
 * Para resaltar un elemento real, póngale `data-tutorial="<id>"` y use ese
 * mismo valor en `objetivo`. Si el elemento no está en pantalla, el paso se
 * muestra igual, sin resaltado.
 */
export type Dispositivo = 'computador' | 'celular'

export interface PasoTutorial {
  id: string
  titulo: string
  /** Un texto para todos o uno por dispositivo (clic y teclado / toque). */
  texto: string | Record<Dispositivo, string>
  /** Valor de `data-tutorial` del elemento que se resalta. */
  objetivo?: string
  /** Si se indica, el paso solo se muestra en ese dispositivo. */
  solo?: Dispositivo
  /** Frase de muestra para cuando el elemento no está en pantalla. */
  ejemplo?: string
  /** Resalta el elemento entero (p. ej. toda la lista), no solo su primer hijo. */
  completo?: boolean
  /** Mini tarjetas ficticias que ilustran el paso (siempre visibles, decorativas). */
  muestras?: readonly MuestraCoincidencia[]
  /** Abre el menú de la cabecera mientras dure el paso (si las acciones están en él). */
  abreMenu?: boolean
}

/** Una mini tarjeta de ejemplo: qué se buscó y por qué aparece el libro. */
export interface MuestraCoincidencia {
  consulta: string
  titulo: string
  /** Campo donde coincidió; sin él, es una coincidencia por significado. */
  donde?: 'title' | 'author' | 'subject'
}

/** Recorrido de la primera búsqueda (HU-15). Máximo 7 pasos. */
export const PASOS_TUTORIAL: readonly PasoTutorial[] = [
  {
    id: 'buscar',
    titulo: 'Busque por título, autor o tema',
    texto: {
      computador:
        'Escriba en el campo una parte del título, el autor o el tema y pulse Enter o «Buscar». No hace falta que esté completo.',
      celular:
        'Toque el campo, escriba una parte del título, el autor o el tema y toque «Buscar». No hace falta que esté completo.',
    },
    objetivo: 'buscador',
  },
  {
    id: 'coincidencia',
    titulo: 'Entienda por qué aparece un libro',
    texto:
      '«Coincide en…» dice en qué campo se encontró lo que escribió (título, autor, tema). «Coincide por significado» marca libros parecidos a su idea, aunque no usen las mismas palabras.',
    objetivo: 'primer-resultado',
    completo: true,
    muestras: [
      { consulta: 'mar', titulo: 'Corrientes y vientos de un mar inventado', donde: 'title' },
      { consulta: 'libros para niños', titulo: 'Abecedario de las olas' },
    ],
  },
  {
    id: 'filtros',
    titulo: 'Afine con los filtros',
    texto: {
      computador:
        'Elija una categoría o una sala, o marque «Solo disponibles». La lista se actualiza sola.',
      celular:
        'Toque una categoría o una sala, o marque «Solo disponibles». La lista se actualiza sola.',
    },
    objetivo: 'filtros',
  },
  {
    id: 'ubicacion',
    titulo: 'Vea si está disponible y dónde',
    texto:
      'Cada libro dice si hay un ejemplar disponible y en qué sala, sección y estante lo encuentra.',
    objetivo: 'primer-resultado',
    ejemplo: 'Disponible · Sala 1, sección A, estante 3',
  },
  {
    id: 'detalle',
    titulo: 'Abra el detalle',
    texto: {
      computador: 'Haga clic en el título del libro para ver toda su ficha.',
      celular: 'Toque el título del libro para ver toda su ficha.',
    },
    objetivo: 'primer-resultado',
  },
  {
    id: 'accesibilidad',
    titulo: 'Ajuste la pantalla a su vista',
    texto:
      '«Letra más grande» y «Alto contraste» están siempre arriba, en todas las páginas, y se recuerdan en este dispositivo. En el menú también encuentra Gestión (personal) e Ingresar.',
    objetivo: 'accesibilidad',
    abreMenu: true,
  },
  {
    id: 'qr',
    titulo: 'Escanee el QR de una sala',
    texto:
      'En cada sala hay un código QR. Apunte la cámara del celular y verá al instante los libros de esa sala.',
    solo: 'celular',
    ejemplo: 'QR de la sala → libros de esa sala',
  },
]

/** Pasos que se muestran en un dispositivo (los de otro dispositivo se omiten). */
export function pasosParaDispositivo(
  dispositivo: Dispositivo,
  pasos: readonly PasoTutorial[] = PASOS_TUTORIAL,
): PasoTutorial[] {
  return pasos.filter((p) => p.solo === undefined || p.solo === dispositivo)
}

/** Texto del paso para el dispositivo dado. */
export function textoDelPaso(paso: PasoTutorial, dispositivo: Dispositivo): string {
  return typeof paso.texto === 'string' ? paso.texto : paso.texto[dispositivo]
}

/** Evento con el que otros componentes piden abrir el recorrido. */
export const EVENTO_TUTORIAL = 'clena:abrir-tutorial'

/**
 * Evento con el que el recorrido abre (`{ abierto: true }`) o cierra
 * (`{ abierto: false }`) el menú de la cabecera compacta.
 */
export const EVENTO_CABECERA_MENU = 'clena:cabecera-menu'

/** Evento que emite la intro al terminar o saltarse. */
export const EVENTO_INTRO_TERMINADA = 'clena:intro-terminada'
