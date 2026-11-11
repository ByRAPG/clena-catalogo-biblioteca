import { createTheme } from '@mantine/core'

/**
 * Tema accesible (HU-04). Decisiones:
 * - El tamaño base del texto se define en index.css (18 px) y aquí se usan
 *   tamaños relativos, para que todo escale si la persona agranda la letra.
 * - `primaryShade` 8 en modo claro: el azul oscuro sobre blanco supera la
 *   relación de contraste 4.5:1 que exige WCAG AA para texto normal.
 * - `focusRing: 'auto'` mantiene el anillo de foco visible al navegar con
 *   teclado, requisito de la Definition of Done.
 */
export const theme = createTheme({
  primaryColor: 'blue',
  primaryShade: { light: 8, dark: 6 },
  focusRing: 'auto',
  defaultRadius: 'md',
  cursorType: 'pointer',
  fontFamily:
    'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  lineHeights: {
    xs: '1.5',
    sm: '1.5',
    md: '1.6',
    lg: '1.6',
    xl: '1.6',
  },
  headings: {
    sizes: {
      h1: { fontSize: '2rem', lineHeight: '1.3' },
      h2: { fontSize: '1.5rem', lineHeight: '1.35' },
      h3: { fontSize: '1.25rem', lineHeight: '1.4' },
    },
  },
  components: {
    Button: { defaultProps: { size: 'md' } },
    TextInput: { defaultProps: { size: 'md' } },
  },
})
