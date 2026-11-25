/** Límites operativos y de seguridad para la importación CSV (T-36 / H-06). */
export const CSV_IMPORT_LIMITS = Object.freeze({
  maxBytes: 1_000_000,
  maxRows: 5_000,
  maxListItems: 20,
  maxLengths: Object.freeze({
    title: 300,
    author: 150,
    subject: 150,
    isbn: 32,
    classification: 64,
    publisher: 150,
    category: 150,
    room: 150,
    section: 150,
    shelf: 64,
    inventoryCode: 64,
    digitalUrl: 500,
  }),
});
