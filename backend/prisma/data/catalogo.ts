/**
 * Datos de la semilla. Todo es ficticio o de dominio público: obras anteriores
 * a 1930 (solo título, autor y año), tres títulos de García Márquez (solo
 * metadatos, que los criterios HU-01 y HU-02 nombran) y títulos inventados.
 * Salas, secciones y estantes son inventados. No hay contenido de obras ni
 * datos del CLENA.
 */

export interface UbicacionSemilla {
  sala: string;
  seccion: string;
  estantes: string[];
}

export const UBICACIONES: UbicacionSemilla[] = [
  {
    sala: 'Sala General',
    seccion: 'Narrativa',
    estantes: ['N-01', 'N-02', 'N-03'],
  },
  { sala: 'Sala General', seccion: 'Poesía y teatro', estantes: ['P-01'] },
  { sala: 'Sala General', seccion: 'Referencia', estantes: ['R-01'] },
  {
    sala: 'Sala Caribe',
    seccion: 'Historia del Caribe',
    estantes: ['C-01', 'C-02'],
  },
  { sala: 'Sala Caribe', seccion: 'Literatura caribeña', estantes: ['L-01'] },
  {
    sala: 'Hemeroteca',
    seccion: 'Revistas y documentos',
    estantes: ['H-01', 'H-02'],
  },
  { sala: 'Sala Infantil', seccion: 'Cuentos', estantes: ['I-01'] },
];

export interface LibroSemilla {
  titulo: string;
  autores: string[];
  temas: string[];
  categoria: string;
  anio: number;
  editorial: string;
  estante: string;
  clasificacion?: string;
  /** true: obra real (dominio público o solo metadatos); no lleva ISBN. */
  real: boolean;
}

const EDITORIAL_REAL = 'Edición de dominio público';
const EDITORIAL_META = 'Solo metadatos bibliográficos';

function real(
  titulo: string,
  autor: string,
  temas: string[],
  categoria: string,
  anio: number,
  estante: string,
  editorial = EDITORIAL_REAL,
  clasificacion?: string,
): LibroSemilla {
  return {
    titulo,
    autores: [autor],
    temas,
    categoria,
    anio,
    editorial,
    estante,
    clasificacion,
    real: true,
  };
}

function ficticio(
  titulo: string,
  autores: string[],
  temas: string[],
  categoria: string,
  anio: number,
  estante: string,
  clasificacion?: string,
): LibroSemilla {
  return {
    titulo,
    autores,
    temas,
    categoria,
    anio,
    editorial: 'Editorial Ejemplo',
    estante,
    clasificacion,
    real: false,
  };
}

const ROMANTICA = 'Novela romántica';
const AVENTURAS = 'Novela de aventuras';
const REALISTA = 'Novela realista';
const GOTICA = 'Novela gótica';
const CARIBE = 'Historia del Caribe';
const FIC_CARIBE = 'Ficción caribeña';
const COLOMBIANA = 'Literatura colombiana';
const PERIODICAS = 'Publicaciones periódicas';
const INFANTILES = 'Cuentos infantiles';
const REFERENCIA = 'Referencia';
const BIBLIOTECO = 'Bibliotecología';

export const LIBROS: LibroSemilla[] = [
  // Obras de dominio público (anteriores a 1930)
  real(
    'María',
    'Jorge Isaacs',
    [ROMANTICA, COLOMBIANA],
    'Literatura',
    1867,
    'L-01',
    EDITORIAL_REAL,
    '863',
  ),
  real(
    'Don Quijote de la Mancha',
    'Miguel de Cervantes Saavedra',
    ['Novela de caballerías', 'Literatura española'],
    'Literatura',
    1605,
    'N-01',
    EDITORIAL_REAL,
    '863',
  ),
  real(
    'La vorágine',
    'José Eustasio Rivera',
    ['Novela de la selva', COLOMBIANA],
    'Literatura',
    1924,
    'L-01',
    EDITORIAL_REAL,
    '863',
  ),
  real(
    'Los miserables',
    'Victor Hugo',
    ['Novela histórica', 'Literatura francesa'],
    'Literatura',
    1862,
    'N-01',
  ),
  real(
    'Orgullo y prejuicio',
    'Jane Austen',
    [ROMANTICA, 'Literatura inglesa'],
    'Literatura',
    1813,
    'N-02',
  ),
  real(
    'Crimen y castigo',
    'Fiódor Dostoievski',
    ['Novela psicológica', 'Literatura rusa'],
    'Literatura',
    1866,
    'N-02',
  ),
  real(
    'Frankenstein',
    'Mary Shelley',
    [GOTICA, 'Literatura inglesa'],
    'Literatura',
    1818,
    'N-02',
  ),
  real(
    'Drácula',
    'Bram Stoker',
    [GOTICA, 'Literatura inglesa'],
    'Literatura',
    1897,
    'N-02',
  ),
  real(
    'Moby Dick',
    'Herman Melville',
    [AVENTURAS, 'Literatura estadounidense'],
    'Literatura',
    1851,
    'N-03',
  ),
  real(
    'Madame Bovary',
    'Gustave Flaubert',
    [REALISTA, 'Literatura francesa'],
    'Literatura',
    1857,
    'N-03',
  ),
  real(
    'El conde de Montecristo',
    'Alexandre Dumas',
    [AVENTURAS, 'Literatura francesa'],
    'Literatura',
    1844,
    'N-03',
  ),
  real(
    'Los tres mosqueteros',
    'Alexandre Dumas',
    [AVENTURAS, 'Literatura francesa'],
    'Literatura',
    1844,
    'N-03',
  ),
  real(
    'Veinte mil leguas de viaje submarino',
    'Julio Verne',
    [AVENTURAS, 'Ciencia ficción'],
    'Literatura',
    1870,
    'N-03',
  ),
  real(
    'La isla del tesoro',
    'Robert Louis Stevenson',
    [AVENTURAS, 'Piratas'],
    'Infantil',
    1883,
    'I-01',
  ),
  real(
    'Fortunata y Jacinta',
    'Benito Pérez Galdós',
    [REALISTA, 'Literatura española'],
    'Literatura',
    1887,
    'N-01',
  ),
  real(
    'La Regenta',
    'Leopoldo Alas Clarín',
    [REALISTA, 'Literatura española'],
    'Literatura',
    1885,
    'N-01',
  ),
  real(
    'Pepita Jiménez',
    'Juan Valera',
    [ROMANTICA, 'Literatura española'],
    'Literatura',
    1874,
    'N-01',
  ),
  real(
    'El Periquillo Sarniento',
    'José Joaquín Fernández de Lizardi',
    ['Novela picaresca', 'Literatura mexicana'],
    'Literatura',
    1816,
    'N-01',
  ),
  real(
    'Martín Fierro',
    'José Hernández',
    ['Poesía gauchesca', 'Literatura argentina'],
    'Poesía',
    1872,
    'P-01',
  ),
  real(
    'Rimas',
    'Gustavo Adolfo Bécquer',
    ['Poesía romántica', 'Literatura española'],
    'Poesía',
    1871,
    'P-01',
  ),
  real(
    'Azul',
    'Rubén Darío',
    ['Modernismo', 'Literatura nicaragüense'],
    'Poesía',
    1888,
    'P-01',
  ),
  real(
    'Cantos de vida y esperanza',
    'Rubén Darío',
    ['Modernismo', 'Literatura nicaragüense'],
    'Poesía',
    1905,
    'P-01',
  ),
  real(
    'Platero y yo',
    'Juan Ramón Jiménez',
    ['Prosa poética', 'Literatura española'],
    'Infantil',
    1914,
    'I-01',
  ),
  real(
    'Hamlet',
    'William Shakespeare',
    ['Teatro', 'Literatura inglesa'],
    'Poesía',
    1603,
    'P-01',
  ),
  real(
    'Facundo',
    'Domingo Faustino Sarmiento',
    ['Ensayo histórico', 'Historia de América'],
    'Historia',
    1845,
    'C-02',
  ),
  real(
    'Brevísima relación de la destrucción de las Indias',
    'Bartolomé de las Casas',
    [CARIBE, 'Conquista de América'],
    'Historia',
    1552,
    'C-01',
  ),
  real(
    'Piratas de la América',
    'Alexandre Olivier Exquemelin',
    [CARIBE, 'Piratas'],
    'Historia',
    1678,
    'C-01',
  ),

  // Solo metadatos bibliográficos (los nombran HU-01 y HU-02)
  real(
    'Cien años de soledad',
    'Gabriel García Márquez',
    ['Realismo mágico', COLOMBIANA, CARIBE],
    'Literatura',
    1967,
    'L-01',
    EDITORIAL_META,
    '863',
  ),
  real(
    'El coronel no tiene quien le escriba',
    'Gabriel García Márquez',
    ['Novela corta', COLOMBIANA],
    'Literatura',
    1961,
    'L-01',
    EDITORIAL_META,
    '863',
  ),
  real(
    'Crónica de una muerte anunciada',
    'Gabriel García Márquez',
    ['Novela corta', COLOMBIANA],
    'Literatura',
    1981,
    'L-01',
    EDITORIAL_META,
    '863',
  ),

  // Títulos inventados
  ficticio(
    'El faro de las mareas perdidas',
    ['Elena Marquesina Duarte'],
    ['Novela marina', FIC_CARIBE],
    'Literatura',
    2018,
    'N-01',
  ),
  ficticio(
    'Cuaderno de bitácora del Caribe imaginario',
    ['Tomás Arrecife Soler'],
    [CARIBE, 'Cartografía'],
    'Historia',
    2020,
    'C-01',
    '972.9',
  ),
  ficticio(
    'Puertos y corsarios de papel',
    ['Inés Corales Vega'],
    [CARIBE, 'Piratas'],
    'Historia',
    2016,
    'C-01',
    '972.9',
  ),
  ficticio(
    'Atlas inventado de las islas del viento',
    ['Tomás Arrecife Soler', 'Inés Corales Vega'],
    [CARIBE, 'Cartografía'],
    'Historia',
    2022,
    'C-02',
    '912',
  ),
  ficticio(
    'Crónicas de un muelle sin nombre',
    ['Rodrigo Palmera Ortiz'],
    [CARIBE, 'Crónica'],
    'Historia',
    2012,
    'C-02',
  ),
  ficticio(
    'La ciudad de las murallas de cartón',
    ['Rodrigo Palmera Ortiz'],
    ['Novela histórica', FIC_CARIBE],
    'Literatura',
    2015,
    'L-01',
  ),
  ficticio(
    'Memorias de una cocinera imaginaria',
    ['Marina Ceiba Londoño'],
    ['Novela', FIC_CARIBE],
    'Literatura',
    2009,
    'L-01',
  ),
  ficticio(
    'El viento que no leía mapas',
    ['Marina Ceiba Londoño'],
    ['Novela', FIC_CARIBE],
    'Literatura',
    2013,
    'N-01',
  ),
  ficticio(
    'Versos para un puerto de mentira',
    ['Lucía Almendro Paz'],
    ['Poesía contemporánea'],
    'Poesía',
    2017,
    'P-01',
  ),
  ficticio(
    'Sonetos de la marea baja',
    ['Lucía Almendro Paz'],
    ['Poesía contemporánea'],
    'Poesía',
    2021,
    'P-01',
  ),
  ficticio(
    'Manual ficticio de catalogación',
    ['Autor de Prueba'],
    [REFERENCIA, BIBLIOTECO],
    'Referencia',
    2023,
    'R-01',
    '025.3',
  ),
  ficticio(
    'Diccionario de términos imaginarios',
    ['Autor de Prueba'],
    [REFERENCIA],
    'Referencia',
    2019,
    'R-01',
    '413',
  ),
  ficticio(
    'Guía de la sala que nadie visita',
    ['Autor de Prueba'],
    [REFERENCIA, BIBLIOTECO],
    'Referencia',
    2024,
    'R-01',
  ),
  ficticio(
    'Boletín de la biblioteca imaginaria, n.º 1',
    ['Comité Editorial Ficticio'],
    [PERIODICAS],
    'Referencia',
    2020,
    'H-01',
  ),
  ficticio(
    'Boletín de la biblioteca imaginaria, n.º 2',
    ['Comité Editorial Ficticio'],
    [PERIODICAS],
    'Referencia',
    2021,
    'H-01',
  ),
  ficticio(
    'Revista Brújula del Sur, volumen 1',
    ['Comité Editorial Ficticio'],
    [PERIODICAS, CARIBE],
    'Historia',
    2018,
    'H-02',
  ),
  ficticio(
    'Documentos de un archivo que no existe',
    ['Tomás Arrecife Soler'],
    [CARIBE, 'Archivística'],
    'Historia',
    2014,
    'H-02',
  ),
  ficticio(
    'El cangrejo que quería ser faro',
    ['Pilar Caracola Ruiz'],
    [INFANTILES],
    'Infantil',
    2020,
    'I-01',
  ),
  ficticio(
    'La tortuga y el mapa del tesoro',
    ['Pilar Caracola Ruiz'],
    [INFANTILES, 'Piratas'],
    'Infantil',
    2022,
    'I-01',
  ),
  ficticio(
    'Abecedario de las olas',
    ['Pilar Caracola Ruiz'],
    [INFANTILES],
    'Infantil',
    2011,
    'I-01',
  ),
  ficticio(
    'Leyendas de la bahía de papel',
    ['Pilar Caracola Ruiz', 'Lucía Almendro Paz'],
    ['Leyendas', FIC_CARIBE],
    'Infantil',
    2015,
    'I-01',
  ),
  ficticio(
    'Introducción a la fotosíntesis de las algas ficticias',
    ['Alba Plancton Rey'],
    ['Ciencias naturales'],
    'Ciencia',
    2016,
    'R-01',
  ),
  ficticio(
    'Corrientes y vientos de un mar inventado',
    ['Alba Plancton Rey'],
    ['Ciencias naturales', 'Geografía'],
    'Ciencia',
    2019,
    'R-01',
  ),
  ficticio(
    'Geografía de un archipiélago que no está en los mapas',
    ['Tomás Arrecife Soler'],
    ['Geografía', CARIBE],
    'Geografía',
    2010,
    'C-02',
  ),
  ficticio(
    'Cuentos del malecón de cartón',
    ['Rodrigo Palmera Ortiz'],
    ['Cuento', FIC_CARIBE],
    'Literatura',
    2008,
    'N-02',
  ),
  ficticio(
    'Tres noches en la isla del reloj',
    ['Elena Marquesina Duarte'],
    ['Novela', FIC_CARIBE],
    'Literatura',
    2021,
    'N-03',
  ),
  ficticio(
    'El archivista distraído',
    ['Elena Marquesina Duarte'],
    ['Novela', 'Humor'],
    'Literatura',
    2023,
    'N-02',
  ),
  ficticio(
    'Mercado de las doce islas',
    ['Marina Ceiba Londoño'],
    ['Novela', FIC_CARIBE],
    'Literatura',
    2014,
    'N-03',
  ),
  ficticio(
    'Diario de un farero sin faro',
    ['Rodrigo Palmera Ortiz'],
    [CARIBE, 'Crónica'],
    'Historia',
    2017,
    'C-02',
  ),
  ficticio(
    'Rondas del puerto de papel',
    ['Lucía Almendro Paz'],
    ['Poesía contemporánea', FIC_CARIBE],
    'Poesía',
    2019,
    'P-01',
  ),
];

/** ISBN-13 ficticio con dígito de control válido (prefijo 978-999 + consecutivo). */
export function isbnFicticio(consecutivo: number): string {
  const base = `978999${String(consecutivo).padStart(6, '0')}`;
  const suma = [...base].reduce(
    (acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 1 : 3),
    0,
  );
  return `${base}${(10 - (suma % 10)) % 10}`;
}
