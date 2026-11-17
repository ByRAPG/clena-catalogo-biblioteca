import {
  createTheme,
  type MantineColorsTuple,
  type MantineThemeOverride,
} from '@mantine/core'

/**
 * Tema de marca de Consulta Fácil (HU-04, T-21). Decisiones:
 * - Marca: azul marino, el color del logo del CLENA (aún sin manual oficial).
 *   Se usa el tono 8 (#23234E) como color principal: blanco encima da 14,77:1.
 * - Granate (#5B113C) como segundo color de la guía visual; verde de estado
 *   para «Disponible»; naranja/amarillo para avisos; rojo para errores.
 *   Los tonos 6 a 8 de verde y rojo son lo bastante oscuros para texto sobre
 *   los tonos claros 0 y 1 (relaciones medidas en docs/guia-visual.md).
 * - Poppins se sirve desde el propio sitio (@fontsource, ver main.tsx): sin CDN.
 * - Los tamaños son relativos (rem). La base de 18 px y la «letra más grande»
 *   están en index.css y escalan todo de forma proporcional.
 * - `focusRing: 'auto'`: foco visible al navegar con teclado; el grosor de
 *   3 px se fija en index.css.
 */
const marca: MantineColorsTuple = [
  '#EEF0FA',
  '#DDE1F3',
  '#BCC3E4',
  '#98A2D3',
  '#7480C2',
  '#5562AE',
  '#3D4A98',
  '#2E3470',
  '#23234E',
  '#181838',
]

const granate: MantineColorsTuple = [
  '#FBEDF4',
  '#F4D6E5',
  '#E6AECB',
  '#D683AE',
  '#C45A93',
  '#A83776',
  '#8A2A5F',
  '#721F4D',
  '#5B113C',
  '#400B2A',
]

/** Estado «Disponible». Siempre se acompaña de texto, nunca solo color. */
const disponible: MantineColorsTuple = [
  '#E3F4E5',
  '#C8E8CC',
  '#A5D8AB',
  '#7FC587',
  '#5AAE64',
  '#3F9549',
  '#26702B',
  '#2E7D32',
  '#1B5E20',
  '#124216',
]

/** Avisos y «No disponible»: el relleno amarillo/naranja lleva texto oscuro. */
const aviso: MantineColorsTuple = [
  '#FFF3D6',
  '#FFE8AE',
  '#FFDB7F',
  '#FFD04F',
  '#FFC502',
  '#F28F22',
  '#8F4A00',
  '#7A3F00',
  '#6B3F00',
  '#4F2E00',
]

/** Errores. */
const error: MantineColorsTuple = [
  '#FDE8EA',
  '#F9CDD1',
  '#F29AA2',
  '#EA6672',
  '#E03F4D',
  '#D12636',
  '#B3261E',
  '#A31621',
  '#8E101A',
  '#6E0B13',
]

export const colores = { marca, granate, disponible, aviso, error }

const alturaControl = '2.75rem'

export const theme: MantineThemeOverride = createTheme({
  colors: colores,
  primaryColor: 'marca',
  // Con «reducir movimiento» del sistema, Mantine apaga sus transiciones.
  respectReducedMotion: true,
  primaryShade: { light: 8, dark: 4 },
  black: '#1F2433',
  white: '#FFFFFF',
  autoContrast: true,
  luminanceThreshold: 0.4,
  focusRing: 'auto',
  cursorType: 'pointer',
  fontFamily:
    'Poppins, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontFamilyMonospace:
    'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
  fontSizes: {
    xs: '0.875rem',
    sm: '0.9375rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
  },
  lineHeights: {
    xs: '1.5',
    sm: '1.5',
    md: '1.6',
    lg: '1.6',
    xl: '1.6',
  },
  defaultRadius: 'md',
  radius: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
  },
  shadows: {
    xs: '0 1px 2px rgba(24, 24, 56, 0.08)',
    sm: '0 1px 3px rgba(24, 24, 56, 0.1), 0 2px 6px rgba(24, 24, 56, 0.06)',
    md: '0 4px 12px rgba(24, 24, 56, 0.12)',
    lg: '0 8px 24px rgba(24, 24, 56, 0.14)',
    xl: '0 16px 40px rgba(24, 24, 56, 0.18)',
  },
  headings: {
    fontFamily:
      'Poppins, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontWeight: '600',
    sizes: {
      h1: { fontSize: '2rem', lineHeight: '1.3' },
      h2: { fontSize: '1.5rem', lineHeight: '1.35' },
      h3: { fontSize: '1.25rem', lineHeight: '1.4' },
      h4: { fontSize: '1.125rem', lineHeight: '1.4' },
    },
  },
  components: {
    Button: {
      defaultProps: { size: 'md', fw: 600 },
      styles: { root: { minHeight: alturaControl } },
    },
    ActionIcon: {
      styles: { root: { minHeight: alturaControl, minWidth: alturaControl } },
    },
    TextInput: {
      defaultProps: { size: 'md' },
      styles: { input: { minHeight: alturaControl }, label: { fontWeight: 600 } },
    },
    PasswordInput: {
      defaultProps: { size: 'md' },
      styles: { input: { minHeight: alturaControl }, label: { fontWeight: 600 } },
    },
    Select: {
      defaultProps: { size: 'md' },
      styles: { input: { minHeight: alturaControl }, label: { fontWeight: 600 } },
    },
    Textarea: {
      defaultProps: { size: 'md' },
      styles: { label: { fontWeight: 600 } },
    },
    Checkbox: {
      defaultProps: { size: 'md' },
      styles: { label: { fontWeight: 500 } },
    },
    Card: {
      defaultProps: { radius: 'lg', shadow: 'sm', withBorder: true },
    },
    Paper: {
      defaultProps: { radius: 'lg' },
    },
    Badge: {
      defaultProps: { size: 'lg', radius: 'sm', fw: 600 },
      styles: { root: { textTransform: 'none' } },
    },
    Alert: {
      defaultProps: { radius: 'md' },
    },
    Anchor: {
      defaultProps: { underline: 'always' },
    },
  },
})
