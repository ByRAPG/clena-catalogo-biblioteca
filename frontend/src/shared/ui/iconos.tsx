import type { ReactNode, SVGProps } from 'react'

/**
 * Iconos de línea propios (sin dependencias). Todos son decorativos: el texto
 * que los acompaña dice lo mismo, así que van ocultos para lectores de pantalla.
 */
function Base({
  children,
  size = 24,
  ...resto
}: { children: ReactNode; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...resto}
    >
      {children}
    </svg>
  )
}

type Props = { size?: number } & SVGProps<SVGSVGElement>

export const IconoLibroNuevo = (p: Props) => (
  <Base {...p}>
    <path d="M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
    <path d="M5 17a3 3 0 0 1 3-3h9" />
    <path d="M11 7.5v4M9 9.5h4" />
  </Base>
)

export const IconoSubir = (p: Props) => (
  <Base {...p}>
    <path d="M12 16V5M8 9l4-4 4 4" />
    <path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
  </Base>
)

export const IconoQr = (p: Props) => (
  <Base {...p}>
    <rect x="4" y="4" width="6" height="6" rx="1" />
    <rect x="14" y="4" width="6" height="6" rx="1" />
    <rect x="4" y="14" width="6" height="6" rx="1" />
    <path d="M14 14h2v2h-2zM18 14h2M14 19h2M18 18v2h2" />
  </Base>
)

export const IconoLupa = (p: Props) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="6" />
    <path d="m20 20-4.2-4.2" />
  </Base>
)

export const IconoAyuda = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .9-1 1.7M12 17h.01" />
  </Base>
)

export const IconoCheck = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.5 2.5 2.5 4.5-5" />
  </Base>
)

export const IconoSala = (p: Props) => (
  <Base {...p}>
    <path d="M12 21s-6-5.2-6-10a6 6 0 0 1 12 0c0 4.8-6 10-6 10z" />
    <circle cx="12" cy="11" r="2.2" />
  </Base>
)

export const IconoEtiqueta = (p: Props) => (
  <Base {...p}>
    <path d="M4 12V5a1 1 0 0 1 1-1h7l8 8-8 8z" />
    <circle cx="8.5" cy="8.5" r="1.2" />
  </Base>
)

export const IconoCatalogo = (p: Props) => (
  <Base {...p}>
    <path d="M4 5h4v14H4zM10 5h4v14h-4z" />
    <path d="m16.5 6.5 3.4 1-3.2 11.5-3.4-1z" />
  </Base>
)

export const IconoCandado = (p: Props) => (
  <Base {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Base>
)

export const IconoAlerta = (p: Props) => (
  <Base {...p}>
    <path d="M12 4 3 19h18z" />
    <path d="M12 10v4M12 17h.01" />
  </Base>
)

export const IconoDescargar = (p: Props) => (
  <Base {...p}>
    <path d="M12 4v11M8 11l4 4 4-4" />
    <path d="M5 19h14" />
  </Base>
)

export const IconoArchivo = (p: Props) => (
  <Base {...p}>
    <path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M14 3v5h5M9 13h6M9 17h6" />
  </Base>
)

export const IconoMenu = (p: Props) => (
  <Base {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Base>
)

export const IconoUsuario = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </Base>
)

export const IconoMicrofono = (p: Props) => (
  <Base {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </Base>
)
