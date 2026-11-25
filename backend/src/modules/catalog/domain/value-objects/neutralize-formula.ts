const FORMULA_PREFIX = /^[=+\-@]/;

/**
 * Neutraliza celdas que comienzan con =, +, - o @ anteponiendo una comilla
 * simple (recomendación OWASP contra inyección de fórmulas en CSV/hojas de
 * cálculo). La operación es idempotente: una celda ya neutralizada empieza
 * con «'» y no se vuelve a prefijar.
 */
export function neutralizeFormula(raw: string): string {
  const trimmed = raw.trim();
  if (FORMULA_PREFIX.test(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
}

export function neutralizeOptionalFormula(
  raw: string | undefined,
): string | undefined {
  if (raw === undefined) {
    return undefined;
  }
  const neutralized = neutralizeFormula(raw);
  return neutralized || undefined;
}
