/**
 * Normaliza texto para búsqueda y unicidad: minúsculas, sin tildes ni
 * diacríticos y con espacios colapsados. Usa NFKD (como unaccent, p. ej. «º» pasa a «o»). Debe coincidir con la función SQL
 * `normalize_text()` de la migración del modelo de datos.
 */
export function normalizeText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
