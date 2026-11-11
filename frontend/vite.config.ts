import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/ y https://vitest.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // jsdom da un DOM a las pruebas: así se comprueban los redireccionamientos
    // del guard y, más adelante, la interacción con el campo de búsqueda.
    environment: 'jsdom',
    setupFiles: ['./src/setup-pruebas.ts'],
    css: false,
    restoreMocks: true,
  },
})
