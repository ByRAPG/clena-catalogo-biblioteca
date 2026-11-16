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
      // Cobertura: se mide el código de la aplicación (src/).
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          // Pruebas y preparación del entorno de pruebas: no son código de la aplicación.
          'src/**/*.test.{ts,tsx}',
          'src/setup-pruebas.ts',
          // Puntos de entrada: solo montan la aplicación en el DOM.
          'src/main.tsx',
          'src/App.tsx',
          // Declaraciones de tipos: sin código ejecutable.
          'src/**/*.d.ts',
        ],
        reporter: ['text', 'text-summary', 'lcov'],
        // Medido el 16 nov 2026 (sin entradas ni pruebas): ~91 % sentencias, ~81 % ramas,
        // ~92 % funciones, ~93 % líneas. Umbral = lo medido redondeado hacia
        // abajo a múltiplos de 5 daría 90/80; se deja un margen de 10 puntos
        // para que una pantalla nueva no bloquee el CI por unas pocas líneas.
        // Si baja de aquí, `vitest run --coverage` falla.
        thresholds: { lines: 80, statements: 80, functions: 80, branches: 70 },
      },
    },
    server: {
      host: true,
      port: 5173,
      allowedHosts: env.VITE_ALLOWED_HOST ? [env.VITE_ALLOWED_HOST] : [],
    },
  }
})