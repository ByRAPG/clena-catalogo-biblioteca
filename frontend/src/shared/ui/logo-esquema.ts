import { ESQUEMA_LOGO } from './logo-concepto'

/** Fija `data-logo` en <html> (lo leen las variables de `logo.css`). */
export function aplicarEsquemaLogo(): void {
  document.documentElement.dataset.logo = String(ESQUEMA_LOGO)
}
