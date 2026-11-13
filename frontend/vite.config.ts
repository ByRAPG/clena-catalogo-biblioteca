import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/ y https://vitest.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    test: {
      // jsdom da un DOM a las pruebas: así se comprueban los redireccionamientos
      // del guard y, más adelante, la interacción con el campo de búsqueda.
      environment: 'jsdom',
      setupFiles: ['./src/setup-pruebas.ts'],
      css: false,
      restoreMocks: true,
    },
    server: {
      host: true,
      port: 5173,
      allowedHosts: env.VITE_ALLOWED_HOST ? [env.VITE_ALLOWED_HOST] : [],
    },
  }
})