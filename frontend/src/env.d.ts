/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base de la API del backend, por ejemplo http://localhost:3000/api/v1; en producción es /api/v1 (mismo origen) */
  readonly VITE_API_URL?: string
  /** 'true' incluye la intro cinemática de marca en el build; apagada por defecto */
  readonly VITE_INTRO_CINEMATICA?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
