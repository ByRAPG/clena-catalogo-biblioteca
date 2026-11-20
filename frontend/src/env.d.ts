/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base de la API del backend, por ejemplo http://localhost:3000/api/v1 */
  readonly VITE_API_URL?: string
  /** 'true' incluye la intro cinemática de marca en el build; apagada por defecto */
  readonly VITE_INTRO_CINEMATICA?: string
  /** 'true' (solo vista previa): `?logo=1|2|3` cambia el esquema de color del logo al vuelo */
  readonly VITE_PREVIEW_LOGOS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
